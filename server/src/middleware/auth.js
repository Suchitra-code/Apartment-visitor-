const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendResponse } = require('../utils/response');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return sendResponse(res, 401, false, 'Authentication failed. Please log in to continue.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'apartmenthub_default_secret');
    const user = await User.findById(decoded.id).populate('flat');

    if (!user) {
      return sendResponse(res, 401, false, 'User account no longer exists.');
    }

    if (user.status === 'pending') {
      return sendResponse(res, 403, false, 'Your registration is pending approval by the Society Manager.');
    }

    if (user.status === 'rejected') {
      return sendResponse(res, 403, false, 'Your registration has been rejected. Please contact the Society Office.');
    }

    req.user = user;
    next();
  } catch (error) {
    return sendResponse(res, 401, false, 'Invalid or expired session token. Please re-login.');
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendResponse(
        res,
        403,
        false,
        `Access denied. Your role '${req.user ? req.user.role : 'guest'}' does not have permission to access this resource.`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
