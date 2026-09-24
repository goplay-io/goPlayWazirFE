import { getApiClient } from '../axios';
import appConstants from '../../constants/appConstants.js';

const api = getApiClient('user');

const buildQueryString = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return qs ? `?${qs}` : '';
};

// Auth functions
export const login = (credentials) => api.post('/login', credentials, {
  headers: {
    'x-app-type': appConstants.APP_TYPE
  }
});

export const logout = () => api.post('/logout');

export const loginUser = (credentials, queryParams = {}) =>
  api.post(`/login${buildQueryString(queryParams)}`, credentials, {
    headers: {
      'x-app-type': appConstants.APP_TYPE
    }
  });

export const demoLogin = () => api.post('/demo-login');

export const registerUser = (userData, queryParams = {}) =>
  api.post(`/register${buildQueryString(queryParams)}`, userData);

export const signup = (data) => api.post('/signup', data);

export const sendSignupOtp = (data) => api.post('/send-signup-otp', data);

export const verifySignupOtp = (data) => api.post('/verify-signup-otp', data);

export const sendForgotPasswordOtp = (data) => api.post('/send-forgot-password-otp', data);

export const verifyForgotPasswordOtp = (data) => api.post('/verify-forgot-password-otp', data);

export const resetForgotPassword = (data) => api.post('/forgot-password/reset', data);

export const logoutUser = (userId, queryParams = {}) =>
  api.post(`/logout${buildQueryString(queryParams)}`, { userId });

export const changePassword = (userId, passwordData, queryParams = {}) =>
  api.post(`/${userId}/change-password${buildQueryString(queryParams)}`, passwordData);
