const express = require("express");
const { validateUser } = require("../middleware/validator");
const {
  pendingBooking,
  acceptOrReject,
  bookAppointment,
  getOneBooking,
  getAllBooking,
  rateMechanic,
  completeServiceAndProcessPayment,
  completeBooking,
  koraPayment,
  markNotication,
  get1MechAllNotifications,
  getcustomerNotifications,
} = require("../controller/bookingController");
const {
  authenticate,
  isAdmin,
  makeAdmin,
  authenticateMech,
} = require("../middleware/authenticate");

const router = express.Router();

router.route("/customer-Booking/:mechId").post(authenticate, bookAppointment);
router.route("/pending-Booking").get(authenticate, pendingBooking);
router
  .route("/mech/acceptOrReject/:bookingId")
  .put(authenticate, acceptOrReject);
router.route("/mech/allbookings").get(authenticate, getAllBooking);
router.route("/mech/onebooking/:id").get(authenticate, getOneBooking);
router.post("/complete/Booking/:bookingId", authenticate, completeBooking);
router.post("/rate/:bookingId", authenticate, rateMechanic);
router.post("/complete-service-payment", authenticate, completeServiceAndProcessPayment);
router.post('/work/payment/:bookingId', authenticate, koraPayment)

router.get('/notification', authenticate, )
router.get('/mechanics/notifications', authenticate, get1MechAllNotifications)
router.get('/customers/notifications', authenticate, getcustomerNotifications)
  
router.patch('/markNotification/:notificationId', authenticate,  markNotication)

module.exports = router;
