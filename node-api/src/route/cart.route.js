const { userGuard } = require("../controller/auth.controller")
const ct = require("../controller/cart.controller")
const {upload} = require("../util/config")

const cart = (app,route_name) => {
    app.get(`${route_name}`,userGuard(),ct.getCartByCutomer)
    app.get("/api/getCartItemCount",userGuard(),ct.getCartItemCount)
    app.post(`${route_name}`,upload.single("image_upload"),userGuard(),ct.addCart)
    app.delete(`${route_name}`,ct.removeCart)
    app.put(`${route_name}`,ct.updateCart)
}
module.exports = cart