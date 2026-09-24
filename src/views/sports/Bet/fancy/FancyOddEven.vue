<script setup>
import {
  shouldShowFancyMarket,
  isFancyMarketCatalogEligible,
  getFancyRunnerOverlayStatus,
  matchesSortPriority,
} from '@/utils/fancyMarketVisibility';
import { getFancyTopPrices } from '@/utils/fancyOddsLevels';
import { sortFancyMarketsByTabPriorities } from '@/utils/runnerSort';
import { defineProps, computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import PayoutValue from '@/components/PayoutValue.vue';

import { useBetStore } from '@/stores/bet';
import RulesDialog from '@/components/RulesDialog.vue';
import RulesInfoButton from '@/components/RulesInfoButton.vue';
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

const getEventId = () => {
  if (props.eventId) return props.eventId;
  if (props.fancyData && props.fancyData.length > 0) {
    return props.fancyData[0]?.event_id;
  }
  return null;
};

const collapsedHeaders = ref({});

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

const hasBetsOnMarket = (marketId) => {
  const betHistory = eventBetHistory.value;
  if (!betHistory || !Array.isArray(betHistory)) return false;

  const marketKey = String(marketId);
  return betHistory.some((bet) => {
    const betMarketId = String(bet?.market_id || bet?.marketId || '');
    return betMarketId === marketKey;
  });
};

const getFancyOutcome = (marketId) => {
  if (!hasBetsOnMarket(marketId)) {
    return null;
  }

  const betOutcomes = eventBetOutcomes.value;
  const marketKey = String(marketId);
  const outcomes = betOutcomes?.[marketKey] || betOutcomes?.[Number(marketId)] || betOutcomes?.[marketId];

  if (!outcomes || typeof outcomes !== 'object') return null;

  const values = Object.values(outcomes)
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));

  if (values.length === 0) return null;
  const minValue = Math.min(...values);
  return Math.round(minValue * 100) / 100;
};

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

