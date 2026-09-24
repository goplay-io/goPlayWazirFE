import inplayIcon from '@/assets/img/icon/home-menu/inplay-icon.png'
import upcomingIcon from '@/assets/img/icon/home-menu/upcoming-icon.png'
import cricketIcon from '@/assets/img/icon/home-menu/cricket-icon.webp'
import footballIcon from '@/assets/img/icon/home-menu/football-icon.webp'
import tennisIcon from '@/assets/img/icon/home-menu/tennis-icon.webp'
import horseRacingIcon from '@/assets/img/icon/home-menu/horse-icon.png'
import greyhoundIcon from '@/assets/img/icon/home-menu/dog-icon.png'
import basketballIcon from '@/assets/img/icon/home-menu/basketball.svg'
import baseballIcon from '@/assets/img/icon/home-menu/baseball.svg'
import politicsIcon from '@/assets/img/icon/home-menu/politics.svg'
import binaryIcon from '@/assets/img/icon/home-menu/binary.svg'
import kabaddiIcon from '@/assets/img/icon/home-menu/kabaddi.svg'
import tableTennisIcon from '@/assets/img/icon/home-menu/table-tennis.svg'
import volleyballIcon from '@/assets/img/icon/home-menu/volleyball.svg'
import iceHockeyIcon from '@/assets/img/icon/home-menu/ice-hockey.svg'
import rugbyIcon from '@/assets/img/icon/home-menu/rugby.svg'
import dartsIcon from '@/assets/img/icon/home-menu/darts.svg'
import futsalIcon from '@/assets/img/icon/home-menu/futsal.svg'
import mmaIcon from '@/assets/img/icon/home-menu/mma.svg'
import sportsbookIcon from '@/assets/img/icon/home-menu/sportsbook-icon.png'
import casinoIcon from '@/assets/img/icon/home-menu/casino-icon.webp'
import {
  BINARY_EVENT_TYPE_ID,
  CASINO_EVENT_TYPE_ID,
  HORSE_RACING_EVENT_TYPE_ID,
  GREYHOUND_RACING_EVENT_TYPE_ID
} from '@/composables/useEventTypes.js'

/** Icons matched to zuplay.com `#buttonsContainer` / gamesNav assets. */
const HOME_MENU_ICON_BY_ID = {
  'inplay': inplayIcon,
  'upcoming': upcomingIcon,
  4: cricketIcon,
  1: footballIcon,
  2: tennisIcon,
  [HORSE_RACING_EVENT_TYPE_ID]: horseRacingIcon,
  [GREYHOUND_RACING_EVENT_TYPE_ID]: greyhoundIcon,
  7522: basketballIcon,
  7511: baseballIcon,
  2378961: politicsIcon,
  [BINARY_EVENT_TYPE_ID]: binaryIcon,
  99994: kabaddiIcon,
  20: tableTennisIcon,
  998917: volleyballIcon,
  7524: iceHockeyIcon,
  5: rugbyIcon,
  3503: dartsIcon,
  29: futsalIcon,
  26420387: mmaIcon,
  99991: sportsbookIcon,
  [CASINO_EVENT_TYPE_ID]: casinoIcon,
  100000: cricketIcon
}

const WIDE_ICON_IDS = new Set([
  HORSE_RACING_EVENT_TYPE_ID,
  GREYHOUND_RACING_EVENT_TYPE_ID
])

/**
 * @param {string|number} id
 * @returns {string|null}
 */
export function getHomeMenuIconSrc(id) {
  return HOME_MENU_ICON_BY_ID[id] || null
}

/**
 * @param {string|number} id
 * @returns {boolean}
 */
export function isHomeMenuWideIcon(id) {
  return WIDE_ICON_IDS.has(Number(id))
}
