<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useBetStore } from '@/stores/bet'
import { useDemoUser } from '@/composables/useDemoUser'

const { t } = useI18n()

const props = defineProps({
  betHistory: {
    type: Array,
    default: null
  },
  groupByEvent: {
    type: Boolean,
    default: false
  },
  /** Edge-to-edge table rows (e.g. mobile Matched Bets fullscreen dialog) */
  fullBleed: {
    type: Boolean,
    default: false
  },
  /** Inside sports bet slip OPEN BET tab — content height follows data / empty message */
  embedded: {
    type: Boolean,
    default: false
  },
  /** Pre-grouped event sections for embedded slip (from unsettled bets API) */
  eventGroups: {
    type: Array,
    default: null,
  },
  /** Loading state for embedded unsettled bets fetch */
  loading: {
    type: Boolean,
    default: false,
  },
  /** Mobile inline Matched Bets section (dark panel under Markets toolbar) */
  mobileSection: {
    type: Boolean,
    default: false
  }
});

const betStore = useBetStore()
const route = useRoute()
const { checkIsDemoUser } = useDemoUser()

const betTypes = [
  {
    status: 'P',
    statusName: 'Pending',
    titleKey: 'components.betHistory.pending',
    icon: 'mdi-clock-outline',
  },
  {
    status: 'W',
    statusName: 'Won',
    titleKey: 'components.betHistory.won',
    icon: 'mdi-check-circle',
  },
  // {
  //   status: 'L',
  //   statusName: 'Lost',
  //   titleKey: 'components.betHistory.lost',
  //   icon: 'mdi-close-circle',
  //   color: 'error',
  // },
]

const betHistoryToUse = computed(() => {
  return props.betHistory ?? betStore.betHistory
})

const getBetsForStatus = (status) => {
  const history = betHistoryToUse.value
  if (!Array.isArray(history)) return []
  const betType = betTypes.find((bt) => bt.status === status)
  const statusName = betType?.statusName || status
  return history.filter((bet) => bet.status_name === statusName)
}

const pendingBets = computed(() => getBetsForStatus('P'))
const wonBets = computed(() => getBetsForStatus('W'))
const lostBets = computed(() => getBetsForStatus('L'))

const betsByStatus = computed(() => ({
  P: pendingBets.value,
  W: wonBets.value,
  // L: lostBets.value,
}))

// Group bets by event name (for MultiMarket page)
const betsByEvent = computed(() => {
  if (!props.groupByEvent) return {}

  const grouped = {}
  const currentBets = betsByStatus.value[activeTab.value] || []

  currentBets.forEach((bet) => {
    // Get event name from bet object (event_name, eventName, or event.name)
    const eventName =
      bet.event_name ||
      bet.eventName ||
      bet.event?.name ||
      t('components.betHistory.unknownEvent')
    const eventId = bet.eventId || bet.event_id || bet.event?.id || 'unknown'

    if (!grouped[eventName]) {
      grouped[eventName] = {
        eventName,
        eventId,
        bets: [],
      }
    }
    grouped[eventName].bets.push(bet)
  })

  return grouped
})

const activeTab = ref('P')
const expandedEvents = ref([]) // Track which event accordions are expanded (array for v-expansion-panels)
const embeddedExpandedEvents = ref(new Set())

const embeddedOpenBets = computed(() => {
  if (!props.embedded) return []
  if (props.eventGroups != null) {
    return props.eventGroups.flatMap((group) => group.bets)
  }
  return getBetsForStatus('P')
})

