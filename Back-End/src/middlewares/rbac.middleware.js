const { AppError } = require('../utils/AppError');

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('Forbidden', 403));
  }

  return next();
};

module.exports = { authorizeRoles };
