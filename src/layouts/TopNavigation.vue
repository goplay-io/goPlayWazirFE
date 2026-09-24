<template>
  <div class="top-nav-shell tw-relative tw-z-20" data-nav-container>
    <nav class="top-nav">
      <div :class="['tw-mx-auto', isMobile ? 'tw-px-0' : 'tw-px-2']">
        <div v-if="isMobile" class="top-nav-mobile-row">
          <router-link to="/sports/live" :class="['nav-tab', isLiveActive ? 'nav-tab--active' : '']">
            <InplayIcon class="nav-tab__icon nav-tab__icon--sport" :width="18" :height="18" />
            <span class="nav-tab__label tw-text-[11px] tw-font-normal">INPLAY</span>
          </router-link>
          <router-link :to="sportsRoute" :class="['nav-tab', isSportsActive ? 'nav-tab--active' : '']">
            <component
              :is="mobileSportsTabIcon"
              v-if="mobileSportsTabIcon"
              class="nav-tab__icon nav-tab__icon--sport"
              :width="18"
              :height="18"
            />
            <span class="nav-tab__label tw-text-[11px] tw-font-normal">SPORTS</span>
          </router-link>
          <router-link to="/casino"
            :class="['nav-tab', 'nav-tab--gold-label', isCasinoActive ? 'nav-tab--active' : '']">
            <CasinoIcon class="nav-tab__icon nav-tab__icon--sport" :width="18" :height="18" />
            <span class="nav-tab__label tw-text-[11px] tw-font-normal">CASINO</span>
          </router-link>
          <router-link to="/sports-book"
            :class="['nav-tab', 'nav-tab--gold-label', isSportsBookActive ? 'nav-tab--active' : '']">
            <component
              :is="getEventTypeIcon(99991)"
              v-if="getEventTypeIcon(99991)"
              class="nav-tab__icon nav-tab__icon--sport"
              :width="18"
              :height="18"
            />
            <span class="nav-tab__label tw-text-[11px] tw-font-normal">SPORTS BOOK</span>
          </router-link>
          <router-link to="/sports/multi-market" :class="['nav-tab', isMultiMarketActive ? 'nav-tab--active' : '']">
            <v-icon class="nav-tab__icon nav-tab__icon--mdi" size="18">mdi-view-list-outline</v-icon>
            <span class="nav-tab__label tw-text-[11px] tw-font-normal">MULTIMARKET</span>
          </router-link>
          <router-link :to="binaryRoute" :class="['nav-tab', isBinaryActive ? 'nav-tab--active' : '']">
            <component
              :is="getEventTypeIcon(BINARY_EVENT_TYPE_ID)"
              v-if="getEventTypeIcon(BINARY_EVENT_TYPE_ID)"
              class="nav-tab__icon nav-tab__icon--sport"
              :width="18"
              :height="18"
            />
            <span class="nav-tab__label tw-text-[11px] tw-font-normal">BINARY</span>
          </router-link>
        </div>

        <div v-else class="navbar-main top-nav-desktop-row tw-flex tw-items-center tw-overflow-x-auto scrollbar-hide">

          <!-- InPlay link -->
          <router-link to="/sports/live" :class="['nav-tab', 'nav-tab--inplay', isLiveActive ? 'nav-tab--active' : '']">
            <InplayIcon class="nav-tab__icon nav-tab__icon--sport" :width="16" :height="16" />
            <span class="tw-text-[11px] tw-font-normal">INPLAY</span>
          </router-link>

          <!-- <router-link to="/sports/multi-market" :class="['nav-tab', isMultiMarketActive ? 'nav-tab--active' : '']">
            <v-icon class="nav-tab__icon nav-tab__icon--mdi" size="16">mdi-view-list-outline</v-icon>
            <span class="tw-text-[11px] tw-font-normal">MULTI MARKETS</span>
          </router-link> -->

          <template v-for="slot in desktopSportNavSlots" :key="slot.kind === 'casino' ? 'nav-casino' : `event-${slot.event.id}`">
            <template v-if="slot.kind === 'casino'">
              <router-link :to="FANTASY11_ROUTE"
                :class="['nav-tab', 'nav-tab--fantasy', 'nav-tab--quick', isFantasy11Active ? 'nav-tab--active' : '']">
                <Fantasy11Icon class="nav-tab__icon nav-tab__icon--sport" :width="16" :height="16" />
                <span class="nav-tab__label nav-tab__label--badged tw-text-[11px] tw-font-normal">
                  FANTASY11
                  <NewBadge class="nav-tab__new-badge" />
                </span>
              </router-link>
              <router-link :to="CRICKET_BATTLE_ROUTE"
                :class="['nav-tab', 'nav-tab--fantasy', 'nav-tab--quick', isCricketBattleActive ? 'nav-tab--active' : '']">
                <CricketBattleIcon class="nav-tab__icon nav-tab__icon--sport" :width="16" :height="16" />
                <span class="nav-tab__label nav-tab__label--badged tw-text-[11px] tw-font-normal">
                  CRICKET BATTLE
                  <NewBadge class="nav-tab__new-badge" />
                </span>
              </router-link>
              <router-link to="/casino"
                :class="['nav-tab', 'nav-tab--gold-label', isCasinoActive ? 'nav-tab--active' : '']">
                <CasinoIcon class="nav-tab__icon nav-tab__icon--sport" :width="16" :height="16" />
                <span class="tw-text-[11px] tw-font-normal">CASINO</span>
              </router-link>
            </template>
            <router-link v-else :to="getEventTypeRoute(slot.event)" draggable="false" :class="[
              'nav-tab',
              isGoldLabelType(slot.event) ? 'nav-tab--gold-label' : '',
              isEventTypeActive(slot.event) ? 'nav-tab--active' : '',
              isFantasy(slot.event) ? 'nav-tab--fantasy' : '',
              isDemoUser && slot.event.name === 'Sports book' ? 'tw-opacity-50 tw-cursor-not-allowed' : ''
            ]">
              <component
                :is="getEventTypeIcon(slot.event.id)"
                v-if="getEventTypeIcon(slot.event.id)"
                class="nav-tab__icon nav-tab__icon--sport"
                :width="16"
                :height="16"
              />
              <v-icon v-else class="nav-tab__icon nav-tab__icon--mdi" size="16">mdi-trophy-outline</v-icon>
              <span v-if="slot.event.name === 'Sports book'" class="nav-tab__label nav-tab__label--badged tw-text-[11px] tw-font-normal">
                {{ slot.event.name.toUpperCase() }}
                <NewBadge class="nav-tab__new-badge" />
              </span>
              <span class="tw-text-[11px] tw-font-normal" v-else>{{ slot.event.name.toUpperCase() }}</span>
            </router-link>
          </template>

        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  useEventTypes,
  BINARY_EVENT_TYPE_ID,
  CASINO_EVENT_TYPE_ID,
  TENNIS_EVENT_TYPE_ID,
  sortEventTypesForSportNav
} from '@/composables/useEventTypes'
import useDevices from '@/composables/useDevices.js'
import NewBadge from '@/components/NewBadge.vue'
import CasinoIcon from '@/components/Icons/Casino.vue'
import InplayIcon from '@/components/Icons/Inplay.vue'
import Fantasy11Icon from '@/components/Icons/Fantasy11.vue'
import CricketBattleIcon from '@/components/Icons/CricketBattle.vue'
import { useAuthStore } from '@/stores/auth'
import { FANTASY11_ROUTE, CRICKET_BATTLE_ROUTE } from '@/composables/useQuickGameTabs'

