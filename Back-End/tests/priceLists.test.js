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

const mockPriceListCustomerTypes = Object.freeze({
  RETAIL: 'Retail',
  WHOLESALE: 'Wholesale',
  KEY_ACCOUNT: 'KeyAccount',
});

jest.mock('../src/models/User', () => ({
  User: {
    findById: jest.fn(),
  },
  USER_ROLES: mockUserRoles,
  USER_STATUSES: mockUserStatuses,
}));

jest.mock('../src/modules/products/product.model', () => ({
  Product: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
  },
  PRODUCT_STATUSES: mockProductStatuses,
  PRODUCT_UNITS: mockProductUnits,
}));

jest.mock('../src/modules/priceLists/priceList.model', () => ({
  PriceList: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
  },
  PRICE_LIST_CUSTOMER_TYPES: mockPriceListCustomerTypes,
  PRICE_LIST_STATUSES: mockPriceListStatuses,
}));

const app = require('../src/app');
const { env } = require('../src/config/env');
const { User, USER_ROLES, USER_STATUSES } = require('../src/models/User');
const { Product, PRODUCT_STATUSES, PRODUCT_UNITS } = require('../src/modules/products/product.model');
const {
  PriceList,
  PRICE_LIST_CUSTOMER_TYPES,
  PRICE_LIST_STATUSES,
} = require('../src/modules/priceLists/priceList.model');

const ids = {
  admin: '64f000000000000000000001',
  manager: '64f000000000000000000003',
  supervisor: '64f000000000000000000004',
  rep: '64f000000000000000000002',
  accountant: '64f000000000000000000005',
  productOne: '66f000000000000000000001',
  productTwo: '66f000000000000000000002',
  productThree: '66f000000000000000000003',
  retailList: '67f000000000000000000001',
  wholesaleList: '67f000000000000000000002',
  inactiveList: '67f000000000000000000003',
  createdList: '67f000000000000000000100',
};

let users;
let products;
let priceLists;

const toObjectId = (id) => ({ toString: () => id });

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

