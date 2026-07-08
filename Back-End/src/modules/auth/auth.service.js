const jwt = require('jsonwebtoken');

const { env } = require('../../config/env');
const { AppError } = require('../../utils/AppError');
const { formatUserResponse } = require('../../utils/formatUserResponse');
const { User, USER_STATUSES } = require('../../models/User');

const serializeUser = (user) => formatUserResponse(user);

const signAccessToken = (user) => jwt.sign(
  {
    sub: user.id || user._id.toString(),
    role: user.role,
  },
  env.jwtAccessSecret,
  {
    expiresIn: env.jwtAccessExpiresIn,
  },
);

const signRefreshToken = (user) => jwt.sign(
  {
    sub: user.id || user._id.toString(),
    role: user.role,
    tokenVersion: user.refreshTokenVersion || 0,
  },
  env.jwtRefreshSecret,
  {
    expiresIn: env.jwtRefreshExpiresIn,
  },
);

const generateTokens = (user) => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user),
});

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status !== USER_STATUSES.ACTIVE) {
    throw new AppError('User account is inactive', 403);
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  return {
    user: serializeUser(user),
    ...generateTokens(user),
  };
};

const refreshToken = async (token) => {
  let decoded;

  try {
    decoded = jwt.verify(token, env.jwtRefreshSecret);
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = await User.findById(decoded.sub);

  if (!user) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (user.status !== USER_STATUSES.ACTIVE) {
    throw new AppError('User account is inactive', 403);
  }

  if ((user.refreshTokenVersion || 0) !== decoded.tokenVersion) {
    throw new AppError('Invalid refresh token', 401);
  }

  return {
    user: serializeUser(user),
    ...generateTokens(user),
  };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { $inc: { refreshTokenVersion: 1 } });
};

module.exports = {
  generateTokens,
  login,
  logout,
  refreshToken,
  serializeUser,
};
