/**
 * context/AuthContext.jsx
 * Global authentication state — wraps the whole app.
 *
 * Provides:
 *   user        — null | { id, name, email, blood_group }
 *   loading     — bool (initial fetch in progress)
 *   login(creds) → Promise  (calls /auth/login, refreshes user)
 *   signup(data) → Promise
 *   logout()
 *   refreshUser() → Promise
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthAPI, clearToken, getToken } from '../services/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);   // true while checking stored token

  // On mount: if a token exists, fetch the current user
  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    AuthAPI.me()
      .then(setUser)
      .catch(() => clearToken())   // expired / invalid token
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    await AuthAPI.login(credentials);
    const u = await AuthAPI.me();
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (data) => {
    await AuthAPI.signup(data);
    // Auto-login with the same credentials after account creation
    await AuthAPI.login({ email: data.email, password: data.password });
    const u = await AuthAPI.me();
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    AuthAPI.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await AuthAPI.me();
    setUser(u);
    return u;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — always call inside <AuthProvider> */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
