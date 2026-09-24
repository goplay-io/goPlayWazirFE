import { isTruthyInPlay } from './liveStatus';

export function isMarketBetAllow(market, { inPlay = false } = {}) {
  if (isTruthyInPlay(inPlay)) {
    const v = market?.market_bet_allow_in_play ?? market?.bet_allow_inplay ?? market?.bet_allow_in_play;
    return v === undefined || v === null || v === 1 || v === true || v === '1';
  }
  const v = market?.bet_allow;
  return v === undefined || v === null || v === 1 || v === true || v === '1';
}

export function isBetLocked({ betAllow = true, marketBetAllow = true } = {}) {
  return !betAllow || !marketBetAllow;
}

export function getBetLockOverlayStatus({ betAllow = true, marketBetAllow = true, inPlay = false } = {}) {
  if (isBetLocked({ betAllow, marketBetAllow }) && isTruthyInPlay(inPlay)) {
    return 'SUSPENDED';
  }
  return null;
}

export function isBetLockInteractionBlocked({ betAllow = true, marketBetAllow = true, inPlay = false } = {}) {
  return isBetLocked({ betAllow, marketBetAllow }) && isTruthyInPlay(inPlay);
}

export function isOffPlayLockedMarket({ betAllow = true, marketBetAllow = true, inPlay = false } = {}) {
  return isBetLocked({ betAllow, marketBetAllow }) && !isTruthyInPlay(inPlay);
}

export function isBetLockInteractionBlockedForMarket(market, { betAllow = true, inPlay = false } = {}) {
  return isBetLockInteractionBlocked({
    betAllow,
    marketBetAllow: isMarketBetAllow(market, { inPlay }),
    inPlay,
  });
}
