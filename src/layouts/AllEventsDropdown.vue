<template>
  <div>
    <!-- All Events Dropdown using Vuetify Menu -->
    <v-menu
      v-model="openAll"
      :close-on-content-click="false"
      location="right"
      offset="6"
      min-width="260"
    >
      <!-- Activator Slot (can be customized by parent) -->
      <template v-slot:activator="{ props: menuProps }">
        <slot name="activator" :props="menuProps">
          <!-- Default activator if no slot provided -->
          <div
            v-bind="menuProps"
            class="tw-relative tw-flex tw-items-center tw-gap-1.5 tw-px-2 tw-py-1 tw-border tw-border-theme-border tw-rounded-lg tw-bg-theme-surface tw-transition-all tw-duration-300 tw-shadow-sm tw-overflow-hidden hover:tw-transform hover:tw--translate-y-0.5 hover:tw-shadow-md tw-group tw-cursor-pointer"
            :class="openAll ? 'tw-bg-primary-light tw-border-primary tw-text-primary' : 'tw-text-theme-text hover:tw-bg-primary-light hover:tw-border-primary hover:tw-text-primary'"
          >
            <div
              class="tw-relative tw-w-4 tw-h-4 tw-rounded-md tw-flex tw-items-center tw-justify-center tw-transition-all tw-duration-300"
              :class="openAll ? 'tw-bg-primary tw-text-white' : 'tw-bg-theme-surface-alt tw-text-theme-text-secondary group-hover:tw-bg-primary group-hover:tw-text-white'"
            >
              <v-icon size="11">mdi-calendar-multiple</v-icon>
            </div>
            <div class="tw-flex-1">
              <span class="tw-text-xs tw-font-medium tw-transition-colors tw-duration-300">{{ t('components.allEventsDropdown.activator') }}</span>
            </div>
            <v-icon 
              size="11" 
              class="tw-transition-transform tw-duration-300"
              :class="openAll ? 'tw-rotate-180' : 'tw-rotate-0'"
            >
              mdi-chevron-down
            </v-icon>
          </div>
        </slot>
      </template>

      <!-- Menu Content -->
        <v-card class="all-events-dropdown tw-bg-theme-surface tw-border tw-border-theme-border">
        <v-card-title class="tw-text-xs tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-theme-border">
          {{ t('components.allEventsDropdown.cardTitle') }}
        </v-card-title>
        
        <v-card-text class="tw-p-0">
          <!-- Loading State -->
          <div v-if="isLoading" class="tw-flex tw-items-center tw-gap-2 tw-p-2 tw-text-theme-text-secondary">
            <v-progress-circular size="14" indeterminate color="primary"></v-progress-circular>
            <span class="tw-text-xs">{{ t('components.allEventsDropdown.loading') }}</span>
          </div>
          
          <!-- Error State -->
          <div v-else-if="eventsStore.getError" class="tw-p-2 tw-text-red-500 tw-text-xs">
            {{ t('components.allEventsDropdown.errorLoadingEventTypes', { error: eventsStore.getError }) }}
          </div>
          
          <!-- No Events State -->
          <div v-else-if="!hasEventTypesWithEvents" class="tw-p-2 tw-text-theme-text-secondary tw-text-xs">
            {{ t('components.allEventsDropdown.noEvents') }}
          </div>
          
          <!-- Event Types with Nested Menus -->
          <div v-else class="tw-max-h-80 tw-overflow-y-auto">
            <v-list density="compact" class="tw-bg-transparent tw-py-0">
                             <v-list-item
                 v-for="eventType in eventTypesWithEvents"
                 :key="eventType.id"
                 density="compact"
                 link
                 class="tw-px-2 tw-py-1 tw-min-h-0"
                 :class="isSubmenuOpen(`eventType-${eventType.id}`) ? 'active-submenu' : 'hover:tw-bg-green-500'"
               >
                <template v-slot:prepend>
                  <v-icon size="14" class="tw-mr-3">mdi-folder-outline</v-icon>
                </template>
                <v-list-item-title class="tw-text-xs">{{ eventType.name }}</v-list-item-title>
                <template v-slot:append>
                  <v-icon icon="mdi-menu-right" size="x-small"></v-icon>
                </template>

                <!-- Submenu for Competitions -->
                <v-menu 
                  :open-on-focus="false" 
                  activator="parent" 
                  open-on-hover 
                  submenu
                  @update:model-value="(val) => val ? openSubmenu(`eventType-${eventType.id}`) : closeSubmenu(`eventType-${eventType.id}`)"
                >
                  <v-list density="compact" class="tw-py-0">
                                         <v-list-item
                       v-for="competition in eventType.competitions"
                       :key="competition"
                       density="compact"
                       link
                       class="tw-px-2 tw-py-1 tw-min-h-0"
                       :class="isSubmenuOpen(`competition-${competition}`) ? 'active-submenu' : 'hover:tw-bg-green-500'"
                     >
                      <template v-slot:prepend>
                        <v-icon size="13" class="">mdi-trophy-outline</v-icon>
                      </template>
                      <v-list-item-title class="tw-text-xs">{{ competition ?? t('components.allEventsDropdown.all') }}</v-list-item-title>
                      <template v-slot:append>
                        <v-icon icon="mdi-menu-right" size="x-small"></v-icon>
                      </template>

                      <!-- Submenu for Events -->
                      <v-menu 
                        :open-on-focus="false" 
                        activator="parent" 
                        open-on-hover 
                        submenu
                        @update:model-value="(val) => val ? openSubmenu(`competition-${competition}`) : closeSubmenu(`competition-${competition}`)"
                      >
                        <v-list density="compact" class="tw-py-0">
                          <v-list-item
                            v-for="event in getEventsForCompetition(competition)"
                            :key="event.event_id"
                            :to="`/sports/bet/${event.event_id}`"
                            density="compact"
                            link
                            class="tw-px-2 tw-py-1 tw-min-h-0 hover:tw-bg-green-500"
                            @click="openAll = false"
                          >
                            <template v-slot:prepend>
                              <div
                                class="tw-w-2 tw-h-2 tw-rounded-full tw-mr-3"
                                :class="$route.path === `/sports/bet/${event.event_id}` ? 'tw-bg-primary' : 'tw-bg-white'"
                              ></div>
                            </template>
                            <v-list-item-title class="tw-text-xs">{{ event.name }}</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventsStore } from '@/stores/events/events'
