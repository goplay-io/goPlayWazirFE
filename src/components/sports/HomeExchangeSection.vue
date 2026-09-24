<template>
  <section class="home-exchange-section">
    <ul class="home-exchange-tabs">
      <li
        v-for="tab in primaryTabs"
        :key="tab.id"
        class="home-exchange-tabs__item"
      >
        <button
          type="button"
          class="home-exchange-tab"
          :class="{ 'home-exchange-tab--active': tab.id === 'exchange' }"
          @click="onPrimaryTabClick(tab)"
        >
          <span class="home-exchange-tab__wrap">
            <div class="home-exchange-tab__inner">
              <img
                :src="tab.icon"
                :alt="tab.label"
                class="home-exchange-tab__icon"
                :class="`home-exchange-tab__icon--${tab.id}`"
              />
              <span
                class="home-exchange-tab__label"
                :class="{ 'home-exchange-tab__label--stacked': tab.id === 'sportsbook' }"
              >
                <template v-if="tab.id === 'sportsbook'">
                  Sports<br class="home-exchange-tab__break" /> Book
                </template>
                <template v-else>{{ tab.label }}</template>
              </span>
            </div>
          </span>
        </button>
      </li>
    </ul>

    <nav class="home-sport-strip" aria-label="Sports categories">
      <button
        v-for="item in sportItems"
        :key="String(item.id)"
        type="button"
        class="home-sport-strip__item"
        :class="{
          'home-sport-strip__item--active': isSportItemActive(item),
          'home-sport-strip__item--wide': item.wideIcon,
          'home-sport-strip__item--greyhound': item.wideIcon && /greyhound/i.test(item.label),
          'home-sport-strip__item--compact': item.compactLabel
        }"
        @click="onSportItemClick(item)"
      >
        <img
          v-if="item.iconSrc"
          :src="item.iconSrc"
          alt=""
          class="home-sport-strip__icon"
        />
        <span class="home-sport-strip__label">{{ item.label }}</span>
      </button>
    </nav>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useEventTypes,
  CASINO_EVENT_TYPE_ID,
  HORSE_RACING_EVENT_TYPE_ID,
  GREYHOUND_RACING_EVENT_TYPE_ID,
  sortEventTypesForSportNav
} from '@/composables/useEventTypes.js'
import { getHomeMenuIconSrc, isHomeMenuWideIcon } from '@/composables/useHomeMenuIcons.js'
import {
  isExchangeInlineSportActive,
  navigateExchangeSport
} from '@/composables/useExchangeSportNavigation.js'
import exchangeIcon from '@/assets/img/icon/home-tabs/exchange.webp'
import casinoIcon from '@/assets/img/icon/home-tabs/casino.webp'
import sportsbookIcon from '@/assets/img/icon/home-tabs/sportsbook.webp'

const route = useRoute()
const router = useRouter()
const { eventTypes } = useEventTypes()

const EXCLUDED_BOTTOM_IDS = new Set([CASINO_EVENT_TYPE_ID, 99991])

const primaryTabs = [
  { id: 'exchange', label: 'EXCHANGE', icon: exchangeIcon },
  { id: 'casino', label: 'CASINO', icon: casinoIcon, to: '/casino' },
  { id: 'sportsbook', label: 'SPORTS BOOK', icon: sportsbookIcon, to: '/sports-book' }
]

const sportItems = computed(() => {
  const sports = sortEventTypesForSportNav(eventTypes.value || [])
    .filter((item) => !EXCLUDED_BOTTOM_IDS.has(Number(item.id)))
    .map((item) => {
      const id = Number(item.id)
      const label = sportStripLabel(id, item.name)
      return {
        id,
        label,
        iconSrc: getHomeMenuIconSrc(id),
        wideIcon: isHomeMenuWideIcon(id),
        compactLabel: label.length >= 10
      }
    })

  return [
    {
      id: 'inplay',
      label: 'IN-PLAY',
      iconSrc: getHomeMenuIconSrc('inplay'),
      wideIcon: false,
      compactLabel: false
    },
    {
      id: 'upcoming',
      label: 'UPCOMING',
      iconSrc: getHomeMenuIconSrc('upcoming'),
      wideIcon: false,
      compactLabel: false
    },
    ...sports
  ]
})

/** Short labels that fit the 67px gamesNav tile (matches reference). */
function sportStripLabel(id, name) {
  if (id === HORSE_RACING_EVENT_TYPE_ID) return 'RACING'
  if (id === GREYHOUND_RACING_EVENT_TYPE_ID) return 'GREYHOUND'
  const raw = String(name || '').trim()
  if (!raw) return ''
  // Drop trailing "Racing" clutter; keep a single readable word where possible
  return raw.toUpperCase()
}

