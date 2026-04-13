import supertest from 'supertest';
import app from '../index.js';
import prisma from '../prisma/client.js';

export const request = supertest(app);

/**
 * Creates a test user via the register endpoint and logs them in
 * to obtain an access token.
 *
 * @param {object} overrides - optional field overrides for name, email, password
 * @returns {{ user: object, token: string }}
 */
export async function createTestUser(overrides = {}) {
  const name = overrides.name || 'Test User';
  const email = overrides.email || `test-${Date.now()}@example.com`;
  const password = overrides.password || 'password123';

  await request.post('/api/auth/register').send({ name, email, password });

  const loginRes = await request
    .post('/api/auth/login')
    .send({ email, password });

  return {
    user: loginRes.body.data.user,
    token: loginRes.body.data.accessToken,
  };
}

/**
 * Creates a board for the given authenticated user.
 *
 * @param {string} token - JWT access token
 * @param {object} overrides - optional overrides for title, color
 * @returns {object} the created board
 */
export async function createTestBoard(token, overrides = {}) {
  const res = await request
    .post('/api/boards')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: overrides.title || 'Test Board', color: overrides.color });

  return res.body.data;
}

/**
 * Creates a list inside a board.
 *
 * @param {string} token - JWT access token
 * @param {string} boardId - board id
 * @param {string} title - list title
 * @returns {object} the created list
 */
export async function createTestList(token, boardId, title = 'Test List') {
  const res = await request
    .post(`/api/boards/${boardId}/lists`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title });

  return res.body.data;
}

/**
 * Creates a card inside a list.
 *
 * @param {string} token - JWT access token
 * @param {string} listId - list id
 * @param {string} title - card title
 * @returns {object} the created card
 */
export async function createTestCard(token, listId, title = 'Test Card') {
  const res = await request
    .post(`/api/lists/${listId}/cards`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title });

  return res.body.data;
}

/**
 * Truncate all tables in the correct order to respect foreign key constraints.
 */
async function cleanDatabase() {
  await prisma.checklistItem.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.label.deleteMany();
  await prisma.card.deleteMany();
  await prisma.list.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();
}

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
