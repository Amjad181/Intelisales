const { sendSuccess } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');
const authService = require('./auth.service');

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  return sendSuccess(res, {
    message: 'Login successful',
    data: result,
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);

  return sendSuccess(res, {
    message: 'Token refreshed successfully',
    data: result,
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);

  return sendSuccess(res, {
    message: 'Logout successful',
  });
});

const me = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Current user retrieved successfully',
  data: {
    user: authService.serializeUser(req.user),
  },
}));

const protectedTest = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Protected route access granted',
  data: {
    user: authService.serializeUser(req.user),
  },
}));

const adminTest = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Admin route access granted',
  data: {
    user: authService.serializeUser(req.user),
  },
}));

module.exports = {
  adminTest,
  login,
  logout,
  me,
  protectedTest,
  refreshToken,
};
