import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthAPI, setTokens, clearTokens, api } from '../api/client';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  pushToken?: string;
  notificationPreferences?: {
    transactions?: boolean;
    limits?: boolean;
    subscriptions?: boolean;
    cardStatus?: boolean;
    email?: boolean;
  };
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  const checkAuth = async () => {
    try {
      const resp = await AuthAPI.me();
      setUser(resp.data);
    } catch {
      setUser(null);
      clearTokens();
    } finally {
      setInitializing(false);
    }
  };

  const refreshUser = async () => {
    try {
      const resp = await AuthAPI.me();
      setUser(resp.data);
    } catch {
      // Silently fail - user might not be logged in
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await AuthAPI.login(email, password);
      // Backend returns { user, token, refreshToken }
      if (__DEV__) {
        console.log('Login response:', JSON.stringify(resp.data, null, 2));
      }
      const token = resp.data.token || resp.data.accessToken;
      const refresh = resp.data.refreshToken;
      if (token && refresh && resp.data.user) {
        setTokens(token, refresh);
        setUser(resp.data.user);
        if (__DEV__) {
          console.log('Login successful, user set:', resp.data.user.email);
        }
        return true;
      }
      throw new Error('Invalid response format - missing token, refreshToken, or user');
    } catch (e: any) {
      let msg = 'Login failed';
      if (e?.code === 'ECONNREFUSED' || e?.code === 'ECONNABORTED' || e?.message?.includes('Network') || e?.message?.includes('timeout')) {
        const apiBase = process.env.EXPO_PUBLIC_API_BASE || (Platform.OS === 'ios' && __DEV__ ? 'http://172.20.10.8:3000/api' : 'http://localhost:3000/api');
        msg = `Cannot connect to server. Is backend running at ${apiBase}? Check: 1) Backend is running, 2) Same WiFi network, 3) Mac firewall settings.`;
      } else if (e?.response?.data?.message) {
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
      // Backend returns { user, token, refreshToken }
      if (__DEV__) {
        console.log('Signup response:', JSON.stringify(resp.data, null, 2));
      }
      const token = resp.data.token || resp.data.accessToken;
      const refresh = resp.data.refreshToken;
      if (token && refresh && resp.data.user) {
        setTokens(token, refresh);
        setUser(resp.data.user);
        if (__DEV__) {
          console.log('Signup successful, user set:', resp.data.user.email);
        }
        return true;
      }
      throw new Error('Invalid response format - missing token, refreshToken, or user');
    } catch (e: any) {
      let msg = 'Signup failed';
      if (e?.code === 'ECONNREFUSED' || e?.code === 'ECONNABORTED' || e?.message?.includes('Network') || e?.message?.includes('timeout')) {
        const apiBase = process.env.EXPO_PUBLIC_API_BASE || (Platform.OS === 'ios' && __DEV__ ? 'http://172.20.10.8:3000/api' : 'http://localhost:3000/api');
        msg = `Cannot connect to server. Is backend running at ${apiBase}? Check: 1) Backend is running, 2) Same WiFi network, 3) Mac firewall settings.`;
      } else if (e?.response?.data?.message) {
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

  // Return null during initialization - splash screen will handle the display
  // This prevents any flash of content before auth state is determined

  return (
    <AuthContext.Provider value={{ user, loading, error, initializing, login, signup, logout, checkAuth, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

