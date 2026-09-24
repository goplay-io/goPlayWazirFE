<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue';
import useDevices from '@/composables/useDevices';
import NonFancyCalculator from "@/composables/PayoutCalculators/NonFancyCalculator";
import { useRunnerCppEmitter } from '@/composables/useRunnerCppEmitter';
import RunnerPayouts from '@/components/sports/RunnerPayouts.vue';
import RulesInfoButton from '@/components/RulesInfoButton.vue';
import RulesDialog from '@/components/RulesDialog.vue';
import RunnerStatusOverlay from '@/components/RunnerStatusOverlay.vue';
// import PinIcon from '@/components/PinIcon.vue';
import CashoutButton from '@/components/CashoutButton.vue';
import MarketMinMaxColumnRow from '@/components/MarketMinMaxColumnRow.vue';
import { useBetStore } from '@/stores/bet';
import useFavoriteMarkets from '@/composables/useFavoriteMarkets';
import { isMarketSuspended } from '@/utils/eventData';
import numeral from 'numeral';
import { formatMarketBetLimit } from '@/utils/marketBetLimitFormat.js';
import { getBetLockOverlayStatus, isBetLockInteractionBlocked, isMarketBetAllow } from '@/utils/betLockOverlay';

const { isDesktop } = useDevices();
const betStore = useBetStore();
const { toggleFavorite, isFavorited } = useFavoriteMarkets();

