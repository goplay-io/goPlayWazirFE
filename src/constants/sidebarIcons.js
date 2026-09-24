/**
 * WazirWin reference sidebar icons — /public/svg/sports-icons/ (Sidebar.tsx + useSidebarTabs).
 */
import {
  BINARY_EVENT_TYPE_ID,
  CASINO_EVENT_TYPE_ID,
  CRICKET_EVENT_TYPE_ID,
  FOOTBALL_EVENT_TYPE_ID,
  GREYHOUND_RACING_EVENT_TYPE_ID,
  HORSE_RACING_EVENT_TYPE_ID,
  TENNIS_EVENT_TYPE_ID,
} from '@/composables/useEventTypes.js'

const SPORTS_ICONS_BASE = '/svg/sports-icons'

/** @type {Record<string|number, string>} */
export const REFERENCE_SIDEBAR_ICON_FILES = {
  'sidebar-home': 'home.svg',
  'sidebar-inplay': 'in-play-icon.svg',
  'sidebar-upcoming': 'in-play-icon.svg',
  [CRICKET_EVENT_TYPE_ID]: 'cricket.svg',
  [FOOTBALL_EVENT_TYPE_ID]: 'football.svg',
  [TENNIS_EVENT_TYPE_ID]: 'tennis.svg',
  [CASINO_EVENT_TYPE_ID]: 'casino.svg',
  99991: 'sports-book.svg',
  [HORSE_RACING_EVENT_TYPE_ID]: 'horse-racing.svg',
  [GREYHOUND_RACING_EVENT_TYPE_ID]: 'greyhound.svg',
  998917: 'volleyball.svg',
  5: 'rugby.svg',
  99994: 'kabadi.svg',
  7522: 'basketball.svg',
  7511: 'baseball.svg',
  20: 'table-tennis.svg',
  7524: 'ice-hockey.svg',
  26420387: 'mma.svg',
  3503: 'darts.svg',
  29: 'futsal.svg',
  [BINARY_EVENT_TYPE_ID]: 'binary.svg',
  2378961: 'politics.svg',
  100000: 'featured-icon.svg',
  99989: 'Mac88.svg',
  'sidebar-slots': 'slots.svg',
  'quick-fantasy11': 'featured-icon.svg',
  'quick-cricket-battle': 'cricket.svg',
}

/** @type {Record<string, string>} */
const REFERENCE_SIDEBAR_ICON_BY_NAME = {
  home: 'home.svg',
  inplay: 'in-play-icon.svg',
  upcoming: 'in-play-icon.svg',
  cricket: 'cricket.svg',
  football: 'football.svg',
  tennis: 'tennis.svg',
  casino: 'casino.svg',
  sportsbook: 'sports-book.svg',
  horseracing: 'horse-racing.svg',
  greyhoundracing: 'greyhound.svg',
  volleyball: 'volleyball.svg',
  rugby: 'rugby.svg',
  kabaddi: 'kabadi.svg',
  basketball: 'basketball.svg',
  baseball: 'baseball.svg',
  tabletennis: 'table-tennis.svg',
  icehockey: 'ice-hockey.svg',
  mixedmartialarts: 'mma.svg',
  mma: 'mma.svg',
  darts: 'darts.svg',
  futsal: 'futsal.svg',
  binary: 'binary.svg',
  politics: 'politics.svg',
  other: 'featured-icon.svg',
  mac88: 'Mac88.svg',
  slots: 'slots.svg',
  fantasy11: 'featured-icon.svg',
  cricketbattle: 'cricket.svg',
}

/**
 * @param {{ id?: string|number, name?: string }} item
 * @returns {string|null}
 */
export function getReferenceSidebarIconSrc(item) {
  if (!item) return null

  const id = item.id
  if (id != null && REFERENCE_SIDEBAR_ICON_FILES[id]) {
    return `${SPORTS_ICONS_BASE}/${REFERENCE_SIDEBAR_ICON_FILES[id]}`
  }

  const normalizedName = String(item.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  const byName = REFERENCE_SIDEBAR_ICON_BY_NAME[normalizedName]
  if (byName) return `${SPORTS_ICONS_BASE}/${byName}`

  return null
}
