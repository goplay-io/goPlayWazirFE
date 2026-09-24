<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { openLoginModal } from '@/composables/useLoginModal';
import { useEventTypes } from '@/composables/useEventTypes';
import { useScrollButtons } from '@/composables/useScrollButtons';
// Import competition images
import bblImage from '@/assets/competations/BBL.png';
import fifaWorldCupImage from '@/assets/competations/FIFA World Cup.png';
import uefaChampionsLeagueImage from '@/assets/competations/UEFA Champions League.png';
import wbblImage from '@/assets/competations/WBBL.png';
import footballFallback from '@/assets/competations/Soccer.png';
import cricketFallback from '@/assets/competations/Cricket.png';
import generalFallback from '@/assets/competations/General.jpg';
import LiveNavLabel from '@/components/LiveNavLabel.vue';

const props = defineProps({
  eventTypeList: {
    type: Array,
    default: () => []
  },
  eventList: {
    type: Array,
    default: () => []
  },
  // Controls visibility of BM / F status chips in footer
  showMarketStatus: {
    type: Boolean,
    default: true
  },
  /** When true, clicking an event card redirects to login instead of opening the event (e.g. for demo preview on landing) */
  redirectToLoginOnEventClick: {
    type: Boolean,
    default: false
  }
});

const router = useRouter();
const { getSportIcon, getEventTypeName, getEventTypeById } = useEventTypes();
const { t } = useI18n();

// Map competition names to their specific images
const competitionImageMap = {
  'BBL': bblImage,
  'FIFA World Cup': fifaWorldCupImage,
  'UEFA Champions League': uefaChampionsLeagueImage,
  'WBBL': wbblImage
};

// Map event type names to their fallback logos
const eventTypeFallbackMap = {
  'Football': footballFallback,
  'Soccer': footballFallback,
  'Cricket': cricketFallback,
  'General': generalFallback
};

// Prefer stable event-type `key` for fallback mapping (non-localized)
const eventTypeFallbackByKey = {
  football: footballFallback,
  cricket: cricketFallback,
  general: generalFallback
};

const getEventBackgroundImage = (event) => {
  if (!event) return '/featured-games-bg.png';
  const competitionName = event?.competition_name;
  if (competitionName && competitionImageMap[competitionName]) {
    return competitionImageMap[competitionName];
  }
  return '/featured-games-bg.png';
};

// Create scroll container ref
const scrollContainer = ref(null);
const currentSlideIndex = ref(0)

// Use scroll buttons composable
const {
  canScrollLeft,
  canScrollRight,
  updateScrollButtons,
  scrollLeft,
  scrollRight,
  initializeScrollButtons,
  refreshScrollButtons
} = useScrollButtons({ 
  scrollContainer,
  scrollStep: 334 // Card width (320px) + gap (14px)
});

const navigateToEvent = (eventId) => {
  if (props.redirectToLoginOnEventClick) {
    openLoginModal({ redirect: `/sports/bet/${eventId}` });
    return;
  }
  router.push(`/sports/bet/${eventId}`);
};

// Get one back odd for each team (TEAM_1 / TEAM_2)
const getTeamBack = (event, teamKey) => {
  if (!event || !event.values || !event.values[teamKey]) return '-';
  return event.values[teamKey][1] ?? '-';
};

// Get one lay odd for each team (TEAM_1 / TEAM_2)
const getTeamLay = (event, teamKey) => {
  if (!event || !event.values || !event.values[teamKey]) return '-';
  return event.values[teamKey][7] ?? '-';
};

// Calculate time difference (same as EventRow)
const getTimeAgo = (openDate) => {
  if (!openDate) return '';
  try {
    const now = new Date();
    const eventDate = new Date(openDate);
    const diffMs = now - eventDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return t('components.eventSlider.justNow');
    if (diffMins < 60) return t('components.eventSlider.minsAgo', { n: diffMins });
    if (diffHours < 24) return t('components.eventSlider.hoursAgo', { n: diffHours });
    return t('components.eventSlider.daysAgo', { n: diffDays });
  } catch (e) {
    return '';
  }
};

// Format event start date in a compact way
const formatStartDate = (openDate) => {
  if (!openDate) return '';
  try {
    const date = new Date(openDate);
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    return '';
  }
};

const toSortTime = (openDate) => {
  const t = new Date(openDate).getTime();
  return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY;
};


