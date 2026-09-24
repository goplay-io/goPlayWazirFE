<script setup>
import { defineProps, computed } from 'vue';
import NonFancyCalculator from '@/composables/PayoutCalculators/NonFancyCalculator';
import RunnerPayouts from '@/components/sports/RunnerPayouts.vue';
// import PinIcon from '@/components/PinIcon.vue';
import RunnerStatusOverlay from '@/components/RunnerStatusOverlay.vue';
import { useBetStore } from '@/stores/bet';
import useFavoriteMarkets from '@/composables/useFavoriteMarkets';
import numeral from 'numeral';
import { formatMarketBetLimit } from '@/utils/marketBetLimitFormat.js';
import { useRunnerCppEmitter } from '@/composables/useRunnerCppEmitter';
import { isMarketSuspended } from '@/utils/eventData';
import {
  getBetLockOverlayStatus,
  isBetLockInteractionBlockedForMarket,
  isMarketBetAllow,
} from '@/utils/betLockOverlay';

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
    marketName: activeBookmaker.value?.name || 'Ginnie'
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
    betting_type: betting_type || 'GINNIE_ODDS',
    bet_delay: bookmaker?.bet_delay
  }, props.eventTypeId, props.eventName, runnerCount || 0);
};

// Split runner name by semicolon for bullet list
const getNameParts = (name) => {
  if (!name) return [];
  return name.split(';').map(part => part.trim()).filter(Boolean);
};

const handleToggleFavorite = (marketId, eventId) => {
  const finalEventId = eventId || props.eventId;
  if (props.onToggleFavorite && typeof props.onToggleFavorite === 'function') {
    props.onToggleFavorite(marketId, finalEventId);
  } else {
    toggleFavorite(marketId, finalEventId);
  }
};

const isMarketFavorited = (marketId, eventId) => {
  const finalEventId = eventId || props.eventId;
  if (props.onToggleFavorite && typeof props.onToggleFavorite === 'function') {
    return props.isFavorite ? props.isFavorite(marketId) : false;
  }
  return isFavorited(marketId, finalEventId);
};

</script>

