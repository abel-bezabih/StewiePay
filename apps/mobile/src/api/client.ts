import axios from 'axios';
import { Platform } from 'react-native';

// Determine API base URL
// 
// PRODUCTION APPS (millions of users):
// - Use EXPO_PUBLIC_API_BASE environment variable
// - Set to your production API: https://api.stewiepay.com
// - No manual IP needed - uses domain name that works everywhere
// 
// DEVELOPMENT (local testing only):
// - For iOS Simulator: localhost works fine
// - For physical device on same network: needs Mac's IP address
// - This manual IP is ONLY for local dev - users never see this!
//
function getApiBase(): string {
  // ============================================
  // PRODUCTION: Use environment variable
  // ============================================
  // In production, set EXPO_PUBLIC_API_BASE=https://api.stewiepay.com
  // This works for ALL users worldwide - no manual IP needed!
  // Example setup:
  //   - Development: EXPO_PUBLIC_API_BASE=http://localhost:3000/api
  //   - Staging: EXPO_PUBLIC_API_BASE=https://api-staging.stewiepay.com
  //   - Production: EXPO_PUBLIC_API_BASE=https://api.stewiepay.com
  if (process.env.EXPO_PUBLIC_API_BASE) {
    return process.env.EXPO_PUBLIC_API_BASE;
  }

  // ============================================
  // DEVELOPMENT ONLY: Local IP for physical device
  // ============================================
  // This section is ONLY used during local development
  // When you deploy to production, users get the EXPO_PUBLIC_API_BASE URL above
  // Manual IP is ONLY needed when testing on your physical iPhone during development
  if (Platform.OS === 'ios' && __DEV__) {
    // ============================================
    // LOCAL DEVELOPMENT: Physical Device Testing
    // ============================================
    // This is ONLY for testing on your physical iPhone during development
    // Users in production never use this - they use EXPO_PUBLIC_API_BASE
    // 
    // Add your Mac's IP addresses here (for WiFi and Hotspot)
    // To find your Mac's IP: 
    //   1. Open Terminal
    //   2. Run: ifconfig | grep "inet " | grep -v 127.0.0.1
    //   3. Look for your WiFi or Hotspot IP (usually starts with 192.168.x.x or 172.20.x.x)
    //   4. Update the IPs below
    const possibleIPs = [
      // WiFi IP - Current network IP
      '172.20.10.8',  // Current Mac IP (from ifconfig - Personal Hotspot)
      
      // Previous IPs (fallback if network changes)
      '172.16.226.101',  // Previous WiFi IP
      
      // Add more IPs to try (will try in order)
      // '192.168.1.XXX',  // Alternative WiFi IP if needed
    ];
    
    // Try each IP in order
    for (const ip of possibleIPs) {
      if (ip) {
        return `http://${ip}:3000/api`;
      }
    }
  }

  // Default to localhost for simulator/web
  return 'http://localhost:3000/api';
}

const API_BASE = getApiBase();

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (token: string, refresh: string) => {
  accessToken = token;
  refreshToken = refresh;
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
};

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30_000 // Increased timeout for debugging
});

// Log API base for debugging
if (__DEV__) {
  console.log('API Base URL:', API_BASE);
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  // Log request for debugging
  if (__DEV__) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      timeout: config.timeout,
    });
  }
  return config;
});

let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

const processQueue = (token: string | null) => {
  queue.forEach((resolve) => resolve(token));
  queue = [];
};

