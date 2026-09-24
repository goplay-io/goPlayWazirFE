import { computed, ref } from 'vue';
import { useBetStore } from '@/stores/bet';
import { formulas } from './PayoutCalculators/Formulas';
import { speedCash as speedCashApi } from '@/api/event/bet';
import { useWallet } from '@/composables/useWallet';
import { isVirtualEvent } from '@/utils/virtualStatus';

const INACTIVE_RUNNER_STATUSES = ['SUSPENDED', 'REMOVED', 'LOSER', 'WINNER', 'BALL_RUNNING', 'BALL RUNNING'];
const CASHOUT_MIN_DIFF = 0.1;
const CASHOUT_BALANCED_EPS = 0.01;
const NON_NEGATIVE_EPS = 0.01;
export const CASHOUT_MAX_ODD = 2;

export const SPEED_CASH_MIN_EXPOSURE = 100;
export const SPEED_CASH_MAX_DIFF = 10;
export const SPEED_CASH_FEE_PERCENT = 3.0;
export const SPEED_CASH_COOLDOWN_MS = 7000;

/** @type {Record<string, number>} marketId -> cooldown end timestamp */
const speedCashCooldownUntilByMarket = {};

export function startSpeedCashCooldown(marketId) {
  if (marketId == null || marketId === '') return;
  speedCashCooldownUntilByMarket[String(marketId)] = Date.now() + SPEED_CASH_COOLDOWN_MS;
}

export function getSpeedCashCooldownSeconds(marketId) {
  if (marketId == null || marketId === '') return 0;
  const key = String(marketId);
  const until = speedCashCooldownUntilByMarket[key];
  if (!until) return 0;
  const remainingMs = until - Date.now();
  if (remainingMs <= 0) {
    delete speedCashCooldownUntilByMarket[key];
    return 0;
  }
  return Math.ceil(remainingMs / 1000);
}

const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

const toFiniteNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const isDigitBettingType = (bettingType) => String(bettingType || '').toUpperCase() === 'DIGIT';

const isValidOdds = (odds, bettingType) => {
  if (odds === null) return false;
  const numericOdds = toFiniteNumber(odds);
  return isDigitBettingType(bettingType) ? numericOdds > 0 : numericOdds > 1;
};

const isValidCashoutOdds = (odds, bettingType) => {
  if (!isValidOdds(odds, bettingType)) return false;
  if (isDigitBettingType(bettingType)) return true;
  return toFiniteNumber(odds) <= CASHOUT_MAX_ODD;
};

const getStakeBounds = (minBet, maxBet) => {
  const min = toFiniteNumber(minBet);
  const max = toFiniteNumber(maxBet);

  return {
    min: min !== null && min > 0 ? min : 0,
    max: max !== null && max > 0 ? max : Infinity
  };
};

const applyStakeLimits = (stake, minBet, maxBet) => {
  const { min, max } = getStakeBounds(minBet, maxBet);
  if (max < min) {
    throw new Error(`Invalid stake limits: minimum ${min} exceeds maximum ${max}`);
  }
  return round2(Math.min(Math.max(stake, min), max));
};

const getRunnerIdentifiers = (runner) => {
  if (!runner) return [];
  return [
    runner.selection_id,
    runner.selectionId,
    runner.runner_id,
    runner.runnerId,
    runner.id,
    runner.key,
    runner.values?.[0]
  ]
    .filter((value) => value !== undefined && value !== null && value !== '')
    .map((value) => String(value));
};

const getRunnerPrimaryId = (runner) => getRunnerIdentifiers(runner)[0] || null;

const runnerMatchesId = (runner, runnerId) => {
  const target = String(runnerId);
  return getRunnerIdentifiers(runner).includes(target);
};

const getRunnerOutcomeValue = (marketOutcomes, runner) => {
  if (!marketOutcomes || !runner) return null;

  for (const id of getRunnerIdentifiers(runner)) {
    if (Object.prototype.hasOwnProperty.call(marketOutcomes, id)) {
      return toFiniteNumber(marketOutcomes[id]);
    }
  }

  return null;
};

const getHedgeOdd = (runner, side) => {
  const lowerSide = String(side).toLowerCase();
  const rawOdd = lowerSide === 'lay'
    ? runner?.lay?.[0]?.price ?? runner?.priceLay ?? runner?.values?.[8]
    : runner?.back?.[0]?.price ?? runner?.priceBack ?? runner?.values?.[6];

  return toFiniteNumber(rawOdd);
};

