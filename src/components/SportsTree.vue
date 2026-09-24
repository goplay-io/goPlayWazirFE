<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  useEventTypes,
  includeInSportNavMenu,
  getRacingRacesListRoute,
  BINARY_EVENT_TYPE_ID,
  CASINO_EVENT_TYPE_ID,
  sortEventTypesForSportNav
} from '@/composables/useEventTypes.js'
import { getSidebarIconSrc } from '@/composables/useSidebarIcons.js'
import {
  insertQuickGameTabsAfterTennis,
  insertCasinoTabAfterQuickGames,
  isQuickGameTab
} from '@/composables/useQuickGameTabs.js'
import { useAuthStore } from '@/stores/auth'
import { useEventsStore } from '@/stores/events/events'
import useDevices from '@/composables/useDevices.js'
import { prefetchBetEvent } from '@/composables/useBetEventPrefetch'
import { compareEventsByOpenDate } from '@/utils/eventStarSort'
import { AVAILABLE_LOCALES } from '@/constants/locales.js'
import defaultAvatar from '@/assets/default-avatar.svg'
import sidebarLanguagesIcon from '@/assets/img/icon/sidebar/languages-sidebar-icon.svg'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()
const { eventTypes } = useEventTypes()
const authStore = useAuthStore()
const eventsStore = useEventsStore()
const { isMobile } = useDevices()

const props = defineProps({
  languagesActive: { type: Boolean, default: false },
  mobileDrawer: { type: Boolean, default: false },
})

const emit = defineEmits(['navigate', 'open-languages'])

const isLoading = ref(false)
const dataLoaded = ref(false)
const expandedSports = ref(new Set())
const expandedComps = ref(new Set())
const casinoExpanded = ref(false)
const mobileSearchQuery = ref('')

const CASINO_MENU_ITEM = {
  id: CASINO_EVENT_TYPE_ID,
  name: 'Casino',
  competitions: []
}

const SIDEBAR_HOME_ITEM = {
  id: 'sidebar-home',
  name: 'Home',
  sidebarHome: true,
}

const SIDEBAR_HOME_LINKS = [
  { id: 'sidebar-inplay', name: 'Inplay', sidebarFeed: 'inplay' },
  { id: 'sidebar-upcoming', name: 'Upcoming', sidebarFeed: 'upcoming' }
]

const CASINO_SUBMENU_ITEMS = [
  { label: 'Roulette', icon: '/card-bg/game-icons/roulette.png', query: 'Roulette' },
  { label: 'Baccarat', icon: '/card-bg/game-icons/baccarat.png', query: 'Baccarat' },
  { label: 'Instant Game', icon: '/card-bg/game-icons/instantgame.png', query: 'Instant Game' },
  { label: 'Gameshow', icon: '/card-bg/game-icons/gameshow.png', query: 'Game Shows' },
  { label: 'Dragon Tiger', icon: '/card-bg/game-icons/dragon-tiger.png', query: 'Dragon Tiger' },
  { label: 'Blackjack', icon: '/card-bg/game-icons/blackjack.png', query: 'Blackjack' },
  { label: 'Poker', icon: '/card-bg/game-icons/poker.png', query: 'Poker' },
  { label: 'Teenpatti', icon: '/card-bg/game-icons/teenpatti.png', query: 'Teen Patti' },
  { label: 'Slot', icon: '/card-bg/game-icons/slot.png', query: 'Slot' },
]

const SIDEBAR_UTILITY_ITEMS = [
  { id: 'sidebar-slots', name: 'Slots', route: '/casino' },
  { id: 'sidebar-faqs', name: "FAQ's", route: '/faqs' },
  { id: 'sidebar-refer-friend', name: 'Refer a Friend', route: '/refer-friend' },
]

const allEvents = computed(() => eventsStore.allEvents)

const selectedLanguageLabel = computed(() => {
  const match = AVAILABLE_LOCALES.find((entry) => entry.code === locale.value)
  return match?.value || 'English'
})

function usesMobileSidebarIcons() {
  return props.mobileDrawer
}

function competitionGroupKey(ev) {
  const n = ev?.competition_name
  if (n == null || n === '') return 'Others'
  const s = String(n).trim()
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return 'Others'
  return s
}

const competitionsByType = computed(() => {
  const result = {}

  allEvents.value.forEach((ev) => {
    const typeId = Number(ev.event_type_id)
    if (!Number.isFinite(typeId)) return

    const compName = competitionGroupKey(ev)
    const compId = ev.competition_id ?? null
    const numericCompId = Number(compId)

    if (!result[typeId]) result[typeId] = []

    const existing = result[typeId].find((c) => {
      if (compName === 'Others') return c.name === 'Others'
      if (Number.isFinite(numericCompId) && numericCompId > 0) {
        return Number(c.id) === numericCompId
      }
      return c.name === compName && (!c.id || Number(c.id) <= 0)
    })

    if (!existing) {
      result[typeId].push({
        id: compName === 'Others' ? null : compId,
        name: compName
      })
    }
  })

  Object.values(result).forEach((comps) => {
    comps.sort((a, b) => a.name.localeCompare(b.name))
  })

  return result
})

