const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    mechanicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mech",
    },
    customerName: {
      type: String,
    },
    mechName: {
      type: String,
    },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    service: {
      type: Array,
      required: true,
    },
    serviceType:{ type: String },
    date: { type: String },
    time: { type: String },
    city: { type: String, required: true },
    notes: { type: String },
    serviceCharge: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Accept", "Reject",'Completed'],
      default: "Pending",
    },
    statusCompleted: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const bookingModel = mongoose.model("Booking", bookingSchema);

module.exports = bookingModel;
