export const FAVORITE_MARKETS_CHANGED_EVENT = 'favorite-markets-changed';
export const FAVORITE_MARKETS_STORAGE_KEY = 'favorite_markets';

export function readFavoriteMarketIdsForEvent(eventId) {
  if (eventId == null || eventId === '') return [];
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(FAVORITE_MARKETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return [];
    const list = parsed[String(eventId)];
    return Array.isArray(list) ? list.map(String) : [];
  } catch {
    return [];
  }
}

/** True when localStorage has at least one pinned market id */
export function hasAnyStoredFavorites() {
  if (typeof window === 'undefined') return false;

  try {
    const raw = localStorage.getItem(FAVORITE_MARKETS_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return false;
    return Object.values(parsed).some(
      (list) => Array.isArray(list) && list.length > 0,
    );
  } catch {
    return false;
  }
}

/** Compare market ids (string or numeric fancy ids) */
export function marketIdsMatch(a, b) {
  if (a == null || b == null || a === '' || b === '') return false;
  const sa = String(a);
  const sb = String(b);
  if (sa === sb) return true;
  const na = Number(a);
  const nb = Number(b);
  return Number.isFinite(na) && Number.isFinite(nb) && na === nb;
}

export function findFavoriteMarketIndex(list, marketId) {
  if (!Array.isArray(list)) return -1;
  return list.findIndex((id) => marketIdsMatch(id, marketId));
}

const favoriteChangeListeners = new Set();

export function onFavoriteMarketsChanged(listener) {
  if (typeof listener !== 'function') return () => {};
  favoriteChangeListeners.add(listener);
  return () => favoriteChangeListeners.delete(listener);
}

export function notifyFavoriteMarketsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(FAVORITE_MARKETS_CHANGED_EVENT));
  favoriteChangeListeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('favorite-markets listener error:', err);
    }
  });
}