const embeddedBetsByEvent = computed(() => {
  if (!props.embedded) return []
  if (props.eventGroups != null) {
    return props.eventGroups
  }

  const grouped = new Map()

  embeddedOpenBets.value.forEach((bet) => {
    const eventName =
      bet.event_name ||
      bet.eventName ||
      bet.event?.name ||
      t('components.betHistory.unknownEvent')
    const sportName =
      bet.event_type_name ||
      bet.sport_name ||
      bet.sportName ||
      bet.event?.sport_name ||
      ''
    const eventId = bet.event_id || bet.eventId || bet.event?.id || eventName
    const key = String(eventId)

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        eventName,
        sportName,
        eventLabel: sportName ? `${eventName} (${sportName})` : eventName,
        bets: [],
      })
    }
    grouped.get(key).bets.push(bet)
  })

  return Array.from(grouped.values())
})

watch(
  embeddedBetsByEvent,
  (groups) => {
    if (!props.embedded) return
    embeddedExpandedEvents.value = new Set(groups.map((group) => group.key))
  },
  { immediate: true },
)

const isEmbeddedEventExpanded = (eventKey) => embeddedExpandedEvents.value.has(eventKey)

const toggleEmbeddedEvent = (eventKey) => {
  const next = new Set(embeddedExpandedEvents.value)
  if (next.has(eventKey)) next.delete(eventKey)
  else next.add(eventKey)
  embeddedExpandedEvents.value = next
}

/** API may send is_back as 0/1, strings, or alternate field names */
const isBackBet = (bet) => {
  const raw =
    bet?.is_back ??
    bet?.isBack ??
    bet?.back_lay ??
    bet?.backLay ??
    bet?.BackLay ??
    bet?.back_or_lay ??
    bet?.backOrLay

  if (raw === true || raw === 1) return true
  if (raw === false || raw === 0) return false
  if (raw == null || raw === '') return false

  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase()
    if (s === '1' || s === 'true' || s === 'back' || s === 'b') return true
    if (s === '0' || s === 'false' || s === 'lay' || s === 'l' || s === '') return false
    return false
  }

  return false
}

const getBackLayLabel = (bet) => (isBackBet(bet) ? 'Back' : 'Lay')

const formatEmbeddedTeam = (bet) =>
  bet?.runner_name || bet?.nation || bet?.selection_name || bet?.market_name || '-'

const formatEmbeddedOdds = (bet) => {
  if (bet?.rate) return `${bet.odd}/${bet.rate}`
  if (bet?.fancy_odd) return `${bet.odd}/${bet.fancy_odd}`
  return bet?.odd ?? '-'
}

const formatEmbeddedStake = (bet) => bet?.stake ?? bet?.amount ?? '-'

const formatEmbeddedPl = (bet) => {
  const val = bet?.profit_loss ?? bet?.pl ?? bet?.pnl ?? bet?.liability
  if (val == null || val === '') return '-'
  return val
}

const betRowBandClass = (bet) => {
  const base = 'bet-history-row-band tw-w-full tw-min-w-0 tw-flex-1 tw-box-border tw-flex tw-items-center tw-rounded-none'
  if (props.embedded) {
    return [base, 'bet-history-row-band--embedded-slip']
  }
  return [base, isBackBet(bet) ? 'bet-history-row-band--back' : 'bet-history-row-band--lay']
}

/** v-list-item stays transparent so Vuetify underlay/hover does not hide row tint */
const betListItemClass = 'bet-history-row-item tw-p-0 tw-min-h-0 !tw-bg-transparent'

const betHistoryHeaderClass = computed(() => {
  if (props.embedded) {
    return 'bet-history-table-header bet-history-table-header--embedded-slip'
  }
  if (props.mobileSection) {
    return 'bet-history-table-header bet-history-table-header--mobile-section'
  }
  return 'bet-history-table-header tw-grid tw-w-full tw-grid-cols-[minmax(0,1fr)_3.25rem_3.5rem] tw-gap-x-2 tw-items-center tw-px-2 tw-py-1 tw-text-[10px] tw-font-bold tw-text-[#111827] tw-bg-[#f5f5f4] sm:tw-grid-cols-[minmax(0,1fr)_3.75rem_4rem]'
})

