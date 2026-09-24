import numeral from 'numeral';

/**
 * Market header min/max stakes — always in thousands (k), never millions (m).
 * e.g. 1,000,000 → 1000K, 25,000 → 25K, values under 1,000 stay as-is.
 */
export function formatMarketBetLimit(value, { uppercase = true } = {}) {
  if (value == null || value === '') return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);

  if (num < 1000) {
    return String(num);
  }

  const inThousands = num / 1000;
  const formatted = numeral(inThousands).format(inThousands >= 100 ? '0' : '0[.]0');
  const suffix = uppercase ? 'K' : 'k';
  return `${formatted}${suffix}`;
}
