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
    default: 'mdi-rocket-launch',
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
  const classes = ['animated-rocket-icon'];
  
  if (props.color) {
    classes.push(...props.color.split(' ').filter(c => c));
  }
  
  return classes.join(' ');
});
</script>

<style scoped>
/* Rocket icon animation */
.animated-rocket-icon {
  animation: rocketLaunch 2s ease-in-out infinite;
  transform-origin: center bottom;
}

@keyframes rocketLaunch {
  0% {
    transform: translateY(0) rotate(0deg) scale(1);
  }

  25% {
    transform: translateY(-3px) rotate(-5deg) scale(1.05);
  }

  50% {
    transform: translateY(-6px) rotate(0deg) scale(1.1);
  }

  75% {
    transform: translateY(-3px) rotate(5deg) scale(1.05);
  }

  100% {
    transform: translateY(0) rotate(0deg) scale(1);
  }
}
</style>