const groupedFancyData = computed(() => {
  if (!props.fancyTabs || !props.fancyData) {
    const filteredData = (props.fancyData || []).filter((market) => isFancyMarketCatalogEligible(market) && shouldShowMarket(market));
    return { All: filteredData };
  }

  const groups = {};

  Object.entries(props.fancyTabs).forEach(([tabName, sortPriorities]) => {
    if (!Array.isArray(sortPriorities)) return;

    const marketsInTab = sortFancyMarketsByTabPriorities(
      props.fancyData.filter(
        (market) =>
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

const toggleHeader = (key) => {
  collapsedHeaders.value[key] = !collapsedHeaders.value[key];
};

const selectBet = async (odd, backOrLay, runnerId, runnerName, marketId, eventId, base, minAmount, maxAmount, runnerCount, fancyOdd) => {
  if (!props.betAllow) {
    return;
  }

  await betStore.handleSelectBet(
    {
      odd,
      backOrLay,
      runnerId,
      runnerName,
      marketId,
      eventId: eventId || props.eventId,
      type: 'F',
      betting_type: 'F',
      marketTypeName: 'Fancy',
      base,
      minAmount,
      maxAmount,
      rate: fancyOdd,
    bet_delay: props.fancyData?.find((market) => String(market?.market_id) === String(marketId))?.bet_delay,
    },
    props.eventTypeId,
    props.eventName,
    runnerCount || 1
  );
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
    min: market?.min_bet,
    max: market?.max_bet
  };
};

const getOddEvenLowerValue = (market) => {
  const maxBet = market?.max_bet;
  return maxBet == null ? '0.0' : maxBet;
};

const getPrices = (market) => getFancyTopPrices(market);

const shouldShowMarket = (market) => shouldShowFancyMarket(market);
const isMarketHidden = (market) => !shouldShowMarket(market);

const toOddEvenDisplayOddNumber = (fancyOdd) => {
  const value = Number(fancyOdd);
  if (!Number.isFinite(value)) return null;
  return 1 + value / 100;
};

const toOddEvenDisplayOdd = (fancyOdd) => {
  const converted = toOddEvenDisplayOddNumber(fancyOdd);
  return converted == null ? null : converted.toFixed(2);
};

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

  const posArray = Object.entries(outcomes)
    .map(([runnerId, amount]) => ({
      run: runnerId,
      amount: Math.round((Number(amount) || 0) * 100) / 100
    }))
    .sort((a, b) => Number(a.run) - Number(b.run));

  dialogPositions.value = posArray;
  dialogTitle.value = name || '';
  showPositionsDialog.value = true;
}

const rulesOpen = ref(false);
const showRules = () => { rulesOpen.value = true; };
const { t } = useI18n();
</script>

<template>
  <template v-for="(fancy, key) in groupedFancyData" :key="key">
    <div
      v-if="(props.activeCategory === 'All' || props.activeCategory === key) && String(key).toLowerCase() === 'odd/even' && fancy.some(m => !isMarketHidden(m))"
      class="fancy-card-item fancy-market-block tw-bg-theme-surface tw-border tw-border-theme-border tw-overflow-hidden"
    >
      <div class="tw-flex tw-items-stretch tw-overflow-hidden tw-border-b tw-border-theme-border">
        <div
          class="fancy-oe-orange-header tw-relative tw-z-0 tw-flex tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-x-1 tw-bg-gradient-to-r tw-from-[#b88f2f] tw-via-[#e7dc99] tw-to-[#ba9336] tw-pl-2 tw-pr-7 tw-py-1 md:tw-px-2.5 md:tw-py-1 tw-basis-[58%] tw-min-w-[220px] tw-max-w-[min(100%,320px)] md:tw-basis-auto md:tw-min-w-[360px] md:tw-max-w-none">
          <h3
            class="fancy-section-title match-odds-section-title tw-m-0 tw-min-w-0 tw-flex-1 tw-font-bold tw-text-black tw-uppercase tw-text-[10px] tw-leading-none sm:tw-text-[11px] md:tw-leading-tight"
          >
            {{ key }}
          </h3>
          <RulesInfoButton @click="showRules" color="white" size="x-small" class="tw-flex-shrink-0 tw-relative tw-z-[3]" />
          <div class="fancy-oe-header-cut" aria-hidden="true"></div>
          <div class="fancy-oe-header-cut-fold" aria-hidden="true"></div>
        </div>
        <div class="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-bg-[#efefef] tw-px-2.5 tw-py-1 md:tw-px-2 md:tw-py-1">
          <div v-if="!collapsedHeaders[key]" class="odd-even-odds-block tw-grid tw-grid-cols-2 tw-gap-2 tw-w-[146px] tw-text-center tw-ml-auto">
            <span class="fancy-header-col-label sports-bet-back-label">ODD</span>
            <span class="fancy-header-col-label sports-bet-back-label">EVEN</span>
          </div>
          <div v-if="collapsedHeaders[key]" class="tw-ml-auto"></div>
        </div>
      </div>

      <v-expand-transition>
        <div v-if="!collapsedHeaders[key]" class="tw-p-0">
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
                class="odd-even-odds-block tw-relative tw-grid tw-grid-cols-2 tw-gap-2 tw-w-[146px]"
                :class="{ 'fancy-odds-block--status-active': isSuspended(innerFancy) || isBallRunning(innerFancy) }"
              >
                    <FancyMarketStatusBlock
                      :ball-running="getFancyRunnerOverlayStatus(innerFancy, { betAllow }) === 'BALL_RUNNING'"
                    :suspended="getFancyRunnerOverlayStatus(innerFancy, { betAllow }) === 'SUSPENDED'"
                    />
                    <div class="tw-flex tw-justify-center tw-items-center">
                      <v-btn size="default" rounded="0"
                        :disabled="isSuspended(innerFancy) || isBallRunning(innerFancy) || !betAllow"
                        class="odd-even-box fancy-odds-btn tw-bg-odds-back hover:tw-bg-odds-back-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                        variant="elevated" @click="selectBet(
                          getPrices(innerFancy).layOdd,
                          'lay',
                          innerFancy.market_id,
                          innerFancy.name,
                          innerFancy.market_id,
                          innerFancy.event_id,
                          getPrices(innerFancy).layAmount,
                          getMinMaxValues(innerFancy).min,
                          getMinMaxValues(innerFancy).max,
                          1,
                          getPrices(innerFancy).layAmount
                        )">
                        <div class="tw-text-center tw-w-full tw-text-black">
                          <div class="fancy-odds-price mo-price tw-leading-tight">{{ toOddEvenDisplayOdd(getPrices(innerFancy).layAmount) ?? 0 }}</div>
                          <div
                            class="fancy-odds-size mo-size tw-leading-tight tw-flex tw-justify-center tw-items-center">
                            {{ toOddEvenDisplayOdd(getPrices(innerFancy).layAmount) != null ? getOddEvenLowerValue(innerFancy) : '0.0' }}
                          </div>
                        </div>
                      </v-btn>
                    </div>
                    <div class="tw-flex tw-justify-center tw-items-center">
                      <v-btn size="default" rounded="0"
                        :disabled="isSuspended(innerFancy) || isBallRunning(innerFancy) || !betAllow"
                        class="odd-even-box fancy-odds-btn tw-bg-odds-back hover:tw-bg-odds-back-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
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
                        <div class="tw-text-center tw-w-full tw-text-black">
                          <div class="fancy-odds-price mo-price tw-leading-tight">{{ toOddEvenDisplayOdd(getPrices(innerFancy).backAmount) ?? 0 }}</div>
                          <div
                            class="fancy-odds-size mo-size tw-leading-tight tw-flex tw-justify-center tw-items-center">
                            {{ toOddEvenDisplayOdd(getPrices(innerFancy).backAmount) != null ? getOddEvenLowerValue(innerFancy) : '0.0' }}
                          </div>
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

.fancy-row-cols {
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

.fancy-payout-below-icons :deep(p) {
  margin: 0;
  font-size: 10px;
  line-height: 1.15;
  text-align: right;
}

.fancy-table-head {
  align-items: center;
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
.fancy-oe-orange-header .fancy-oe-header-cut,
.fancy-oe-orange-header .fancy-oe-header-cut-fold {
  pointer-events: none;
  position: absolute;
  top: 0;
  right: -1px;
  height: 100%;
  width: 1.75rem;
}

.fancy-oe-orange-header .fancy-oe-header-cut {
  z-index: 0;
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  background-color: #efefef;
}

.fancy-oe-orange-header .fancy-oe-header-cut-fold {
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

.row-separator {
  border-bottom: 1px solid #d8d8d8 !important;
}

.fancy-row-cols.row-separator:last-child {
  border-bottom: 0 !important;
}

.odd-even-box {
  width: var(--sports-bet-odds-btn-width) !important;
  height: var(--sports-bet-odds-btn-height) !important;
  min-height: var(--sports-bet-odds-btn-height) !important;
  background-color: var(--color-back-bg-1) !important;
}

.odd-even-box:hover {
  background-color: var(--color-back-hover) !important;
}

.v-btn:disabled.odd-even-box {
  background-color: var(--color-back-bg-1) !important;
}

@media (max-width: 767px) {
  .fancy-row-cols {
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: var(--sports-bet-odds-btn-gap);
    row-gap: 0;
    align-items: center;
  }

  .odd-even-odds-meta-grid {
    grid-template-columns: var(--sports-bet-odds-pair-width) !important;
    width: auto;
    justify-items: end;
  }

  .odd-even-row-meta {
    display: grid;
    grid-template-columns: var(--sports-bet-odds-pair-width);
    row-gap: 0;
    width: auto;
    justify-items: end;
  }

  .odd-even-odds-block {
    width: var(--sports-bet-odds-pair-width) !important;
    max-width: var(--sports-bet-odds-pair-width) !important;
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .odd-even-meta-block {
    display: none;
  }

  .fancy-row-cols {
    padding-top: 4px !important;
    padding-bottom: 4px !important;
  }

  .fancy-row-cols .odd-even-box {
    height: var(--sports-bet-odds-btn-height) !important;
    min-height: var(--sports-bet-odds-btn-height) !important;
    width: var(--sports-bet-odds-btn-width) !important;
    background-color: var(--color-back-bg-1) !important;
  }

  .fancy-row-cols .odd-even-box:hover {
    background-color: var(--color-back-hover) !important;
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
}

</style>