// Group events by event type
const groupEventsByType = (events) => {
  const grouped = {};
  
  events.forEach(event => {
    const eventTypeId = event.event_type_id;
    const eventTypeName = getEventTypeName(eventTypeId) || `Event Type ${eventTypeId}`;
    
    if (!grouped[eventTypeId]) {
      grouped[eventTypeId] = {
        id: eventTypeId,
        name: eventTypeName,
        events: []
      };
    }
    
    grouped[eventTypeId].events.push(event);
  });
  
  return grouped;
};

// Group events by event type
const groupedEvents = computed(() => {
  if (!Array.isArray(props.eventList) || props.eventList.length === 0) {
    return {};
  }
  
  // Filter for featured events only
  const featuredEvents = props.eventList.filter((event) => event.is_featured === true || event.is_featured === 1);
  
  return groupEventsByType(featuredEvents);
});

const filteredEvents = computed(() => {
  const groupsArray = Object.values(groupedEvents.value);
  
  // Flatten all events from all groups into a single array with event type name and stable key
  const flat = groupsArray.flatMap(group => 
    group.events.map(event => ({
      ...event,
      eventTypeName: group.name,
      eventTypeKey: getEventTypeById(event.event_type_id)?.key || null
    }))
  );

  // Newest/last first
  return flat.slice().sort((a, b) => {
    const ta = toSortTime(a?.open_date);
    const tb = toSortTime(b?.open_date);
    if (ta !== tb) return tb - ta;

    const ida = Number(a?.event_id ?? 0);
    const idb = Number(b?.event_id ?? 0);
    if (!Number.isNaN(ida) && !Number.isNaN(idb) && ida !== idb) return idb - ida;

    return 0;
  });
});

const currentSlideLabel = computed(() => {
  if (!filteredEvents.value.length) return '0/0'
  return `${Math.min(currentSlideIndex.value + 1, filteredEvents.value.length)}/${filteredEvents.value.length}`
})

const handleSliderScroll = () => {
  updateScrollButtons()
  const el = scrollContainer.value
  if (!el) return
  const cardWidth = 274
  currentSlideIndex.value = Math.max(0, Math.round(el.scrollLeft / cardWidth))
}

// Watch for changes in filtered events to update scroll buttons
watch(filteredEvents, () => {
  refreshScrollButtons();
}, { flush: 'post' });

// Initialize scroll button states after component is mounted
onMounted(() => {
  initializeScrollButtons();
});
</script>

