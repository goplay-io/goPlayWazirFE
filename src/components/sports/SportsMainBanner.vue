<template>
  <div class="sports-main-banner">
    <MainBannerSlider />
    <SportsSharedGifRow v-if="showMobileGifRow" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import MainBannerSlider from '@/components/sports/MainBannerSlider.vue';
import SportsSharedGifRow from '@/components/sports/SportsSharedGifRow.vue';
import useDevices from '@/composables/useDevices.js';
import { useMobileSportsShellChrome } from '@/composables/useMobileSportsShellChrome.js';

const { isMobile } = useDevices();
const { showSportsShellGifRow, showHomeExchangeSection } = useMobileSportsShellChrome();

/** Reference home has no Hot Games strip under the banner (see GamesTabLayout). */
const showMobileGifRow = computed(
  () => isMobile.value && showSportsShellGifRow.value && !showHomeExchangeSection.value,
);
</script>

<style scoped>
.sports-main-banner {
  width: 100%;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
