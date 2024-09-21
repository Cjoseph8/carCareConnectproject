
require('dotenv').config();
const bookingModel =require('../models/bookingModel');
const Notification=require('../models/notificationModel')
const customerModel = require('../models/customerModel');
const mechModel = require('../models/mechModel');
const sendMailer = require("../middleware/sendMailer")
const {generateBookingEmail} = require('../middleware/html')

        
// Wallet  functions 
// async function updateWallet(userId, isMechanic, amount, type, description) {
//     try {
//         const Model = isMechanic ? mechModel : customerModel;
//         const walletUser = await Model.findById(userId);

//         if (!walletUser) throw new Error('User not found');

//         // Update the balance based on the transaction type
//         if (type === 'credit') {
//             walletUser.wallet += amount;
//         } else if (type === 'debit') {
//             if (walletUser.wallet < amount) throw new Error('Insufficient balance');
//             walletUser.wallet -= amount;
//         } else {
//             throw new Error('Invalid transaction type');
//         }
//         // Log the transaction (optional)
//         if (!walletUser.wallet.transactions) {
//             walletUser.wallet.transactions = [];
//         }
//         walletUser.wallet.transactions.push({ amount, type, description });
//         await walletUser.save();
//     } catch (error) {
//         console.error('Error updating wallet:', error);
//         throw error;
//     }
// };
// //cash back function
// async function processCashback(mechanicId) {
//     try {
//         // Fetch the mechanic and their completed bookings
//         const mechanic = await mechModel.findById(mechanicId);
//         if (!mechanic) throw new Error('Mechanic not found');

//         // Count the number of completed services
//         const completedServicesCount = await bookingModel.countDocuments({
//             mechanicId,
//             status: 'Completed'
//         });

//         // Check if the mechanic is eligible for cashback
//         if (completedServicesCount > 0 && completedServicesCount % 5 === 0) {
//             const cashbackAmount = 10; // Define cashback amount

//             // Credit the cashback to the mechanic's wallet
//             mechanic.wallet += cashbackAmount;
//             await mechanic.save();

//             console.log(`Cashback of ${cashbackAmount} credited to mechanic ${mechanic.fullName}'s wallet.`);
//             return {
//                 message: `Cashback of ${cashbackAmount} credited successfully.`,
//                 balance: mechanic.wallet
//             };
//         } else {
//             return {
//                 message: 'No cashback eligible at this time.',
//                 completedServicesCount
//             };
//         }
//     } catch (error) {
//         console.error('Error processing cashback:', error);
//         throw error;
//     }
// };


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
            $or: [
                { status: 'Accept' },
                { status: 'Pending' }
            ]
        });

        const now = new Date();

        if (existingBooking) {
            const bookingTime = new Date(existingBooking.createdAt);
            const timeDiff = (now - bookingTime) / (1000 * 60); // Time difference in minutes

            if (existingBooking.status === 'Accept') {
                // Allow booking only if 3 hours have passed
                if (timeDiff < 180) {
                    return res.status(400).json({
                        message: 'You cannot book again until 3 hours have passed since your last accepted appointment. Please be patient.'
                    });
                }
            } else if (existingBooking.status === 'Pending') {
                // Allow booking only if 30 minutes have passed
                if (timeDiff < 30) {
                    return res.status(400).json({
                        message: 'You cannot book again until 30 minutes have passed since your last pending appointment.'
                    });
                }
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

        // Notify the mechanic
        const verificationLink = "link to booking details"; 
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
        const notification = new Notification({
            userId: mech._id,
            title: 'New Booking Request',
            message: `You have a new booking request from ${customer.fullName} for ${service.join(', ')} service.`,
            type: 'Booking Request',
            read: false
        });
        
        await notification.save();

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
        let notification;
        if (action === 'Accept') {
            booking.status = 'Accept';
            const customer = await customerModel.findById(booking.customerId);
            if (customer) {
                 notification = new Notification({
                    userId: booking.customerId,
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

        mech.wallet += booking.serviceCharge
        await mech.save()

        // Create a notification for the customer
        const notification = new Notification({
            userId: booking.customerId, 
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

