const request = require('supertest');
const app = require('../src/app');

describe('health route', () => {
  it('returns success true for GET /api/v1/health', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('IntelliSales backend is healthy');
    expect(response.body.data.status).toBe('ok');
  });

  it('returns database health JSON for GET /api/v1/health/db', async () => {
    const response = await request(app).get('/api/v1/health/db');

    expect([200, 503]).toContain(response.status);
    expect(response.body).toEqual({
      success: response.status === 200,
      message: response.status === 200
        ? 'Database connection is healthy'
        : 'Database connection is not healthy',
      data: {
        database: response.status === 200 ? 'connected' : 'disconnected',
        readyState: expect.any(Number),
      },
    });
  });

  it('returns 404 in standard error format for an unknown route', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Route not found: /api/v1/does-not-exist',
    });
  });
});
