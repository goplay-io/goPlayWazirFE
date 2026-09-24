<script setup>
import { ref, computed, onMounted, onUnmounted, watch, watchEffect, nextTick } from "vue";
import { useRoute, useRouter } from 'vue-router';
import MatchOdds from "./MatchOdds.vue";
import Line from "./Line.vue";
import ScoreCard from "./ScoreCard.vue";
import SrWidgetScoreCard from './SrWidgetScoreCard.vue';
import BookMakers from "./bookmaker/BookMakers.vue";
import Fancy from "./Fancy.vue";
import Premium from "./Premium.vue";
import OtherMarkets from "./OtherMarkets.vue";
import Loading from "@/components/Loading.vue";
import { fetchButtons } from "@/api/user/profile.js";
import { getEventById } from "@/api/event/events.js";
import { getEventTypes } from "@/api/event/eventTypes";
import { getPremiumMarketUrl } from '@/api/event/premium.js';
import { resolveBetEventData, getBetEventFromCache } from '@/composables/useBetEventPrefetch';
import { extractMarketIdsFromEvent, resolveBetEventPayload } from '@/utils/eventData';
import { sharedWs } from '@/composables/sharedWs';
import BetHeader from "@/components/BetHeader.vue";
import SportsBetSlip from './SportsBetSlip.vue';
import FloatingBetSlip from './FloatingBetSlip.vue';
import { useEvent } from '@/composables/useEvent';
import EventData from '@/utils/eventData';
import { useMarkets } from '@/composables/useMarkets';
import { useOddsWebSocketForMarkets, useOddsWebSocketForBinary } from '@/composables/useOddsWebSocket';
import { BINARY_EVENT_TYPE_ID, useEventTypes } from '@/composables/useEventTypes';
import useDevices from '@/composables/useDevices';
import { useBetStore } from '@/stores/bet';
import { useAuthStore } from '@/stores/auth';

import { useSnackbar } from '@/composables/useSnackbar/useSnackbar';
import { useOneClickBettingStore } from '@/stores/oneClickBetting';
import { useInlineBetSlipHost } from '@/composables/useInlineBetSlipHost';
import OneClickBetting from '@/components/OneClickBetting.vue';
import TVLiveStream from '@/components/TVLiveStream.vue';
import ScoreCardTVMobile from './ScoreCardTVMobile.vue';
import BetMobileMatchedBetsSection from './BetMobileMatchedBetsSection.vue';
import RecentCasinoBanner from '@/components/RecentCasinoBanner.vue';
import { useScorecardTvStore } from '@/stores/scorecardTv';
import { useI18n } from 'vue-i18n';
import { setBetPlacementGuardContext, resetBetPlacementGuardContext } from '@/utils/betPlacementGuard';

const { showSuccess, showError } = useSnackbar()
const { t } = useI18n()

const { isMobile } = useDevices();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const oneClickStore = useOneClickBettingStore();

// Get event_id from route parameters
const event_id = ref(route.params.event_id);

const menuList = ref([]);
const loading = ref(!getBetEventFromCache(event_id.value));
const buttons = ref([]);
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
} = useInlineBetSlipHost();
const showBetHistory = ref(false);
const mobileToolbarView = ref('markets');
const mobileOpenBetCount = ref(0);

const toggleMobileOpenBets = () => {
  mobileToolbarView.value = mobileToolbarView.value === 'openBets' ? 'markets' : 'openBets';
};
const fancyPremiumTab = ref('Fancy');
const betAllow = ref(false);
const bet_processing = ref(false);
const runnerCppPreview = ref(null);
const premiumUrl = ref(null);
const premiumScorecardUrl = ref('');
const premiumLoading = ref(false);
const premiumError = ref(null);
let premiumRequestKey = 0;
let secondaryLoadKey = 0;

// Use bet store instead of composable
const betStore = useBetStore();
const scorecardTvStore = useScorecardTvStore();
const { getEventTypeName } = useEventTypes();

const {
  event,
  bm_active,
  inPlay,
  event_name,
  event_type_id,
  event_open_time,
  event_open_time_diff,
  constructEvent,
  updateEventTime
} = useEvent();

const tvLiveStreamSrc = computed(() => event.value?.tv_live_stream_url || '');
const hasTvStreamUrl = computed(() => !!(tvLiveStreamSrc.value && String(tvLiveStreamSrc.value).trim()));
const normalizedScoreType = computed(() =>
  String(event.value?.score_type || '').toLowerCase(),
);
const isSportsRadarScorecard = computed(() => normalizedScoreType.value === 'sportradar');
const isSrCardScorecard = computed(() => normalizedScoreType.value === 'sr_card');
const sportsRadarScorecardUrl = computed(() =>
  isSportsRadarScorecard.value ? premiumScorecardUrl.value : '',
);
const showScorecardWidget = computed(() => {
  if (!event.value?.score_active || event.value?.event_id == null) return false;
  if (isSportsRadarScorecard.value) return !!premiumScorecardUrl.value;
  if (isSrCardScorecard.value) return true;
  return true;
});

const competition_name = computed(() =>
  event.value ? EventData.getCompetitionName(event.value) : ''
);

const sport_name = computed(() => getEventTypeName(Number(event_type_id.value)) || '');

/** Bar-chart score tab icon only after scorecard HTML is actually received (not just score_active). */
const scorecardContentAvailable = ref(false);
const scorecardToolbarReady = computed(
  () => scorecardContentAvailable.value || isSrCardScorecard.value,
);
/** Desktop score card visibility — shown by default. */
const scoreCardVisible = ref(true);

function onScorecardAvailable(available) {
  scorecardContentAvailable.value = !!available;
}

watch(
  () => event.value?.event_id,
  () => {
    scorecardContentAvailable.value = false;
    scorecardTvStore.reset();
  }
);

watch(
  () => event.value?.score_active,
  (v) => {
    if (!v) scorecardContentAvailable.value = false;
  }
);

const {
  matchOddsData,
  bookMakersData,
  lineData,
  fancyActive,
  fancyTabs,
  finalFancyData,
  otherMarketData,
  binaryData,
  constructMatchOdds,
  constructBookmakers,
  constructLine,
  constructFancyTabs,
  constructFancy,
  constructOtherMarkets,
  mergeFancyFromEvent,
  getAllMarketIds,
  updateMarketDataFromOdds,
  applyCachedOdds,
  constructBinary,
  updateBinaryDataFromOdds,
} = useMarkets();

const isBinaryEvent = computed(() => Number(event_type_id.value) === BINARY_EVENT_TYPE_ID);

const resolveMarketForPlacement = (marketId) => {
  if (marketId == null || marketId === '') return null;
  const id = String(marketId);

  if (matchOddsData.value && String(matchOddsData.value.market_id) === id) {
    return matchOddsData.value;
  }

  for (const bookmaker of Object.values(bookMakersData.value || {})) {
    if (String(bookmaker?.market_id) === id) return bookmaker;
  }

  if (Array.isArray(otherMarketData.value)) {
    const otherMarket = otherMarketData.value.find((market) => String(market?.market_id) === id);
    if (otherMarket) return otherMarket;
  }

  if (Array.isArray(lineData.value)) {
    const lineMarket = lineData.value.find((market) => String(market?.market_id) === id);
    if (lineMarket) return lineMarket;
  }

  if (Array.isArray(binaryData.value)) {
    const binaryMarket = binaryData.value.find((market) => String(market?.market_id) === id);
    if (binaryMarket) return binaryMarket;
  }

  return null;
};