const props = defineProps({
  matchOddsData: Object,
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
    default: null
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

// Extract selection_ids from runners
const runnerIds = computed(() => {
  if (!props.matchOddsData?.runners?.length) return [];

  return props.matchOddsData.runners.map(runner => {
    return runner.selection_id || runner.id;
  }).filter(Boolean);
});

// Create mapping from selection_id to runner.id for outcomes lookup
const runnerIdMap = computed(() => {
  if (!props.matchOddsData?.runners?.length) return {};

  const map = {};
  props.matchOddsData.runners.forEach(runner => {
    const selectionId = runner.selection_id || runner.id;
    const runnerId = runner.id || runner.selection_id;
    map[selectionId] = runnerId;
  });
  return map;
});

// Use event-specific betOutcomes if provided, otherwise fall back to betStore
const eventBetOutcomes = computed(() => {
  return props.betOutcomes ?? betStore.betOutcomes;
});

const selectedBetSnapshot = computed(() => {
  if (!props.selectedBet) return null;
  const {
    runner_id,
    market_id,
    stake,
    odd,
    is_back,
    betting_type,
    type
  } = props.selectedBet;

  return {
    runner_id,
    market_id,
    stake,
    odd,
    is_back,
    betting_type,
    type
  };
});

const betSummary = computed(() => {
  const marketId = props.matchOddsData?.market_id;

  const { betSummary } = NonFancyCalculator(
    runnerIds.value,
    selectedBetSnapshot.value,
    eventBetOutcomes.value,
    marketId,
    runnerIdMap.value
  );

  return betSummary;
});

const isActiveMarket = computed(() => {
  if (!selectedBetSnapshot.value?.market_id || !props.matchOddsData?.market_id) return false;
  return String(selectedBetSnapshot.value.market_id) === String(props.matchOddsData.market_id);
});

const marketBetAllow = computed(() =>
  isMarketBetAllow(props.matchOddsData, { inPlay: props.inPlay }),
);

const isBetLockBlocked = computed(() =>
  isBetLockInteractionBlocked({
    betAllow: props.betAllow,
    marketBetAllow: marketBetAllow.value,
    inPlay: props.inPlay,
  }),
);

const getRunnerOverlayStatus = (runner) =>
  getBetLockOverlayStatus({
    betAllow: props.betAllow,
    marketBetAllow: marketBetAllow.value,
    inPlay: props.inPlay,
  }) ?? (String(runner?.status ?? '').trim() || 'SUSPENDED');

useRunnerCppEmitter({
  getSummary: () => (isActiveMarket.value ? betSummary.value : null),
  getRunners: () => (isActiveMarket.value ? (props.matchOddsData?.runners || []) : []),
  getMeta: () => ({
    eventId: props.eventId || props.matchOddsData?.event_id,
    marketId: props.matchOddsData?.market_id,
    marketName: 'Match Odds'
  }),
  onRunnerCppUpdate: props.onRunnerCppUpdate,
  watchSources: () => [betSummary.value, isActiveMarket.value]
});

const emit = defineEmits([]);

const selectBet = async (odd, backOrLay, runnerId, runnerName) => {
  if (!props.betAllow || isBetLockBlocked.value || isMarketSuspended(props.matchOddsData)) return;

  await betStore.handleSelectBet({
    odd,
    backOrLay,
    runnerId,
    runnerName,
    marketId: props.matchOddsData?.market_id,
    eventId: props.eventId || props.matchOddsData?.event_id,
    type: 'MO',
    betting_type: props.matchOddsData?.betting_type || 'ODDS',
    marketTypeName: 'MatchOdds',
    minAmount: props.matchOddsData?.min_bet,
    maxAmount: props.matchOddsData?.max_bet,
    bet_delay: props.matchOddsData?.bet_delay
  }, props.eventTypeId, props.eventName, props.matchOddsData?.runners?.length || 0);
}

const matchOddsMarketId = computed(
  () =>
    props.matchOddsData?.market_id ??
    props.matchOddsData?.marketId ??
    props.matchOddsData?.id,
);

const matchOddsEventId = computed(
  () => props.eventId ?? props.matchOddsData?.event_id ?? props.matchOddsData?.eventId,
);

// Helper function to handle favorite toggle
const handleToggleFavorite = () => {
  const marketId = matchOddsMarketId.value;
  const eventId = matchOddsEventId.value;
  // Check if onToggleFavorite was actually provided (not just default null)
  if (props.onToggleFavorite && typeof props.onToggleFavorite === 'function') {
    // Use parent's handler if provided (for MultiMarket page)
    props.onToggleFavorite(marketId, eventId);
  } else {
    // Otherwise use the composable (for regular bet page)
    toggleFavorite(marketId, eventId);
  }
};

const isMatchOddsFavorited = computed(() => {
  const marketId = matchOddsMarketId.value;
  const eventId = matchOddsEventId.value;
  if (props.isFavorite && typeof props.isFavorite === 'function') {
    return props.isFavorite(marketId, eventId);
  }
  return isFavorited(marketId, eventId);
});

// Rules dialog state
const rulesOpen = ref(false);
const showRules = () => {
  rulesOpen.value = true;
};

const runners = computed(() => props.matchOddsData?.runners ?? []);

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

</script>

<template>
  <div v-if="props.matchOddsData" class="tw-border tw-border-[#d9d9d9] tw-overflow-hidden match-odds-root">
    <div v-if="props.matchOddsData?.message" class="market-message-banner">
      <marquee class="tw-text-xs tw-text-marquee">
        {{ props.matchOddsData?.message }}
      </marquee>
    </div>
  <div class="match-odds-header-bar mo-bl-header-bar tw-flex tw-flex-row tw-items-stretch tw-overflow-hidden tw-border-b tw-border-[#d9d9d9]">

  <!-- LEFT SIDE (GOLD with angled edge look) -->
  <div class="match-odds-orange-header tw-relative tw-z-0 tw-flex tw-flex-none tw-w-max tw-flex-nowrap tw-items-center tw-gap-x-1 tw-pl-2 tw-pr-7 tw-py-1 tw-min-w-[220px] md:tw-px-2.5 md:tw-py-1">

    <div class="tw-flex tw-min-w-0 tw-shrink tw-items-center md:tw-gap-2.5">
      <!-- PinIcon hidden — market header favourite pin disabled for now
      <PinIcon
        :active="isMatchOddsFavorited"
        size="16"
        class="match-odds-pin tw-shrink-0"
        @click="handleToggleFavorite"
      />
      -->

      <div class="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-x-1 md:tw-gap-x-1.5">
        <span
          class="match-odds-section-title tw-relative tw-z-[2] tw-min-w-0 tw-font-bold tw-text-black tw-uppercase tw-text-[10px] tw-leading-tight sm:tw-text-[11px] md:tw-leading-tight"
          title="MATCH ODDS">
          MATCH ODDS
        </span>
      </div>
    </div>

    <CashoutButton
        v-if="props.matchOddsData?.runners?.length === 2"
        class="market-header-cashout tw-flex-none tw-relative tw-z-[3]"
        :marketId="props.matchOddsData?.market_id"
        :runners="props.matchOddsData?.runners"
        :outcomes="eventBetOutcomes"
        :betAllow="props.betAllow && marketBetAllow"
        :marketStatus="props.matchOddsData?.status"
        :eventId="props.eventId || props.matchOddsData?.event_id"
        :eventTypeId="props.eventTypeId"
        :eventName="props.eventName"
        :providerId="props.providerId"
        :minBet="props.matchOddsData?.min_bet"
        :maxBet="props.matchOddsData?.max_bet"
        :bettingType="props.matchOddsData?.betting_type"
        marketType="MO"
        marketTypeName="MatchOdds"
      :cashoutActive="props.cashoutActive" :speedCashoutActive="props.speedCashoutActive"
        size="x-small" />

    <RulesInfoButton @click="showRules" color="white" size="x-small" class="tw-flex-shrink-0 tw-relative tw-z-[3] tw-ml-auto" />

    <!-- Cross-cut into MIN/MAX strip: grey facet + darker fold (mobile + desktop) -->
    <div class="match-odds-header-cut" aria-hidden="true"></div>
    <div class="match-odds-header-cut-fold" aria-hidden="true"></div>

  </div>

  <!-- RIGHT SIDE (z-index above orange wedge so MIN/MAX is never clipped) -->
  <div
    class="match-odds-header-grey tw-relative tw-z-[1] tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-between tw-gap-1.5 tw-bg-[#efefef] tw-py-1 tw-pl-1 tw-pr-0 tw-w-auto md:tw-grid md:tw-grid-cols-[minmax(0,1fr)_auto] md:tw-items-center md:tw-justify-start md:tw-gap-x-3 md:tw-gap-y-0 md:tw-pl-2 md:tw-pr-0"
  >

    <!-- MIN / MAX: single nowrap block — avoids flex shrink clipping “MI” off MIN -->
    <div
      class="sports-bet-header-limits match-odds-header-limits tw-ml-auto tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-x-1 tw-gap-y-0 tw-text-right tw-font-semibold tw-leading-none md:tw-ml-0 md:tw-min-w-0 md:tw-w-full md:tw-shrink md:tw-flex-nowrap md:tw-justify-center md:tw-overflow-visible md:tw-whitespace-nowrap md:tw-text-center md:tw-font-semibold md:tw-text-[#525252]"
    >
      <span class="match-odds-header-limit-text tw-whitespace-nowrap">Min:{{ formatMarketBetLimit(props.matchOddsData?.min_bet) }}</span>
      <span class="match-odds-header-limit-text tw-whitespace-nowrap">Max:{{ formatMarketBetLimit(props.matchOddsData?.max_bet) }}</span>
    </div>

    <!-- BACK / LAY (tablet 768–1024: one back + one lay column) -->
    <div class="match-odds-header-backlay-inline tw-flex tw-min-w-0 tw-shrink-0 md:tw-justify-self-end">
      <div class="odds-header-groups odds-header-groups--dual tw-text-center">
        <span class="match-odds-header-col-label sports-bet-back-label">Back</span>
        <span class="match-odds-header-col-label sports-bet-lay-label">Lay</span>
      </div>
    </div>

  </div>

  <!-- Desktop: BACK over 2nd blue cell, LAY over 2nd pink cell -->
  <div class="match-odds-header-backlay-col tw-hidden tw-items-center tw-justify-center tw-bg-[#efefef] tw-border-b tw-border-[#d9d9d9] tw-py-1 tw-pr-0">
    <div class="odds-header-groups odds-header-groups--six tw-text-center">
      <span class="match-odds-header-col-label sports-bet-back-label">Back</span>
      <span class="match-odds-header-col-label sports-bet-lay-label">Lay</span>
    </div>
  </div>

</div>
    <!-- Runners -->
    <v-card-text class="match-odds-runners tw-p-0" :class="{ 'bet-allow-disabled': isBetLockBlocked || isMarketSuspended(props.matchOddsData) }">
      <div v-if="runners.length">
        <div v-for="runner in runners" :key="runner.id"
          class="match-odds-runner-row tw-px-1 tw-py-1 tw-bg-white row-separator last:tw-border-b-0 md:tw-py-0"
          :data-market-id="props.matchOddsData?.market_id" :data-runner-id="runner.selection_id || runner.id">
          <div class="tw-flex tw-justify-between tw-items-center tw-gap-2 md:tw-gap-2 tw-min-w-0">
            <!-- Runner Name and Payout Info -->
            <div class="tw-flex-1 tw-min-w-0 tw-pr-1">
              <h3
                class="match-odds-runner-name tw-mb-0 tw-break-words tw-text-black md:tw-leading-snug"
              >
                {{ runner.name }}
              </h3>
              <RunnerPayouts
                v-if="betSummary?.[runner.selection_id]?.potential_payout || betSummary?.[runner.selection_id]?.current_potential_payout !== null"
                :potential-payout="betSummary?.[runner.selection_id]?.potential_payout"
                :current-potential-payout="betSummary?.[runner.selection_id]?.current_potential_payout"
              />
            </div>

            <!-- Betting Buttons Container -->
            <div class="match-odds-odds-ladder tw-relative tw-flex tw-items-center tw-gap-2 md:tw-gap-2 tw-shrink-0">
              <div class="match-odds-odds-strip tw-relative tw-flex tw-items-center tw-gap-2 md:tw-gap-2">
              <!-- Back Buttons -->
              <div class="back-group tw-flex tw-gap-2 md:tw-gap-2">
                <v-btn v-if="isDesktop" size="default" rounded="0"
                  class="match-odds-price-cell odds-back-bg-3 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-flex-shrink-0 tw-bg-odds-back hover:tw-bg-odds-back-hover tw-text-black tw-font-bold"
                  :disabled="runner?.status !== 'ACTIVE' || !props.betAllow || isBetLockBlocked || isMarketSuspended(props.matchOddsData)"
                  @click="selectBet(runner?.priceBack ?? runner?.back?.[2]?.price, 'back', runner?.selection_id || runner?.id, runner?.name)"
                  variant="elevated">
                  <div class="tw-text-center tw-w-full">
                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ getPriceDisplay(runner?.back?.[2]?.price) }}</div>
                    <div class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                      {{ getSizeDisplay(runner?.back?.[2]?.size) }}
                    </div>
                  </div>
                </v-btn>

                <v-btn v-if="isDesktop" size="default" rounded="0"
                  class="match-odds-price-cell odds-back-bg-2 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-flex-shrink-0 tw-bg-odds-back hover:tw-bg-odds-back-hover tw-text-black tw-font-bold"
                  :disabled="runner?.status !== 'ACTIVE' || !props.betAllow || isBetLockBlocked || isMarketSuspended(props.matchOddsData)"
                  @click="selectBet(runner?.priceBack ?? runner?.back?.[1]?.price, 'back', runner?.selection_id || runner?.id, runner?.name)"
                  variant="elevated">
                  <div class="tw-text-center tw-w-full">
                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ getPriceDisplay(runner?.back?.[1]?.price) }}</div>
                    <div class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                      {{ getSizeDisplay(runner?.back?.[1]?.size) }}
                    </div>
                  </div>
                </v-btn>

                <v-btn size="default" rounded="0"
                  class="match-odds-price-cell odds-back-bg-1 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-back hover:tw-bg-odds-back-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                  :disabled="runner?.status !== 'ACTIVE' || !props.betAllow || isBetLockBlocked || isMarketSuspended(props.matchOddsData)"
                  @click="selectBet(runner?.priceBack ?? runner?.back?.[0]?.price, 'back', runner?.selection_id || runner?.id, runner?.name)"
                  variant="elevated">
                  <div class="tw-text-center tw-w-full">
                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ getPriceDisplay(runner?.back?.[0]?.price) }}</div>
                    <div class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                      {{ getSizeDisplay(runner?.back?.[0]?.size) }}
                    </div>
                  </div>
                </v-btn>
              </div>

              <!-- Lay Buttons -->
              <div class="lay-group tw-flex tw-gap-2 md:tw-gap-2">
                <v-btn size="default" rounded="0"
                  class="match-odds-price-cell odds-lay-bg-1 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-lay hover:tw-bg-odds-lay-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                  :disabled="runner?.status !== 'ACTIVE' || !props.betAllow || isBetLockBlocked || isMarketSuspended(props.matchOddsData)"
                  @click="selectBet(runner?.priceLay ?? runner?.lay?.[0]?.price, 'lay', runner?.selection_id || runner?.id, runner?.name)"
                  variant="elevated">
                  <div class="tw-text-center tw-w-full">
                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ getPriceDisplay(runner?.lay?.[0]?.price) }}</div>
                    <div class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                      {{ getSizeDisplay(runner?.lay?.[0]?.size) }}
                    </div>
                  </div>
                </v-btn>

                <v-btn v-if="isDesktop" size="default" rounded="0"
                  class="match-odds-price-cell odds-lay-bg-2 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-lay hover:tw-bg-odds-lay-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                  :disabled="runner?.status !== 'ACTIVE' || !props.betAllow || isBetLockBlocked || isMarketSuspended(props.matchOddsData)"
                  @click="selectBet(runner?.priceLay ?? runner?.lay?.[1]?.price, 'lay', runner?.selection_id || runner?.id, runner?.name)"
                  variant="elevated">
                  <div class="tw-text-center tw-w-full">
                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ getPriceDisplay(runner?.lay?.[1]?.price) }}</div>
                    <div class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                      {{ getSizeDisplay(runner?.lay?.[1]?.size) }}
                    </div>
                  </div>
                </v-btn>

                <v-btn v-if="isDesktop" size="default" rounded="0"
                  class="match-odds-price-cell odds-lay-bg-3 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-lay hover:tw-bg-odds-lay-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                  :disabled="runner?.status !== 'ACTIVE' || !props.betAllow || isBetLockBlocked || isMarketSuspended(props.matchOddsData)"
                  @click="selectBet(runner?.priceLay ?? runner?.lay?.[2]?.price, 'lay', runner?.selection_id || runner?.id, runner?.name)"
                  variant="elevated">
                  <div class="tw-text-center tw-w-full">
                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ getPriceDisplay(runner?.lay?.[2]?.price) }}</div>
                    <div class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                      {{ getSizeDisplay(runner?.lay?.[2]?.size) }}
                    </div>
                  </div>
                </v-btn>
              </div>

              <!-- Suspended/Status Overlay -->
              <RunnerStatusOverlay :runner-status="getRunnerOverlayStatus(runner)" :market-status="props.matchOddsData?.status" :ball-running="runner?.ballRunning" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card-text>
  </div>

  <!-- Rules Dialog -->
  <RulesDialog v-model="rulesOpen" sportName="match" />
