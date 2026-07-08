const { z } = require('zod');

const { CUSTOMER_STATUSES, CUSTOMER_TYPES, PAYMENT_TYPES } = require('./customer.model');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

const optionalTrimmedString = (maxLength) => z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : value),
  z.string().trim().max(maxLength).optional(),
);

const optionalEmailSchema = z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : value),
  z.string().email().trim().transform((value) => value.toLowerCase()).optional(),
);

const addressSchema = z.object({
  line1: optionalTrimmedString(160),
  line2: optionalTrimmedString(160),
  city: optionalTrimmedString(80),
  state: optionalTrimmedString(80),
  postalCode: optionalTrimmedString(40),
  country: optionalTrimmedString(80),
}).strict();

const listCustomersSchema = {
  query: z.object({
    page: z.preprocess((value) => (value === undefined ? 1 : Number(value)), z.number().int().positive()),
    limit: z.preprocess((value) => (value === undefined ? 10 : Number(value)), z.number().int().positive().max(100)),
    search: optionalTrimmedString(120),
    status: z.enum(Object.values(CUSTOMER_STATUSES)).optional(),
    customerType: z.enum(Object.values(CUSTOMER_TYPES)).optional(),
    paymentType: z.enum(Object.values(PAYMENT_TYPES)).optional(),
    assignedSalesRep: objectIdSchema.optional(),
    city: optionalTrimmedString(80),
    sortBy: z.enum(['createdAt', 'name', 'email', 'city', 'status', 'customerType', 'paymentType']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};

const customerIdParamSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

const createCustomerSchema = {
  body: z.object({
    name: z.string().trim().min(1).max(120),
    contactName: optionalTrimmedString(120),
    phone: optionalTrimmedString(40),
    email: optionalEmailSchema,
    address: addressSchema.optional(),
    notes: optionalTrimmedString(1000),
    assignedSalesRep: objectIdSchema.optional(),
    customerType: z.enum(Object.values(CUSTOMER_TYPES)).optional(),
    paymentType: z.enum(Object.values(PAYMENT_TYPES)).optional(),
    status: z.enum(Object.values(CUSTOMER_STATUSES)).optional(),
  }).strict(),
};

const updateCustomerSchema = {
  ...customerIdParamSchema,
  body: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    contactName: optionalTrimmedString(120),
    phone: optionalTrimmedString(40),
    email: optionalEmailSchema,
    address: addressSchema.optional(),
    notes: optionalTrimmedString(1000),
    customerType: z.enum(Object.values(CUSTOMER_TYPES)).optional(),
    paymentType: z.enum(Object.values(PAYMENT_TYPES)).optional(),
    status: z.enum(Object.values(CUSTOMER_STATUSES)).optional(),
  }).strict().refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required',
  }),
};

const assignCustomerSchema = {
  ...customerIdParamSchema,
  body: z.object({
    assignedSalesRep: objectIdSchema,
  }).strict(),
};

module.exports = {
  assignCustomerSchema,
  createCustomerSchema,
  customerIdParamSchema,
  listCustomersSchema,
  updateCustomerSchema,
};
