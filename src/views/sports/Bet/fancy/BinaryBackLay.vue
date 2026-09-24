<script setup>
import { defineProps, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PayoutValue from '@/components/PayoutValue.vue';
import { useBetStore } from '@/stores/bet';
import RulesInfoButton from '@/components/RulesInfoButton.vue';
import RulesDialog from '@/components/RulesDialog.vue';
import FancyPositionsDialog from './FancyPositionsDialog.vue';
import FancyMarketStatusBlock from './FancyMarketStatusBlock.vue';
import BookLadderIcon from '@/components/BookLadderIcon.vue';
import FancyMinMaxInfo from '@/components/FancyMinMaxInfo.vue';
import {
  getBetLockOverlayStatus,
  isBetLockInteractionBlockedForMarket,
  isMarketBetAllow,
} from '@/utils/betLockOverlay';

const betStore = useBetStore();

const props = defineProps({
  binaryData: {
    type: Array,
    default: () => []
  },
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
    default: false,
  },
});

const eventBetHistory = computed(() => props.betHistory ?? betStore.betHistory);
const eventBetOutcomes = computed(() => props.betOutcomes ?? betStore.betOutcomes);

const hasBetsOnMarket = (marketId) => {
  const history = eventBetHistory.value;
  if (!history || !Array.isArray(history)) return false;
  const key = String(marketId);
  return history.some(bet => String(bet?.market_id || bet?.marketId || '') === key);
};

const getBinaryOutcome = (marketId) => {
  if (!hasBetsOnMarket(marketId)) return null;
  const outcomes = eventBetOutcomes.value;
  const key = String(marketId);
  const o = outcomes?.[key] || outcomes?.[Number(marketId)] || outcomes?.[marketId];
  if (!o || typeof o !== 'object') return null;
  const values = Object.values(o).map(v => Number(v)).filter(v => Number.isFinite(v));
  if (!values.length) return null;
  return Math.round(Math.min(...values) * 100) / 100;
};

const getBinaryOutcomes = (marketId) => {
  const outcomes = eventBetOutcomes.value;
  const key = String(marketId);
  return outcomes?.[key] || outcomes?.[Number(marketId)] || outcomes?.[marketId] || null;
};

const hasBookData = (marketId) => {
  const outcomes = getBinaryOutcomes(marketId);
  return !!outcomes && Object.keys(outcomes).length > 0;
};

const visibleMarkets = computed(() => props.binaryData || []);

const selectBet = async (odd, backOrLay, runnerId, runnerName, marketId, eventId, base, minAmount, maxAmount, runnerCount, fancyOdd) => {
  const market = visibleMarkets.value.find((m) => String(m?.market_id) === String(marketId));
  if (isBetLockBlocked(market)) return;
  await betStore.handleSelectBet({
    odd,
    backOrLay,
    runnerId,
    runnerName,
    marketId,
    eventId: eventId || props.eventId,
    type: 'F',
    betting_type: 'F',
    marketTypeName: 'Binary',
    base,
    minAmount,
    maxAmount,
    rate: fancyOdd,
    bet_delay: visibleMarkets.value.find((market) => String(market?.market_id) === String(marketId))?.bet_delay,
  }, props.eventTypeId, props.eventName, runnerCount || 1);
};

const isBetLockBlocked = (market) =>
  isBetLockInteractionBlockedForMarket(market, { betAllow: props.betAllow, inPlay: props.inPlay });

const isBetLockSuspended = (market) =>
  !!getBetLockOverlayStatus({
    betAllow: props.betAllow,
    marketBetAllow: isMarketBetAllow(market, { inPlay: props.inPlay }),
    inPlay: props.inPlay,
  });

const isSuspended = (m) => String(m?.status || '').toUpperCase() === 'SUSPENDED';
const isBallRunning = (m) => String(m?.status || '').toUpperCase() === 'BALL_RUNNING';

const getMinMaxValues = (m) => ({ min: m?.min_bet || 100, max: m?.max_bet || 25000 });

const getPrices = (m) => {
  const runner = m?.runners?.[m?.market_id] ?? m?.runners?.[0] ?? m;
  return {
    layOdd: runner?.priceLay ?? runner?.lay?.[0]?.price ?? runner?.values?.[2] ?? runner?.values?.[8],
    layAmount: runner?.sizeLay ?? runner?.lay?.[0]?.size,
    backOdd: runner?.priceBack ?? runner?.back?.[0]?.price ?? runner?.values?.[4] ?? runner?.values?.[6],
    backAmount: runner?.sizeBack ?? runner?.back?.[0]?.size,
  };
};

