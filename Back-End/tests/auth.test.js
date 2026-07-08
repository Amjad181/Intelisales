const bcrypt = require('bcryptjs');
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
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
  USER_ROLES: mockUserRoles,
  USER_STATUSES: mockUserStatuses,
}));

const app = require('../src/app');
const { User, USER_ROLES, USER_STATUSES } = require('../src/models/User');

let users;

const serializeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

const createMockUser = async ({
  id,
  name,
  email,
  password = 'Password123!',
  role,
  status = USER_STATUSES.ACTIVE,
  refreshTokenVersion = 0,
}) => {
  const passwordHash = await bcrypt.hash(password, 10);

  return {
    id,
    _id: {
      toString: () => id,
    },
    name,
    email,
    password: passwordHash,
    role,
    status,
    refreshTokenVersion,
    comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    },
    toJSON() {
      return serializeUser(this);
    },
  };
};

const configureUserMocks = () => {
  User.findOne.mockImplementation((query) => ({
    select: jest.fn(async () => users.find((user) => user.email === query.email) || null),
  }));

  User.findById.mockImplementation(async (id) => (
    users.find((user) => user.id === id) || null
  ));

  User.findByIdAndUpdate.mockImplementation(async (id, update) => {
    const user = users.find((candidate) => candidate.id === id);

    if (!user) {
      return null;
    }

    if (update.$inc && update.$inc.refreshTokenVersion) {
      user.refreshTokenVersion += update.$inc.refreshTokenVersion;
    }

    return user;
  });
};

const expectSafeAuthUser = (user) => {
  expect(user).not.toHaveProperty('password');
  expect(user).not.toHaveProperty('refreshTokenVersion');
  expect(user).not.toHaveProperty('__v');
  expect(user).not.toHaveProperty('_id');
};

beforeEach(async () => {
  users = [
    await createMockUser({
      id: '64f000000000000000000001',
      name: 'Company Admin',
      email: 'admin@intellisales.com',
      role: USER_ROLES.COMPANY_ADMIN,
    }),
    await createMockUser({
      id: '64f000000000000000000002',
      name: 'Sales Representative',
      email: 'rep@intellisales.com',
      role: USER_ROLES.SALES_REPRESENTATIVE,
    }),
    await createMockUser({
      id: '64f000000000000000000003',
      name: 'Inactive User',
      email: 'inactive@intellisales.com',
      role: USER_ROLES.ACCOUNTANT,
      status: USER_STATUSES.INACTIVE,
    }),
  ];

  jest.clearAllMocks();
  configureUserMocks();
});

describe('auth module', () => {
  it('logs in with seeded admin credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@intellisales.com',
        password: 'Password123!',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Login successful',
      data: {
        user: expect.objectContaining({
          id: '64f000000000000000000001',
          name: 'Company Admin',
          email: 'admin@intellisales.com',
          role: USER_ROLES.COMPANY_ADMIN,
          status: USER_STATUSES.ACTIVE,
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      },
    });
    expectSafeAuthUser(response.body.data.user);
  });

  it('fails login with missing email or password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@intellisales.com',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: 'password',
      }),
    ]));
  });

  it('fails login with wrong password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@intellisales.com',
        password: 'WrongPassword',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Invalid email or password',
    });
  });

  it('fails login for inactive user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'inactive@intellisales.com',
        password: 'Password123!',
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: 'User account is inactive',
    });
  });

  it('does not include password in login response', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@intellisales.com',
        password: 'Password123!',
      });

    expect(response.status).toBe(200);
    expectSafeAuthUser(response.body.data.user);
  });

  it('uses access token to get current user', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@intellisales.com',
        password: 'Password123!',
      });

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual(expect.objectContaining({
      email: 'admin@intellisales.com',
      role: USER_ROLES.COMPANY_ADMIN,
    }));
    expectSafeAuthUser(response.body.data.user);
  });

  it('returns 401 for protected route without token', async () => {
    const response = await request(app).get('/api/v1/auth/protected-test');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Authentication required',
    });
  });

  it('returns 200 for protected route with valid token', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@intellisales.com',
        password: 'Password123!',
      });

    const response = await request(app)
      .get('/api/v1/auth/protected-test')
      .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Protected route access granted');
    expectSafeAuthUser(response.body.data.user);
  });

  it('returns 200 for admin-only route with admin token', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@intellisales.com',
        password: 'Password123!',
      });

    const response = await request(app)
      .get('/api/v1/auth/admin-test')
      .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Admin route access granted');
    expectSafeAuthUser(response.body.data.user);
  });

  it('returns 403 for admin-only route with sales representative token', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'rep@intellisales.com',
        password: 'Password123!',
      });

    const response = await request(app)
      .get('/api/v1/auth/admin-test')
      .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: 'Forbidden',
    });
  });

  it('refreshes tokens with a valid refresh token', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@intellisales.com',
        password: 'Password123!',
      });

    const response = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({
        refreshToken: loginResponse.body.data.refreshToken,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: expect.objectContaining({
          id: '64f000000000000000000001',
          name: 'Company Admin',
          email: 'admin@intellisales.com',
          role: USER_ROLES.COMPANY_ADMIN,
          status: USER_STATUSES.ACTIVE,
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      },
    });
    expectSafeAuthUser(response.body.data.user);
  });

  it('logs out and invalidates the previous refresh token version', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@intellisales.com',
        password: 'Password123!',
      });

    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body).toEqual({
      success: true,
      message: 'Logout successful',
      data: null,
    });

    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({
        refreshToken: loginResponse.body.data.refreshToken,
      });

    expect(refreshResponse.status).toBe(401);
  });
});
