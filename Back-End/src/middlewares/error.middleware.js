const { sendError } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return sendError(res, {
    statusCode,
    message,
    errors: err.errors,
  });
};

module.exports = { errorHandler };