<template>
  <div>
    <!-- Title Section with Scroll Control Buttons -->
    <div class="tw-flex tw-items-center tw-justify-between tw-mb-2">
      <h2 class="event-slider-title">FEATURED GAMES</h2>
      
      <div class="event-slider-controls">
        <button
          :disabled="!canScrollLeft"
          @click="scrollLeft"
          class="event-slider-nav-btn"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="event-slider-count">{{ currentSlideLabel }}</span>
        <button
          :disabled="!canScrollRight"
          @click="scrollRight"
          class="event-slider-nav-btn"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Events Grid -->
    <div 
      ref="scrollContainer"
      class="tw-overflow-x-auto tw-pb-4 tw-animate-slideInUp"
      @scroll="handleSliderScroll"
    >
      <div class="tw-flex tw-gap-2 sm:tw-gap-3.5 tw-min-w-max">
        <div
          v-for="(event, eventIndex) in filteredEvents"
          :key="eventIndex"
          class="tw-flex-shrink-0 tw-w-52 sm:tw-w-[260px]"
        >
          <!-- Event Card with race-types style design -->
          <v-card
            @click="navigateToEvent(event.event_id)"
            class="event-card tw-cursor-pointer tw-transition-all tw-duration-300 hover:tw-shadow-2xl hover:tw-transform hover:-tw-translate-y-1 tw-h-36 sm:tw-h-[224px] tw-overflow-hidden"
            variant="flat"
            rounded="lg"
            elevation="4"
          >
            <!-- Background Image with Dark Overlay -->
            <div 
              v-if="getEventBackgroundImage(event)" 
              class="event-card-background"
              :style="{ backgroundImage: `url(${getEventBackgroundImage(event)})` }">
              <div class="event-card-overlay"></div>
            </div>
            <div 
              v-else
              class="event-card-background event-card-background-fallback">
              <div class="event-card-overlay"></div>
            </div>

            <!-- Live Indicator: outside card-text so flex doesn't stretch it; small chip top-right -->
            <div
              v-if="event.in_play === true || event.in_play === 1"
              class="live-indicator-chip"
            >
              <span class="tw-text-white tw-flex tw-items-center tw-gap-1">
                <LiveNavLabel :active="false" />
              </span>
            </div>

            <!-- Card Content -->
            <v-card-text class="event-card-content">
              <!-- Event Header -->
              <div class="event-header">
                <div class="tw-flex tw-items-center tw-gap-2 tw-min-w-0 tw-pr-16 sm:tw-pr-20">
                  <v-icon 
                    :icon="getSportIcon(event.eventTypeName)" 
                    size="20"
                    class="tw-hidden sm:tw-block event-icon"
                  ></v-icon>
                  <v-icon 
                    :icon="getSportIcon(event.eventTypeName)" 
                    size="16"
                    class="sm:tw-hidden event-icon"
                  ></v-icon>
                  <div class="tw-min-w-0 tw-flex-1">
                    <h4 class="event-type-name">{{ event.eventTypeName }}</h4>
                    <p class="event-competition-name" v-if="event.competition_name">{{ event.competition_name }}</p>
                  </div>
                </div>
              </div>
              
              <!-- Event Title -->
              <h3 class="event-title">{{ event.name }}</h3>
              
              <!-- Event Date -->
              <p
                v-if="event.open_date"
                class="event-date"
              >
                {{ formatStartDate(event.open_date) }}
              </p>

              <!-- Market Status Badges -->
              <div v-if="showMarketStatus" class="tw-flex tw-gap-1 tw-flex-wrap tw-items-center tw-mt-2">
                <!-- Time Badge -->
                <v-chip
                  v-if="event.open_date"
                  size="x-small"
                  class="tw-text-[8px] sm:tw-text-[9px] !tw-h-4 sm:!tw-h-5 !tw-px-1.5 sm:!tw-px-2 tw-bg-white/10 tw-backdrop-blur-sm tw-border tw-border-white/20"
                >
                  <span class="tw-text-white">{{ getTimeAgo(event.open_date) }}</span>
                </v-chip>
                
                <!-- Fancy Market Badge -->
                <v-chip
                  v-if="event.fancy_active === true || event.fancy_active === 1"
                  size="x-small"
                  class="tw-text-[8px] sm:tw-text-[9px] !tw-h-4 sm:!tw-h-5 !tw-px-1.5 sm:!tw-px-2 tw-bg-white/10 tw-backdrop-blur-sm tw-border tw-border-white/20"
                >
                  <span class="tw-text-white">{{ ('F') }}</span>
                </v-chip>
                
                <!-- Book Maker Badge -->
                <v-chip
                  v-if="event.bm_active === true || event.bm_active === 1"
                  size="x-small"
                  class="tw-text-[8px] sm:tw-text-[9px] !tw-h-4 sm:!tw-h-5 !tw-px-1.5 sm:!tw-px-2 tw-bg-white/10 tw-backdrop-blur-sm tw-border tw-border-white/20"
                >
                  <span class="tw-text-white">{{ ('B') }}</span>
                </v-chip>

                <!-- Toss Badge -->
                <v-chip
                  v-if="event.toss_active === true || event.toss_active === 1"
                  size="x-small"
                  class="tw-text-[8px] sm:tw-text-[9px] !tw-h-4 sm:!tw-h-5 !tw-px-1.5 sm:!tw-px-2 tw-bg-white/10 tw-backdrop-blur-sm tw-border tw-border-white/20"
                >
                  <span class="tw-text-white">{{ ('T') }}</span>
                </v-chip>
              </div>

              <!-- Odds Row: back and lay for each team (TEAM_1 : TEAM_2) -->
              <div class="tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-1.5 sm:tw-gap-3 tw-mt-auto">
                <!-- TEAM_1: Back and Lay -->
                <div class="tw-flex tw-items-center tw-gap-1 tw-flex-1 tw-max-w-[100px] sm:tw-max-w-[130px]">
                  <span class="odd-box odd-back tw-flex-1 tw-text-center tw-px-1.5 sm:tw-px-2.5 tw-py-0.5 sm:tw-py-1 tw-rounded tw-text-white tw-text-[10px] sm:tw-text-sm tw-font-bold">
                    {{ getTeamBack(event, 'TEAM_1') }}
                  </span>
                  <span class="odd-box odd-lay tw-flex-1 tw-text-center tw-px-1.5 sm:tw-px-2.5 tw-py-0.5 sm:tw-py-1 tw-rounded tw-text-white tw-text-[10px] sm:tw-text-sm tw-font-bold">
                    {{ getTeamLay(event, 'TEAM_1') }}
                  </span>
                </div>
                <span class="tw-text-white/80 tw-text-xs sm:tw-text-sm tw-font-semibold">{{ t('components.eventSlider.colon') }}</span>
                <!-- TEAM_2: Back and Lay -->
                <div class="tw-flex tw-items-center tw-gap-1 tw-flex-1 tw-max-w-[100px] sm:tw-max-w-[130px]">
                  <span class="odd-box odd-back tw-flex-1 tw-text-center tw-px-1.5 sm:tw-px-2.5 tw-py-0.5 sm:tw-py-1 tw-rounded tw-text-white tw-text-[10px] sm:tw-text-sm tw-font-bold">
                    {{ getTeamBack(event, 'TEAM_2') }}
                  </span>
                  <span class="odd-box odd-lay tw-flex-1 tw-text-center tw-px-1.5 sm:tw-px-2.5 tw-py-0.5 sm:tw-py-1 tw-rounded tw-text-white tw-text-[10px] sm:tw-text-sm tw-font-bold">
                    {{ getTeamLay(event, 'TEAM_2') }}
                  </span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-slider-title {
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.event-slider-controls {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #ffffff;
}

.event-slider-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: #ffffff;
  transition: opacity 0.2s ease;
}

