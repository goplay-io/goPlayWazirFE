import { getApiClient } from '../axios';

const api = getApiClient('user');

// System settings functions
export const getClientSettings = () =>
    api.get('/settings/client');

