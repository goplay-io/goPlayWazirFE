/**
 * Utility functions for MultiMarket page
 * Helper functions for grouping and formatting market data
 */

import { readFavoriteMarketIdsForEvent, marketIdsMatch } from '@/utils/favoriteMarketsSync';

export function hasFavoriteMarketId(favoriteMarketIds, marketId) {
  if (marketId == null || marketId === '') return false;
  return (favoriteMarketIds || []).some((id) => marketIdsMatch(id, marketId));
}

function getMarketId(market) {
  return market?.market_id ?? market?.marketId ?? market?.id;
}

function isRemovedOrClosedStatus(market) {
  const status = String(
    market?.status ?? market?.market_status ?? market?.state ?? '',
  ).toUpperCase();
  return status === 'REMOVED' || status === 'CLOSED';
}

/** Pinned market still exists on the event (ball running / suspended are OK) */
export function isValidPinnedMarket(market) {
  if (!market || market.active === false) return false;
  return !isRemovedOrClosedStatus(market);
}

/** Always prefer live localStorage over cached eventData.favoriteMarketIds */
export function resolveFavoriteMarketIds(eventData) {
  const eventId = eventData?.eventId;
  if (eventId != null && eventId !== '') {
    return readFavoriteMarketIdsForEvent(eventId);
  }
  return (eventData?.favoriteMarketIds || []).map(String);
}

/**
 * Get all markets for an event that are favorited, grouped by type
 * @param {Object} eventData - Event data object
 * @returns {Object} Grouped markets by type
 */
export function getEventFavoritedMarkets(eventData) {
  if (!eventData?.event) {
    return { MATCH_ODDS: [], BOOKMAKER: [], FANCY: [], OTHER_MARKETS: [] };
  }

  const { event } = eventData;
  const favoriteMarketIds = resolveFavoriteMarketIds(eventData);

  const matchOddsData = eventData.matchOddsData?.value || eventData.matchOddsData;
  const bookMakersData = eventData.bookMakersData?.value || eventData.bookMakersData;
  const finalFancyData = eventData.finalFancyData?.value || eventData.finalFancyData;
  const otherMarketData = eventData.otherMarketData?.value || eventData.otherMarketData;

  const grouped = {
    MATCH_ODDS: [],
    BOOKMAKER: [],
    FANCY: [],
    OTHER_MARKETS: []
  };

  const matchMarketId =
    matchOddsData?.market_id ??
    matchOddsData?.marketId ??
    matchOddsData?.id ??
    event?.match_odds?.market_id ??
    event?.match_odds?.marketId ??
    event?.match_odds?.id;

  if (matchMarketId != null && hasFavoriteMarketId(favoriteMarketIds, matchMarketId)) {
    grouped.MATCH_ODDS.push({
      market: matchOddsData?.market_id != null ? matchOddsData : event.match_odds,
      marketType: 'MATCH_ODDS',
    });
  }

  if (bookMakersData) {
    Object.values(bookMakersData).forEach(bm => {
      const bmId = getMarketId(bm);
      if (bm && bmId != null && hasFavoriteMarketId(favoriteMarketIds, bmId)) {
        grouped.BOOKMAKER.push({ market: bm, marketType: 'BOOKMAKER' });
      }
    });
  }

  if (finalFancyData && Array.isArray(finalFancyData)) {
    finalFancyData.forEach(fancy => {
      const fancyId = getMarketId(fancy);
      if (fancy && fancyId != null && hasFavoriteMarketId(favoriteMarketIds, fancyId)) {
        grouped.FANCY.push({ market: fancy, marketType: 'FANCY' });
      }
    });
  }

  if (otherMarketData) {
    Object.values(otherMarketData).forEach(market => {
      const omId = getMarketId(market);
      if (market && omId != null && hasFavoriteMarketId(favoriteMarketIds, omId)) {
        grouped.OTHER_MARKETS.push({ market, marketType: 'OTHER_MARKETS' });
      }
    });
  }

  return grouped;
}

/** Favorited markets that still exist on the event (not removed/closed) */
export function getValidFavoritedMarkets(eventData) {
  const grouped = getEventFavoritedMarkets(eventData);
  return {
    MATCH_ODDS: grouped.MATCH_ODDS.filter(({ market }) => isValidPinnedMarket(market)),
    BOOKMAKER: grouped.BOOKMAKER.filter(({ market }) => isValidPinnedMarket(market)),
    FANCY: grouped.FANCY.filter(({ market }) => isValidPinnedMarket(market)),
    OTHER_MARKETS: grouped.OTHER_MARKETS.filter(({ market }) => isValidPinnedMarket(market)),
  };
}

export function getValidMarketCount(eventData) {
  const grouped = getValidFavoritedMarkets(eventData);
  return (
    grouped.MATCH_ODDS.length +
    grouped.BOOKMAKER.length +
    grouped.FANCY.length +
    grouped.OTHER_MARKETS.length
  );
}

