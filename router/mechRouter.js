
const express =require('express')
const { validateMech, validateUser} =require('../middleware/validator');
const{createMech,verifyEmail,resendEmail,signIn,forgotPassword,resetPassword,changePassword,
    signOut,getOneMech,getAllMech,deleteMech,
    completeProfile,uploadDocument,changeProfilePix
} = require('../controller/mechController')
const { authenticateMech, isAdmin, makeAdmin,  } = require('../middleware/authenAndAuthorize');
const router = express.Router();



router.route('/mech/sign-up').post(validateUser, createMech);

router.route("/mech/verifyEmail/:token").get(verifyEmail);
    
router.route("/mech/resendEmail/:token").get(resendEmail);

router.route("/mech/signin").post(signIn);

router.route("/mech/forgotPassword").post(forgotPassword);

router.route("/mech/resetPassword").post(resetPassword);

router.route("/mech/changePassword/:token").post(authenticateMech, changePassword);

router.post('/mech/signout/', authenticateMech, signOut);

router.get('/oneMech/:mechId', authenticateMech,  getOneMech);

router.post('/mech/completeProfile', validateMech, authenticateMech, completeProfile);
router.post('/mech/uploadDocument', authenticateMech,  uploadDocument);
router.get('/mech/changeProfilePix', authenticateMech,  changeProfilePix);

router.post("/mech/makeAdmin",authenticateMech, makeAdmin);
router.get('/allMech', authenticateMech, isAdmin, getAllMech);
router.delete('/deleteMech/:mechId', authenticateMech, isAdmin, deleteMech);


module.exports= router;