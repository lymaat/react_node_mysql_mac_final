
const db = require("../util/db")
const { isEmptyOrNull, invoiceNumber } = require("../util/service")
const getParam = (value) => {
    if(value == "" || value == "null" || value == "undefined"){
        return null
    }
    return value
}

// const getAll =  async (req,res) => {
//     const list = await db.query("SELECT * FROM `order`;")
//     res.json({
//         list  : list,
//     })
// }
const getAll =  async (req,res) => {
    try{
        const {page,txtSearch,status} = req.query
        
        var param = [getParam(status)]
        var limitItem = 100 
        var offset = (page - 1) * limitItem 
        
        var select = " SELECT o.* , os.name as order_status_name , pm.name as payement_methode_name , ca.address_des as customer_addesss_des, p.name, p.product_id, p.price, od.quantity, p.description ";
        var join = " FROM `order` o " +
            " INNER JOIN order_status os ON (o.order_status_id = os.order_status_id) " +
            " INNER JOIN payement_methode pm ON (o.payement_methode_id = pm.payement_methode_id) "+
            " INNER JOIN customer_address ca ON (o.customer_id = ca.customer_id) " +
            " INNER JOIN order_detail od ON (o.order_id = od.order_id) " +
            " INNER JOIN product p ON (od.product_id = p.product_id) "
        
        var where = " WHERE o.order_status_id = IFNULL(?, o.order_status_id) "
        if (!isEmptyOrNull(txtSearch)){
            where += " AND o.tel = ? OR o.invoice_no LIKE ? OR o.firstname LIKE ? OR o.lastname LIKE ? "; // Use parentheses to group conditions
            param.push(txtSearch)
            param.push("%"+txtSearch+"%")
            param.push("%"+txtSearch+"%")
            param.push("%"+txtSearch+"%")

        }
        var order = " ORDER BY o.invoice_no DESC "
        var limit = " LIMIT "+limitItem+" OFFSET "+offset+""

        var sql = select + join + where + order + limit;
        const list = await db.query(sql,param)
        

        var sqlOrderStatus = " SELECT * FROM order_status "
        const order_status = await db.query(sqlOrderStatus)

        var sqlpaymentmethode = "SELECT * FROM payement_methode "
        const payment_methode = await db.query(sqlpaymentmethode)
        
        var sqlCustomeraddress = "SELECT * FROM customer_address "
        const customer_address = await db.query(sqlCustomeraddress)
        
        var sqlOrder_detail = "SELECT * FROM order_detail"
        const Order_detail = await db.query(sqlOrder_detail)
        
        var sqlProduct = "SELECT * FROM product"
        const Product = await db.query(sqlProduct)

        res.json({
            list: list,
            listpaymentmethode : payment_methode,
            listcustomer_address : customer_address,
            listOrder_detail : Order_detail,
            listProduct : Product,
            //  {
            //     tatalQty : totalRecord[0].tatalQty,
            //     total : totalRecord[0].total
            // },
            orderStatus: order_status,
            bodyData: req.body,
            queryData: req.query,
        })
        
    }catch (e){
        console.log(e)
        res.status(500).send({
            message: 'Internal Error!',
            error: e
        });
    }
    // const list = await db.query("SELECT * FROM `order`;")
    // res.json({
    //     list  : list,
    // })
}
const generateInvoiceNo = async () => {
    const data = await db.query(" SELECT MAX( order_id ) as id FROM `order`; ");
    return invoiceNumber(data[0].id) //null 1 , 2, 3 
}
const getOne = async (req,res) => {
    const list = await db.query("SELECT * FROM order WHERE order_id = ?",[req.params.id])
    res.json({
        list  : list
    })
}

