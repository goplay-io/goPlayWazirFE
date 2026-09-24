// Helper utilities to normalize event payloads from /events/info/:id
// Falls back gracefully if certain fields are missing.

const getRoot = (event) => event?.data?.event ?? event?.event ?? event ?? {};
const getEventInfo = (event) => {
  const root = getRoot(event);
  return root?.event ?? root;
};

// Markets can be at root level or nested under 'markets' property
const getMarkets = (event) => {
  const root = getRoot(event);
  // First check if there's a 'markets' property (nested structure)
  if (root?.markets) return root?.markets;
  // Otherwise, markets are at root level
  return root ?? {};
};

export const EventData = {
  getEventName(event) {
    const info = getEventInfo(event);
    return info?.event_name || info?.name || 'Unknown event';
  },

  getCompetitionName(event) {
    const info = getEventInfo(event);
    return info?.competition_name ?? '';
  },

  getEventInfo,

  getEventOpenTime(event) {
    const info = getEventInfo(event);
    return info?.open_date || info?.event_open_time || info?.market_start_time || 'Unknown time';
  },

  getBMActive(event) {
    const root = getRoot(event);
    const flag = root?.bm_active ?? root?.bookmaker_active ?? root?.bmActive;
    return Boolean(flag);
  },

  getEventTypeId(event) {
    const info = getEventInfo(event);
    return info?.event_type_id ?? info?.type_id ?? info?.eventTypeId ?? null;
  },

  // Markets
  getMatchOdds(event) {
    const root = getRoot(event);
    // Check root level first (new API structure)
    return root?.match_odds ?? root?.matchodds ?? root?.matchOdds ?? null;
  },

  getLine(event) {
    const root = getRoot(event);
    // Line markets grouped at root level
    return root?.line ?? root?.line_markets ?? [];
  },

  getBookMakers(event) {
    const root = getRoot(event);
    // Check root level first (new API structure) - note: singular 'bookmaker' in response
    return root?.bookmaker ?? root?.bookmakers ?? root?.book_makers ?? root?.bm ?? null;
  },

  getFancyTabs(event) {
    const root = getRoot(event);
    // Check root level first (new API structure)
    return root?.fancy_tabs ?? root?.fancyTabs ?? null;
  },

  getFancy(event) {
    const root = getRoot(event);
    // Check root level first (new API structure)
    return root?.fancy ?? root?.fancies ?? null;
  },

  getBinary(event) {
    const root = getRoot(event);
    return root?.binary ?? null;
  },

  getFancyActive(event) {
    const root = getRoot(event);
    // Check root level first for fancy_active flag
    const fancyActive = root?.fancy_active ?? root?.fancyActive;
    if (fancyActive !== undefined) {
      return Boolean(fancyActive);
    }
    // Fall back to checking if fancy array has items
    const fancy = this.getFancy(event);
    return Array.isArray(fancy) ? fancy.length > 0 : !!fancy;
  },

  getOtherMarkets(event) {
    const root = getRoot(event);
    // Check root level first (new API structure)
    return root?.markets ?? root?.market ?? root?.other ?? root?.other_markets ?? [];
  },

  // Racing-specific methods
  getWin(event) {
    const root = getRoot(event);
    // Racing events have win array with markets
    return root?.win ?? root?.win_markets ?? [];
  },

  findRaceMarket(event, marketId) {
    const winMarkets = this.getWin(event);
    if (!Array.isArray(winMarkets) || !marketId) return null;
    return winMarkets.find(market =>
      String(market?.market_id) === String(marketId) ||
      String(market?.id) === String(marketId)
    ) || null;
  },

  getRaceMarketStartTime(market) {
    if (!market) return 'Unknown time';
    return market?.market_start_time || market?.start_time || 'Unknown time';
  },

  getCountryCode(event) {
    const info = getEventInfo(event);
    return info?.country_code || info?.countryCode || 'Unknown';
  },

  getBetUnlockBeforeTime(event) {
    const info = getEventInfo(event);
    return info?.bet_allow_before_time || info?.betAllowBeforeTime || null;
  },
};

