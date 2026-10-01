import { isOddEvenBetRecord } from '@/utils/fancyMarketVisibility'

/** Fancy odd/even markets are back-only on both sides (blue), not lay/back. */
export function isOddEvenBet(bet) {
  if (!bet) return false
  if (bet.is_odd_even === true) return true

  const bettingType = String(bet.betting_type ?? bet.bettingType ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
  if (bettingType === 'ODD_EVEN' || bettingType === 'ODDEVEN') return true

  return isOddEvenBetRecord(bet)
}

export function isBackBetForDisplay(bet) {
  if (isOddEvenBet(bet)) return true
  const raw =
    bet?.is_back ??
    bet?.isBack ??
    bet?.back_lay ??
    bet?.backLay ??
    bet?.BackLay ??
    bet?.back_or_lay ??
    bet?.backOrLay

  if (raw === true || raw === 1 || raw === '1') return true
  if (raw === false || raw === 0 || raw === '0') return false
  if (raw == null || raw === '') return false

  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase()
    if (s === 'true' || s === 'back' || s === 'b') return true
    if (s === 'false' || s === 'lay' || s === 'l') return false
  }

  return false
}
