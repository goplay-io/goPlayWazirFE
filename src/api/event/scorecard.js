import { getApiClient } from '../axios';

const api = getApiClient('event');

/**
 * GET /scorecard/:eventId - Fetch scorecard HTML from event service.
 * Handles both JSON envelope { message, data } (e.g. from Redis) and raw HTML response.
 * @param {string|number} eventId - Event ID
 * @returns {Promise<string>} Scorecard HTML
 */
export const getScorecard = (eventId) =>
  api.get(`/scorecard/${eventId}`).then((res) => {
    const body = res.data;
    if (body && typeof body.data === 'string') return body.data;
    if (typeof body === 'string') return body;
    return '';
  });
