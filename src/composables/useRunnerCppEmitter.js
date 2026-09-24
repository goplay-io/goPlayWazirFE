import { watch, onBeforeUnmount } from 'vue';
import useDevices from '@/composables/useDevices';

/**
 * Composable to build and emit runner Current Potential Payout (CPP) data.
 * Tracks exposure changes for each runner in a market and emits updates
 * to display in the bet slip.
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.getSummary - Returns summary object with runner payouts
 * @param {Function} options.getRunners - Returns array of runner objects
 * @param {Function} options.getMeta - Returns metadata (eventId, marketId, marketName)
 * @param {Function} options.onRunnerCppUpdate - Callback for CPP updates
 * @param {Function} [options.watchSources] - Vue watch sources factory
 * @param {Object} [options.payloadOptions] - Override options for payload building
 */
export function useRunnerCppEmitter(options = {}) {
  const {
    getSummary,
    getRunners,
    getMeta,
    onRunnerCppUpdate,
    watchSources,
    payloadOptions = {}
  } = options;

  const { isMobile } = useDevices?.() || {};
  let lastEmittedPayload = undefined;

  const isEmitterEnabled = () => (isMobile ? Boolean(isMobile.value) : true);

  // Default extractors
  const defaultGetRunnerKey = (runner) =>
    runner?.selection_id ?? runner?.selectionId ?? runner?.id ?? runner?.values?.[0];

  const defaultGetRunnerName = (runner, index) =>
    runner?.name ?? runner?.runnerName ?? runner?.selectionName ?? `Runner ${index + 1}`;

  /**
   * Extracts payout value from summary with multiple fallback strategies
   */
  const extractPayoutValue = (summary, key, runner) => {
    const entry = summary[key] 
      ?? summary[String(runner?.selection_id)] 
      ?? summary[String(runner?.id)];

    if (!entry || typeof entry !== 'object') return null;

    return entry.current_potential_payout ?? entry.potential_payout ?? null;
  };

  /**
   * Builds CPP payload from summary, runners, and metadata
   */
  const buildPayload = (summary, runners, meta) => {
    const {
      eventId,
      marketId,
      marketName = 'Market',
      getRunnerKey = defaultGetRunnerKey,
      getRunnerName = defaultGetRunnerName,
    } = { ...meta, ...payloadOptions };

    // Validate required inputs
    if (!summary || typeof summary !== 'object') return null;
    if (!Array.isArray(runners) || runners.length === 0) return null;
    if (!marketId) return null;

    const payloadRunners = {};

    for (let i = 0; i < runners.length; i++) {
      const runner = runners[i];
      const rawKey = getRunnerKey(runner, i);
      const key = rawKey != null ? String(rawKey) : '';

      if (!key) continue;

      const payoutValue = extractPayoutValue(summary, key, runner);
      if (payoutValue == null) continue;

      payloadRunners[key] = {
        runnerId: key,
        runnerName: getRunnerName(runner, i),
        currentPotentialPayout: payoutValue,
      };
    }

    // No valid runners found
    if (Object.keys(payloadRunners).length === 0) return null;

    return {
      eventId,
      marketId,
      marketName,
      runners: payloadRunners,
    };
  };

  /**
   * Emits a reset payload for the current market
   */
  const emitReset = (meta) => {
    if (!meta?.marketId) {
      onRunnerCppUpdate?.(null);
      lastEmittedPayload = null;
      return;
    }

    onRunnerCppUpdate?.({
      eventId: meta.eventId,
      marketId: meta.marketId,
      marketName: meta.marketName,
      runners: null,
      reset: true
    });
    lastEmittedPayload = null;
  };

  /**
   * Main emit function - builds and emits CPP data
   */
  const emitRunnerCpp = () => {
    if (!onRunnerCppUpdate) return;

    if (!isEmitterEnabled()) {
      if (lastEmittedPayload !== null) {
        onRunnerCppUpdate(null);
        lastEmittedPayload = null;
      }
      return;
    }

    const meta = getMeta?.() || {};
    
    // Without marketId, emit legacy null
    if (!meta.marketId) {
      onRunnerCppUpdate(null);
      return;
    }

    const summary = getSummary?.();
    const runners = getRunners?.();

    // Emit reset if data is missing or invalid
    if (!summary || !Array.isArray(runners) || runners.length === 0) {
      emitReset(meta);
      return;
    }

    const payload = buildPayload(summary, runners, meta);

    // Emit reset if payload building failed
    if (!payload) {
      emitReset(meta);
      return;
    }

    onRunnerCppUpdate(payload);
    lastEmittedPayload = payload;
  };

  // Setup watcher if watch sources provided
  if (typeof watchSources === 'function') {
    watch(watchSources, emitRunnerCpp, { 
      deep: true, 
      immediate: true 
    });
  } else {
    // Execute immediately if no watch sources
    emitRunnerCpp();
  }

  // Re-check when device breakpoint changes
  if (isMobile) {
    watch(isMobile, (mobile) => {
      if (mobile) {
        emitRunnerCpp();
      } else if (lastEmittedPayload !== null) {
        onRunnerCppUpdate?.(null);
        lastEmittedPayload = null;
      }
    });
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    onRunnerCppUpdate?.(null);
    lastEmittedPayload = null;
  });

  return { 
    emitRunnerCpp 
  };
}