const getOderByCustomer = async (req,res) => {
    const {customer_id} = req.query;
    var sql = " SELECT o.* , os.name as order_status_name , pm.name as payement_methode_name , ca.address_des as customer_addesss_des, p.name, p.product_id, p.price, od.quantity ";
        sql += " FROM `order` o " +
        " INNER JOIN order_status os ON (o.order_status_id = os.order_status_id) " +
        " INNER JOIN payement_methode pm ON (o.payement_methode_id = pm.payement_methode_id) "+
        " INNER JOIN customer_address ca ON (o.customer_id = ca.customer_id) " +
        " INNER JOIN order_detail od ON (o.order_id = od.order_id) " +
        " INNER JOIN product p ON (od.product_id = p.product_id) "
        sql += " WHERE o.customer_id = ?"
    const list = await db.query(sql,[customer_id])
    res.json({
        listByCustomer:list,
        bodyData: req.body,
        queryData: req.query
    })
}
const create = async (req, res) => {
    try {
        await db.beginTransaction(); // Add await here

        // Order
        const {
            customer_id, customer_address_id, payement_methode_id, comment,
        } = req.body;
        var image = null;
        if (req.file) {
            image = req.file.filename;
        }
        var message = {};
        if (isEmptyOrNull(customer_id)) {
            message.customer_id = "customer_id required!";
        }
        if (isEmptyOrNull(payement_methode_id)) {
            message.payement_methode_id = "payement_methode_id required!";
        }
        if (isEmptyOrNull(customer_address_id)) {
            message.customer_address_id = "customer_address_id required!";
        }
        if (Object.keys(message).length > 0) {
            res.json({
                message: message,
                error: true,
            });
            return 0;
        }

        // Find customer_address_info by address_id (from the client)
        var address = await db.query("SELECT * FROM customer_address WHERE customer_address_id = ?", [customer_address_id]);

        if (address?.length > 0) {
            const { firstname, lastname, tel, address_des } = address[0];

            // Find total_order => need to getCartInfo by customer
            var product = await db.query("SELECT c.*, p.price FROM cart c  INNER JOIN product p ON (c.product_id = p.product_id)  WHERE c.customer_id = ?", [customer_id]);
            if (product.length > 0) {
                // Find the total amount based on the cart by the customer
                var order_total = 0;

                // Add a check for negative quantity and insufficient quantity
                for (const item of product) {
                    if (item.quantity <= 0) {
                        res.json({
                            message: "Quantity must be greater than 0.",
                            error: true,
                        });
                        return;
                    }

                    // Check if the ordered quantity is greater than the available quantity
                    const productInfo = await db.query("SELECT quantity FROM product WHERE product_id = ?", [item.product_id]);

                    if (!productInfo || productInfo.length === 0) {
                        res.json({
                            message: "Product not found.",
                            error: true,
                        });
                        return;
                    }

                    const availableQuantity = productInfo[0].quantity;

                    if (item.quantity > availableQuantity) {
                        res.json({
                            message: "Not enough quantity available for the product with ID " + item.product_id,
                            error: true,
                        });
                        return;
                    }

                    order_total += item.quantity * item.price;
                }

                // Insert data into the order table
                var order_status_id = 1; // Pending
                var inv_no = await generateInvoiceNo();
                var sqlOrder = "INSERT INTO `order`" +
                    " (customer_id, payement_methode_id, order_status_id, invoice_no, comment, order_total, firstname, lastname, tel, address_des, image) VALUES " +
                    " (?,?,?,?,?,?,?,?,?,?,?)";
                var sqlOrderParam = [customer_id, payement_methode_id, order_status_id, inv_no, comment, order_total, firstname, lastname, tel, address_des, image];
                const order = await db.query(sqlOrder, sqlOrderParam);

                // Insert order_detail
                for (const item of product) {
                    var sqlOorderDetails = "INSERT INTO order_detail (order_id, product_id, quantity, price) VALUES (?,?,?,?)";
                    var sqlOorderDetailsParam = [order.insertId, item.product_id, item.quantity, item.price];
                    const orderDetail = await db.query(sqlOorderDetails, sqlOorderDetailsParam);

                    // Cut stock from the product table
                    var sqlProduct = "UPDATE product SET quantity=(quantity-?) WHERE product_id = ?";
                    var updateProduct = await db.query(sqlProduct, [item.quantity, item.product_id]);
                }

                // Clear the cart by customer
                await db.query("DELETE FROM cart WHERE customer_id = ?", [customer_id]);

                res.json({
                    message: "Your order has been successful!",
                    data: order,
                });

                await db.commit(); // Commit the transaction here
            } else {
                res.json({
                    message: "Your cart is empty!",
                    error: true,
                });
            }
        } else {
            res.json({
                error: true,
                message: "Please choose your address!",
            });
        }
    } catch (e) {
        await db.rollback(); // Rollback the transaction in case of an error
        res.json({
            message: e,
            error: true,
        });
    }
}

