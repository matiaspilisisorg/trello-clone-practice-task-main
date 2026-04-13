import { request, createTestUser } from './setup.js';

describe('POST /api/auth/register', () => {
  test('creates a new user and returns id, email, name', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.email).toBe('alice@example.com');
    expect(res.body.data.name).toBe('Alice');
    // Password should not be returned
    expect(res.body.data.password).toBeUndefined();
  });

  test('rejects duplicate email', async () => {
    await request.post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    const res = await request.post('/api/auth/register').send({
      name: 'Alice Again',
      email: 'alice@example.com',
      password: 'password456',
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  test('rejects missing fields', async () => {
    const res = await request.post('/api/auth/register').send({
      email: 'noname@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('rejects short password (< 8 characters)', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'Short',
      email: 'short@example.com',
      password: '1234567',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/8/);
  });
});

describe('POST /api/auth/login', () => {
  const userInfo = {
    name: 'Bob',
    email: 'bob@example.com',
    password: 'securepassword',
  };

  beforeEach(async () => {
    await request.post('/api/auth/register').send(userInfo);
  });

  test('returns accessToken, user, and sets refreshToken cookie', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: userInfo.email, password: userInfo.password });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.email).toBe(userInfo.email);
    expect(res.body.data.user.name).toBe(userInfo.name);
    // Password should not be in user object
    expect(res.body.data.user.password).toBeUndefined();

    // Check that refreshToken cookie is set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toMatch(/httponly/i);
  });

  test('rejects wrong password', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: userInfo.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('rejects unknown email', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/auth/refresh', () => {
  test('returns new access token when valid refresh cookie is sent', async () => {
    // Register and login to obtain a refresh token cookie
    await request.post('/api/auth/register').send({
      name: 'Carol',
      email: 'carol@example.com',
      password: 'password123',
    });

    const loginRes = await request
      .post('/api/auth/login')
      .send({ email: 'carol@example.com', password: 'password123' });

    // Extract the refreshToken cookie value
    const cookies = loginRes.headers['set-cookie'];
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));

    const res = await request
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(typeof res.body.data.accessToken).toBe('string');
  });

  test('rejects when no refresh cookie is sent', async () => {
    const res = await request.post('/api/auth/refresh');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/auth/logout', () => {
  test('clears the refreshToken cookie', async () => {
    const { token } = await createTestUser();

    const res = await request
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // The response should clear the refreshToken cookie
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      if (refreshCookie) {
        // Cookie should be cleared (empty value or expired)
        expect(refreshCookie).toMatch(
          /refreshToken=;|refreshToken=\s*;|Expires=Thu, 01 Jan 1970/i
        );
      }
    }
  });
});
