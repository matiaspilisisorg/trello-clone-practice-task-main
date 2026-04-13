import api from './axios.js';

export async function createList(boardId, data) {
  const res = await api.post(`/boards/${boardId}/lists`, data);
  return res.data.data;
}

export async function updateList(boardId, id, data) {
  const res = await api.patch(`/boards/${boardId}/lists/${id}`, data);
  return res.data.data;
}

export async function moveList(boardId, id, data) {
  const res = await api.patch(`/boards/${boardId}/lists/${id}/move`, data);
  return res.data.data;
}

export async function deleteList(boardId, id) {
  const res = await api.delete(`/boards/${boardId}/lists/${id}`);
  return res.data.data;
}
