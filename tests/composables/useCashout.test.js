const mockBetStore = {
  betOutcomes: {},
  bet: {},
  handleSelectBet: jest.fn()
};

jest.mock('@/stores/bet', () => ({
  useBetStore: jest.fn(() => mockBetStore)
}));

import useCashout from '@/composables/useCashout';
import { formulas } from '@/composables/PayoutCalculators/Formulas';

const makeRunners = (overrides = {}) => {
  const runnerA = {
    id: 'A',
    selection_id: 'A',
    name: 'Runner A',
    status: 'ACTIVE',
    back: [{ price: 2 }],
    lay: [{ price: 2 }],
    ...overrides.A
  };

  const runnerB = {
    id: 'B',
    selection_id: 'B',
    name: 'Runner B',
    status: 'ACTIVE',
    back: [{ price: 2 }],
    lay: [{ price: 2 }],
    ...overrides.B
  };

  return [runnerA, runnerB];
};

const marketOutcomes = (runnerA, runnerB, marketId = 'market1') => ({
  [marketId]: {
    A: runnerA,
    B: runnerB
  }
});

const executeParams = (overrides = {}) => ({
  marketId: 'market1',
  runners: makeRunners(),
  outcomes: marketOutcomes(500, 200),
  eventId: 'event1',
  eventTypeId: 4,
  eventName: 'Runner A v Runner B',
  minBet: 0,
  maxBet: Infinity,
  bettingType: 'ODDS',
  ...overrides
});

