import axios from 'axios';
import { getActivePinia } from 'pinia';
import serviceMap from './services';
import { getAuthAppType, getAuthNamespace, removeStoredUser } from '../utils/authStorage';

const UNAUTHORIZED_STATUS_CODES = [401];
const SAFE_METHODS = new Set(['get', 'head', 'options']);
const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME || 'csrf_token';
const SERVICE_HEADER_NAME = 'X-SERVICE';
const SERVICE_HEADER_VALUE = 'api';
const APP_TYPE_HEADER_NAME = 'x-app-type';
const AUTH_NAMESPACE_HEADER_NAME = 'x-auth-namespace';
const NAMESPACED_CSRF_COOKIE_NAME = getAuthNamespace()
  ? `${CSRF_COOKIE_NAME}_${getAuthNamespace()}`
  : CSRF_COOKIE_NAME;

const clients = new Map();
let isRedirecting = false; // Prevent multiple redirects
let unauthorizedCount = 0; // Track consecutive unauthorized responses
let lastUnauthorizedTime = 0; // Track when last 401/403 occurred
const UNAUTHORIZED_THRESHOLD = 3; // Number of 401s before clearing token
const UNAUTHORIZED_WINDOW = 10000; // Time window in ms (10 seconds)
const SESSION_REVOKED_MESSAGE_PATTERN = /session expired or revoked/i;
const LOGIN_REDIRECT_MESSAGE_KEY = 'login_redirect_message';
const LOGIN_REDIRECT_MESSAGE_TTL_MS = 60000;

const storeLoginRedirectMessage = (message) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const payload = {
      message: message || 'Session expired or revoked. Please login again.',
      expiresAt: Date.now() + LOGIN_REDIRECT_MESSAGE_TTL_MS,
    };
    window.sessionStorage.setItem(LOGIN_REDIRECT_MESSAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures and continue with redirect.
  }
};

