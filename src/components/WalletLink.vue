<template>
  <button
    class="tw-relative tw-p-2.5 sm:tw-p-3 border-lightgreen tw-rounded-2xl tw-bg-theme-surface-alt tw-overflow-hidden tw-transition-all tw-duration-300 tw-min-h-[60px] sm:tw-min-h-[70px] tw-opacity-0 tw-animate-slideInUp tw-flex tw-items-center"
    :class="disabled ? 'tw-cursor-not-allowed' : 'tw-cursor-pointer hover:tw-bg-green-600/30'"
    @click="!disabled && $router.push(route)" 
    :style="`animation-delay: ${animationDelay}s`"
    :disabled="disabled">
    <!-- Background SVG -->
    <div class="tw-absolute tw-inset-0 tw-rounded-xl tw-bg-cover tw-bg-center tw-bg-no-repeat"
      style="background-image: url('/src/assets/wallet-bg.svg');"></div>

    <!-- Coming Soon Badge -->
      <div v-if="disabled" class="tw-absolute tw-top-1 tw-right-1 sm:tw-top-2 sm:tw-right-2 tw-z-20">
      <span class="tw-bg-emerald-500/90 tw-text-white tw-text-[10px] sm:tw-text-xs tw-font-bold tw-px-1.5 sm:tw-px-2 tw-py-0.5 tw-rounded-full tw-whitespace-nowrap">
        {{ t('components.walletLink.comingSoon') }}
      </span>
    </div>

    <!-- Text Content with Icon -->
    <div class="tw-relative tw-z-10 tw-flex-1 tw-flex tw-items-center tw-gap-1.5 sm:tw-gap-2">
      <v-icon :size="18" class="sm:tw-hidden tw-flex-shrink-0" :class="`${iconColor} tw-opacity-60`">{{ icon }}</v-icon>
      <v-icon :size="22" class="tw-hidden sm:tw-block tw-flex-shrink-0" :class="`${iconColor} tw-opacity-60`">{{ icon }}</v-icon>
      <div class="tw-flex tw-flex-col tw-gap-0.5 sm:tw-gap-1 tw-min-w-0">
        <span class="tw-text-xs sm:tw-text-sm tw-font-bold tw-text-theme-text tw-leading-none tw-truncate">{{ title }}</span>
        <span class="tw-text-[11px] sm:tw-text-xs tw-text-theme-text-secondary tw-leading-none tw-truncate">{{ subtitle }}</span>
      </div>
    </div>

    <!-- Action Arrow -->
    <div
      class="tw-relative tw-z-10 tw-flex-shrink-0 tw-w-4 tw-h-4 sm:tw-w-5 sm:tw-h-5 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-ml-auto"
      :class="disabled ? 'tw-bg-gray-400' : 'tw-bg-emerald-500'">
      <v-icon size="12" class="sm:tw-hidden tw-text-white">{{ disabled ? 'mdi-lock' : 'mdi-chevron-right' }}</v-icon>
      <v-icon size="14" class="tw-hidden sm:tw-block tw-text-white">{{ disabled ? 'mdi-lock' : 'mdi-chevron-right' }}</v-icon>
    </div>
  </button>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
defineProps({
  route: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  iconColor: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  animationDelay: {
    type: Number,
    default: 0.1
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const { t } = useI18n()
</script>
