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
    findById: jest.fn(),
  },
  USER_ROLES: mockUserRoles,
  USER_STATUSES: mockUserStatuses,
}));

jest.mock('../src/modules/customers/customer.model', () => ({
  Customer: {
    find: jest.fn(),
    findById: jest.fn(),
  },
  CUSTOMER_STATUSES: mockCustomerStatuses,
  CUSTOMER_TYPES: mockCustomerTypes,
  PAYMENT_TYPES: mockPaymentTypes,
}));

jest.mock('../src/modules/visits/visit.model', () => ({
  Visit: {
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
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
  PAYMENT_TYPES,
} = require('../src/modules/customers/customer.model');
const { Visit, VISIT_OUTCOMES, VISIT_STATUSES } = require('../src/modules/visits/visit.model');

const ids = {
  admin: '64f000000000000000000001',
  manager: '64f000000000000000000003',
  supervisor: '64f000000000000000000004',
  rep: '64f000000000000000000002',
  repTwo: '64f000000000000000000006',
  accountant: '64f000000000000000000005',
  inactiveRep: '64f000000000000000000007',
  customerAssigned: '65f000000000000000000001',
  customerOther: '65f000000000000000000002',
  customerInactive: '65f000000000000000000003',
  customerUnassigned: '65f000000000000000000004',
  customerUnknown: '65f000000000000000000099',
  plannedVisit: '69f000000000000000000001',
  otherRepVisit: '69f000000000000000000002',
  completedVisit: '69f000000000000000000003',
  cancelledVisit: '69f000000000000000000004',
  createdVisit: '69f000000000000000000100',
};

let users;
let customers;
let visits;
let visitSequence;

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
  toJSON() {
    return { ...this };
  },
});

const makeVisit = ({
  id,
  customer = ids.customerAssigned,
  salesRep = ids.rep,
  visitDate = new Date('2030-01-15T10:00:00.000Z'),
  status = VISIT_STATUSES.PLANNED,
  purpose = 'Store visit',
  notes = 'Initial visit notes',
  outcome = VISIT_OUTCOMES.NONE,
  nextAction,
  nextVisitDate,
  location = { city: 'Damascus', address: 'Main Street' },
  createdBy = salesRep,
  updatedBy = salesRep,
  completedAt,
  cancelledAt,
}) => ({
  id,
  _id: toObjectId(id),
  customer,
  salesRep,
  visitDate,
  status,
  purpose,
  notes,
  outcome,
  nextAction,
  nextVisitDate,
  location,
  createdBy,
  updatedBy,
  completedAt,
  cancelledAt,
  createdAt: new Date('2026-06-27T09:00:00.000Z'),
  updatedAt: new Date('2026-06-27T09:00:00.000Z'),
  __v: 0,
  saveCount: 0,
  async save() {
    this.saveCount += 1;
    this.updatedAt = new Date('2026-06-27T11:00:00.000Z');

    const existingIndex = visits.findIndex((visit) => visit.id === this.id);

    if (existingIndex === -1) {
      visits.push(this);
    } else {
      visits[existingIndex] = this;
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

const userById = (id) => users.find((user) => user.id === id);
const customerById = (id) => customers.find((customer) => customer.id === id);
const visitById = (id) => visits.find((visit) => visit.id === id);

const makeDocumentQuery = (result) => {
  const query = {
    populate: jest.fn(() => query),
    select: jest.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };

  return query;
};

const makeListQuery = (result) => {
  const query = {
    populate: jest.fn(() => query),
    select: jest.fn(() => Promise.resolve(result)),
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

const matchesCondition = (visit, condition) => Object.entries(condition).some(([field, expected]) => {
  if (field === 'customer' && expected.$in) {
    return expected.$in.includes(referenceId(visit.customer));
  }

  const value = getValue(visit, field);

  if (expected instanceof RegExp) {
    return expected.test(String(value || ''));
  }

  return referenceId(value) === expected || value === expected;
});

const applyVisitFilters = (filters = {}) => visits.filter((visit) => {
  if (filters.status && visit.status !== filters.status) {
    return false;
  }

  if (filters.outcome && visit.outcome !== filters.outcome) {
    return false;
  }

  if (filters.customer && referenceId(visit.customer) !== filters.customer) {
    return false;
  }

  if (filters.salesRep && referenceId(visit.salesRep) !== filters.salesRep) {
    return false;
  }

  if (filters.visitDate?.$gte && visit.visitDate < filters.visitDate.$gte) {
    return false;
  }

  if (filters.visitDate?.$lte && visit.visitDate > filters.visitDate.$lte) {
    return false;
  }

  if (filters.$or && !filters.$or.some((condition) => matchesCondition(visit, condition))) {
    return false;
  }

  return true;
});

const applyCustomerSearch = (filters = {}) => customers.filter((customer) => {
  if (!filters.$or) {
    return true;
  }

  return filters.$or.some((condition) => Object.entries(condition).some(([field, regex]) => (
    regex.test(String(getValue(customer, field) || ''))
  )));
});

const configureMocks = () => {
  User.findById.mockImplementation(async (id) => userById(id) || null);
  Customer.findById.mockImplementation((id) => makeDocumentQuery(customerById(id) || null));
  Customer.find.mockImplementation((filters) => makeListQuery(applyCustomerSearch(filters)));
  Visit.findById.mockImplementation((id) => makeDocumentQuery(visitById(id) || null));
  Visit.find.mockImplementation((filters) => makeListQuery(applyVisitFilters(filters)));
  Visit.countDocuments.mockImplementation(async (filters) => applyVisitFilters(filters).length);
  Visit.create.mockImplementation(async (payload) => {
    const visit = makeVisit({
      id: ids.createdVisit.replace(/.$/, String(visitSequence += 1)),
      ...payload,
    });

    visits.push(visit);
    return visit;
  });
};

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
    makeUser({
      id: ids.inactiveRep,
      name: 'Inactive Sales Representative',
      email: 'inactive.rep@intellisales.com',
      role: USER_ROLES.SALES_REPRESENTATIVE,
      status: USER_STATUSES.INACTIVE,
    }),
  ];

  customers = [
    makeCustomer({
      id: ids.customerAssigned,
      name: 'Assigned Market',
      assignedSalesRep: ids.rep,
    }),
    makeCustomer({
      id: ids.customerOther,
      name: 'Other Rep Store',
      assignedSalesRep: ids.repTwo,
    }),
    makeCustomer({
      id: ids.customerInactive,
      name: 'Inactive Customer',
      assignedSalesRep: ids.rep,
      status: CUSTOMER_STATUSES.INACTIVE,
    }),
    makeCustomer({
      id: ids.customerUnassigned,
      name: 'Unassigned Store',
      assignedSalesRep: undefined,
    }),
  ];

  visits = [
    makeVisit({
      id: ids.plannedVisit,
      customer: ids.customerAssigned,
      salesRep: ids.rep,
      purpose: 'Discuss new order',
      notes: 'Bring updated price list',
    }),
    makeVisit({
      id: ids.otherRepVisit,
      customer: ids.customerOther,
      salesRep: ids.repTwo,
      purpose: 'Other rep visit',
      notes: 'Private visit notes',
    }),
    makeVisit({
      id: ids.completedVisit,
      customer: ids.customerAssigned,
      salesRep: ids.rep,
      status: VISIT_STATUSES.COMPLETED,
      outcome: VISIT_OUTCOMES.ORDER_PLACED,
      completedAt: new Date('2026-06-28T10:00:00.000Z'),
    }),
    makeVisit({
      id: ids.cancelledVisit,
      customer: ids.customerAssigned,
      salesRep: ids.rep,
      status: VISIT_STATUSES.CANCELLED,
      cancelledAt: new Date('2026-06-28T11:00:00.000Z'),
    }),
  ];
  visitSequence = 0;

  jest.clearAllMocks();
  configureMocks();
});

describe('visits management module', () => {
  it('returns 401 for GET /api/v1/visits without token', async () => {
    const response = await request(app).get('/api/v1/visits');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Authentication required',
    });
  });

  it('allows admin to create, list, get, update, complete, and cancel visits', async () => {
    const adminToken = tokenFor(userById(ids.admin));

    const createResponse = await request(app)
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: ids.customerAssigned,
        visitDate: '2030-02-01T10:00:00.000Z',
        purpose: 'Admin planned visit',
        notes: 'Created by admin',
      });

    expect(createResponse.status).toBe(201);
    expectSuccessEnvelope(createResponse.body);
    expect(createResponse.body.data.visit).toEqual(expect.objectContaining({
      status: VISIT_STATUSES.PLANNED,
      salesRep: ids.rep,
      createdBy: ids.admin,
      updatedBy: ids.admin,
    }));

    const listResponse = await request(app)
      .get('/api/v1/visits')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listResponse.status).toBe(200);
    expectPaginatedEnvelope(listResponse.body);
    expect(listResponse.body.count).toBe(visits.length);

    const getResponse = await request(app)
      .get(`/api/v1/visits/${ids.plannedVisit}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.visit.id).toBe(ids.plannedVisit);
    expectSafePayload(getResponse.body);

    const updateResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        purpose: 'Updated admin purpose',
        salesRep: ids.repTwo,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.visit).toEqual(expect.objectContaining({
      purpose: 'Updated admin purpose',
      salesRep: ids.repTwo,
      updatedBy: ids.admin,
    }));

    const completeResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}/complete`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        outcome: VISIT_OUTCOMES.FOLLOW_UP_NEEDED,
        notes: 'Customer asked for another call',
      });

    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.data.visit).toEqual(expect.objectContaining({
      status: VISIT_STATUSES.COMPLETED,
      outcome: VISIT_OUTCOMES.FOLLOW_UP_NEEDED,
      notes: 'Customer asked for another call',
      updatedBy: ids.admin,
    }));
    expect(completeResponse.body.data.visit.completedAt).toBeDefined();

    const cancelTarget = visits.find((visit) => visit.id === ids.otherRepVisit);
    cancelTarget.salesRep = ids.rep;
    const cancelResponse = await request(app)
      .patch(`/api/v1/visits/${ids.otherRepVisit}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Customer cancelled meeting' });

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.data.visit).toEqual(expect.objectContaining({
      status: VISIT_STATUSES.CANCELLED,
      notes: 'Customer cancelled meeting',
      updatedBy: ids.admin,
    }));
    expect(cancelResponse.body.data.visit.cancelledAt).toBeDefined();
  });

  it.each([
    ['SALES_MANAGER', ids.manager],
    ['SALES_SUPERVISOR', ids.supervisor],
  ])('allows %s to manage visits', async (roleName, userId) => {
    const token = tokenFor(userById(userId));

    const updateResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ purpose: `${roleName} update` });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.visit.purpose).toBe(`${roleName} update`);

    const completeTarget = visits.find((visit) => visit.id === ids.plannedVisit);
    completeTarget.status = VISIT_STATUSES.PLANNED;
    const completeResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ outcome: VISIT_OUTCOMES.ORDER_PLACED });

    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.data.visit.status).toBe(VISIT_STATUSES.COMPLETED);
  });

  it('lets sales representative create a visit for an assigned customer and forces salesRep to current user', async () => {
    const response = await request(app)
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${tokenFor(userById(ids.rep))}`)
      .send({
        customer: ids.customerAssigned,
        salesRep: ids.repTwo,
        visitDate: '2030-02-01T10:00:00.000Z',
        purpose: 'Mobile planned visit',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.visit).toEqual(expect.objectContaining({
      customer: ids.customerAssigned,
      salesRep: ids.rep,
      createdBy: ids.rep,
      status: VISIT_STATUSES.PLANNED,
    }));
  });

  it('blocks sales representative from creating a visit for an unassigned customer', async () => {
    const response = await request(app)
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${tokenFor(userById(ids.rep))}`)
      .send({
        customer: ids.customerOther,
        visitDate: '2030-02-01T10:00:00.000Z',
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: 'Forbidden',
    });
  });

  it('validates active customer and active sales representative on create', async () => {
    const adminToken = tokenFor(userById(ids.admin));

    const inactiveCustomerResponse = await request(app)
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: ids.customerInactive,
        salesRep: ids.rep,
        visitDate: '2030-02-01T10:00:00.000Z',
      });
    const missingRepResponse = await request(app)
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: ids.customerAssigned,
        salesRep: ids.customerUnknown,
        visitDate: '2030-02-01T10:00:00.000Z',
      });
    const wrongRoleResponse = await request(app)
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: ids.customerAssigned,
        salesRep: ids.manager,
        visitDate: '2030-02-01T10:00:00.000Z',
      });
    const inactiveRepResponse = await request(app)
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: ids.customerAssigned,
        salesRep: ids.inactiveRep,
        visitDate: '2030-02-01T10:00:00.000Z',
      });

    expect(inactiveCustomerResponse.status).toBe(400);
    expect(inactiveCustomerResponse.body.message).toBe('Customer must be active to create or update a visit');
    expect(missingRepResponse.status).toBe(404);
    expect(wrongRoleResponse.status).toBe(400);
    expect(inactiveRepResponse.status).toBe(400);
  });

  it('rejects missing customer, invalid customer id, and past visitDate', async () => {
    const adminToken = tokenFor(userById(ids.admin));

    const missingCustomerResponse = await request(app)
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        salesRep: ids.rep,
        visitDate: '2030-02-01T10:00:00.000Z',
      });
    const invalidCustomerResponse = await request(app)
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: 'not-an-id',
        salesRep: ids.rep,
        visitDate: '2030-02-01T10:00:00.000Z',
      });
    const pastDateResponse = await request(app)
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer: ids.customerAssigned,
        salesRep: ids.rep,
        visitDate: '2020-01-01T10:00:00.000Z',
      });

    expect(missingCustomerResponse.status).toBe(400);
    expect(invalidCustomerResponse.status).toBe(400);
    expect(pastDateResponse.status).toBe(400);
    expect(missingCustomerResponse.body.message).toBe('Validation failed');
    expect(invalidCustomerResponse.body.message).toBe('Validation failed');
    expect(pastDateResponse.body.message).toBe('Validation failed');
  });

  it('lets sales representative list only own visits and blocks access to another representative visit', async () => {
    const repToken = tokenFor(userById(ids.rep));

    const listResponse = await request(app)
      .get('/api/v1/visits')
      .set('Authorization', `Bearer ${repToken}`);
    const getResponse = await request(app)
      .get(`/api/v1/visits/${ids.otherRepVisit}`)
      .set('Authorization', `Bearer ${repToken}`);
    const updateResponse = await request(app)
      .patch(`/api/v1/visits/${ids.otherRepVisit}`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ purpose: 'Blocked update' });
    const completeResponse = await request(app)
      .patch(`/api/v1/visits/${ids.otherRepVisit}/complete`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ outcome: VISIT_OUTCOMES.OTHER });
    const cancelResponse = await request(app)
      .patch(`/api/v1/visits/${ids.otherRepVisit}/cancel`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ notes: 'Blocked cancel' });

    expect(listResponse.status).toBe(200);
    expectPaginatedEnvelope(listResponse.body);
    expect(listResponse.body.data.every((visit) => referenceId(visit.salesRep) === ids.rep)).toBe(true);
    expect(getResponse.status).toBe(403);
    expect(updateResponse.status).toBe(403);
    expect(completeResponse.status).toBe(403);
    expect(cancelResponse.status).toBe(403);
  });

  it('lets accountant list and get visits but blocks modifications', async () => {
    const accountantToken = tokenFor(userById(ids.accountant));

    const listResponse = await request(app)
      .get('/api/v1/visits')
      .set('Authorization', `Bearer ${accountantToken}`);
    const getResponse = await request(app)
      .get(`/api/v1/visits/${ids.plannedVisit}`)
      .set('Authorization', `Bearer ${accountantToken}`);
    const createResponse = await request(app)
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        customer: ids.customerAssigned,
        salesRep: ids.rep,
        visitDate: '2030-02-01T10:00:00.000Z',
      });
    const updateResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}`)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ purpose: 'Blocked' });
    const completeResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}/complete`)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ outcome: VISIT_OUTCOMES.OTHER });
    const cancelResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}/cancel`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(listResponse.status).toBe(200);
    expect(getResponse.status).toBe(200);
    expect(createResponse.status).toBe(403);
    expect(updateResponse.status).toBe(403);
    expect(completeResponse.status).toBe(403);
    expect(cancelResponse.status).toBe(403);
  });

  it('updates only planned visits and blocks sales representative customer or salesRep changes', async () => {
    const repToken = tokenFor(userById(ids.rep));

    const updateResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({
        visitDate: '2030-03-01T10:00:00.000Z',
        purpose: 'Updated by rep',
        location: {
          city: 'Homs',
          latitude: 34.73,
          longitude: 36.72,
        },
      });
    const forbiddenFieldResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ salesRep: ids.repTwo });
    const completedUpdateResponse = await request(app)
      .patch(`/api/v1/visits/${ids.completedVisit}`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ purpose: 'Should fail' });
    const cancelledUpdateResponse = await request(app)
      .patch(`/api/v1/visits/${ids.cancelledVisit}`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ purpose: 'Should fail' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.visit).toEqual(expect.objectContaining({
      purpose: 'Updated by rep',
      updatedBy: ids.rep,
    }));
    expect(updateResponse.body.data.visit.location).toEqual(expect.objectContaining({
      city: 'Homs',
      latitude: 34.73,
      longitude: 36.72,
    }));
    expect(forbiddenFieldResponse.status).toBe(403);
    expect(completedUpdateResponse.status).toBe(400);
    expect(cancelledUpdateResponse.status).toBe(400);
  });

  it('lets management update customer and salesRep when both are valid', async () => {
    const response = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}`)
      .set('Authorization', `Bearer ${tokenFor(userById(ids.manager))}`)
      .send({
        customer: ids.customerOther,
        salesRep: ids.repTwo,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.visit).toEqual(expect.objectContaining({
      customer: ids.customerOther,
      salesRep: ids.repTwo,
      updatedBy: ids.manager,
    }));
  });

  it('completes only planned visits and requires a useful outcome', async () => {
    const repToken = tokenFor(userById(ids.rep));

    const missingOutcomeResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}/complete`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ notes: 'Missing outcome' });
    const completeResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}/complete`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({
        outcome: VISIT_OUTCOMES.PAYMENT_COLLECTED,
        notes: 'Collected cash payment',
        nextAction: 'Send receipt reminder',
      });
    const completeAgainResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}/complete`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ outcome: VISIT_OUTCOMES.OTHER });
    const cancelledCompleteResponse = await request(app)
      .patch(`/api/v1/visits/${ids.cancelledVisit}/complete`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ outcome: VISIT_OUTCOMES.OTHER });

    expect(missingOutcomeResponse.status).toBe(400);
    expect(missingOutcomeResponse.body.message).toBe('Validation failed');
    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.data.visit).toEqual(expect.objectContaining({
      status: VISIT_STATUSES.COMPLETED,
      outcome: VISIT_OUTCOMES.PAYMENT_COLLECTED,
      notes: 'Collected cash payment',
      nextAction: 'Send receipt reminder',
      updatedBy: ids.rep,
    }));
    expect(completeResponse.body.data.visit.completedAt).toBeDefined();
    expect(completeAgainResponse.status).toBe(400);
    expect(cancelledCompleteResponse.status).toBe(400);
  });

  it('cancels only planned visits', async () => {
    const repToken = tokenFor(userById(ids.rep));

    const cancelResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}/cancel`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ notes: 'Customer unavailable' });
    const cancelAgainResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}/cancel`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ notes: 'Should fail' });
    const completedCancelResponse = await request(app)
      .patch(`/api/v1/visits/${ids.completedVisit}/cancel`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ notes: 'Should fail' });

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.data.visit).toEqual(expect.objectContaining({
      status: VISIT_STATUSES.CANCELLED,
      notes: 'Customer unavailable',
      updatedBy: ids.rep,
    }));
    expect(cancelResponse.body.data.visit.cancelledAt).toBeDefined();
    expect(cancelAgainResponse.status).toBe(400);
    expect(completedCancelResponse.status).toBe(400);
  });

  it('lists customer visits with admin and assigned sales rep access while blocking unassigned reps', async () => {
    const adminResponse = await request(app)
      .get(`/api/v1/customers/${ids.customerAssigned}/visits`)
      .set('Authorization', `Bearer ${tokenFor(userById(ids.admin))}`);
    const repResponse = await request(app)
      .get(`/api/v1/customers/${ids.customerAssigned}/visits`)
      .set('Authorization', `Bearer ${tokenFor(userById(ids.rep))}`);
    const unassignedResponse = await request(app)
      .get(`/api/v1/customers/${ids.customerOther}/visits`)
      .set('Authorization', `Bearer ${tokenFor(userById(ids.rep))}`);

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.message).toBe('Customer visits fetched successfully');
    expectPaginatedEnvelope(adminResponse.body);
    expect(adminResponse.body.data.every((visit) => referenceId(visit.customer) === ids.customerAssigned)).toBe(true);
    expect(repResponse.status).toBe(200);
    expect(repResponse.body.data.every((visit) => referenceId(visit.salesRep) === ids.rep)).toBe(true);
    expect(unassignedResponse.status).toBe(403);
  });

  it('returns validation error for invalid customer id and 404 for unknown customer visits', async () => {
    const adminToken = tokenFor(userById(ids.admin));

    const invalidResponse = await request(app)
      .get('/api/v1/customers/not-valid/visits')
      .set('Authorization', `Bearer ${adminToken}`);
    const unknownResponse = await request(app)
      .get(`/api/v1/customers/${ids.customerUnknown}/visits`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body.message).toBe('Validation failed');
    expect(Array.isArray(invalidResponse.body.errors)).toBe(true);
    expect(unknownResponse.status).toBe(404);
    expect(unknownResponse.body).toEqual({
      success: false,
      message: 'Customer not found',
    });
  });

  it('supports manager salesRep filter, status filter, and customer search', async () => {
    const managerToken = tokenFor(userById(ids.manager));

    const salesRepResponse = await request(app)
      .get(`/api/v1/visits?salesRep=${ids.repTwo}`)
      .set('Authorization', `Bearer ${managerToken}`);
    const statusResponse = await request(app)
      .get(`/api/v1/visits?status=${VISIT_STATUSES.COMPLETED}`)
      .set('Authorization', `Bearer ${managerToken}`);
    const searchResponse = await request(app)
      .get('/api/v1/visits?search=Assigned')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(salesRepResponse.status).toBe(200);
    expect(salesRepResponse.body.data).toHaveLength(1);
    expect(referenceId(salesRepResponse.body.data[0].salesRep)).toBe(ids.repTwo);
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.data.every((visit) => visit.status === VISIT_STATUSES.COMPLETED)).toBe(true);
    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.data.length).toBeGreaterThan(0);
    expect(searchResponse.body.data.every((visit) => referenceId(visit.customer) === ids.customerAssigned)).toBe(true);
  });

  it('returns 400 validation errors for invalid visit id, sort field, and coordinates', async () => {
    const adminToken = tokenFor(userById(ids.admin));

    const invalidVisitResponse = await request(app)
      .get('/api/v1/visits/not-valid')
      .set('Authorization', `Bearer ${adminToken}`);
    const invalidSortResponse = await request(app)
      .get('/api/v1/visits?sortBy=name')
      .set('Authorization', `Bearer ${adminToken}`);
    const invalidCoordinateResponse = await request(app)
      .patch(`/api/v1/visits/${ids.plannedVisit}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        location: {
          latitude: 200,
          longitude: 36,
        },
      });

    expect(invalidVisitResponse.status).toBe(400);
    expect(invalidSortResponse.status).toBe(400);
    expect(invalidCoordinateResponse.status).toBe(400);
    expect(invalidVisitResponse.body.message).toBe('Validation failed');
    expect(invalidSortResponse.body.message).toBe('Validation failed');
    expect(invalidCoordinateResponse.body.message).toBe('Validation failed');
  });

  it('returns 404 for unknown visit id', async () => {
    const response = await request(app)
      .get('/api/v1/visits/69f000000000000000000099')
      .set('Authorization', `Bearer ${tokenFor(userById(ids.admin))}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Visit not found',
    });
  });
});
