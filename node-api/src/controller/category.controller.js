
// const {db} = require("../util/db")
const db = require("../util/db")
const { isEmptyOrNull } = require("../util/service")

const getAll = async (req,res) => {
    const list = await db.query("SELECT * FROM category");
    res.json({
        list:list,
    })

}

const getOne = (req,res) =>{
    var id = req.params.id // params from client 
    var sql = "SELECT * FROM category WHERE category_id = ?"
    db.query(sql,[id],(error,row)=>{
        if(error){
            res.json({
                message:error,
                error:true
            })
        }else{
            res.json({
                list:row
            })
        }
    })  
}
const create = (req, res) => {
    const { name, description, parent_id, status } = req.body;

    // Check if the category name is required
    if (isEmptyOrNull(name)) {
        return res.status(400).json({
            error: true,
            message: { name: "Category name required!" }
        });
    }

    // Check if a category with the same name already exists in the database
    // Replace the following code with your database query
    db.query("SELECT * FROM category WHERE name = ?", [name], (error, results) => {
        if (error) {
            return res.status(500).json({ error: true, message: "An error occurred" });
        } else if (results.length > 0) {
            return res.json({ error: true, message: "Category already exists" });
        } else {
            // Insert the new category into the database
            var sql = "INSERT INTO category (`name`, `description`, `parent_id`, `status`) VALUES (?, ?, ?, ?)";
            var param_data = [name, description, parent_id, status];
            db.query(sql, param_data, (insertError, insertResult) => {
                if (insertError) {
                    return res.status(500).json({ error: true, message: "An error occurred during insertion" });
                }
                return res.json({ message: "Category created successfully", data: insertResult });
            });
        }
    });
};


// const create = (req,res) => {
    	  			
//     const {
//         name,
//         description,
//         parent_id,
//         status
//     } = req.body

//     // check which field required
//     var message = {}
//     if(isEmptyOrNull(name)){
//         message.name = "category name required!";
//         res.json({
//             error : true,
//             message : message
//         })
//         return 
//     }
    
//     var sql = "INSERT INTO category (`name`, `description`, `parent_id`, `status`) VALUES (?, ?, ?, ?)"
//     var param_data = [name,description,parent_id,status]
//     db.query(sql,param_data,(error,row)=>{
//         if (error) {
//             res.status(500).json({ error: true, message: "An error occurred" });
//         } else if (results.length > 0) {
//             res.status(400).json({ error: true, message: "Category already exists" });
//         } else {
//             // Insert the new category into the database
//             // ...
//             res.json({ message: "Category created successfully", data: /* category data */ });
//         }
//     })
// }
const update = (req, res) => {
    const { category_id, name, description, parent_id, status } = req.body;

    // Check if category name is required
    var message = {};
    if (isEmptyOrNull(name)) {
        message.name = "Category name required!";
        res.json({
            error: true,
            message: message,
        });
        return;
    } else if (isEmptyOrNull(category_id)) {
        message.category_id = "Category ID required!";
        res.json({
            error: true,
            message: message,
        });
        return;
    }

    // Check if the new name already exists
    const checkNameQuery = "SELECT COUNT(*) as nameExists FROM category WHERE name = ? AND category_id != ?";
    db.query(checkNameQuery, [name, category_id], (checkError, checkResult) => {
        if (checkError) {
            res.json({
                error: true,
                message: checkError,
            });
        } else {
            if (checkResult[0].nameExists > 0) {
                res.json({
                    error: true,
                    message: "Category name already exists",
                });
            } else {
                // Update the category
                const updateQuery = "UPDATE category SET name=?, description=?, parent_id=?, status=? WHERE category_id = ?";
                const updateParams = [name, description, parent_id, status, category_id];
                db.query(updateQuery, updateParams, (updateError, updateResult) => {
                    if (updateError) {
                        res.json({
                            error: true,
                            message: updateError,
                        });
                    } else {
                        res.json({
                            message: updateResult.affectedRows ? "Update successful!" : "Data not in system!",
                            data: updateResult,
                        });
                    }
                });
            }
        }
    });
};

// const update = (req,res) => {
//     const {
//         category_id,
//         name,
//         description,
//         parent_id,
//         status
//     } = req.body

//     // check which field required
//     var message = {}
//     if(isEmptyOrNull(name)){
//         message.name = "category name required!";
//         res.json({
//             error : true,
//             message : message
//         })
//         return 
//     }else if(isEmptyOrNull(category_id)){
//         message.name = "category_id required!";
//         res.json({
//             error : true,
//             message : message
//         })
//         return 
//     }

//     var sql = "UPDATE category SET name=?, description=?, parent_id=?, status=? WHERE category_id = ?";
//     var param_sql = [name,description,parent_id,status,category_id]
//     db.query(sql,param_sql,(error,row)=>{
//         if(error){
//             res.json({
//                 error:true,
//                 message:error
//             })
//         }else{
//             res.json({
//                 message : row.affectedRows ? "Update successfully!" : "Data not in system!",
//                 data : row
//             })
//         }
//     })

// }

const remove = (req,res) => {
    var {id} = req.params
    var sql = "DELETE FROM category WHERE category_id = ?"
    db.query(sql,[id],(error,row)=>{
        if(!error){
            res.json({
                // message: (row.affectedRows != 0) ? "Delete successfully!" : "Data not in system",
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
    getAll,
    getOne,
    create,
    update,
    remove
}