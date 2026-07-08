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
const { Invoice, INVOICE_STATUSES, PAYMENT_STATUSES } = require('../src/modules/invoices/invoice.model');

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
  customerInactive: '65f000000000000000000005',
  unknownCustomer: '65f000000000000000000099',
  productPaper: '66f000000000000000000001',
  productTape: '66f000000000000000000002',
  productInactive: '66f000000000000000000003',
  productNotInList: '66f000000000000000000004',
  retailList: '67f000000000000000000001',
  wholesaleList: '67f000000000000000000002',
  keyAccountInactiveList: '67f000000000000000000003',
  invoiceConfirmedRecent: '68f000000000000000000001',
  invoiceConfirmedOlder: '68f000000000000000000002',
  invoiceDraft: '68f000000000000000000003',
  invoiceArchived: '68f000000000000000000004',
  invoiceUnavailableProducts: '68f000000000000000000005',
};

let users;
let customers;
let products;
let priceLists;
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
  assignedSalesRep,
  customerType,
  paymentType,
  status,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      contactName: this.contactName,
      phone: this.phone,
      email: this.email,
      assignedSalesRep: this.assignedSalesRep,
      customerType: this.customerType,
      paymentType: this.paymentType,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  },
});

const makeProduct = ({
  id,
  name,
  sku,
  category = 'Office Supplies',
  brand = 'IntelliBrand',
  unit = PRODUCT_UNITS.PIECE,
  basePrice = 100,
  currency = 'SYP',
  taxRate = 8,
  status = PRODUCT_STATUSES.ACTIVE,
}) => ({
  id,
  _id: toObjectId(id),
  name,
  sku,
  productCode: sku,
  category,
  brand,
  unit,
  basePrice,
  currency,
  taxRate,
  status,
  __v: 0,
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      sku: this.sku,
      productCode: this.sku,
      category: this.category,
      brand: this.brand,
      unit: this.unit,
      basePrice: this.basePrice,
      currency: this.currency,
      taxRate: this.taxRate,
      status: this.status,
    };
  },
});

const makePriceList = ({
  id,
  name,
  customerType,
  status = PRICE_LIST_STATUSES.ACTIVE,
  items = [],
  updatedAt = new Date('2026-01-01T00:00:00.000Z'),
}) => ({
  id,
  _id: toObjectId(id),
  name,
  customerType,
  status,
  items,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt,
});