// const create = async (req, res) => {
//     try {
//         await db.beginTransaction(); // Add await here

//         // Order
//         const {
//             customer_id, customer_address_id, payement_methode_id, comment,
//         } = req.body;
//         var image = null
//         if (req.file) {
//             image = req.file.filename
//         }
//         var message = {}
//         if (isEmptyOrNull(customer_id)) { message.customer_id = "customer_id required!" }
//         if (isEmptyOrNull(payement_methode_id)) { message.payement_methode_id = "payement_methode_id required!" }
//         if (isEmptyOrNull(customer_address_id)) { message.customer_address_id = "customer_address_id required!" }
//         if (Object.keys(message).length > 0) {
//             res.json({
//                 message: message,
//                 error: true
//             });
//             return 0;
//         }

//         // Find customer_address_info by address_id (from the client)
//         var address = await db.query("SELECT * FROM customer_address WHERE customer_address_id = ?", [customer_address_id]);

//         if (address?.length > 0) {

//             const { firstname, lastname, tel, address_des } = address[0];

//             // Find total_order => need to getCartInfo by customer
//             var product = await db.query("SELECT c.*, p.price FROM cart c  INNER JOIN product p ON (c.product_id = p.product_id)  WHERE c.customer_id = ?", [customer_id]);
//             if (product.length > 0) {
//                 // Find the total amount based on the cart by the customer
//                 var order_total = 0;

//                 // Add a check for negative quantity
//                 for (const item of product) {
//                     if (item.quantity <= 0) {
//                         res.json({
//                             message: "Quantity must be greater than 0.",
//                             error: true
//                         });
//                         return;
//                     }
//                     order_total += item.quantity * item.price;
//                 }

//                 // Insert data into the order table
//                 var order_status_id = 1; // Pending
//                 var inv_no = await generateInvoiceNo();
//                 var sqlOrder = "INSERT INTO `order`" +
//                     " (customer_id, payement_methode_id, order_status_id, invoice_no, comment, order_total, firstname, lastname, tel, address_des, image) VALUES " +
//                     " (?,?,?,?,?,?,?,?,?,?,?)";
//                 var sqlOrderParam = [customer_id, payement_methode_id, order_status_id, inv_no, comment, order_total, firstname, lastname, tel, address_des, image];
//                 const order = await db.query(sqlOrder, sqlOrderParam);

//                 // Insert order_detail
//                 for (const item of product) {
//                     var sqlOorderDetails = "INSERT INTO order_detail (order_id, product_id, quantity, price) VALUES (?,?,?,?)";
//                     var sqlOorderDetailsParam = [order.insertId, item.product_id, item.quantity, item.price];
//                     const orderDetail = await db.query(sqlOorderDetails, sqlOorderDetailsParam);

//                     // Cut stock from the product table
//                     var sqlProduct = "UPDATE product SET quantity=(quantity-?) WHERE product_id = ?";
//                     var updateProduct = await db.query(sqlProduct, [item.quantity, item.product_id]);
//                 }

//                 // Clear the cart by customer
//                 await db.query("DELETE FROM cart WHERE customer_id = ?", [customer_id]);

//                 res.json({
//                     message: "Your order has been successful!",
//                     data: order
//                 });

//                 await db.commit(); // Commit the transaction here
//             } else {
//                 res.json({
//                     message: "Your cart is empty!",
//                     error: true
//                 });
//             }
//         } else {
//             res.json({
//                 error: true,
//                 message: "Please choose your address!"
//             });
//         }

