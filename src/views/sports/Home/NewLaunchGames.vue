<template>
    <div class="new-launch-wrap">
        <div class="new-launch-header">
            <span class="new-launch-header__text">{{ t('components.newLaunchGames.title') }}</span>
        </div>

        <div v-if="loading" class="tw-flex tw-justify-center tw-items-center tw-py-8">
            <div class="tw-text-center">
                <v-progress-circular indeterminate color="primary" size="36" />
                <p class="tw-text-theme-text-secondary tw-mt-3">{{ t('components.newLaunchGames.loading') }}</p>
            </div>
        </div>

        <div v-else-if="newLaunchGames.length === 0" class="tw-text-center tw-py-8 tw-bg-theme-surface tw-rounded-lg">
            <v-icon icon="mdi-rocket-launch-outline" size="64" class="tw-text-theme-text-muted tw-mb-3" />
            <p class="tw-text-theme-text-secondary tw-text-lg">{{ t('components.newLaunchGames.noGames') }}</p>
            <p class="tw-text-theme-text-muted tw-text-sm tw-mt-2">{{ t('components.newLaunchGames.checkBack') }}</p>
        </div>

        <div v-else class="new-launch-grid" ref="gridViewportRef" @scroll.passive="onGridScroll">
            <div class="new-launch-grid__track">
                <div v-for="(game, index) in displayGames" :key="`${game.id}-nl-${index}`" class="new-launch-grid__tile"
                    @click="handleGameClick(game)">
                    <div class="new-launch-grid__media">
                        <template v-if="shouldShowImage(game)">
                            <div class="new-launch-grid__bg" :style="{ backgroundImage: `url(${game.url_thumb})` }">
                            </div>
                            <img :src="isMobileViewport && game.url_thumb_vertical ? game.url_thumb_vertical : game.url_thumb"
                                :alt="game.name" loading="lazy" decoding="async"
                                class="new-launch-grid__img" @error="handleImageError(game.id)" />
                        </template>
                        <div v-else
                            class="image-placeholder tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black tw-bg-opacity-40">
                            <v-icon icon="mdi-cards-variant" size="36" class="tw-text-white" />
                        </div>
                    </div>
                    <div class="new-launch-grid__caption">
                        <div class="new-launch-grid__name">{{ game.name }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { getNewLaunchCasinoGames } from '@/api/event/casino';
import { useSelectedGame } from '@/composables/useSelectedGame';

const { t } = useI18n();
const router = useRouter();
const { setSelectedGame } = useSelectedGame();

const loading = ref(true);
const newLaunchGames = ref([]);
const brokenImageIds = ref(new Set());
const gridViewportRef = ref(null);
const isMobileViewport = ref(false);

/** Mobile: 4 tiles visible for portrait vertical images; when N > 4, advance one column at a time; infinite forward (clone + jump). */
const VISIBLE_MOBILE_TILES = 4;
const CAROUSEL_INTERVAL_MS = 2800;

const updateViewportMode = () => {
    if (typeof window === 'undefined') return;
    isMobileViewport.value = window.matchMedia('(max-width: 767px)').matches;
};

const onWindowResize = () => {
    updateViewportMode();
    measureSlideStride();
};

const shouldCarousel = computed(
    () => isMobileViewport.value && newLaunchGames.value.length > VISIBLE_MOBILE_TILES,
);

/** Desktop / short list: originals only. Mobile carousel: append first VISIBLE clones for seamless loop. */
const displayGames = computed(() => {
    const games = newLaunchGames.value;
    const n = games.length;
    if (!isMobileViewport.value || n <= VISIBLE_MOBILE_TILES) return games;
    return [...games, ...games.slice(0, VISIBLE_MOBILE_TILES)];
});

const carouselStep = ref(0);
const slideStridePx = ref(0);
let loopSnapTimer = null;
let carouselTimerId = null;
let scrollIdleTimer = null;
let gridResizeObserver = null;

const clearCarouselTimer = () => {
    if (carouselTimerId != null) {
        clearInterval(carouselTimerId);
        carouselTimerId = null;
    }
};

const clearScrollIdleTimer = () => {
    if (scrollIdleTimer != null) {
        clearTimeout(scrollIdleTimer);
        scrollIdleTimer = null;
    }
};

const getViewportElement = () => gridViewportRef.value;

const normalizeScrollLeft = (rawScrollLeft) => {
    const len = newLaunchGames.value.length;
    const stride = slideStridePx.value;
    if (len <= VISIBLE_MOBILE_TILES || stride <= 0) return Math.max(0, rawScrollLeft);

    const fullTrackWidth = len * stride;
    if (rawScrollLeft >= fullTrackWidth) {
        return rawScrollLeft - fullTrackWidth;
    }
    return Math.max(0, rawScrollLeft);
};

const syncCarouselStepFromScroll = (rawScrollLeft) => {
    const stride = slideStridePx.value;
    if (stride <= 0) {
        carouselStep.value = 0;
        return;
    }

    const normalized = normalizeScrollLeft(rawScrollLeft);
    carouselStep.value = Math.round(normalized / stride);
};

const setViewportScrollLeft = (left, behavior = 'auto') => {
    const viewport = getViewportElement();
    if (!viewport) return;
    viewport.scrollTo({ left, behavior });
};

const normalizeViewportPosition = () => {
    const viewport = getViewportElement();
    const len = newLaunchGames.value.length;
    const stride = slideStridePx.value;
    if (!viewport || len <= VISIBLE_MOBILE_TILES || stride <= 0) return;

    const normalized = normalizeScrollLeft(viewport.scrollLeft);
    if (normalized !== viewport.scrollLeft) {
        viewport.scrollLeft = normalized;
    }
    syncCarouselStepFromScroll(normalized);
};

const measureSlideStride = () => {
    const grid = gridViewportRef.value;
    if (!grid || typeof grid.clientWidth !== 'number') return;
    const cs = getComputedStyle(grid);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) || 0;
    const inner = Math.max(0, grid.clientWidth - padX);
    slideStridePx.value = inner > 0 ? inner / VISIBLE_MOBILE_TILES : 0;
};

