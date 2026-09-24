<script setup>
import { ref, computed, onMounted, onUnmounted, onActivated, watch, nextTick } from 'vue';
import { useRoute, onBeforeRouteLeave } from 'vue-router';
import { useI18n } from 'vue-i18n';
import useDevices from '@/composables/useDevices';
import { useBetStore } from '@/stores/bet';
import { useAuthStore } from '@/stores/auth';
import { useOneClickBettingStore } from '@/stores/oneClickBetting';
import SportsBetSlip from '@/views/sports/Bet/SportsBetSlip.vue';
import FloatingBetSlip from '@/views/sports/Bet/FloatingBetSlip.vue';
import Loading from '@/components/Loading.vue';
import EventCard from './EventCard.vue';
import BetHistory from '@/components/BetHistory.vue';
import { useMultiMarketFavorites } from '@/composables/useMultiMarketFavorites';
import { useMultiMarketEvents } from '@/composables/useMultiMarketEvents';
import { useOddsWebSocketForMarkets } from '@/composables/useOddsWebSocket';
import { useInlineBetSlipHost } from '@/composables/useInlineBetSlipHost';
import EventData from '@/utils/eventData';
import { isEventVisibleInMultiMarket, getValidMarketCount } from '@/utils/multiMarketUtils';
import { FAVORITE_MARKETS_CHANGED_EVENT, FAVORITE_MARKETS_STORAGE_KEY, hasAnyStoredFavorites, onFavoriteMarketsChanged } from '@/utils/favoriteMarketsSync';

/** Dedicated host id so inline slip clicks are ignored by captureOddClick (parity with bettingClientVue). */
const MULTI_MARKET_INLINE_SLIP_HOST_ID = 'multi-market-inline-bet-slip-host';

const { isMobile } = useDevices();
const betStore = useBetStore();
const authStore = useAuthStore();
const oneClickStore = useOneClickBettingStore();

const { t } = useI18n();
const route = useRoute();

// Composables
const { toggleFavorite, isFavorite, getFavoriteMarketIds, getFavoriteEventIds, removeFavoriteEvent } = useMultiMarketFavorites();
const {
  loading,
  eventDataList,
  buttons,
  loadAllFavorites,
  removeEventIfNoFavorites,
} = useMultiMarketEvents();

// Single WebSocket subscription for all events — properly scoped to this component.
// Collects all market IDs across every loaded event and routes incoming odds to
// each event's marketsComposable individually.
useOddsWebSocketForMarkets(
  () => {
    const ids = [];
    for (const ed of eventDataList.value) {
      if (typeof ed.marketsComposable?.getAllMarketIds === 'function') {
        ids.push(...ed.marketsComposable.getAllMarketIds());
      }
    }
    return ids;
  },
  {
    onData: (oddsArray) => {
      for (const ed of eventDataList.value) {
        if (typeof ed.marketsComposable?.updateMarketDataFromOdds === 'function') {
          ed.marketsComposable.updateMarketDataFromOdds(oddsArray);
        }
      }
      pruneStaleMultiMarketEvents();
    },
  }
);

// State
const slipOpen = ref(!isMobile.value);
const showInlineSlip = ref(false);
const {
  inlineSlipHostEl,
  inlineSlipTarget,
  removeInlineSlipHost,
  mountInlineSlipHostBelowButton,
  captureOddClick,
  handleCashoutSlipTarget,
  scrollIntoView: scrollInlineSlipIntoView,
} = useInlineBetSlipHost({ hostId: MULTI_MARKET_INLINE_SLIP_HOST_ID });
const showBetHistory = ref(false);
const bet_processing = ref(false);
const refreshKey = ref(0); // For forcing re-renders when favorites change
const isRefreshing = ref(false); // Guard to prevent duplicate refreshes
let pendingFavoriteSync = false;
/** Avoid tearing down / re-teleporting the slip when the same odd is already open (bettingClientVue parity). */
const mountedBetKey = ref(null);
const closeInlineSlip = () => {
  showInlineSlip.value = false;
  mountedBetKey.value = null;
  removeInlineSlipHost();
  betStore.clearBetSelection();
};

