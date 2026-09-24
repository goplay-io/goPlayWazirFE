import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Cricket from '@/components/Icons/Cricket.vue'
import Football from '@/components/Icons/Football.vue'
import Tennis from '@/components/Icons/Tennis.vue'
import TableTennis from '@/components/Icons/TableTennis.vue'
import Futsal from '@/components/Icons/Futsal.vue'
import HorseRacing from '@/components/Icons/Horse Racing.vue'
import Rugby from '@/components/Icons/Rugby.vue'
import GreyhoundRacing from '@/components/Icons/Greyhound Racing.vue'
import Baseball from '@/components/Icons/Baseball.vue'
import Basketball from '@/components/Icons/Basketball.vue'
import IceHockey from '@/components/Icons/IceHockey.vue'
import Volleyball from '@/components/Icons/Volleyball.vue'
import MixedMartialArts from '@/components/Icons/MixedMartialArts.vue'
import Darts from '@/components/Icons/Darts.vue'
import Binary from '@/components/Icons/Binary.vue'
import Kabaddi from '@/components/Icons/Kabaddi.vue'
import SportsBook from '@/components/Icons/SportsBook.vue'
import Casino from '@/components/Icons/Casino.vue'
import Politics from '@/components/Icons/Politics.vue'
import Inplay from '@/components/Icons/Inplay.vue'
import Other from '@/components/Icons/Other.vue'

export const INPLAY_NAV_ICON = Inplay

/** Betfair-style event type ids used for racing list pages (navbar + sidebar). */
export const HORSE_RACING_EVENT_TYPE_ID = 7
export const GREYHOUND_RACING_EVENT_TYPE_ID = 4339

/**
 * Same destinations as TopNavigation racing tabs — racing hub, not /sports/:id.
 * @param {{ id?: number, key?: string }|null|undefined} eventType
 * @returns {string|null}
 */
export function getRacingRacesListRoute(eventType) {
  if (!eventType) return null
  const { id, key } = eventType
  if (id === HORSE_RACING_EVENT_TYPE_ID || key === 'horseRacing') {
    return '/racing/races/horse_racing'
  }
  if (id === GREYHOUND_RACING_EVENT_TYPE_ID || key === 'greyhoundRacing') {
    return '/racing/races/greyhound_racing'
  }
  return null
}

export function isRacingEventTypeId(eventTypeId) {
  const id = Number(eventTypeId)
  return id === HORSE_RACING_EVENT_TYPE_ID || id === GREYHOUND_RACING_EVENT_TYPE_ID
}

/**
 * Racing bet page from a live/events list row (needs event + market id).
 * @param {object|null|undefined} event
 * @returns {string|null}
 */
export function getRacingBetRouteFromEvent(event) {
  if (!event || !isRacingEventTypeId(event.event_type_id ?? event.eventTypeId)) return null

  const eventId = event.event_id ?? event.id
  const marketId = event.market_id ?? event.marketId
  if (eventId == null || eventId === '' || marketId == null || marketId === '') return null

  return `/racing/bet/${eventId}/${marketId}`
}

/**
 * Bet page path for event list rows (sports vs horse/greyhound racing).
 * @param {object|null|undefined} event
 * @returns {string|null}
 */
export function getEventBetRoute(event) {
  if (!event) return null

  const eventTypeId = event.event_type_id ?? event.eventTypeId
  if (isRacingEventTypeId(eventTypeId)) {
    const racingBetRoute = getRacingBetRouteFromEvent(event)
    if (racingBetRoute) return racingBetRoute
    return getRacingRacesListRoute({ id: Number(eventTypeId) })
  }

  const eventId = event.event_id ?? event.id
  if (eventId == null || eventId === '') return null

  return `/sports/bet/${eventId}`
}

export const BINARY_EVENT_TYPE_ID = 99990
export const CASINO_EVENT_TYPE_ID = 99999
export const FOOTBALL_EVENT_TYPE_ID = 1
export const TENNIS_EVENT_TYPE_ID = 2
export const CRICKET_EVENT_TYPE_ID = 4

/** Home IN-PLAY / UPCOMING strip — cricket, football, tennis only. */
export const HOME_INPLAY_UPCOMING_SPORT_IDS = new Set([
  CRICKET_EVENT_TYPE_ID,
  FOOTBALL_EVENT_TYPE_ID,
  TENNIS_EVENT_TYPE_ID
])

/**
 * Reference desktop navbar order (pills-tab after Inplay).
 * Quick games (Fantasy 11, Cricket Battle, Casino) are inserted after Tennis in TopNavigation.
 */
export const SPORT_NAV_MENU_ORDER = [
  4, 1, 2,
  99991, 7, 4339, 99990, 99994, 2378961, 7522, 7511, 20, 998917, 7524, 5, 26420387, 3503, 29,
  99989, 100000
]

/**
 * Sport navigation menus (desktop bar, mobile strips, home/live tab rows).
 */
export function includeInSportNavMenu(item) {
  if (item == null) return false
  return true
}

/**
 * @param {Array<{ id?: number, name?: string }>} items
 * @returns {Array<{ id?: number, name?: string }>}
 */
export function sortEventTypesForSportNav(items) {
  const list = Array.isArray(items) ? items.filter(includeInSportNavMenu) : []
  const orderIndex = new Map(SPORT_NAV_MENU_ORDER.map((id, index) => [id, index]))
  const fallback = SPORT_NAV_MENU_ORDER.length

  return [...list].sort((a, b) => {
    const aIdx = orderIndex.get(Number(a?.id)) ?? fallback
    const bIdx = orderIndex.get(Number(b?.id)) ?? fallback
    if (aIdx !== bIdx) return aIdx - bIdx
    return String(a?.name || '').localeCompare(String(b?.name || ''))
  })
}