const sidebarMenuItems = computed(() => {
  // Use static menu from useEventTypes (same as TopNavigation) — no menu/list API.
  const menu = (eventTypes.value || []).map((item) => ({
    id: Number(item.id),
    name: String(item.name || '').trim()
  }))

  const filtered = menu.filter((item) => {
    if (!item?.name || !Number.isFinite(Number(item.id))) return false
    return includeInSportNavMenu(item)
  })

  const sorted = sortEventTypesForSportNav(filtered)
    .filter((item) => Number(item.id) !== CASINO_EVENT_TYPE_ID)
    .map((item) => ({
      ...item,
      competitions: competitionsByType.value[Number(item.id)] || []
    }))

  const sportItems = insertCasinoTabAfterQuickGames(insertQuickGameTabsAfterTennis(sorted), CASINO_MENU_ITEM)
  if (props.mobileDrawer) {
    return [SIDEBAR_HOME_ITEM, ...SIDEBAR_HOME_LINKS, ...sportItems]
  }
  // Reference desktop Sidebar.tsx — flat sports/casino list (no Inplay/Upcoming header links).
  return sportItems
})

const visibleSidebarMenuItems = computed(() => sidebarMenuItems.value)

const mobileEventSearchResults = computed(() => {
  if (!props.mobileDrawer) return []
  const q = String(mobileSearchQuery.value || '').trim().toLowerCase()
  if (!q) return []

  return (allEvents.value || [])
    .filter((ev) => {
      const name = String(ev?.event_name || ev?.name || '').toLowerCase()
      const competition = String(ev?.competition_name || '').toLowerCase()
      const sport = String(ev?.event_type_name || '').toLowerCase()
      const home = String(ev?.home_team || ev?.team_home || '').toLowerCase()
      const away = String(ev?.away_team || ev?.team_away || '').toLowerCase()
      return (
        name.includes(q) ||
        competition.includes(q) ||
        sport.includes(q) ||
        home.includes(q) ||
        away.includes(q)
      )
    })
    .slice(0, 40)
})

function isWideSidebarIcon(item) {
  const name = String(item?.name || '').toLowerCase()
  return name.includes('horse') || name.includes('greyhound')
}