export const isMarketSuspended = (market) => {
  return String(market?.status || '').toUpperCase() === 'SUSPENDED';
};

/**
 * Flatten list-page event shape ({ markets: { match_odds, ... } }) into the bet-page root layout.
 */
export function normalizeListEventForBet(event) {
  if (!event) return event;

  const root = getRoot(event);
  if (!root || typeof root !== 'object') return event;

  if (root.match_odds || root.matchodds || root.matchOdds || root.bookmaker || root.bookmakers || root.fancy) {
    return event;
  }

  const nested = root.markets;
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
    return event;
  }

  const merged = {
    ...root,
    ...nested,
  };

  const extraMarkets = nested.markets ?? nested.other ?? nested.other_markets;
  if (extraMarkets != null) {
    merged.markets = extraMarkets;
  }

  if (event?.data?.event != null) {
    return { ...event, data: { ...event.data, event: merged } };
  }
  if (event?.event != null) {
    return { ...event, event: merged };
  }
  return merged;
}

/** True when a list or detail payload already includes bet-page market trees. */
export function hasBetPageMarkets(event) {
  const payload = normalizeListEventForBet(event);
  const root = getRoot(payload);
  if (!root || typeof root !== 'object') return false;

  const hasMatchOdds = !!(root.match_odds ?? root.matchodds ?? root.matchOdds);
  const bookmakers = root.bookmaker ?? root.bookmakers ?? root.book_makers ?? root.bm;
  const hasBookmakers = bookmakers
    ? (Array.isArray(bookmakers) ? bookmakers.length > 0 : Object.keys(bookmakers).length > 0)
    : false;
  const fancy = root.fancy ?? root.fancies;
  const hasFancy = Array.isArray(fancy) ? fancy.length > 0 : !!fancy;
  const line = root.line ?? root.line_markets;
  const hasLine = Array.isArray(line) ? line.length > 0 : !!line;
  const other = root.markets ?? root.other ?? root.other_markets;
  const hasOther = Array.isArray(other)
    ? other.some((m) => m?.market_id)
    : false;

  return hasMatchOdds || hasBookmakers || hasFancy || hasLine || hasOther;
}

/** Normalize any API/list payload to the object Bet.vue stores in `event.value`. */
export function resolveBetEventPayload(raw) {
  const normalized = normalizeListEventForBet(raw);
  return (
    normalized?.data?.event ??
    normalized?.event ??
    normalized?.data ??
    normalized
  );
}

/** Collect all market IDs from an /events/info payload for odds WS subscription. */
export function extractMarketIdsFromEvent(event) {
  const ids = [];

  const matchOdds = EventData.getMatchOdds(event);
  if (matchOdds?.market_id) ids.push(matchOdds.market_id);

  const bookmakers = EventData.getBookMakers(event);
  if (bookmakers) {
    const list = Array.isArray(bookmakers) ? bookmakers : Object.values(bookmakers);
    list.forEach((bm) => {
      if (bm?.market_id) ids.push(bm.market_id);
    });
  }

  const fancy = EventData.getFancy(event);
  if (Array.isArray(fancy)) {
    fancy.forEach((f) => {
      if (f?.market_id) ids.push(f.market_id);
    });
  }

  const line = EventData.getLine(event);
  const lineList = Array.isArray(line) ? line : (line ? [line] : []);
  lineList.forEach((ln) => {
    if (ln?.market_id) ids.push(ln.market_id);
  });

  const other = EventData.getOtherMarkets(event);
  if (Array.isArray(other)) {
    other.forEach((m) => {
      if (m?.market_id) ids.push(m.market_id);
    });
  }

  return [...new Set(ids.filter(Boolean).map(String))];
}

export default EventData;

