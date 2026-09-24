/**
 * Shared singleton WebSocket connection to OddsDistributor.
 * A single connection is reused for all odds + scorecard + binary + fancy-refetch subscriptions.
 *
 * Message routing:
 *   Odds frame         → { success: true, data: [...] }                              → msg.data is Array
 *   Fancy refetch flag → { success: true, type: 'fancy_refetch', eventId: N }        → msg.type === 'fancy_refetch'
 *   Scorecard frame    → { success: true, eventId: N, data: {} }                     → msg.eventId != null
 *   Binary frame       → { success: true, type: 'binary', unix, ts, markets[] }      → msg.type === 'binary'
 *
 * event_id subscribe:
 *   { event_id, scorecard_fetch: true }  → Manual scorecard HTML (worker polls)
 *   { event_id } / scorecard_fetch:false → fancy refetch routing only
 */
import { getAuthNamespace } from '@/utils/authStorage';

const WS_URL = import.meta.env.VITE_ODDS_WS_URL || '';
const WS_AUTH_NAMESPACE = getAuthNamespace();

function getNamespacedWsUrl() {
  if (!WS_URL) return '';
  try {
    const url = new URL(WS_URL);
    if (WS_AUTH_NAMESPACE) url.searchParams.set('auth_namespace', WS_AUTH_NAMESPACE);
    return url.toString();
  } catch {
    return WS_URL;
  }
}

// ─── Singleton state ─────────────────────────────────────────────────────────

let ws = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 5;
const RECONNECT_DELAY_MS = 2500;

// Registered listener sets — each entry is a function(msg)
const oddsListeners = new Set();
const scorecardListeners = new Set();
const fancyRefetchListeners = new Set();
const binaryListeners = new Set();

// Track what we need to (re)subscribe after reconnects
let pendingMarketIds = [];
/** @type {Map<number, number>} eventId → subscriber refcount (routing) */
const pendingEventRefCounts = new Map();
/** @type {Map<number, number>} eventId → Manual scorecard fetch refcount */
const pendingFetchRefCounts = new Map();
let pendingBinaryUnix = null;

/** Latest odds frame per market — used to hydrate Bet page before the next WS tick. */
const latestOddsByMarket = new Map();

function cacheOddsFrame(data) {
  if (!Array.isArray(data)) return;
  data.forEach((item) => {
    const id = String(item?.marketId ?? item?.market_id ?? '').trim();
    if (id) latestOddsByMarket.set(id, item);
  });
}

function hasAnyListeners() {
  return (
    oddsListeners.size > 0 ||
    scorecardListeners.size > 0 ||
    fancyRefetchListeners.size > 0 ||
    binaryListeners.size > 0
  );
}

function sendEventSubscription(id) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const scorecard_fetch = (pendingFetchRefCounts.get(id) || 0) > 0;
  ws.send(JSON.stringify({ event_id: id, scorecard_fetch }));
}

function dispatch(raw) {
  try {
    const msg = JSON.parse(raw);
    if (msg == null) return;

    if (msg.type === 'binary') {
      binaryListeners.forEach((fn) => fn(msg));
    } else if (msg.type === 'fancy_refetch') {
      fancyRefetchListeners.forEach((fn) => fn(msg));
    } else if (msg.eventId != null) {
      scorecardListeners.forEach((fn) => fn(msg));
    } else if (Array.isArray(msg.data)) {
      cacheOddsFrame(msg.data);
      oddsListeners.forEach((fn) => fn(msg));
    }
  } catch (_) {}
}

function resubscribe() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  if (pendingMarketIds.length > 0) {
    ws.send(JSON.stringify({ market_ids: pendingMarketIds }));
  }
  for (const id of pendingEventRefCounts.keys()) {
    sendEventSubscription(id);
  }
  if (pendingBinaryUnix) {
    ws.send(JSON.stringify({ unix: pendingBinaryUnix }));
  }
}