/** Pinned ids that still exist on the event payload */
export function getValidPinnedMarketIds(eventData) {
  const grouped = getValidFavoritedMarkets(eventData);
  const ids = [];
  grouped.MATCH_ODDS.forEach(({ market }) => ids.push(String(getMarketId(market))));
  grouped.BOOKMAKER.forEach(({ market }) => ids.push(String(getMarketId(market))));
  grouped.FANCY.forEach(({ market }) => ids.push(String(getMarketId(market))));
  grouped.OTHER_MARKETS.forEach(({ market }) => ids.push(String(getMarketId(market))));
  return ids;
}

/** @deprecated use getValidFavoritedMarkets */
export const getDisplayableFavoritedMarkets = getValidFavoritedMarkets;
/** @deprecated use getValidMarketCount */
export const getDisplayableMarketCount = getValidMarketCount;
/** @deprecated use getValidPinnedMarketIds */
export const getDisplayablePinnedMarketIds = getValidPinnedMarketIds;

/**
 * Whether this event should appear on Multi Markets (storage + valid pins).
 */
export function isEventVisibleInMultiMarket(eventData) {
  const eventId = eventData?.eventId;
  if (eventId == null || eventId === '') return false;
  if (readFavoriteMarketIdsForEvent(eventId).length === 0) return false;
  return getValidMarketCount(eventData) > 0;
}

/**
 * Get total market count for an event
 * @param {Object} eventData - Event data object
 * @returns {number} Total count of favorited markets
 */
export function getTotalMarketCount(eventData) {
  const grouped = getEventFavoritedMarkets(eventData);
  return grouped.MATCH_ODDS.length +
    grouped.BOOKMAKER.length +
    grouped.FANCY.length +
    grouped.OTHER_MARKETS.length;
}

/** IDs that still map to a visible pinned market on this event */
export function getPinnedMarketIds(eventData) {
  const grouped = getEventFavoritedMarkets(eventData);
  const ids = [];
  grouped.MATCH_ODDS.forEach(({ market }) => ids.push(String(getMarketId(market))));
  grouped.BOOKMAKER.forEach(({ market }) => ids.push(String(getMarketId(market))));
  grouped.FANCY.forEach(({ market }) => ids.push(String(getMarketId(market))));
  grouped.OTHER_MARKETS.forEach(({ market }) => ids.push(String(getMarketId(market))));
  return ids;
}

/**
 * Format market data for component props
 * @param {Object} eventData - Event data object
 * @param {Object} market - Market object
 * @param {string} marketType - Market type
 * @param {Object} betStore - Bet store instance
 * @param {Function} isFavorite - Function to check if market is favorited
 * @param {Function} onToggleFavorite - Function to toggle favorite
 * @returns {Object} Formatted market data props
 */
export function formatMarketData(eventData, market, marketType, betStore, isFavorite, onToggleFavorite) {
  if (!eventData?.event) {
    console.warn('Event data not available for market formatting');
    return {};
  }

  const { event_type_id, name: eventName } = eventData.event;

  // Get event-specific bet history and outcomes (stored per event in MultiMarket)
  const eventBetHistory = eventData.betHistory || [];
  const eventBetOutcomes = eventData.betOutcomes || {};

  switch (marketType) {
    case 'MATCH_ODDS':
      return {
        matchOddsData: market,
        selectedBet: betStore.bet,
        betHistory: eventBetHistory,
        betOutcomes: eventBetOutcomes,
        eventTypeId: event_type_id,
        eventName,
        betAllow: true,
        eventId: eventData.eventId,
        isFavorite: (marketId) => isFavorite(marketId, eventData.eventId),
        onToggleFavorite,
      };
    case 'BOOKMAKER':
      return {
        bookMakersData: { [market.market_id]: market },
        selectedBet: betStore.bet,
        betHistory: eventBetHistory,
        betOutcomes: eventBetOutcomes,
        eventTypeId: event_type_id,
        eventName,
        betAllow: true,
        eventId: eventData.eventId,
        isFavorite: (marketId) => isFavorite(marketId, eventData.eventId),
        onToggleFavorite,
      };
    case 'FANCY': {
      const favoriteMarketIds = resolveFavoriteMarketIds(eventData);
      const allFancyData = eventData.finalFancyData?.value || eventData.finalFancyData || [];
      const favoritedFancyData = allFancyData.filter((fancy) => {
        const fancyId = getMarketId(fancy);
        return fancy && fancyId != null && hasFavoriteMarketId(favoriteMarketIds, fancyId);
      });
      return {
        fancyData: favoritedFancyData,
        fancyTabs: eventData.fancyTabs?.value || eventData.fancyTabs || {},
        betHistory: eventBetHistory,
        betOutcomes: eventBetOutcomes,
        eventTypeId: event_type_id,
        eventName,
        betAllow: true,
        eventId: eventData.eventId,
        isFavorite: (marketId) => isFavorite(marketId, eventData.eventId),
        onToggleFavorite,
      };
    }
    case 'OTHER_MARKETS':
      return {
        markets: { [market.market_id]: market },
        selectedBet: betStore.bet,
        betHistory: eventBetHistory,
        betOutcomes: eventBetOutcomes,
        eventTypeId: event_type_id,
        eventName,
        betAllow: true,
        eventId: eventData.eventId,
        isFavorite: (marketId) => isFavorite(marketId, eventData.eventId),
        onToggleFavorite,
      };
    default:
      return {};
  }
}

