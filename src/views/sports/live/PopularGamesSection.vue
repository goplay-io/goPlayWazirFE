<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSelectedGame } from '@/composables/useSelectedGame';
import { openLoginModal } from '@/composables/useLoginModal.js';
import { POPULAR_GAMES } from '@/data/popularGames.js';
import { HOME_REFERENCE_POPULAR_GAMES } from '@/data/homeReferencePopularGames.js';
import LiveShowcaseHeading from '@/views/sports/live/LiveShowcaseHeading.vue';

const props = defineProps({
  hideHeading: {
    type: Boolean,
    default: false,
  },
  /** Reference home: card header + lotusHomeLobby luckmedia thumbnails. */
  referenceLayout: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const authStore = useAuthStore();
const { setSelectedGame } = useSelectedGame();
const scrollRef = ref(null);

const games = computed(() => (
  props.referenceLayout ? HOME_REFERENCE_POPULAR_GAMES : POPULAR_GAMES
));

const scrollBy = (direction) => {
  const container = scrollRef.value;
  if (!container) return;
  const amount = direction === 'forward' ? 320 : -320;
  container.scrollBy({ left: amount, behavior: 'smooth' });
};

const onSeeAll = () => {
  router.push({ name: 'casino-home' });
};

const openGame = (game) => {
  const gameId = game?.id || game?.gameId;
  if (!gameId) return;

  if (!authStore.isUiAuthenticated) {
    openLoginModal({ redirect: `/casino/game/${gameId}` });
    return;
  }

  setSelectedGame({
    id: gameId,
    game_id: String(gameId),
    name: game.name || 'Casino game',
  });
  router.push({ name: 'casino-game', params: { gameId: String(gameId) } });
};

const gameImage = (game) => (props.referenceLayout ? game.image : game.src);
const gameKey = (game) => game.id || game.gameId;
</script>

<template>
  <section
    class="popular-games-section"
    :class="{
      'popular-games-section--compact': hideHeading,
      'popular-games-section--reference': referenceLayout,
    }"
    aria-label="Popular Games"
  >
    <template v-if="referenceLayout">
      <div class="popular-games-section__card">
        <div class="popular-games-section__header">
          <button type="button" class="popular-games-section__title-btn" @click="onSeeAll">
            <span class="popular-games-section__title">Popular Games</span>
          </button>
          <div class="popular-games-section__actions">
            <button type="button" class="popular-games-section__see-all" @click="onSeeAll">
              See All
            </button>
            <button type="button" class="popular-games-section__scroll-btn" aria-label="Scroll left" @click="scrollBy('backward')">
              ‹
            </button>
            <button type="button" class="popular-games-section__scroll-btn" aria-label="Scroll right" @click="scrollBy('forward')">
              ›
            </button>
          </div>
        </div>

        <div class="popular-games-section__body">
          <div ref="scrollRef" class="popular-games-section__track scrollbar-hide" role="list">
            <button
              v-for="game in games"
              :key="gameKey(game)"
              type="button"
              role="listitem"
              class="popular-games-section__tile"
              :aria-label="game.name"
              @click="openGame(game)"
            >
              <img
                class="popular-games-section__tile-img"
                :src="gameImage(game)"
                :alt="game.name"
                loading="lazy"
                decoding="async"
              />
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <LiveShowcaseHeading v-if="!hideHeading" title="Popular Games" />

      <div class="imgsec" role="list">
        <button
          v-for="game in games"
          :key="gameKey(game)"
          type="button"
          role="listitem"
          class="popularDiv"
          :class="{ 'popularDiv--linked': !!(game.id || game.gameId) }"
          :aria-label="game.name"
          @click="openGame(game)"
        >
          <img class="img-fluid" :src="gameImage(game)" :alt="game.name" loading="lazy" decoding="async" />
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.popular-games-section {
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  background: transparent;
}

.popular-games-section--reference {
  padding: 0;
}

.popular-games-section__card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: #333333;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.popular-games-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.popular-games-section__title-btn {
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.popular-games-section__title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  text-transform: capitalize;
}

.popular-games-section__actions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.popular-games-section__see-all {
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: #49915e;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.popular-games-section__scroll-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 4px;
  background: rgba(73, 145, 94, 0.18);
  color: #49915e;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.popular-games-section__body {
  padding: 10px;
}

/* Reference: grid-flow-col grid-rows-2, ~160×213 tiles */
.popular-games-section__track {
  display: grid;
  grid-template-rows: repeat(2, auto);
  grid-auto-flow: column;
  grid-auto-columns: 160px;
  gap: 4px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 2px;
}

.popular-games-section__tile {
  display: block;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: #2a2d31;
  overflow: hidden;
  cursor: pointer;
  line-height: 0;
}

.popular-games-section__tile:active {
  opacity: 0.92;
}

.popular-games-section__tile-img {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.popular-games-section__tile:hover .popular-games-section__tile-img {
  transform: scale(1.05);
}

/* Legacy layout */
.popular-games-section--compact .imgsec {
  padding-top: 0;
  margin-top: 0;
}

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
