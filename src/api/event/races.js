import { getApiClient } from '../axios';

const api = getApiClient('event');

/**
 * Get all races with their markets
 * @param {Object} queryParams - Query parameters
 * @param {number} queryParams.event_type_id - Optional event type ID to filter by
 * @param {boolean} queryParams.in_play - Optional in_play filter
 * @param {boolean} queryParams.is_featured - Optional is_featured filter
 * @returns {Promise<Object>} Response with races array
 */
export const getAllRaces = (queryParams = {}) =>
  api.get('/races/list', { params: queryParams });

