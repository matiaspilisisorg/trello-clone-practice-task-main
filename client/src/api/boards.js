import api from './axios.js';

export async function getBoards() {
  const res = await api.get('/boards');
  return res.data.data;
}

export async function createBoard(data) {
  const res = await api.post('/boards', data);
  return res.data.data;
}

export async function getBoard(id) {
  const res = await api.get(`/boards/${id}`);
  return res.data.data;
}

export async function updateBoard(id, data) {
  const res = await api.patch(`/boards/${id}`, data);
  return res.data.data;
}

export async function deleteBoard(id) {
  const res = await api.delete(`/boards/${id}`);
  return res.data.data;
}
