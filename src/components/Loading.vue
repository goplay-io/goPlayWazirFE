<script setup>
defineProps({
  minHeight: {
    type: String,
    default: '500px'
  },
  speed: {
    type: String,
    default: '1s'
  }
})
</script>

<template>
  <div class="tw-flex tw-justify-center tw-items-center" :style="{ minHeight }">
    <div
      class="loading-spinner"
      :style="{ animationDuration: speed }"
      role="status"
      aria-label="Loading"
    />
  </div>
</template>

<style scoped>
.loading-spinner {
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  border: 4px solid rgba(0, 0, 0, 0.14);
  border-top-color: var(--color-nav);
  will-change: transform;
  animation: spinner-rotate 0.9s linear infinite;
}

@keyframes spinner-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
