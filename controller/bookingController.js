
require('dotenv').config();
const bookingModel = require('../models/bookingModel');
const CustomerNotification = require('../models/customerNotificationModel');
const MechanicNotification = require('../models/mechNotificationModel');
const customerModel = require('../models/customerModel');
const mechModel = require('../models/mechModel');
const sendMailer = require("../middleware/sendMailer");
const { generateBookingEmail } = require('../middleware/html');

// Function to book an appointment
exports.bookAppointment = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const { mechId } = req.params;
        const { brand, service, model, city, year, notes, date, time } = req.body;

        // Find the customer
        const customer = await customerModel.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Find the mechanic
        const mech = await mechModel.findById(mechId);
        if (!mech) {
            return res.status(404).json({ message: 'Mechanic not found' });
        }

        // Check for existing bookings
        const existingBooking = await bookingModel.findOne({
            customerId,
            mechanicId: mechId,
            $or: [{ status: 'Accept' }, { status: 'Pending' }]
        });

        const now = new Date();

        if (existingBooking) {
            const bookingTime = new Date(existingBooking.createdAt);
            const timeDiff = (now - bookingTime) / (1000 * 60); // Time difference in minutes

            if (existingBooking.status === 'Accept' && timeDiff < 180) {
                return res.status(400).json({
                    message: 'You cannot book again until 3 hours have passed since your last accepted appointment. Please be patient.'
                });
            } else if (existingBooking.status === 'Pending' && timeDiff < 30) {
                return res.status(400).json({
                    message: 'You cannot book again until 30 minutes have passed since your last pending appointment.'
                });
            }
        }

        // Create a new booking instance
        const booking = new bookingModel({
            customerId,
            mechanicId: mechId,
            customerName: customer.fullName,
            mechName: mech.fullName,
            brand,
            service,
            model,
            city,
            date,
            time,
            year,
            notes,
            status: 'Pending'
        });

        // Save the booking
        const savedBooking = await booking.save();

        // Notify the mechanic via email
        const verificationLink = "https://car-care-g11.vercel.app/#/app/mech/booking"; 
        const emailSubject = 'New Booking Request';
        const html = generateBookingEmail(mech.fullName, verificationLink);

        // Prepare email options
        const mailOptions = {
            from: process.env.mailUser,
            to: mech.email,
            subject: emailSubject,
            html: html
        };

        // Send email to the mechanic
        await sendMailer(mailOptions);

        // Create a notification for the mechanic
        const mechanicNotification = new MechanicNotification({
            customerId: customer._id,
            mechanicId: mech._id,
            title: 'New Booking Request',
            message: `You have a new booking request from ${customer.fullName} for ${service.join(', ')} service.`,
            type: 'Booking Request',
            read: false
        });

        await mechanicNotification.save();

        // Respond to the customer
        res.status(201).json({
            message: `You have successfully booked an appointment with ${savedBooking.mechName}. Please hold on for their response.`,
            data: savedBooking
        });

    } catch (error) {
        console.error('Error booking appointment:', error); 
        res.status(500).json({
            message: 'An error occurred while booking the appointment.',
            error: error.message 
        });
    }
};


exports.get1MechAllNotifications = async (req, res) => {
    try {
        const {userId} = req.user; // Get the mechanic ID from the authenticated request

        // Find notifications for the mechanic
        const notifications = await MechanicNotification.find({ mechanicId: userId }).sort({ createdAt: -1 }) || await CustomerNotification.find({ customerId: userId }).sort({ createdAt: -1 });
        console.log('Number of notifications found:', notifications.length); // Log the count of notifications

        if (!notifications || notifications.length === 0) {
            return res.status(404).json({ message: 'No notifications found for this mechanic.' });
        }
        res.status(200).json({
            message: 'Notifications retrieved successfully.',
            data: notifications
        });
    } catch (error) {
        console.error('Error retrieving mechanic notifications:', error);
        res.status(500).json({ message: 'An error occurred while retrieving notifications.', error: error.message });
    }
};


exports.getcustomerNotifications = async (req, res) => {
    try {
        const {userId} = req.user; // Assuming the user is authenticated as a mechanic
        
        const notifications = await CustomerNotification.find({ customerId:userId }).sort({ createdAt: -1 });

        if (!notifications.length) {
            return res.status(404).json({ message: 'No notifications found for this customer.' });
        }

        res.status(200).json({
            message: 'Notifications retrieved successfully.',
            data: notifications
        });
    } catch (error) {
        console.error('Error retrieving notifications:', error);
        res.status(500).json({ message: 'An error occurred while retrieving notifications.', error: error.message });
    }
};


