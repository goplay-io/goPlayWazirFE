<script setup>
import { defineProps, computed } from 'vue';
import NonFancyCalculator from '@/composables/PayoutCalculators/NonFancyCalculator';
import PayoutValue from '@/components/PayoutValue.vue';
import { useBetStore } from '@/stores/bet';
import { useRunnerCppEmitter } from '@/composables/useRunnerCppEmitter';
import useFavoriteMarkets from '@/composables/useFavoriteMarkets';
// import PinIcon from '@/components/PinIcon.vue';
import RunnerStatusOverlay from '@/components/RunnerStatusOverlay.vue';
import { isMarketSuspended } from '@/utils/eventData';
import {
  isBetLockInteractionBlockedForMarket,
} from '@/utils/betLockOverlay';
import numeral from 'numeral';
import { formatMarketBetLimit } from '@/utils/marketBetLimitFormat.js';

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

const bookmakersList = computed(() => {
  if (!props.bookMakersData) return [];
  if (typeof props.bookMakersData === 'object' && !Array.isArray(props.bookMakersData)) {
    return Object.values(props.bookMakersData);
  }
  return Array.isArray(props.bookMakersData) ? props.bookMakersData : [];
});

const marketIds = computed(() => {
  const result = {};
  bookmakersList.value.forEach((bookmaker) => {
    if (bookmaker?.market_id && bookmaker?.runners?.length > 0) {
      result[bookmaker.market_id] = bookmaker.runners.map((runner) =>
        String(runner.selection_id || runner.id)
      );
    }
  });
  return result;
});

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
    marketName: activeBookmaker.value?.name || 'Who Will Win The Match'
  }),
  onRunnerCppUpdate: props.onRunnerCppUpdate,
  watchSources: () => [betSummary.value, activeMarketId.value]
});

const isBetLockBlocked = (bookmaker) =>
  isBetLockInteractionBlockedForMarket(bookmaker, { betAllow: props.betAllow, inPlay: props.inPlay });

const selectBet = async (odd, backOrLay, runnerId, runnerName, bookmakerName, marketId, minAmount, maxAmount, betting_type, runnerCount) => {
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
    marketTypeName: bookmakerName,
    minAmount,
    maxAmount,
    betting_type: betting_type || 'ODDS',
    bet_delay: bookmaker?.bet_delay
  }, props.eventTypeId, props.eventName, runnerCount || 0);
};

const whoWinGridColsClass = (runners) => {
  const n = runners.length;
  if (n <= 1) return 'tw-grid-cols-1';
  if (n === 2) return 'tw-grid-cols-2';
  if (n === 3) return 'tw-grid-cols-2 md:tw-grid-cols-3';
  if (n === 4) return 'tw-grid-cols-2 md:tw-grid-cols-2';
  return 'tw-grid-cols-2 md:tw-grid-cols-3';
};

/** Third runner on a 2-col phone grid: span full width so name lines up above its button. */
const whoWinRunnerCellClass = (runners, idx) => {
  if (runners.length === 3 && idx === 2) {
    return 'tw-col-span-2 tw-mx-auto tw-w-full tw-max-w-[min(100%,280px)] md:tw-col-span-1 md:tw-mx-0 md:tw-max-w-none';
  }
  return '';
};

const getWhoWinCardLayout = (bookmaker) => {
  const runners = bookmaker?.runners ?? [];
  return {
    runners,
    gridClass: whoWinGridColsClass(runners),
    isMultiColumn: runners.length >= 3,
    cellClass: (i) => whoWinRunnerCellClass(runners, i)
  };
};

const isWhoWinRunnerDisabled = (runner, bookmaker) =>
  runner?.status !== 'ACTIVE' ||
  !props.betAllow ||
  isBetLockBlocked(bookmaker);

/** Same ladder shape as MatchOdds / BookmakerBackOnly — API often sends priceBack without back[] */
const getRunnerBackPrice = (runner) =>
  runner?.priceBack ??
  runner?.back?.[0]?.price ??
  runner?.values?.[4] ??
  runner?.values?.[6] ??
  null;

const whoWinMarketId = (bm) => bm?.market_id ?? bm?.marketId;

