<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    class="search-magnify-icon"
  >
    <circle
      cx="10.5"
      cy="10.5"
      r="6.25"
      stroke="currentColor"
      :stroke-width="strokeWidth"
    />
    <line
      x1="15.25"
      y1="15.25"
      x2="20.5"
      y2="20.5"
      stroke="currentColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
    />
  </svg>
</template>

<script setup>
defineProps({
  size: {
    type: [String, Number],
    default: 18,
  },
  strokeWidth: {
    type: [String, Number],
    default: 2.5,
  },
})
</script>

<style scoped>
.search-magnify-icon {
  display: block;
  flex-shrink: 0;
}
</style>
