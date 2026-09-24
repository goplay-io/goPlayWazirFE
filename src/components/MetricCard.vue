<template>
  <div
    :class="['tw-relative tw-p-4 sm:tw-p-4 tw-flex-1 tw-h-full tw-min-h-[90px] sm:tw-min-h-[80px] tw-overflow-hidden tw-transition-all tw-duration-300 tw-opacity-0 tw-animate-slideInUp', useWalletCard ? 'tw-bg-wallet-card sm:tw-p-5' : 'metric-card-light tw-bg-theme-background-alt tw-border tw-border-theme-border']"
    :style="`animation-delay: ${animationDelay}s`">
    <!-- Background icon at bottom right -->
    <div v-if="!useWalletCard"
      class="tw-absolute tw-bottom-0 tw-right-0 tw-opacity-5 tw-transform tw-translate-x-8 tw-translate-y-8 tw-rotate-180 tw-scale-x-[-1]">
      <img :src="backgroundSvg" alt="Background icon" class="tw-w-32 tw-h-32 sm:tw-w-40 sm:tw-h-40" />
    </div>

    <div class="tw-relative tw-z-10 tw-flex tw-flex-col tw-h-full">
      <!-- Icon at top left -->
      <v-avatar size="32" :class="useWalletCard ? 'tw-mb-3 tw-hidden sm:tw-inline-flex' : 'tw-mb-4'"
        :style="useWalletCard ? { backgroundColor: 'var(--color-wallet-icon-bg)' } : { backgroundColor: `${color}20` }">
        <v-icon size="18" :style="useWalletCard ? { color: 'var(--color-wallet-icon)' } : { color: color }">
          {{ value >= 0 ? icon : 'mdi-trending-down' }}
        </v-icon>
      </v-avatar>

      <!-- Content below icon -->
      <div class="tw-flex-1 tw-flex tw-flex-col tw-justify-end">
        <p
          :class="['tw-text-xs sm:tw-text-sm tw-leading-none tw-tracking-wide', useWalletCard ? 'tw-text-gray-400' : 'metric-card-light__label']">
          {{ title }}</p>
        <div class="tw-flex tw-items-center tw-gap-1.5">
          <p :class="['tw-font-bold tw-leading-tight', useWalletCard ? 'tw-text-white' : 'metric-card-light__value', amountSizeClass]"
            :style="amountColor && !useWalletCard ? { color: color } : {}">
            <NumberFlow :value="displayValue"
              :format="{ minimumFractionDigits: 2, maximumFractionDigits: 2 }"
              :class="['tw-font-bold tw-transition-colors', useWalletCard ? 'tw-text-white' : 'metric-card-light__value', amountSizeClass]"
              :style="amountColor && !useWalletCard ? { color: color } : {}" />
          </p>
          <v-avatar v-if="trandIcon" size="24"
            :style="{ backgroundColor: value >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }">
            <v-icon :style="{ color: value >= 0 ? '#22c55e' : '#ef4444' }" size="16">
              {{ value >= 0 ? 'mdi-arrow-up-bold' : 'mdi-arrow-down-bold' }}
            </v-icon>
          </v-avatar>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import NumberFlow from '@number-flow/vue'

const props = defineProps({
  value: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    default: 'Metric Value'
  },
  icon: {
    type: String,
    default: 'mdi-trending-up'
  },
  backgroundSvg: {
    type: String,
    default: '/src/assets/loss.svg'
  },
  animationDelay: {
    type: Number,
    default: 0.2
  },
  trandIcon: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#2491eb'
  },
  amountColor: {
    type: Boolean,
    default: false
  },
  useWalletCard: {
    type: Boolean,
    default: false
  }
})

const displayValue = ref(0)
let isMounted = false

onMounted(() => {
  // Start with 0 and animate to the actual value
  setTimeout(() => {
    displayValue.value = props.value
    isMounted = true
  }, 700)
})

// Watch for changes to the value prop and update displayValue
watch(() => props.value, (newValue) => {
  if (isMounted) {
    displayValue.value = newValue
  }
})

// Dynamically adjust amount font size based on magnitude so millions+ fit nicely
const amountSizeClass = computed(() => {
  const value = Math.abs(props.value ?? 0)
  if (value >= 1_000_000_000) {
    return 'tw-text-base sm:tw-text-lg'
  }
  if (value >= 10_000_000) {
    return 'tw-text-lg sm:tw-text-xl'
  }
  return 'tw-text-xl sm:tw-text-2xl'
})
</script>

<style scoped>
.tw-bg-theme-background-alt {
  border-radius: 0 !important;
  box-shadow: none !important;
}

.metric-card-light {
  background: #ffffff !important;
  border-color: #d6c59b !important;
}

.metric-card-light__label {
  color: #7c4a03 !important;
}

.metric-card-light__value {
  color: #4a2e00 !important;
}

/* NumberFlow Global Styles */
number-flow-vue {
  --number-flow-mask-width: 1.2em;
  --number-flow-char-height: 1.2em;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  overflow: hidden;
  position: relative;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
}

/* Additional styling to smooth transitions */
number-flow-vue * {
  backface-visibility: hidden;
  transform-style: preserve-3d;
}
</style>