function onPrimaryTabClick(tab) {
  if (tab.id === 'exchange') {
    if (route.path !== '/sports/live' || route.query.feed) {
      router.push('/sports/live')
    }
    return
  }
  if (tab.to) router.push(tab.to)
}

function onSportItemClick(item) {
  navigateExchangeSport(item, router)
}

function isSportItemActive(item) {
  return isExchangeInlineSportActive(item, route)
}
</script>

<style scoped>
.home-exchange-section {
  width: 100%;
  margin-bottom: 6px;
  margin-top: 10px;
  background: #ffffff;
  border-radius: 4px;
  overflow: hidden;
}

.home-exchange-tabs {
  display: flex;
  width: 100%;
  gap: 2px;
  margin: 0;
  padding: 4px 0px 0;
  list-style: none;
  background: #ffffff;
}

.home-exchange-tabs__item {
  flex: 1 1 0;
  min-width: 0;
}

.home-exchange-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 33px;
  margin: 0;
  padding: 8px 0 4px;
  border: 0;
  border-radius: 4px 4px 0 0;
  background: #360952;
  color: #ffffff;
  cursor: pointer;
}

.home-exchange-tab__wrap {
  display: flex;
  width: 100%;
}

.home-exchange-tab__inner {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 auto;
  padding: 0 8px;
}

.home-exchange-tab--active {
  background: #a31bf5;
}

.home-exchange-tab__icon {
  display: none;
  width: 16px; /* reference w-4 */
  height: auto;
  object-fit: contain;
  flex-shrink: 0;
}

/* Casino uses w-5 on reference */
.home-exchange-tab__icon--casino {
  width: 20px;
}

.home-exchange-tab__label {
  font-size: 10px;
  font-weight: 700;
  line-height: 15px;
  text-transform: uppercase;
  text-align: center;
  white-space: nowrap;
}

.home-exchange-tab__label--stacked {
  display: block;
  white-space: normal;
}

.home-exchange-tab__break {
  display: block;
}

.home-sport-strip {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  height: 64px;
  margin-top: 8px; /* reference mt-1 */
  padding: 0;
  overflow-x: auto;
  overflow-y: hidden;
  background: transparent;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.home-sport-strip::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.home-sport-strip__item {
  display: inline-flex;
  flex: 0 0 67px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px; /* reference gap-1.5 */
  width: 67px;
  min-width: 67px;
  max-width: 67px;
  height: 60px;
  margin: 0;
  padding: 0 2px;
  border: 0;
  border-radius: 5px;
  background: #f3f4f6; /* --color-sport-catg */
  color: #360952; /* --color-sport-catg-txt */
  cursor: pointer;
  overflow: hidden;
  box-sizing: border-box;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.home-sport-strip__item--active {
  background: #360952; /* --color-sportCatgSelected */
  color: #ffffff; /* --color-sport-catg-select-txt */
}

.home-sport-strip__icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
}

.home-sport-strip__item--wide .home-sport-strip__icon {
  width: 34px;
  height: 22px;
}

.home-sport-strip__item--greyhound .home-sport-strip__icon {
  width: 40px;
  height: 22px;
}

.home-sport-strip__label {
  display: block;
  width: 100%;
  max-width: 100%;
  height: 12.47px;
  padding: 0 1px;
  box-sizing: border-box;
  font-size: 9.38px;
  font-weight: 600;
  letter-spacing: normal;
  text-transform: uppercase;
  line-height: 12.47px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: inherit;
}

.home-sport-strip__item--compact .home-sport-strip__label {
  font-size: 8.38px; /* reference SportsBook / long names */
}

@media (min-width: 769px) {
  .home-exchange-tab {
    padding: 0 8px;
  }

  .home-exchange-tab__inner {
    padding: 0;
  }

  .home-exchange-tab__icon {
    display: block;
  }

  .home-exchange-tab__label {
    font-size: 10px;
  }

  .home-exchange-tab__break {
    display: none;
  }

  .home-exchange-tab__label--stacked {
    white-space: nowrap;
  }

  /* Reference: md:hover:bg-skin-sportCatg + md:hover:text-skin-sport-catg-select-txt */
  .home-sport-strip__item:hover {
    background: #a31bf5; /* --color-sportCatg */
    color: #ffffff; /* --color-sport-catg-select-txt */
  }
}

@media (max-width: 768px) {
  .home-exchange-section {
    margin-bottom: 0;
  }

  .home-exchange-tab {
    border-radius: 10px 10px 0 0;
  }

  .home-sport-strip {
    height: 64px;
  }

  .home-sport-strip__label {
    font-size: 10px;
  }

  .home-sport-strip__item--wide .home-sport-strip__icon {
    width: 36px;
    height: 24px;
  }
}
</style>