const betHistoryRowGridClass = computed(() => {
  if (props.embedded) {
    return 'bet-history-row-grid bet-history-row-grid--embedded-slip'
  }
  if (props.mobileSection) {
    return 'bet-history-row-grid bet-history-row-grid--mobile-section'
  }
  return 'tw-grid tw-w-full tw-grid-cols-[minmax(0,1fr)_3.25rem_3.5rem] tw-gap-x-2 tw-items-center sm:tw-grid-cols-[minmax(0,1fr)_3.75rem_4rem]'
})

const formatMarketLabel = (bet) => {
  const runner = bet?.runner_name?.trim()
  const market = bet?.market_name?.trim()
  if (runner && market) return `${runner} - ${market}`
  return runner || market || t('components.betHistory.unknownEvent')
}

onMounted(async () => {
  if (props.embedded && props.eventGroups != null) return
  if (betStore.currentEventId && betStore.betHistory.length === 0 && !checkIsDemoUser()) {
    await betStore.refreshBetHistory()
  }
})

// Note: Bet history refresh is now handled by betStore.placeBet() automatically
// No need for a separate watcher here to avoid duplicate API calls
</script>

<template>
  <v-card
    :class="[
      'bet-history-root',
      embedded ? '' : 'tw-overflow-hidden',
      mobileSection
        ? 'bet-history-root--mobile-section tw-bg-transparent tw-border-0'
        : 'tw-bg-white tw-border tw-border-theme-border',
      embedded ? 'bet-history-root--embedded' : 'tw-flex tw-flex-col',
      fullBleed ? 'bet-history-root--full-bleed' : '',
    ]"
    elevation="0">

    <template v-if="embedded">
      <div class="bet-history-embedded-slip">
        <p
          v-if="loading"
          class="bet-panel-empty-message bet-panel-empty-message--embedded-slip"
        >
          {{ t('unsettledBets.loadingBets') }}
        </p>
        <p
          v-else-if="embeddedOpenBets.length === 0"
          class="bet-panel-empty-message bet-panel-empty-message--embedded-slip"
        >
          {{ t('unsettledBets.noBets') }}
        </p>
        <div v-else class="bet-history-embedded-events">
          <section
            v-for="eventGroup in embeddedBetsByEvent"
            :key="eventGroup.key"
            class="bet-history-event-group"
          >
            <div
              class="bet-history-event-header-wrap"
              :class="{ 'bet-history-event-header-wrap--expanded': isEmbeddedEventExpanded(eventGroup.key) }"
            >
              <button
                type="button"
                class="bet-history-event-header"
                :aria-expanded="isEmbeddedEventExpanded(eventGroup.key)"
                @click="toggleEmbeddedEvent(eventGroup.key)"
              >
                <span class="bet-history-event-header__label">
                  <span class="bet-history-event-header__event-name">{{ eventGroup.eventName }}</span><template v-if="eventGroup.sportName"> ({{ eventGroup.sportName }})</template>
                </span>
              </button>
              <button
                type="button"
                class="bet-history-event-header__toggle"
                :aria-expanded="isEmbeddedEventExpanded(eventGroup.key)"
                :aria-label="isEmbeddedEventExpanded(eventGroup.key) ? 'Collapse' : 'Expand'"
                @click="toggleEmbeddedEvent(eventGroup.key)"
              >
                <v-icon
                  size="12"
                  :class="{ 'bet-history-event-header__chevron--open': isEmbeddedEventExpanded(eventGroup.key) }"
                  class="bet-history-event-header__chevron"
                >
                  mdi-chevron-down
                </v-icon>
              </button>
            </div>
            <div v-show="isEmbeddedEventExpanded(eventGroup.key)" class="bet-history-event-body">
              <div class="bet-history-embedded-table-scroll">
              <table class="bet-history-embedded-table">
                <thead>
                  <tr>
                    <th class="bet-history-col-bl">B/L</th>
                    <th class="bet-history-col-team">Team</th>
                    <th class="bet-history-col-odds">Odds</th>
                    <th class="bet-history-col-stake">{{ t('betHistory.stake') }}</th>
                    <th class="bet-history-col-pl">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="bet in eventGroup.bets"
                    :key="bet.id"
                  >
                    <td class="bet-history-cell-bl">
                      <span
                        class="bet-history-bl-chip"
                        :class="isBackBet(bet) ? 'bet-history-bl-chip--back' : 'bet-history-bl-chip--lay'"
                      >
                        {{ getBackLayLabel(bet) }}
                      </span>
                    </td>
                    <td class="bet-history-cell-team">
                      {{ formatEmbeddedTeam(bet) }}
                    </td>
                    <td class="bet-history-cell-odds">
                      {{ formatEmbeddedOdds(bet) }}
                    </td>
                    <td class="bet-history-cell-stake">
                      {{ formatEmbeddedStake(bet) }}
                    </td>
                    <td class="bet-history-cell-pl">
                      {{ formatEmbeddedPl(bet) }}
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>

    <template v-else>
    <div class="bet-history-tabs-bar tw-flex tw-flex-shrink-0">
      <v-btn
        v-for="betType in betTypes"
        :key="betType.status"
        variant="flat"
        :class="[
          'bet-history-status-tab',
          activeTab === betType.status
            ? 'bet-history-status-tab--active'
            : 'bet-history-status-tab--inactive',
        ]"
        @click="activeTab = betType.status"
      >
        {{ t(betType.titleKey) }} ({{ betsByStatus[betType.status]?.length || 0 }})
      </v-btn>
    </div>

    <v-window
      v-model="activeTab"
      :class="[
        embedded ? 'bet-history-window--embedded' : 'tw-overflow-hidden',
        mobileSection ? 'bet-history-window--mobile-section' : 'tw-bg-white',
      ]"
    >
      <v-window-item v-for="betType in betTypes" :key="betType.status" :value="betType.status"
        :class="embedded ? 'bet-history-window-item--embedded' : 'tw-overflow-hidden'">
        <v-list
          v-if="betsByStatus[betType.status]?.length > 0"
          density="compact"
          class="bet-history-bet-list tw-overflow-visible"
          :class="mobileSection ? 'tw-bg-transparent' : 'tw-bg-white'"
        >
            <!-- Grouped by event (MultiMarket page) -->
            <template v-if="groupByEvent && Object.keys(betsByEvent).length > 0">
              <v-expansion-panels v-model="expandedEvents" multiple class="tw-bg-theme-surface tw-overflow-y-auto"
                density="compact">
                <v-expansion-panel v-for="(eventGroup, eventName) in betsByEvent" :key="eventName" :value="eventName"
                  class="tw-bg-theme-surface">
                  <v-expansion-panel-title
                    class="tw-text-[#111827] tw-font-bold tw-px-2 tw-py-0.5 tw-min-h-0 compact-expansion-title">
                    <div class="tw-flex tw-items-center tw-justify-between tw-w-full tw-pr-1 tw-gap-1">
                      <span class="tw-text-xs tw-leading-tight">{{ eventName }}</span>
                      <v-chip size="x-small" class="tw-ml-1 tw-h-4 tw-text-[10px] history-count-chip">
                        {{ eventGroup.bets.length }}
                      </v-chip>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text class="tw-max-h-[40vh] tw-overflow-y-auto tw-p-0 compact-expansion-text">
                    <div class="bet-history-expansion-body tw-w-full tw-px-0.5">
                      <div :class="betHistoryHeaderClass">
                        <span class="tw-text-left">{{ t('betHistory.market') }}</span>
                        <span class="tw-text-right">{{ t('components.betHistory.columnOdd') }}</span>
                        <span class="tw-text-right">{{ t('betHistory.stake') }}</span>
                      </div>
                      <div class="bet-history-rows-stack">
                        <v-list-item v-for="bet in eventGroup.bets" :key="bet.id"
                          :class="[betListItemClass, 'tw-w-full']">
                          <div :class="[...betRowBandClass(bet), fullBleed ? 'tw-py-1' : 'tw-px-2 tw-py-1']">
                            <div :class="betHistoryRowGridClass">
                              <div class="tw-min-w-0 tw-text-left tw-space-y-0">
                                <div class="tw-font-bold tw-text-[11px] tw-text-[#111827] tw-leading-tight">
                                  {{ bet.market_name }}
                                </div>
                                <div class="tw-text-[10px] tw-font-bold tw-text-[#111827] tw-leading-tight tw-truncate">
                                  {{ bet.runner_name }}
                                </div>
                              </div>
                              <div class="tw-text-right tw-text-[11px] tw-font-bold tw-text-[#111827] tw-tabular-nums tw-leading-tight">
                                {{ bet.odd }}<span v-if="bet?.rate">/{{ bet.rate }}</span>
                              </div>
                              <div class="tw-text-right tw-text-[11px] tw-font-bold tw-text-[#111827] tw-tabular-nums tw-leading-tight">
                                {{ bet.stake }}
                              </div>
                            </div>
                          </div>
                        </v-list-item>
                      </div>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </template>

            <!-- Regular list (Bet page) -->
            <!-- Regular list (Bet page) - Scrollable -->
            <template v-else>
              <div
                class="bet-history-rows-scroll"
                :class="mobileSection ? 'bet-history-rows-scroll--mobile-section' : 'tw-max-h-[min(400px,70vh)] tw-overflow-y-auto'"
              >
                <div :class="betHistoryHeaderClass">
                  <span v-if="embedded" class="bet-history-col-yn">{{ t('components.betHistory.yesNo', 'Y/N') }}</span>
                  <span class="bet-history-col-market">{{ t('betHistory.market') }}</span>
                  <span class="bet-history-col-odds">{{ mobileSection ? t('betHistory.odds') : t('components.betHistory.columnOdd') }}</span>
                  <span class="bet-history-col-stake">{{ t('betHistory.stake') }}</span>
                </div>
                <div class="bet-history-rows-stack">
                  <v-list-item v-for="bet in betsByStatus[betType.status]" :key="bet.id"
                    :class="[betListItemClass, 'tw-w-full']">
                    <div :class="[...betRowBandClass(bet), fullBleed || mobileSection ? 'tw-py-1' : embedded ? '' : 'tw-px-2 tw-py-1']">
                      <div :class="betHistoryRowGridClass">
                        <template v-if="embedded">
                          <span
                            class="bet-history-yn-chip"
                            :class="isBackBet(bet) ? 'bet-history-yn-chip--back' : 'bet-history-yn-chip--lay'"
                          >
                            {{ isBackBet(bet) ? t('components.betHistory.yes', 'Yes') : t('components.betHistory.no', 'No') }}
                          </span>
                          <div class="bet-history-market-cell">
                            {{ bet.market_name || bet.runner_name }}
                          </div>
                          <div class="bet-history-odd-cell">
                            {{ bet.odd }}<span v-if="bet?.rate">/{{ bet.rate }}</span>
                          </div>
                          <div class="bet-history-stake-cell">
                            {{ bet.stake }}
                          </div>
                        </template>
                        <template v-else>
                        <div class="tw-min-w-0 tw-text-left tw-space-y-0">
                          <template v-if="mobileSection">
                            <div class="bet-history-market-line tw-font-bold tw-text-[11px] tw-leading-tight tw-truncate">
                              {{ formatMarketLabel(bet) }}
                            </div>
                          </template>
                          <template v-else>
                            <div class="tw-font-bold tw-text-[11px] tw-text-[#111827] tw-leading-tight">
                              {{ bet.market_name }}
                            </div>
                            <div class="tw-text-[10px] tw-font-bold tw-text-[#111827] tw-leading-tight tw-truncate">
                              {{ bet.runner_name }}
                            </div>
                          </template>
                        </div>
                        <div class="tw-text-right tw-text-[11px] tw-font-bold tw-tabular-nums tw-leading-tight"
                          :class="mobileSection ? '' : 'tw-text-[#111827]'">
                          {{ bet.odd }}<span v-if="bet?.rate">/{{ bet.rate }}</span>
                        </div>
                        <div class="tw-text-right tw-text-[11px] tw-font-bold tw-tabular-nums tw-leading-tight"
                          :class="mobileSection ? '' : 'tw-text-[#111827]'">
                          {{ bet.stake }}
                        </div>
                        </template>
                      </div>
                    </div>
                  </v-list-item>
                </div>
              </div>
            </template>
        </v-list>
        <p v-else class="bet-panel-empty-message" :class="{ 'bet-panel-empty-message--mobile-section': mobileSection }">
          {{ t('components.betHistory.noBets', { status: t(betType.titleKey).toLowerCase() }) }}
        </p>
      </v-window-item>
    </v-window>
    </template>
  </v-card>
