process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

jest.mock('../config/database');
jest.mock('../models/Log', () => ({ create: jest.fn().mockResolvedValue(undefined) }));

const request = require('supertest');
const app = require('../app');
const { __resetMockData } = require('../config/database');

const registerAndLogin = async (email = 'user@test.com', password = 'password123') => {
  await request(app)
    .post('/api/auth/register')
    .send({ email, password });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return loginRes.body;
};

describe('Activities API', () => {
  beforeEach(() => {
    __resetMockData();
  });

  it('should require authentication', async () => {
    const res = await request(app)
      .get('/api/activities');

    expect(res.statusCode).toBe(401);
  });

  it('should create a new activity', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'running',
        duration: 30,
        calories: 250,
        distance: 5,
        notes: 'Test run',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.type).toBe('running');
  });

  it('should validate activity payload', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'invalid-type',
        duration: 0,
      });

    expect(res.statusCode).toBe(400);
  });

  it('should list user activities', async () => {
    const { accessToken } = await registerAndLogin();

    await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'running',
        duration: 30,
        calories: 250,
        distance: 5,
      });

    const res = await request(app)
      .get('/api/activities')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('should retrieve a single activity', async () => {
    const { accessToken } = await registerAndLogin();

    const createRes = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'running',
        duration: 45,
        calories: 300,
        distance: 7,
      });

    const activityId = createRes.body.id;
    const res = await request(app)
      .get(`/api/activities/${activityId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(activityId);
  });

  it('should return 404 when activity does not exist', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .get('/api/activities/999')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Activité non trouvée');
  });

  it('should reject access to another user activity', async () => {
    const { accessToken } = await registerAndLogin('owner@test.com');

    const createRes = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'cycling',
        duration: 60,
        calories: 500,
      });

    const otherUser = await registerAndLogin('other@test.com');

    const res = await request(app)
      .get(`/api/activities/${createRes.body.id}`)
      .set('Authorization', `Bearer ${otherUser.accessToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message', 'Accès non autorisé');
  });

  it('should delete an activity', async () => {
    const { accessToken } = await registerAndLogin();

    const createRes = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'running',
        duration: 30,
      });

    const res = await request(app)
      .delete(`/api/activities/${createRes.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Activité supprimée avec succès');
  });

  it('should return 404 when deleting a non-existent activity', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .delete('/api/activities/999')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Activité non trouvée');
  });

  it('should reject deletion of another user activity', async () => {
    const owner = await registerAndLogin('owner@test.com');

    const createRes = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        type: 'cycling',
        duration: 60,
      });

    const other = await registerAndLogin('other@test.com');

    const res = await request(app)
      .delete(`/api/activities/${createRes.body.id}`)
      .set('Authorization', `Bearer ${other.accessToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('message', 'Accès non autorisé');
  });

  it('should return activity stats', async () => {
    const { accessToken } = await registerAndLogin();

    await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'running',
        duration: 30,
        calories: 200,
        distance: 5,
      });

    await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'cycling',
        duration: 60,
        calories: 500,
        distance: 20,
      });

    const res = await request(app)
      .get('/api/activities/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalActivities', 2);
    expect(res.body).toHaveProperty('totalDuration', 90);
    expect(res.body.activitiesByType.running).toHaveProperty('count', 1);
    expect(res.body.activitiesByType.cycling).toHaveProperty('count', 1);
  });
});

