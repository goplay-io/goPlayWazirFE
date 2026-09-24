import { getApiClient } from '../axios';

const api = getApiClient('event');

/**
 * GET premium/sportsbook - Get sports book iframe URL (no params)
 * @returns {Promise<{ data: { url: string } }>}
 */
export const getPremiumSportsBookUrl = () => api.get('premium/sportsbook');

/**
 * GET premium/market/:event_type_id/:event_id - Get premium market iframe URL
 * @returns {Promise<{ data: { url: string, scorecardUrl?: string } }>}
 */
export const getPremiumMarketUrl = (eventTypeId, eventId) =>
  api.get(`premium/market/${eventTypeId}/${eventId}`);
