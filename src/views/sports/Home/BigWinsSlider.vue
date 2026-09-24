<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BigWinCard from '@/components/BigWinCard.vue';
import { useScrollButtons } from '@/composables/useScrollButtons';
import { fetchBigWins } from '@/api/event/bet';

const { t } = useI18n();

// Big wins data
const bigWins = ref([]);
const loading = ref(false);

// Fetch big wins on mount
onMounted(async () => {
  try {
    loading.value = true;
    const response = await fetchBigWins();
    bigWins.value = response?.bigWins || [];
  } catch (error) {
    console.error(t('components.bigWins.fetchError'), error);
  } finally {
    loading.value = false;
  }
});

// Create scroll container ref
const scrollContainer = ref(null);
const isHovered = ref(false);
const autoScrollInterval = ref(null);
const autoScrollAnimation = ref(null);

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
  scrollStep: 196 // Card width (180px) + gap (16px)
});

// Smooth auto-scroll function
const startAutoScroll = () => {
  if (!scrollContainer.value || bigWins.value.length === 0) return;

  const scrollSpeed = 0.5; // pixels per frame
  const scrollDelay = 16; // ~60fps

  const scroll = () => {
    if (isHovered.value) return; // Pause on hover

    const container = scrollContainer.value;
    if (!container) return;

    const maxScroll = container.scrollWidth - container.clientWidth;
    const currentScroll = container.scrollLeft;

    if (currentScroll >= maxScroll - 1) {
      // Reset to start smoothly
      container.scrollTo({
        left: 0,
        behavior: 'smooth'
      });
      return;
    }

    // Smooth continuous scroll
    container.scrollLeft += scrollSpeed;
    autoScrollAnimation.value = requestAnimationFrame(scroll);
  };

  autoScrollAnimation.value = requestAnimationFrame(scroll);
};

// Stop auto-scroll
const stopAutoScroll = () => {
  if (autoScrollAnimation.value) {
    cancelAnimationFrame(autoScrollAnimation.value);
    autoScrollAnimation.value = null;
  }
  if (autoScrollInterval.value) {
    clearInterval(autoScrollInterval.value);
    autoScrollInterval.value = null;
  }
};

// Watch for changes in bigWins to update scroll buttons and restart auto-scroll
watch(() => bigWins.value, () => {
  refreshScrollButtons();
  stopAutoScroll();
  if (bigWins.value.length > 0) {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      startAutoScroll();
    }, 500);
  }
}, { flush: 'post' });

// Initialize scroll button states after component is mounted
onMounted(() => {
  initializeScrollButtons();
  if (bigWins.value.length > 0) {
    setTimeout(() => {
      startAutoScroll();
    }, 1000);
  }
});

onUnmounted(() => {
  stopAutoScroll();
});
</script>

<template>
  <div v-if="bigWins.length > 0">
    <!-- Title Section -->
    <div class="tw-mb-1">
      <h2 class="tw-text-xl tw-font-bold tw-text-theme-text">{{ t('components.bigWins.title') }}</h2>
    </div>

    <!-- Big Wins Grid -->
    <div 
      ref="scrollContainer" 
      class="tw-overflow-x-auto tw-pb-4" 
      @scroll="updateScrollButtons"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
      @touchstart="isHovered = true"
      @touchend="isHovered = false">
      <div class="tw-flex tw-gap-4 tw-min-w-max">
        <div v-for="(bigWin, index) in bigWins" :key="bigWin.id || index" class="tw-flex-shrink-0">
          <BigWinCard :bigWin="bigWin" :animation-delay="index * 0.05" />
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
</style>