</template>

<style scoped>
.v-btn:disabled {
  opacity: 1 !important;
}

/* Disabled ladder cells: hide Vuetify lock adornment so "-" stays visible */
.match-odds-root :deep(.match-odds-price-cell.v-btn--disabled .v-icon),
.match-odds-root :deep(.match-odds-price-cell[disabled] .v-icon) {
  display: none !important;
}

.bet-allow-disabled {
  --v-disabled-opacity: 1;
}

.bet-allow-disabled .odds-back-bg-1.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-back-bg-1.v-btn[disabled] {
  background-color: var(--color-back-bg-1) !important;
}

.bet-allow-disabled .odds-back-bg-2.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-back-bg-2.v-btn[disabled] {
  background-color: var(--color-back-bg-1) !important;
}

.bet-allow-disabled .odds-back-bg-3.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-back-bg-3.v-btn[disabled] {
  background-color: var(--color-back-bg-1) !important;
}

.bet-allow-disabled .odds-lay-bg-1.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-lay-bg-1.v-btn[disabled] {
  background-color: var(--color-lay-bg-1) !important;
}

.bet-allow-disabled .odds-lay-bg-2.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-lay-bg-2.v-btn[disabled] {
  background-color: var(--color-lay-bg-1) !important;
}

.bet-allow-disabled .odds-lay-bg-3.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-lay-bg-3.v-btn[disabled] {
  background-color: var(--color-lay-bg-1) !important;
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
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
  border-radius: inherit;
}

