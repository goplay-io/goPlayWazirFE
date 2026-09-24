/** True when runner name contains "draw" as a word (for example, "The Draw"). */
export const isDrawRunnerName = (name) => /\bdraw\b/i.test(String(name ?? '').trim());

/** True when the runner object represents a draw selection. */
export const isDrawRunner = (runner, getName = (value) => value?.name) =>
  isDrawRunnerName(getName(runner));

const defaultGetSortPriority = (runner) =>
  Number(runner?.sort_priority ?? runner?.sortPriority ?? 0);

export const getMarketSortPriority = (market) =>
  Number(market?.sort_priority ?? market?.sortPriority ?? market?.priority ?? 0);

/**
 * Sort fancy markets to match a tab's sortPriorities array order.
 * @param {Array} markets
 * @param {Array} sortPriorities
 */
export const sortFancyMarketsByTabPriorities = (markets, sortPriorities) => {
  if (!markets?.length) return markets || [];
  if (!Array.isArray(sortPriorities) || !sortPriorities.length) {
    return sortMarketsByPriority(markets);
  }

  const indexMap = new Map(sortPriorities.map((priority, index) => [priority, index]));

  return [...markets].sort((a, b) => {
    const aPriority = a?.sort_priority ?? a?.sortPriority;
    const bPriority = b?.sort_priority ?? b?.sortPriority;
    const aIndex = indexMap.has(aPriority) ? indexMap.get(aPriority) : Number.MAX_SAFE_INTEGER;
    const bIndex = indexMap.has(bPriority) ? indexMap.get(bPriority) : Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;

    const aSort = getMarketSortPriority(a);
    const bSort = getMarketSortPriority(b);
    if (aSort !== bSort) return aSort - bSort;

    const aName = String(a?.name ?? a?.market_name ?? '');
    const bName = String(b?.name ?? b?.market_name ?? '');
    return aName.localeCompare(bName);
  });
};

/**
 * Sort markets by API sort_priority (ascending), then name.
 * @param {Array} markets
 */
export const sortMarketsByPriority = (markets) => {
  if (!markets?.length) return markets || [];

  return [...markets].sort((a, b) => {
    const aSort = getMarketSortPriority(a);
    const bSort = getMarketSortPriority(b);
    if (aSort !== bSort) return aSort - bSort;

    const aName = String(a?.name ?? a?.market_name ?? a?.title ?? '');
    const bName = String(b?.name ?? b?.market_name ?? b?.title ?? '');
    return aName.localeCompare(bName);
  });
};

/**
 * Sort runners by API priority while keeping Draw selections last.
 */
export const sortRunnersWithDrawLast = (
  runners,
  {
    getName = (runner) => runner?.name,
    getSortPriority = defaultGetSortPriority,
    namePriority,
  } = {},
) => {
  if (!runners?.length) return runners || [];

  return [...runners].sort((a, b) => {
    const aName = String(getName(a) ?? '').trim();
    const bName = String(getName(b) ?? '').trim();
    const aIsDraw = isDrawRunnerName(aName);
    const bIsDraw = isDrawRunnerName(bName);

    if (aIsDraw !== bIsDraw) return aIsDraw ? 1 : -1;

    const aSort = Number(getSortPriority(a) ?? 0);
    const bSort = Number(getSortPriority(b) ?? 0);
    if (aSort !== bSort) return aSort - bSort;

    if (namePriority) {
      const aPriority = namePriority[aName.toLowerCase()] ?? Infinity;
      const bPriority = namePriority[bName.toLowerCase()] ?? Infinity;
      if (aPriority !== bPriority) return aPriority - bPriority;
    }

    return aName.localeCompare(bName);
  });
};
