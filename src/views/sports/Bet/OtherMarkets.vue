<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue';
import useDevices from '@/composables/useDevices';
import NonFancyCalculator from '@/composables/PayoutCalculators/NonFancyCalculator';
import RunnerPayouts from '@/components/sports/RunnerPayouts.vue';
import RunnerStatusOverlay from '@/components/RunnerStatusOverlay.vue';
// import PinIcon from '@/components/PinIcon.vue';
import { useBetStore } from '@/stores/bet';
import useFavoriteMarkets from '@/composables/useFavoriteMarkets';
import { useRunnerCppEmitter } from '@/composables/useRunnerCppEmitter';
import numeral from 'numeral';
import { formatMarketBetLimit } from '@/utils/marketBetLimitFormat.js';
import CashoutButton from '@/components/CashoutButton.vue';
import { isTossMarket } from './bookmaker/bookmakerTypes.js';
import { isMarketSuspended } from '@/utils/eventData';
import {
  getBetLockOverlayStatus,
  isBetLockInteractionBlockedForMarket,
  isMarketBetAllow,
} from '@/utils/betLockOverlay';

const { isDesktop } = useDevices();
const betStore = useBetStore();
const { toggleFavorite, isFavorited } = useFavoriteMarkets();

const props = defineProps({
  markets: Object,
  selectedBet: Object,
  betHistory: {
    type: Array,
    default: null
  },
  betOutcomes: {
    type: Object,
    default: null
  },
  eventTypeId: [String, Number],
  eventName: String,
  betAllow: Boolean,
  eventId: [String, Number],
  providerId: [String, Number],
  inPlay: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Function,
    default: () => false
  },
  onToggleFavorite: {
    type: Function,
    default: null
  },
  onRunnerCppUpdate: {
    type: Function,
    default: null
  },
  cashoutActive: {
    type: Boolean,
    default: true
  },
  speedCashoutActive: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits([]);

const UNAVAILABLE_MARKET_STATUSES = [
  'SUSPENDED',
  'CLOSED',
  'INACTIVE',
  'REMOVED',
  'UNAVAILABLE',
  'NOT_AVAILABLE',
  'NOT AVAILABLE',
];

const getMarketStatusValue = (market) =>
  market?.status ?? market?.market_status ?? market?.marketStatus ?? null;

const isMarketUnavailable = (market) => {
  if (!market) return false;
  if (market.active === false || market.active === 0 || market.active === '0') return true;
  const status = String(getMarketStatusValue(market) || '').toUpperCase();
  return UNAVAILABLE_MARKET_STATUSES.includes(status);
};

const getMarketOverlayStatus = (market) => {
  if (!market) return null;
  const status = String(getMarketStatusValue(market) || '').toUpperCase();
  if (status === 'BALL_RUNNING' || status === 'BALL RUNNING') return 'BALL RUNNING';
  if (isMarketUnavailable(market)) return 'SUSPENDED';
  return getMarketStatusValue(market);
};

// Helper function to get runner status (matching admin logic)
const getRunnerStatus = (runner, market = null) => {
  const statusStr = String(runner?.status || '').toUpperCase();
  const marketStatusStr = String(getMarketStatusValue(market) || '').toUpperCase();
  const marketUnavailable = isMarketUnavailable(market);
  return {
    suspended:
      statusStr === 'SUSPENDED' ||
      marketUnavailable ||
      UNAVAILABLE_MARKET_STATUSES.includes(marketStatusStr),
    ballRunning:
      statusStr === 'BALL_RUNNING' ||
      statusStr === 'BALL RUNNING' ||
      marketStatusStr === 'BALL_RUNNING' ||
      marketStatusStr === 'BALL RUNNING',
  };
};

const getOverlayRunnerStatus = (runner, market) => {
  const betLockStatus = getBetLockOverlayStatus({
    betAllow: props.betAllow,
    marketBetAllow: isMarketBetAllow(market, { inPlay: props.inPlay }),
    inPlay: props.inPlay,
  });
  if (betLockStatus) return betLockStatus;

  const status = String(runner?.status || '').toUpperCase();
  if (status && status !== 'ACTIVE') {
    return status === 'BALL_RUNNING' || status === 'BALL RUNNING' ? runner?.status : 'SUSPENDED';
  }
  return runner?.status;
};

const getOverlayMarketStatus = (market) => {
  const betLockStatus = getBetLockOverlayStatus({
    betAllow: props.betAllow,
    marketBetAllow: isMarketBetAllow(market, { inPlay: props.inPlay }),
    inPlay: props.inPlay,
  });
  if (betLockStatus) return betLockStatus;
  if (isMarketSuspended(market)) return 'SUSPENDED';
  return market?.status;
};

const isBetLockBlocked = (market) =>
  isBetLockInteractionBlockedForMarket(market, { betAllow: props.betAllow, inPlay: props.inPlay });

const getRunnerId = (runner) => {
  return runner?.selection_id || runner?.selectionId || runner?.id || runner?.values?.[0];
};

// Helper function to extract prices (matching admin ExtraMarkets logic)
const getRunnerPrices = (runner) => {
  return {
    // Back prices (3 levels for desktop)
    back3Price: runner?.back?.[2]?.price ?? runner?.values?.[2],
    back3Size: runner?.back?.[2]?.size ?? runner?.values?.[3],
    back2Price: runner?.back?.[1]?.price ?? runner?.values?.[4],
    back2Size: runner?.back?.[1]?.size ?? runner?.values?.[5],
    back1Price: runner?.priceBack ?? runner?.back?.[0]?.price ?? runner?.values?.[6],
    back1Size: runner?.sizeBack ?? runner?.back?.[0]?.size ?? runner?.values?.[7],

    // Lay prices (3 levels for desktop)
    lay1Price: runner?.priceLay ?? runner?.lay?.[0]?.price ?? runner?.values?.[8],
    lay1Size: runner?.sizeLay ?? runner?.lay?.[0]?.size ?? runner?.values?.[9],
    lay2Price: runner?.lay?.[1]?.price ?? runner?.values?.[10],
    lay2Size: runner?.lay?.[1]?.size ?? runner?.values?.[11],
    lay3Price: runner?.lay?.[2]?.price ?? runner?.values?.[12],
    lay3Size: runner?.lay?.[2]?.size ?? runner?.values?.[13],
  };
};

const selectBet = async (odd, backOrLay, runnerId, runnerName, marketId, eventId, type, minAmount, maxAmount, betting_type, runnerCount) => {
  const m = marketsArray.value.find((mm) => String(mm?.market_id) === String(marketId));
  if (isBetLockInteractionBlockedForMarket(m, { betAllow: props.betAllow, inPlay: props.inPlay })) {
    return;
  }

  await betStore.handleSelectBet({
    odd,
    backOrLay,
    runnerId,
    runnerName,
    marketId: marketId,
    eventId: eventId || props.eventId,
    type: 'OTHER',
    betting_type: betting_type || 'ODDS',
    marketTypeName: 'OtherMarkets',
    minAmount,
    maxAmount,
    bet_delay: m?.bet_delay
  }, props.eventTypeId, props.eventName, runnerCount || 0);
}

const marketsArray = computed(() => {
  if (!props.markets) return [];
  const arr = Array.isArray(props.markets) ? props.markets : Object.values(props.markets);
  if (String(props.eventTypeId) === '1') {
    const getGroup = (market) => {
      const name = (market?.name || market?.market_name || '').toLowerCase();
      if (name.includes('half')) return 0;
      if (name.includes('goal')) return 1;
      return 2;
    };
    return [...arr].sort((a, b) => {
      const aGroup = getGroup(a);
      const bGroup = getGroup(b);
      if (aGroup !== bGroup) return aGroup - bGroup;
      const aName = (a?.name || a?.market_name || '').toLowerCase();
      const bName = (b?.name || b?.market_name || '').toLowerCase();
      // Within the "half" group, "half time" comes first
      if (aGroup === 0) {
        const aIsHalfTime = aName.includes('half time');
        const bIsHalfTime = bName.includes('half time');
        if (aIsHalfTime !== bIsHalfTime) return aIsHalfTime ? -1 : 1;
      }
      return aName.localeCompare(bName);
    });
  }
  return arr;
});

const marketIds = computed(() => {
  const result = {};

  marketsArray.value.forEach(market => {
    if (market && market.market_id && market.runners) {
      result[market.market_id] = market.runners.map(runner => getRunnerId(runner));
    }
  });

  return result;
});

// Use event-specific betOutcomes if provided, otherwise fall back to betStore
const eventBetOutcomes = computed(() => {
  return props.betOutcomes ?? betStore.betOutcomes;
});

const betSummary = computed(() => {
  const { betSummary } = NonFancyCalculator(marketIds.value, props.selectedBet, eventBetOutcomes.value);
  return betSummary;
});

const activeMarketId = computed(() => {
  if (!props.selectedBet?.market_id) return null;
  return String(props.selectedBet.market_id);
});

const activeMarket = computed(() => {
  if (!activeMarketId.value) return null;
  return marketsArray.value.find((market) => String(market?.market_id) === activeMarketId.value) || null;
});

useRunnerCppEmitter({
  getSummary: () => betSummary.value?.[activeMarket.value?.market_id],
  getRunners: () => activeMarket.value?.runners || [],
  getMeta: () => ({
    eventId: activeMarket.value?.event_id || props.eventId,
    marketId: activeMarket.value?.market_id,
    marketName: activeMarket.value?.name || activeMarket.value?.market_name || 'Other Market'
  }),
  payloadOptions: {
    getRunnerKey: (runner) => getRunnerId(runner),
    getRunnerName: (runner, index) => runner?.name || runner?.runnerName || runner?.selectionName || `Runner ${index + 1}`
  },
  onRunnerCppUpdate: props.onRunnerCppUpdate,
  watchSources: () => [betSummary.value, activeMarketId.value]
});

// Helper function to handle favorite toggle
const handleToggleFavorite = (marketId, eventId) => {
  const finalEventId = eventId || props.eventId;
  // Check if onToggleFavorite was actually provided (not just default null)
  if (props.onToggleFavorite && typeof props.onToggleFavorite === 'function') {
    // Use parent's handler if provided (for MultiMarket page)
    props.onToggleFavorite(marketId, finalEventId);
  } else {
    // Otherwise use the composable (for regular bet page)
    toggleFavorite(marketId, finalEventId);
  }
};

// Helper function to check if favorited
const isMarketFavorited = (marketId, eventId) => {
  const finalEventId = eventId || props.eventId;
  // Check if onToggleFavorite was provided - if so, we're in MultiMarket context and should use props
  if (props.onToggleFavorite && typeof props.onToggleFavorite === 'function') {
    // Use parent's function if provided (MultiMarket page)
    return props.isFavorite ? props.isFavorite(marketId) : false;
  }
  // Otherwise use the composable (regular bet page)
  return isFavorited(marketId, finalEventId);
};
</script>

<template>
  <div v-for="(market, key) in marketsArray" :key="key">
    <div
      v-if="market"
      class="other-markets-root tw-overflow-hidden tw-border tw-border-[#d9d9d9] tw-bg-[#efefef]"
    >
      <div v-if="market?.message" class="market-message-banner">
        <marquee class="tw-text-xs tw-text-marquee">
          {{ market?.message }}
        </marquee>
      </div>
      <!-- Header: gold strip + diagonal cut (reference layout) -->
      <div class="other-markets-header-bar mo-bl-header-bar tw-flex tw-flex-row tw-items-stretch tw-overflow-hidden tw-border-b tw-border-[#d9d9d9]">
        <!-- LEFT: gold + title / pills (Match Odds / Bookmaker reference) -->
        <div
          class="other-markets-orange-header tw-relative tw-z-0 tw-flex tw-flex-nowrap tw-items-center tw-gap-x-1 tw-bg-gradient-to-r tw-from-[#b88f2f] tw-via-[#e7dc99] tw-to-[#ba9336] tw-pl-2 tw-pr-7 tw-py-1 tw-basis-[58%] tw-min-w-[220px] tw-max-w-[320px] md:tw-shrink md:tw-basis-auto md:tw-min-w-0 md:tw-max-w-[min(100%,260px)] md:tw-px-2.5 md:tw-py-1">
          <div class="tw-flex tw-min-w-0 tw-shrink tw-items-center md:tw-gap-2.5">
            <!-- PinIcon hidden — market header favourite pin disabled for now
            <PinIcon
              :active="isMarketFavorited(market?.market_id, market?.event_id)"
              size="16"
              class="match-odds-pin tw-shrink-0"
              @click="handleToggleFavorite(market?.market_id, market?.event_id)"
            />
            -->
            <div class="tw-flex tw-min-w-0 tw-flex-1 tw-flex-nowrap tw-items-center tw-gap-x-1 md:tw-gap-x-1.5">
              <span
                class="other-markets-section-title match-odds-section-title tw-relative tw-z-[2] tw-min-w-0 tw-font-bold tw-text-black tw-uppercase tw-text-[10px] tw-leading-tight sm:tw-text-[11px] md:tw-leading-tight"
                :title="market?.name || market?.market_name"
              >
                {{ market?.name || market?.market_name }}
              </span>
            </div>
          </div>
          <CashoutButton
              v-if="market?.runners?.length === 2 && !isTossMarket(market)"
              class="market-header-cashout tw-flex-none tw-relative tw-z-[3]"
              :marketId="market?.market_id"
              :runners="market?.runners"
              :outcomes="eventBetOutcomes"
              :betAllow="props.betAllow && isMarketBetAllow(market, { inPlay: props.inPlay })"
              :marketStatus="market?.status"
              :eventId="market?.event_id || props.eventId"
              :eventTypeId="props.eventTypeId"
              :eventName="props.eventName"
              :providerId="props.providerId"
              :minBet="market?.min_bet"
              :maxBet="market?.max_bet"
              :bettingType="market?.betting_type"
              marketType="OTHER"
              marketTypeName="OtherMarkets"
          :cashoutActive="props.cashoutActive" :speedCashoutActive="props.speedCashoutActive"
              size="x-small" />
          <div class="other-markets-header-cut" aria-hidden="true"></div>
          <div class="other-markets-header-cut-fold" aria-hidden="true"></div>
        </div>

        <!-- RIGHT: MIN / MAX + BACK / LAY -->
        <div
          class="other-markets-header-grey tw-relative tw-z-[1] tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-between tw-gap-1.5 tw-bg-[#efefef] tw-py-1 tw-pl-1 tw-pr-0 tw-w-auto md:tw-grid md:tw-grid-cols-[minmax(0,1fr)_auto] md:tw-items-center md:tw-justify-start md:tw-gap-x-3 md:tw-gap-y-0 md:tw-pl-2 md:tw-pr-0 md:tw-py-1">
          <div
            class="sports-bet-header-limits other-markets-header-limits tw-ml-auto tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-x-1 tw-gap-y-0 tw-text-right tw-font-semibold tw-leading-none md:tw-ml-0 md:tw-min-w-0 md:tw-w-full md:tw-shrink md:tw-flex-nowrap md:tw-justify-center md:tw-overflow-visible md:tw-whitespace-nowrap md:tw-text-center md:tw-font-semibold md:tw-text-[#525252]"
          >
            <span class="match-odds-header-limit-text tw-whitespace-nowrap">Min:{{ formatMarketBetLimit(market?.min_bet) }}</span>
            <span class="match-odds-header-limit-text tw-whitespace-nowrap">Max:{{ formatMarketBetLimit(market?.max_bet) }}</span>
          </div>
          <!-- BACK / LAY (tablet 768–1024) -->
          <div class="other-markets-header-backlay-inline tw-flex tw-min-w-0 tw-shrink-0 md:tw-justify-self-end">
            <div class="other-market-header-groups odds-header-groups odds-header-groups--dual tw-text-center">
              <span class="match-odds-header-col-label sports-bet-back-label">Back</span>
              <span class="match-odds-header-col-label sports-bet-lay-label">Lay</span>
            </div>
          </div>
        </div>

        <!-- Desktop: BACK over 2nd blue cell, LAY over 2nd pink cell -->
        <div class="other-markets-header-backlay-col tw-hidden tw-items-center tw-justify-center tw-bg-[#efefef] tw-border-b tw-border-[#d9d9d9] tw-py-1 tw-pr-0">
          <div class="other-market-header-groups odds-header-groups odds-header-groups--six tw-text-center">
            <span class="match-odds-header-col-label sports-bet-back-label">Back</span>
            <span class="match-odds-header-col-label sports-bet-lay-label">Lay</span>
          </div>
        </div>
      </div>

      <!-- Runners -->
      <v-card-text
        class="other-markets-runners odds-buttons-container tw-p-0"
        :class="{ 'bet-allow-disabled': isBetLockBlocked(market) || isMarketSuspended(market) }"
      >
        <div v-if="market.runners?.length">
          <div v-for="(runner, index) in market.runners" :key="getRunnerId(runner)"
            class="other-markets-runner-row match-odds-runner-row tw-px-1 tw-py-1 tw-bg-white row-separator last:tw-border-b-0 md:tw-py-0"
            :data-market-id="market.market_id"
            :data-runner-id="getRunnerId(runner)"
          >
            <div class="tw-flex tw-justify-between tw-items-center tw-gap-2 md:tw-gap-2 tw-min-w-0">
              <!-- Runner Name and Payout Info -->
              <div class="tw-flex-1 tw-min-w-0 tw-pr-1">
                <h3 class="other-markets-runner-name match-odds-runner-name tw-mb-0 tw-break-words tw-text-black md:tw-leading-snug">
                  {{ runner?.name || runner?.runnerName || runner?.selectionName || `Runner ${index + 1}` }}
                </h3>
                <RunnerPayouts
                  v-if="betSummary[market.market_id]?.[getRunnerId(runner)]?.potential_payout || betSummary[market.market_id]?.[getRunnerId(runner)]?.current_potential_payout != null"
                  :potential-payout="betSummary[market.market_id]?.[getRunnerId(runner)]?.potential_payout"
                  :current-potential-payout="betSummary[market.market_id]?.[getRunnerId(runner)]?.current_potential_payout"
                />
              </div>

              <!-- Betting Buttons Container -->
              <div class="other-markets-odds-ladder match-odds-odds-ladder tw-relative tw-flex tw-items-center tw-gap-2 md:tw-gap-2 tw-shrink-0">
                <div class="match-odds-odds-strip other-markets-odds-strip tw-relative tw-flex tw-items-center tw-gap-2 md:tw-gap-2">
                <!-- Back Buttons -->
                <div class="tw-flex tw-gap-2 md:tw-gap-2 back-group">
                  <v-btn v-if="isDesktop" size="default" rounded="0"
                    class="match-odds-price-cell odds-back-bg-3 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-flex-shrink-0 tw-bg-odds-back hover:tw-bg-odds-back-hover tw-text-black tw-font-bold"
                    :disabled="getRunnerStatus(runner, market).suspended || getRunnerStatus(runner, market).ballRunning || !props.betAllow || isBetLockBlocked(market) || isMarketSuspended(market)"
                    @click="selectBet(getRunnerPrices(runner).back3Price, 'back', getRunnerId(runner), runner?.name, market?.market_id, market?.event_id, market.market_name, market.min_bet, market.max_bet, market.betting_type, market.runners.length)"
                    variant="elevated">
                    <div class="tw-text-center tw-w-full">
                      <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ getRunnerPrices(runner).back3Price ?? 0 }}</div>
                      <div class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                        {{ getRunnerPrices(runner).back3Size ?? '0.0' }}
                      </div>
                    </div>
                  </v-btn>

                  <v-btn v-if="isDesktop" size="default" rounded="0"
                    class="match-odds-price-cell odds-back-bg-2 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-flex-shrink-0 tw-bg-odds-back hover:tw-bg-odds-back-hover tw-text-black tw-font-bold"
                    :disabled="getRunnerStatus(runner, market).suspended || getRunnerStatus(runner, market).ballRunning || !props.betAllow || isBetLockBlocked(market) || isMarketSuspended(market)"
                    @click="selectBet(getRunnerPrices(runner).back2Price, 'back', getRunnerId(runner), runner?.name, market?.market_id, market?.event_id, market.market_name, market.min_bet, market.max_bet, market.betting_type, market.runners.length)"
                    variant="elevated">
                    <div class="tw-text-center tw-w-full">
                      <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ getRunnerPrices(runner).back2Price ?? 0 }}</div>
                      <div class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                        {{ getRunnerPrices(runner).back2Size ?? '0.0' }}
                      </div>
                    </div>
                  </v-btn>

                  <v-btn size="default" rounded="0"
                    class="match-odds-price-cell odds-back-bg-1 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-back hover:tw-bg-odds-back-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                    :disabled="getRunnerStatus(runner, market).suspended || getRunnerStatus(runner, market).ballRunning || !props.betAllow || isBetLockBlocked(market) || isMarketSuspended(market)"
                    @click="selectBet(getRunnerPrices(runner).back1Price, 'back', getRunnerId(runner), runner?.name, market?.market_id, market?.event_id, market.market_name, market.min_bet, market.max_bet, market.betting_type, market.runners.length)"
                    variant="elevated">
                    <div class="tw-text-center tw-w-full">
                      <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ getRunnerPrices(runner).back1Price ?? 0 }}</div>
                      <div class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                        {{ getRunnerPrices(runner).back1Size ?? '0.0' }}
                      </div>
                    </div>
                  </v-btn>
                </div>

                <!-- Lay Buttons -->
                <div class="tw-flex tw-gap-2 md:tw-gap-2 lay-group">
                  <v-btn size="default" rounded="0"
                    class="match-odds-price-cell odds-lay-bg-1 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-lay hover:tw-bg-odds-lay-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                    :disabled="getRunnerStatus(runner, market).suspended || getRunnerStatus(runner, market).ballRunning || !props.betAllow || isBetLockBlocked(market) || isMarketSuspended(market)"
                    @click="selectBet(getRunnerPrices(runner).lay1Price, 'lay', getRunnerId(runner), runner?.name, market?.market_id, market?.event_id, market.market_name, market.min_bet, market.max_bet, market.betting_type, market.runners.length)"
                    variant="elevated">
                    <div class="tw-text-center tw-w-full">
                      <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ getRunnerPrices(runner).lay1Price ?? 0 }}</div>
                      <div class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                        {{ getRunnerPrices(runner).lay1Size ?? '0.0' }}
                      </div>
                    </div>
                  </v-btn>

                  <v-btn v-if="isDesktop" size="default" rounded="0"
                    class="match-odds-price-cell odds-lay-bg-2 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-lay hover:tw-bg-odds-lay-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                    :disabled="getRunnerStatus(runner, market).suspended || getRunnerStatus(runner, market).ballRunning || !props.betAllow || isBetLockBlocked(market) || isMarketSuspended(market)"
                    @click="selectBet(getRunnerPrices(runner).lay2Price, 'lay', getRunnerId(runner), runner?.name, market?.market_id, market?.event_id, market.market_name, market.min_bet, market.max_bet, market.betting_type, market.runners.length)"
                    variant="elevated">
                    <div class="tw-text-center tw-w-full">
                      <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ getRunnerPrices(runner).lay2Price ?? 0 }}</div>
                      <div class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                        {{ getRunnerPrices(runner).lay2Size ?? '0.0' }}
                      </div>
                    </div>
                  </v-btn>

                  <v-btn v-if="isDesktop" size="default" rounded="0"
                    class="match-odds-price-cell odds-lay-bg-3 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-lay hover:tw-bg-odds-lay-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                    :disabled="getRunnerStatus(runner, market).suspended || getRunnerStatus(runner, market).ballRunning || !props.betAllow || isBetLockBlocked(market) || isMarketSuspended(market)"
                    @click="selectBet(getRunnerPrices(runner).lay3Price, 'lay', getRunnerId(runner), runner?.name, market?.market_id, market?.event_id, market.market_name, market.min_bet, market.max_bet, market.betting_type, market.runners.length)"
                    variant="elevated">
                    <div class="tw-text-center tw-w-full">
                      <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ getRunnerPrices(runner).lay3Price ?? 0 }}</div>
                      <div class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                        {{ getRunnerPrices(runner).lay3Size ?? '0.0' }}
                      </div>
                    </div>
                  </v-btn>
                </div>

                <!-- Suspended/Status Overlay -->
                <RunnerStatusOverlay
                  class="other-markets-status-overlay"
                  :runner-status="getOverlayRunnerStatus(runner, market)"
                  :market-status="getOverlayMarketStatus(market)"
                  :ball-running="getRunnerStatus(runner).ballRunning"
                />
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </div>
  </div>
