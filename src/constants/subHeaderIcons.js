/** Reference sports tab icons — /public/svg/sports-icons/ (from WazirWin React). */
export const SUB_HEADER_ICON_MAP = {
  home: { default: 'home.svg', active: 'home-green.svg' },
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
  basketball: { default: 'basketball.svg', active: 'basketball-green.svg' },
  baseball: { default: 'baseball.svg', active: 'baseball-green.svg' },
  tableTennis: { default: 'table-tennis.svg', active: 'table-tennis-green.svg' },
  volleyball: { default: 'volleyball.svg', active: 'volleyball-green.svg' },
  iceHockey: { default: 'ice-hockey.svg', active: 'ice-hockey-green.svg' },
  rugby: { default: 'rugby.svg', active: 'rugby-green.svg' },
  mixedMartialArts: { default: 'mma.svg', active: 'mma-green.svg' },
  darts: { default: 'darts.svg', active: 'darts-green.svg' },
  futsal: { default: 'futsal.svg', active: 'futsal-green.svg' },
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