.tw-z-10 {
  z-index: 10 !important;
}

.row-separator {
  border-bottom: 1px solid #d8d8d8 !important;
}

/* Keep header within viewport on narrow screens */
.match-odds-root,
.match-odds-header-bar {
  max-width: 100%;
}

/* Orange bar → grey MIN/MAX: diagonal cross-cut + fold (mobile reference) */
.match-odds-orange-header .match-odds-header-cut,
.match-odds-orange-header .match-odds-header-cut-fold {
  pointer-events: none;
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 1.75rem; /* ~w-7 */
}

.match-odds-orange-header .match-odds-header-cut {
  z-index: 2;
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  background-color: #efefef !important;
}

.match-odds-orange-header .match-odds-header-cut-fold {
  display: none !important;
}

@media (min-width: 768px) {
  .match-odds-orange-header .match-odds-header-cut,
  .match-odds-orange-header .match-odds-header-cut-fold {
    right: 0;
    width: 1.25rem;
  }
}

.odds-header-groups {
  display: grid;
  grid-template-columns: var(--sports-bet-odds-btn-width) var(--sports-bet-odds-btn-width);
  column-gap: var(--sports-bet-odds-btn-gap);
  width: var(--sports-bet-odds-pair-width);
  align-items: center;
}

@media (max-width: 767.98px) {
  .odds-header-groups-mobile {
    display: grid;
    grid-template-columns: 69px 69px;
    column-gap: var(--sports-bet-odds-btn-gap);
    width: var(--sports-bet-odds-pair-width);
    align-items: center;
  }
}

