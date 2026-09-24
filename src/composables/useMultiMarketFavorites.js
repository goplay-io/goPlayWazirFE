import { notifyFavoriteMarketsChanged, findFavoriteMarketIndex, marketIdsMatch } from '@/utils/favoriteMarketsSync';

const FAVORITES_KEY = 'favorite_markets';

/**
 * Composable for managing favorite markets in localStorage (for MultiMarket page)
 */
export function useMultiMarketFavorites() {
    /**
     * Load favorites from localStorage
     * @returns {Object} Object mapping eventId to array of marketIds
     */
    const loadFavorites = () => {
        try {
            const raw = localStorage.getItem(FAVORITES_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (err) {
            console.error('Error loading favorites:', err);
            return {};
        }
    };

    /**
     * Save favorites to localStorage
     * @param {Object} favorites - Object mapping eventId to array of marketIds
     */
    const saveFavorites = (favorites) => {
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        } catch (err) {
            console.error('Error saving favorites:', err);
        }
    };

    /**
     * Get array of event IDs from favorites
     * @returns {string[]} Array of event IDs
     */
    const getFavoriteEventIds = () => {
        const favorites = loadFavorites();
        return Object.keys(favorites).filter((eventId) => {
            const list = favorites[eventId];
            return Array.isArray(list) && list.length > 0;
        });
    };

    /**
     * Get favorite market IDs for an event
     * @param {string|number} eventId - Event ID
     * @returns {string[]} Array of market IDs
     */
    const getFavoriteMarketIds = (eventId) => {
        const favorites = loadFavorites();
        const eventKey = String(eventId);
        return Array.isArray(favorites[eventKey]) ? favorites[eventKey] : [];
    };

    /**
     * Toggle favorite status for a market
     * @param {string|number} marketId - Market ID
     * @param {string|number} eventId - Event ID
     * @returns {string[]} Updated array of favorite market IDs for the event
     */
    const toggleFavorite = (marketId, eventId) => {
        if (!marketId || !eventId) return [];

        const favorites = loadFavorites();
        const eventKey = String(eventId);
        const marketKey = String(marketId);
        const next = { ...(favorites || {}) };

        // Initialize event array if it doesn't exist
        let list = Array.isArray(next[eventKey]) ? next[eventKey].map(String) : [];

        // Toggle market in the array
        const idx = findFavoriteMarketIndex(list, marketKey);
        if (idx >= 0) {
            list.splice(idx, 1);
        } else {
            list.push(marketKey);
        }

        // Clean up empty event arrays
        if (list.length === 0) {
            delete next[eventKey];
        } else {
            next[eventKey] = list;
        }

        saveFavorites(next);
        notifyFavoriteMarketsChanged();
        return list;
    };

    /**
     * Check if a market is favorited
     * @param {string|number} marketId - Market ID
     * @param {string|number} eventId - Event ID
     * @returns {boolean} True if market is favorited
     */
    const isFavorite = (marketId, eventId) => {
        const favoriteMarketIds = getFavoriteMarketIds(eventId);
        return favoriteMarketIds.some((id) => marketIdsMatch(id, marketId));
    };

    /**
     * Remove all favorited markets for an event (e.g. event removed from backend).
     * @param {string|number} eventId
     */
    const removeFavoriteEvent = (eventId) => {
        if (eventId == null || eventId === '') return;
        const favorites = loadFavorites();
        const eventKey = String(eventId);
        if (!(eventKey in favorites)) return;
        const next = { ...favorites };
        delete next[eventKey];
        saveFavorites(next);
        notifyFavoriteMarketsChanged();
    };

    return {
        loadFavorites,
        saveFavorites,
        getFavoriteEventIds,
        getFavoriteMarketIds,
        toggleFavorite,
        isFavorite,
        removeFavoriteEvent,
    };
}

