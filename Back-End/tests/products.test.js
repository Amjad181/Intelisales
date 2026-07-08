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

const app = require('../src/app');
const { env } = require('../src/config/env');
const { User, USER_ROLES, USER_STATUSES } = require('../src/models/User');
const { Product, PRODUCT_STATUSES, PRODUCT_UNITS } = require('../src/modules/products/product.model');

const ids = {
  admin: '64f000000000000000000001',
  manager: '64f000000000000000000003',
  supervisor: '64f000000000000000000004',
  rep: '64f000000000000000000002',
  accountant: '64f000000000000000000005',
  productOne: '66f000000000000000000001',
  productTwo: '66f000000000000000000002',
  productThree: '66f000000000000000000003',
  unknownProduct: '66f000000000000000000099',
  createdProduct: '66f000000000000000000100',
};

let users;
let products;

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
  barcode = '100000000000',
  category = 'Office Supplies',
  brand = 'IntelliBrand',
  description = 'Demo product',
  unit = PRODUCT_UNITS.PIECE,
  basePrice = 10,
  currency = 'SYP',
  taxRate = 0,
  status = PRODUCT_STATUSES.ACTIVE,
  createdBy = ids.admin,
  updatedBy = ids.admin,
}) => ({
  id,
  _id: toObjectId(id),
  name,
  sku,
  barcode,
  category,
  brand,
  description,
  unit,
  basePrice,
  currency,
  taxRate,
  status,
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
      sku: this.sku,
      productCode: this.sku,
      barcode: this.barcode,
      category: this.category,
      brand: this.brand,
      description: this.description,
      unit: this.unit,
      basePrice: this.basePrice,
      currency: this.currency,
      taxRate: this.taxRate,
      status: this.status,
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

const getValue = (object, path) => path.split('.').reduce((value, key) => (
  value ? value[key] : undefined
), object);

const applyFilters = (filters = {}) => products.filter((product) => {
  if (filters.status && product.status !== filters.status) {
    return false;
  }

  if (filters.category && !filters.category.test(product.category || '')) {
    return false;
  }

  if (filters.brand && !filters.brand.test(product.brand || '')) {
    return false;
  }

  if (filters.basePrice?.$gte !== undefined && product.basePrice < filters.basePrice.$gte) {
    return false;
  }

  if (filters.basePrice?.$lte !== undefined && product.basePrice > filters.basePrice.$lte) {
    return false;
  }

  if (filters.sku && product.sku !== filters.sku) {
    return false;
  }

  if (filters._id?.$ne && product.id === filters._id.$ne) {
    return false;
  }

  if (filters.$or) {
    return filters.$or.some((condition) => Object.entries(condition).some(([field, regex]) => (
      regex.test(String(getValue(product, field) || ''))
    )));
  }

  return true;
});

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
    populate: jest.fn(() => query),
    sort: jest.fn((sort) => {
      const [field, direction] = Object.entries(sort)[0];

      result.sort((left, right) => {
        const leftValue = getValue(left, field);
        const rightValue = getValue(right, field);

        if (typeof leftValue === 'number' && typeof rightValue === 'number') {
          return (leftValue - rightValue) * direction;
        }

        return String(leftValue || '').localeCompare(String(rightValue || '')) * direction;
      });

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

  Product.findById.mockImplementation((id) => makeDocumentQuery(
    products.find((product) => product.id === id) || null,
  ));

  Product.findOne.mockImplementation(async (filters) => applyFilters(filters)[0] || null);
  Product.find.mockImplementation((filters) => makeListQuery(applyFilters(filters)));
  Product.countDocuments.mockImplementation(async (filters) => applyFilters(filters).length);
  Product.create.mockImplementation(async (payload) => {
    const product = makeProduct({
      id: ids.createdProduct,
      status: PRODUCT_STATUSES.ACTIVE,
      ...payload,
    });

    products.push(product);
    return product;
  });
};

const expectSafeUserReference = (reference) => {
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
  ];

  products = [
    makeProduct({
      id: ids.productOne,
      name: 'Office Printer Paper',
      sku: 'PAPER-A4-001',
      barcode: '100000000001',
      category: 'Office Supplies',
      brand: 'IntelliOffice',
      unit: PRODUCT_UNITS.PACK,
      basePrice: 6.5,
      status: PRODUCT_STATUSES.ACTIVE,
      createdBy: users[0],
      updatedBy: users[0],
    }),
    makeProduct({
      id: ids.productTwo,
      name: 'Wireless Barcode Scanner',
      sku: 'SCANNER-WL-001',
      barcode: '100000000002',
      category: 'Hardware',
      brand: 'ScanPro',
      unit: PRODUCT_UNITS.PIECE,
      basePrice: 85,
      status: PRODUCT_STATUSES.INACTIVE,
    }),
    makeProduct({
      id: ids.productThree,
      name: 'Packing Tape',
      sku: 'TAPE-PACK-001',
      barcode: '100000000003',
      category: 'Packaging',
      brand: 'PackRight',
      unit: PRODUCT_UNITS.PACK,
      basePrice: 9.75,
      status: PRODUCT_STATUSES.ACTIVE,
    }),
  ];

  jest.clearAllMocks();
  configureMocks();
});

describe('products and simple price list module', () => {
  it('returns 401 for GET /api/v1/products without token', async () => {
    const response = await request(app).get('/api/v1/products');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  it('lets admin create a product with normalized SKU and safe response', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Tablet Stand',
        sku: ' stand-tab-001 ',
        barcode: '100000000004',
        category: 'Hardware',
        brand: 'DeskFlex',
        description: 'Adjustable tablet stand',
        unit: PRODUCT_UNITS.PIECE,
        basePrice: 28,
        currency: 'usd',
        taxRate: 5,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.product).toEqual(expect.objectContaining({
      id: ids.createdProduct,
      name: 'Tablet Stand',
      sku: 'STAND-TAB-001',
      productCode: 'STAND-TAB-001',
      basePrice: 28,
      currency: 'USD',
      status: PRODUCT_STATUSES.ACTIVE,
    }));
    expectSafeUserReference(response.body.data.product.createdBy);
  });

  it('accepts productCode as an alias for sku and defaults currency to SYP', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Product Code Alias',
        productCode: ' alias-001 ',
        basePrice: 15,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.product).toEqual(expect.objectContaining({
      sku: 'ALIAS-001',
      productCode: 'ALIAS-001',
      currency: 'SYP',
    }));
  });

  it('rejects duplicate SKU on create', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Duplicate Paper',
        sku: 'paper-a4-001',
        basePrice: 7,
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('SKU already exists');
  });

  it('rejects missing name, missing SKU, invalid price, invalid taxRate, and invalid unit', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const missingNameResponse = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ sku: 'NEW-SKU-001', basePrice: 10 });
    const missingSkuResponse = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ name: 'Missing SKU', basePrice: 10 });
    const invalidPriceResponse = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ name: 'Bad Price', sku: 'BAD-PRICE-001', basePrice: -1 });
    const invalidTaxResponse = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ name: 'Bad Tax', sku: 'BAD-TAX-001', basePrice: 10, taxRate: 101 });
    const invalidUnitResponse = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ name: 'Bad Unit', sku: 'BAD-UNIT-001', basePrice: 10, unit: 'CASE' });

    expect(missingNameResponse.status).toBe(400);
    expect(missingSkuResponse.status).toBe(400);
    expect(invalidPriceResponse.status).toBe(400);
    expect(invalidTaxResponse.status).toBe(400);
    expect(invalidUnitResponse.status).toBe(400);
  });

  it('lets admin list all products with pagination metadata', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const response = await request(app)
      .get('/api/v1/products?page=1&limit=2')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Products fetched successfully');
    expect(response.body.count).toBe(2);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      pages: 2,
    });
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('searches and filters products for management roles', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const searchResponse = await request(app)
      .get('/api/v1/products?search=scanner')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    const statusResponse = await request(app)
      .get('/api/v1/products?status=INACTIVE')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    const categoryResponse = await request(app)
      .get('/api/v1/products?category=packaging')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    const priceRangeResponse = await request(app)
      .get('/api/v1/products?minPrice=8&maxPrice=20')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(searchResponse.body.pagination.total).toBe(1);
    expect(searchResponse.body.data[0].sku).toBe('SCANNER-WL-001');
    expect(statusResponse.body.pagination.total).toBe(1);
    expect(statusResponse.body.data[0].status).toBe(PRODUCT_STATUSES.INACTIVE);
    expect(categoryResponse.body.pagination.total).toBe(1);
    expect(categoryResponse.body.data[0].category).toBe('Packaging');
    expect(priceRangeResponse.body.pagination.total).toBe(1);
    expect(priceRangeResponse.body.data[0].sku).toBe('TAPE-PACK-001');
  });

  it('limits sales representatives and accountants to active products', async () => {
    const rep = users.find((user) => user.id === ids.rep);
    const accountant = users.find((user) => user.id === ids.accountant);

    const repResponse = await request(app)
      .get('/api/v1/products?status=INACTIVE')
      .set('Authorization', `Bearer ${tokenFor(rep)}`);
    const accountantResponse = await request(app)
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${tokenFor(accountant)}`);

    expect(repResponse.status).toBe(200);
    expect(repResponse.body.pagination.total).toBe(2);
    expect(repResponse.body.data.every((product) => product.status === PRODUCT_STATUSES.ACTIVE)).toBe(true);
    expect(accountantResponse.body.pagination.total).toBe(2);
    expect(accountantResponse.body.data.every((product) => product.status === PRODUCT_STATUSES.ACTIVE)).toBe(true);
  });

  it('returns active products from the price-list route before /:id matching', async () => {
    const rep = users.find((user) => user.id === ids.rep);

    const response = await request(app)
      .get('/api/v1/products/price-list?search=paper&category=office')
      .set('Authorization', `Bearer ${tokenFor(rep)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Product price list fetched successfully');
    expect(response.body.pagination.total).toBe(1);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data[0]).toEqual(expect.objectContaining({
      id: ids.productOne,
      name: 'Office Printer Paper',
      sku: 'PAPER-A4-001',
      unit: PRODUCT_UNITS.PACK,
      price: 6.5,
      currency: 'SYP',
      taxRate: 0,
      status: PRODUCT_STATUSES.ACTIVE,
    }));
    expect(response.body.data[0]).not.toHaveProperty('basePrice');
  });

  it('lets admin get any product and read-only users get active products only', async () => {
    const admin = users.find((user) => user.id === ids.admin);
    const rep = users.find((user) => user.id === ids.rep);
    const accountant = users.find((user) => user.id === ids.accountant);

    const adminResponse = await request(app)
      .get(`/api/v1/products/${ids.productTwo}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    const repActiveResponse = await request(app)
      .get(`/api/v1/products/${ids.productOne}`)
      .set('Authorization', `Bearer ${tokenFor(rep)}`);
    const accountantInactiveResponse = await request(app)
      .get(`/api/v1/products/${ids.productTwo}`)
      .set('Authorization', `Bearer ${tokenFor(accountant)}`);

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.data.product.status).toBe(PRODUCT_STATUSES.INACTIVE);
    expect(repActiveResponse.status).toBe(200);
    expect(repActiveResponse.body.data.product.status).toBe(PRODUCT_STATUSES.ACTIVE);
    expect(accountantInactiveResponse.status).toBe(404);
  });

  it('returns validation error for invalid id and 404 for unknown product id', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const invalidResponse = await request(app)
      .get('/api/v1/products/not-an-id')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    const unknownResponse = await request(app)
      .get(`/api/v1/products/${ids.unknownProduct}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body.message).toBe('Validation failed');
    expect(unknownResponse.status).toBe(404);
    expect(unknownResponse.body.message).toBe('Product not found');
  });

  it('lets manager update product fields and rejects duplicate SKU update', async () => {
    const manager = users.find((user) => user.id === ids.manager);

    const updateResponse = await request(app)
      .patch(`/api/v1/products/${ids.productOne}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({
        name: 'Updated Paper',
        sku: 'updated-paper-001',
        category: 'Updated Category',
        basePrice: 8,
        currency: 'usd',
        taxRate: 3,
      });
    const duplicateResponse = await request(app)
      .patch(`/api/v1/products/${ids.productOne}`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ sku: 'TAPE-PACK-001' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.product).toEqual(expect.objectContaining({
      name: 'Updated Paper',
      sku: 'UPDATED-PAPER-001',
      category: 'Updated Category',
      basePrice: 8,
      currency: 'USD',
      taxRate: 3,
    }));
    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.message).toBe('SKU already exists');
  });

  it('blocks sales representative and accountant from creating or updating products', async () => {
    const rep = users.find((user) => user.id === ids.rep);
    const accountant = users.find((user) => user.id === ids.accountant);

    const repCreateResponse = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${tokenFor(rep)}`)
      .send({ name: 'Blocked Product', sku: 'BLOCKED-001', basePrice: 1 });
    const repUpdateResponse = await request(app)
      .patch(`/api/v1/products/${ids.productOne}`)
      .set('Authorization', `Bearer ${tokenFor(rep)}`)
      .send({ name: 'Blocked Update' });
    const accountantUpdateResponse = await request(app)
      .patch(`/api/v1/products/${ids.productOne}`)
      .set('Authorization', `Bearer ${tokenFor(accountant)}`)
      .send({ name: 'Blocked Update' });

    expect(repCreateResponse.status).toBe(403);
    expect(repUpdateResponse.status).toBe(403);
    expect(accountantUpdateResponse.status).toBe(403);
  });

  it('lets supervisor update product price and rejects invalid price', async () => {
    const supervisor = users.find((user) => user.id === ids.supervisor);

    const response = await request(app)
      .patch(`/api/v1/products/${ids.productOne}/price`)
      .set('Authorization', `Bearer ${tokenFor(supervisor)}`)
      .send({
        basePrice: 12.5,
        currency: 'usd',
        taxRate: 7,
      });
    const invalidPriceResponse = await request(app)
      .patch(`/api/v1/products/${ids.productOne}/price`)
      .set('Authorization', `Bearer ${tokenFor(supervisor)}`)
      .send({ basePrice: -10 });

    expect(response.status).toBe(200);
    expect(response.body.data.product).toEqual(expect.objectContaining({
      basePrice: 12.5,
      currency: 'USD',
      taxRate: 7,
    }));
    expect(invalidPriceResponse.status).toBe(400);
  });

  it('blocks sales representative and accountant from updating price', async () => {
    const rep = users.find((user) => user.id === ids.rep);
    const accountant = users.find((user) => user.id === ids.accountant);

    const repResponse = await request(app)
      .patch(`/api/v1/products/${ids.productOne}/price`)
      .set('Authorization', `Bearer ${tokenFor(rep)}`)
      .send({ basePrice: 10 });
    const accountantResponse = await request(app)
      .patch(`/api/v1/products/${ids.productOne}/price`)
      .set('Authorization', `Bearer ${tokenFor(accountant)}`)
      .send({ basePrice: 10 });

    expect(repResponse.status).toBe(403);
    expect(accountantResponse.status).toBe(403);
  });

  it('lets admin soft deactivate product and keeps document in database', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const response = await request(app)
      .delete(`/api/v1/products/${ids.productOne}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.product.status).toBe(PRODUCT_STATUSES.INACTIVE);
    expect(products.find((product) => product.id === ids.productOne)).toBeTruthy();
  });

  it('blocks sales representative and accountant from deactivating products', async () => {
    const rep = users.find((user) => user.id === ids.rep);
    const accountant = users.find((user) => user.id === ids.accountant);

    const repResponse = await request(app)
      .delete(`/api/v1/products/${ids.productOne}`)
      .set('Authorization', `Bearer ${tokenFor(rep)}`);
    const accountantResponse = await request(app)
      .delete(`/api/v1/products/${ids.productOne}`)
      .set('Authorization', `Bearer ${tokenFor(accountant)}`);

    expect(repResponse.status).toBe(403);
    expect(accountantResponse.status).toBe(403);
  });

  it('does not include inactive products in the price list after deactivation', async () => {
    const admin = users.find((user) => user.id === ids.admin);
    const rep = users.find((user) => user.id === ids.rep);

    await request(app)
      .delete(`/api/v1/products/${ids.productOne}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    const response = await request(app)
      .get('/api/v1/products/price-list')
      .set('Authorization', `Bearer ${tokenFor(rep)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.find((item) => item.id === ids.productOne)).toBeUndefined();
    expect(response.body.data.every((item) => item.status === PRODUCT_STATUSES.ACTIVE)).toBe(true);
  });
});
