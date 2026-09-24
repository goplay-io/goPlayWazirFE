<script setup>
import { defineProps, computed, inject } from 'vue';
import useDevices from '@/composables/useDevices';
import NonFancyCalculator from '@/composables/PayoutCalculators/NonFancyCalculator';
import PayoutValue from '@/components/PayoutValue.vue';
import RulesInfoButton from '@/components/RulesInfoButton.vue';
import MarketMinMaxColumnRow from '@/components/MarketMinMaxColumnRow.vue';
import { useBetStore } from '@/stores/bet';
import { getBookmakersByType } from './bookmakerTypes';
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

// Get type 4 bookmakers (Match Winner - vertical list layout)
const typeFourBookmakers = computed(() => {
  if (!props.bookMakersData) return {};
  return Object.fromEntries(
    Object.entries(getBookmakersByType(props.bookMakersData, 4))
      .map(([name, data]) => [name, data?._custom?.value || data])
      .filter(([, bm]) => bm.status === 1 && bm.bet_allow === 1)
  );
});

const marketIds = computed(() => {
  if (!typeFourBookmakers.value) return {};

  const result = {};

  // Iterate through each market
  Object.entries(typeFourBookmakers.value).forEach(([marketName, marketData]) => {
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

const getMarketBetDelay = (marketId) => Object.values(typeFourBookmakers.value || {}).find((market) => String(market?.market_id) === String(marketId))?.bet_delay;

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
  }, props.eventTypeId, props.eventName, runnerCount);
}
const openRules = inject('openRules');

const isBookmakerBetAllow = (bookmaker) =>
  bookmaker?.bet_allow === 1 || bookmaker?.bet_allow === true || bookmaker?.bet_allow === '1';
</script>

<template>
  <!-- Type 4 Bookmakers Section (Match Winner - vertical list) -->
  <div v-for="(bookmaker, key) in typeFourBookmakers" :key="key">
    <div v-if="bookmaker?.status === 1" class="rounded-lg tw-bg-theme-surface-alt tw-my-3 tw-py-2" elevation="0">
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
          back-column-class="tw-w-20 lg:tw-w-60"
          :min-bet="bookmaker.min_bet"
          :max-bet="bookmaker.max_bet"
          :bet-allow="isBookmakerBetAllow(bookmaker)"
        />
      </div>

      <!-- Runners -->
      <v-card-text class="tw-p-0 odds-buttons-container">
        <div v-if="bookmaker.values?.length">
          <div v-for="(value, index) in bookmaker.values" :key="value.id"
            class="tw-px-4 tw-py-2 tw-border-b tw-border-theme-border last:tw-border-b-0">
            <div class="tw-flex tw-justify-between tw-items-center">
              <!-- Runner Name and Payout Info -->
              <div class="tw-flex-1 tw-min-w-0">
                <h3 class="tw-text-theme-text tw-font-bold tw-text-sm md:tw-text-base tw-mb-1">
                  {{ value[bookMakerIndex.runner.name] }}
                </h3>

                <div class="tw-flex tw-flex-wrap tw-gap-2">
                  <PayoutValue
                    small
                    :value="betSummary?.[bookmaker.market_id]?.[String(value[bookMakerIndex.runner.id] || value[0])]?.potential_payout" />
                </div>
              </div>

              <!-- Betting Buttons Container -->
              <div class="tw-relative tw-flex tw-items-center tw-gap-2">
                <PayoutValue
                  small
                  :value="betSummary?.[bookmaker.market_id]?.[String(value[bookMakerIndex.runner.id] || value[0])]?.current_potential_payout"
                  class="tw-mr-2" />

                <!-- Only Back Button 3 (the main back button) -->
                <div
                  class="tw-relative tw-inline-flex tw-items-center tw-justify-center"
                  :class="{ 'market-odds-status-shell': value[bookMakerIndex.status.isSuspended] == 1 }"
                >
                  <div
                    class="tw-inline-flex tw-gap-1"
                    :class="{ 'market-odds-status-dim': value[bookMakerIndex.status.isSuspended] == 1 }"
                  >
                    <v-btn size="default" rounded="0"
                      class="odds-back-bg-1 tw-w-40 tw-h-12 tw-bg-[var(--color-back-bg-1)] hover:tw-bg-[var(--color-back-bg-2)] tw-flex-shrink-0 tw-rounded-none tw-text-black tw-font-bold"
                      style="height: 48px !important; min-height: 48px !important;"
                      :disabled="value[bookMakerIndex.status.isSuspended] == 1"
                      @click="selectBet(value?.[bookMakerIndex.back.odd], 'back', value[bookMakerIndex.runner.id], value?.[bookMakerIndex.runner.name], bookmaker?.title ?? '', bookmaker.market_id, bookmaker.event_id, bookmaker.min_bet, bookmaker.max_bet, bookmaker?.betting_type, bookmaker.values.length)"
                      variant="elevated">
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
