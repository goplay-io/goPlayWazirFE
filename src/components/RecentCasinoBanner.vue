<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFavoriteGames } from '@/composables/useFavoriteGames';
import { useSelectedGame } from '@/composables/useSelectedGame';

const router = useRouter();
const { favoriteGames } = useFavoriteGames();
const { setSelectedGame } = useSelectedGame();

const recentGame = computed(() => {
  const list = Array.isArray(favoriteGames.value) ? favoriteGames.value : [];
  if (list.length === 0) return null;
  return list[list.length - 1];
});

const gameName = computed(() => {
  const name = recentGame.value?.name;
  return name ? String(name).trim() : '';
});

const gameId = computed(() => {
  const game = recentGame.value;
  if (!game) return null;
  return game.game_id ?? game.id ?? null;
});

const openRecentGame = () => {
  if (!gameId.value) return;
  setSelectedGame({
    id: gameId.value,
    game_id: String(gameId.value),
    name: gameName.value || 'Casino game',
    product: recentGame.value?.product ?? null,
    thumbnail_url: recentGame.value?.thumbnail_url ?? null,
  });
  router.push({ name: 'casino-game', params: { gameId: String(gameId.value) } });
};
</script>

<template>
  <button
    v-if="recentGame && gameName"
    type="button"
    class="recent-casino-banner"
    :aria-label="`Open recent casino game ${gameName}`"
    @click="openRecentGame"
  >
    <span class="recent-casino-banner__content">
      <img
        class="recent-casino-banner__pointer"
        src="https://speedcdn.io/assets/icons/hand-right.png"
        alt=""
        aria-hidden="true"
        width="24"
        height="24"
        loading="lazy"
        decoding="async"
      />
      <span class="recent-casino-banner__name">{{ gameName }}</span>
    </span>
  </button>
</template>

<style scoped>
.recent-casino-banner {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  margin: 0;
  padding: 3px 12px;
  border: 0;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  cursor: pointer;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

.recent-casino-banner:hover {
  filter: brightness(1.03);
}

.recent-casino-banner:active {
  filter: brightness(0.97);
}

.recent-casino-banner__content {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
}

.recent-casino-banner__pointer {
  flex-shrink: 0;
  display: block;
  margin-right: 5px;
  width: 20px;
  height: auto;
  object-fit: contain;
  animation: swipe 0.5s alternate infinite;
  animation-timing-function: ease;
}

@keyframes swipe {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(-10deg);
  }
}

.recent-casino-banner__name {
  min-width: 0;
  color: #000000;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1.2;
  text-transform: uppercase;
  text-decoration: underline;
  text-underline-offset: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .recent-casino-banner {
    padding: 2px 15px;
  }

  .recent-casino-banner__name {
    font-size: 14px;
  }
}
</style>
