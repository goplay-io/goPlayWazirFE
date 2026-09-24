<script setup>
/**
 * Vue port of wazir-userfrontend CarouselComponent.tsx
 * Tile sizes: min-w 194px / sm 240px / md 280px, min-h 36px (reference tailwind)
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import useDevices from '@/composables/useDevices.js';
import { fetchBannerImage, getCarouselProviders } from '@/utils/homeCarouselProviders.js';

const SCROLL_GAP_PX = 4;
const SCROLL_INTERVAL_MS = 2000;
const SCROLL_ANIMATION_MS = 450;

const router = useRouter();
const { isMobile } = useDevices();
const scrollRef = ref(null);

const carouselProviders = ref(getCarouselProviders());

const loopProviders = computed(() => [
  ...carouselProviders.value,
  ...carouselProviders.value,
  ...carouselProviders.value,
]);

let scrollTimerId = null;
let scrollResetTimerId = null;

const bannerSrc = (imgKey) => fetchBannerImage(imgKey, isMobile.value);

const openProvider = (item) => {
  router.push({
    name: 'casino-home',
    query: {
      provider: item.subProviderName,
      category: 'ALL',
    },
  });
};

const getScrollMetrics = () => {
  const scrollContainer = scrollRef.value;
  const firstChild = scrollContainer?.children?.[0];
  if (!scrollContainer || !firstChild) return null;

  return {
    scrollContainer,
    cardWidth: firstChild.offsetWidth + SCROLL_GAP_PX,
    totalScrollWidth: scrollContainer.scrollWidth,
    visibleWidth: scrollContainer.offsetWidth,
  };
};

const resetScrollIfNeeded = () => {
  const metrics = getScrollMetrics();
  if (!metrics) return;

  const { scrollContainer, totalScrollWidth, visibleWidth } = metrics;

  // Reference CarouselComponent: jump back when near duplicated end
  if (scrollContainer.scrollLeft + visibleWidth >= totalScrollWidth - visibleWidth) {
    scrollContainer.scrollLeft = 0;
  }
};

const scrollStep = () => {
  const metrics = getScrollMetrics();
  if (!metrics) return;

  const { scrollContainer, cardWidth } = metrics;

  scrollContainer.scrollBy({ left: cardWidth, behavior: 'smooth' });

  if (scrollResetTimerId != null) {
    clearTimeout(scrollResetTimerId);
  }
  scrollResetTimerId = window.setTimeout(resetScrollIfNeeded, SCROLL_ANIMATION_MS);
};

const startAutoScroll = () => {
  stopAutoScroll();
  scrollTimerId = window.setInterval(scrollStep, SCROLL_INTERVAL_MS);
};

const stopAutoScroll = () => {
  if (scrollTimerId != null) {
    clearInterval(scrollTimerId);
    scrollTimerId = null;
  }
  if (scrollResetTimerId != null) {
    clearTimeout(scrollResetTimerId);
    scrollResetTimerId = null;
  }
};

const refreshCarousel = async () => {
  carouselProviders.value = getCarouselProviders();
  await nextTick();
  if (scrollRef.value) {
    scrollRef.value.scrollLeft = 0;
  }
  startAutoScroll();
};

onMounted(refreshCarousel);
onUnmounted(stopAutoScroll);

watch(isMobile, refreshCarousel);
watch(carouselProviders, () => {
  startAutoScroll();
});
</script>

<template>
  <div class="home-provider-carousel">
    <div class="home-provider-carousel__shell">
      <div class="home-provider-carousel__frame">
        <div
          ref="scrollRef"
          class="home-provider-carousel__track scrollbar-hide"
        >
          <div
            v-for="(providerGroup, index) in loopProviders"
            :key="index"
            class="home-provider-carousel__column"
          >
            <template v-if="providerGroup.length === 2">
              <div
                v-for="(item, itemIndex) in providerGroup"
                :key="`${index}-${itemIndex}`"
                class="home-provider-carousel__tile"
                role="button"
                tabindex="0"
                @click="openProvider(item)"
                @keydown.enter.prevent="openProvider(item)"
              >
                <img
                  :src="bannerSrc(item.img)"
                  :alt="item.subProviderName"
                  class="home-provider-carousel__img"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reference: flex flex-col gap-1 */
.home-provider-carousel {
  --home-carousel-tile-w: 194px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  box-sizing: border-box;
}

/* Reference home wrapper: px-[2px] w-full */
.home-provider-carousel__shell {
  width: 100%;
  padding-left: 2px;
  padding-right: 2px;
  box-sizing: border-box;
}

.home-provider-carousel__frame {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
}

/* Reference: flex overflow-auto gap-1 pl-0.5 pt-1 md:pl-0 md:pt-0.5 */
.home-provider-carousel__track {
  display: flex;
  gap: 4px;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  padding-top: 4px;
  padding-left: 2px;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 768px) {
  .home-provider-carousel {
    --home-carousel-tile-w: 280px;
  }

  .home-provider-carousel__track {
    padding-top: 2px;
    padding-left: 0;
  }
}

@media (min-width: 640px) and (max-width: 767px) {
  .home-provider-carousel {
    --home-carousel-tile-w: 240px;
  }
}

/* Reference: grid grid-row-2 gap-1 */
.home-provider-carousel__column {
  display: grid;
  grid-template-rows: repeat(2, auto);
  gap: 4px;
  flex: 0 0 var(--home-carousel-tile-w);
  width: var(--home-carousel-tile-w);
  min-width: var(--home-carousel-tile-w);
  max-width: var(--home-carousel-tile-w);
}

.home-provider-carousel__tile {
  display: block;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  line-height: 0;
}

.home-provider-carousel__tile:active {
  transform: scale(0.95);
}

/*
 * Reference img classes:
 * w-full min-w-[194px] sm:min-w-[240px] md:min-w-[280px]
 * min-h-9 rounded-[4px] bg-cover bg-center
 * Banner assets are 560x72 (desktop) / 360x72 (mobile) → ~36px tall at 280px width
 */
.home-provider-carousel__img {
  display: block;
  width: 100%;
  min-width: var(--home-carousel-tile-w);
  max-width: var(--home-carousel-tile-w);
  min-height: 36px;
  height: auto;
  object-fit: cover;
  object-position: center;
  border-radius: 4px;
  transition: transform 150ms ease-in-out;
}
</style>
