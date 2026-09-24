<template>
  <section v-if="loading || filteredGames.length > 0" class="favourites-section">
    <header class="favourites-section__header">
      <h2 class="favourites-section__title favourites-section__title--animated">MY FAVOURITES</h2>
    </header>

    <div v-if="loading" class="tw-flex tw-justify-center tw-items-center tw-py-8">
      <div class="tw-text-center">
        <v-progress-circular indeterminate color="primary" size="36" />
        <p class="tw-text-theme-text-secondary tw-mt-3">{{ t('casino.favorites.loading') }}</p>
      </div>
    </div>

    <div v-else class="favourites-grid">
      <article v-for="game in filteredGames" :key="game.id" class="favourites-card" @click="playGame(game)">
        <div class="favourites-card__media">
          <img v-if="game.url_thumb" :src="game.url_thumb" :alt="game.name" loading="lazy" decoding="async"
            @error="handleImageError($event)" />
          <div class="image-placeholder favourites-card__placeholder" :class="{ 'tw-opacity-100': !game.url_thumb }">
            <v-icon icon="mdi-cards-variant" size="34" class="tw-text-white"></v-icon>
          </div>
        </div>
        <div class="favourites-card__name">{{ game.name }}</div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useFavoriteGames } from '@/composables/useFavoriteGames';
import { useSelectedGame } from '@/composables/useSelectedGame';

const { t } = useI18n();
const router = useRouter();
const { favoriteGames, refreshFavouriteGames, hydrateFavoriteThumbnails } = useFavoriteGames();
const { setSelectedGame } = useSelectedGame();

const loading = ref(true);

// Get favorite games directly from stored objects
const filteredGames = computed(() => {
  if (!favoriteGames.value.length) {
    return [];
  }

  // Return games so that the last added favorite appears first
  // Transform to match expected format with url_thumb property
  return [...favoriteGames.value]
    .reverse()
    .map(game => ({
      ...game,
      // Map thumbnail_url to url_thumb for compatibility
      url_thumb: game.thumbnail_url || game.url_thumb || game.imageUrl || game.imagePath,
      // Use game_id as id if id is not present
      id: game.id || game.game_id
    }));
});

// Load favorite games (from storage or API)
onMounted(async () => {
  loading.value = true;

  try {
    // Check if we have favorites in local storage first
    if (favoriteGames.value.length === 0) {
      // Only fetch from API if no favorites in storage
      await refreshFavouriteGames();
    } else {
      await hydrateFavoriteThumbnails();
    }
    // If we have favorites in storage, just use them (no API call needed)
  } catch (error) {
    console.error('Error loading favorite casino games:', error);
  } finally {
    loading.value = false;
  }
});

const playGame = (game) => {
  setSelectedGame(game);
  router.push({
    name: 'casino-game',
    params: { gameId: game.game_id || game.id }
  });
};

const handleImageError = (event) => {
  // Hide broken image and show placeholder
  event.target.style.display = 'none';
  const placeholder = event.target.nextElementSibling;
  if (placeholder && placeholder.classList.contains('image-placeholder')) {
    placeholder.classList.remove('tw-opacity-0');
    placeholder.classList.add('tw-opacity-100');
  }
};
</script>

<style scoped>
.favourites-section {
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: var(--color-nav, #071123);
}

.favourites-section__header {
  background: var(--color-nav, #071123);
  border-bottom: 1px solid var(--color-nav-border, rgba(255, 255, 255, 0.15));
  padding: 6px 10px;
}

.favourites-section__title {
  display: inline-block;
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
}

.favourites-section__title--animated {
  transform-origin: center;
  animation: header-zoom-stretch 2.2s ease-in-out infinite;
}

.favourites-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  background: #ffffff;
}

.favourites-card {
  cursor: pointer;
  background: color-mix(in srgb, var(--color-nav-deep, #212e44) 88%, #000);
  color: #ffffff;
}

.favourites-card__media {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: color-mix(in srgb, var(--color-nav, #071123) 92%, #000);
}

.favourites-card__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.favourites-card__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  opacity: 0;
}

.favourites-card__name {
  min-height: 34px;
  padding: 5px 6px;
  background: color-mix(in srgb, var(--color-nav-deep, #212e44) 90%, #000);
  border-top: 1px solid rgba(255, 255, 255, 0.22);
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favourites-empty {
  padding: 1.5rem 0.75rem;
  text-align: center;
  background: color-mix(in srgb, var(--color-nav, #071123) 88%, #000);
}

@keyframes header-zoom-stretch {

  0%,
  100% {
    transform: scale(1, 1);
  }

  35% {
    transform: scale(1.12, 0.9);
  }

  65% {
    transform: scale(0.95, 1.08);
  }
}

@media (min-width: 640px) {
  .favourites-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .favourites-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1200px) {
  .favourites-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

/* Mobile: mirror NewLaunchGames — 4 tiles per row in a horizontal scroller, captions hidden */
@media (max-width: 575px) {
  .favourites-grid {
    display: flex;
    gap: 2px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 2px 2px 3px;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    background: #ffffff;
  }

  .favourites-grid::-webkit-scrollbar {
    height: 4px;
  }

  .favourites-grid::-webkit-scrollbar-thumb {
    background: rgba(183, 134, 47, 0.7);
    border-radius: 999px;
  }

  .favourites-card {
    flex: 0 0 calc((100% - 6px) / 4);
    max-width: calc((100% - 6px) / 4);
    scroll-snap-align: start;
  }

  .favourites-card__name {
    display: none;
  }

  .favourites-section__title {
    font-size: 16px;
  }
}
</style>
