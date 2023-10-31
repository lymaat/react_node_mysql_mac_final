const db = require("../util/db")
const { isEmptyOrNull } = require("../util/service")

const getParam = (value) => {
    if(value == "" || value == "null" || value == "undefined"){
        return null
    }
    return value
}
function isNumeric(input) {
    return !isNaN(parseFloat(input)) && isFinite(input);
  }
const getlist = async (req, res) => {
    try {
        const { page,txtSearch, categoryId, productStatus } = req.query;

        var param = [getParam(categoryId)]
        var limitItem = 100 
        var offset = (page - 1) * limitItem 

        var select = "SELECT p.*, c.name as category_name ";
        var join =  " FROM product p " +
            " INNER JOIN category c ON (p.category_id = c.category_id) ";
        var where = " WHERE p.category_id = IFNULL(?,p.category_id) "
        
        if (!isEmptyOrNull(txtSearch)) {
            where += " AND p.barcode = ? OR p.name LIKE ? " //"' + txtSearch + '"
            param.push(txtSearch)
            param.push("%"+txtSearch+"%")
        }
        if (!isEmptyOrNull(productStatus)) {
            where += " AND p.is_active = ?" ///productStatus
            param.push(productStatus)
        }
        var order = " ORDER BY p.product_id DESC "
        var limit = " LIMIT "+limitItem+" OFFSET "+offset+""

        var sql = select + join + where + order + limit;
        const list = await db.query(sql,param)

        var selectTotal = " SELECT COUNT(p.product_id) as total, SUM(quantity) as totalQty ";
        var sqlTotal = selectTotal + join + where;
        const totalRecord = await db.query(sqlTotal,param)


        var sqlCategory = "SELECT * FROM category"
        const category = await db.query(sqlCategory)
        // const brand = [
        //     {
        //         id: 1,
        //         name: "Apple"
        //     },
        //     {
        //         id: 2,
        //         name: "Microsoft"
        //     },
        //     {
        //         id: 3,
        //         name: "Dell"
        //     },
        // ]
        res.json({
            list: list,
            totalRecord:totalRecord,
            //  {
            //     tatalQty : totalRecord[0].tatalQty,
            //     total : totalRecord[0].total
            // },
            list_category: category,
            // brand: brand,
            bodyData: req.body,
            queryData: req.query,
        })
    } catch (e) {
        console.log(e)
        res.status(500).send({
            message: 'Internal Error!',
            error: e
        });
    }

}

const getone = async (req, res) => {
    const { id } = req.params;
    var sql = "SELECT * FROM product WHERE product_id = ?"
    const list = await db.query(sql, [id])
    res.json({
        list: list
    })
}

const create = async (req, res) => {
    var {
        category_id,
        barcode,
        name,
        quantity,
        price,
        
        description
    } = req.body;
    var image = null
    if(req.file){
        image = req.file.filename
    }
    if (!isNumeric(quantity) || !isNumeric(price)) {
        const errorMessages = [];

        if (!isNumeric(quantity)) {
            errorMessages.push("Quantity must be a number!");
        }
        if (!isNumeric(price)) {
            errorMessages.push("Price must be a number!");
        }

        res.json({
            error: true,
            message: errorMessages
        });
        return;
    }
    var message = {}
    if (isEmptyOrNull(category_id)) { message.category_id = "category_id required!" }
    if (isEmptyOrNull(barcode)) { message.barcode = "barcode required!" }
    if (isEmptyOrNull(name)) { message.name = "name required!" }
    if (isEmptyOrNull(quantity)) { message.quantity = "quantity required!" }
    if (isEmptyOrNull(price)) { message.price = "price required!" }

    if (Object.keys(message).length > 0) {
        res.json({
            error: true,
            message: message
        })
        return false;
    }
   
    // Check if a product with the given barcode or name already exists
    const existingProduct = await db.query("SELECT * FROM product WHERE barcode = ? OR name = ?", [barcode, name]);

    if (existingProduct.length > 0) {
        // Product with the same barcode or name already exists, update its quantity
        res.json({
            message:"Product already exist please go Update it"
        })
        // const existingQuantity = existingProduct[0].quantity; // Get the old quantity
        // const newQuantity = parseFloat(existingQuantity) + parseFloat(quantity); // Add the new quantity to the old quantity

        // const updateSql = `
        //     UPDATE product
        //     SET category_id = ?,
        //         quantity = ?,
        //         price = ?,
        //         image = ?,
        //         description = ?
        //     WHERE barcode = ? OR name = ?`;
        
        // const updateParams = [category_id, newQuantity, price, image, description, barcode, name];

        // await db.query(updateSql, updateParams);

        // res.json({
        //     message: "Updated existing product's quantity",
        // });
    } else {
        // Product with the given barcode and name doesn't exist, insert a new row
        const insertSql = "INSERT INTO product (category_id, barcode, name, quantity, price, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const insertParams = [category_id, barcode, name, quantity, price, image, description];

        await db.query(insertSql, insertParams);

        res.json({
            message: "Created product",
        });
    }
}


