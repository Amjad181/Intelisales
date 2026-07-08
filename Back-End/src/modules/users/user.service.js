const { AppError } = require('../../utils/AppError');
const { formatUserResponse } = require('../../utils/formatUserResponse');
const { User, USER_ROLES, USER_STATUSES } = require('../../models/User');

const buildFilters = ({ search, role, status }) => {
  const filters = {};

  if (role) {
    filters.role = role;
  }

  if (status) {
    filters.status = status;
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    filters.$or = [
      { name: searchRegex },
      { email: searchRegex },
    ];
  }

  return filters;
};

const ensureEmailIsAvailable = async (email, excludedUserId = null) => {
  const query = { email };

  if (excludedUserId) {
    query._id = { $ne: excludedUserId };
  }

  const existingUser = await User.findOne(query);

  if (existingUser) {
    throw new AppError('Email already exists', 409);
  }
};

const listUsers = async (query) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;
  const filters = buildFilters(query);
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [query.sortBy || 'createdAt']: sortDirection };

  const [users, total] = await Promise.all([
    User.find(filters)
      .select('-password -refreshTokenVersion -__v')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    User.countDocuments(filters),
  ]);

  return {
    count: users.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    users: users.map(formatUserResponse),
  };
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshTokenVersion -__v');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return formatUserResponse(user);
};

const createUser = async (payload) => {
  await ensureEmailIsAvailable(payload.email);

  const user = await User.create({
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    status: payload.status || USER_STATUSES.ACTIVE,
  });

  return formatUserResponse(user);
};

const assertSelfProtection = ({ actorId, targetUser, payload, action }) => {
  const targetId = targetUser.id || targetUser._id.toString();

  if (targetId !== actorId.toString()) {
    return;
  }

  if (action === 'deactivate' || payload.status === USER_STATUSES.INACTIVE) {
    throw new AppError('You cannot deactivate your own account', 400);
  }

  if (targetUser.role === USER_ROLES.COMPANY_ADMIN && payload.role && payload.role !== USER_ROLES.COMPANY_ADMIN) {
    throw new AppError('You cannot remove your own COMPANY_ADMIN role', 400);
  }
};

const updateUser = async (userId, payload, actorId) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  assertSelfProtection({ actorId, targetUser: user, payload, action: 'update' });

  if (payload.email && payload.email !== user.email) {
    await ensureEmailIsAvailable(payload.email, userId);
  }

  for (const field of ['name', 'email', 'role', 'status']) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      user[field] = payload[field];
    }
  }

  await user.save();
  return formatUserResponse(user);
};

const resetUserPassword = async (userId, password) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.password = password;
  await user.save();

  return formatUserResponse(user);
};

const deactivateUser = async (userId, actorId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  assertSelfProtection({
    actorId,
    targetUser: user,
    payload: { status: USER_STATUSES.INACTIVE },
    action: 'deactivate',
  });

  user.status = USER_STATUSES.INACTIVE;
  await user.save();

  return formatUserResponse(user);
};

module.exports = {
  createUser,
  deactivateUser,
  getUserById,
  listUsers,
  resetUserPassword,
  updateUser,
};