</template>

<style scoped>
.v-btn:disabled {
  opacity: 1 !important;
}

.bet-allow-disabled {
  --v-disabled-opacity: 1;
}
.bet-allow-disabled .odds-back-bg-1.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-back-bg-1.v-btn[disabled] { background-color: var(--color-back-bg-1) !important; }
.bet-allow-disabled .odds-back-bg-2.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-back-bg-2.v-btn[disabled] { background-color: var(--color-back-bg-1) !important; }
.bet-allow-disabled .odds-back-bg-3.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-back-bg-3.v-btn[disabled] { background-color: var(--color-back-bg-1) !important; }
.bet-allow-disabled .odds-lay-bg-1.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-lay-bg-1.v-btn[disabled] { background-color: var(--color-lay-bg-1) !important; }
.bet-allow-disabled .odds-lay-bg-2.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-lay-bg-2.v-btn[disabled] { background-color: var(--color-lay-bg-1) !important; }
.bet-allow-disabled .odds-lay-bg-3.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-lay-bg-3.v-btn[disabled] { background-color: var(--color-lay-bg-1) !important; }
.bet-allow-disabled .v-btn:disabled {
  position: relative;
  opacity: 1 !important;
  color: #000 !important;
}
.bet-allow-disabled .v-btn:disabled .v-btn__content,
.bet-allow-disabled .v-btn:disabled * {
  color: inherit !important;
}
.bet-allow-disabled .v-btn:disabled::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
  border-radius: inherit;
}

