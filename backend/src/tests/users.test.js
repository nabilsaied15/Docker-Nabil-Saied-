process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

jest.mock('../config/database');
jest.mock('../models/Log', () => ({ create: jest.fn().mockResolvedValue(undefined) }));

const request = require('supertest');
const app = require('../app');
const { __resetMockData, __getMockState } = require('../config/database');

const registerUser = async (email = 'user@test.com', password = 'password123') => {
  await request(app)
    .post('/api/auth/register')
    .send({ email, password });
};

const loginUser = async (email = 'user@test.com', password = 'password123') => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body;
};

describe('Users API', () => {
  beforeEach(() => {
    __resetMockData();
  });

  describe('Authenticated user actions', () => {
    it('should return the user profile', async () => {
      await registerUser();
      const { accessToken } = await loginUser();

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        email: 'user@test.com',
        role: 'user',
      });
    });

    it('should update user email and password', async () => {
      await registerUser();
      const { accessToken } = await loginUser();

      const updateRes = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: 'updated@test.com',
          currentPassword: 'password123',
          newPassword: 'newPassword456',
        });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body).toHaveProperty('message', 'Profil mis à jour avec succès');
      expect(updateRes.body.user.email).toBe('updated@test.com');

      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'updated@test.com',
          password: 'newPassword456',
        });

      expect(newLogin.statusCode).toBe(200);
      expect(newLogin.body).toHaveProperty('accessToken');
    });

    it('should reject profile update with missing changes', async () => {
      await registerUser();
      const { accessToken } = await loginUser();

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });

    it('should require current password when setting a new one', async () => {
      await registerUser();
      const { accessToken } = await loginUser();

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          newPassword: 'newPassword456',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Mot de passe actuel requis');
    });

    it('should reject password change with wrong current password', async () => {
      await registerUser();
      const { accessToken } = await loginUser();

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'wrong',
          newPassword: 'newPassword456',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Mot de passe actuel incorrect');
    });
  });

  describe('Admin actions', () => {
    const makeAdmin = async (email, password = 'password123') => {
      await registerUser(email, password);
      const state = __getMockState();
      const user = state.users.find((u) => u.email === email);
      user.role = 'admin';
      return loginUser(email, password);
    };

    it('should require admin role to list users', async () => {
      await registerUser();
      const { accessToken } = await loginUser();

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should list users with pagination for admins', async () => {
      const { accessToken } = await makeAdmin('admin@test.com');
      await registerUser('alpha@test.com');
      await registerUser('beta@test.com');

      const res = await request(app)
        .get('/api/users?limit=2&page=1')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body.users.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
      });
    });

    it('should prevent admin from deleting their own account', async () => {
      const { accessToken } = await makeAdmin('admin@test.com');
      const state = __getMockState();
      const adminUser = state.users.find((u) => u.email === 'admin@test.com');

      const res = await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Vous ne pouvez pas supprimer votre propre compte');
    });

    it('should delete another user', async () => {
      const { accessToken } = await makeAdmin('admin@test.com');
      await registerUser('to-delete@test.com');
      const state = __getMockState();
      const target = state.users.find((u) => u.email === 'to-delete@test.com');

      const res = await request(app)
        .delete(`/api/users/${target.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Utilisateur supprimé avec succès');
    });
  });
});

