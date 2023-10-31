
const db = require("../util/db")
const { isEmptyOrNull, TOKEN_KEY, REFRESH_KEY } = require("../util/service")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { getPermissionUser } = require("./auth.controller")
const getParam = (value) => {
    if(value == "" || value == "null" || value == "undefined"){
        return null
    }
    return value
}
const setPassword = async (req,res) =>{
    const {customer_id} = req.query;

    var sql = " SELECT * FROM customer "  
    sql += " WHERE customer_id = ?"
    
    const list = await db.query(sql,[customer_id])
    res.json({
        list:list,
        bodyData: req.body,
        queryData: req.query,
    })
}
const updatepassword = (req,res) =>{
    var {
        customer_id,
        password,
    } = req.body

    // check which field required
    var message = {}
    if(isEmptyOrNull(customer_id)){
        message.customer_id = "customer_id required!"
    }
   
    // Object.keys(message).length // return length of object message
    if(Object.keys(message).length > 0 ){
        res.json({
            error : true,
            message : message
        })
        return 
    }
    // end check which field required
    password = bcrypt.hashSync(password,10) 
    var sql = "UPDATE customer SET password=? WHERE customer_id = ?";
    var param_sql = [password,customer_id]
    db.query(sql,param_sql,(error,row)=>{
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

const getAll = async (req, res) => {
    try {
        const { page, txtSearch, ProvinceIdSearch } = req.query;

        var param = [getParam(ProvinceIdSearch)];
        var limitItem = 100
        var offset = (page - 1) * limitItem;
        var select = "SELECT ca.customer_id, ca.province_id, ca.tel, c.firstname, c.lastname, c.gender_id, ca.address_des, c.username, c.password, c.is_active, p.name as province_name ";
        var join = " FROM customer_address ca " +
        " INNER JOIN customer c ON (ca.customer_id = c.customer_id) " +
        " INNER JOIN province p ON (ca.province_id = p.province_id) "+
        " INNER JOIN gender g ON (c.gender_id = g.gender_id) ";

        // var select = "SELECT ca.customer_id, ca.province_id, ca.tel, c.firstname, c.lastname, c.gender, c.address_des, c.username, c.password, c.is_active ";
        // var join = " FROM customer_address ca " +
        //     " INNER JOIN customer c ON (ca.customer_id = c.customer_id) ";
        var where = " WHERE ca.province_id = IFNULL(?, ca.province_id) ";

        if (!isEmptyOrNull(txtSearch)) {
            where += " AND (c.username = ? OR c.firstname LIKE ? OR c.lastname LIKE ?)";
            param.push(txtSearch);
            param.push("%" + txtSearch + "%");
            param.push("%" + txtSearch + "%");
        }

        var order = " ORDER BY ca.customer_id DESC ";
        var limit = " LIMIT " + limitItem + " OFFSET " + offset + "";

        var sql = select + join + where + order + limit;
        const listCustomer = await db.query(sql,param);

        var sqlProvince = "SELECT * FROM province";
        const province = await db.query(sqlProvince);

        var sqlGender = "SELECT * FROM gender"
        const gender = await db.query(sqlGender);

        res.json({
            list: listCustomer,
            listProvince: province,
            listGender: gender,
            bodyData: req.body,
            queryData: req.query,
        });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            message: 'Internal Error!',
            error: e,
        });
    }
};

// const getAll = async  (req,res) => {
//     var sqlProvince = "SELECT * FROM province " 
//     var sqlCustomer = "SELECT customer_id,firstname,lastname,gender,province_id,address_des,username,password,is_active,create_at FROM customer ORDER BY customer_id DESC"
//     var listProvince = await db.query(sqlProvince)
//     var listCustomer = await db.query(sqlCustomer)
    
//     res.json({
//         list:listCustomer,
//         listProvince:listProvince,
//     })
// }

const getOne = (req,res) =>{
    var id = req.params.id // params from client 
    var sql = "SELECT customer_id,firstname,lastname,gender_id,is_active,create_at FROM customer WHERE customer_id = ?"
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

// const create = (req,res) => {
//     db.beginTransaction()
//     // check is exist
//     // parameter required
//     // password bcrypt
//     // inert two tables customer/customer_address 
    
//     var {
//         username, // store telephone
//         password,
//         firstname,
//         lastname,
//         gender_id,
//         province_id,
//         address_des
//     } = req.body;
//     // validate parameters
//     var message  = {}
//     if(isEmptyOrNull(username)){message.username="username required!"}
//     if(isEmptyOrNull(password)){message.password="password required!"}
//     if(isEmptyOrNull(firstname)){message.firstname="firstname required!"}
//     if(isEmptyOrNull(lastname)){message.lastname="lastname required!"}
//     if(isEmptyOrNull(gender_id)){message.gender="gender required!"}
//     if(isEmptyOrNull(province_id)){message.province_id="province_id required!"}
//     if(Object.keys(message).length > 0){
//         res.json({
//             error:true,
//             message:message
//         })
//         return false
//     }
//     // end validate parameters

//     // check is existing customer by tel=username
//     var sqlFind = "SELECT customer_id FROM customer WHERE username = ? " // sql check customer by username
//     db.query(sqlFind,[username],(error1,result1)=>{
//         if(result1.length > 0){ // have record => exist cusomter 
//             res.json({
//                 error:true,
//                 message:"Account already exist!"
//             })
//             return false;
//         }else{
//             // bycript passwrod from client
//             // password = 121234f => "jsERWERQ@#RSDFA#%$%#$%#@$%#$%SDFA#$#"
//             password = bcrypt.hashSync(password,10) //  12344 => "jsERWERQ@#RSDFA#%$%#$%#@$%#$%SDFA#$#"

//             var sqlCustomer = "INSERT INTO customer (firstname, lastname, gender_id, username, password) VALUES (?, ?, ?, ?, ?) "
//             var paramCustomer = [firstname, lastname, gender_id, username, password]
//             console.log(sqlCustomer)
//             db.query(sqlCustomer,paramCustomer,(error2,result2)=>{ // insert to customer
//                 if(!error2){
//                     // insert customer_address
//                     var sqlCustomerAdd = "INSERT INTO customer_address (customer_id, province_id, firstname, lastname, tel, address_des) VALUES (?,?,?,?,?,?) "
//                     var paramCustomerAdd = [result2.insertId, province_id, firstname, lastname, username, address_des]
//                     console.log(sqlCustomerAdd)
//                     db.query(sqlCustomerAdd,paramCustomerAdd,(error3,result3)=>{
//                         if(!error3){
//                             res.json({
//                                 message:"Account created!",
//                                 data:result3
//                             })
//                             db.commit()
//                         }else{
//                             db.rollback()
//                             res.json({
//                                 error:true,
//                                 message:error3
//                             })
                            
//                         }
//                     })
//                 }
//             })
//         }
//     })
// }

const login = async (req,res) => {
    var {username,password} = req.body;
    var message = {};
    if(isEmptyOrNull(username)) {message.username = "Please fill in username!"}
    if(isEmptyOrNull(password)) {message.password = "Please fill in password!"}
    if(Object.keys(message).length>0){
        res.json({
            error:true,
            message:message
        })
        return 
    }
    var user = await db.query("SELECT * FROM customer WHERE username = ?",[username]);
    if(user.length > 0){
        var passDb = user[0].password // get password from DB (#$@*&(FKLSHKLERHIUH@OIUH@#))
        var isCorrrect = bcrypt.compareSync(password,passDb)
        if(isCorrrect){
            var user = user[0]
            delete user.password; // delete colums password from object user'
            var permission = await getPermissionUser(user.customer_id)
            var obj = {
                user:user,
                permission:permission,
            }
            var access_token = jwt.sign({data:{...obj}},TOKEN_KEY,{expiresIn:"2h"})
            var refresh_token = jwt.sign({data:{...obj}},REFRESH_KEY)
            res.json({
                ...obj,
                access_token:access_token,
                refresh_token:refresh_token,
            }) 
        }else{
            res.json({
                message:"Password incorrect!",
                error:true
            }) 
        }
    }else{
        res.json({
            message:"Account does't exist!. Please goto register!",
            error:true
        })
    }
}

const refreshToken = async (req,res)=>{
    // check and verify refresh_token from client 
    var {refresh_key} = req.body;
    if(isEmptyOrNull(refresh_key)){
        res.status(401).send({
            message: 'Unauthorized',
        });
    }else{
        jwt.verify(refresh_key,REFRESH_KEY, async (error,result)=>{
            if(error){
                res.status(401).send({
                    message: 'Unauthorized',
                    error: error
                });
            }else{
                // សុំសិទ្ធទាញុយក acccess token ថ្មី
                var username = result.data.user.username;
                var user = await db.query("SELECT * FROM customer WHERE username = ?",[username]);
                var user = user[0]
                delete user.password; // delete colums password from object user'
                var permission = await getPermissionUser(user.customer_id)
                var obj = {
                    user:user,
                    permission:permission,
                }
                var access_token = jwt.sign({data:{...obj}},TOKEN_KEY,{expiresIn:"2h"})
                var refresh_token = jwt.sign({data:{...obj}},REFRESH_KEY)
                res.json({
                    ...obj,
                    access_token:access_token,
                    refresh_token:refresh_token,
                })
            }
        })
    }
}

// const login = async (req,res) => {
//     var {username,password} = req.body;
//     var message = {};
//     if(isEmptyOrNull(username)) {message.username = "Please fill in username!"}
//     if(isEmptyOrNull(password)) {message.password = "Please fill in password!"}
//     if(Object.keys(message).length>0){
//         res.json({
//             error:true,
//             message:message
//         })
//         return 
//     }
//     var user = await db.query("SELECT * FROM customer WHERE username = ?",[username]);
//     if(user.length > 0){
//         var passDb = user[0].password // get password from DB (#$@*&(FKLSHKLERHIUH@OIUH@#))
//         var isCorrrect = bcrypt.compareSync(password,passDb)
//         if(isCorrrect){
//             var user = user[0]
//             delete user.password; // delete colums password from object user'
//             var obj = {
//                 user:user,
//                 permission:[],
//                 token:"" // generate token JWT
//             }
//             var access_token = jwt.sign({data:{...obj}},TOKEN_KEY,{expiresIn:"30s"})
//             var refresh_token = jwt.sign({data:{...obj}},TOKEN_KEY)
//             res.json({
//                 ...obj,
//                 access_token:access_token,
//                 refresh_token:refresh_token,
//             }) 
//         }else{
//             res.json({
//                 message:"Password incorrect!",
//                 error:true
//             }) 
//         }
//     }else{
//         res.json({
//             message:"Account does't exist!. Please goto register!",
//             error:true
//         })
//     }
// } 


const create = (req, res) => {
    const {
        username,
        password,
        firstname,
        lastname,
        gender_id,
        province_id,
        address_des,
        tel
    } = req.body;

    // Check if the username already exists
    db.query("SELECT username FROM customer WHERE username = ?", [username], (error, results) => {
        if (error) {
            res.status(500).json({
                error: true,
                message: "An error occurred while checking the username."
            });
        } else if (results.length > 0) {
            res.json({
                error: true,
                message: "Username already exists."
            });
        } else {
            // The username is available, proceed with account creation
            db.beginTransaction();
            const hashedPassword = bcrypt.hashSync(password, 10);
            const sqlCustomer = "INSERT INTO customer (firstname, lastname, gender_id, username, password) VALUES (?, ?, ?, ?, ?)";
            const paramCustomer = [firstname, lastname, gender_id, username, hashedPassword];

            db.query(sqlCustomer, paramCustomer, (error2, result2) => {
                if (error2) {
                    db.rollback();
                    res.status(500).json({
                        error: true,
                        message: "An error occurred while creating the account."
                    });
                } else {
                    const customerId = result2.insertId;
                    const sqlCustomerAdd = "INSERT INTO customer_address (customer_id, province_id, firstname, lastname, tel, address_des) VALUES (?, ?, ?, ?, ?, ?)";
                    const paramCustomerAdd = [customerId, province_id, firstname, lastname, tel, address_des];

                    db.query(sqlCustomerAdd, paramCustomerAdd, (error3, result3) => {
                        if (error3) {
                            db.rollback();
                            res.status(500).json({
                                error: true,
                                message: "An error occurred while creating the account."
                            });
                        } else {
                            db.commit();
                            res.status(201).json({
                                message: "Account created",
                                data: result3
                            });
                        }
                    });
                }
            });
        }
    });
};


// const create = (req, res) => {
//     db.beginTransaction();
//     var {
//         username,
//         password,
//         firstname,
//         lastname,
//         gender_id,
//         province_id,
//         address_des,
//         tel
//     } = req.body;
//     var message = {};

//     if (isEmptyOrNull(username)) { message.username = "Username is required"; }
//     if (isEmptyOrNull(password)) { message.password = "Password is required"; }
//     if (isEmptyOrNull(firstname)) { message.firstname = "First name is required"; }
//     if (isEmptyOrNull(lastname)) { message.lastname = "Last name is required"; }
//     if (isEmptyOrNull(gender_id)) { message.gender_id = "Gender ID is required"; }
//     if (isEmptyOrNull(province_id)) { message.province_id = "Province ID is required"; }

//     if (Object.keys(message).length > 0) {
//         res.json({
//             error: true,
//             message: message
//         });
//         return;
//     }

//     password = bcrypt.hashSync(password, 10);
//     var sqlCustomer = "INSERT INTO customer (firstname, lastname, gender_id, username, password) VALUES (?, ?, ?, ?, ?)";
//     var paramCustomer = [firstname, lastname, gender_id, username, password];
    
//     db.query(sqlCustomer, paramCustomer, (error2, result2) => {
//         if (error2) {
//             db.rollback();
//             res.json({
//                 error: true,
//                 message: "An error occurred while creating the account."
//             });
//             return;
//         }
        
//         var customerId = result2.insertId;
        
//         var sqlCustomerAdd = "INSERT INTO customer_address (customer_id, province_id, firstname, lastname, tel, address_des) VALUES (?, ?, ?, ?, ?, ?)";
//         var paramCustomerAdd = [customerId, province_id, firstname, lastname, tel, address_des];
        
//         db.query(sqlCustomerAdd, paramCustomerAdd, (error3, result3) => {
//             if (error3) {
//                 db.rollback();
//                 res.json({
//                     error: true,
//                     message: "An error occurred while creating the account."
//                 });
//             } else {
//                 db.commit();
//                 res.json({
//                     message: "Account created",
//                     data: result3
//                 });
//             }
//         });
//     });
// };

const update = (req,res) => { // update profile
    const {
        customer_id,
        firstname,
        lastname,
        gender_id,
    } = req.body

    // check which field required
    var message = {}
    if(isEmptyOrNull(customer_id)){message.customer_id = "Customer id required!"}
    if(isEmptyOrNull(firstname)){message.firstname = "Customer firstname required!"}
    if(isEmptyOrNull(lastname)){message.lastname = "Customer lastname required!"}
    if(isEmptyOrNull(gender_id)){message.gender_id = "Customer gender_id required!"}
    if(Object.keys(message).length > 0){
        res.json({
            error:true,
            message:message
        })
        return;
    }

    var sql = "UPDATE customer SET firstname=?, lastname=?, gender_id=? WHERE customer_id = ?";
    var param_sql = [firstname,lastname,gender_id,customer_id]
    db.query(sql,param_sql,(error,row)=>{
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

// customer (delete) // customer_address auto
// category (delete : no id use in child) // product


const remove = (req,res) => {
    var sql = "DELETE FROM customer WHERE customer_id = ?"
    // var sql = "UPDATE customer SET is_active = 0 WHERE customer_id = ? "
    db.query(sql,[req.params.id],(error,row)=>{
        if(!error){
            // customer_address 
            var sql = ""
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

const listAddress = async (req, res) => {
    var { customer_id } = req.query;
    var sql =
      "SELECT p.name as province_name, ca.* FROM customer_address ca " +
      "INNER JOIN province p ON (ca.province_id = p.province_id) " +
      "WHERE ca.customer_id = ?";
    const list = await db.query(sql, [customer_id]);
    var sqlProvince = "SELECT * FROM province";
    const province = await db.query(sqlProvince);
    res.json({
      list: list,
      listProvince: province,
      // Add the missing variable or remove it if not needed
      // listGender: gender,
      bodyData: req.body,
      queryData: req.query,
    });
  };
  
const listOneAddress = (req,res) => {
    var {
        customer_id
    } = req.params
    var sql = "SELECT * FROM customer_address WHERE customer_address_id = ?";

    db.query(sql,[customer_id],(error,row)=>{
        if(!error){
            res.json({
                list : row
            })
        }
    })
}
const newAddress = (req,res) => {
    var {
        customer_id,
        firstname,
        lastname,
        tel,
        province_id,
        address_des
    } = req.body;
    var message = {}
    if(isEmptyOrNull(customer_id)) { message.customer_id = "customer_id required!"}
    if(isEmptyOrNull(firstname)) { message.firstname = "firstname required!"}
    if(isEmptyOrNull(lastname)) { message.lastname = "lastname required!"}
    if(isEmptyOrNull(tel)) { message.tel = "tel required!"}
    if(isEmptyOrNull(province_id)) { message.province_id = "province_id required!"}
    if(isEmptyOrNull(address_des)) { message.address_des = "address_des required!"}
    if(Object.keys(message).length > 0){
        res.json({
            error:true,
            message:message
        })
        return false;
    }
    var sql = "INSERT INTO customer_address (customer_id, province_id, firstname, lastname, tel, address_des) VALUES (?,?,?,?,?,?)";
    var param = [customer_id,province_id,firstname,lastname,tel,address_des]
    db.query(sql,param,(error,row)=>{
        if(error){
            res.json({
                error:true,
                message:error
            })
        }else{
            res.json({
                message : row.affectedRows ? "Create successfully!" : "Data not in system!",
                data : row
            })
        }
    })
}
const updateAddress = (req,res) => {
    var {
        customer_address_id,
        customer_id,
        firstname,
        lastname,
        tel,
        province_id,
        address_des
    } = req.body;
    var message = {}
    if(isEmptyOrNull(customer_address_id)) { message.customer_address_id = "customer_address_id required!"}
    if(isEmptyOrNull(customer_id)) { message.customer_id = "customer_id required!"}
    if(isEmptyOrNull(firstname)) { message.firstname = "firstname required!"}
    if(isEmptyOrNull(lastname)) { message.lastname = "lastname required!"}
    if(isEmptyOrNull(tel)) { message.tel = "tel required!"}
    if(isEmptyOrNull(province_id)) { message.province_id = "province_id required!"}
    if(isEmptyOrNull(address_des)) { message.address_des = "address_des required!"}
    if(Object.keys(message).length > 0){
        res.json({
            error:true,
            message:message
        })
        return;
    }
    var sql = "UPDATE customer_address SET customer_id=?, province_id=?, firstname=?, lastname=?, tel=?, address_des=? WHERE customer_address_id = ?";
    var param = [customer_id,province_id,firstname,lastname,tel,address_des,customer_address_id]
    db.query(sql,param,(error,row)=>{
        if(error){
            res.json({
                error:true,
                message:error
            })
        }else{
            res.json({
                message : row.affectedRows ? "Create successfully!" : "Data not in system!",
                data : row
            })
        }
    })

}
const removeAddress = (req,res) => {
    var {
        customer_id
    } = req.params
    var sql = "DELETE FROM customer_address WHERE customer_address_id = ?";
    db.query(sql,[customer_id],(error,row)=>{
        if(!error){
            res.json({
                message : row.affectedRows ? "Remove success!" : "Not found in system!"
            })
        }
    })
}

module.exports = {
    getAll,
    getOne,
    create,
    update,
    remove,
    listAddress,
    listOneAddress,
    newAddress,
    updateAddress,
    removeAddress,
    login,
    refreshToken,
    setPassword,
    updatepassword
}