import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../util/api.js';
import { showToast } from '../util/toast.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    api.setToken(token || null);
    if (token) {
      api.get('/auth/me')
        .then(r => { setUser(r.user); })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          api.setToken(null);
          setUser(null);
        })
        .finally(() => setInitializing(false));
    } else {
      setInitializing(false);
    }
  }, [token]);

  function login(email, password) {
    return api.post('/auth/login', { email, password }).then(r => {
      setToken(r.token);
      localStorage.setItem('token', r.token);
      api.setToken(r.token);
      setUser(r.user);
      showToast('Logged in successfully','success');
    }).catch(e => { showToast(e.message,'error'); throw e; });
  }

  function register(data) {
    return api.post('/auth/register', data).then(r => {
      setToken(r.token);
      localStorage.setItem('token', r.token);
      api.setToken(r.token);
      setUser(r.user);
      showToast('Account created','success');
    }).catch(e => { showToast(e.message,'error'); throw e; });
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    api.setToken(null);
    showToast('Logged out');
  }

  return <AuthCtx.Provider value={{ user, token, initializing, login, register, logout, setUser }}>{children}</AuthCtx.Provider>;
}

export function useAuth() { return useContext(AuthCtx); }
