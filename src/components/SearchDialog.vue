<template>
  <v-dialog 
    v-model="internalModel" 
    :fullscreen="false"
    :max-width="searchDialogMaxWidth"
    transition="dialog-top-transition"
    content-class="search-dialog-overlay-content"
    scrollable
    class="search-dialog"
  >
    <v-card class="search-dialog-card tw-bg-theme-surface tw-flex tw-flex-col tw-max-h-[min(90dvh,880px)] md:tw-max-h-none md:tw-h-auto tw-rounded-xl md:tw-rounded-lg tw-overflow-hidden">
      <!-- Header -->
      <v-card-title class="search-dialog-header tw-font-bold tw-text-base md:tw-text-lg tw-py-3 tw-px-3 md:tw-px-4 tw-flex tw-justify-between tw-items-center tw-border-b tw-border-theme-border tw-flex-shrink-0">
        <div class="tw-flex tw-items-center tw-gap-2">
          <v-icon class="search-dialog-header-icon" color="primary" size="20">mdi-magnify</v-icon>
          <span class="search-dialog-title-text">{{ t('components.searchDialog.searchTitle') }}</span>
        </div>
        <v-btn 
          icon 
          variant="text" 
          size="small" 
          @click="closeDialog" 
          class="search-dialog-close tw-text-theme-text-secondary hover:tw-text-theme-text"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Search Bar -->
      <div class="search-dialog-query tw-p-3 md:tw-p-4 tw-border-b tw-border-theme-border tw-flex-shrink-0">
        <v-text-field
          ref="searchInput"
          v-model="searchQuery"
          :placeholder="isMobile ? t('components.searchDialog.mobilePlaceholder') : t('components.searchDialog.desktopPlaceholder')"
          variant="outlined"
          :density="isMobile ? 'compact' : 'comfortable'"
          prepend-inner-icon="mdi-magnify"
          clearable
          autofocus
          hide-details
          class="search-field"
          @keydown.escape="closeDialog"
        />
        
        <!-- Search Stats -->
        <div v-if="searchQuery.trim() && !loading" class="tw-mt-2 tw-text-xs tw-text-theme-text-secondary">
          {{ searchStats }}
        </div>
      </div>

      <!-- Results Container -->
      <v-card-text class="tw-p-0 tw-flex-1 tw-overflow-y-auto results-container">
        <div class="tw-p-2 md:tw-p-4">
          <SearchResults
            ref="searchResults"
            :search-query="searchQuery"
            :loading="loading"
            :error="error"
            :casino-games="casinoGames"
            @event-selected="handleEventSelected"
            @game-selected="handleGameSelected"
          />
        </div>
      </v-card-text>

      <!-- Footer -->
      <div class="search-dialog-footer tw-p-2 md:tw-p-4 tw-border-t tw-border-theme-border tw-bg-theme-background-alt tw-flex-shrink-0">
        <div class="tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-items-center tw-gap-2 tw-text-xs tw-text-theme-text-secondary">
          <div class="tw-flex tw-items-center tw-gap-2 md:tw-gap-4 tw-flex-wrap tw-justify-center md:tw-justify-start">
            <span class="tw-hidden md:tw-inline">{{ t('components.searchDialog.pressEsc') }}</span>
            <span class="tw-text-center">{{ t('components.searchDialog.tapToView') }}</span>
          </div>
          <div v-if="totalEvents > 0 || casinoGames.length > 0" class="tw-text-theme-text tw-font-medium">
            {{ totalEvents }} {{ t('components.searchDialog.events') }}{{ casinoGames.length > 0 ? ', ' + casinoGames.length + ' ' + t('components.searchDialog.games') : '' }}
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEventsStore } from '@/stores/events/events'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import { getCasinoGames } from '@/api/event/casino'
import SearchResults from './SearchResults.vue'
import { sortCasinoGamesByPriority } from '@/utils/casinoGamePriority'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const eventsStore = useEventsStore()
const { showError, showSuccess } = useSnackbar()

// Refs
const searchInput = ref(null)
const searchResults = ref(null)
const searchQuery = ref('')
const loading = ref(false)
const error = ref(null)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const casinoGames = ref([])

const { t } = useI18n()

// Mobile detection
const isMobile = computed(() => windowWidth.value < 768)

const searchDialogMaxWidth = computed(() =>
  isMobile.value ? 'min(800px, calc(100vw - 32px))' : 800
)

// Handle window resize
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Internal model for v-model
const internalModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Computed properties
const totalEvents = computed(() => {
  return eventsStore.getAllEvents?.length || 0
})

