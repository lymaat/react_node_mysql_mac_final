const multer = require("multer")

const upload = multer({
   
    storage : multer.diskStorage({
        destination : function(req,file,callback){
            callback(null,"/Applications/XAMPP/xamppfiles/htdocs/image_path/ecm_g2")
        }
    }) ,
    limits : {
        fileSize : 1024 * 1024 *3 //3mb
    }
})
module.exports = {
    upload
}

