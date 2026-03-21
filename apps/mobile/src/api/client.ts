import axios from 'axios';
import { Platform } from 'react-native';
import { getBackendIP, clearCachedIP } from '../utils/networkDetector';

// Determine API base URL
// 
// PRODUCTION APPS (millions of users):
// - Use EXPO_PUBLIC_API_BASE environment variable
// - Set to your production API: https://api.stewiepay.com
// - No manual IP needed - uses domain name that works everywhere
// 
// DEVELOPMENT (local testing only):
// - Automatically detects Mac IP for WiFi and Personal Hotspot
// - Works seamlessly when switching between networks
// - Falls back to localhost for simulator
//
let API_BASE: string = 'http://localhost:3000/api'; // Default fallback
let isInitializing = false;
let isInitialized = false; // Track if initialization completed
let initPromise: Promise<void> | null = null;

/**
 * Initialize API base URL with automatic network detection
 * This will automatically find your Mac's IP whether on WiFi or Personal Hotspot
 */
async function initializeApiBase(): Promise<void> {
  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      // ============================================
      // PRODUCTION: Use environment variable
      // ============================================
      if (process.env.EXPO_PUBLIC_API_BASE) {
        API_BASE = process.env.EXPO_PUBLIC_API_BASE;
        console.log('[API] Using production API:', API_BASE);
        return;
      }

      // ============================================
      // DEVELOPMENT: Auto-detect backend IP
      // ============================================
      if (__DEV__) {
        // For simulator, use localhost
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          // Physical device - auto-detect IP
          const detectedIP = await getBackendIP();
          API_BASE = `http://${detectedIP}:3000/api`;
          api.defaults.baseURL = API_BASE;
          console.log('[API] Auto-detected backend IP:', detectedIP);
        } else {
          // Simulator/Web - use localhost
          API_BASE = 'http://localhost:3000/api';
          api.defaults.baseURL = API_BASE;
          console.log('[API] Using localhost (simulator/web)');
        }
      } else {
        // Production fallback
        API_BASE = 'http://localhost:3000/api';
        api.defaults.baseURL = API_BASE;
      }
      isInitialized = true;
    } catch (error) {
      console.error('[API] Error initializing API base:', error);
      API_BASE = 'http://localhost:3000/api'; // Safe fallback
      api.defaults.baseURL = API_BASE;
      isInitialized = true; // Mark as initialized even on error to prevent retries
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

// Initialize on module load (non-blocking)
if (__DEV__) {
  initializeApiBase().catch(() => {
    // Ignore initialization errors, will retry on first request
  });
}

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

// Update API base URL when it changes
export function updateApiBase(newBase: string) {
  API_BASE = newBase;
  api.defaults.baseURL = newBase;
  if (__DEV__) {
    console.log('[API] Updated API base URL:', newBase);
  }
}

// Ensure API is initialized before first request
api.interceptors.request.use(async (config) => {
  // Initialize API base if not already done (only once)
  if (!process.env.EXPO_PUBLIC_API_BASE && __DEV__ && !isInitialized) {
    if (isInitializing && initPromise) {
      await initPromise;
    } else if (!isInitializing) {
      await initializeApiBase();
    }
  }
  
  // Use the current API_BASE (don't let config override it)
  config.baseURL = API_BASE;
  
  return config;
});

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
      
      // Network errors - try to auto-detect new IP
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.code === 'ECONNABORTED') {
        const originalRequest = error.config;
        
        // Only retry once per request to avoid infinite loops
        if (!originalRequest._retryNetwork && __DEV__ && Platform.OS !== 'web') {
          originalRequest._retryNetwork = true;
          
          console.log('[API] Network error detected, attempting to find new backend IP...');
          
          // Clear cached IP and find new one
          await clearCachedIP();
          const newIP = await getBackendIP();
          
          if (newIP && newIP !== 'localhost') {
            // Update API base and retry request
            const oldBase = API_BASE;
            API_BASE = `http://${newIP}:3000/api`;
            api.defaults.baseURL = API_BASE;
            
            console.log(`[API] Found new backend IP: ${newIP}, retrying request...`);
            
            // Retry the original request with new base URL
            originalRequest.baseURL = API_BASE;
            return api(originalRequest);
          }
        }
        
        // Log troubleshooting info
        if (error.code === 'ECONNABORTED') {
          console.error('[API] Request timeout:', {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            timeout: error.config?.timeout,
          });
        } else {
          console.error('[API] Network Error - Cannot connect to backend:', {
            attemptedURL: error.config?.baseURL,
            error: error.message,
            troubleshooting: [
              '1. Check backend is running: cd apps/backend && yarn start:dev',
              '2. Ensure device and Mac are on same WiFi/Hotspot',
              '3. Check Mac Firewall: System Settings > Network > Firewall',
              '4. The app will automatically detect your Mac IP',
            ],
          });
        }
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
  },
  forgotPassword(email: string) {
    return api.post('/auth/forgot-password', { email });
  },
  resetPassword(token: string, newPassword: string) {
    return api.post('/auth/reset-password', { token, newPassword });
  },
  resendVerification(email: string) {
    return api.post('/auth/resend-verification', { email });
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
  updateLimits(id: string, payload: { limitDaily?: number | null; limitMonthly?: number | null; limitPerTxn?: number | null }) {
    return api.patch(`/cards/${id}/limits`, payload);
  },
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
    status?: 'AUTHORIZED' | 'SETTLED' | 'DECLINED';
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
  },
  reconciliation(topUpId: string) {
    return api.get(`/topups/${topUpId}/reconciliation`);
  }
};

