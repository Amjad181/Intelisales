const jwt = require('jsonwebtoken');
const request = require('supertest');

const mockUserRoles = Object.freeze({
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  SALES_MANAGER: 'SALES_MANAGER',
  SALES_SUPERVISOR: 'SALES_SUPERVISOR',
  SALES_REPRESENTATIVE: 'SALES_REPRESENTATIVE',
  ACCOUNTANT: 'ACCOUNTANT',
});

const mockUserStatuses = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

const mockCustomerStatuses = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

const mockCustomerTypes = Object.freeze({
  RETAIL: 'Retail',
  WHOLESALE: 'Wholesale',
  KEY_ACCOUNT: 'KeyAccount',
});

const mockPaymentTypes = Object.freeze({
  CASH: 'Cash',
  CREDIT: 'Credit',
});

const mockProductStatuses = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

const mockProductUnits = Object.freeze({
  PIECE: 'PIECE',
  BOX: 'BOX',
  KG: 'KG',
  LITER: 'LITER',
  METER: 'METER',
  PACK: 'PACK',
});

const mockInvoiceStatuses = Object.freeze({
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  ARCHIVED: 'ARCHIVED',
});

const mockPaymentStatuses = Object.freeze({
  PENDING: 'PENDING',
  SENT: 'SENT',
  PAID: 'PAID',
});

const mockPaymentMethods = Object.freeze({
  CASH: 'Cash',
});

const mockDiscountTypes = Object.freeze({
  NONE: 'NONE',
  AMOUNT: 'AMOUNT',
  PERCENTAGE: 'PERCENTAGE',
});

const mockInvoiceSources = Object.freeze({
  MANUAL: 'MANUAL',
  VOICE_TEXT: 'VOICE_TEXT',
});

