<template>
  <img 
    v-if="code && flagUrl" 
    :src="flagUrl"
    :alt="`${code} flag`"
    :style="spanStyle"
    :title="code"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  code: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: 'md', // 'sm', 'md', 'lg', 'xl'
  },
  square: {
    type: Boolean,
    default: false,
  },
});

const sizeMap = {
  sm: { width: '16px', height: '12px' },
  md: { width: '24px', height: '18px' },
  lg: { width: '32px', height: '24px' },
  xl: { width: '48px', height: '36px' },
};

const spanStyle = computed(() => ({
  display: 'inline-block',
  ...sizeMap[props.size] || sizeMap.md,
  objectFit: 'contain',
  borderRadius: props.square ? '0' : '0.25rem',
}));

const flagUrl = ref('');

// Dynamic import all flags using glob
const flagModules = import.meta.glob('/node_modules/country-flag-icons/3x2/*.svg');

// Load flag SVG when code changes
watch(
  () => props.code,
  async (newCode) => {
    if (!newCode) {
      flagUrl.value = '';
      return;
    }
    try {
      const code = newCode.toUpperCase();
      const flagPath = `/node_modules/country-flag-icons/3x2/${code}.svg`;
      
      if (flagModules[flagPath]) {
        const module = await flagModules[flagPath]();
        flagUrl.value = module.default;
      } else {
        console.warn(`Flag not found for: ${code}`);
        flagUrl.value = '';
      }
    } catch (err) {
      console.warn(`Failed to load flag for ${newCode}:`, err);
      flagUrl.value = '';
    }
  },
  { immediate: true }
);
</script>

<style scoped>
img {
  display: inline-block;
  flex-shrink: 0;
}
</style>
