import { getApiClient } from '../axios';

const api = getApiClient('event');

// GET /market-types
export const getAllMarketTypes = (queryParams = {}) => 
  api.get('/market-types', { params: queryParams });