api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API] Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    // Log error details for debugging (skip 401 errors on /auth/me as they're expected)
    if (__DEV__) {
      const isAuthMe = error.config?.url === '/auth/me';
      const is401 = error.response?.status === 401;
      
      // Don't log 401 on /auth/me - it's expected when not logged in
      if (isAuthMe && is401) {
        // Silently handle - this is normal when checking auth status
        return Promise.reject(error);
      }
      
      if (error.code === 'ECONNABORTED') {
        console.error('[API] Request timeout:', {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          timeout: error.config?.timeout,
        });
        console.error('[API] Troubleshooting timeout issues:');
        console.error('  1. Check backend is running: cd apps/backend && yarn start:dev');
        console.error('  2. Verify Mac IP address: ifconfig | grep "inet " | grep -v 127.0.0.1');
        console.error('  3. Update IP in apps/mobile/src/api/client.ts if it changed');
        console.error('  4. Ensure device and Mac are on same WiFi/Hotspot');
        console.error('  5. Test connectivity: curl http://YOUR_IP:3000/api/health');
        console.error('  6. Check Mac Firewall: System Settings > Network > Firewall');
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        // Network connectivity error - provide helpful troubleshooting
        console.error('[API] Network Error - Cannot connect to backend:', {
          attemptedURL: error.config?.baseURL,
          error: error.message,
          troubleshooting: [
            '1. Check backend is running: cd apps/backend && yarn start:dev',
            '2. Verify Mac IP address: ifconfig | grep "inet " | grep -v 127.0.0.1',
            '3. Update IP in apps/mobile/src/api/client.ts if it changed',
            '4. Ensure device and Mac are on same WiFi/Hotspot',
            '5. Check Mac Firewall: System Settings > Network > Firewall',
            '6. Try: Backend should listen on 0.0.0.0 (check apps/backend/src/main.ts)',
          ],
        });
      } else if (error.message && !isAuthMe) {
        console.error('[API] Request error:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
        });
      }
    }
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && refreshToken) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            } else {
              resolve(Promise.reject(error));
            }
          });
        });
      }
      isRefreshing = true;
      try {
        const resp = await api.post('/auth/refresh', { refreshToken });
        const { accessToken: token, refreshToken: newRefresh } = resp.data;
        setTokens(token, newRefresh);
        processQueue(token);
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (e) {
        processQueue(null);
        clearTokens();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const AuthAPI = {
  login(email: string, password: string) {
    return api.post('/auth/login', { email, password });
  },
  signup(payload: { name: string; email: string; password: string; phone?: string }) {
    return api.post('/auth/signup', payload);
  },
  me() {
    return api.get('/auth/me');
  },
  logout() {
    return api.post('/auth/logout', { refreshToken });
  }
};

export const CardsAPI = {
  updateMerchantLocks(cardId: string, locks: {
    blockedCategories?: string[];
    allowedCategories?: string[];
    blockedMerchants?: string[];
    allowedMerchants?: string[];
    merchantLockMode?: 'BLOCK' | 'ALLOW';
  }) {
    return api.patch(`/cards/${cardId}/merchant-locks`, locks);
  },
  getMccCategories() {
    return api.get('/cards/mcc-categories');
  },
  list() {
    return api.get('/cards');
  },
  create(payload: any) {
    return api.post('/cards', payload);
  },
  freeze(id: string) {
    return api.patch(`/cards/${id}/freeze`);
  },
  unfreeze(id: string) {
    return api.patch(`/cards/${id}/unfreeze`);
  },
  updateTimeWindow(id: string, payload: any) {
    return api.patch(`/cards/${id}/time-window`, payload);
  },
  updateMerchantLocks(id: string, payload: any) {
    return api.patch(`/cards/${id}/merchant-locks`, payload);
  },
  getMccCategories() {
    return api.get('/cards/mcc-categories');
  }
};

export const TransactionsAPI = {
  list(cardId?: string, filters?: {
    merchantName?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
  }) {
    const params: any = {};
    if (cardId) params.cardId = cardId;
    if (filters) {
      Object.assign(params, filters);
    }
    return api.get('/transactions', { params });
  },
  simulate(payload: any) {
    return api.post('/transactions/simulate', payload);
  },
  getCategories() {
    return api.get('/transactions/categories');
  }
};

export const TopUpAPI = {
  list() {
    return api.get('/topups');
  },
  initiate(payload: any) {
    return api.post('/topups/initiate', payload);
  },
  verify(payload: any) {
    return api.post('/topups/verify', payload);
  }
};

export const AnalyticsAPI = {
  spendByMonth() {
    return api.get('/analytics/spend-by-month');
  },
  spendByCategory() {
    return api.get('/analytics/spend-by-category');
  },
  categoryTrends(months?: number) {
    return api.get('/analytics/category-trends', { params: { months } });
  },
  topCategories(limit?: number) {
    return api.get('/analytics/top-categories', { params: { limit } });
  },
  insights() {
    return api.get('/analytics/insights');
  }
};

export const SubscriptionsAPI = {
  list() {
    return api.get('/subscriptions');
  },
  listForCard(cardId: string) {
    return api.get(`/subscriptions/card/${cardId}`);
  },
  create(payload: any) {
    return api.post('/subscriptions', payload);
  },
  update(id: string, payload: any) {
    return api.patch(`/subscriptions/${id}`, payload);
  },
  delete(id: string) {
    return api.delete(`/subscriptions/${id}`);
  }
};

export const NotificationsAPI = {
  registerToken(token: string) {
    return api.post('/notifications/register-token', { token });
  },
  updatePreferences(preferences: {
    transactions?: boolean;
    limits?: boolean;
    subscriptions?: boolean;
    cardStatus?: boolean;
  }) {
    return api.patch('/notifications/preferences', preferences);
  }
};

export const BudgetsAPI = {
  list() {
    return api.get('/budgets');
  },
  create(payload: any) {
    return api.post('/budgets', payload);
  },
  update(id: string, payload: any) {
    return api.patch(`/budgets/${id}`, payload);
  },
  delete(id: string) {
    return api.delete(`/budgets/${id}`);
  },
  getProgress() {
    return api.get('/budgets/progress');
  },
  getProgressById(id: string) {
    return api.get(`/budgets/${id}/progress`);
  }
};

export const UserAPI = {
  updateProfile(payload: { name?: string; email?: string; phone?: string }) {
    return api.patch('/users/me', payload);
  },
  changePassword(payload: { currentPassword: string; newPassword: string }) {
    return api.post('/users/change-password', payload);
  },
  getAccountStats() {
    return api.get('/users/me/stats');
  }
};






