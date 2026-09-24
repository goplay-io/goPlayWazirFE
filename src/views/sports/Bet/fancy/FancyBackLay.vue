<script setup>
import { defineProps, computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n'
import PayoutValue from '@/components/PayoutValue.vue';
import RunnerStatusOverlay from '@/components/RunnerStatusOverlay.vue';
import {
  shouldShowFancyMarket,
  isFancyMarketCatalogEligible,
  getFancyRunnerOverlayStatus,
  matchesSortPriority,
} from '@/utils/fancyMarketVisibility';
import { getFancyDisplayPriceLevels, getFancyTopPrices } from '@/utils/fancyOddsLevels';
import { sortFancyMarketsByTabPriorities } from '@/utils/runnerSort';

import { useBetStore } from '@/stores/bet';
import RulesInfoButton from '@/components/RulesInfoButton.vue';
import RulesDialog from '@/components/RulesDialog.vue';
import FancyPositionsDialog from './FancyPositionsDialog.vue';
import FancyMarketStatusBlock from './FancyMarketStatusBlock.vue';
import BookLadderIcon from '@/components/BookLadderIcon.vue';
import FancyMinMaxInfo from '@/components/FancyMinMaxInfo.vue';

const betStore = useBetStore();

const props = defineProps({
  fancyData: Array,
  fancyTabs: Object,
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
  activeCategory: {
    type: String,
    default: 'All'
  }
});

// Get eventId from props or from the first fancy market's event_id
const getEventId = () => {
  if (props.eventId) return props.eventId;
  if (props.fancyData && props.fancyData.length > 0) {
    return props.fancyData[0]?.event_id;
  }
  return null;
};

const collapsedHeaders = ref({});

// Always reset all headers to open when the top fancy tab/category changes
watch(
  () => props.activeCategory,
  () => {
    collapsedHeaders.value = {};
  }
);

const eventBetHistory = computed(() => {
  return props.betHistory ?? betStore.betHistory;
});

const eventBetOutcomes = computed(() => {
  return props.betOutcomes ?? betStore.betOutcomes;
});

// Helper function - check if user has placed any bets on this market
const hasBetsOnMarket = (marketId) => {
  const betHistory = eventBetHistory.value;
  if (!betHistory || !Array.isArray(betHistory)) return false;

  const marketKey = String(marketId);
  return betHistory.some(bet => {
    const betMarketId = String(bet?.market_id || bet?.marketId || '');
    return betMarketId === marketKey;
  });
};

// Helper function - get the lowest outcome (most negative) from betOutcomes
const getFancyOutcome = (marketId) => {
  if (!hasBetsOnMarket(marketId)) {
    return null;
  }

  const betOutcomes = eventBetOutcomes.value;
  const marketKey = String(marketId);
  const outcomes = betOutcomes?.[marketKey] || betOutcomes?.[Number(marketId)] || betOutcomes?.[marketId];

  if (!outcomes || typeof outcomes !== 'object') return null;

  const values = Object.values(outcomes)
    .map(v => Number(v))
    .filter(v => Number.isFinite(v));

  if (values.length === 0) return null;
  const minValue = Math.min(...values);
  return Math.round(minValue * 100) / 100;
};

// Helper function - get all outcomes for a market
const getFancyOutcomes = (marketId) => {
  const betOutcomes = eventBetOutcomes.value;
  const marketKey = String(marketId);
  const outcomes = betOutcomes?.[marketKey] || betOutcomes?.[Number(marketId)] || betOutcomes?.[marketId];

  if (!outcomes || typeof outcomes !== 'object') return null;
  return outcomes;
};

const hasBookData = (marketId) => {
  const outcomes = getFancyOutcomes(marketId);
  return !!outcomes && Object.keys(outcomes).length > 0;
};

// Group markets by tabs
const groupedFancyData = computed(() => {
  if (!props.fancyTabs || !props.fancyData) {
    const filteredData = (props.fancyData || []).filter(market => isFancyMarketCatalogEligible(market) && shouldShowMarket(market));
    return { 'All': filteredData };
  }

  const groups = {};

  Object.entries(props.fancyTabs).forEach(([tabName, sortPriorities]) => {
    if (!Array.isArray(sortPriorities)) return;

    const marketsInTab = sortFancyMarketsByTabPriorities(
      props.fancyData.filter(market =>
        isFancyMarketCatalogEligible(market) &&
        shouldShowMarket(market) && (
          market?.__binary === true ||
          matchesSortPriority(sortPriorities, market?.sort_priority)
        )
      ),
      sortPriorities
    );

    if (marketsInTab.length > 0) {
      groups[tabName] = marketsInTab;
    }
  });

  return groups;
});

const toggleHeader = (key) => {
  collapsedHeaders.value[key] = !collapsedHeaders.value[key];
};

const isBinaryMarket = (market) => market?.__binary === true;

const getBinaryPrices = (market) => {
  const runner = market?.runners?.[market?.market_id] ?? market?.runners?.[0] ?? market;
  return {
    layOdd: runner?.priceLay ?? runner?.lay?.[0]?.price ?? runner?.values?.[2] ?? runner?.values?.[8] ?? market?.lay?.[0]?.price,
    layAmount: runner?.sizeLay ?? runner?.lay?.[0]?.size ?? market?.lay?.[0]?.size,
    backOdd: runner?.priceBack ?? runner?.back?.[0]?.price ?? runner?.values?.[4] ?? runner?.values?.[6] ?? market?.back?.[0]?.price,
    backAmount: runner?.sizeBack ?? runner?.back?.[0]?.size ?? market?.back?.[0]?.size,
  };
};

const selectBet = async (odd, backOrLay, runnerId, runnerName, marketId, eventId, base, minAmount, maxAmount, runnerCount, fancyOdd) => {
  if (!props.betAllow) {
    return;
  }

  const market = props.fancyData?.find((m) => String(m?.market_id) === String(marketId));

  await betStore.handleSelectBet({
    odd,
    backOrLay,
    runnerId,
    runnerName,
    marketId: marketId,
    eventId: eventId || props.eventId,
    type: 'F',
    betting_type: 'F',
    marketTypeName: isBinaryMarket(market) ? 'Binary' : 'Fancy',
    base,
    minAmount,
    maxAmount,
    rate: fancyOdd,
    bet_delay: props.fancyData?.find((market) => String(market?.market_id) === String(marketId))?.bet_delay,
  }, props.eventTypeId, props.eventName, runnerCount || 1);
};

const isSuspended = (market) => {
  const statusStr = String(market?.status || '').toUpperCase();
  return statusStr === 'SUSPENDED';
};

const isBallRunning = (market) => {
  const statusStr = String(market?.status || '').toUpperCase();
  return statusStr === 'BALL_RUNNING';
};

const getMinMaxValues = (market) => {
  return {
    min: market?.min_bet || 100,
    max: market?.max_bet || 25000
  };
};

const getPriceLevels = (market) => getFancyDisplayPriceLevels(market);

const getPrices = (market) => {
  if (isBinaryMarket(market)) return getBinaryPrices(market);
  return getFancyTopPrices(market);
};

const shouldShowMarket = (market) => {
  if (isBinaryMarket(market)) return isFancyMarketCatalogEligible(market);
  return shouldShowFancyMarket(market);
};
const isMarketHidden = (market) => !shouldShowMarket(market);

// Dialog state for positions
const showPositionsDialog = ref(false);
const dialogPositions = ref([]);
const dialogTitle = ref('');

function openPositionsDialog(marketId, name) {
  const outcomes = getFancyOutcomes(marketId);
  if (!outcomes) {
    dialogPositions.value = [];
    dialogTitle.value = name || '';
    showPositionsDialog.value = true;
    return;
  }

  const posArray = Object.entries(outcomes).map(([runnerId, amount]) => ({
    run: runnerId,
    amount: Math.round((Number(amount) || 0) * 100) / 100
  })).sort((a, b) => Number(a.run) - Number(b.run));

  dialogPositions.value = posArray;
  dialogTitle.value = name || '';
  showPositionsDialog.value = true;
}

// Rules dialog state
const rulesOpen = ref(false);
const showRules = () => {
  rulesOpen.value = true;
};
const { t } = useI18n()
</script>

<template>
  <!-- Fancy Markets Cards (no grid wrapper - parent handles grid) -->
  <template v-for="(fancy, key) in groupedFancyData" :key="key">
    <div
      v-if="(props.activeCategory === 'All' || props.activeCategory === key) && fancy.some(m => !isMarketHidden(m))"
      class="fancy-card-item fancy-market-block tw-bg-theme-surface tw-border tw-border-theme-border tw-overflow-hidden"
    >
      <div class="tw-flex tw-items-stretch tw-overflow-hidden tw-border-b tw-border-theme-border">
        <div
          class="fancy-sessions-orange-header tw-relative tw-z-0 tw-flex tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-x-1 tw-bg-gradient-to-r tw-from-[#b88f2f] tw-via-[#e7dc99] tw-to-[#ba9336] tw-pl-2 tw-pr-7 tw-py-1 md:tw-px-2.5 md:tw-py-1 tw-basis-[58%] tw-min-w-[220px] tw-max-w-[min(100%,320px)] md:tw-basis-auto md:tw-min-w-[360px] md:tw-max-w-none">
          <h3
            class="fancy-section-title match-odds-section-title tw-m-0 tw-min-w-0 tw-flex-1 tw-font-bold tw-text-black tw-uppercase tw-text-[10px] tw-leading-none sm:tw-text-[11px] md:tw-leading-tight"
          >
            {{ key }}
          </h3>
          <RulesInfoButton @click="showRules" color="white" size="x-small" class="tw-flex-shrink-0 tw-relative tw-z-[3]" />
          <div class="fancy-sessions-header-cut" aria-hidden="true"></div>
          <div class="fancy-sessions-header-cut-fold" aria-hidden="true"></div>
        </div>
        <div class="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-bg-[#efefef] tw-px-1.5 tw-py-1 md:tw-px-2 md:tw-py-1">
          <div class="fancy-odds-block tw-grid tw-grid-cols-2 tw-gap-2 tw-w-[146px] tw-text-center tw-ml-auto">
            <span class="sports-bet-lay-label">NO</span>
            <span class="sports-bet-back-label">YES</span>
          </div>
        </div>
      </div>

      <div class="tw-p-0">
        <template v-for="(innerFancy, innerKey) in fancy" :key="innerFancy.market_id ?? innerKey">
          <div
            v-show="!isMarketHidden(innerFancy)"
            :data-market-id="innerFancy.market_id"
            :data-runner-id="innerFancy.market_id"
            class="fancy-row-cols row-separator tw-px-1 tw-py-1 tw-items-center"
            :class="innerKey % 2 === 0 ? 'fancy-row-even' : 'fancy-row-odd'"
          >
            <div class="fancy-row-meta tw-flex tw-min-w-0 tw-flex-col tw-justify-center tw-gap-0.5 tw-pl-2 tw-pr-1">
              <div class="fancy-row-meta-head tw-flex tw-min-w-0 tw-items-center tw-gap-0.5">
                <h4 class="fancy-runner-name text-black-force tw-m-0 tw-min-w-0 tw-leading-snug">
                  <span class="tw-whitespace-normal">{{ innerFancy?.name }}</span>
                </h4>
              </div>
              <PayoutValue :value="getFancyOutcome(innerFancy.market_id)" small />
            </div>
            <div class="fancy-odds-wrap tw-relative tw-ml-auto tw-shrink-0 tw-flex tw-items-center tw-gap-2">
            <BookLadderIcon
              v-if="hasBookData(innerFancy.market_id)"
              class="fancy-row-book-ladder"
              @click="openPositionsDialog(innerFancy.market_id, innerFancy?.name)"
            />
            <FancyMinMaxInfo
              :min="getMinMaxValues(innerFancy).min"
              :max="getMinMaxValues(innerFancy).max"
            />
            <div
              class="fancy-odds-block tw-relative tw-w-[146px]"
              :class="{
                'fancy-odds-block--stacked': getPriceLevels(innerFancy).length > 1,
                'fancy-odds-block--status-active': isSuspended(innerFancy) || isBallRunning(innerFancy),
              }"
            >
                  <FancyMarketStatusBlock
                    :ball-running="getFancyRunnerOverlayStatus(innerFancy, { betAllow }) === 'BALL_RUNNING'"
                    :suspended="getFancyRunnerOverlayStatus(innerFancy, { betAllow }) === 'SUSPENDED'"
                  />
                  <div
                    v-for="(level, levelIdx) in getPriceLevels(innerFancy)"
                    :key="levelIdx"
                    :class="getPriceLevels(innerFancy).length > 1 ? 'fancy-odds-level' : 'fancy-odds-single'"
                  >
                    <v-btn size="default" rounded="0"
                      :disabled="isSuspended(innerFancy) || isBallRunning(innerFancy) || !betAllow"
                      class="fancy-odds-btn tw-bg-odds-lay hover:tw-bg-odds-lay-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                      variant="elevated" @click="selectBet(
                        level.layOdd,
                        'lay',
                        innerFancy.market_id,
                        innerFancy.name,
                        innerFancy.market_id,
                        innerFancy.event_id,
                        level.layAmount,
                        getMinMaxValues(innerFancy).min,
                        getMinMaxValues(innerFancy).max,
                        1,
                        level.layAmount
                      )">
                      <div class="tw-text-center tw-w-full tw-leading-tight tw-text-black">
                        <template v-if="level.layOdd != null">
                          <div class="fancy-odds-price mo-price">{{ level.layOdd }}</div>
                          <div v-if="level.layAmount != null" class="fancy-odds-size mo-size">{{ level.layAmount }}</div>
                        </template>
                        <div v-else class="fancy-odds-price mo-price">0</div>
                      </div>
                    </v-btn>
                    <v-btn size="default" rounded="0"
                      :disabled="isSuspended(innerFancy) || isBallRunning(innerFancy) || !betAllow"
                      class="fancy-odds-btn tw-bg-odds-back hover:tw-bg-odds-back-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                      variant="elevated" @click="selectBet(
                        level.backOdd,
                        'back',
                        innerFancy.market_id,
                        innerFancy.name,
                        innerFancy.market_id,
                        innerFancy.event_id,
                        level.backAmount,
                        getMinMaxValues(innerFancy).min,
                        getMinMaxValues(innerFancy).max,
                        1,
                        level.backAmount
                      )">
                      <div class="tw-text-center tw-w-full tw-leading-tight tw-text-black">
                        <template v-if="level.backOdd != null">
                          <div class="fancy-odds-price mo-price">{{ level.backOdd }}</div>
                          <div v-if="level.backAmount != null" class="fancy-odds-size mo-size">{{ level.backAmount }}</div>
                        </template>
                        <div v-else class="fancy-odds-price mo-price">0</div>
                      </div>
                    </v-btn>
                  </div>
            </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </template>

  <FancyPositionsDialog v-model="showPositionsDialog" :title="dialogTitle" :positions="dialogPositions" />

  <RulesDialog v-model="rulesOpen" :sportName="t('components.fancy.rulesSportName')" />
