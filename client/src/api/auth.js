import api from './axios.js';

export function register(name, email, password) {
  return api.post('/auth/register', { name, email, password });
}

export function login(email, password) {
  return api.post('/auth/login', { email, password });
}

export function logout() {
  return api.post('/auth/logout');
}

export function refreshToken() {
  return api.post('/auth/refresh');
}
