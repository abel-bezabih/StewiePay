import { useState } from 'react';
import { AuthAPI, setTokens, clearTokens } from '../api/client';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await AuthAPI.login(email, password);
      // Backend returns { user, token, refreshToken }
      const token = resp.data.token || resp.data.accessToken;
      const refresh = resp.data.refreshToken;
      if (token && refresh) {
        setTokens(token, refresh);
        setUser(resp.data.user);
        return true;
      }
      throw new Error('Invalid response format');
    } catch (e: any) {
      let msg = 'Login failed';
      if (e?.code === 'ECONNREFUSED' || e?.message?.includes('Network')) {
        msg = 'Cannot connect to server. Is backend running on http://localhost:3000?';
      } else if (e?.response?.data?.message) {
        // Backend now always returns string message
        msg = String(e.response.data.message);
      } else if (e?.message) {
        msg = typeof e.message === 'string' ? e.message : String(e.message);
      }
      setError(msg);
      clearTokens();
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await AuthAPI.signup({ name, email, password });
      // Backend may return immediate tokens OR email verification required.
      if (resp.data?.requiresEmailVerification) {
        clearTokens();
        setUser(null);
        return true;
      }
      // Backend returns { user, token, refreshToken }
      const token = resp.data.token || resp.data.accessToken;
      const refresh = resp.data.refreshToken;
      if (token && refresh) {
        setTokens(token, refresh);
        setUser(resp.data.user);
        return true;
      }
      throw new Error('Invalid response format');
    } catch (e: any) {
      let msg = 'Signup failed';
      if (e?.code === 'ECONNREFUSED' || e?.message?.includes('Network')) {
        msg = 'Cannot connect to server. Is backend running on http://localhost:3000?';
      } else if (e?.response?.data?.message) {
        // Backend now always returns string message
        msg = String(e.response.data.message);
      } else if (e?.message) {
        msg = typeof e.message === 'string' ? e.message : String(e.message);
      }
      setError(msg);
      clearTokens();
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthAPI.logout();
    } catch {
      // ignore
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  return { user, loading, error, login, signup, logout };
};