const getBetProfit = (odd, stake, bettingType) => {
  return isDigitBettingType(bettingType)
    ? formulas.DIGIT(odd, stake)
    : formulas.ODDS(odd, stake);
};

const calculateCashoutIdealStake = (diff, hedgeOdd, bettingType) => {
  if (isDigitBettingType(bettingType)) {
    return diff * 100 / (hedgeOdd + 100);
  }
  return diff / hedgeOdd;
};

const calculateBackLossCutIdealStake = (negativeAmount, hedgeOdd, bettingType) => {
  const loss = Math.abs(negativeAmount);
  if (isDigitBettingType(bettingType)) {
    return loss * 100 / hedgeOdd;
  }
  return loss / (hedgeOdd - 1);
};

const simulateHedge = (positions, hedgeRunner, hedgeSide, hedgeOdd, hedgeStake, bettingType) => {
  const side = String(hedgeSide).toLowerCase();
  const profit = getBetProfit(hedgeOdd, hedgeStake, bettingType);

  const postPositions = positions.map((position) => {
    const isTarget = position.runner === hedgeRunner || runnerMatchesId(hedgeRunner, position.runnerId);
    let amount = position.amount;

    if (side === 'back') {
      amount += isTarget ? profit : -hedgeStake;
    } else {
      amount += isTarget ? -profit : hedgeStake;
    }

    return {
      ...position,
      amount: round2(amount)
    };
  });

  const values = postPositions.map((position) => position.amount);
  return {
    positions: postPositions,
    minPL: round2(Math.min(...values)),
    maxPL: round2(Math.max(...values)),
    firstRunnerPL: round2(postPositions[0]?.amount || 0),
    outcomeMap: postPositions.reduce((acc, position) => {
      acc[position.runnerId] = position.amount;
      return acc;
    }, {})
  };
};

