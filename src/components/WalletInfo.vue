<template>
  <div
    class="wallet-info-root tw-flex tw-tabular-nums"
    :class="[
      compact
        ? 'wallet-info-root--compact tw-inline-flex tw-items-center tw-gap-0 tw-leading-none'
        : isMobile
          ? 'wallet-info-root--mobile tw-flex-col tw-items-center tw-gap-0 tw-leading-tight'
          : 'wallet-info-root--desktop tw-flex-col tw-items-start tw-gap-0.5 tw-leading-tight',
    ]"
  >
    <!-- Compact: balance only (mobile header pill) -->
    <template v-if="compact">
      <NumberFlow
        :value="balanceValue"
        :format="{ minimumFractionDigits: 2, maximumFractionDigits: 2 }"
        class="wallet-info-compact-balance tw-font-bold tw-text-[12px] tw-text-white"
      />
    </template>

    <template v-else>
    <!-- Balance row -->
    <div
      class="tw-flex tw-items-center"
      :class="isMobile ? 'tw-gap-0.5 tw-justify-center tw-w-full' : 'tw-gap-1'"
    >
      <span
        class="tw-font-semibold"
        :class="isMobile ? 'tw-text-[10px] tw-text-white' : 'tw-text-[11px] tw-text-white tw-font-extrabold'"
      >{{ balanceLabel }}:</span>
      <NumberFlow :value="balanceValue"
        :format="{ minimumFractionDigits: 2, maximumFractionDigits: 2 }"
        class="tw-font-bold"
        :class="isMobile ? 'tw-text-[11px] tw-text-white' : 'tw-text-[11px] tw-text-white tw-font-extrabold'" />
      <v-menu
        v-if="!isMobile"
        location="bottom end"
        :z-index="4000"
        :open-on-hover="true"
        :open-delay="150"
        :close-delay="250"
        :close-on-content-click="false"
        transition="scale-transition"
      >
        <template #activator="{ props: menuProps }">
          <button
            type="button"
            class="balance-info-trigger tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-border-solid tw-border-white tw-p-0 tw-bg-transparent tw-cursor-pointer tw-font-bold tw-leading-none tw-text-white tw-box-border hover:tw-bg-white/10 tw-transition-colors tw-w-4 tw-h-4 tw-text-[10px] md:tw-w-[15px] md:tw-h-[15px] md:tw-text-[9px]"
            v-bind="menuProps"
            :aria-label="t('components.walletInfo.balanceBreakdown')"
          >
            i
          </button>
        </template>
        <div class="balance-info-popup">
          <div class="balance-info-popup__row">
            <span class="balance-info-popup__label">{{ t('components.walletInfo.cashable') }}</span>
            <span class="balance-info-popup__value">{{ formattedCashableBreakdown }}</span>
          </div>
          <div class="balance-info-popup__row">
            <span class="balance-info-popup__label">{{ t('components.walletInfo.non-cashable') }}</span>
            <span class="balance-info-popup__value">{{ formattedNonCashableBreakdown }}</span>
          </div>
        </div>
      </v-menu>
    </div>
    <!-- Exposure only (bonus & cashable: profile dropdown) -->
    <div
      class="tw-flex tw-items-baseline md:tw-justify-start"
      :class="isMobile ? 'tw-mt-0.5 tw-justify-center tw-w-full' : 'tw-justify-end'"
    >
      <div
        class="tw-inline-flex tw-items-baseline tw-gap-0.5 tw-shrink-0 tw-cursor-pointer"
        role="button"
        tabindex="0"
        @click="openModal"
        @keydown.enter.prevent="openModal"
        @keydown.space.prevent="openModal"
      >
        <span
          class="tw-font-semibold"
          :class="isMobile ? 'tw-text-[10px] tw-text-white/90' : 'tw-text-[11px] tw-text-[#4ade80] tw-font-extrabold'"
        >{{ exposureLabel }}:</span>
        <NumberFlow :value="exposureValue"
          :format="{ minimumFractionDigits: 2, maximumFractionDigits: 2 }"
          class="tw-font-bold"
          :class="[
            isMobile ? 'wallet-info-exp-mobile tw-text-[11px]' : 'wallet-info-exp-desktop tw-text-[11px] tw-font-extrabold',
            !isDemoUser ? 'tw-underline' : '',
          ]" />
      </div>
    </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWallet } from '../composables/useWallet.js'