<template>
  <!-- Ginnie Bookmakers -->
  <div v-for="(bookmaker, idx) in bookmakersList" :key="`ginnie-${idx}`">
    <div v-if="bookmaker?.active !== false"
      class="bookmaker-ginnie-root tw-bg-[#efefef] tw-border tw-border-theme-border tw-overflow-hidden">
      <div v-if="bookmaker?.message" class="market-message-banner">
        <marquee class="tw-text-[10px] tw-text-marquee">
          {{ bookmaker?.message }}
        </marquee>
      </div>
      <!-- Header Bar -->
      <div class="ginnie-header-bar tw-flex tw-flex-row tw-items-stretch tw-overflow-hidden tw-border-b tw-border-theme-border">
        <div
          class="ginnie-orange-header tw-relative tw-z-0 tw-flex tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-x-1 tw-bg-gradient-to-r tw-from-[#b88f2f] tw-via-[#e7dc99] tw-to-[#ba9336] tw-pl-2 tw-pr-8 tw-py-1 tw-basis-[58%] tw-max-w-[min(100%,320px)] md:tw-shrink md:tw-basis-auto md:tw-min-w-0 md:tw-max-w-[min(100%,220px)] md:tw-px-2.5 md:tw-py-1">
          <div class="tw-relative tw-z-[2] tw-flex tw-min-w-0 tw-flex-1 tw-items-center">
            <!-- PinIcon hidden — market header favourite pin disabled for now
            <PinIcon :active="isMarketFavorited(bookmaker.market_id, props.eventId)" size="16"
              class="match-odds-pin tw-relative tw-z-[3] tw-shrink-0"
              @click="handleToggleFavorite(bookmaker.market_id, props.eventId)" />
            -->
            <div
              class="tw-relative tw-z-[2] tw-flex tw-min-w-0 tw-flex-1 tw-flex-nowrap tw-items-center tw-gap-x-1 tw-overflow-hidden md:tw-gap-x-1.5">
              <h2
                class="bookmaker-ginnie-section-title tw-relative tw-z-[2] tw-m-0 tw-min-w-0 tw-shrink tw-text-[9px] tw-font-bold tw-uppercase tw-leading-tight tw-text-black sm:tw-text-[10px]"
                :title="(bookmaker?.title || bookmaker?.name || '').trim() || undefined">
                {{ (bookmaker?.title || bookmaker?.name || 'GENIE COMBO SPECIAL BET').trim() }}
              </h2>
            </div>
          </div>
          <div class="ginnie-header-cut" aria-hidden="true"></div>
          <div class="ginnie-header-cut-fold" aria-hidden="true"></div>
        </div>
        <div
          class="ginnie-header-grey tw-relative tw-z-[1] tw-flex tw-w-auto tw-min-w-0 tw-flex-1 tw-items-center tw-justify-between tw-gap-1.5 tw-bg-[#efefef] tw-py-1 tw-pl-1 tw-pr-0 md:tw-grid md:tw-grid-cols-[minmax(0,1fr)_auto] md:tw-items-center md:tw-justify-start md:tw-gap-x-3 md:tw-gap-y-0 md:tw-pl-2 md:tw-pr-0">
          <div
            class="sports-bet-header-limits ginnie-header-limits tw-ml-auto tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-end tw-gap-x-1 tw-gap-y-0 tw-text-right tw-font-semibold tw-leading-none md:tw-ml-0 md:tw-min-w-0 md:tw-w-full md:tw-shrink md:tw-flex-nowrap md:tw-justify-center md:tw-overflow-visible md:tw-text-center md:tw-font-semibold md:tw-text-[#525252] md:tw-whitespace-nowrap">
            <span class="tw-whitespace-nowrap">Min:{{ formatMarketBetLimit(bookmaker?.min_bet) }}</span>
            <span class="tw-whitespace-nowrap">Max:{{ formatMarketBetLimit(bookmaker?.max_bet) }}</span>
          </div>
        </div>
        <div
          class="ginnie-header-back-col tw-hidden tw-items-center tw-justify-center tw-bg-[#efefef] tw-border-b tw-border-[#d9d9d9] tw-py-1 tw-pr-0">
          <div class="odds-header-groups odds-header-groups--ginnie-backonly tw-text-center">
            <span class="match-odds-header-col-label sports-bet-back-label">Back</span>
          </div>
        </div>
      </div>

      <!-- Runners (Only showing first one) -->
      <v-card-text class="tw-p-0 odds-buttons-container"
        :class="{ 'bet-allow-disabled': isBetLockBlocked(bookmaker) || isMarketSuspended(bookmaker) }">
        <div v-if="bookmaker?.runners?.length">
          <div v-for="(runner, index) in bookmaker.runners.slice(0, 1)"
            :key="`${bookmaker.market_id}-${runner.id || index}`"
            class="ginnie-runner-row tw-px-1 tw-py-1 md:tw-py-0 row-separator last:tw-border-b-0 tw-bg-white"
            :data-market-id="bookmaker.market_id" :data-runner-id="runner.selection_id || runner.id">
            <div class="tw-flex tw-items-center tw-justify-between tw-gap-3 md:tw-gap-x-3">
              <div class="tw-min-w-0 tw-flex-1">
                <ul class="combo-list ginnie-runner-name">
                  <li v-for="(namePart, idx) in getNameParts(runner?.name)" :key="idx">
                    {{ namePart }}
                  </li>
                </ul>
                <RunnerPayouts
                  v-if="betSummary?.[bookmaker.market_id]?.[runner.selection_id || runner.id]?.potential_payout || betSummary?.[bookmaker.market_id]?.[runner.selection_id || runner.id]?.current_potential_payout != null"
                  class="runner-payouts--ginnie"
                  :potential-payout="betSummary?.[bookmaker.market_id]?.[runner.selection_id || runner.id]?.potential_payout"
                  :current-potential-payout="betSummary?.[bookmaker.market_id]?.[runner.selection_id || runner.id]?.current_potential_payout"
                />
              </div>

              <!-- Odds column — width matches ginnie-header-back-col -->
              <div class="ginnie-odds-ladder tw-relative tw-flex tw-shrink-0 tw-items-center tw-justify-end">
                <div class="ginnie-odds-column tw-relative tw-flex tw-items-center tw-justify-center">
                  <div class="tw-relative tw-flex tw-justify-center">
                      <v-btn size="default" rounded="0"
                        class="match-odds-price-cell odds-back-bg-1 ginnie-odds-box tw-bg-odds-back hover:tw-bg-odds-back-hover tw-w-full tw-flex-shrink-0 tw-text-black tw-font-bold"
                        :disabled="runner?.status !== 'ACTIVE' || !props.betAllow || isBetLockBlocked(bookmaker) || isMarketSuspended(bookmaker)"
                        @click="selectBet(runner?.priceBack ?? runner?.back?.[0]?.price, 'back', runner?.selection_id || runner?.id, runner?.name, bookmaker?.title, bookmaker.market_id, bookmaker.min_bet, bookmaker.max_bet, bookmaker?.betting_type, bookmaker.runners.length)"
                        variant="elevated">
                        <div class="tw-text-center tw-w-full">
                          <div class="mo-price tw-font-bold tw-text-[10px] md:tw-text-[12px] tw-leading-tight">{{
                            (runner?.priceBack ?? runner?.back?.[0]?.price) ?? 0 }}</div>
                          <div
                            class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-font-semibold tw-flex tw-justify-center tw-items-center md:tw-text-[9px]">
                            {{ (runner?.priceBack ?? runner?.back?.[0]?.price) != null && bookmaker.max_bet != null
                              ? numeral(bookmaker.max_bet).format('0a')
                              : '0.0' }}
                          </div>
                        </div>
                      </v-btn>
                      <RunnerStatusOverlay
                        :runner-status="getRunnerOverlayStatus(runner, bookmaker)"
                        :market-status="bookmaker?.status" />
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

