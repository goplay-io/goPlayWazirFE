import { isMarketBetAllow, isOffPlayLockedMarket } from './betLockOverlay';

const defaultContext = {
  inPlay: false,
  betAllow: true,
  resolveMarket: () => null,
};

let context = { ...defaultContext };

export function setBetPlacementGuardContext(nextContext = {}) {
  context = { ...context, ...nextContext };
}

export function resetBetPlacementGuardContext() {
  context = { ...defaultContext };
}

export function getOffPlayBetBlockReason(marketId) {
  const market = context.resolveMarket?.(marketId) ?? null;
  const marketBetAllow = market ? isMarketBetAllow(market, { inPlay: context.inPlay }) : true;

  if (
    isOffPlayLockedMarket({
      betAllow: context.betAllow,
      marketBetAllow,
      inPlay: context.inPlay,
    })
  ) {
    return 'off-play-market';
  }

  return null;
}
