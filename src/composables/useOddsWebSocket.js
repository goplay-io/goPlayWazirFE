import { watch, onUnmounted, isRef } from 'vue';
import { useMarketOdds } from '@/composables/useMarketOdds';
import { getLatestOdds } from '@/api/event/odds';
import { getAuthNamespace } from '@/utils/authStorage';
import { sharedWs } from '@/composables/sharedWs';

const WS_URL = import.meta.env.VITE_ODDS_WS_URL || '';
const WS_AUTH_NAMESPACE = getAuthNamespace();

const getNamespacedWsUrl = () => {
  if (!WS_URL) {
    return '';
  }

  try {
    const url = new URL(WS_URL);
    if (WS_AUTH_NAMESPACE) {
      url.searchParams.set('auth_namespace', WS_AUTH_NAMESPACE);
    }
    return url.toString();
  } catch {
    return WS_URL;
  }
};

/**
 * Transform odds runners data to EventRow format.
 * EventRow expects: [1] back price, [2] back size, [7] lay price, [8] lay size
 */
function transformRunnersToValues(runners) {
  if (!runners || typeof runners !== 'object') return {};
  const values = {};
  const runnerIds = Object.keys(runners);
  runnerIds.forEach((runnerId, index) => {
    const teamKey = index === 0 ? 'TEAM_1' : index === 1 ? 'TEAM_2' : 'TEAM_3';
    const runner = runners[runnerId];
    if (runner && runner.back && runner.lay) {
      const bestBack = runner.back[0]?.price ?? 0;
      const bestBackSize = runner.back[0]?.size ?? 0;
      const bestLay = runner.lay[0]?.price ?? 0;
      const bestLaySize = runner.lay[0]?.size ?? 0;
      values[teamKey] = [
        runnerId,
        bestBack,
        bestBackSize,
        0, 0, 0, 0,
        bestLay,
        bestLaySize,
      ];
    }
  });
  return values;
}

/**
 * Composable for real-time odds via OddsDistributor WebSocket.
 * Uses the shared singleton socket (same as Bet page) so odds are cached across navigation.
 * Falls back to polling when VITE_ODDS_WS_URL is not set.
 * @param {Function} eventsSource - Function that returns events array
 * @param {Object} options - { onUpdate?: (events) => void }
 */