const handleButtonsUpdate = (updatedButtons) => {
  buttons.value = updatedButtons || [];
};

// Helper: Find event by market_id
const findEventByMarketId = (marketId) => {
  return eventDataList.value.find(ed =>
    ed?.event?.market_ids && ed.event.market_ids.includes(marketId)
  );
};

// Helper: Get event ID from bet object or find by market_id
const getEventIdFromBet = (bet) => {
  if (bet?.event_id) {
    return bet.event_id;
  }
  if (bet?.market_id) {
    const eventData = findEventByMarketId(bet.market_id);
    return eventData?.eventId || null;
  }
  return null;
};

// Helper: Refresh bet history for an event after bet placement
const refreshEventData = async (eventId) => {
  const eventData = eventDataList.value.find(ed =>
    String(ed.eventId) === String(eventId)
  );

  if (!eventData) {
    return;
  }

  // Check if user is demo - skip fetching bet history for demo users
  // Block API calls for all demo users (both preview and full demo)
  const isDemoUser = authStore.isDemoUser;

  // Only refresh bet history for non-demo users
  // IMPORTANT: Do not call this API for demo users to prevent errors
  if (!isDemoUser) {
    try {
      const betHistoryResult = await betStore.refreshBetHistory(eventId);
      if (betHistoryResult) {
        eventData.betHistory = betHistoryResult.bets || [];
        eventData.betOutcomes = betHistoryResult.outcomes || {};
      }
    } catch (error) {
      // Silently handle error - bet history will refresh on next poll
    }
  }
};

// Aggregate bet history from all events
const aggregatedBetHistory = computed(() => {
  const allBets = [];
  eventDataList.value.forEach(eventData => {
    if (eventData.betHistory && Array.isArray(eventData.betHistory)) {
      // Add eventId and eventName to each bet for grouping
      const betsWithEventInfo = eventData.betHistory.map(bet => {
        const displayName = EventData.getEventName(eventData.event);
        return {
          ...bet,
          eventId: eventData.eventId,
          event_name:
            displayName && displayName !== 'Unknown event'
              ? displayName
              : (eventData.event?.event_name || eventData.eventName || 'Unknown Event'),
        };
      });
      allBets.push(...betsWithEventInfo);
    }
  });

  // Remove duplicates based on bet ID
  const uniqueBetsMap = new Map();
  allBets.forEach((bet, index) => {
    // Prefer bet.id if it exists, otherwise create a composite key
    const key = bet.id
      ? String(bet.id)
      : `${bet.eventId || bet.event_id || ''}_${bet.market_id}_${bet.runner_id}_${bet.stake}_${bet.odd}_${bet.created_at || bet.createdAt || index}`;

    if (!uniqueBetsMap.has(key)) {
      uniqueBetsMap.set(key, bet);
    }
  });

  return Array.from(uniqueBetsMap.values());
});

// Handle favorite toggle from child components
const handleToggleFavorite = (marketId, eventId) => {
  if (!marketId || !eventId) return;

  toggleFavorite(marketId, eventId);

  const eventDataIndex = eventDataList.value.findIndex(
    (ed) => String(ed.eventId) === String(eventId),
  );

  if (eventDataIndex === -1) {
    syncFavoritesFromStorage();
    return;
  }

  const storedIds = getFavoriteMarketIds(eventId).map(String);
  eventDataList.value[eventDataIndex].favoriteMarketIds = storedIds;

  if (storedIds.length === 0 || getValidMarketCount(eventDataList.value[eventDataIndex]) === 0) {
    removeEventIfNoFavorites(eventId);
    if (storedIds.length === 0) {
      removeFavoriteEvent(eventId);
    }
  }

  refreshKey.value++;
};

const pruneStaleMultiMarketEvents = () => {
  let changed = false;

  for (const eventData of [...eventDataList.value]) {
    const eventId = eventData.eventId;
    const storedIds = getFavoriteMarketIds(eventId);
    const validCount = getValidMarketCount(eventData);

    if (storedIds.length > 0 && validCount === 0) {
      removeFavoriteEvent(eventId);
      removeEventIfNoFavorites(eventId);
      changed = true;
    } else if (storedIds.length === 0) {
      removeEventIfNoFavorites(eventId);
      changed = true;
    }
  }

  if (changed) {
    refreshKey.value++;
  }
};

