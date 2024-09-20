
const customerModel =require('../models/customerModel');
const mechModel = require('../models/mechModel')
const jwt = require('jsonwebtoken')
const bcrypt= require('bcryptjs')
require('dotenv').config()
const sendMailer = require("../middleware/sendMailer")
const {generateWelcomeEmail, ForgetPasswordEmail} = require('../middleware/html')
const { validateUser } = require('../middleware/validator');
const cloudinary = require('../middleware/cloudinary')
const fs = require('fs')


//Creating the sign Up
exports.signUpUser = async (req, res) => {
    try {
        // Destructuring from req.body(dataBase)
        const { fullName, email, password, phoneNumber } = req.body;
        
        const existingEmail = await customerModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        const existingnum = await customerModel.findOne({phoneNumber});
        if(existingnum){
            return res.status(400).json({message:'User with this PhoneNumber already exist.' })
        }
// using bcrypt to salt and hash our 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hashSync(password, salt);

        // verify the fullname input
        const splitName = fullName.split(" ")
        const removeSpace = splitName.filter(space => space !== '')
        const slicedName = removeSpace[0].charAt(0).toUpperCase() + removeSpace[0].slice(1).toLowerCase()
        const slicedName2 = removeSpace[1].charAt(0).toUpperCase() + removeSpace[1].slice(1).toLowerCase()

       // For users Requirement to fill
        const user = new customerModel({
            fullName:`${slicedName} ${slicedName2}`,
            email:email.toLowerCase().trim(),
            password: hashedPassword,
            phoneNumber,
    
        });
        // save the above
        const createdUser = await user.save();

       //using jwt to sign in    ( user identity )                                    (Your secret)            (Duration )
        const token = jwt.sign({ email: createdUser.email, userId: createdUser._id }, process.env.secret_key, { expiresIn: "1d" });

        // Send verification mail `${req.protocol}://${req.get("host")}/api/v1/users/verify/${token}`
        const verificationLink =` https://car-care-g11.vercel.app/#/verifyEmail/${token}`;
        const emailSubject = 'Verification Mail';
        const html = generateWelcomeEmail(createdUser.fullName, verificationLink);
        // using nodemailer to send mail to our user
        const mailOptions = {
            from: process.env.mailUser,
            to: email, // Use the user's email address here
            subject: emailSubject,
            html: html
        };

        await sendMailer(mailOptions);

        return res.status(200).json({ 
            message: `Successfully created please check your email: ${ createdUser.email} and click the link below for verification`, 
            createdUser, 
            token });
    } catch (error) {
        
        return res.status(500).json(error.message);
    }
};

//create an end point to verify users email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(404).json({
                error: "Token not found"
            })
        }

        // verify the token
        const { email } = jwt.verify(token, process.env.secret_key);

        const createdUser = await customerModel.findOne({email});

        if (!createdUser) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        // Check if user has already been verified
        if (createdUser.isVerified) {
            return res.status(400).json({
                error: "User already verified"
            });
        }

        // update the user verification
        createdUser.isVerified = true;

        // save the changes
        await createdUser.save();

        res.json(200).json({
            message:'successful',
            data:createdUser.position
        })
    
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(404).json({
                message: "Try Again please."
            });
        }
        res.status(500).json({
            message: error.message
        })
    }
}