.odds-buttons-container {
  --v-disabled-opacity: 1;
}

.odds-buttons-container .odds-back-bg-1.v-btn.v-btn--disabled,
.odds-buttons-container .odds-back-bg-1.v-btn[disabled] {
  background-color: var(--color-back-bg-1) !important;
}

.odds-buttons-container .v-btn.v-btn--disabled,
.odds-buttons-container .v-btn[disabled] {
  position: relative;
  opacity: 1 !important;
  color: #000 !important;
}

.odds-buttons-container .v-btn.v-btn--disabled .v-btn__content,
.odds-buttons-container .v-btn.v-btn--disabled *,
.odds-buttons-container .v-btn[disabled] .v-btn__content,
.odds-buttons-container .v-btn[disabled] * {
  color: inherit !important;
}

.odds-buttons-container .v-btn.v-btn--disabled::after,
.odds-buttons-container .v-btn[disabled]::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.18);
  pointer-events: none;
  border-radius: inherit;
}

.combo-list {
  list-style: none;
  margin: 0;
  padding: 0 0 0 18px;
  position: relative;
  font-size: 14px;
  line-height: 1.4;
  overflow: hidden;
}

.combo-list::before {
  content: '';
  position: absolute;
  left: 5px;
  width: 2px;
  background: var(--color-header-bg, #360952);
  opacity: 0.8;
  /* Span from first dot center to last dot center (half line-height each end) */
  top: calc(0.5 * 1.4 * 1em);
  bottom: calc(0.5 * 1.4 * 1em);
}

.combo-list li {
  position: relative;
  display: flex;
  align-items: center;
  min-height: calc(1.4 * 1em);
  font-size: inherit;
  font-weight: 800;
  color: #232323;
  line-height: inherit;
}

@media (min-width: 768px) {
  .bookmaker-ginnie-root .ginnie-runner-name.combo-list {
    font-size: 12px !important;
    line-height: 1.25 !important;
  }

  .bookmaker-ginnie-root .ginnie-runner-name.combo-list::before {
    top: calc(0.5 * 1.25 * 1em);
    bottom: calc(0.5 * 1.25 * 1em);
  }

  .bookmaker-ginnie-root .ginnie-runner-name.combo-list li {
    min-height: calc(1.25 * 1em);
    font-weight: 700 !important;
    color: #000 !important;
  }
}

@media (max-width: 767px) {
  .combo-list {
    font-size: 14px;
  }
}

.combo-list li::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  background: var(--color-header-bg, #360952);
  transform: translateY(-50%);
}

.tw-z-10 {
  z-index: 10 !important;
}

.row-separator {
  border-bottom: 1px solid #d8d8d8 !important;
}

/* Orange → grey MIN/MAX: diagonal cross-cut + fold (mobile + desktop, Match Odds–style) */
.ginnie-orange-header .ginnie-header-cut,
.ginnie-orange-header .ginnie-header-cut-fold {
  pointer-events: none;
  position: absolute;
  top: 0;
  right: -1px;
  height: 100%;
  width: 1.75rem;
}

.ginnie-orange-header .ginnie-header-cut {
  z-index: 0;
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  background-color: #efefef;
}

.ginnie-orange-header .ginnie-header-cut-fold {
  z-index: 1;
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  background: linear-gradient(118deg,
      rgba(62, 48, 22, 0.4) 0%,
      rgba(62, 48, 22, 0.07) 26%,
      transparent 52%);
  mix-blend-mode: multiply;
}

.ginnie-odds-box {
  width: var(--sports-bet-ginnie-odds-btn-width) !important;
  min-width: var(--sports-bet-ginnie-odds-btn-width) !important;
  max-width: var(--sports-bet-ginnie-odds-btn-width) !important;
}

.ginnie-odds-ladder {
  width: var(--sports-bet-ginnie-odds-btn-width);
  min-width: var(--sports-bet-ginnie-odds-btn-width);
  max-width: var(--sports-bet-ginnie-odds-btn-width);
  flex-shrink: 0;
}

.ginnie-odds-column {
  width: var(--sports-bet-ginnie-odds-btn-width);
  min-width: var(--sports-bet-ginnie-odds-btn-width);
  max-width: var(--sports-bet-ginnie-odds-btn-width);
}

.bookmaker-ginnie-root :deep(.ginnie-odds-box.match-odds-price-cell),
.bookmaker-ginnie-root :deep(.ginnie-odds-box.match-odds-price-cell.v-btn) {
  height: 44px !important;
  min-height: 44px !important;
  max-height: 44px !important;
  padding: 0 !important;
  border-radius: var(--sports-bet-odds-btn-radius) !important;
  box-shadow: none !important;
}

.bookmaker-ginnie-root :deep(.ginnie-odds-box .v-btn__overlay),
.bookmaker-ginnie-root :deep(.ginnie-odds-box .v-btn__underlay) {
  border-radius: var(--sports-bet-odds-btn-radius) !important;
}

.bookmaker-ginnie-root :deep(.ginnie-odds-box .v-btn__content) {
  padding: 3px 10px !important;
  min-height: 0 !important;
  flex-direction: column !important;
  justify-content: center !important;
  gap: 0 !important;
}

@media (max-width: 767px) {
  .bookmaker-ginnie-root :deep(.ginnie-odds-box .mo-price) {
    font-size: var(--sports-bet-mobile-market-odds-price-size) !important;
    font-weight: 700 !important;
    line-height: 1.15 !important;
  }

  .bookmaker-ginnie-root :deep(.ginnie-odds-box .mo-size) {
    font-size: 9px !important;
    line-height: 1.1 !important;
  }
}

@media (min-width: 768px) {

  .bookmaker-ginnie-root :deep(.ginnie-odds-box.match-odds-price-cell),
  .bookmaker-ginnie-root :deep(.ginnie-odds-box.match-odds-price-cell.v-btn) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
    border: 1px solid rgba(0, 0, 0, 0.06) !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12) !important;
  }

  .bookmaker-ginnie-root :deep(.ginnie-odds-box .v-btn__overlay),
  .bookmaker-ginnie-root :deep(.ginnie-odds-box .v-btn__underlay) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .bookmaker-ginnie-root {
    --ginnie-back-col: var(--sports-bet-ginnie-odds-btn-width);
  }

  .ginnie-runner-row {
    padding-right: 4px !important;
  }

  .ginnie-orange-header .ginnie-header-cut,
  .ginnie-orange-header .ginnie-header-cut-fold {
    width: 1.1rem;
  }

  .ginnie-header-limits {
    min-width: 0;
  }

  .ginnie-odds-column {
    width: var(--sports-bet-ginnie-odds-btn-width);
    min-width: var(--sports-bet-ginnie-odds-btn-width);
    max-width: var(--sports-bet-ginnie-odds-btn-width);
  }

  .bookmaker-ginnie-root :deep(.ginnie-odds-box .mo-price) {
    font-size: var(--sports-bet-mobile-market-odds-price-size) !important;
    font-weight: 700 !important;
    line-height: 1.1 !important;
    color: #1e293b !important;
  }

  .bookmaker-ginnie-root :deep(.ginnie-odds-box .mo-size) {
    font-size: 9px !important;
    font-weight: var(--sports-bet-mobile-market-odds-size-weight) !important;
    line-height: 1.1 !important;
    color: #64748b !important;
    letter-spacing: 0.02em;
  }

  .bookmaker-ginnie-root :deep(.ginnie-odds-box .v-icon) {
    font-size: 16px !important;
  }

  :deep(.match-odds-pin) {
    padding: 2px !important;
  }
}
</style>