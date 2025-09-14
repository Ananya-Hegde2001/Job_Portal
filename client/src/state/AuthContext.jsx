import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../util/api.js';
import { showToast } from '../util/toast.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      api.setToken(token);
      api.get('/auth/me').then(r => setUser(r.user)).catch(() => logout());
    }
  }, [token]);

  function login(email, password) {
    return api.post('/auth/login', { email, password }).then(r => {
      setToken(r.token);
      localStorage.setItem('token', r.token);
      setUser(r.user);
      showToast('Logged in successfully','success');
    }).catch(e => { showToast(e.message,'error'); throw e; });
  }

  function register(data) {
    return api.post('/auth/register', data).then(r => {
      setToken(r.token);
      localStorage.setItem('token', r.token);
      setUser(r.user);
      showToast('Account created','success');
    }).catch(e => { showToast(e.message,'error'); throw e; });
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    showToast('Logged out');
  }

  return <AuthCtx.Provider value={{ user, token, login, register, logout, setUser }}>{children}</AuthCtx.Provider>;
}

export function useAuth() { return useContext(AuthCtx); }
