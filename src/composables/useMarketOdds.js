import { ref, watch, onUnmounted } from 'vue';
import { getLatestOdds } from '@/api/event/odds';

/**
 * Composable for managing market odds fetching and updating
 * @param {Function|Ref} eventsSource - Function that returns events array or a ref to events
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Refresh interval in milliseconds (default: 1000)
 * @param {Function} options.onUpdate - Optional callback when events are updated
 */
export function useMarketOdds(eventsSource, options = {}) {
    const { interval = 1000, onUpdate } = options;
    const oddsIntervalId = ref(null);
    const isFetching = ref(false);

    // Get events from source (handle both function and ref)
    const getEvents = () => {
        if (typeof eventsSource === 'function') {
            return eventsSource();
        }
        return eventsSource.value || [];
    };

    /**
     * Transform odds runners data to EventRow format
     * EventRow expects: values.TEAM_1[1] = back price, values.TEAM_1[7] = lay price
     */
    const transformRunnersToValues = (runners) => {
        if (!runners || typeof runners !== 'object') return {};
        
        const values = {};
        const runnerIds = Object.keys(runners);
        
        // Map runners to TEAM_1, TEAM_2, TEAM_3 format
        runnerIds.forEach((runnerId, index) => {
            const teamKey = index === 0 ? 'TEAM_1' : index === 1 ? 'TEAM_2' : 'TEAM_3';
            const runner = runners[runnerId];
            
            if (runner && runner.back && runner.lay) {
                const bestBack = runner.back[0]?.price ?? 0;
                const bestBackSize = runner.back[0]?.size ?? 0;
                const bestLay = runner.lay[0]?.price ?? 0;
                const bestLaySize = runner.lay[0]?.size ?? 0;

                // EventRow uses: [1] back price, [2] back size, [7] lay price, [8] lay size
                values[teamKey] = [
                    runnerId,
                    bestBack,
                    bestBackSize,
                    0, 0, 0, 0,
                    bestLay,
                    bestLaySize,
                ];
            }
        });
        
        return values;
    };

    /**
     * Get all market_ids from current events
     */
    const getAllMarketIds = () => {
        const events = getEvents();
        if (!Array.isArray(events)) return [];
        return events
            .map(event => event.market_id)
            .filter(Boolean); // Remove any null/undefined values
    };

    /**
     * Update events with latest odds data
     */
    const updateEventsWithOdds = (oddsData) => {
        if (!Array.isArray(oddsData) || oddsData.length === 0) return;
        
        const events = getEvents();
        if (!Array.isArray(events) || events.length === 0) return;
        
        // Create a map of marketId to odds data for quick lookup
        const oddsMap = new Map();
        oddsData.forEach(odds => {
            if (odds.marketId) {
                oddsMap.set(odds.marketId, odds);
            }
        });
        
        // Update events with odds data
        events.forEach(event => {
            if (event.market_id && oddsMap.has(event.market_id)) {
                const odds = oddsMap.get(event.market_id);
                
                // Transform runners data to EventRow format
                if (odds.runners) {
                    event.values = transformRunnersToValues(odds.runners);
                }
                
                // Update market status
                if (odds.status !== undefined) {
                    event.market_status = odds.status;
                }
                if (odds.bet_allow !== undefined) {
                    event.bet_allow = odds.bet_allow === 1 || odds.bet_allow === true;
                }
            }
        });
        
        // Call optional update callback
        if (onUpdate) {
            onUpdate(events);
        }
    };

    /**
     * Fetch latest odds for all market_ids
     */
    const fetchLatestOdds = async () => {
        if (isFetching.value) return; // Prevent concurrent fetches
        
        try {
            isFetching.value = true;
            const marketIds = getAllMarketIds();
            
            if (marketIds.length === 0) {
                return;
            }
            
            // Fetch latest odds
            const response = await getLatestOdds(marketIds);
            
            // Handle response structure
            const oddsData = response?.data || response || [];
            
            if (Array.isArray(oddsData) && oddsData.length > 0) {
                updateEventsWithOdds(oddsData);
            }
        } catch (err) {
            console.error('Error fetching latest odds:', err);
            // Don't show error to user, just log it
        } finally {
            isFetching.value = false;
        }
    };

    /**
     * Start fetching odds periodically
     */
    const startOddsFetching = () => {
        if (oddsIntervalId.value) {
            return; // Already started
        }
        
        // Fetch immediately
        fetchLatestOdds();
        
        // Then set up interval
        oddsIntervalId.value = setInterval(fetchLatestOdds, interval);
    };

    /**
     * Stop fetching odds
     */
    const stopOddsFetching = () => {
        if (oddsIntervalId.value) {
            clearInterval(oddsIntervalId.value);
            oddsIntervalId.value = null;
        }
    };

    /**
     * Watch for events to automatically start odds fetching
     */
    const watchForEvents = () => {
        watch(
            () => {
                const events = getEvents();
                return Array.isArray(events) ? events.length : 0;
            },
            (newLength) => {
                if (newLength > 0 && !oddsIntervalId.value) {
                    startOddsFetching();
                } else if (newLength === 0 && oddsIntervalId.value) {
                    stopOddsFetching();
                }
            },
            { immediate: true }
        );
    };

    // Cleanup on unmount
    onUnmounted(() => {
        stopOddsFetching();
    });

    return {
        fetchLatestOdds,
        startOddsFetching,
        stopOddsFetching,
        watchForEvents,
        isFetching,
        transformRunnersToValues,
        updateEventsWithOdds,
        getAllMarketIds
    };
}