exports.resendEmail = async (req, res) => {
    try {
        // Get user email from request body
        const { email } = req.body;

        // Try to find the user in the customer model
        let user = await customerModel.findOne({ email });
        
        // If not found, try to find the user in the mechanic model
        if (!user) {
            user = await mechModel.findOne({ email });
        }

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if the user has already been verified
        if (user.isVerified) {
            return res.status(400).json({ error: "User already verified" });
        }

        // Create a token
        const token = await jwt.sign({ email }, process.env.secret_key, { expiresIn: "5m" });

        // Generate the verification link
        const verificationLink = `https://car-care-g11.vercel.app/#/verifyEmail/${token}`;
        const emailSubject = 'Verification Mail';
        const html = generateWelcomeEmail(user.fullName, verificationLink);

        // Prepare email options
        const mailOptions = {
            from: process.env.mailUser,
            to: user.email, // Use the user's email address here
            subject: emailSubject,
            html: html
        };

        // Send verification email
        await sendMailer(mailOptions);

        res.status(200).json({
            message: `Verification email sent successfully to your email: ${user.email}`
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


exports.signIn = async (req, res) => {
    const { email, password } = req.body;
    const data = { email: email.toLowerCase(), password };

    try {
        const existingCustomer = await customerModel.findOne({ email: data.email });
        const existingMechanic = await mechModel.findOne({ email: data.email });

        // Determine the current hour for greeting
        const currentHour = new Date().getHours();
        let greetingMessage;

        if (currentHour >= 5 && currentHour < 12) {
            greetingMessage = "Good Morning";
        } else if (currentHour >= 12 && currentHour < 17) {
            greetingMessage = "Good Afternoon";
        } else {
            greetingMessage = "Good Evening";
        }

        // Check if customer exists
        if (existingCustomer) {
            if (!existingCustomer.isVerified) {
                return res.status(400).json({ message: "Your email is not yet verified" });
            }

            const isPasswordMatch = await bcrypt.compare(data.password, existingCustomer.password);
            if (isPasswordMatch) {
                // Generate a JWT token
                const token = jwt.sign(
                    { userId: existingCustomer._id, isAdmin: existingCustomer.isAdmin },
                    process.env.secret_key,
                    { expiresIn: '1d' }
                );

                return res.status(200).json({ 
                    message: `${greetingMessage}, ${existingCustomer.fullName}! Welcome back to our platform!`, 
                    data: existingCustomer,
                    token 
                });
            } else {
                return res.status(400).json({ message: "Incorrect password" });
            }
        }

        // Check if mechanic exists
        if (existingMechanic) {
            if (!existingMechanic.isVerified) {
                return res.status(400).json({ message: "Your email is not yet verified" });
            }

            const isPasswordMatch = await bcrypt.compare(data.password, existingMechanic.password);
            if (isPasswordMatch) {
                // Generate a JWT token
                const token = jwt.sign(
                    { userId: existingMechanic._id, isAdmin: existingMechanic.isAdmin },
                    process.env.secret_key,
                    { expiresIn: '1d' }
                );

                return res.status(200).json({ 
                    message: `${greetingMessage}, ${existingMechanic.fullName}! Welcome back to our platform!`, 
                    data: existingMechanic,
                    token 
                });
            } else {
                return res.status(400).json({ message: "Incorrect password" });
            }
        }

        // If no user found in both models
        return res.status(400).json({ message: "User not found" });

    } catch (error) {
        // Handle unexpected errors
        return res.status(500).json({ message: error.message });
    }
};



exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if the email exists in the userModel
        const user = await customerModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Generate a reset token
        const resetToken = await jwt.sign({ userId: user._id }, process.env.secret_key, { expiresIn: "30m" });

        // Send verification mail
        const verificationLink = " ";
        const emailSubject = 'Verification Mail';
        const html = ForgetPasswordEmail(user.fullName, verificationLink);
        // using nodemailer to send mail to our user
        const mailOptions = {
            from: process.env.mailUser,
            to: email, // Use the user's email address here
            subject: emailSubject,
            html: html
        };

        await sendMailer(mailOptions);

        res.status(200).json({
            message: "Password reset email sent successfully",
            data: resetToken
        });
    } catch (error) {
        console.error("Something went wrong", error.message);
        res.status(500).json({
            message: error.message
        });
    }
};


// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Verify the user's token
        const decodedToken = jwt.verify(token, process.env.secret_key);

        // Get the user's Id from the token
        const userId = decodedToken.userId;

        // Find the user by ID
        const user = await customerModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Salt and hash the new password
        const saltedRound = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, saltedRound);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            message: "Password reset successful"
        });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(404).json({
                message: " timed-out, please Log-in again to continue ."
            });
        }
        console.error("Something went wrong", error.message);
        res.status(500).json({
            message: error.message
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        const userId = req.user.userId
        // Find the user by ID
        const user = await customerModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                message: "Old password and new password are required"
            });
        }

        // Verify the old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Old password is incorrect"
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            message: "Password changed successfully"
        });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                message: "Try Again timed-out."
            });
        }
        console.error("Error changing password", error.message);
        res.status(500).json({
            message: "An error occurred while processing your request"
        });
    }
};