</template>

<style scoped>
/* Global theme.css forces .v-list / .v-list-item to nav colors with !important — undo inside this panel.
   Do not chain .bet-history-root under :deep — it lives on the same node as the scope attribute, so
   [data-v] .bet-history-root .child never matches. Row band colors live in theme.css under .v-card.bet-history-root. */
:deep(.v-list) {
  background-color: #fff !important;
}

:deep(.v-window) {
  background-color: #fff !important;
}

:deep(.v-list-item) {
  color: #111827 !important;
}

:deep(.v-list-item-title) {
  color: #374151 !important;
}

/* Full-width row tint lives on inner band; list item stays transparent */
:deep(.bet-history-row-item.v-list-item) {
  background-color: transparent !important;
  box-shadow: none !important;
}

:deep(.bet-history-row-item:hover),
:deep(.bet-history-row-item.v-list-item--active) {
  background-color: transparent !important;
}

:deep(.bet-history-row-item .v-list-item__overlay) {
  opacity: 0 !important;
}

:deep(.bet-history-row-item .v-list-item__underlay) {
  opacity: 0 !important;
}

/* Override Vuetify expansion panel default padding */
:deep(.compact-expansion-title) {
  padding: 1px 4px !important;
  min-height: 22px !important;
}

:deep(.compact-expansion-title .v-expansion-panel-title__overlay) {
  padding: 0 !important;
}

