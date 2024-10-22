const jwt = require("jsonwebtoken");
const customerModel = require("../models/customerModel");
const mechModel = require("../models/mechModel");

// To authenticate if a user is signed in
const authenticate = async (req, res, next) => {
  try {
    const hasAuthorization = req.headers.authorization;

    if (!hasAuthorization) {
      return res.status(401).json({
        message: "Token not found",
      });
    }

    const token = hasAuthorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Please log in to continue.",
      });
    }

    const decodedToken = jwt.verify(token, process.env.secret_key);
    const userId = decodedToken.userId;

    // Check if the user is a customer
    let user = await customerModel.findById(userId);
    if (!user) {
      // If not a customer, check if the user is a mechanic
      user = await mechModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: "Authentication Failed: User not found",
        });
      }
      req.user = { ...decodedToken, userType: "mechanic", user }; 
    } else {
      req.user = { ...decodedToken, userType: "customer", user }; 
    }

    // Check if the token's issued at (iat) time is before the lastLogoutTime
    if (user.lastLogoutTime && decodedToken.iat * 1000 < new Date(user.lastLogoutTime).getTime()) {
      return res.status(401).json({
        message: "Token is no longer valid. Please log in again.",
      });
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: "Please sign in.",
      });
    }
    res.status(500).json({
      message: error.message,
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



module.exports = {
  authenticate,
  isAdmin,
  
};
