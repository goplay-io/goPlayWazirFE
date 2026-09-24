<template>
  <v-container fluid class="casino-page tw-px-0 tw-pb-2 md:tw-pb-4 tw-pt-0 md:tw-pt-0 max-w-[99vw] tw-mx-auto md:tw-max-w-[890px]">
    <div class="casino-listing-top-bar">
      <h1 class="casino-listing-top-bar__title casino-listing-top-bar__title--category">
        {{ displayCategoryTitle }}
      </h1>
      <CasinoSearch
        v-model="searchQuery"
        :result-count="filteredGames.length"
        :games="filteredGames"
        :placeholder="t('casino.home.searchPlaceholder')"
        class="casino-listing-top-bar__search md:tw-hidden"
        @game-selected="playGame"
      />
    </div>

    <div class="casino-page-body tw-px-1 md:tw-px-0">
      <Loading v-if="loading" speed="0.8s" />
      <div v-else>
        <div class="casino-tabs-l1-search-row tw-mb-0 md:tw-mb-2">
          <CasinoTabsL2Rail
            :items="filterItems"
            :active-key="activeGameType"
            @select="changeGameType"
          />

          <CasinoSearch
            v-model="searchQuery"
            :result-count="filteredGames.length"
            :games="filteredGames"
            :placeholder="t('casino.home.searchPlaceholder')"
            inline
            class="casino-tabs-search max-md:tw-hidden"
            @game-selected="playGame"
          />
        </div>

        <div v-if="filteredGames.length > 0">
          <div
            class="casino-games-grid tw-grid tw-grid-cols-4 md:tw-grid-cols-6 tw-gap-1 md:tw-gap-2">
            <div v-for="game in filteredGames" :key="game.id" class="casino-game-tile" @click="playGame(game)">
              <div class="casino-game-tile__media">
                <img :src="game.url_thumb" :alt="game.name" loading="lazy" decoding="async"
                  class="tw-w-full tw-h-full tw-object-cover tw-object-center" @error="handleImageError($event)" />
                <div
                  class="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/50 tw-opacity-0 image-placeholder">
                  <v-icon icon="mdi-cards-variant" size="36" class="tw-text-white"></v-icon>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="tw-text-center tw-py-6 md:tw-py-8 tw-px-3">
          <v-icon icon="mdi-casino-chip" size="52" class="tw-mb-3 tw-text-gray-400"></v-icon>
          <h3 class="tw-mb-1.5 tw-text-lg tw-font-semibold tw-text-gray-900">{{
            t('casino.home.noGamesFound') }}</h3>
          <p class="tw-mx-auto tw-max-w-md tw-text-gray-600">
            {{ searchQuery ? t('casino.home.noGamesSearchDescription') : t('casino.home.noGamesFilterDescription') }}
          </p>
          <v-btn v-if="searchQuery || activeGameType !== 'all'" variant="outlined" class="tw-mt-4 nav-outline-btn"
            @click="clearFilters">
            {{ t('casino.home.clearFilters') }}
          </v-btn>
        </div>
      </div>
    </div>
    <!-- Bottom clearance for fixed mobile nav bar -->
    <div class="casino-mobile-nav-spacer md:tw-hidden" aria-hidden="true" />
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getCasinoGames } from '../../api/event/casino';
import { useSelectedGame } from '@/composables/useSelectedGame';
import CasinoSearch from '../../components/CasinoSearch.vue';
import CasinoTabsL2Rail from '@/components/casino/CasinoTabsL2Rail.vue';
import Loading from '@/components/Loading.vue';
import { sortCasinoGamesByPriority } from '@/utils/casinoGamePriority';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { setSelectedGame } = useSelectedGame();

const categoryFromRoute = computed(() => route.params.category);

const displayCategoryTitle = computed(() => {
  const raw = categoryFromRoute.value;
  if (raw === null || raw === undefined) return '';
  try {
    return decodeURIComponent(String(raw));
  } catch {
    return String(raw);
  }
});

const normalizeCategoryValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  const rawValue = String(value);
  let decodedValue = rawValue;
  try {
    decodedValue = decodeURIComponent(rawValue);
  } catch {
    decodedValue = rawValue;
  }
  return decodedValue.replace(/\+/g, ' ').trim().toLowerCase();
};

const isSameCategory = (value) => normalizeCategoryValue(value) === normalizeCategoryValue(categoryFromRoute.value);

const loading = ref(true);
const allGames = ref([]);
const activeGameType = ref('all');
const searchQuery = ref('');

onMounted(async () => {
  loading.value = true;
  try {
    const response = await getCasinoGames();
    const games = [];
    let gamesData = response;
    if (response?.data && typeof response.data === 'object') {
      gamesData = response.data;
    }
    if (gamesData?.data && typeof gamesData.data === 'object') {
      gamesData = gamesData.data;
    }
    Object.keys(gamesData).forEach((product) => {
      const productData = gamesData[product];
      if (productData && typeof productData === 'object') {
        Object.keys(productData).forEach((gameType) => {
          const gameList = Array.isArray(productData[gameType])
            ? sortCasinoGamesByPriority(productData[gameType])
            : [];
          gameList.forEach((game) => {
            games.push({
              ...game,
              product,
              game_type: game.game_type || gameType,
            });
          });
        });
      }
    });
    allGames.value = games;
  } catch (error) {
    console.error('Error loading casino data:', error);
  } finally {
    loading.value = false;
  }
});

