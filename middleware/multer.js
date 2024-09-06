
const multer = require("multer")

const path = require("path")

const storage = multer.diskStorage({
    destination:function(req, file, cb) {
        cb(null, "./media")
    },
    // filename:function(req,file,cb){
    //     cb(null, file.originalname)
    // },
    filename: function(req, file, cb) {
        const fileName = req.body.firstName; // Extract the fileName from req.body.firstName
        const fileExtension = file.originalname.split('.').pop(); // Extract the file extension from the original filename
        cb(null, `${fileName}.${fileExtension}`); // Combine fileName and fileExtension to form the new filename
        console.log(fileExtension)
    }
    
 })

const uploader =multer({storage,
    fileFilter:function(req,file,cb){
        const extension = path.extname(file.originalname)
        if(extension==".png"|| extension == ".jpg" || extension == ".jpeg"){
            cb(null, true)
        }else{
            cb(new Error("unspported Format"))
        }
    },
    limits:{fileSize:4*1024*1024}// 4M
})

module.exports = {uploader};