const searchStats = computed(() => {
  if (!searchQuery.value.trim()) return ''
  
  const allEvents = eventsStore.getAllEvents || []
  const allGames = casinoGames.value || []
  const query = searchQuery.value.toLowerCase().trim()
  
  const eventMatches = allEvents.filter(event => {
    return (
      event.name?.toLowerCase().includes(query) ||
      event.event_type_name?.toLowerCase().includes(query) ||
      event.competition_name?.toLowerCase().includes(query)
    )
  }).length
  
  const gameMatches = allGames.filter(game => {
    return (
      game.name?.toLowerCase().includes(query) ||
      game.category?.toLowerCase().includes(query) ||
      game.product?.toLowerCase().includes(query) ||
      game.game_type?.toLowerCase().includes(query)
    )
  }).length
  
  const totalMatches = eventMatches + gameMatches
  
  if (totalMatches === 0) {
    return t('components.searchDialog.noMatches')
  } else if (totalMatches === 1) {
    return t('components.searchDialog.oneMatch')
  } else {
    return t('components.searchDialog.matches', { n: totalMatches })
  }
})

// Watch for dialog open/close
watch(
  () => internalModel.value,
  async (newVal, oldVal) => {
    if (newVal && !oldVal) {
      // Dialog opened
      await handleDialogOpen()
    } else if (!newVal && oldVal) {
      // Dialog closed
      handleDialogClose()
    }
  }
)

// Handle dialog opening
const handleDialogOpen = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Fetch events if not already loaded
    if (!eventsStore.hasEventsData) {
      await eventsStore.fetchAllEvents()
    }
    
    // Fetch casino games if not already loaded
    if (casinoGames.value.length === 0) {
      await fetchCasinoGames()
    }
    
    // Focus search input after dialog is fully rendered
    await nextTick()
    if (searchInput.value) {
      searchInput.value.focus()
    }
  } catch (err) {
    error.value = err.message || t('components.searchDialog.loadFailed')
    showError(t('components.searchDialog.loadFailedForSearch'))
  } finally {
    loading.value = false
  }
}

// Fetch casino games
const fetchCasinoGames = async () => {
  try {
    const response = await getCasinoGames()
    const games = []
    
    // Process the casino data from API
    // API response structure: { success: true, data: { "MAC88": { "dragon tiger": [...], ... }, ... } }
    const gamesData = response.data || response
    
    // Process products directly (MAC88, MAC EXCITE, etc.)
    Object.keys(gamesData).forEach(product => {
      const productData = gamesData[product]
      if (productData && typeof productData === 'object') {
        // Process game types within each product
        Object.keys(productData).forEach(gameType => {
          const gameList = Array.isArray(productData[gameType])
            ? sortCasinoGamesByPriority(productData[gameType])
            : []
          gameList.forEach(game => {
            games.push({
              ...game,
              product: game.product || product,
              game_type: game.game_type || gameType
            })
          })
        })
      }
    })
    
    casinoGames.value = games
  } catch (err) {
    console.error('Error loading casino games:', err)
    // Don't throw error, just log it - search can still work with events only
  }
}

// Handle dialog closing
const handleDialogClose = () => {
  // Clear search query
  searchQuery.value = ''
  error.value = null
  
  // Reset search results display limit
  if (searchResults.value?.resetDisplayLimit) {
    searchResults.value.resetDisplayLimit()
  }
}

// Close dialog
const closeDialog = () => {
  internalModel.value = false
}

// Handle event selection
const handleEventSelected = (event) => {
  showSuccess(t('components.searchDialog.opening', { name: event.name }))
  closeDialog()
}

// Handle game selection
const handleGameSelected = (game) => {
  showSuccess(t('components.searchDialog.opening', { name: game.name }))
  closeDialog()
}

// Handle keyboard shortcuts
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    closeDialog()
  }
}

// Add global keyboard listener when dialog is open
watch(
  () => internalModel.value,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.removeEventListener('keydown', handleKeydown)
    }
  }
)
</script>

<style scoped>
/* Results container - dynamic height */
.results-container {
  max-height: 60vh;
}

@media (max-width: 767px) {
  .results-container {
    max-height: none;
    flex: 1;
  }
}

/* Custom scrollbar for results */
:deep(.tw-overflow-y-auto) {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
  -webkit-overflow-scrolling: touch;
}

:deep(.tw-overflow-y-auto::-webkit-scrollbar) {
  width: 6px;
}