const getCookieValue = (name) => {
  if (typeof document === 'undefined' || !name) {
    return null;
  }

  const cookies = document.cookie ? document.cookie.split(';') : [];
  for (const cookie of cookies) {
    const [rawKey, ...valueParts] = cookie.split('=');
    const key = rawKey?.trim();
    if (key !== name) {
      continue;
    }
    const rawValue = valueParts.join('=');
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
};

export const getApiClient = (serviceName) => {
  if (!serviceName) {
    throw new Error('Service name is required to create an API client');
  }

  if (!clients.has(serviceName)) {
    const baseURL = serviceMap[serviceName];

    if (!baseURL) {
      throw new Error(`Unknown API service: ${serviceName}`);
    }

    const client = axios.create({
      baseURL,
      timeout: 10000,
      withCredentials: true,
    });

    client.interceptors.request.use((config) => {
      config.headers = {
        ...config.headers,
        [SERVICE_HEADER_NAME]: SERVICE_HEADER_VALUE,
        [APP_TYPE_HEADER_NAME]: getAuthAppType(),
        [AUTH_NAMESPACE_HEADER_NAME]: getAuthNamespace(),
      };

      if (typeof window !== 'undefined') {
        const method = (config.method || 'get').toLowerCase();
        const csrfToken =
          getCookieValue(NAMESPACED_CSRF_COOKIE_NAME) ||
          getCookieValue(CSRF_COOKIE_NAME);

        if (!SAFE_METHODS.has(method) && csrfToken) {
          config.headers = {
            ...config.headers,
            'X-CSRF-Token': csrfToken,
          };
        }
      }
      return config;
    });

    client.interceptors.response.use(
      (response) => {
        if (response.config?.responseType === 'blob') {
          return response;
        }
        return response.data;
      },
      async (error) => {
        const requestUrl = error.config?.url || 'unknown';
        const apiErrorMessage = error.response?.data?.message || '';
        const errorMessage =
          apiErrorMessage ||
          error.response?.message ||
          error.message ||
          'An error occurred';
        const errorWithMessage = new Error(errorMessage);
        errorWithMessage.response = error.response;

        // Handle unauthorized status codes
        if (error.response && UNAUTHORIZED_STATUS_CODES.includes(error.response.status)) {
          if (error.config?.metadata?.suppressUnauthorizedModal === true) {
            return Promise.reject(errorWithMessage);
          }

          if (typeof window !== 'undefined' && !isRedirecting) {
            try {
              const now = Date.now();
              const timeSinceLastUnauthorized = now - lastUnauthorizedTime;
              
              // Reset counter if it's been more than the time window
              if (timeSinceLastUnauthorized > UNAUTHORIZED_WINDOW) {
                unauthorizedCount = 0;
              }
              
              unauthorizedCount++;
              lastUnauthorizedTime = now;
              
              // Check if this is a background/periodic call
              const isBackgroundCall = requestUrl.includes('/wallet/chip') || 
                                      requestUrl.includes('/wallet/data') ||
                                      requestUrl.includes('/odds') ||
                                      error.config?.metadata?.isBackground === true;
              const isLogoutCall = requestUrl.includes('/logout');
              const isLoginAttempt =
                /\/login(?:\?|$)/.test(requestUrl) || requestUrl.includes('/demo-login');
              const isSessionRevokedError = SESSION_REVOKED_MESSAGE_PATTERN.test(apiErrorMessage);
              
              console.warn(`[API] Unauthorized response (${unauthorizedCount}/${UNAUTHORIZED_THRESHOLD}) from: ${requestUrl}`);
              
              // Determine if we should clear local auth state.
              // For background calls: wait until threshold to avoid noisy forced logouts.
              let shouldClearToken = false;
              let shouldRedirect = false;
              
              if (isSessionRevokedError) {
                shouldClearToken = true;
                shouldRedirect = true;
              } else if (isBackgroundCall) {
                shouldClearToken = unauthorizedCount >= UNAUTHORIZED_THRESHOLD;
                shouldRedirect = unauthorizedCount >= UNAUTHORIZED_THRESHOLD;
                if (!shouldClearToken) {
                  console.warn('[API] Background call 401 - waiting for threshold before redirect');
                }
              } else if (isLogoutCall) {
                // For explicit logout calls, always clear state but let app control navigation.
                shouldClearToken = true;
                shouldRedirect = false;
              } else if (isLoginAttempt) {
                // Wrong credentials — surface error in the login UI; do not reopen the modal.
                shouldClearToken = false;
                shouldRedirect = false;
              } else {
                // User-initiated calls: clear immediately.
                shouldClearToken = true;
                shouldRedirect = true;
              }
              
              if (shouldClearToken) {
                console.warn('[API] Clearing auth state due to unauthorized response');
                const activePinia = getActivePinia();
                if (activePinia) {
                  const { useAuthStore } = await import('../stores/auth.js');
                  const authStore = useAuthStore(activePinia);
                  authStore.$patch({ token: null, user: null });
                }
                removeStoredUser();
                unauthorizedCount = 0; // Reset counter
                
                // Only redirect if not already on login page and not already redirecting
                if (shouldRedirect && !isRedirecting) {
                  isRedirecting = true;
                  console.warn('[API] Opening login modal');
                  storeLoginRedirectMessage(apiErrorMessage);
                  if (activePinia) {
                    const { useUIStore } = await import('../stores/ui.js');
                    const uiStore = useUIStore(activePinia);
                    uiStore.openLoginModal({ force: true });
                  }
                  setTimeout(() => {
                    isRedirecting = false;
                  }, 500);
                }
              }
            } catch (storageError) {
              console.error('[API] Failed to clear auth data:', storageError);
            }
          }
        } else {
          // Reset unauthorized counter on successful requests
          unauthorizedCount = 0;
        }
        
        return Promise.reject(errorWithMessage);
      }
    );

    clients.set(serviceName, client);
  }

  return clients.get(serviceName);
};

export default getApiClient;

