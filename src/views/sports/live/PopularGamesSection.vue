<script setup>
import { useRouter } from 'vue-router';
import { useSelectedGame } from '@/composables/useSelectedGame';
import { POPULAR_GAMES } from '@/data/popularGames.js';
import LiveShowcaseHeading from '@/views/sports/live/LiveShowcaseHeading.vue';

defineProps({
    hideHeading: {
        type: Boolean,
        default: false,
    },
});

const router = useRouter();
const { setSelectedGame } = useSelectedGame();

const openGame = (game) => {
    if (!game?.gameId) return;
    setSelectedGame({
        id: game.gameId,
        game_id: String(game.gameId),
        name: game.name || 'Casino game',
    });
    router.push({ name: 'casino-game', params: { gameId: String(game.gameId) } });
};
</script>

<template>
    <section class="popular-games-section" :class="{ 'popular-games-section--compact': hideHeading }"
        aria-label="Popular Games">
        <LiveShowcaseHeading v-if="!hideHeading" title="Popular Games" />

        <div class="imgsec" role="list">
            <button
                v-for="game in POPULAR_GAMES"
                :key="game.id"
                type="button"
                role="listitem"
                class="popularDiv"
                :class="{ 'popularDiv--linked': !!game.gameId }"
                :aria-label="game.name"
                @click="openGame(game)"
            >
                <img class="img-fluid" :src="game.src" :alt="game.name" loading="lazy" decoding="async" />
            </button>
        </div>
    </section>
</template>

<style scoped>
.popular-games-section {
    width: 100%;
    background: transparent;
}

.popular-games-section--compact .imgsec {
    padding-top: 0;
    margin-top: 0;
}

/* 2 rows, scroll horizontally (column-major: tile 1 top, tile 2 bottom, tile 3 top, …) */
.imgsec {
    display: grid;
    grid-template-rows: repeat(2, auto);
    grid-auto-flow: column;
    grid-auto-columns: clamp(104px, 27vw, 148px);
    gap: 6px;
    width: 100%;
    margin-top: 2px;
    padding: 0 0 6px;
    box-sizing: border-box;
    background: transparent;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: #6a6a6a #1a1a1a;
}

.imgsec::-webkit-scrollbar {
    height: 4px;
}

.imgsec::-webkit-scrollbar-track {
    background: #1a1a1a;
}

.imgsec::-webkit-scrollbar-thumb {
    background: #6a6a6a;
    border-radius: 999px;
}

.popularDiv {
    display: block;
    width: 100%;
    min-width: 0;
    padding: 0;
    margin: 0;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: #111111;
    line-height: 0;
    border-radius: 8px;
    overflow: hidden;
    cursor: default;
}

.popularDiv--linked {
    cursor: pointer;
}

.popularDiv--linked:active {
    opacity: 0.92;
}

.popularDiv .img-fluid {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    object-position: center;
}

@media (min-width: 769px) {
    .imgsec {
        grid-auto-columns: 148px;
        gap: 8px;
        margin-top: 2px;
        padding: 0 0 8px;
    }
}
</style>
