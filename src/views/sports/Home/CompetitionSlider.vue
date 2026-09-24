<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import CompetitionCard from '@/components/CompetitionCard.vue';
import { useScrollButtons } from '@/composables/useScrollButtons';
import { useCompetitionCards } from '@/composables/useCompetitionCards';

const props = defineProps({
  competitions: {
    type: Array,
    default: () => []
  }
});

// No re-emit needed; we navigate directly on click
const router = useRouter();

// Use competition cards composable
const { assignColorsToCompetitions } = useCompetitionCards();

// Create scroll container ref
const scrollContainer = ref(null);

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
  scrollStep: 152 // Card width (140px) + gap (16px)
});

// Computed property to get competitions with assigned colors
const competitionsWithColors = computed(() => {
  return assignColorsToCompetitions(props.competitions);
});

const { t } = useI18n();

const handleCompetitionClick = (competition) => {
  // Navigate to /sports/:event_type_id/:competition_id?
  const eventTypeId = competition?.event_type_id;
  // Coerce id to number if possible
  const rawCompetitionId = competition?.competition_id ?? competition?.id;
  const competitionId = rawCompetitionId != null && !Number.isNaN(parseInt(rawCompetitionId)) ? parseInt(rawCompetitionId) : rawCompetitionId;
  if (eventTypeId) {
    const params = { event_type_id: eventTypeId };
    if (competitionId !== undefined && competitionId !== null) {
      params.competition_id = competitionId;
    }
    router.push({ name: 'sport', params });
  }
};



// Watch for changes in competitions to update scroll buttons
watch(() => props.competitions, () => {
  refreshScrollButtons();
}, { flush: 'post' });

// Initialize scroll button states after component is mounted
onMounted(() => {
  initializeScrollButtons();
});
</script>

<template>
  <div>
    <!-- Title Section -->
    <div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
      <h2 class="tw-text-xl tw-font-bold tw-text-theme-text">{{ t('components.competitionSlider.title') }}</h2>
      
      <!-- Scroll Control Buttons -->
      <div class="tw-flex tw-gap-1.5 sm:tw-gap-2">
        <button :disabled="!canScrollLeft" @click="scrollLeft"
          class="tw-w-6 tw-h-6 sm:tw-w-7 sm:tw-h-7 tw-bg-theme-surface tw-border tw-border-theme-border tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-cursor-pointer tw-transition-all tw-duration-200 tw-text-theme-text hover:tw-bg-primary hover:tw-text-white hover:tw-border-primary disabled:tw-opacity-40 disabled:tw-cursor-not-allowed disabled:tw-bg-theme-surface">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </button>
        <button :disabled="!canScrollRight" @click="scrollRight"
          class="tw-w-6 tw-h-6 sm:tw-w-7 sm:tw-h-7 tw-bg-theme-surface tw-border tw-border-theme-border tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-cursor-pointer tw-transition-all tw-duration-200 tw-text-theme-text hover:tw-bg-primary hover:tw-text-white hover:tw-border-primary disabled:tw-opacity-40 disabled:tw-cursor-not-allowed disabled:tw-bg-theme-surface">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Competitions Grid -->
    <div ref="scrollContainer" class="tw-overflow-x-auto tw-pb-4" @scroll="updateScrollButtons">
      <div class="tw-flex tw-gap-4 tw-min-w-max">
        <div v-for="(competition, index) in competitionsWithColors" :key="index" class="tw-flex-shrink-0">
          <CompetitionCard :competition="competition" @competition-click="handleCompetitionClick" :animation-delay="index * 0.1" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar styling for horizontal scroll */
.tw-overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-primary), 0.3) rgba(var(--v-theme-surface), 0.1);
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

/* Smooth scroll behavior for arrow navigation */
.tw-overflow-x-auto {
  scroll-behavior: smooth;
  overflow-x: auto;
  cursor: grab;
}
.tw-line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
