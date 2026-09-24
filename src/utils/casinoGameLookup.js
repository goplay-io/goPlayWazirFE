import { getCasinoGames } from '@/api/event/casino';

let gamesById = null;
let loadPromise = null;

const parseGamesResponse = (response) => {
  const games = [];
  let responseData = response;
  if (response?.data && typeof response.data === 'object') responseData = response.data;
  if (responseData?.data && typeof responseData.data === 'object') responseData = responseData.data;

  Object.values(responseData || {}).forEach((providerData) => {
    if (!providerData || typeof providerData !== 'object') return;
    Object.values(providerData).forEach((categoryGames) => {
      if (!Array.isArray(categoryGames)) return;
      categoryGames.forEach((game) => games.push(game));
    });
  });

  return games;
};

export const getGameThumbnail = (game) => (
  game?.thumbnail_url
  || game?.url_thumb
  || game?.thumbnail
  || game?.imageUrl
  || game?.imagePath
  || null
);

export const ensureCasinoGamesCache = async () => {
  if (gamesById) return gamesById;

  if (!loadPromise) {
    loadPromise = getCasinoGames()
      .then((response) => {
        const map = new Map();
        parseGamesResponse(response).forEach((game) => {
          const id = String(game.id ?? game.game_id ?? '');
          if (id) map.set(id, game);
        });
        gamesById = map;
        return map;
      })
      .catch((error) => {
        loadPromise = null;
        throw error;
      });
  }

  return loadPromise;
};

export const getCachedCasinoGame = (gameId) => {
  if (!gamesById || gameId == null) return null;
  return gamesById.get(String(gameId)) ?? null;
};

export const enrichGameForFavorite = async (game, gameId) => {
  if (!game) return game;

  const existingThumb = getGameThumbnail(game);
  if (existingThumb) {
    return {
      ...game,
      thumbnail_url: existingThumb,
      url_thumb: existingThumb,
    };
  }

  const id = String(gameId ?? game.game_id ?? game.id ?? '');
  if (!id) return game;

  await ensureCasinoGamesCache();
  const cached = getCachedCasinoGame(id);
  if (!cached) return game;

  const cachedThumb = getGameThumbnail(cached);
  if (!cachedThumb) return game;

  return {
    ...cached,
    ...game,
    id: game.id ?? cached.id,
    game_id: String(game.game_id ?? game.id ?? cached.id),
    name: game.name ?? cached.name,
    thumbnail_url: cachedThumb,
    url_thumb: cachedThumb,
  };
};