export function useOddsWebSocket(eventsSource, options = {}) {
  const wsUrl = getNamespacedWsUrl();

  if (!wsUrl) {
    return useMarketOdds(eventsSource, { ...options, interval: 2000 });
  }

  const { onUpdate } = options;
  let stopWatch = null;

  const getEvents = () => (typeof eventsSource === 'function' ? eventsSource() : eventsSource?.value || []);
  const getAllMarketIds = () => {
    const events = getEvents();
    if (!Array.isArray(events)) return [];
    return [...new Set(events.map((e) => e.market_id).filter(Boolean).map(String))];
  };

  const updateEventsWithOdds = (oddsData) => {
    if (!Array.isArray(oddsData) || oddsData.length === 0) return;
    const events = getEvents();
    if (!Array.isArray(events) || events.length === 0) return;
    const oddsMap = new Map();
    oddsData.forEach((odds) => {
      const id = odds.marketId ?? odds.market_id;
      if (id) oddsMap.set(String(id), odds);
    });
    events.forEach((event) => {
      const odds = event.market_id ? oddsMap.get(String(event.market_id)) : null;
      if (odds?.runners) {
        event.values = transformRunnersToValues(odds.runners);
      }
      if (odds?.status !== undefined) event.market_status = odds.status;
      if (odds?.bet_allow !== undefined) event.bet_allow = odds.bet_allow === 1 || odds.bet_allow === true;
    });
    if (onUpdate) onUpdate(events);
  };

  const handleOddsMessage = (msg) => {
    const data = msg?.data;
    if (Array.isArray(data) && data.length > 0) {
      updateEventsWithOdds(data);
    }
  };

  const unsubscribeListener = sharedWs.onOdds(handleOddsMessage);

  let hydrateInFlightKey = '';

  /** Paint cached odds immediately; one-shot HTTP only for markets still missing (true cold load). */
  const hydrateOdds = (marketIds) => {
    if (!marketIds.length) return;
    const cached = sharedWs.getCachedOddsForMarkets(marketIds);
    if (cached.length > 0) {
      updateEventsWithOdds(cached);
    }
    const cachedIds = new Set(
      cached.map((o) => String(o.marketId ?? o.market_id)).filter(Boolean)
    );
    const missing = marketIds.filter((id) => !cachedIds.has(String(id)));
    if (missing.length === 0) return;
    const key = missing.slice().sort().join(',');
    if (key === hydrateInFlightKey) return;
    hydrateInFlightKey = key;
    getLatestOdds(missing)
      .then((response) => {
        const oddsData = response?.data || response || [];
        if (Array.isArray(oddsData) && oddsData.length > 0) {
          sharedWs.cacheOdds(oddsData);
          updateEventsWithOdds(oddsData);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (hydrateInFlightKey === key) hydrateInFlightKey = '';
      });
  };

  const subscribeAndHydrate = (marketIds) => {
    if (!marketIds.length) return;
    hydrateOdds(marketIds);
    sharedWs.subscribeMarkets(marketIds);
  };

  const subscribeVisibleMarkets = () => {
    subscribeAndHydrate(getAllMarketIds());
  };

  const watchForEvents = () => {
    if (stopWatch) return;
    stopWatch = watch(
      () => getAllMarketIds().sort().join(','),
      (marketIdsKey) => {
        const marketIds = marketIdsKey ? marketIdsKey.split(',') : [];
        if (marketIds.length > 0) {
          subscribeAndHydrate(marketIds);
        }
      },
      { immediate: true }
    );
  };

  const startOddsFetching = () => {
    watchForEvents();
    subscribeVisibleMarkets();
  };

  const stopOddsFetching = () => {
    if (stopWatch) {
      stopWatch();
      stopWatch = null;
    }
    unsubscribeListener();
  };

  onUnmounted(stopOddsFetching);

  return {
    startOddsFetching,
    stopOddsFetching,
    watchForEvents,
    updateEventsWithOdds,
    transformRunnersToValues,
    getAllMarketIds,
  };
}

/**
 * WebSocket subscription for raw odds data (e.g. Bet page with useMarkets).
 * Uses the shared singleton WS connection (same socket as scorecard).
 * @param {Function} getMarketIds - Returns array of market IDs to subscribe to
 * @param {Object} options - { onData: (oddsArray) => void }
 */
export function useOddsWebSocketForMarkets(getMarketIds, options = {}) {
  const { onData } = options;

  if (!sharedWs.url) {
    return { start: () => {}, stop: () => {} };
  }

  const normalizeIds = () => {
    const raw = typeof getMarketIds === 'function' ? getMarketIds() : getMarketIds?.value || [];
    return [...new Set((Array.isArray(raw) ? raw : []).filter(Boolean).map(String))];
  };

  const applyCachedOdds = (marketIds) => {
    if (!onData || !marketIds.length) return;
    const cached = sharedWs.getCachedOddsForMarkets(marketIds);
    if (cached.length > 0) onData(cached);
  };

  const subscribeMarkets = (marketIds) => {
    if (!marketIds.length) return;
    applyCachedOdds(marketIds);
    sharedWs.subscribeMarkets(marketIds);
  };

  const handleOddsMessage = (msg) => {
    const data = msg?.data;
    if (Array.isArray(data) && data.length > 0 && onData) onData(data);
  };

  const unsubscribeListener = sharedWs.onOdds(handleOddsMessage);

  watch(
    () => normalizeIds().sort().join(','),
    (marketIdsKey) => {
      const marketIds = marketIdsKey ? marketIdsKey.split(',') : [];
      if (marketIds.length > 0) subscribeMarkets(marketIds);
    },
    { immediate: true }
  );

  const stop = () => unsubscribeListener();

  onUnmounted(stop);

  return { start: () => subscribeMarkets(normalizeIds()), stop };
}

/**
 * WebSocket subscription for binary odds data.
 * Clients subscribe with a unix timestamp; all binary markets for that day stream in.
 * @param {Ref<number>|Function} unixSource - Ref or getter returning the UTC-midnight unix timestamp
 * @param {Object} options - { onData: (markets) => void }
 */
export function useOddsWebSocketForBinary(unixSource, options = {}) {
  const { onData } = options;

  if (!sharedWs.url) {
    return { start: () => {}, stop: () => {} };
  }

  const getUnix = () => (isRef(unixSource) ? unixSource.value : (typeof unixSource === 'function' ? unixSource() : unixSource));

  const handleBinaryMessage = (msg) => {
    if (msg?.type === 'binary' && Array.isArray(msg.markets) && onData) {
      onData(msg.markets);
    }
  };

  const unsubscribeListener = sharedWs.onBinary(handleBinaryMessage);

  watch(
    () => getUnix(),
    (unix) => {
      if (unix) sharedWs.subscribeBinary(unix);
    },
    { immediate: true }
  );

  const stop = () => {
    unsubscribeListener();
    sharedWs.unsubscribeBinary();
  };

  onUnmounted(stop);

  return { start: () => sharedWs.subscribeBinary(getUnix()), stop };
}
