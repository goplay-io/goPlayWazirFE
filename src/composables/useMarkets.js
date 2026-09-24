import { ref } from 'vue';
import EventData from '@/utils/eventData';
import { sharedWs } from '@/composables/sharedWs';

// ===== HELPER FUNCTIONS (matching admin EventDetail.jsx) =====

// Extract prices from runner, with fallbacks for different data structures
const extractPrices = (runner) => {
    const backTop = runner?.back?.[0];
    const layTop = runner?.lay?.[0];
    const vals = runner?.values || [];

    return {
        bestBack: backTop?.price ?? runner?.bestBack ?? runner?.bb ?? vals[4] ?? vals[6],
        bestLay: layTop?.price ?? runner?.bestLay ?? runner?.bl ?? vals[2] ?? vals[8],
        sizeBack: backTop?.size ?? vals[5] ?? vals[7],
        sizeLay: layTop?.size ?? vals[3] ?? vals[9]
    };
};

// Normalize runners to array format, keyed by selection_id
const normalizeRunners = (runners) => {
    if (!runners) return [];
    if (Array.isArray(runners)) return runners;
    // Convert object keyed by selection_id to array with selection_id preserved
    return Object.entries(runners).map(([selectionKey, runner]) => ({
        ...runner,
        selection_id: selectionKey,
    }));
};

// Extract status flags from runner
const getRunnerStatus = (runner) => {
    const statusStr = String(runner?.status || '').toUpperCase();
    return {
        suspended: statusStr === 'SUSPENDED',
        ballRunning: statusStr === 'BALL_RUNNING'
    };
};

// Find matching runner by selection_id, runner_id, id, or name
const findMatchingRunner = (runner, runners) => {
    return runners.find(rr =>
        (rr.selection_id && String(rr.selection_id) === String(runner.selection_id)) ||
        (rr.runner_id && String(rr.runner_id) === String(runner.runner_id)) ||
        (rr.id && String(rr.id) === String(runner.id)) ||
        (rr.name === runner.name)
    );
};

const enrichRunnerFromOdds = (runner) => {
    const { bestBack, bestLay, sizeBack, sizeLay } = extractPrices(runner);
    const { suspended, ballRunning } = getRunnerStatus(runner);
    return {
        ...runner,
        status: runner.status,
        ballRunning,
        suspended,
        priceBack: bestBack,
        priceLay: bestLay,
        sizeBack,
        sizeLay,
        back: runner.back,
        lay: runner.lay,
        values: runner.values,
    };
};

/** Merge WS odds into existing runners, or adopt WS runners when the API sent none. */
const mergeRunnersWithOdds = (oldRunners, newRunners) => {
    const normalizedNew = normalizeRunners(newRunners);
    if (!normalizedNew.length) return normalizeRunners(oldRunners);

    const normalizedOld = normalizeRunners(oldRunners);
    if (!normalizedOld.length) {
        return normalizedNew.map(enrichRunnerFromOdds);
    }

    return normalizedOld.map((r) => {
        const found = findMatchingRunner(r, normalizedNew);
        if (!found) return r;

        const { bestBack, bestLay, sizeBack, sizeLay } = extractPrices(found);
        const { suspended, ballRunning } = getRunnerStatus(found);

        return {
            ...r,
            status: found.status,
            ballRunning,
            suspended,
            priceBack: bestBack,
            priceLay: bestLay,
            sizeBack,
            sizeLay,
            back: found.back,
            lay: found.lay,
            values: found.values || r.values,
        };
    });
};

