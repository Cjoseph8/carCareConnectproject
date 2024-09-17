const bookingModel =require('../models/bookingModel');
const Notification=require('../models/notificationModel')
const customerModel = require('../models/customerModel');
const mechModel = require('../models/mechModel');
const sendMailer = require("../middleware/sendMailer")
const {generateBookingEmail} = require('../middleware/html')

        
exports.bookAppointment = async (req, res) => {
    try {
        const customerId = req.user.userId
        const { mechId } = req.params;
        const {brand, service, model, city, year, notes } = req.body;
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
        mechanicId:mechId,
        customerName:customer.fullName,
        mechName:mech.fullName,
        brand, 
        service, 
        model, 
        city, 
        year, 
        notes,
        // status:"pending"
        })
        await booking.save();

         // notify the mechanic
         const verificationLink = "link bookings details";
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

// //   accept or reject a booking
// exports.acceptOrReject= async (req, res) => {
//     try {
//         const {bookingId} = req.params
//         const { action } = req.body; 
//         const mechId = req.user.userId;

//         if (!bookingId || !action || (action !== 'Accept' && action !== 'Reject')) {
//             return res.status(400).json({ message: "Invalid request" });
//         }

//         const booking = await bookingModel.findOne({$and:[{_id:bookingId},{mechanicId:mechId}]});

//         if (!booking) {
//             return res.status(404).json({ message: "Booking not found" });
//         }

//         if (booking.status === 'Accept') {
//             return res.status(404).json({ message: "Booking already approved" });
//         }

//         if (action === 'Accept') {
//             booking.status = 'Accept';
//         } else {
//             booking.status = 'Reject';
//         }

//         await booking.save();

//         res.status(200).json({
//             message: `booking ${action}`
//         })
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

////

exports.acceptOrReject = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { action } = req.body;
        const mechId = req.user.userId;

        if (!bookingId || !action || (action !== 'Accept' && action !== 'Reject')) {
            return res.status(400).json({ message: "Invalid request" });
        }

        const booking = await bookingModel.findOne({ $and: [{ _id: bookingId }, { mechanicId: mechId }] });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status === 'Accept') {
            return res.status(404).json({ message: "Booking already accepted" });
        }
        let notification;
        if (action === 'Accept') {
            booking.status = 'Accept';
            const customer = await customerModel.findById(booking.customerId);
            if (customer) {
                 notification = new Notification({
                    userId: booking.customerId,
                    title: 'Booking Accepted',
                    message: `${booking.mechName} has accepted your booking.`,
                    type: 'Booking Update',
                    read: false
                });
                await notification.save();
            }
        } else {
            booking.status = 'Reject';
        }

        await booking.save();

        res.status(200).json({
            message: `Booking ${action}`,
        data:notification
        });
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
            brand: booking.brand,
            service: booking.service,
            model: booking.model,
            notes: booking.note,
            city: booking.city,
            year: booking.year,
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
            brand: booking.brand,
            service: booking.service,
            model: booking.model,
            notes: booking.note,
            city: booking.city,
            year: booking.year,
            status: booking.status
        }

        res.status(200).json({
            data:details
        })
        
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


// Helper function to calculate average rating
const calculateAverageRating = async (mechId) => {
    const bookings = await bookingModel.find({ mechanicId: mechId, rating: { $ne: null } });
    if (bookings.length === 0) return 0; 

    const totalRating = bookings.reduce((acc, booking) => acc + booking.rating, 0);
    return totalRating / bookings.length;
};

exports.rateMechanic = async (req, res) => {
    try {
        const customerId = req.user.userId; 
        const { bookingId } = req.params;
        const { rating, review } = req.body;

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: 'Rating must be between 1 and 5 stars.'
            });
        }
        // Find the booking
        const booking = await bookingModel.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found.'
            });
        }
        // Ensure the booking is completed
        if (booking.status !== 'Completed') {
            return res.status(400).json({
                message: 'Only completed bookings can be rated.'
            });
        }
        // Check if the customer is the one who made the booking
        if (booking.customerId.toString() !== customerId.toString()) {
            return res.status(403).json({
                message: 'You are not authorized to rate this booking.'
            });
        }
        // Update the booking with the rating and review
        booking.rating = rating;
        booking.review = review;
        await booking.save();

        // Update mechanic's average rating
        const averageRating = await calculateAverageRating(booking.mechanicId);
        const numberOfRatings = await bookingModel.countDocuments({ mechanicId: booking.mechanicId, rating: { $ne: null } });

        await mechModel.findByIdAndUpdate(booking.mechanicId, {
            averageRating,
            numberOfRatings
        });

        res.status(200).json({
            message: 'Rating submitted successfully.',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            message: 'An error occurred while processing your request.',
            errorMessage: error.message
        });
    }
};


exports.checkOutPayment = async(req,res)=>{
    try {
        
    } catch (error) {
        res.status(500).json({
            message: 'An error occurred while processing your request.',
            errorMessage: error.message
        });
    }
}