const makeInvoice = ({
  id,
  customerId = ids.customerRetail,
  invoiceStatus = INVOICE_STATUSES.CONFIRMED,
  paymentStatus = PAYMENT_STATUSES.PENDING,
  confirmedAt = new Date('2026-06-20T10:00:00.000Z'),
  createdAt = new Date('2026-06-20T09:00:00.000Z'),
  items = [],
}) => ({
  id,
  _id: toObjectId(id),
  customerId,
  customerSnapshot: {
    customerId,
    name: 'Retail Market',
    customerType: CUSTOMER_TYPES.RETAIL,
    paymentType: PAYMENT_TYPES.CASH,
  },
  items,
  invoiceStatus,
  paymentStatus,
  confirmedAt,
  createdAt,
  updatedAt: confirmedAt || createdAt,
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
const productById = (id) => products.find((product) => product.id === id);
const customerById = (id) => customers.find((customer) => customer.id === id);

const hydratePriceList = (priceList) => {
  if (!priceList) {
    return priceList;
  }

  return {
    ...priceList,
    items: (priceList.items || []).map((item) => ({
      ...item,
      productId: typeof item.productId === 'string'
        ? productById(item.productId) || item.productId
        : item.productId,
    })),
  };
};

const applyPriceListFilters = (filters = {}) => priceLists.filter((priceList) => {
  if (filters.customerType && priceList.customerType !== filters.customerType) {
    return false;
  }

  if (filters.status && priceList.status !== filters.status) {
    return false;
  }

  return true;
});

const applyInvoiceFilters = (filters = {}) => invoices.filter((invoice) => {
  if (filters.customerId && referenceId(invoice.customerId) !== filters.customerId) {
    return false;
  }

  if (filters.invoiceStatus && invoice.invoiceStatus !== filters.invoiceStatus) {
    return false;
  }

  return true;
});

const makeDocumentQuery = (result) => {
  const query = {
    sort: jest.fn(() => query),
    populate: jest.fn(() => query),
    then: (resolve, reject) => Promise.resolve(hydratePriceList(result)).then(resolve, reject),
    catch: (reject) => Promise.resolve(hydratePriceList(result)).catch(reject),
  };

  return query;
};

const makeListQuery = (result) => {
  const query = {
    sort: jest.fn((sort) => {
      const entries = Object.entries(sort);

      result.sort((left, right) => {
        for (const [field, direction] of entries) {
          const leftTime = new Date(left[field] || 0).getTime();
          const rightTime = new Date(right[field] || 0).getTime();

          if (leftTime !== rightTime) {
            return (leftTime - rightTime) * direction;
          }
        }

        return 0;
      });

      return query;
    }),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };

  return query;
};

const configureMocks = () => {
  User.findById.mockImplementation(async (id) => userById(id) || null);
  Customer.findById.mockImplementation(async (id) => customerById(id) || null);
  Product.findById.mockImplementation(async (id) => productById(id) || null);
  PriceList.findOne.mockImplementation((filters) => makeDocumentQuery(
    applyPriceListFilters(filters)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0] || null,
  ));
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
  expect(serialized).not.toContain('password');
};

const getRecommendations = ({ userId = ids.rep, customerId = ids.customerRetail, query = '' } = {}) => (
  request(app)
    .get(`/api/v1/recommendations/customers/${customerId}/products${query}`)
    .set('Authorization', `Bearer ${tokenFor(userById(userId))}`)
);

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
      id: ids.customerRetail,
      name: 'Retail Market',
      assignedSalesRep: ids.rep,
      customerType: CUSTOMER_TYPES.RETAIL,
    }),
    makeCustomer({
      id: ids.customerWholesale,
      name: 'Wholesale Market',
      assignedSalesRep: ids.repTwo,
      customerType: CUSTOMER_TYPES.WHOLESALE,
    }),
    makeCustomer({
      id: ids.customerUnassigned,
      name: 'Unassigned Market',
      assignedSalesRep: null,
      customerType: CUSTOMER_TYPES.RETAIL,
    }),
    makeCustomer({
      id: ids.customerKeyAccount,
      name: 'Key Account Market',
      assignedSalesRep: ids.rep,
      customerType: CUSTOMER_TYPES.KEY_ACCOUNT,
      paymentType: PAYMENT_TYPES.CREDIT,
    }),
    makeCustomer({
      id: ids.customerInactive,
      name: 'Inactive Market',
      assignedSalesRep: ids.rep,
      status: CUSTOMER_STATUSES.INACTIVE,
    }),
  ];

  products = [
    makeProduct({
      id: ids.productPaper,
      name: 'Office Printer Paper',
      sku: 'PAPER-A4-001',
      unit: PRODUCT_UNITS.PACK,
      basePrice: 120,
    }),
    makeProduct({
      id: ids.productTape,
      name: 'Packing Tape',
      sku: 'TAPE-PACK-001',
      unit: PRODUCT_UNITS.PACK,
      basePrice: 65,
    }),
    makeProduct({
      id: ids.productInactive,
      name: 'Inactive Scanner',
      sku: 'SCANNER-INACTIVE',
      category: 'Hardware',
      status: PRODUCT_STATUSES.INACTIVE,
    }),
    makeProduct({
      id: ids.productNotInList,
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
        { productId: ids.productPaper, price: 110, currency: 'SYP' },
        { productId: ids.productTape, price: 55, currency: 'SYP' },
        { productId: ids.productInactive, price: 900, currency: 'SYP' },
      ],
    }),
    makePriceList({
      id: ids.wholesaleList,
      name: 'Wholesale Price List',
      customerType: CUSTOMER_TYPES.WHOLESALE,
      items: [
        { productId: ids.productTape, price: 45, currency: 'SYP' },
      ],
    }),
    makePriceList({
      id: ids.keyAccountInactiveList,
      name: 'Inactive Key Account Price List',
      customerType: CUSTOMER_TYPES.KEY_ACCOUNT,
      status: PRICE_LIST_STATUSES.INACTIVE,
      items: [
        { productId: ids.productPaper, price: 90, currency: 'SYP' },
      ],
    }),
  ];

  invoices = [
    makeInvoice({
      id: ids.invoiceConfirmedRecent,
      confirmedAt: new Date('2026-06-20T10:00:00.000Z'),
      items: [
        {
          productId: ids.productPaper,
          productCode: 'PAPER-A4-001',
          quantity: 2,
          lineSubtotal: 200,
          lineTotal: 216,
        },
        {
          productId: ids.productTape,
          productCode: 'TAPE-PACK-001',
          quantity: 1,
          lineSubtotal: 50,
          lineTotal: 54,
        },
      ],
    }),
    makeInvoice({
      id: ids.invoiceConfirmedOlder,
      confirmedAt: new Date('2026-05-10T10:00:00.000Z'),
      items: [
        {
          productId: ids.productPaper,
          productCode: 'PAPER-A4-001',
          quantity: 3,
          lineSubtotal: 300,
          lineTotal: 324,
        },
      ],
    }),
    makeInvoice({
      id: ids.invoiceDraft,
      invoiceStatus: INVOICE_STATUSES.DRAFT,
      confirmedAt: undefined,
      items: [
        {
          productId: ids.productTape,
          productCode: 'TAPE-PACK-001',
          quantity: 50,
          lineSubtotal: 2500,
          lineTotal: 2700,
        },
      ],
    }),
    makeInvoice({
      id: ids.invoiceArchived,
      invoiceStatus: INVOICE_STATUSES.ARCHIVED,
      confirmedAt: new Date('2026-06-25T10:00:00.000Z'),
      items: [
        {
          productId: ids.productTape,
          productCode: 'TAPE-PACK-001',
          quantity: 50,
          lineSubtotal: 2500,
          lineTotal: 2700,
        },
      ],
    }),
    makeInvoice({
      id: ids.invoiceUnavailableProducts,
      confirmedAt: new Date('2026-06-26T10:00:00.000Z'),
      items: [
        {
          productId: ids.productInactive,
          productCode: 'SCANNER-INACTIVE',
          quantity: 10,
          lineSubtotal: 9000,
          lineTotal: 9720,
        },
        {
          productId: ids.productNotInList,
          productCode: 'NO-PRICE-001',
          quantity: 10,
          lineSubtotal: 1000,
          lineTotal: 1080,
        },
      ],
    }),
  ];

  jest.clearAllMocks();
  configureMocks();
});

