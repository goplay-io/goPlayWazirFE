<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Flag from './Flag.vue'
import useDevices from '@/composables/useDevices'
import { useScorecardTvStore } from '@/stores/scorecardTv'
import { getExchangeInlineSportRoute } from '@/composables/useExchangeSportNavigation'
import { storeToRefs } from 'pinia'
import homeIcon from '@/assets/img/icon/page-title/header-home-image.png'
import chevronIcon from '@/assets/img/icon/page-title/right-arrow.png'
import liveStreamIcon from '@/assets/img/icon/page-title/live-stream-white.png'

const { t } = useI18n()
const router = useRouter()
const { isMobile } = useDevices()
const scorecardTvStore = useScorecardTvStore()
const { tvPanelVisible, scorePanelVisible, panelVisible } = storeToRefs(scorecardTvStore)

const props = defineProps({
  event_name: String,
  competition_name: String,
  country_code: String,
  event_open_time: String,
  event_open_time_diff: String,
  slipOpen: Boolean,
  inPlay: Boolean,
  betHistoryCount: Number,
  /** Sport crumb between home and the event name (omitted when empty). */
  sportName: {
    type: String,
    default: '',
  },
  /** Event type id backing the sport crumb link. */
  sportId: {
    type: [String, Number],
    default: null,
  },
  /** Show Watch button when live TV is available. */
  tvChannelActive: {
    type: Boolean,
    default: false,
  },
  hasTvStream: {
    type: Boolean,
    default: false,
  },
  /** Show the "Live score" toggle on the bottom row. */
  scoreActive: {
    type: Boolean,
    default: false,
  },
  /** Event has score feed enabled (before HTML is loaded). */
  scoreChannelActive: {
    type: Boolean,
    default: false,
  },
  /** Mobile "My Bets" switch next to the event name (replaces the old tab strip). */
  showOpenBets: {
    type: Boolean,
    default: false,
  },
  openBetsActive: {
    type: Boolean,
    default: false,
  },
  /** Desktop scorecard visibility (mobile uses the scorecard/TV store). */
  liveScoreOpen: {
    type: Boolean,
    default: false,
  },
  /** Racing & legacy layouts: show the old “Bets” chip on mobile (sports bet uses Matched Bet tab instead). */
  mobileShowBetsChip: {
    type: Boolean,
    default: false,
  },
  /** Smaller title row (e.g. racing) — avoids long venue lines crowding the header. */
  compactTitle: {
    type: Boolean,
    default: false,
  },
  /** Native tooltip when `event_name` is a shortened display string. */
  eventNameFull: {
    type: String,
    default: null,
  },
  /** Greyhound/horse racing market page — desktop bar matches reference `ul` (32px, sport + venue tab). */
  racingMarketHeader: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-slip', 'toggle-bet-history', 'toggle-live-score', 'toggle-open-bets'])

const showWatchButton = computed(() => props.tvChannelActive && props.hasTvStream)
const showTvTriggerButton = computed(() => {
  if (isMobile.value) return showWatchButton.value || props.scoreChannelActive
  return showWatchButton.value
})
const watchBtnActive = computed(() => {
  if (isMobile.value) return panelVisible.value
  return showWatchButton.value && tvPanelVisible.value
})

const titleAttr = computed(() => props.eventNameFull?.trim() || props.event_name || '')

const sportLabel = computed(() => (props.sportName || '').trim())

const liveScoreExpanded = computed(() =>
  isMobile.value ? scorePanelVisible.value : props.liveScoreOpen
)

const goBack = () => {
  router.back()
}

const goToSport = () => {
  const id = Number(props.sportId)
  if (!Number.isFinite(id)) return
  router.push(getExchangeInlineSportRoute({ id }))
}

const toggleWatch = () => {
  if (isMobile.value) {
    const tab = props.scoreChannelActive ? 'score' : 'tv'
    scorecardTvStore.togglePanel(tab)
    return
  }
  scorecardTvStore.toggleTvPanel()
}

/** Mobile scorecard lives in the shared store; desktop is owned by the bet page. */
const toggleLiveScore = () => {
  if (isMobile.value) scorecardTvStore.toggleScorePanel()
  else emit('toggle-live-score')
}

/** Mobile header tabs: event name ↔ My Bets (underline follows selection). */
const selectEventTab = () => {
  if (props.openBetsActive) emit('toggle-open-bets')
}

const selectMyBetsTab = () => {
  if (!props.openBetsActive) emit('toggle-open-bets')
}

const RAW_UNKNOWN_TIME = t('components.betHeader.unknownTime')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Reference format: "21 Jul 2026 09:30 PM". */
const statusLabel = computed(() =>
  props.inPlay ? t('components.betHeader.live') : t('components.betHeader.upcoming'),
)

/** Reference mobile sub-row: "Today - 02:00 PM". */
const formattedEventTimeMobile = computed(() => {
  if (!props.event_open_time || props.event_open_time === RAW_UNKNOWN_TIME) {
    return t('components.betHeader.unknownTime')
  }

  try {
    const date = new Date(props.event_open_time)
    if (isNaN(date.getTime())) {
      return props.event_open_time
    }

    const now = new Date()
    const rawHours = date.getHours()
    const ampm = rawHours >= 12 ? 'PM' : 'AM'
    const hours = String(rawHours % 12 || 12).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const timePart = `${hours}:${minutes} ${ampm}`

    if (date.toDateString() === now.toDateString()) {
      return `Today - ${timePart}`
    }

    const day = String(date.getDate()).padStart(2, '0')
    const month = MONTHS[date.getMonth()]
    return `${day} ${month} - ${timePart}`
  } catch (error) {
    return props.event_open_time
  }
})

const displayEventTime = computed(() =>
  isMobile.value ? formattedEventTimeMobile.value : formattedEventTime.value,
)

const formattedEventTime = computed(() => {
  if (!props.event_open_time || props.event_open_time === RAW_UNKNOWN_TIME) {
    return t('components.betHeader.unknownTime')
  }

  try {
    const date = new Date(props.event_open_time)
    if (isNaN(date.getTime())) {
      return props.event_open_time
    }

    const day = String(date.getDate()).padStart(2, '0')
    const month = MONTHS[date.getMonth()]
    const year = date.getFullYear()

    const rawHours = date.getHours()
    const ampm = rawHours >= 12 ? 'PM' : 'AM'
    const hours = String(rawHours % 12 || 12).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${day} ${month} ${year} ${hours}:${minutes} ${ampm}`
  } catch (error) {
    return props.event_open_time
  }
})
</script>

<template>
  <!-- Full width of parent column — no horizontal inset so bar length matches main content strip -->
  <div
    class="bet-header-shell"
    :class="{ 'bet-header-shell--racing': racingMarketHeader && !isMobile }"
  >
  <div
    class="bet-header-bar"
    :class="{ 'bet-header-bar--racing': racingMarketHeader && !isMobile }"
  >
    <div class="bet-header-top">
      <div class="bet-header-crumbs">
        <button
          v-if="!isMobile"
          type="button"
          class="bet-header-crumb-btn"
          :aria-label="t('common.back')"
          @click="goBack"
        >
          <img
            :src="homeIcon"
            alt=""
            class="bet-header-crumb-home-icon"
            width="15"
            height="15"
          />
        </button>
        <img
          v-if="!isMobile"
          :src="chevronIcon"
          alt=""
          class="bet-header-crumb-arrow"
          width="12"
          height="8"
          aria-hidden="true"
        />
        <template v-if="sportLabel && !isMobile">
          <button type="button" class="bet-header-crumb-sport" @click="goToSport">
            {{ sportLabel }}
          </button>
          <img
            :src="chevronIcon"
            alt=""
            class="bet-header-crumb-arrow"
            width="12"
            height="8"
            aria-hidden="true"
          />
        </template>
        <Flag
          v-if="country_code && country_code !== 'Unknown' && !(racingMarketHeader && !isMobile)"
          :code="country_code"
          size="md"
          class="tw-flex-shrink-0"
        />
        <button
          v-if="showOpenBets"
          type="button"
          class="bet-header-crumb-title bet-header-crumb-title--tab"
          :class="[
            compactTitle ? 'bet-header-crumb-title--compact' : '',
            openBetsActive ? '' : 'bet-header-crumb-title--active',
          ]"
          :title="titleAttr"
          @click="selectEventTab"
        >
          <span class="bet-header-crumb-title__text">{{ event_name }}</span>
        </button>
        <span
          v-else
          class="bet-header-crumb-title"
          :class="compactTitle ? 'bet-header-crumb-title--compact' : ''"
          :title="titleAttr"
        >
          <span class="bet-header-crumb-title__text">{{ event_name }}</span>
        </span>
        <template v-if="showOpenBets">
          <span class="bet-header-crumb-divider" aria-hidden="true">|</span>
          <button
            type="button"
            class="bet-header-open-bets"
            :class="openBetsActive ? 'bet-header-open-bets--active' : ''"
            @click="selectMyBetsTab"
          >
            {{ t('components.betMarketsToolbar.myBets') }}
          </button>
        </template>
      </div>

      <div v-if="!(racingMarketHeader && !isMobile)" class="bet-header-top-actions">
        <span class="bet-header-status" :class="inPlay ? 'bet-header-status--live' : ''">
          <span v-if="inPlay" class="bet-header-status__dot" aria-hidden="true"></span>
          {{ statusLabel }}
        </span>
        <button
          v-if="showTvTriggerButton"
          type="button"
          class="bet-header-tv"
          :aria-label="watchBtnActive ? t('components.betHeader.hide') : t('components.betHeader.liveTv')"
          @click="toggleWatch"
        >
          <img
            :src="liveStreamIcon"
            alt=""
            class="bet-header-tv__icon"
            width="18"
            height="14"
          />
        </button>
      </div>
    </div>

    <div class="bet-header-sub">
      <span class="bet-header-competition">{{ competition_name }}</span>
      <div class="bet-header-sub-actions">
        <span class="bet-header-time">{{ displayEventTime }}</span>
        <button
          v-if="scoreActive && !isMobile"
          type="button"
          class="bet-header-livescore"
          @click="toggleLiveScore"
        >
          {{ t('components.betHeader.liveScore') }}
          <v-icon
            size="16"
            class="bet-header-livescore__chevron"
            :class="liveScoreExpanded ? 'bet-header-livescore__chevron--open' : ''"
          >
            mdi-chevron-down
          </v-icon>
        </button>
      </div>
    </div>
  </div>
  <div
    v-if="racingMarketHeader && !isMobile"
    class="bet-header-racing-divider"
    aria-hidden="true"
  />
  </div>
</template>

<style scoped>
.bet-header-shell {
  width: 100%;
}

.bet-header-racing-divider {
  width: 100%;
  height: 1px;
  background: #e5e7eb;
  flex-shrink: 0;
}

.bet-header-bar {
  width: 100%;
  background: var(--color-header-bg);
  color: #ffffff;
  overflow: hidden;
}

.bet-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 25px;
  padding: 6px 8px;
}

.bet-header-crumbs {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 auto;
  min-width: 0;
}

.bet-header-crumb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 2px;
  border: 0;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  line-height: 0;
}

.bet-header-crumb-home-icon {
  display: block;
  width: 15px;
  height: 15px;
  object-fit: contain;
}

.bet-header-crumb-arrow {
  display: block;
  width: 12px;
  height: 8px;
  margin-top: 2px;
  object-fit: contain;
  transform: rotate(90deg);
  flex-shrink: 0;
}

.bet-header-crumb-sport {
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  text-underline-offset: 2px;
  cursor: pointer;
}

.bet-header-crumb-sport:hover {
  text-decoration: underline;
}

.bet-header-crumb-title {
  display: block;
  min-width: 0;
  padding-bottom: 2px;
  border-bottom: 2px solid #ffffff;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.2;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bet-header-crumb-title--tab {
  flex: 0 1 auto;
  max-width: 100%;
  padding: 0 0 2px 0;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.bet-header-crumb-title--tab.bet-header-crumb-title--active {
  border-bottom-color: #ffffff;
}

.bet-header-crumb-title--compact {
  font-size: 11px;
}

.bet-header-crumb-divider {
  flex-shrink: 0;
  color: #ffffff;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.2;
}

.bet-header-open-bets {
  flex-shrink: 0;
  padding: 0 0 2px 0;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.2;
  text-transform: uppercase;
  cursor: pointer;
}

.bet-header-open-bets--active {
  border-bottom-color: #ffffff;
}

.bet-header-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 8px;
}

.bet-header-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #ffffff;
  color: #dc2626;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.4;
  text-transform: uppercase;
}

.bet-header-status__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #dc2626;
}

.bet-header-tv {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
}

.bet-header-tv__icon {
  display: block;
  width: 18px;
  height: 14px;
  object-fit: fill;
  flex-shrink: 0;
}

.bet-header-sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 0 8px 4px 8px;
}

.bet-header-competition {
  flex: 1 1 auto;
  min-width: 0;
  color: #ffffff;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bet-header-sub-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.bet-header-time {
  color: #ffffff;
  font-size: 10px;
  font-weight: 400;
  white-space: nowrap;
}

.bet-header-livescore {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #ffffff;
  font-size: 10px;
  font-weight: 400;
  cursor: pointer;
}

.bet-header-livescore:hover {
  opacity: 0.9;
}

.bet-header-livescore__chevron {
  transition: transform 0.2s ease;
}

.bet-header-livescore__chevron--open {
  transform: rotate(180deg);
}

/* Mobile — reference market page `#mainapp … > ul` (55px, rounded top). */
@media (max-width: 767.98px) {
  .bet-header-bar {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    min-height: 55px;
    margin: 0;
    border-radius: 5px 5px 0 0;
    overflow: hidden;
    box-sizing: border-box;
  }

  .bet-header-top {
    min-height: 32px;
    height: 32px;
    padding: 0;
    gap: 0;
    margin-left: 4px;
    margin-right: 0;
    box-sizing: border-box;
  }

  .bet-header-crumbs {
    gap: 0;
    align-items: center;
    min-height: 32px;
    min-width: 0;
  }

  .bet-header-crumb-title,
  .bet-header-crumb-title--tab {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    flex: 0 0 150px;
    width: 150px;
    max-width: 150px;
    height: 32px;
    min-height: 32px;
    padding: 4px;
    margin: 0;
    box-sizing: border-box;
    font-size: 10px;
    font-weight: 700;
    line-height: 15px;
    letter-spacing: normal;
    text-transform: uppercase;
    border-bottom: 2px solid transparent;
    overflow: hidden;
  }

  .bet-header-crumb-title__text {
    display: block;
    min-width: 0;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    line-height: 18px;
    text-transform: uppercase;
  }

  .bet-header-crumb-title--tab.bet-header-crumb-title--active {
    border-bottom-color: #fafafa;
  }

  .bet-header-crumb-divider {
    margin: -4px 4px 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
  }

  .bet-header-open-bets {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    min-height: 32px;
    padding: 4px;
    margin: 0 4px;
    box-sizing: border-box;
    font-size: 12px;
    font-weight: 700;
    line-height: 18px;
    letter-spacing: normal;
    text-transform: uppercase;
    border-bottom: 2px solid transparent;
  }

  .bet-header-open-bets--active {
    border-bottom-color: #fafafa;
  }

  .bet-header-top-actions {
    margin-left: auto;
    margin-right: 16px;
    gap: 8px;
  }

  .bet-header-tv {
    display: inline-flex;
    padding: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: #ffffff;
  }

  .bet-header-status {
    gap: 0;
    padding: 0 4px;
    border-radius: 4px;
    background: #e4e4e7;
    color: #dc2626;
    font-size: 10px;
    font-weight: 600;
    line-height: 15px;
    text-transform: none;
  }

  .bet-header-status__dot {
    display: none;
  }

  .bet-header-sub {
    min-height: 23px;
    height: 23px;
    padding: 0 8px;
    gap: 8px;
    box-sizing: border-box;
  }

  .bet-header-competition {
    font-size: 11px;
    font-weight: 400;
    line-height: 16.5px;
  }

  .bet-header-time {
    font-size: 11px;
    font-weight: 600;
    line-height: 16.5px;
    color: #9ca3af;
    margin-right: 8px;
  }
}

@media (min-width: 768px) {
  .bet-header-bar {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 55px;
    border-radius: 5px 5px 0 0;
    overflow: hidden;
    box-sizing: border-box;
  }

  .bet-header-top {
    min-height: 32px;
    height: 32px;
    padding: 0;
    margin-left: 4px;
    gap: 0;
    align-items: center;
    box-sizing: border-box;
  }

  .bet-header-crumbs {
    gap: 0;
    align-items: center;
    min-height: 32px;
  }

  .bet-header-crumb-btn {
    width: 15px;
    height: 15px;
    min-width: 15px;
    min-height: 15px;
    padding: 0;
    margin-left: 16px;
  }

  .bet-header-crumb-home-icon {
    width: 15px;
    height: 15px;
  }

  .bet-header-crumb-arrow {
    width: 12px;
    height: 8px;
    margin: 2px 8px 0;
  }

  .bet-header-crumb-sport {
    margin-right: 8px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: normal;
    line-height: 18px;
  }

  .bet-header-crumb-title,
  .bet-header-crumb-title--tab {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    height: 32px;
    min-height: 32px;
    padding: 4px;
    box-sizing: border-box;
    font-size: 12px;
    font-weight: 700;
    line-height: 18px;
    letter-spacing: normal;
    border-bottom: 2px solid #fafafa;
  }

  .bet-header-crumb-title__text {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 700;
    line-height: 18px;
    text-transform: uppercase;
  }

  .bet-header-top-actions {
    margin-left: auto;
    margin-right: 16px;
    gap: 8px;
  }

  .bet-header-status {
    gap: 4px;
    padding: 0 4px;
    border-radius: 4px;
    background: #e4e4e7;
    font-size: 10px;
    font-weight: 600;
    line-height: 15px;
    text-transform: none;
  }

  .bet-header-status__dot {
    display: block;
    width: 6px;
    height: 6px;
  }

  .bet-header-tv {
    padding: 0;
    border: 0;
    outline: none;
  }

  .bet-header-sub {
    min-height: 23px;
    height: 23px;
    padding: 0 8px;
    gap: 0;
    box-sizing: border-box;
  }

  .bet-header-competition {
    font-size: 11px;
    font-weight: 400;
    line-height: 16.5px;
  }

  .bet-header-time {
    display: none;
  }

  .bet-header-livescore {
    margin-left: auto;
    margin-right: 8px;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    line-height: 16.5px;
    text-transform: none;
  }

  .bet-header-livescore__chevron {
    font-size: 16px !important;
  }

  .bet-header-bar--racing {
    min-height: 32px;
    height: 32px;
  }

  .bet-header-bar--racing .bet-header-sub {
    display: none;
  }

  .bet-header-bar--racing .bet-header-crumbs {
    gap: 4px;
  }

  .bet-header-bar--racing .bet-header-crumb-arrow {
    margin: 2px 4px 0;
  }

  .bet-header-bar--racing .bet-header-crumb-sport {
    font-size: 15px;
    font-weight: 600;
    line-height: 22.5px;
    letter-spacing: normal;
    text-transform: none;
    margin-right: 0;
  }

  .bet-header-bar--racing .bet-header-crumb-title,
  .bet-header-bar--racing .bet-header-crumb-title--tab {
    flex: 0 0 auto;
    width: auto;
    max-width: none;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: normal;
    text-transform: none;
    border-bottom: 2px solid #fafafa;
    padding: 4px;
  }

  .bet-header-bar--racing .bet-header-crumb-title__text {
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    text-transform: none;
  }
}
</style>
