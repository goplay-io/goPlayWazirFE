import { ref, onUnmounted } from 'vue';

/**
 * Composable for polling market data updates
 */
export function useMultiMarketPolling(eventDataList, interval = 1000) {
  const latency = ref(0);
  let pollInterval = null;

  /**
   * Start polling for market updates
   */
  const startPolling = () => {
    if (pollInterval) clearInterval(pollInterval);
    
    pollInterval = setInterval(async () => {
      const startTime = performance.now();
      
      for (const eventData of eventDataList.value) {
        if (eventData.marketsComposable && typeof eventData.marketsComposable.updateMarketData === 'function') {
          await eventData.marketsComposable.updateMarketData();
        }
      }
      
      const endTime = performance.now();
      latency.value = Math.round(endTime - startTime);
    }, interval);
  };

  /**
   * Stop polling
   */
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  // Cleanup on unmount
  onUnmounted(() => {
    stopPolling();
  });

  return {
    latency,
    startPolling,
    stopPolling,
  };
}

