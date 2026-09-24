<script setup>
import { computed } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  },
  size: {
    type: [String, Number],
    default: 16
  },
  color: {
    type: String,
    default: null
  },
  inactiveColor: {
    type: String,
    default: null
  },
  /** pill = nav circle (headers); plain = gold/outline star on light rows */
  variant: {
    type: String,
    default: 'pill',
    validator: (value) => ['pill', 'plain'].includes(value),
  },
  title: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['click']);

const iconColor = computed(() => {
  if (props.variant === 'plain') {
    if (props.active) return props.color || '#f26c20';
    return props.inactiveColor || '#4b5563';
  }
  if (props.color) return props.color;
  if (props.active) return '#000000';
  return props.inactiveColor || '#000000';
});

const displayTitle = computed(() => {
  return props.title || (props.active ? 'Unfavorite' : 'Favorite');
});

const handleClick = () => {
  emit('click');
};
</script>

<template>
  <div
    class="pin-icon tw-inline-flex tw-items-center tw-justify-center tw-leading-none tw-cursor-pointer tw-select-none"
    :class="[
      variant === 'plain'
        ? 'pin-icon--plain'
        : [
            'tw-transition-transform tw-duration-150 md:hover:tw-scale-105 tw-rounded-full tw-p-0.5 tw-border tw-border-black',
            { 'md:tw-shadow-sm': active },
          ],
    ]"
    :title="displayTitle"
    role="button"
    :aria-pressed="active"
    @click.capture="handleClick"
  >
    <!-- Filled star when active (favorited) -->
    <v-icon v-if="active" :size="size" :color="iconColor">mdi-star</v-icon>
    <!-- Outlined star when inactive (not favorited) -->
    <v-icon v-else :size="size" :color="iconColor">mdi-star-outline</v-icon>
  </div>
</template>

<style scoped>
.tw-leading-none {
  line-height: 0;
}

.pin-icon--plain {
  padding: 0 !important;
  margin: 0;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  min-width: 0;
  min-height: 0;
}

.pin-icon--plain :deep(.v-icon) {
  background: transparent !important;
}
</style>
