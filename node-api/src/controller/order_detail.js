
const db = require("../util/db")

const remove = (req,res) => {
    var sql = "DELETE FROM order_detail WHERE order_detail_id = ?"
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
module.exports = {
    remove
}