:deep(.compact-expansion-text) {
  padding: 0 !important;
}

:deep(.compact-expansion-text .v-expansion-panel-text__wrapper) {
  padding: 0 !important;
}

/* Reduce list item padding (bet rows use inner band; keep them full-bleed) */
:deep(.compact-expansion-text .v-list-item:not(.bet-history-row-item)) {
  padding: 4px 12px !important;
  min-height: 32px !important;
}

:deep(.compact-expansion-text .bet-history-row-item.v-list-item) {
  padding: 0 !important;
  min-height: 0 !important;
}

/* Reduce gap in flex containers */
.compact-expansion-title .tw-gap-1 {
  gap: 4px !important;
}

.compact-expansion-text .tw-gap-1\.5 {
  gap: 6px !important;
}

/* Count badge beside a grouped event name */
.history-count-chip {
  background-color: #c79fec !important;
  color: #1f1235 !important;
  border: 0 !important;
  font-weight: 800 !important;
}

/* Status tabs read as a header strip, matching the betslip / market headers */
.bet-history-tabs-bar {
  width: 100%;
  padding: 0;
  gap: 0;
}

:deep(.bet-history-status-tab.v-btn) {
  flex: 1 1 0;
  min-width: 0 !important;
  height: auto !important;
  min-height: 0 !important;
  padding: 8px 12px !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: #c79fec !important;
  color: #1f1235 !important;
  font-size: 10px !important;
  font-weight: 800 !important;
  line-height: 1.1 !important;
  letter-spacing: 0.02em !important;
  text-transform: uppercase !important;
}

