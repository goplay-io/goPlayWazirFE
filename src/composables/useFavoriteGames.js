import { ref, computed } from "vue";

import { getCasinoFavourites } from "@/api/event/casino";
import {
  ensureCasinoGamesCache,
  enrichGameForFavorite,
  getCachedCasinoGame,
  getGameThumbnail,
} from "@/utils/casinoGameLookup";

const STORAGE_KEY = "favorite_casino_games";
const MAX_FAVORITES = 15;

// Reactive state - now stores complete game objects
const favoriteGames = ref([]);

/**
 * Load favorite games from local storage
 */
const loadFavorites = () => {
  try {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        favoriteGames.value = JSON.parse(stored);
      } else {
        favoriteGames.value = [];
      }
    }
  } catch (error) {
    console.error("Error loading favorite games:", error);
    favoriteGames.value = [];
  }
};

/**
 * Save favorite games to local storage
 */
const saveFavorites = () => {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(favoriteGames.value),
      );
    }
  } catch (error) {
    console.error("Error saving favorite games:", error);
  }
};

/**
 * Normalize game object to consistent storage shape
 */
const normalizeGameObject = (game) => {
  const thumbnail = getGameThumbnail(game);

  return {
    id: game.id ?? game.game_id ?? null,
    game_id: String(game.game_id ?? game.id ?? ""),
    code: game.code ?? game.slug ?? null,
    name: game.name ?? game.title ?? null,
    product: game.product ?? null,
    category_id: game.category_id ?? null,
    category_name: game.category_name ?? null,
    provider_id: game.provider_id ?? null,
    provider_name: game.provider_name ?? null,
    status_id: game.status_id ?? null,
    status_name: game.status_name ?? null,
    created_by: game.created_by ?? null,
    created_on: game.created_on ?? null,
    event_type_id: game.event_type_id ?? null,
    modified_by: game.modified_by ?? null,
    modified_on: game.modified_on ?? null,
    multiplier: game.multiplier ?? null,
    position: game.position ?? null,
    thumbnail_url: thumbnail,
    url_thumb: thumbnail,
    type: game.type ?? game.category_name ?? null,
  };
};

/**
 * Add a game to favorites (now accepts complete game object)
 * - Ensures uniqueness (removes if already exists)
 * - Maintains FIFO order (removes oldest when limit reached)
 * - Adds new game to the end (most recent)
 * - Normalizes game object to consistent shape before storage
 */
const addFavoriteGame = (game) => {
  if (!game || (!game.game_id && !game.id)) {
    console.warn(
      "Cannot add favorite: game object with game_id or id is required",
    );
    return;
  }

  let sourceGame = game;
  if (!getGameThumbnail(game)) {
    const cached = getCachedCasinoGame(game.game_id ?? game.id);
    if (cached) {
      const cachedThumb = getGameThumbnail(cached);
      sourceGame = {
        ...cached,
        ...game,
        thumbnail_url: cachedThumb,
        url_thumb: cachedThumb,
      };
    }
  }

  const normalized = normalizeGameObject(sourceGame);

  // Use game_id for comparison
  const gameId = normalized.game_id;

  // Remove if already exists (to avoid duplicates)
  favoriteGames.value = favoriteGames.value.filter((favGame) => {
    const favGameId = String(favGame.game_id ?? favGame.id ?? "");
    return favGameId !== gameId;
  });

  // Add normalized game object to the end (most recent)
  favoriteGames.value.push(normalized);

  // If over limit, remove from the beginning (oldest - FIFO)
  if (favoriteGames.value.length > MAX_FAVORITES) {
    favoriteGames.value = favoriteGames.value.slice(-MAX_FAVORITES);
  }

  // Save to local storage
  saveFavorites();
};

/**
 * Remove a game from favorites (accepts gameId or game object)
 */
const removeFavoriteGame = (gameOrId) => {
  if (!gameOrId) return;

  // Handle both game objects and direct IDs
  const gameIdToRemove =
    typeof gameOrId === "object"
      ? String(gameOrId.game_id || gameOrId.id)
      : String(gameOrId);

  favoriteGames.value = favoriteGames.value.filter((favGame) => {
    const favGameId = String(favGame.game_id || favGame.id);
    return favGameId !== gameIdToRemove;
  });
  saveFavorites();
};

/**
 * Check if a game is in favorites (accepts gameId or game object)
 */
const isFavorite = (gameOrId) => {
  if (!gameOrId) return false;

  // Handle both game objects and direct IDs
  const gameIdToCheck =
    typeof gameOrId === "object"
      ? String(gameOrId.game_id || gameOrId.id)
      : String(gameOrId);

  return favoriteGames.value.some((favGame) => {
    const favGameId = String(favGame.game_id || favGame.id);
    return favGameId === gameIdToCheck;
  });
};

/**
 * Clear all favorites
 */
const clearFavorites = () => {
  favoriteGames.value = [];
  saveFavorites();
};

/**
 * Refresh favorites from API
 * - Fetches fresh favorites from API
 * - Stores complete game objects in localStorage
 * - Use forceClear=true to clear existing data first (e.g., after login)
 */
const refreshFavouriteGames = async (forceClear = false) => {
  try {
    if (forceClear) {
      clearFavorites();
    }

    const response = await getCasinoFavourites();

    const games = Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];

    await ensureCasinoGamesCache();

    favoriteGames.value = games.map((game) => {
      if (getGameThumbnail(game)) {
        return normalizeGameObject(game);
      }

      const cached = getCachedCasinoGame(game.game_id ?? game.id);
      if (!cached) {
        return normalizeGameObject(game);
      }

      const cachedThumb = getGameThumbnail(cached);
      return normalizeGameObject({
        ...cached,
        ...game,
        thumbnail_url: cachedThumb,
        url_thumb: cachedThumb,
      });
    });

    saveFavorites();
  } catch (error) {
    console.error("Failed to refresh favourite games:", error);
    if (forceClear) {
      clearFavorites();
    }
  }
};

/**
 * Backfill missing thumbnails for favorites already stored in localStorage.
 */
const hydrateFavoriteThumbnails = async () => {
  if (!favoriteGames.value.length) return;

  await ensureCasinoGamesCache();

  let updated = false;
  favoriteGames.value = favoriteGames.value.map((game) => {
    if (getGameThumbnail(game)) return game;

    const cached = getCachedCasinoGame(game.game_id ?? game.id);
    if (!cached) return game;

    const cachedThumb = getGameThumbnail(cached);
    if (!cachedThumb) return game;

    updated = true;
    return normalizeGameObject({
      ...cached,
      ...game,
      thumbnail_url: cachedThumb,
      url_thumb: cachedThumb,
    });
  });

  if (updated) {
    saveFavorites();
  }
};

/**
 * Get favorite games as array of game objects
 */
const getFavoriteGames = computed(() => {
  return [...favoriteGames.value];
});

/**
 * Get favorite game IDs only (for backward compatibility)
 */
const getFavoriteGameIds = computed(() => {
  return favoriteGames.value.map((game) => String(game.game_id || game.id));
});

// Initialize on module load
if (typeof window !== "undefined") {
  loadFavorites();
  hydrateFavoriteThumbnails().catch(() => {});
}

export function useFavoriteGames() {
  return {
    favoriteGames: computed(() => favoriteGames.value),
    addFavoriteGame,
    removeFavoriteGame,
    isFavorite,
    clearFavorites,
    refreshFavouriteGames,
    hydrateFavoriteThumbnails,
    enrichGameForFavorite,
    getFavoriteGames,
    getFavoriteGameIds,
    loadFavorites,
  };
}
