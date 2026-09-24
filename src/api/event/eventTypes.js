import { getApiClient } from '../axios';

const api = getApiClient('event');

/** Shared in-flight + session cache so /menu/list is not hammered on initial load. */
let _menuListInFlight = null;
let _menuListCache = null;

function hasCustomQueryParams(queryParams) {
  return (
    queryParams &&
    typeof queryParams === 'object' &&
    Object.keys(queryParams).length > 0
  );
}

/**
 * GET /menu/list
 * Default (no query) calls are deduped and cached for the session.
 * Pass queryParams to bypass cache for filtered requests.
 */
export const getAllEventTypes = (queryParams = {}) => {
  if (hasCustomQueryParams(queryParams)) {
    return api.get('/menu/list', { params: queryParams });
  }

  if (_menuListCache) {
    return Promise.resolve(_menuListCache);
  }

  if (_menuListInFlight) {
    return _menuListInFlight;
  }

  _menuListInFlight = api
    .get('/menu/list')
    .then((response) => {
      _menuListCache = response;
      return response;
    })
    .finally(() => {
      _menuListInFlight = null;
    });

  return _menuListInFlight;
};

/** Clear cached menu so the next call hits the network. */
export const clearEventTypesCache = () => {
  _menuListCache = null;
  _menuListInFlight = null;
};

// Alias for backward compatibility
export const getEventTypes = getAllEventTypes;
