import homeSidebarIcon from '@/assets/img/icon/sidebar/home-sidebar-icon.svg'
import inplayIcon from '@/assets/img/icon/sidebar/inplay-icon.svg'
import inplayIconMobile from '@/assets/img/icon/sidebar/inplay-sidebar-mobile-icon.png'
import upcomingIcon from '@/assets/img/icon/sidebar/upcoming-icon.svg'
import upcomingIconMobile from '@/assets/img/icon/sidebar/upcoming-sidebar-mobile-icon.png'
import cricketSidebarIcon from '@/assets/img/icon/sidebar/cricket-sidebar-icon.svg'
import cricketSidebarIconMobile from '@/assets/img/icon/sidebar/cricket-sidebar-mobile-icon.svg'
import footballSidebarIcon from '@/assets/img/icon/sidebar/football-sidebar-icon.svg'
import footballSidebarIconMobile from '@/assets/img/icon/sidebar/football-sidebar-mobile-icon.svg'
import tennisSidebarIcon from '@/assets/img/icon/sidebar/tennis-sidebar-icon.svg'
import tennisSidebarIconMobile from '@/assets/img/icon/sidebar/tennis-sidebar-mobile-icon.svg'
import horseRacingSidebarIcon from '@/assets/img/icon/home-menu/horse-icon.png'
import greyhoundSidebarIcon from '@/assets/img/icon/home-menu/dog-icon.png'
import sportsbookSidebarIcon from '@/assets/img/icon/sidebar/sportsbook-sidebar-icon.svg'
import casinoSidebarIcon from '@/assets/img/icon/sidebar/casino-icon.svg'
import casinoSidebarIconMobile from '@/assets/img/icon/sidebar/casino-mobile-icon.svg'
import binarySidebarIcon from '@/assets/img/icon/sidebar/binary.svg'
import politicsSidebarIcon from '@/assets/img/icon/sidebar/politics.svg'
import tableTennisSidebarIcon from '@/assets/img/icon/sidebar/tableTennis.svg'
import basketballSidebarIcon from '@/assets/img/icon/sidebar/basketBall.svg'
import basketballSidebarIconMobile from '@/assets/img/icon/sidebar/basketball-sidebar-mobile-icon.svg'
import baseballSidebarIcon from '@/assets/img/icon/sidebar/baseBall.svg'
import baseballSidebarIconMobile from '@/assets/img/icon/sidebar/baseball-sidebar-mobile-icon.svg'
import iceHockeySidebarIcon from '@/assets/img/icon/sidebar/IceHockey.svg'
import volleyballSidebarIcon from '@/assets/img/icon/sidebar/volleyball.svg'
import volleyballSidebarIconMobile from '@/assets/img/icon/sidebar/volleyball-sidebar-mobile-icon.svg'
import kabaddiSidebarIcon from '@/assets/img/icon/sidebar/kabaddi.svg'
import rugbySidebarIcon from '@/assets/img/icon/sidebar/rugby.svg'
import mmaSidebarIcon from '@/assets/img/icon/sidebar/mma.svg'
import dartsSidebarIcon from '@/assets/img/icon/sidebar/darts.svg'
import futsalSidebarIcon from '@/assets/img/icon/sidebar/futsal.svg'
import sidebarExtraSlots from '@/assets/img/icon/sidebar/extra/slots.png'
import sidebarExtraFaq from '@/assets/img/icon/sidebar/extra/faq.png'
import sidebarExtraReferFriend from '@/assets/img/icon/sidebar/extra/referfriend.png'
import sidebarExtraAffiliate from '@/assets/img/icon/sidebar/extra/affiliate.png'
import {
  BINARY_EVENT_TYPE_ID,
  CASINO_EVENT_TYPE_ID,
  TENNIS_EVENT_TYPE_ID,
  HORSE_RACING_EVENT_TYPE_ID,
  GREYHOUND_RACING_EVENT_TYPE_ID
} from '@/composables/useEventTypes.js'

/** Reference mobile drawer icons (zuplay.com #sidebar1 — /zuplay/left-drawer/*). */
const MOBILE_DRAWER_ICON_PATHS = {
  'sidebar-home': '/zuplay/left-drawer/home.webp',
  [HORSE_RACING_EVENT_TYPE_ID]: '/zuplay/left-drawer/horse-icon.png',
  [GREYHOUND_RACING_EVENT_TYPE_ID]: '/zuplay/left-drawer/dog-icon.png',
  'sidebar-slots': '/zuplay/left-drawer/slots.png',
  'sidebar-faqs': '/zuplay/left-drawer/faq.webp',
  'sidebar-refer-friend': '/zuplay/left-drawer/referfriend.webp',
  'sidebar-affiliate': '/zuplay/left-drawer/affiliate.webp',
}

