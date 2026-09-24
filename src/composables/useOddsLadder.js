import { computed, unref } from 'vue';
import { CASHOUT_MAX_ODD } from '@/composables/useCashout';

/** Betfair decimal odds ladder — step depends on current price band. */
export const MIN_EXCHANGE_ODD = 1.01;
export const MAX_EXCHANGE_ODD = 1000;

export function getOddStep(odd) {
  const n = Number(odd);
  if (!Number.isFinite(n)) return 0.01;
  if (n < 2) return 0.01;
  if (n < 3) return 0.02;
  if (n < 4) return 0.05;
  if (n < 6) return 0.10;
  if (n < 10) return 0.20;
  if (n < 20) return 0.50;
  if (n < 30) return 1.00;
  if (n < 50) return 2.00;
  if (n < 100) return 5.00;
  return 10.00;
}

export function roundOdd(odd) {
  return parseFloat(Number(odd).toFixed(2));
}

/** Back-only fancy (khadda) markets. */
export function isKhadoFancyBet(bet) {
  return bet?.type === 'F' && String(bet?.betting_type || '').toUpperCase() === 'KHADO';
}

/** Exchange-style markets use the tick ladder. */
export function usesExchangeOddsLadder(bet) {
  return bet?.type !== 'F';
}

export function getMinOddForBet(bet) {
  return usesExchangeOddsLadder(bet) ? MIN_EXCHANGE_ODD : 1;
}

export function getMaxOddForBet(bet) {
  if (bet?.is_cashout_hedge) return CASHOUT_MAX_ODD;
  return usesExchangeOddsLadder(bet) ? MAX_EXCHANGE_ODD : Infinity;
}

export function increaseExchangeOdd(odd, maxOdd = MAX_EXCHANGE_ODD) {
  const current = Number(odd);
  const step = getOddStep(current);
  return roundOdd(Math.min(maxOdd, current + step));
}

export function decreaseExchangeOdd(odd, minOdd = MIN_EXCHANGE_ODD) {
  const current = Number(odd);
  const step = getOddStep(current);
  return roundOdd(Math.max(minOdd, current - step));
}

export function canAdjustBetOdd(bet) {
  if (!bet?.odd) return false;
  return usesExchangeOddsLadder(bet) || isKhadoFancyBet(bet);
}

export function adjustBetOdd(bet, direction) {
  if (!canAdjustBetOdd(bet)) return;

  const current = Number(bet.odd);
  const minOdd = getMinOddForBet(bet);
  const maxOdd = getMaxOddForBet(bet);

  if (usesExchangeOddsLadder(bet)) {
    bet.odd = direction === 'up'
      ? increaseExchangeOdd(current, maxOdd)
      : decreaseExchangeOdd(current, minOdd);
    return;
  }

  const step = 1;
  bet.odd = direction === 'up'
    ? roundOdd(Math.min(maxOdd, current + step))
    : roundOdd(Math.max(minOdd, current - step));
}

/**
 * +/- odds controls for bet slips (exchange ladder; KHADO fancy uses integer steps).
 * @param {import('vue').MaybeRefOrGetter<object|null|undefined>} betSource
 */
export function useOddsLadder(betSource) {
  const resolveBet = () => (
    typeof betSource === 'function' ? betSource() : unref(betSource)
  );

  const oddStep = computed(() => {
    const bet = resolveBet();
    if (!canAdjustBetOdd(bet)) return null;
    return usesExchangeOddsLadder(bet) ? getOddStep(bet.odd) : 1;
  });

  const canAdjustOdds = computed(() => canAdjustBetOdd(resolveBet()));

  const increaseOdd = () => adjustBetOdd(resolveBet(), 'up');
  const decreaseOdd = () => adjustBetOdd(resolveBet(), 'down');

  return {
    oddStep,
    canAdjustOdds,
    increaseOdd,
    decreaseOdd,
    getOddStep,
    usesExchangeOddsLadder,
  };
}
