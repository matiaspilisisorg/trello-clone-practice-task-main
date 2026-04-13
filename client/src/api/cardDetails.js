import api from './axios.js';

export async function getCard(cardId) {
  const res = await api.get(`/cards/${cardId}`);
  return res.data.data;
}

export async function addLabel(cardId, data) {
  const res = await api.post(`/cards/${cardId}/labels`, data);
  return res.data.data;
}

export async function deleteLabel(cardId, labelId) {
  const res = await api.delete(`/cards/${cardId}/labels/${labelId}`);
  return res.data.data;
}

export async function addChecklist(cardId, data) {
  const res = await api.post(`/cards/${cardId}/checklists`, data);
  return res.data.data;
}

export async function deleteChecklist(cardId, checklistId) {
  const res = await api.delete(`/cards/${cardId}/checklists/${checklistId}`);
  return res.data.data;
}

export async function addChecklistItem(cardId, checklistId, data) {
  const res = await api.post(`/cards/${cardId}/checklists/${checklistId}/items`, data);
  return res.data.data;
}

export async function toggleChecklistItem(cardId, checklistId, itemId) {
  const res = await api.patch(`/cards/${cardId}/checklists/${checklistId}/items/${itemId}`);
  return res.data.data;
}

export async function deleteChecklistItem(cardId, checklistId, itemId) {
  const res = await api.delete(`/cards/${cardId}/checklists/${checklistId}/items/${itemId}`);
  return res.data.data;
}
