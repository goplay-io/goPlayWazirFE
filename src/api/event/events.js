import { getApiClient } from '../axios';

const api = getApiClient('event');

/** Shared in-flight + session cache for the default client events list. */
let _eventsListInFlight = null;
let _eventsListCache = null;

function isDefaultEventsListQuery(queryParams) {
    if (!queryParams || typeof queryParams !== 'object') return true;
    return Object.keys(queryParams).length === 0;
}

/**
 * Clear cached events list so the next default call hits the network.
 */
export const clearEventsListCache = () => {
    _eventsListCache = null;
    _eventsListInFlight = null;
};

// GET /events/betfair/available/:eventTypeId
export const getAvailableEvents = (eventTypeId, queryParams = {}) =>
    api.get(`/events/betfair/available/${eventTypeId}`, { params: queryParams });

// POST /events/betfair/add/:eventTypeId/:eventId
export const addEvent = (eventTypeId, eventId, queryParams = {}) =>
    api.post(`/events/betfair/add/${eventTypeId}/${eventId}`, {}, { params: queryParams });

/**
 * GET /events/list (client-facing)
 * Default (no params) calls are deduped and cached for the session.
 * Other query shapes bypass the cache.
 */
export const getEventsList = (queryParams = {}) => {
    if (!isDefaultEventsListQuery(queryParams)) {
        return api.get('/events/list', { params: queryParams });
    }

    if (_eventsListCache) {
        return Promise.resolve(_eventsListCache);
    }

    if (_eventsListInFlight) {
        return _eventsListInFlight;
    }

    _eventsListInFlight = api
        .get('/events/list')
        .then((response) => {
            _eventsListCache = response;
            return response;
        })
        .finally(() => {
            _eventsListInFlight = null;
        });

    return _eventsListInFlight;
};

// GET /events/prefetch-event-details — full bet-page event payloads for active markets
export const getPrefetchEventDetails = (queryParams = {}) =>
    api.get('/events/prefetch-event-details', { params: queryParams });

// GET /events/list/admin
export const getAllEvents = (queryParams = {}) =>
    api.get('/events/list/admin', { params: queryParams });

// GET /events/:id
export const getEventById = (id, queryParams = {}) =>
    api.get(`/events/${id}`, { params: queryParams });

// GET /events/info/:id
export const getEventInfo = (id, queryParams = {}) =>
    api.get(`/events/info/${id}`, { params: queryParams });

// PATCH /events/:id/toggle
export const toggleEventStatus = (id, field = 'active', queryParams = {}) =>
    api.patch(`/events/${id}/toggle`, {}, { params: { field, ...queryParams } });

// GET /events/:id/admin
export const getEventForAdmin = (id, queryParams = {}) =>
    api.get(`/events/${id}/admin`, { params: queryParams });

// PUT /events/:id
export const updateEvent = (id, eventData, queryParams = {}) =>
    api.put(`/events/${id}`, eventData, { params: queryParams });

// GET /bet/detailsbyEvent
export const getBetDetails = (eventId, params = {}) =>
    api.get(`events/bet-details/management/${eventId}`, { params });

// GET /events/admin/:id
export const getEventByIdForAdmin = (id, queryParams = {}) =>
    api.get(`/events/admin/${id}`, { params: queryParams });
// POST /events/manual
export const createManualEvent = (eventData, queryParams = {}) =>
    api.post('/events/manual/create', eventData, { params: queryParams });

// PATCH /events/:id/toggle-status
export const toggleEventStatusId = (id, queryParams = {}) =>
  api.patch(`/events/${id}/toggle-status`, {}, { params: queryParams });

// GET /events/resolve-sr-id/:eventId — map bEventId → sEventId for SR widget scorecard
export const resolveSrEventId = (eventId, queryParams = {}) =>
  api.get(`/events/resolve-sr-id/${eventId}`, { params: queryParams });