export function useMarkets() {
    const matchOddsData = ref({ runners: [] });
    const bookMakersData = ref(null);
    const lineData = ref([]);
    const fancyActive = ref(false);
    const fancyTabs = ref(null);
    const fancyData = ref(null);
    const finalFancyData = ref(null);
    const otherMarketData = ref(null);

    const fancy_market_ids = ref([]);
    const line_market_ids = ref([]);
    const matchodds_market_ids = ref([]);
    const bookmakers_market_ids = ref([]);
    const other_market_ids = ref([]);

    const constructMatchOdds = (event) => {
        const matchOdds = EventData.getMatchOdds(event);
        // Ensure matchOdds has runners array even if not provided
        matchOddsData.value = matchOdds ? { runners: [], ...matchOdds } : { runners: [] };
        const marketId = matchOddsData?.value?.market_id;
        // Only add valid market IDs
        if (marketId) {
            matchodds_market_ids.value = [marketId];
        }
    };

    const safeExtractBookmakers = (bookmakers) => {
        if (typeof window !== 'undefined' && typeof window.extractBookmakers === 'function') {
            return window.extractBookmakers(bookmakers);
        }
        
        if (!bookmakers) return {};
        
        // If it's an array, convert to object with index keys
        if (Array.isArray(bookmakers)) {
            const result = {};
            bookmakers.forEach((bm, idx) => {
                result[idx] = bm;
            });
            return result;
        }
        
        // If it's already an object, return as-is
        return bookmakers || {};
    };

    const safeGetBookmakerMarketIds = (bookmakers) => {
        if (typeof window !== 'undefined' && typeof window.getMarketIdsOfBookmakers === 'function') {
            return window.getMarketIdsOfBookmakers(bookmakers);
        }
        if (!bookmakers) return [];
        if (!Array.isArray(bookmakers)) {
            // If it's an object, extract values
            return Object.values(bookmakers)
                .map(b => b?.market_id)
                .filter(Boolean);
        }
        return bookmakers.map(b => b?.market_id).filter(Boolean);
    };

    const constructBookmakers = (event) => {
        const rawBookmakers = EventData.getBookMakers(event);
        // Ensure bookmakers are properly formatted - can be array or object
        bookMakersData.value = safeExtractBookmakers(rawBookmakers);
        // Always reset and rebuild the market IDs array
        bookmakers_market_ids.value = safeGetBookmakerMarketIds(bookMakersData.value);
    };

    const constructLine = (event) => {
        const rawLine = EventData.getLine(event);
        lineData.value = Array.isArray(rawLine) ? rawLine : (rawLine ? [rawLine] : []);
        // Collect valid market IDs
        line_market_ids.value = [];
        lineData.value.forEach(lineMarket => {
            if (lineMarket?.market_id) {
                line_market_ids.value.push(lineMarket.market_id);
            }
        });
    };

    const constructFancyTabs = (event) => {
        fancyTabs.value = EventData.getFancyTabs(event);
    };

    const constructFancy = (event) => {
        fancyActive.value = EventData.getFancyActive(event);
        fancyData.value = EventData.getFancy(event);
        
        // Set finalFancyData initially (it will be updated by updateMarketData)
        finalFancyData.value = fancyData.value;

        // Only collect valid market IDs
        fancy_market_ids.value = [];
        if (fancyData.value) {
            fancyData.value.forEach((fancy) => {
                if (fancy?.market_id) {
                    fancy_market_ids.value.push(fancy.market_id);
                }
            });
        }
    };

    const constructOtherMarkets = (event) => {
        otherMarketData.value = EventData.getOtherMarkets(event);
        // Only collect valid market IDs
        other_market_ids.value = [];
        if (Array.isArray(otherMarketData.value)) {
            other_market_ids.value = otherMarketData.value
                .map(market => market?.market_id)
                .filter(Boolean); // Filter out undefined/null values
        }
    };

    // Process odds data from the new API (matching admin pattern)
    const processOddsData = (oddsArray, allMarketIds) => {
        if (!Array.isArray(oddsArray)) return;

        // Build a map keyed by market_id
        const oddsMap = new Map();
        oddsArray.forEach(item => {
            const key = String(item?.market_id ?? item?.marketId ?? '');
            if (key) {
                // Normalize runners to array with selection_id preserved
                oddsMap.set(key, { ...item, runners: normalizeRunners(item.runners) });
            }
        });

        // Build current event object from refs
            const evt = {
                match_odds: matchOddsData.value,
                bookmaker: Array.isArray(bookMakersData.value) ? bookMakersData.value : Object.values(bookMakersData.value || {}),
                fancy: Array.isArray(finalFancyData.value) ? finalFancyData.value : Object.values(finalFancyData.value || {}),
                line: Array.isArray(lineData.value) ? lineData.value : [],
                markets: otherMarketData.value || []
            };

        // Update each market type using the admin pattern
        bindLatestOdds(evt, oddsMap);
    };

    // Helper function to update runners with odds data (matching admin pattern)
    const updateRunners = (oldRunners, newRunners) => mergeRunnersWithOdds(oldRunners, newRunners);

    // Bind latest odds to all markets (matching admin EventDetail pattern)
    const bindLatestOdds = (evt, oddsMap) => {
        if (!evt) return;

        // ✅ Update Match Odds - PRESERVE active and bet_allow
        if (evt?.match_odds?.market_id) {
            const mkt = oddsMap.get(String(evt.match_odds.market_id));
            if (mkt) {
                const next = {
                    ...matchOddsData.value,
                    active: matchOddsData.value?.active,
                    bet_allow: matchOddsData.value?.bet_allow
                };
                if (mkt.status != null) next.status = mkt.status;
                if (mkt.runners) {
                    next.runners = mergeRunnersWithOdds(evt.match_odds.runners, mkt.runners);
                }
                matchOddsData.value = next;
            }
        }

        // ✅ Update Bookmakers - PRESERVE active and bet_allow
        if (evt?.bookmaker?.length > 0) {
            const currentBookmakers = Array.isArray(bookMakersData.value) ? bookMakersData.value : Object.values(bookMakersData.value || {});
            const updated = evt.bookmaker.map(bm => {
                const mkt = oddsMap.get(String(bm.market_id));
                const existing = currentBookmakers.find(pb => pb.db_id === bm.db_id);

                const baseMarket = {
                    ...bm,
                    active: existing?.active ?? bm.active,
                    bet_allow: existing?.bet_allow ?? bm.bet_allow
                };

                if (mkt) {
                    if (mkt.status != null) baseMarket.status = mkt.status;
                    if (mkt.runners && bm.runners) {
                        baseMarket.runners = updateRunners(bm.runners, mkt.runners);
                    }
                }

                return baseMarket;
            });
            bookMakersData.value = updated;
        }

        // ✅ Update Fancy - PRESERVE active and bet_allow
        if (evt?.fancy) {
            const currentFancy = Array.isArray(finalFancyData.value) ? finalFancyData.value : Object.values(finalFancyData.value || {});
            const updated = evt.fancy.map(f => {
                const mkt = oddsMap.get(String(f.market_id));
                const existing = currentFancy.find(pf => pf.db_id === f.db_id);

                if (!mkt) {
                    return {
                        ...f,
                        active: existing?.active ?? f.active,
                        bet_allow: existing?.bet_allow ?? f.bet_allow
                    };
                }

                const items = mkt.runners?.length > 0 ? mkt.runners : (mkt.items || []);
                if (items.length > 0) {
                    return {
                        ...f,
                        status: mkt.status ?? f.status,
                        runners: items.map(it => {
                            const { bestBack, bestLay, sizeBack, sizeLay } = extractPrices(it);
                            const { suspended, ballRunning } = getRunnerStatus(it);
                            return {
                                ...it,
                                status: it?.status,
                                ballRunning,
                                suspended,
                                priceBack: bestBack,
                                priceLay: bestLay,
                                sizeBack,
                                sizeLay,
                                back: it.back,
                                lay: it.lay
                            };
                        }),
                        // Preserve these fields
                        active: existing?.active ?? f.active,
                        bet_allow: existing?.bet_allow ?? f.bet_allow
                    };
                }
                return {
                    ...f,
                    active: existing?.active ?? f.active,
                    bet_allow: existing?.bet_allow ?? f.bet_allow
                };
            });
            finalFancyData.value = updated;
        }

        // ✅ Update Line markets - PRESERVE active and bet_allow
        if (evt?.line && Array.isArray(evt.line) && evt.line.length > 0) {
            const currentLine = Array.isArray(lineData.value) ? lineData.value : [];
            const updated = evt.line.map(ln => {
                const mkt = oddsMap.get(String(ln.market_id));
                const existing = currentLine.find(pl => pl.db_id === ln.db_id);

                const baseMarket = { ...ln };

                if (mkt) {
                    if (mkt.status != null) baseMarket.status = mkt.status;
                    if (mkt.runners && ln.runners) {
                        baseMarket.runners = updateRunners(ln.runners, mkt.runners);
                    }
                }

                if (existing) {
                    baseMarket.active = existing.active;
                    baseMarket.bet_allow = existing.bet_allow;
                }

                return baseMarket;
            });
            lineData.value = updated;
        }

        // ✅ Update Extra Markets - PRESERVE active and bet_allow
        if (evt?.markets?.length > 0) {
            const currentExtra = otherMarketData.value || [];
            const updated = evt.markets.map(em => {
                const mkt = oddsMap.get(String(em.market_id));
                const existing = currentExtra.find(pe => pe.db_id === em.db_id);

                // Create base object with all em properties
                const baseMarket = { ...em };

                if (mkt) {
                    if (mkt.status != null) baseMarket.status = mkt.status;
                    if (mkt.runners && em.runners) {
                        baseMarket.runners = updateRunners(em.runners, mkt.runners);
                    }
                }

                // ALWAYS preserve active and bet_allow from existing state if it exists
                if (existing) {
                    baseMarket.active = existing.active;
                    baseMarket.bet_allow = existing.bet_allow;
                }

                return baseMarket;
            });
            otherMarketData.value = updated;
        }
    };

    // Merges new fancy data into finalFancyData in-place to avoid full remounts.
    // - Existing markets are updated by mutating their properties
    // - Markets no longer in the new list are removed
    // - Brand-new markets are appended
    const mergeFancyFromEvent = (event) => {
        const newFancy = EventData.getFancy(event);
        if (!Array.isArray(newFancy)) return;

        // Update fancy_market_ids
        fancy_market_ids.value = newFancy.map(f => f?.market_id).filter(Boolean);

        // Also update fancyTabs and fancyActive
        fancyTabs.value = EventData.getFancyTabs(event);
        fancyActive.value = EventData.getFancyActive(event);

        const current = Array.isArray(finalFancyData.value) ? finalFancyData.value : [];
        const currentMap = new Map(current.map(f => [String(f.market_id), f]));

        const LIVE_FIELDS = ['status', 'runners', 'priceBack', 'priceLay', 'sizeBack', 'sizeLay', 'back', 'lay', 'values', 'ballRunning', 'suspended'];

        const merged = newFancy.map(newItem => {
            const id = String(newItem.market_id);
            const existing = currentMap.get(id);
            if (existing) {
                Object.keys(newItem).forEach(key => {
                    if (!LIVE_FIELDS.includes(key)) {
                        existing[key] = newItem[key];
                    }
                });
                return existing;
            }
            return { ...newItem };
        });

        finalFancyData.value = merged;
        fancyData.value = merged;
    };

    const getAllMarketIds = () => [
        ...matchodds_market_ids.value,
        ...bookmakers_market_ids.value,
        ...line_market_ids.value,
        ...fancy_market_ids.value,
        ...other_market_ids.value
    ].filter(Boolean);

    const updateMarketDataFromOdds = (oddsArray) => {
        const ids = getAllMarketIds();
        if (Array.isArray(oddsArray) && oddsArray.length > 0 && ids.length > 0) {
            processOddsData(oddsArray, ids);
        }
    };

    /** Apply any odds already received on the shared WS before market refs were ready. */
    const applyCachedOdds = () => {
        const ids = getAllMarketIds();
        if (!ids.length || !sharedWs.url) return;
        const cached = sharedWs.getCachedOddsForMarkets(ids);
        if (cached.length > 0) {
            processOddsData(cached, ids);
        }
    };

    const binaryData = ref(null);

    const constructBinary = (event) => {
        binaryData.value = EventData.getBinary(event);
    };

    const updateBinaryDataFromOdds = (wsMarkets) => {
        if (!Array.isArray(wsMarkets) || !Array.isArray(binaryData.value)) return;
        const updated = binaryData.value.map((market) => {
            const live = wsMarkets.find(
                (m) => String(m.marketId) === String(market.market_id)
            );
            if (!live) return market;
            return {
                ...market,
                status: live.status ?? market.status,
                runners: {
                    ...market.runners,
                    [market.market_id]: {
                        ...(market.runners?.[market.market_id] ?? {}),
                        status: live.status ?? market.status,
                        back: live.back ?? market.runners?.[market.market_id]?.back,
                        lay: live.lay ?? market.runners?.[market.market_id]?.lay,
                    },
                },
            };
        });
        binaryData.value = updated;
    };

    return {
        matchOddsData,
        bookMakersData,
        lineData,
        fancyActive,
        fancyTabs,
        fancyData,
        finalFancyData,
        otherMarketData,
        fancy_market_ids,
        line_market_ids,
        matchodds_market_ids,
        bookmakers_market_ids,
        other_market_ids,
        binaryData,
        constructMatchOdds,
        constructBookmakers,
        constructLine,
        constructFancyTabs,
        constructFancy,
        constructOtherMarkets,
        mergeFancyFromEvent,
        updateMarketDataFromOdds,
        applyCachedOdds,
        getAllMarketIds,
        constructBinary,
        updateBinaryDataFromOdds,
    };
}
