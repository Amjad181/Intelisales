const { z } = require('zod');

const loginSchema = {
  body: z.object({
    email: z.string().email().trim().transform((value) => value.toLowerCase()),
    password: z.string().min(1),
  }),
};

const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().min(1),
  }),
};

module.exports = {
  loginSchema,
  refreshTokenSchema,
};