:deep(.bet-history-status-tab.v-btn .v-btn__content) {
  color: inherit !important;
  font-size: 10px !important;
  font-weight: 800 !important;
}

:deep(.bet-history-status-tab.v-btn .v-btn__overlay),
:deep(.bet-history-status-tab.v-btn .v-btn__underlay) {
  opacity: 0 !important;
}

:deep(.bet-history-status-tab--active.v-btn) {
  background: var(--color-header-bg) !important;
  color: #ffffff !important;
}

.bet-history-root--embedded {
  flex: 0 0 auto !important;
  height: auto !important;
  overflow: visible !important;
  max-width: 100%;
}

.bet-history-window--embedded,
.bet-history-window--embedded :deep(.v-window__container),
.bet-history-window-item--embedded {
  height: auto !important;
  min-height: 0 !important;
}

.bet-history-root--embedded :deep(.v-list) {
  min-height: 0 !important;
}

.bet-history-embedded-table-scroll {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  touch-action: pan-x pan-y;
}

.bet-history-embedded-table-scroll::-webkit-scrollbar {
  height: 4px;
}

.bet-history-embedded-table-scroll::-webkit-scrollbar-thumb {
  background: rgba(54, 9, 82, 0.35);
  border-radius: 4px;
}

/* Embedded slip pane — reference my-bets table */
.bet-history-embedded-table {
  width: 100%;
  min-width: 400px;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  margin: 2px 0 0;
  padding: 0 4px;
  box-sizing: border-box;
  border-radius: 2px;
  color: #000000;
  background: transparent;
}

