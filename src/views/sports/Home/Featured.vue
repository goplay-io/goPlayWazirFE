<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import EventSlider from './EventSlider.vue';
import CompetitionSlider from './CompetitionSlider.vue';
import NewLaunchGames from './NewLaunchGames.vue';
import BigWinsSlider from './BigWinsSlider.vue';
import FavoriteCasinoGames from './FavoriteCasinoGames.vue';
import GifRow from '@/components/GifRow.vue';
import Loading from '@/components/Loading.vue';
import { useEventsStore } from '@/stores/events/events';
import { getEventTypes } from '@/api/event/eventTypes';
import { useEventTypes } from '@/composables/useEventTypes';
import { useOddsWebSocket } from '@/composables/useOddsWebSocket';
import { loadPrefetchEventDetails } from '@/composables/useBetEventPrefetch';

const { getEventTypeName } = useEventTypes();
const eventsStore = useEventsStore();

const eventTypeList = ref([]);
const eventList = ref([]);
const loading = ref(false);

// Set up odds via OddsDistributor WebSocket
const { watchForEvents: watchForEventOdds, stopOddsFetching: stopEventOddsFetching } = useOddsWebSocket(
  () => eventList.value,
  {
    onUpdate: (updatedEvents) => {
      eventList.value = updatedEvents;
    }
  }
);

// Display newest/last events first (do not mutate source list)
const orderedEventList = computed(() => {
  if (!Array.isArray(eventList.value)) return [];

  const toTime = (d) => {
    const t = new Date(d).getTime();
    return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY;
  };

  return [...eventList.value].sort((a, b) => {
    const ta = toTime(a?.open_date);
    const tb = toTime(b?.open_date);
    if (ta !== tb) return tb - ta; // desc

    const ida = Number(a?.event_id ?? 0);
    const idb = Number(b?.event_id ?? 0);
    if (!Number.isNaN(ida) && !Number.isNaN(idb) && ida !== idb) return idb - ida;

    return 0;
  });
});

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

// Process competitions with sport types and ids
const competitions = computed(() => {
  if (!Array.isArray(eventList.value) || eventList.value.length === 0) {
    return [];
  }

  // Filter for featured events only
  const featuredEvents = eventList.value.filter((event) => event.is_featured === true || event.is_featured === 1);

  // Group events by event type
  const groupedEvents = groupEventsByType(featuredEvents);

  // Create a map to store competition by name with its sport type, event_type_id and competition_id
  const competitionMap = new Map();

  // Process each group to get competitions with their sport types
  Object.values(groupedEvents).forEach(group => {
    group.events.forEach(event => {
      if (event.competition_name && event.competition_name.trim() !== '') {
        // Store the first encountered event_type_id for this competition
        if (!competitionMap.has(event.competition_name)) {
          competitionMap.set(event.competition_name, {
            sportType: group.name,
            event_type_id: event.event_type_id,
            event_type_name: event.event_type_name, // Use event_type_name directly from API
            competition_id: event.competition_id ?? null
          });
        }
      }
    });
  });

  // Convert map to array of objects with name, sportType, event_type_id, event_type_name, and competition_id
  return Array.from(competitionMap.entries())
    .map(([name, data]) => ({ 
      name, 
      sportType: data.sportType, 
      event_type_id: data.event_type_id, 
      event_type_name: data.event_type_name,
      competition_id: data.competition_id 
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

onMounted(async () => {
  loading.value = true;

  try {
    const [res, eventRows] = await Promise.all([
      getEventTypes(),
      eventsStore.fetchAllEvents(),
    ]);
    // Background warm-up for Bet navigation — does not gate Featured paint.
    loadPrefetchEventDetails();
    eventTypeList.value = res?.data?.menu || res?.menu || [];
    eventList.value = Array.isArray(eventRows) ? eventRows : [];

    // Start watching for odds updates once events are loaded
    watchForEventOdds();
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  // Stop odds polling when leaving featured page
  stopEventOddsFetching();
});
</script>

<template>
  <v-container fluid class="tw-px-4 tw-py-4">
      <!-- Loading State -->
      <Loading v-if="loading" />

      <!-- Content -->
      <div v-else>
        <!-- Event Slider Component -->
        <div class="tw-mb-5">
          <EventSlider :event-type-list="eventTypeList" :event-list="orderedEventList" />
        </div>

        <!-- Competition Slider Component -->
        <div class="tw-mb-5">
          <CompetitionSlider :competitions="competitions" />
        </div>

        <!-- Gif row above casino -->
        <div class="tw-mb-5">
          <GifRow />
        </div>

        <!-- New Launch Games -->
        <div class="tw-mb-5">
          <NewLaunchGames />
        </div>

        <!-- Favorite Casino Games -->
        <div class="tw-mb-5">
          <FavoriteCasinoGames />
        </div>

        <!-- Big Wins Slider Component -->
        <div class="tw-mb-5">
          <BigWinsSlider />
        </div>
      </div>
  </v-container>
</template>
