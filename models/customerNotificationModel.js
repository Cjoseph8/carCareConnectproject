const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer', 
        
    },
    mechanicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mech', 
        
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Booking Request', 'Promotion', 'System Alert', 'Status Update'], 
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const customerNotificationModel = mongoose.model('customerNotificationModel', notificationSchema);

module.exports = customerNotificationModel;
