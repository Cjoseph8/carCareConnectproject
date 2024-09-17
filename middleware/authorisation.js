const jwt = require("jsonwebtoken");
const customerModel = require("../models/customerModel");

// To check if the user can perform a task
exports.adminAuth = async (req, res, next) => {
  try {
    const hasAuthorization = req.headers.authorization;

    if (!hasAuthorization) {
      return res.status(401).json({
        message: "Please login to continue.",
      });
    }

    const token = hasAuthorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Please log in to continue.",
      });
    }

    const decodedToken = jwt.verify(token, process.env.secret_key);

    const user = await customerModel.findById(decodedToken.userId);
    
    if (!user.isAdmin) {
      return res.status(404).json({
        message: "Authorization Failed: You are not an admin",
      });
    }

    // Check if the token is already blacklisted
    if (user.blackList.includes(token)) {
      return res.status(400).json({
        message: "User not logged in.",
      });
    }

    req.user = decodedToken;

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