.bet-history-embedded-table thead {
  background: var(--color-header-bg, #360952);
}

.bet-history-embedded-table thead tr {
  height: 20.5px;
}

.bet-history-embedded-table th {
  padding: 1px;
  border: 0;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  color: #ffffff;
  text-align: center;
  vertical-align: middle;
  background: var(--color-header-bg, #360952);
}

.bet-history-embedded-table thead th:first-child {
  border-radius: 4px 0 0 0;
}

.bet-history-embedded-table thead th:last-child {
  border-radius: 0 4px 0 0;
}

.bet-history-col-bl {
  width: 60px;
}

.bet-history-col-team {
  width: 130px;
}

.bet-history-col-odds {
  width: 77px;
}

.bet-history-col-stake {
  width: 82px;
}

.bet-history-col-pl {
  width: 51px;
}

.bet-history-embedded-table tbody {
  border: 1px solid #e5e7eb;
}

.bet-history-embedded-table tbody tr {
  height: 27.5px;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #000000;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.bet-history-embedded-table td {
  padding: 1px;
  border: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #000000;
  vertical-align: middle;
  background: #ffffff;
}

.bet-history-cell-bl {
  width: 60px;
  text-align: center;
  padding: 4px 1px !important;
}

.bet-history-bl-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 1px 8px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
  line-height: 15px;
  color: #000000;
  box-sizing: border-box;
}

.bet-history-bl-chip--back {
  background: #8dd9ff;
}

.bet-history-bl-chip--lay {
  background: #ff94bc;
}

.bet-history-cell-team,
.bet-history-cell-odds {
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bet-history-cell-stake {
  text-align: right;
  padding: 1px 4px 1px 1px !important;
}

.bet-history-cell-pl {
  text-align: right;
  padding: 1px 8px 1px 1px !important;
}

.bet-history-table-header--embedded-slip {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr) 80px 70px;
  align-items: center;
  width: 100%;
  min-height: 20px;
  padding: 1px;
  margin: 0;
  background: var(--color-header-bg, #360952);
  color: #ffffff !important;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  box-sizing: border-box;
}

.bet-history-table-header--embedded-slip .bet-history-col-yn,
.bet-history-table-header--embedded-slip .bet-history-col-market,
.bet-history-table-header--embedded-slip .bet-history-col-odds,
.bet-history-table-header--embedded-slip .bet-history-col-stake {
  color: #ffffff !important;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
}

.bet-history-row-grid--embedded-slip {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr) 80px 70px;
  align-items: center;
  width: 100%;
  min-height: 27.5px;
  box-sizing: border-box;
}

.bet-history-row-band--embedded-slip {
  padding: 4px 1px !important;
  background: #ffffff !important;
}

.bet-history-yn-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  min-width: 30px;
  padding: 1px 8px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
  line-height: 15px;
  color: #000000 !important;
  box-sizing: border-box;
}

