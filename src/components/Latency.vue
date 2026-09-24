<script setup>

defineProps({
    latency: {
        type: Number,
        default: 0
    }
});
</script>

<template>
  <div class="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-px md:tw-gap-0.5">
    <!-- Latency Bars -->
    <div class="tw-flex tw-items-end tw-gap-px md:tw-gap-0.5">
      <!-- Bar 1 -->
      <div 
        class="tw-w-1 md:tw-w-1.5 tw-h-2 md:tw-h-3 tw-rounded-sm tw-transition-colors tw-duration-300"
        :class="latency > 200 ? 'tw-bg-red-500' : latency >= 80 ? 'tw-bg-yellow-500' : 'tw-bg-green-500'"
      ></div>
      
      <!-- Bar 2 -->
      <div 
        class="tw-w-1 md:tw-w-1.5 tw-h-2.5 md:tw-h-3.5 tw-rounded-sm tw-transition-colors tw-duration-300"
        :class="latency >= 80 ? (latency > 200 ? 'tw-bg-gray-400' : 'tw-bg-yellow-500') : 'tw-bg-green-500'"
      ></div>
      
      <!-- Bar 3 -->
      <div 
        class="tw-w-1 md:tw-w-1.5 tw-h-3 md:tw-h-4 tw-rounded-sm tw-transition-colors tw-duration-300"
        :class="latency > 80 ? 'tw-bg-gray-400' : 'tw-bg-green-500'"
      ></div>
    </div>

    <!-- Latency Text -->
    <span 
      class="tw-text-[10px] md:tw-text-xs tw-font-semibold tw-transition-colors tw-duration-300"
      :class="[
        latency > 200 ? 'tw-text-red-500 tw-animate-pulse' : 
        latency > 80 ? 'tw-text-yellow-500' : 
        'tw-text-green-500'
      ]"
    >
      {{ latency }}ms
    </span>
  </div>
</template>
