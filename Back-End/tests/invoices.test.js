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

const mockPriceListStatuses = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
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

jest.mock('../src/modules/products/product.model', () => ({
  Product: {
    findById: jest.fn(),
  },
  PRODUCT_STATUSES: mockProductStatuses,
  PRODUCT_UNITS: mockProductUnits,
}));

jest.mock('../src/modules/priceLists/priceList.model', () => ({
  PriceList: {
    findOne: jest.fn(),
  },
  PRICE_LIST_CUSTOMER_TYPES: mockCustomerTypes,
  PRICE_LIST_STATUSES: mockPriceListStatuses,
}));

jest.mock('../src/modules/invoices/invoice.model', () => ({
  Invoice: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
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
const {
  Customer,
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
  PAYMENT_TYPES,
} = require('../src/modules/customers/customer.model');
const { Product, PRODUCT_STATUSES, PRODUCT_UNITS } = require('../src/modules/products/product.model');
const { PriceList, PRICE_LIST_STATUSES } = require('../src/modules/priceLists/priceList.model');
const { Invoice, INVOICE_STATUSES, PAYMENT_STATUSES, DISCOUNT_TYPES } = require('../src/modules/invoices/invoice.model');

const ids = {
  admin: '64f000000000000000000001',
  manager: '64f000000000000000000003',
  supervisor: '64f000000000000000000004',
  rep: '64f000000000000000000002',
  repTwo: '64f000000000000000000006',
  accountant: '64f000000000000000000005',
  customerRetail: '65f000000000000000000001',
  customerWholesale: '65f000000000000000000002',
  customerUnassigned: '65f000000000000000000003',
  customerKeyAccount: '65f000000000000000000004',
  productPaper: '66f000000000000000000001',
  productTape: '66f000000000000000000002',
  productInactive: '66f000000000000000000003',
  productMissingPrice: '66f000000000000000000004',
  retailList: '67f000000000000000000001',
  keyAccountList: '67f000000000000000000002',
  invoiceOne: '68f000000000000000000001',
};

let users;
let customers;
let products;
let priceLists;
let invoices;
let invoiceSequence;

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
});

const makeProduct = ({
  id,
  name,
  sku,
  unit = PRODUCT_UNITS.PIECE,
  basePrice = 100,
  currency = 'SYP',
  taxRate = 0,
  status = PRODUCT_STATUSES.ACTIVE,
}) => ({
  id,
  _id: toObjectId(id),
  name,
  sku,
  unit,
  basePrice,
  currency,
  taxRate,
  status,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const makePriceList = ({
  id,
  name,
  customerType,
  status = PRICE_LIST_STATUSES.ACTIVE,
  items = [],
}) => ({
  id,
  _id: toObjectId(id),
  name,
  customerType,
  status,
  items,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const makeInvoice = (payload) => {
  const id = payload.id || `68f0000000000000000000${String(invoiceSequence += 1).padStart(2, '0')}`;
  const invoice = {
    id,
    _id: toObjectId(id),
    invoiceNumber: payload.invoiceNumber,
    customerId: payload.customerId,
    customerSnapshot: payload.customerSnapshot,
    items: payload.items,
    subtotal: payload.subtotal,
    discountType: payload.discountType || DISCOUNT_TYPES.NONE,
    discountValue: payload.discountValue || 0,
    discountAmount: payload.discountAmount || 0,
    taxableAmount: payload.taxableAmount,
    taxRate: payload.taxRate,
    taxAmount: payload.taxAmount,
    totalAmount: payload.totalAmount,
    paidAmount: payload.paidAmount || 0,
    remainingAmount: payload.remainingAmount,
    currency: payload.currency || 'SYP',
    invoiceStatus: payload.invoiceStatus || INVOICE_STATUSES.DRAFT,
    paymentStatus: payload.paymentStatus || PAYMENT_STATUSES.PENDING,
    paymentMethod: payload.paymentMethod || mockPaymentMethods.CASH,
    sentAt: payload.sentAt,
    dueDate: payload.dueDate,
    source: payload.source || mockInvoiceSources.MANUAL,
    voiceText: payload.voiceText,
    notes: payload.notes,
    createdBy: payload.createdBy,
    updatedBy: payload.updatedBy,
    confirmedBy: payload.confirmedBy,
    confirmedAt: payload.confirmedAt,
    archivedBy: payload.archivedBy,
    archivedAt: payload.archivedAt,
    createdAt: payload.createdAt || new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: payload.updatedAt || new Date('2026-01-01T00:00:00.000Z'),
    __v: 0,
    async save() {
      const existingIndex = invoices.findIndex((candidate) => candidate.id === this.id);
      this.updatedAt = new Date('2026-01-02T00:00:00.000Z');

      if (existingIndex === -1) {
        invoices.push(this);
      } else {
        invoices[existingIndex] = this;
      }

      return this;
    },
    toJSON() {
      return { ...this };
    },
  };

  return invoice;
};

const tokenFor = (user) => jwt.sign(
  {
    sub: user.id,
    role: user.role,
  },
  env.jwtAccessSecret,
  { expiresIn: '15m' },
);

const productById = (id) => products.find((product) => product.id === id);
const customerById = (id) => customers.find((customer) => customer.id === id);

const applyInvoiceFilters = (filters = {}) => invoices.filter((invoice) => {
  if (filters.invoiceStatus && invoice.invoiceStatus !== filters.invoiceStatus) {
    return false;
  }

  if (filters.paymentStatus && invoice.paymentStatus !== filters.paymentStatus) {
    return false;
  }

  if (filters.customerId && referenceId(invoice.customerId) !== filters.customerId) {
    return false;
  }

  if (filters.createdBy && referenceId(invoice.createdBy) !== filters.createdBy) {
    return false;
  }

  if (filters.createdAt?.$gte && invoice.createdAt < filters.createdAt.$gte) {
    return false;
  }

  if (filters.createdAt?.$lte && invoice.createdAt > filters.createdAt.$lte) {
    return false;
  }

  if (filters.$or) {
    return filters.$or.some((condition) => Object.entries(condition).some(([field, regex]) => (
      regex.test(String(getValue(invoice, field) || ''))
    )));
  }

  return true;
});

const makeDocumentQuery = (result) => {
  const query = {
    populate: jest.fn(() => query),
    sort: jest.fn(() => query),
    select: jest.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };

  return query;
};

const makeListQuery = (result) => {
  const query = {
    populate: jest.fn(() => query),
    sort: jest.fn((sort) => {
      const [field, direction] = Object.entries(sort)[0];
      result.sort((left, right) => (
        String(getValue(left, field) || '').localeCompare(String(getValue(right, field) || '')) * direction
      ));
      return query;
    }),
    skip: jest.fn((skip) => {
      query.skipValue = skip;
      return query;
    }),
    limit: jest.fn((limit) => Promise.resolve(result.slice(
      query.skipValue || 0,
      (query.skipValue || 0) + limit,
    ))),
    skipValue: 0,
  };

  return query;
};

const configureMocks = () => {
  User.findById.mockImplementation(async (id) => users.find((user) => user.id === id) || null);
  Customer.findById.mockImplementation(async (id) => customerById(id) || null);
  Product.findById.mockImplementation(async (id) => productById(id) || null);
  PriceList.findOne.mockImplementation((filters) => makeDocumentQuery(
    priceLists.find((priceList) => (
      priceList.customerType === filters.customerType
      && priceList.status === filters.status
    )) || null,
  ));
  Invoice.find.mockImplementation((filters) => makeListQuery(applyInvoiceFilters(filters)));
  Invoice.findById.mockImplementation((id) => makeDocumentQuery(
    invoices.find((invoice) => invoice.id === id) || null,
  ));
  Invoice.findOne.mockImplementation((filters) => {
    const candidates = invoices
      .filter((invoice) => invoice.invoiceNumber && filters.invoiceNumber.test(invoice.invoiceNumber))
      .sort((left, right) => right.invoiceNumber.localeCompare(left.invoiceNumber));

    return makeDocumentQuery(candidates[0] || null);
  });
  Invoice.countDocuments.mockImplementation(async (filters) => applyInvoiceFilters(filters).length);
  Invoice.create.mockImplementation(async (payload) => {
    const invoice = makeInvoice(payload);
    invoices.push(invoice);
    return invoice;
  });
};

const createDraftInvoice = async ({
  token,
  customerId = ids.customerRetail,
  productId = ids.productPaper,
  quantity = 2,
  items,
  discountType = DISCOUNT_TYPES.NONE,
  discountValue = 0,
} = {}) => request(app)
  .post('/api/v1/invoices')
  .set('Authorization', `Bearer ${token || tokenFor(users[3])}`)
  .send({
    customerId,
    items: items || [
      {
        productId,
        quantity,
      },
    ],
    discountType,
    discountValue,
    notes: 'Draft invoice',
  });

const expectSuccessEnvelope = (body) => {
  expect(body.success).toBe(true);
  expect(body).toHaveProperty('message');
  expect(body).toHaveProperty('data');
};

const expectPaginatedEnvelope = (body) => {
  expectSuccessEnvelope(body);
  expect(body).toHaveProperty('count');
  expect(body).toHaveProperty('pagination');
  expect(Array.isArray(body.data)).toBe(true);
};

const expectSafeInvoiceUserReference = (reference) => {
  if (reference && typeof reference === 'object') {
    expect(reference).not.toHaveProperty('password');
    expect(reference).not.toHaveProperty('refreshTokenVersion');
    expect(reference).not.toHaveProperty('__v');
    expect(reference).not.toHaveProperty('_id');
  }
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
      id: ids.customerRetail,
      name: 'Retail Market',
      assignedSalesRep: ids.rep,
      customerType: CUSTOMER_TYPES.RETAIL,
      paymentType: PAYMENT_TYPES.CASH,
    }),
    makeCustomer({
      id: ids.customerWholesale,
      name: 'Wholesale Market',
      assignedSalesRep: ids.rep,
      customerType: CUSTOMER_TYPES.WHOLESALE,
    }),
    makeCustomer({
      id: ids.customerUnassigned,
      name: 'Other Rep Market',
      assignedSalesRep: ids.repTwo,
      customerType: CUSTOMER_TYPES.RETAIL,
    }),
    makeCustomer({
      id: ids.customerKeyAccount,
      name: 'Key Account Market',
      assignedSalesRep: ids.rep,
      customerType: CUSTOMER_TYPES.KEY_ACCOUNT,
      paymentType: PAYMENT_TYPES.CREDIT,
    }),
  ];

  products = [
    makeProduct({
      id: ids.productPaper,
      name: 'Office Printer Paper',
      sku: 'PAPER-A4-001',
      unit: PRODUCT_UNITS.PACK,
      basePrice: 120,
      taxRate: 0,
    }),
    makeProduct({
      id: ids.productTape,
      name: 'Packing Tape',
      sku: 'TAPE-PACK-001',
      unit: PRODUCT_UNITS.PACK,
      basePrice: 60,
      taxRate: 0,
    }),
    makeProduct({
      id: ids.productInactive,
      name: 'Inactive Scanner',
      sku: 'SCANNER-INACTIVE',
      status: PRODUCT_STATUSES.INACTIVE,
    }),
    makeProduct({
      id: ids.productMissingPrice,
      name: 'Missing Price Product',
      sku: 'NO-PRICE-001',
      status: PRODUCT_STATUSES.ACTIVE,
    }),
  ];

  priceLists = [
    makePriceList({
      id: ids.retailList,
      name: 'Retail Price List',
      customerType: CUSTOMER_TYPES.RETAIL,
      items: [
        { productId: ids.productPaper, price: 100, currency: 'SYP' },
        { productId: ids.productTape, price: 50, currency: 'SYP' },
        { productId: ids.productInactive, price: 700, currency: 'SYP' },
      ],
    }),
    makePriceList({
      id: ids.keyAccountList,
      name: 'Key Account Price List',
      customerType: CUSTOMER_TYPES.KEY_ACCOUNT,
      items: [
        { productId: ids.productTape, price: 40, currency: 'SYP' },
      ],
    }),
  ];

  invoices = [];
  invoiceSequence = 0;

  jest.clearAllMocks();
  configureMocks();
});

describe('invoices module', () => {
  it('returns 401 for GET /api/v1/invoices without token', async () => {
    const response = await request(app).get('/api/v1/invoices');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Authentication required',
    });
  });

  it('allows accountant to list invoices but not create them', async () => {
    const repToken = tokenFor(users[3]);
    const accountantToken = tokenFor(users[4]);

    await createDraftInvoice({ token: repToken });

    const listResponse = await request(app)
      .get('/api/v1/invoices')
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(listResponse.status).toBe(200);
    expectPaginatedEnvelope(listResponse.body);
    expect(listResponse.body.message).toBe('Invoices fetched successfully');
    expect(listResponse.body.count).toBe(1);

    const createResponse = await createDraftInvoice({ token: accountantToken });

    expect(createResponse.status).toBe(403);
    expect(createResponse.body).toEqual({
      success: false,
      message: 'Forbidden',
    });
  });

  it('allows accountant to get invoices but not edit, confirm, or archive them', async () => {
    const repToken = tokenFor(users[3]);
    const accountantToken = tokenFor(users[4]);
    const createResponse = await createDraftInvoice({ token: repToken });
    const invoiceId = createResponse.body.data.invoice.id;

    const getResponse = await request(app)
      .get(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(getResponse.status).toBe(200);
    expectSuccessEnvelope(getResponse.body);

    const editResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ notes: 'Accountant edit attempt' });

    expect(editResponse.status).toBe(403);
    expect(editResponse.body).toEqual({
      success: false,
      message: 'Forbidden',
    });

    const confirmResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(confirmResponse.status).toBe(403);
    expect(confirmResponse.body).toEqual({
      success: false,
      message: 'Forbidden',
    });

    const archiveResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/archive`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(archiveResponse.status).toBe(403);
    expect(archiveResponse.body).toEqual({
      success: false,
      message: 'Forbidden',
    });
  });

  it.each([
    ['COMPANY_ADMIN', 0],
    ['SALES_MANAGER', 1],
    ['SALES_SUPERVISOR', 2],
  ])('allows %s to create, edit, and confirm invoices', async (roleName, userIndex) => {
    const token = tokenFor(users[userIndex]);
    const createResponse = await createDraftInvoice({
      token,
      customerId: ids.customerUnassigned,
    });

    expect(createResponse.status).toBe(201);
    expectSuccessEnvelope(createResponse.body);

    const invoiceId = createResponse.body.data.invoice.id;
    const editResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: `${roleName} edited draft` });

    expect(editResponse.status).toBe(200);
    expect(editResponse.body.data.invoice.notes).toBe(`${roleName} edited draft`);

    const confirmResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Authorization', `Bearer ${token}`);

    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body.data.invoice.invoiceStatus).toBe(INVOICE_STATUSES.CONFIRMED);
    expect(confirmResponse.body.data.invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{5}$/);
  });

  it('creates a draft invoice for an assigned customer using customerType price list snapshots', async () => {
    const response = await createDraftInvoice();

    expect(response.status).toBe(201);
    expectSuccessEnvelope(response.body);
    expect(response.body.message).toBe('Invoice created successfully');

    const { invoice } = response.body.data;
    expect(invoice.invoiceStatus).toBe(INVOICE_STATUSES.DRAFT);
    expect(invoice.paymentStatus).toBe(PAYMENT_STATUSES.PENDING);
    expect(invoice.invoiceNumber).toBeUndefined();
    expect(invoice.customerSnapshot).toEqual(expect.objectContaining({
      customerId: ids.customerRetail,
      name: 'Retail Market',
      customerType: CUSTOMER_TYPES.RETAIL,
      paymentType: PAYMENT_TYPES.CASH,
    }));
    expect(invoice.items[0]).toEqual(expect.objectContaining({
      productId: ids.productPaper,
      productCode: 'PAPER-A4-001',
      productName: 'Office Printer Paper',
      quantity: 2,
      unitPrice: 100,
      lineSubtotal: 200,
      taxRate: 8,
      taxAmount: 16,
      lineTotal: 216,
      currency: 'SYP',
      unit: PRODUCT_UNITS.PACK,
    }));
    expect(invoice.subtotal).toBe(200);
    expect(invoice.discountAmount).toBe(0);
    expect(invoice.taxableAmount).toBe(200);
    expect(invoice.taxAmount).toBe(16);
    expect(invoice.totalAmount).toBe(216);
    expect(invoice.remainingAmount).toBe(216);
    expectSafeInvoiceUserReference(invoice.createdBy);
  });

  it('allocates invoice-level discount across item line totals', async () => {
    const response = await createDraftInvoice({
      token: tokenFor(users[0]),
      items: [
        {
          productId: ids.productPaper,
          quantity: 2,
        },
        {
          productId: ids.productTape,
          quantity: 1,
        },
      ],
      discountType: DISCOUNT_TYPES.AMOUNT,
      discountValue: 50,
    });

    expect(response.status).toBe(201);

    const { invoice } = response.body.data;
    const itemLineTotalSum = invoice.items.reduce((sum, item) => (
      Math.round((sum + item.lineTotal + Number.EPSILON) * 100) / 100
    ), 0);

    expect(invoice.subtotal).toBe(250);
    expect(invoice.discountAmount).toBe(50);
    expect(invoice.taxableAmount).toBe(200);
    expect(invoice.totalAmount).toBe(216);
    expect(itemLineTotalSum).toBe(invoice.totalAmount);
    expect(invoice.items[0]).toEqual(expect.objectContaining({
      lineSubtotal: 200,
      lineDiscountAmount: 40,
      lineTaxableAmount: 160,
      taxAmount: 12.8,
      lineTotal: 172.8,
    }));
    expect(invoice.items[1]).toEqual(expect.objectContaining({
      lineSubtotal: 50,
      lineDiscountAmount: 10,
      lineTaxableAmount: 40,
      taxAmount: 3.2,
      lineTotal: 43.2,
    }));
  });

  it('rejects amount discount greater than invoice subtotal', async () => {
    const response = await createDraftInvoice({
      token: tokenFor(users[0]),
      discountType: DISCOUNT_TYPES.AMOUNT,
      discountValue: 201,
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Discount amount cannot exceed invoice subtotal',
    });
  });

  it('rejects mixed item currencies in one invoice', async () => {
    priceLists[0].items.find((item) => item.productId === ids.productTape).currency = 'USD';

    const response = await createDraftInvoice({
      token: tokenFor(users[0]),
      items: [
        {
          productId: ids.productPaper,
          quantity: 1,
        },
        {
          productId: ids.productTape,
          quantity: 1,
        },
      ],
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Invoice items must use the same currency',
    });
  });

  it('prevents sales representative from creating invoice for unassigned customer', async () => {
    const response = await createDraftInvoice({
      customerId: ids.customerUnassigned,
    });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: 'Forbidden',
    });
  });

  it('prevents sales representative from reading, editing, or confirming another user invoice', async () => {
    const adminToken = tokenFor(users[0]);
    const repToken = tokenFor(users[3]);
    const createResponse = await createDraftInvoice({
      token: adminToken,
      customerId: ids.customerUnassigned,
    });
    const invoiceId = createResponse.body.data.invoice.id;

    const getResponse = await request(app)
      .get(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${repToken}`);

    expect(getResponse.status).toBe(403);

    const editResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ notes: 'Rep should not edit' });

    expect(editResponse.status).toBe(403);

    const confirmResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Authorization', `Bearer ${repToken}`);

    expect(confirmResponse.status).toBe(403);
  });

  it('requires active price list prices and active products for invoice creation', async () => {
    const noPriceListResponse = await createDraftInvoice({
      customerId: ids.customerWholesale,
    });

    expect(noPriceListResponse.status).toBe(400);
    expect(noPriceListResponse.body.message).toBe('Active price list is required for this customer type');

    const missingPriceResponse = await createDraftInvoice({
      productId: ids.productMissingPrice,
    });

    expect(missingPriceResponse.status).toBe(400);
    expect(missingPriceResponse.body.message).toBe('Product price was not found in the active price list');

    const inactiveProductResponse = await createDraftInvoice({
      productId: ids.productInactive,
    });

    expect(inactiveProductResponse.status).toBe(400);
    expect(inactiveProductResponse.body.message).toBe('Product must be active to add to invoice');
  });

  it('edits draft invoices and recalculates totals', async () => {
    const createResponse = await createDraftInvoice();
    const invoiceId = createResponse.body.data.invoice.id;

    const response = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${tokenFor(users[3])}`)
      .send({
        items: [
          {
            productId: ids.productPaper,
            quantity: 3,
          },
        ],
        discountType: DISCOUNT_TYPES.PERCENTAGE,
        discountValue: 5,
        notes: 'Updated draft invoice',
      });

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response.body);
    expect(response.body.data.invoice.subtotal).toBe(300);
    expect(response.body.data.invoice.discountAmount).toBe(15);
    expect(response.body.data.invoice.taxableAmount).toBe(285);
    expect(response.body.data.invoice.taxAmount).toBe(22.8);
    expect(response.body.data.invoice.totalAmount).toBe(307.8);
    expect(response.body.data.invoice.notes).toBe('Updated draft invoice');
  });

  it('updates draft invoice metadata without repricing or requiring active customer price list', async () => {
    const createResponse = await createDraftInvoice();
    const invoiceId = createResponse.body.data.invoice.id;
    const originalTotal = createResponse.body.data.invoice.totalAmount;

    customerById(ids.customerRetail).status = CUSTOMER_STATUSES.INACTIVE;
    priceLists = [];

    const response = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${tokenFor(users[3])}`)
      .send({
        notes: 'Metadata only update',
        voiceText: 'Called customer and confirmed address',
      });

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response.body);
    expect(response.body.data.invoice.notes).toBe('Metadata only update');
    expect(response.body.data.invoice.voiceText).toBe('Called customer and confirmed address');
    expect(response.body.data.invoice.totalAmount).toBe(originalTotal);
  });

  it('reprices draft invoice when items or discount change', async () => {
    const createResponse = await createDraftInvoice();
    const invoiceId = createResponse.body.data.invoice.id;

    priceLists[0].items.find((item) => item.productId === ids.productPaper).price = 150;

    const response = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${tokenFor(users[3])}`)
      .send({
        items: [
          {
            productId: ids.productPaper,
            quantity: 2,
          },
        ],
        discountType: DISCOUNT_TYPES.PERCENTAGE,
        discountValue: 5,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.invoice.items[0].unitPrice).toBe(150);
    expect(response.body.data.invoice.subtotal).toBe(300);
    expect(response.body.data.invoice.discountAmount).toBe(15);
    expect(response.body.data.invoice.totalAmount).toBe(307.8);
  });

  it('rejects sales representative discounts above the module limit', async () => {
    const response = await createDraftInvoice({
      discountType: DISCOUNT_TYPES.PERCENTAGE,
      discountValue: 6,
    });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: 'Sales representatives cannot apply discount above 5%',
    });
  });

  it('confirms draft invoice, generates invoice number, and rejects confirming it twice', async () => {
    const createResponse = await createDraftInvoice();
    const invoiceId = createResponse.body.data.invoice.id;

    const response = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Authorization', `Bearer ${tokenFor(users[3])}`);

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response.body);
    expect(response.body.data.invoice.invoiceStatus).toBe(INVOICE_STATUSES.CONFIRMED);
    expect(response.body.data.invoice.invoiceNumber).toMatch(/^INV-\d{4}-00001$/);
    expect(response.body.data.invoice.confirmedAt).toBeDefined();
    expect(response.body.data.invoice.confirmedBy).toBe(ids.rep);

    const secondConfirmResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Authorization', `Bearer ${tokenFor(users[3])}`);

    expect(secondConfirmResponse.status).toBe(400);
    expect(secondConfirmResponse.body.message).toBe('Only draft invoices can be changed');
  });

  it('edits confirmed invoices but not archived invoices', async () => {
    const createResponse = await createDraftInvoice();
    const invoiceId = createResponse.body.data.invoice.id;

    await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Authorization', `Bearer ${tokenFor(users[3])}`);

    const confirmedEditResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${tokenFor(users[3])}`)
      .send({ notes: 'Added after confirmation' });

    expect(confirmedEditResponse.status).toBe(200);
    expect(confirmedEditResponse.body.data.invoice.notes).toBe('Added after confirmation');
    expect(confirmedEditResponse.body.data.invoice.invoiceStatus).toBe(INVOICE_STATUSES.CONFIRMED);
    expect(confirmedEditResponse.body.data.invoice.invoiceNumber).toMatch(/^INV-\d{4}-00001$/);

    await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/archive`)
      .set('Authorization', `Bearer ${tokenFor(users[2])}`);

    const archivedEditResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${tokenFor(users[2])}`)
      .send({ notes: 'Still should fail' });

    expect(archivedEditResponse.status).toBe(400);
    expect(archivedEditResponse.body.message).toBe('Archived invoices cannot be changed');
  });

  it('reprices a confirmed invoice after payment without losing the recorded payment', async () => {
    const createResponse = await createDraftInvoice();
    const invoiceId = createResponse.body.data.invoice.id;

    await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Authorization', `Bearer ${tokenFor(users[3])}`);

    const paymentResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/payment`)
      .set('Authorization', `Bearer ${tokenFor(users[0])}`)
      .send({ paidAmount: 100 });

    expect(paymentResponse.status).toBe(200);
    expect(paymentResponse.body.data.invoice.totalAmount).toBe(216);
    expect(paymentResponse.body.data.invoice.paidAmount).toBe(100);
    expect(paymentResponse.body.data.invoice.remainingAmount).toBe(116);

    const editResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${tokenFor(users[3])}`)
      .send({
        items: [
          {
            productId: ids.productPaper,
            quantity: 3,
          },
        ],
      });

    expect(editResponse.status).toBe(200);
    expect(editResponse.body.data.invoice.totalAmount).toBe(324);
    expect(editResponse.body.data.invoice.paidAmount).toBe(100);
    expect(editResponse.body.data.invoice.remainingAmount).toBe(224);
    expect(editResponse.body.data.invoice.paymentStatus).toBe(PAYMENT_STATUSES.PENDING);
  });

  it('keeps product price snapshot unchanged after product and price list changes', async () => {
    const createResponse = await createDraftInvoice();
    const invoiceId = createResponse.body.data.invoice.id;

    productById(ids.productPaper).basePrice = 999;
    priceLists[0].items[0].price = 777;

    const response = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Authorization', `Bearer ${tokenFor(users[3])}`);

    expect(response.status).toBe(200);
    expect(response.body.data.invoice.items[0].unitPrice).toBe(100);
    expect(response.body.data.invoice.totalAmount).toBe(216);
  });

  it('enforces archive permissions', async () => {
    const createResponse = await createDraftInvoice();
    const invoiceId = createResponse.body.data.invoice.id;

    const repArchiveResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/archive`)
      .set('Authorization', `Bearer ${tokenFor(users[3])}`);

    expect(repArchiveResponse.status).toBe(403);

    const accountantArchiveResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/archive`)
      .set('Authorization', `Bearer ${tokenFor(users[4])}`);

    expect(accountantArchiveResponse.status).toBe(403);

    const supervisorArchiveResponse = await request(app)
      .patch(`/api/v1/invoices/${invoiceId}/archive`)
      .set('Authorization', `Bearer ${tokenFor(users[2])}`);

    expect(supervisorArchiveResponse.status).toBe(200);
    expect(supervisorArchiveResponse.body.data.invoice.invoiceStatus).toBe(INVOICE_STATUSES.ARCHIVED);
    expect(supervisorArchiveResponse.body.data.invoice.archivedAt).toBeDefined();
    expect(supervisorArchiveResponse.body.data.invoice.archivedBy).toBe(ids.supervisor);
  });

  it('lists only own invoices for sales representative', async () => {
    await createDraftInvoice({ token: tokenFor(users[3]) });
    await createDraftInvoice({ token: tokenFor(users[0]), customerId: ids.customerUnassigned });

    const response = await request(app)
      .get('/api/v1/invoices')
      .set('Authorization', `Bearer ${tokenFor(users[3])}`);

    expect(response.status).toBe(200);
    expectPaginatedEnvelope(response.body);
    expect(response.body.count).toBe(1);
    expect(response.body.data[0].createdBy).toBe(ids.rep);
  });

  it('lists customer invoices and enforces sales representative customer restrictions', async () => {
    await createDraftInvoice({ token: tokenFor(users[3]) });

    const response = await request(app)
      .get(`/api/v1/customers/${ids.customerRetail}/invoices`)
      .set('Authorization', `Bearer ${tokenFor(users[3])}`);

    expect(response.status).toBe(200);
    expectPaginatedEnvelope(response.body);
    expect(response.body.message).toBe('Customer invoices fetched successfully');
    expect(response.body.count).toBe(1);
    expect(response.body.data[0].customerId).toBe(ids.customerRetail);

    const forbiddenResponse = await request(app)
      .get(`/api/v1/customers/${ids.customerUnassigned}/invoices`)
      .set('Authorization', `Bearer ${tokenFor(users[3])}`);

    expect(forbiddenResponse.status).toBe(403);
    expect(forbiddenResponse.body.message).toBe('Forbidden');
  });
});