/** Match ZU-Userfrontend `invertIconMobile` sidebar entries. */
function shouldInvertMobileSidebarIcon(item) {
  if (!props.mobileDrawer) return false
  const normalized = String(item?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const invertNames = new Set([
    'sportsbook',
    'binary',
    'politics',
    'tabletennis',
    'basketball',
    'baseball',
    'icehockey',
    'volleyball',
    'kabaddi',
    'gamerules',
    'aviator',
    'downloadapk',
  ])
  return invertNames.has(normalized)
}

function isSidebarHomeLink(item) {
  return item?.sidebarFeed === 'inplay' || item?.sidebarFeed === 'upcoming'
}

function isSidebarHomeItem(item) {
  return Boolean(item?.sidebarHome)
}

function isCasinoMenuItem(item) {
  return Number(item?.id) === CASINO_EVENT_TYPE_ID || String(item?.name || '') === 'Casino'
}

function compExpandKey(sportId, comp) {
  const nid = Number(comp?.id)
  if (Number.isFinite(nid) && nid > 0) return `${sportId}::id:${nid}`
  return `${sportId}::name:${comp?.name ?? ''}`
}

function isCompExpanded(sportId, comp) {
  return expandedComps.value.has(compExpandKey(sportId, comp))
}

function eventCountForSport(sportId) {
  const sid = Number(sportId)
  return allEvents.value.filter((ev) => Number(ev.event_type_id) === sid).length
}

function eventsForSportCompetition(sportId, comp) {
  const sid = Number(sportId)
  const compId = comp?.id
  const compName = comp?.name

  return allEvents.value
    .filter((ev) => {
      if (Number(ev.event_type_id) !== sid) return false
      const nid = Number(compId)
      if (Number.isFinite(nid) && nid > 0) {
        return Number(ev.competition_id) === nid
      }
      return competitionGroupKey(ev) === compName
    })
    .slice()
    .sort((a, b) => {
      const result = compareEventsByOpenDate(
        { ...a, open_date: a.open_date || a.start_time },
        { ...b, open_date: b.open_date || b.start_time },
      )
      if (result !== 0) return result
      return String(a.event_name || a.name || '').localeCompare(String(b.event_name || b.name || ''))
    })
}

function normalizeSportId(id) {
  const n = Number(id)
  return Number.isFinite(n) ? n : id
}

function autoExpandCompsForSport(sportId) {
  if (!isMobile.value) return

  const sid = normalizeSportId(sportId)
  const comps = competitionsByType.value[sid] || []
  if (!comps.length) return

  const shouldAutoExpand =
    sid === BINARY_EVENT_TYPE_ID || comps.length === 1
  if (!shouldAutoExpand) return

  const next = new Set(expandedComps.value)
  for (const comp of comps) {
    next.add(compExpandKey(sid, comp))
  }
  expandedComps.value = next
}

function toggleSport(id) {
  const sid = normalizeSportId(id)
  const next = new Set(expandedSports.value)
  if (next.has(sid)) {
    next.delete(sid)
  } else {
    next.add(sid)
    autoExpandCompsForSport(sid)
  }
  expandedSports.value = next
}

function toggleComp(sportId, comp) {
  const key = compExpandKey(sportId, comp)
  const next = new Set(expandedComps.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedComps.value = next
}

function isSportExpanded(sportId) {
  return expandedSports.value.has(normalizeSportId(sportId))
}

const showLoggedUserBar = computed(() => authStore.isUiAuthenticated)

const sidebarUsername = computed(() => {
  const user = authStore.currentUser
  const name = user?.username || user?.name || 'User'
  return String(name).toUpperCase()
})

const sidebarUserAvatar = computed(() => authStore.currentUser?.avatar || null)

function isFantasyItem(item) {
  return Boolean(item?.isQuickGame)
}

function isDirectNavItem(item) {
  if (isSidebarHomeItem(item)) return true
  if (isSidebarHomeLink(item)) return true
  if (isQuickGameTab(item)) return true
  const name = String(item?.name || '')
  if (name === 'Sports book' || name === 'Casino') return true
  return !!getRacingRacesListRoute(item)
}

function getMenuItemRoute(item) {
  if (isSidebarHomeItem(item)) return '/'
  if (isSidebarHomeLink(item)) {
    return item.sidebarFeed === 'upcoming' ? '/sports/live?feed=upcoming' : '/sports/live'
  }
  if (isQuickGameTab(item)) return item.route

  const name = String(item?.name || '')

  if (name === 'Sports book') {
    if (authStore.isDemoUser) return route.fullPath || route.path
    return '/sports-book'
  }

  if (name === 'Casino') return '/casino'

  const racingList = getRacingRacesListRoute(item)
  if (racingList) return racingList

  return `/sports/${item.id}`
}

function isMenuItemActive(item) {
  if (isSidebarHomeItem(item)) {
    return route.path === '/' || route.name === 'home'
  }
  if (isSidebarHomeLink(item)) {
    if (route.path !== '/sports/live') return false
    const feed = route.query.feed
    const feedValue = Array.isArray(feed) ? feed[0] : feed
    if (item.sidebarFeed === 'upcoming') return feedValue === 'upcoming'
    return feedValue !== 'upcoming'
  }
  if (isQuickGameTab(item)) return route.path === item.route

  const name = String(item?.name || '')

  if (name === 'Sports book') return route.path === '/sports-book'
  if (name === 'Casino') return route.path.startsWith('/casino')

  const racingList = getRacingRacesListRoute(item)
  if (racingList) {
    return route.path === racingList || route.path.startsWith(`${racingList}/`)
  }

  const routeTypeId = Number(route.params?.event_type_id)
  if (Number.isFinite(routeTypeId) && routeTypeId === Number(item.id)) {
    return true
  }

  if (route.path.startsWith('/sports/bet/')) {
    const eid = route.params?.event_id
    const ev = (eventsStore.allEvents || []).find(
      (e) => String(e.event_id ?? e.id) === String(eid)
    )
    if (ev && Number(ev.event_type_id) === Number(item.id)) return true
  }

  return false
}

function navigateSidebarHomeLink(item) {
  router.push({
    path: '/sports/live',
    query: item.sidebarFeed === 'upcoming' ? { feed: 'upcoming' } : {}
  })
  emit('navigate')
}

function navigateSidebarHome() {
  if (route.path !== '/' && route.name !== 'home') {
    router.push({ name: 'home' }).catch(() => router.push('/'))
  }
  emit('navigate')
}

function navigateCasinoSubItem(sub) {
  router.push({ path: '/casino', query: { gamename: sub.query } })
  emit('navigate')
}

function isCasinoSubItemActive(sub) {
  if (!route.path.startsWith('/casino')) return false
  const q = route.query.gamename
  const val = Array.isArray(q) ? q[0] : q
  return String(val || '') === sub.query
}

function selectMobileSearchEvent(ev) {
  if (!ev) return
  mobileSearchQuery.value = ''
  navigateToEvent(ev.event_id ?? ev.id)
}

function eventDisplayName(ev) {
  if (!ev) return ''
  if (ev.event_name) return String(ev.event_name)
  const h = ev.home_team || ev.team_home
  const a = ev.away_team || ev.team_away
  if (h || a) return [h, a].filter(Boolean).join(' v ')
  return ev.name ? String(ev.name) : ''
}

function onSportRowClick(item) {
  if (isSidebarHomeItem(item)) {
    navigateSidebarHome()
    return
  }

  if (isSidebarHomeLink(item)) {
    navigateSidebarHomeLink(item)
    return
  }

  if (isCasinoMenuItem(item)) {
    if (props.mobileDrawer) {
      casinoExpanded.value = !casinoExpanded.value
      return
    }
    if (route.path !== '/casino') router.push('/casino')
    emit('navigate')
    return
  }

  const racingList = getRacingRacesListRoute(item)
  if (racingList) {
    if (route.path !== racingList) router.push(racingList)
    emit('navigate')
    return
  }

  const path = getMenuItemRoute(item)
  if (isDirectNavItem(item)) {
    if (path !== route.fullPath && path !== route.path) router.push(path)
    emit('navigate')
    return
  }

  if (path !== route.path) router.push(path)
  emit('navigate')
}

function onCompetitionRowClick(sportId, comp) {
  if (isMobile.value) {
    toggleComp(sportId, comp)
    return
  }
  navigateToCompetition(sportId, comp.id, comp.name)
}

function isCompetitionActive(sportId, compId, compName) {
  if (Number(route.params.event_type_id) !== Number(sportId)) return false
  const rid = route.params.competition_id
  const routeCid = rid != null && rid !== '' ? Number(rid) : NaN
  if (Number.isFinite(routeCid) && routeCid > 0) {
    const rowId = Number(compId)
    return Number.isFinite(rowId) && rowId > 0 && rowId === routeCid
  }
  const q = route.query?.league
  const qStr = q == null ? '' : Array.isArray(q) ? String(q[0] ?? '') : String(q)
  if (qStr.trim() !== '' && (!compId || Number(compId) <= 0)) {
    return (compName || '') === qStr.trim()
  }
  return false
}

function navigateToCompetition(sportId, compId, compName) {
  const name = compName || 'Others'
  const numericCompId = Number(compId)
  const hasNumericId = Number.isFinite(numericCompId) && numericCompId > 0

  if (hasNumericId) {
    router.push(`/sports/${sportId}/${numericCompId}`)
    emit('navigate')
    return
  }

  router.push({
    path: `/sports/${sportId}`,
    query: { league: name }
  })
  emit('navigate')
}

function navigateToEvent(eventId) {
  if (eventId) prefetchBetEvent(eventId)
  router.push(`/sports/bet/${eventId}`)
  emit('navigate')
}

function isEventRowActive(ev) {
  if (!route.path.startsWith('/sports/bet/')) return false
  const id = route.params?.event_id
  return id != null && String(ev.event_id ?? ev.id) === String(id)
}

async function loadData() {
  try {
    isLoading.value = true
    await eventsStore.waitForEvents()
    dataLoaded.value = true
  } catch (e) {
    console.error('SportsTree: failed to load events', e)
  } finally {
    isLoading.value = false
  }
}

function isAffiliateActive() {
  return route.path === '/affiliate' || route.path.startsWith('/affiliate/')
}

function navigateToAffiliate() {
  if (route.path === '/affiliate') return
  router.push('/affiliate')
  emit('navigate')
}

function isSidebarUtilityActive(item) {
  const path = String(item?.route || '')
  if (path === '/casino') return route.path.startsWith('/casino')
  return route.path === path
}

function navigateSidebarUtilityItem(item) {
  const path = String(item?.route || '')
  if (!path) return
  if (route.path === path || (path === '/casino' && route.path.startsWith('/casino'))) return
  router.push(path)
  emit('navigate')
}

function openLanguagesMenu() {
  emit('open-languages')
}

onMounted(loadData)
</script>

<template>
  <div
    class="sidebar-menu tw-h-full tw-flex tw-flex-col tw-overflow-hidden"
    :class="{ 'sidebar-menu--mobile-drawer': props.mobileDrawer }"
  >
    <div v-if="isLoading" class="tw-flex tw-items-center tw-justify-center tw-flex-1">
      <v-progress-circular indeterminate :color="props.mobileDrawer ? 'white' : 'primary'" size="22" />
    </div>

    <div v-else class="sidebar-menu-body tw-flex tw-flex-col tw-flex-1 tw-min-h-0">
      <div v-if="props.mobileDrawer && showLoggedUserBar" class="sidebar-mobile-chrome">
        <div class="sidebar-mobile-search">
          <input
            v-model="mobileSearchQuery"
            type="search"
            class="sidebar-mobile-search__input"
            placeholder="Search Events..."
            autocomplete="off"
          />
          <div
            v-if="mobileSearchQuery.trim()"
            class="sidebar-mobile-search__results"
          >
            <button
              v-for="ev in mobileEventSearchResults"
              :key="ev.event_id ?? ev.id"
              type="button"
              class="sidebar-mobile-search__result"
              @click="selectMobileSearchEvent(ev)"
            >
              <span class="sidebar-mobile-search__result-title">{{ eventDisplayName(ev) }}</span>
              <span
                v-if="ev.competition_name || ev.event_type_name"
                class="sidebar-mobile-search__result-meta"
              >
                {[ev.event_type_name, ev.competition_name].filter(Boolean).join(' · ')}
              </span>
            </button>
            <div
              v-if="!mobileEventSearchResults.length"
              class="sidebar-mobile-search__empty"
            >
              No events found
            </div>
          </div>
        </div>
      </div>

    <div class="sidebar-menu-scroll tw-flex-1 tw-overflow-y-auto">
      <template v-for="item in visibleSidebarMenuItems" :key="item.id">
        <div class="sidebar-menu-row-wrap">
        <div
          class="sidebar-menu-row"
          :class="{
            'sidebar-menu-row--active': isMenuItemActive(item),
            'sidebar-menu-row--demo-disabled': authStore.isDemoUser && item.name === 'Sports book'
          }"
          @click="onSportRowClick(item)"
        >
          <img
            v-if="getSidebarIconSrc(item, usesMobileSidebarIcons())"
            :src="getSidebarIconSrc(item, usesMobileSidebarIcons())"
            alt=""
            class="sidebar-menu-icon sidebar-menu-icon--sport sidebar-menu-icon--img"
            :class="{
              'sidebar-menu-icon--invert': shouldInvertMobileSidebarIcon(item),
              'sidebar-menu-icon--wide': usesMobileSidebarIcons() && isWideSidebarIcon(item)
            }"
          />
          <component
            :is="item.icon"
            v-else-if="item.icon"
            class="sidebar-menu-icon sidebar-menu-icon--sport"
            :class="{ 'sidebar-menu-icon--wide': usesMobileSidebarIcons() && isWideSidebarIcon(item) }"
          />
          <div v-else class="sidebar-menu-icon-placeholder" aria-hidden="true" />
          <span class="sidebar-menu-label">{{ item.name }}</span>
          <span v-if="item.isNew && !isMenuItemActive(item)" class="sidebar-new-badge">NEW</span>
          <v-icon
            v-if="isCasinoMenuItem(item) && props.mobileDrawer"
            size="16"
            class="sidebar-menu-chevron sidebar-menu-chevron--accordion"
            :class="{ 'sidebar-menu-chevron--open': casinoExpanded }"
          >mdi-chevron-down</v-icon>
        </div>
        </div>

        <div
          v-if="isCasinoMenuItem(item) && casinoExpanded && props.mobileDrawer"
          class="sidebar-casino-submenu"
          :class="{ 'sidebar-casino-submenu--mobile': props.mobileDrawer }"
        >
          <div
            v-for="(sub, subIndex) in CASINO_SUBMENU_ITEMS"
            :key="sub.label"
            class="sidebar-casino-subrow"
            :class="{
              'sidebar-casino-subrow--active': isCasinoSubItemActive(sub),
              'sidebar-casino-subrow--last': subIndex === CASINO_SUBMENU_ITEMS.length - 1,
            }"
            @click="navigateCasinoSubItem(sub)"
          >
            <img :src="sub.icon" alt="" class="sidebar-casino-subrow__icon" loading="lazy" />
            <span class="sidebar-casino-subrow__label">{{ sub.label }}</span>
          </div>
        </div>

      </template>

      <div v-if="!visibleSidebarMenuItems.length && !showLoggedUserBar" class="sidebar-menu-empty">
        No sports available
      </div>

      <template v-if="props.mobileDrawer">
        <template v-for="item in SIDEBAR_UTILITY_ITEMS" :key="item.id">
          <div class="sidebar-menu-row-wrap">
            <div
              class="sidebar-menu-row"
              :class="{ 'sidebar-menu-row--active': isSidebarUtilityActive(item) }"
              @click="navigateSidebarUtilityItem(item)"
            >
              <img
                v-if="getSidebarIconSrc(item, true)"
                :src="getSidebarIconSrc(item, true)"
                alt=""
                class="sidebar-menu-icon sidebar-menu-icon--sport sidebar-menu-icon--img"
              />
              <div v-else class="sidebar-menu-icon-placeholder" aria-hidden="true" />
              <span class="sidebar-menu-label">{{ item.name }}</span>
            </div>
          </div>
        </template>
      </template>

      <div class="sidebar-menu-row-wrap">
        <div
          class="sidebar-menu-row"
          :class="{ 'sidebar-menu-row--active': props.languagesActive }"
          @click="openLanguagesMenu"
        >
          <v-icon
            v-if="!props.mobileDrawer"
            size="20"
            class="sidebar-menu-icon sidebar-menu-icon--globe"
          >mdi-web</v-icon>
          <img
            v-else
            :src="sidebarLanguagesIcon"
            alt=""
            class="sidebar-menu-icon sidebar-menu-icon--sport sidebar-menu-icon--img sidebar-menu-icon--languages"
          />
          <span class="sidebar-menu-label">{{ props.mobileDrawer ? 'Languages' : selectedLanguageLabel }}</span>
        </div>
      </div>

      <div
        v-if="props.mobileDrawer"
        class="sidebar-menu-row-wrap"
      >
        <div
          class="sidebar-menu-row sidebar-menu-row--affiliate"
          :class="{ 'sidebar-menu-row--active': isAffiliateActive() }"
          @click="navigateToAffiliate"
        >
          <img
            :src="getSidebarIconSrc({ id: 'sidebar-affiliate' }, true)"
            alt=""
            class="sidebar-menu-icon sidebar-menu-icon--sport sidebar-menu-icon--img"
          />
          <span class="sidebar-menu-label">Become an Affiliate</span>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar-user-bar {
  flex-shrink: 0;
  padding: 12px 12px 10px;
  background-color: #ffffff;
  border-bottom: 1px solid #ececec;
}

