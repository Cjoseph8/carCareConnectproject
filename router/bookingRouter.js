
const express =require('express')
const { validateUser } =require('../middleware/validator')
const {pendingBooking, acceptOrReject,  bookAppointment, getOneBooking, getAllBooking } = require('../controller/bookingController');
const { authenticate, isAdmin, makeAdmin,  } = require('../middleware/authenAndAuthorize');

const router = express.Router();

router.route("/customer-Booking/:mechId").post(authenticate, bookAppointment )
router.route("/pending-Booking").get(authenticate, pendingBooking)
router.route("/mech/acceptOrReject/:bookingId").put(authenticate, acceptOrReject)
router.route("/mech/mybookings").get(authenticate, getAllBooking)
router.route("/mech/viewbooking/:id").get(authenticate, getOneBooking)


module.exports = router