const showPositionsDialog = ref(false);
const dialogPositions = ref([]);
const dialogTitle = ref('');

function openPositionsDialog(marketId, name) {
  const outcomes = getBinaryOutcomes(marketId);
  dialogTitle.value = name || '';
  dialogPositions.value = outcomes
    ? Object.entries(outcomes)
        .map(([runnerId, amount]) => ({ run: runnerId, amount: Math.round((Number(amount) || 0) * 100) / 100 }))
        .sort((a, b) => Number(a.run) - Number(b.run))
    : [];
  showPositionsDialog.value = true;
}

const rulesOpen = ref(false);
const showRules = () => { rulesOpen.value = true; };
const { t } = useI18n();
</script>

<template>
  <div v-if="visibleMarkets.length > 0"
    class="fancy-markets-root fancy-card-item fancy-market-block tw-bg-theme-surface tw-border tw-border-theme-border tw-overflow-hidden">

    <div class="tw-flex tw-items-stretch tw-overflow-hidden tw-border-b tw-border-theme-border">
      <div
        class="fancy-sessions-orange-header tw-relative tw-z-0 tw-flex tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-x-1 tw-bg-gradient-to-r tw-from-[#b88f2f] tw-via-[#e7dc99] tw-to-[#ba9336] tw-pl-2 tw-pr-7 tw-py-1 md:tw-px-2.5 md:tw-py-1 tw-basis-[58%] tw-min-w-[220px] tw-max-w-[min(100%,320px)] md:tw-basis-auto md:tw-min-w-[360px] md:tw-max-w-none">
        <h3
          class="fancy-section-title match-odds-section-title tw-m-0 tw-min-w-0 tw-flex-1 tw-font-bold tw-text-black tw-uppercase tw-text-[10px] tw-leading-none sm:tw-text-[11px] md:tw-leading-tight">
          Binary Markets
        </h3>
        <RulesInfoButton @click="showRules" color="white" size="x-small" class="tw-flex-shrink-0 tw-relative tw-z-[3]" />
        <div class="fancy-sessions-header-cut" aria-hidden="true"></div>
        <div class="fancy-sessions-header-cut-fold" aria-hidden="true"></div>
      </div>
      <div class="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-bg-[#efefef] tw-px-1.5 tw-py-1 md:tw-px-2 md:tw-py-1">
        <div class="fancy-odds-block tw-grid tw-grid-cols-2 tw-gap-2 tw-w-[146px] tw-text-center tw-ml-auto">
          <span class="sports-bet-lay-label">No</span>
          <span class="sports-bet-back-label">Yes</span>
        </div>
      </div>
    </div>

    <div class="tw-p-0">
      <template v-for="(market, idx) in visibleMarkets" :key="market.market_id || idx">
        <div
          :data-market-id="market.market_id"
          :data-runner-id="market.market_id"
          class="fancy-market-row-wrap"
        >
          <div v-if="market.message" class="market-message-banner">
            <marquee class="tw-text-xs tw-text-marquee">{{ market.message }}</marquee>
          </div>
          <div
          class="fancy-row-cols row-separator tw-px-1 tw-py-1 tw-items-center"
          :class="idx % 2 === 0 ? 'fancy-row-even' : 'fancy-row-odd'">

          <div class="fancy-row-meta tw-flex tw-min-w-0 tw-flex-col tw-justify-center tw-gap-0.5 tw-pl-2 tw-pr-1">
            <h4 class="fancy-runner-name text-black-force tw-m-0 tw-min-w-0 tw-leading-snug">
              <span class="tw-whitespace-normal">{{ market?.name }}</span>
            </h4>
            <PayoutValue :value="getBinaryOutcome(market.market_id)" small />
          </div>

          <div class="fancy-odds-wrap tw-relative tw-ml-auto tw-shrink-0 tw-flex tw-items-center tw-gap-2">
          <BookLadderIcon
            v-if="hasBookData(market.market_id)"
            class="fancy-row-book-ladder"
            @click="openPositionsDialog(market.market_id, market?.name)"
          />
          <FancyMinMaxInfo
            :min="getMinMaxValues(market).min"
            :max="getMinMaxValues(market).max"
          />

          <div
            class="fancy-odds-block tw-relative tw-grid tw-grid-cols-2 tw-gap-2 tw-w-[146px]"
            :class="{ 'fancy-odds-block--status-active': isSuspended(market) || isBallRunning(market) || isBetLockSuspended(market) }">
            <FancyMarketStatusBlock
              :ball-running="isBallRunning(market)"
              :suspended="isSuspended(market) || isBetLockSuspended(market)" />
            <v-btn size="default" rounded="0"
              :disabled="isSuspended(market) || isBallRunning(market) || !betAllow || isBetLockBlocked(market)"
              class="fancy-odds-btn tw-bg-odds-lay hover:tw-bg-odds-lay-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
              variant="elevated"
              @click="selectBet(getPrices(market).layOdd, 'lay', market.market_id, market.name, market.market_id, market.event_id, getPrices(market).layAmount, getMinMaxValues(market).min, getMinMaxValues(market).max, 1, getPrices(market).layAmount)">
              <div class="tw-text-center tw-w-full tw-leading-tight tw-text-black">
                <div class="fancy-odds-price mo-price">{{ getPrices(market).layOdd ?? 0 }}</div>
                <div class="fancy-odds-size mo-size">{{ getPrices(market).layAmount ?? '0.0' }}</div>
              </div>
            </v-btn>
            <v-btn size="default" rounded="0"
              :disabled="isSuspended(market) || isBallRunning(market) || !betAllow || isBetLockBlocked(market)"
              class="fancy-odds-btn tw-bg-odds-back hover:tw-bg-odds-back-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
              variant="elevated"
              @click="selectBet(getPrices(market).backOdd, 'back', market.market_id, market.name, market.market_id, market.event_id, getPrices(market).backAmount, getMinMaxValues(market).min, getMinMaxValues(market).max, 1, getPrices(market).backAmount)">
              <div class="tw-text-center tw-w-full tw-leading-tight tw-text-black">
                <div class="fancy-odds-price mo-price">{{ getPrices(market).backOdd ?? 0 }}</div>
                <div class="fancy-odds-size mo-size">{{ getPrices(market).backAmount ?? '0.0' }}</div>
              </div>
            </v-btn>
          </div>
          </div>
        </div>
        </div>
      </template>
    </div>
  </div>

  <FancyPositionsDialog v-model="showPositionsDialog" :title="dialogTitle" :positions="dialogPositions" />
  <RulesDialog v-model="rulesOpen" :sportName="t('components.fancy.rulesSportName')" />
