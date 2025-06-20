const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    phoneNumber: { type: String, required: true },

    position: { type: String, default: "customer" },

    lastLogoutTime: { type: Date, default: null },

    password: { type: String, required: true },

    profilePicture: {
      pictureId: String,
      pictureUrl: String,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    wallet: {
      balance: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastTransactionDate: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

const customerModel = mongoose.model("customer", customerSchema);

module.exports = customerModel;
