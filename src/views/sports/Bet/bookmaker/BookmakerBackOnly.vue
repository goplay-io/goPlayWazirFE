<script setup>
import { defineProps, computed, inject } from 'vue';
import useDevices from '@/composables/useDevices';
import NonFancyCalculator from '@/composables/PayoutCalculators/NonFancyCalculator';
import RunnerPayouts from '@/components/sports/RunnerPayouts.vue';
import RulesInfoButton from '@/components/RulesInfoButton.vue';
// import PinIcon from '@/components/PinIcon.vue';
import MarketMinMaxColumnRow from '@/components/MarketMinMaxColumnRow.vue';
import RunnerStatusOverlay from '@/components/RunnerStatusOverlay.vue';
import CashoutButton from '@/components/CashoutButton.vue';
import { useBetStore } from '@/stores/bet';
import useFavoriteMarkets from '@/composables/useFavoriteMarkets';
import numeral from 'numeral';
import { formatMarketBetLimit } from '@/utils/marketBetLimitFormat.js';
import { isCashoutEligibleBookmaker } from './bookmakerTypes.js';
import { useRunnerCppEmitter } from '@/composables/useRunnerCppEmitter';
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
  bookMakersData: Object,
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

// Process bookmaker data - handle new API structure
const bookmakersList = computed(() => {
  if (!props.bookMakersData) return [];

  // If it's an object, convert to array
  if (typeof props.bookMakersData === 'object' && !Array.isArray(props.bookMakersData)) {
    return Object.values(props.bookMakersData);
  }

  return Array.isArray(props.bookMakersData) ? props.bookMakersData : [];
});

