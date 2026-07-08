const bcrypt = require('bcryptjs');
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

jest.mock('../src/models/User', () => ({
  User: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
  },
  USER_ROLES: mockUserRoles,
  USER_STATUSES: mockUserStatuses,
}));

const app = require('../src/app');
const { env } = require('../src/config/env');
const { User, USER_ROLES, USER_STATUSES } = require('../src/models/User');

const ids = {
  admin: '64f000000000000000000001',
  rep: '64f000000000000000000002',
  manager: '64f000000000000000000003',
  accountant: '64f000000000000000000004',
  created: '64f000000000000000000005',
  unknown: '64f000000000000000000099',
};

let users;

const toObjectId = (id) => ({ toString: () => id });

const formatSafe = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const makeUser = async ({
  id,
  name,
  email,
  password = 'Password123!',
  role,
  status = USER_STATUSES.ACTIVE,
  refreshTokenVersion = 0,
}) => {
  const user = {
    id,
    _id: toObjectId(id),
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role,
    status,
    refreshTokenVersion,
    __v: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    },
    toJSON() {
      return formatSafe(this);
    },
    isModified(field) {
      return field === 'password';
    },
    async save() {
      if (this.password && !this.password.startsWith('$2')) {
        this.password = await bcrypt.hash(this.password, 10);
      }

      this.updatedAt = new Date('2026-01-02T00:00:00.000Z');
      return this;
    },
  };

  return user;
};

const tokenFor = (user) => jwt.sign(
  {
    sub: user.id,
    role: user.role,
  },
  env.jwtAccessSecret,
  { expiresIn: '15m' },
);

const makeQuery = (result) => {
  const query = {
    select: jest.fn(() => query),
    sort: jest.fn(() => query),
    skip: jest.fn(() => query),
    limit: jest.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };

  return query;
};

const applyFilters = (filters = {}) => users.filter((user) => {
  if (filters.email && user.email !== filters.email) {
    return false;
  }

  if (filters._id && filters._id.$ne && user.id === filters._id.$ne) {
    return false;
  }

  if (filters.role && user.role !== filters.role) {
    return false;
  }

  if (filters.status && user.status !== filters.status) {
    return false;
  }

  if (filters.$or) {
    return filters.$or.some((condition) => Object.entries(condition).some(([field, regex]) => (
      regex.test(user[field])
    )));
  }

  return true;
});

const configureUserMocks = () => {
  User.findById.mockImplementation((id) => makeQuery(users.find((user) => user.id === id) || null));
  User.findOne.mockImplementation((filters) => makeQuery(applyFilters(filters)[0] || null));
  User.countDocuments.mockImplementation(async (filters) => applyFilters(filters).length);
  User.find.mockImplementation((filters) => {
    const result = applyFilters(filters);
    const query = {
      select: jest.fn(() => query),
      sort: jest.fn((sort) => {
        const [field, direction] = Object.entries(sort)[0];
        result.sort((a, b) => String(a[field]).localeCompare(String(b[field])) * direction);
        return query;
      }),
      skip: jest.fn((skip) => {
        query.skipValue = skip;
        return query;
      }),
      limit: jest.fn((limit) => Promise.resolve(result.slice(query.skipValue || 0, (query.skipValue || 0) + limit))),
      skipValue: 0,
    };

    return query;
  });
  User.create.mockImplementation(async (payload) => {
    const user = await makeUser({
      id: ids.created,
      ...payload,
    });
    users.push(user);
    return user;
  });
};

beforeEach(async () => {
  users = [
    await makeUser({
      id: ids.admin,
      name: 'Company Admin',
      email: 'admin@intellisales.com',
      role: USER_ROLES.COMPANY_ADMIN,
    }),
    await makeUser({
      id: ids.rep,
      name: 'Sales Representative',
      email: 'rep@intellisales.com',
      role: USER_ROLES.SALES_REPRESENTATIVE,
    }),
    await makeUser({
      id: ids.manager,
      name: 'Sales Manager',
      email: 'manager@intellisales.com',
      role: USER_ROLES.SALES_MANAGER,
    }),
    await makeUser({
      id: ids.accountant,
      name: 'Accountant',
      email: 'accountant@intellisales.com',
      role: USER_ROLES.ACCOUNTANT,
      status: USER_STATUSES.INACTIVE,
    }),
  ];

  jest.clearAllMocks();
  configureUserMocks();
});

