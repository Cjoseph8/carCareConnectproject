const multer = require("multer");
const path = require("path");

// Define storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./media"); // Destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        const fileName = req.body.firstName || 'default'; // Use default if firstName is not available
        const fileExtension = path.extname(file.originalname);
        cb(null, `${fileName}${fileExtension}`);
    }
});

// File filter function
const fileFilter = function (req, file, cb) {
    const extension = path.extname(file.originalname);
    if ([".png", ".jpg", ".jpeg"].includes(extension)) {
        // Validate file size based on fieldname
        if (file.fieldname === 'profilePicture' && file.size > 2 * 1024 * 1024) { // 2MB limit for profilePicture
            cb(new Error("Profile picture is too large"));
        } else if (file.fieldname === 'identification' && file.size > 4 * 1024 * 1024) { // 4MB limit for identification
            cb(new Error("Identification document is too large"));
        } else if (file.fieldname === 'certification' && file.size > 3 * 1024 * 1024) { // 3MB limit for certification
            cb(new Error("Certification document is too large"));
        } else if (file.fieldname === 'insurance' && file.size > 5 * 1024 * 1024) { // 5MB limit for insurance
            cb(new Error("Insurance document is too large"));
        } else {
            cb(null, true);
        }
    } else {
        cb(new Error("Unsupported format"));
    }
};

// Create upload instances for single and multiple files
const uploadSingle = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Set a global size limit
}).single('profilePicture'); // Adjust fieldname for single file upload

const uploadMultiple = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Set a global size limit
}).fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'identification', maxCount: 1 },
    { name: 'certification', maxCount: 1 },
    { name: 'insurance', maxCount: 1 }
]);

module.exports = { uploadSingle, uploadMultiple };