const resolveWhoWinEventId = (bm) =>
  props.eventId ?? bm?.event_id ?? bm?.eventId ?? null;

const handleToggleFavorite = (marketId, bm) => {
  const eventId = resolveWhoWinEventId(bm);
  if (props.onToggleFavorite && typeof props.onToggleFavorite === 'function') {
    props.onToggleFavorite(marketId, eventId);
  } else {
    toggleFavorite(marketId, eventId);
  }
};

const isMarketFavorited = (marketId, bm) => {
  const eventId = resolveWhoWinEventId(bm);
  if (props.onToggleFavorite && typeof props.onToggleFavorite === 'function') {
    return props.isFavorite ? props.isFavorite(marketId) : false;
  }
  return isFavorited(marketId, eventId);
};
</script>

<template>
  <!-- Who Will Win The Match -->
  <div v-for="(bookmaker, idx) in bookmakersList" :key="`who-will-win-${idx}`">
    <div v-if="bookmaker?.active !== false"
      class="who-win-root tw-overflow-hidden tw-border tw-border-[#d9d9d9] tw-bg-[#efefef]">
      <div v-if="bookmaker?.message" class="market-message-banner">
        <marquee class="tw-text-xs tw-text-marquee">{{ bookmaker?.message }}</marquee>
      </div>
      <!-- Header Bar — same gold cross-cut + fold as Match Odds / Bookmaker Back–Lay (mobile + desktop) -->
      <div
        class="who-win-header-bar tw-flex tw-max-w-full tw-flex-row tw-items-stretch tw-overflow-hidden tw-border-b tw-border-[#d9d9d9]">
        <div
          class="who-win-orange-header tw-relative tw-z-0 tw-flex tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-x-1 tw-bg-gradient-to-r tw-from-[#b88f2f] tw-via-[#e7dc99] tw-to-[#ba9336] tw-pl-2 tw-pr-8 tw-py-1 tw-basis-[58%] tw-max-w-[min(100%,320px)] md:tw-shrink md:tw-basis-auto md:tw-min-w-0 md:tw-max-w-[min(100%,220px)] md:tw-px-2.5 md:tw-py-1">
          <div class="tw-relative tw-z-[2] tw-flex tw-min-w-0 tw-flex-1 tw-items-center">
            <!-- PinIcon hidden — market header favourite pin disabled for now
            <PinIcon :active="isMarketFavorited(whoWinMarketId(bookmaker), bookmaker)" size="16" class="tw-relative tw-z-[2] tw-shrink-0"
              @click="handleToggleFavorite(whoWinMarketId(bookmaker), bookmaker)" />
            -->
            <div class="tw-relative tw-z-[2] tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-x-1 md:tw-gap-x-1.5">
              <h2
                class="who-win-section-title tw-relative tw-z-[2] tw-m-0 tw-min-w-0 tw-shrink tw-text-[10px] tw-font-bold tw-uppercase tw-leading-tight tw-text-black sm:tw-text-[11px]"
                :title="bookmaker?.name || 'Who Will Win The Match?'">
                {{ bookmaker?.name || 'Who Will Win The Match?' }}
              </h2>
            </div>
          </div>
          <div class="who-win-header-cut" aria-hidden="true"></div>
          <div class="who-win-header-cut-fold" aria-hidden="true"></div>
        </div>
        <div
          class="who-win-header-grey tw-relative tw-z-[1] tw-flex tw-w-auto tw-min-w-0 tw-flex-1 tw-items-center tw-justify-between tw-gap-1.5 tw-bg-[#efefef] tw-py-1 tw-pl-1 tw-pr-2 md:tw-items-center md:tw-justify-center md:tw-gap-x-3 md:tw-pl-2 md:tw-pr-3">
          <!-- MIN/MAX: same grid cell + typography as BookmakerGinnie so limits line up across markets -->
          <div
            class="sports-bet-header-limits who-win-header-limits tw-ml-auto tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-end tw-gap-x-1 tw-gap-y-0 tw-text-right tw-font-semibold tw-leading-none md:tw-ml-0 md:tw-min-w-0 md:tw-w-full md:tw-shrink md:tw-flex-nowrap md:tw-justify-center md:tw-overflow-visible md:tw-text-center md:tw-font-semibold md:tw-text-[#525252] md:tw-whitespace-nowrap">
            <span class="tw-whitespace-nowrap">Min:{{ formatMarketBetLimit(bookmaker?.min_bet) }}</span>
            <span class="tw-whitespace-nowrap">Max:{{ formatMarketBetLimit(bookmaker?.max_bet) }}</span>
          </div>
        </div>
      </div>

      <v-card-text class="tw-px-2 tw-py-2 tw-bg-white odds-buttons-container"
        :class="{ 'bet-allow-disabled': isBetLockBlocked(bookmaker) || isMarketSuspended(bookmaker) }">
        <template v-for="layout in [getWhoWinCardLayout(bookmaker)]"
          :key="`who-win-layout-${whoWinMarketId(bookmaker) ?? idx}`">
          <div v-if="bookmaker?.runners?.length"
            class="who-win-runners-grid tw-grid tw-gap-y-2 md:tw-gap-x-3 md:tw-gap-y-2"
            :class="[layout.gridClass, layout.isMultiColumn ? 'who-win-runners-grid--multi' : '']">
            <div v-for="(runner, runnerIdx) in layout.runners"
              :key="String(runner.selection_id || runner.id || runnerIdx)"
              class="tw-flex tw-min-w-0 tw-max-w-full tw-flex-col tw-items-center tw-gap-2 tw-overflow-hidden"
              :class="layout.cellClass(runnerIdx)">
              <div
                class="who-win-runner-name tw-w-full tw-min-w-0 tw-max-w-full tw-truncate tw-text-center tw-font-medium tw-text-[#414141] tw-text-sm tw-leading-snug sm:tw-text-base md:tw-leading-snug"
                :title="runner?.name || `Runner ${runnerIdx + 1}`">
                {{ runner?.name || `Runner ${runnerIdx + 1}` }}
              </div>
              <div class="who-win-odds-cell tw-relative tw-flex tw-w-full tw-justify-center">
                <v-btn size="default" rounded="0"
                  class="who-win-back-btn match-odds-price-cell odds-back-bg-1 tw-w-full tw-max-w-full tw-bg-odds-back hover:tw-bg-odds-back-hover tw-text-black tw-font-bold md:tw-max-w-none"
                  :disabled="runner?.status !== 'ACTIVE' || !props.betAllow || isBetLockBlocked(bookmaker) || isMarketSuspended(bookmaker)"
                  @click="selectBet(getRunnerBackPrice(runner), 'back', runner?.selection_id || runner?.id, runner?.name, bookmaker?.name, bookmaker.market_id, bookmaker.min_bet, bookmaker.max_bet, bookmaker?.betting_type, bookmaker.runners.length)"
                  variant="elevated">
                  <div class="tw-text-center tw-w-full tw-leading-tight">
                    <div class="tw-text-[10px] tw-font-bold sm:tw-text-[11px]">{{
                      getRunnerBackPrice(runner) ?? 0 }}</div>
                    <div class="tw-text-[8px] tw-font-semibold sm:tw-text-[9px]">
                      {{ getRunnerBackPrice(runner) != null && bookmaker.max_bet != null
                        ? numeral(bookmaker.max_bet).format('0a')
                        : '0.0' }}
                    </div>
                  </div>
                </v-btn>
                <RunnerStatusOverlay :runner-status="runner?.status !== 'ACTIVE' ? 'SUSPENDED' : runner?.status" :market-status="bookmaker?.status" />
              </div>
              <div class="tw-flex tw-justify-center tw-gap-2">
                <PayoutValue
                  small
                  :value="betSummary?.[bookmaker.market_id]?.[String(runner.selection_id || runner.id)]?.potential_payout" />
                <PayoutValue
                  small
                  :value="betSummary?.[bookmaker.market_id]?.[String(runner.selection_id || runner.id)]?.current_potential_payout" />
              </div>
            </div>
          </div>
        </template>
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

