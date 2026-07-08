const { z } = require('zod');

const recentActivitySchema = {
  query: z.object({
    limit: z.preprocess(
      (value) => (value === undefined ? 10 : Number(value)),
      z.number().int().positive().max(50),
    ),
  }).strict(),
};

module.exports = {
  recentActivitySchema,
};
