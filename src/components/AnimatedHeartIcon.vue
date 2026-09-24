<template>
  <v-icon 
    :icon="icon" 
    :class="iconClass" 
    :size="size"
  ></v-icon>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  icon: {
    type: String,
    default: 'mdi-heart',
  },
  size: {
    type: [String, Number],
    default: 24,
  },
  color: {
    type: String,
    default: '',
  },
});

const iconClass = computed(() => {
  const classes = ['animated-heart-icon'];
  
  if (props.color) {
    classes.push(...props.color.split(' ').filter(c => c));
  }
  
  return classes.join(' ');
});
</script>

<style scoped>
/* Heart icon animation */
.animated-heart-icon {
  animation: heartbeat 1.5s ease-in-out infinite;
  transform-origin: center;
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  10% {
    transform: scale(1.1);
  }
  20% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.15);
  }
  40% {
    transform: scale(1);
  }
}
</style>