// User sign out
exports.signOut = async (req, res) => {
    try {
        const userId = req.user.userId
        // Find the user by email
        const user = await customerModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found.',
            });
        }

        const hasAuthorization = req.headers.authorization;

        if (!hasAuthorization) {
            return res.status(401).json({
                message: 'Token not found'
            });
        }

        const token = hasAuthorization.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: 'Please log in to continue.'
            });
        }

        // Check if the token is already blacklisted
        if (user.blackList.includes(token)) {
            return res.status(400).json({
                message: 'user already logged out.',
            });
        }

        // Add the token to the blacklist and save the user
        user.blackList.push(token);
        await user.save();

        // Respond with success
        return res.status(200).json({
            message: 'You have logged out successfully.',
        });
    } catch (error) {
        // Handle errors
        return res.status(500).json({
            message: 'An error occurred during sign-out.',
            error: error.message,
        });
    }
};

exports.uploadpix = async (req, res) => {
    try {
        // console.log('Files: ',req.file)
        // console.log('Profile Picture: ',req.file.filename)
        if (!req.file) {
            return res.status(400).json({ message: "Kindly upload your profile picture" });
        }

        // Upload the file to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, { folder: "users_dp" });

        const userId = req.user.userId;

        if (!userId) {
            return res.status(400).json({ message: "login to continue" });
        }
        const pictureUpdate= {profilePicture:{
            pictureId:result.public_id,
            pictureUrl:result.secure_url 
        }}
        await fs.unlink(req.file.path,(err,data)=>{
            if(err){
               console.log("not deleted")

            }
            else{
                console.log("successfully deleted",req.file.path)

            }  
        })
        // Update the user's profile with the Cloudinary URL
        const updatedUser = await customerModel.findByIdAndUpdate(userId,pictureUpdate, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: 'Profile picture uploaded successfully',
            file: result.secure_url,
            user: updatedUser
        });

    } catch (err) {
        return res.status(500).json({
            message: 'An error occurred during upload',
            error: err.message
        });
    }
};

    //Change profile picture
