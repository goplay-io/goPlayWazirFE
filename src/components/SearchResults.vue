<template>
  <div class="search-results" :class="{ 'search-results--compact': compact }">
    <!-- Loading State -->
    <div v-if="loading" :class="compact ? 'search-results__state' : 'tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-12'">
      <template v-if="!compact">
        <v-progress-circular indeterminate color="primary" size="48" width="4"></v-progress-circular>
        <p class="tw-mt-4 tw-text-sm tw-text-theme-text-secondary">{{ t('components.searchResults.searching') }}</p>
      </template>
      <template v-else>
        <p>{{ t('components.searchResults.searching') }}</p>
      </template>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="tw-text-center tw-py-12 tw-px-4">
      <div class="tw-w-16 tw-h-16 tw-mx-auto tw-mb-4 tw-rounded-full tw-bg-red-500/10 tw-flex tw-items-center tw-justify-center">
        <v-icon color="error" size="32">mdi-alert-circle-outline</v-icon>
      </div>
      <p class="tw-text-theme-text tw-font-medium tw-mb-1">{{ t('components.searchResults.errorTitle') }}</p>
      <p class="tw-text-theme-text-secondary tw-text-sm">{{ error }}</p>
    </div>

    <!-- Search Prompt (Initial State) -->
    <div v-else-if="!searchQuery.trim()" class="tw-text-center tw-py-12 tw-px-4">
      <div class="tw-w-20 tw-h-20 tw-mx-auto tw-mb-4 tw-rounded-full tw-bg-primary/10 tw-flex tw-items-center tw-justify-center">
        <v-icon color="primary" size="40">mdi-magnify</v-icon>
      </div>
      <p class="tw-text-theme-text tw-font-medium tw-text-lg tw-mb-2">{{ t('components.searchResults.searchTitle') }}</p>
      <p class="tw-text-theme-text-secondary tw-text-sm">{{ t('components.searchResults.searchSubtitle') }}</p>
    </div>

    <!-- No Results -->
    <div v-else-if="combinedResults.length === 0" class="tw-text-center tw-py-12 tw-px-4">
      <div class="tw-w-16 tw-h-16 tw-mx-auto tw-mb-4 tw-rounded-full tw-bg-orange-500/10 tw-flex tw-items-center tw-justify-center">
        <v-icon color="warning" size="32">mdi-emoticon-sad-outline</v-icon>
      </div>
      <p class="tw-text-theme-text tw-font-medium tw-mb-1">{{ t('components.searchResults.noResults') }}</p>
      <p class="tw-text-theme-text-secondary tw-text-sm">{{ t('components.searchResults.tryDifferent') }}</p>
    </div>

    <!-- Results -->
    <div v-else>
      <div class="tw-space-y-0">
        <button
          v-for="item in displayedResults"
          :key="`${item.type}-${item.id}`"
          type="button"
          :class="compact
            ? 'tw-w-full tw-text-left'
            : 'tw-w-full tw-text-left tw-py-1 tw-px-1 tw-border-b tw-border-theme-border hover:tw-bg-theme-surface-alt/30'"
          @click="selectResult(item)"
        >
          <div
            :class="compact
              ? 'search-results__title tw-truncate'
              : 'tw-text-[13px] tw-leading-4 tw-text-theme-text tw-truncate'"
          >{{ item.title }}</div>
          <div v-if="!compact" class="tw-text-[11px] tw-leading-4 tw-text-theme-text-secondary tw-truncate">
            {{ item.subtitle }}
          </div>
        </button>
      </div>

      <!-- Show More Button -->
      <div v-if="hasMoreResults && !compact" class="tw-text-center tw-mt-3">
          <button
          @click="showMore"
          class="tw-px-4 tw-py-1 tw-rounded-full tw-border tw-border-theme-border tw-text-xs tw-font-medium tw-text-theme-text-secondary hover:tw-bg-theme-surface-alt tw-transition-all tw-duration-200"
        >
          {{ t('components.searchResults.showMore') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useEventsStore } from '@/stores/events/events'
import { prefetchBetEvent } from '@/composables/useBetEventPrefetch'
import { sortEventsByStartTime } from '@/utils/eventSort'

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  casinoGames: {
    type: Array,
    default: () => []
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['event-selected', 'game-selected'])

const router = useRouter()
const { t } = useI18n()
const eventsStore = useEventsStore()

const displayLimit = ref(20)
const maxResults = 100
// Computed property for filtered events
const filteredEvents = computed(() => {
  if (!props.searchQuery.trim()) return []
  
  const query = props.searchQuery.toLowerCase().trim()
  const allEvents = eventsStore.getAllEvents || []
  
  return sortEventsByStartTime(allEvents.filter(event => {
    return (
      event.name?.toLowerCase().includes(query) ||
      event.event_type_name?.toLowerCase().includes(query) ||
      event.competition_name?.toLowerCase().includes(query)
    )
  }))
})

// Computed property for filtered casino games
const filteredGames = computed(() => {
  if (!props.searchQuery.trim()) return []
  
  const query = props.searchQuery.toLowerCase().trim()
  const allGames = props.casinoGames || []
  
  return allGames.filter(game => {
    return (
      game.name?.toLowerCase().includes(query) ||
      game.category?.toLowerCase().includes(query) ||
      game.product?.toLowerCase().includes(query) ||
      game.game_type?.toLowerCase().includes(query)
    )
  })
})

// Combined results for empty check
const combinedResults = computed(() => {
  return [
    ...filteredEvents.value.map((event) => ({
      type: 'event',
      id: event.id ?? event.event_id,
      title: event.name || '',
      subtitle: [event.event_type_name, event.competition_name].filter(Boolean).join(' • '),
      raw: event
    })),
    ...filteredGames.value.map((game) => ({
      type: 'game',
      id: game.id,
      title: game.name || '',
      subtitle: [game.category, game.product].filter(Boolean).join(' • '),
      raw: game
    }))
  ]
})

const displayedResults = computed(() => {
  return combinedResults.value.slice(0, displayLimit.value)
})

// Check if there are more combined results
const hasMoreResults = computed(() => {
  if (!props.searchQuery.trim()) return false
  return combinedResults.value.length > displayLimit.value
})

// Show more results
const showMore = () => {
  displayLimit.value = Math.min(displayLimit.value + 20, maxResults)
}

const selectResult = (item) => {
  if (item.type === 'event') {
    selectEvent(item.raw)
    return
  }
  selectGame(item.raw)
}

// Select an event
const selectEvent = (event) => {
  emit('event-selected', event)
  if (event.id) {
    prefetchBetEvent(event.event_id)
    router.push(`/sports/bet/${event.event_id}`)
  }
}

// Select a game
const selectGame = (game) => {
  emit('game-selected', game)
  if (game.id) {
    router.push({ name: 'casino-game', params: { gameId: game.id } })
  }
}

// Reset display limit
const resetDisplayLimit = () => {
  displayLimit.value = 20
}

defineExpose({ resetDisplayLimit })
</script>

<style scoped>
/* Smooth animations */
.tw-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Mobile touch improvements */
@media (max-width: 640px) {
  .search-results button:hover {
    background-color: transparent;
  }
}
</style>
