const { z } = require('zod');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined) {
    return true;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  return value;
}, z.boolean());

const productRecommendationsSchema = {
  params: z.object({
    customerId: objectIdSchema,
  }),
  query: z.object({
    limit: z.preprocess(
      (value) => (value === undefined ? 5 : Number(value)),
      z.number().int().min(1).max(20),
    ),
    includeHistory: booleanQuerySchema,
  }).strict(),
};

module.exports = {
  productRecommendationsSchema,
};