</template>

<style scoped>
.v-btn:disabled {
  opacity: 1 !important;
  background-color: inherit !important;
}
.v-btn:disabled .v-btn__overlay { opacity: 0 !important; }
.v-btn:disabled::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.05);
  pointer-events: none;
  z-index: 1;
}
.v-btn:disabled .v-btn__content { position: relative; z-index: 2; }
.tw-z-10 { z-index: 10 !important; }

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

.row-separator { border-bottom: 1px solid #d8d8d8 !important; }
.fancy-row-cols.row-separator:last-child { border-bottom: 0 !important; }

.fancy-row-even { background: white; }
.fancy-row-odd  { background: white; }

.fancy-card-item {
  width: 100%;
  box-sizing: border-box;
  height: auto;
  align-self: start;
}

.fancy-sessions-orange-header .fancy-sessions-header-cut,
.fancy-sessions-orange-header .fancy-sessions-header-cut-fold {
  pointer-events: none;
  position: absolute;
  top: 0; right: -1px;
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
  background: linear-gradient(118deg, rgba(62,48,22,0.4) 0%, rgba(62,48,22,0.07) 26%, transparent 52%);
  mix-blend-mode: multiply;
}

@media (max-width: 767px) {
  .fancy-row-cols {
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: var(--sports-bet-odds-btn-gap);
    row-gap: 0;
    align-items: center;
    padding-top: 4px !important;
    padding-bottom: 4px !important;
  }
  .fancy-odds-block {
    width: var(--sports-bet-odds-pair-width) !important;
    max-width: var(--sports-bet-odds-pair-width) !important;
    gap: var(--sports-bet-odds-btn-gap) !important;
  }
  .fancy-row-cols .v-btn {
    height: var(--sports-bet-odds-btn-height-md) !important;
    min-height: var(--sports-bet-odds-btn-height-md) !important;
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }
  .fancy-row-cols .fancy-odds-price,
  .fancy-row-cols .mo-price {
    font-size: var(--sports-bet-mobile-market-odds-price-size) !important;
    font-weight: 700 !important;
    line-height: 1.15 !important;
  }
  .fancy-row-cols .fancy-odds-size,
  .fancy-row-cols .mo-size {
    font-size: 10px !important;
    font-weight: var(--sports-bet-mobile-market-odds-size-weight) !important;
    line-height: 1.1 !important;
  }
  .fancy-row-cols h4 { font-size: 11px !important; font-weight: 700 !important; }
}

@media (min-width: 768px) {
  .fancy-odds-block { gap: var(--sports-bet-odds-btn-gap) !important; }
}
</style>
