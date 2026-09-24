<script setup>
import { defineProps, computed, inject } from 'vue';
import useDevices from '@/composables/useDevices';
import NonFancyCalculator from '@/composables/PayoutCalculators/NonFancyCalculator';
import PayoutValue from '@/components/PayoutValue.vue';
import RulesInfoButton from '@/components/RulesInfoButton.vue';
import MarketMinMaxColumnRow from '@/components/MarketMinMaxColumnRow.vue';
import { useBetStore } from '@/stores/bet';
import { getBookmakersListByType } from './bookmakerTypes';
import numeral from 'numeral';

const { isDesktop } = useDevices();
const betStore = useBetStore();

const props = defineProps({
  bookMakersData: Object,
  selectedBet: Object,
  betHistory: Object,
  eventTypeId: [String, Number],
  eventName: String,
  betAllow: Boolean
});

// Get type 3 bookmakers as a list (Match Winner - 2 backs odds in the same row)
const typeThreeBookmakers = computed(() => {
  return getBookmakersListByType(props.bookMakersData, 3);
});

const marketIds = computed(() => {
  if (!typeThreeBookmakers.value.length) return {};

  const result = {};

  // Iterate through each market
  typeThreeBookmakers.value.forEach((marketData) => {
    // Extract the actual market data if it's wrapped
    const market = marketData?._custom?.value || marketData;

    if (market && market.values) {
      // Use market_id as key and store array of runner objects with IDs for robust matching
      const marketId = market.market_id;
      result[marketId] = market.values.map(runner => ({
        selectionId: String(runner[bookMakerIndex.runner.id] || runner.id || runner[0]),
        runnerId: String(runner[bookMakerIndex.runner.id] || runner.id || runner[0]),
        key: String(runner[bookMakerIndex.runner.id] || runner.id || runner[0]) // Primary key for betSummary
      }));
    }
  });

  return result;
});

const betSummary = computed(() => {
  const { betSummary } = NonFancyCalculator(marketIds.value, props.selectedBet, betStore.betOutcomes);
  return betSummary;
});

const getMarketBetDelay = (marketId) => typeThreeBookmakers.value.find((market) => String(market?.market_id) === String(marketId))?.bet_delay;

const selectBet = async (odd, backOrLay, runnerId, runnerName, type, marketId, eventId, minAmount, maxAmount, betting_type, runnerCount) => {
  if (!props.betAllow) {
    return; // Don't proceed if betting is not allowed
  }

  await betStore.handleSelectBet({
    odd,
    backOrLay,
    runnerId,
    runnerName,
    marketId: marketId,
    eventId: eventId,
    type: 'BM',
    marketTypeName: type,
    minAmount,
    maxAmount,
    betting_type: betting_type ?? 'BM_ODD',
    bet_delay: getMarketBetDelay(marketId),
  }, props.eventTypeId, props.eventName, runnerCount || 0);
}
const openRules = inject('openRules');

const isBookmakerBetAllow = (bookmaker) =>
  bookmaker?.bet_allow === 1 || bookmaker?.bet_allow === true || bookmaker?.bet_allow === '1';
</script>

