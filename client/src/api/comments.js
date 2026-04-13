import api from './axios.js';

export async function getComments(cardId, cursor) {
  const params = cursor ? { cursor } : {};
  const res = await api.get(`/cards/${cardId}/comments`, { params });
  return res.data; // { data: [...], meta: { hasMore } }
}

export async function addComment(cardId, { text }) {
  const res = await api.post(`/cards/${cardId}/comments`, { text });
  return res.data.data;
}

export async function deleteComment(cardId, commentId) {
  const res = await api.delete(`/cards/${cardId}/comments/${commentId}`);
  return res.data.data;
}

export async function updateComment(cardId, commentId, { text }) {
  const res = await api.patch(`/cards/${cardId}/comments/${commentId}`, { text });
  return res.data.data;
}
