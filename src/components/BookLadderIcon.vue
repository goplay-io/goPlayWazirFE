<script setup>
const props = defineProps({
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
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['click']);

const onClick = (event) => {
  if (props.disabled) return;
  emit('click', event);
};
</script>

<template>
  <button
    type="button"
    class="book-ladder-icon tw-inline-flex tw-items-center tw-justify-center tw-shrink-0 tw-border-0 tw-bg-transparent tw-p-0"
    :class="{ 'book-ladder-icon--disabled': disabled, 'tw-cursor-pointer': !disabled }"
    :title="disabled ? 'Book unavailable' : title"
    :aria-label="disabled ? 'Book unavailable' : title"
    :aria-disabled="disabled ? 'true' : 'false'"
    :disabled="disabled"
    :style="{ color, width: `${size}px`, height: `${size}px` }"
    @click.stop="onClick"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 16 16"
      class="book-ladder-icon__svg"
      :width="size"
      :height="size"
      aria-hidden="true"
    >
      <path d="M5.21875 3.13672V13.1367" stroke="currentColor" stroke-width="1" />
      <path d="M5.21875 5.48047H10.5312" stroke="currentColor" stroke-width="1" />
      <path d="M5.21875 8.13672H10.5312" stroke="currentColor" stroke-width="1" />
      <path d="M5.21875 11.1055H10.5312" stroke="currentColor" stroke-width="1" />
      <path d="M10.5312 3.13672V13.1367" stroke="currentColor" stroke-width="1" />
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
}

.book-ladder-icon:focus-visible {
  outline: 2px solid rgba(0, 0, 0, 0.35);
  outline-offset: 1px;
}

.book-ladder-icon--disabled,
.book-ladder-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