<template>
  <!-- Type 3 Bookmakers Section (Match Winner - 2 backs odds side by side) -->
  <div v-for="(bookmaker, bookmakerIndex) in typeThreeBookmakers" :key="bookmakerIndex">
    <div v-if="bookmaker?.status === 1"
      class="rounded-lg tw-bg-theme-surface-alt tw-my-3 tw-py-2" elevation="0">
      <div class="tw-mx-2 tw-bg-theme-surface tw-rounded-lg tw-overflow-visible" style="border: 1px solid var(--color-nav)">
        <div v-if="bookmaker?.message" class="market-message-banner">
          <marquee class="tw-text-xs tw-text-marquee">
            {{ bookmaker?.message }}
          </marquee>
        </div>
        <!-- Header -->
        <v-card-title class="tw-border-b tw-border-theme-border tw-flex tw-items-center tw-gap-2 tw-overflow-visible">
          <h2 class="tw-text-theme-text tw-font-extrabold tw-text-base tw-m-0 tw-min-w-0 tw-flex-1 tw-truncate" :title="bookmaker.title">{{ bookmaker.title }}</h2>
          <v-spacer class="tw-hidden sm:tw-block" />
          <RulesInfoButton @click="openRules && openRules()" class="tw-flex-shrink-0" />
        </v-card-title>
        <MarketMinMaxColumnRow
          variant="backOnly"
          :min-bet="bookmaker.min_bet"
          :max-bet="bookmaker.max_bet"
          :bet-allow="isBookmakerBetAllow(bookmaker)"
        />
      </div>

      <!-- Type 3 Runners -->
      <v-card-text class="tw-p-4 odds-buttons-container">
        <div v-if="bookmaker.values?.length" class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
          <div v-for="(value, index) in bookmaker.values" :key="value.id"
            class="tw-px-4 tw-py-2 tw-border tw-border-theme-border">
            <div class="tw-flex tw-flex-col tw-gap-3">
              <!-- Runner Name -->
              <h3 class="tw-text-theme-text tw-font-semibold tw-text-md tw-text-center">
                {{ value[bookMakerIndex.runner.name] }}
              </h3>

              <!-- Back Button for Type 3 -->
              <div class="tw-flex tw-justify-center tw-gap-4 tw-items-center">
                <PayoutValue small :value="betSummary?.[bookmaker.market_id]?.[String(value[bookMakerIndex.runner.id] || value[0])]?.potential_payout" />

                <div
                  class="tw-relative tw-inline-flex tw-items-center tw-justify-center"
                  :class="{ 'market-odds-status-shell': value[bookMakerIndex.status.isSuspended] == 1 }"
                >
                  <div
                    class="tw-inline-flex"
                    :class="{ 'market-odds-status-dim': value[bookMakerIndex.status.isSuspended] == 1 }"
                  >
                    <v-btn size="default" rounded="0"
                      class="odds-back-bg-1 tw-w-16 tw-h-12 tw-bg-[var(--color-back-bg-1)] hover:tw-bg-[var(--color-back-bg-2)] tw-flex-shrink-0 tw-rounded-none tw-text-black tw-font-bold"
                      :disabled="value[bookMakerIndex.status.isSuspended] == 1"
                      @click="selectBet(value?.[bookMakerIndex.back.odd], 'back', value[bookMakerIndex.runner.id], value?.[bookMakerIndex.runner.name], bookmaker?.title ?? '', bookmaker.market_id, bookmaker.event_id, bookmaker.min_bet, bookmaker.max_bet, bookmaker?.betting_type, bookmaker.values.length)">
                      <div class="tw-text-center tw-w-full">
                        <div class="tw-font-bold tw-text-sm tw-leading-tight">{{ value?.[bookMakerIndex.back.odd] ?? 0 }}</div>
                        <div class="tw-text-xs tw-leading-tight tw-font-bold tw-flex tw-justify-center tw-items-center">
                          {{ value?.[bookMakerIndex.back.odd] != null && bookmaker.max_bet != null
                            ? numeral(bookmaker.max_bet).format('0a')
                            : '0.0' }}
                        </div>
                      </div>
                    </v-btn>
                  </div>

                  <div v-if="value[bookMakerIndex.status.isSuspended] == 1"
                    class="suspended-overlay tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-z-10">
                    <span class="suspended-overlay__text">SUSPENDED</span>
                  </div>
                </div>

                <PayoutValue small :value="betSummary?.[bookmaker.market_id]?.[String(value[bookMakerIndex.runner.id] || value[0])]?.current_potential_payout" />
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
.odds-buttons-container .odds-back-bg-1.v-btn[disabled] { background-color: var(--color-back-bg-1) !important; }
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
  content: none;
}

.market-odds-status-shell {
  background: rgb(107, 114, 128);
  border-radius: var(--sports-bet-odds-btn-radius);
  overflow: hidden;
}

.market-odds-status-dim {
  filter: brightness(0.2);
  opacity: 0.4;
}

.suspended-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--sports-bet-odds-btn-radius);
  background: transparent;
  pointer-events: none;
  box-sizing: border-box;
}

.suspended-overlay__text {
  margin: auto;
  color: #fff;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: normal;
  text-transform: none;
  text-shadow: none;
}

.tw-z-10 {
  z-index: 10 !important;
}
</style>
