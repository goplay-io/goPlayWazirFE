import { getApiClient } from '../axios';

const api = getApiClient('user');

/**
 * Fetch login history
 * @param {Object} filters - Filter parameters
 * @param {number} page - Page number
 * @param {number} limit - Records per page
 * @returns {Promise} API response
 */
export const fetchLoginHistory = (filters = {}, page = 1, limit = 10) => {
  // Clean up filters to remove undefined and empty values
  const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

  const queryParams = {
    page,
    limit,
    ...cleanFilters
  };

  return api.get('/logs/logins', { params: queryParams });
};

/**
 * Revoke a session
 * @param {string} sessionId - Session ID to revoke
 * @returns {Promise} API response
 */
export const revokeSession = (sessionId) => {
  if (!sessionId) {
    return Promise.reject(new Error('No session ID provided'));
  }

  return api.post('/logs/revoke-session', { session_id: sessionId });
};

/**
 * Fetch log history
 * @param {Object} filters - Filter parameters
 * @param {number} page - Page number
 * @param {number} limit - Records per page
 * @returns {Promise} API response
 */
export const fetchLogHistory = (filters = {}, page = 1, limit = 10) => {
  // Clean up filters to remove undefined and empty values
  const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

  const queryParams = {
    page,
    limit,
    ...cleanFilters
  };

  return api.get('/logs/history', { params: queryParams });
};