.bet-history-yn-chip--back {
  background: var(--color-slip-back, #8dd9ff);
}

.bet-history-yn-chip--lay {
  background: var(--color-slip-lay, #ff94bc);
}

.bet-history-market-cell,
.bet-history-odd-cell,
.bet-history-stake-cell {
  min-width: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #000000 !important;
  text-align: center;
}

.bet-history-stake-cell {
  text-align: right;
  padding-right: 4px;
}

.bet-history-market-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Embedded slip — event accordion headers (reference my-bets panel) */
.bet-history-embedded-slip {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.bet-history-embedded-events {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: #ffffff;
}

.bet-history-event-group {
  padding: 2px 0;
  box-sizing: border-box;
}

.bet-history-event-group + .bet-history-event-group {
  margin-top: 0;
}

.bet-history-event-header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 34px;
  margin-top: 1px;
  background: #f3f4f6;
  border: 0;
  border-radius: 4px;
  overflow: hidden;
  box-sizing: border-box;
}

.bet-history-event-header-wrap--expanded {
  min-height: 32px;
  background: #b08ede;
}

.bet-history-event-header {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 30px;
  min-height: 30px;
  margin-top: 1px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-size: 10px;
  font-weight: 500;
  line-height: 15px;
  color: #18181b;
  box-sizing: border-box;
}

.bet-history-event-header-wrap--expanded .bet-history-event-header {
  font-weight: 700;
  color: #000000;
}

.bet-history-event-header__label {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  min-width: 0;
  margin-left: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 600;
  line-height: 16.5px;
  color: #18181b;
}

.bet-history-event-header-wrap--expanded .bet-history-event-header__label {
  color: #000000;
}

.bet-history-event-header__event-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bet-history-event-header__toggle {
  flex: 0 0 34.95px;
  width: 34.95px;
  height: 34px;
  min-height: 34px;
  padding: 12px;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  color: #18181b;
}

.bet-history-event-header-wrap--expanded .bet-history-event-header__toggle {
  height: 32px;
  min-height: 32px;
  border-radius: 0 4px 4px 0;
  color: #000000;
}

.bet-history-event-header__chevron {
  width: 12px !important;
  height: 8px !important;
  margin-top: 2px;
  color: inherit !important;
  transition: transform 0.15s ease;
  transform: rotate(180deg);
}

.bet-history-event-header__chevron :deep(svg),
.bet-history-event-header__chevron :deep(.v-icon__svg) {
  width: 12px !important;
  height: 8px !important;
}

.bet-history-event-header__chevron--open {
  transform: rotate(0deg);
}

.bet-history-event-body {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  background: #ffffff;
}

.bet-panel-empty-message--embedded-slip {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 311px;
  margin: 0;
  padding: 0 0.75rem;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0;
  text-transform: uppercase;
  text-align: center;
  color: #000000;
  background: var(--bet-slip-empty-bg, #d1d5db);
}

:deep(.history-count-chip .v-chip__content) {
  color: inherit !important;
}
</style>
