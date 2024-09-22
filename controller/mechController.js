
const mechModel = require('../models/mechModel');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs');
require('dotenv').config()
const sendMailer = require("../middleware/sendMailer")
const {generateWelcomeEmail,ForgetPasswordEmail} = require('../middleware/html')
const { validateMech } = require('../middleware/validator');
const cloudinary = require('../middleware/cloudinary');
const fs = require('fs')


//Creating the sign Up
exports.createMech  = async (req, res) => {
    try {
        // Destructuring from req.body(dataBase)
        const { fullName, email, password, phoneNumber } = req.body;
        
        const existingEmail = await mechModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        const existingnum = await mechModel.findOne({phoneNumber});
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
        const user = new mechModel({
            fullName:`${slicedName} ${slicedName2}`,
            email:email.toLowerCase().trim(),
            password: hashedPassword,
            phoneNumber,
    
        });
        // save the above
        const createdUser = await user.save();
       //using jwt to sign in    ( user identity )                                    (Your secret)            (Duration )
        const token = jwt.sign({ email: createdUser.email, userId: createdUser._id }, process.env.secret_key, { expiresIn: "7d" });

        // Send verification mail ;
        const verificationLink =` https://car-care-g11.vercel.app/#/mechEmailVerf/${token}`;
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

        return res.status(200).json({ message: `Successfully created please check your email:${ createdUser.email} and click the link below for verification`, createdUser, token });
    } catch (error) {
        
        return res.status(500).json(error.message);
    }
};


exports.completeProfile = async (req, res) => {
    try {
        const {
            businessName,
            businessAddress,
            areaOfSpecialization,
            yearsOfExperience,
            businessRegNumber
        } = req.body;

        const userId = req.user.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await mechModel.findById(userId);

        // Check if user exists
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { profilePicture, identification, certification, insurance } = req.files; 

        // if (!profilePicture || profilePicture.length === 0) {
        //     return res.status(400).json({ message: "Profile picture is required" });
        // }
        // if (!identification || identification.length === 0) {
        //     return res.status(400).json({ message: "Identification is required" });
        // }
        // if (!certification || certification.length === 0) {
        //     return res.status(400).json({ message: "Certification is required" });
        // }

        // Prepare upload promises for Cloudinary
        const uploadPromises = [
            cloudinary.uploader.upload(profilePicture[0].path, { folder: "users_dp/profile_pictures" }),
            cloudinary.uploader.upload(identification[0].path, { folder: "users_dp/identifications" }),
            cloudinary.uploader.upload(certification[0].path, { folder: "users_dp/certifications" })
        ];

        if (insurance && insurance.length > 0) {
            uploadPromises.push(cloudinary.uploader.upload(insurance[0].path, { folder: "users_dp/insurance" }));
        }

        const [profilePictureResult, identificationResult, certificationResult, insuranceResult] = await Promise.all(uploadPromises);

        // Prepare update fields
        const updateFields = {
            profilePicture: {
                pictureId: profilePictureResult.public_id,
                pictureUrl: profilePictureResult.secure_url
            },
            Identification: {
                fileId: identificationResult.public_id,
                fileUrl: identificationResult.secure_url
            },
            certification: {
                fileId: certificationResult.public_id,
                fileUrl: certificationResult.secure_url
            },
            insurance: insuranceResult ? {
                fileId: insuranceResult.public_id,
                fileUrl: insuranceResult.secure_url
            } : null
        };

        // Update user profile with the provided details
        const updatedUser = await mechModel.findByIdAndUpdate(
            userId,
            {
                ...updateFields,
                businessName,
                businessAddress,
                areaOfSpecialization,
                yearsOfExperience,
                businessRegNumber,
                isProfileComplete: true
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(400).json({ message: 'Failed to update profile' });
        }

         // Clean up local files
         const cleanupFiles = [
            profilePicture[0].path,
            identification[0].path,
            certification[0].path
        ];

        if (insurance && insurance.length > 0) {
            cleanupFiles.push(insurance[0].path);
        }

        cleanupFiles.forEach(filePath => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Failed to delete file", filePath, err);
                } else {
                    console.log("Successfully deleted file", filePath);
                }
            });
        });

        return res.status(200).json({
            message: 'Profile updated successfully',
            user: user
        });

    } catch (error) {
        // Handle unexpected errors
        console.error('Error updating profile:', error);
        return res.status(500).json({
            message: 'An error occurred while updating the profile',
            error: error.message
        });
    }
};