:deep(.tw-overflow-y-auto::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.tw-overflow-y-auto::-webkit-scrollbar-thumb) {
  background-color: var(--color-border);
  border-radius: 3px;
}

:deep(.tw-overflow-y-auto::-webkit-scrollbar-thumb:hover) {
  background-color: var(--color-text-secondary);
}

/* Search field styling */
:deep(.search-field .v-field) {
  background-color: var(--color-background-alt) !important;
}

:deep(.search-field .v-field--focused) {
  background-color: var(--color-surface) !important;
}

/* Keyboard shortcut styling */
kbd {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--color-border);
}

/* Dialog transition improvements */
:deep(.v-dialog-transition-enter-active),
:deep(.v-dialog-transition-leave-active) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.v-dialog-transition-enter-from) {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

:deep(.v-dialog-transition-leave-to) {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* Ensure proper theme colors */
:deep(.v-card) {
  background-color: var(--color-surface) !important;
  color: var(--color-text) !important;
}

:deep(.v-text-field .v-field__outline) {
  --v-field-border-color: var(--color-border);
}

:deep(.v-text-field.v-field--focused .v-field__outline) {
  --v-field-border-color: var(--color-primary);
}

/* Mobile: centered floating dialog with horizontal inset */
@media (max-width: 767px) {
  :deep(.v-overlay__content.search-dialog-overlay-content) {
    width: calc(100vw - 32px) !important;
    max-width: min(800px, calc(100vw - 32px)) !important;
    max-height: min(90dvh, 880px) !important;
    height: auto !important;
    margin: 0 !important;
    top: 50% !important;
    left: 50% !important;
    right: auto !important;
    bottom: auto !important;
    transform: translate(-50%, -50%) !important;
    align-self: center !important;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22) !important;
    border-radius: 12px !important;
    overflow: hidden !important;
  }

  /* Mobile: white sheet; dark blue header bar only (matches app nav) */
  .search-dialog-card {
    background: #ffffff !important;
    color: var(--color-text) !important;
  }

  .search-dialog-card :deep(.search-dialog-header) {
    background: var(--color-nav) !important;
    color: #ffffff !important;
    border-bottom-color: rgba(255, 255, 255, 0.15) !important;
  }

  .search-dialog-card :deep(.search-dialog-title-text) {
    color: #ffffff !important;
  }

  .search-dialog-card :deep(.search-dialog-header-icon) {
    color: var(--color-primary) !important;
  }

  .search-dialog-card :deep(.search-dialog-close .v-icon),
  .search-dialog-card :deep(.search-dialog-close) {
    color: rgba(255, 255, 255, 0.92) !important;
  }

  .search-dialog-card :deep(.search-dialog-query) {
    background: #ffffff !important;
    border-bottom-color: var(--color-border) !important;
  }

  .search-dialog-card :deep(.search-dialog-query .tw-text-theme-text-secondary) {
    color: var(--color-text-secondary) !important;
  }

  .search-dialog-card :deep(.search-field .v-field) {
    background-color: var(--color-background-alt) !important;
    border-color: var(--color-border) !important;
  }

  .search-dialog-card :deep(.search-field .v-field--focused) {
    background-color: var(--color-surface) !important;
  }

  .search-dialog-card :deep(.search-field .v-field__input) {
    color: var(--color-text) !important;
    font-size: 16px !important; /* iOS Safari auto-zooms inputs below 16px */
  }

  .search-dialog-card :deep(.search-field input) {
    font-size: 16px !important;
  }

  .search-dialog-card :deep(.search-field input::placeholder) {
    color: var(--color-text-muted) !important;
    opacity: 1 !important;
  }

  .search-dialog-card :deep(.search-field .v-field__prepend-inner .v-icon) {
    color: var(--color-text-secondary) !important;
  }

  .search-dialog-card :deep(.search-field .v-field__clearable .v-icon) {
    color: var(--color-text-secondary) !important;
  }

  .search-dialog-card :deep(.v-card-text) {
    background: #ffffff !important;
    color: var(--color-text) !important;
  }

  .search-dialog-card :deep(.search-dialog-footer) {
    background: #ffffff !important;
    border-top-color: var(--color-border) !important;
  }

  .search-dialog-card :deep(.search-dialog-footer .tw-text-theme-text-secondary) {
    color: var(--color-text-secondary) !important;
  }

  .search-dialog-card :deep(.search-dialog-footer .tw-text-theme-text) {
    color: var(--color-text) !important;
  }
}
</style>
