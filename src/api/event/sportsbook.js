import { getApiClient } from '../axios';

const api = getApiClient('event');

/**
 * GET sportsbook/sportsbook - Get sportsbook iframe URL
 * @returns {Promise<{ url: string }>}
 */
export const getSportsBookUrl = () => api.get('sportsbook/sportsbook');

/**
 * GET sportsbook/market/:event_type_id/:event_id - Get sportsbook market iframe URL
 * @returns {Promise<{ url: string }>}
 */
export const getSportsBookMarketUrl = (eventTypeId, eventId) =>
  api.get(`sportsbook/market/${eventTypeId}/${eventId}`);