const mockVisitStatuses = Object.freeze({
  PLANNED: 'PLANNED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

const mockVisitOutcomes = Object.freeze({
  NONE: 'NONE',
  ORDER_PLACED: 'ORDER_PLACED',
  PAYMENT_COLLECTED: 'PAYMENT_COLLECTED',
  FOLLOW_UP_NEEDED: 'FOLLOW_UP_NEEDED',
  NO_INTEREST: 'NO_INTEREST',
  CUSTOMER_UNAVAILABLE: 'CUSTOMER_UNAVAILABLE',
  OTHER: 'OTHER',
});

jest.mock('../src/models/User', () => ({
  User: {
    find: jest.fn(),
    findById: jest.fn(),
  },
  USER_ROLES: mockUserRoles,
  USER_STATUSES: mockUserStatuses,
}));

jest.mock('../src/modules/customers/customer.model', () => ({
  Customer: {
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  },
  CUSTOMER_STATUSES: mockCustomerStatuses,
  CUSTOMER_TYPES: mockCustomerTypes,
  PAYMENT_TYPES: mockPaymentTypes,
}));

jest.mock('../src/modules/products/product.model', () => ({
  Product: {
    findById: jest.fn(),
    countDocuments: jest.fn(),
  },
  PRODUCT_STATUSES: mockProductStatuses,
  PRODUCT_UNITS: mockProductUnits,
}));

jest.mock('../src/modules/invoices/invoice.model', () => ({
  Invoice: {
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  },
  DISCOUNT_TYPES: mockDiscountTypes,
  INVOICE_SOURCES: mockInvoiceSources,
  INVOICE_STATUSES: mockInvoiceStatuses,
  PAYMENT_METHODS: mockPaymentMethods,
  PAYMENT_STATUSES: mockPaymentStatuses,
}));

jest.mock('../src/modules/visits/visit.model', () => ({
  Visit: {
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  },
  VISIT_OUTCOMES: mockVisitOutcomes,
  VISIT_STATUSES: mockVisitStatuses,
}));

const app = require('../src/app');
const { env } = require('../src/config/env');
const { User, USER_ROLES, USER_STATUSES } = require('../src/models/User');
const {
  Customer,
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
} = require('../src/modules/customers/customer.model');
const { Product, PRODUCT_STATUSES } = require('../src/modules/products/product.model');
const {
  Invoice,
  INVOICE_STATUSES,
  PAYMENT_STATUSES,
} = require('../src/modules/invoices/invoice.model');
const { Visit, VISIT_OUTCOMES, VISIT_STATUSES } = require('../src/modules/visits/visit.model');

const ids = {
  admin: '64f000000000000000000001',
  manager: '64f000000000000000000003',
  supervisor: '64f000000000000000000004',
  rep: '64f000000000000000000002',
  repTwo: '64f000000000000000000006',
  accountant: '64f000000000000000000005',
  customerOne: '65f000000000000000000001',
  customerTwo: '65f000000000000000000002',
  customerThree: '65f000000000000000000003',
  productOne: '66f000000000000000000001',
  productTwo: '66f000000000000000000002',
  invoiceConfirmed: '68f000000000000000000001',
  invoicePaid: '68f000000000000000000002',
  invoiceDraft: '68f000000000000000000003',
  invoiceArchived: '68f000000000000000000004',
  invoiceOtherRep: '68f000000000000000000005',
  visitPlanned: '69f000000000000000000001',
  visitCompleted: '69f000000000000000000002',
  visitOtherRep: '69f000000000000000000003',
};

let users;
let customers;
let products;
let invoices;
let visits;

const toObjectId = (id) => ({ toString: () => id });

const referenceId = (reference) => {
  if (!reference) {
    return undefined;
  }

  if (typeof reference === 'string') {
    return reference;
  }

  if (reference._id && typeof reference._id.toString === 'function') {
    return reference._id.toString();
  }

  if (
    typeof reference.toString === 'function'
    && reference.toString !== Object.prototype.toString
  ) {
    return reference.toString();
  }

  if (reference.id && typeof reference.id === 'string') {
    return reference.id;
  }

  return undefined;
};

const getValue = (object, path) => path.split('.').reduce((value, key) => (
  value ? value[key] : undefined
), object);

const makeUser = ({
  id,
  name,
  email,
  role,
  status = USER_STATUSES.ACTIVE,
}) => ({
  id,
  _id: toObjectId(id),
  name,
  email,
  role,
  status,
  password: 'hashed-password',
  refreshTokenVersion: 0,
  __v: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  },
});

const makeCustomer = ({
  id,
  name,
  assignedSalesRep = ids.rep,
  customerType = CUSTOMER_TYPES.RETAIL,
  status = CUSTOMER_STATUSES.ACTIVE,
}) => ({
  id,
  _id: toObjectId(id),
  name,
  contactName: `${name} Contact`,
  phone: '+963900000000',
  assignedSalesRep,
  customerType,
  status,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const makeProduct = ({
  id,
  name,
  status = PRODUCT_STATUSES.ACTIVE,
}) => ({
  id,
  _id: toObjectId(id),
  name,
  status,
});

// The sales-reps dashboard scopes totalSalesAmount to the current calendar month, so
// fixtures relying on the default confirmedAt must fall within "now"'s month regardless
// of when the suite runs (day 27 exists in every month, so this never overflows).
const dayInCurrentMonth = (day, hour) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, hour));
};

const makeInvoice = ({
  id,
  invoiceNumber,
  customerId = ids.customerOne,
  createdBy = ids.rep,
  invoiceStatus = INVOICE_STATUSES.CONFIRMED,
  paymentStatus = PAYMENT_STATUSES.PENDING,
  totalAmount = 1000,
  paidAmount = 100,
  remainingAmount = 900,
  dueDate = new Date('2026-01-01T00:00:00.000Z'),
  confirmedAt = dayInCurrentMonth(27, 10),
  createdAt = new Date('2026-06-27T09:00:00.000Z'),
  updatedAt = new Date('2026-06-27T11:00:00.000Z'),
}) => ({
  id,
  _id: toObjectId(id),
  invoiceNumber,
  customerId,
  customerSnapshot: {
    name: `Customer ${customerId.slice(-1)}`,
    customerType: CUSTOMER_TYPES.RETAIL,
  },
  invoiceStatus,
  paymentStatus,
  totalAmount,
  paidAmount,
  remainingAmount,
  currency: 'SYP',
  dueDate,
  createdBy,
  confirmedAt,
  createdAt,
  updatedAt,
});

