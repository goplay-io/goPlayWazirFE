<template>
  <aside v-if="variant === 'desktop'" class="sports-home-right-rail">
    <LiveShowcaseSections />
  </aside>

  <section v-else class="sports-home-layout__casino-pane">
    <LiveShowcaseSections />
  </section>
</template>

<script setup>
import LiveShowcaseSections from '@/views/sports/live/LiveShowcaseSections.vue';

defineProps({
  variant: {
    type: String,
    default: 'desktop',
    validator: (value) => ['desktop', 'mobile'].includes(value),
  },
  /** @deprecated Kept for layout API compatibility; rail now shows live banners only. */
  segment: {
    type: String,
    default: 'all',
    validator: (value) => ['all', 'new-launch', 'providers'].includes(value),
  },
});
</script>

<style scoped>
.sports-home-layout__casino-pane {
  margin-top: 0;
}

.sports-home-right-rail {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  background: var(--color-background);
  overflow-x: hidden;
  overflow-y: visible;
  padding: 0 2px 8px 0;
}

.sports-home-right-rail>* {
  width: 100%;
  flex: 0 0 auto;
}
</style>
