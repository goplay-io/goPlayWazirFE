import { getApiClient } from "../axios";

const api = getApiClient("event");

// GET /casino/games - Get all casino games
// export const getCasinoGames = () => api.get("/casino/games");
export const getCasinoGames = () => api.get("/casino/games/cache");

// GET /casino/games/newlaunch - Get new launch casino games
export const getNewLaunchCasinoGames = () => api.get("/casino/games/newlaunch");

// GET /casino/games/:gameId - Get casino game iFrame URL
export const getCasinoGame = (gameId) => api.get(`/casino/games/${gameId}`);

export const getCasinoFavourites = () => api.get("/casino/games/favorites");

// GET /casino/trandings - Get trending GIFs
export const getTrandings = () => api.get("/casino/trandings");
