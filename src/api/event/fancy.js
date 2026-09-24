import { getApiClient } from '../axios';

const api = getApiClient('event');

// GET /events/fancy/available/:eventId
export const getAvailableFancy = (eventId, queryParams = {}) => 
  api.get(`/events/fancy/available/${eventId}`, { params: queryParams });

// POST /events/fancy/add/:eventId/:fancyId
export const addFancy = (eventId, fancyId) => 
  api.post(`/events/fancy/add/${eventId}/${fancyId}`);

// GET /markets/fancy/:eventId
export const getAddedFancy = (eventId) => 
  api.get(`/markets/fancy/${eventId}`);

