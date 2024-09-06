const bookingModel =require('../models/bookingModel');
const customerModel = require('../models/customerModel');
const mechModel = require('../models/mechModel');
const sendMailer = require("../middleware/sendMailer")
const {generateBookingEmail} = require('../middleware/html')

        
exports.bookAppointment = async (req, res) => {
    try {
        const customerId = req.user.userId
        const { mechId } = req.params;
        const {vehicle, service, appointment, location, notes } = req.body;
        const customer = await customerModel.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                message: 'customer not found'
            })
        };
        const mech = await mechModel.findById(mechId)
        if (!mech) {
            return res.status(404).json({
                message: 'mechanic not found'
            })
        };

        // Create an Instance of the booking
    const booking = new bookingModel({
        customerId,
        mechId,
        customerName:customer.fullName,
        mechName:mech.fullName,
        vehicle,
        service,
        appointment,
        notes,
        location
        })
        await booking.save();

         // notify the mechanic
         const verificationLink = "link to booking details";
         const emailSubject = 'BOOKINGS';
         const html = generateBookingEmail(mech.fullName, verificationLink);
         // using nodemailer to send mail to our user
         const mailOptions = {
             from: process.env.mailUser,
             to: mech.email, // Use the user's email address here
             subject: emailSubject,
             html: html
         };
 
         await sendMailer(mailOptions);

        res.status(201).json({
            message: `You have Successfully Booked an Appointment with ${booking.mechName}, please hold on for his responds. `,
            data: booking
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}
    

exports.pendingBooking= async (req, res) => {
    try {
        const mechanicId = req.user.userId; 
        if (!mechanicId) {
            return res.status(400).json({ message: "Mechanic not logged in" });
        }

        const bookings = await bookingModel .find({ mechanicId, status: 'Pending' }).populate('customerId');
        res.render('pendingBooking', { bookings });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

//   accept or reject a booking
exports.acceptOrReject= async (req, res) => {
    try {
        const {bookingId} = req.params
        const { action } = req.body; 
        const mechanicId = req.user.userId;

        if (!bookingId || !action || (action !== 'Accept' && action !== 'Reject')) {
            return res.status(400).json({ message: "Invalid request" });
        }

        const booking = await bookingModel.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (action === 'Accept') {
            booking.status = 'Accept';
        } else {
            booking.status = 'Reject';
        }

        await booking.save();

        res.status(200).json({
            message: `booking ${action}`
        })
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// get all booking attached to a single user
exports.getAllBooking = async(req,res)=>{
    try {

        // get the user's id
        const userId = req.user.userId
        
        // find all bookings attache to the user
        const user = await bookingModel.find({$or:[{customerId:userId},{mechanicId:userId}]})
        if(!user || user.length === 0){
            return res.status(404).json({
                message:"No booking found"
            })
        }

        // Map through the bookings to format the response
        const details = user.map(booking => ({
            id: booking._id,
            customer: booking.customerName,
            mechanic: booking.mechName,
            vehicle: booking.vehicle,
            service: booking.service,
            appointment: booking.appointment,
            notes: booking.note,
            location: booking.location,
            status: booking.status
        }));

        res.status(200).json({
            data:details
        })
        
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// get all booking attached to a single user
exports.getOneBooking = async(req,res)=>{
    try {

        // get the user's id
        const userId = req.params.id
        
        // find all bookings attache to the user
        const user = await bookingModel.findById(userId)
        if(!user){
            return res.status(404).json({
                message:"No booking found"
            })
        }

        const details = {
            id:user._id,
            customer:user.customerName,
            mechanic: user.mechName,
            vehicle:user.vehicle,
            service:user.service,
            appointment:user.appointment,
            notes:user.notes,
            location:user.location,
            status:user.status
        }

        res.status(200).json({
            data:details
        })
        
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

