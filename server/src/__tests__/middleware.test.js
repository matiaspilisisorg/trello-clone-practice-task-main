import jwt from 'jsonwebtoken';
import { request } from './setup.js';

describe('authenticate middleware', () => {
  test('rejects request with no Authorization header', async () => {
    const res = await request.get('/api/boards');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/token/i);
  });

  test('rejects request with malformed Authorization header (no Bearer prefix)', async () => {
    const res = await request
      .get('/api/boards')
      .set('Authorization', 'just-a-token');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('rejects request with empty Bearer token', async () => {
    const res = await request
      .get('/api/boards')
      .set('Authorization', 'Bearer ');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('rejects request with expired token', async () => {
    // Create a token that expired 1 hour ago
    const expiredToken = jwt.sign(
      { userId: 'some-user-id' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' }
    );

    const res = await request
      .get('/api/boards')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/invalid|expired/i);
  });

  test('rejects request with token signed by wrong secret', async () => {
    const badToken = jwt.sign(
      { userId: 'some-user-id' },
      'wrong-secret-key',
      { expiresIn: '15m' }
    );

    const res = await request
      .get('/api/boards')
      .set('Authorization', `Bearer ${badToken}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('rejects request with a completely invalid JWT string', async () => {
    const res = await request
      .get('/api/boards')
      .set('Authorization', 'Bearer not.a.valid.jwt');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