</template>

<style scoped>
.v-btn:disabled {
  opacity: 1 !important;
  background-color: inherit !important;
}

.v-btn:disabled .v-btn__overlay {
  opacity: 0 !important;
}

.v-btn:disabled::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.05);
  pointer-events: none;
  z-index: 1;
}

.v-btn:disabled .v-btn__content {
  position: relative;
  z-index: 2;
}

.tw-z-10 {
  z-index: 10 !important;
}

.fancy-row-cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: var(--sports-bet-odds-btn-gap);
  align-items: stretch;
}

.fancy-odds-wrap {
  position: relative;
}

.fancy-odds-block {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sports-bet-odds-btn-gap, 8px);
}

.fancy-odds-block--stacked {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fancy-odds-single {
  display: contents;
}

.fancy-odds-level {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sports-bet-odds-btn-gap, 8px);
}

.fancy-row-book-ladder {
  flex-shrink: 0;
  z-index: 2;
}

.fancy-odds-meta-grid {
  display: grid;
  grid-template-columns: 170px 118px;
  column-gap: 12px;
  align-items: center;
}

.row-separator {
  border-bottom: 1px solid #d8d8d8 !important;
}

.fancy-row-cols.row-separator:last-child {
  border-bottom: 0 !important;
}

.fancy-payout-below-icons :deep(p) {
  margin: 0;
  font-size: 10px;
  line-height: 1.15;
  text-align: right;
}

