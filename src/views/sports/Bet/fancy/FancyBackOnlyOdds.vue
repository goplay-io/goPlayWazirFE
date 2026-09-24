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
import { getFancyTopPrices } from '@/utils/fancyOddsLevels';
import { sortFancyMarketsByTabPriorities } from '@/utils/runnerSort';

import { useBetStore } from '@/stores/bet';
import RulesDialog from '@/components/RulesDialog.vue';
import RulesInfoButton from '@/components/RulesInfoButton.vue';
import FancyPositionsDialog from './FancyPositionsDialog.vue';
import FancyMarketStatusBlock from './FancyMarketStatusBlock.vue';
import BookLadderIcon from '@/components/BookLadderIcon.vue';
import FancyMinMaxInfo from '@/components/FancyMinMaxInfo.vue';

const betStore = useBetStore();

const getFancyMarketId = (fancy) => fancy?.market_id ?? fancy?.marketId ?? fancy?.id;

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

// Use event-specific betHistory and betOutcomes if provided, otherwise fall back to betStore
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
        shouldShowMarket(market) &&
        matchesSortPriority(sortPriorities, market?.sort_priority)
      ),
      sortPriorities
    );

    if (marketsInTab.length > 0) {
      groups[tabName] = marketsInTab;
    }
  });

  return groups;
});

