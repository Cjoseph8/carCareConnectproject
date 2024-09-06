
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
    
  },
  mechanicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mech'
    
  },
  customerName:{
    type:String,
  },

  mechName:{
    type:String,
  },

  vehicle: {
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
   licensePlate: { type: String, required: true }
  },
  service: {
    type: String
  },
  appointment: {
    date: { type: String, required: true },
    time: { type: String, required: true }
  },
  location:{type:String, required:true},
  notes: { type: String },

  status: {
    type: String,
    enum: ['Pending', 'Accept', 'Reject'],
    default: 'Pending'
}
}, { timestamps: true });

const bookingModel = mongoose.model('Booking', bookingSchema);

module.exports = bookingModel;
