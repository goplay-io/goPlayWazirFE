<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSelectedGame } from '@/composables/useSelectedGame';
import { openLoginModal } from '@/composables/useLoginModal.js';
import { filterHomeCasinoGames, useHomeCasinoGames } from '@/composables/useHomeCasinoGames';
import { HOME_INDIAN_CARD_GAMES } from '@/data/homeIndianCardGames.js';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  seeAllLabel: {
    type: String,
    default: 'See All',
  },
  seeAllQuery: {
    type: Object,
    default: () => ({}),
  },
  filterPatterns: {
    type: Array,
    default: () => [],
  },
  maxGames: {
    type: Number,
    default: 24,
  },
  /** Use monkeydon mac88 reference thumbnails instead of casino API url_thumb. */
  useReferenceImages: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const authStore = useAuthStore();
const { setSelectedGame } = useSelectedGame();
const { games, loading, loadGames } = useHomeCasinoGames();
const scrollRef = ref(null);

const referenceGames = computed(() =>
  HOME_INDIAN_CARD_GAMES.slice(0, props.maxGames).map((game) => ({
    id: game.id,
    name: game.name,
    url_thumb: game.image,
  })),
);

const visibleGames = computed(() => {
  if (props.useReferenceImages) return referenceGames.value;
  return filterHomeCasinoGames(games.value, props.filterPatterns).slice(0, props.maxGames);
});

const scrollBy = (direction) => {
  const container = scrollRef.value;
  if (!container) return;
  const cardWidth = container.querySelector('.home-games-section__game')?.offsetWidth ?? 200;
  const amount = direction === 'forward' ? cardWidth + 4 : -(cardWidth + 4);
  container.scrollBy({ left: amount, behavior: 'smooth' });
};

const onSeeAll = () => {
  router.push({
    name: 'casino-home',
    query: props.seeAllQuery,
  });
};

const openGame = (game) => {
  if (!game?.id) return;
  if (!authStore.isUiAuthenticated) {
    openLoginModal({ redirect: `/casino/game/${game.id}` });
    return;
  }
  setSelectedGame({
    id: game.id,
    game_id: String(game.id),
    name: game.name || 'Casino game',
  });
  router.push({ name: 'casino-game', params: { gameId: String(game.id) } });
};

onMounted(() => {
  if (!props.useReferenceImages) loadGames();
});
</script>

<template>
  <section
    v-if="useReferenceImages ? visibleGames.length > 0 : (loading || visibleGames.length > 0)"
    class="home-games-section"
    :class="{ 'home-games-section--reference-images': useReferenceImages }"
  >
    <div class="home-games-section__card">
      <div class="home-games-section__header">
        <button type="button" class="home-games-section__title-btn" @click="onSeeAll">
          <span class="home-games-section__title">{{ title }}</span>
        </button>
        <div class="home-games-section__actions">
          <button type="button" class="home-games-section__see-all" @click="onSeeAll">
            {{ seeAllLabel }}
          </button>
          <button type="button" class="home-games-section__scroll-btn" aria-label="Scroll left" @click="scrollBy('backward')">
            ‹
          </button>
          <button type="button" class="home-games-section__scroll-btn" aria-label="Scroll right" @click="scrollBy('forward')">
            ›
          </button>
        </div>
      </div>

      <div class="home-games-section__body">
        <div v-if="loading" class="home-games-section__loading">Loading…</div>
        <div v-else ref="scrollRef" class="home-games-section__track scrollbar-hide">
          <button
            v-for="game in visibleGames"
            :key="game.id"
            type="button"
            class="home-games-section__game"
            @click="openGame(game)"
          >
            <img
              :src="game.url_thumb"
              :alt="game.name"
              class="home-games-section__game-img"
              loading="lazy"
              decoding="async"
            />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-games-section {
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.home-games-section__card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: #333333;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.home-games-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.home-games-section__title-btn {
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.home-games-section__title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  text-transform: capitalize;
}

.home-games-section__actions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.home-games-section__see-all {
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: #49915e;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.home-games-section__scroll-btn {
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

.home-games-section__body {
  padding: 10px 12px;
}

.home-games-section__loading {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  padding: 12px 0;
}

.home-games-section__track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 4px;
}

.home-games-section__game {
  flex: 0 0 auto;
  width: 117px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

@media (min-width: 640px) {
  .home-games-section__game {
    width: 140px;
  }
}

@media (min-width: 768px) {
  .home-games-section__game {
    width: 160px;
  }
}

.home-games-section__game-img {
  display: block;
  width: 100%;
  aspect-ratio: 0.85;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  background: #2a2d31;
  transition: transform 0.2s ease;
}

.home-games-section__game:hover .home-games-section__game-img {
  transform: scale(1.05);
}

/* Reference (monkeydon Indian Card Games): min-w 120→200, 3:4, gap-1, no radius */
.home-games-section--reference-images .home-games-section__body {
  padding: 10px;
}

.home-games-section--reference-images .home-games-section__track {
  gap: 4px;
}

.home-games-section--reference-images .home-games-section__game {
  width: 120px;
  min-width: 120px;
}

@media (min-width: 640px) {
  .home-games-section--reference-images .home-games-section__game {
    width: 140px;
    min-width: 140px;
  }
}

@media (min-width: 768px) {
  .home-games-section--reference-images .home-games-section__game {
    width: 160px;
    min-width: 160px;
  }
}

@media (min-width: 1024px) {
  .home-games-section--reference-images .home-games-section__game {
    width: 180px;
    min-width: 180px;
  }
}

@media (min-width: 1280px) {
  .home-games-section--reference-images .home-games-section__game {
    width: 200px;
    min-width: 200px;
  }
}

.home-games-section--reference-images .home-games-section__game-img {
  aspect-ratio: 3 / 4;
  border-radius: 0;
  box-shadow: none;
}

.home-games-section--reference-images .home-games-section__game:hover .home-games-section__game-img {
  transform: none;
}
</style>