describe('admin users management', () => {
  it('returns 401 without token', async () => {
    const response = await request(app).get('/api/v1/users');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  it('returns 403 with sales representative token', async () => {
    const response = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${tokenFor(users[1])}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Forbidden');
  });

  it('lets admin list users with pagination metadata and safe user objects', async () => {
    const response = await request(app)
      .get('/api/v1/users?page=1&limit=2')
      .set('Authorization', `Bearer ${tokenFor(users[0])}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Users fetched successfully');
    expect(response.body.count).toBe(2);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 4,
      pages: 2,
    });
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data[0]).not.toHaveProperty('password');
    expect(response.body.data[0]).not.toHaveProperty('refreshTokenVersion');
    expect(response.body.data[0]).not.toHaveProperty('__v');
  });

  it('searches users by name or email', async () => {
    const response = await request(app)
      .get('/api/v1/users?search=manager')
      .set('Authorization', `Bearer ${tokenFor(users[0])}`);

    expect(response.status).toBe(200);
    expect(response.body.pagination.total).toBe(1);
    expect(response.body.data[0].email).toBe('manager@intellisales.com');
  });

  it('filters users by role', async () => {
    const response = await request(app)
      .get('/api/v1/users?role=SALES_REPRESENTATIVE')
      .set('Authorization', `Bearer ${tokenFor(users[0])}`);

    expect(response.status).toBe(200);
    expect(response.body.pagination.total).toBe(1);
    expect(response.body.data[0].role).toBe(USER_ROLES.SALES_REPRESENTATIVE);
  });

  it('filters users by status', async () => {
    const response = await request(app)
      .get('/api/v1/users?status=INACTIVE')
      .set('Authorization', `Bearer ${tokenFor(users[0])}`);

    expect(response.status).toBe(200);
    expect(response.body.pagination.total).toBe(1);
    expect(response.body.data[0].status).toBe(USER_STATUSES.INACTIVE);
  });

  it('gets a user by valid id with safe fields', async () => {
    const response = await request(app)
      .get(`/api/v1/users/${ids.rep}`)
      .set('Authorization', `Bearer ${tokenFor(users[0])}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe('rep@intellisales.com');
    expect(response.body.data.user).not.toHaveProperty('password');
    expect(response.body.data.user).not.toHaveProperty('refreshTokenVersion');
    expect(response.body.data.user).not.toHaveProperty('__v');
  });

  it('returns 400 for invalid ObjectId', async () => {
    const response = await request(app)
      .get('/api/v1/users/not-an-id')
      .set('Authorization', `Bearer ${tokenFor(users[0])}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  it('returns 404 for unknown valid ObjectId', async () => {
    const response = await request(app)
      .get(`/api/v1/users/${ids.unknown}`)
      .set('Authorization', `Bearer ${tokenFor(users[0])}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });

  it('creates a user and hashes the password', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokenFor(users[0])}`)
      .send({
        name: 'New Accountant',
        email: 'new.accountant@intellisales.com',
        password: 'Password123!',
        role: USER_ROLES.ACCOUNTANT,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe('new.accountant@intellisales.com');
    expect(response.body.data.user).not.toHaveProperty('password');
    const createdUser = users.find((user) => user.email === 'new.accountant@intellisales.com');
    expect(createdUser.password).not.toBe('Password123!');
    await expect(bcrypt.compare('Password123!', createdUser.password)).resolves.toBe(true);
  });

  it('rejects duplicate email on create', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokenFor(users[0])}`)
      .send({
        name: 'Duplicate Rep',
        email: 'rep@intellisales.com',
        password: 'Password123!',
        role: USER_ROLES.SALES_REPRESENTATIVE,
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Email already exists');
  });

  it('rejects missing required fields and invalid role', async () => {
    const missingResponse = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokenFor(users[0])}`)
      .send({ email: 'missing@intellisales.com' });

    const invalidRoleResponse = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokenFor(users[0])}`)
      .send({
        name: 'Bad Role',
        email: 'bad.role@intellisales.com',
        password: 'Password123!',
        role: 'BAD_ROLE',
      });

    expect(missingResponse.status).toBe(400);
    expect(invalidRoleResponse.status).toBe(400);
  });

  it('prevents non-admin from creating a user', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokenFor(users[1])}`)
      .send({
        name: 'Blocked',
        email: 'blocked@intellisales.com',
        password: 'Password123!',
        role: USER_ROLES.ACCOUNTANT,
      });

    expect(response.status).toBe(403);
  });

  it('updates name, email, role, and status', async () => {
    const response = await request(app)
      .patch(`/api/v1/users/${ids.rep}`)
      .set('Authorization', `Bearer ${tokenFor(users[0])}`)
      .send({
        name: 'Updated Rep',
        email: 'updated.rep@intellisales.com',
        role: USER_ROLES.SALES_MANAGER,
        status: USER_STATUSES.ACTIVE,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual(expect.objectContaining({
      name: 'Updated Rep',
      email: 'updated.rep@intellisales.com',
      role: USER_ROLES.SALES_MANAGER,
    }));
  });

  it('rejects duplicate email update', async () => {
    const response = await request(app)
      .patch(`/api/v1/users/${ids.rep}`)
      .set('Authorization', `Bearer ${tokenFor(users[0])}`)
      .send({ email: 'manager@intellisales.com' });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Email already exists');
  });

  it('does not allow password change through normal update route', async () => {
    const response = await request(app)
      .patch(`/api/v1/users/${ids.rep}`)
      .set('Authorization', `Bearer ${tokenFor(users[0])}`)
      .send({ password: 'NewPassword123!' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  it('prevents admin from deactivating self or removing own admin role', async () => {
    const deactivateSelfResponse = await request(app)
      .patch(`/api/v1/users/${ids.admin}`)
      .set('Authorization', `Bearer ${tokenFor(users[0])}`)
      .send({ status: USER_STATUSES.INACTIVE });

    const removeRoleResponse = await request(app)
      .patch(`/api/v1/users/${ids.admin}`)
      .set('Authorization', `Bearer ${tokenFor(users[0])}`)
      .send({ role: USER_ROLES.SALES_MANAGER });

    expect(deactivateSelfResponse.status).toBe(400);
    expect(removeRoleResponse.status).toBe(400);
  });

  it('resets another user password and new password can log in', async () => {
    const response = await request(app)
      .patch(`/api/v1/users/${ids.rep}/password`)
      .set('Authorization', `Bearer ${tokenFor(users[0])}`)
      .send({ password: 'NewPassword123!' });

    expect(response.status).toBe(200);
    expect(response.body.data.user).not.toHaveProperty('password');

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'rep@intellisales.com',
        password: 'NewPassword123!',
      });

    expect(loginResponse.status).toBe(200);
  });

  it('soft deactivates another user without removing document', async () => {
    const response = await request(app)
      .delete(`/api/v1/users/${ids.rep}`)
      .set('Authorization', `Bearer ${tokenFor(users[0])}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.status).toBe(USER_STATUSES.INACTIVE);
    expect(users.find((user) => user.id === ids.rep)).toBeTruthy();
  });

  it('prevents admin from deactivating self using DELETE', async () => {
    const response = await request(app)
      .delete(`/api/v1/users/${ids.admin}`)
      .set('Authorization', `Bearer ${tokenFor(users[0])}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('You cannot deactivate your own account');
  });
});
