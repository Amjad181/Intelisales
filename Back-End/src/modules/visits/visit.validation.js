const { z } = require('zod');

const { VISIT_OUTCOMES, VISIT_STATUSES } = require('./visit.model');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

const optionalTrimmedString = (maxLength) => z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : value),
  z.string().trim().max(maxLength).optional(),
);

const optionalNumber = z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : Number(value)),
  z.number().optional(),
);

const optionalDateSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
}, z.date().optional());

const requiredDateSchema = z.preprocess((value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
}, z.date());

const isTodayOrFuture = (date) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return date >= startOfToday;
};

const locationSchema = z.object({
  address: optionalTrimmedString(300),
  city: optionalTrimmedString(120),
  latitude: optionalNumber.refine((value) => value === undefined || (value >= -90 && value <= 90), {
    message: 'Latitude must be between -90 and 90',
  }),
  longitude: optionalNumber.refine((value) => value === undefined || (value >= -180 && value <= 180), {
    message: 'Longitude must be between -180 and 180',
  }),
}).strict();

const listVisitsQueryBaseSchema = z.object({
  page: z.preprocess((value) => (value === undefined ? 1 : Number(value)), z.number().int().positive()),
  limit: z.preprocess((value) => (value === undefined ? 10 : Number(value)), z.number().int().positive().max(100)),
  status: z.enum(Object.values(VISIT_STATUSES)).optional(),
  outcome: z.enum(Object.values(VISIT_OUTCOMES)).optional(),
  customer: objectIdSchema.optional(),
  salesRep: objectIdSchema.optional(),
  dateFrom: optionalDateSchema,
  dateTo: optionalDateSchema,
  search: optionalTrimmedString(120),
  sortBy: z.enum(['visitDate', 'createdAt', 'status', 'outcome']).default('visitDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const dateRangeRule = (query) => (
  query.dateFrom === undefined
    || query.dateTo === undefined
    || query.dateFrom <= query.dateTo
);

const listVisitsSchema = {
  query: listVisitsQueryBaseSchema.refine(dateRangeRule, {
    message: 'dateFrom must be before or equal to dateTo',
  }),
};

const visitIdParamSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
};

const customerVisitsSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
  query: listVisitsQueryBaseSchema
    .pick({
      page: true,
      limit: true,
      status: true,
      dateFrom: true,
      dateTo: true,
      sortBy: true,
      sortOrder: true,
    })
    .refine(dateRangeRule, {
      message: 'dateFrom must be before or equal to dateTo',
    }),
};

const createVisitSchema = {
  body: z.object({
    customer: objectIdSchema,
    salesRep: objectIdSchema.optional(),
    visitDate: requiredDateSchema.refine(isTodayOrFuture, {
      message: 'visitDate must be today or in the future',
    }),
    purpose: optionalTrimmedString(300),
    notes: optionalTrimmedString(2000),
    nextAction: optionalTrimmedString(500),
    nextVisitDate: optionalDateSchema,
    location: locationSchema.optional(),
  }).strict(),
};

const updateVisitSchema = {
  ...visitIdParamSchema,
  body: z.object({
    customer: objectIdSchema.optional(),
    salesRep: objectIdSchema.optional(),
    visitDate: requiredDateSchema.refine(isTodayOrFuture, {
      message: 'visitDate must be today or in the future',
    }).optional(),
    purpose: optionalTrimmedString(300),
    notes: optionalTrimmedString(2000),
    nextAction: optionalTrimmedString(500),
    nextVisitDate: optionalDateSchema,
    location: locationSchema.optional(),
  }).strict().refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required',
  }),
};

const completeVisitSchema = {
  ...visitIdParamSchema,
  body: z.object({
    notes: optionalTrimmedString(2000),
    outcome: z.enum([
      VISIT_OUTCOMES.ORDER_PLACED,
      VISIT_OUTCOMES.PAYMENT_COLLECTED,
      VISIT_OUTCOMES.FOLLOW_UP_NEEDED,
      VISIT_OUTCOMES.NO_INTEREST,
      VISIT_OUTCOMES.CUSTOMER_UNAVAILABLE,
      VISIT_OUTCOMES.OTHER,
    ]),
    nextAction: optionalTrimmedString(500),
    nextVisitDate: optionalDateSchema,
  }).strict(),
};

const cancelVisitSchema = {
  ...visitIdParamSchema,
  body: z.object({
    notes: optionalTrimmedString(2000),
  }).strict(),
};

module.exports = {
  cancelVisitSchema,
  completeVisitSchema,
  createVisitSchema,
  customerVisitsSchema,
  listVisitsSchema,
  updateVisitSchema,
  visitIdParamSchema,
};