const makeVisit = ({
  id,
  customer = ids.customerOne,
  salesRep = ids.rep,
  status = VISIT_STATUSES.PLANNED,
  outcome = VISIT_OUTCOMES.NONE,
  visitDate = new Date('2030-02-01T10:00:00.000Z'),
  purpose = 'Customer visit',
  completedAt,
  createdAt = new Date('2026-06-27T09:30:00.000Z'),
  updatedAt = new Date('2026-06-27T12:00:00.000Z'),
}) => ({
  id,
  _id: toObjectId(id),
  customer,
  salesRep,
  status,
  outcome,
  visitDate,
  purpose,
  completedAt,
  createdAt,
  updatedAt,
});

const tokenFor = (user) => jwt.sign(
  {
    sub: user.id,
    role: user.role,
  },
  env.jwtAccessSecret,
  { expiresIn: '15m' },
);

const userById = (id) => users.find((user) => user.id === id);

const matchesValue = (actual, expected) => {
  if (expected instanceof RegExp) {
    return expected.test(String(actual || ''));
  }

  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if (expected.$ne !== undefined) {
      return actual !== expected.$ne;
    }

    if (expected.$in !== undefined) {
      return expected.$in.includes(referenceId(actual));
    }

    if (expected.$lt !== undefined) {
      return actual < expected.$lt;
    }

    if (expected.$lte !== undefined) {
      return actual <= expected.$lte;
    }

    if (expected.$gt !== undefined) {
      return actual > expected.$gt;
    }

    if (expected.$gte !== undefined) {
      return actual >= expected.$gte;
    }
  }

  return referenceId(actual) === expected || actual === expected;
};

const matchesFilter = (item, filter = {}) => Object.entries(filter).every(([field, expected]) => {
  if (field === '$or') {
    return expected.some((candidate) => matchesFilter(item, candidate));
  }

  if (field === '$and') {
    return expected.every((candidate) => matchesFilter(item, candidate));
  }

  return matchesValue(getValue(item, field), expected);
});

const makeListQuery = (result) => {
  const query = {
    populate: jest.fn(() => query),
    select: jest.fn(() => query),
    sort: jest.fn((sort) => {
      const entries = Object.entries(sort);

      result.sort((left, right) => {
        for (const [field, direction] of entries) {
          const leftValue = getValue(left, field);
          const rightValue = getValue(right, field);
          const comparison = String(leftValue || '').localeCompare(String(rightValue || ''));

          if (comparison !== 0) {
            return comparison * direction;
          }
        }

        return 0;
      });

      return query;
    }),
    limit: jest.fn((limit) => Promise.resolve(result.slice(0, limit))),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };

  return query;
};

const expectSuccessEnvelope = (body) => {
  expect(body.success).toBe(true);
  expect(body).toHaveProperty('message');
  expect(body).toHaveProperty('data');
};

const expectSafePayload = (payload) => {
  const serialized = JSON.stringify(payload);

  expect(serialized).not.toContain('hashed-password');
  expect(serialized).not.toContain('refreshTokenVersion');
  expect(serialized).not.toContain('__v');
};

const configureMocks = () => {
  User.findById.mockImplementation(async (id) => userById(id) || null);
  User.find.mockImplementation((filters) => makeListQuery(users.filter((user) => matchesFilter(user, filters))));

  Customer.find.mockImplementation((filters) => makeListQuery(customers.filter((customer) => matchesFilter(customer, filters))));
  Customer.countDocuments.mockImplementation(async (filters) => customers.filter((customer) => matchesFilter(customer, filters)).length);

  Product.countDocuments.mockImplementation(async (filters) => products.filter((product) => matchesFilter(product, filters)).length);

  Invoice.find.mockImplementation((filters) => makeListQuery(invoices.filter((invoice) => matchesFilter(invoice, filters))));
  Invoice.countDocuments.mockImplementation(async (filters) => invoices.filter((invoice) => matchesFilter(invoice, filters)).length);

  Visit.find.mockImplementation((filters) => makeListQuery(visits.filter((visit) => matchesFilter(visit, filters))));
  Visit.countDocuments.mockImplementation(async (filters) => visits.filter((visit) => matchesFilter(visit, filters)).length);
};

