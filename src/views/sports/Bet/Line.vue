<script setup>
import { defineProps, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import numeral from 'numeral';
import { formatMarketBetLimit } from '@/utils/marketBetLimitFormat.js';
import { useBetStore } from '@/stores/bet';
import RunnerStatusOverlay from '@/components/RunnerStatusOverlay.vue';
import PayoutValue from '@/components/PayoutValue.vue';
import FancyPositionsDialog from './fancy/FancyPositionsDialog.vue';
import BookLadderIcon from '@/components/BookLadderIcon.vue';
import { isMarketSuspended } from '@/utils/eventData';
import {
  getBetLockOverlayStatus,
  isBetLockInteractionBlockedForMarket,
  isMarketBetAllow,
} from '@/utils/betLockOverlay';

const { t } = useI18n();
const betStore = useBetStore();

const props = defineProps({
  lineMarkets: {
    type: Array,
    default: () => [],
  },
  selectedBet: Object,
  betHistory: {
    type: Array,
    default: null,
  },
  betOutcomes: {
    type: Object,
    default: null,
  },
  eventTypeId: [String, Number],
  eventName: String,
  betAllow: Boolean,
  eventId: [String, Number],
  inPlay: {
    type: Boolean,
    default: false,
  },
});

const eventBetHistory = computed(() => props.betHistory ?? betStore.betHistory);
const eventBetOutcomes = computed(() => props.betOutcomes ?? betStore.betOutcomes);

const sortedLineMarkets = computed(() => {
  if (!Array.isArray(props.lineMarkets)) return [];
  return [...props.lineMarkets].sort(
    (a, b) => Number(a?.sort_priority ?? 0) - Number(b?.sort_priority ?? 0),
  );
});

const sectionLimits = computed(() => {
  const market = sortedLineMarkets.value?.[0];
  return {
    min: market?.min_bet,
    max: market?.max_bet,
  };
});

const hasBetsOnMarket = (marketId) => {
  const history = eventBetHistory.value;
  if (!history || !Array.isArray(history)) return false;
  const key = String(marketId);
  return history.some(bet => String(bet?.market_id || bet?.marketId || '') === key);
};

const getFancyOutcome = (marketId) => {
  if (!hasBetsOnMarket(marketId)) return null;
  const outcomes = eventBetOutcomes.value;
  const key = String(marketId);
  const marketOutcomes = outcomes?.[key] || outcomes?.[Number(marketId)] || outcomes?.[marketId];
  if (!marketOutcomes || typeof marketOutcomes !== 'object') return null;
  const values = Object.values(marketOutcomes).map(v => Number(v)).filter(v => Number.isFinite(v));
  if (values.length === 0) return null;
  return Math.round(Math.min(...values) * 100) / 100;
};

const getFancyOutcomes = (marketId) => {
  const outcomes = eventBetOutcomes.value;
  const key = String(marketId);
  const marketOutcomes = outcomes?.[key] || outcomes?.[Number(marketId)] || outcomes?.[marketId];
  if (!marketOutcomes || typeof marketOutcomes !== 'object') return null;
  return marketOutcomes;
};

const hasBookData = (marketId) => {
  const outcomes = getFancyOutcomes(marketId);
  return !!outcomes && Object.keys(outcomes).length > 0;
};

const showPositionsDialog = ref(false);
const dialogPositions = ref([]);
const dialogTitle = ref('');

const openPositionsDialog = (marketId, name) => {
  const outcomes = getFancyOutcomes(marketId);
  if (!outcomes) {
    dialogPositions.value = [];
    dialogTitle.value = name || '';
    showPositionsDialog.value = true;
    return;
  }

  dialogPositions.value = Object.entries(outcomes)
    .map(([run, amount]) => ({
      run,
      amount: Math.round((Number(amount) || 0) * 100) / 100,
    }))
    .sort((a, b) => Number(a.run) - Number(b.run));
  dialogTitle.value = name || '';
  showPositionsDialog.value = true;
};

const isBetLockBlocked = (market) =>
  isBetLockInteractionBlockedForMarket(market, { betAllow: props.betAllow, inPlay: props.inPlay });

const getRunnerOverlayStatus = (market) =>
  getBetLockOverlayStatus({
    betAllow: props.betAllow,
    marketBetAllow: isMarketBetAllow(market, { inPlay: props.inPlay }),
    inPlay: props.inPlay,
  }) ?? (market.runners?.[0]?.status || market.status);

const getMinMaxValues = (market) => ({
  min: market?.min_bet || 100,
  max: market?.max_bet || 25000,
});

// LINE market odds are always rounded up to a whole number (display + API).
const roundUpOdd = (odd) => {
  const n = Number(odd);
  return Number.isFinite(n) ? Math.ceil(n) : odd;
};

const getPrices = (market) => {
  const runner = market?.runners?.[0] || market;
  // LINE market datafeed convention is the inverse of standard markets:
  //   datafeed back[0] = lower threshold (NO/lay button)
  //   datafeed lay[0]  = higher threshold (YES/back button)
  // Swap them so YES shows the higher number and NO shows the lower number,
  // matching the reference site behaviour (gap = both lose between the two prices).
  const layOdd = runner?.back?.[0]?.price ?? runner?.priceBack ?? runner?.values?.[4] ?? runner?.values?.[6];
  const backOdd = runner?.lay?.[0]?.price ?? runner?.priceLay ?? runner?.values?.[2] ?? runner?.values?.[8];
  return {
    layOdd: layOdd != null ? roundUpOdd(layOdd) : layOdd,
    layAmount: runner?.back?.[0]?.size ?? runner?.sizeBack,
    backOdd: backOdd != null ? roundUpOdd(backOdd) : backOdd,
    backAmount: runner?.lay?.[0]?.size ?? runner?.sizeLay,
  };
};

const getLineRunnerId = (market) =>
  market?.runners?.[0]?.selection_id
  || market?.runners?.[0]?.id
  || market?.market_id;

const isRunnerActive = (market) => {
  if (isMarketSuspended(market)) return false;
  const runner = market?.runners?.[0];
  return runner?.status === 'ACTIVE';
};

const selectBet = async (odd, backOrLay, runnerId, runnerName, marketId, eventId, base, minAmount, maxAmount) => {
  const market = sortedLineMarkets.value.find((m) => String(m?.market_id) === String(marketId));
  if (isBetLockBlocked(market)) return;

  await betStore.handleSelectBet(
    {
      odd,
      backOrLay,
      runnerId,
      runnerName,
      marketId,
      eventId: eventId || props.eventId,
      type: 'LINE',
      betting_type: 'LINE',
      marketTypeName: 'Line',
      base,
      rate: base,
      minAmount,
      maxAmount,
      bet_delay: market?.bet_delay,
    },
    props.eventTypeId,
    props.eventName,
    1,
  );
};
</script>

<template>
  <div
    v-if="sortedLineMarkets.length"
    class="line-markets-root match-odds-root tw-overflow-hidden tw-border tw-border-[#d9d9d9]"
  >
    <!-- Header — two-row purple title + grey MIN/MAX / NO / YES strip (same as other markets) -->
    <div
      class="match-odds-header-bar mo-bl-header-bar tw-flex tw-max-w-full tw-flex-row tw-items-stretch tw-overflow-hidden tw-border-b tw-border-[#d9d9d9]"
    >
      <div
        class="match-odds-orange-header line-markets-orange-header tw-relative tw-z-0 tw-flex tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-x-1 tw-pl-2 tw-pr-2 tw-py-1 md:tw-px-2.5 md:tw-py-1"
      >
        <div class="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-x-1 md:tw-gap-x-1.5">
          <span
            class="match-odds-section-title line-markets-section-title tw-relative tw-z-[2] tw-m-0 tw-min-w-0 tw-font-bold tw-uppercase tw-text-[10px] tw-leading-tight sm:tw-text-[11px] md:tw-leading-tight"
            :title="t('markets.lineTitle', 'Line Markets')"
          >
            {{ t('markets.lineTitle', 'Line Markets') }}
          </span>
        </div>
      </div>

      <div
        class="line-markets-header-grey match-odds-header-grey tw-relative tw-z-[1] tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-between tw-gap-1.5 tw-py-1 tw-pl-1 tw-pr-0 tw-w-auto md:tw-grid md:tw-grid-cols-[minmax(0,1fr)_auto] md:tw-items-center md:tw-justify-start md:tw-gap-x-3 md:tw-gap-y-0 md:tw-pl-2 md:tw-pr-0"
      >
        <div
          class="sports-bet-header-limits match-odds-header-limits tw-ml-auto tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-end tw-gap-x-1 tw-gap-y-0 tw-text-right tw-font-semibold tw-leading-none md:tw-ml-0 md:tw-min-w-0 md:tw-w-full md:tw-shrink md:tw-flex-nowrap md:tw-justify-center md:tw-overflow-visible md:tw-whitespace-nowrap md:tw-text-center md:tw-font-semibold md:tw-text-[#525252]"
        >
          <span class="match-odds-header-limit-text tw-whitespace-nowrap">Min:{{ formatMarketBetLimit(sectionLimits.min) }}</span>
          <span class="match-odds-header-limit-text tw-whitespace-nowrap">Max:{{ formatMarketBetLimit(sectionLimits.max) }}</span>
        </div>
        <div class="match-odds-header-backlay-inline tw-flex tw-min-w-0 tw-shrink-0 md:tw-justify-self-end">
          <div class="odds-header-groups odds-header-groups--dual tw-text-center">
            <span class="match-odds-header-col-label sports-bet-lay-label">NO</span>
            <span class="match-odds-header-col-label sports-bet-back-label">YES</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Markets -->
    <v-card-text
      class="line-markets-runners match-odds-runners odds-buttons-container tw-p-0"
      :class="{ 'bet-allow-disabled': !betAllow }"
    >
      <div
        v-for="market in sortedLineMarkets"
        :key="market.market_id"
        class="line-markets-runner-row match-odds-runner-row tw-px-1 tw-py-1 tw-bg-white row-separator last:tw-border-b-0 md:tw-py-0"
        :data-market-id="market.market_id"
        :data-runner-id="getLineRunnerId(market)"
      >
        <div class="tw-flex tw-justify-between tw-items-center tw-gap-2 md:tw-gap-2 tw-min-w-0">
          <div class="tw-flex-1 tw-min-w-0 tw-pr-1">
            <h3
              class="match-odds-runner-name tw-mb-0 tw-break-words tw-text-black md:tw-leading-snug tw-truncate"
            >
              {{ market.name }}
            </h3>
            <PayoutValue
              :value="getFancyOutcome(market.market_id)"
              small
            />
          </div>

          <div class="line-markets-odds-wrap tw-relative tw-shrink-0">
          <BookLadderIcon
            v-if="hasBookData(market.market_id)"
            class="line-markets-book-ladder"
            @click="openPositionsDialog(market.market_id, market.name)"
          />

          <div class="line-markets-odds-ladder match-odds-odds-ladder tw-relative tw-flex tw-items-center tw-gap-2 md:tw-gap-2 tw-shrink-0">

            <RunnerStatusOverlay
              :runner-status="getRunnerOverlayStatus(market)"
              :market-status="market?.status"
              :ball-running="market.runners?.[0]?.ballRunning"
            />

            <!-- NO (lay) -->
            <v-btn
              size="default"
              rounded="0"
              variant="elevated"
              class="match-odds-price-cell odds-lay-bg-1 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-lay hover:tw-bg-odds-lay-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
              :disabled="!betAllow || isBetLockBlocked(market) || !isRunnerActive(market)"
              @click="
                selectBet(
                  getPrices(market).layOdd,
                  'lay',
                  getLineRunnerId(market),
                  market.name,
                  market.market_id,
                  market.event_id,
                  getPrices(market).layAmount,
                  getMinMaxValues(market).min,
                  getMinMaxValues(market).max,
                )
              "
            >
              <div class="tw-text-center tw-w-full">
                <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ getPrices(market).layOdd ?? 0 }}</div>
                <div class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                  {{ getPrices(market).layAmount ?? '0.0' }}
                </div>
              </div>
            </v-btn>

            <!-- YES (back) -->
            <v-btn
              size="default"
              rounded="0"
              variant="elevated"
              class="match-odds-price-cell odds-back-bg-1 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-back hover:tw-bg-odds-back-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
              :disabled="!betAllow || isBetLockBlocked(market) || !isRunnerActive(market)"
              @click="
                selectBet(
                  getPrices(market).backOdd,
                  'back',
                  getLineRunnerId(market),
                  market.name,
                  market.market_id,
                  market.event_id,
                  getPrices(market).backAmount,
                  getMinMaxValues(market).min,
                  getMinMaxValues(market).max,
                )
              "
            >
              <div class="tw-text-center tw-w-full">
                <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ getPrices(market).backOdd ?? 0 }}</div>
                <div class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                  {{ getPrices(market).backAmount ?? '0.0' }}
                </div>
              </div>
            </v-btn>
          </div>
          </div>
        </div>
      </div>
    </v-card-text>

    <FancyPositionsDialog v-model="showPositionsDialog" :title="dialogTitle" :positions="dialogPositions" />
  </div>