exports.markNotication= async (req, res) => {
    try {
        const { notificationId } = req.params;
        let notification;
        // Find the notification and update it
         notification = await CustomerNotification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
         notification = await MechanicNotification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found.' });
        }

        res.status(200).json({
            message: 'Notification marked as read.',
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'An error occurred while marking the notification as read.', error: error.message });
    }
};


exports.completeServiceAndProcessPayment = async (req, res) => {
    try {
        const { bookingId, paymentAmount } = req.body;
        const booking = await bookingModel.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found'
            });
        }

        // Ensure the service is completed
        if (booking.statusCompleted !== 'Completed') {
            return res.status(400).json({
                message: 'Service must be completed before processing payment.'
            });
        }

        const customer = await customerModel.findById(booking.customerId);
        if (!customer || customer.wallet < paymentAmount) {
            return res.status(400).json({
                message: 'Insufficient wallet balance to process payment.'
            });
        }

        // Calculate the admin fee
        const adminFee = paymentAmount * 0.05; // 5% deduction
        const mechanicPayment = paymentAmount - adminFee; // Amount to pay the mechanic

        // Update wallets
        await updateWallet(customer._id, false, paymentAmount, 'debit', 'Payment for completed service');
        await updateWallet(booking.mechanicId, true, mechanicPayment, 'credit', 'Payment received for completed service');
        
        // Update admin wallet directly from the customer model
        await customerModel.findByIdAndUpdate(process.env.ADMIN_ACCOUNT_ID, {
            $inc: { wallet: adminFee } // Increment admin's wallet by admin fee
        });

        // Call the cashback function
        const cashbackResponse = await processCashback(booking.mechanicId);

        res.status(200).json({
            message: 'Service completed, payment processed, and cashback applied if eligible.',
            cashback: cashbackResponse,
            data: booking
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};



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
        //send notification to customer
        let notification;
        if (action === 'Accept') {
            booking.status = 'Accept';
            const customer = await customerModel.findById(booking.customerId);
            if (customer) {
                 notification = new CustomerNotification({
                    customerId: booking.customerId,
                    mechanicId:mechId,
                    title: 'Booking Accepted',
                    message: `${booking.mechName} has accepted your booking.`,
                    type: 'Booking Request',
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
            notes: booking.notes,
            city: booking.city,
            year: booking.year,
            status: booking.status,
            date: booking.date,
            time: booking.time,
            location: booking.location
        }));

        res.status(200).json({
            number:user.length,
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
            status: booking.status,
            date: booking.date,
            time: booking.time,
            location: booking.location
        }

        res.status(200).json({
            data:details
        })
        
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.completeBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const mechId = req.user.userId
        const booking = await bookingModel.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        // // Check if the user is authorized to complete this booking (e.g., mechanic)
        // if (booking.mechanicId.toString() !== ) {
        //     return res.status(403).json({ message: 'Not authorized to complete this booking.' });
        // }

        const mech = await mechModel.findById(mechId);


        // Update the booking status and service charge
        booking.status = 'Completed';
        await booking.save();

        // mech.wallet += booking.serviceCharge
        await mech.save()

        // Create a notification for the customer
        const notification = new CustomerNotification({
            customerId: booking.customerId,
            mechanicId: booking.mechanicId,
            title: 'Booking Completed',
            message: `Your booking for ${booking.service}, has been completed. Your car is now ready for the road! Service charge: $${serviceCharge}.`,
            type: 'Booking Request',
            read: false
        });
        
        await notification.save();

        res.status(200).json({
            message: 'Your car is now ready for the road. Service successful.',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            message: 'An error occurred while completing the booking.',
            error: error.message
        });
    }
};





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


// Payment endpoint
exports.koraPayment = async (req, res) => {
    const { bookingId } = req.params;
    const { amount } = req.body; // Amount should be passed in the request body

    try {
        // Find the booking
        const booking = await bookingModel.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        // Calculate the amounts
        const serviceCharge = amount * 0.10; // 10% service charge
        const mechanicPayment = amount - serviceCharge; // 90% to mechanic

        // Simulate payment processing with KoraPay or Paystack here
        // For example, you would call the Paystack API or KoraPay API

        // Assuming payment is successful, update the mechanic's wallet
        await mechModel.findByIdAndUpdate(booking.mechanicId, {
            $inc: { 'wallet.balance': mechanicPayment }
        });

        // Update booking status or add any other logic here
        booking.status = 'Paid'; // Update status if necessary
        await booking.save();

        res.status(200).json({
            message: 'Payment processed successfully.',
            data: {
                serviceCharge,
                mechanicPayment,
                bookingId,
            }
        });
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({
            message: 'An error occurred while processing the payment.',
            error: error.message,
        });
    }
};


