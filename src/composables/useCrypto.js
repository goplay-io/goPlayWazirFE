import UsdtIcon from '@/components/Icons/UsdtIcon.vue'
import TronIcon from '@/components/Icons/TronIcon.vue'

const CRYPTO_ICONS = {
  USDT: UsdtIcon,
  TRON: TronIcon
}

export const CRYPTO_CURRENCY_TYPES = ['USDT', 'TRON']

/**
 * Composable for crypto-related helpers (icons, currency types).
 * @returns {{ getIconByName: (name: string) => import('vue').Component | null, currencyTypes: string[] }}
 */
export function useCrypto() {
  function getIconByName(name) {
    if (!name || typeof name !== 'string') return null
    return CRYPTO_ICONS[name.toUpperCase()] ?? null
  }

  return {
    getIconByName,
    currencyTypes: CRYPTO_CURRENCY_TYPES
  }
}
