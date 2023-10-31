const db = require("../util/db");
const { isEmptyOrNull } = require("../util/service");
// cart 
// cart_id product_id customer_id 
// 1       1          1          1
// 2       1          1          1
// 3       3          1
// 4       1          2
// 5      2           2
const getCartByCutomer = async (req,res) => {
    const {customer_id} = req.query;
    // var sql = "SELECT * FROM cart WEHERE customer_id = ?"

    // var sql = "SELECT cart.cart_id, cart.quantity, product.* FROM cart  "
    // sql += " INNER JOIN product  ON (cart.poroduct_id = product.product_id)"
    // sql += " WHERE cart.customer_id = ?"

    var sql = "SELECT c.cart_id, c.quantity as cart_quantity, p.* FROM cart c"
    sql += " INNER JOIN product p ON (c.product_id = p.product_id)"
         
    sql += " WHERE c.customer_id = ?"
    
    const list = await db.query(sql,[customer_id])
    res.json({
        list:list,
        bodyData: req.body,
        queryData: req.query,
    })

}
const getCartItemCount = async (customer_id) => {
    const sql = 'SELECT SUM(quantity) AS total_quantity FROM cart WHERE customer_id = ?';
    const result = await db.query(sql, [customer_id]);
    const totalQuantity = result[0].total_quantity || 0; // Use 0 if there are no items in the cart
    return totalQuantity;
};

const updateCart = async (req,res) => {
    const {
        cart_id,
        quantity // -1 | 1
    } = req.body
    var message = {}
    if(isEmptyOrNull(cart_id)) {message.cart_id = "cart_id required!"}
    if(isEmptyOrNull(quantity)) {message.quantity = "quantity required!"}
    if(Object.keys(message).length > 0){
        res.json({
            error:true,
            message:message
        })
    }
    var sql = "UPDATE cart SET quantity=(quantity+?) WHERE cart_id=?"
    // 4 => 1 => (4+1) =5
    // 4 => -1 => (4-1) = 3
    var data = await db.query(sql,[quantity,cart_id])
    res.json({
        message:"Cart update success!",
        data:data
    })
}

const removeCart = async (req,res) => {
    var data = await db.query("DELETE FROM cart WHERE cart_id = ?",[req.body.cart_id])
    res.json({
        data:data,
        message:"Cart removed!"
    })
}
const addCart = async (req, res) => {
    const {
        customer_id,
        product_id,
        quantity
    } = req.body;
    var message = {};

    if (isEmptyOrNull(customer_id)) { message.customer_id = "customer_id required!"; }
    if (isEmptyOrNull(product_id)) { message.product_id = "product_id required!"; }
    if (isEmptyOrNull(quantity)) { message.quantity = "quantity required!"; }

    if (Object.keys(message).length > 0) {
        res.json({
            error: true,
            message: message
        });
    } else {
        // Check if the product already exists in the cart
        const checkCartSql = "SELECT cart_id FROM cart WHERE customer_id = ? AND product_id = ?";
        const checkCartResult = await db.query(checkCartSql, [customer_id, product_id]);

        if (checkCartResult.length > 0) {
            // The product already exists in the cart, return an error message
            res.json({
                error: true,
                message: "Product already exists in the cart."
            });
        } else {
            // Product doesn't exist in the cart, add it
            var sql = "INSERT INTO cart (customer_id, product_id, quantity) VALUES (?,?,?)";
            var data = await db.query(sql, [customer_id, product_id, quantity]);
            res.json({
                message: "Cart add success!",
                data: data
            });
        }
    }
};

// const addCart = async (req,res) => {
//     const {
//         customer_id,
//         product_id,
//         quantity
//     } = req.body
//     var message = {}
//     if(isEmptyOrNull(customer_id)) {message.customer_id = "customer_id required!"}
//     if(isEmptyOrNull(product_id)) {message.product_id = "product_id required!"}
//     if(isEmptyOrNull(quantity)) {message.quantity = "quantity required!"}
//     if(Object.keys(message).length > 0){
//         res.json({
//             error:true,
//             message:message
//         })
//     }
//     var sql = "INSERT INTO cart (customer_id,product_id,quantity) VALUES (?,?,?)"
//     var data = await db.query(sql,[customer_id,product_id,quantity])
//     res.json({
//         message:"Cart add success!",
//         data:data
//     })
// }

module.exports = {
    getCartByCutomer,
    addCart,
    removeCart,
    updateCart,
    getCartItemCount
}