//     } catch (e) {
//         await db.rollback(); // Rollback the transaction in case of an error
//         res.json({
//             message: e,
//             error: true
//         });
//     }
// }


// const create = async (req, res) => {
//     try {
//         await db.beginTransaction(); // Add await here

//         // Order
//         const {
//             customer_id, customer_address_id, payement_methode_id, comment,
//         } = req.body;
//         var image = null
//         if(req.file){
//             image = req.file.filename
//         }
//         var message = {}
//         if (isEmptyOrNull(customer_id)) { message.customer_id = "customer_id required!" }
//         if (isEmptyOrNull(payement_methode_id)) { message.payement_methode_id = "payement_methode_id required!" }
//         if (isEmptyOrNull(customer_address_id)) { message.customer_address_id = "customer_address_id required!" }
//         if (Object.keys(message).length > 0) {
//             res.json({
//                 message: message,
//                 error: true
//             });
//             return 0;
//         }

//         // Find customer_address_info by address_id (from the client)
//         var address = await db.query("SELECT * FROM customer_address WHERE customer_address_id = ?", [customer_address_id]);

//         if (address?.length > 0) {

//             const { firstname, lastname, tel, address_des } = address[0];

//             // Find total_order => need to getCartInfo by customer
//             var product = await db.query("SELECT c.*, p.price FROM cart c  INNER JOIN product p ON (c.product_id = p.product_id)  WHERE c.customer_id = ?", [customer_id]);
//             if (product.length > 0) {
//                 // Find the total amount based on the cart by the customer
//                 var order_total = 0;
//                 product.map((item, index) => {
//                     order_total += item.quantity * item.price;
//                 });
//                 // Insert data into the order table
//                 var order_status_id = 1; // Pending
//                 var inv_no = await generateInvoiceNo();
//                 var sqlOrder = "INSERT INTO `order`" +
//                     " (customer_id, payement_methode_id, order_status_id, invoice_no, comment, order_total, firstname, lastname, tel, address_des, image) VALUES " +
//                     " (?,?,?,?,?,?,?,?,?,?,?)";
//                 var sqlOrderParam = [customer_id, payement_methode_id, order_status_id, inv_no, comment, order_total, firstname, lastname, tel, address_des, image];
//                 const order = await db.query(sqlOrder, sqlOrderParam);

//                 // Insert order_detail
//                 for (const item of product) {
//                     var sqlOorderDetails = "INSERT INTO order_detail (order_id, product_id, quantity, price) VALUES (?,?,?,?)";
//                     var sqlOorderDetailsParam = [order.insertId, item.product_id, item.quantity, item.price];
//                     const orderDetail = await db.query(sqlOorderDetails, sqlOorderDetailsParam);

//                     // Cut stock from the product table
//                     var sqlProduct = "UPDATE product SET quantity=(quantity-?) WHERE product_id = ?";
//                     var updateProduct = await db.query(sqlProduct, [item.quantity, item.product_id]);
//                 }

//                 // Clear the cart by customer
//                 await db.query("DELETE FROM cart WHERE customer_id = ?", [customer_id]);

//                 res.json({
//                     message: "Your order has been successful!",
//                     data: order
//                 });

//                 await db.commit(); // Commit the transaction here
//             } else {
//                 res.json({
//                     message: "Your cart is empty!",
//                     error: true
//                 });
//             }
//         } else {
//             res.json({
//                 error: true,
//                 message: "Please choose your address!"
//             });
//         }

//     } catch (e) {
//         await db.rollback(); // Rollback the transaction in case of an error
//         res.json({
//             message: e,
//             error: true
//         });
//     }
// }

// const create = async (req,res) => {
//     try{
//         db.beginTransaction()
//         // order 
//         const {
//             customer_id,customer_address_id,payement_methode_id,comment,
//         } = req.body;