/**
 * Composable for event types and icon mapping functionality
 * Similar to the React useEventTypes hook
 */
export function useEventTypes() {
  // Icon component map - add icon components here as they are created
  const iconComponents = {
    Cricket,
    Football,
    Tennis,
    TableTennis,
    Futsal,
    'Horse Racing': HorseRacing,
    Rugby,
    'Greyhound Racing': GreyhoundRacing,
    Baseball,
    Basketball,
    'Ice Hockey': IceHockey,
    Volleyball,
    'Mixed Martial Arts': MixedMartialArts,
    Darts,
    Binary,
    Kabaddi,
    'Sports book': SportsBook,
    Casino,
    Politics,
    Other,
    Inplay,
  }

  // Event types with IDs, stable keys, localized names, and icon component references
  const { t } = useI18n()

  const eventTypes = computed(() => [
    { id: 1, key: 'football', name: t('eventTypes.football'), icon: iconComponents.Football || null },
    { id: 2, key: 'tennis', name: t('eventTypes.tennis'), icon: iconComponents.Tennis || null },
    { id: 4, key: 'cricket', name: t('eventTypes.cricket'), icon: iconComponents.Cricket || null },
    { id: 5, key: 'rugby', name: t('eventTypes.rugby'), icon: iconComponents.Rugby || null },
    { id: 7, key: 'horseRacing', name: t('eventTypes.horseRacing'), icon: iconComponents['Horse Racing'] || null },
    { id: 20, key: 'tableTennis', name: t('eventTypes.tableTennis'), icon: iconComponents.TableTennis || null },
    { id: 29, key: 'futsal', name: t('eventTypes.futsal'), icon: iconComponents.Futsal || null },
    { id: 3503, key: 'darts', name: t('eventTypes.darts'), icon: iconComponents.Darts || null },
    { id: 4339, key: 'greyhoundRacing', name: t('eventTypes.greyhoundRacing'), icon: iconComponents['Greyhound Racing'] || null },
    { id: 7511, key: 'baseball', name: t('eventTypes.baseball'), icon: iconComponents.Baseball || null },
    { id: 7522, key: 'basketball', name: t('eventTypes.basketball'), icon: iconComponents.Basketball || null },
    { id: 7524, key: 'iceHockey', name: t('eventTypes.iceHockey'), icon: iconComponents['Ice Hockey'] || null },
    { id: 99990, key: 'binary', name: t('eventTypes.binary'), icon: iconComponents.Binary || null },
    { id: 99991, key: 'sportsBook', name: t('eventTypes.sportsBook'), icon: iconComponents['Sports book'] || null },
    { id: 99994, key: 'kabaddi', name: t('eventTypes.kabaddi'), icon: iconComponents.Kabaddi || null },
    { id: 99999, key: 'casino', name: t('eventTypes.casino'), icon: iconComponents.Casino || null },
    { id: 998917, key: 'volleyball', name: t('eventTypes.volleyball'), icon: iconComponents.Volleyball || null },
    { id: 2378961, key: 'politics', name: t('eventTypes.politics'), icon: iconComponents.Politics || null },
    { id: 26420387, key: 'mixedMartialArts', name: t('eventTypes.mixedMartialArts'), icon: iconComponents['Mixed Martial Arts'] || null },
    { id: 100000, key: 'other', name: t('eventTypes.other'), icon: iconComponents.Other || null }
  ])

  /**
   * Get event type by ID
   * @param {number} id - Event type ID
   * @returns {Object|null} Event type object or null
   */
  const getEventTypeById = (id) => {
    return eventTypes.value.find(eventType => eventType.id === id) || null
  }

  /**
   * Get event type name by ID
   * @param {number} id - Event type ID
   * @returns {string|null} Event type name or null
   */
  const getEventTypeName = (id) => {
    const eventType = getEventTypeById(id)
    return eventType ? eventType.name : null
  }

  /**
   * Get event type icon component by ID
   * @param {number} id - Event type ID
   * @returns {Object|null} Icon component or null
   */
  const getEventTypeIcon = (id) => {
    const eventType = getEventTypeById(id)
    return eventType ? eventType.icon : null
  }

  /**
   * Get icon component for sport or event type (backward compatibility)
   * @param {Object|string|number} sportOrNameOrId - Sport object, name string, or ID number
   * @returns {Object|null} Icon component or null
   */
  const getSportIcon = (sportOrNameOrId) => {
    // Handle object with icon property
    if (typeof sportOrNameOrId === 'object' && sportOrNameOrId.icon) {
      return sportOrNameOrId.icon
    }
    // Handle object with id property
    if (typeof sportOrNameOrId === 'object' && sportOrNameOrId.id) {
      return getEventTypeIcon(sportOrNameOrId.id)
    }

    // Handle numeric ID
    if (typeof sportOrNameOrId === 'number') {
      return getEventTypeIcon(sportOrNameOrId)
    }

    // Normalize helper for robust matching
    const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '')

    // Handle string input: prefer matching stable `key`, then localized `name` (normalized)
    const input = typeof sportOrNameOrId === 'object' ? sportOrNameOrId.name : sportOrNameOrId
    if (typeof input === 'string') {
      const normalizedInput = normalize(input)
      for (const et of eventTypes.value) {
        if (normalize(et.key) === normalizedInput) return et.icon || null
        if (normalize(et.name) === normalizedInput) return et.icon || null
      }
    }

    return null
  }

  const getInplayNavIcon = () => INPLAY_NAV_ICON

  return {
    eventTypes,
    getEventTypeById,
    getEventTypeName,
    getEventTypeIcon,
    getSportIcon, // Keep for backward compatibility
    getInplayNavIcon,
    getRacingRacesListRoute
  }
}