/** Desktop + mobile sidebar icon pairs (from ZU-Userfrontend sidebar.utils.ts). */
const SIDEBAR_ICON_BY_EVENT_ID = {
  'sidebar-home': { desktop: homeSidebarIcon, mobile: MOBILE_DRAWER_ICON_PATHS['sidebar-home'] },
  'sidebar-inplay': { desktop: inplayIcon, mobile: inplayIconMobile },
  'sidebar-upcoming': { desktop: upcomingIcon, mobile: upcomingIconMobile },
  4: { desktop: cricketSidebarIcon, mobile: cricketSidebarIconMobile },
  1: { desktop: footballSidebarIcon, mobile: footballSidebarIconMobile },
  [TENNIS_EVENT_TYPE_ID]: { desktop: tennisSidebarIcon, mobile: tennisSidebarIconMobile },
  [HORSE_RACING_EVENT_TYPE_ID]: { desktop: horseRacingSidebarIcon, mobile: MOBILE_DRAWER_ICON_PATHS[HORSE_RACING_EVENT_TYPE_ID] },
  [GREYHOUND_RACING_EVENT_TYPE_ID]: { desktop: greyhoundSidebarIcon, mobile: MOBILE_DRAWER_ICON_PATHS[GREYHOUND_RACING_EVENT_TYPE_ID] },
  99991: { desktop: sportsbookSidebarIcon, mobile: sportsbookSidebarIcon },
  [CASINO_EVENT_TYPE_ID]: { desktop: casinoSidebarIcon, mobile: casinoSidebarIconMobile },
  [BINARY_EVENT_TYPE_ID]: { desktop: binarySidebarIcon, mobile: binarySidebarIcon },
  2378961: { desktop: politicsSidebarIcon, mobile: politicsSidebarIcon },
  20: { desktop: tableTennisSidebarIcon, mobile: tableTennisSidebarIcon },
  7522: { desktop: basketballSidebarIcon, mobile: basketballSidebarIconMobile },
  7511: { desktop: baseballSidebarIcon, mobile: baseballSidebarIconMobile },
  7524: { desktop: iceHockeySidebarIcon, mobile: iceHockeySidebarIcon },
  998917: { desktop: volleyballSidebarIcon, mobile: volleyballSidebarIconMobile },
  99994: { desktop: kabaddiSidebarIcon, mobile: kabaddiSidebarIcon },
  5: { desktop: rugbySidebarIcon, mobile: rugbySidebarIcon },
  26420387: { desktop: mmaSidebarIcon, mobile: mmaSidebarIcon },
  3503: { desktop: dartsSidebarIcon, mobile: dartsSidebarIcon },
  29: { desktop: futsalSidebarIcon, mobile: futsalSidebarIcon },
  100000: { desktop: cricketSidebarIcon, mobile: cricketSidebarIconMobile },
  'sidebar-slots': { desktop: sidebarExtraSlots, mobile: MOBILE_DRAWER_ICON_PATHS['sidebar-slots'] },
  'sidebar-faqs': { desktop: sidebarExtraFaq, mobile: MOBILE_DRAWER_ICON_PATHS['sidebar-faqs'] },
  'sidebar-refer-friend': { desktop: sidebarExtraReferFriend, mobile: MOBILE_DRAWER_ICON_PATHS['sidebar-refer-friend'] },
  'sidebar-affiliate': { desktop: sidebarExtraAffiliate, mobile: MOBILE_DRAWER_ICON_PATHS['sidebar-affiliate'] },
}

/**
 * Resolve sidebar icon URL for a menu item (matches ZU-Userfrontend sidebar icon set).
 * @param {{ id?: string|number, name?: string }} item
 * @param {boolean} [isMobile=false]
 * @returns {string|null}
 */
export function getSidebarIconSrc(item, isMobile = false) {
  if (!item) return null

  const id = item.id
  if (isMobile && MOBILE_DRAWER_ICON_PATHS[id]) {
    return MOBILE_DRAWER_ICON_PATHS[id]
  }

  const entry = SIDEBAR_ICON_BY_EVENT_ID[id]
  if (entry) {
    return isMobile && entry.mobile ? entry.mobile : entry.desktop
  }

  const normalizedName = String(item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (isMobile) {
    const mobileByName = {
      home: MOBILE_DRAWER_ICON_PATHS['sidebar-home'],
      horseracing: MOBILE_DRAWER_ICON_PATHS[HORSE_RACING_EVENT_TYPE_ID],
      greyhoundracing: MOBILE_DRAWER_ICON_PATHS[GREYHOUND_RACING_EVENT_TYPE_ID],
      slots: MOBILE_DRAWER_ICON_PATHS['sidebar-slots'],
      faqs: MOBILE_DRAWER_ICON_PATHS['sidebar-faqs'],
      referafriend: MOBILE_DRAWER_ICON_PATHS['sidebar-refer-friend'],
    }
    if (mobileByName[normalizedName]) return mobileByName[normalizedName]
  }

  const byName = {
    home: homeSidebarIcon,
    inplay: inplayIcon,
    upcoming: upcomingIcon,
    cricket: cricketSidebarIcon,
    football: footballSidebarIcon,
    tennis: tennisSidebarIcon,
    horseracing: horseRacingSidebarIcon,
    greyhoundracing: greyhoundSidebarIcon,
    sportsbook: sportsbookSidebarIcon,
    casino: casinoSidebarIcon,
    binary: binarySidebarIcon,
    politics: politicsSidebarIcon,
    tabletennis: tableTennisSidebarIcon,
    basketball: basketballSidebarIcon,
    baseball: baseballSidebarIcon,
    icehockey: iceHockeySidebarIcon,
    volleyball: volleyballSidebarIcon,
    kabaddi: kabaddiSidebarIcon,
    rugby: rugbySidebarIcon,
    mixedmartialarts: mmaSidebarIcon,
    darts: dartsSidebarIcon,
    futsal: futsalSidebarIcon,
    other: cricketSidebarIcon
  }

  return byName[normalizedName] || null
}