@media (max-width: 767.98px) {
  .odds-header-groups-mobile {
    grid-template-columns: var(--sports-bet-odds-btn-width) var(--sports-bet-odds-btn-width);
    column-gap: var(--sports-bet-odds-btn-gap);
    width: var(--sports-bet-odds-pair-width);
    padding-left: 0;
  }

  .odds-header-groups-mobile > span {
    width: var(--sports-bet-odds-btn-width);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .match-odds-root {
    isolation: isolate;
  }

  .match-odds-root .mo-bl-header-bar {
    position: relative;
    z-index: 1;
  }

  .match-odds-root .match-odds-mobile-meta-row {
    position: relative;
    z-index: 2;
  }

  .match-odds-root .match-odds-runners {
    position: relative;
    z-index: 2;
    padding-top: 0;
    padding-right: 0 !important;
    overflow: hidden !important;
  }

  .match-odds-root .match-odds-runners::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  /* Mobile: square odds grid (reference — no rounded corners) */
  .match-odds-odds-ladder {
    width: var(--sports-bet-odds-pair-width);
    min-width: var(--sports-bet-odds-pair-width);
    justify-content: flex-end;
    gap: 0 !important;
  }

  .match-odds-odds-strip {
    width: var(--sports-bet-odds-pair-width);
    min-width: var(--sports-bet-odds-pair-width);
    justify-content: flex-end;
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .match-odds-odds-strip > .back-group,
  .match-odds-odds-strip > .lay-group {
    width: var(--sports-bet-odds-btn-width);
    min-width: var(--sports-bet-odds-btn-width);
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .match-odds-root :deep(.match-odds-price-cell.v-btn),
  .match-odds-root :deep(.match-odds-price-cell) {
    width: 69px !important;
    min-width: 69px !important;
    height: var(--sports-bet-odds-btn-height) !important;
    min-height: var(--sports-bet-odds-btn-height) !important;
    max-height: var(--sports-bet-odds-btn-height) !important;
    padding: 0 !important;
    border-radius: var(--sports-bet-odds-btn-radius) !important;
    box-shadow: none !important;
  }

  .match-odds-root :deep(.match-odds-price-cell .v-btn__overlay),
  .match-odds-root :deep(.match-odds-price-cell .v-btn__underlay) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .match-odds-root :deep(.match-odds-price-cell .v-btn__content) {
    padding: 1px 2px !important;
    min-height: 0 !important;
  }

  .match-odds-root :deep(.match-odds-price-cell .v-icon) {
    font-size: 12px !important;
  }

  .match-odds-root .match-odds-odds-strip :deep(.status-overlay--loser .status-overlay__text) {
    font-size: 12px !important;
    font-weight: 400 !important;
    letter-spacing: normal !important;
    color: #fff !important;
  }
}

@media (min-width: 768px) {
  /* Reference panel: white body, gold header, compact odds cells */
  .match-odds-root {
    /* background: #fff !important; */
    /* border-color: #e5e7eb !important; */
    font-family: inherit;
  }

  .match-odds-header-bar {
    min-height: 34px;
    border-bottom-color: #e5e7eb !important;
  }

  .match-odds-orange-header {
    background: var(--theme-orange) !important;
    min-height: 34px;
    padding: 8px 1.75rem 8px 10px !important;
    align-items: center;
  }

  .match-odds-orange-header .match-odds-section-title {
    font-family: inherit !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    letter-spacing: 0 !important;
    color: #ffffff !important;
    text-transform: uppercase;
  }

  .match-odds-orange-header .match-odds-header-pill {
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

  .match-odds-root :deep(.match-odds-pin) {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .match-odds-root :deep(.match-odds-pin .v-icon) {
    color: #fff !important;
    opacity: 1;
  }

  .match-odds-root :deep(.match-odds-pin:hover) {
    transform: none;
  }

  .match-odds-orange-header .match-odds-header-cut {
    background-color: #efefef;
  }

  .match-odds-header-grey {
    min-height: 34px;
    padding-top: 7px !important;
    padding-bottom: 7px !important;
    align-items: center;
  }

  .match-odds-header-limits {
    min-width: 0;
    text-align: center;
    justify-content: center !important;
    align-items: center !important;
    padding-left: 0 !important;
  }

  .match-odds-header-grey .match-odds-header-limits,
  .match-odds-header-grey .match-odds-header-limits .match-odds-header-limit-text {
    font-family: inherit !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    line-height: 1.2 !important;
    letter-spacing: 0 !important;
    color: #1f2937 !important;
    text-transform: none;
  }

  .match-odds-header-limits .match-odds-header-limit-text {
    font-size: inherit !important;
    font-weight: inherit !important;
    font-family: inherit !important;
    color: inherit !important;
    line-height: inherit !important;
    letter-spacing: inherit !important;
  }

  .match-odds-header-grey .odds-header-groups .sports-bet-back-label,
  .match-odds-header-grey .odds-header-groups .sports-bet-lay-label {
    font-family: inherit;
    font-size: 12px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    letter-spacing: 0 !important;
    text-transform: none;
  }

  .match-odds-header-grey .odds-header-groups .sports-bet-back-label {
    color: #111827 !important;
  }

  .match-odds-header-grey .odds-header-groups .sports-bet-lay-label {
    color: #111827 !important;
  }

  .odds-header-groups {
    justify-items: center;
    text-align: center;
  }

  .match-odds-runners {
    background: #fff;
  }

  .match-odds-runner-row {
    min-height: 43px;
    padding-top: 4px !important;
    padding-bottom: 2px !important;
    padding-left: 10px !important;
    padding-right: 0 !important;
    background: #fff !important;
    border-bottom: 1px solid #e0e0e0 !important;
  }

  .match-odds-runner-row .match-odds-runner-name {
    font-family: inherit !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
    letter-spacing: 0 !important;
    color: #000 !important;
    text-transform: none;
  }

  .match-odds-runner-row:last-child {
    border-bottom: none !important;
  }

  .match-odds-odds-ladder {
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .match-odds-root :deep(.match-odds-price-cell.v-btn) {
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

  .match-odds-root :deep(.match-odds-price-cell .v-btn__overlay),
  .match-odds-root :deep(.match-odds-price-cell .v-btn__underlay) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .match-odds-root :deep(.odds-back-bg-1),
  .match-odds-root :deep(.odds-back-bg-2),
  .match-odds-root :deep(.odds-back-bg-3) {
    background: var(--color-back-bg-1) !important;
  }

  .match-odds-root :deep(.odds-back-bg-1:hover),
  .match-odds-root :deep(.odds-back-bg-2:hover),
  .match-odds-root :deep(.odds-back-bg-3:hover) {
    background: var(--color-back-hover) !important;
  }

  .match-odds-root :deep(.odds-lay-bg-1),
  .match-odds-root :deep(.odds-lay-bg-2),
  .match-odds-root :deep(.odds-lay-bg-3) {
    background: var(--color-lay-bg-1) !important;
  }

  .match-odds-root :deep(.odds-lay-bg-1:hover),
  .match-odds-root :deep(.odds-lay-bg-2:hover),
  .match-odds-root :deep(.odds-lay-bg-3:hover) {
    background: var(--color-lay-hover) !important;
  }

  .match-odds-root :deep(.match-odds-price-cell .v-btn__content) {
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 0 !important;
    padding: 1px 2px !important;
    min-height: 0 !important;
    line-height: 1.05 !important;
  }

  .match-odds-root :deep(.match-odds-price-cell .mo-price) {
    line-height: 1.05 !important;
    margin: 0 !important;
  }

  .match-odds-root :deep(.match-odds-price-cell .mo-size) {
    line-height: 1 !important;
    margin: 0 !important;
  }

  .match-odds-root :deep(.match-odds-price-cell .v-icon) {
    display: none !important;
  }
}

/*
 * BACK/LAY header grid must match visible ladder cells.
 * 768–1024: one back + one lay (82px + 82px).
 * 1025px+: six columns — BACK on col 3 (back-bg-1), LAY on col 4 (lay-bg-1).
 */
@media (min-width: 768px) and (max-width: 1024px) {
  .odds-header-groups,
  .odds-header-groups--dual {
    grid-template-columns: var(--sports-bet-odds-btn-width) var(--sports-bet-odds-btn-width);
    width: var(--sports-bet-odds-pair-width);
    column-gap: var(--sports-bet-odds-btn-gap);
  }
}

@media (min-width: 1025px) {
  .match-odds-header-backlay-inline {
    display: none !important;
  }

  .match-odds-header-backlay-col {
    display: flex !important;
  }

  /* gold | MIN/MAX | 512px ladder labels */
  .match-odds-header-bar--aligned {
    display: grid !important;
    grid-template-columns: var(--sports-bet-orange-header-width-desktop) minmax(0, 1fr) var(--sports-bet-odds-six-width);
    align-items: stretch;
  }

  .match-odds-header-bar--aligned .match-odds-orange-header {
    grid-column: 1;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .match-odds-header-bar--aligned .match-odds-header-grey {
    grid-column: 2;
    display: flex !important;
    align-items: center;
  }

  .match-odds-header-bar--aligned .match-odds-header-grey.md\:tw-grid {
    display: flex !important;
    grid-template-columns: unset !important;
  }

  .match-odds-header-bar--aligned .match-odds-header-backlay-col {
    grid-column: 3;
    min-width: var(--sports-bet-odds-six-width);
    max-width: var(--sports-bet-odds-six-width);
  }

  /*
   * Six cells: [back3][back2][back1][lay1][lay2][lay3]
   * BACK → column 3 (back-bg-1), LAY → column 4 (lay-bg-1)
   */
  .odds-header-groups--six {
    display: grid;
    grid-template-columns: repeat(6, var(--sports-bet-odds-btn-width));
    column-gap: var(--sports-bet-odds-six-gap);
    width: var(--sports-bet-odds-six-width);
    align-items: center;
    justify-items: center;
  }

  .match-odds-root .odds-header-groups--six .sports-bet-back-label {
    grid-column: 3 !important;
  }

  .match-odds-root .odds-header-groups--six .sports-bet-lay-label {
    grid-column: 4 !important;
  }

  .match-odds-root .match-odds-odds-ladder {
    width: var(--sports-bet-odds-six-width);
    flex-shrink: 0;
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .match-odds-root .match-odds-odds-strip {
    width: var(--sports-bet-odds-six-width);
    flex-shrink: 0;
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .match-odds-root .match-odds-odds-strip > .back-group,
  .match-odds-root .match-odds-odds-strip > .lay-group {
    width: calc(
      (var(--sports-bet-odds-btn-width) * 3) + (var(--sports-bet-odds-six-gap) * 2)
    );
    flex-shrink: 0;
    gap: var(--sports-bet-odds-six-gap) !important;
  }

  .match-odds-header-grey .odds-header-groups .sports-bet-back-label,
  .match-odds-header-grey .odds-header-groups .sports-bet-lay-label,
  .match-odds-header-backlay-col .odds-header-groups .sports-bet-back-label,
  .match-odds-header-backlay-col .odds-header-groups .sports-bet-lay-label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 1.25rem;
  }
}
</style>
