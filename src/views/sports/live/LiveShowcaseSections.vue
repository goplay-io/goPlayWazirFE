<script setup>
import CasinoGamesProvidersSection from '@/views/sports/live/CasinoGamesProvidersSection.vue';
import RecentWinsSection from '@/views/sports/live/RecentWinsSection.vue';
import HomePageBottomText from '@/components/home/HomePageBottomText.vue';
import { isHorseGreyhoundRacingRoute } from '@/composables/useMobileSportsShellChrome.js';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const showRecentWins = computed(() => !isHorseGreyhoundRacingRoute(route));

const showCasinoProviders = computed(() => !isHorseGreyhoundRacingRoute(route));

const showBottomText = computed(() => showCasinoProviders.value);
</script>

<template>
    <div v-if="showRecentWins || showCasinoProviders || showBottomText" class="live-showcase">
        <RecentWinsSection v-if="showRecentWins" />
        <CasinoGamesProvidersSection v-if="showCasinoProviders" />
        <HomePageBottomText v-if="showBottomText" class="live-showcase__bottom-text" />
    </div>
</template>

<style scoped>
.live-showcase {
    width: 100%;
    margin-top: 12px;
    background: transparent;
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
