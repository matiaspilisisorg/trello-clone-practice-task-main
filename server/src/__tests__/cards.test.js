import {
  request,
  createTestUser,
  createTestBoard,
  createTestList,
  createTestCard,
} from './setup.js';

describe('POST /api/lists/:listId/cards', () => {
  test('creates a card with auto-positioned value', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);

    const res = await request
      .post(`/api/lists/${list.id}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Card' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('My Card');
    expect(res.body.data.position).toBe(1);
    expect(res.body.data.listId).toBe(list.id);
  });

  test('auto-increments position for subsequent cards', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);

    await createTestCard(token, list.id, 'First');

    const res = await request
      .post(`/api/lists/${list.id}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Second' });

    expect(res.status).toBe(201);
    expect(res.body.data.position).toBe(2);
  });

  test('validates title is required', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);

    const res = await request
      .post(`/api/lists/${list.id}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /api/lists/:listId/cards/:id', () => {
  test('updates card title', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);
    const card = await createTestCard(token, list.id, 'Old Title');

    const res = await request
      .patch(`/api/lists/${list.id}/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('New Title');
  });

  test('updates card description', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);
    const card = await createTestCard(token, list.id);

    const res = await request
      .patch(`/api/lists/${list.id}/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'A detailed description' });

    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('A detailed description');
  });

  test('updates card dueDate', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);
    const card = await createTestCard(token, list.id);

    const dueDate = '2026-12-31T00:00:00.000Z';

    const res = await request
      .patch(`/api/lists/${list.id}/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dueDate });

    expect(res.status).toBe(200);
    expect(res.body.data.dueDate).toBe(dueDate);
  });

  test('clears dueDate by sending null', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);
    const card = await createTestCard(token, list.id);

    // Set a due date first
    await request
      .patch(`/api/lists/${list.id}/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dueDate: '2026-12-31T00:00:00.000Z' });

    // Clear it
    const res = await request
      .patch(`/api/lists/${list.id}/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dueDate: null });

    expect(res.status).toBe(200);
    expect(res.body.data.dueDate).toBeNull();
  });

  test('moves card to a different list', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const listA = await createTestList(token, board.id, 'List A');
    const listB = await createTestList(token, board.id, 'List B');
    const card = await createTestCard(token, listA.id, 'Movable Card');

    const res = await request
      .patch(`/api/lists/${listA.id}/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ listId: listB.id, position: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.listId).toBe(listB.id);
  });
});

describe('DELETE /api/lists/:listId/cards/:id', () => {
  test('deletes a card', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);
    const card = await createTestCard(token, list.id, 'To Delete');

    const res = await request
      .delete(`/api/lists/${list.id}/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Verify the card no longer shows up in the board
    const boardRes = await request
      .get(`/api/boards/${board.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(boardRes.body.data.lists[0].cards).toHaveLength(0);
  });
});

describe('GET /api/cards/:cardId (card details)', () => {
  test('returns full card with labels and checklists', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);
    const card = await createTestCard(token, list.id, 'Detailed Card');

    const res = await request
      .get(`/api/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(card.id);
    expect(res.body.data.title).toBe('Detailed Card');
    expect(res.body.data).toHaveProperty('labels');
    expect(res.body.data).toHaveProperty('checklists');
  });

  test('returns 404 for unknown card id', async () => {
    const { token } = await createTestUser();

    const res = await request
      .get('/api/cards/nonexistent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('Labels on /api/cards/:cardId/labels', () => {
  test('POST creates a label on a card', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);
    const card = await createTestCard(token, list.id);

    const res = await request
      .post(`/api/cards/${card.id}/labels`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Urgent', color: '#ff0000' });

    expect(res.status).toBe(201);
    expect(res.body.data.text).toBe('Urgent');
    expect(res.body.data.color).toBe('#ff0000');
    expect(res.body.data.cardId).toBe(card.id);
  });

  test('POST validates text and color are required', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);
    const card = await createTestCard(token, list.id);

    const res = await request
      .post(`/api/cards/${card.id}/labels`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('DELETE removes a label', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);
    const card = await createTestCard(token, list.id);

    const labelRes = await request
      .post(`/api/cards/${card.id}/labels`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Bug', color: '#ee0000' });

    const labelId = labelRes.body.data.id;

    const res = await request
      .delete(`/api/cards/${card.id}/labels/${labelId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Verify the label is gone
    const cardRes = await request
      .get(`/api/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(cardRes.body.data.labels).toHaveLength(0);
  });
});

describe('Checklists on /api/cards/:cardId/checklists', () => {
  test('POST creates a checklist', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);
    const card = await createTestCard(token, list.id);

    const res = await request
      .post(`/api/cards/${card.id}/checklists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Sub-tasks' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Sub-tasks');
    expect(res.body.data.cardId).toBe(card.id);
  });

  test('POST validates title is required', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);
    const card = await createTestCard(token, list.id);

    const res = await request
      .post(`/api/cards/${card.id}/checklists`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('DELETE removes a checklist', async () => {
    const { token } = await createTestUser();
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);
    const card = await createTestCard(token, list.id);

    const clRes = await request
      .post(`/api/cards/${card.id}/checklists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Remove' });

    const checklistId = clRes.body.data.id;

    const res = await request
      .delete(`/api/cards/${card.id}/checklists/${checklistId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Verify the checklist is gone
    const cardRes = await request
      .get(`/api/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(cardRes.body.data.checklists).toHaveLength(0);
  });
});

describe('Checklist Items on /api/cards/:cardId/checklists/:checklistId/items', () => {
  let token, card, checklistId;

  beforeEach(async () => {
    const user = await createTestUser();
    token = user.token;
    const board = await createTestBoard(token);
    const list = await createTestList(token, board.id);
    card = await createTestCard(token, list.id);

    const clRes = await request
      .post(`/api/cards/${card.id}/checklists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Checklist' });

    checklistId = clRes.body.data.id;
  });

  test('POST creates a checklist item', async () => {
    const res = await request
      .post(`/api/cards/${card.id}/checklists/${checklistId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Step 1' });

    expect(res.status).toBe(201);
    expect(res.body.data.text).toBe('Step 1');
    expect(res.body.data.checked).toBe(false);
    expect(res.body.data.checklistId).toBe(checklistId);
  });

  test('POST validates text is required', async () => {
    const res = await request
      .post(`/api/cards/${card.id}/checklists/${checklistId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('PATCH toggles checked state', async () => {
    const createRes = await request
      .post(`/api/cards/${card.id}/checklists/${checklistId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Toggle me' });

    const itemId = createRes.body.data.id;

    // Toggle to checked
    const toggleRes = await request
      .patch(`/api/cards/${card.id}/checklists/${checklistId}/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ checked: true });

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.data.checked).toBe(true);

    // Toggle back to unchecked
    const untoggleRes = await request
      .patch(`/api/cards/${card.id}/checklists/${checklistId}/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ checked: false });

    expect(untoggleRes.status).toBe(200);
    expect(untoggleRes.body.data.checked).toBe(false);
  });

  test('DELETE removes a checklist item', async () => {
    const createRes = await request
      .post(`/api/cards/${card.id}/checklists/${checklistId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'To remove' });

    const itemId = createRes.body.data.id;

    const res = await request
      .delete(`/api/cards/${card.id}/checklists/${checklistId}/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Verify the item is gone
    const cardRes = await request
      .get(`/api/cards/${card.id}`)
      .set('Authorization', `Bearer ${token}`);

    const checklist = cardRes.body.data.checklists.find(
      (cl) => cl.id === checklistId
    );
    expect(checklist.items).toHaveLength(0);
  });
});