import { useI18n } from 'vue-i18n'
import { sortEventsByStartTime } from '@/utils/eventSort'

// Composables
const route = useRoute()
const eventsStore = useEventsStore()

const { t } = useI18n()

// Reactive data
const openAll = ref(false)
const allEvents = ref([])
const dataLoaded = ref(false)
const isLoading = ref(false)
const openSubmenus = ref(new Set())

// Computed properties
const groupedEvents = computed(() => {
  if (!Array.isArray(allEvents.value) || allEvents.value.length === 0) {
    return {}
  }
  
  return allEvents.value.reduce((acc, event) => {
    if (!acc[event.competition_name]) {
      acc[event.competition_name] = []
    }
    acc[event.competition_name].push(event)
    return acc
  }, {})
})

const competitionsByType = computed(() => {
  const sortedCompetitions = Object.keys(groupedEvents.value).sort()
  const result = {}
  
  sortedCompetitions.forEach(competition => {
    const event = groupedEvents.value[competition][0]
    if (event && !result[event.event_type_id]) {
      result[event.event_type_id] = []
    }
    if (event) {
      result[event.event_type_id].push(competition)
    }
  })
  
  return result
})

const eventTypesWithEvents = computed(() => {
  const storeEventTypes = eventsStore.allEventTypes
  
  if (!Array.isArray(storeEventTypes)) {
    return []
  }
  
  const filteredEventTypes = storeEventTypes
    .filter(eventType => competitionsByType.value[eventType.id]?.length > 0)
    .map(eventType => ({
      ...eventType,
      competitions: competitionsByType.value[eventType.id] || []
    }))
  
  // Prioritize cricket and football
  const prioritized = []
  const others = []
  const prioritySports = ['cricket', 'football']
  
  filteredEventTypes.forEach(eventType => {
    const eventTypeName = eventType.name.toLowerCase()
    if (prioritySports.some(priority => eventTypeName.includes(priority))) {
      prioritized.push(eventType)
    } else {
      others.push(eventType)
    }
  })
  
  // Sort prioritized event types
  prioritized.sort((a, b) => {
    const aName = a.name.toLowerCase()
    const bName = b.name.toLowerCase()
    if (aName.includes('cricket')) return -1
    if (bName.includes('cricket')) return 1
    if (aName.includes('football')) return -1
    if (bName.includes('football')) return 1
    return 0
  })
  
  return [...prioritized, ...others]
})

const hasEventTypesWithEvents = computed(() => {
  return eventTypesWithEvents.value.length > 0
})

// Methods
const getEventsForCompetition = (competition) => {
  return sortEventsByStartTime(groupedEvents.value[competition] || [])
}

const isSubmenuOpen = (identifier) => {
  return openSubmenus.value.has(identifier)
}

const openSubmenu = (identifier) => {
  openSubmenus.value.add(identifier)
}

const closeSubmenu = (identifier) => {
  openSubmenus.value.delete(identifier)
}

const loadData = async () => {
  if (dataLoaded.value) return
  
  try {
    isLoading.value = true
    
    // Initialize event types from store if needed
    if (!eventsStore.allEventTypes.length) {
      await eventsStore.initializeEventTypes()
    }
    
    // Load events data using shared store (full list; active filtered client-side).
    if (!allEvents.value.length) {
      await eventsStore.fetchAllEvents()
      allEvents.value = eventsStore.allEvents
    }
    
    dataLoaded.value = true
  } catch (error) {
    console.error('Error loading data:', error)
    allEvents.value = []
  } finally {
    isLoading.value = false
  }
}

// Watchers
watch(openAll, async (newValue) => {
  if (newValue && !dataLoaded.value) {
    await loadData()
  } else if (!newValue) {
    // Close all submenus when main dropdown closes
    openSubmenus.value.clear()
  }
})

// Expose methods for external control
defineExpose({
  openAll,
  openMenu: () => { openAll.value = true },
  preloadData: () => {
    if (!dataLoaded.value && !isLoading.value) {
      loadData()
    }
  }
})
</script>

<style scoped>
.tw-rotate-180 {
  transform: rotate(180deg);
}

.tw-rotate-0 {
  transform: rotate(0deg);
}

.active-submenu {
  background: linear-gradient(to right, rgba(22, 101, 52, 0.9), rgba(22, 101, 52, 0.3), transparent);
  position: relative;
}

.active-submenu::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to right, rgba(22, 101, 52, 0.9), rgba(22, 101, 52, 0.3), transparent);
  pointer-events: none;
  z-index: -1;
}

/* Reduce Vuetify prepend gap between icon and text */
.all-events-dropdown :deep(.v-list-item__spacer) {
  width: 2px !important;
}
</style>