exports.updateProfessionFields = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { areaOfSpecialization, yearsOfExperience, businessAddress } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await mechModel.findById(userId);

        // Check if user exists
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prepare update fields
        const updateFields = {};
        if (areaOfSpecialization) updateFields.areaOfSpecialization = areaOfSpecialization;
        if (yearsOfExperience) updateFields.yearsOfExperience = yearsOfExperience;
        if (businessAddress) updateFields.businessAddress = businessAddress;

        // Update user profile with the provided details
        const updatedUser = await mechModel.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true }
        );

        if (!updatedUser) {
            return res.status(400).json({ message: 'Failed to update profile' });
        }

        return res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        // Handle unexpected errors
        console.error('Error updating profile fields:', error);
        return res.status(500).json({
            message: 'An error occurred while updating the profile fields',
            error: error.message
        });
    }
};

 //Change profile picture
 exports.changeProfilePix = async (req, res) => {
     try {
         // Extract the new profile picture file from the request
         const profilePictureFile = req.files['profilePicture']; 
 
         // Check if profile picture file is provided
         if (!profilePictureFile) {
             return res.status(400).json({ message: "Please upload a profile picture" });
         }
 
         const userId = req.user.userId;
 
         if (!userId) {
             return res.status(400).json({ message: "Login to continue" });
         }
 
         // Find the user to get the current profile picture ID
         const user = await mechModel.findById(userId);
 
         if (!user) {
             return res.status(404).json({ message: "User not found" });
         }
 
         // If there's an existing profile picture, destroy it from Cloudinary
         if (user.profilePicture && user.profilePicture.pictureId) {
             await cloudinary.uploader.destroy(user.profilePicture.pictureId);
         }
 
         // Upload the new profile picture to Cloudinary
         const profilePictureResult = await cloudinary.uploader.upload(profilePictureFile[0].path, { folder: "users_dp/profile_pictures" });
 
         // Update fields related to the profile picture
         const updateFields = {
             profilePicture: {
                 pictureId: profilePictureResult.public_id,
                 pictureUrl: profilePictureResult.secure_url
             }
         };
 
         // Clean up local file
         fs.unlink(profilePictureFile[0].path, (err) => {
             if (err) {
                 console.log("Failed to delete file", profilePictureFile[0].path, err);
             } else {
                 console.log("Successfully deleted file", profilePictureFile[0].path);
             }
         });
 
         // Update the user's profile with the new profile picture
         const updatedUser = await mechModel.findByIdAndUpdate(userId, updateFields, { new: true });
 
         if (!updatedUser) {
             return res.status(404).json({ message: "User not found" });
         }
 
         return res.status(200).json({
             message: 'Profile picture updated successfully',
             file: profilePictureResult.secure_url,
             user: updatedUser
         });
 
     } catch (err) {
         console.error('Error during upload:', err);
         return res.status(500).json({
             message: 'An error occurred during upload',
             error: err.message
         });
     }
 };
 



//create an end point to verify users email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                error: "Token not found"
            });
        }

        // Verify the token
        const { email } = jwt.verify(token, process.env.secret_key);

        const createdUser = await mechModel.findOne({ email });

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

        // Update the user verification status
        createdUser.isVerified = true;
        // Save the changes
        await createdUser.save();

        return res.status(200).json({
            message: 'Verification successful',
            data: createdUser.position 
        });
    
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(400).json({
                message: "Invalid token. Please try again."
            });
        }
        return res.status(500).json({
            message: error.message
        });
    }
};


