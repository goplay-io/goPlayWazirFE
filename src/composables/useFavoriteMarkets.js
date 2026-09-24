import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import apiServices from '@/api/services';
import { notifyFavoriteMarketsChanged, findFavoriteMarketIndex, marketIdsMatch } from '@/utils/favoriteMarketsSync';

const FAVORITES_KEY = 'favorite_markets';
const POLLING_INTERVAL = 1000;

// Reactive state
const loading = ref(true);
const error = ref(null);
const markets = ref([]);
const outcomes = ref({});
const refreshToken = ref(0);

let pollingInterval = null;
let marketIdsRef = [];

/**
 * Load favorites from localStorage
 */
const loadFavorites = () => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.error('Error loading favorites:', err);
    return {};
  }
};

/**
 * Save favorites to localStorage
 */
const saveFavorites = (favorites) => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (err) {
    console.error('Error saving favorites:', err);
  }
};

/**
 * Toggle favorite for a market
 */
const toggleFavorite = (marketId, eventId, route) => {
  if (!marketId) return;
  
  // Use passed eventId or fallback to route parameter
  const finalEventId = eventId || (route && route.params.event_id);
  if (!finalEventId) {
    console.warn('Event ID not provided and not available in route', { marketId, eventId, routeParams: route?.params });
    return;
  }

  const favorites = loadFavorites();
  const eventKey = String(finalEventId);
  const marketKey = String(marketId);
  const next = { ...(favorites || {}) };
  
  // Initialize event array if it doesn't exist
  let list = Array.isArray(next[eventKey]) ? next[eventKey].map(String) : [];
  
  // Toggle market in the array
  const idx = findFavoriteMarketIndex(list, marketKey);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push(marketKey);
  }

  // Clean up empty event arrays
  if (list.length === 0) {
    delete next[eventKey];
  } else {
    next[eventKey] = list;
  }

  saveFavorites(next);
  notifyFavoriteMarketsChanged();
  
  // Trigger a refresh
  refreshToken.value++;
  
  return list;
};

/**
 * Check if a market is favorited
 */
const isFavorited = (marketId, eventId, route) => {
  // Access refreshToken to make this reactive
  refreshToken.value;
  
  const favorites = loadFavorites();
  
  // Use passed eventId or fallback to route parameter
  const finalEventId = eventId || (route && route.params.event_id);
  if (!finalEventId) return false;
  
  const eventKey = String(finalEventId);
  const marketKey = String(marketId);
  const list = Array.isArray(favorites[eventKey]) ? favorites[eventKey] : [];
  return list.some((id) => marketIdsMatch(id, marketKey));
};

/**
 * Stop polling
 */
const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

/**
 * Fetch bet details and outcomes
 */
const fetchBetDetails = async (eventIds) => {
  try {
    const outcomeData = {};

    for (const eventId of eventIds) {
      try {
        const betResponse = await apiServices.event.getBetDetails(eventId, { bet: false });
        const betData = betResponse?.data?.data || betResponse?.data;
        const eventOutcomes = betData?.outcomes || {};
        Object.assign(outcomeData, eventOutcomes);
      } catch (err) {
        console.error(`Failed to fetch outcomes for event ${eventId}:`, err);
      }
    }

    outcomes.value = outcomeData;
  } catch (err) {
    console.error('Failed to fetch bet details:', err);
  }
};

/**
 * Load all favorite markets
 */
const loadMarkets = async () => {
  loading.value = true;
  error.value = null;

  try {
    const favorites = loadFavorites();
    const marketsList = [];
    const eventIds = new Set();

    // Convert favorites to markets array
    Object.entries(favorites).forEach(([eventId, marketIds]) => {
      if (Array.isArray(marketIds)) {
        marketIds.forEach(marketId => {
          marketsList.push({ eventId, marketId });
          eventIds.add(eventId);
        });
      }
    });

    if (marketsList.length === 0) {
      markets.value = [];
      stopPolling();
      loading.value = false;
      return;
    }

    // Fetch market details from API
    const detailedMarkets = [];
    for (const { eventId, marketId } of marketsList) {
      try {
        const response = await apiServices.event.getBetDetails(eventId, { bet: false });
        const eventData = response?.data?.data || response?.data || {};

        // Find the market with matching ID
        const matchOdds = eventData?.matchOdds;
        if (matchOdds && String(matchOdds.market_id) === String(marketId)) {
          detailedMarkets.push({
            eventId: String(eventId),
            eventName: eventData?.eventName || eventData?.name || '',
            market: matchOdds,
            marketType: 'MATCH_ODDS'
          });
        }

        // Check bookmakers
        const bookmakers = eventData?.bookmakers || {};
        Object.entries(bookmakers).forEach(([key, bm]) => {
          if (bm && String(bm.market_id) === String(marketId)) {
            const bettingType = String(bm.betting_type || '').toUpperCase();
            detailedMarkets.push({
              eventId: String(eventId),
              eventName: eventData?.eventName || eventData?.name || '',
              market: bm,
              marketType: 'BOOKMAKER',
              bettingType
            });
          }
        });

        // Check fancy markets
        const fancy = eventData?.fancy || [];
        fancy.forEach(f => {
          if (f && String(f.market_id) === String(marketId)) {
            detailedMarkets.push({
              eventId: String(eventId),
              eventName: eventData?.eventName || eventData?.name || '',
              market: f,
              marketType: 'FANCY'
            });
          }
        });

        // Check other markets
        const otherMarkets = eventData?.otherMarkets || {};
        Object.entries(otherMarkets).forEach(([key, om]) => {
          if (om && String(om.market_id) === String(marketId)) {
            detailedMarkets.push({
              eventId: String(eventId),
              eventName: eventData?.eventName || eventData?.name || '',
              market: om,
              marketType: 'OTHER_MARKETS'
            });
          }
        });
      } catch (err) {
        console.error(`Failed to fetch market details for event ${eventId}:`, err);
      }
    }

    markets.value = detailedMarkets;
    marketIdsRef = detailedMarkets.map(m => m.market.market_id).filter(Boolean);

    // Fetch initial outcomes
    await fetchBetDetails(Array.from(eventIds));

    // Start polling
    startPolling();
  } catch (err) {
    console.error('Error loading markets:', err);
    error.value = err.message || 'Failed to load markets';
  } finally {
    loading.value = false;
  }
};

