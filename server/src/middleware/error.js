const { sendResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('API Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return sendResponse(res, 400, false, `Resource not found with id: ${err.value}`);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendResponse(res, 400, false, `Duplicate value for field '${field}'. Please provide another value.`);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return sendResponse(res, 400, false, 'Validation failed', null, messages);
  }

  return sendResponse(res, err.statusCode || 500, false, error.message || 'Internal Server Error');
};

const notFound = (req, res, next) => {
  sendResponse(res, 404, false, `Route not found: ${req.originalUrl}`);
};

module.exports = { errorHandler, notFound };
