import { reactive } from 'vue'
import iconGoplay from '@/assets/goplay-logo-dock.png'
import iconDiamond from '@/assets/diamond-logo.png'
import iconFairplay from '@/assets/fairplay-logo.png'
import iconReddybook from '@/assets/reddy-logo.png'
import iconUltrawin from '@/assets/ultrawin-logo.png'
import iconWinbuzz from '@/assets/winbuzz-logo.png'
import iconZuplay from '@/assets/zuplay-logo.png'
import iconSky from '@/assets/sky-logo.png'

const DEFAULT_SKIN_KEY = 'zuplay'

const DEFAULT_SKINS = [
  { key: 'goplay',    label: 'Goplay',     url: import.meta.env.VITE_GOPLAY_SITE_URL || 'https://goplaybet.io/',           icon: iconGoplay    },
  { key: 'diamond',   label: 'Diamond',    url: import.meta.env.VITE_DIAMOND_SITE_URL || 'https://diamond.goplaybet.io/',   icon: iconDiamond   },
  { key: 'zuplay',    label: 'Zu Play',    url: import.meta.env.VITE_ZUPLAY_SITE_URL || 'https://zuplay.goplaybet.io/',    icon: iconZuplay    },
  { key: 'ultrawin',  label: 'Ultrawin',   url: import.meta.env.VITE_ULTRAWIN_SITE_URL || 'https://ultrawin.goplaybet.io/',  icon: iconUltrawin  },
  { key: 'winbuzz',   label: 'Win Buzz',   url: import.meta.env.VITE_WINBUZZ_SITE_URL || 'https://winbuzz.goplaybet.io/',   icon: iconWinbuzz   },
  { key: 'fairplay',  label: 'Fair Play',  url: import.meta.env.VITE_FAIRPLAY_SITE_URL || 'https://fairplay.goplaybet.io/',  icon: iconFairplay  },
  { key: 'reddybook', label: 'Reddy Book', url: import.meta.env.VITE_REDDY_SITE_URL || 'https://reddybook.goplaybet.io/', icon: iconReddybook },
]

export const skins = reactive([...DEFAULT_SKINS])

export const FALLBACK_SKIN_ICON = iconSky

export function resolveSkinIcon(icon) {
  if (typeof icon === 'string' && icon.trim()) return icon
  return FALLBACK_SKIN_ICON
}

const slugify = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const compactKey = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '')

const SKIN_ALIASES = {
  reddy: 'reddybook',
  reddybook: 'reddybook',
  'reddy-book': 'reddybook',
  diamond: 'diamond',
  diamondbook: 'diamond',
  fairplay: 'fairplay',
  'fair-play': 'fairplay',
  winbuzz: 'winbuzz',
  winbuz: 'winbuzz',
  ultrawin: 'ultrawin',
  zuplay: 'zuplay',
  zuptvy: 'zuplay',
  goplay: 'goplay',
}

const findDefaultSkin = (key, hostname, name) => {
  const compact = compactKey(key) || compactKey(name) || compactKey(hostname)
  const aliased = SKIN_ALIASES[compact] || SKIN_ALIASES[key] || null
  return (aliased && DEFAULT_SKINS.find((item) => item.key === aliased))
    || DEFAULT_SKINS.find((item) => item.key === key)
    || DEFAULT_SKINS.find((item) => compactKey(item.key) === compact)
    || DEFAULT_SKINS.find((item) => compactKey(item.label) === compact)
    || DEFAULT_SKINS.find((item) => {
      try { return new URL(item.url).hostname.toLowerCase() === String(hostname || '').toLowerCase() }
      catch { return false }
    })
    || null
}

export const normalizeSkinConfig = (skin) => {
  if (!skin?.url || !skin?.name) return null
  let hostname = ''
  try { hostname = new URL(skin.url).hostname } catch { /* validation is handled by the API */ }
  const key = skin.key || slugify(skin.name) || slugify(hostname)
  const fallback = findDefaultSkin(key, hostname, skin.name)
  return {
    ...skin,
    key: fallback?.key || key,
    label: skin.label || skin.name || fallback?.label,
    icon: resolveSkinIcon(fallback?.icon || skin.icon || skin.logo),
  }
}

export function setSkins(configs) {
  const normalized = (Array.isArray(configs) ? configs : [])
    .map(normalizeSkinConfig)
    .filter(Boolean)
    .sort((a, b) => {
      const ap = Number.isFinite(a.sort_priority) ? a.sort_priority : Number.MAX_SAFE_INTEGER
      const bp = Number.isFinite(b.sort_priority) ? b.sort_priority : Number.MAX_SAFE_INTEGER
      return ap - bp
    })

  if (!normalized.length) return false
  skins.splice(0, skins.length, ...normalized.map((skin) => ({
    ...skin,
    icon: resolveSkinIcon(skin.icon),
  })))
  return true
}

export function getCurrentSkinKey() {
  if (typeof window === 'undefined') return DEFAULT_SKIN_KEY

  const host = window.location.hostname.toLowerCase()
  const match = skins.find((skin) => {
    try {
      return new URL(skin.url).hostname.toLowerCase() === host
    } catch {
      return false
    }
  })

  if (match?.key) return match.key

  const appKey = String(import.meta.env.VITE_MOBILE_APP_KEY || '').toLowerCase()
  if (appKey && skins.some((skin) => skin.key === appKey)) return appKey

  return DEFAULT_SKIN_KEY
}
