
const express =require('express')
const { validateUser } =require('../middleware/validator')
const {pendingBooking, acceptOrReject,  bookAppointment, getOneBooking, getAllBooking, rateMechanic} = require('../controller/bookingController');
const { authenticate, isAdmin, makeAdmin, authenticateMech,  } = require('../middleware/authenticate');

const router = express.Router();

router.route("/customer-Booking/:mechId").post(authenticate, bookAppointment )
router.route("/pending-Booking").get(authenticate, pendingBooking)
router.route("/mech/acceptOrReject/:bookingId").put(authenticate, acceptOrReject)
router.route("/mech/mybookings").get(authenticate, getAllBooking)
router.route("/mech/viewbooking/:id").get(authenticate, getOneBooking)
router.post('/rate/:bookingId', authenticate, rateMechanic);


module.exports = router