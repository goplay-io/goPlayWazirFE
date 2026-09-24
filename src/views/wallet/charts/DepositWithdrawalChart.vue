<template>
  <div class="border-lightgreen tw-bg-theme-surface-alt tw-border tw-border-theme-border tw-rounded-2xl tw-p-4 tw-shadow-sm tw-h-full tw-flex tw-flex-col">
    <div class="tw-flex tw-justify-between tw-items-center tw-mb-4">
      <h3 class="tw-text-lg tw-font-semibold tw-text-theme-text">{{ t('wallet.charts.depositVsWithdrawals') }}</h3>
    </div>
    <div class="tw-flex tw-justify-center tw-w-full tw-flex-1 tw-items-center">
      <div class="tw-flex tw-flex-col tw-items-center">
        <v-pie
          :items="chartItems"
          :labels="false"
          :tooltip="{ subtitleFormat: '[value]%' }"
          class="tw-pa-2 tw-mt-2"
          gap="6"
          inner-cut="80"
          item-key="id"
          rounded="3"
          size="240"
          :animation="{ duration: 1000, easing: 'easeOutQuart' }"
          hide-slice
          reveal
        >
          <template v-slot:center>
            <div class="tw-text-center tw-text-theme-text">
              <div class="tw-mb-2">
                <v-icon icon="mdi-cash-plus" class="tw-mr-2" color="rgba(16, 185, 129, 1)" />
                {{ totalDeposit }}
              </div>
              <div class="tw-mb-2">
                <v-icon icon="mdi-cash-minus" class="tw-mr-2" color="rgba(239, 68, 68, 1)" />
                {{ totalWithdrawal }}
              </div>
            </div>
          </template>
        </v-pie>
      </div>
    </div>

    <div class="tw-h-0">
      <svg height="0" version="1.1" width="0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="pattern-0"
            height="20"
            patternTransform="rotate(145) scale(.2)"
            patternUnits="userSpaceOnUse"
            width="20"
          >
            <path d="M0 10h20zm0 20h20zm0 20h20zm0 20h20z" fill="none" stroke="rgb(var(--v-theme-surface))" stroke-width="3" />
          </pattern>
        </defs>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Props for the chart data
const props = defineProps({
  depositData: {
    type: Array,
    default: () => []
  },
  withdrawalData: {
    type: Array,
    default: () => []
  }
})

// Calculate totals from the data
const totalDeposit = computed(() => {
  return props.depositData.reduce((sum, val) => sum + parseFloat(val), 0)
})

const totalWithdrawal = computed(() => {
  return props.withdrawalData.reduce((sum, val) => sum + parseFloat(val), 0)
})

const totalAmount = computed(() => {
  return totalDeposit.value + totalWithdrawal.value
})

// Create chart items for v-pie component
const chartItems = computed(() => [
          { 
    id: 1, 
    title: t('wallet.charts.deposits'), 
    value: totalDeposit.value, 
    color: 'rgba(16, 185, 129, 1)', // Green for deposits - full opacity
    pattern: 'url(#pattern-0)' 
  },
  { 
    id: 2, 
    title: t('wallet.charts.withdrawals'), 
    value: totalWithdrawal.value, 
    color: 'rgba(239, 68, 68, 1)' // Red for withdrawals - full opacity
  }
])
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
