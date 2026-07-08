const { sendSuccess } = require('../../utils/apiResponse');
const { asyncHandler } = require('../../utils/asyncHandler');
const userService = require('./user.service');

const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query);

  return sendSuccess(res, {
    message: 'Users fetched successfully',
    count: result.count,
    pagination: result.pagination,
    data: result.users,
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  return sendSuccess(res, {
    message: 'User retrieved successfully',
    data: { user },
  });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'User created successfully',
    data: { user },
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user.id);

  return sendSuccess(res, {
    message: 'User updated successfully',
    data: { user },
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const user = await userService.resetUserPassword(req.params.id, req.body.password);

  return sendSuccess(res, {
    message: 'User password reset successfully',
    data: { user },
  });
});

const deactivateUser = asyncHandler(async (req, res) => {
  const user = await userService.deactivateUser(req.params.id, req.user.id);

  return sendSuccess(res, {
    message: 'User deactivated successfully',
    data: { user },
  });
});

module.exports = {
  createUser,
  deactivateUser,
  getUserById,
  listUsers,
  resetPassword,
  updateUser,
};
