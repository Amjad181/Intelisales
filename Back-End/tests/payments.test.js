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

jest.mock('../src/models/User', () => ({
  User: {
    findById: jest.fn(),
  },
  USER_ROLES: mockUserRoles,
  USER_STATUSES: mockUserStatuses,
}));

jest.mock('../src/modules/customers/customer.model', () => ({
  Customer: {
    findById: jest.fn(),
  },
  CUSTOMER_STATUSES: mockCustomerStatuses,
  CUSTOMER_TYPES: mockCustomerTypes,
  PAYMENT_TYPES: mockPaymentTypes,
}));

jest.mock('../src/modules/invoices/invoice.model', () => ({
  Invoice: {
    find: jest.fn(),
    findById: jest.fn(),
  },
  DISCOUNT_TYPES: mockDiscountTypes,
  INVOICE_SOURCES: mockInvoiceSources,
  INVOICE_STATUSES: mockInvoiceStatuses,
  PAYMENT_METHODS: mockPaymentMethods,
  PAYMENT_STATUSES: mockPaymentStatuses,
}));

const app = require('../src/app');
const { env } = require('../src/config/env');
const { User, USER_ROLES, USER_STATUSES } = require('../src/models/User');
const { Customer, CUSTOMER_STATUSES, CUSTOMER_TYPES, PAYMENT_TYPES } = require('../src/modules/customers/customer.model');
const {
  Invoice,
  INVOICE_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} = require('../src/modules/invoices/invoice.model');

const ids = {
  admin: '64f000000000000000000001',
  manager: '64f000000000000000000003',
  supervisor: '64f000000000000000000004',
  rep: '64f000000000000000000002',
  repTwo: '64f000000000000000000006',
  accountant: '64f000000000000000000005',
  customerPayment: '65f000000000000000000001',
  customerBalance: '65f000000000000000000002',
  customerOtherRep: '65f000000000000000000003',
  customerUnknown: '65f000000000000000000099',
  draftInvoice: '68f000000000000000000001',
  confirmedInvoice: '68f000000000000000000002',
  sentInvoice: '68f000000000000000000003',
  archivedInvoice: '68f000000000000000000004',
  paidInvoice: '68f000000000000000000005',
  balanceOverdue: '68f000000000000000000006',
  balanceFuture: '68f000000000000000000007',
  balanceDraft: '68f000000000000000000008',
  balanceArchived: '68f000000000000000000009',
  balancePaid: '68f000000000000000000010',
  balanceUsd: '68f000000000000000000011',
};