const visibleEventDataList = computed(() => {
  refreshKey.value;
  return eventDataList.value.filter((eventData) => isEventVisibleInMultiMarket(eventData));
});

const showEmptyState = computed(() => {
  refreshKey.value;
  return !hasAnyStoredFavorites() || visibleEventDataList.value.length === 0;
});

const handleStorageFavoriteChange = (event) => {
  if (event?.key != null && event.key !== FAVORITE_MARKETS_STORAGE_KEY) return;
  syncFavoritesFromStorage();
};

const purgeEventsNotInStorage = () => {
  const storedSet = new Set(getFavoriteEventIds().map(String));
  const before = eventDataList.value.length;
  eventDataList.value = eventDataList.value.filter((ed) =>
    storedSet.has(String(ed.eventId)),
  );
  return before !== eventDataList.value.length;
};

const syncFavoritesFromStorage = async () => {
  if (isRefreshing.value) {
    pendingFavoriteSync = true;
    return;
  }
  isRefreshing.value = true;
  try {
    purgeEventsNotInStorage();

    const storedEventIds = getFavoriteEventIds();

    if (storedEventIds.length === 0) {
      eventDataList.value = [];
      loading.value = false;
      refreshKey.value++;
      return;
    }

    for (const eventData of eventDataList.value) {
      eventData.favoriteMarketIds = getFavoriteMarketIds(eventData.eventId).map(String);
    }

    eventDataList.value = eventDataList.value.filter(
      (eventData) => isEventVisibleInMultiMarket(eventData),
    );

    pruneStaleMultiMarketEvents();

    const remainingEventIds = getFavoriteEventIds();
    const loadedIds = new Set(eventDataList.value.map((ed) => String(ed.eventId)));
    const hasMissingEvents = remainingEventIds.some((id) => !loadedIds.has(String(id)));

    if (hasMissingEvents || (remainingEventIds.length > 0 && eventDataList.value.length === 0)) {
      await loadAllFavorites();
    }

    pruneStaleMultiMarketEvents();
    refreshKey.value++;
  } finally {
    isRefreshing.value = false;
    if (pendingFavoriteSync) {
      pendingFavoriteSync = false;
      await syncFavoritesFromStorage();
    }
  }
};

watch(
  () => route.name,
  (name) => {
    if (name === 'multi-market') {
      syncFavoritesFromStorage();
    }
  },
);
watch(() => betStore.bet?.odd, (newOdd) => {
  if (!newOdd) {
    if (betStore.bet_status !== 'success' && isMobile.value) {
      showInlineSlip.value = false;
    }
    if (isMobile.value) {
      removeInlineSlipHost();
    }
    mountedBetKey.value = null;
    return;
  }

  if (oneClickStore.isActive && !oneClickStore.editMode) return;

  if (isMobile.value) {
    const betKey = `${betStore.bet?.market_id}-${betStore.bet?.runner_id}-${betStore.bet?.is_back}`;
    if (showInlineSlip.value && betKey === mountedBetKey.value) return;

    mountedBetKey.value = betKey;
    showInlineSlip.value = false;
    nextTick(() => {
      const mounted = mountInlineSlipHostBelowButton();
      if (mounted) {
        showInlineSlip.value = true;
      }
    });
  } else {
    slipOpen.value = true;
  }
});

// Watch bet selection to track event ID for bet placement
watch(
  () => [betStore.bet?.odd, betStore.selectedRunnerId],
  ([newOdd]) => {
    if (newOdd) {
      const newBet = betStore.bet;
      const eventIdToSet = getEventIdFromBet(newBet);

      if (eventIdToSet) {
        betStore.currentEventId = eventIdToSet;
        // Update the bet object's event_id using nextTick to avoid reactivity issues
        nextTick(() => {
          if (betStore.bet && !betStore.bet.event_id) {
            betStore.bet.event_id = eventIdToSet;
          }
        });
      }
    }
  });

