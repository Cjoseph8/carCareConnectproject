const mongoose = require('mongoose');

const mechSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    position: {
        type: String,
        default: 'mechanic'
    },
    password: {
        type: String,
        required: true
    },
    blackList: {
        type: [String],
        default: []
    },
    businessName: {
        type: String
    },
    businessAddress: {
        type: String
    },
    areaOfSpecialization: {
        type: String
    },
    yearsOfExperience: {
        type: String
    },
    businessRegNumber: {
        type: String
    },
    isProfileComplete: {
        type: Boolean,
        default: false
    },
    profilePicture: {
        pictureId: {
            type: String
        },
        pictureUrl: {
            type: String
        }
    },
    Identification: {
        fileId: {
            type: String
        },
        fileUrl: {
            type: String
        }
    },
    certification: {
        fileId: {
            type: String
        },
        fileUrl: {
            type: String
        }
    },
    insurance: {
        fileId: {
            type: String
        },
        fileUrl: {
            type: String
        }
    },
    wallet: {
        type: Number,
        default: 0.00
    },
    averageRating: {
        type: Number,
        default: 0
    },
    request: {
        type: String,
        enum: ["Service Request", "Accepted Request", "Declined Request", "Completed Request"]
    },
    numberOfRatings: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    approved: {
        type: String,
        enum: ["Pending", "Approved", "Reject"],
        default: "Pending"
    }
}, { timestamps: true });

const mechModel = mongoose.model('Mech', mechSchema);

module.exports = mechModel;
