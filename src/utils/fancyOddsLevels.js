const hasValidPrice = (value) => value != null && Number(value) > 0;

/**
 * Build back/lay price levels from a fancy market runner.
 * Returns only levels with at least one valid price (> 0).
 */
export function getFancyPriceLevels(market) {
  const runner = market?.runners?.[0] || market;
  const back = Array.isArray(runner?.back) ? runner.back : [];
  const lay = Array.isArray(runner?.lay) ? runner.lay : [];
  const levels = [];

  for (let i = 0; i < 3; i++) {
    const layOdd = lay[i]?.price ?? (i === 0 ? (runner?.priceLay ?? runner?.values?.[2] ?? runner?.values?.[8]) : null);
    const layAmount = lay[i]?.size ?? (i === 0 ? runner?.sizeLay : null);
    const backOdd = back[i]?.price ?? (i === 0 ? (runner?.priceBack ?? runner?.values?.[4] ?? runner?.values?.[6]) : null);
    const backAmount = back[i]?.size ?? (i === 0 ? runner?.sizeBack : null);

    if (hasValidPrice(layOdd) || hasValidPrice(backOdd)) {
      levels.push({
        layOdd: hasValidPrice(layOdd) ? layOdd : null,
        layAmount: layAmount ?? null,
        backOdd: hasValidPrice(backOdd) ? backOdd : null,
        backAmount: backAmount ?? null,
      });
    }
  }

  return levels;
}

export function getFancyTopPrices(market) {
  const [top = {}] = getFancyDisplayPriceLevels(market);
  return {
    layOdd: top.layOdd ?? null,
    layAmount: top.layAmount ?? null,
    backOdd: top.backOdd ?? null,
    backAmount: top.backAmount ?? null,
  };
}

export function getFancyDisplayPriceLevels(market) {
  return getFancyPriceLevels(market);
}

export function hasLiveFancyOdds(market) {
  return getFancyPriceLevels(market).length > 0;
}