import { useAuthStore } from '../stores/auth'
import useDevices from '@/composables/useDevices'
import { useExposureDialog } from '@/composables/useExposureDialog'
import NumberFlow from '@number-flow/vue'

defineProps({
  compact: { type: Boolean, default: false },
})

const { isMobile } = useDevices()

const balanceLabel = computed(() => t('components.walletInfo.balanceShort'))
const exposureLabel = computed(() => t('components.walletInfo.exposureShort'))

const {
  formattedBalance,
  formattedExposure,
  balance,
  cashable,
  formatAmount,
} = useWallet()

const formattedCashableBreakdown = computed(() => formatAmount(cashable.value))
const formattedNonCashableBreakdown = computed(() => {
  const nonCashable = (parseFloat(balance.value ?? 0) - parseFloat(cashable.value ?? 0))
  return formatAmount(Math.max(0, nonCashable))
})

const balanceValue = computed(() => {
  const v = parseFloat(String(formattedBalance.value).replace(/[^\d.-]/g, ''))
  return isNaN(v) ? 0 : v
})

const exposureValue = computed(() => {
  const v = parseFloat(String(formattedExposure.value).replace(/[^\d.-]/g, ''))
  return isNaN(v) ? 0 : v
})

const authStore = useAuthStore()

const { t } = useI18n()

const isDemoUser = computed(() => authStore.isDemoUser)

// Emit events
const emit = defineEmits(['open-exposure-modal'])
const { openExposureDialog } = useExposureDialog()

const openModal = () => {
  if (isDemoUser.value) return
  openExposureDialog()
  emit('open-exposure-modal')
}
</script>

<style scoped>
.wallet-info-root--compact {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

.wallet-info-compact-balance {
  font-variant-numeric: tabular-nums;
}

.wallet-info-root--mobile {
  border-radius: 9999px;
  border: none;
  background: linear-gradient(180deg, #e4c56a 0%, #c9a043 45%, #a67c2e 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
  padding: 5px 11px;
  max-width: 100%;
}

/* Desktop: pill on theme header — white ring, Bal white / Exp neon green */
.wallet-info-root--desktop {
  border-radius: 9999px;
  /* border: 1px solid rgba(255, 255, 255, 0.92); */
  padding: 4px 13px 4px;
  max-width: 100%;
  background: #f97316;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.wallet-info-exp-mobile {
  color: #4ade80 !important;
}

.wallet-info-exp-desktop {
  color: #4ade80 !important;
}

.wallet-container {
  background-color: transparent !important;
  border-color: var(--color-border) !important;
}



.v-btn {
  height: auto !important;
  min-height: auto !important;
  max-height: auto !important;
}

number-flow-vue {
  --number-flow-mask-width: 0.2em;
  --number-flow-char-height: 0.85em;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  overflow: hidden;
  position: relative;
}

/* Additional styling to smooth transitions */
number-flow-vue * {
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

/* Smooth transitions for buttons */
.balance-btn,
.exposure-btn,
.bonus-btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.balance-btn:hover,
.exposure-btn:hover,
.bonus-btn:hover {
  background-color: rgba(52, 215, 126, 0.08) !important;
}

/* Text colors */
.tw-text-orange-500 {
  color: #f97316 !important;
}

.tw-text-green-500 {
  color: #22c55e !important;
}

/* Hover effects */
.wallet-container:hover {
  border-color: var(--color-primary) !important;
}

/* Disabled state for demo users */
.wallet-disabled {
  cursor: not-allowed !important;
  opacity: 0.6;
}

.wallet-disabled:hover {
  border-color: var(--color-border) !important;
}

.wallet-disabled .balance-btn:hover,
.wallet-disabled .exposure-btn:hover,
.wallet-disabled .bonus-btn:hover {
  background-color: transparent !important;
}

/* Desktop balance info popup (shown on hover of the "i" button) */
.balance-info-popup {
  background: rgba(20, 20, 20, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 10px 14px;
  min-width: 11rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}

.balance-info-popup__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  line-height: 1.4;
}

.balance-info-popup__row + .balance-info-popup__row {
  margin-top: 4px;
}

.balance-info-popup__label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}

.balance-info-popup__value {
  font-size: 12px;
  font-weight: 800;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
</style>
