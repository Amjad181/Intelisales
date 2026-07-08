const jwt = require('jsonwebtoken');

const { env } = require('../config/env');
const { AppError } = require('../utils/AppError');
const { User, USER_STATUSES } = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError('Authentication required', 401);
    }

    const decoded = jwt.verify(token, env.jwtAccessSecret);
    const user = await User.findById(decoded.sub);

    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    if (user.status !== USER_STATUSES.ACTIVE) {
      throw new AppError('User account is inactive', 403);
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    return next(new AppError('Authentication required', 401));
  }
};

module.exports = { authenticate };
