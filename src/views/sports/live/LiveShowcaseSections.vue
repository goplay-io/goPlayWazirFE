<script setup>
import CasinoGamesProvidersSection from '@/views/sports/live/CasinoGamesProvidersSection.vue';
import RecentWinsSection from '@/views/sports/live/RecentWinsSection.vue';
import PopularGamesSection from '@/views/sports/live/PopularGamesSection.vue';
import HomeSeoFaqAccordion from '@/components/home/HomeSeoFaqAccordion.vue';
import { isHorseGreyhoundRacingRoute } from '@/composables/useMobileSportsShellChrome.js';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const isReferenceHome = computed(
  () => route.name === 'live' || route.name === 'e-sports',
);

const showRecentWins = computed(
  () => !isHorseGreyhoundRacingRoute(route) && !isReferenceHome.value,
);

const showCasinoProviders = computed(() => !isHorseGreyhoundRacingRoute(route));

const showPopularGames = computed(() => isReferenceHome.value);

const showSeoFaq = computed(() => isReferenceHome.value);
</script>

<template>
    <div
      v-if="showRecentWins || showCasinoProviders || showPopularGames || showSeoFaq"
      class="live-showcase"
      :class="{ 'live-showcase--reference-home': isReferenceHome }"
    >
        <RecentWinsSection v-if="showRecentWins" />
        <CasinoGamesProvidersSection v-if="showCasinoProviders" />
        <PopularGamesSection v-if="showPopularGames" reference-layout />
        <HomeSeoFaqAccordion v-if="showSeoFaq" />
    </div>
</template>

<style scoped>
.live-showcase {
    width: 100%;
    margin-top: 12px;
    background: transparent;
}

.live-showcase--reference-home {
    margin-top: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.live-showcase__bottom-text {
    margin-top: 8px;
}

@media (min-width: 768px) {
    .live-showcase__bottom-text {
        margin-top: 12px;
    }
}
</style>