describe('recommendations module', () => {
  it('returns 401 without token', async () => {
    const response = await request(app)
      .get(`/api/v1/recommendations/customers/${ids.customerRetail}/products`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Authentication required',
    });
  });

  it.each([
    ['COMPANY_ADMIN', ids.admin],
    ['SALES_MANAGER', ids.manager],
    ['SALES_SUPERVISOR', ids.supervisor],
    ['ACCOUNTANT', ids.accountant],
  ])('allows %s to get recommendations for any customer', async (roleName, userId) => {
    const response = await getRecommendations({
      userId,
      customerId: ids.customerWholesale,
    });

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response.body);
    expect(response.body.data.customer.id).toBe(ids.customerWholesale);
    expect(response.body.data.strategy).toBe('CUSTOMER_TYPE_PRICE_LIST');
    expectSafePayload(response.body);
  });

  it('allows sales representative to get recommendations for an assigned customer', async () => {
    const response = await getRecommendations();

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response.body);
    expect(response.body.data.customer).toEqual({
      id: ids.customerRetail,
      name: 'Retail Market',
      customerType: CUSTOMER_TYPES.RETAIL,
    });
  });

  it('blocks sales representative from another representative customer and unassigned customer', async () => {
    const otherRepResponse = await getRecommendations({
      customerId: ids.customerWholesale,
    });
    const unassignedResponse = await getRecommendations({
      customerId: ids.customerUnassigned,
    });

    expect(otherRepResponse.status).toBe(403);
    expect(otherRepResponse.body).toEqual({
      success: false,
      message: 'Forbidden',
    });
    expect(unassignedResponse.status).toBe(403);
    expect(unassignedResponse.body.message).toBe('Forbidden');
  });

  it('returns validation errors for invalid customerId and invalid limits', async () => {
    const invalidCustomerResponse = await getRecommendations({
      customerId: 'bad-id',
    });
    const invalidLimitResponse = await getRecommendations({
      query: '?limit=0',
    });
    const overLimitResponse = await getRecommendations({
      query: '?limit=21',
    });
    const invalidHistoryResponse = await getRecommendations({
      query: '?includeHistory=maybe',
    });

    expect(invalidCustomerResponse.status).toBe(400);
    expect(invalidCustomerResponse.body.message).toBe('Validation failed');
    expect(Array.isArray(invalidCustomerResponse.body.errors)).toBe(true);
    expect(invalidLimitResponse.status).toBe(400);
    expect(overLimitResponse.status).toBe(400);
    expect(invalidHistoryResponse.status).toBe(400);
  });

  it('returns 404 for unknown customer and 400 for inactive customer', async () => {
    const unknownResponse = await getRecommendations({
      userId: ids.admin,
      customerId: ids.unknownCustomer,
    });
    const inactiveResponse = await getRecommendations({
      userId: ids.admin,
      customerId: ids.customerInactive,
    });

    expect(unknownResponse.status).toBe(404);
    expect(unknownResponse.body).toEqual({
      success: false,
      message: 'Customer not found',
    });
    expect(inactiveResponse.status).toBe(400);
    expect(inactiveResponse.body).toEqual({
      success: false,
      message: 'Customer is inactive',
    });
  });

  it('falls back to active customerType price-list products when there is no history', async () => {
    const response = await getRecommendations({
      userId: ids.accountant,
      customerId: ids.customerWholesale,
    });

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response.body);
    expect(response.body.message).toBe('Product recommendations fetched successfully');
    expect(response.body.data.strategy).toBe('CUSTOMER_TYPE_PRICE_LIST');
    expect(response.body.data.meta).toEqual(expect.objectContaining({
      limit: 5,
      customerType: CUSTOMER_TYPES.WHOLESALE,
      priceListId: ids.wholesaleList,
      source: 'active customer type price list',
    }));
    expect(response.body.data.recommendations).toHaveLength(1);
    expect(response.body.data.recommendations[0]).toEqual(expect.objectContaining({
      price: 45,
      currency: 'SYP',
      score: 100,
      reason: 'Recommended from Wholesale price list',
    }));
    expect(response.body.data.recommendations[0].product).toEqual(expect.objectContaining({
      id: ids.productTape,
      productCode: 'TAPE-PACK-001',
      unit: PRODUCT_UNITS.PACK,
      status: PRODUCT_STATUSES.ACTIVE,
    }));
  });

  it('can skip history and use fallback recommendations with includeHistory=false', async () => {
    const response = await getRecommendations({
      query: '?includeHistory=false&limit=1',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.strategy).toBe('CUSTOMER_TYPE_PRICE_LIST');
    expect(response.body.data.recommendations).toHaveLength(1);
    expect(response.body.data.recommendations[0].product.id).toBe(ids.productPaper);
    expect(response.body.data.recommendations[0]).not.toHaveProperty('history');
  });

  it('returns purchase-history recommendations with current price-list prices and safe product summaries', async () => {
    const response = await getRecommendations({
      query: '?limit=10',
    });

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response.body);
    expect(response.body.data.strategy).toBe('PURCHASE_HISTORY');
    expect(response.body.data.meta).toEqual(expect.objectContaining({
      limit: 10,
      customerType: CUSTOMER_TYPES.RETAIL,
      priceListId: ids.retailList,
      source: 'confirmed invoices + active price list',
    }));

    const recommendations = response.body.data.recommendations;

    expect(recommendations.map((item) => item.product.id)).toEqual([
      ids.productPaper,
      ids.productTape,
    ]);
    expect(recommendations[0]).toEqual(expect.objectContaining({
      price: 110,
      currency: 'SYP',
      taxRate: 8,
      score: 105,
      reason: 'Previously purchased by this customer',
      history: {
        timesPurchased: 2,
        totalQuantityPurchased: 5,
        lastPurchasedAt: expect.any(String),
      },
    }));
    expect(recommendations[1]).toEqual(expect.objectContaining({
      price: 55,
      score: 45,
      history: {
        timesPurchased: 1,
        totalQuantityPurchased: 1,
        lastPurchasedAt: expect.any(String),
      },
    }));
    expect(recommendations.find((item) => item.product.id === ids.productInactive)).toBeUndefined();
    expect(recommendations.find((item) => item.product.id === ids.productNotInList)).toBeUndefined();
    expectSafePayload(response.body);
  });

  it('excludes inactive products from fallback recommendations', async () => {
    invoices = [];

    const response = await getRecommendations({
      userId: ids.admin,
      customerId: ids.customerRetail,
      query: '?includeHistory=false&limit=20',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.strategy).toBe('CUSTOMER_TYPE_PRICE_LIST');
    expect(response.body.data.recommendations.map((item) => item.product.id)).toEqual([
      ids.productPaper,
      ids.productTape,
    ]);
    expect(response.body.data.recommendations.map((item) => item.product.id)).not.toContain(ids.productInactive);
  });

  it('returns safe empty recommendations when no active price list exists', async () => {
    const response = await getRecommendations({
      customerId: ids.customerKeyAccount,
    });

    expect(response.status).toBe(200);
    expectSuccessEnvelope(response.body);
    expect(response.body.message).toBe('No available product recommendations found');
    expect(response.body.data.strategy).toBe('NO_AVAILABLE_RECOMMENDATIONS');
    expect(response.body.data.recommendations).toEqual([]);
    expect(response.body.data.meta).toEqual(expect.objectContaining({
      limit: 5,
      customerType: CUSTOMER_TYPES.KEY_ACCOUNT,
      source: 'no active price list',
    }));
  });
});
