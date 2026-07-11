const request = require('supertest');
const app = require('./testApp');
const { connectTestDb, closeTestDb, clearTestDb } = require('./setup');

beforeAll(async () => { await connectTestDb(); });
afterAll(async () => { await closeTestDb(); });
afterEach(async () => { await clearTestDb(); });

describe('POST /api/auth/register', () => {
  test('successfully registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('rejects registration with a duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'First User',
      email: 'duplicate@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Second User',
      email: 'duplicate@example.com',
      password: 'differentpassword',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User already exists');
  });

  test('defaults to patient role when no role is specified', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Default Role User',
      email: 'defaultrole@example.com',
      password: 'password123',
    });

    expect(res.body.user.role).toBe('patient');
  });
});

describe('POST /api/auth/login', () => {
  const testUser = {
    name: 'Login Test User',
    email: 'logintest@example.com',
    password: 'correctpassword123',
  };

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(testUser);
  });

  test('successfully logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'wrongpassword',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });

  test('rejects login with an email that does not exist', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'doesnotexist@example.com',
      password: 'anypassword',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });
});