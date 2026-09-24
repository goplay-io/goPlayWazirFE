<script setup>
import { computed, ref } from 'vue'
import { formatMarketBetLimit } from '@/utils/marketBetLimitFormat.js'

const props = defineProps({
  min: { type: [Number, String], default: null },
  max: { type: [Number, String], default: null },
})

const open = ref(false)

const minLabel = computed(() => formatMarketBetLimit(props.min))
const maxLabel = computed(() => formatMarketBetLimit(props.max))

function onEnter() {
  open.value = true
}

function onLeave() {
  open.value = false
}

function toggle(event) {
  event?.stopPropagation?.()
  open.value = !open.value
}
</script>

<template>
  <div
    class="fancy-minmax-info"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div
      v-show="open"
      class="fancy-minmax-info__tooltip"
      role="tooltip"
    >
      <div class="fancy-minmax-info__line">Min: {{ minLabel }}</div>
      <div class="fancy-minmax-info__line">Max: {{ maxLabel }}</div>
      <span class="fancy-minmax-info__arrow" aria-hidden="true" />
    </div>
    <button
      type="button"
      class="fancy-minmax-info__btn"
      aria-label="Bet limits"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="fancy-minmax-info__i" aria-hidden="true">i</span>
    </button>
  </div>
</template>

<style scoped>
.fancy-minmax-info {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  z-index: 3;
}

.fancy-minmax-info__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #360952;
  cursor: pointer;
  flex-shrink: 0;
}

.fancy-minmax-info__i {
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  font-style: italic;
  font-family: Georgia, 'Times New Roman', serif;
  line-height: 1;
  text-transform: lowercase;
}

.fancy-minmax-info__tooltip {
  position: absolute;
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  padding: 6px 10px;
  border-radius: 6px;
  background: #360952;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  pointer-events: none;
}

.fancy-minmax-info__line {
  font-size: 10px;
  font-weight: 500;
  line-height: 1.35;
  text-align: left;
  color: #ffffff;
}

.fancy-minmax-info__arrow {
  position: absolute;
  right: -4px;
  top: 50%;
  width: 8px;
  height: 8px;
  transform: translateY(-50%) rotate(45deg);
  background: #360952;
}
</style>