watchEffect(() => {
  setBetPlacementGuardContext({
    inPlay: inPlay.value,
    betAllow: betAllow.value,
    resolveMarket: resolveMarketForPlacement,
  });
});

useOddsWebSocketForMarkets(
  () => (isBinaryEvent.value ? [] : getAllMarketIds()),
  { onData: updateMarketDataFromOdds },
);

useOddsWebSocketForBinary(
  () => (isBinaryEvent.value ? Number(event_id.value) : null),
  { onData: updateBinaryDataFromOdds },
);

const getBetAllow = (buttons) => {
  return !buttons || !buttons.value?.length || buttons.value[0].bet_allow == 1;
}

const handleButtonsUpdate = (updatedButtons) => {
  buttons.value = updatedButtons || [];
  // Do not recalculate betAllow here: updated buttons carry only id/title/amount —
  // no bet_allow field — so recalculating would incorrectly set betAllow to false
  // and disable all runner buttons (breaking one-click and normal betting).
};

const hasFancyData = computed(() => {
  if (!finalFancyData.value) return false;
  if (Array.isArray(finalFancyData.value)) return finalFancyData.value.length > 0;
  return Object.keys(finalFancyData.value).length > 0;
});

const premiumActive = computed(() => !!event.value?.premium_active);

const hasBinaryData = computed(() => Array.isArray(binaryData.value) && binaryData.value.length > 0);

const hasFancySection = computed(() => hasFancyData.value || hasBinaryData.value);

/** Bookmakers that are NOT BACK_ONLY_ODDS — rendered above Fancy/Premium */
const nonBackOnlyBookmakers = computed(() => {
  if (!bookMakersData.value) return null;
  const list = Array.isArray(bookMakersData.value)
    ? bookMakersData.value
    : Object.values(bookMakersData.value);
  const filtered = list.filter(
    (bm) => String(bm?.betting_type || '').toUpperCase() !== 'BACK_ONLY_ODDS'
  );
  return filtered.length ? filtered : null;
});

/** BACK_ONLY_ODDS bookmakers — rendered below Fancy/Premium */
const backOnlyBookmakers = computed(() => {
  if (!bookMakersData.value) return null;
  const list = Array.isArray(bookMakersData.value)
    ? bookMakersData.value
    : Object.values(bookMakersData.value);
  const filtered = list.filter(
    (bm) => String(bm?.betting_type || '').toUpperCase() === 'BACK_ONLY_ODDS'
  );
  return filtered.length ? filtered : null;
});

/** Market filter pills: ALL | MATCH ODDS | BOOKMAKER | FANCY */
const marketsFilterTab = ref('ALL');

const hasMatchOddsMarket = computed(
  () => !!(matchOddsData.value?.market_id || event.value?.match_odds)
);
const hasBookmakerMarket = computed(
  () => !!(bm_active.value && (nonBackOnlyBookmakers.value || backOnlyBookmakers.value))
);
const hasFancyMarket = computed(
  () => !!(fancyActive.value || premiumActive.value || hasFancyData.value)
);
const showMarketsFilter = computed(
  () => hasMatchOddsMarket.value || hasBookmakerMarket.value || hasFancyMarket.value
);
const marketFilterTabs = computed(() =>
  [
    { id: 'ALL', label: 'ALL', show: true },
    { id: 'MATCH ODDS', label: 'MATCH ODDS', show: hasMatchOddsMarket.value },
    { id: 'BOOKMAKER', label: 'BOOKMAKER', show: hasBookmakerMarket.value },
    { id: 'FANCY', label: 'FANCY', show: hasFancyMarket.value },
  ].filter((t) => t.show)
);
const showMatchOddsFilter = computed(
  () => marketsFilterTab.value === 'ALL' || marketsFilterTab.value === 'MATCH ODDS'
);
const showBookmakerFilter = computed(
  () => marketsFilterTab.value === 'ALL' || marketsFilterTab.value === 'BOOKMAKER'
);
const showFancyFilter = computed(
  () => marketsFilterTab.value === 'ALL' || marketsFilterTab.value === 'FANCY'
);
const showAllOnlyMarkets = computed(() => marketsFilterTab.value === 'ALL');

watch(
  () => event.value?.event_id,
  () => {
    marketsFilterTab.value = 'ALL';
  }
);

watch(marketFilterTabs, (tabs) => {
  if (!tabs.some((t) => t.id === marketsFilterTab.value)) {
    marketsFilterTab.value = 'ALL';
  }
});

// Prefer Fancy when it has markets; otherwise open Premium by default
// (do not key off fancyActive alone — it can be true with an empty fancy list).
watch(
  [hasFancySection, premiumActive],
  ([hasFancy, hasPremium]) => {
    if (hasFancy) {
      fancyPremiumTab.value = 'Fancy';
    } else if (hasPremium) {
      fancyPremiumTab.value = 'Premium';
    }
  },
  { immediate: true }
);

const constructData = () => {
  constructEvent();
  constructMatchOdds(event.value);
  constructBookmakers(event.value);
  constructLine(event.value);
  constructFancyTabs(event.value);
  constructFancy(event.value);
  constructOtherMarkets(event.value);
  constructBinary(event.value);
  applyCachedOdds();
};

const applyEventToPage = (normalizedEvent) => {
  if (!normalizedEvent) return;
  if (sharedWs.url) {
    const marketIds = extractMarketIdsFromEvent(normalizedEvent);
    if (marketIds.length > 0) {
      sharedWs.subscribeMarkets(marketIds);
    }
  }
  event.value = normalizedEvent;
  constructData();
  updateEventTime();
};

// Paint markets on the first frame when prefetch cache is already warm (no onMounted wait).
const initialCachedEvent = getBetEventFromCache(event_id.value);
if (initialCachedEvent) {
  applyEventToPage(initialCachedEvent);
}

const getPremiumEventInfo = (eventData) => {
  const root = eventData?.data?.event ?? eventData?.event ?? eventData ?? {};
  return root?.event ?? root;
};

const getPremiumEventId = (eventData) => {
  const info = getPremiumEventInfo(eventData);
  const eventId = info?.event_id ?? eventData?.event_id ?? event_id.value;
  const providerId = info?.provider_id ?? eventData?.provider_id;

  return Number(providerId) === 2 && eventId != null
    ? `sr:match:${eventId}`
    : eventId;
};

const getPremiumEventTypeId = (eventData) => {
  const info = getPremiumEventInfo(eventData);
  return info?.event_type_id ?? info?.eventTypeId ?? eventData?.event_type_id ?? eventData?.eventTypeId ?? event_type_id.value;
};

const fetchPremiumData = async (eventData) => {
  const eventTypeId = getPremiumEventTypeId(eventData);
  const premiumEventId = getPremiumEventId(eventData);
  if (eventTypeId == null || premiumEventId == null) return;

  const requestKey = ++premiumRequestKey;
  premiumLoading.value = true;
  premiumError.value = null;

  try {
    const result = await getPremiumMarketUrl(eventTypeId, premiumEventId);
    if (requestKey !== premiumRequestKey) return;

    const url = typeof result === 'string'
      ? result
      : (result?.data?.url ?? result?.url ?? null);
    const scorecardUrl = typeof result === 'string'
      ? ''
      : (result?.data?.scorecardUrl ?? result?.scorecardUrl ?? '');

    premiumUrl.value = url;
    premiumScorecardUrl.value = scorecardUrl || '';
    if (!url) {
      premiumError.value = 'Premium market not found';
    }
  } catch (err) {
    if (requestKey !== premiumRequestKey) return;
    premiumUrl.value = null;
    premiumScorecardUrl.value = '';
    premiumError.value = err?.message || 'Failed to load premium market';
  } finally {
    if (requestKey === premiumRequestKey) {
      premiumLoading.value = false;
    }
  }
};