/* Default: square cells (mobile); desktop overrides below */
.who-win-root :deep(.who-win-back-btn),
.who-win-root :deep(.who-win-back-btn.v-btn) {
  border-radius: var(--sports-bet-odds-btn-radius) !important;
  box-shadow: none !important;
}

.who-win-root :deep(.who-win-back-btn .v-btn__overlay),
.who-win-root :deep(.who-win-back-btn .v-btn__underlay) {
  border-radius: var(--sports-bet-odds-btn-radius) !important;
}

@media (max-width: 767.98px) {
  .who-win-runners-grid {
    gap: 0 !important;
    column-gap: 0 !important;
    row-gap: 0 !important;
  }

  .who-win-runners-grid>div {
    gap: 0 !important;
  }

  .who-win-runner-name {
    font-size: 11px !important;
    line-height: 1.2 !important;
    padding: 0 2px;
  }

  .who-win-odds-cell {
    width: 100%;
  }

  .who-win-root :deep(.who-win-back-btn),
  .who-win-root :deep(.who-win-back-btn.v-btn) {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    height: 34px !important;
    min-height: 34px !important;
    max-height: 34px !important;
    padding: 0 !important;
    border-radius: var(--sports-bet-odds-btn-radius) !important;
    box-shadow: none !important;
    border: 1px solid #fff !important;
  }

  .who-win-root :deep(.who-win-back-btn .v-btn__overlay),
  .who-win-root :deep(.who-win-back-btn .v-btn__underlay) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .who-win-root :deep(.who-win-back-btn .v-btn__content) {
    padding: 2px 4px !important;
    min-height: 0 !important;
  }

  .who-win-root :deep(.odds-back-bg-1) {
    background: var(--color-back-bg-1) !important;
  }
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

.tw-z-10 {
  z-index: 10 !important;
}

.who-win-root,
.who-win-header-bar {
  max-width: 100%;
}

/* Orange bar → grey MIN/MAX: diagonal cross-cut + fold (Match Odds / Bookmaker Back–Lay) */
.who-win-orange-header .who-win-header-cut,
.who-win-orange-header .who-win-header-cut-fold {
  pointer-events: none;
  position: absolute;
  top: 0;
  right: -1px;
  height: 100%;
  width: 1.75rem;
}

.who-win-orange-header .who-win-header-cut {
  z-index: 0;
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  background-color: #efefef;
}

.who-win-orange-header .who-win-header-cut-fold {
  z-index: 1;
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  background: linear-gradient(118deg,
      rgba(62, 48, 22, 0.4) 0%,
      rgba(62, 48, 22, 0.07) 26%,
      transparent 52%);
  mix-blend-mode: multiply;
}

@media (min-width: 768px) {
  .who-win-header-limits {
    min-width: 0;
  }

  .who-win-orange-header .who-win-header-cut,
  .who-win-orange-header .who-win-header-cut-fold {
    width: 1.1rem;
  }

  .who-win-runners-grid {
    gap: 12px 16px !important;
  }

  .who-win-root :deep(.who-win-back-btn),
  .who-win-root :deep(.who-win-back-btn.v-btn) {
    width: 176px !important;
    min-width: 176px !important;
    max-width: 176px !important;
    height: 40px !important;
    min-height: 40px !important;
    max-height: 40px !important;
    padding: 0 !important;
    border-radius: var(--sports-bet-odds-btn-radius) !important;
    border: 1px solid rgba(0, 0, 0, 0.06) !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12) !important;
  }

  .who-win-root :deep(.who-win-back-btn .v-btn__overlay),
  .who-win-root :deep(.who-win-back-btn .v-btn__underlay) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .who-win-root :deep(.who-win-back-btn .v-btn__content) {
    padding: 2px 6px !important;
    min-height: 0 !important;
  }

  .who-win-root :deep(.odds-back-bg-1) {
    background: var(--color-back-bg-1) !important;
  }

  .who-win-root :deep(.odds-back-bg-1:hover) {
    background: var(--color-back-hover) !important;
  }

  /* 3+ runners: narrower buttons so columns fit on desktop */
  .who-win-root .who-win-runners-grid--multi :deep(.who-win-back-btn),
  .who-win-root .who-win-runners-grid--multi :deep(.who-win-back-btn.v-btn) {
    width: 148px !important;
    min-width: 148px !important;
    max-width: 148px !important;
  }
}
</style>
