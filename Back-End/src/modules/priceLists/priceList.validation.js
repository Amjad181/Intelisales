const { z } = require('zod');

const { PRICE_LIST_CUSTOMER_TYPES, PRICE_LIST_STATUSES } = require('./priceList.model');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

const optionalTrimmedString = (maxLength) => z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : value),
  z.string().trim().max(maxLength).optional(),
);

const requiredMoneyNumber = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() !== '' ? Number(value) : value),
  z.number().min(0),
);

const optionalMoneyNumber = z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : Number(value)),
  z.number().min(0).optional(),
);

const currencySchema = z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : value),
  z.string().trim().length(3).transform((value) => value.toUpperCase()).optional(),
);

const priceListItemSchema = z.object({
  productId: objectIdSchema,
  price: requiredMoneyNumber,
  currency: currencySchema,
}).strict();

const listPriceListsSchema = {
  query: z.object({
    page: z.preprocess((value) => (value === undefined ? 1 : Number(value)), z.number().int().positive()),
    limit: z.preprocess((value) => (value === undefined ? 10 : Number(value)), z.number().int().positive().max(100)),
    customerType: z.enum(Object.values(PRICE_LIST_CUSTOMER_TYPES)).optional(),
    status: z.enum(Object.values(PRICE_LIST_STATUSES)).optional(),
    search: optionalTrimmedString(120),
    sortBy: z.enum(['createdAt', 'name', 'customerType', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};

const customerTypeParamSchema = {
  params: z.object({
    customerType: z.enum(Object.values(PRICE_LIST_CUSTOMER_TYPES)),
  }),
};

const priceListIdParamSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

const createPriceListSchema = {
  body: z.object({
    name: z.string().trim().min(1).max(150),
    customerType: z.enum(Object.values(PRICE_LIST_CUSTOMER_TYPES)),
    description: optionalTrimmedString(1000),
    status: z.enum(Object.values(PRICE_LIST_STATUSES)).optional(),
    items: z.array(priceListItemSchema).optional(),
  }).strict(),
};

const updatePriceListSchema = {
  ...priceListIdParamSchema,
  body: z.object({
    name: z.string().trim().min(1).max(150).optional(),
    customerType: z.enum(Object.values(PRICE_LIST_CUSTOMER_TYPES)).optional(),
    description: optionalTrimmedString(1000),
    status: z.enum(Object.values(PRICE_LIST_STATUSES)).optional(),
    items: z.array(z.object({
      productId: objectIdSchema,
      price: optionalMoneyNumber,
      currency: currencySchema,
    }).strict().refine((item) => item.price !== undefined || item.currency !== undefined, {
      message: 'At least one price-list item field is required',
    })).optional(),
  }).strict().refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required',
  }),
};

module.exports = {
  createPriceListSchema,
  customerTypeParamSchema,
  listPriceListsSchema,
  priceListIdParamSchema,
  updatePriceListSchema,
};