exports.updatePicture=async(req,res)=>{
    try {
       
    const userToken= req.headers.authorization.split(" ")[1]
    if(!req.file){
        return res.status(400).json("No profile picture selected")
    }
    await jwt.verify(userToken,process.env.secret_key,async(err,newUser)=>{
        if(err){
            return res.status(400).json("could not authenticate")
        }else {
    
            console.log('Jwt data: ', newUser)
           req.user=newUser.userId 
    
        const cloudImage=await cloudinary.uploader.upload(req.file.path,{folder:"users_dp"},(err,data)=>{
            if(err){
              console.log(err)
            }
        // cloudinary.uploader.destroy()
            return data
        })
        const userId=newUser.userId
        
        console.log('User Id: ', userId)
        
        console.log('Cloud Image: ', cloudImage)
        const pictureUpdate= {profilePicture:{
            pictureId:cloudImage.public_id,
            
            pictureUrl:cloudImage.secure_url 
        }}
        
        const user= await customerModel.findById(userId)
        
    const formerImageId=user.profilePicture.pictureId
    await cloudinary.uploader.destroy(formerImageId)
    
        const checkUser= await customerModel.findByIdAndUpdate(userId,pictureUpdate,{new:true})
        
        return res.status(200).json({message :"user image sucessfully changed"})
    
        }
    })
    
    } catch (error) {
     res.status(500).json(error.message)   
    }
    };

    exports.updateUserProfile = async (req, res) => {
        try {
            const { fullName, phoneNumber } = req.body;
            const userId = req.user.userId; // Assuming you get the user ID from the token
    
            // Find the user by ID
            const user = await customerModel.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            // Check for phone number uniqueness
            if (phoneNumber) {
                const existingPhone = await customerModel.findOne({ phoneNumber, _id: { $ne: userId } });
                if (existingPhone) {
                    return res.status(400).json({ message: 'Phone number already in use' });
                }
                user.phoneNumber = phoneNumber; 
            }
            // Update full name if provided
            if (fullName) {
                user.fullName = fullName; 
            }
            // Save the updated user information
            const updatedUser = await user.save();
    
            return res.status(200).json({
                message: 'User profile updated successfully',
                user: {
                    fullName: updatedUser.fullName,
                    phoneNumber: updatedUser.phoneNumber,
                },
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    };
    

    exports.getAllCustomers = async(req, res)=>{
        try{
        const allCustomer = await customerModel.find().sort({created:-1});
        res.status(200).json({
            message:'Total List of all Customers in Data Base are:',
             data: allCustomer

        })
        }catch (error) {
            res.status(500).json({
                message: error.message,
            }); 
        }
    };

    exports.getOneCustomer = async (req, res) => {
        try {
            const { customerId} =req.params;
            const customer = await customerModel.findById(customerId);
            res.status(200).json({
                message: `Customer's details found`,
                data: customer
            })
        } catch (error) {
            res.status(500).json({
                message: error.message,
            });  
        }
    };

    exports.deleteCustomer = async (req, res) => {
        try {
            const {customerId} = req.params;
            const deletedCustomer = await customerModel.findByIdAndDelete(customerId);
            if(!deletedCustomer){
                return res.status(404).json({
                    message: "User not found"
                })
            }
    
            res.status(200).json({
                message: 'Customer deleted successfully'
            })
        } catch (error) {
            res.status(500).json({
                message: error.message,
            }); 
        }
    };
    
/// Admin controllers /// //////
exports.approveMech = async (req, res) => {
    try {
        const { mechId } = req.params; // Mechanic ID to approve or reject
        const { action } = req.body;   // Action to take ('Approve' or 'Reject')

        // Validate input
        if (!mechId || !action || (action !== 'Approve' && action !== 'Reject')) {
            return res.status(400).json({ message: "Invalid request. Action must be 'Approve' or 'Reject'." });
        }

        // Find the mechanic by ID
        const mechanic = await mechModel.findById(mechId);
        if (!mechanic) {
            return res.status(404).json({ message: "Mechanic not found." });
        }

        // // Check if the mechanic is already approved or rejected
        if (mechanic.approved == 'Approved') {
            return res.status(400).json({ message: "Mechanic's status is already approved" });
        }

        // Update the mechanic's status based on the action
        mechanic.approved = action === 'Approve' ? 'Approved' : 'Reject';

        await mechanic.save();

        res.status(200).json({
            message: `Mechanic ${action} successfully.`,
            data: mechanic
        });
    } catch (err) {
        res.status(500).json({ message: 'An error occurred while processing your request.', error: err.message });
    }
};


exports.getAllApprovedMechs = async (req, res) => {
    try {
        // Fetch all mechanics from the database
        const allMechs = await mechModel.find({ approved: 'Approved' });

        // Check if any approved mechanics are found
        if (allMechs.length === 0) {
            return res.status(404).json({ message: "No approved mechanics found." });
        }

        // Respond with the list of approved mechanics
        res.status(200).json({
            message: 'List of approved mechanics:',
            data: allMechs
        });
    } catch (err) {
        // Handle any errors that occur
        res.status(500).json({
            message: 'An error occurred while retrieving approved mechanics.',
            error: err.message
        });
    }
};

exports.makeAdmin = async (req, res) => {
    try {
      const { email } = req.body;
      const findUser = await customerModel.findOne({ email });
      if (!findUser) {
        return res.status(404).json({ message: " user not found" });
      }
      const updateUserRole = await customerModel.findOneAndUpdate(
        { email },
        { isAdmin: true },
        { new: true, runvalidators: true }
      );
      return res.status(200).json({ message: "you are now an admin", data: updatedUserRole.isAdmin });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };
  