// exports.resendEmail = async (req, res) => {
//     try {
//         // get user email from request body
//         const { email } = req.body;

//         // find user
//         const user = await mechModel.findOne({ email });
//         if (!user) {
//             return res.status(404).json({
//                 error: "User not found"
//             });
//         }

//         // Check if user has already been verified
//         if (user.isVerified) {
//             return res.status(400).json({
//                 error: "User already verified"
//             });
//         }

//         // create a token
//         const token = await jwt.sign({ email }, process.env.secret_key, { expiresIn: "5m" });

//         // send verification email
//         const mailOptions = {
//             email: user.email,
//             subject: "Email Verification",
//             html: `Please click on the link to verify your email: <a href="carcareconnectproject.onrender.com/api/v1/mech/resendEmail/${token}>ResendEmail</a>`,
//         };

//         await sendMailer(mailOptions);

//         res.status(200).json({
//             message: `Verification email sent successfully to your email: ${user.email}`
//         });

//     } catch (error) {
//         res.status(500).json({
//             message: error.message
//         })
//     }
// };


// exports.signIn =async(req, res)=>{
//     try {
//         //Login with email & password
//         const {email, password}= req.body
//         if(!email){
//             return res.status(404).json({message:'email is require'})
//         }
//         // Check if email exit
//         const findUser = await mechModel.findOne({email: email.toLowerCase()})
//         if(!findUser){
//             return res.status(404).json({message:'user not found'})
//         }
//         //Check if password exit
//         const matchedPassword = await bcrypt.compare(password, findUser.password)
//        if(!matchedPassword){
//             return res.status(400).json({message:'incorrect password'})
//         }
//         if(findUser.isVerified === false){
//            return  res.status(400).json({message:'Your email is not yet verified'})
//         }
//         findUser.isLoggedIn = true
//         const token = jwt.sign({ 
//             fullName:findUser.fullName,
//             email: findUser.email,userId: findUser._id }, 
//             process.env.secret_key,{ expiresIn: "1d" });

//             const currentHour = new Date().getHours();
//         let greetingMessage;

//         if (currentHour >= 5 && currentHour < 12) {
//             greetingMessage = `Good Morning ${findUser.fullName}, What are Your Goals for Today!`;
//         } else if (currentHour >= 12 && currentHour < 17) {
//             greetingMessage = `Good Afternoon ${findUser.fullName}, Remember Your Plans!`;
//         } else if (currentHour >= 17 && currentHour < 21) {
//             greetingMessage = `Good Evening, ${findUser.fullName}!`;
//         } else {
//             greetingMessage = `Good Evening, ${findUser.fullName}!`;
//         }
//         // Respond with the greeting message, user details, and token
//         return res.status(200).json({
//             message: greetingMessage,
//             user: findUser,
//             token
//         });

//     } catch (error) {
//         return res.status(500).json(error.message);
//     }
// };

// exports.forgotPassword = async (req, res) => {
//     try {
       
//         const { email } = req.body;

//         // Check if the email exists in the userModel
//         const user = await mechModel.findOne({ email: email.toLowerCase() });
//         if (!user) {
//             return res.status(404).json({
//                 message: "User not found"
//             });
//         }

//         // Generate a reset token
//         const resetToken = await jwt.sign({ userId: user._id }, process.env.secret_key, { expiresIn: "30m" });

//         // Send verification mail
//         const verificationLink = " ";
//         const emailSubject = 'Verification Mail';
//         const html = ForgetPasswordEmail(user.fullName, verificationLink);
//         // using nodemailer to send mail to our user
//         const mailOptions = {
//             from: process.env.mailUser,
//             to: email, // Use the user's email address here
//             subject: emailSubject,
//             html: html
//         };
//         await sendMailer(mailOptions);

