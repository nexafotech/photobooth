import { useState, useEffect } from 'react';
import api from '../lib/axios';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    setUser(response.data);
    return response.data;
  };

  const logout = async () => {
    await api.post('/api/auth/logout');
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout
  };
}