const route = useRoute()
const authStore = useAuthStore()
const { isMobile } = useDevices()
const { getEventTypeIcon, eventTypes, getRacingRacesListRoute } = useEventTypes()

const isDemoUser = computed(() => authStore.isDemoUser)

const orderedSportEventTypes = computed(() =>
  sortEventTypesForSportNav(eventTypes.value).filter((t) => Number(t.id) !== CASINO_EVENT_TYPE_ID)
)

/** Desktop: reference order with Fantasy 11 / Cricket Battle / Casino after Tennis. */
const desktopSportNavSlots = computed(() => {
  const list = orderedSportEventTypes.value
  const tIdx = list.findIndex((t) => Number(t.id) === TENNIS_EVENT_TYPE_ID)
  const eventsToSlots = (events) => events.map((event) => ({ kind: 'event', event }))
  if (tIdx < 0) return [...eventsToSlots(list), { kind: 'casino' }]
  return [
    ...eventsToSlots(list.slice(0, tIdx + 1)),
    { kind: 'casino' },
    ...eventsToSlots(list.slice(tIdx + 1))
  ]
})

const isFantasy11Active = computed(() => route.path === FANTASY11_ROUTE)
const isCricketBattleActive = computed(() => route.path === CRICKET_BATTLE_ROUTE)
const isCasinoActive = computed(() => {
  if (!route.path.startsWith('/casino')) return false
  if (isMobile.value) return true
  return !isFantasy11Active.value && !isCricketBattleActive.value
})
const sportsRoute = computed(() => {
  const firstSportsType = orderedSportEventTypes.value[0]
  return firstSportsType ? getEventTypeRoute(firstSportsType) : '/sports/live'
})

