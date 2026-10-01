/** Reference sports tab icons — /public/svg/sports-icons/ (from WazirWin React). */
export const SUB_HEADER_ICON_MAP = {
  home: { default: 'home.svg', active: 'home-green.svg' },
  affiliate: { default: 'affiliate.png', active: 'affiliate.png' },
  cricket: { default: 'cricket.svg', active: 'cricket-green.svg' },
  football: { default: 'football.svg', active: 'football-green.svg' },
  tennis: { default: 'tennis.svg', active: 'tennis-green.svg' },
  casino: { default: 'casino.svg', active: 'casino-green.svg' },
  sportsBook: { default: 'sports-book.svg', active: 'sports-book-green.svg' },
  horseRacing: { default: 'horse-racing.svg', active: 'horse-racing-green.svg' },
  greyhoundRacing: { default: 'greyhound.svg', active: 'greyhound-green.svg' },
  binary: { default: 'binary.svg', active: 'binary-green.svg' },
  kabaddi: { default: 'kabadi.svg', active: 'kabbadi-green.svg' },
  politics: { default: 'politics.svg', active: 'politics-green.svg' },
  basketball: { default: 'basketball.png', active: 'basketball.png' },
  baseball: { default: 'baseball.png', active: 'baseball.png' },
  tableTennis: { default: 'table-tennis.png', active: 'table-tennis.png' },
  volleyball: { default: 'volleyball.png', active: 'volleyball.png' },
  iceHockey: { default: 'ice-hockey.png', active: 'ice-hockey.png' },
  rugby: { default: 'rugby.png', active: 'rugby.png' },
  mixedMartialArts: { default: 'mma.png', active: 'mma.png' },
  darts: { default: 'darts.png', active: 'darts.png' },
  futsal: { default: 'futsal.png', active: 'futsal.png' },
  mac88: { default: 'Mac88.svg', active: 'mac88-green.svg' },
  other: { default: 'featured-icon.svg', active: 'featured-icon.svg' },
}

export function subHeaderIconSrc(key, active = false) {
  const entry = SUB_HEADER_ICON_MAP[key]
  if (!entry) return `/svg/sports-icons/featured-icon.svg`
  const file = active ? entry.active : entry.default
  return `/svg/sports-icons/${file}`
}

/** Green sport icon for home event table headers (reference GamesTableHeader). */
export function sportTableHeaderIconSrc(eventTypeKey) {
  return subHeaderIconSrc(eventTypeKey || 'other', true)
}
