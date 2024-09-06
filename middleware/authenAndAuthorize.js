const jwt = require('jsonwebtoken');
const customerModel =require("../models/customerModel");
const mechModel = require('../models/mechModel')


// To authenticate if a user is signed in
const authenticate = async (req, res, next) => {
    try {
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

        const decodedToken = jwt.verify(token, process.env.secret_key);
 
        const user = await customerModel.findById(decodedToken.userId);

        if (!user) {
            return res.status(404).json({
                message: 'Authentication Failed: User not found'
            });
        }

         // Check if the token is already blacklisted
         if (user.blackList.includes(token)) {
            return res.status(400).json({
                message: 'User not logged in.',
            });
        }

        req.user = decodedToken;

        next();

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                message:  "Please sign in."
            });
        }
        res.status(500).json({
            message: error.message
        });
    }
};

//Check for an Admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "Unauthorized: Not an admin" });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const makeAdmin = async(req, res)=>{
  try{
    const {email} =req.body
  const findUser=await customerModel.findOne({email})
   if(!findUser){
return res.status(404).json({ message: " user not found"})
  }
    const admin = await customerModel.findOneAndUpdate({email},{isAdmin:true},{new:true,runvalidators:true})
  return  res.status(200).json({ message: "you are now an admin" });
    
  }catch(error){
    res.status(500).json({
      message:error.message
    })
  }
};


// To authenticate if a user is signed in
const authenticateMech = async (req, res, next) => {
  try {
      const hasAuthorization = req.headers.authorization;

      if (!hasAuthorization) {
          return res.status(401).json({
              message: 'Please login to continue.'
          });
      }

      const token = hasAuthorization.split(' ')[1];

      if (!token) {
          return res.status(401).json({
              message: 'Please log in to continue.'
          });
      }

      const decodedToken = jwt.verify(token, process.env.secret_key);

      const user = await mechModel.findById(decodedToken.userId);

      if (!user) {
          return res.status(404).json({
              message: 'Authentication Failed: User not found'
          });
      }

       // Check if the token is already blacklisted
       if (user.blackList.includes(token)) {
          return res.status(400).json({
              message: 'User not logged in.',
          });
      }

      req.user = decodedToken;

      next();

  } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
          return res.status(401).json({
              message:  "Please sign in."
          });
      }
      res.status(500).json({
          message: error.message
      });
  }
};


  //Check for an Admin
const isAdminMech = async (req, res, next) => {
  try {
    if (req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "Unauthorized: Not an admin" });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const makeAdminMech = async(req, res)=>{
    try{
      const {email} =req.body
    const findUser=await mechModel.findOne({email})
     if(!findUser){
 return res.status(404).json({ message: " user not found"})
    }
      const admin = await mechModel.findOneAndUpdate({email},{isAdmin:true},{new:true,runvalidators:true})
    return  res.status(200).json({ message: "you are now an admin" });
      
    }catch(error){
      res.status(500).json({
        message:error.message
      })
    }
  };

  

  module.exports = {
    authenticate,
    isAdmin,
    makeAdmin,
    authenticateMech,
    isAdminMech,
    makeAdminMech
  };