const orderedGroupedFancyData = computed(() => {
  const groups = groupedFancyData.value || {};
  const preferredOrder = ['sessions', 'w/p market', 'odd/even', 'xtra market'];
  const orderedEntries = [];
  const usedKeys = new Set();

  const normalizeGroupKey = (value) => String(value || '')
    .toLowerCase()
    .replace(/[/_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const preferredAliases = {
    sessions: ['sessions', 'session'],
    'w/p market': ['w/p market', 'wp market', 'w p market'],
    'odd/even': ['odd/even', 'odd even', 'odd-even'],
    'xtra market': ['xtra market', 'extra market']
  };

  preferredOrder.forEach((preferred) => {
    const aliases = preferredAliases[preferred] || [preferred];
    const matchKey = Object.keys(groups).find((k) => aliases.includes(normalizeGroupKey(k)));
    if (matchKey && !usedKeys.has(matchKey)) {
      orderedEntries.push([matchKey, groups[matchKey]]);
      usedKeys.add(matchKey);
    }
  });

  Object.entries(groups).forEach(([k, v]) => {
    if (!usedKeys.has(k)) {
      orderedEntries.push([k, v]);
    }
  });

  return orderedEntries;
});

const toggleHeader = (key) => {
  collapsedHeaders.value[key] = !collapsedHeaders.value[key];
};

const selectBet = async (odd, backOrLay, runnerId, runnerName, marketId, eventId, base, minAmount, maxAmount, runnerCount, fancyOdd) => {
  if (!props.betAllow) {
    return;
  }

  await betStore.handleSelectBet({
    odd,
    backOrLay,
    runnerId,
    runnerName,
    marketId: marketId,
    eventId: eventId || props.eventId,
    type: 'F',
    betting_type: 'KHADO',
    marketTypeName: 'Fancy',
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

const getPrices = (market) => getFancyTopPrices(market);

const shouldShowMarket = (market) => shouldShowFancyMarket(market, { backOnly: true });
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
  <template v-for="[key, fancy] in orderedGroupedFancyData" :key="key">
    <div
      v-if="(props.activeCategory === 'All' || props.activeCategory === key) && fancy.some(m => !isMarketHidden(m))"
      class="fancy-card-item fancy-market-block tw-bg-theme-surface tw-border tw-border-theme-border tw-overflow-hidden"
    >
      <div class="fancy-khadda-header-bar tw-flex tw-items-stretch tw-overflow-hidden tw-border-b tw-border-theme-border">
        <div
          class="fancy-khadda-header-orange tw-relative tw-z-0 tw-flex tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-x-1 tw-pl-2 tw-pr-7 tw-py-1 md:tw-px-2.5 md:tw-py-1 tw-basis-[58%] tw-min-w-[220px] tw-max-w-[min(100%,320px)] md:tw-basis-auto md:tw-min-w-[360px] md:tw-max-w-none">
          <h3
            class="fancy-section-title match-odds-section-title tw-m-0 tw-min-w-0 tw-flex-1 tw-font-bold tw-text-black tw-uppercase tw-text-[10px] tw-leading-none sm:tw-text-[11px] md:tw-leading-tight"
          >
            {{ key }}
          </h3>
          <RulesInfoButton @click="showRules" color="white" size="x-small" class="tw-flex-shrink-0 tw-relative tw-z-[3]" />
          <div class="fancy-khadda-header-cut" aria-hidden="true"></div>
          <div class="fancy-khadda-header-cut-fold" aria-hidden="true"></div>
        </div>
        <div class="fancy-khadda-header-grey tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-bg-[#efefef] tw-px-2.5 tw-py-1 md:tw-px-2 md:tw-py-1">
          <div class="khadda-odds-block odds-header-groups odds-header-groups--khadda-backonly tw-flex tw-items-center tw-justify-center tw-text-center tw-font-bold tw-text-[11px] md:tw-text-xs tw-leading-none tw-ml-auto">
            <span class="match-odds-header-col-label sports-bet-back-label">Back</span>
          </div>
        </div>
      </div>

      <v-expand-transition>
        <div v-if="!collapsedHeaders[key]" class="tw-p-0 khadda-fancy-rows-wrap">
          <template v-for="(innerFancy, innerKey) in fancy" :key="innerFancy.market_id ?? innerKey">
            <div
              v-show="!isMarketHidden(innerFancy)"
              :data-market-id="innerFancy.market_id"
              :data-runner-id="innerFancy.market_id"
              class="fancy-market-row-wrap"
            >
              <div v-if="innerFancy.message" class="market-message-banner">
                <marquee class="tw-text-xs tw-text-marquee">{{ innerFancy.message }}</marquee>
              </div>
            <div
              class="fancy-row-cols-khadda tw-px-1 tw-py-1 tw-border-b tw-border-theme-border last:tw-border-b-0 tw-items-center"
              :class="innerKey % 2 === 0 ? 'fancy-row-even' : 'fancy-row-odd'"
            >
              <div class="fancy-row-meta tw-flex tw-min-w-0 tw-flex-col tw-justify-center tw-gap-0.5 tw-pl-2 tw-pr-1">
                <div class="fancy-row-meta-head tw-flex tw-min-w-0 tw-items-center tw-gap-0.5">
                  <h4 class="fancy-runner-name text-black-force tw-m-0 tw-min-w-0 tw-leading-snug">
                    <span class="tw-whitespace-normal">
                      {{ innerFancy?.name }}<template v-if="getPrices(innerFancy).backAmount != null">- {{ getPrices(innerFancy).backAmount }}</template>
                    </span>
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
                class="khadda-odds-block tw-relative tw-w-[146px]"
                :class="{ 'fancy-odds-block--status-active': isSuspended(innerFancy) || isBallRunning(innerFancy) }"
              >
                  <FancyMarketStatusBlock
                    :ball-running="getFancyRunnerOverlayStatus(innerFancy, { betAllow }) === 'BALL_RUNNING'"
                    :suspended="getFancyRunnerOverlayStatus(innerFancy, { betAllow }) === 'SUSPENDED'"
                  />
                  <div class="khadda-odds-status-dim tw-w-full">
                    <v-btn size="default" rounded="0"
                      :disabled="isSuspended(innerFancy) || isBallRunning(innerFancy) || !betAllow"
                      class="fancy-odds-btn khadda-odds-vbtn khadda-odds-vbtn--full tw-w-full tw-bg-odds-back hover:tw-bg-odds-back-hover tw-text-black tw-font-bold"
                      variant="elevated" @click="selectBet(
                      getPrices(innerFancy).backOdd,
                      'back',
                      innerFancy.market_id,
                      innerFancy.name,
                      innerFancy.market_id,
                      innerFancy.event_id,
                      getPrices(innerFancy).backAmount,
                      getMinMaxValues(innerFancy).min,
                      getMinMaxValues(innerFancy).max,
                      1,
                      getPrices(innerFancy).backAmount
                    )">
                    <div class="khadda-odds-btn-inner tw-text-black">
                      <span class="fancy-odds-price khadda-odds-line khadda-odds-line--price">{{ getPrices(innerFancy).backOdd ?? 0 }}</span>
                      <div class="fancy-odds-size khadda-odds-line khadda-odds-line--size">{{ getPrices(innerFancy).backOdd != null ? getMinMaxValues(innerFancy).min : '0.0' }}</div>
                    </div>
                  </v-btn>
                  </div>
              </div>
              </div>
            </div>
            </div>
          </template>
        </div>
      </v-expand-transition>
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

.fancy-card-item {
  width: 100%;
  box-sizing: border-box;
  height: auto;
  align-self: start;
}

/* Orange bar: gradient + diagonal cross-cut + fold (Match Odds / Bookmaker sizing) */
.fancy-khadda-header-orange {
  background: linear-gradient(to right, #b88f2f, #e7dc99, #ba9336);
}

.fancy-khadda-header-orange .fancy-khadda-header-cut,
.fancy-khadda-header-orange .fancy-khadda-header-cut-fold {
  pointer-events: none;
  position: absolute;
  top: 0;
  right: -1px;
  height: 100%;
  width: 1.75rem;
}

.fancy-khadda-header-orange .fancy-khadda-header-cut {
  z-index: 0;
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  background-color: #efefef;
}

.fancy-khadda-header-orange .fancy-khadda-header-cut-fold {
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

@media (min-width: 768px) {
  .fancy-khadda-header-orange {
    background: linear-gradient(to right, #c5a04d, #f1d98c, #a6853a);
  }
}

/* Name | Yes — aligns with Sessions / Odd-Even odds columns */
.fancy-row-cols-khadda {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: var(--sports-bet-odds-btn-gap);
  align-items: stretch;
}

.fancy-odds-wrap {
  position: relative;
}

.fancy-row-book-ladder {
  flex-shrink: 0;
  z-index: 2;
}

.khadda-odds-meta-grid {
  display: grid;
  grid-template-columns: 170px 118px;
  column-gap: 12px;
  align-items: center;
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

.khadda-odds-block:not(.odds-header-groups--khadda-backonly) {
  width: var(--sports-bet-odds-pair-width);
  min-width: var(--sports-bet-odds-pair-width);
  max-width: var(--sports-bet-odds-pair-width);
  flex-shrink: 0;
}

.khadda-odds-vbtn {
  border-radius: var(--sports-bet-odds-btn-radius) !important;
  height: var(--sports-bet-odds-btn-height-md) !important;
  min-height: var(--sports-bet-odds-btn-height-md) !important;
  max-height: var(--sports-bet-odds-btn-height-md) !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  align-items: stretch !important;
  padding: 0 !important;
}

.khadda-odds-status-dim {
  width: 100%;
  min-width: 0;
}

.khadda-odds-vbtn--full {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}

.khadda-odds-block :deep(.khadda-odds-vbtn--full.v-btn) {
  width: 100% !important;
  max-width: 100% !important;
}

@media (min-width: 768px) {
  .khadda-odds-vbtn--full {
    min-height: var(--sports-bet-odds-btn-height-md) !important;
    height: 40px !important;
    max-height: var(--sports-bet-odds-btn-height-md) !important;
    border-radius: var(--sports-bet-odds-btn-radius) !important;
    box-shadow: none !important;
  }

  .khadda-odds-vbtn--full .khadda-odds-line--price,
  .khadda-odds-vbtn--full .fancy-odds-price {
    font-size: var(--sports-bet-mobile-market-odds-price-size) !important;
    font-weight: 700 !important;
  }

  .khadda-odds-vbtn--full .khadda-odds-line--size,
  .khadda-odds-vbtn--full .fancy-odds-size {
    font-size: 9px !important;
    font-weight: var(--sports-bet-mobile-market-odds-size-weight) !important;
  }
}

@media (min-width: 768px) {
  .khadda-odds-vbtn {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
    box-shadow: none !important;
  }
}

.khadda-odds-vbtn :deep(.v-btn__content) {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  flex: 1 1 auto !important;
  align-self: stretch !important;
  min-height: 0 !important;
  width: 100% !important;
  text-align: center !important;
  padding: 0 !important;
}

.khadda-odds-btn-inner {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  max-width: 100% !important;
  flex: 0 0 auto !important;
  margin: 0 !important;
  padding: 0 !important;
  text-align: center !important;
  gap: var(--sports-bet-odds-btn-gap) !important;
}

.khadda-odds-line {
  display: block !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  text-align: center !important;
  line-height: 1 !important;
}

@media (max-width: 767px) {
  /* Grey track so white row strips + blue odds “float” like the reference */
  .khadda-fancy-rows-wrap {
    display: block;
  }

  .fancy-row-cols-khadda {
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: 0.35rem;
    row-gap: 0;
    align-items: center;
    padding-left: 4px !important;
    border-radius: 0;
    background: #fff !important;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
  }

  .khadda-odds-meta-grid {
    grid-template-columns: minmax(0, 170px);
    row-gap: 0;
    width: auto;
    min-width: 0;
    max-width: 100%;
    justify-items: stretch;
  }

  .khadda-odds-block {
    width: 100% !important;
    max-width: var(--sports-bet-odds-pair-width) !important;
    min-width: 0 !important;
    box-sizing: border-box;
  }

  .khadda-meta-block {
    display: none;
  }

  .fancy-row-cols-khadda h4 {
    font-size: 11px !important;
    font-weight: 700 !important;
  }

  /* Single pill under NO + YES: full strip width, one rounded card (ref image 2) */
  .fancy-odds-strip {
    display: grid !important;
    grid-template-columns: 1fr !important;
    width: 100% !important;
    max-width: var(--sports-bet-odds-pair-width) !important;
    min-width: 0;
    justify-items: stretch;
    align-items: stretch;
    box-sizing: border-box;
    overflow: visible;
  }

  .fancy-odds-strip::before {
    display: none !important;
  }

  .fancy-odds-strip .tw-relative {
    grid-column: 1;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .fancy-odds-strip .khadda-odds-vbtn {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    min-height: var(--sports-bet-odds-btn-height) !important;
    height: 34px !important;
    max-height: var(--sports-bet-odds-btn-height) !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    background: var(--color-back-bg-1) !important;
    border-radius: var(--sports-bet-odds-btn-radius) !important;
    box-shadow: none !important;
  }

  .fancy-odds-strip .khadda-odds-vbtn:hover {
    background: var(--color-back-hover) !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.14), 0 3px 8px rgba(0, 0, 0, 0.08) !important;
  }

  .fancy-odds-strip :deep(.v-btn) {
    min-width: 0 !important;
    height: 100% !important;
    padding: 0 !important;
  }

  .fancy-odds-strip :deep(.v-btn__overlay) {
    opacity: 0 !important;
  }

  .fancy-odds-strip .khadda-odds-line--price {
    font-size: var(--sports-bet-mobile-market-odds-price-size) !important;
    font-weight: 700 !important;
    line-height: 1.05 !important;
  }

  .fancy-odds-strip .khadda-odds-line--size {
    font-size: 9px !important;
    font-weight: var(--sports-bet-mobile-market-odds-size-weight) !important;
    opacity: 1 !important;
    color: #000 !important;
    line-height: 1.05 !important;
    margin-top: 0 !important;
  }

  .fancy-odds-strip.fancy-odds-strip--status {
    overflow: visible !important;
  }

  .fancy-odds-strip--status::before {
    display: none !important;
  }

  .fancy-odds-strip--status {
    grid-template-columns: 1fr !important;
  }

  .fancy-odds-strip--status .tw-relative {
    grid-column: 1 / -1 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .fancy-odds-strip--status .khadda-odds-vbtn {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
    box-shadow: none !important;
  }

  .fancy-odds-strip--status :deep(.fancy-market-status-overlay__label) {
    font-size: 11px;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }
}
</style>
