<script setup>
import LiveCardGamesBanner from '@/components/sports/LiveCardGamesBanner.vue';
import LiveCasinoGamesBanner from '@/components/sports/LiveCasinoGamesBanner.vue';
import {
    LIVE_CARDS_VIEW_MORE_PATH,
    LIVE_CASINO_VIEW_MORE_PATH,
} from '@/data/livePageShowcase.js';
</script>

<template>
    <div class="live-games-banners">
        <div class="live-games-banners__col">
            <LiveCardGamesBanner :to="LIVE_CARDS_VIEW_MORE_PATH" />
        </div>
        <div class="live-games-banners__col">
            <LiveCasinoGamesBanner :to="LIVE_CASINO_VIEW_MORE_PATH" />
        </div>
    </div>
</template>

<style scoped>
.live-games-banners {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
    margin-top: 16px;
}

.live-games-banners__col {
    min-width: 0;
}

@media (max-width: 768px) {
    .live-games-banners {
        grid-template-columns: 1fr;
        gap: 8px;
    }
}

@media (min-width: 769px) {
    .live-games-banners {
        margin-top: 12px;
        gap: 12px;
    }
}
</style>