beforeEach(() => {
  users = [
    makeUser({
      id: ids.admin,
      name: 'Company Admin',
      email: 'admin@intellisales.com',
      role: USER_ROLES.COMPANY_ADMIN,
    }),
    makeUser({
      id: ids.manager,
      name: 'Sales Manager',
      email: 'manager@intellisales.com',
      role: USER_ROLES.SALES_MANAGER,
    }),
    makeUser({
      id: ids.supervisor,
      name: 'Sales Supervisor',
      email: 'supervisor@intellisales.com',
      role: USER_ROLES.SALES_SUPERVISOR,
    }),
    makeUser({
      id: ids.rep,
      name: 'Sales Representative',
      email: 'rep@intellisales.com',
      role: USER_ROLES.SALES_REPRESENTATIVE,
    }),
    makeUser({
      id: ids.repTwo,
      name: 'Second Sales Representative',
      email: 'rep2@intellisales.com',
      role: USER_ROLES.SALES_REPRESENTATIVE,
    }),
    makeUser({
      id: ids.accountant,
      name: 'Accountant',
      email: 'accountant@intellisales.com',
      role: USER_ROLES.ACCOUNTANT,
    }),
  ];

  customers = [
    makeCustomer({
      id: ids.customerOne,
      name: 'Retail Market',
      assignedSalesRep: ids.rep,
      customerType: CUSTOMER_TYPES.RETAIL,
      status: CUSTOMER_STATUSES.ACTIVE,
    }),
    makeCustomer({
      id: ids.customerTwo,
      name: 'Wholesale Store',
      assignedSalesRep: ids.repTwo,
      customerType: CUSTOMER_TYPES.WHOLESALE,
      status: CUSTOMER_STATUSES.ACTIVE,
    }),
    makeCustomer({
      id: ids.customerThree,
      name: 'Inactive Key Account',
      assignedSalesRep: ids.rep,
      customerType: CUSTOMER_TYPES.KEY_ACCOUNT,
      status: CUSTOMER_STATUSES.INACTIVE,
    }),
  ];

  products = [
    makeProduct({ id: ids.productOne, name: 'Paper', status: PRODUCT_STATUSES.ACTIVE }),
    makeProduct({ id: ids.productTwo, name: 'Tape', status: PRODUCT_STATUSES.INACTIVE }),
  ];

  invoices = [
    makeInvoice({
      id: ids.invoiceConfirmed,
      invoiceNumber: 'INV-2026-00001',
      customerId: ids.customerOne,
      createdBy: ids.rep,
      totalAmount: 1000,
      paidAmount: 200,
      remainingAmount: 800,
      dueDate: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-27T12:00:00.000Z'),
    }),
    makeInvoice({
      id: ids.invoicePaid,
      invoiceNumber: 'INV-2026-00002',
      customerId: ids.customerOne,
      createdBy: ids.rep,
      paymentStatus: PAYMENT_STATUSES.PAID,
      totalAmount: 500,
      paidAmount: 500,
      remainingAmount: 0,
      dueDate: new Date('2026-12-31T00:00:00.000Z'),
      updatedAt: new Date('2026-06-27T11:00:00.000Z'),
    }),
    makeInvoice({
      id: ids.invoiceDraft,
      invoiceNumber: undefined,
      customerId: ids.customerOne,
      createdBy: ids.rep,
      invoiceStatus: INVOICE_STATUSES.DRAFT,
      paymentStatus: PAYMENT_STATUSES.PENDING,
      totalAmount: 9999,
      paidAmount: 0,
      remainingAmount: 9999,
      confirmedAt: undefined,
      updatedAt: new Date('2026-06-27T10:00:00.000Z'),
    }),
    makeInvoice({
      id: ids.invoiceArchived,
      invoiceNumber: 'INV-2026-00003',
      customerId: ids.customerOne,
      createdBy: ids.rep,
      invoiceStatus: INVOICE_STATUSES.ARCHIVED,
      paymentStatus: PAYMENT_STATUSES.PENDING,
      totalAmount: 700,
      paidAmount: 100,
      remainingAmount: 600,
      updatedAt: new Date('2026-06-27T09:00:00.000Z'),
    }),
    makeInvoice({
      id: ids.invoiceOtherRep,
      invoiceNumber: 'INV-2026-00004',
      customerId: ids.customerTwo,
      createdBy: ids.repTwo,
      paymentStatus: PAYMENT_STATUSES.SENT,
      totalAmount: 2000,
      paidAmount: 300,
      remainingAmount: 1700,
      dueDate: new Date('2026-12-31T00:00:00.000Z'),
      updatedAt: new Date('2026-06-27T13:00:00.000Z'),
    }),
  ];

  visits = [
    makeVisit({
      id: ids.visitPlanned,
      customer: ids.customerOne,
      salesRep: ids.rep,
      status: VISIT_STATUSES.PLANNED,
      visitDate: new Date('2030-02-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-27T13:00:00.000Z'),
    }),
    makeVisit({
      id: ids.visitCompleted,
      customer: ids.customerOne,
      salesRep: ids.rep,
      status: VISIT_STATUSES.COMPLETED,
      outcome: VISIT_OUTCOMES.ORDER_PLACED,
      completedAt: new Date('2026-06-27T12:30:00.000Z'),
      updatedAt: new Date('2026-06-27T12:30:00.000Z'),
    }),
    makeVisit({
      id: ids.visitOtherRep,
      customer: ids.customerTwo,
      salesRep: ids.repTwo,
      status: VISIT_STATUSES.PLANNED,
      visitDate: new Date('2026-01-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-27T11:30:00.000Z'),
    }),
  ];

  jest.clearAllMocks();
  configureMocks();
});

