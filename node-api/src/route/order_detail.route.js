const { userGuard } = require("../controller/auth.controller")
const ct = require("../controller/order_detail")
const order_status = (app,base_route) =>{
    // app.get(`${base_route}`,userGuard,ct.getAll)
    // app.post(`${base_route}`,userGuard,ct.create)
    app.delete(`${base_route}/:id`,ct.remove)
}
module.exports = order_status;