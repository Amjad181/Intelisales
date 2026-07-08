const formatUserResponse = (user) => {
  if (!user) {
    return user;
  }

  const plainUser = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  const id = plainUser.id || (plainUser._id ? plainUser._id.toString() : undefined);

  return {
    id,
    name: plainUser.name,
    email: plainUser.email,
    role: plainUser.role,
    status: plainUser.status,
    createdAt: plainUser.createdAt,
    updatedAt: plainUser.updatedAt,
  };
};

module.exports = { formatUserResponse };