//         var message = {}
//         if(isEmptyOrNull(customer_id)){message.customer_id = "customer_id required!"}
//         if(isEmptyOrNull(payement_methode_id)){message.payement_methode_id = "payement_methode_id required!"}
//         if(isEmptyOrNull(customer_address_id)){message.customer_address_id = "customer_address_id required!"}
//         if(Object.keys(message).length> 0){
//             res.json({
//                 message:message,
//                 error:true
//             })
//             return 0;
//         }
//         // find customer_address_info by address_id(from client)
//         var address = await db.query("SELECT * FROM customer_address WHERE customer_address_id = ?",[customer_address_id])

//         if(address?.length > 0){
           
//             const {firstname,lastname,tel,address_des} = address[0]
           
//             // find total_order => need getCartInfo by customer
//             var product = await db.query("SELECT c.*, p.price FROM cart c  INNER JOIN product p ON (c.product_id = p.product_id)  WHERE c.customer_id = ?",[customer_id]);
//             if(product.length > 0){
//                 // find total amont base from cart by customer
//                 var order_total = 0;
//                 product.map((item,index)=>{
//                     order_total += (item.quantity * item.price)
//                 })
//                 // insert data to table order
//                 var order_status_id = 1 // Pendding
//                 var inv_no = await generateInvoiceNo();
//                 var sqlOrder = "INSERT INTO `order`"+
//                 " (customer_id, payement_methode_id, order_status_id , invoice_no, comment, order_total, firstname, lastname, telelphone, address_des) VALUES "+
//                 " (?,?,?,?,?,?,?,?,?,?)";
//                 var sqlOrderParam = [customer_id,payement_methode_id,order_status_id,inv_no,comment,order_total,firstname,lastname,tel,address_des]
//                 const order = await db.query(sqlOrder,sqlOrderParam)
//                 // insert order_detail 
//                 product.map( async (item,index)=>{
//                     var sqlOorderDetails = "INSERT INTO order_detail (order_id,product_id,quantity,price) VALUES (?,?,?,?)"
//                     var sqlOorderDetailsParam = [order.insertId, item.product_id, item.quantity, item.price];
//                     const orderDetail = await db.query(sqlOorderDetails,sqlOorderDetailsParam)

//                     // cut stock from table product
//                     var sqlProdut = "UPDATE product SET quantity=(quantity-?) WHERE product_id = ?"
//                     var updatePro = await db.query(sqlProdut,[item.quantity,item.product_id])
//                 })

//                 // clear cart by customer
//                 await db.query("DELETE FROM cart WHERE customer_id = ?",[customer_id])
            
//                 res.json({
//                     message:"Your order has been successfully!",
//                     data:order
//                 })
                
//                 db.commit();
//             }else{
//                 res.json({
//                     message:"You cart is empty!",
//                     error:true
//                 })
//             }
//         }else{
//             res.json({
//                 error:true,
//                 message:"Please your address!"
//             })
//         }

//         // gender invoice_no ? INV0001 , INV0002
//         // select adress customer,
//         // get cart by customer,
//         // find total 
//         // insert order 
//         // insert order_detail
//         // update stock product table 
//         // clear cart


//         // // order_detail
//         // order_id ?
//         // get cart by customer => (product_id,quantity,price)
//     }catch(e){
//         db.rollback();
//         res.json({
//             message:e,
//             error:true
//         })
//     }
    
// }

const update = (req,res) => {
    var {order_id,order_status_id} = req.body
    var sql = "UPDATE `order` SET order_status_id=? WHERE order_id = ?";
    var paramsql = [order_status_id,order_id]
    db.query(sql,paramsql,(error,row)=>{
        if(error){
            res.json({
                error:true,
                message:error
            })
        }else{
            res.json({
                message : row.affectedRows ? "Update successfully!" : "Data not in system!",
                data : row
            })
        }
    }) 
}
const remove = (req,res) => {
    var sql = "DELETE FROM `order` WHERE order_id = ?"
   
    db.query(sql,[req.params.id],(error,row)=>{
        if(!error){
         
            res.json({
                message: (row.affectedRows) ? "Delete successfully!" : "Data not in system",
                data:row
            })
        }else{
            res.json({
                error:true,
                message:error
            })
        }
    })
}

module.exports = {
    getAll,getOne,update,remove,create,getOderByCustomer
}