function connect() {
  if (ws && ws.readyState <= WebSocket.OPEN) return; // already open or connecting
  const url = getNamespacedWsUrl();
  if (!url) return;

  try {
    ws = new WebSocket(url, ['odds']);

    ws.onopen = () => {
      reconnectAttempts = 0;
      resubscribe();
    };

    ws.onmessage = (ev) => dispatch(ev.data);

    ws.onclose = () => {
      ws = null;
      if (!hasAnyListeners()) return;
      if (reconnectAttempts >= MAX_RECONNECT) return;
      reconnectAttempts += 1;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => ws?.close();
  } catch (err) {
    console.error('[SharedWS] Connect error:', err);
  }
}

function ensureConnected() {
  if (!getNamespacedWsUrl()) return;
  cancelIdleDisconnect();
  if (!ws || ws.readyState > WebSocket.OPEN) connect();
}

let idleDisconnectTimer = null;

function cancelIdleDisconnect() {
  if (idleDisconnectTimer) {
    clearTimeout(idleDisconnectTimer);
    idleDisconnectTimer = null;
  }
}

function disconnectIfIdle() {
  if (hasAnyListeners()) {
    cancelIdleDisconnect();
    return;
  }
  cancelIdleDisconnect();
  idleDisconnectTimer = setTimeout(() => {
    idleDisconnectTimer = null;
    if (hasAnyListeners()) return;
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    reconnectAttempts = MAX_RECONNECT;
    if (ws) { ws.close(); ws = null; }
    reconnectAttempts = 0;
    pendingMarketIds = [];
    pendingEventRefCounts.clear();
    pendingFetchRefCounts.clear();
    pendingBinaryUnix = null;
  }, 800);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const sharedWs = {
  get url() { return WS_URL; },

  /** Open the socket early so the first Bet-page subscribe is not blocked on connect. */
  warmup() {
    ensureConnected();
  },

  /** Subscribe to odds frames. Returns an unsubscribe function. */
  onOdds(fn) {
    oddsListeners.add(fn);
    ensureConnected();
    return () => {
      oddsListeners.delete(fn);
      disconnectIfIdle();
    };
  },

  /** Subscribe to scorecard frames for a specific eventId. Returns an unsubscribe function. */
  onScorecard(fn) {
    scorecardListeners.add(fn);
    ensureConnected();
    return () => {
      scorecardListeners.delete(fn);
      disconnectIfIdle();
    };
  },

  /** Subscribe to fancy catalog refetch flags. Returns an unsubscribe function. */
  onFancyRefetch(fn) {
    fancyRefetchListeners.add(fn);
    ensureConnected();
    return () => {
      fancyRefetchListeners.delete(fn);
      disconnectIfIdle();
    };
  },

  /** Send (or queue) market_ids subscription. */
  subscribeMarkets(marketIds) {
    pendingMarketIds = Array.isArray(marketIds) ? marketIds : [];
    if (ws && ws.readyState === WebSocket.OPEN && pendingMarketIds.length > 0) {
      ws.send(JSON.stringify({ market_ids: pendingMarketIds }));
    } else {
      ensureConnected();
    }
  },

  /** Return cached odds snapshots for the given market IDs (most recent WS frame per market). */
  getCachedOddsForMarkets(marketIds) {
    if (!Array.isArray(marketIds)) return [];
    const out = [];
    marketIds.forEach((id) => {
      const cached = latestOddsByMarket.get(String(id));
      if (cached) out.push(cached);
    });
    return out;
  },

  /**
   * Send (or queue) event_id subscription (scorecard + fancy refetch routing).
   * Pass { fetch: true } only for Manual scorecard HTML (triggers worker polling).
   * Fancy-refetch uses the same event_id without fetch.
   */
  subscribeScorecard(eventId, { fetch = false } = {}) {
    const id = Number(eventId);
    if (!Number.isFinite(id) || id <= 0) return;
    pendingEventRefCounts.set(id, (pendingEventRefCounts.get(id) || 0) + 1);
    if (fetch) {
      pendingFetchRefCounts.set(id, (pendingFetchRefCounts.get(id) || 0) + 1);
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      sendEventSubscription(id);
    } else {
      ensureConnected();
    }
  },

  /**
   * Decrement event_id refcount. Pass { fetch: true } when the Manual scorecard
   * subscriber leaves so the worker stops polling if nothing else wants HTML.
   */
  unsubscribeScorecard(eventId, { fetch = false } = {}) {
    const id = Number(eventId);
    if (!Number.isFinite(id) || id <= 0) return;
    const prev = pendingEventRefCounts.get(id) || 0;
    if (prev <= 1) {
      pendingEventRefCounts.delete(id);
    } else {
      pendingEventRefCounts.set(id, prev - 1);
    }
    if (fetch) {
      const prevFetch = pendingFetchRefCounts.get(id) || 0;
      if (prevFetch <= 1) {
        pendingFetchRefCounts.delete(id);
      } else {
        pendingFetchRefCounts.set(id, prevFetch - 1);
      }
    }
    // Refresh server flag while the socket still routes fancy_refetch for this event.
    if (pendingEventRefCounts.has(id)) {
      sendEventSubscription(id);
    }
  },

  /** Subscribe to binary frames. Returns an unsubscribe function. */
  onBinary(fn) {
    binaryListeners.add(fn);
    ensureConnected();
    return () => {
      binaryListeners.delete(fn);
      disconnectIfIdle();
    };
  },

  /** Send (or queue) unix binary subscription. */
  subscribeBinary(unix) {
    const u = Number(unix);
    if (!Number.isFinite(u) || u <= 0) return;
    pendingBinaryUnix = u;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ unix: u }));
    } else {
      ensureConnected();
    }
  },

  /** Clear pending binary unix (cleanup). */
  unsubscribeBinary() {
    pendingBinaryUnix = null;
  },
};
