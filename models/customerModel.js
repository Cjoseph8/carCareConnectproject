
const mongoose =require("mongoose")

const customerSchema = new mongoose.Schema({

    fullName:{type:String, required:true},

    email:{type:String, required:true, unique:true},

    phoneNumber:{type:String, required:true},

    blackList:{type:Array, default: []},

    password:{type:String, required:true},

    // gender:{type:String, enum:['Male', 'Female'] ,required:true},

    profilePicture:{
        pictureId:String,
        pictureUrl:String,
       
    
    },

    isVerified:{
        type: Boolean,
        default:false
    },
    
    isAdmin:{
        type:Boolean,
        default:false
    },  
    

}, {timestamps:true});

const customerModel = mongoose.model('customer',customerSchema)

module.exports = customerModel;