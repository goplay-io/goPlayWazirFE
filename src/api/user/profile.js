import { getApiClient } from '../axios';

const api = getApiClient('user');

const buildQueryString = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return qs ? `?${qs}` : '';
};

// Get current user profile
export const getProfile = (queryParams = {}, config = {}) =>
  api.get(`user/profile${buildQueryString(queryParams)}`, config);

// List and fetch users
export const getUsers = (queryParams = {}) =>
  api.get(`/users${buildQueryString(queryParams)}`);

export const getUserById = (id, queryParams = {}) =>
  api.get(`/users/${id}${buildQueryString(queryParams)}`);

export const getUserByEmail = (email, queryParams = {}) =>
  api.get(`/users/email${buildQueryString({ email, ...queryParams })}`);

export const getUserProfile = (id, queryParams = {}) =>
  api.get(`/users/${id}/profile${buildQueryString(queryParams)}`);

export const getUserEvents = (userId, queryParams = {}) =>
  api.get(`/users/${userId}/events${buildQueryString(queryParams)}`);

export const getUserStats = (userId, queryParams = {}) =>
  api.get(`/users/${userId}/stats${buildQueryString(queryParams)}`);

// Create / update / delete users
export const createUser = (userData, queryParams = {}) =>
  api.post(`/user${buildQueryString(queryParams)}`, userData);

export const updateUser = (id, userData, queryParams = {}) =>
  api.post(`/users/${id}${buildQueryString(queryParams)}`, userData);

export const deleteUser = (id, queryParams = {}) =>
  api.post(`/users/${id}${buildQueryString(queryParams)}`, { action: 'delete' });

// Status and password maintenance
export const changeStatus = (userId, statusData, queryParams = {}) =>
  api.put(`/user/status${buildQueryString(queryParams)}`, statusData);

export const resetPassword = (email, queryParams = {}) =>
  api.post(`/users/reset-password${buildQueryString({ email, ...queryParams })}`, { email });

export const resetUserPassword = (userId, passData, queryParams = {}) =>
  api.post(`/user/password/reset${buildQueryString(queryParams)}`, passData);

export const resetUserWithPassword = (userId, passData, queryParams = {}) =>
  api.post(`/user/password/withdrawal/reset${buildQueryString(queryParams)}`, passData);

// Preferences
export const updateUserPreferences = (userId, preferences, queryParams = {}) =>
  api.post(`/users/${userId}/preferences${buildQueryString(queryParams)}`, preferences);

export const getUserPreferences = (userId, queryParams = {}) =>
  api.get(`/users/${userId}/preferences${buildQueryString(queryParams)}`);

// User Settings
export const getUserSettings = (userId, queryParams = {}) =>
  api.get(`/users/${userId}/settings${buildQueryString(queryParams)}`);

export const updateUserSettings = (userId, settingsData, queryParams = {}) =>
  api.put(`/users/${userId}/settings${buildQueryString(queryParams)}`, settingsData);

// Search
export const searchUsers = (searchTerm, filters = {}, queryParams = {}) =>
  api.get(`/users/search${buildQueryString({ search: searchTerm, ...filters, ...queryParams })}`);

// Change password
export const changePassword = async (passwordData, queryParams = {}) => {
  const dataToSend = {
    password: passwordData.password,
    password_confirmation: passwordData.password_confirmation,
  };

  // Include old password if provided
  if (passwordData.old_password) {
    dataToSend.old_password = passwordData.old_password;
  }

  // Determine the endpoint based on type
  const endpoint =
    passwordData.type === 'withdrawal_password'
      ? '/user/password/withdrawal'
      : '/user/password/';

  return api.put(endpoint, dataToSend, { params: queryParams });
};

// Change both login and withdrawal passwords together (forced change flow)
export const changeBothPasswords = async (data, queryParams = {}) => {
  return api.put('/user/password/both', data, { params: queryParams });
};

// Buttons API
export const fetchButtons = async (queryParams = {}) => {
  try {
    const response = await api.get('/user/buttons', { params: queryParams });
    return {
      buttons: response.data || response,
      betAllow: response?.data?.[0]?.bet_allow == "1" || response?.[0]?.bet_allow == "1"
    };
  } catch (error) {
    console.error("Error fetching buttons:", error);
    throw error;
  }
};

export const updateButtons = async (buttonData, queryParams = {}) => {
  try {
    const response = await api.put('/user/buttons', buttonData, { params: queryParams });
    return response.data || response;
  } catch (error) {
    console.error("Error updating buttons:", error);
    throw error;
  }
};
