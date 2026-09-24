import { useRoute, useRouter } from 'vue-router'
import {
  HORSE_RACING_EVENT_TYPE_ID,
  GREYHOUND_RACING_EVENT_TYPE_ID
} from '@/composables/useEventTypes.js'

/**
 * Build live-page query for inline exchange sport selection.
 * @param {{ id?: string|number, name?: string }} item
 * @returns {{ path: string, query?: Record<string, string> }}
 */
export function getExchangeInlineSportRoute(item) {
  if (!item) return { path: '/sports/live' }

  if (item.id === 'inplay') {
    return { path: '/sports/live' }
  }

  if (item.id === 'upcoming') {
    return { path: '/sports/live', query: { feed: 'upcoming' } }
  }

  const sportId = Number(item.id)
  if (!Number.isFinite(sportId)) {
    return { path: '/sports/live' }
  }

  if (
    sportId === HORSE_RACING_EVENT_TYPE_ID ||
    sportId === GREYHOUND_RACING_EVENT_TYPE_ID
  ) {
    const slug =
      sportId === HORSE_RACING_EVENT_TYPE_ID ? 'horse_racing' : 'greyhound_racing'
    return { path: `/racing/races/${slug}` }
  }

  return { path: '/sports/live', query: { sport: String(sportId) } }
}

/**
 * Whether exchange strip item is active for current route.
 * @param {{ id?: string|number }} item
 * @param {import('vue-router').RouteLocationNormalizedLoaded} route
 */
export function isExchangeInlineSportActive(item, route) {
  if (!item || !route) return false

  if (item.id === 'inplay') {
    return route.name === 'live' && route.query.feed !== 'upcoming' && !route.query.sport
  }

  if (item.id === 'upcoming') {
    return route.name === 'live' && route.query.feed === 'upcoming'
  }

  const sportId = Number(item.id)
  if (!Number.isFinite(sportId)) return false

  if (route.name === 'sport') {
    return Number(route.params.event_type_id) === sportId
  }

  if (
    sportId === HORSE_RACING_EVENT_TYPE_ID &&
    route.name === 'racing-races' &&
    route.params.event_type_name === 'horse_racing'
  ) {
    return true
  }

  if (
    sportId === GREYHOUND_RACING_EVENT_TYPE_ID &&
    route.name === 'racing-races' &&
    route.params.event_type_name === 'greyhound_racing'
  ) {
    return true
  }

  if (route.name === 'live') {
    const querySport = Array.isArray(route.query.sport) ? route.query.sport[0] : route.query.sport
    return String(querySport) === String(sportId)
  }

  return false
}

/**
 * Navigate via exchange strip (inline on live/home, not sidebar detail routes).
 */
export function navigateExchangeSport(item, router) {
  const target = getExchangeInlineSportRoute(item)
  router.push(target)
}