describe('useCashout', () => {
  beforeEach(() => {
    mockBetStore.betOutcomes = {};
    mockBetStore.bet = {};
    mockBetStore.handleSelectBet = jest.fn().mockResolvedValue();
  });

  describe('market exposure helpers', () => {
    it('returns market outcomes, best outcome, worst outcome, and matching runners by any supported id', () => {
      const cashout = useCashout();
      const runners = makeRunners({
        A: { selection_id: undefined, selectionId: 'selection-a', id: 'internal-a' },
        B: { selection_id: undefined, runner_id: 'runner-b', id: 'internal-b' }
      });
      const outcomes = {
        market1: {
          'selection-a': 120,
          'runner-b': -80,
          ignored: 'not-a-number'
        }
      };

      expect(cashout.getMarketOutcomes('market1', outcomes)).toEqual(outcomes.market1);
      expect(cashout.getMarketOutcomes(null, outcomes)).toEqual({});
      expect(cashout.getWorstOutcome('market1', outcomes)).toEqual({ runnerId: 'runner-b', amount: -80 });
      expect(cashout.getBestOutcome('market1', outcomes)).toEqual({ runnerId: 'selection-a', amount: 120 });
      expect(cashout.getWorstOutcome('market1', { market1: { A: 120, B: 130 } })).toEqual({ runnerId: 'A', amount: 120 });
      expect(cashout.getBestOutcome('market1', { market1: { A: 120, B: 130 } })).toEqual({ runnerId: 'B', amount: 130 });
      expect(cashout.getWorstOutcome('missing', outcomes)).toEqual({ runnerId: null, amount: 0 });
      expect(cashout.getBestOutcome('missing', outcomes)).toEqual({ runnerId: null, amount: 0 });
      expect(cashout.findRunnerById(runners, 'runner-b')).toBe(runners[1]);
      expect(cashout.findRunnerById([], 'runner-b')).toBeNull();
      expect(cashout.findRunnerById([null], 'runner-b')).toBeNull();
    });

    it('reads outcomes and odds from fallback runner fields', () => {
      const cashout = useCashout();
      const runners = [
        {
          name: 'Runner A',
          status: 'ACTIVE',
          key: 'runner-a',
          priceLay: 1.5
        },
        {
          name: 'Runner B',
          status: 'ACTIVE',
          values: ['runner-b', null, null, null, null, null, 2]
        }
      ];
      const outcomes = {
        market1: {
          'runner-a': 500,
          'runner-b': 200
        }
      };

      const result = cashout.isCashoutAvailable('market1', runners, outcomes, true);

      expect(result.available).toBe(true);
      expect(result.hedgeRunner).toBe(runners[0]);
      expect(result.hedgeSide).toBe('lay');
      expect(result.hedgeOdd).toBe(1.5);
      expect(result.hedgeStake).toBe(200);
      expect(result.postBetOutcomes).toEqual({ 'runner-a': 400, 'runner-b': 400 });
    });

    it('falls back to values[8] for lay odds', () => {
      const cashout = useCashout();
      const runners = [
        {
          name: 'Runner A',
          status: 'ACTIVE',
          values: ['runner-a', null, null, null, null, null, null, null, 1.5]
        },
        {
          name: 'Runner B',
          status: 'ACTIVE',
          values: ['runner-b', null, null, null, null, null, 2]
        }
      ];
      const outcomes = {
        market1: {
          'runner-a': 500,
          'runner-b': 200
        }
      };

      const result = cashout.isCashoutAvailable('market1', runners, outcomes, true);

      expect(result.available).toBe(true);
      expect(result.hedgeRunner).toBe(runners[0]);
      expect(result.hedgeSide).toBe('lay');
      expect(result.hedgeOdd).toBe(1.5);
    });

    it('handles runners without identifiers as incomplete exposure data', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        [
          { name: 'Runner A', status: 'ACTIVE', back: [{ price: 2 }], lay: [{ price: 2 }] },
          { name: 'Runner B', status: 'ACTIVE', back: [{ price: 2 }], lay: [{ price: 2 }] }
        ],
        { market1: { A: 500, B: 200 } },
        true
      );

      expect(result).toEqual({ available: false, reason: 'Exposure data incomplete' });
    });

    it('handles missing runner objects as incomplete exposure data', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        [
          undefined,
          { id: 'B', selection_id: 'B', name: 'Runner B', status: 'ACTIVE', back: [{ price: 2 }], lay: [{ price: 2 }] }
        ],
        { market1: { B: 200 } },
        true
      );

      expect(result).toEqual({ available: false, reason: 'Exposure data incomplete' });
    });
  });

  describe('cashout calculations', () => {
    it('allows regular cashout when both outcomes are positive but imbalanced', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        makeRunners(),
        marketOutcomes(500, 200),
        true,
        0,
        Infinity,
        'ODDS'
      );

      expect(result.available).toBe(true);
      expect(result.hedgeSide).toBe('back');
      expect(result.hedgeRunner.selection_id).toBe('B');
      expect(result.hedgeStake).toBe(150);
      expect(result.lockedPL).toBe(350);
      expect(result.displayPL).toBe(350);
      expect(result.postBetOutcomes).toEqual({ A: 350, B: 350 });
    });

    it('allows regular cashout when both outcomes are negative but imbalanced', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        makeRunners(),
        marketOutcomes(-200, -500),
        true,
        0,
        Infinity,
        'ODDS'
      );

      expect(result.available).toBe(true);
      expect(result.hedgeSide).toBe('back');
      expect(result.hedgeRunner.selection_id).toBe('B');
      expect(result.hedgeStake).toBe(150);
      expect(result.lockedPL).toBe(-350);
      expect(result.displayPL).toBe(-350);
      expect(result.postBetOutcomes).toEqual({ A: -350, B: -350 });
    });

    it('clamps cashout stake to market minimum and simulates the constrained result', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        makeRunners(),
        marketOutcomes(500, 200),
        true,
        200,
        Infinity,
        'ODDS'
      );

      expect(result.available).toBe(true);
      expect(result.idealStake).toBe(150);
      expect(result.hedgeStake).toBe(200);
      expect(result.lockedPL).toBe(300);
      expect(result.displayPL).toBe(300);
      expect(result.postBetOutcomes).toEqual({ A: 300, B: 400 });
    });

    it('clamps cashout stake to market maximum', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        makeRunners(),
        marketOutcomes(500, 200),
        true,
        0,
        100,
        'ODDS'
      );

      expect(result.available).toBe(true);
      expect(result.idealStake).toBe(150);
      expect(result.hedgeStake).toBe(100);
      expect(result.lockedPL).toBe(300);
      expect(result.postBetOutcomes).toEqual({ A: 400, B: 300 });
    });

    it('selects the candidate with the best worst-case outcome', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        makeRunners({
          A: { lay: [{ price: 1.5 }] },
          B: { back: [{ price: 2 }] }
        }),
        marketOutcomes(500, 200),
        true,
        0,
        Infinity,
        'ODDS'
      );

      expect(result.available).toBe(true);
      expect(result.hedgeSide).toBe('lay');
      expect(result.hedgeRunner.selection_id).toBe('A');
      expect(result.hedgeStake).toBe(200);
      expect(result.lockedPL).toBe(400);
      expect(result.postBetOutcomes).toEqual({ A: 400, B: 400 });
    });

    it('computes direct cashout stakes for back, lay, balanced, clamped, and digit markets', () => {
      const cashout = useCashout();

      expect(cashout.computeCashoutStake({ A: 500, B: 200 }, 2, 'back')).toEqual({
        stake: 150,
        lockedPL: 350,
        idealStake: 150
      });
      expect(cashout.computeCashoutStake({ A: 500, B: 200 }, 1.5, 'lay')).toEqual({
        stake: 200,
        lockedPL: 400,
        idealStake: 200
      });
      expect(cashout.computeCashoutStake({ A: 100, B: 100.005 }, 2, 'back')).toEqual({
        stake: 0,
        lockedPL: 100
      });
      expect(cashout.computeCashoutStake({ A: 500, B: 200 }, 2, 'back', 'ODDS', 200, 500)).toEqual({
        stake: 200,
        lockedPL: 300,
        idealStake: 150
      });
      expect(cashout.computeCashoutStake({ A: 500, B: 200 }, 50, 'back', 'DIGIT')).toEqual({
        stake: 200,
        lockedPL: 300,
        idealStake: 200
      });
      expect(cashout.computeCashoutStake({ A: 500, B: 200 }, 2)).toEqual({
        stake: 150,
        lockedPL: 350,
        idealStake: 150
      });
      expect(cashout.computeCashoutStake({ A: 500, B: 200 }, 2, 'back', null)).toEqual({
        stake: 150,
        lockedPL: 350,
        idealStake: 150
      });
    });

    it('throws clear errors for invalid direct cashout calculations', () => {
      const cashout = useCashout();

      expect(() => cashout.computeCashoutStake(null, 2, 'back')).toThrow('No market outcomes provided');
      expect(() => cashout.computeCashoutStake({}, 2, 'back')).toThrow('No market outcomes provided');
      expect(() => cashout.computeCashoutStake({ A: 'bad' }, 2, 'back')).toThrow('No valid market outcomes provided');
      expect(() => cashout.computeCashoutStake({ A: 500, B: 200 }, 1, 'back')).toThrow('Invalid hedge odds for ODDS');
      expect(() => cashout.computeCashoutStake({ A: 500, B: 200 }, 'bad', 'back')).toThrow('Invalid hedge odds for ODDS');
      expect(() => cashout.computeCashoutStake({ A: 500, B: 200 }, 0, 'back', 'DIGIT')).toThrow('Invalid hedge odds for DIGIT');
      expect(() => cashout.computeCashoutStake({ A: 500, B: 200 }, 2, 'back', 'ODDS', 200, 100)).toThrow('Invalid stake limits');
    });
  });

  describe('cashout availability guardrails', () => {
    it('blocks cashout when betting is disallowed or outcomes are missing', () => {
      const cashout = useCashout();

      expect(cashout.isCashoutAvailable('market1', makeRunners(), marketOutcomes(500, 200), false)).toEqual({
        available: false,
        reason: 'Betting not allowed'
      });
      expect(cashout.isCashoutAvailable(null, makeRunners(), marketOutcomes(500, 200), true)).toEqual({
        available: false,
        reason: 'No outcomes data'
      });
      expect(cashout.isCashoutAvailable('market1', makeRunners(), null, true)).toEqual({
        available: false,
        reason: 'No outcomes data'
      });
    });

    it('requires exactly two runners and complete exposure data', () => {
      const cashout = useCashout();
      const threeRunners = [
        ...makeRunners(),
        {
          id: 'C',
          selection_id: 'C',
          name: 'Runner C',
          status: 'ACTIVE',
          back: [{ price: 2 }],
          lay: [{ price: 2 }]
        }
      ];

      expect(cashout.isCashoutAvailable('market1', threeRunners, { market1: { A: 500, B: 200, C: -100 } }, true)).toEqual({
        available: false,
        reason: 'Feature requires exactly 2 runners'
      });
      expect(cashout.isCashoutAvailable('market1', makeRunners(), { market1: {} }, true)).toEqual({
        available: false,
        reason: 'No market outcomes'
      });
      expect(cashout.isCashoutAvailable('market1', makeRunners(), { market1: { A: 500 } }, true)).toEqual({
        available: false,
        reason: 'Exposure data incomplete'
      });
    });

    it('blocks cashout when exposure difference is too small', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        makeRunners(),
        marketOutcomes(100, 100.1),
        true
      );

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Exposure difference too small');
    });

    it('handles the mirrored cashout ordering where the second runner is stronger', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        makeRunners({
          A: { back: [{ price: 2 }] },
          B: { lay: [{ price: 1.5 }] }
        }),
        marketOutcomes(200, 500),
        true
      );

      expect(result.available).toBe(true);
      expect(result.hedgeSide).toBe('lay');
      expect(result.hedgeRunner.selection_id).toBe('B');
      expect(result.postBetOutcomes).toEqual({ A: 400, B: 400 });
    });

    it('treats runners with no status as active for cashout', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        makeRunners({
          A: { status: undefined, lay: [{ price: 1.5 }] },
          B: { status: undefined }
        }),
        marketOutcomes(500, 200),
        true
      );

      expect(result.available).toBe(true);
      expect(result.hedgeSide).toBe('lay');
    });

    it('blocks cashout when hedge odds exceed the maximum allowed odd', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        makeRunners({
          A: { back: [{ price: 2.5 }], lay: [{ price: 2.5 }] },
          B: { back: [{ price: 2.5 }], lay: [{ price: 2.5 }] }
        }),
        marketOutcomes(500, 200),
        true
      );

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Hedge odds exceed maximum of 2');
    });

    it('allows cashout when hedge odds are exactly the maximum allowed odd', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        makeRunners({
          A: { back: [{ price: 2 }], lay: [{ price: 2 }] },
          B: { back: [{ price: 2 }], lay: [{ price: 2 }] }
        }),
        marketOutcomes(500, 200),
        true
      );

      expect(result.available).toBe(true);
      expect(result.hedgeOdd).toBe(2);
    });

    it('blocks cashout when hedge odds exceed max odd before stake rounding is considered', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        makeRunners({
          A: { lay: [{ price: 10000 }] },
          B: { back: [{ price: 10000 }] }
        }),
        marketOutcomes(100, 99.89),
        true
      );

      expect(result).toEqual({ available: false, reason: 'Hedge odds exceed maximum of 2' });
    });

    it('blocks cashout when no active runner has valid hedge odds', () => {
      const cashout = useCashout();

      expect(cashout.isCashoutAvailable(
        'market1',
        makeRunners({
          A: { status: 'SUSPENDED' },
          B: { status: 'REMOVED' }
        }),
        marketOutcomes(500, 200),
        true
      )).toEqual({ available: false, reason: 'No hedge odds available' });

      expect(cashout.isCashoutAvailable(
        'market1',
        makeRunners({
          A: { lay: [{ price: 1 }] },
          B: { back: [{ price: 0 }] }
        }),
        marketOutcomes(500, 200),
        true
      )).toEqual({ available: false, reason: 'No hedge odds available' });
    });

    it('blocks cashout when rounded hedge stake would be zero', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        makeRunners({
          A: { lay: [{ price: 10000 }] },
          B: { back: [{ price: 10000 }] }
        }),
        marketOutcomes(100, 99.89),
        true
      );

      expect(result).toEqual({ available: false, reason: 'No hedge odds available' });
    });

    it('uses the default cashout betAllow argument', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable('market1', makeRunners(), marketOutcomes(500, 200));

      expect(result.available).toBe(true);
      expect(result.hedgeStake).toBe(150);
    });

    it('returns the rejected stake-limit reason when candidate construction throws', () => {
      const cashout = useCashout();
      const result = cashout.isCashoutAvailable(
        'market1',
        makeRunners(),
        marketOutcomes(500, 200),
        true,
        200,
        100,
        'ODDS'
      );

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Invalid stake limits: minimum 200 exceeds maximum 100');
    });
  });

  describe('loss cut calculations', () => {
    it('uses the preferred loss cut path by laying the positive runner first', () => {
      const cashout = useCashout();
      const result = cashout.isLossCutAvailable(
        'market1',
        makeRunners({ A: { lay: [{ price: 1.5 }] } }),
        marketOutcomes(300, -120),
        true,
        0,
        Infinity,
        'ODDS'
      );

      expect(result.available).toBe(true);
      expect(result.hedgeSide).toBe('lay');
      expect(result.hedgeRunner.selection_id).toBe('A');
      expect(result.hedgeStake).toBe(120);
      expect(result.displayPL).toBe(240);
      expect(result.postBetOutcomes).toEqual({ A: 240, B: 0 });
    });

    it('uses the preferred loss cut path when the second runner is positive', () => {
      const cashout = useCashout();
      const result = cashout.isLossCutAvailable(
        'market1',
        makeRunners({ B: { lay: [{ price: 1.79 }] } }),
        marketOutcomes(-500, 500),
        true,
        0,
        Infinity,
        'ODDS'
      );

      expect(result.available).toBe(true);
      expect(result.hedgeSide).toBe('lay');
      expect(result.hedgeRunner.selection_id).toBe('B');
      expect(result.hedgeStake).toBe(500);
      expect(result.displayPL).toBe(105);
      expect(result.postBetOutcomes).toEqual({ A: 0, B: 105 });
    });

    it('falls back to backing the negative runner when the lay path is not valid', () => {
      const cashout = useCashout();
      const result = cashout.isLossCutAvailable(
        'market1',
        makeRunners({
          A: { lay: [{ price: 5 }] },
          B: { back: [{ price: 2.5 }] }
        }),
        marketOutcomes(300, -120),
        true,
        0,
        Infinity,
        'ODDS'
      );

      expect(result.available).toBe(true);
      expect(result.hedgeSide).toBe('back');
      expect(result.hedgeRunner.selection_id).toBe('B');
      expect(result.hedgeStake).toBe(80);
      expect(result.displayPL).toBe(220);
      expect(result.postBetOutcomes).toEqual({ A: 220, B: 0 });
    });

    it('rejects loss cut candidates when clamped stake would leave a negative exposure', () => {
      const cashout = useCashout();
      const result = cashout.isLossCutAvailable(
        'market1',
        makeRunners({
          A: { lay: [{ price: 1.5 }] },
          B: { back: [{ price: 1 }] }
        }),
        marketOutcomes(300, -120),
        true,
        0,
        100,
        'ODDS'
      );

      expect(result.available).toBe(false);
      expect(result.reason).toBe('No valid loss cut hedge available');
    });

    it('computes direct loss cut stakes for lay, back, non-mixed, clamped, and digit markets', () => {
      const cashout = useCashout();

      expect(cashout.computeLossCutStake({ A: 300, B: -120 }, 1.5, 'ODDS', 'lay')).toEqual({
        stake: 120,
        lockedPL: 240,
        idealStake: 120
      });
      expect(cashout.computeLossCutStake({ A: 300, B: -120 }, 2.5, 'ODDS', 'back')).toEqual({
        stake: 80,
        lockedPL: 220,
        idealStake: 80
      });
      expect(cashout.computeLossCutStake({ A: 500, B: 200 }, 2, 'ODDS', 'back')).toEqual({
        stake: 0,
        lockedPL: 200
      });
      expect(cashout.computeLossCutStake({ A: 300, B: -120 }, 2.5, 'ODDS', 'back', 100, 500)).toEqual({
        stake: 100,
        lockedPL: 200,
        idealStake: 80
      });
      expect(cashout.computeLossCutStake({ A: 300, B: -120 }, 60, 'DIGIT', 'back')).toEqual({
        stake: 200,
        lockedPL: 100,
        idealStake: 200
      });
      expect(cashout.computeLossCutStake({ A: 300, B: -120 }, 2.5)).toEqual({
        stake: 80,
        lockedPL: 220,
        idealStake: 80
      });
      expect(cashout.computeLossCutStake({ A: 300, B: -120 }, 2.5, null, null)).toEqual({
        stake: 80,
        lockedPL: 220,
        idealStake: 80
      });
    });

    it('throws clear errors for invalid direct loss cut calculations', () => {
      const cashout = useCashout();

      expect(() => cashout.computeLossCutStake(null, 2, 'ODDS', 'back')).toThrow('No market outcomes provided');
      expect(() => cashout.computeLossCutStake({}, 2, 'ODDS', 'back')).toThrow('No market outcomes provided');
      expect(() => cashout.computeLossCutStake({ A: 300, B: -120 }, 1, 'ODDS', 'back')).toThrow('Invalid hedge odds for ODDS');
      expect(() => cashout.computeLossCutStake({ A: 300, B: -120 }, 'bad', 'ODDS', 'back')).toThrow('Invalid hedge odds for ODDS');
      expect(() => cashout.computeLossCutStake({ A: 300, B: -120 }, 0, 'DIGIT', 'back')).toThrow('Invalid hedge odds for DIGIT');
      expect(() => cashout.computeLossCutStake({ A: 300, B: -120 }, 2.5, 'ODDS', 'back', 200, 100)).toThrow('Invalid stake limits');
    });
  });

  describe('loss cut availability guardrails', () => {
    it('blocks loss cut when betting is disallowed or outcomes are missing', () => {
      const cashout = useCashout();

      expect(cashout.isLossCutAvailable('market1', makeRunners(), marketOutcomes(300, -120), false)).toEqual({
        available: false,
        reason: 'Betting not allowed'
      });
      expect(cashout.isLossCutAvailable(null, makeRunners(), marketOutcomes(300, -120), true)).toEqual({
        available: false,
        reason: 'No outcomes data'
      });
      expect(cashout.isLossCutAvailable('market1', makeRunners(), null, true)).toEqual({
        available: false,
        reason: 'No outcomes data'
      });
    });

    it('requires exactly two runners, complete exposure data, and one positive plus one negative exposure', () => {
      const cashout = useCashout();

      expect(cashout.isLossCutAvailable('market1', [], marketOutcomes(300, -120), true)).toEqual({
        available: false,
        reason: 'Feature requires exactly 2 runners'
      });
      expect(cashout.isLossCutAvailable('market1', makeRunners(), { market1: {} }, true)).toEqual({
        available: false,
        reason: 'No market outcomes'
      });
      expect(cashout.isLossCutAvailable('market1', makeRunners(), { market1: { A: 300 } }, true)).toEqual({
        available: false,
        reason: 'Exposure data incomplete'
      });
      expect(cashout.isLossCutAvailable('market1', makeRunners(), marketOutcomes(500, 200), true)).toEqual({
        available: false,
        reason: 'Loss cut requires one winning and one losing exposure'
      });
    });

    it('blocks loss cut when thresholds, odds, or runner status do not allow a valid solution', () => {
      const cashout = useCashout();

      expect(cashout.isLossCutAvailable(
        'market1',
        makeRunners({
          A: { lay: [{ price: 2 }] },
          B: { back: [{ price: 2 }] }
        }),
        marketOutcomes(100, -500),
        true
      )).toEqual({ available: false, reason: 'No valid loss cut hedge available' });

      expect(cashout.isLossCutAvailable(
        'market1',
        makeRunners({
          A: { status: 'SUSPENDED', lay: [{ price: 1.5 }] },
          B: { back: [{ price: 1 }] }
        }),
        marketOutcomes(300, -120),
        true
      )).toEqual({ available: false, reason: 'No valid loss cut hedge available' });
    });

    it('blocks loss cut when the preferred positive runner is inactive', () => {
      const cashout = useCashout();
      const result = cashout.isLossCutAvailable(
        'market1',
        makeRunners({
          A: { status: 'BALL_RUNNING', lay: [{ price: 1.5 }] },
          B: { back: [{ price: 1 }] }
        }),
        marketOutcomes(300, -120),
        true
      );

      expect(result).toEqual({ available: false, reason: 'No valid loss cut hedge available' });
    });

    it('blocks loss cut when rounded preferred stake would be zero', () => {
      const cashout = useCashout();
      const result = cashout.isLossCutAvailable(
        'market1',
        makeRunners({ A: { lay: [{ price: 1.001 }] } }),
        marketOutcomes(100, -0.001),
        true
      );

      expect(result).toEqual({ available: false, reason: 'No valid loss cut hedge available' });
    });

    it('blocks loss cut when fallback threshold passes but the simulated result remains negative', () => {
      const cashout = useCashout();
      const result = cashout.isLossCutAvailable(
        'market1',
        makeRunners({
          A: { lay: [{ price: 5 }] },
          B: { back: [{ price: 2.5 }] }
        }),
        marketOutcomes(300, -120),
        true,
        0,
        50,
        'ODDS'
      );

      expect(result).toEqual({ available: false, reason: 'No valid loss cut hedge available' });
    });

    it('uses the default loss cut betAllow argument', () => {
      const cashout = useCashout();
      const result = cashout.isLossCutAvailable(
        'market1',
        makeRunners({ A: { lay: [{ price: 1.5 }] } }),
        marketOutcomes(300, -120)
      );

      expect(result.available).toBe(true);
      expect(result.hedgeStake).toBe(120);
    });

    it('returns the rejected stake-limit reason when loss cut candidate construction throws', () => {
      const cashout = useCashout();
      const result = cashout.isLossCutAvailable(
        'market1',
        makeRunners({
          A: { lay: [{ price: 1.5 }] },
          B: { back: [{ price: 1 }] }
        }),
        marketOutcomes(300, -120),
        true,
        200,
        100,
        'ODDS'
      );

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Invalid stake limits: minimum 200 exceeds maximum 100');
    });

    it('supports loss cut threshold and stake calculations for DIGIT markets', () => {
      const cashout = useCashout();
      const result = cashout.isLossCutAvailable(
        'market1',
        makeRunners({ A: { lay: [{ price: 50 }] } }),
        marketOutcomes(300, -120),
        true,
        0,
        Infinity,
        'DIGIT'
      );

      expect(result.available).toBe(true);
      expect(result.hedgeSide).toBe('lay');
      expect(result.hedgeStake).toBe(120);
      expect(result.displayPL).toBe(240);
      expect(result.postBetOutcomes).toEqual({ A: 240, B: 0 });
    });

    it('supports DIGIT fallback by backing the negative runner', () => {
      const cashout = useCashout();
      const result = cashout.isLossCutAvailable(
        'market1',
        makeRunners({
          A: { lay: [{ price: 400 }] },
          B: { back: [{ price: 60 }] }
        }),
        marketOutcomes(300, -120),
        true,
        0,
        Infinity,
        'DIGIT'
      );

      expect(result.available).toBe(true);
      expect(result.hedgeSide).toBe('back');
      expect(result.hedgeRunner.selection_id).toBe('B');
      expect(result.hedgeStake).toBe(200);
      expect(result.displayPL).toBe(100);
      expect(result.postBetOutcomes).toEqual({ A: 100, B: 0 });
    });
  });

  describe('execution helpers', () => {
    it('executes cashout by loading the calculated hedge into the bet store', async () => {
      const cashout = useCashout();

      const result = await cashout.executeCashout(executeParams());

      expect(result.success).toBe(true);
      expect(result.hedgeSide).toBe('back');
      expect(result.hedgeStake).toBe(150);
      expect(mockBetStore.handleSelectBet).toHaveBeenCalledWith(
        expect.objectContaining({
          odd: 2,
          backOrLay: 'back',
          runnerId: 'B',
          runnerName: 'Runner B',
          marketId: 'market1',
          eventId: 'event1',
          type: 'MO',
          marketTypeName: 'Cashout Hedge',
          skipOneClick: true
        }),
        4,
        'Runner A v Runner B',
        2
      );
      expect(mockBetStore.bet.stake).toBe(150);
      expect(cashout.isProcessing.value).toBe(false);
    });

    it('executes loss cut by loading the calculated hedge into the bet store', async () => {
      const cashout = useCashout();

      const result = await cashout.executeLossCut(executeParams({
        runners: makeRunners({ A: { lay: [{ price: 1.5 }] } }),
        outcomes: marketOutcomes(300, -120)
      }));

      expect(result.success).toBe(true);
      expect(result.hedgeSide).toBe('lay');
      expect(result.hedgeStake).toBe(120);
      expect(mockBetStore.handleSelectBet).toHaveBeenCalledWith(
        expect.objectContaining({
          odd: 1.5,
          backOrLay: 'lay',
          runnerId: 'A',
          runnerName: 'Runner A',
          marketId: 'market1',
          eventId: 'event1',
          type: 'MO',
          marketTypeName: 'Loss Cut Hedge',
          skipOneClick: true
        }),
        4,
        'Runner A v Runner B',
        2
      );
      expect(mockBetStore.bet.stake).toBe(120);
      expect(cashout.isProcessing.value).toBe(false);
    });

    it('uses stored bet outcomes when execute inputs omit outcomes', async () => {
      mockBetStore.betOutcomes = marketOutcomes(500, 200);
      const cashout = useCashout();

      const result = await cashout.executeCashout(executeParams({ outcomes: undefined }));

      expect(result.success).toBe(true);
      expect(result.hedgeStake).toBe(150);
    });

    it('uses stored bet outcomes when executeLossCut inputs omit outcomes', async () => {
      mockBetStore.betOutcomes = marketOutcomes(300, -120);
      const cashout = useCashout();

      const result = await cashout.executeLossCut(executeParams({
        runners: makeRunners({ A: { lay: [{ price: 1.5 }] } }),
        outcomes: undefined
      }));

      expect(result.success).toBe(true);
      expect(result.hedgeStake).toBe(120);
    });

    it('uses default execute params and selectionId/id runner fallbacks', async () => {
      const cashout = useCashout();
      const cashoutRunners = makeRunners({
        B: { id: undefined, selection_id: undefined, selectionId: 'selection-b' }
      });
      const cashoutResult = await cashout.executeCashout(executeParams({
        runners: cashoutRunners,
        outcomes: { market1: { A: 500, 'selection-b': 200 } },
        bettingType: undefined
      }));

      expect(cashoutResult.success).toBe(true);
      expect(mockBetStore.handleSelectBet).toHaveBeenLastCalledWith(
        expect.objectContaining({
          runnerId: 'selection-b',
          betting_type: 'ODDS'
        }),
        4,
        'Runner A v Runner B',
        2
      );

      mockBetStore.handleSelectBet.mockClear();
      const lossCutRunners = makeRunners({
        A: { selection_id: undefined, selectionId: undefined, id: 'id-a', lay: [{ price: 1.5 }] }
      });
      const lossCutResult = await cashout.executeLossCut(executeParams({
        runners: lossCutRunners,
        outcomes: { market1: { 'id-a': 300, B: -120 } },
        bettingType: undefined
      }));

      expect(lossCutResult.success).toBe(true);
      expect(mockBetStore.handleSelectBet).toHaveBeenLastCalledWith(
        expect.objectContaining({
          runnerId: 'id-a',
          betting_type: 'ODDS'
        }),
        4,
        'Runner A v Runner B',
        2
      );
    });

    it('uses id and fallback name for executeCashout hedge runners', async () => {
      const cashout = useCashout();
      const runners = makeRunners({
        B: {
          id: 'id-b',
          selection_id: undefined,
          selectionId: undefined,
          name: undefined
        }
      });

      const result = await cashout.executeCashout(executeParams({
        runners,
        outcomes: { market1: { A: 500, 'id-b': 200 } }
      }));

      expect(result.success).toBe(true);
      expect(mockBetStore.handleSelectBet).toHaveBeenLastCalledWith(
        expect.objectContaining({
          runnerId: 'id-b',
          runnerName: 'Hedge'
        }),
        4,
        'Runner A v Runner B',
        2
      );
    });

    it('uses fallback name for executeLossCut hedge runners', async () => {
      const cashout = useCashout();
      const runners = makeRunners({
        A: {
          name: undefined,
          lay: [{ price: 1.5 }]
        }
      });

      const result = await cashout.executeLossCut(executeParams({
        runners,
        outcomes: marketOutcomes(300, -120)
      }));

      expect(result.success).toBe(true);
      expect(mockBetStore.handleSelectBet).toHaveBeenLastCalledWith(
        expect.objectContaining({
          runnerId: 'A',
          runnerName: 'Hedge'
        }),
        4,
        'Runner A v Runner B',
        2
      );
    });

    it('returns unavailable reasons without selecting a bet', async () => {
      const cashout = useCashout();

      const cashoutResult = await cashout.executeCashout(executeParams({
        outcomes: marketOutcomes(100, 100)
      }));
      const lossCutResult = await cashout.executeLossCut(executeParams({
        outcomes: marketOutcomes(100, 100)
      }));

      expect(cashoutResult).toEqual({ success: false, error: 'Exposure difference too small' });
      expect(lossCutResult).toEqual({ success: false, error: 'Loss cut requires one winning and one losing exposure' });
      expect(mockBetStore.handleSelectBet).not.toHaveBeenCalled();
      expect(cashout.isProcessing.value).toBe(false);
    });

    it('prevents a second cashout execution while one is already processing', async () => {
      mockBetStore.handleSelectBet = jest.fn(() => new Promise((resolve) => setTimeout(resolve, 10)));
      const cashout = useCashout();

      const first = cashout.executeCashout(executeParams());
      const second = await cashout.executeCashout(executeParams());
      const firstResult = await first;

      expect(second).toEqual({ success: false, error: 'Already processing' });
      expect(firstResult.success).toBe(true);
      expect(cashout.isProcessing.value).toBe(false);
    });

    it('prevents a second loss cut execution while one is already processing', async () => {
      mockBetStore.handleSelectBet = jest.fn(() => new Promise((resolve) => setTimeout(resolve, 10)));
      const cashout = useCashout();
      const params = executeParams({
        runners: makeRunners({ A: { lay: [{ price: 1.5 }] } }),
        outcomes: marketOutcomes(300, -120)
      });

      const first = cashout.executeLossCut(params);
      const second = await cashout.executeLossCut(params);
      const firstResult = await first;

      expect(second).toEqual({ success: false, error: 'Already processing' });
      expect(firstResult.success).toBe(true);
      expect(cashout.isProcessing.value).toBe(false);
    });

    it('surfaces bet-store errors from executeCashout and resets processing', async () => {
      mockBetStore.handleSelectBet = jest.fn().mockRejectedValue(new Error('selection failed'));
      const cashout = useCashout();

      const result = await cashout.executeCashout(executeParams());

      expect(result).toEqual({ success: false, error: 'selection failed' });
      expect(cashout.isProcessing.value).toBe(false);
    });

    it('surfaces fallback errors from executeCashout and resets processing', async () => {
      mockBetStore.handleSelectBet = jest.fn().mockRejectedValue({});
      const cashout = useCashout();

      const result = await cashout.executeCashout(executeParams());

      expect(result).toEqual({ success: false, error: 'Failed to execute cashout' });
      expect(cashout.isProcessing.value).toBe(false);
    });

    it('surfaces fallback errors from executeLossCut and resets processing', async () => {
      mockBetStore.handleSelectBet = jest.fn().mockRejectedValue({});
      const cashout = useCashout();

      const result = await cashout.executeLossCut(executeParams({
        runners: makeRunners({ A: { lay: [{ price: 1.5 }] } }),
        outcomes: marketOutcomes(300, -120)
      }));

      expect(result).toEqual({ success: false, error: 'Failed to execute loss cut' });
      expect(cashout.isProcessing.value).toBe(false);
    });
  });
});

describe('cashout payout formulas', () => {
  it('covers every formula used by payout calculators', () => {
    expect(formulas.ODDS(2.5, 100)).toBe(150);
    expect(formulas.DIGIT(45, 200)).toBe(90);
    expect(formulas.BACK_ONLY_ODDS(1.8, 250)).toBe(200);
    expect(formulas.F(30, 150)).toBe(45);
  });
});
