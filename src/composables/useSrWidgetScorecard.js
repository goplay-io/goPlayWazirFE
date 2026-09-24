import { ref, watch, computed } from 'vue';
import { buildAbracadabraScorecardUrl, resolveSrScorecardId } from '@/utils/srScorecardWidget.js';

/**
 * Resolve SR match id and build Abracadabra scorecard iframe URL.
 */
export function useSrWidgetScorecard(eventIdRef, eventTypeIdRef, enabledRef) {
  const scorecardId = ref(null);
  const loading = ref(false);

  let resolveRequestKey = 0;

  const scorecardUrl = computed(() => {
    if (!enabledRef.value || !scorecardId.value) return null;
    return buildAbracadabraScorecardUrl(eventTypeIdRef.value, scorecardId.value);
  });

  async function resolveId() {
    if (!enabledRef.value) {
      scorecardId.value = null;
      return;
    }

    const eventId = eventIdRef.value;
    if (eventId == null || eventId === '') {
      scorecardId.value = null;
      return;
    }

    const requestKey = ++resolveRequestKey;
    loading.value = true;
    scorecardId.value = null;

    try {
      const resolved = await resolveSrScorecardId(eventId);
      if (requestKey !== resolveRequestKey) return;
      scorecardId.value = resolved || null;
    } catch {
      if (requestKey !== resolveRequestKey) return;
      scorecardId.value = null;
    } finally {
      if (requestKey === resolveRequestKey) {
        loading.value = false;
      }
    }
  }

  watch([eventIdRef, enabledRef], resolveId, { immediate: true });

  return { scorecardId, scorecardUrl, loading };
}