export const SubscriptionsAPI = {
  list(params?: { cardId?: string }) {
    return api.get('/subscriptions', { params });
  },
  create(payload: {
    cardId: string;
    merchant: string;
    amountHint?: number;
    currency?: string;
    nextExpectedCharge?: string;
  }) {
    return api.post('/subscriptions', payload);
  },
  update(
    id: string,
    payload: {
      merchant?: string;
      amountHint?: number | null;
      currency?: string;
      nextExpectedCharge?: string | null;
      lastChargeAt?: string | null;
    }
  ) {
    return api.patch(`/subscriptions/${id}`, payload);
  },
  remove(id: string) {
    return api.delete(`/subscriptions/${id}`);
  }
};

export const AnalyticsAPI = {
  spendByMonth() {
    return api.get('/analytics/spend-by-month');
  },
  spendByCategory() {
    return api.get('/analytics/spend-by-category');
  }
};

export const NotificationsAPI = {
  registerToken(token: string) {
    return api.post('/notifications/register-token', { token });
  },
  updatePreferences(preferences: {
    transactions?: boolean;
    limits?: boolean;
    cardStatus?: boolean;
    email?: boolean;
  }) {
    return api.patch('/notifications/preferences', preferences);
  }
};

export const UserAPI = {
  updateProfile(payload: { name?: string; email?: string; phone?: string; avatarUrl?: string }) {
    return api.patch('/users/me', payload);
  },
  changePassword(payload: { currentPassword: string; newPassword: string }) {
    return api.post('/users/change-password', payload);
  },
  getAccountStats() {
    return api.get('/users/me/stats');
  },
  uploadAvatar(base64Image: string) {
    // Upload base64 image to backend, which will upload to Cloudinary
    return api.post('/users/upload-avatar', { image: base64Image });
  },
  submitKyc(payload: {
    documentType: 'passport' | 'national_id' | 'driver_license';
    country: string;
    documentFront: string;
    documentBack?: string;
    selfie: string;
  }) {
    return api.post('/users/kyc/submit', payload);
  },
  getKycStatus() {
    return api.get('/users/kyc/status');
  },
  getKycReviews(
    userId: string,
    params?: {
      limit?: number;
      cursor?: string;
      status?: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
    }
  ) {
    return api.get(`/users/kyc/${userId}/reviews`, { params });
  },
};


