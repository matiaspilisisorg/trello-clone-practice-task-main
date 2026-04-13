import { createContext, useState, useEffect } from 'react';
import * as authApi from '../api/auth.js';
import { setAccessToken } from '../api/axios.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function tryRefresh() {
      try {
        const res = await authApi.refreshToken();
        const payload = res.data.data;
        setAccessToken(payload.accessToken);
        setUser(payload.user);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    tryRefresh();
  }, []);

  async function login(email, password) {
    const res = await authApi.login(email, password);
    const payload = res.data.data;
    setAccessToken(payload.accessToken);
    setUser(payload.user);
  }

  async function register(name, email, password) {
    await authApi.register(name, email, password);
    await login(email, password);
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    }
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
