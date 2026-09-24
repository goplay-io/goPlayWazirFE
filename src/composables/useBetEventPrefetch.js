import { getEventById, getPrefetchEventDetails } from '@/api/event/events.js';
import {
  extractMarketIdsFromEvent,
  hasBetPageMarkets,
  normalizeListEventForBet,
  resolveBetEventPayload,
} from '@/utils/eventData';
import { sharedWs } from '@/composables/sharedWs';

/** @type {Map<string, Promise<unknown>>} */
const inflight = new Map();

/** @type {Map<string, object>} */
const betEventsById = new Map();

/** @type {Map<string, Promise<unknown[]>>} */
const prefetchInFlight = new Map();

function eventKey(eventId) {
  return String(eventId ?? '').trim();
}

function subscribeMarketsForPayload(payload) {
  if (!sharedWs.url || !payload) return;
  const marketIds = extractMarketIdsFromEvent(payload);
  if (marketIds.length > 0) {
    sharedWs.subscribeMarkets(marketIds);
  }
}

function indexBetEvent(event) {
  const resolved = resolveBetEventPayload(event);
  const id = eventKey(resolved?.event_id ?? resolved?.id ?? event?.event_id ?? event?.id);
  if (!id || !resolved) return;
  betEventsById.set(id, resolved);
}

function getCachedBetEvent(eventId) {
  return betEventsById.get(eventKey(eventId)) ?? null;
}

export function parsePrefetchEventDetailsResponse(response) {
  const root = response?.data?.data ?? response?.data ?? response;
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.events)) return root.events;
  return [];
}

/** Index bet-page payloads (from prefetch API or detail API). */
export function indexBetEventsFromPrefetch(events) {
  if (!Array.isArray(events)) return;
  events.forEach(indexBetEvent);
}

/**
 * Load GET /events/prefetch-event-details and cache all event payloads for Bet.
 * Safe to call from every list page — identical requests are deduplicated.
 */
export function loadPrefetchEventDetails(queryParams = {}) {
  const cacheKey = JSON.stringify(queryParams ?? {});
  const existing = prefetchInFlight.get(cacheKey);
  if (existing) return existing;

  const request = getPrefetchEventDetails(queryParams)
    .then((response) => {
      const events = parsePrefetchEventDetailsResponse(response);
      indexBetEventsFromPrefetch(events);
      return events;
    })
    .catch((err) => {
      console.warn('[BetPrefetch] prefetch-event-details failed:', err);
      return [];
    })
    .finally(() => {
      if (prefetchInFlight.get(cacheKey) === request) {
        prefetchInFlight.delete(cacheKey);
      }
    });

  prefetchInFlight.set(cacheKey, request);
  return request;
}

export function getListEventForBet(eventId) {
  return getCachedBetEvent(eventId);
}

/** Synchronous read — used to paint Bet page on first frame when prefetch cache is warm. */
export function getBetEventFromCache(eventId) {
  const cached = getCachedBetEvent(eventId);
  if (cached && hasBetPageMarkets(cached)) {
    return resolveBetEventPayload(cached);
  }
  return null;
}

function scheduleInflightCleanup(key, request) {
  setTimeout(() => {
    if (inflight.get(key) === request) {
      inflight.delete(key);
    }
  }, 30_000);
}

function fetchEventDetail(eventId) {
  const key = eventKey(eventId);
  return getEventById(key).then((res) => {
    subscribeMarketsForPayload(res);
    indexBetEvent(res);
    return res;
  });
}

/**
 * Prefetch a single event for Bet navigation (uses prefetch API cache when warm).
 */
export function prefetchBetEvent(eventId) {
  const key = eventKey(eventId);
  if (!key) return null;

  const existing = inflight.get(key);
  if (existing) return existing;

  const cached = getCachedBetEvent(key);
  if (cached && hasBetPageMarkets(cached)) {
    const normalized = normalizeListEventForBet(cached);
    subscribeMarketsForPayload(normalized);

    const request = Promise.resolve(normalized).finally(() => {
      scheduleInflightCleanup(key, request);
    });

    inflight.set(key, request);
    return request;
  }

  const request = fetchEventDetail(key).finally(() => {
    scheduleInflightCleanup(key, request);
  });

  inflight.set(key, request);
  return request;
}

export function consumeBetEventPrefetch(eventId) {
  const key = eventKey(eventId);
  if (!key) return null;

  const request = inflight.get(key) ?? null;
  inflight.delete(key);
  return request;
}

/** Resolve bet event: click prefetch → prefetch API cache → GET /events/:id */
export async function resolveBetEventData(eventId) {
  const key = eventKey(eventId);
  if (!key) throw new Error('Event not found');

  const prefetched = consumeBetEventPrefetch(key);
  if (prefetched) {
    const res = await prefetched;
    return resolveBetEventPayload(res);
  }

  const cached = getCachedBetEvent(key);
  if (cached && hasBetPageMarkets(cached)) {
    subscribeMarketsForPayload(normalizeListEventForBet(cached));
    return resolveBetEventPayload(cached);
  }

  const res = await fetchEventDetail(key);
  return resolveBetEventPayload(res);
}