// Watch for successful bet placement and refresh market data
watch(() => betStore.bet_status, async (newStatus, oldStatus) => {
  // Only process if status changed to 'success' and we're not already refreshing
  if (newStatus === 'success' && oldStatus !== 'success' && !isRefreshing.value) {
    isRefreshing.value = true; // Set guard to prevent duplicate refreshes

    try {
      // Get eventId from bet or find by market_id
      const eventIdToRefresh = betStore.currentEventId || getEventIdFromBet(betStore.bet);

      if (!eventIdToRefresh) {
        return;
      }

      // Update the bet object and store for future use
      if (betStore.bet && !betStore.bet.event_id) {
        betStore.bet.event_id = eventIdToRefresh;
      }
      if (!betStore.currentEventId) {
        betStore.currentEventId = eventIdToRefresh;
      }

      // Refresh market data and bet history
      await refreshEventData(eventIdToRefresh);
    } finally {
      // Reset guard after a short delay to allow bet_status to reset
      setTimeout(() => {
        isRefreshing.value = false;
      }, 2000);
    }
  }
});

// Watch mobile state
watch(isMobile, (newIsMobile) => {
  if (newIsMobile && slipOpen.value) {
    if (!betStore.bet || !betStore.bet.odd) {
      slipOpen.value = false;
    }
  }
});

const toggleSlip = () => {
  slipOpen.value = !slipOpen.value;
};

let unsubscribeFavoriteChanges = null;

function setMultiMarketBodyClass(active) {
  document.body.classList.toggle('multi-market-page-active', active);
}

onMounted(async () => {
  setMultiMarketBodyClass(true);
  window.addEventListener(FAVORITE_MARKETS_CHANGED_EVENT, syncFavoritesFromStorage);
  window.addEventListener('storage', handleStorageFavoriteChange);
  unsubscribeFavoriteChanges = onFavoriteMarketsChanged(syncFavoritesFromStorage);
  await syncFavoritesFromStorage();
});

onActivated(() => {
  setMultiMarketBodyClass(true);
  syncFavoritesFromStorage();
});

onBeforeRouteLeave(() => {
  setMultiMarketBodyClass(false);
});

onUnmounted(() => {
  setMultiMarketBodyClass(false);
  window.removeEventListener(FAVORITE_MARKETS_CHANGED_EVENT, syncFavoritesFromStorage);
  window.removeEventListener('storage', handleStorageFavoriteChange);
  unsubscribeFavoriteChanges?.();
  unsubscribeFavoriteChanges = null;
  removeInlineSlipHost();
});
</script>