const mobileSportsTabIcon = computed(() => {
  const firstSportsType = orderedSportEventTypes.value[0]
  return firstSportsType ? getEventTypeIcon(firstSportsType.id) : null
})

// Helper function to get route for event type
const getEventTypeRoute = (eventType) => {
  // Special routes
  if (eventType.name === 'Sports book') {
    if (isDemoUser.value) {
      return route.fullPath || route.path
    }
    return '/sports-book'
  }

  // Casino route
  if (eventType.name === 'Casino') {
    return '/casino'
  }

  const racingList = getRacingRacesListRoute(eventType)
  if (racingList) return racingList

  // Default sports route
  return `/sports/${eventType.id}`
}

// Check if event type is currently active
const isEventTypeActive = (eventType) => {
  const [, section, idOrSlug] = route.path.split('/')

  if (!idOrSlug) return false

  // Handle sports routes
  if (section === 'sports') {
    if (idOrSlug === 'live') return false
    return !isNaN(idOrSlug) && parseInt(idOrSlug) === eventType.id
  }

  // Handle casino routes
  if (section === 'casino' && eventType.name === 'Casino') {
    return true
  }

  // Horse / Greyhound: links go to racing hub but tabs stay un-highlighted (product choice)
  if (getRacingRacesListRoute(eventType)) {
    return false
  }

  // Handle sports-book route
  if (route.path === '/sports-book' && eventType.name === 'Sports book') {
    return true
  }

  return false
}
const isLiveActive = computed(() => route.path === '/sports/live')
const isSportsActive = computed(() => route.path.startsWith('/sports/') && route.path !== '/sports/live' && route.path !== '/sports/multi-market')
const isSportsBookActive = computed(() => route.path === '/sports-book')
const isMultiMarketActive = computed(() => route.path === '/sports/multi-market')
const binaryRoute = `/sports/${BINARY_EVENT_TYPE_ID}`
const isBinaryActive = computed(() => {
  const prefix = `/sports/${BINARY_EVENT_TYPE_ID}`
  return route.path === prefix || route.path.startsWith(`${prefix}/`)
})

const isFantasy = (eventType) => eventType.name?.toLowerCase().includes('fantasy')
const isGoldLabelType = (eventType) => {
  const name = eventType?.name?.toLowerCase() || ''
  return name === 'casino' || name === 'sports book'
}

</script>