.event-slider-nav-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.event-slider-count {
  min-width: 32px;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
  color: #ffffff;
}

/* Event Card */
.event-card {
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border-radius: 0 !important;
}

.event-card-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

.event-card-background-fallback {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

.event-card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.8) 100%);
  z-index: 1;
  transition: background 0.3s ease;
}

.event-card:hover .event-card-overlay {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.75) 100%);
}

.event-card-content {
  position: relative;
  z-index: 2;
  padding: 10px 12px 10px 12px !important;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Event Header */
.event-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
}

.event-icon {
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  flex-shrink: 0;
}

.event-type-name {
  font-size: 11px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-competition-name {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Event Title */
.event-title {
  font-size: 13px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  line-height: 1.3;
  margin: 4px 0 2px 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
}

.event-date {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
  margin: 0;
}

/* Live chip: small badge at top-right only */
.live-indicator-chip {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 0;
  background: #5b1b87;
  border: none;
  white-space: nowrap;
  font-size: 11px;
}
.live-indicator-chip :deep(.live-nav-label) {
  gap: 3px;
}
.live-indicator-chip :deep(.broadcast-icon) {
  width: 14px;
  height: 14px;
}
.live-indicator-chip :deep(.tw-leading-none) {
  font-size: 11px;
}

.live-indicator-chip :deep(.broadcast-icon) {
  display: none;
}

/* Custom scrollbar styling for horizontal scroll */
.tw-overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-primary), 0.3) rgba(var(--v-theme-surface), 0.1);
  scroll-behavior: smooth;
  overflow-x: auto;
  cursor: grab;
}

.tw-overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.tw-overflow-x-auto::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-surface), 0.1);
  border-radius: 3px;
}

.tw-overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.3);
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.tw-overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.5);
}

/* Desktop styles */
@media (min-width: 640px) {
  .event-slider-title {
    font-size: 16px;
  }

  .event-card-content {
    padding: 14px 16px 14px 16px !important;
  }

  .event-header {
    margin-bottom: 8px;
  }

  .event-icon {
    width: 20px;
    height: 20px;
  }

  .event-type-name {
    font-size: 12px;
  }

  .event-competition-name {
    font-size: 10px;
  }

  .event-title {
    font-size: 15px;
    margin: 6px 0 4px 0;
  }

  .event-date {
    font-size: 11px;
  }

  .event-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
  }
}

/* Odds Box Styling with Theme Colors and Glow */
.odd-box {
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.odd-back {
  background-color: rgba(114, 187, 239, 0.08);
  border-color: rgba(114, 187, 239, 0.2);
}

.odd-lay {
  background-color: rgba(250, 169, 186, 0.08);
  border-color: rgba(250, 169, 186, 0.2);
}

.odd-box:hover {
  transform: scale(1.02);
}

.odd-back:hover {
  background-color: rgba(114, 187, 239, 0.12);
  border-color: rgba(114, 187, 239, 0.3);
}

.odd-lay:hover {
  background-color: rgba(250, 169, 186, 0.12);
  border-color: rgba(250, 169, 186, 0.3);
}
</style>
