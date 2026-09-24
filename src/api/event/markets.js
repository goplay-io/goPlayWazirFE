import { getApiClient } from '../axios';
import appConstants from '../../constants/appConstants';

const api = getApiClient('event');

// GET /events/bookmaker/available/:eventId
export const getAvailableBookmakers = (eventId, queryParams = {}) =>
  api.get(`/events/bookmaker/available/${eventId}`, { params: queryParams });

// POST /events/bookmaker/add/:eventId/:bookmakerId
export const addBookmaker = (eventId, bookmakerId, queryParams = {}) =>
  api.post(`/events/bookmaker/add/${eventId}/${bookmakerId}`, {}, { params: queryParams });

// GET /markets/admin/:eventId
export const getMarketAdmin = (eventId, marketType) =>
  api.get(`/markets/admin/${eventId}`, { params: { market_type: marketType } });

// PUT /markets/admin/:eventId
export const updateMarketAdmin = (eventId, marketData, marketType) =>
  api.put(`/markets/admin/${eventId}`, marketData, { params: { market_type: marketType } });

// GET /markets/all/:eventId
export const getAllMarkets = (eventId) =>
  api.get(`/markets/all/${eventId}`);

// GET /markets/bookmaker/:eventId
export const getBookmakerMarkets = (eventId) =>
  api.get(`/markets/bookmaker/${eventId}`);

// PATCH /markets/:marketId/toggle
export const toggleMarketStatus = (marketId, field) =>
  api.patch(`/markets/${marketId}/toggle`, {}, { params: { field } });

// POST /markets/default-bookmaker/:eventId
export const addDefaultBookmaker = (eventId) =>
  api.post(`/markets/default-bookmaker/${eventId}`);

// GET /markets/bookmaker-details/:marketId
export const getBookmakerById = (marketId) =>
  api.get(`/markets/bookmaker-details/${marketId}`);

// PUT /markets/bookmaker-details/:marketId
export const updateBookmakerById = (marketId, updateData) =>
  api.put(`/markets/bookmaker-details/${marketId}`, updateData);

// PATCH /markets/toggle/:eventId
export const toggleMarketsByEventAndType = (eventId, marketType, field) =>
  api.patch(`/markets/toggle/${eventId}`, { market_type: marketType, field });

// GET /markets/info/:marketId
export const getMarketInfo = (marketId) =>
  api.get(`/markets/info/${marketId}`);

// POST /results/publish
export const publishResult = (marketId, runnerId) =>
  api.post('/result/publish', { market_id: marketId, result: runnerId });

// POST /results/rollback
export const rollbackResult = (marketId) =>
  api.post('/result/rollback', { market_id: marketId });

// POST /results/publish (with -1 for abandon)
export const abandonResult = (marketId, otp) =>
  api.post('/result/publish', { market_id: marketId, result: appConstants.ABANDONED_MARKET_RESULT, otp });

// GET /result/market/:marketId
export const getResultsByMarket = (marketId) =>
  api.get(`/result/market/${marketId}`);

// GET /result/all
export const getAllResults = (queryParams = {}) =>
  api.get('/result/all', { params: queryParams });

// GET /markets/fancy-result/:marketId
export const getFancyResult = (marketId) =>
  api.get(`/markets/fancy-result/${marketId}`);

// POST /markets/exposure/management
export const manageExposure = (marketIds) =>
  api.post('/markets/exposure/management', { market_ids: marketIds });

// GET /markets/extra-markets/available/:eventId
export const getAvailableExtraMarkets = (eventId, queryParams = {}) =>
  api.get(`/markets/extra-markets/available/${eventId}`, { params: queryParams });

// POST /markets/extra-markets/add/:eventId/:marketId
export const addExtraMarket = (eventId, marketId, queryParams = {}) =>
  api.post(`/markets/extra-markets/add/${eventId}/${marketId}`, {}, { params: queryParams });

//GET /markets/exposure/management/user/:marketId
export const getUserExposureByMarket = (marketId) =>
  api.get(`/markets/exposure/management/user/${marketId}`);

//GET /markets/settings/
export const getMarketSettings = (marketId) =>
  api.get('/markets/settings', { params: { market_id: marketId } });

// PUT /markets/settings/:marketId
export const updateMarketSettings = (marketId, marketData) =>
  api.put(`/markets/settings/${marketId}`, marketData);