<style scoped>
/* Shell fills full sticky width/height so theme background never shows through gaps */
.top-nav-shell {
  background: linear-gradient(180deg, #17191e 0%, #0c0e12 100%);
}

@media (max-width: 767.98px) {
  .top-nav-shell {
    background: linear-gradient(180deg, #fbf6e9 0%, #f3ead2 100%);
  }
}

/* Nav bar — dark gradient strip (reference) */
.top-nav {
  background: linear-gradient(180deg, #17191e 0%, #0c0e12 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 767.98px) {
  .top-nav {
    padding-bottom: 0;
    background: linear-gradient(180deg, #fbf6e9 0%, #f3ead2 100%);
    border-top: 1px solid #b08d32;
    border-bottom: 1px solid rgba(0, 0, 0, 0.18);
  }

  /* On the light mobile strip, default tab text is dark */
  .nav-tab {
    color: #2a2a2a;
  }

  .nav-tab--gold-label {
    color: #1a1a1a;
  }

  .nav-tab--gold-label:hover {
    color: #1a1a1a;
  }

  .nav-tab:hover:not(.nav-tab--fantasy):not(.nav-tab--active) {
    color: #1a1a1a;
    border-bottom-color: rgba(176, 141, 50, 0.65);
  }

  /* Active tab — gold gradient highlight (image 2 style) */
  .nav-tab--active:not(.nav-tab--fantasy) {
    color: #1a1a1a;
    background: linear-gradient(94deg, #b6842d 0%, #ebda8d 55%, #b7862f 100%);
    border-bottom-color: #9d7728;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }

  .nav-tab--active:not(.nav-tab--fantasy):hover {
    color: #1a1a1a;
    border-bottom-color: #9d7728;
  }

  .top-nav-mobile-row {
    display: flex;
    align-items: stretch;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .top-nav-mobile-row .nav-tab {
    flex: 0 0 auto;
    min-width: 3.6rem;
    flex-direction: column;
    gap: 2px;
    font-size: 10px;
    letter-spacing: 0.01em;
    padding: 4px 5px 4px;
    border-right: 1px solid rgba(155, 124, 44, 0.45);
  }

  .top-nav-mobile-row .nav-tab__icon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .top-nav-mobile-row .nav-tab__icon--sport {
    width: 18px;
    height: 18px;
  }

  .top-nav-mobile-row .nav-tab__icon--mdi {
    color: #2a2a2a;
  }

  .top-nav-mobile-row .nav-tab--active .nav-tab__icon--mdi {
    color: #1a1a1a;
  }

  .top-nav-mobile-row .nav-tab__label {
    line-height: 1.1;
  }

  .top-nav-mobile-row::-webkit-scrollbar {
    display: none;
  }

  .top-nav-mobile-row .nav-tab:last-child {
    border-right: none;
  }
}

/* Individual tab */
.nav-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 6px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.03em;
  white-space: nowrap;
  color: #f2f2f2;
  text-decoration: none;
  transition: color 0.15s, border-color 0.15s, background-color 0.15s;
  flex-shrink: 0;
  text-transform: uppercase;
}

@media (max-width: 767.98px) {
  .nav-tab {
    border-bottom: 2px solid transparent;
  }
}

.nav-tab--gold-label {
  color: #f8c35b;
}

.nav-tab--gold-label:hover {
  color: #ffd98d;
}

@media (max-width: 767.98px) {
  .nav-tab {
    padding-top: 6px;
    padding-bottom: 8px;
  }
}

.nav-tab:hover:not(.nav-tab--fantasy):not(.nav-tab--active) {
  color: #ffffff;
}

@media (max-width: 767.98px) {
  .nav-tab:hover:not(.nav-tab--fantasy):not(.nav-tab--active) {
    border-bottom-color: rgba(255, 255, 255, 0.45);
  }
}

/* Active — white underline only (no filled pill) */
.nav-tab--active:not(.nav-tab--fantasy) {
  color: #ffffff;
  background-color: transparent;
}

@media (max-width: 767.98px) {
  .nav-tab--active:not(.nav-tab--fantasy) {
    border-bottom-color: #ffffff;
  }
}

.nav-tab--active:not(.nav-tab--fantasy):hover {
  color: #ffffff;
}

@media (max-width: 767.98px) {
  .nav-tab--active:not(.nav-tab--fantasy):hover {
    border-bottom-color: #ffffff;
  }
}

/* Fantasy highlight — yellow background */
.nav-tab--fantasy {
  background-color: #FFD700;
  color: #1a1a1a;
  border-bottom-color: transparent;
  border-radius: 2px;
  margin: 4px 4px;
  padding: 5px 12px;
}

.nav-tab--fantasy:hover {
  background-color: #FFC200;
  color: #000000;
  border-bottom-color: transparent;
}

.nav-tab--fantasy.nav-tab--active {
  background-color: #FFC200;
  border-bottom-color: transparent;
}

.nav-tab :deep(*) {
  font-weight: inherit;
}

/* Divider between live and event types */
.nav-divider {
  width: 1px;
  background-color: rgba(255, 255, 255, 0.16);
  margin: 6px 4px;
  flex-shrink: 0;
}

/* Hide scrollbar */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Desktop: icon + label strip with orange pill on hover / active / click */
@media (min-width: 768px) {
  .top-nav {
    min-height: 50px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .top-nav > div {
    width: 100%;
  }

  .navbar-main {
    min-height: 50px;
    padding: 0 6px;
    gap: 0;
    align-items: center;
  }

  .top-nav-desktop-row .nav-divider {
    display: none;
  }

  .top-nav-desktop-row .nav-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 0;
    height: auto;
    padding: 3px 3px;/* 6px 12px; */
    margin: 0 2px;
    font-size: 13px;/*11px;*/
    font-weight: 500;/*700;*/
    letter-spacing: 0.04em;
    line-height: 1;
    color: #ffffff99;
    border: 1px solid transparent;
    border-radius: 999px;
    outline: none;
    box-shadow: none;
    text-transform: uppercase;
    background: transparent;
    transition:
      color 0.15s ease,
      border-color 0.15s ease,
      background-color 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .top-nav-desktop-row .nav-tab:hover:not(.nav-tab--fantasy),
  .top-nav-desktop-row .nav-tab:focus-visible:not(.nav-tab--fantasy),
  .top-nav-desktop-row .nav-tab:active:not(.nav-tab--fantasy),
  .top-nav-desktop-row .nav-tab--active:not(.nav-tab--fantasy) {
    color: var(--theme-orange);
    border-color: var(--theme-orange);
    background: transparent;
    opacity: 1;
    padding: 10px 3px;
  }

  .top-nav-desktop-row .nav-tab--gold-label {
    color: #ffffff99;
  }

  .top-nav-desktop-row .nav-tab--gold-label:hover,
  .top-nav-desktop-row .nav-tab--gold-label:focus-visible,
  .top-nav-desktop-row .nav-tab--gold-label:active,
  .top-nav-desktop-row .nav-tab--gold-label.nav-tab--active {
    color: var(--theme-orange);
    border-color: var(--theme-orange);
    padding: 10px 3px;
  }

  .top-nav-desktop-row .nav-tab--inplay {
    color: rgba(255, 255, 255, 0.92);
  }

  .top-nav-desktop-row .nav-tab--inplay:hover,
  .top-nav-desktop-row .nav-tab--inplay:focus-visible,
  .top-nav-desktop-row .nav-tab--inplay:active,
  .top-nav-desktop-row .nav-tab--inplay.nav-tab--active {
    color: var(--theme-orange);
    border-color: var(--theme-orange);
    padding: 10px 3px;
  }

  .top-nav-desktop-row .nav-tab--fantasy {
    background-color: #FFD700;
    color: #1a1a1a;
    margin: 0 4px;
    padding: 5px 10px;
    min-height: 0;
    border-radius: 999px;
    border: 1px solid transparent;
    font-weight: 700;
    animation: fantasy-nav-pulse 2.4s ease-in-out infinite;
  }

  @keyframes fantasy-nav-pulse {
    0%   { background-color: #FFD700; }
    50%  { background-color: #FFBE00; }
    100% { background-color: #FFD700; }
  }

  .top-nav-desktop-row .nav-tab--fantasy:hover,
  .top-nav-desktop-row .nav-tab--fantasy:focus-visible,
  .top-nav-desktop-row .nav-tab--fantasy:active {
    background-color: #FFC200;
    color: #000000;
    border-color: transparent;
    opacity: 1;
    padding: 10px 3px;
  }

  .top-nav-desktop-row .nav-tab :deep(.v-icon) {
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
    border: none !important;
  }

  .nav-tab__icon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .nav-tab__icon--mdi {
    color: #ffffff;
    opacity: 1;
  }

  .nav-tab__icon--inplay {
    color: #ffffff !important;
  }

  .top-nav-desktop-row .nav-tab--active .nav-tab__icon--sport,
  .top-nav-desktop-row .nav-tab:hover .nav-tab__icon--sport,
  .top-nav-desktop-row .nav-tab:focus-visible .nav-tab__icon--sport,
  .top-nav-desktop-row .nav-tab:active .nav-tab__icon--sport {
    opacity: 1;
  }

  .nav-tab__icon--sport {
    width: 16px;
    height: 16px;
  }

  .nav-tab__label {
    position: relative;
    display: inline-block;
    line-height: 1.1;
  }

  .nav-tab__label--badged {
    padding-right: 2px;
  }

  .nav-tab__new-badge {
    position: absolute;
    top: -7px;
    right: -18px;
    z-index: 2;
    pointer-events: none;
  }

  .top-nav-desktop-row :deep(.nav-tab__new-badge.blinking-badge) {
    animation: none;
    background-color: #fde047 !important;
    color: #000000 !important;
    font-size: 7px !important;
    font-weight: 800 !important;
    padding: 1px 3px !important;
    border-radius: 2px !important;
    min-width: 18px !important;
    letter-spacing: 0.02em;
    line-height: 1.1 !important;
  }

  .top-nav-desktop-row .nav-tab--fantasy :deep(.nav-tab__new-badge.blinking-badge) {
    background-color: #dc2626 !important;
    color: #ffffff !important;
  }
}
</style>