const makeProduct = ({
  id,
  name,
  sku,
  category = 'Office Supplies',
  unit = PRODUCT_UNITS.PIECE,
  basePrice = 10,
  currency = 'SYP',
  taxRate = 0,
  status = PRODUCT_STATUSES.ACTIVE,
}) => ({
  id,
  _id: toObjectId(id),
  name,
  sku,
  category,
  unit,
  basePrice,
  currency,
  taxRate,
  status,
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      sku: this.sku,
      category: this.category,
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
  description = 'Demo price list',
  status = PRICE_LIST_STATUSES.ACTIVE,
  items = [],
  createdBy = ids.admin,
  updatedBy = ids.admin,
}) => ({
  id,
  _id: toObjectId(id),
  name,
  customerType,
  description,
  status,
  items,
  createdBy,
  updatedBy,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  __v: 0,
  async save() {
    this.updatedAt = new Date('2026-01-02T00:00:00.000Z');
    return this;
  },
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      customerType: this.customerType,
      description: this.description,
      status: this.status,
      items: this.items,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
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

const productById = (id) => products.find((product) => product.id === id);

const hydrateItems = (items) => items.map((item) => ({
  ...item,
  productId: typeof item.productId === 'string'
    ? productById(item.productId) || item.productId
    : item.productId,
}));

const hydratePriceList = (priceList) => {
  if (!priceList) {
    return priceList;
  }

  priceList.items = hydrateItems(priceList.items || []);
  return priceList;
};

const applyPriceListFilters = (filters = {}) => priceLists.filter((priceList) => {
  if (filters.status && priceList.status !== filters.status) {
    return false;
  }

  if (filters.customerType && priceList.customerType !== filters.customerType) {
    return false;
  }

  if (filters.$or) {
    return filters.$or.some((condition) => Object.entries(condition).some(([field, regex]) => (
      regex.test(String(priceList[field] || ''))
    )));
  }

  return true;
});

const makeDocumentQuery = (result) => {
  const query = {
    populate: jest.fn(() => {
      hydratePriceList(result);
      return query;
    }),
    sort: jest.fn(() => query),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };

  return query;
};

const makeListQuery = (result) => {
  const query = {
    populate: jest.fn(() => {
      result.forEach(hydratePriceList);
      return query;
    }),
    sort: jest.fn((sort) => {
      const [field, direction] = Object.entries(sort)[0];
      result.sort((left, right) => (
        String(left[field] || '').localeCompare(String(right[field] || '')) * direction
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
  Product.findById.mockImplementation(async (id) => productById(id) || null);
  Product.find.mockImplementation(() => makeListQuery(products));
  Product.findOne.mockImplementation(async () => null);
  Product.countDocuments.mockImplementation(async () => products.length);
  Product.create.mockImplementation(async () => null);

  PriceList.findById.mockImplementation((id) => makeDocumentQuery(
    priceLists.find((priceList) => priceList.id === id) || null,
  ));
  PriceList.findOne.mockImplementation((filters) => makeDocumentQuery(
    applyPriceListFilters(filters)[0] || null,
  ));
  PriceList.find.mockImplementation((filters) => makeListQuery(applyPriceListFilters(filters)));
  PriceList.countDocuments.mockImplementation(async (filters) => applyPriceListFilters(filters).length);
  PriceList.create.mockImplementation(async (payload) => {
    const priceList = makePriceList({
      id: ids.createdList,
      status: PRICE_LIST_STATUSES.ACTIVE,
      ...payload,
      items: hydrateItems(payload.items || []),
    });

    priceLists.push(priceList);
    return priceList;
  });
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
  ];

  products = [
    makeProduct({
      id: ids.productOne,
      name: 'Office Printer Paper',
      sku: 'PAPER-A4-001',
      unit: PRODUCT_UNITS.PACK,
      basePrice: 65000,
      status: PRODUCT_STATUSES.ACTIVE,
    }),
    makeProduct({
      id: ids.productTwo,
      name: 'Wireless Barcode Scanner',
      sku: 'SCANNER-WL-001',
      category: 'Hardware',
      basePrice: 850000,
      status: PRODUCT_STATUSES.INACTIVE,
    }),
    makeProduct({
      id: ids.productThree,
      name: 'Packing Tape',
      sku: 'TAPE-PACK-001',
      unit: PRODUCT_UNITS.PACK,
      basePrice: 97500,
      status: PRODUCT_STATUSES.ACTIVE,
    }),
  ];

  priceLists = [
    makePriceList({
      id: ids.retailList,
      name: 'Retail Price List',
      customerType: PRICE_LIST_CUSTOMER_TYPES.RETAIL,
      items: [
        { productId: ids.productOne, price: 65000, currency: 'SYP' },
        { productId: ids.productTwo, price: 850000, currency: 'SYP' },
      ],
    }),
    makePriceList({
      id: ids.wholesaleList,
      name: 'Wholesale Price List',
      customerType: PRICE_LIST_CUSTOMER_TYPES.WHOLESALE,
      items: [
        { productId: ids.productThree, price: 90000, currency: 'SYP' },
      ],
    }),
    makePriceList({
      id: ids.inactiveList,
      name: 'Inactive Key Account Price List',
      customerType: PRICE_LIST_CUSTOMER_TYPES.KEY_ACCOUNT,
      status: PRICE_LIST_STATUSES.INACTIVE,
      items: [
        { productId: ids.productOne, price: 60000, currency: 'SYP' },
      ],
    }),
  ];

  jest.clearAllMocks();
  configureMocks();
});

describe('price lists module', () => {
  it('returns 401 without token', async () => {
    const response = await request(app).get('/api/v1/price-lists');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  it('lets admin create a price list', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const response = await request(app)
      .post('/api/v1/price-lists')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Key Account Price List',
        customerType: PRICE_LIST_CUSTOMER_TYPES.KEY_ACCOUNT,
        description: 'Preferred key account pricing',
        items: [
          { productId: ids.productOne, price: 59000 },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.priceList).toEqual(expect.objectContaining({
      id: ids.createdList,
      name: 'Key Account Price List',
      customerType: PRICE_LIST_CUSTOMER_TYPES.KEY_ACCOUNT,
      status: PRICE_LIST_STATUSES.ACTIVE,
    }));
    expect(response.body.data.priceList.items[0]).toEqual(expect.objectContaining({
      productId: ids.productOne,
      productCode: 'PAPER-A4-001',
      productName: 'Office Printer Paper',
      price: 59000,
    }));
  });

  it('rejects invalid customerType and negative item price', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const invalidTypeResponse = await request(app)
      .post('/api/v1/price-lists')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Invalid Price List',
        customerType: 'VIP',
        items: [{ productId: ids.productOne, price: 1 }],
      });
    const invalidPriceResponse = await request(app)
      .post('/api/v1/price-lists')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Invalid Price',
        customerType: PRICE_LIST_CUSTOMER_TYPES.RETAIL,
        items: [{ productId: ids.productOne, price: -1 }],
      });

    expect(invalidTypeResponse.status).toBe(400);
    expect(invalidPriceResponse.status).toBe(400);
  });

  it('gets active price list by customerType and filters inactive product items', async () => {
    const rep = users.find((user) => user.id === ids.rep);

    const response = await request(app)
      .get('/api/v1/price-lists/customer-type/Retail')
      .set('Authorization', `Bearer ${tokenFor(rep)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.priceList.customerType).toBe(PRICE_LIST_CUSTOMER_TYPES.RETAIL);
    expect(response.body.data.priceList.items).toHaveLength(1);
    expect(response.body.data.priceList.items[0]).toEqual(expect.objectContaining({
      productId: ids.productOne,
      productCode: 'PAPER-A4-001',
      productName: 'Office Printer Paper',
      price: 65000,
      currency: 'SYP',
      basePrice: 65000,
      unit: PRODUCT_UNITS.PACK,
    }));
    expect(response.body.data.priceList.items.find((item) => item.productId === ids.productTwo)).toBeUndefined();
  });

  it('rejects invalid customerType lookup', async () => {
    const rep = users.find((user) => user.id === ids.rep);

    const response = await request(app)
      .get('/api/v1/price-lists/customer-type/VIP')
      .set('Authorization', `Bearer ${tokenFor(rep)}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  it('lets sales rep and accountant read active price lists only', async () => {
    const rep = users.find((user) => user.id === ids.rep);
    const accountant = users.find((user) => user.id === ids.accountant);

    const repResponse = await request(app)
      .get('/api/v1/price-lists')
      .set('Authorization', `Bearer ${tokenFor(rep)}`);
    const accountantResponse = await request(app)
      .get('/api/v1/price-lists')
      .set('Authorization', `Bearer ${tokenFor(accountant)}`);

    expect(repResponse.status).toBe(200);
    expect(repResponse.body.success).toBe(true);
    expect(repResponse.body.message).toBe('Price lists fetched successfully');
    expect(repResponse.body.pagination.total).toBe(2);
    expect(Array.isArray(repResponse.body.data)).toBe(true);
    expect(repResponse.body.data.every((priceList) => priceList.status === PRICE_LIST_STATUSES.ACTIVE)).toBe(true);
    expect(accountantResponse.status).toBe(200);
    expect(accountantResponse.body.pagination.total).toBe(2);
  });

  it('blocks sales rep and accountant from creating, updating, or deactivating price lists', async () => {
    const rep = users.find((user) => user.id === ids.rep);
    const accountant = users.find((user) => user.id === ids.accountant);

    const repCreateResponse = await request(app)
      .post('/api/v1/price-lists')
      .set('Authorization', `Bearer ${tokenFor(rep)}`)
      .send({
        name: 'Blocked Price List',
        customerType: PRICE_LIST_CUSTOMER_TYPES.RETAIL,
      });
    const repUpdateResponse = await request(app)
      .patch(`/api/v1/price-lists/${ids.retailList}`)
      .set('Authorization', `Bearer ${tokenFor(rep)}`)
      .send({ name: 'Blocked Update' });
    const accountantDeleteResponse = await request(app)
      .delete(`/api/v1/price-lists/${ids.retailList}`)
      .set('Authorization', `Bearer ${tokenFor(accountant)}`);

    expect(repCreateResponse.status).toBe(403);
    expect(repUpdateResponse.status).toBe(403);
    expect(accountantDeleteResponse.status).toBe(403);
  });

  it('lets manager update and supervisor soft deactivate price lists', async () => {
    const manager = users.find((user) => user.id === ids.manager);
    const supervisor = users.find((user) => user.id === ids.supervisor);

    const updateResponse = await request(app)
      .patch(`/api/v1/price-lists/${ids.retailList}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({
        name: 'Updated Retail Price List',
        items: [{ productId: ids.productThree, price: 91000, currency: 'syp' }],
      });
    const deactivateResponse = await request(app)
      .delete(`/api/v1/price-lists/${ids.wholesaleList}`)
      .set('Authorization', `Bearer ${tokenFor(supervisor)}`);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.priceList.name).toBe('Updated Retail Price List');
    expect(updateResponse.body.data.priceList.items[0].productCode).toBe('TAPE-PACK-001');
    expect(deactivateResponse.status).toBe(200);
    expect(deactivateResponse.body.data.priceList.status).toBe(PRICE_LIST_STATUSES.INACTIVE);
    expect(priceLists.find((priceList) => priceList.id === ids.wholesaleList)).toBeTruthy();
  });
});
