<script setup>
import { defineProps, computed } from 'vue';
import { useI18n } from 'vue-i18n'
import numeral from 'numeral';
import LossIcon from '@/assets/loss.svg';
import ProfitIcon from '@/assets/profit.svg';

const { t } = useI18n()

const props = defineProps({
  minBet: {
    type: [String, Number],
    required: true
  },
  maxBet: {
    type: [String, Number],
    required: true
  },
  betAllow: {
    type: Boolean,
    default: true
  }
});

const isLocked = computed(() => !props.betAllow);
</script>

<template>
  <div
    class="betting-limits-root tw-inline-flex tw-flex-row tw-items-center tw-gap-1.5 md:tw-gap-2 tw-px-2 tw-py-0.5 md:tw-py-1 tw-rounded-full tw-bg-theme-surface-alt/60"
    :class="{ 'betting-limits-locked': isLocked }"
  >
    <!-- Min Bet -->
    <div class="tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap betting-limits-icon">
      <img :src="LossIcon" :alt="t('components.bettingLimits.minAlt')" class="tw-w-3 tw-h-3 tw-flex-shrink-0" />
      <span class="tw-text-[11px] tw-text-theme-text-secondary tw-font-medium betting-limits-text">
        {{ t('components.bettingLimits.min') }} {{ numeral(props.minBet).format('0a') }}
      </span>
    </div>

    <div class="tw-w-1 tw-h-1 tw-flex-shrink-0 tw-bg-theme-text-secondary/60 tw-rounded-full betting-limits-sep"></div>

    <!-- Max Bet -->
    <div class="tw-flex tw-items-center tw-gap-1 tw-whitespace-nowrap betting-limits-icon">
      <img :src="ProfitIcon" :alt="t('components.bettingLimits.maxAlt')" class="tw-w-3 tw-h-3 tw-flex-shrink-0" />
      <span class="tw-text-[11px] tw-text-theme-text-secondary tw-font-medium betting-limits-text">
        {{ t('components.bettingLimits.max') }} {{ numeral(props.maxBet).format('0a') }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.betting-limits-locked {
  border: none;
}

.betting-limits-locked .betting-limits-text {
  color: var(--color-error) !important;
}

.betting-limits-locked .betting-limits-icon img {
  filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);
}

.betting-limits-locked .betting-limits-sep {
  background-color: var(--color-error) !important;
}
</style>
