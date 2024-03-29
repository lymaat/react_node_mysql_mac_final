
const { userGuard } = require("../controller/auth.controller")
const ct = require("../controller/customer.contoller")
const customer = (app,base_route) => {
    app.get(base_route,userGuard(),ct.getAll)
    app.get(`${base_route}/:id`,userGuard(),ct.getOne) // id params // req.params.id
    app.post(base_route,ct.create)
    app.post(`${base_route}_login`,ct.login)
    app.put(base_route,userGuard(),ct.update)
    app.delete(`${base_route}/:id`,userGuard(),ct.remove)

    app.get(`${base_route}_address`,userGuard(),ct.listAddress) // api/customer/address get
    app.get(`${base_route}_address/:id`,userGuard(),ct.listOneAddress) // api/customer/address/1 get
    app.post(`${base_route}_address`,userGuard(),ct.newAddress) // api/customer/address ,userGuard, post
    app.put(`${base_route}_address`,userGuard(),ct.updateAddress) // api/customer/address ,userGuard, put
    app.delete(`${base_route}_address/:id`,userGuard(),ct.removeAddress)
    
    app.get(`${base_route}_getpassword`,userGuard(),ct.setPassword) // api/customer/address get
    app.put(`${base_route}_updatepassword`,userGuard(),ct.updatepassword) // api/customer/address get

}
module.exports = customer;