.sidebar-user-bar__pill {
  display: flex;
  align-items: center;
  gap: 12px;
  /* padding: 10px 14px; */
  border-radius: 999px;
  background: linear-gradient(135deg, #921ada 0%, #8a19ce 50%, #471368 100%);
}

.sidebar-user-bar__avatar {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  overflow: hidden;
  background: #f3f4f6;
}

.sidebar-user-bar__avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar-user-bar__name {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-menu-scroll {
  --sidebar-pad-x: 24px;
  --sidebar-pad-y: 16px;
  --sidebar-icon-w: 20px;
  --sidebar-row-gap: 12px;
  --sidebar-text-step: 18px;
  --sidebar-label-inset: calc(var(--sidebar-pad-x) + var(--sidebar-icon-w) + var(--sidebar-row-gap));
  background-color: var(--color-event-name, #333333);
}

/* Reference Sidebar.tsx: border-white border-b-[0.2px] wrapper per row */
.sidebar-menu-row-wrap {
  border-bottom: 0.2px solid rgba(255, 255, 255, 0.35);
}

/* Desktop sidebar: hide scrollbar while keeping scroll */
.sidebar-menu:not(.sidebar-menu--mobile-drawer) .sidebar-menu-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.sidebar-menu:not(.sidebar-menu--mobile-drawer) .sidebar-menu-scroll::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.sidebar-menu--mobile-drawer .sidebar-menu-scroll::-webkit-scrollbar {
  width: 4px;
}

.sidebar-menu--mobile-drawer .sidebar-menu-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-menu--mobile-drawer .sidebar-menu-scroll::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.sidebar-menu-row {
  display: flex;
  align-items: center;
  gap: var(--sidebar-row-gap);
  padding: var(--sidebar-pad-y) var(--sidebar-pad-x);
  height: auto;
  min-height: 0;
  box-sizing: border-box;
  border-bottom: none;
  background-color: var(--color-event-name, #333333);
  cursor: pointer;
  user-select: none;
}

/* Reference Sidebar.tsx uses border-white border-b-[0.2px] per row — hr hidden on desktop */
.sidebar-menu-divider {
  display: none;
  width: auto;
  height: 0;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
}

.sidebar-menu-row:hover:not(.sidebar-menu-row--active):not(.sidebar-menu-row--demo-disabled):not(.sidebar-menu-row--fantasy) {
  background-color: rgba(255, 255, 255, 0.05);
}

.sidebar-menu-row:hover:not(.sidebar-menu-row--active):not(.sidebar-menu-row--demo-disabled):not(.sidebar-menu-row--fantasy) .sidebar-menu-label {
  font-size: 14px;
}

.sidebar-menu-row--active {
  background-color: var(--color-event-name, #333333);
}

.sidebar-menu-row--active .sidebar-menu-label {
  color: var(--color-wazir-green, #49915e);
  font-weight: 600;
}

.sidebar-menu-row--affiliate {
  min-height: 62.5px;
}

.sidebar-menu-row--affiliate .sidebar-menu-label {
  font-size: 15px;
  letter-spacing: 0.025em;
}

.sidebar-submenu-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px var(--sidebar-pad-x) 8px calc(var(--sidebar-label-inset) + var(--sidebar-text-step));
  border-bottom: 1px solid #ececec;
  background-color: #ffffff;
  cursor: pointer;
  user-select: none;
  min-height: 40px;
  box-sizing: border-box;
}

.sidebar-submenu-row--event {
  padding-left: calc(var(--sidebar-label-inset) + var(--sidebar-text-step) * 2);
}

.sidebar-submenu-row:hover:not(.sidebar-submenu-row--active) {
  background-color: #faf5ff;
}

.sidebar-submenu-row--active {
  background-color: #faf5ff;
}

.sidebar-submenu-row--active .sidebar-submenu-label {
  color: #360952;
  font-weight: 600;
}

.sidebar-menu-row--demo-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes fantasy-pulse {
  0%   { background-color: #FFD700; }
  50%  { background-color: #FFBE00; }
  100% { background-color: #FFD700; }
}

.sidebar-menu-row.sidebar-menu-row--fantasy {
  background-color: #FFD700 !important;
  border-bottom-color: #e6c200 !important;
  animation: fantasy-pulse 2.4s ease-in-out infinite;
}

.sidebar-menu-row.sidebar-menu-row--fantasy .sidebar-menu-label {
  color: #1a1a1a !important;
  font-weight: 700;
}

.sidebar-menu-row.sidebar-menu-row--fantasy .sidebar-menu-icon--sport {
  color: #1a1a1a !important;
}

.sidebar-menu-row.sidebar-menu-row--fantasy .sidebar-menu-chevron {
  color: rgba(0, 0, 0, 0.4) !important;
}

.sidebar-menu-row.sidebar-menu-row--fantasy:hover:not(.sidebar-menu-row--active) {
  background-color: #FFC200 !important;
  animation: none;
}

.sidebar-menu-row.sidebar-menu-row--fantasy.sidebar-menu-row--active {
  background-color: #FFC200 !important;
  border-bottom-color: #e6a800 !important;
  animation: none;
}

.sidebar-menu-row.sidebar-menu-row--fantasy.sidebar-menu-row--active .sidebar-menu-label {
  color: #000000 !important;
  font-weight: 700;
}

.sidebar-new-badge {
  flex-shrink: 0;
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.06em;
  background: #dc2626;
  color: #ffffff;
  padding: 2px 4px;
  line-height: 1;
  border-radius: 2px;
  white-space: nowrap;
  text-transform: uppercase;
}

.sidebar-menu-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.sidebar-menu-icon--sport {
  color: inherit;
}

.sidebar-menu-icon--img {
  display: block;
  object-fit: contain;
}

.sidebar-menu-icon--wide {
  width: 32px;
  height: 20px;
}

.sidebar-menu-icon--globe {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: #ffffff !important;
}

.sidebar-menu-icon-placeholder {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.sidebar-menu-label {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1;
  color: #ffffff;
  font-weight: 600;
  letter-spacing: normal;
  transition: font-size 0.15s ease, color 0.15s ease;
}

.sidebar-submenu-label {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  line-height: 1.25;
  color: #111111;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.sidebar-submenu-label--event {
  font-size: 11px;
  font-weight: 500;
  color: #111111;
}

.sidebar-menu-chevron {
  margin-left: auto;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.55) !important;
}

.sidebar-menu-chevron--accordion {
  transition: transform 0.2s ease;
}

.sidebar-menu-chevron--open {
  transform: rotate(180deg);
}

.sidebar-casino-submenu {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  background-color: var(--color-event-name, #333333);
  color: #ffffff;
}

.sidebar-casino-subrow {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
  padding: 12px 24px 12px 56px;
  box-sizing: border-box;
  background-color: var(--color-event-name, #333333);
  color: #ffffff;
  border-bottom: 0.2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  user-select: none;
}

.sidebar-casino-subrow--last {
  border-bottom: 0.2px solid rgba(255, 255, 255, 0.2);
}

.sidebar-casino-subrow:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.sidebar-casino-subrow:hover .sidebar-casino-subrow__label {
  font-size: 14px;
}

.sidebar-casino-subrow--active {
  background-color: var(--color-event-name, #333333);
}

.sidebar-casino-subrow--active .sidebar-casino-subrow__label {
  color: var(--color-wazir-green, #49915e);
  font-weight: 600;
}

.sidebar-casino-subrow__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.sidebar-casino-subrow__label {
  flex: 0 1 auto;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: normal;
  color: #ffffff;
  text-align: left;
  transition: font-size 0.15s ease;
}

.sidebar-event-badge {
  flex-shrink: 0;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  background: linear-gradient(180deg, #f26c20 0, #f26c20);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  line-height: 24px;
  text-align: center;
}

.sidebar-menu-empty {
  padding: 12px 24px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  background: var(--color-event-name, #333333);
}

.sidebar-menu-empty--nested {
  padding-left: calc(var(--sidebar-label-inset) + var(--sidebar-text-step));
  text-align: left;
}

@media (min-width: 768px) {
  .sidebar-submenu-label--event {
    font-size: 11px;
  }
}

/* Desktop — WazirWin reference Sidebar.tsx: lg:bg-eventNameColor rounded-lg */
.sidebar-menu:not(.sidebar-menu--mobile-drawer) {
  background: var(--color-event-name, #333333);
  border-radius: 8px;
  overflow: hidden;
}

.sidebar-menu:not(.sidebar-menu--mobile-drawer) .sidebar-menu-body {
  background: var(--color-event-name, #333333);
}

.sidebar-menu:not(.sidebar-menu--mobile-drawer) .sidebar-menu-row {
  padding: 16px 24px;
  gap: 12px;
}

.sidebar-menu:not(.sidebar-menu--mobile-drawer) .sidebar-menu-label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: normal;
}

.sidebar-menu:not(.sidebar-menu--mobile-drawer) .sidebar-menu-icon,
.sidebar-menu:not(.sidebar-menu--mobile-drawer) .sidebar-menu-icon--img,
.sidebar-menu:not(.sidebar-menu--mobile-drawer) .sidebar-menu-icon-placeholder {
  width: 20px;
  height: 20px;
}

.sidebar-menu:not(.sidebar-menu--mobile-drawer) .sidebar-menu-row:hover:not(.sidebar-menu-row--active):not(.sidebar-menu-row--demo-disabled):not(.sidebar-menu-row--fantasy) .sidebar-menu-label {
  font-size: 14px;
}

/* Mobile purple drawer (ZU AppLayout / SideMenu) */
.sidebar-menu--mobile-drawer {
  background: #360952;
  color: #ffffff;
  font-family: inherit;
}

.sidebar-menu--mobile-drawer .sidebar-mobile-chrome {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 4px 12px;
  background: #360952;
}

.sidebar-menu--mobile-drawer .sidebar-mobile-search {
  position: relative;
  width: 100%;
}

.sidebar-menu--mobile-drawer .sidebar-mobile-search__input {
  display: block;
  width: 100%;
  height: 28px;
  padding: 4px 16px;
  border: 0;
  border-radius: 6px;
  background: #ffffff;
  color: #111111;
  font-size: 12px;
  line-height: 1.25;
  outline: none;
  box-sizing: border-box;
}

.sidebar-menu--mobile-drawer .sidebar-mobile-search__input::placeholder {
  color: #9ca3af;
}

.sidebar-menu--mobile-drawer .sidebar-mobile-search__results {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 5;
  max-height: 240px;
  overflow-y: auto;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.sidebar-menu--mobile-drawer .sidebar-mobile-search__result {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-bottom: 1px solid #f3e8ff;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.sidebar-menu--mobile-drawer .sidebar-mobile-search__result:last-child {
  border-bottom: 0;
}

.sidebar-menu--mobile-drawer .sidebar-mobile-search__result-title {
  font-size: 13px;
  font-weight: 600;
  color: #111111;
  line-height: 1.3;
}

.sidebar-menu--mobile-drawer .sidebar-mobile-search__result-meta {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.3;
}

.sidebar-menu--mobile-drawer .sidebar-mobile-search__empty {
  padding: 12px;
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

.sidebar-menu--mobile-drawer .sidebar-menu-scroll {
  --sidebar-pad-x: 22px;
  --sidebar-pad-y: 11px;
  --sidebar-row-gap: 12px;
  background: #360952;
  padding: 8px;
  margin: 0 8px;
  box-sizing: border-box;
}

.sidebar-menu--mobile-drawer .sidebar-menu-row {
  background-color: transparent;
  border-bottom: 1px solid #ffffff;
  color: #ffffff;
  gap: 12px;
  min-height: 56px;
  height: 56px;
  padding: 11px 22px;
  box-sizing: border-box;
}

.sidebar-menu--mobile-drawer .sidebar-menu-row:hover:not(.sidebar-menu-row--active):not(.sidebar-menu-row--demo-disabled):not(.sidebar-menu-row--fantasy) {
  background-color: rgba(255, 255, 255, 0.06);
}

.sidebar-menu--mobile-drawer .sidebar-menu-row:hover:not(.sidebar-menu-row--active):not(.sidebar-menu-row--demo-disabled):not(.sidebar-menu-row--fantasy) .sidebar-menu-label {
  font-size: 15px;
}

.sidebar-menu--mobile-drawer .sidebar-menu-label {
  color: #ffffff;
  font-family: inherit;
  font-size: 15px;
  font-weight: 400;
  line-height: 22.5px;
  letter-spacing: 0.375px;
  text-transform: capitalize;
}

.sidebar-menu--mobile-drawer .sidebar-menu-row--active .sidebar-menu-label {
  color: #ffffff;
  font-weight: 400;
}

.sidebar-menu--mobile-drawer .sidebar-menu-row--affiliate .sidebar-menu-label {
  font-size: 15px;
  font-weight: 400;
  letter-spacing: 0.375px;
}

.sidebar-menu--mobile-drawer .sidebar-menu-icon,
.sidebar-menu--mobile-drawer .sidebar-menu-icon--sport,
.sidebar-menu--mobile-drawer .sidebar-menu-icon--img,
.sidebar-menu--mobile-drawer .sidebar-menu-icon-placeholder {
  width: 20px;
  height: 20px;
}

.sidebar-menu--mobile-drawer .sidebar-menu-icon--wide {
  width: 32px;
  height: 20px;
}

.sidebar-menu--mobile-drawer .sidebar-menu-icon--img {
  filter: none;
}

.sidebar-menu--mobile-drawer .sidebar-menu-icon--img.sidebar-menu-icon--invert {
  filter: brightness(0) invert(1);
}

.sidebar-menu--mobile-drawer .sidebar-menu-chevron {
  color: #ffffff !important;
}

.sidebar-menu--mobile-drawer .sidebar-menu-empty {
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
}

.sidebar-menu--mobile-drawer .sidebar-casino-submenu {
  padding: 0;
  align-items: stretch;
  background: transparent;
}

.sidebar-menu--mobile-drawer .sidebar-casino-subrow {
  gap: 12px;
  padding: 10px 14px 10px 50px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #ffffff;
}

.sidebar-menu--mobile-drawer .sidebar-casino-subrow--last {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.sidebar-menu--mobile-drawer .sidebar-casino-subrow:hover {
  background-color: rgba(255, 255, 255, 0.06);
}

.sidebar-menu--mobile-drawer .sidebar-casino-subrow:hover .sidebar-casino-subrow__label {
  font-size: 15px;
}

.sidebar-menu--mobile-drawer .sidebar-casino-subrow__icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: none;
}

.sidebar-menu--mobile-drawer .sidebar-casino-subrow__label {
  font-family: inherit;
  font-size: 15px;
  font-weight: 400;
  line-height: 22.5px;
  letter-spacing: 0.375px;
  color: #ffffff;
  text-align: left;
  text-transform: capitalize;
}
</style>
