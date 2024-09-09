
const mongoose =require("mongoose")

const mechSchema = new mongoose.Schema({

    fullName:{type:String,required:true},

    email:{type:String, required:true,unique:true},

    phoneNumber:{type:String, required:true},

    password:{type:String, required:true},
    

    blackList:{type:Array, default: []},

    

    businessName: { type: String},

    businessAddress:{type:String},

     areaOfSpecialization:{type:String},

     yearsOfExperience:{type:String},

     businessRegNumber:{type:String},

     isProfileComplete: { type: Boolean, default: false },
    profilePicture: {
        pictureId: { type: String },
        pictureUrl: { type: String }
    },
    businessLicense: {
        fileId: { type: String },
        fileUrl: { type: String }
    },
    wallet:{
        type:Number,
        default:0.00
    },
    certification: {
        fileId: { type: String },
        fileUrl: { type: String }
    },

    averageRating: {
        type: Number,
        default: 0
      },
      numberOfRatings: {
        type: Number,
        default: 0
      },

    isVerified:{
        type: Boolean,
        default:false
    },
      

}, {timestamps:true});

const mechModel = mongoose.model('mech',mechSchema)

module.exports = mechModel;