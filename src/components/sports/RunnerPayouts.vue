<script setup>
import { computed } from 'vue';

const props = defineProps({
  potentialPayout: {
    type: Number,
    default: null,
  },
  currentPotentialPayout: {
    type: Number,
    default: null,
  },
});

const showPotential = computed(
  () => props.potentialPayout !== 0 && props.potentialPayout !== null,
);

const showCurrent = computed(
  () => props.currentPotentialPayout !== null && props.currentPotentialPayout !== 0,
);

const hasPayouts = computed(() => showPotential.value || showCurrent.value);

function formatValue(val) {
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  if (n > 0) return `+${n}`;
  return String(n);
}

function valueClass(val) {
  const n = Number(val);
  if (n > 0) return 'runner-payouts__value--positive';
  if (n < 0) return 'runner-payouts__value--negative';
  return '';
}
</script>

<template>
  <span v-if="hasPayouts" class="runner-payouts">
    <span
      v-if="showPotential"
      class="runner-payouts__value"
      :class="valueClass(potentialPayout)"
    >{{ formatValue(potentialPayout) }}</span>
    <span v-if="showPotential && showCurrent" class="runner-payouts__sep">&gt;&gt;</span>
    <span
      v-if="showCurrent"
      class="runner-payouts__value"
      :class="valueClass(currentPotentialPayout)"
    >{{ formatValue(currentPotentialPayout) }}</span>
  </span>
</template>
