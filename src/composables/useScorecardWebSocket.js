import { ref, watch, onUnmounted } from 'vue';
import { getScorecard } from '@/api/event/scorecard.js';
import { sharedWs } from '@/composables/sharedWs';

/**
 * Real-time scorecard via the shared OddsDistributor WebSocket connection.
 * Sends { event_id: N } on connect; receives { success, eventId, data } pushes.
 * Falls back to polling when VITE_ODDS_WS_URL is not set.
 *
 * @param {import('vue').Ref<number|string|null>} eventIdRef
 * @param {import('vue').Ref<boolean>} scoreActiveRef
 * @param {{ onData: (payload: object) => void }} options
 */
export function useScorecardWebSocket(eventIdRef, scoreActiveRef, { onData } = {}) {
  const pollingTimer = ref(null);
  const POLL_INTERVAL_MS = 5000;

  const getEventId = () => {
    const id = typeof eventIdRef === 'function' ? eventIdRef() : eventIdRef?.value;
    return id != null && id !== '' ? Number(id) : null;
  };
  const isActive = () => !!scoreActiveRef?.value;

  // -- Polling fallback (no WS URL configured) -------------------------------
  async function pollOnce() {
    const id = getEventId();
    if (!id || !isActive()) return;
    try {
      const html = await getScorecard(id);
      if (typeof html === 'string' && onData) onData({ data: html, contentType: 'text/html' });
    } catch (_) {}
  }

  function startPolling() {
    stopPolling();
    const id = getEventId();
    if (!id || !isActive()) return;
    pollOnce();
    pollingTimer.value = setInterval(pollOnce, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollingTimer.value) { clearInterval(pollingTimer.value); pollingTimer.value = null; }
  }

  // -- Shared WS path --------------------------------------------------------
  let unsubscribeListener = null;

  function handleMessage(msg) {
    const id = getEventId();
    if (!id || !isActive()) return;
    if (Number(msg.eventId) !== id) return;
    if (onData) onData(msg.data);
  }

  function start() {
    if (!sharedWs.url) { startPolling(); return; }
    stop();
    const id = getEventId();
    if (!id || !isActive()) return;
    unsubscribeListener = sharedWs.onScorecard(handleMessage);
    sharedWs.subscribeScorecard(id, { fetch: true });
  }

  function stop() {
    stopPolling();
    if (unsubscribeListener) { unsubscribeListener(); unsubscribeListener = null; }
    const id = getEventId();
    if (id) sharedWs.unsubscribeScorecard(id, { fetch: true });
  }

  watch(
    () => [getEventId(), isActive()],
    ([id, active]) => {
      stop();
      if (id && active) start();
    },
    { immediate: true }
  );

  onUnmounted(stop);

  return { start, stop };
}
