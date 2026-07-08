const { z } = require('zod');
const { USER_ROLES, USER_STATUSES } = require('../../models/User');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

const listUsersSchema = {
  query: z.object({
    page: z.preprocess((value) => (value === undefined ? 1 : Number(value)), z.number().int().positive()),
    limit: z.preprocess((value) => (value === undefined ? 10 : Number(value)), z.number().int().positive().max(100)),
    search: z.string().trim().optional(),
    role: z.enum(Object.values(USER_ROLES)).optional(),
    status: z.enum(Object.values(USER_STATUSES)).optional(),
    sortBy: z.enum(['createdAt', 'name', 'email', 'role', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};

const userIdParamSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

const createUserSchema = {
  body: z.object({
    name: z.string().trim().min(2),
    email: z.string().email().trim().transform((value) => value.toLowerCase()),
    password: z.string().min(8),
    role: z.enum(Object.values(USER_ROLES)),
    status: z.enum(Object.values(USER_STATUSES)).optional(),
  }),
};

const updateUserSchema = {
  ...userIdParamSchema,
  body: z.object({
    name: z.string().trim().min(2).optional(),
    email: z.string().email().trim().transform((value) => value.toLowerCase()).optional(),
    role: z.enum(Object.values(USER_ROLES)).optional(),
    status: z.enum(Object.values(USER_STATUSES)).optional(),
  }).strict().refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required',
  }),
};

const resetPasswordSchema = {
  ...userIdParamSchema,
  body: z.object({
    password: z.string().min(8),
  }),
};

module.exports = {
  createUserSchema,
  listUsersSchema,
  resetPasswordSchema,
  updateUserSchema,
  userIdParamSchema,
};
