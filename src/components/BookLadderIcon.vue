<script setup>
defineProps({
  size: {
    type: [String, Number],
    default: 12,
  },
  color: {
    type: String,
    default: '#000000',
  },
  title: {
    type: String,
    default: 'View book',
  },
});

const emit = defineEmits(['click']);
</script>

<template>
  <button
    type="button"
    class="book-ladder-icon tw-inline-flex tw-items-center tw-justify-center tw-shrink-0 tw-border-0 tw-bg-transparent tw-p-0 tw-cursor-pointer"
    :title="title"
    :aria-label="title"
    :style="{ color, width: `${size}px`, height: `${size}px` }"
    @click.stop="emit('click', $event)"
  >
    <!-- Heroicons table-cells outline, rotated 90° — matches zuplay.com book icon -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="book-ladder-icon__svg"
      :width="size"
      :height="size"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z"
      />
    </svg>
  </button>
</template>

<style scoped>
.book-ladder-icon {
  min-width: 0;
  min-height: 0;
  border-radius: 0;
}

.book-ladder-icon__svg {
  display: block;
  flex-shrink: 0;
  transform: rotate(90deg);
}

.book-ladder-icon:focus-visible {
  outline: 2px solid rgba(0, 0, 0, 0.35);
  outline-offset: 1px;
}
</style>