export default function useCashout() {
  const betStore = useBetStore();
  const isProcessing = ref(false);

  const getMarketOutcomes = (marketId, outcomes) => {
    if (!outcomes || !marketId) return {};
    return outcomes[String(marketId)] || {};
  };

  const getMarketOutcomeEntries = (marketId, outcomes) => {
    const marketOutcomes = getMarketOutcomes(marketId, outcomes);
    return Object.entries(marketOutcomes)
      .map(([runnerId, amount]) => ({ runnerId, amount: toFiniteNumber(amount) }))
      .filter((entry) => entry.amount !== null);
  };

  const getWorstOutcome = (marketId, outcomes) => {
    const entries = getMarketOutcomeEntries(marketId, outcomes);
    if (!entries.length) return { runnerId: null, amount: 0 };

    return entries.reduce((worst, entry) => (
      entry.amount < worst.amount ? entry : worst
    ));
  };

  const getBestOutcome = (marketId, outcomes) => {
    const entries = getMarketOutcomeEntries(marketId, outcomes);
    if (!entries.length) return { runnerId: null, amount: 0 };

    return entries.reduce((best, entry) => (
      entry.amount > best.amount ? entry : best
    ));
  };

  const findRunnerById = (runners, runnerId) => {
    if (!runners?.length) return null;
    return runners.find((runner) => runnerMatchesId(runner, runnerId)) || null;
  };

  const isRunnerActive = (runner) => {
    const status = String(runner?.status || '').toUpperCase();
    return !INACTIVE_RUNNER_STATUSES.includes(status);
  };

  const getTwoRunnerPositions = (marketId, runners, outcomes) => {
    if (!Array.isArray(runners) || runners.length !== 2) {
      return { error: 'Feature requires exactly 2 runners' };
    }

    const marketOutcomes = getMarketOutcomes(marketId, outcomes);
    if (!marketOutcomes || Object.keys(marketOutcomes).length === 0) {
      return { error: 'No market outcomes' };
    }

    const positions = runners.map((runner, index) => {
      const amount = getRunnerOutcomeValue(marketOutcomes, runner);
      return {
        runner,
        runnerId: getRunnerPrimaryId(runner) || String(index),
        amount
      };
    });

    if (positions.some((position) => position.amount === null)) {
      return { error: 'Exposure data incomplete' };
    }

    return { marketOutcomes, positions };
  };

  const getBestWorstPositions = (positions) => {
    return positions.reduce((result, position) => ({
      best: !result.best || position.amount > result.best.amount ? position : result.best,
      worst: !result.worst || position.amount < result.worst.amount ? position : result.worst
    }), { best: null, worst: null });
  };

  const computeCashoutStake = (
    marketOutcomes,
    hedgeOdds,
    hedgeSide,
    bettingType = 'ODDS',
    minBet = 0,
    maxBet = Infinity
  ) => {
    if (!marketOutcomes || Object.keys(marketOutcomes).length === 0) {
      throw new Error('No market outcomes provided');
    }

    const odds = toFiniteNumber(hedgeOdds);
    if (!isValidOdds(odds, bettingType)) {
      throw new Error(isDigitBettingType(bettingType)
        ? 'Invalid hedge odds for DIGIT: must be > 0'
        : 'Invalid hedge odds for ODDS: must be > 1');
    }

    const outcomes = Object.values(marketOutcomes)
      .map((value) => toFiniteNumber(value))
      .filter((value) => value !== null);

    if (!outcomes.length) {
      throw new Error('No valid market outcomes provided');
    }

    const bestOutcome = Math.max(...outcomes);
    const worstOutcome = Math.min(...outcomes);
    const diff = Math.abs(bestOutcome - worstOutcome);

    if (diff <= CASHOUT_BALANCED_EPS) {
      return { stake: 0, lockedPL: round2(worstOutcome) };
    }

    const idealStake = calculateCashoutIdealStake(diff, odds, bettingType);
    const stake = applyStakeLimits(idealStake, minBet, maxBet);
    const profit = getBetProfit(odds, stake, bettingType);

    let lockedPL;
    if (String(hedgeSide || '').toLowerCase() === 'lay') {
      lockedPL = Math.min(bestOutcome - profit, worstOutcome + stake);
    } else {
      lockedPL = Math.min(bestOutcome - stake, worstOutcome + profit);
    }

    return { stake, lockedPL: round2(lockedPL), idealStake: round2(idealStake) };
  };

  const computeLossCutStake = (
    marketOutcomes,
    hedgeOdds,
    bettingType = 'ODDS',
    hedgeSide = 'back',
    minBet = 0,
    maxBet = Infinity
  ) => {
    if (!marketOutcomes || Object.keys(marketOutcomes).length === 0) {
      throw new Error('No market outcomes provided');
    }

    const odds = toFiniteNumber(hedgeOdds);
    if (!isValidOdds(odds, bettingType)) {
      throw new Error(isDigitBettingType(bettingType)
        ? 'Invalid hedge odds for DIGIT: must be > 0'
        : 'Invalid hedge odds for ODDS: must be > 1');
    }

    const outcomes = Object.values(marketOutcomes)
      .map((value) => toFiniteNumber(value))
      .filter((value) => value !== null);

    const bestOutcome = Math.max(...outcomes);
    const worstOutcome = Math.min(...outcomes);

    if (bestOutcome <= 0 || worstOutcome >= 0) {
      return { stake: 0, lockedPL: round2(worstOutcome) };
    }

    const side = String(hedgeSide || '').toLowerCase();
    const idealStake = side === 'lay'
      ? Math.abs(worstOutcome)
      : calculateBackLossCutIdealStake(worstOutcome, odds, bettingType);
    const stake = applyStakeLimits(idealStake, minBet, maxBet);
    const profit = getBetProfit(odds, stake, bettingType);

    const postPositive = side === 'lay' ? bestOutcome - profit : bestOutcome - stake;
    const postNegative = side === 'lay' ? worstOutcome + stake : worstOutcome + profit;

    return {
      stake,
      lockedPL: round2(Math.max(postPositive, postNegative)),
      idealStake: round2(idealStake)
    };
  };

  const isCashoutAvailable = (
    marketId,
    runners,
    outcomes,
    betAllow = true,
    minBet = 0,
    maxBet = Infinity,
    bettingType = 'ODDS'
  ) => {
    if (!betAllow) return { available: false, reason: 'Betting not allowed' };
    if (!outcomes || !marketId) return { available: false, reason: 'No outcomes data' };

    const positionData = getTwoRunnerPositions(marketId, runners, outcomes);
    if (positionData.error) return { available: false, reason: positionData.error };

    const { positions, marketOutcomes } = positionData;
    const diff = Math.abs(positions[0].amount - positions[1].amount);
    if (diff <= CASHOUT_MIN_DIFF) {
      return { available: false, reason: 'Exposure difference too small' };
    }

    const { best, worst } = getBestWorstPositions(positions);
    const candidates = [];
    const rejectedReasons = [];

    const addCandidate = (position, hedgeSide) => {
      if (!position?.runner || !isRunnerActive(position.runner)) return;

      const hedgeOdd = getHedgeOdd(position.runner, hedgeSide);
      if (!isValidOdds(hedgeOdd, bettingType)) return;
      if (!isValidCashoutOdds(hedgeOdd, bettingType)) {
        rejectedReasons.push({ reason: `Hedge odds exceed maximum of ${CASHOUT_MAX_ODD}` });
        return;
      }

      try {
        const idealStake = calculateCashoutIdealStake(diff, hedgeOdd, bettingType);
        const hedgeStake = applyStakeLimits(idealStake, minBet, maxBet);
        if (hedgeStake <= 0) return;

        const simulation = simulateHedge(positions, position.runner, hedgeSide, hedgeOdd, idealStake, bettingType);
        const computed = computeCashoutStake(marketOutcomes, hedgeOdd, hedgeSide, bettingType, minBet, Infinity);

        candidates.push({
          hedgeRunner: position.runner,
          hedgeOdd,
          hedgeSide,
          hedgeStake,
          idealStake: round2(idealStake),
          lockedPL: simulation.minPL,
          displayPL: simulation.firstRunnerPL,
          postBetOutcomes: simulation.outcomeMap,
          computedLockedPL: computed.lockedPL
        });
      } catch (error) {
        rejectedReasons.push({ reason: error.message });
      }
    };

    addCandidate(worst, 'back');
    addCandidate(best, 'lay');

    if (!candidates.length) {
      if (rejectedReasons.length) {
        return { available: false, reason: rejectedReasons[0].reason };
      }
      return { available: false, reason: 'No hedge odds available' };
    }

    const selected = candidates.reduce((bestCandidate, candidate) => (
      candidate.lockedPL > bestCandidate.lockedPL ? candidate : bestCandidate
    ), candidates[0]);

    return {
      available: true,
      worstOutcome: round2(worst.amount),
      bestOutcome: round2(best.amount),
      hedgeRunner: selected.hedgeRunner,
      hedgeOdd: selected.hedgeOdd,
      hedgeSide: selected.hedgeSide,
      hedgeStake: selected.hedgeStake,
      idealStake: selected.idealStake,
      lockedPL: selected.lockedPL,
      displayPL: selected.displayPL,
      postBetOutcomes: selected.postBetOutcomes
    };
  };

  const executeCashout = async ({
    marketId,
    runners,
    outcomes,
    eventId,
    eventTypeId,
    eventName,
    minBet,
    maxBet,
    bettingType = 'ODDS'
  }) => {
    if (isProcessing.value) {
      return { success: false, error: 'Already processing' };
    }

    try {
      isProcessing.value = true;

      const freshOutcomes = outcomes || betStore.betOutcomes;
      const availability = isCashoutAvailable(
        marketId,
        runners,
        freshOutcomes,
        true,
        minBet,
        maxBet,
        bettingType
      );

      if (!availability.available) {
        return { success: false, error: availability.reason };
      }

      const {
        hedgeRunner,
        hedgeOdd,
        hedgeSide,
        hedgeStake,
        lockedPL,
        displayPL,
        bestOutcome,
        worstOutcome
      } = availability;

      await betStore.handleSelectBet({
        odd: hedgeOdd,
        backOrLay: hedgeSide,
        runnerId: hedgeRunner.selection_id || hedgeRunner.selectionId || hedgeRunner.id,
        runnerName: hedgeRunner.name || 'Hedge',
        marketId,
        eventId,
        type: 'MO',
        marketTypeName: 'Cashout Hedge',
        minAmount: minBet,
        maxAmount: maxBet,
        betting_type: bettingType,
        skipOneClick: true,
        isCashoutHedge: true
      }, eventTypeId, eventName, runners.length);

      await new Promise((resolve) => setTimeout(resolve, 50));
      betStore.bet.stake = Number(Number(availability.idealStake ?? hedgeStake).toFixed(2));

      return {
        success: true,
        worstOutcome,
        bestOutcome,
        hedgeStake,
        hedgeOdd,
        hedgeSide,
        hedgeRunner,
        lockedPL,
        displayPL
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to execute cashout'
      };
    } finally {
      isProcessing.value = false;
    }
  };

  const isLossCutAvailable = (
    marketId,
    runners,
    outcomes,
    betAllow = true,
    minBet = 0,
    maxBet = Infinity,
    bettingType = 'ODDS'
  ) => {
    if (!betAllow) return { available: false, reason: 'Betting not allowed' };
    if (!outcomes || !marketId) return { available: false, reason: 'No outcomes data' };

    const positionData = getTwoRunnerPositions(marketId, runners, outcomes);
    if (positionData.error) return { available: false, reason: positionData.error };

    const { positions, marketOutcomes } = positionData;
    const positive = positions.find((position) => position.amount > 0);
    const negative = positions.find((position) => position.amount < 0);

    if (!positive || !negative) {
      return { available: false, reason: 'Loss cut requires one winning and one losing exposure' };
    }

    const loss = Math.abs(negative.amount);
    const rejectedReasons = [];

    const buildCandidate = (position, hedgeSide, hedgeOdd, idealStake) => {
      /* istanbul ignore if -- positions are built only from complete two-runner market data. */
      if (!position?.runner) return null;
      if (!isRunnerActive(position.runner)) return null;
      /* istanbul ignore if -- callers validate odds before building a loss-cut candidate. */
      if (!isValidOdds(hedgeOdd, bettingType)) return null;

      try {
        const hedgeStake = applyStakeLimits(idealStake, minBet, maxBet);
        if (hedgeStake <= 0) return null;

        const simulation = simulateHedge(positions, position.runner, hedgeSide, hedgeOdd, hedgeStake, bettingType);
        const isNonNegative = simulation.positions.every((postPosition) => postPosition.amount >= -NON_NEGATIVE_EPS);
        if (!isNonNegative) return null;

        const computed = computeLossCutStake(marketOutcomes, hedgeOdd, bettingType, hedgeSide, minBet, maxBet);

        return {
          hedgeRunner: position.runner,
          hedgeOdd,
          hedgeSide,
          hedgeStake,
          idealStake: round2(idealStake),
          lockedPL: simulation.maxPL,
          displayPL: simulation.maxPL,
          postBetOutcomes: simulation.outcomeMap,
          computedLockedPL: computed.lockedPL
        };
      } catch (error) {
        rejectedReasons.push({ reason: error.message });
        return null;
      }
    };

    const layOdd = getHedgeOdd(positive.runner, 'lay');
    const layThreshold = isDigitBettingType(bettingType)
      ? positive.amount * 100 / loss
      : 1 + positive.amount / loss;
    if (isValidOdds(layOdd, bettingType) && layOdd <= layThreshold) {
      const layCandidate = buildCandidate(positive, 'lay', layOdd, loss);
      if (layCandidate) {
        return {
          available: true,
          worstOutcome: round2(negative.amount),
          bestOutcome: round2(positive.amount),
          ...layCandidate
        };
      }
    }

    const backOdd = getHedgeOdd(negative.runner, 'back');
    const backThreshold = isDigitBettingType(bettingType)
      ? loss * 100 / positive.amount
      : 1 + loss / positive.amount;
    if (isValidOdds(backOdd, bettingType) && backOdd >= backThreshold) {
      const idealStake = calculateBackLossCutIdealStake(negative.amount, backOdd, bettingType);
      const backCandidate = buildCandidate(negative, 'back', backOdd, idealStake);
      if (backCandidate) {
        return {
          available: true,
          worstOutcome: round2(negative.amount),
          bestOutcome: round2(positive.amount),
          ...backCandidate
        };
      }
    }

    if (rejectedReasons.length) {
      return { available: false, reason: rejectedReasons[0].reason };
    }

    return { available: false, reason: 'No valid loss cut hedge available' };
  };

  const executeLossCut = async ({
    marketId,
    runners,
    outcomes,
    eventId,
    eventTypeId,
    eventName,
    minBet,
    maxBet,
    bettingType = 'ODDS'
  }) => {
    if (isProcessing.value) {
      return { success: false, error: 'Already processing' };
    }

    try {
      isProcessing.value = true;

      const freshOutcomes = outcomes || betStore.betOutcomes;
      const availability = isLossCutAvailable(
        marketId,
        runners,
        freshOutcomes,
        true,
        minBet,
        maxBet,
        bettingType
      );

      if (!availability.available) {
        return { success: false, error: availability.reason };
      }

      const {
        hedgeRunner,
        hedgeOdd,
        hedgeSide,
        hedgeStake,
        lockedPL,
        displayPL,
        bestOutcome,
        worstOutcome
      } = availability;

      await betStore.handleSelectBet({
        odd: hedgeOdd,
        backOrLay: hedgeSide,
        runnerId: hedgeRunner.selection_id || hedgeRunner.selectionId || hedgeRunner.id,
        runnerName: hedgeRunner.name || 'Hedge',
        marketId,
        eventId,
        type: 'MO',
        marketTypeName: 'Loss Cut Hedge',
        minAmount: minBet,
        maxAmount: maxBet,
        betting_type: bettingType,
        skipOneClick: true
      }, eventTypeId, eventName, runners.length);

      await new Promise((resolve) => setTimeout(resolve, 50));
      betStore.bet.stake = hedgeStake;

      return {
        success: true,
        worstOutcome,
        bestOutcome,
        hedgeStake,
        hedgeOdd,
        hedgeSide,
        hedgeRunner,
        lockedPL,
        displayPL
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to execute loss cut'
      };
    } finally {
      isProcessing.value = false;
    }
  };

  const isSpeedCashAvailable = (
    marketId,
    runners,
    outcomes,
    eventTypeId = null,
    providerIdOrEvent = null
  ) => {
    if (!outcomes || !marketId) {
      return { available: false, reason: 'No outcomes data' };
    }

    const eventType = Number(eventTypeId);
    if (eventType === 1 || eventType === 2) {
      return { available: false, reason: 'Not available for Soccer or Tennis' };
    }

    const isVirtual = typeof providerIdOrEvent === 'object'
      ? isVirtualEvent(providerIdOrEvent)
      : Number(providerIdOrEvent) === 5 || isVirtualEvent({ provider_id: providerIdOrEvent });

    if (isVirtual) {
      return { available: false, reason: 'Not available for virtual events' };
    }

    const positionData = getTwoRunnerPositions(marketId, runners, outcomes);
    if (positionData.error) {
      return { available: false, reason: positionData.error };
    }

    const { positions } = positionData;
    const exposureA = round2(positions[0].amount);
    const exposureB = round2(positions[1].amount);

    if (exposureA < SPEED_CASH_MIN_EXPOSURE || exposureB < SPEED_CASH_MIN_EXPOSURE) {
      return {
        available: false,
        reason: `Requires at least ${SPEED_CASH_MIN_EXPOSURE} on both runners`
      };
    }

    if (Math.abs(exposureA - exposureB) > SPEED_CASH_MAX_DIFF) {
      return {
        available: false,
        reason: `Exposures must be within ${SPEED_CASH_MAX_DIFF}`
      };
    }

    const grossWin = Math.min(exposureA, exposureB);
    const adminFee = round2((grossWin * SPEED_CASH_FEE_PERCENT) / 100);
    const netProfit = round2(grossWin - adminFee);

    return {
      available: true,
      exposureA,
      exposureB,
      grossWin,
      adminFee,
      netProfit,
      estimatedPayout: netProfit,
      feePercent: SPEED_CASH_FEE_PERCENT
    };
  };

  const executeSpeedCash = async ({ marketId, eventId }) => {
    if (isProcessing.value) {
      return { success: false, error: 'Already processing' };
    }

    try {
      isProcessing.value = true;

      const response = await speedCashApi(marketId);
      const payload = response?.data?.data ?? response?.data ?? response;

      const { updateFromResponse } = useWallet();
      updateFromResponse(response);

      if (eventId) {
        await betStore.refreshBetHistory(eventId);
      }

      return {
        success: true,
        ...payload
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to execute Speed Cash';
      return {
        success: false,
        error: message
      };
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    isProcessing: computed(() => isProcessing.value),
    getMarketOutcomes,
    getWorstOutcome,
    getBestOutcome,
    findRunnerById,
    computeCashoutStake,
    computeLossCutStake,
    isCashoutAvailable,
    executeCashout,
    isLossCutAvailable,
    executeLossCut,
    isSpeedCashAvailable,
    executeSpeedCash,
    startSpeedCashCooldown,
    getSpeedCashCooldownSeconds,
    SPEED_CASH_MIN_EXPOSURE,
    SPEED_CASH_MAX_DIFF,
    SPEED_CASH_FEE_PERCENT,
    SPEED_CASH_COOLDOWN_MS,
    CASHOUT_MAX_ODD
  };
}
