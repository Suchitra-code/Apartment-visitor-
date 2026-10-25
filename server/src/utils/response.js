const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const sendResponse = (res, statusCode, success, message, data = null, errors = null) => {
  const payload = {
    success,
    message,
    ...(data !== null && { data }),
    ...(errors !== null && { errors }),
  };
  return res.status(statusCode).json(payload);
};

module.exports = { asyncHandler, sendResponse };