// Watch bet selection identity (odd + runner_id + is_back) so we react when
// a different runner is selected even if it has the same odd value as the previous one.
watch(() => {
  const bet = betStore.bet;
  return bet ? `${bet.odd}|${bet.runner_id}|${bet.is_back}` : null;
}, (selectionKey) => {
  const newOdd = betStore.bet?.odd;
  if (!newOdd) {
    // On a successful bet, clearBetSelectionOnly() clears odd before bet_status is set
    // to 'success'. Both changes are batched, so bet_status is already 'success' here.
    // Let FloatingBetSlip close itself after showing the success snackbar.
    if (betStore.bet_status !== 'success' && isMobile.value) {
      showInlineSlip.value = false;
    }
    if (isMobile.value) {
      removeInlineSlipHost();
    }
    return;
  }

  if (oneClickStore.isActive && !oneClickStore.editMode) return;

  if (isMobile.value) {
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

watch(() => betStore.bet?.market_id, () => {
  runnerCppPreview.value = null;
});



watch(() => betStore.bet?.odd, (newOdd) => {
  if (!newOdd) {
    runnerCppPreview.value = null;
  }
});

// Refresh bet history after successful bet placement
watch(() => betStore.bet_status, async (newStatus) => {
  if (newStatus === 'success') {
    // FloatingBetSlip (mobile inline) is unmounted before its own watcher fires,
    // so show the snackbar here from the stable parent watcher.
    if (isMobile.value) showSuccess(t('sports.home.betPlaced'));
    try {
      await betStore.refreshBetHistory(event_id.value);
    } catch (err) {
      console.error('Error refreshing bet history after placement:', err);
    }
  } else if (newStatus === 'failed' && isMobile.value) {
    showError(betStore.bet_error || t('sports.home.betFailed'));
  }
});

// Watch for mobile state changes and close bet slip on mobile if needed
watch(isMobile, (newIsMobile) => {
  if (newIsMobile && slipOpen.value) {
    // On mobile, close bet slip if it's open (user can manually open it)
    // Only close if no bet is selected to avoid disrupting user flow
    if (!betStore.bet || !betStore.bet.odd) {
      slipOpen.value = false;
    }
  }
});

// Watch for route parameter changes
watch(() => route.params.event_id, async (newEventId) => {
  if (newEventId && newEventId !== event_id.value) {
    scorecardTvStore.reset();
    event_id.value = newEventId;
    clearInterval(eventRefreshIntervalId);
    await loadEventData();
    startEventRefreshIfCricket();
  }
});

const refreshData = () => {
  updateEventTime();
};

const loadSecondaryBetData = async (isDemoUser, targetEventId) => {
  const requestKey = ++secondaryLoadKey;

  const promises = [getEventTypes()];

  if (!isDemoUser) {
    promises.push(betStore.refreshBetHistory(targetEventId));
    promises.push(fetchButtons().catch((e) => {
      console.warn('Buttons API failed, using static fallback:', e);
      return null;
    }));
  }

  const results = await Promise.all(promises);

  if (requestKey !== secondaryLoadKey || String(targetEventId) !== String(event_id.value)) {
    return;
  }

  menuList.value = results[0]?.data?.menu ?? results[0]?.menu ?? [];

  if (!isDemoUser) {
    buttons.value = results[2]?.buttons || [];
    betAllow.value = getBetAllow(buttons);
  }
};

// Function to load event data (used both on mount and route change)
const loadEventData = async () => {
  const targetEventId = event_id.value;
  const hadEvent = !!event.value?.event_id;
  if (!hadEvent) {
    loading.value = true;
  }
  secondaryLoadKey += 1;
  premiumRequestKey += 1;
  premiumUrl.value = null;
  premiumScorecardUrl.value = '';
  premiumLoading.value = false;
  premiumError.value = null;

  try {
    betStore.initializeBet(event_id.value);

    const isDemoUser = authStore.isDemoUser;

    let normalizedEvent;
    try {
      normalizedEvent = await resolveBetEventData(targetEventId);
    } catch (eventError) {
      if (eventError.response?.status === 404) {
        showError(eventError.response?.data?.error || t('sports.home.eventNotFound'));
        await router.push({ name: 'home' });
        return;
      }
      throw eventError;
    }

    if (!normalizedEvent) {
      throw new Error('Event not found');
    }

    applyEventToPage(normalizedEvent);
    refreshData();
    fetchPremiumData(normalizedEvent);

    if (isDemoUser) {
      buttons.value = [];
      betAllow.value = true;
      betStore.setBetHistory([]);
      betStore.setBetOutcomes({});
    } else {
      betAllow.value = getBetAllow(buttons);
    }

    loadSecondaryBetData(isDemoUser, event_id.value).catch((err) => {
      console.error('Error loading secondary bet page data:', err);
    });
  } catch (error) {
    console.error("Error fetching data:", error);

    const errorMessage = error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An error occurred while loading event data';
    showError(errorMessage);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // Ensure bet slip is closed on mobile when component mounts
  if (isMobile.value && slipOpen.value) {
    slipOpen.value = false;
  }
  await loadEventData();
  startEventRefreshIfCricket();
});

const toggleSlip = () => {
  betStore.clearBetSelection();
  slipOpen.value = !slipOpen.value;
};

const closeInlineSlip = () => {
  showInlineSlip.value = false;
  removeInlineSlipHost();
  betStore.clearBetSelection();
};

const handleRunnerCppUpdate = (payload) => {
  const currentMarketId = betStore.bet?.market_id ? String(betStore.bet.market_id) : null;
  const payloadMarketId = payload?.marketId != null ? String(payload.marketId) : null;

  if (!payload) {
    if (!currentMarketId) {
      runnerCppPreview.value = null;
    }
    return;
  }

  if (currentMarketId && payloadMarketId && payloadMarketId !== currentMarketId) {
    return;
  }

  const hasRunners = payload.runners && Object.keys(payload.runners).length > 0;

  if (!hasRunners) {
    if (!currentMarketId || !payloadMarketId || payloadMarketId === currentMarketId) {
      runnerCppPreview.value = null;
    }
    return;
  }

  runnerCppPreview.value = payload;
};

const useOddsWebSocket = !!import.meta.env.VITE_ODDS_WS_URL;

const CRICKET_EVENT_TYPE_ID = 4;
const EVENT_REFRESH_BACKUP_MS = 15_000;

let intervalId;
let eventRefreshIntervalId;
let fancyRefetchUnsub = null;
let fancyRefetchEventId = null;
let silentRefreshInFlight = false;
let silentRefreshQueued = false;

const stopFancyRefetchSubscription = () => {
  if (fancyRefetchUnsub) {
    fancyRefetchUnsub();
    fancyRefetchUnsub = null;
  }
  if (fancyRefetchEventId != null) {
    sharedWs.unsubscribeScorecard(fancyRefetchEventId);
    fancyRefetchEventId = null;
  }
};

const startFancyRefetchSubscription = () => {
  stopFancyRefetchSubscription();
  if (!sharedWs.url) return;
  if (Number(event_type_id.value) !== CRICKET_EVENT_TYPE_ID) return;

  const id = Number(event_id.value);
  if (!Number.isFinite(id) || id <= 0) return;

  fancyRefetchEventId = id;
  // Same event_id channel as scorecard — required so OddsDistributor can route the flag.
  sharedWs.subscribeScorecard(id);
  fancyRefetchUnsub = sharedWs.onFancyRefetch((msg) => {
    if (Number(msg?.eventId) !== Number(event_id.value)) return;
    silentRefreshEventData();
  });
};

// Backup poll for cricket; primary updates come from fancy_refetch WS flag.
const startEventRefreshIfCricket = () => {
  clearInterval(eventRefreshIntervalId);
  stopFancyRefetchSubscription();
  if (Number(event_type_id.value) !== CRICKET_EVENT_TYPE_ID) return;

  startFancyRefetchSubscription();
  eventRefreshIntervalId = setInterval(() => {
    silentRefreshEventData();
  }, EVENT_REFRESH_BACKUP_MS);
};

// Silently re-fetches event details without showing the loading spinner.
// Fancy markets are merged in-place: new markets added, gone markets removed,
// existing markets updated — no full remount, no blink.
const silentRefreshEventData = async () => {
  if (silentRefreshInFlight) {
    silentRefreshQueued = true;
    return;
  }
  silentRefreshInFlight = true;
  try {
    do {
      silentRefreshQueued = false;
      const eventRes = await getEventById(event_id.value);
      const normalizedEvent = resolveBetEventPayload(eventRes);
      if (!normalizedEvent) continue;
      event.value = normalizedEvent;
      constructEvent();
      mergeFancyFromEvent(normalizedEvent);
      refreshData();
    } while (silentRefreshQueued);
  } catch (err) {
    console.warn('Silent event refresh failed:', err);
  } finally {
    silentRefreshInFlight = false;
  }
};

onMounted(() => {
  // Keep only the time-display refresh; odds come via WebSocket.
  intervalId = setInterval(() => {
    refreshData();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(intervalId);
  clearInterval(eventRefreshIntervalId);
  stopFancyRefetchSubscription();
  removeInlineSlipHost();
  resetBetPlacementGuardContext();
});

</script>

<template>
  <div class="bet-page-container">
    <!-- Main Betting Interface (kept mounted to avoid full-page flicker) -->
    <div class="bet-main-layout">

      <div class="bet-content-columns">
      <!-- Left Side - Betting Markets -->
      <div class="bet-markets-section">
        <!-- Betting Markets Container - Scrollable (header scrolls with markets on desktop) -->
          <div class="bet-markets-scrollable" @click.capture="captureOddClick"
          @cashout-slip-target="handleCashoutSlipTarget">
          <div class="bet-header-fixed">
            <RecentCasinoBanner />
            <v-card class="tw-rounded-none tw-overflow-hidden" elevation="0">
              <BetHeader
                :event_name="!loading && event_name !== 'Unknown event' ? event_name : ''"
                :competition_name="!loading ? competition_name : ''"
                :sport-name="sport_name"
                :sport-id="event_type_id"
                :event_open_time="event_open_time"
                :inPlay="inPlay"
                :event_open_time_diff="event_open_time_diff"
                :slipOpen="slipOpen"
                :tv-channel-active="!isBinaryEvent && !!event?.tv_channel_active"
                :has-tv-stream="hasTvStreamUrl"
                :score-channel-active="!isBinaryEvent && !!event?.score_active"
                :score-active="!isBinaryEvent && !!event?.score_active && scorecardToolbarReady"
                :live-score-open="scoreCardVisible"
                :show-open-bets="isMobile"
                :open-bets-active="mobileToolbarView === 'openBets'"
                @toggle-slip="toggleSlip"
                @toggle-live-score="scoreCardVisible = !scoreCardVisible"
                @toggle-open-bets="toggleMobileOpenBets"
                :betHistoryCount="isMobile ? mobileOpenBetCount : betStore.betHistoryCount"
              />
            </v-card>
          </div>
          <template v-if="loading">
            <div class="bet-markets-loading">
              <Loading minHeight="360px" />
            </div>
          </template>

          <template v-else>
            <BetMobileMatchedBetsSection
              v-if="isMobile"
              v-show="mobileToolbarView === 'openBets'"
              :active="mobileToolbarView === 'openBets'"
              @update:open-bet-count="mobileOpenBetCount = $event"
            />
            <template v-if="!isMobile || mobileToolbarView === 'markets'">
            <!-- Scorecard (desktop only) -->
            <div
              v-if="!isBinaryEvent && !isMobile && showScorecardWidget"
              v-show="scoreCardVisible"
              class="bet-scorecard-slot"
            >
              <SrWidgetScoreCard
                v-if="isSrCardScorecard"
                :event-id="event.event_id"
                :event-type-id="event_type_id"
                :score-active="!!event.score_active"
              />
              <ScoreCard
                v-else
                :event-id="event.event_id"
                :score-active="!!event.score_active"
                :score-type="event.score_type"
                :scorecard-url="sportsRadarScorecardUrl"
                @scorecard-available="onScorecardAvailable"
              />
            </div>
            <!-- ScoreCard + TV (mobile only, above Match Odds, toggle in header) -->
            <ScoreCardTVMobile v-if="!isBinaryEvent && (event?.score_active || (event?.tv_channel_active && hasTvStreamUrl)) && event?.event_id != null"
              :event-id="event.event_id"
              :event-type-id="event_type_id"
              :score-active="!!event?.score_active"
              :score-type="event.score_type"
              :scorecard-url="sportsRadarScorecardUrl"
              :tv-src="tvLiveStreamSrc"
              :tv-active="!!event?.tv_channel_active && hasTvStreamUrl"
              @scorecard-available="onScorecardAvailable"
            />
            <!-- Market filter: ALL | MATCH ODDS | BOOKMAKER | FANCY -->
            <div v-if="showMarketsFilter" class="bet-markets-filter" role="tablist" aria-label="Market filter">
              <button
                v-for="tab in marketFilterTabs"
                :key="tab.id"
                type="button"
                role="tab"
                class="bet-markets-filter__pill"
                :class="{ 'bet-markets-filter__pill--active': marketsFilterTab === tab.id }"
                :aria-selected="marketsFilterTab === tab.id"
                @click="marketsFilterTab = tab.id"
              >
                {{ tab.label }}
              </button>
            </div>
            <!-- Match Odds -->
            <v-card v-if="showMatchOddsFilter && (matchOddsData?.market_id || event?.match_odds)" class="bet-market-match-odds tw-shadow-sm" elevation="0">
              <MatchOdds :matchOddsData="matchOddsData" :betHistory="betStore.betHistory" :selectedBet="betStore.bet"
                :eventTypeId="event_type_id" :eventName="event_name" :betAllow="betAllow" :eventId="event_id"
                :providerId="event?.provider_id"
                :cashoutActive="event?.cashout_active ?? true"
                :speedCashoutActive="event?.speed_cashout_active ?? true"
                :inPlay="inPlay" :onRunnerCppUpdate="handleRunnerCppUpdate" />
            </v-card>
            <!-- Bookmakers (no v-card background wrapper) - excludes BACK_ONLY_ODDS -->
            <div v-if="showBookmakerFilter && bm_active && nonBackOnlyBookmakers" class="tw-shadow-sm">
              <BookMakers :bookMakersData="nonBackOnlyBookmakers" :betHistory="betStore.betHistory" :selectedBet="betStore.bet"
                :eventTypeId="event_type_id" :eventName="event_name" :betAllow="betAllow" :eventId="event_id"
                :providerId="event?.provider_id"
                :cashoutActive="event?.cashout_active ?? true"
                :speedCashoutActive="event?.speed_cashout_active ?? true"
                :inPlay="inPlay" :onRunnerCppUpdate="handleRunnerCppUpdate" />
            </div>
            <!-- Other Markets (Football - above Fancy/Premium) -->
            <v-card v-if="showMatchOddsFilter && otherMarketData && Number(event_type_id) === 1" class="tw-shadow-sm" elevation="0">
              <OtherMarkets :markets="otherMarketData" :betHistory="betStore.betHistory" :selectedBet="betStore.bet"
                :eventTypeId="event_type_id" :eventName="event_name" :betAllow="betAllow" :inPlay="inPlay"
                :eventId="event_id" :providerId="event?.provider_id"
                :cashoutActive="event?.cashout_active ?? true"
                :speedCashoutActive="event?.speed_cashout_active ?? true"
                :onRunnerCppUpdate="handleRunnerCppUpdate" />
            </v-card>
            <!-- Line Markets -->
            <v-card v-if="showAllOnlyMarkets && Array.isArray(lineData) && lineData.length" class="bet-market-line" elevation="0">
              <Line
                :line-markets="lineData"
                :betHistory="betStore.betHistory"
                :selectedBet="betStore.bet"
                :betOutcomes="betStore.betOutcomes"
                :eventTypeId="event_type_id"
                :eventName="event_name"
                :betAllow="betAllow"
                :eventId="event_id"
                :inPlay="inPlay"
              />
            </v-card>
            <!-- Fancy / Premium parent tab -->
            <v-card v-if="showFancyFilter && (fancyActive || premiumActive || hasBinaryData)" class="fancy-premium-vcard tw-shadow-sm" elevation="0">
              <div class="fancy-premium-section tw-overflow-hidden tw-pb-1 md:tw-mx-0">
                <div class="fancy-premium-header-shell md:tw-mb-0">
                  <div
                    v-if="hasFancySection || premiumActive"
                    class="tw-flex tw-items-stretch">
                    <div
                      class="fancy-fp-toolbar"
                      :class="{ 'fancy-fp-toolbar--dual': hasFancySection && premiumActive }">
                      <button v-if="hasFancySection" type="button"
                        class="tab-btn fancy-fp-hit tw-outline-none tw-transition-colors"
                        :class="fancyPremiumTab === 'Fancy' ? 'fancy-fp-pill fancy-fp-pill--active' : 'fancy-fp-text'"
                        @click="fancyPremiumTab = 'Fancy'">
                        <span class="fancy-fp-label-mobile">Fancy</span>
                        <span class="fancy-fp-label-desktop">Fancy Market</span>
                      </button>
                      <button v-if="premiumActive" type="button"
                        class="tab-btn fancy-fp-hit fancy-fp-premium tw-inline-flex tw-items-center tw-justify-center tw-outline-none tw-transition-colors"
                        :class="fancyPremiumTab === 'Premium' ? 'fancy-fp-pill fancy-fp-pill--active' : 'fancy-fp-text fancy-fp-text--premium'"
                        @click="fancyPremiumTab = 'Premium'">
                        <span class="fancy-fp-premium-label">
                          <span class="fancy-fp-label-mobile">Premium</span>
                          <span class="fancy-fp-label-desktop fancy-fp-premium-text">Premium Market</span>
                          <span class="fancy-fp-new-badge" aria-hidden="true">NEW</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="fancy-premium-content md:tw-px-0">
                  <v-window v-model="fancyPremiumTab" class="tw-mt-0" :touch="false">
                    <v-window-item v-if="hasFancySection" value="Fancy">
                      <Fancy
                        :fancyData="Array.isArray(finalFancyData) ? finalFancyData : Object.values(finalFancyData || {})"
                        :fancyTabs="fancyTabs" :binaryData="binaryData" :betHistory="betStore.betHistory" :betOutcomes="betStore.betOutcomes"
                        :eventTypeId="event_type_id" :eventName="event_name" :betAllow="betAllow" :inPlay="inPlay" :eventId="event_id" />
                    </v-window-item>
                    <v-window-item v-if="premiumActive" value="Premium">
                      <Premium :premium-url="premiumUrl" :loading="premiumLoading" :error="premiumError" />

                    </v-window-item>
                  </v-window>
                </div>
              </div>
            </v-card>
            <!-- BACK_ONLY_ODDS Bookmakers - rendered below Fancy/Premium -->
            <div v-if="showBookmakerFilter && bm_active && backOnlyBookmakers" class="tw-shadow-sm">
              <BookMakers :bookMakersData="backOnlyBookmakers" :betHistory="betStore.betHistory" :selectedBet="betStore.bet"
                :eventTypeId="event_type_id" :eventName="event_name" :betAllow="betAllow" :eventId="event_id"
                :providerId="event?.provider_id"
                :cashoutActive="event?.cashout_active ?? true"
                :speedCashoutActive="event?.speed_cashout_active ?? true"
                :inPlay="inPlay" :onRunnerCppUpdate="handleRunnerCppUpdate" />
            </div>
            <!-- Other Markets (Cricket - below Fancy/Premium) -->
            <v-card v-if="showMatchOddsFilter && otherMarketData && Number(event_type_id) === 4" class="tw-shadow-sm" elevation="0">
              <OtherMarkets :markets="otherMarketData" :betHistory="betStore.betHistory" :selectedBet="betStore.bet"
                :eventTypeId="event_type_id" :eventName="event_name" :betAllow="betAllow" :inPlay="inPlay"
                :eventId="event_id" :providerId="event?.provider_id"
                :cashoutActive="event?.cashout_active ?? true"
                :speedCashoutActive="event?.speed_cashout_active ?? true"
                :onRunnerCppUpdate="handleRunnerCppUpdate" />
            </v-card>
            </template>
          </template>
        </div>

      </div>

      <!-- Right Side - Bet Slip (Desktop): rail stays mounted so TV + bet history remain after slip close -->
      <div v-if="!isMobile" class="bet-slip-fixed">
        <!-- TV Live Stream (collapsible) -->
        <div v-if="!isBinaryEvent && event?.tv_channel_active && hasTvStreamUrl" class="tw-mb-2">
          <TVLiveStream :src="tvLiveStreamSrc" />
        </div>
        <!-- One Click Betting -->
        <div class="tw-mb-2">
          <OneClickBetting />
        </div>

        <SportsBetSlip :slipOpen="slipOpen" :toggleSlip="toggleSlip" :bet_error="betStore.bet_error"
          :betAllow="betAllow" :bet="betStore.bet" :buttons="buttons" :changeAmount="betStore.changeAmount"
          :placeBet="betStore.placeBet" :betHistory="betStore.betHistory" v-model:bet_status="betStore.bet_status"
          v-model:bet_processing="bet_processing" v-model:showBetHistory="showBetHistory"
          :betHistoryCount="betStore.betHistoryCount" :minAmount="betStore.minAmount" :maxAmount="betStore.maxAmount"
          :runnerCpp="runnerCppPreview" :sport-name="sport_name" :competition-name="competition_name"
          @update:buttons="handleButtonsUpdate" />
      </div>
      </div>

      <!-- Mobile inline bet slip (below tapped odds row) -->
      <Teleport
        v-if="isMobile && showInlineSlip && inlineSlipTarget && betStore.bet && (!oneClickStore.isActive || oneClickStore.editMode)"
        :to="inlineSlipTarget">
        <FloatingBetSlip inline :key="`${betStore.bet?.market_id}-${betStore.bet?.runner_id}-${betStore.bet?.is_back}`"
          :bet_error="betStore.bet_error" :betAllow="betAllow" :bet="betStore.bet" :buttons="buttons"
          :changeAmount="betStore.changeAmount" :placeBet="betStore.placeBet" :minAmount="betStore.minAmount"
          :maxAmount="betStore.maxAmount" v-model:bet_status="betStore.bet_status"
          v-model:bet_processing="bet_processing" @close="closeInlineSlip" @update:buttons="handleButtonsUpdate"
          @inline-mounted="scrollInlineSlipIntoView" />
      </Teleport>

      <!-- One-click sticky bottom bar (mobile) — rendered outside desktop-only panel so it mounts on mobile -->
      <OneClickBetting v-if="isMobile" sticky-only />

    </div>
  </div>
</template>

<style scoped>
/* Reference screenshot market styling */
/* .bet-page-container {
  background: #ececec;
} */

/* .bet-markets-scrollable {
  background: #ececec;
} */

.bet-markets-loading {
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bet-markets-scrollable {
  padding-left: 5px;
  padding-right: 5px;
  box-sizing: border-box;
}

.bet-markets-scrollable :deep(.market-panel) {
  border: 1px solid #d4d4d4 !important;
  border-radius: 6px !important;
  background: #ffffff !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
  margin-bottom: 0;
}

.bet-markets-scrollable :deep(.bet-market-match-odds) {
  background: transparent !important;
  overflow: visible !important;
}

.bet-markets-scrollable :deep(.bet-market-match-odds .match-odds-root),
.bet-markets-scrollable :deep(.bet-market-line .line-markets-root),
.bet-markets-scrollable :deep(.bet-market-line .match-odds-root) {
  border: 1px solid #d9d9d9 !important;
  border-radius: 0 !important;
  box-sizing: border-box !important;
}

/* Line Markets: transparent wrapper — gap comes from .bet-markets-scrollable */
.bet-markets-scrollable .bet-market-line {
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  overflow: visible !important;
}

.bet-markets-scrollable .bet-market-line :deep(.v-card__underlay),
.bet-markets-scrollable .bet-market-line :deep(.v-card__overlay) {
  display: none;
}

.bet-markets-scrollable :deep(.market-title-ribbon) {
  position: relative;
  min-height: 34px;
  background: var(--theme-primary-gradient) !important;
  color: #111827 !important;
}

@media (max-width: 767.98px) {
  .bet-markets-scrollable :deep(.market-title-ribbon) {
    min-height: var(--sports-bet-mobile-header-height);
    height: var(--sports-bet-mobile-header-height);
    max-height: var(--sports-bet-mobile-header-height);
  }

  .bet-markets-scrollable :deep(.market-title-ribbon::after) {
    border-top-width: 14px;
    border-bottom-width: 14px;
  }
}

.bet-markets-scrollable :deep(.market-title-ribbon h2),
.bet-markets-scrollable :deep(.market-title-ribbon .v-btn) {
  color: #111827 !important;
}

.bet-markets-scrollable :deep(.market-title-ribbon::after) {
  content: "";
  position: absolute;
  right: -22px;
  top: 0;
  width: 0;
  height: 0;
  border-top: 17px solid transparent;
  border-bottom: 17px solid transparent;
  border-left: 22px solid #b7862f;
}

.bet-markets-scrollable :deep(.market-minmax-col-row) {
  background: #ffffff !important;
  border-bottom: 1px solid #e5e7eb !important;
  min-height: 36px;
}

@media (max-width: 767.98px) {
  .bet-markets-scrollable :deep(.match-odds-runner-name),
  .bet-markets-scrollable :deep(.bookmaker-runner-name),
  .bet-markets-scrollable :deep(.bookmaker-bo-runner-name),
  .bet-markets-scrollable :deep(.ginnie-runner-name),
  .bet-markets-scrollable :deep(.who-win-runner-name),
  .bet-markets-scrollable :deep(.other-markets-runner-name),
  .bet-markets-scrollable :deep(.fancy-runner-name),
  .bet-markets-scrollable :deep(.fancy-row-cols h4) {
    font-size: 11px !important;
  }

  .bet-markets-scrollable :deep(.market-minmax-col-row),
  .bet-markets-scrollable :deep(.market-minmax-col-row > div),
  .bet-markets-scrollable :deep(.sports-bet-header-limits),
  .bet-markets-scrollable :deep(.sports-bet-header-limits span),
  .bet-markets-scrollable :deep(.match-odds-header-limit-text) {
    font-size: 10px !important;
    font-weight: 500 !important;
    text-transform: none !important;
  }

  .bet-markets-scrollable :deep(.match-odds-header-grey),
  .bet-markets-scrollable :deep(.bookmaker-bl-header-grey),
  .bet-markets-scrollable :deep(.bookmaker-bo-header-grey),
  .bet-markets-scrollable :deep(.other-markets-header-grey),
  .bet-markets-scrollable :deep(.who-win-header-grey),
  .bet-markets-scrollable :deep(.line-markets-header-grey),
  .bet-markets-scrollable :deep(.ginnie-header-grey),
  .bet-markets-scrollable :deep(.fancy-khadda-header-grey),
  .bet-markets-scrollable :deep(.match-odds-header-backlay-col),
  .bet-markets-scrollable :deep(.other-markets-header-backlay-col),
  .bet-markets-scrollable :deep(.bookmaker-bo-header-back-col),
  .bet-markets-scrollable :deep(.ginnie-header-back-col) {
    background: #ffffff !important;
  }
}

.bet-markets-scrollable :deep(.market-minmax-col-row .mmc-head-back),
.bet-markets-scrollable :deep(.market-minmax-col-row .mmc-head-lay) {
  border-radius: 5px !important;
  box-shadow: none !important;
  font-size: 12px;
}

.bet-markets-scrollable :deep(.market-runner-row) {
  min-height: 43px;
  padding-top: 4px !important;
  padding-bottom: 2px !important;
  border-bottom-color: #e5e7eb !important;
}

.bet-markets-scrollable :deep(.v-btn.odds-back-bg-1:not(.match-odds-price-cell)),
.bet-markets-scrollable :deep(.v-btn.odds-back-bg-2:not(.match-odds-price-cell)),
.bet-markets-scrollable :deep(.v-btn.odds-back-bg-3:not(.match-odds-price-cell)),
.bet-markets-scrollable :deep(.v-btn.odds-lay-bg-1:not(.match-odds-price-cell)),
.bet-markets-scrollable :deep(.v-btn.odds-lay-bg-2:not(.match-odds-price-cell)),
.bet-markets-scrollable :deep(.v-btn.odds-lay-bg-3:not(.match-odds-price-cell)) {
  border-radius: var(--sports-bet-odds-btn-radius) !important;
  min-height: 52px !important;
  height: 52px !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.bet-markets-scrollable :deep(.v-btn.odds-back-bg-1),
.bet-markets-scrollable :deep(.v-btn.odds-back-bg-2),
.bet-markets-scrollable :deep(.v-btn.odds-back-bg-3) {
  background: var(--color-back-bg-1) !important;
}

.bet-markets-scrollable :deep(.v-btn.odds-lay-bg-1),
.bet-markets-scrollable :deep(.v-btn.odds-lay-bg-2),
.bet-markets-scrollable :deep(.v-btn.odds-lay-bg-3) {
  background: var(--color-lay-bg-1) !important;
}

.bet-markets-scrollable :deep(.odds-buttons-container .v-btn.v-btn--disabled::after),
.bet-markets-scrollable :deep(.odds-buttons-container .v-btn[disabled]::after),
.bet-markets-scrollable :deep(.bet-allow-disabled .v-btn:disabled::after) {
  background: rgba(255, 255, 255, 0.25) !important;
}

/* Odds price/size (including empty 0 / 0.0) stay solid black, even on disabled buttons */
.bet-markets-scrollable :deep(.match-odds-price-cell.v-btn--disabled),
.bet-markets-scrollable :deep(.match-odds-price-cell.v-btn[disabled]),
.bet-markets-scrollable :deep(.fancy-odds-btn.v-btn--disabled),
.bet-markets-scrollable :deep(.fancy-odds-btn.v-btn[disabled]),
.bet-markets-scrollable :deep(.odd-even-box.v-btn--disabled),
.bet-markets-scrollable :deep(.odd-even-box.v-btn[disabled]),
.bet-markets-scrollable :deep(.khadda-odds-vbtn.v-btn--disabled),
.bet-markets-scrollable :deep(.khadda-odds-vbtn.v-btn[disabled]),
.bet-markets-scrollable :deep(.ginnie-odds-box.v-btn--disabled),
.bet-markets-scrollable :deep(.ginnie-odds-box.v-btn[disabled]) {
  opacity: 1 !important;
  color: #000 !important;
  --v-disabled-opacity: 1;
}

.bet-markets-scrollable :deep(.mo-price),
.bet-markets-scrollable :deep(.mo-size),
.bet-markets-scrollable :deep(.fancy-odds-price),
.bet-markets-scrollable :deep(.fancy-odds-size),
.bet-markets-scrollable :deep(.khadda-odds-line--price),
.bet-markets-scrollable :deep(.khadda-odds-line--size),
.bet-markets-scrollable :deep(.match-odds-price-cell.v-btn--disabled .v-btn__content),
.bet-markets-scrollable :deep(.match-odds-price-cell.v-btn--disabled .v-btn__content *),
.bet-markets-scrollable :deep(.match-odds-price-cell.v-btn[disabled] .v-btn__content),
.bet-markets-scrollable :deep(.match-odds-price-cell.v-btn[disabled] .v-btn__content *),
.bet-markets-scrollable :deep(.fancy-odds-btn.v-btn--disabled .v-btn__content),
.bet-markets-scrollable :deep(.fancy-odds-btn.v-btn--disabled .v-btn__content *),
.bet-markets-scrollable :deep(.fancy-odds-btn.v-btn[disabled] .v-btn__content),
.bet-markets-scrollable :deep(.fancy-odds-btn.v-btn[disabled] .v-btn__content *) {
  color: #000 !important;
  opacity: 1 !important;
}

/* Market status overlays — reference: transparent label layer over gray strip + dimmed odds */
.bet-markets-scrollable :deep(.status-overlay),
.bet-markets-scrollable :deep(.suspended-overlay),
.bet-markets-scrollable :deep(.fancy-market-status-overlay) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  z-index: 10 !important;
}

.bet-markets-scrollable :deep(.status-overlay__text),
.bet-markets-scrollable :deep(.suspended-overlay__text),
.bet-markets-scrollable :deep(.fancy-market-status-overlay__label) {
  color: #fff !important;
  font-size: 12px !important;
  font-weight: 400 !important;
  line-height: 16px !important;
  letter-spacing: normal !important;
  text-transform: none !important;
  text-shadow: none !important;
}

.bet-markets-scrollable :deep(.status-overlay--ball-running),
.bet-markets-scrollable :deep(.fancy-market-status-overlay--ball-running) {
  inset: 0 0 18px !important;
  height: auto !important;
  align-items: flex-start !important;
}

.bet-markets-scrollable :deep(.status-overlay--winner .status-overlay__text) {
  color: #66f28b !important;
}

@media (max-width: 767.98px) {
  .bet-markets-scrollable :deep(.sports-bet-back-label),
  .bet-markets-scrollable :deep(.sports-bet-lay-label),
  .bet-markets-scrollable :deep(.match-odds-header-col-label) {
    font-size: 12px !important;
    font-weight: 700 !important;
  }
}

.bet-markets-scrollable :deep(.v-btn .v-icon) {
  color: #1f2937 !important;
}

.bet-main-layout {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}

@media (max-width: 767.98px) {
  .bet-main-layout {
    gap: 3px;
  }
}

.bet-content-columns {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  gap: 10px;
  background: #ffffff;
}

.bet-header-fixed {
  flex-shrink: 0;
}

@media (max-width: 767.98px) {
  .bet-header-fixed {
    margin-bottom: 3px;
    background: #ffffff;
  }

  /* White side gutters + rounded purple bar (reference market header ul) */
  .bet-header-fixed :deep(.v-card) {
    background: #ffffff !important;
    background-color: #ffffff !important;
    padding: 0 0 !important;
    overflow: visible !important;
    border-radius: 0 !important;
  }

  .bet-header-fixed :deep(.bet-header-bar) {
    border-radius: 5px 5px 0 0 !important;
    overflow: hidden;
  }
}

/* Market filter pills — ALL | MATCH ODDS | BOOKMAKER | FANCY */
.bet-markets-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  padding: 8px 0 8px;
  margin: 0 0 2px;
  background: #ffffff;
}

.bet-markets-filter__pill {
  appearance: none;
  border: none;
  margin: 0;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 2.83px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #0c0a09;
  background: #d1d5db;
  transition: background-color 0.15s ease;
}

.bet-markets-filter__pill:hover {
  background: #c4c9d0;
}

.bet-markets-filter__pill--active {
  background: #ca86f3;
}

.bet-markets-filter__pill--active:hover {
  background: #ca86f3;
}

/* Desktop/tablet — transparent shell so purple bar shows rounded top like reference */
@media (min-width: 768px) {
  .bet-header-fixed :deep(.v-card) {
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
    overflow: visible !important;
  }
}

/* ============================================
   DESKTOP LAYOUT (>=1024px)
   Markets column scrolls (header included); slip column scrolls independently
   ============================================ */

/* Desktop only (>=1024px): inner scroll layout. Mobile/tablet scroll via v-container (see global :has() block). */
@media (min-width: 1024px) {

  /* Main page container - fills available space, no scroll */
  .bet-page-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden !important;
    width: 100%;
    max-width: none;
  }

  /* Main layout - header full width, two columns below */
  .bet-main-layout {
    flex: 1;
    overflow: hidden !important;
    min-height: 0;
  }

  .bet-content-columns {
    flex: 1;
    display: flex;
    flex-direction: row;
    overflow: hidden !important;
    min-height: 0;
    min-width: 0;
    width: 100%;
    max-width: none;
    gap: 0;
  }

  /* Markets grow to fill leftover space; slip stays fixed (homepage pattern on large screens) */
  .bet-markets-section {
    flex: 1 1 auto;
    width: auto;
    min-width: var(--layout-sports-middle-width);
    max-width: none;
    display: flex;
    flex-direction: column;
    overflow: hidden !important;
  }

  .bet-header-fixed {
    flex-shrink: 0;
    width: 100%;
  }

  /* Markets scroll — includes bet header */
  .bet-markets-scrollable {
    flex: 1;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    padding: 0 0px 8px 0px;
    min-height: 0;
    background: #ffffff;
  }

  /* Slip column — reference: 406px rail, 400px inner + 6px inset */
  .bet-slip-fixed {
    flex: 0 0 var(--bet-slip-rail-width);
    width: var(--bet-slip-rail-width);
    min-width: var(--bet-slip-rail-width);
    max-width: var(--bet-slip-rail-width);
    overflow-y: auto;
    background-color: #ffffff;
    padding: 0 0 8px 6px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    min-height: 0;
    align-self: flex-start;
  }

  .bet-slip-fixed .sports-bet-slip-root {
    width: 400px;
    max-width: 400px;
    min-width: 400px;
    flex: 0 0 auto;
  }

  /* Custom scrollbar for markets area */
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
}
@media (min-width: 768px) and (max-width: 1023px) {
  .bet-markets-scrollable {
    padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
  }
}

@media (max-width: 767px) {
  .bet-markets-scrollable {
    padding-left: 5px;
    padding-right: 5px;
    /* Bottom inset lives on #app-main-scroll — avoid double padding here */
    padding-bottom: 0 !important;
  }

  .fancy-premium-vcard {
    margin-bottom: 0 !important;
  }

  .fancy-premium-section {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
  }

  .fancy-premium-content :deep(.v-window__container) {
    height: auto !important;
  }

  .fancy-premium-content :deep(.v-window-item) {
    min-height: 0 !important;
  }
}

/* ============================================
   Legacy styles
   ============================================ */

/* Ensure proper text direction and layout */
.v-navigation-drawer {
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
}

.v-navigation-drawer .v-navigation-drawer__content {
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
  display: flex !important;
  flex-direction: column !important;
}

/* Prevent text rotation */
* {
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
}


/* Mobile Floating Bet Button */
.mobile-bet-fab {
  position: fixed !important;
  bottom: 20px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  z-index: 100 !important;
  border-radius: 50px !important;
  padding: 0 24px !important;
  min-width: 160px !important;
  height: 56px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {

  0%,
  100% {
    box-shadow: 0 4px 20px color-mix(in srgb, var(--color-nav) 40%, transparent);
  }

  50% {
    box-shadow: 0 4px 30px color-mix(in srgb, var(--color-nav) 60%, transparent);
  }
}

/* Fancy / Premium — dark tab chrome; market body stays light in Fancy.vue */
.fancy-premium-vcard {
  background: transparent !important;
  box-shadow: none !important;
}

.fancy-premium-section {
  background: transparent;
}

.fancy-premium-content {
  /* background: #efefef; */
  padding-bottom: 0;
  box-sizing: border-box;
}

.fancy-premium-content :deep(.v-window),
.fancy-premium-content :deep(.v-window__container),
.fancy-premium-content :deep(.v-window-item) {
  background: transparent !important;
}

.fancy-premium-content :deep(.v-window-item) {
  padding: 0 !important;
}

/* Fancy / Premium parent tabs — compact pill strip (matches mobile on all breakpoints) */
.fancy-premium-header-shell {
  border: none;
  background: transparent;
  padding: 0;
  margin-top: 20px;
  box-sizing: border-box;
}

.fancy-premium-header-shell > div:first-of-type {
  width: 100%;
  padding: 0 !important;
}

.fancy-fp-toolbar {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 0;
  width: 100%;
  max-width: 100%;
  border: none;
  border-bottom: none;
  border-radius: 5px 5px 0 0;
  box-sizing: border-box;
  background: transparent;
  padding: 0;
  min-height: 33px;
  height: 33px;
}

.fancy-fp-toolbar .fancy-fp-hit {
  flex: 0 0 50%;
  max-width: 50%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 33px;
  height: 33px;
  box-sizing: border-box;
  position: relative;
}

.fancy-fp-hit {
  cursor: pointer;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
}

.fancy-fp-pill,
.fancy-fp-text {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 33px;
  height: 33px;
  padding: 0 0.75rem;
  border: 0 !important;
  border-radius: 4px 4px 0 0;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 15px;
  text-transform: none;
  box-sizing: border-box;
}

.fancy-fp-text {
  background: #d1d5db !important;
  color: var(--color-header-bg, #360952) !important;
}

.fancy-fp-text:hover {
  background: #d1d5db !important;
  color: var(--color-header-bg, #360952) !important;
}

.fancy-fp-pill--active {
  background: var(--color-header-bg) !important;
  color: #ffffff !important;
  z-index: 1;
}

.fancy-fp-hit:first-child.fancy-fp-pill--active,
.fancy-fp-hit:last-child.fancy-fp-pill--active {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.fancy-fp-premium-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  line-height: 1.1;
}

.fancy-fp-new-badge {
  position: static;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 2px 4px;
  font-size: 0.5625rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  line-height: 1;
  color: #000;
  background: yellow;
  border-radius: 2px;
  /* Same blink as top-nav Fantasy 11 (.nav-tab-tagmenu) */
  animation: fancy-fp-new-blink 2s ease-out infinite;
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
  pointer-events: none;
  z-index: 2;
}

@keyframes fancy-fp-new-blink {
  0% {
    background: red;
    color: #ffffff;
  }

  50% {
    background: #ffffff;
    color: red;
  }

  100% {
    background: yellow;
    color: #000000;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fancy-fp-new-badge {
    animation: none;
    background: yellow;
    color: #000;
  }
}

.fancy-fp-label-mobile {
  display: none;
}

.fancy-fp-label-desktop {
  display: inline;
}

@media (min-width: 768px) and (max-width: 1023px) {
  .fancy-premium-section {
    margin-bottom: 0 !important;
    border-radius: 0 !important;
    padding-bottom: 0 !important;
  }

  .fancy-premium-content {
    padding-bottom: 0 !important;
  }
}

@media (min-width: 768px) {
  .fancy-premium-header-shell h2 {
    display: none;
  }

  .fancy-premium-content {
    padding-bottom: 0 !important;
  }

  .fancy-fp-pill,
  .fancy-fp-text {
    font-size: 12px;
  }

  /* Premium: less right pad — badge already adds width beside the label */
  .fancy-fp-toolbar .fancy-fp-premium.fancy-fp-pill,
  .fancy-fp-toolbar .fancy-fp-premium.fancy-fp-text {
    padding-right: 0.5rem;
  }

  .fancy-fp-new-badge {
    font-size: 0.6875rem;
    padding: 2px 5px;
  }
}

@media (max-width: 767px) {
  .fancy-fp-label-mobile {
    display: inline;
  }

  .fancy-fp-label-desktop {
    display: none;
  }

  .fancy-fp-pill,
  .fancy-fp-text {
    font-size: 10px;
    padding: 0;
  }

  .fancy-premium-content {
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
<!-- Global styles to control parent container -->
<style>
/* Mobile: v-container is the scroll box (overflow-y-auto, bounded by v-main__wrap fix in main.css).
   Multi-market uses its own absolute fill + inner scroll — this padding rule is for single-bet only. */
@media (min-width: 768px) and (max-width: 1023px) {
  .v-main .v-container:has(.bet-page-container) {
    padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
  }
}

@media (max-width: 767px) {
  .v-main .v-container:has(.bet-page-container) {
    /* No tail padding — avoids empty grey gap after last market; one-click bar is fixed overlay */
    padding-bottom: env(safe-area-inset-bottom, 0px) !important;
    overscroll-behavior-y: none;
    -webkit-overflow-scrolling: touch;
    width: 100% !important;
    max-width: 100% !important;
  }

  .bet-page-container {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
  }

  .v-main.layout-v-main--mobile-bet,
  .v-main.layout-v-main--mobile-bet .v-main__wrap {
    overscroll-behavior-y: none;
  }
}

/* Desktop only: absolute fill so inner .bet-markets-scrollable gets a bounded height and can scroll */
@media (min-width: 1024px) {

  .bet-page-container {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    margin: 0 !important;
  }

  /* Ensure parent container is positioned for absolute child */
  .v-container:has(.bet-page-container) {
    position: relative !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  /* Vuetify wrap must shrink inside flex column or inner overflow-y:auto never gets a height */
  .v-main:has(.v-container .bet-page-container) .v-main__wrap {
    min-height: 0 !important;
    flex: 1 1 auto !important;
    display: flex !important;
    flex-direction: column !important;
  }
}
</style>