//         res.status(200).json({
//             message: "Password reset email has been sent  to your email, check your email",
            
//         });
//     } catch (error) {
//         console.error("Something went wrong", error.message);
//         res.status(500).json({
//             message: error.message
//         });
//     }
// };


// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        // Extract the token from URL parameters and the new password from request body
        const { token } = req.params;
        const { password } = req.body;

        // Verify the token and decode it to get userId
        const decodedToken = jwt.verify(token, process.env.secret_key);
        const userId = decodedToken.userId;

        // Find the user by ID
        const user = await mechModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Salt and hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        // Respond with success message
        res.status(200).json({ message: "Password reset successful" });

    } catch (error) {
        // Handle JWT specific errors
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(400).json({ message: "Invalid or expired token. Please request a new password reset link." });
        }

        // Handle other errors
        console.error("Error during password reset:", error.message);
        res.status(500).json({ message: "An error occurred during password reset" });
    }
};


exports.changePassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                message: "Old password and new password are required"
            });
        }

        // Verify the user's token
        const decodedToken = jwt.verify(token, process.env.secret_key);

        // Get the user's ID from the token
        const userId = decodedToken.userId;

        // Find the user by ID
        const user = await mechModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
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
        const auth = req.headers.authorization;

        // Ensure the authorization header is present and properly formatted
        if (!auth || !auth.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Authorization header is missing or improperly formatted.',
            });
        }

        const token = auth.split(' ')[1];

        // Ensure the token is present
        if (!token) {
            return res.status(401).json({
                message: 'Token is missing.',
            });
        }
        // console.log(token)

        // Verify the token and extract email
        const decoded = jwt.verify(token, process.env.secret_key);
        const { userId } = decoded;
        // console.log(decoded)

        // Find the user by email
        const user = await mechModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found.',
            });
        }

        // Check if the token is already blacklisted
        if (user.blackList.includes(token)) {
            return res.status(400).json({
                message: 'Token already blacklisted.',
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

exports.updateMechProfile = async (req, res) => {
    try {
        const { fullName, phoneNumber } = req.body;
        const userId = req.user.userId; // Assuming you get the user ID from the token

        // Find the user by ID
        const user = await mechModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Check for phone number uniqueness
        if (phoneNumber) {
            const existingPhone = await mechModel.findOne({ phoneNumber, _id: { $ne: userId } });
            if (existingPhone) {
                return res.status(400).json({ message: 'Phone number already in use' });
            }
            user.phoneNumber = phoneNumber; 
        }
        
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


exports.getAllMech = async(req, res)=>{
    try{
    const allMech = await mechModel.find().sort({created:-1});
    // allMech.forEach(mech => console.log(mech.approved));
    // return all the approved mech
    const approvedMech = allMech.filter(mech => mech.approved === true )
    // console.log(approvedMech)
    if(!approvedMech || approvedMech.length === 0){
        return res.status(404).json({
            message:"No approved mechanics"
        })
    }

    res.status(200).json({
        message:'Total List of all Mechanics in Data Base are:',
         data: approvedMech

    })
    }catch (error) {
        res.status(500).json({
            message: error.message,
        }); 
    }
};

exports.getOneMech = async (req, res) => {
    try {
        const { mechId} =req.params;
        const mech = await mechModel.findById(mechId);
        if(mech.approved){
            return res.status(400).json({
                message:"mechanic not approved"
            })
        }
        res.status(200).json({
            message: `Mechanic's details found`,
            data: mech
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });  
    }
};

exports.deleteMech = async (req, res) => {
    try {
        const {mechId} = req.params;
        const deletedMech = await mechModel.findByIdAndDelete(mechId);
        if(!deletedMech){
            return res.status(404).json({
                message: "Mechanic not found"
            })
        }

        res.status(200).json({
            message: 'Mechanic deleted successfully'
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
        }); 
    }
};

