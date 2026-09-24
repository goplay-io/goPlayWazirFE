<template>
  <div
    v-if="showMobileSportsTabStrip"
    class="layout-mobile-top-chrome md:tw-hidden tw-shrink-0"
  >
    <MobileSportsChromeTabStrip />
  </div>
</template>

<script setup>
import MobileSportsChromeTabStrip from '@/components/sports/MobileSportsChromeTabStrip.vue'
import { useMobileSportsShellChrome } from '@/composables/useMobileSportsShellChrome.js'

const { showMobileSportsTabStrip } = useMobileSportsShellChrome()
</script>

<style scoped>
  .layout-mobile-top-chrome {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0;
    box-sizing: border-box;
    background: #000000;
  }
</style>
