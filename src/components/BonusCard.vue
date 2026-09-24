<template>
    <div class="bonus-card tw-relative tw-p-4 sm:tw-p-5 tw-rounded-2xl tw-flex-1 tw-h-full tw-overflow-hidden tw-transition-all tw-duration-300 hover:tw-transform hover:tw--translate-y-1 hover:tw-shadow-xl tw-opacity-0 tw-animate-slideInUp"
        :style="`animation-delay: ${animationDelay}s`">

        <!-- Gradient background -->
        <div class="tw-absolute tw-inset-0"
            style="background: linear-gradient(135deg, var(--color-wallet-bg) 0%, var(--color-primary) 60%, var(--color-primary-light) 100%);">
        </div>

        <!-- Single large watermark icon -->
        <div class="tw-absolute tw-bottom-0 tw-right-0 tw-translate-x-4 tw-translate-y-4 tw-pointer-events-none">
            <v-icon size="100" style="color: rgba(255,255,255,0.06);">mdi-gift</v-icon>
        </div>

        <div class="tw-relative tw-z-10 tw-flex tw-flex-col tw-h-full">
            <!-- Header: icon + badge -->
            <div class="tw-flex tw-items-center tw-justify-between tw-mb-3 sm:tw-mb-4">
                <v-avatar size="34" class="tw-hidden sm:tw-inline-flex"
                    style="background-color: var(--color-wallet-icon-bg);">
                    <v-icon size="18" style="color: var(--color-wallet-icon);">{{ icon }}</v-icon>
                </v-avatar>
                <div class="tw-flex tw-items-center tw-gap-1 tw-px-2.5 tw-py-1 tw-rounded-full"
                    style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18);">
                    <v-icon size="13" style="color: var(--color-warning);">mdi-star</v-icon>
                    <span class="tw-text-xs tw-font-semibold tw-text-white">{{ t('bonus.redeemable.bonus') }}</span>
                </div>
            </div>

            <!-- Content -->
            <div class="tw-flex tw-flex-col tw-justify-end tw-flex-1 tw-gap-1">
                <p class="tw-text-xs sm:tw-text-sm tw-leading-none tw-tracking-wide"
                    style="color: rgba(255,255,255,0.75);">
                    {{ title }}
                </p>
                <span :class="['tw-font-bold tw-text-white tw-leading-tight tw-block', amountSizeClass]">
                    <NumberFlow :value="displayValue"
                        :format="{ minimumFractionDigits: 2, maximumFractionDigits: 2 }"
                        style="color: inherit; font-size: inherit; font-weight: inherit;" />
                </span>
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
    value: {
        type: [Number, String],
        required: true,
    },
    title: {
        type: String,
        default: 'Bonus',
    },
    icon: {
        type: String,
        default: 'mdi-gift',
    },
    animationDelay: {
        type: Number,
        default: 0.2,
    },
})

const displayValue = ref(0)
let isMounted = false

onMounted(() => {
    setTimeout(() => {
        displayValue.value = Number(props.value || 0)
        isMounted = true
    }, 700)
})

watch(() => props.value, (newValue) => {
    if (isMounted) {
        displayValue.value = Number(newValue || 0)
    }
})

const amountSizeClass = computed(() => {
    const value = Math.abs(displayValue.value ?? 0)
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
.bonus-card {
    position: relative;
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
