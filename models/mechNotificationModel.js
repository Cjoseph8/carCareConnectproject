const mongoose = require('mongoose');

const mechanicNotificationSchema = new mongoose.Schema({
    mechanicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mech', 
        
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer', 
        
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

// Use PascalCase for model name
const MechanicNotification = mongoose.model('mechanicNotification', mechanicNotificationSchema);

module.exports = MechanicNotification;