/* Disabled ladder cells: hide Vuetify lock adornment so "-" stays visible */
.other-markets-root :deep(.match-odds-price-cell.v-btn--disabled .v-icon),
.other-markets-root :deep(.match-odds-price-cell[disabled] .v-icon) {
  display: none !important;
}

.tw-z-10 {
  z-index: 10 !important;
}

.row-separator {
  border-bottom: 1px solid #d8d8d8 !important;
}

.other-markets-root,
.other-markets-header-bar {
  max-width: 100%;
}

/* Orange bar → grey MIN/MAX: diagonal cross-cut + fold (same as Fancy Sessions / Match Odds / Bookmaker) */
.other-markets-orange-header .other-markets-header-cut,
.other-markets-orange-header .other-markets-header-cut-fold {
  pointer-events: none;
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 1.75rem;
}

.other-markets-orange-header .other-markets-header-cut {
  z-index: 2;
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  background-color: #efefef !important;
}

.other-markets-orange-header .other-markets-header-cut-fold {
  display: none !important;
}

@media (min-width: 768px) {
  .other-markets-root {
    background: #fff !important;
    border-color: #e5e7eb !important;
    font-family: inherit;
  }

  .other-markets-header-bar {
    min-height: 34px;
    border-bottom-color: #e5e7eb !important;
  }

  .other-markets-orange-header {
    background: var(--theme-orange) !important;
    min-height: 34px;
    padding: 8px 1.75rem 8px 10px !important;
    align-items: center;
  }

  .other-markets-orange-header .other-markets-section-title,
  .other-markets-orange-header .match-odds-section-title {
    font-family: inherit !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    letter-spacing: 0 !important;
    color: #ffffff !important;
    text-transform: uppercase;
  }

  .other-markets-root :deep(.match-odds-pin) {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .other-markets-root :deep(.match-odds-pin .v-icon) {
    color: #fff !important;
    opacity: 1;
  }

  .other-markets-root :deep(.match-odds-pin:hover) {
    transform: none;
  }

  .other-markets-orange-header .other-markets-header-cut {
    background-color: #efefef;
  }

  .other-markets-orange-header .match-odds-header-pill,
  .other-markets-orange-header .other-markets-header-pill {
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    padding: 2px 7px;
    font-size: 8px;
    font-weight: 800;
    line-height: 1.1;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    background-color: #c4c4c4;
    color: #4a4a4a;
  }

  .other-markets-orange-header .other-markets-header-cut,
  .other-markets-orange-header .other-markets-header-cut-fold {
    right: 0;
    width: 1.25rem;
  }

  .other-markets-header-grey {
    min-height: 34px;
    padding-top: 7px !important;
    padding-bottom: 7px !important;
    align-items: center;
  }

  .other-markets-header-limits {
    min-width: 0;
    text-align: center;
    justify-content: center !important;
    align-items: center !important;
    padding-left: 0 !important;
  }

  .other-markets-header-grey .other-markets-header-limits,
  .other-markets-header-grey .other-markets-header-limits .match-odds-header-limit-text {
    font-family: inherit !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    line-height: 1.2 !important;
    letter-spacing: 0 !important;
    color: #1f2937 !important;
    text-transform: none;
  }

  .other-markets-header-limits .match-odds-header-limit-text {
    font-size: inherit !important;
    font-weight: inherit !important;
    font-family: inherit !important;
    color: inherit !important;
    line-height: inherit !important;
    letter-spacing: inherit !important;
  }

  .other-markets-header-grey .other-market-header-groups .sports-bet-back-label,
  .other-markets-header-grey .other-market-header-groups .sports-bet-lay-label,
  .other-markets-header-backlay-col .odds-header-groups .sports-bet-back-label,
  .other-markets-header-backlay-col .odds-header-groups .sports-bet-lay-label {
    font-family: inherit;
    font-size: 12px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    letter-spacing: 0 !important;
    text-transform: none;
  }

  .other-markets-header-grey .other-market-header-groups .sports-bet-back-label {
    color: #111827 !important;
  }

  .other-markets-header-grey .other-market-header-groups .sports-bet-lay-label {
    color: #111827 !important;
  }

  .other-market-header-groups,
  .odds-header-groups {
    justify-items: center;
    text-align: center;
  }

  .other-markets-runners {
    background: #fff;
  }

  .other-markets-runner-row,
  .match-odds-runner-row {
    min-height: 43px;
    padding-top: 4px !important;
    padding-bottom: 2px !important;
    padding-left: 10px !important;
    padding-right: 0 !important;
    background: #fff !important;
    border-bottom: 1px solid #e0e0e0 !important;
  }

  .other-markets-runner-row .other-markets-runner-name,
  .other-markets-runner-row .match-odds-runner-name {
    font-family: inherit !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
    letter-spacing: 0 !important;
    color: #000 !important;
    text-transform: none;
  }

  .other-markets-runner-row:last-child,
  .match-odds-runner-row:last-child {
    border-bottom: none !important;
  }

  .other-markets-odds-ladder,
  .match-odds-odds-ladder {
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .other-markets-odds-ladder .back-group,
  .other-markets-odds-ladder .lay-group {
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .other-markets-root :deep(.match-odds-price-cell.v-btn) {
    width: 69px !important;
    min-width: 69px !important;
    height: var(--sports-bet-odds-btn-height-md) !important;
    min-height: var(--sports-bet-odds-btn-height-md) !important;
    max-height: var(--sports-bet-odds-btn-height-md) !important;
    padding: 0 !important;
    border-radius: var(--sports-bet-odds-btn-radius) !important;
    border: 1px solid rgba(0, 0, 0, 0.06) !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12) !important;
  }

  .other-markets-root :deep(.match-odds-price-cell .v-btn__overlay),
  .other-markets-root :deep(.match-odds-price-cell .v-btn__underlay) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .other-markets-root :deep(.odds-back-bg-1),
  .other-markets-root :deep(.odds-back-bg-2),
  .other-markets-root :deep(.odds-back-bg-3) {
    background: var(--color-back-bg-1) !important;
  }

  .other-markets-root :deep(.odds-back-bg-1:hover),
  .other-markets-root :deep(.odds-back-bg-2:hover),
  .other-markets-root :deep(.odds-back-bg-3:hover) {
    background: var(--color-back-hover) !important;
  }

  .other-markets-root :deep(.odds-lay-bg-1),
  .other-markets-root :deep(.odds-lay-bg-2),
  .other-markets-root :deep(.odds-lay-bg-3) {
    background: var(--color-lay-bg-1) !important;
  }

  .other-markets-root :deep(.odds-lay-bg-1:hover),
  .other-markets-root :deep(.odds-lay-bg-2:hover),
  .other-markets-root :deep(.odds-lay-bg-3:hover) {
    background: var(--color-lay-hover) !important;
  }

  .other-markets-root :deep(.match-odds-price-cell .v-btn__content) {
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 0 !important;
    padding: 1px 2px !important;
    min-height: 0 !important;
    line-height: 1.05 !important;
  }

  .other-markets-root :deep(.match-odds-price-cell .mo-price) {
    line-height: 1.05 !important;
    margin: 0 !important;
  }

  .other-markets-root :deep(.match-odds-price-cell .mo-size) {
    line-height: 1 !important;
    margin: 0 !important;
  }

  .other-markets-root :deep(.match-odds-price-cell .v-icon) {
    display: none !important;
  }


}

@media (max-width: 767.98px) {
  .other-market-header-groups-mobile,
  .odds-header-groups-mobile {
    grid-template-columns: var(--sports-bet-odds-btn-width) var(--sports-bet-odds-btn-width);
    column-gap: 0;
    width: var(--sports-bet-odds-pair-width);
    padding-left: 0;
  }

  .other-market-header-groups-mobile > span,
  .odds-header-groups-mobile > span {
    width: 69px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .other-market-header-groups-mobile > span:first-child,
  .odds-header-groups-mobile > span:first-child {
    transform: translateX(8px);
  }

  .other-markets-root {
    isolation: isolate;
  }

  .other-markets-root .mo-bl-header-bar {
    position: relative;
    z-index: 1;
  }

  .other-markets-root .other-markets-mobile-meta-row,
  .other-markets-root .match-odds-mobile-meta-row {
    position: relative;
    z-index: 2;
    padding-right: 0 !important;
  }

  .other-markets-root .other-markets-runners {
    position: relative;
    z-index: 2;
    padding-top: 0;
  }

  .other-markets-odds-ladder,
  .match-odds-odds-ladder {
    width: var(--sports-bet-odds-pair-width);
    min-width: var(--sports-bet-odds-pair-width);
    justify-content: flex-end;
    gap: 0 !important;
  }

  .other-markets-odds-strip {
    width: var(--sports-bet-odds-pair-width);
    min-width: var(--sports-bet-odds-pair-width);
    justify-content: flex-end;
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .other-markets-odds-strip > .back-group,
  .other-markets-odds-strip > .lay-group {
    width: 69px;
    min-width: 69px;
    gap: var(--sports-bet-odds-btn-gap) !important;
    position: relative;
    z-index: 1;
  }

  .other-markets-root .other-markets-odds-strip :deep(.status-overlay),
  .other-markets-root .other-markets-odds-strip :deep(.other-markets-status-overlay) {
    width: 100% !important;
    left: 0 !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    z-index: 10 !important;
  }

  .other-markets-root :deep(.match-odds-price-cell.v-btn),
  .other-markets-root :deep(.match-odds-price-cell) {
    width: 69px !important;
    min-width: 69px !important;
    height: var(--sports-bet-odds-btn-height) !important;
    min-height: var(--sports-bet-odds-btn-height) !important;
    max-height: var(--sports-bet-odds-btn-height) !important;
    padding: 0 !important;
    border-radius: var(--sports-bet-odds-btn-radius) !important;
    box-shadow: none !important;
  }

  .other-markets-root :deep(.match-odds-price-cell .v-btn__overlay),
  .other-markets-root :deep(.match-odds-price-cell .v-btn__underlay) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .other-markets-root :deep(.match-odds-price-cell .v-btn__content) {
    padding: 1px 2px !important;
    min-height: 0 !important;
  }

  .other-markets-root :deep(.match-odds-price-cell .v-icon) {
    font-size: 12px !important;
  }

  .other-markets-root .other-markets-odds-strip :deep(.status-overlay--loser .status-overlay__text) {
    font-size: 12px !important;
    font-weight: 400 !important;
    letter-spacing: normal !important;
    color: #fff !important;
  }
}

.other-market-header-groups,
.odds-header-groups {
  display: grid;
  grid-template-columns: var(--sports-bet-odds-btn-width) var(--sports-bet-odds-btn-width);
  column-gap: var(--sports-bet-odds-btn-gap);
  width: var(--sports-bet-odds-pair-width);
  align-items: center;
}

/*
 * BACK/LAY header grid must match visible ladder cells.
 * 768–1024: one back + one lay (82px + 82px).
 * 1025px+: six columns — BACK on col 2 (back-bg-2), LAY on col 5 (lay-bg-2).
 */
@media (min-width: 768px) and (max-width: 1024px) {
  .other-market-header-groups,
  .odds-header-groups,
  .odds-header-groups--dual {
    grid-template-columns: 69px 69px;
    width: var(--sports-bet-odds-pair-width);
    column-gap: var(--sports-bet-odds-btn-gap);
  }
}

@media (min-width: 1025px) {
  .other-markets-header-backlay-inline {
    display: none !important;
  }

  .other-markets-header-backlay-col {
    display: flex !important;
  }

  .other-markets-header-bar--aligned {
    display: grid !important;
    grid-template-columns: var(--sports-bet-orange-header-width-desktop) minmax(0, 1fr) var(--sports-bet-odds-six-width);
    align-items: stretch;
  }

  .other-markets-header-bar--aligned .other-markets-orange-header {
    grid-column: 1;
    min-width: 0;
    max-width: 100%;
    width: 100%;
  }

  .other-markets-header-bar--aligned .other-markets-header-grey {
    grid-column: 2;
    display: flex !important;
    align-items: center;
  }

  .other-markets-header-bar--aligned .other-markets-header-grey.md\:tw-grid {
    display: flex !important;
    grid-template-columns: unset !important;
  }

  .other-markets-header-bar--aligned .other-markets-header-backlay-col {
    grid-column: 3;
    min-width: var(--sports-bet-odds-six-width);
    max-width: var(--sports-bet-odds-six-width);
  }

  .other-market-header-groups.odds-header-groups--six,
  .odds-header-groups--six {
    display: grid;
    grid-template-columns: repeat(6, var(--sports-bet-odds-btn-width));
    column-gap: var(--sports-bet-odds-six-gap);
    width: var(--sports-bet-odds-six-width);
    align-items: center;
    justify-items: center;
  }

  .odds-header-groups--six .sports-bet-back-label {
    grid-column: 2;
  }

  .odds-header-groups--six .sports-bet-lay-label {
    grid-column: 5;
  }

  .other-markets-root .other-markets-odds-ladder,
  .other-markets-root .match-odds-odds-ladder {
    width: var(--sports-bet-odds-six-width);
    flex-shrink: 0;
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .other-markets-root .other-markets-odds-strip {
    width: var(--sports-bet-odds-six-width);
    flex-shrink: 0;
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .other-markets-root .other-markets-odds-strip > .back-group,
  .other-markets-root .other-markets-odds-strip > .lay-group {
    width: 215px;
    flex-shrink: 0;
    gap: var(--sports-bet-odds-btn-gap) !important;
    position: relative;
    z-index: 1;
  }

  .other-markets-root .other-markets-odds-strip :deep(.status-overlay),
  .other-markets-root .other-markets-odds-strip :deep(.other-markets-status-overlay) {
    width: 100% !important;
    left: 0 !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    z-index: 10 !important;
  }

  .other-markets-header-grey .odds-header-groups .sports-bet-back-label,
  .other-markets-header-grey .odds-header-groups .sports-bet-lay-label,
  .other-markets-header-backlay-col .odds-header-groups .sports-bet-back-label,
  .other-markets-header-backlay-col .odds-header-groups .sports-bet-lay-label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 1.25rem;
  }
}

.other-market-header-groups-mobile,
.odds-header-groups-mobile {
  display: none;
}

@media (max-width: 767.98px) {
  .other-market-header-groups-mobile,
  .odds-header-groups-mobile {
    display: grid;
    grid-template-columns: 69px 69px;
    column-gap: var(--sports-bet-odds-btn-gap);
    width: var(--sports-bet-odds-pair-width);
    align-items: center;
  }
}
</style>
