<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { openLoginModal } from '@/composables/useLoginModal';
import { useEventTypes } from '@/composables/useEventTypes';
import { useScrollButtons } from '@/composables/useScrollButtons';
import LiveNavLabel from '@/components/LiveNavLabel.vue';

const props = defineProps({
  eventList: {
    type: Array,
    default: () => []
  },
  /** When true, clicking redirects to login instead of event page */
  redirectToLoginOnEventClick: {
    type: Boolean,
    default: false
  }
});

const router = useRouter();
const { getSportIcon } = useEventTypes();

const scrollContainer = ref(null);

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
  scrollStep: 232 // card width (220px) + gap (12px)
});

const navigateToEvent = (eventId) => {
  if (props.redirectToLoginOnEventClick) {
    openLoginModal({ redirect: `/sports/bet/${eventId}` });
    return;
  }
  router.push(`/sports/bet/${eventId}`);
};

const formatStartDate = (openDate) => {
  if (!openDate) return '';
  try {
    const date = new Date(openDate);
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return '';
  }
};

const featuredEventsOnly = computed(() => {
  if (!Array.isArray(props.eventList) || props.eventList.length === 0) return [];
  return props.eventList.filter((event) => event.is_featured === true || event.is_featured === 1);
});

const sortedEvents = computed(() => {
  if (featuredEventsOnly.value.length === 0) return [];
  return [...featuredEventsOnly.value].sort((a, b) => {
    const ta = new Date(a?.open_date).getTime() || Number.NEGATIVE_INFINITY;
    const tb = new Date(b?.open_date).getTime() || Number.NEGATIVE_INFINITY;
    if (ta !== tb) return tb - ta;
    return Number(b?.event_id ?? 0) - Number(a?.event_id ?? 0);
  });
});

watch(sortedEvents, () => {
  refreshScrollButtons();
}, { flush: 'post' });

onMounted(() => {
  initializeScrollButtons();
});
</script>

<template>
  <div v-if="sortedEvents.length > 0" class="compact-slider-strip">
    <div
      ref="scrollContainer"
      class="compact-scroll-row"
      @scroll="updateScrollButtons"
    >
      <div class="tw-flex tw-gap-3 tw-min-w-max tw-px-1 tw-py-1">
        <div
          v-for="(event, idx) in sortedEvents"
          :key="idx"
          class="tw-flex-shrink-0"
        >
          <div
            @click="navigateToEvent(event.event_id)"
            class="compact-card tw-cursor-pointer"
          >
            <!-- Live badge -->
            <!-- <div
              v-if="event.in_play === true || event.in_play === 1"
              class="compact-live-chip"
            >
              <LiveNavLabel :active="false" />
            </div> -->

            <!-- Content -->
            <div class="compact-card-content">
              <!-- Icon + name row -->
              <div class="tw-flex tw-items-center tw-gap-1.5 tw-min-w-0">
                <v-icon
                  :icon="getSportIcon(event.eventTypeName || event.event_type_name)"
                  size="14"
                  class="compact-icon tw-flex-shrink-0"
                />
                <p class="compact-event-name">{{ event.name }}</p>
              </div>
              <!-- Date -->
              <p v-if="event.open_date" class="compact-date">
                {{ formatStartDate(event.open_date) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.compact-scroll-row {
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-primary), 0.3) transparent;
  scroll-behavior: smooth;
}

.compact-scroll-row::-webkit-scrollbar {
  height: 4px;
}
.compact-scroll-row::-webkit-scrollbar-track {
  background: transparent;
}
.compact-scroll-row::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.3);
  border-radius: 2px;
}

.compact-slider-strip {
  width: 100%;
  background: transparent;
  border-bottom: none;
}

/* Card */
.compact-card {
  position: relative;
  height: 52px;
  width: max-content;
  min-width: 140px;
  background: var(--color-nav-deep);
  border: 1px solid var(--color-nav-border);
  border-radius: 8px;
  overflow: hidden;
  font-weight: 800;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.compact-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.4);
}

.compact-card-content {
  padding: 6px 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.compact-icon {
  color: #ffffff;
  opacity: 0.85;
}

/* Event name */
.compact-event-name {
  font-size: 13px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.25;
  white-space: nowrap;
  margin: 0;
  animation: text-blink 1.4s ease-in-out infinite;
}

/* Date */
.compact-date {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  background: #018993;
  font-size: 13px;
  font-weight: 800;
  color: var(--color-text-inverse);
  margin: 0;
  white-space: nowrap;
  line-height: 1.1;
}

@keyframes text-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

/* Live chip */
.compact-live-chip {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 9999px;
  background: rgba(220, 38, 38, 0.9);
  border: 1px solid rgba(239, 68, 68, 0.5);
  font-size: 9px;
}
.compact-live-chip :deep(.live-nav-label) {
  gap: 2px;
  font-weight: inherit;
}
.compact-live-chip :deep(.broadcast-icon) {
  width: 11px;
  height: 11px;
}
.compact-live-chip :deep(.tw-leading-none) {
  font-size: 9px;
  font-weight: inherit;
}
</style>