<template>
  <div class="bet-page-container" :key="refreshKey">
    <div class="bet-main-layout">
      <div class="bet-markets-section">
        <div class="bet-header-fixed">
          <div
            class="bet-header-content multi-market-header tw-flex tw-items-center tw-justify-between tw-gap-2 tw-px-3 tw-py-2 sm:tw-px-4 md:tw-px-4 md:tw-py-2.5"
          >
            <div class="multi-market-page-heading tw-flex tw-min-w-0 tw-items-center tw-gap-2">
              <v-icon class="multi-market-page-heading__icon tw-flex-shrink-0" size="22" aria-hidden="true">
                mdi-view-list-outline
              </v-icon>
              <h1
                class="multi-market-title tw-truncate tw-text-sm tw-font-bold tw-leading-tight sm:tw-text-base md:tw-text-[15px]"
              >
                {{ t('pages.multiMarket.title') }}
              </h1>
            </div>
            <div class="tw-flex tw-items-center tw-gap-2">
              <v-btn
                v-if="isMobile"
                variant="tonal"
                color="primary"
                size="x-small"
                class="tw-relative tw-rounded tw-px-1.5 tw-min-w-0"
                @click="showBetHistory = !showBetHistory"
              >
                <span class="tw-text-xs">Bets</span>
              </v-btn>
            </div>
          </div>
        </div>

        <div
          class="bet-markets-scrollable"
          @click.capture="captureOddClick"
          @cashout-slip-target="handleCashoutSlipTarget"
        >
          <div v-if="loading" class="bet-markets-loading">
            <Loading minHeight="360px" />
          </div>

          <template v-else>
            <div
              v-if="showEmptyState"
              class="tw-flex tw-flex-col tw-items-center tw-justify-center tw-min-h-[280px] tw-gap-2 tw-px-4"
            >
              <v-icon size="48" class="multi-market-empty-icon">mdi-star-outline</v-icon>
              <div class="multi-market-empty-title tw-text-center tw-text-base sm:tw-text-lg md:tw-text-xl tw-font-semibold">
                {{ t('pages.multiMarket.noMarketsFound') }}
              </div>
              <div class="multi-market-empty-hint tw-text-center tw-text-xs sm:tw-text-sm">
                Open any event and tap the star icon on a market to add it here.
              </div>
            </div>

            <div v-else class="multi-market-events-list tw-flex tw-flex-col tw-gap-2 md:tw-gap-3">
              <EventCard
                v-for="eventData in visibleEventDataList"
                :key="eventData.eventId"
                :eventData="eventData"
                :betStore="betStore"
                :isFavorite="isFavorite"
                :onToggleFavorite="handleToggleFavorite"
                :refreshKey="refreshKey"
              />
            </div>
          </template>
        </div>
      </div>

      <div v-if="!isMobile" class="bet-slip-fixed">
        <SportsBetSlip :slipOpen="slipOpen" :toggleSlip="toggleSlip" :bet_error="betStore.bet_error"
          :betAllow="true" :bet="betStore.bet" :buttons="buttons" :changeAmount="betStore.changeAmount"
          :placeBet="betStore.placeBet" :betHistory="aggregatedBetHistory" :minAmount="betStore.minAmount"
          :maxAmount="betStore.maxAmount" :groupByEvent="true" v-model:bet_status="betStore.bet_status"
          v-model:bet_processing="bet_processing" v-model:showBetHistory="showBetHistory" @update:buttons="handleButtonsUpdate" />
      </div>

    </div>

      <!-- Mobile inline bet slip -->
      <Teleport
        v-if="isMobile && showInlineSlip && inlineSlipTarget && betStore.bet && (!oneClickStore.isActive || oneClickStore.editMode)"
        :to="inlineSlipTarget"
      >
        <FloatingBetSlip
          inline
          :key="`${betStore.bet?.market_id}-${betStore.bet?.runner_id}-${betStore.bet?.is_back}`"
          :bet_error="betStore.bet_error"
          :betAllow="true"
          :bet="betStore.bet"
          :buttons="buttons"
          :changeAmount="betStore.changeAmount"
          :placeBet="betStore.placeBet"
          :minAmount="betStore.minAmount"
          :maxAmount="betStore.maxAmount"
          v-model:bet_status="betStore.bet_status"
          v-model:bet_processing="bet_processing"
          @close="closeInlineSlip"
          @update:buttons="handleButtonsUpdate"
          @inline-mounted="scrollInlineSlipIntoView"
        />
      </Teleport>

    <!-- Mobile Bet History Overlay (explicit light chrome — theme tokens are tuned for dark nav and read as white-on-white here) -->
    <v-overlay v-model="showBetHistory" v-if="isMobile" class="tw-z-50 mm-bet-history-overlay" persistent>
      <div class="mm-bet-history-sheet tw-w-screen tw-h-screen tw-flex tw-flex-col tw-bg-white">
        <!-- Header -->
        <div
          class="theme-heading-bar tw-flex tw-shrink-0 tw-items-center tw-justify-between tw-border-b tw-border-[#d9d9d9] tw-px-3 tw-py-2">
          <span class="theme-heading-bar__title tw-text-sm">{{ t('pages.multiMarket.betHistory') }}</span>
          <v-btn
            icon
            variant="text"
            density="comfortable"
            aria-label="Close"
            class="mm-bet-history-close"
            @click="showBetHistory = false"
          >
            <v-icon size="22">mdi-close</v-icon>
          </v-btn>
        </div>
        <!-- Content -->
        <div class="tw-flex-1 tw-overflow-y-auto tw-bg-white tw-px-0 tw-pb-4">
          <BetHistory
            :betHistory="aggregatedBetHistory"
            :groupByEvent="true"
            :fullBleed="true"
            class="tw-border-none tw-shadow-none tw-h-full"
          />
        </div>
      </div>
    </v-overlay>

  </div>