/**
 * Start polling for odds updates
 */
const startPolling = () => {
  stopPolling();

  const fetchOdds = async () => {
    try {
      if (marketIdsRef.length === 0) {
        stopPolling();
        return;
      }

      const res = await apiServices.event.getLatestOdds(marketIdsRef);
      const oddsData = res?.data?.data || res?.data || [];

      markets.value = markets.value.map(item => {
        const oddsUpdate = Array.isArray(oddsData)
          ? oddsData.find(o => {
              const id1 = String(o?.market_id || o?.marketId);
              const id2 = String(item.market.market_id);
              return id1 === id2;
            })
          : null;

        if (!oddsUpdate) return item;

        // Update market with new odds
        if (item.marketType === 'FANCY') {
          const marketIdKey = String(oddsUpdate.marketId || oddsUpdate.market_id || item.market.market_id);
          let runnerData = null;

          if (oddsUpdate.runners && typeof oddsUpdate.runners === 'object') {
            runnerData =
              oddsUpdate.runners[marketIdKey] ||
              (Object.keys(oddsUpdate.runners).length > 0
                ? Object.values(oddsUpdate.runners)[0]
                : null);
          }

          if (!runnerData) return item;

          const backTop = runnerData?.back?.[0];
          const layTop = runnerData?.lay?.[0];
          const vals = runnerData?.values || [];

          const bestBack =
            backTop?.price ?? runnerData?.bestBack ?? runnerData?.bb ?? runnerData?.priceBack ?? vals[4] ?? vals[6];
          const bestLay =
            layTop?.price ?? runnerData?.bestLay ?? runnerData?.bl ?? runnerData?.priceLay ?? vals[2] ?? vals[8];
          const sizeBack = backTop?.size ?? runnerData?.sizeBack ?? vals[5] ?? vals[7];
          const sizeLay = layTop?.size ?? runnerData?.sizeLay ?? vals[3] ?? vals[9];

          return {
            ...item,
            market: {
              ...item.market,
              priceBack: bestBack,
              priceLay: bestLay,
              sizeBack,
              sizeLay,
              back: runnerData.back,
              lay: runnerData.lay,
              values: runnerData.values,
              status: runnerData?.status,
              runners: [
                {
                  ...item.market,
                  priceBack: bestBack,
                  priceLay: bestLay,
                  sizeBack,
                  sizeLay,
                  back: runnerData.back,
                  lay: runnerData.lay,
                  values: runnerData.values,
                  status: runnerData?.status,
                },
              ],
            },
          };
        }

        // For non-fancy markets, update runners
        if (oddsUpdate.runners) {
          const updatedRunners = item.market.runners.map(runner => {
            const oddsRunner = Array.isArray(oddsUpdate.runners)
              ? oddsUpdate.runners.find(
                  r =>
                    String(r?.selection_id) === String(runner?.selection_id) ||
                    String(r?.runner_id) === String(runner?.runner_id)
                )
              : null;

            if (!oddsRunner) return runner;

            return {
              ...runner,
              back: oddsRunner.back,
              lay: oddsRunner.lay,
              values: oddsRunner.values,
              status: oddsRunner?.status,
              ballRunning: oddsRunner?.ballRunning,
              priceBack: oddsRunner?.priceBack ?? oddsRunner?.back?.[0]?.price,
              priceLay: oddsRunner?.priceLay ?? oddsRunner?.lay?.[0]?.price,
              sizeBack: oddsRunner?.sizeBack ?? oddsRunner?.back?.[0]?.size,
              sizeLay: oddsRunner?.sizeLay ?? oddsRunner?.lay?.[0]?.size,
            };
          });

          return {
            ...item,
            market: {
              ...item.market,
              runners: updatedRunners,
            },
          };
        }

        return item;
      });
    } catch (err) {
      console.error('Error fetching odds:', err);
    }
  };

  // Fetch immediately
  fetchOdds();

  // Then poll
  pollingInterval = setInterval(fetchOdds, POLLING_INTERVAL);
};

/**
 * Initialize - load markets and set up polling
 */
const init = async () => {
  await loadMarkets();
};

/**
 * Cleanup
 */
const cleanup = () => {
  stopPolling();
};

/**
 * Computed for grouped markets by event
 */
const groupedMarkets = computed(() => {
  const groups = {};

  markets.value.forEach(item => {
    const eventId = item.eventId;
    if (!groups[eventId]) {
      groups[eventId] = {
        eventId,
        eventName: item.eventName,
        markets: [],
      };
    }
    groups[eventId].markets.push(item);
  });

  return groups;
});

export default function useFavoriteMarkets() {
  const route = useRoute();
  
  return {
    loading,
    error,
    markets,
    outcomes,
    groupedMarkets,
    toggleFavorite: (marketId, eventId) => toggleFavorite(marketId, eventId, route),
    isFavorited: (marketId, eventId) => isFavorited(marketId, eventId, route),
    loadMarkets,
    init,
    cleanup,
    startPolling,
    stopPolling,
  };
}
