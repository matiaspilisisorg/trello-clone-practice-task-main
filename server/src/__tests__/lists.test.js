import {
  request,
  createTestUser,
  createTestBoard,
  createTestList,
  createTestCard,
} from './setup.js';

describe('POST /api/boards/:boardId/lists', () => {
  test('creates a list with auto-positioned value', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);

    const res = await request
      .post(`/api/boards/${board.id}/lists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Do' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('To Do');
    expect(res.body.data.position).toBe(1);
    expect(res.body.data.boardId).toBe(board.id);
  });

  test('auto-increments position for subsequent lists', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);

    await createTestList(token, board.id, 'First');

    const res = await request
      .post(`/api/boards/${board.id}/lists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Second' });

    expect(res.status).toBe(201);
    expect(res.body.data.position).toBe(2);
  });

  test('validates title is required', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);

    const res = await request
      .post(`/api/boards/${board.id}/lists`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 404 for unknown board', async () => {
    const { token } = await createTestUser();

    const res = await request
      .post('/api/boards/nonexistent-id/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test' });

    expect(res.status).toBe(404);
  });

  test('returns 403 when creating list on another user\'s board', async () => {
    const owner = await createTestUser({ email: 'owner@example.com' });
    const other = await createTestUser({ email: 'other@example.com' });
    const board = await createTestBoard(owner.token);

    const res = await request
      .post(`/api/boards/${board.id}/lists`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ title: 'Intruder List' });

    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/boards/:boardId/lists/:id', () => {
  test('renames a list', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id, 'Old Name');

    const res = await request
      .patch(`/api/boards/${board.id}/lists/${list.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('New Name');
    expect(res.body.data.id).toBe(list.id);
  });

  test('validates title is required', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);

    const res = await request
      .patch(`/api/boards/${board.id}/lists/${list.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /api/boards/:boardId/lists/:id/move', () => {
  test('reorders a list by setting new position', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);

    const list1 = await createTestList(token, board.id, 'First');
    const list2 = await createTestList(token, board.id, 'Second');
    const list3 = await createTestList(token, board.id, 'Third');

    // Move list3 between list1 and list2
    const res = await request
      .patch(`/api/boards/${board.id}/lists/${list3.id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ position: 1.5 });

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(list3.id);
  });

  test('validates position is required', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);

    const res = await request
      .patch(`/api/boards/${board.id}/lists/${list.id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('DELETE /api/boards/:boardId/lists/:id', () => {
  test('deletes a list and cascades to cards', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id, 'To Delete');
    await createTestCard(token, list.id, 'Card in list');

    const deleteRes = await request
      .delete(`/api/boards/${board.id}/lists/${list.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    // Verify the board no longer has that list
    const boardRes = await request
      .get(`/api/boards/${board.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(boardRes.body.data.lists).toHaveLength(0);
  });
});
