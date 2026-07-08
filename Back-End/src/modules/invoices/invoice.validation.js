const { z } = require('zod');

const {
  DISCOUNT_TYPES,
  INVOICE_SOURCES,
  INVOICE_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} = require('./invoice.model');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

const optionalTrimmedString = (maxLength) => z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : value),
  z.string().trim().max(maxLength).optional(),
);

const optionalDateSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
}, z.date().optional());

const requiredPositiveNumber = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() !== '' ? Number(value) : value),
  z.number().positive(),
);

const optionalNonNegativeNumber = z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : Number(value)),
  z.number().min(0).optional(),
);

const requiredNonNegativeNumber = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() !== '' ? Number(value) : value),
  z.number().min(0),
);

const discountTypeSchema = z.enum(Object.values(DISCOUNT_TYPES)).default(DISCOUNT_TYPES.NONE);

const discountValueSchema = z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? 0 : Number(value)),
  z.number().min(0),
);

const invoiceItemInputSchema = z.object({
  productId: objectIdSchema,
  quantity: requiredPositiveNumber,
  taxRate: optionalNonNegativeNumber.refine((value) => value === undefined || value <= 100, {
    message: 'Tax rate must be less than or equal to 100',
  }),
}).strict();

const discountRule = (body) => (
  body.discountType !== DISCOUNT_TYPES.PERCENTAGE || body.discountValue <= 100
);

const listInvoicesQueryBaseSchema = z.object({
  page: z.preprocess((value) => (value === undefined ? 1 : Number(value)), z.number().int().positive()),
  limit: z.preprocess((value) => (value === undefined ? 10 : Number(value)), z.number().int().positive().max(100)),
  search: optionalTrimmedString(120),
  invoiceStatus: z.enum(Object.values(INVOICE_STATUSES)).optional(),
  paymentStatus: z.enum(Object.values(PAYMENT_STATUSES)).optional(),
  customerId: objectIdSchema.optional(),
  createdBy: objectIdSchema.optional(),
  dateFrom: optionalDateSchema,
  dateTo: optionalDateSchema,
  sortBy: z.enum([
    'createdAt',
    'confirmedAt',
    'invoiceNumber',
    'totalAmount',
    'invoiceStatus',
    'paymentStatus',
  ]).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const dateRangeRule = (query) => (
  query.dateFrom === undefined
    || query.dateTo === undefined
    || query.dateFrom <= query.dateTo
);

const listInvoicesSchema = {
  query: listInvoicesQueryBaseSchema.refine(dateRangeRule, {
    message: 'dateFrom must be before or equal to dateTo',
  }),
};

const invoiceIdParamSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

const customerInvoicesSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
  query: listInvoicesQueryBaseSchema.omit({ customerId: true }).refine((query) => (
    query.dateFrom === undefined
      || query.dateTo === undefined
      || query.dateFrom <= query.dateTo
  ), {
    message: 'dateFrom must be before or equal to dateTo',
  }),
};

const createInvoiceSchema = {
  body: z.object({
    customerId: objectIdSchema,
    items: z.array(invoiceItemInputSchema).min(1),
    discountType: discountTypeSchema,
    discountValue: discountValueSchema,
    dueDate: optionalDateSchema,
    source: z.enum(Object.values(INVOICE_SOURCES)).default(INVOICE_SOURCES.MANUAL),
    voiceText: optionalTrimmedString(2000),
    notes: optionalTrimmedString(2000),
  }).strict().refine(discountRule, {
    message: 'Discount percentage must be less than or equal to 100',
    path: ['discountValue'],
  }),
};

const updateInvoiceSchema = {
  ...invoiceIdParamSchema,
  body: z.object({
    items: z.array(invoiceItemInputSchema).min(1).optional(),
    discountType: z.enum(Object.values(DISCOUNT_TYPES)).optional(),
    discountValue: optionalNonNegativeNumber,
    dueDate: optionalDateSchema,
    source: z.enum(Object.values(INVOICE_SOURCES)).optional(),
    voiceText: optionalTrimmedString(2000),
    notes: optionalTrimmedString(2000),
  }).strict().refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required',
  }).refine((body) => (
    body.discountType !== DISCOUNT_TYPES.PERCENTAGE
      || body.discountValue === undefined
      || body.discountValue <= 100
  ), {
    message: 'Discount percentage must be less than or equal to 100',
    path: ['discountValue'],
  }),
};

const updateInvoicePaymentSchema = {
  ...invoiceIdParamSchema,
  body: z.object({
    paidAmount: requiredNonNegativeNumber,
    paymentMethod: z.enum(Object.values(PAYMENT_METHODS)).default(PAYMENT_METHODS.CASH),
  }).strict(),
};

module.exports = {
  createInvoiceSchema,
  customerInvoicesSchema,
  invoiceIdParamSchema,
  listInvoicesSchema,
  updateInvoicePaymentSchema,
  updateInvoiceSchema,
};