</template>

<style scoped>
/* ============================================
   FIXED LAYOUT - Only events area scrolls
   ============================================ */

/* Main page container - fills available space, no scroll */
.bet-page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
  background-color: transparent !important;
  background: none !important;
}

/* Main layout - horizontal flex */
.bet-main-layout {
  flex: 1;
  display: flex;
  overflow: hidden !important;
  min-height: 0;
  background-color: transparent !important;
  background: none !important;
  /* Important for flex children to shrink */
}


/* Left side - events section */
.bet-markets-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
  min-width: 0;
  background-color: transparent !important;
  background: none !important;
  /* Prevent flex item from overflowing */
}

/* Header - fixed at top of events section */
.bet-header-fixed {
  flex-shrink: 0;
  background-color: transparent !important;
}

.bet-header-content {
  background-color: transparent !important;
  background: none !important;
}

/* Theme variables on this page resolve to white-on-white, so paint the page
   header and empty state explicitly to keep the multi-market page readable. */
.multi-market-header {
  border-bottom: 1px solid #6b7280;
  background: linear-gradient(to bottom, #d1d1d1, #e8e8e8);
}

.multi-market-page-heading__icon {
  color: #ffffff !important;
  opacity: 0.9;
}

.multi-market-title {
  color: #ffffff !important;
  font-family: inherit;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.multi-market-empty-icon {
  color: #f26c20 !important;
}

.multi-market-empty-title {
  color: #ffffff !important;
}

.multi-market-empty-hint {
  color: #5b5b5b !important;
  max-width: 320px;
  line-height: 1.4;
}

/* Events container - ONLY THIS SCROLLS */
.bet-markets-scrollable {
  flex: 1;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  -webkit-overflow-scrolling: touch;
  padding: 4px;
  min-height: 0;
  background-color: transparent !important;
  background: none !important;
  /* Important for scrolling to work */
}

/* Right side - Bet slip column */
.bet-slip-fixed {
  flex-shrink: 0;
  overflow-y: auto;
  border-left: 1px solid var(--color-border, #e5e7eb);
  background-color: var(--color-surface);
  padding: 0 2px 8px 0;
  box-sizing: border-box;
}

/* Custom scrollbar for events area */
.bet-markets-scrollable::-webkit-scrollbar {
  width: 6px;
}

.bet-markets-scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.bet-markets-scrollable::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.bet-markets-scrollable::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

/* Custom scrollbar for bet slip */
.bet-slip-fixed::-webkit-scrollbar {
  width: 4px;
}

.bet-slip-fixed::-webkit-scrollbar-track {
  background: transparent;
}

.bet-slip-fixed::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.tiny-badge :deep(.v-badge__badge) {
  min-width: 9px !important;
  height: 18px !important;
  font-size: 9px !important;
  margin-bottom: 5px !important;
}

@media (min-width: 768px) {
  .bet-main-layout {
    background-color: #111111 !important;
  }

  .bet-markets-section {
    --mm-page-canvas: #111111;
    background-color: var(--mm-page-canvas) !important;
    padding: 8px 12px 0 14px;
    box-sizing: border-box;
  }

  .bet-header-fixed {
    background-color: var(--mm-page-canvas) !important;
  }

  .bet-markets-scrollable {
    padding: 10px 0 16px !important;
    background-color: var(--mm-page-canvas) !important;
  }

  .multi-market-header {
    border-bottom: 1px solid #9ca3af;
    background: linear-gradient(to bottom, #d1d1d1, #e8e8e8);
    padding-left: 8px !important;
    padding-right: 8px !important;
  }

  .multi-market-title {
    font-size: 0.9375rem;
    letter-spacing: 0.08em;
  }
}

/* Responsive scrollbar for mobile */
@media (max-width: 767px) {
  .bet-page-container {
    height: auto;
    min-height: 0;
    display: block;
    overflow: visible !important;
    background-color: #ececec;
  }

  .bet-main-layout,
  .bet-markets-section {
    display: block;
    overflow: visible !important;
    min-height: 0;
  }

  .bet-markets-scrollable {
    flex: none;
    overflow: visible !important;
    min-height: 0;
    padding: 4px !important;
    padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
  }

  .bet-markets-loading {
    min-height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .bet-markets-scrollable::-webkit-scrollbar {
    width: 4px;
  }

  /* Truncate long market names on mobile to keep icons/limits visible */
  :deep(.market-name),
  :deep(.market-title),
  :deep(.market-header-title),
  :deep(.tw-truncate-market) {
    max-width: 70%;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}


</style>

<!-- Global styles to control parent container (desktop inner scroll only) -->
<style>
@media (min-width: 769px) {
  /* Make multi-market page fill the parent container exactly - inner .bet-markets-scrollable scrolls */
  body.multi-market-page-active .bet-page-container {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    margin: 0 !important;
    background-color: transparent !important;
    background: none !important;
  }
}

/*
 * Desktop: anchor absolute .bet-page-container to v-container.
 * Mobile: document scroll via layout-v-main--mobile-bet (same as sport bet page).
 */
@media (min-width: 768px) {
  body.multi-market-page-active .bet-page-container,
  body.multi-market-page-active .bet-main-layout {
    background-color: #111111 !important;
  }
}

@media (min-width: 769px) {
  body.multi-market-page-active .v-container:has(.bet-page-container) {
    position: relative !important;
    padding: 0 !important;
    overflow: hidden !important;
    min-height: 0 !important;
    flex: 1 1 auto !important;
    display: flex !important;
    flex-direction: column !important;
  }
}

@media (max-width: 768px) {
  body.multi-market-page-active .v-container:has(.bet-page-container) {
    position: static !important;
    padding: 0 !important;
    overflow: visible !important;
    min-height: 0 !important;
    flex: 1 1 auto !important;
    display: flex !important;
    flex-direction: column !important;
  }

  body.multi-market-page-active .mm-multi-market-slot {
    position: static !important;
    flex: none !important;
    min-height: 0 !important;
    overflow: visible !important;
    display: block !important;
    width: 100% !important;
  }
}

/* Vuetify wrap must participate in flex column or .bet-markets-scrollable never gets a bounded height */
body.multi-market-page-active .v-main:has(.v-container .bet-page-container) .v-main__wrap {
  min-height: 0 !important;
  flex: 1 1 auto !important;
  display: flex !important;
  flex-direction: column !important;
}

/*
 * sports-layout-main sets min-height: 100vh on v-main — that prevents the flex row from capping height,
 * so .bet-page-container never gets a finite height and .bet-markets-scrollable cannot scroll.
 */
body.multi-market-page-active .v-main.sports-layout-main {
  min-height: 0 !important;
}

body.multi-market-page-active .v-main.sports-layout-main > .v-main__wrap {
  min-height: 0 !important;
}

/* Shell: pass flex shrink through to the router outlet (mobile: block layout; desktop: single-col grid) */
@media (max-width: 959.98px) {
  body.multi-market-page-active .sports-layout-shell,
  body.multi-market-page-active .guest-sports-shell {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    min-width: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }

  body.multi-market-page-active .sports-layout-shell__content,
  body.multi-market-page-active .guest-sports-shell__content {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    min-width: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
}

@media (min-width: 960px) {
  body.multi-market-page-active .sports-layout-shell--single-col,
  body.multi-market-page-active .guest-sports-shell--single-col {
    min-height: 0 !important;
    align-items: stretch !important;
  }

  body.multi-market-page-active .sports-layout-shell--single-col .sports-layout-shell__content,
  body.multi-market-page-active .guest-sports-shell--single-col .guest-sports-shell__content {
    min-height: 0 !important;
    min-width: 0 !important;
  }
}

/* Hide footer on multi-market page */
body.multi-market-page-active .app-footer {
  display: none !important;
}
</style>
