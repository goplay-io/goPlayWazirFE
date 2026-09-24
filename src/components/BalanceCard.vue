<template>
  <div
    class="balance-card-theme tw-relative tw-p-4 sm:tw-p-5 tw-flex-1 tw-h-full tw-overflow-hidden tw-transition-all tw-duration-300 tw-opacity-0 tw-animate-slideInUp"
    :style="`animation-delay: ${animationDelay}s`">
    <div class="tw-relative tw-z-10 tw-flex tw-flex-col tw-h-full">
      <!-- Icon at top left (hidden on mobile) -->
      <v-avatar
        size="32"
        class="tw-mb-3 tw-hidden sm:tw-inline-flex"
        style="background-color: rgba(255, 255, 255, 0.18);">
        <v-icon size="18" style="color: #ffffff;">{{ icon }}</v-icon>
      </v-avatar>

      <!-- Balances -->
      <div class="tw-flex tw-items-stretch tw-w-full">

        <!-- Available Balance (left + mobile cashable stacked) -->
        <div class="tw-flex tw-flex-col tw-justify-end tw-gap-1 tw-flex-1 tw-min-w-0">
          <p class="tw-text-xs sm:tw-text-sm tw-text-white/90 tw-leading-none tw-tracking-wide tw-truncate">
            {{ t(titleKey) }}
          </p>
          <span :class="['tw-font-bold tw-text-white tw-leading-tight tw-block tw-truncate', amountSizeClass]">
            <NumberFlow
              :value="displayBalance"
              :format="{ minimumFractionDigits: 2, maximumFractionDigits: 2 }"
              style="color: inherit; font-size: inherit; font-weight: inherit;"
            />
          </span>

          <!-- Cashable (mobile: stacked under balance) -->
          <div class="tw-mt-2 sm:tw-hidden">
            <p class="tw-text-xs tw-text-white/85 tw-leading-none tw-tracking-wide">
              {{ t('components.balanceCard.cashable') }}
            </p>
            <span :class="['tw-font-semibold tw-text-white tw-leading-tight tw-block tw-truncate', amountSizeClass]">
              <NumberFlow
                :value="displayCashable"
                :format="{ minimumFractionDigits: 2, maximumFractionDigits: 2 }"
                style="color: inherit; font-size: inherit; font-weight: inherit;"
              />
            </span>
          </div>
        </div>

        <!-- Vertical divider (desktop only) -->
        <div class="tw-hidden sm:tw-block tw-w-px tw-bg-white/20 tw-mx-3 sm:tw-mx-4 tw-self-stretch tw-rounded-full"></div>

        <!-- Cashable Balance (right, desktop only) -->
        <div class="tw-hidden sm:tw-flex tw-flex-col tw-justify-end tw-gap-1 tw-flex-1 tw-min-w-0">
          <p class="tw-text-xs sm:tw-text-sm tw-text-white/90 tw-leading-none tw-tracking-wide tw-truncate">
            {{ t('components.balanceCard.cashable') }}
          </p>
          <span :class="['tw-font-bold tw-text-white tw-leading-tight tw-block tw-truncate', amountSizeClass]">
            <NumberFlow
              :value="displayCashable"
              :format="{ minimumFractionDigits: 2, maximumFractionDigits: 2 }"
              style="color: inherit; font-size: inherit; font-weight: inherit;"
            />
          </span>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import NumberFlow from '@number-flow/vue'

const { t } = useI18n()

const props = defineProps({
  balance: {
    type: [Number, String],
    required: true,
  },
  titleKey: {
    type: String,
    default: 'components.balanceCard.availableBalance',
  },
  icon: {
    type: String,
    default: 'mdi-wallet',
  },
  animationDelay: {
    type: Number,
    default: 0.1,
  },
  cashable: {
    type: [Number, String],
    default: 0,
  },
})

const displayBalance = ref(0)
const displayCashable = ref(0)
let isMounted = false

onMounted(() => {
  setTimeout(() => {
    const bal = Number(props.balance || 0)
    const cash = Number(props.cashable || 0)
    displayCashable.value = cash
    displayBalance.value = bal + cash
    isMounted = true
  }, 700)
})

watch(() => [props.balance, props.cashable], ([newBalance, newCashable]) => {
  if (isMounted) {
    const bal = Number(newBalance || 0)
    const cash = Number(newCashable || 0)
    displayCashable.value = cash
    displayBalance.value = bal + cash
  }
})

const maxDigitCount = computed(() => {
  const toDigits = (val) => {
    const num = Number(val ?? 0)
    const intPart = Math.floor(Math.abs(num))
    return String(intPart).length
  }

  const balanceDigits = toDigits(displayBalance.value)
  const cashableDigits = toDigits(displayCashable.value)

  return Math.max(balanceDigits, cashableDigits)
})

const amountSizeClass = computed(() => {
  const d = maxDigitCount.value

  if (d <= 4) return 'tw-text-lg sm:tw-text-xl'
  if (d <= 6) return 'tw-text-base sm:tw-text-lg'
  if (d <= 9) return 'tw-text-sm sm:tw-text-base'
  return 'tw-text-xs sm:tw-text-sm'
})
</script>

<style scoped>
.balance-card-theme {
  background: var(--theme-orange);
  /*linear-gradient(94deg, #b6842d, #ebda8d 55%, #b7862f);*/
  border: 1px solid #a9782a;
  border-radius: 0;
  box-shadow: none;
}

:deep(number-flow-vue) {
  --number-flow-mask-width: 1.2em;
  --number-flow-char-height: 1.2em;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  overflow: hidden;
  position: relative;
  font-size: inherit !important;
  font-weight: 700 !important;
  line-height: inherit;
  color: inherit;
}

:deep(number-flow-vue *) {
  backface-visibility: hidden;
  transform-style: preserve-3d;
  font-weight: inherit;
}
</style>