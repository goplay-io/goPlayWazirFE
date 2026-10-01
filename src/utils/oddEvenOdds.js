import { isOddEvenBet } from '@/utils/betSideDisplay'

/** Fancy odd/even rate (e.g. 96) → display decimal (e.g. 1.96). */
export function oddEvenRateToDisplayOdd(rate) {
  const value = Number(rate)
  if (!Number.isFinite(value)) return null
  return Math.round((1 + value / 100) * 100) / 100
}

export function formatOddEvenDisplayOdd(rate) {
  const converted = oddEvenRateToDisplayOdd(rate)
  return converted == null ? null : converted.toFixed(2)
}

/** Betslip / UI odd; API payload still uses bet.odd + bet.rate from the store. */
export function formatBetSlipDisplayOdd(bet) {
  if (!bet?.odd && bet?.odd !== 0) return null
  if (isOddEvenBet(bet)) {
    const display = formatOddEvenDisplayOdd(bet.rate ?? bet.fancy_odd)
    if (display != null) return display
  }
  return bet.odd
}

/** Open bets, unsettled bets, bet history rate column. */
export function formatBetRecordDisplayOdds(item, dash = '-') {
  const hasMain =
    item?.odd != null && item?.odd !== '' ||
    item?.rate != null && item?.rate !== '' ||
    item?.odd === 0 ||
    item?.rate === 0
  if (!hasMain) return dash

  if (isOddEvenBet(item)) {
    const display = formatOddEvenDisplayOdd(item.rate ?? item.fancy_odd)
    if (display != null) return display
  }

  if (item?.odd != null && item?.odd !== '' && item?.rate != null && item?.rate !== '') {
    return `${item.odd}/${item.rate}`
  }

  const mainOdd = item.odd ?? item.rate
  const fancyOdd = item.fancy_odd
  if (fancyOdd != null && fancyOdd !== '') return `${mainOdd}/${fancyOdd}`
  const num = parseFloat(mainOdd)
  return Number.isNaN(num) ? String(mainOdd) : num.toFixed(2)
}
