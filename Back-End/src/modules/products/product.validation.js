const { z } = require('zod');

const { PRODUCT_STATUSES, PRODUCT_UNITS } = require('./product.model');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

const normalizeUppercase = (value) => value.trim().toUpperCase();

const optionalTrimmedString = (maxLength) => z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : value),
  z.string().trim().max(maxLength).optional(),
);

const requiredUppercaseString = (maxLength) => z.string()
  .trim()
  .min(1)
  .max(maxLength)
  .transform(normalizeUppercase);

const optionalUppercaseString = (maxLength) => z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : value),
  z.string().trim().min(1).max(maxLength).transform(normalizeUppercase).optional(),
);

const requiredMoneyNumber = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() !== '' ? Number(value) : value),
  z.number().min(0),
);

const optionalMoneyNumber = z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : Number(value)),
  z.number().min(0).optional(),
);

const optionalTaxRate = z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : Number(value)),
  z.number().min(0).max(100).optional(),
);

const currencySchema = optionalUppercaseString(3).refine(
  (value) => value === undefined || value.length === 3,
  { message: 'Currency must be a 3-letter code' },
);

const listProductsSchema = {
  query: z.object({
    page: z.preprocess((value) => (value === undefined ? 1 : Number(value)), z.number().int().positive()),
    limit: z.preprocess((value) => (value === undefined ? 10 : Number(value)), z.number().int().positive().max(100)),
    search: optionalTrimmedString(120),
    status: z.enum(Object.values(PRODUCT_STATUSES)).optional(),
    category: optionalTrimmedString(100),
    brand: optionalTrimmedString(100),
    minPrice: optionalMoneyNumber,
    maxPrice: optionalMoneyNumber,
    sortBy: z.enum(['createdAt', 'name', 'sku', 'category', 'brand', 'basePrice', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }).refine((query) => (
    query.minPrice === undefined
      || query.maxPrice === undefined
      || query.minPrice <= query.maxPrice
  ), {
    message: 'minPrice must be less than or equal to maxPrice',
  }),
};

const priceListSchema = {
  query: z.object({
    page: z.preprocess((value) => (value === undefined ? 1 : Number(value)), z.number().int().positive()),
    limit: z.preprocess((value) => (value === undefined ? 50 : Number(value)), z.number().int().positive().max(200)),
    search: optionalTrimmedString(120),
    category: optionalTrimmedString(100),
  }),
};

const productIdParamSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

const withProductCodeAlias = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  if (!body.sku && body.productCode) {
    return {
      ...body,
      sku: body.productCode,
    };
  }

  return body;
};

const createProductSchema = {
  body: z.preprocess(withProductCodeAlias, z.object({
    name: z.string().trim().min(1).max(150),
    sku: requiredUppercaseString(80),
    productCode: optionalUppercaseString(80),
    barcode: optionalTrimmedString(80),
    category: optionalTrimmedString(100),
    brand: optionalTrimmedString(100),
    description: optionalTrimmedString(1000),
    unit: z.enum(Object.values(PRODUCT_UNITS)).optional(),
    basePrice: requiredMoneyNumber,
    currency: currencySchema,
    taxRate: optionalTaxRate,
    status: z.enum(Object.values(PRODUCT_STATUSES)).optional(),
  }).strict()),
};

const updateProductSchema = {
  ...productIdParamSchema,
  body: z.preprocess(withProductCodeAlias, z.object({
    name: z.string().trim().min(1).max(150).optional(),
    sku: optionalUppercaseString(80),
    productCode: optionalUppercaseString(80),
    barcode: optionalTrimmedString(80),
    category: optionalTrimmedString(100),
    brand: optionalTrimmedString(100),
    description: optionalTrimmedString(1000),
    unit: z.enum(Object.values(PRODUCT_UNITS)).optional(),
    basePrice: optionalMoneyNumber,
    currency: currencySchema,
    taxRate: optionalTaxRate,
    status: z.enum(Object.values(PRODUCT_STATUSES)).optional(),
  }).strict().refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required',
  })),
};

const updateProductPriceSchema = {
  ...productIdParamSchema,
  body: z.object({
    basePrice: requiredMoneyNumber,
    currency: currencySchema,
    taxRate: optionalTaxRate,
  }).strict(),
};

module.exports = {
  createProductSchema,
  listProductsSchema,
  priceListSchema,
  productIdParamSchema,
  updateProductPriceSchema,
  updateProductSchema,
};