let users;
let customers;
let invoices;

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
  paymentType = PAYMENT_TYPES.CASH,
  status = CUSTOMER_STATUSES.ACTIVE,
}) => ({
  id,
  _id: toObjectId(id),
  name,
  contactName: `${name} Contact`,
  phone: '+963900000000',
  email: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`,
  address: { city: 'Damascus', country: 'Syria' },
  assignedSalesRep,
  customerType,
  paymentType,
  status,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  toJSON() {
    return { ...this };
  },
});

const makeInvoice = ({
  id,
  customerId = ids.customerPayment,
  invoiceNumber,
  invoiceStatus = INVOICE_STATUSES.CONFIRMED,
  paymentStatus = PAYMENT_STATUSES.PENDING,
  totalAmount = 1000,
  paidAmount = 0,
  remainingAmount = totalAmount - paidAmount,
  currency = 'SYP',
  dueDate = new Date('2026-12-31T00:00:00.000Z'),
  createdBy = ids.rep,
}) => ({
  id,
  _id: toObjectId(id),
  invoiceNumber,
  customerId,
  customerSnapshot: {
    customerId,
    name: 'Demo Customer',
    customerType: CUSTOMER_TYPES.RETAIL,
    paymentType: PAYMENT_TYPES.CASH,
  },
  items: [
    {
      productId: '66f000000000000000000001',
      productCode: 'PAPER-A4-001',
      productName: 'Office Printer Paper',
      quantity: 1,
      unitPrice: totalAmount,
      lineSubtotal: totalAmount,
      lineDiscountAmount: 0,
      lineTaxableAmount: totalAmount,
      taxRate: 0,
      taxAmount: 0,
      lineTotal: totalAmount,
      currency,
      unit: 'PACK',
    },
  ],
  subtotal: totalAmount,
  discountType: mockDiscountTypes.NONE,
  discountValue: 0,
  discountAmount: 0,
  taxableAmount: totalAmount,
  taxRate: 0,
  taxAmount: 0,
  totalAmount,
  paidAmount,
  remainingAmount,
  currency,
  invoiceStatus,
  paymentStatus,
  paymentMethod: PAYMENT_METHODS.CASH,
  sentAt: undefined,
  dueDate,
  source: mockInvoiceSources.MANUAL,
  notes: 'Module 8 payment test invoice',
  createdBy,
  updatedBy: createdBy,
  confirmedBy: invoiceStatus === INVOICE_STATUSES.DRAFT ? undefined : ids.admin,
  confirmedAt: invoiceStatus === INVOICE_STATUSES.DRAFT ? undefined : new Date('2026-06-27T10:00:00.000Z'),
  archivedBy: invoiceStatus === INVOICE_STATUSES.ARCHIVED ? ids.manager : undefined,
  archivedAt: invoiceStatus === INVOICE_STATUSES.ARCHIVED ? new Date('2026-06-28T10:00:00.000Z') : undefined,
  createdAt: new Date('2026-06-27T09:00:00.000Z'),
  updatedAt: new Date('2026-06-27T09:00:00.000Z'),
  saveCount: 0,
  async save() {
    this.saveCount += 1;
    this.updatedAt = new Date('2026-06-27T11:00:00.000Z');

    const existingIndex = invoices.findIndex((invoice) => invoice.id === this.id);

    if (existingIndex !== -1) {
      invoices[existingIndex] = this;
    }

    return this;
  },
  toJSON() {
    return { ...this };
  },
});

const tokenFor = (user) => jwt.sign(
  {
    sub: user.id,
    role: user.role,
  },
  env.jwtAccessSecret,
  { expiresIn: '15m' },
);

const makeDocumentQuery = (result) => {
  const query = {
    populate: jest.fn(() => query),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };

  return query;
};

const makeListQuery = (result) => {
  const query = {
    sort: jest.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };

  return query;
};

const userById = (id) => users.find((user) => user.id === id);
const customerById = (id) => customers.find((customer) => customer.id === id);
const invoiceById = (id) => invoices.find((invoice) => invoice.id === id);

const applyInvoiceFilters = (filters = {}) => invoices.filter((invoice) => {
  if (filters.customerId && referenceId(invoice.customerId) !== filters.customerId) {
    return false;
  }

  if (filters.invoiceStatus && invoice.invoiceStatus !== filters.invoiceStatus) {
    return false;
  }

  if (filters.paymentStatus?.$ne && invoice.paymentStatus === filters.paymentStatus.$ne) {
    return false;
  }

  if (filters.paymentStatus && !filters.paymentStatus.$ne && invoice.paymentStatus !== filters.paymentStatus) {
    return false;
  }

  if (
    filters.remainingAmount?.$gt !== undefined
    && Number(invoice.remainingAmount || 0) <= filters.remainingAmount.$gt
  ) {
    return false;
  }

  return true;
});

const configureMocks = () => {
  User.findById.mockImplementation(async (id) => userById(id) || null);
  Customer.findById.mockImplementation((id) => makeDocumentQuery(customerById(id) || null));
  Invoice.findById.mockImplementation((id) => makeDocumentQuery(invoiceById(id) || null));
  Invoice.find.mockImplementation((filters) => makeListQuery(applyInvoiceFilters(filters)));
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
      id: ids.accountant,
      name: 'Accountant',
      email: 'accountant@intellisales.com',
      role: USER_ROLES.ACCOUNTANT,
    }),
    makeUser({
      id: ids.repTwo,
      name: 'Second Sales Representative',
      email: 'rep2@intellisales.com',
      role: USER_ROLES.SALES_REPRESENTATIVE,
    }),
  ];

  customers = [
    makeCustomer({
      id: ids.customerPayment,
      name: 'Payment Customer',
      assignedSalesRep: ids.rep,
    }),
    makeCustomer({
      id: ids.customerBalance,
      name: 'Balance Customer',
      assignedSalesRep: ids.rep,
    }),
    makeCustomer({
      id: ids.customerOtherRep,
      name: 'Other Rep Customer',
      assignedSalesRep: ids.repTwo,
    }),
  ];

  invoices = [
    makeInvoice({
      id: ids.draftInvoice,
      invoiceStatus: INVOICE_STATUSES.DRAFT,
      totalAmount: 1000,
      remainingAmount: 1000,
    }),
    makeInvoice({
      id: ids.confirmedInvoice,
      invoiceNumber: 'INV-2026-00001',
      totalAmount: 1000,
      remainingAmount: 1000,
    }),
    makeInvoice({
      id: ids.sentInvoice,
      invoiceNumber: 'INV-2026-00002',
      paymentStatus: PAYMENT_STATUSES.SENT,
      totalAmount: 1000,
      paidAmount: 100,
      remainingAmount: 900,
    }),
    makeInvoice({
      id: ids.archivedInvoice,
      invoiceNumber: 'INV-2026-00003',
      invoiceStatus: INVOICE_STATUSES.ARCHIVED,
      totalAmount: 1000,
      remainingAmount: 1000,
    }),
    makeInvoice({
      id: ids.paidInvoice,
      invoiceNumber: 'INV-2026-00004',
      paymentStatus: PAYMENT_STATUSES.PAID,
      totalAmount: 1000,
      paidAmount: 1000,
      remainingAmount: 0,
    }),
    makeInvoice({
      id: ids.balanceOverdue,
      customerId: ids.customerBalance,
      invoiceNumber: 'INV-2026-00005',
      totalAmount: 600,
      paidAmount: 100,
      remainingAmount: 500,
      dueDate: new Date('2026-01-01T00:00:00.000Z'),
    }),
    makeInvoice({
      id: ids.balanceFuture,
      customerId: ids.customerBalance,
      invoiceNumber: 'INV-2026-00006',
      totalAmount: 300,
      paidAmount: 50,
      remainingAmount: 250,
      dueDate: new Date('2026-12-31T00:00:00.000Z'),
    }),
    makeInvoice({
      id: ids.balanceDraft,
      customerId: ids.customerBalance,
      invoiceStatus: INVOICE_STATUSES.DRAFT,
      totalAmount: 999,
      remainingAmount: 999,
      dueDate: new Date('2026-01-01T00:00:00.000Z'),
    }),
    makeInvoice({
      id: ids.balanceArchived,
      customerId: ids.customerBalance,
      invoiceStatus: INVOICE_STATUSES.ARCHIVED,
      totalAmount: 999,
      remainingAmount: 999,
      dueDate: new Date('2026-01-01T00:00:00.000Z'),
    }),
    makeInvoice({
      id: ids.balancePaid,
      customerId: ids.customerBalance,
      paymentStatus: PAYMENT_STATUSES.PAID,
      totalAmount: 400,
      paidAmount: 400,
      remainingAmount: 0,
      dueDate: new Date('2026-01-01T00:00:00.000Z'),
    }),
  ];

  jest.clearAllMocks();
  configureMocks();
});

describe('payments and customer balance module', () => {
  it.each([
    ['COMPANY_ADMIN', ids.admin],
    ['SALES_MANAGER', ids.manager],
    ['ACCOUNTANT', ids.accountant],
  ])('allows %s to update cumulative paidAmount on confirmed invoice', async (roleName, userId) => {
    const response = await request(app)
      .patch(`/api/v1/invoices/${ids.confirmedInvoice}/payment`)
      .set('Authorization', `Bearer ${tokenFor(userById(userId))}`)
      .send({
        paidAmount: 400,
        paymentMethod: PAYMENT_METHODS.CASH,
      });

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response.body);
    expect(response.body.message).toBe('Invoice payment updated successfully');
    expect(response.body.data.invoice).toEqual(expect.objectContaining({
      id: ids.confirmedInvoice,
      paidAmount: 400,
      remainingAmount: 600,
      paymentStatus: PAYMENT_STATUSES.PENDING,
      paymentMethod: PAYMENT_METHODS.CASH,
      updatedBy: userId,
    }));
    expect(invoiceById(ids.confirmedInvoice).saveCount).toBe(1);
    expectSafePayload(response.body);
  });

  it.each([
    ['SALES_SUPERVISOR', ids.supervisor],
    ['SALES_REPRESENTATIVE', ids.rep],
  ])('blocks %s from updating invoice payment', async (roleName, userId) => {
    const response = await request(app)
      .patch(`/api/v1/invoices/${ids.confirmedInvoice}/payment`)
      .set('Authorization', `Bearer ${tokenFor(userById(userId))}`)
      .send({
        paidAmount: 400,
        paymentMethod: PAYMENT_METHODS.CASH,
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: 'Forbidden',
    });
  });

  it('rejects payment updates on draft and archived invoices', async () => {
    const token = tokenFor(userById(ids.admin));

    const draftResponse = await request(app)
      .patch(`/api/v1/invoices/${ids.draftInvoice}/payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ paidAmount: 100 });
    const archivedResponse = await request(app)
      .patch(`/api/v1/invoices/${ids.archivedInvoice}/payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ paidAmount: 100 });

    expect(draftResponse.status).toBe(400);
    expect(draftResponse.body.message).toBe('Only confirmed invoices can be updated for payment');
    expect(archivedResponse.status).toBe(400);
    expect(archivedResponse.body.message).toBe('Archived invoices cannot be updated for payment');
  });

  it('validates paidAmount bounds and Cash-only payment method', async () => {
    const token = tokenFor(userById(ids.admin));

    const negativeResponse = await request(app)
      .patch(`/api/v1/invoices/${ids.confirmedInvoice}/payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ paidAmount: -1 });
    const exceedResponse = await request(app)
      .patch(`/api/v1/invoices/${ids.confirmedInvoice}/payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ paidAmount: 1001 });
    const methodResponse = await request(app)
      .patch(`/api/v1/invoices/${ids.confirmedInvoice}/payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        paidAmount: 100,
        paymentMethod: 'Card',
      });

    expect(negativeResponse.status).toBe(400);
    expect(negativeResponse.body.message).toBe('Validation failed');
    expect(exceedResponse.status).toBe(400);
    expect(exceedResponse.body.message).toBe('Paid amount cannot exceed invoice total');
    expect(methodResponse.status).toBe(400);
    expect(methodResponse.body.message).toBe('Validation failed');
  });

  it('sets payment status for partial, sent, and full payment cases', async () => {
    const token = tokenFor(userById(ids.admin));

    const pendingPartialResponse = await request(app)
      .patch(`/api/v1/invoices/${ids.confirmedInvoice}/payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ paidAmount: 250 });
    const sentPartialResponse = await request(app)
      .patch(`/api/v1/invoices/${ids.sentInvoice}/payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ paidAmount: 300 });
    const fullResponse = await request(app)
      .patch(`/api/v1/invoices/${ids.confirmedInvoice}/payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ paidAmount: 1000 });

    expect(pendingPartialResponse.status).toBe(200);
    expect(pendingPartialResponse.body.data.invoice).toEqual(expect.objectContaining({
      paidAmount: 250,
      remainingAmount: 750,
      paymentStatus: PAYMENT_STATUSES.PENDING,
    }));
    expect(sentPartialResponse.status).toBe(200);
    expect(sentPartialResponse.body.data.invoice).toEqual(expect.objectContaining({
      paidAmount: 300,
      remainingAmount: 700,
      paymentStatus: PAYMENT_STATUSES.SENT,
    }));
    expect(fullResponse.status).toBe(200);
    expect(fullResponse.body.data.invoice).toEqual(expect.objectContaining({
      paidAmount: 1000,
      remainingAmount: 0,
      paymentStatus: PAYMENT_STATUSES.PAID,
    }));
  });

  it.each([
    ['COMPANY_ADMIN', ids.admin],
    ['SALES_MANAGER', ids.manager],
    ['ACCOUNTANT', ids.accountant],
  ])('allows %s to mark confirmed unpaid invoice as sent', async (roleName, userId) => {
    const response = await request(app)
      .patch(`/api/v1/invoices/${ids.confirmedInvoice}/mark-sent`)
      .set('Authorization', `Bearer ${tokenFor(userById(userId))}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response.body);
    expect(response.body.message).toBe('Invoice marked as sent successfully');
    expect(response.body.data.invoice).toEqual(expect.objectContaining({
      id: ids.confirmedInvoice,
      paymentStatus: PAYMENT_STATUSES.SENT,
      updatedBy: userId,
    }));
    expect(response.body.data.invoice.sentAt).toBeDefined();
    expectSafePayload(response.body);
  });

  it.each([
    ['SALES_SUPERVISOR', ids.supervisor],
    ['SALES_REPRESENTATIVE', ids.rep],
  ])('blocks %s from marking invoice as sent', async (roleName, userId) => {
    const response = await request(app)
      .patch(`/api/v1/invoices/${ids.confirmedInvoice}/mark-sent`)
      .set('Authorization', `Bearer ${tokenFor(userById(userId))}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: 'Forbidden',
    });
  });

  it('rejects mark-sent for draft, archived, and fully paid invoices', async () => {
    const token = tokenFor(userById(ids.admin));

    const draftResponse = await request(app)
      .patch(`/api/v1/invoices/${ids.draftInvoice}/mark-sent`)
      .set('Authorization', `Bearer ${token}`);
    const archivedResponse = await request(app)
      .patch(`/api/v1/invoices/${ids.archivedInvoice}/mark-sent`)
      .set('Authorization', `Bearer ${token}`);
    const paidResponse = await request(app)
      .patch(`/api/v1/invoices/${ids.paidInvoice}/mark-sent`)
      .set('Authorization', `Bearer ${token}`);

    expect(draftResponse.status).toBe(400);
    expect(draftResponse.body.message).toBe('Only confirmed invoices can be marked as sent');
    expect(archivedResponse.status).toBe(400);
    expect(archivedResponse.body.message).toBe('Archived invoices cannot be marked as sent');
    expect(paidResponse.status).toBe(400);
    expect(paidResponse.body.message).toBe('Fully paid invoices cannot be marked as sent');
  });

  it('calculates customer balance from confirmed unpaid invoices only', async () => {
    const response = await request(app)
      .get(`/api/v1/customers/${ids.customerBalance}/balance`)
      .set('Authorization', `Bearer ${tokenFor(userById(ids.admin))}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response.body);
    expect(response.body.message).toBe('Customer balance fetched successfully');
    expect(response.body.data.customer).toEqual({
      id: ids.customerBalance,
      name: 'Balance Customer',
      customerType: CUSTOMER_TYPES.RETAIL,
    });
    expect(response.body.data.balance).toEqual({
      currency: 'SYP',
      totalBalance: 750,
      invoiceCount: 2,
      overdueBalance: 500,
      overdueInvoiceCount: 1,
      balancesByCurrency: [
        {
          currency: 'SYP',
          totalBalance: 750,
          invoiceCount: 2,
          overdueBalance: 500,
          overdueInvoiceCount: 1,
        },
      ],
    });
    expect(response.body.data.invoices).toHaveLength(2);
    expect(response.body.data.invoices.map((invoice) => invoice.id)).toEqual([
      ids.balanceOverdue,
      ids.balanceFuture,
    ]);
    expect(response.body.data.invoices[0].isOverdue).toBe(true);
    expect(response.body.data.invoices[1].isOverdue).toBe(false);
    expectSafePayload(response.body);
  });

  it('supports accountant and assigned sales rep balance access, and blocks unassigned reps', async () => {
    const accountantResponse = await request(app)
      .get(`/api/v1/customers/${ids.customerBalance}/balance`)
      .set('Authorization', `Bearer ${tokenFor(userById(ids.accountant))}`);
    const assignedRepResponse = await request(app)
      .get(`/api/v1/customers/${ids.customerBalance}/balance`)
      .set('Authorization', `Bearer ${tokenFor(userById(ids.rep))}`);
    const unassignedRepResponse = await request(app)
      .get(`/api/v1/customers/${ids.customerOtherRep}/balance`)
      .set('Authorization', `Bearer ${tokenFor(userById(ids.rep))}`);

    expect(accountantResponse.status).toBe(200);
    expect(assignedRepResponse.status).toBe(200);
    expect(unassignedRepResponse.status).toBe(403);
    expect(unassignedRepResponse.body).toEqual({
      success: false,
      message: 'Forbidden',
    });
  });

  it('returns validation error for invalid customer id and 404 for unknown customer balance', async () => {
    const token = tokenFor(userById(ids.admin));

    const invalidResponse = await request(app)
      .get('/api/v1/customers/not-valid/balance')
      .set('Authorization', `Bearer ${token}`);
    const unknownResponse = await request(app)
      .get(`/api/v1/customers/${ids.customerUnknown}/balance`)
      .set('Authorization', `Bearer ${token}`);

    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body.success).toBe(false);
    expect(invalidResponse.body.message).toBe('Validation failed');
    expect(Array.isArray(invalidResponse.body.errors)).toBe(true);
    expect(unknownResponse.status).toBe(404);
    expect(unknownResponse.body).toEqual({
      success: false,
      message: 'Customer not found',
    });
  });

  it('returns balancesByCurrency without pretending one total when currencies differ', async () => {
    invoices.push(makeInvoice({
      id: ids.balanceUsd,
      customerId: ids.customerBalance,
      invoiceNumber: 'INV-2026-00007',
      totalAmount: 100,
      paidAmount: 0,
      remainingAmount: 100,
      currency: 'USD',
      dueDate: new Date('2026-12-31T00:00:00.000Z'),
    }));

    const response = await request(app)
      .get(`/api/v1/customers/${ids.customerBalance}/balance`)
      .set('Authorization', `Bearer ${tokenFor(userById(ids.admin))}`);

    expect(response.status).toBe(200);
    expect(response.body.data.balance).not.toHaveProperty('currency');
    expect(response.body.data.balance).not.toHaveProperty('totalBalance');
    expect(response.body.data.balance.invoiceCount).toBe(3);
    expect(response.body.data.balance.balancesByCurrency).toEqual(expect.arrayContaining([
      expect.objectContaining({
        currency: 'SYP',
        totalBalance: 750,
        invoiceCount: 2,
      }),
      expect.objectContaining({
        currency: 'USD',
        totalBalance: 100,
        invoiceCount: 1,
      }),
    ]));
  });
});