const availableGameTypes = computed(() => {
  const categoryGames = allGames.value.filter((game) => isSameCategory(game.product));
  const gameTypes = [...new Set(categoryGames.map((game) => game.game_type))];
  return gameTypes.sort();
});

const filterItems = computed(() => {
  const items = [{ key: 'all', label: t('casino.home.allTypes') }];
  availableGameTypes.value.forEach((gt) => {
    items.push({
      key: gt,
      label: formatGameTypeName(gt),
    });
  });
  return items;
});

const filteredGames = computed(() => {
  let games = allGames.value.filter((game) => isSameCategory(game.product));
  if (activeGameType.value !== 'all') {
    games = games.filter((game) => game.game_type === activeGameType.value);
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    games = games.filter(
      (game) =>
        game.name.toLowerCase().includes(query) ||
        game.category.toLowerCase().includes(query) ||
        game.product.toLowerCase().includes(query) ||
        game.game_type.toLowerCase().includes(query),
    );
  }
  games = [...games].sort((a, b) => (a.position || 0) - (b.position || 0));
  return games;
});

watch(categoryFromRoute, () => {
  activeGameType.value = 'all';
});

const changeGameType = (gameType) => {
  activeGameType.value = gameType;
};

const getProductIcon = (product) => {
  const icons = {
    'MAC88 LIVE': 'mdi-cards-playing-spade',
    'MAC EXCITE': 'mdi-lightning-bolt',
    'MAC88 VIRTUALS': 'mdi-virtual-reality',
    'MAC88 LIVE PREDICTION': 'mdi-palette',
    'COLOR AND CHICKEN GAMES': 'mdi-palette',
    'FUN GAMES': 'mdi-gamepad-variant',
    EVOLUTION: 'mdi-cards-variant',
    PRAGMATIC: 'mdi-diamond-stone',
    EZUGI: 'mdi-crown',
  };
  return icons[product] || 'mdi-casino-chip';
};

const getGameTypeIcon = (key) => {
  if (key === 'all') return 'mdi-view-grid-outline';
  const k = String(key).toLowerCase();
  const icons = {
    'dragon tiger': 'mdi-dragon',
    baccarat: 'mdi-cards-playing',
    sicbo: 'mdi-dice-multiple',
    'sic bo': 'mdi-dice-multiple',
    'live sic bo': 'mdi-dice-multiple',
    roulette: 'mdi-circle-outline',
    'live roulette': 'mdi-circle-outline',
    'color prediction': 'mdi-chart-pie',
    'chicken games': 'mdi-food-drumstick',
    'andar bahar': 'mdi-cards',
    mines: 'mdi-mine',
    aviator: 'mdi-airplane',
    teenpatti: 'mdi-cards-playing-club',
    lottery: 'mdi-numeric',
    'live poker': 'mdi-cards-playing-outline',
    'live lobby': 'mdi-office-building',
    'crash games': 'mdi-chart-line-variant',
    'casual games': 'mdi-gamepad-variant',
    'scratch cards': 'mdi-cards-outline',
    blackjack: 'mdi-cards-playing-heart',
    poker: 'mdi-cards-playing-club',
    slots: 'mdi-slot-machine',
    lightning: 'mdi-lightning-bolt',
  };
  for (const [frag, icon] of Object.entries(icons)) {
    if (k.includes(frag)) return icon;
  }
  return 'mdi-cards-playing-outline';
};

const formatGameTypeName = (gameType) => {
  return gameType
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const playGame = (game) => {
  setSelectedGame(game);
  router.push({
    name: 'casino-game',
    params: { gameId: game.id },
  });
};

const clearFilters = () => {
  activeGameType.value = 'all';
  searchQuery.value = '';
};

const handleImageError = (event) => {
  event.target.style.display = 'none';
  const media = event.target.closest('.casino-game-tile__media');
  const placeholder = media?.querySelector('.image-placeholder');
  if (placeholder) {
    placeholder.classList.remove('tw-opacity-0');
    placeholder.classList.add('tw-opacity-100');
  }
};
</script>

<style scoped>
.v-container {
  padding-top: 0 !important;
}

.casino-mobile-nav-spacer {
  height: calc(var(--mobile-bottom-nav-height, 56px) + env(safe-area-inset-bottom, 0px) + 8px);
  flex-shrink: 0;
}

.nav-outline-btn {
  color: var(--color-nav) !important;
  border-color: color-mix(in srgb, var(--color-nav) 45%, transparent) !important;
}

.nav-outline-btn:hover {
  background-color: color-mix(in srgb, var(--color-nav) 12%, transparent) !important;
}

.casino-game-tile {
  contain: layout style paint;
}

@media (max-width: 767.98px) {
  .casino-listing-top-bar__title--category {
    font-size: 0.8125rem !important;
    max-width: 100%;
  }

  .category-casino-search {
    flex: 0 0 auto !important;
    max-width: 11rem !important;
  }
}
</style>