describe('dashboard module', () => {
  it('returns 401 for dashboard routes without token', async () => {
    const summaryResponse = await request(app).get('/api/v1/dashboard/summary');
    const salesRepsResponse = await request(app).get('/api/v1/dashboard/sales-reps');

    expect(summaryResponse.status).toBe(401);
    expect(summaryResponse.body).toEqual({
      success: false,
      message: 'Authentication required',
    });
    expect(salesRepsResponse.status).toBe(401);
  });

  it('returns full management dashboard summary with unified response format', async () => {
    const response = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${tokenFor(userById(ids.admin))}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response.body);
    expect(response.body.message).toBe('Dashboard summary fetched successfully');

    const { summary } = response.body.data;

    expect(summary.scope).toBe('ALL');
    expect(summary).toEqual(expect.objectContaining({
      customers: expect.any(Object),
      products: expect.any(Object),
      invoices: expect.any(Object),
      visits: expect.any(Object),
      recent: expect.any(Object),
    }));
    expect(summary.customers).toEqual({
      total: 3,
      active: 2,
      inactive: 1,
      byType: {
        Retail: 1,
        Wholesale: 1,
        KeyAccount: 1,
      },
    });
    expect(summary.products).toEqual({
      total: 2,
      active: 1,
      inactive: 1,
    });
    expect(summary.invoices).toEqual(expect.objectContaining({
      total: 5,
      draft: 1,
      confirmed: 3,
      archived: 1,
      sent: 1,
      paid: 1,
      pending: 3,
      totalAmount: 3500,
      paidAmount: 1000,
      remainingAmount: 2500,
      overdueAmount: 800,
      currency: 'SYP',
    }));
    expect(summary.visits).toEqual(expect.objectContaining({
      total: 3,
      planned: 2,
      completed: 1,
      cancelled: 0,
    }));
    expect(summary.recent.invoices).toHaveLength(5);
    expect(summary.recent.visits).toHaveLength(3);
    expectSafePayload(response.body);
  });

  it('limits sales representative dashboard to assigned customers, visible invoices, and own visits', async () => {
    const response = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${tokenFor(userById(ids.rep))}`);

    expect(response.status).toBe(200);
    const { summary } = response.body.data;

    expect(summary.scope).toBe('OWN');
    expect(summary.customers.total).toBe(2);
    expect(summary.customers.active).toBe(1);
    expect(summary.products).toEqual({
      total: 1,
      active: 1,
      inactive: 0,
    });
    expect(summary.invoices.total).toBe(4);
    expect(summary.invoices.confirmed).toBe(2);
    expect(summary.invoices.totalAmount).toBe(1500);
    expect(summary.invoices.remainingAmount).toBe(800);
    expect(summary.visits.total).toBe(2);
    expect(summary.visits.completed).toBe(1);
    expect(summary.recent.invoices.every((invoice) => invoice.createdBy === ids.rep)).toBe(true);
    expect(summary.recent.visits.every((visit) => visit.salesRep === ids.rep)).toBe(true);
    expect(summary.recent.invoices.map((invoice) => invoice.id)).not.toContain(ids.invoiceOtherRep);
    expect(summary.recent.visits.map((visit) => visit.id)).not.toContain(ids.visitOtherRep);
  });

  it('allows accountant to read financial dashboard but blocks sales representative summaries', async () => {
    const accountantToken = tokenFor(userById(ids.accountant));

    const summaryResponse = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${accountantToken}`);
    const salesRepsResponse = await request(app)
      .get('/api/v1/dashboard/sales-reps')
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(summaryResponse.status).toBe(200);
    expect(summaryResponse.body.data.summary.scope).toBe('ALL');
    expect(summaryResponse.body.data.summary.invoices.remainingAmount).toBe(2500);
    expect(salesRepsResponse.status).toBe(403);
    expect(salesRepsResponse.body).toEqual({
      success: false,
      message: 'Forbidden',
    });
  });

  it.each([
    ['COMPANY_ADMIN', ids.admin],
    ['SALES_MANAGER', ids.manager],
    ['SALES_SUPERVISOR', ids.supervisor],
  ])('allows %s to read sales representative dashboard safely', async (roleName, userId) => {
    const response = await request(app)
      .get('/api/v1/dashboard/sales-reps')
      .set('Authorization', `Bearer ${tokenFor(userById(userId))}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response.body);
    expect(response.body.count).toBe(2);
    expect(response.body.message).toBe('Sales representative dashboard fetched successfully');
    expect(response.body.data.salesReps).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: ids.rep,
        name: 'Sales Representative',
        email: 'rep@intellisales.com',
        status: USER_STATUSES.ACTIVE,
        assignedCustomers: 2,
        invoiceCount: 4,
        confirmedInvoiceCount: 2,
        totalSalesAmount: 1500,
        paidAmount: 700,
        remainingAmount: 800,
        visitCount: 2,
        completedVisitCount: 1,
      }),
      expect.objectContaining({
        id: ids.repTwo,
        assignedCustomers: 1,
        invoiceCount: 1,
        confirmedInvoiceCount: 1,
        totalSalesAmount: 2000,
        paidAmount: 300,
        remainingAmount: 1700,
        visitCount: 1,
      }),
    ]));
    expectSafePayload(response.body);
  });

  it('blocks sales representative from sales representative dashboard', async () => {
    const response = await request(app)
      .get('/api/v1/dashboard/sales-reps')
      .set('Authorization', `Bearer ${tokenFor(userById(ids.rep))}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: 'Forbidden',
    });
  });

  it('returns recent activity with limit and role-aware filtering', async () => {
    const adminResponse = await request(app)
      .get('/api/v1/dashboard/recent-activity?limit=3')
      .set('Authorization', `Bearer ${tokenFor(userById(ids.admin))}`);
    const repResponse = await request(app)
      .get('/api/v1/dashboard/recent-activity?limit=10')
      .set('Authorization', `Bearer ${tokenFor(userById(ids.rep))}`);

    expect(adminResponse.status).toBe(200);
    expectSuccessEnvelope(adminResponse.body);
    expect(adminResponse.body.message).toBe('Recent activity fetched successfully');
    expect(adminResponse.body.data.activity).toHaveLength(3);
    expect(adminResponse.body.data.activity[0]).toEqual(expect.objectContaining({
      type: expect.any(String),
      title: expect.any(String),
      entityId: expect.any(String),
      entityType: expect.any(String),
    }));
    expect(repResponse.status).toBe(200);
    expect(repResponse.body.data.activity.map((item) => item.entityId)).not.toContain(ids.invoiceOtherRep);
    expect(repResponse.body.data.activity.map((item) => item.entityId)).not.toContain(ids.visitOtherRep);
  });

  it('returns validation error for invalid recent activity limit and unsupported params', async () => {
    const token = tokenFor(userById(ids.admin));
    const invalidLimitResponse = await request(app)
      .get('/api/v1/dashboard/recent-activity?limit=0')
      .set('Authorization', `Bearer ${token}`);
    const unsupportedResponse = await request(app)
      .get('/api/v1/dashboard/recent-activity?limit=10&extra=true')
      .set('Authorization', `Bearer ${token}`);

    expect(invalidLimitResponse.status).toBe(400);
    expect(invalidLimitResponse.body.success).toBe(false);
    expect(invalidLimitResponse.body.message).toBe('Validation failed');
    expect(Array.isArray(invalidLimitResponse.body.errors)).toBe(true);
    expect(unsupportedResponse.status).toBe(400);
    expect(unsupportedResponse.body.message).toBe('Validation failed');
  });
});
