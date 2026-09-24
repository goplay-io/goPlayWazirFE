import { formulas } from './Formulas.js';

/**
 * Non-Fancy Calculator for MatchOdds, Bookmakers, and OtherMarkets
 * Uses outcomes directly from API (no recalculation needed)
 * Only calculates per_unit and current_potential_payout for display/preview
 * 
 * @param {Object|Array} runnerIds - For single market: array of runner IDs. For multiple markets: {marketId: [runnerIds]}
 * @param {Object} bet - Selected bet object (optional, for current_potential_payout preview)
 * @param {Object} outcomes - Outcomes from API: {marketId: {runnerId: payout}}
 * @param {string|number} marketId - Market ID (required for single market, optional for multi-market)
 * @param {Object} runnerIdMap - Optional mapping from selection_id to runner_id (for MatchOdds)
 * @returns {Object} {betSummary: {marketId: {runnerId: {potential_payout, current_potential_payout, per_unit}}}}
 */
export default function NonFancyCalculator(runnerIds, bet, outcomes = null, marketId = null, runnerIdMap = null) {
    
    // Determine if this is single market (array) or multi-market (object)
    const isMultiMarket = !Array.isArray(runnerIds) && typeof runnerIds === 'object';
    
    // Get payout from outcomes - handles both single and multi-market
    const getPayout = (marketId, runnerId) => {
        if (!outcomes || !marketId) return null;

        const marketKey = String(marketId);
        const marketData = outcomes[marketKey] || outcomes[Number(marketId)] || outcomes[marketId];
        if (!marketData) return null;

        // Try runnerId as string, number, and mapped value
        const runnerStr = String(runnerId);
        const runnerNum = Number(runnerId);
        const mappedRunnerId = runnerIdMap?.[runnerId];
        
        // Check if key exists (even if value is 0)
        if (runnerStr in marketData) return marketData[runnerStr];
        if (runnerNum in marketData) return marketData[runnerNum];
        if (mappedRunnerId) {
            const mappedStr = String(mappedRunnerId);
            const mappedNum = Number(mappedRunnerId);
            if (mappedStr in marketData) return marketData[mappedStr];
            if (mappedNum in marketData) return marketData[mappedNum];
        }
        if (runnerId in marketData) return marketData[runnerId];
        
        return null;
    };

    // Get bet payout calculation based on betting type
    // Only three types: ODDS, DIGIT, BACK_ONLY_ODDS
    const getBetPayout = (odd, stake, isLayBet, bettingType) => {
        let payout;
        
        // Map betting types to formulas (aligned with backend)
        const betType = (bettingType || 'ODDS').toUpperCase();
        
        if (betType === 'DIGIT') {
            payout = formulas.DIGIT(odd, stake);
        } else if (betType === 'BACK_ONLY_ODDS') {
            payout = formulas.BACK_ONLY_ODDS(odd, stake);
        } else {
            // Default to ODDS (covers ODDS, BM_ODD, GINNIE_ODDS, etc.)
            payout = formulas.ODDS(odd, stake);
        }
        
        // ⚠️ FIX: Don't round here - let roundValues() handle it with 2 decimal precision
        return isLayBet ? -payout : payout;
    };

    // Initialize bet summary
    const initializeBetSummary = () => {
        const betSummary = {};
        
        if (isMultiMarket) {
            // Multi-market structure: {marketId: {runnerId: {...}}}
            Object.entries(runnerIds).forEach(([mktId, runners]) => {
                betSummary[mktId] = {};
                runners.forEach(runner => {
                    // Handle string/number primitives and object with selectionId/runnerId
                    const isPrimitive = runner === null || typeof runner !== 'object';
                    const key = isPrimitive ? String(runner) : (runner.key || runner.selectionId || runner.runnerId);
                    const selectionId = isPrimitive ? runner : (runner.selectionId || runner.key);
                    const runnerId = isPrimitive ? runner : (runner.runnerId || runner.key);
                    
                    // Try both IDs when looking up outcomes
                    let payout = getPayout(mktId, selectionId);
                    if (payout === null || payout === undefined) {
                        payout = getPayout(mktId, runnerId);
                    }
                    
                    betSummary[mktId][key] = {
                        potential_payout: payout ?? 0,
                        current_potential_payout: null,
                        per_unit: 0
                    };
                });
            });
        } else {
            // Single market structure: {runnerId: {...}}
            runnerIds.forEach(id => {
                const mappedId = runnerIdMap?.[id] || id;
                let payout = getPayout(marketId, id);
                if (payout === null || payout === undefined) {
                    payout = getPayout(marketId, mappedId);
                }
                betSummary[id] = {
                    potential_payout: payout ?? 0,
                    current_potential_payout: null,
                    per_unit: 0
                };
            });
        }
        
        return betSummary;
    };

    // Calculate per_unit from outcomes (same logic for all market types)
    const calculatePerUnit = (betSummary) => {
        if (isMultiMarket) {
            Object.entries(betSummary).forEach(([mktId, marketSummary]) => {
                const payouts = Object.values(marketSummary).map(r => r.potential_payout || 0);
                const sumPositive = payouts.filter(p => p > 0).reduce((sum, p) => sum + p, 0);
                const sumNegative = Math.abs(payouts.filter(p => p < 0).reduce((sum, p) => sum + p, 0));

                Object.keys(marketSummary).forEach((runnerKey, index) => {
                    const payout = payouts[index];
                    if (payout > 0 && sumNegative > 0) {
                        marketSummary[runnerKey].per_unit = sumPositive / sumNegative;
                    } else if (payout < 0 && sumPositive > 0) {
                        marketSummary[runnerKey].per_unit = -sumNegative / sumPositive;
                    } else {
                        marketSummary[runnerKey].per_unit = 0;
                    }
                });
            });
        } else {
            const payouts = Object.values(betSummary).map(r => r.potential_payout || 0);
            const sumPositive = payouts.filter(p => p > 0).reduce((sum, p) => sum + p, 0);
            const sumNegative = Math.abs(payouts.filter(p => p < 0).reduce((sum, p) => sum + p, 0));

            Object.keys(betSummary).forEach((id, index) => {
                const payout = payouts[index];
                if (payout > 0 && sumNegative > 0) {
                    betSummary[id].per_unit = sumPositive / sumNegative;
                } else if (payout < 0 && sumPositive > 0) {
                    betSummary[id].per_unit = -sumNegative / sumPositive;
                } else {
                    betSummary[id].per_unit = 0;
                }
            });
        }
    };

    // Calculate current_potential_payout with selected bet (preview)
    const calculateCurrentPotentialPayout = (betSummary) => {
        const oddValue = bet?.odd;
        if (!bet?.runner_id || !bet?.market_id || !bet?.stake || !oddValue) return;
        
        const stake = parseFloat(bet.stake);
        const odd = parseFloat(oddValue);
        const isLay = bet.is_back == 0;
        const betMarketId = String(bet.market_id);
        const betRunnerId = String(bet.runner_id);

        if (isNaN(stake) || isNaN(odd)) return;

        if (isMultiMarket) {
            // Multi-market: bet.market_id tells us which market
            const marketSummary = betSummary[betMarketId];
            if (!marketSummary) return;

            const marketRunnerIds = runnerIds[betMarketId] || [];
            marketRunnerIds.forEach(runner => {
                const isPrimitive = runner === null || typeof runner !== 'object';
                const key = isPrimitive ? String(runner) : (runner.key || runner.selectionId || runner.runnerId);
                const selectionId = isPrimitive ? runner : (runner.selectionId || runner.key);
                const runnerId = isPrimitive ? runner : (runner.runnerId || runner.key);
                
                const basePayout = marketSummary[key]?.potential_payout || 0;
                
                // Check if this is the selected runner
                if (String(selectionId) === betRunnerId || String(runnerId) === betRunnerId) {
                    marketSummary[key].current_potential_payout = 
                        basePayout + getBetPayout(odd, stake, isLay, bet.betting_type);
                } else {
                    marketSummary[key].current_potential_payout = 
                        basePayout + (isLay ? stake : -stake);
                }
            });
        } else {
            // Single market: only show payout if bet is for THIS market
            if (String(marketId) !== betMarketId) {
                // Bet is for a different market, don't show current_potential_payout
                return;
            }
            
            // Check if bet type matches
            if (bet.type === 'MO' || bet.type === 'R' || bet.type === 'OTHER') {
                Object.keys(betSummary).forEach(id => {
                    const basePayout = betSummary[id].potential_payout || 0;
                    if (String(id) === betRunnerId) {
                        betSummary[id].current_potential_payout = 
                            basePayout + getBetPayout(odd, stake, isLay, bet.betting_type);
                    } else {
                        betSummary[id].current_potential_payout = 
                            basePayout + (isLay ? stake : -stake);
                    }
                });
            }
        }
    };

    // Round all values to 2 decimals
    const roundValues = (betSummary) => {
        const roundValue = (val) => {
            if (val === null || val === undefined) return val;
            return Math.round(val * 100) / 100;
        };

        if (isMultiMarket) {
            Object.values(betSummary).forEach(marketSummary => {
                Object.values(marketSummary).forEach(runner => {
                    runner.potential_payout = roundValue(runner.potential_payout);
                    runner.current_potential_payout = roundValue(runner.current_potential_payout);
                    if (runner.per_unit !== 0) {
                        runner.per_unit = roundValue(runner.per_unit);
                    }
                });
            });
        } else {
            Object.values(betSummary).forEach(runner => {
                runner.potential_payout = roundValue(runner.potential_payout);
                runner.current_potential_payout = roundValue(runner.current_potential_payout);
                if (runner.per_unit !== 0) {
                    runner.per_unit = roundValue(runner.per_unit);
                }
            });
        }
    };

    // Main calculation
    const betSummary = initializeBetSummary();
    calculatePerUnit(betSummary);
    if (bet) {
        calculateCurrentPotentialPayout(betSummary);
    }
    roundValues(betSummary);

    return { betSummary };
}

