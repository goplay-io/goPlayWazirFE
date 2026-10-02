import { getImageUrl } from '@/utils/imageUrl';

/** Prefer CMS items with images; otherwise use bundled static tiles. */
export function pickSectionItems(dynamicItems, staticFallback = []) {
  const dynamic = (Array.isArray(dynamicItems) ? dynamicItems : []).filter(
    (item) => item?.url_thumb || item?.image || item?.src,
  );
  if (dynamic.length) return dynamic;
  return Array.isArray(staticFallback) ? staticFallback : [];
}

/** Map static `{ id, name, image }` tiles to nav-shaped items for display helpers. */
export function staticGameTilesToNavItems(games = []) {
  return games.map((game) => ({
    id: String(game.id ?? game.gameId ?? ''),
    gameId: String(game.id ?? game.gameId ?? ''),
    name: game.name || '',
    url_thumb: game.image || game.url_thumb || game.src || '',
    navType: 'game',
    staticTile: true,
  }));
}

export function cmsNavItemsWithImages(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item?.url_thumb)
    .map((item) => ({
      ...item,
      url_thumb: getImageUrl(item.url_thumb),
    }));
}

/** Game carousel tiles: `{ id, name, image }` — CMS-only when API returns images. */
export function resolveGameImageTiles(cmsNavItems, staticGames = []) {
  const fromCms = cmsNavItemsWithImages(cmsNavItems);
  if (fromCms.length) {
    return fromCms.map((item) => ({
      id: item.id || item.gameId,
      name: item.name,
      image: item.url_thumb,
      navItem: item,
    }));
  }
  return staticGames.map((game) => ({
    id: game.id,
    name: game.name,
    image: game.image,
    staticTile: true,
  }));
}

/** Provider row tiles: `{ gameId, name, image, subProviderName }`. */
export function resolveProviderTiles(cmsNavItems, staticProviders = []) {
  const fromCms = cmsNavItemsWithImages(cmsNavItems);
  if (fromCms.length) {
    return fromCms.map((item, index) => ({
      gameId: item.id || String(index),
      name: item.name || item.providerName || 'Provider',
      image: item.url_thumb,
      subProviderName: item.providerName || item.name || '',
      navItem: item,
    }));
  }
  return staticProviders;
}