// const create = async (req, res) => {
//     var {
//         category_id,
//         barcode,
//         name,
//         quantity,
//         price,
        
//         description
//     } = req.body;
//     var image = null
//     if(req.file){
//         image = req.file.filename
//     }
    
//     var message = {}
//     if (isEmptyOrNull(category_id)) { message.category_id = "category_id required!" }
//     if (isEmptyOrNull(barcode)) { message.barcode = "barcode required!" }
//     if (isEmptyOrNull(name)) { message.name = "name required!" }
//     if (isEmptyOrNull(quantity)) { message.quantity = "quantity required!" }
//     if (isEmptyOrNull(price)) { message.price = "price required!" }
//     if (Object.keys(message).length > 0) {
//         res.json({
//             error: true,
//             message: message
//         })
//         return false;
//     }
//     var sql = "INSERT INTO product (category_id,barcode,name,quantity,price,image,description) VALUES (?,?,?,?,?,?,?)"
//     var param = [category_id, barcode, name, quantity, price, image, description]
//     var data = await db.query(sql, param)
//     res.json({
//         message: "Created product",
//         data: data
//     })
// }
const update = async (req, res) => {
    var {
        product_id,
        category_id,
        barcode,
        name,
        quantity,
        price,
       
        description
    } = req.body;
      var image = null
    if(req.file){
        image = req.file.filename
    }
  
    if (!isNumeric(quantity) || !isNumeric(price)) {
        const errorMessages = [];

        if (!isNumeric(quantity)) {
            errorMessages.push("Quantity must be a number!");
        }
        if (!isNumeric(price)) {
            errorMessages.push("Price must be a number!");
        }

        res.json({
            error: true,
            message: errorMessages
        });
        return;
    }
    var message = {};

    if (isEmptyOrNull(product_id)) { message.product_id = "product_id required!" }
    if (isEmptyOrNull(category_id)) { message.category_id = "category_id required!" }
    if (isEmptyOrNull(barcode)) { message.barcode = "barcode required!" }
    if (isEmptyOrNull(name)) { message.name = "name required!" }
    if (isEmptyOrNull(quantity)) { message.quantity = "quantity required!" }
    if (isNaN(quantity) || parseFloat(quantity) < 0) { 
        message.quantity = "quantity must be a non-negative number!";
    }
    if (isEmptyOrNull(price)) { message.price = "price required!" }

    if (Object.keys(message).length > 0) {
        res.json({
            error: true,
            message: message
        });
        return;
    }

    // Determine the value of is_active based on quantity
    var is_active = quantity > 0 ? 1 : 0;

    try {
        var sql = "UPDATE product SET category_id=?, barcode=?, name=?, quantity=?, price=?, image=?, description=?, is_active=? WHERE product_id = ?";
        var param = [category_id, barcode, name, quantity, price, image, description, is_active, product_id];
        var data = await db.query(sql, param);

        res.json({
            message: "Updated product",
            data: data
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: true,
            message: "Internal server error"
        });
    }
}


// const update = (req, res) => {
//     var {
//         product_id,
//         category_id,
//         barcode,
//         name,
//         quantity,
//         price,
//         image,
//         description
//     } = req.body;
//     var message = {}
//     if (isEmptyOrNull(product_id)) { message.product_id = "product_id required!" }
//     if (isEmptyOrNull(category_id)) { message.category_id = "category_id required!" }
//     if (isEmptyOrNull(barcode)) { message.barcode = "barcode required!" }
//     if (isEmptyOrNull(name)) { message.name = "name required!" }
//     if (isEmptyOrNull(quantity)) { message.quantity = "quantity required!" }
//     if (isEmptyOrNull(price)) { message.price = "price required!" }
//     if (Object.keys(message).length > 0) {
//         res.json({
//             error: true,
//             message: message
//         })
//         return false;
//     }
//     var sql = "UPDATE product SET category_id=?, barcode=?, name=?, quantity=?, price=?, image=?, description=? WHERE product_id = ?"
//     var param = [category_id, barcode, name, quantity, price, image, description, product_id]
//     var data = db.query(sql, param)
//     res.json({
//         message: "Updated product",
//         data: data
//     })
// }

const remove = async (req, res) => {
    const { id } = req.body;
    var sql = "DELETE FROM product WHERE product_id = ?"
    const data = await db.query(sql, [id])
    res.json({
        message: "Remove success",
        data: data
    })
}

const changeProductStatus = async (req, res) => {
    const { is_active } = req.body; // 1 | 0
    var sql = "UPDATE product SET is_active = ? WHERE product_id = ?"
    const data = await db.query(sql, [is_active])
    res.json({
        message: "Update product to " + (is_active == 0 ? " inactived" : " actived"),
        data: data
    })
}

module.exports = {
    getlist,
    getone,
    create,
    update,
    remove,
    changeProductStatus
}