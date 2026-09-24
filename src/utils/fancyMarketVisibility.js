import { getFancyPriceLevels, getFancyTopPrices } from './fancyOddsLevels';

/** Loose match for API sort_priority vs fancy_tabs entries (string/number). */
export function matchesSortPriority(sortPriorities, marketSortPriority) {
  if (!Array.isArray(sortPriorities) || marketSortPriority == null) return false;
  const marketKey = String(marketSortPriority);
  const marketNum = Number(marketSortPriority);
  return sortPriorities.some((p) => String(p) === marketKey || Number(p) === marketNum);
}

export function isFancyMarketCatalogEligible(market) {
  return market?.active !== false;
}

export const hasNonZeroOdd = (odd) => odd != null && odd !== '' && Number(odd) !== 0;

/**
 * @param {object|null|undefined} market
 * @returns {{ backOdd: *, layOdd: *, backAmount: *, layAmount: * }}
 */
export function getFancyPrices(market) {
  return getFancyTopPrices(market);
}

/**
 * @param {object|null|undefined} market
 * @param {{ backOnly?: boolean }} [options]
 */
export function shouldShowFancyMarket(market, options = {}) {
  const levels = getFancyPriceLevels(market);
  if (options.backOnly) {
    return levels.some((level) => hasNonZeroOdd(level.backOdd));
  }
  return levels.some((level) => hasNonZeroOdd(level.backOdd) || hasNonZeroOdd(level.layOdd));
}

/**
 * Runner overlay for fancy odds cells.
 * @param {object|null|undefined} market
 * @param {{ betAllow?: boolean }} [options]
 */
export function getFancyRunnerOverlayStatus(market, { betAllow = true } = {}) {
  const statusStr = String(market?.status || '').toUpperCase();
  const marketBetAllow = market?.bet_allow;
  const isMarketBetAllow =
    marketBetAllow === undefined ||
    marketBetAllow === null ||
    marketBetAllow === 1 ||
    marketBetAllow === true ||
    marketBetAllow === '1';

  if (statusStr === 'BALL_RUNNING') {
    return 'BALL_RUNNING';
  }

  if (!betAllow || !isMarketBetAllow || statusStr === 'SUSPENDED') {
    return 'SUSPENDED';
  }

  return 'ACTIVE';
}
