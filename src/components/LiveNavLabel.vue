<template>
  <span class="live-nav-label tw-inline-flex tw-items-center tw-gap-1 tw-transition-all tw-duration-300">
    <div class="tw-relative tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-transition-all tw-duration-300" :class="iconClasses">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" class="tw-block broadcast-icon">
        <path class="broadcast-arc broadcast-arc-1" fill="currentColor" d="M6.343 4.938a1 1 0 0 1 0 1.415a8.003 8.003 0 0 0 0 11.317a1 1 0 1 1-1.414 1.414c-3.907-3.906-3.907-10.24 0-14.146a1 1 0 0 1 1.414 0"/>
        <path class="broadcast-arc broadcast-arc-2" fill="currentColor" d="M19.075 4.938c3.906 3.907 3.906 10.24 0 14.146a1 1 0 0 1-1.415-1.414a8.003 8.003 0 0 0 0-11.317a1 1 0 0 1 1.415-1.415"/>
        <path class="broadcast-arc broadcast-arc-3" fill="currentColor" d="M9.31 7.812a1 1 0 0 1 0 1.414a3.92 3.92 0 0 0 0 5.544a1 1 0 1 1-1.415 1.414a5.92 5.92 0 0 1 0-8.372a1 1 0 0 1 1.415 0"/>
        <path class="broadcast-arc broadcast-arc-4" fill="currentColor" d="M16.268 7.812a5.92 5.92 0 0 1 0 8.372a1 1 0 0 1-1.414-1.414a3.92 3.92 0 0 0 0-5.544a1 1 0 0 1 1.414-1.414"/>
        <path class="broadcast-dot" fill="currentColor" d="M12 10.5a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3"/>
      </svg>
    </div>
    <span class="tw-hidden sm:tw-block tw-leading-none tw-transition-all tw-duration-300" :class="textClasses">
      {{ $t('navigation.live') }}
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  active: { type: Boolean, default: false }
})

const iconClasses = computed(() => props.active ? 'tw-text-white' : 'group-hover:tw-text-white')
const textClasses = computed(() => props.active ? 'tw-text-white' : 'group-hover:tw-text-white')
</script>

<style scoped>
@keyframes broadcast-wave {
  0%, 55% { opacity: 1; }
  70% { opacity: 0.25; }
  85%, 100% { opacity: 1; }
}

.broadcast-arc,
.broadcast-dot {
  animation: broadcast-wave 2.4s ease-in-out infinite;
}

.broadcast-arc-1 { animation-delay: 0.96s; }
.broadcast-arc-2 { animation-delay: 0.96s; }
.broadcast-arc-3 { animation-delay: 0.48s; }
.broadcast-arc-4 { animation-delay: 0.48s; }
.broadcast-dot { animation-delay: 0s; }
</style>
