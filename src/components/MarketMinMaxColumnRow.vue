<script setup>
import { computed } from 'vue';
import { formatMarketBetLimit } from '@/utils/marketBetLimitFormat.js';

const props = defineProps({
  minBet: { type: [Number, String], default: 0 },
  maxBet: { type: [Number, String], default: 0 },
  betAllow: { type: Boolean, default: true },
  /**
   * backLay — BACK + LAY (ladder spacers on lg)
   * backOnly — single BACK pill
   * yesNo — No + Yes (line markets)
   * limitsOnly — MIN | MAX only (full-width bar)
   */
  variant: {
    type: String,
    default: 'backLay',
    validator: (v) => ['backLay', 'backOnly', 'yesNo', 'limitsOnly'].includes(v),
  },
  /** Tailwind width classes for back-only header cell (e.g. tw-w-20 lg:tw-w-60) */
  backColumnClass: {
    type: String,
    default: 'tw-w-20 lg:tw-w-40',
  },
  /** Square BACK/LAY (and Yes/No) header chips — e.g. Match Odds */
  squareHeaders: {
    type: Boolean,
    default: false,
  },
});

const minFormatted = computed(() => formatMarketBetLimit(props.minBet ?? 0));
const maxFormatted = computed(() => formatMarketBetLimit(props.maxBet ?? 0));
const headerRadiusClass = computed(() => (props.squareHeaders ? 'tw-rounded-none' : 'tw-rounded-sm'));
</script>

<template>
  <div
    class="market-minmax-col-row tw-flex tw-items-center tw-justify-between tw-gap-2 tw-px-2 sm:tw-px-3 tw-py-0 tw-border-b tw-border-theme-border tw-bg-theme-surface-alt"
    :class="{ '!tw-justify-start': variant === 'limitsOnly' }"
  >
    <div
      class="tw-text-[11px] sm:tw-text-xs tw-font-medium tw-text-black tw-tracking-wide tw-whitespace-nowrap"
      :class="{ 'tw-opacity-70': !betAllow }"
    >
      <span>Min: {{ minFormatted }}</span>
      <span class="tw-mx-1.5 tw-font-normal tw-text-theme-text-muted">|</span>
      <span>Max: {{ maxFormatted }}</span>
    </div>

    <template v-if="variant === 'backLay'">
      <div class="tw-flex tw-gap-2 tw-items-center tw-flex-shrink-0">
        <div class="tw-flex tw-gap-1 tw-items-center">
          <div class="tw-hidden lg:tw-block tw-w-20" />
          <div class="tw-hidden lg:tw-block tw-w-20" />
          <div
            class="mmc-head-back tw-w-20 tw-text-center tw-font-bold tw-text-xs tw-text-gray-900 tw-uppercase tw-py-1"
            :class="headerRadiusClass"
          >
            BACK
          </div>
        </div>
        <div class="tw-flex tw-gap-1 tw-items-center">
          <div
            class="mmc-head-lay tw-w-20 tw-text-center tw-font-bold tw-text-xs tw-text-gray-900 tw-uppercase tw-py-1"
            :class="headerRadiusClass"
          >
            LAY
          </div>
          <div class="tw-hidden lg:tw-block tw-w-20" />
          <div class="tw-hidden lg:tw-block tw-w-20" />
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'backOnly'">
      <div class="tw-flex tw-flex-shrink-0">
        <div
          class="mmc-head-back tw-text-center tw-font-bold tw-text-xs tw-text-gray-900 tw-uppercase tw-py-1"
          :class="[backColumnClass, headerRadiusClass]"
        >
          BACK
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'yesNo'">
      <div class="tw-flex tw-items-center tw-gap-1 tw-flex-shrink-0">
        <div
          class="mmc-head-lay tw-w-16 tw-text-center tw-text-xs tw-font-semibold tw-text-gray-900 tw-py-1"
          :class="headerRadiusClass"
        >
          No
        </div>
        <div
          class="mmc-head-back tw-w-16 tw-text-center tw-text-xs tw-font-semibold tw-text-gray-900 tw-py-1"
          :class="headerRadiusClass"
        >
          Yes
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.mmc-head-back {
  background-color: var(--color-back-bg-1);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-back-bg-1) 55%, #000);
}

.mmc-head-lay {
  background-color: var(--color-lay-bg-1);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-lay-bg-1) 55%, #000);
}
</style>
