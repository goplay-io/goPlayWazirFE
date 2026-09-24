import { getApiClient } from '../axios';

const api = getApiClient('event');

// POST /odds/latest
export const getLatestOdds = (marketIds, queryParams = {}) => 
  api.post('/odds/latest', { market_ids: Array.isArray(marketIds) ? marketIds : [marketIds] }, { params: queryParams });

// GET /odds/status
export const getServiceStatus = (queryParams = {}) => 
  api.get('/odds/status', { params: queryParams });

