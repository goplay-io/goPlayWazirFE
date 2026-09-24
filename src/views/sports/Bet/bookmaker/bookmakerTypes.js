/**
 * Utility functions for handling bookmaker types
 * Supports TypeThree (Match Winner - 2 backs side by side) and TypeFour (Match Winner - vertical list)
 */

import { getMarketSortPriority } from '@/utils/runnerSort';

/**
 * Gets bookmakers of a specific type (as object)
 * @param {Object} bookMakersData - The raw bookmakers data
 * @param {number} type - The type to filter by
 * @returns {Object} - Bookmakers of the specified type as object
 */
export function getBookmakersByType(bookMakersData, type) {
  if (!bookMakersData) return {};

  const result = {};

  Object.entries(bookMakersData).forEach(([key, bookmaker]) => {
    // Extract the actual market data if it's wrapped
    const marketData = bookmaker?._custom?.value || bookmaker;
    const bookmakerType = marketData?.type || 0;

    if (bookmakerType === type) {
      result[key] = bookmaker;
    }
  });

  return result;
}

/**
 * Gets a list of bookmakers of a specific type (as array)
 * @param {Object} bookMakersData - The raw bookmakers data
 * @param {number} type - The type to filter by
 * @returns {Array} - Array of bookmakers of the specified type
 */
export function getBookmakersListByType(bookMakersData, type) {
  const typeBookmakers = getBookmakersByType(bookMakersData, type);
  return Object.values(typeBookmakers).map(bm => bm?._custom?.value || bm);
}

export function getBookmakerMarketName(bookmaker) {
  const market = bookmaker?._custom?.value || bookmaker;
  return (market?.name || market?.title || market?.market_name || '').trim();
}

function normalizeBookmakerMarketKey(value) {
  return String(value ?? '').trim().toUpperCase().replace(/_/g, ' ');
}

/**
 * Priority for back/lay bookmaker market ordering:
 * BOOKMAKER → MINI BOOKMAKER → TOSS first; other markets keep API sort_priority.
 */
export function getBackLayMarketSortPriority(bookmaker) {
  const market = bookmaker?._custom?.value || bookmaker;
  const nameKey = normalizeBookmakerMarketKey(getBookmakerMarketName(market));
  const typeKey = normalizeBookmakerMarketKey(market?.type);

  const matches = (key) => nameKey === key || typeKey === key || nameKey.includes(key);

  if (matches('MINI BOOKMAKER')) return 1;
  if (matches('BOOKMAKER') && !nameKey.includes('MINI')) return 0;
  if (matches('TOSS')) return 2;

  return Infinity;
}

export function isTossMarket(market) {
  const nameKey = normalizeBookmakerMarketKey(getBookmakerMarketName(market?._custom?.value || market));
  return nameKey === 'TOSS';
}

/**
 * Cashout / Loss Cut / Speed Cash on any BookmakerBackLay market except Toss
 * (Bookmaker, Mini Bookmaker, SET WINNER, and other non-toss markets).
 */
export function isCashoutEligibleBookmaker(bookmaker, _eventTypeId) {
  if (isTossMarket(bookmaker)) return false;
  return getBackLayMarketSortPriority(bookmaker) !== 2;
}

function compareDefaultBackLaySort(a, b) {
  const aSort = getMarketSortPriority(a);
  const bSort = getMarketSortPriority(b);
  if (aSort !== bSort) return aSort - bSort;
  return getBookmakerMarketName(a).localeCompare(getBookmakerMarketName(b), undefined, { sensitivity: 'base' });
}

export function sortBackLayBookmakers(bookmakers) {
  if (!bookmakers?.length) return bookmakers || [];

  return [...bookmakers].sort((a, b) => {
    const aPriority = getBackLayMarketSortPriority(a);
    const bPriority = getBackLayMarketSortPriority(b);
    const aNamed = aPriority !== Infinity;
    const bNamed = bPriority !== Infinity;

    if (aNamed && bNamed) {
      if (aPriority !== bPriority) return aPriority - bPriority;
      return getBookmakerMarketName(a).localeCompare(getBookmakerMarketName(b), undefined, { sensitivity: 'base' });
    }
    if (aNamed && !bNamed) return -1;
    if (!aNamed && bNamed) return 1;

    return compareDefaultBackLaySort(a, b);
  });
}
