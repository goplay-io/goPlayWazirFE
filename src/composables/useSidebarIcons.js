import { getReferenceSidebarIconSrc } from '@/constants/sidebarIcons.js'
import inplayIconMobile from '@/assets/img/icon/sidebar/inplay-sidebar-mobile-icon.png'
import upcomingIconMobile from '@/assets/img/icon/sidebar/upcoming-sidebar-mobile-icon.png'
import cricketSidebarIconMobile from '@/assets/img/icon/sidebar/cricket-sidebar-mobile-icon.svg'
import footballSidebarIconMobile from '@/assets/img/icon/sidebar/football-sidebar-mobile-icon.svg'
import tennisSidebarIconMobile from '@/assets/img/icon/sidebar/tennis-sidebar-mobile-icon.svg'
import basketballSidebarIconMobile from '@/assets/img/icon/sidebar/basketball-sidebar-mobile-icon.svg'
import baseballSidebarIconMobile from '@/assets/img/icon/sidebar/baseball-sidebar-mobile-icon.svg'
import volleyballSidebarIconMobile from '@/assets/img/icon/sidebar/volleyball-sidebar-mobile-icon.svg'
import casinoSidebarIconMobile from '@/assets/img/icon/sidebar/casino-mobile-icon.svg'
import {
  HORSE_RACING_EVENT_TYPE_ID,
  GREYHOUND_RACING_EVENT_TYPE_ID,
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

const MOBILE_DRAWER_ICON_BY_EVENT_ID = {
  'sidebar-inplay': inplayIconMobile,
  'sidebar-upcoming': upcomingIconMobile,
  4: cricketSidebarIconMobile,
  1: footballSidebarIconMobile,
  2: tennisSidebarIconMobile,
  7522: basketballSidebarIconMobile,
  7511: baseballSidebarIconMobile,
  998917: volleyballSidebarIconMobile,
  99999: casinoSidebarIconMobile,
}

/**
 * Resolve sidebar icon URL for a menu item.
 * Desktop uses WazirWin reference /svg/sports-icons/ (20×20, h-5 w-5).
 * @param {{ id?: string|number, name?: string }} item
 * @param {boolean} [isMobileDrawer=false]
 * @returns {string|null}
 */
export function getSidebarIconSrc(item, isMobileDrawer = false) {
  if (!item) return null

  const id = item.id

  if (isMobileDrawer) {
    if (MOBILE_DRAWER_ICON_PATHS[id]) return MOBILE_DRAWER_ICON_PATHS[id]
    const mobileEntry = MOBILE_DRAWER_ICON_BY_EVENT_ID[id]
    if (mobileEntry) return mobileEntry
  } else {
    const referenceIcon = getReferenceSidebarIconSrc(item)
    if (referenceIcon) return referenceIcon
  }

  const normalizedName = String(item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (isMobileDrawer) {
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

  return getReferenceSidebarIconSrc(item)
}