.fancy-row-even {
  background: white;
}

.fancy-row-odd {
  background: white;
}

.fancy-card-item {
  width: 100%;
  box-sizing: border-box;
  height: auto;
  align-self: start;
}

/* Orange bar → grey: diagonal cross-cut + fold (Match Odds / Bookmaker) */
.fancy-sessions-orange-header .fancy-sessions-header-cut,
.fancy-sessions-orange-header .fancy-sessions-header-cut-fold {
  pointer-events: none;
  position: absolute;
  top: 0;
  right: -1px;
  height: 100%;
  width: 1.75rem;
}

.fancy-sessions-orange-header .fancy-sessions-header-cut {
  z-index: 0;
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  background-color: #efefef;
}

.fancy-sessions-orange-header .fancy-sessions-header-cut-fold {
  z-index: 1;
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  background: linear-gradient(
    118deg,
    rgba(62, 48, 22, 0.4) 0%,
    rgba(62, 48, 22, 0.07) 26%,
    transparent 52%
  );
  mix-blend-mode: multiply;
}

@media (max-width: 767px) {
  .fancy-row-cols {
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: var(--sports-bet-odds-btn-gap);
    row-gap: 0;
    align-items: center;
  }

  .fancy-odds-meta-grid {
    grid-template-columns: var(--sports-bet-odds-pair-width);
    column-gap: 0;
    width: auto;
    justify-items: end;
  }

  .fancy-odds-block {
    width: var(--sports-bet-odds-pair-width) !important;
    max-width: var(--sports-bet-odds-pair-width) !important;
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .fancy-meta-block {
    display: none;
  }

  .fancy-row-cols {
    padding-top: 4px !important;
    padding-bottom: 4px !important;
  }

  .fancy-row-cols .v-btn {
    height: var(--sports-bet-odds-btn-height-md) !important;
    min-height: var(--sports-bet-odds-btn-height-md) !important;
  }

  .fancy-row-cols .fancy-odds-price,
  .fancy-row-cols .mo-price {
    font-size: var(--sports-bet-mobile-market-odds-price-size) !important;
    font-weight: 700 !important;
    line-height: 1.15 !important;
  }

  .fancy-row-cols .fancy-odds-size,
  .fancy-row-cols .mo-size {
    font-size: 9px !important;
    font-weight: var(--sports-bet-mobile-market-odds-size-weight) !important;
    line-height: 1.1 !important;
  }

  .fancy-row-cols h4 {
    font-size: 11px !important;
    font-weight: 700 !important;
  }

  .fancy-row-cols .v-btn {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }
}

@media (min-width: 768px) {
  .fancy-odds-block {
    gap: var(--sports-bet-odds-btn-gap) !important;
  }
}
</style>
