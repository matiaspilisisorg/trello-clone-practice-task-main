import {
  request,
  createTestUser,
  createTestBoard,
  createTestList,
  createTestCard,
} from './setup.js';

describe('GET /api/boards', () => {
  test('returns only the authenticated user\'s boards', async () => {
    const userA = await createTestUser({ email: 'a@example.com' });
    const userB = await createTestUser({ email: 'b@example.com' });

    await createTestBoard(userA.token, { title: 'A Board 1' });
    await createTestBoard(userA.token, { title: 'A Board 2' });
    await createTestBoard(userB.token, { title: 'B Board 1' });

    const res = await request
      .get('/api/boards')
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((b) => b.ownerId === userA.user.id)).toBe(true);
  });

  test('returns empty array when user has no boards', async () => {
    const { token } = await createTestUser();

    const res = await request
      .get('/api/boards')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /api/boards', () => {
  test('creates a board with title', async () => {
    const { token } = await createTestUser();

    const res = await request
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My New Board' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('My New Board');
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('ownerId');
  });

  test('creates a board with title and color', async () => {
    const { token } = await createTestUser();

    const res = await request
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Colored Board', color: '#ff0000' });

    expect(res.status).toBe(201);
    expect(res.body.data.color).toBe('#ff0000');
  });

  test('validates title is required', async () => {
    const { token } = await createTestUser();

    const res = await request
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/boards/:id', () => {
  test('returns board with nested lists and cards', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id, 'To Do');
    await createTestCard(token, list.id, 'First task');

    const res = await request
      .get(`/api/boards/${board.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(board.id);
    expect(res.body.data.lists).toHaveLength(1);
    expect(res.body.data.lists[0].title).toBe('To Do');
    expect(res.body.data.lists[0].cards).toHaveLength(1);
    expect(res.body.data.lists[0].cards[0].title).toBe('First task');
  });

  test('returns 404 for unknown id', async () => {
    const { token } = await createTestUser();

    const res = await request
      .get('/api/boards/nonexistent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 403 for another user\'s board', async () => {
    const owner = await createTestUser({ email: 'owner@example.com' });
    const other = await createTestUser({ email: 'other@example.com' });

    const board = await createTestBoard(owner.token, { title: 'Private' });

    const res = await request
      .get(`/api/boards/${board.id}`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /api/boards/:id', () => {
  test('updates title and color', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);

    const res = await request
      .patch(`/api/boards/${board.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title', color: '#00ff00' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
    expect(res.body.data.color).toBe('#00ff00');
  });

  test('returns 404 for unknown board', async () => {
    const { token } = await createTestUser();

    const res = await request
      .patch('/api/boards/nonexistent-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
  });

  test('returns 403 when updating another user\'s board', async () => {
    const owner = await createTestUser({ email: 'owner@example.com' });
    const other = await createTestUser({ email: 'other@example.com' });
    const board = await createTestBoard(owner.token);

    const res = await request
      .patch(`/api/boards/${board.id}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ title: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/boards/:id', () => {
  test('deletes board and cascades', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);
    await createTestCard(token, list.id);

    const deleteRes = await request
      .delete(`/api/boards/${board.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    // Verify it no longer exists
    const getRes = await request
      .get(`/api/boards/${board.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });

  test('returns 404 for unknown board', async () => {
    const { token } = await createTestUser();

    const res = await request
      .delete('/api/boards/nonexistent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('returns 403 when deleting another user\'s board', async () => {
    const owner = await createTestUser({ email: 'owner@example.com' });
    const other = await createTestUser({ email: 'other@example.com' });
    const board = await createTestBoard(owner.token);

    const res = await request
      .delete(`/api/boards/${board.id}`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(res.status).toBe(403);
  });
});