const restartCarouselTimer = () => {
    clearCarouselTimer();
    if (!shouldCarousel.value) return;
    carouselTimerId = window.setInterval(() => {
        const len = newLaunchGames.value.length;
        const stride = slideStridePx.value;
        const viewport = getViewportElement();
        if (!viewport || stride <= 0) return;
        if (len <= VISIBLE_MOBILE_TILES) return;
        if (carouselStep.value >= len) return;
        if (carouselStep.value === len - 1) {
            carouselStep.value = len;
            setViewportScrollLeft(len * stride, 'smooth');
            if (loopSnapTimer != null) {
                clearTimeout(loopSnapTimer);
            }
            loopSnapTimer = window.setTimeout(() => {
                loopSnapTimer = null;
                performLoopSnap();
            }, 520);
        } else {
            carouselStep.value += 1;
            setViewportScrollLeft(carouselStep.value * stride, 'smooth');
        }
    }, CAROUSEL_INTERVAL_MS);
};

const performLoopSnap = () => {
    const len = newLaunchGames.value.length;
    if (carouselStep.value !== len) return;
    if (loopSnapTimer != null) {
        clearTimeout(loopSnapTimer);
        loopSnapTimer = null;
    }
    setViewportScrollLeft(0);
    carouselStep.value = 0;
};

const onGridScroll = () => {
    if (!shouldCarousel.value) return;

    clearCarouselTimer();
    clearScrollIdleTimer();
    syncCarouselStepFromScroll(getViewportElement()?.scrollLeft ?? 0);

    scrollIdleTimer = window.setTimeout(() => {
        scrollIdleTimer = null;
        normalizeViewportPosition();
        restartCarouselTimer();
    }, 140);
};

watch(
    () => [isMobileViewport.value, newLaunchGames.value.length],
    async () => {
        if (loopSnapTimer != null) {
            clearTimeout(loopSnapTimer);
            loopSnapTimer = null;
        }
        clearScrollIdleTimer();
        carouselStep.value = 0;
        clearCarouselTimer();
        await nextTick();
        measureSlideStride();
        setViewportScrollLeft(0);
        restartCarouselTimer();
    },
);

const handleGameClick = (game) => {
    setSelectedGame(game);
    router.push({ name: 'casino-game', params: { gameId: game.id } });
};

const normalizeGames = (response) => {
    const data = response?.data?.data ?? response?.data ?? response;
    if (!Array.isArray(data)) return [];
    return data.map(game => ({
        id: game.game_id ?? game.id,
        name: game.name,
        url_thumb: game.thumbnail_url ?? game.url_thumb,
        url_thumb_vertical: game.vertical_thumbnail_url ?? null,
    }));
};