</template>

<style scoped>
.v-btn:disabled {
  opacity: 1 !important;
}

.row-separator {
  border-bottom: 1px solid #d8d8d8 !important;
}

.line-markets-root,
.line-markets-root .match-odds-header-bar {
  max-width: 100%;
}

.line-markets-odds-wrap {
  position: relative;
}

.line-markets-book-ladder {
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 4px;
  z-index: 2;
}

.bet-allow-disabled {
  --v-disabled-opacity: 1;
}

.bet-allow-disabled .odds-back-bg-1.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-back-bg-1.v-btn[disabled] {
  background-color: var(--color-back-bg-1) !important;
}

.bet-allow-disabled .odds-lay-bg-1.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-lay-bg-1.v-btn[disabled] {
  background-color: var(--color-lay-bg-1) !important;
}

.bet-allow-disabled .v-btn:disabled {
  position: relative;
  opacity: 1 !important;
  color: #000 !important;
}

.bet-allow-disabled .v-btn:disabled::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
  border-radius: inherit;
}

@media (max-width: 767.98px) {
  .line-markets-root {
    isolation: isolate;
  }

  .line-markets-root .mo-bl-header-bar {
    position: relative;
    z-index: 1;
  }

  .line-markets-root .line-markets-runners {
    position: relative;
    z-index: 2;
  }

  .line-markets-odds-ladder {
    width: var(--sports-bet-odds-pair-width);
    min-width: var(--sports-bet-odds-pair-width);
    justify-content: flex-end;
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .line-markets-root :deep(.match-odds-price-cell.v-btn) {
    width: 69px !important;
    min-width: 69px !important;
    height: var(--sports-bet-odds-btn-height) !important;
    min-height: var(--sports-bet-odds-btn-height) !important;
    max-height: var(--sports-bet-odds-btn-height) !important;
    padding: 0 !important;
    border-radius: var(--sports-bet-odds-btn-radius) !important;
    box-shadow: none !important;
  }

  .line-markets-root :deep(.match-odds-price-cell .v-btn__overlay),
  .line-markets-root :deep(.match-odds-price-cell .v-btn__underlay) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .line-markets-root :deep(.match-odds-price-cell .v-btn__content) {
    padding: 1px 2px !important;
    min-height: 0 !important;
  }

  .line-markets-root :deep(.match-odds-price-cell .mo-price) {
    font-size: var(--sports-bet-mobile-market-odds-price-size) !important;
    font-weight: 700 !important;
    line-height: 1.15 !important;
  }

  .line-markets-root :deep(.match-odds-price-cell .mo-size) {
    font-size: 9px !important;
    font-weight: var(--sports-bet-mobile-market-odds-size-weight) !important;
    line-height: 1.1 !important;
  }
}

@media (min-width: 768px) {
  .line-markets-odds-ladder {
    width: var(--sports-bet-odds-pair-width);
    min-width: var(--sports-bet-odds-pair-width);
    justify-content: flex-end;
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .line-markets-runner-row {
    min-height: 43px;
    padding-top: 4px !important;
    padding-bottom: 2px !important;
    padding-left: 10px !important;
    padding-right: 4px !important;
    background: #fff !important;
    border-bottom: 1px solid #e0e0e0 !important;
  }

  .line-markets-runner-row .match-odds-runner-name {
    font-family: inherit !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
    letter-spacing: 0 !important;
    color: #000 !important;
    text-transform: none;
  }

  .line-markets-root :deep(.match-odds-price-cell.v-btn) {
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

  .line-markets-root :deep(.match-odds-price-cell .v-btn__overlay),
  .line-markets-root :deep(.match-odds-price-cell .v-btn__underlay) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .line-markets-root :deep(.odds-back-bg-1),
  .line-markets-root :deep(.odds-back-bg-2),
  .line-markets-root :deep(.odds-back-bg-3) {
    background: var(--color-back-bg-1) !important;
  }

  .line-markets-root :deep(.odds-back-bg-1:hover),
  .line-markets-root :deep(.odds-back-bg-2:hover),
  .line-markets-root :deep(.odds-back-bg-3:hover) {
    background: var(--color-back-hover) !important;
  }

  .line-markets-root :deep(.odds-lay-bg-1),
  .line-markets-root :deep(.odds-lay-bg-2),
  .line-markets-root :deep(.odds-lay-bg-3) {
    background: var(--color-lay-bg-1) !important;
  }

  .line-markets-root :deep(.odds-lay-bg-1:hover),
  .line-markets-root :deep(.odds-lay-bg-2:hover),
  .line-markets-root :deep(.odds-lay-bg-3:hover) {
    background: var(--color-lay-hover) !important;
  }

  .line-markets-root :deep(.match-odds-price-cell .v-btn__content) {
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 0 !important;
    padding: 1px 2px !important;
    min-height: 0 !important;
    line-height: 1.05 !important;
  }

  .line-markets-root :deep(.match-odds-price-cell .mo-price) {
    line-height: 1.05 !important;
    margin: 0 !important;
  }

  .line-markets-root :deep(.match-odds-price-cell .mo-size) {
    line-height: 1 !important;
    margin: 0 !important;
  }

  .line-markets-root :deep(.match-odds-price-cell .v-icon) {
    display: none !important;
  }
}
</style>
