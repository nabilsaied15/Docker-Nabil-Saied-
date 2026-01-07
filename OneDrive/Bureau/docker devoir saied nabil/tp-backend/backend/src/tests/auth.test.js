process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

jest.mock('../config/database');
jest.mock('../models/Log', () => ({ create: jest.fn().mockResolvedValue(undefined) }));

const request = require('supertest');
const app = require('../app');
const { pgPool, __resetMockData } = require('../config/database');

describe('Auth API', () => {
  afterAll(async () => {
    await pgPool.end();
  });

  describe('POST /api/auth/register', () => {
    beforeEach(() => {
      __resetMockData();
    });

    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('test@test.com');
    });

    it('should not register user with existing email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'password123',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(400);
    });

    it('should validate input and reject invalid payload', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      __resetMockData();
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'password123',
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    beforeEach(async () => {
      __resetMockData();
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'password123',
        });
    });

    it('should issue a new access token with valid refresh token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123',
        });

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: loginRes.body.refreshToken,
        });

      expect(refreshRes.statusCode).toEqual(200);
      expect(refreshRes.body).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Refresh token invalide');
    });
  });
});