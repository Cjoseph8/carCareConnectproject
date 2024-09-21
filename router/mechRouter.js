
const express =require('express')
const { validateMech, validateUser} =require('../middleware/validator');
const{createMech,verifyEmail,resendEmail,signIn,forgotPassword,resetPassword,changePassword,
    signOut,getOneMech,getAllMech,deleteMech,
    completeProfile,uploadDocument,changeProfilePix,
    updateMechProfile,
    updateProfessionFields
} = require('../controller/mechController');
const { isAdmin, makeAdmin, authenticate,  } = require('../middleware/authenticate');
const { uploadMultiple } = require('../middleware/multer');
const router = express.Router();



router.route('/mech/sign-up').post(validateUser, createMech);

router.route("/mech/verifyEmail/:token").patch(verifyEmail);
    
// router.route("/mech/resendEmail").get(resendEmail);

// router.route("/mech/signin").post(signIn);

// router.route("/mech/forgotPassword").post(forgotPassword);

router.route("/mech/resetPassword").post(resetPassword);

router.route("/mech/changePassword/:token").post(authenticate, changePassword);

router.post('/mech/signout', authenticate, signOut);

router.get('/oneMech/:mechId', authenticate,  getOneMech);

router.post('/mech/completeProfile', validateMech, uploadMultiple, completeProfile);
// router.post('/mech/uploadDocument', authenticateMech, uploadMultiple, uploadDocument);
router.get('/mech/changeProfilePix', authenticate,  changeProfilePix);
router.get('/mech/updatePersonal', authenticate, updateMechProfile);
router.get('/mech/updateprofession', authenticate, updateProfessionFields)
// router.post("/mech/makeAdmin",authenticate);



module.exports= router;