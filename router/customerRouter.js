const express = require("express");
const { validateUser } = require("../middleware/validator");
const {
  signUpUser,
  verifyEmail,
  resendEmail,
  signIn,
  forgotPassword,
  resetPassword,
  changePassword,
  signOut,
  uploadpix,
  updatePicture,
  getAllCustomers,
  getOneCustomer,
  deleteCustomer,
  makeAdmin,
  approveMech,
  getAllApprovedMechs,
} = require("../controller/customerController");
const { getAllMech, deleteMech }= require("../controller/mechController")
const { authenticate, isAdmin } = require("../middleware/authenticate");
const { uploadSingle } = require("../middleware/multer");
const { adminAuth } = require("../middleware/authorisation");
const router = express.Router();

router.route("/sign-up").post(validateUser, signUpUser);

router.route("/verifyEmail/:token").get(verifyEmail);

router.route("/resendEmail").post(resendEmail);

router.route("/signin").post(signIn);

router.route("/forgotPassword").post(forgotPassword);

router.route("/resetPassword").post(resetPassword);

router.route("/changePassword").post(authenticate, changePassword);

router.post("/uploadprofilepix", authenticate, uploadSingle, uploadpix);

router.post("/loadprofilepic", authenticate, uploadSingle, updatePicture);

router.post("/signout", authenticate, signOut);

router.get("/oneCustomer/:customerId", adminAuth, getOneCustomer);

router.post("/makeAdmin", adminAuth, makeAdmin);
router.get("/allCustomers", adminAuth, getAllCustomers);
router.delete(
  "/deleteCustomer/:customerId",
  adminAuth,
  deleteCustomer
);

router.get('/allMech', authenticate ,getAllMech);
router.delete('/deleteMech/:mechId', adminAuth, deleteMech);

router.put('/mechanics/approve/:mechId', adminAuth, approveMech);

router.get('/mechanics/approved',  adminAuth, getAllApprovedMechs);


module.exports = router;
