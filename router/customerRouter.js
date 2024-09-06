const express =require('express')
const { validateUser } =require('../middleware/validator')
const {signUpUser, verifyEmail, resendEmail, signIn, forgotPassword, resetPassword, changePassword, signOut, uploadpix, updatePicture, getAllCustomers, getOneCustomer, deleteCustomer } = require('../controller/customerController');
const { authenticate, isAdmin, makeAdmin,  } = require('../middleware/authenAndAuthorize');
const {uploader} = require('../middleware/multer')
const router = express.Router();


router.route('/sign-up').post(validateUser, signUpUser)

router.route("/verifyEmail/:token").post(verifyEmail);
    
router.route("/resendEmail").post(resendEmail);

router.route("/signin").post(signIn);

router.route("/forgotPassword").post(forgotPassword);

router.route("/resetPassword").post(resetPassword);

router.route("/changePassword").post(authenticate, changePassword);
    
router.post('/uploadprofilepix', authenticate, uploader.single('profilePicture'),uploadpix )

router.post('/loadprofilepic', authenticate, uploader.single('profilePicture'),updatePicture )

router.post('/signout', authenticate, signOut);

router.get('/oneCustomer/:customerId', authenticate,  getOneCustomer);

router.post("/makeAdmin",authenticate, makeAdmin);
router.get('/allCustomers', authenticate, isAdmin, getAllCustomers);
router.delete('/deleteCustomer/:customerId', authenticate, isAdmin, deleteCustomer);



module.exports= router;