<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { useSelectedGame } from '@/composables/useSelectedGame';
import useDevices from '@/composables/useDevices.js';

const CASINO_VISIBLE_SLIDES = 7;
const MOBILE_VISIBLE_SLIDES = 3;

const props = defineProps({
    slides: {
        type: Array,
        default: () => [],
    },
    variant: {
        type: String,
        default: 'cards',
        validator: (value) => ['cards', 'casino'].includes(value),
    },
    clickable: {
        type: Boolean,
        default: true,
    },
});

const router = useRouter();
const { setSelectedGame } = useSelectedGame();
const { isMobile } = useDevices();
const modules = [Autoplay, Navigation];
const swiperInstance = ref(null);

const swiperConfig = computed(() => {
    if (props.variant === 'casino') {
        const visibleSlides = isMobile.value ? MOBILE_VISIBLE_SLIDES : CASINO_VISIBLE_SLIDES;
        return {
            slidesPerView: visibleSlides,
            spaceBetween: 2,
            slidesPerGroup: 1,
            loop: props.slides.length > visibleSlides,
        };
    }

    return {
        slidesPerView: isMobile.value ? MOBILE_VISIBLE_SLIDES : 'auto',
        spaceBetween: 2,
        slidesPerGroup: 1,
        loop: props.slides.length > (isMobile.value ? MOBILE_VISIBLE_SLIDES : 2),
    };
});

const onSwiper = (swiper) => {
    swiperInstance.value = swiper;
};

const isSlideNavigable = (slide) => Boolean(slide?.url || slide?.gameId);

const openSlide = (slide) => {
    if (slide?.url) {
        if (/^https?:\/\//i.test(slide.url)) {
            window.open(slide.url, '_blank', 'noopener,noreferrer');
            return;
        }
        router.push(slide.url);
        return;
    }

    if (!slide?.gameId) return;

    setSelectedGame({
        id: slide.gameId,
        game_id: String(slide.gameId),
        name: slide.alt || slide.name || 'Casino game',
    });
    router.push({ name: 'casino-game', params: { gameId: String(slide.gameId) } });
};
</script>

<template>
    <div
        v-if="slides.length > 0"
        class="live-image-carousel"
        :class="`live-image-carousel--${variant}`"
    >
        <Swiper
            :modules="modules"
            :slides-per-view="swiperConfig.slidesPerView"
            :space-between="swiperConfig.spaceBetween"
            :slides-per-group="swiperConfig.slidesPerGroup"
            :loop="swiperConfig.loop"
            :speed="500"
            :autoplay="{ delay: 3200, disableOnInteraction: false }"
            :navigation="false"
            :grab-cursor="true"
            class="live-image-carousel__swiper"
            @swiper="onSwiper"
        >
            <SwiperSlide v-for="slide in slides" :key="slide.id" class="live-image-carousel__slide">
                <component
                    :is="clickable && isSlideNavigable(slide) ? 'button' : 'div'"
                    :type="clickable && isSlideNavigable(slide) ? 'button' : undefined"
                    class="live-image-carousel__btn"
                    :class="{ 'live-image-carousel__btn--static': !clickable || !isSlideNavigable(slide) }"
                    :aria-label="clickable && isSlideNavigable(slide) ? (slide.alt || 'Open link') : undefined"
                    @click="clickable && isSlideNavigable(slide) ? openSlide(slide) : undefined"
                >
                    <img
                        class="live-image-carousel__img"
                        :src="slide.src"
                        :alt="slide.alt || ''"
                        loading="lazy"
                        decoding="async"
                    />
                </component>
            </SwiperSlide>
        </Swiper>
    </div>
</template>

<style scoped>
.live-image-carousel {
    width: 100%;
    padding: 0 0 4px;
    box-sizing: border-box;
}

.live-image-carousel__swiper {
    width: 100%;
}

.live-image-carousel__slide {
    width: 158px;
    height: auto;
    flex-shrink: 0;
}

.live-image-carousel--cards :deep(.swiper-slide) {
    width: clamp(148px, 40vw, 158px);
}

.live-image-carousel--casino {
    padding: 0 0 4px;
}

.live-image-carousel--casino :deep(.swiper-slide) {
    height: clamp(170px, 55vw, 195px);
}

.live-image-carousel__btn {
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    line-height: 0;
    border-radius: 8px;
    overflow: hidden;
}

.live-image-carousel__btn--static {
    cursor: default;
}

.live-image-carousel__img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
    border-radius: 8px;
}

.live-image-carousel--cards .live-image-carousel__img {
    border-radius: 8px;
}

.live-image-carousel--casino .live-image-carousel__btn {
    height: 100%;
    border-radius: 8px;
}

.live-image-carousel--casino .live-image-carousel__img {
    width: 100%;
    height: 100%;
    object-fit: fill;
    object-position: top center;
    border-radius: 8px;
}

.live-image-carousel--casino :deep(.swiper-button-prev),
.live-image-carousel--casino :deep(.swiper-button-next),
.live-image-carousel--cards :deep(.swiper-button-prev),
.live-image-carousel--cards :deep(.swiper-button-next) {
    width: 20px;
    height: 20px;
    color: #ffffff;
    background: rgba(0, 0, 0, 0.45);
    border-radius: 50%;
}

.live-image-carousel--casino :deep(.swiper-button-prev::after),
.live-image-carousel--casino :deep(.swiper-button-next::after),
.live-image-carousel--cards :deep(.swiper-button-prev::after),
.live-image-carousel--cards :deep(.swiper-button-next::after) {
    font-size: 9px;
    font-weight: 900;
}

@media (min-width: 769px) {
    .live-image-carousel {
        padding: 0 0 6px;
    }

    .live-image-carousel--cards :deep(.swiper-slide) {
        width: calc((100% - 14px) / 7.5);
        max-width: 158px;
    }

    .live-image-carousel--casino :deep(.swiper-slide) {
        height: clamp(130px, 22vw, 195px);
    }
}
</style>