onMounted(async () => {
    updateViewportMode();
    window.addEventListener('resize', onWindowResize);

    try {
        newLaunchGames.value = normalizeGames(await getNewLaunchCasinoGames()).slice(0, 24);
    } catch (error) {
        console.error(t('components.newLaunchGames.errorLoading'), error);
    } finally {
        loading.value = false;
    }
    await nextTick();
    measureSlideStride();
    if (typeof ResizeObserver !== 'undefined' && gridViewportRef.value) {
        gridResizeObserver = new ResizeObserver(() => measureSlideStride());
        gridResizeObserver.observe(gridViewportRef.value);
    }
    restartCarouselTimer();
});

onUnmounted(() => {
    clearCarouselTimer();
    if (loopSnapTimer != null) {
        clearTimeout(loopSnapTimer);
        loopSnapTimer = null;
    }
    clearScrollIdleTimer();
    gridResizeObserver?.disconnect();
    gridResizeObserver = null;
    window.removeEventListener('resize', onWindowResize);
});

const shouldShowImage = (game) => {
    return Boolean(game?.url_thumb) && !brokenImageIds.value.has(game.id);
};

const handleImageError = (gameId) => {
    if (!gameId) return;
    const next = new Set(brokenImageIds.value);
    next.add(gameId);
    brokenImageIds.value = next;
};
</script>

<style scoped>
.new-launch-wrap {
    border: 1px solid rgba(255, 255, 255, 0.35);
    background: var(--color-nav, #071123);
    overflow: hidden;
}

.new-launch-header {
    background: var(--color-nav, #071123);
    border-bottom: 1px solid var(--color-nav-border, rgba(255, 255, 255, 0.15));
    padding: 6px 10px;
}

.new-launch-header__text {
    display: inline-block;
    color: #ffffff;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    line-height: 1;
}

@media (max-width: 767px) {
    .new-launch-wrap {
        border: none;
        border-top: 1px solid #b7862f;
        border-bottom: 1px solid #b7862f;
        margin: 0;
    }

    .new-launch-header {
        background: linear-gradient(180deg, #c9a043 0%, #a07828 100%);
        border-bottom: 1px solid rgba(0, 0, 0, 0.22);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .new-launch-header__text {
        letter-spacing: 0.08em;
    }
}

.new-launch-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1px;
    background: #ffffff;
}

.new-launch-grid__tile {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid #3f5ea5;
    background: #0b2157;
    box-sizing: border-box;
}

.new-launch-grid__media {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #0b2157;
}

.new-launch-grid__caption {
    background: var(--color-nav-deep, #212e44);
    border-top: 1px solid rgba(255, 255, 255, 0.22);
}

.new-launch-grid__name {
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.15;
    text-align: center;
    padding: 6px 4px;
    min-height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
}

.new-launch-grid__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    display: block;
}

@media (max-width: 767px) {
    .new-launch-header {
        padding: 5px 8px;
    }

    .new-launch-header__text {
        font-size: 13px;
        letter-spacing: 0.08em;
        animation: none;
        transform: none;
    }

    .new-launch-grid {
        display: block;
        overflow-x: auto;
        overflow-y: hidden;
        box-sizing: border-box;
        padding: 3px 1px;
        margin: 0;
        background: #0a1628;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        scroll-snap-type: x mandatory;
        touch-action: pan-x;
    }

    .new-launch-grid::-webkit-scrollbar {
        display: none;
    }

    .new-launch-grid__track {
        display: flex;
        flex-wrap: nowrap;
        align-items: stretch;
    }

    .new-launch-grid__tile {
        flex: 0 0 calc(100% / 4);
        width: calc(100% / 4);
        max-width: calc(100% / 4);
        min-width: 0;
        box-sizing: border-box;
        padding: 0 2px;
        background: #0a1628;
        border: none;
        border-radius: 6px;
        scroll-snap-align: start;
    }

    /* Portrait tile — 4 tiles × ~25vw wide, height ~37vw gives ≈ 2:3 portrait ratio */
    .new-launch-grid__media {
        position: relative !important;
        width: 100% !important;
        height: 37vw !important;
        overflow: hidden !important;
        background: #0a1628;
        border-radius: 6px;
        aspect-ratio: unset !important;
    }

    .new-launch-grid__bg {
        display: none;
    }

    .new-launch-grid__img {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        object-position: center center !important;
        display: block !important;
    }

    /* Hide caption on mobile: image fills the tile cleanly without overlay */
    .new-launch-grid__caption {
        display: none;
    }
}
</style>