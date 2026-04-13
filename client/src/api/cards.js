import api from './axios.js';

export async function createCard(listId, data) {
  const res = await api.post(`/lists/${listId}/cards`, data);
  return res.data.data;
}

export async function updateCard(listId, id, data) {
  const res = await api.patch(`/lists/${listId}/cards/${id}`, data);
  return res.data.data;
}

export async function deleteCard(listId, id) {
  const res = await api.delete(`/lists/${listId}/cards/${id}`);
  return res.data.data;
}