// Extract runner IDs for payout calculation
const marketIds = computed(() => {
  const result = {};

  bookmakersList.value.forEach(bookmaker => {
    if (bookmaker?.market_id && bookmaker?.runners?.length > 0) {
      result[bookmaker.market_id] = bookmaker.runners.map(runner =>
        String(runner.selection_id || runner.id)
      );
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

const activeBookmaker = computed(() => {
  if (!activeMarketId.value) return null;
  return bookmakersList.value.find((bookmaker) => String(bookmaker?.market_id) === activeMarketId.value) || null;
});

useRunnerCppEmitter({
  getSummary: () => betSummary.value?.[activeBookmaker.value?.market_id],
  getRunners: () => activeBookmaker.value?.runners || [],
  getMeta: () => ({
    eventId: props.eventId,
    marketId: activeBookmaker.value?.market_id,
    marketName: activeBookmaker.value?.name || 'Back Only'
  }),
  onRunnerCppUpdate: props.onRunnerCppUpdate,
  watchSources: () => [betSummary.value, activeMarketId.value]
});

const isBetLockBlocked = (bookmaker) =>
  isBetLockInteractionBlockedForMarket(bookmaker, { betAllow: props.betAllow, inPlay: props.inPlay });

const getRunnerOverlayStatus = (runner, bookmaker) =>
  getBetLockOverlayStatus({
    betAllow: props.betAllow,
    marketBetAllow: isMarketBetAllow(bookmaker, { inPlay: props.inPlay }),
    inPlay: props.inPlay,
  }) ?? (runner?.status !== 'ACTIVE' ? 'SUSPENDED' : runner?.status);

const selectBet = async (odd, backOrLay, runnerId, runnerName, bookmakerTitle, marketId, minAmount, maxAmount, betting_type, runnerCount) => {
  const bookmaker = bookmakersList.value.find((bm) => String(bm?.market_id) === String(marketId));
  if (isBetLockBlocked(bookmaker)) return;

  await betStore.handleSelectBet({
    odd,
    backOrLay,
    runnerId,
    runnerName,
    marketId,
    eventId: props.eventId,
    type: 'BM',
    marketTypeName: bookmakerTitle,
    minAmount,
    maxAmount,
    betting_type: betting_type || 'BACK_ONLY_ODDS',
    bet_delay: bookmaker?.bet_delay
  }, props.eventTypeId, props.eventName, runnerCount || 0);
};

const openRules = inject('openRules');

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

const hasActivePrice = (price) => {
  if (price == null || price === '') return false;
  const n = Number(price);
  return !Number.isNaN(n) && n !== 0;
};

const getPriceDisplay = (price) => (hasActivePrice(price) ? price : 0);

const getSizeDisplay = (size) => {
  if (size == null || size === '') return '0.0';
  const n = Number(size);
  if (Number.isNaN(n) || n === 0) return '0.0';
  return numeral(size).format('0a');
};

const isRunnerBetDisabled = (runner, bookmaker) =>
  runner?.status !== 'ACTIVE' || !props.betAllow || isBetLockBlocked(bookmaker) || isMarketSuspended(bookmaker);
</script>

<template>
  <!-- Back Only Bookmakers -->
  <div v-for="(bookmaker, idx) in bookmakersList" :key="`backonly-${idx}`">
    <div v-if="bookmaker?.active !== false"
      class="bookmaker-bo-root match-odds-root tw-overflow-hidden tw-border tw-border-[#d9d9d9] tw-bg-[#efefef]">
      <div v-if="bookmaker?.message" class="market-message-banner">
        <marquee class="tw-text-xs tw-text-marquee">
          {{ bookmaker?.message }}
        </marquee>
      </div>
      <!-- Header Bar (Match Odds–style desktop) -->
      <div class="bookmaker-bo-header-bar tw-flex tw-items-stretch tw-overflow-hidden tw-border-b tw-border-theme-border">
        <div
          class="bookmaker-bo-orange-header tw-relative tw-z-0 tw-flex tw-flex-none tw-w-max tw-flex-nowrap tw-items-center tw-gap-x-1 tw-bg-gradient-to-r tw-from-[#b88f2f] tw-via-[#e7dc99] tw-to-[#ba9336] tw-pl-2 tw-pr-7 tw-py-1 tw-min-w-[220px] md:tw-px-2.5 md:tw-py-1">
          <div class="tw-flex tw-min-w-0 tw-shrink tw-items-center md:tw-gap-2.5">
            <!-- PinIcon hidden — market header favourite pin disabled for now
            <PinIcon :active="isMarketFavorited(bookmaker.market_id, props.eventId)" size="16"
              class="tw-shrink-0 tw-relative tw-z-[3] match-odds-pin"
              @click="handleToggleFavorite(bookmaker.market_id, props.eventId)" />
            -->
            <div
              class="bookmaker-bo-orange-header__labels tw-flex tw-flex-1 tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-x-1 md:tw-gap-x-1.5">
              <span
                class="bookmaker-bo-section-title match-odds-section-title tw-relative tw-z-[2] tw-min-w-0 tw-font-bold tw-text-black tw-uppercase tw-text-[10px] tw-leading-none sm:tw-text-[11px] md:tw-leading-tight"
                :title="(bookmaker?.name || 'BACK ONLY').trim()">
                {{ bookmaker?.name || 'BACK ONLY' }}
              </span>
            </div>
          </div>
          <CashoutButton
            v-if="bookmaker?.runners?.length === 2 && isCashoutEligibleBookmaker(bookmaker)"
            class="market-header-cashout tw-flex-none tw-relative tw-z-[3]"
            :marketId="bookmaker?.market_id"
            :runners="bookmaker?.runners"
            :outcomes="eventBetOutcomes"
            :betAllow="props.betAllow && isMarketBetAllow(bookmaker, { inPlay: props.inPlay })"
            :marketStatus="bookmaker?.status"
            :eventId="props.eventId"
            :eventTypeId="props.eventTypeId"
            :eventName="props.eventName"
            :providerId="props.providerId"
            :minBet="bookmaker?.min_bet"
            :maxBet="bookmaker?.max_bet"
            :bettingType="bookmaker?.betting_type"
            marketType="BM"
            :marketTypeName="bookmaker?.name"
              :cashoutActive="props.cashoutActive" :speedCashoutActive="props.speedCashoutActive"
            size="x-small" />
          <RulesInfoButton @click="openRules && openRules()" color="white" size="x-small" class="tw-flex-shrink-0 tw-relative tw-z-[3] tw-ml-auto" />
          <div class="bookmaker-bo-header-cut" aria-hidden="true"></div>
        </div>
        <div
          class="bookmaker-bo-header-grey tw-relative tw-z-[1] tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-between tw-bg-[#efefef] tw-py-1 tw-pl-1 tw-pr-0 tw-w-auto md:tw-grid md:tw-grid-cols-[minmax(0,1fr)_auto] md:tw-items-center md:tw-justify-start md:tw-gap-x-3 md:tw-pl-2 md:tw-pr-0">
          <div
            class="sports-bet-header-limits bookmaker-bo-header-limits tw-ml-auto tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-x-1 tw-gap-y-0 tw-text-right tw-font-semibold tw-leading-none md:tw-ml-0 md:tw-min-w-0 md:tw-w-full md:tw-shrink md:tw-flex-nowrap md:tw-justify-center md:tw-overflow-visible md:tw-whitespace-nowrap md:tw-text-center md:tw-font-semibold md:tw-text-[#525252]">
            <span class="match-odds-header-limit-text tw-whitespace-nowrap">Min:{{ formatMarketBetLimit(bookmaker?.min_bet)
              }}</span>
            <span class="match-odds-header-limit-text tw-whitespace-nowrap">Max:{{ formatMarketBetLimit(bookmaker?.max_bet)
              }}</span>
          </div>
          <!-- BACK (tablet 768–1024) -->
          <div
            class="bookmaker-bo-header-back-inline tw-flex tw-min-w-0 tw-shrink-0 md:tw-justify-self-end tw-w-[69px] tw-items-center tw-justify-center">
            <span class="match-odds-header-col-label sports-bet-back-label">Back</span>
          </div>
        </div>

        <!-- Desktop: BACK over rightmost column of the six-width ladder -->
        <div class="bookmaker-bo-header-back-col tw-hidden tw-items-center tw-justify-center tw-bg-[#efefef] tw-border-b tw-border-[#d9d9d9] tw-py-1 tw-pr-0">
          <div class="odds-header-groups odds-header-groups--six-backonly tw-text-center">
            <span class="match-odds-header-col-label sports-bet-back-label">Back</span>
          </div>
        </div>
      </div>
      <!-- Runners -->
      <v-card-text class="bookmaker-bo-runners match-odds-runners tw-p-0"
        :class="{ 'bet-allow-disabled': isBetLockBlocked(bookmaker) || isMarketSuspended(bookmaker) }">
        <div v-if="bookmaker?.runners?.length">
          <div v-for="(runner, index) in bookmaker.runners"
            :key="`${bookmaker.market_id}-${runner.id || index}`"
            class="match-odds-runner-row tw-px-1 tw-py-1 tw-bg-white row-separator last:tw-border-b-0 md:tw-py-0"
            :data-market-id="bookmaker.market_id" :data-runner-id="runner.selection_id || runner.id">
            <div class="tw-flex tw-justify-between tw-items-center tw-gap-2 md:tw-gap-2 tw-min-w-0">
              <!-- Runner Name and Payout Info -->
              <div class="tw-flex-1 tw-min-w-0 tw-pr-2 tw-overflow-hidden">
                <h3
                  class="match-odds-runner-name bookmaker-bo-runner-name tw-mb-0 tw-break-words tw-text-black md:tw-leading-snug">
                  {{ runner?.name || `Runner ${index + 1}` }}
                </h3>
                <RunnerPayouts
                  v-if="betSummary?.[bookmaker.market_id]?.[runner.selection_id || runner.id]?.potential_payout || betSummary?.[bookmaker.market_id]?.[runner.selection_id || runner.id]?.current_potential_payout != null"
                  :potential-payout="betSummary?.[bookmaker.market_id]?.[runner.selection_id || runner.id]?.potential_payout"
                  :current-potential-payout="betSummary?.[bookmaker.market_id]?.[runner.selection_id || runner.id]?.current_potential_payout"
                />
              </div>

              <!-- Betting Buttons Container -->
              <div
                class="match-odds-odds-ladder bookmaker-bo-odds-ladder tw-relative tw-flex tw-items-center tw-gap-2 md:tw-gap-2 tw-shrink-0">
                <div
                  class="match-odds-odds-strip bookmaker-bo-odds-strip tw-relative tw-flex tw-items-center tw-gap-2 md:tw-gap-2">
                  <div class="bookmaker-bo-back-cell tw-relative tw-flex tw-gap-2 md:tw-gap-2">
                    <div class="bookmaker-bo-back-dim tw-inline-flex">
                      <v-btn size="default"
                        class="match-odds-price-cell odds-back-bg-1 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-back hover:tw-bg-odds-back-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                        rounded="0" :disabled="isRunnerBetDisabled(runner, bookmaker) || !hasActivePrice(runner?.priceBack ?? runner?.back?.[0]?.price)" variant="elevated"
                        @click="selectBet(runner?.priceBack ?? runner?.back?.[0]?.price, 'back', runner?.selection_id || runner?.id, runner?.name, bookmaker?.title, bookmaker.market_id, bookmaker.min_bet, bookmaker.max_bet, bookmaker?.betting_type, bookmaker.runners.length)">
                        <div class="tw-text-center tw-w-full">
                          <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{
                            getPriceDisplay(runner?.priceBack ?? runner?.back?.[0]?.price) }}</div>
                          <div
                            class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                            {{ hasActivePrice(runner?.priceBack ?? runner?.back?.[0]?.price)
                              ? getSizeDisplay(bookmaker?.max_bet)
                              : '0.0' }}
                          </div>
                        </div>
                      </v-btn>
                    </div>
                    <RunnerStatusOverlay
                      :runner-status="getRunnerOverlayStatus(runner, bookmaker)"
                      :market-status="bookmaker?.status"
                      :ball-running="runner?.ballRunning"
                    />
                  </div>
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
.bet-allow-disabled .odds-back-bg-1.v-btn[disabled] {
  background-color: var(--color-back-bg-1) !important;
}

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
  content: none;
}

.bookmaker-bo-root :deep(.match-odds-price-cell.v-btn--disabled .v-icon),
.bookmaker-bo-root :deep(.match-odds-price-cell[disabled] .v-icon) {
  display: none !important;
}

.bookmaker-backonly-header-back {
  display: none;
  width: 69px;
}

@media (max-width: 767.98px) {
  .bookmaker-backonly-header-back {
    display: block;
  }
}

.tw-z-10 {
  z-index: 10 !important;
}

.row-separator {
  border-bottom: 1px solid #d8d8d8 !important;
}

/* Orange bar → grey MIN/MAX: diagonal cross-cut (mobile + desktop) */
.bookmaker-bo-orange-header {
  overflow: hidden;
  clip-path: polygon(0 0, calc(100% - 1.75rem) 0, 100% 100%, 0 100%);
}

.bookmaker-bo-orange-header .bookmaker-bo-header-cut {
  display: none !important;
}

@media (max-width: 767.98px) {
  .bookmaker-bo-root :deep(.match-odds-price-cell) {
    min-height: 32px !important;
    height: auto !important;
    max-height: none !important;
    padding: 0 !important;
  }

  .bookmaker-bo-root :deep(.match-odds-price-cell .v-btn__content) {
    padding: 1px 2px !important;
    min-height: 0 !important;
  }

  .bookmaker-bo-root :deep(.match-odds-price-cell .v-icon) {
    font-size: 12px !important;
  }

  .bookmaker-bo-odds-ladder,
  .bookmaker-bo-odds-group {
    gap: 0 !important;
  }

  .bookmaker-bo-root :deep(.match-odds-price-cell),
  .bookmaker-bo-root :deep(.match-odds-price-cell.v-btn) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
    box-shadow: none !important;
  }

  .bookmaker-bo-root :deep(.match-odds-price-cell .v-btn__overlay),
  .bookmaker-bo-root :deep(.match-odds-price-cell .v-btn__underlay) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .bookmaker-bo-odds-ladder {
    width: var(--sports-bet-odds-btn-width);
    min-width: var(--sports-bet-odds-btn-width);
    max-width: var(--sports-bet-odds-btn-width);
    flex-shrink: 0;
  }

  .bookmaker-bo-odds-strip {
    width: var(--sports-bet-odds-btn-width);
    flex-shrink: 0;
  }

  .bookmaker-bo-odds-strip .bookmaker-bo-back-cell {
    width: var(--sports-bet-odds-btn-width);
    flex-shrink: 0;
  }
}

@media (min-width: 768px) {
  .bookmaker-bo-root .bookmaker-bo-runner-name,
  .bookmaker-bo-root .match-odds-runner-name {
    font-size: 12px !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
    color: #000 !important;
  }

  .bookmaker-bo-orange-header {
    background: linear-gradient(90deg,
        #bf953f 0%,
        #e8d48b 28%,
        #fcf6ba 50%,
        #e8d48b 72%,
        #b38728 100%) !important;
    min-height: 34px;
    padding: 8px 1.75rem 8px 10px !important;
    align-items: center;
  }

  .bookmaker-bo-orange-header .bookmaker-bo-section-title,
  .bookmaker-bo-orange-header .match-odds-section-title {
    font-family: inherit !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    letter-spacing: 0 !important;
    color: #ffffff !important;
    text-transform: uppercase;
    overflow: visible;
    text-overflow: clip;
    flex-shrink: 1;
    min-width: 0;
  }

  .bookmaker-bo-orange-header__labels {
    flex: 1 1 auto;
    min-width: 0;
    overflow: visible;
  }

  .bookmaker-bo-orange-header {
    clip-path: polygon(0 0, calc(100% - 1.25rem) 0, 100% 100%, 0 100%);
  }

  .bookmaker-bo-header-grey {
    margin-left: -1px;
    isolation: isolate;
    min-height: 34px;
    padding-top: 7px !important;
    padding-bottom: 7px !important;
    align-items: center;
  }

  .bookmaker-bo-orange-header .match-odds-header-pill {
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

  .bookmaker-bo-root .bookmaker-bo-header-limits {
    min-width: 0;
    text-align: left !important;
    justify-content: flex-start !important;
    padding-left: 1.25rem !important;
  }

  .bookmaker-bo-odds-group {
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  /* Match Odds desktop cell padding (single BACK column) */
  .bookmaker-bo-root :deep(.match-odds-price-cell),
  .bookmaker-bo-root :deep(.match-odds-price-cell.v-btn),
  .bookmaker-bo-root :deep(.match-odds-price-cell.tw-pointer-events-none) {
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

  .bookmaker-bo-root :deep(.odds-back-bg-1) {
    background: var(--color-back-bg-1) !important;
  }

  .bookmaker-bo-root :deep(.odds-back-bg-1:hover) {
    background: var(--color-back-hover) !important;
  }

  .bookmaker-bo-root :deep(.match-odds-price-cell.tw-pointer-events-none.odds-back-bg-1) {
    background: var(--color-back-bg-1) !important;
  }

  .bookmaker-bo-root :deep(.match-odds-price-cell .v-btn__content) {
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 0 !important;
    padding: 1px 2px !important;
    min-height: 0 !important;
    line-height: 1.05 !important;
  }

  .bookmaker-bo-root :deep(.match-odds-price-cell .v-icon) {
    display: none !important;
  }

  .bookmaker-bo-runners {
    background: #fff;
  }

  .bookmaker-bo-root.match-odds-root {
    background: #fff !important;
    border-color: #e5e7eb !important;
  }

  .match-odds-runner-row {
    min-height: 43px;
    padding-top: 4px !important;
    padding-bottom: 2px !important;
    padding-left: 10px !important;
    padding-right: 4px !important;
    background: #fff !important;
    border-bottom: 1px solid #e0e0e0 !important;
  }

  .bookmaker-bo-odds-ladder {
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .bookmaker-bo-root :deep(.match-odds-price-cell .v-btn__overlay),
  .bookmaker-bo-root :deep(.match-odds-price-cell .v-btn__underlay) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .bookmaker-bo-root :deep(.match-odds-price-cell .v-btn__content) {
    padding: 2px 4px !important;
    min-height: 0 !important;
  }

  /* mo-price / mo-size: see sports-bet-desktop-typography.css */

  .bookmaker-bo-root :deep(.match-odds-price-cell .v-icon) {
    font-size: 14px !important;
  }

  :deep(.match-odds-pin) {
    padding: 2px !important;
  }
}

/* Desktop: mirror Match Odds six-width ladder — BACK + cell on rightmost column */
@media (min-width: 1025px) {
  .bookmaker-bo-header-back-inline {
    display: none !important;
  }

  .bookmaker-bo-header-back-col {
    display: flex !important;
  }

  .bookmaker-bo-header-bar--aligned {
    display: grid !important;
    grid-template-columns: var(--sports-bet-orange-header-width-desktop) minmax(0, 1fr) var(--sports-bet-odds-six-width);
    align-items: stretch;
  }

  .bookmaker-bo-header-bar--aligned .bookmaker-bo-orange-header {
    grid-column: 1;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .bookmaker-bo-header-bar--aligned .bookmaker-bo-header-grey {
    grid-column: 2;
    display: flex !important;
    align-items: center;
  }

  .bookmaker-bo-header-bar--aligned .bookmaker-bo-header-grey.md\:tw-grid {
    display: flex !important;
    grid-template-columns: unset !important;
  }

  .bookmaker-bo-header-bar--aligned .bookmaker-bo-header-back-col {
    grid-column: 3;
    min-width: var(--sports-bet-odds-six-width);
    max-width: var(--sports-bet-odds-six-width);
  }

  .bookmaker-bo-root .odds-header-groups--six-backonly {
    display: grid;
    grid-template-columns: repeat(6, var(--sports-bet-odds-btn-width));
    column-gap: var(--sports-bet-odds-six-gap);
    width: var(--sports-bet-odds-six-width);
    align-items: center;
    justify-items: center;
  }

  .bookmaker-bo-root .odds-header-groups--six-backonly .sports-bet-back-label {
    grid-column: 6;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 1.25rem;
  }

  .bookmaker-bo-odds-ladder {
    width: var(--sports-bet-odds-six-width);
    flex-shrink: 0;
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .bookmaker-bo-odds-strip {
    width: var(--sports-bet-odds-six-width);
    flex-shrink: 0;
    display: grid;
    grid-template-columns: repeat(6, 78px);
    column-gap: var(--sports-bet-odds-six-gap);
    align-items: center;
    gap: 0 !important;
  }

  .bookmaker-bo-odds-strip .bookmaker-bo-back-cell {
    grid-column: 6;
    width: 69px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
  }
}
</style>
