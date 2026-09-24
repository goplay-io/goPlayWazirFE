/**
 * Betting calculation formulas (aligned with backend)
 * ODDS: (odd * stake - stake) = (odd - 1) * stake
 * DIGIT: (odd * (stake / 100))
 * BACK_ONLY_ODDS: Same as ODDS (for back-only markets)
 * F: Fancy markets (separate calculator)
 */
export const formulas = {
    // ODDS formula - for MatchOdds, Bookmakers (BM_ODD), Ginnie
    ODDS: function (odd, stake) {
        return (odd * stake - stake);
    },

    // DIGIT formula - for Bookmaker digit markets
    DIGIT: function (odd, stake) {
        return odd * (stake / 100);
    },

    // BACK_ONLY_ODDS - same as ODDS (for back-only markets)
    BACK_ONLY_ODDS: function (odd, stake) {
        return (odd * stake - stake);
    },

    // Fancy formula (kept for fancy calculator)
    F: function (fancyOdd, stake) {
        return fancyOdd * (stake / 100);
    }
}