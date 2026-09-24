<template>
  <nav class="header-subheader" aria-label="Sports navigation">
    <div class="header-subheader__scroll scrollbar-hide">
      <router-link
        v-for="tab in tabs"
        :key="tab.key"
        :to="tab.path"
        :class="[
          'header-subheader__tab',
          isTabActive(tab) ? 'header-subheader__tab--active' : '',
          tab.disabled ? 'header-subheader__tab--disabled' : '',
        ]"
        :aria-disabled="tab.disabled ? 'true' : undefined"
        @click="tab.disabled ? $event.preventDefault() : undefined"
      >
        <img
          :src="subHeaderIconSrc(tab.iconKey, isTabActive(tab))"
          alt=""
          class="header-subheader__icon"
          width="16"
          height="16"
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
} from '@/composables/useEventTypes'
import { useAuthStore } from '@/stores/auth'
import { subHeaderIconSrc } from '@/constants/subHeaderIcons'

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

  const list = orderedSportEventTypes.value
  const tennisIdx = list.findIndex((type) => Number(type.id) === TENNIS_EVENT_TYPE_ID)
  const toSportTab = (eventType) => ({
    key: `sport-${eventType.id}`,
    iconKey: eventType.key,
    label: eventType.name,
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

  return [homeTab, ...sportTabs]
})

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

  if (getRacingRacesListRoute(eventType)) return false

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
  min-height: 38px;
  gap: 8px;
  padding: 0 16px;
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 0;
  background: var(--color-login-input-bg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.header-subheader__scroll::-webkit-scrollbar {
  display: none;
}

.header-subheader__tab {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 4px;
  min-width: 0;
  height: 28px;
  padding: 0 9px;
  border-radius: 6px;
  text-decoration: none;
  text-transform: uppercase;
  background: transparent;
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

.header-subheader__label {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  color: #8f8f8f;
}

.header-subheader__tab--active .header-subheader__label {
  color: var(--color-wazir-green);
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

@media (max-width: 767.98px) {
  /* Reference SubHeader.tsx: px-1 ps-4 */
  .header-subheader__scroll {
    padding: 0 4px 0 16px;
    gap: 8px;
  }

  .header-subheader__tab {
    height: 28px;
    padding: 0 9px;
  }

  .header-subheader__label {
    font-size: 12px;
  }
}
</style>
