<template>
  <div class="main-banner-slider-wrap">
    <Swiper
      :key="swiperKey"
      :modules="modules"
      :slides-per-view="1"
      :space-between="0"
      :loop="slides.length > 1"
      :speed="600"
      :autoplay="autoplayConfig"
      :pagination="{ clickable: true }"
      :grab-cursor="true"
      class="main-slider swiper"
      @swiper="onSwiper"
      @mouseenter="pauseAutoplay"
      @mouseleave="resumeAutoplay"
    >
      <SwiperSlide
        v-for="slide in slides"
        :key="slide.id"
        class="main-slider__slide"
      >
        <button
          type="button"
          class="main-slider__link"
          :aria-label="slide.alt"
          @click="handleClick(slide)"
        >
          <img
            class="main-slider__img"
            :src="slide.src"
            :alt="slide.alt"
            loading="lazy"
            decoding="async"
          />
        </button>
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { MAIN_BANNER_SLIDES } from '@/data/mainBannerSlides.js';
import casinoSections from '@/constants/casinoSections';
import { loadPublicInfo } from '@/utils/publicInfoCache';
import { findPublicSection, getCurrentSkinSections, getPublicSectionItems } from '@/utils/publicCasinoSections';
import { getImageUrl } from '@/utils/imageUrl';
import useDevices from '@/composables/useDevices.js';

const modules = [Autoplay, Pagination];
const router = useRouter();
const { isMobile } = useDevices();

const configuredDesktopSlides = ref([]);
const configuredMobileSlides = ref([]);
const swiperInstance = ref(null);

const normalizeSliderSlides = (section, idPrefix = 'banner') => getPublicSectionItems(section)
  .filter((item) => item?.imageUrl || item?.imagePath || item?.url_thumb)
  .map((item, index) => {
    const gameId = item.gameId ?? (item.type === 'game' ? item.id : null);
    return {
      id: String(item.id ?? gameId ?? `${idPrefix}-${index}`),
      src: getImageUrl(item.imageUrl || item.imagePath || item.url_thumb),
      alt: item.title || item.name || item.gameName || item.providerName || 'Promo banner',
      gameId: gameId != null ? String(gameId) : null,
      provider: item.providerName || item.provider || null,
      categoryName: item.categoryName || item.category || null,
      url: item.url || item.actionUrl || item.action_url || null,
    };
  });

const fallbackDesktopSlides = computed(() => MAIN_BANNER_SLIDES.map((slide) => ({
  ...slide,
  src: slide.src,
})));

const fallbackMobileSlides = computed(() => MAIN_BANNER_SLIDES.map((slide) => ({
  ...slide,
  id: `${slide.id}-mobile`,
  src: slide.mobileSrc || slide.src,
})));

/** Use CMS slides only when the section has at least one image; otherwise static fallback. */
const desktopSlides = computed(() => (
  configuredDesktopSlides.value.length > 0
    ? configuredDesktopSlides.value
    : fallbackDesktopSlides.value
));

const mobileSlides = computed(() => (
  configuredMobileSlides.value.length > 0
    ? configuredMobileSlides.value
    : fallbackMobileSlides.value
));

const slides = computed(() => (isMobile.value ? mobileSlides.value : desktopSlides.value));

const swiperKey = computed(() => (isMobile.value ? 'banner-mobile' : 'banner-desktop'));

const autoplayConfig = {
  delay: 3000,
  disableOnInteraction: false,
  pauseOnMouseEnter: true,
};

const onSwiper = (swiper) => {
  swiperInstance.value = swiper;
};

const pauseAutoplay = () => {
  swiperInstance.value?.autoplay?.pause();
};

const resumeAutoplay = () => {
  swiperInstance.value?.autoplay?.resume();
};

function handleClick(slide) {
  if (slide.url) {
    if (/^https?:\/\//i.test(slide.url)) {
      window.open(slide.url, '_blank', 'noopener,noreferrer');
      return;
    }
    router.push(slide.url);
    return;
  }

  if (slide.gameId) {
    router.push({ path: `/casino/game/${slide.gameId}` });
    return;
  }

  if (slide.provider) {
    router.push({
      path: '/casino',
      query: {
        provider: slide.provider,
        ...(slide.categoryName ? { gamename: slide.categoryName } : {}),
      },
    });
  }
}

onMounted(async () => {
  try {
    const info = await loadPublicInfo();
    const skinSections = getCurrentSkinSections(info);

    const desktopSection = findPublicSection(skinSections, {
      code: casinoSections.SECTION_CODES.ZUPLAY_BANNER_DESKTOP,
      aliases: ['zuplaybannerdesktop', 'bannerdesktop', 'desktopbanner'],
    });
    if (desktopSection) {
      const slides = normalizeSliderSlides(desktopSection, 'banner-desktop');
      if (slides.length > 0) {
        configuredDesktopSlides.value = slides;
      }
    }

    const mobileSection = findPublicSection(skinSections, {
      code: casinoSections.SECTION_CODES.ZUPLAY_BANNER_MOBILE,
      aliases: ['zuplaybannermobile', 'bannermobile', 'mobilebanner'],
    });
    if (mobileSection) {
      const slides = normalizeSliderSlides(mobileSection, 'banner-mobile');
      if (slides.length > 0) {
        configuredMobileSlides.value = slides;
      }
    }
  } catch (error) {
    console.warn('Failed to load zuplay banner sections:', error);
  }
});
</script>

<style scoped>
.main-banner-slider-wrap {
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  overflow: hidden;
}

.main-slider {
  width: 100%;
  padding-bottom: 0;
  box-sizing: border-box;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.main-slider :deep(.swiper-slide) {
  width: 100%;
  height: auto;
}

.main-slider__link {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: #0a0a0a;
  cursor: pointer;
  font-family: inherit;
  line-height: 0;
  border-radius: 8px;
  overflow: hidden;
}

.main-slider__img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: fill;
  object-position: center;
  border-radius: 8px;
}

/* Mobile: reference md:hidden banner — aviator-mobile.webp, h-[148px], w-[99vw], mt-[-5px] */
@media (max-width: 767.98px) {
  .main-banner-slider-wrap {
    width: 99vw;
    max-width: 99vw;
    margin-top: -5px;
    border-radius: 6px;
  }

  .main-slider {
    border-radius: 6px;
  }

  .main-slider__link {
    height: 148px;
    min-height: 148px;
    max-height: 250px;
    border-radius: 8px;
  }

  .main-slider__img {
    width: 100%;
    height: 148px;
    min-height: 148px;
    max-height: 250px;
  }

  .main-slider :deep(.swiper-pagination) {
    position: absolute;
    bottom: 10px;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 5;
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: 1;
    pointer-events: none;
  }

  .main-slider :deep(.swiper-pagination-bullet) {
    pointer-events: auto;
    width: 11px;
    height: 11px;
    margin: 0 5px !important;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    opacity: 1;
    transition: background 0.2s ease;
  }

  .main-slider :deep(.swiper-pagination-bullet-active) {
    background: var(--theme-orange, #f26c20);
  }
}

@media (min-width: 768px) {
  .main-slider :deep(.swiper-pagination) {
    display: none;
  }

  .main-slider__link {
    /* Reference CMS desktop banner: 1500×400 */
    aspect-ratio: 1500 / 400;
    height: auto;
  }

  .main-slider__img {
    width: 100%;
    height: 100%;
  }
}
</style>
