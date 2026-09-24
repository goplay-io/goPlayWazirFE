import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBetStore } from '@/stores/bet';
import { getEventById } from '@/api/event/events.js';
import { fetchButtons } from '@/api/user/profile.js';
import { useEvent } from '@/composables/useEvent';
import { useMarkets } from '@/composables/useMarkets';
import { useMultiMarketFavorites } from './useMultiMarketFavorites';
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar';
import { getValidPinnedMarketIds, getValidMarketCount } from '@/utils/multiMarketUtils';

/**
 * Composable for loading and managing multi-market event data
 */
export function useMultiMarketEvents() {
  const router = useRouter();
  const authStore = useAuthStore();
  const betStore = useBetStore();
  const { showError } = useSnackbar();
  const { getFavoriteMarketIds, getFavoriteEventIds, removeFavoriteEvent, saveFavorites, loadFavorites } = useMultiMarketFavorites();

  const loading = ref(true);
  const eventDataList = ref([]);
  const buttons = ref([]);

  /**
   * Load event data and markets for a single event
   * @param {string|number} eventId - Event ID
   * @returns {Promise<Object>} Event data object
   */
  const loadEventData = async (eventId) => {
    try {
      const eventRes = await getEventById(eventId);
      const event = eventRes?.data?.event ?? eventRes?.event ?? eventRes?.data ?? eventRes;

      if (!event) {
        throw new Error('Event not found');
      }

      const favoriteMarketIds = getFavoriteMarketIds(eventId);

      const eventComposable = useEvent();
      const marketsComposable = useMarkets();

      const eventData = {
        eventId,
        event,
        favoriteMarketIds,
        eventComposable,
        marketsComposable,
        event: { value: event },
        matchOddsData: marketsComposable.matchOddsData,
        bookMakersData: marketsComposable.bookMakersData,
        finalFancyData: marketsComposable.finalFancyData,
        otherMarketData: marketsComposable.otherMarketData,
      };

      if (event?.match_odds) {
        marketsComposable.constructMatchOdds?.(event);
      }
      marketsComposable.constructBookmakers?.(event);
      marketsComposable.constructFancyTabs?.(event);
      marketsComposable.constructFancy?.(event);
      marketsComposable.constructOtherMarkets?.(event);

      eventData.matchOddsData = marketsComposable.matchOddsData;
      eventData.bookMakersData = marketsComposable.bookMakersData;
      eventData.fancyTabs = marketsComposable.fancyTabs;
      eventData.finalFancyData = marketsComposable.finalFancyData;
      eventData.otherMarketData = marketsComposable.otherMarketData;
      eventData.event = event;

      const pinnedIds = getValidPinnedMarketIds(eventData);
      const previousIds = favoriteMarketIds.map(String).sort().join(',');
      const nextIds = pinnedIds.slice().sort().join(',');
      if (previousIds !== nextIds) {
        const allFavorites = loadFavorites();
        const eventKey = String(eventId);
        if (pinnedIds.length === 0) {
          delete allFavorites[eventKey];
        } else {
          allFavorites[eventKey] = pinnedIds;
        }
        saveFavorites(allFavorites);
      }
      eventData.favoriteMarketIds = pinnedIds;

      if (getValidMarketCount(eventData) === 0) {
        return null;
      }

      return eventData;
    } catch (error) {
      const status = error?.response?.status;
      if (status === 404 || status === 410) {
        console.warn(`Multi-market: event ${eventId} is no longer available (${status}); removing stale favorites.`);
        removeFavoriteEvent(eventId);
        return null;
      }
      console.error(`Error loading event ${eventId}:`, error);
      return null;
    }
  };

  /**
   * Load all favorite events
   */
  const loadAllFavorites = async () => {
    loading.value = true;

    try {
      if (!authStore.isAuthenticated) {
        router.push('/login');
        return;
      }

      // Check if user is demo - skip fetching buttons and bet history for demo users
      // Block API calls for all demo users (both preview and full demo)
      const isDemoUser = authStore.isDemoUser;

      const favoriteEventIds = getFavoriteEventIds();

      if (favoriteEventIds.length === 0) {
        eventDataList.value = [];
        loading.value = false;
        return;
      }

      // Fetch event data for all events (missing / ended events return null, others still load)
      const promises = [
        ...favoriteEventIds.map(eventId => loadEventData(eventId)),
      ];

      // Only fetch buttons and bet history for non-demo users
      // IMPORTANT: Do not call these APIs for demo users to prevent errors
      if (!isDemoUser) {
        promises.push(fetchButtons().catch(e => {
          console.warn('Buttons API failed, using static fallback:', e);
          return null;
        }));
        promises.push(
          ...favoriteEventIds.map(async (eventId) => {
            try {
              const result = await betStore.refreshBetHistory(eventId);
              return { eventId, betHistory: result };
            } catch (error) {
              console.error(`Error fetching bet history for event ${eventId}:`, error);
              return { eventId, betHistory: { bets: [], outcomes: {} } };
            }
          })
        );
      }
      
      const results = await Promise.all(promises);

      // Set buttons - empty array for demo users (no API call made)
      if (isDemoUser) {
        buttons.value = [];
      } else {
        // Extract buttons from position: numEvents (after all loadEventData calls)
        const buttonsRes = results[favoriteEventIds.length];
        buttons.value = buttonsRes?.buttons || [];
      }

      // Extract event data from first results; null = failed load (404 handled in loadEventData)
      const eventDataResults = results.slice(0, favoriteEventIds.length);

      // Extract bet history results (after buttons) - only for non-demo users
      let betHistoryResults = [];
      if (!isDemoUser) {
        betHistoryResults = results.slice(favoriteEventIds.length + 1);
      }

      const validEventDataList = eventDataResults.filter((ed) => ed != null);

      // Initialize bet store from first event that actually loaded
      if (validEventDataList.length > 0) {
        betStore.initializeBet(validEventDataList[0].eventId);
      }

      // Combine event data with their respective bet history
      eventDataList.value = validEventDataList.map((eventData) => {
        const betHistoryResult = betHistoryResults.find(bh => String(bh.eventId) === String(eventData.eventId));
        const bets = isDemoUser ? [] : (betHistoryResult?.betHistory?.bets || []);
        console.info(`✅ Stored ${bets.length} bets for event ${eventData.eventId}`);
        return {
          ...eventData,
          betHistory: bets,
          betOutcomes: isDemoUser ? {} : (betHistoryResult?.betHistory?.outcomes || {})
        };
      });
    } catch (error) {
      console.error('Error loading favorites:', error);
      showError(error.message || 'Failed to load favorite markets');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update favorite market IDs for an event in the eventDataList
   * @param {string|number} eventId - Event ID
   * @param {string[]} favoriteMarketIds - Array of favorite market IDs
   */
  const updateEventFavoriteMarkets = (eventId, favoriteMarketIds) => {
    const eventDataIndex = eventDataList.value.findIndex(
      ed => String(ed.eventId) === String(eventId)
    );
    if (eventDataIndex !== -1) {
      eventDataList.value[eventDataIndex].favoriteMarketIds = favoriteMarketIds;
    }
  };

  /**
   * Remove event from eventDataList if it has no favorites
   * @param {string|number} eventId - Event ID
   */
  const removeEventIfNoFavorites = (eventId) => {
    eventDataList.value = eventDataList.value.filter(
      ed => String(ed.eventId) !== String(eventId)
    );
  };

  return {
    loading,
    eventDataList,
    buttons,
    loadEventData,
    loadAllFavorites,
    updateEventFavoriteMarkets,
    removeEventIfNoFavorites,
  };
}

