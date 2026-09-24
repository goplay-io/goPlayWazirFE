import { ref } from 'vue';
import { getCasinoGames } from '@/api/event/casino';
import { sortCasinoGamesByPriority } from '@/utils/casinoGamePriority';

let cachedGames = null;
let loadPromise = null;

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function flattenCasinoGames(response) {
  let gamesData = response;
  if (response?.data && typeof response.data === 'object') gamesData = response.data;
  if (gamesData?.data && typeof gamesData.data === 'object') gamesData = gamesData.data;

  const games = [];
  Object.keys(gamesData || {}).forEach((provider) => {
    const providerData = gamesData[provider];
    if (!providerData || typeof providerData !== 'object') return;

    Object.keys(providerData).forEach((category) => {
      const gameList = Array.isArray(providerData[category])
        ? sortCasinoGamesByPriority(providerData[category])
        : [];

      gameList.forEach((game) => {
        games.push({
          id: game.id,
          name: game.name,
          url_thumb: game.url_thumb,
          provider,
          category,
          game_type: game.game_type || category,
          product: game.product ?? provider,
        });
      });
    });
  });

  return games;
}

export function filterHomeCasinoGames(games, patterns = []) {
  const normalizedPatterns = patterns.map(normalize).filter(Boolean);
  if (!normalizedPatterns.length) return [];

  return games.filter((game) => {
    const haystack = [
      game.name,
      game.category,
      game.game_type,
      game.product,
      game.provider,
    ].map(normalize).join(' ');

    return normalizedPatterns.some((pattern) => haystack.includes(pattern));
  });
}

export function useHomeCasinoGames() {
  const games = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function loadGames() {
    if (cachedGames) {
      games.value = cachedGames;
      return cachedGames;
    }

    if (loadPromise) {
      const result = await loadPromise;
      games.value = result;
      return result;
    }

    loading.value = true;
    error.value = null;

    loadPromise = (async () => {
      try {
        const response = await getCasinoGames();
        cachedGames = flattenCasinoGames(response);
        games.value = cachedGames;
        return cachedGames;
      } catch (err) {
        error.value = err;
        cachedGames = [];
        games.value = [];
        return [];
      } finally {
        loading.value = false;
        loadPromise = null;
      }
    })();

    return loadPromise;
  }

  return {
    games,
    loading,
    error,
    loadGames,
    filterHomeCasinoGames,
  };
}
