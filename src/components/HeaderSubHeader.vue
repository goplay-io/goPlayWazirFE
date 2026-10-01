<template>
  <nav class="header-subheader" aria-label="Sports navigation">
    <div class="header-subheader__scroll">
      <router-link
        v-for="tab in tabs"
        :key="tab.key"
        :to="tab.path"
        :class="[
          'header-subheader__tab',
          tab.key === 'affiliate' ? 'header-subheader__tab--affiliate' : '',
          isTabActive(tab) ? 'header-subheader__tab--active' : '',
          tab.disabled ? 'header-subheader__tab--disabled' : '',
        ]"
        :aria-disabled="tab.disabled ? 'true' : undefined"
        @click="tab.disabled ? $event.preventDefault() : undefined"
      >
        <img
          :src="subHeaderIconSrc(tab.iconKey, isTabActive(tab))"
          alt=""
          :class="['header-subheader__icon', tab.iconKey === 'affiliate' ? 'header-subheader__icon--affiliate' : '']"
          :width="iconSize(tab.iconKey)"
          :height="iconSize(tab.iconKey)"
          :style="{ width: iconSize(tab.iconKey) + 'px', height: iconSize(tab.iconKey) + 'px' }"
        />
        <span class="header-subheader__label">{{ tab.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  useEventTypes,
  sortEventTypesForSportNav,
  CASINO_EVENT_TYPE_ID,
  TENNIS_EVENT_TYPE_ID,
  HORSE_RACING_EVENT_TYPE_ID,
  GREYHOUND_RACING_EVENT_TYPE_ID,
} from '@/composables/useEventTypes'
import { useAuthStore } from '@/stores/auth'
import { subHeaderIconSrc } from '@/constants/subHeaderIcons'

const ICON_PX = {
  home: 17,
  affiliate: 15,
  sportsBook: 20,
  kabaddi: 20,
}

function iconSize(iconKey) {
  return ICON_PX[iconKey] || 16
}

const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()
const { eventTypes, getRacingRacesListRoute } = useEventTypes()

const isDemoUser = computed(() => authStore.isDemoUser)

const orderedSportEventTypes = computed(() =>
  sortEventTypesForSportNav(eventTypes.value).filter((type) => Number(type.id) !== CASINO_EVENT_TYPE_ID),
)

const casinoTab = computed(() => ({
  key: 'sport-casino',
  iconKey: 'casino',
  label: t('eventTypes.casino'),
  path: '/casino',
  eventType: { id: CASINO_EVENT_TYPE_ID, name: 'Casino', key: 'casino' },
}))

const tabs = computed(() => {
  const homeTab = {
    key: 'home',
    iconKey: 'home',
    label: t('common.home'),
    path: '/sports/live',
  }

  const affiliateTab = {
    key: 'affiliate',
    iconKey: 'affiliate',
    label: t('components.mobileBottomNav.affiliate'),
    path: '/affiliate',
  }

  const list = orderedSportEventTypes.value
  const tennisIdx = list.findIndex((type) => Number(type.id) === TENNIS_EVENT_TYPE_ID)
  const toSportTab = (eventType) => ({
    key: `sport-${eventType.id}`,
    iconKey: eventType.key,
    label: sportTabLabel(eventType),
    path: getEventTypeRoute(eventType),
    eventType,
    disabled: isDemoUser.value && eventType.name === 'Sports book',
  })

  let sportTabs
  if (tennisIdx < 0) {
    sportTabs = [...list.map(toSportTab), casinoTab.value]
  } else {
    sportTabs = [
      ...list.slice(0, tennisIdx + 1).map(toSportTab),
      casinoTab.value,
      ...list.slice(tennisIdx + 1).map(toSportTab),
    ]
  }

  return [homeTab, affiliateTab, ...sportTabs]
})

function sportTabLabel(eventType) {
  const id = Number(eventType?.id)
  if (id === HORSE_RACING_EVENT_TYPE_ID || eventType.key === 'horseRacing') return 'Horse'
  if (id === GREYHOUND_RACING_EVENT_TYPE_ID || eventType.key === 'greyhoundRacing') return 'Greyhound'
  return eventType.name
}

function getEventTypeRoute(eventType) {
  if (eventType.name === 'Sports book') {
    if (isDemoUser.value) return route.fullPath || route.path
    return '/sports-book'
  }

  if (eventType.name === 'Casino') return '/casino'

  const racingList = getRacingRacesListRoute(eventType)
  if (racingList) return racingList

  return `/sports/${eventType.id}`
}

function isHomeActive() {
  const path = route.path
  return path === '/' || path === '/home' || path === '/sports/live'
}

function isTabActive(tab) {
  if (tab.key === 'home') return isHomeActive()
  if (tab.key === 'affiliate') return route.path.startsWith('/affiliate')

  const eventType = tab.eventType
  if (!eventType) return false

  const [, section, idOrSlug] = route.path.split('/')

  if (section === 'sports' && idOrSlug && idOrSlug !== 'live') {
    if (!Number.isNaN(Number(idOrSlug)) && parseInt(idOrSlug, 10) === eventType.id) {
      return true
    }
  }

  if (eventType.name === 'Casino') {
    return route.path.startsWith('/casino')
  }

  const racingList = getRacingRacesListRoute(eventType)
  if (racingList && (route.path === racingList || route.path.startsWith(`${racingList}/`))) {
    return true
  }

  if (route.path === '/sports-book' && eventType.name === 'Sports book') return true

  return false
}
</script>

<style scoped>
.header-subheader {
  width: 100%;
}

.header-subheader__scroll {
  display: flex;
  align-items: center;
  width: 100%;
  /* Reference nav ~44px: tabs 28 + py 5+5 + scrollbar track ~6 */
  min-height: 44px;
  height: 44px;
  gap: 0;
  padding: 2px 12px 0;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 0;
  background: var(--color-login-input-bg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  /* Desktop: always show thin light scrollbar like monkeydon */
  scrollbar-width: thin;
  scrollbar-color: #d0d0d0 #3a3a3a;
  scrollbar-gutter: stable;
}

.header-subheader__scroll::-webkit-scrollbar {
  height: 6px;
  display: block;
}

.header-subheader__scroll::-webkit-scrollbar-track {
  background: #3a3a3a;
  border-radius: 0;
}

.header-subheader__scroll::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

.header-subheader__scroll::-webkit-scrollbar-thumb:hover {
  background: #e8e8e8;
}

.header-subheader__scroll::-webkit-scrollbar-button {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent;
}

.header-subheader__scroll::-webkit-scrollbar-button:single-button,
.header-subheader__scroll::-webkit-scrollbar-button:start:decrement,
.header-subheader__scroll::-webkit-scrollbar-button:end:increment,
.header-subheader__scroll::-webkit-scrollbar-button:horizontal:decrement,
.header-subheader__scroll::-webkit-scrollbar-button:horizontal:increment {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.header-subheader__scroll::-webkit-scrollbar-corner {
  background: transparent;
}

/* Reference: min-h-[28px] px-[9px] py-1 gap-x-1 rounded-md justify-center */
.header-subheader__tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: 4px;
  min-width: 80px;
  min-height: 26px;
  height: 26px;
  padding: 4px 9px;
  border-radius: 6px;
  text-decoration: none;
  text-transform: uppercase;
  background: transparent;
  box-sizing: border-box;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.header-subheader__tab--active {
  background: var(--color-signup-btn-bg);
}

.header-subheader__tab--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-subheader__icon {
  display: block;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  object-fit: contain;
}

.header-subheader__tab--affiliate {
  min-width: 100px;
}

.header-subheader__icon--affiliate {
  width: 15px;
  height: 15px;
  filter: invert(1);
}

.header-subheader__label {
  font-size: 12px;
  font-weight: 400;
  font-family:'Lato' !important;
  line-height: 1;
  white-space: nowrap;
  color: #ffffff;
}

.header-subheader__tab--active .header-subheader__label {
  color: var(--color-wazir-green);
}

@media (max-width: 767.98px) {
  /* Reference mobile nav: 44px bar, tabs on top, horizontal scrollbar along the bottom */
  .header-subheader__scroll {
    align-items: flex-start;
    min-height: 44px;
    height: 44px;
    padding: 5px 12px;
    gap: 0;
    overflow-x: scroll;
    overflow-y: auto;
    scrollbar-width: auto;
    scrollbar-color: auto;
    scrollbar-gutter: auto;
    -ms-overflow-style: auto;
  }

  .header-subheader__scroll::-webkit-scrollbar {
    -webkit-appearance: none;
    appearance: none;
    display: block;
    height: 6px;
    width: 4px;
    background: transparent;
  }

  .header-subheader__scroll::-webkit-scrollbar-track {
    background: transparent;
    border: none;
    border-radius: 0;
  }

  .header-subheader__scroll::-webkit-scrollbar-thumb,
  .header-subheader__scroll::-webkit-scrollbar-thumb:hover {
    background: #d2d2d2;
    border: none;
    border-radius: 8px;
  }

  .header-subheader__tab {
    min-height: 28px;
    height: 28px;
    padding: 4px 9px;
    min-width: 80px;
    color: #d2d2d2;
  }

  .header-subheader__tab--affiliate {
    min-width: 100px;
  }

  .header-subheader__tab--active .header-subheader__icon:not(.header-subheader__icon--affiliate) {
    width: 17px;
    height: 17px;
  }

  .header-subheader__label {
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
    color: #d2d2d2;
  }

  .header-subheader__tab--active .header-subheader__label {
    font-weight: 600;
    line-height: 20px;
    color: #49915e;
  }
}
</style>
