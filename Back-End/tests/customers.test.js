const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
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

jest.mock('../src/models/User', () => ({
  User: {
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
    create: jest.fn(),
  },
  CUSTOMER_STATUSES: mockCustomerStatuses,
  CUSTOMER_TYPES: mockCustomerTypes,
  PAYMENT_TYPES: mockPaymentTypes,
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

const ids = {
  admin: '64f000000000000000000001',
  rep: '64f000000000000000000002',
  manager: '64f000000000000000000003',
  supervisor: '64f000000000000000000004',
  accountant: '64f000000000000000000005',
  repTwo: '64f000000000000000000006',
  inactiveRep: '64f000000000000000000007',
  customerOne: '65f000000000000000000001',
  customerTwo: '65f000000000000000000002',
  customerThree: '65f000000000000000000003',
  unknownCustomer: '65f000000000000000000099',
  createdCustomer: '65f000000000000000000100',
};

let users;
let customers;

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

const makeCustomer = ({
  id,
  name,
  contactName = 'Default Contact',
  phone = '+963900000000',
  email = 'customer@example.com',
  address = { city: 'Damascus', country: 'Syria' },
  notes = 'Demo customer',
  assignedSalesRep = ids.rep,
  customerType = CUSTOMER_TYPES.RETAIL,
  paymentType = PAYMENT_TYPES.CASH,
  status = CUSTOMER_STATUSES.ACTIVE,
  createdBy = ids.admin,
  updatedBy = ids.admin,
}) => ({
  id,
  _id: toObjectId(id),
  name,
  contactName,
  phone,
  email,
  address,
  notes,
  assignedSalesRep,
  customerType,
  paymentType,
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
      contactName: this.contactName,
      phone: this.phone,
      email: this.email,
      address: this.address,
      notes: this.notes,
      assignedSalesRep: this.assignedSalesRep,
      customerType: this.customerType,
      paymentType: this.paymentType,
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

  return reference.toString();
};

const getValue = (object, path) => path.split('.').reduce((value, key) => (
  value ? value[key] : undefined
), object);

const applyFilters = (filters = {}) => customers.filter((customer) => {
  if (filters.status && customer.status !== filters.status) {
    return false;
  }

  if (filters.customerType && customer.customerType !== filters.customerType) {
    return false;
  }

  if (filters.paymentType && customer.paymentType !== filters.paymentType) {
    return false;
  }

  if (filters.assignedSalesRep && referenceId(customer.assignedSalesRep) !== filters.assignedSalesRep) {
    return false;
  }

  if (filters['address.city'] && !filters['address.city'].test(customer.address?.city || '')) {
    return false;
  }

  if (filters.$or) {
    return filters.$or.some((condition) => Object.entries(condition).some(([field, regex]) => (
      regex.test(String(getValue(customer, field) || ''))
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

  Customer.findById.mockImplementation((id) => makeDocumentQuery(
    customers.find((customer) => customer.id === id) || null,
  ));

  Customer.find.mockImplementation((filters) => makeListQuery(applyFilters(filters)));
  Customer.countDocuments.mockImplementation(async (filters) => applyFilters(filters).length);
  Customer.create.mockImplementation(async (payload) => {
    const customer = makeCustomer({
      id: ids.createdCustomer,
      ...payload,
    });

    customers.push(customer);
    return customer;
  });
};

const expectSafeReference = (reference) => {
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
    makeUser({
      id: ids.inactiveRep,
      name: 'Inactive Rep',
      email: 'inactive.rep@intellisales.com',
      role: USER_ROLES.SALES_REPRESENTATIVE,
      status: USER_STATUSES.INACTIVE,
    }),
  ];

  customers = [
    makeCustomer({
      id: ids.customerOne,
      name: 'Alpha Market',
      contactName: 'Alaa',
      phone: '+963911111111',
      email: 'alpha@example.com',
      address: { city: 'Damascus', country: 'Syria' },
      assignedSalesRep: ids.rep,
      status: CUSTOMER_STATUSES.ACTIVE,
    }),
    makeCustomer({
      id: ids.customerTwo,
      name: 'Beta Store',
      contactName: 'Basma',
      phone: '+963922222222',
      email: 'beta@example.com',
      address: { city: 'Aleppo', country: 'Syria' },
      assignedSalesRep: ids.repTwo,
      status: CUSTOMER_STATUSES.ACTIVE,
    }),
    makeCustomer({
      id: ids.customerThree,
      name: 'Gamma Shop',
      contactName: 'Ghassan',
      phone: '+963933333333',
      email: 'gamma@example.com',
      address: { city: 'Damascus', country: 'Syria' },
      status: CUSTOMER_STATUSES.INACTIVE,
      assignedSalesRep: users[3],
      createdBy: users[0],
      updatedBy: users[0],
    }),
  ];

  jest.clearAllMocks();
  configureMocks();
});

describe('customers management module', () => {
  it('returns 401 for GET /api/v1/customers without token', async () => {
    const response = await request(app).get('/api/v1/customers');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  it('lets accountant list customers but blocks customer creation', async () => {
    const accountant = users.find((user) => user.id === ids.accountant);

    const listResponse = await request(app)
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${tokenFor(accountant)}`);
    const createResponse = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${tokenFor(accountant)}`)
      .send({ name: 'Blocked Customer' });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.pagination.total).toBe(3);
    expect(createResponse.status).toBe(403);
  });

  it('lets sales representative create a customer assigned to self', async () => {
    const rep = users.find((user) => user.id === ids.rep);

    const response = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${tokenFor(rep)}`)
      .send({
        name: 'Mobile Demo Customer',
        assignedSalesRep: ids.repTwo,
        status: CUSTOMER_STATUSES.INACTIVE,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.customer).toEqual(expect.objectContaining({
      id: ids.createdCustomer,
      name: 'Mobile Demo Customer',
      customerType: CUSTOMER_TYPES.RETAIL,
      paymentType: PAYMENT_TYPES.CASH,
      status: CUSTOMER_STATUSES.ACTIVE,
      assignedSalesRep: ids.rep,
    }));
  });

  it('rejects invalid customerType on create', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const response = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Invalid Type Customer',
        customerType: 'VIP',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  it('limits sales representative list results to assigned customers only', async () => {
    const rep = users.find((user) => user.id === ids.rep);

    const response = await request(app)
      .get(`/api/v1/customers?assignedSalesRep=${ids.repTwo}`)
      .set('Authorization', `Bearer ${tokenFor(rep)}`);

    expect(response.status).toBe(200);
    expect(response.body.pagination.total).toBe(2);
    expect(response.body.data.every((customer) => (
      referenceId(customer.assignedSalesRep) === ids.rep
    ))).toBe(true);
  });

  it('blocks sales representative from accessing another representative customer', async () => {
    const rep = users.find((user) => user.id === ids.rep);

    const response = await request(app)
      .get(`/api/v1/customers/${ids.customerTwo}`)
      .set('Authorization', `Bearer ${tokenFor(rep)}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Forbidden');
  });

  it('blocks sales representative from deactivating a customer', async () => {
    const rep = users.find((user) => user.id === ids.rep);

    const response = await request(app)
      .delete(`/api/v1/customers/${ids.customerOne}`)
      .set('Authorization', `Bearer ${tokenFor(rep)}`);

    expect(response.status).toBe(403);
  });

  it('lets admin create a customer assigned to an active sales representative', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const response = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Admin Created Customer',
        contactName: 'New Buyer',
        phone: '+963944444444',
        email: 'new.customer@example.com',
        address: { city: 'Homs', country: 'Syria' },
        notes: 'Created by admin',
        assignedSalesRep: ids.rep,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.customer).toEqual(expect.objectContaining({
      id: ids.createdCustomer,
      name: 'Admin Created Customer',
      status: CUSTOMER_STATUSES.ACTIVE,
      assignedSalesRep: ids.rep,
    }));
    expectSafeReference(response.body.data.customer.assignedSalesRep);
  });

  it('rejects missing customer name and invalid email', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const missingNameResponse = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ email: 'valid@example.com' });
    const invalidEmailResponse = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ name: 'Invalid Email Customer', email: 'not-an-email' });

    expect(missingNameResponse.status).toBe(400);
    expect(invalidEmailResponse.status).toBe(400);
    expect(missingNameResponse.body.message).toBe('Validation failed');
    expect(invalidEmailResponse.body.message).toBe('Validation failed');
  });

  it('rejects invalid assignedSalesRep ObjectId on create', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const response = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Invalid Rep Customer',
        assignedSalesRep: 'not-an-id',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  it('requires assignedSalesRep to be a real active sales representative', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const missingResponse = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Missing Rep Customer',
        assignedSalesRep: ids.unknownCustomer,
      });
    const wrongRoleResponse = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Wrong Role Customer',
        assignedSalesRep: ids.manager,
      });
    const inactiveResponse = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Inactive Rep Customer',
        assignedSalesRep: ids.inactiveRep,
      });

    expect(missingResponse.status).toBe(404);
    expect(wrongRoleResponse.status).toBe(400);
    expect(inactiveResponse.status).toBe(400);
  });

  it('lets admin list all customers with pagination metadata', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const response = await request(app)
      .get('/api/v1/customers?page=1&limit=2')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Customers fetched successfully');
    expect(response.body.count).toBe(2);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      pages: 2,
    });
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('searches and filters customers', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const searchResponse = await request(app)
      .get('/api/v1/customers?search=alpha')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    const statusResponse = await request(app)
      .get('/api/v1/customers?status=INACTIVE')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    const cityResponse = await request(app)
      .get('/api/v1/customers?city=aleppo')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    const assignedResponse = await request(app)
      .get(`/api/v1/customers?assignedSalesRep=${ids.repTwo}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(searchResponse.body.pagination.total).toBe(1);
    expect(searchResponse.body.data[0].name).toBe('Alpha Market');
    expect(statusResponse.body.pagination.total).toBe(1);
    expect(statusResponse.body.data[0].status).toBe(CUSTOMER_STATUSES.INACTIVE);
    expect(cityResponse.body.pagination.total).toBe(1);
    expect(cityResponse.body.data[0].address.city).toBe('Aleppo');
    expect(assignedResponse.body.pagination.total).toBe(1);
    expect(assignedResponse.body.data[0].id).toBe(ids.customerTwo);
  });

  it('gets customer by id for admin and sales representative owner', async () => {
    const admin = users.find((user) => user.id === ids.admin);
    const rep = users.find((user) => user.id === ids.rep);

    const adminResponse = await request(app)
      .get(`/api/v1/customers/${ids.customerOne}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    const repResponse = await request(app)
      .get(`/api/v1/customers/${ids.customerOne}`)
      .set('Authorization', `Bearer ${tokenFor(rep)}`);

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.data.customer.id).toBe(ids.customerOne);
    expect(repResponse.status).toBe(200);
    expect(repResponse.body.data.customer.id).toBe(ids.customerOne);
  });

  it('returns validation error for invalid id and 404 for unknown customer id', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const invalidResponse = await request(app)
      .get('/api/v1/customers/not-an-id')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    const unknownResponse = await request(app)
      .get(`/api/v1/customers/${ids.unknownCustomer}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body.message).toBe('Validation failed');
    expect(unknownResponse.status).toBe(404);
    expect(unknownResponse.body.message).toBe('Customer not found');
  });

  it('lets admin update customer fields', async () => {
    const admin = users.find((user) => user.id === ids.admin);

    const response = await request(app)
      .patch(`/api/v1/customers/${ids.customerOne}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({
        name: 'Updated Alpha Market',
      contactName: 'Updated Contact',
      customerType: CUSTOMER_TYPES.WHOLESALE,
      paymentType: PAYMENT_TYPES.CREDIT,
      status: CUSTOMER_STATUSES.ACTIVE,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.customer).toEqual(expect.objectContaining({
      id: ids.customerOne,
      name: 'Updated Alpha Market',
      contactName: 'Updated Contact',
      customerType: CUSTOMER_TYPES.WHOLESALE,
      paymentType: PAYMENT_TYPES.CREDIT,
      status: CUSTOMER_STATUSES.ACTIVE,
    }));
  });

  it('lets sales representative update basic fields for assigned customer', async () => {
    const rep = users.find((user) => user.id === ids.rep);

    const response = await request(app)
      .patch(`/api/v1/customers/${ids.customerOne}`)
      .set('Authorization', `Bearer ${tokenFor(rep)}`)
      .send({
        contactName: 'Rep Updated Contact',
        phone: '+963955555555',
        notes: 'Updated from mobile demo',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.customer.contactName).toBe('Rep Updated Contact');
    expect(response.body.data.customer.phone).toBe('+963955555555');
    expect(response.body.data.customer.notes).toBe('Updated from mobile demo');
  });

  it('lets sales representative update basic fields when assignedSalesRep is a Mongoose ObjectId', async () => {
    const rep = users.find((user) => user.id === ids.rep);
    const objectIdCustomer = makeCustomer({
      id: '65f000000000000000000004',
      name: 'ObjectId Owned Customer',
      assignedSalesRep: new mongoose.Types.ObjectId(ids.rep),
    });

    customers.push(objectIdCustomer);

    const response = await request(app)
      .patch(`/api/v1/customers/${objectIdCustomer.id}`)
      .set('Authorization', `Bearer ${tokenFor(rep)}`)
      .send({
        contactName: 'ObjectId Updated Contact',
        phone: '+963966666666',
        notes: 'Updated with ObjectId owner',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.customer.contactName).toBe('ObjectId Updated Contact');
    expect(response.body.data.customer.phone).toBe('+963966666666');
    expect(response.body.data.customer.notes).toBe('Updated with ObjectId owner');
  });

  it('blocks sales representative from updating status or assignedSalesRep', async () => {
    const rep = users.find((user) => user.id === ids.rep);

    const statusResponse = await request(app)
      .patch(`/api/v1/customers/${ids.customerOne}`)
      .set('Authorization', `Bearer ${tokenFor(rep)}`)
      .send({ status: CUSTOMER_STATUSES.INACTIVE });
    const assignedResponse = await request(app)
      .patch(`/api/v1/customers/${ids.customerOne}`)
      .set('Authorization', `Bearer ${tokenFor(rep)}`)
      .send({ assignedSalesRep: ids.repTwo });

    expect(statusResponse.status).toBe(403);
    expect(assignedResponse.status).toBe(400);
  });

  it('blocks accountant from updating customers', async () => {
    const accountant = users.find((user) => user.id === ids.accountant);

    const response = await request(app)
      .patch(`/api/v1/customers/${ids.customerOne}`)
      .set('Authorization', `Bearer ${tokenFor(accountant)}`)
      .send({ contactName: 'Blocked Update' });

    expect(response.status).toBe(403);
  });

  it('lets manager assign customer to active sales representative', async () => {
    const manager = users.find((user) => user.id === ids.manager);

    const response = await request(app)
      .patch(`/api/v1/customers/${ids.customerOne}/assign`)
      .set('Authorization', `Bearer ${tokenFor(manager)}`)
      .send({ assignedSalesRep: ids.repTwo });

    expect(response.status).toBe(200);
    expect(response.body.data.customer.assignedSalesRep).toBe(ids.repTwo);
  });

  it('rejects assignment to non-sales-rep or inactive sales rep and blocks lower roles', async () => {
    const admin = users.find((user) => user.id === ids.admin);
    const rep = users.find((user) => user.id === ids.rep);
    const accountant = users.find((user) => user.id === ids.accountant);

    const nonRepResponse = await request(app)
      .patch(`/api/v1/customers/${ids.customerOne}/assign`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ assignedSalesRep: ids.manager });
    const inactiveResponse = await request(app)
      .patch(`/api/v1/customers/${ids.customerOne}/assign`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ assignedSalesRep: ids.inactiveRep });
    const repResponse = await request(app)
      .patch(`/api/v1/customers/${ids.customerOne}/assign`)
      .set('Authorization', `Bearer ${tokenFor(rep)}`)
      .send({ assignedSalesRep: ids.repTwo });
    const accountantResponse = await request(app)
      .patch(`/api/v1/customers/${ids.customerOne}/assign`)
      .set('Authorization', `Bearer ${tokenFor(accountant)}`)
      .send({ assignedSalesRep: ids.repTwo });

    expect(nonRepResponse.status).toBe(400);
    expect(inactiveResponse.status).toBe(400);
    expect(repResponse.status).toBe(403);
    expect(accountantResponse.status).toBe(403);
  });

  it('lets supervisor soft deactivate customer without removing document', async () => {
    const supervisor = users.find((user) => user.id === ids.supervisor);

    const response = await request(app)
      .delete(`/api/v1/customers/${ids.customerOne}`)
      .set('Authorization', `Bearer ${tokenFor(supervisor)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.customer.status).toBe(CUSTOMER_STATUSES.INACTIVE);
    expect(customers.find((customer) => customer.id === ids.customerOne)).toBeTruthy();
  });
});
