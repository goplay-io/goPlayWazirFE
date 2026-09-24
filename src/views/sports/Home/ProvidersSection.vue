<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import evolutionGamingImg from '@/assets/providers/evolution-gaming.webp';
import macVirtualImg from '@/assets/providers/mac88-virtual-new-DHjnsLbI.webp';
import macFunGamesImg from '@/assets/providers/fun-games.webp';
import macLiveImg from '@/assets/providers/mac88-new-DoXUdKlP.webp';
import macSexyImg from '@/assets/providers/sexy.webp';
import jiliImg from '@/assets/providers/Jili.webp';
import ezugiImg from '@/assets/providers/ezugi.webp';
import macExciteImg from '@/assets/providers/mac_excite-new-ZBRGMuq7.webp';
import colorChickenGamesImg from '@/assets/providers/chicken_road_cross2.webp';

defineProps({
    /** When true, tighter mobile chrome for Live page in-scroll block. */
    liveMobile: {
        type: Boolean,
        default: false,
    },
});

const router = useRouter();
const failedThumbnails = ref(new Set());

const DESKTOP_PROVIDER_LIMIT = 8;
const MOBILE_PROVIDER_LIMIT = 9;
const MOBILE_BREAKPOINT_PX = 767;

const isMobileViewport = ref(false);

const updateViewportMode = () => {
    if (typeof window === 'undefined') return;
    isMobileViewport.value = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches;
};

onMounted(() => {
    updateViewportMode();
    window.addEventListener('resize', updateViewportMode);
});

onUnmounted(() => {
    window.removeEventListener('resize', updateViewportMode);
});

const providerCards = [
    {
        name: 'Evolution',
        thumbnail: evolutionGamingImg,
    },
    {
        name: 'MAC88 VIRTUALS',
        thumbnail: macVirtualImg,
    },
    {
        name: 'MAC88 FUN GAMES',
        thumbnail: macFunGamesImg,
    },
    {
        name: 'MAC88 LIVE',
        thumbnail: macLiveImg,
    },
    {
        name: 'MAC SEXY',
        thumbnail: macSexyImg,
    },
    {
        name: 'JILI',
        thumbnail: jiliImg,
    },
    {
        name: 'Ezugi',
        thumbnail: ezugiImg,
    },
    {
        name: 'MAC EXCITE',
        thumbnail: macExciteImg,
    },
    {
        name: 'COLOR AND CHICKEN GAMES',
        thumbnail: colorChickenGamesImg,
    },
];

const visibleProviderCards = computed(() => {
    const limit = isMobileViewport.value ? MOBILE_PROVIDER_LIMIT : DESKTOP_PROVIDER_LIMIT;
    return providerCards.slice(0, limit);
});

const goToCasino = (providerName) => {
    router.push({
        name: 'casino-home',
        query: providerName ? { provider: providerName } : {},
    });
};

const handleProviderImageError = (providerName) => {
    failedThumbnails.value = new Set([...failedThumbnails.value, providerName]);
};

const showProviderFallback = (provider) =>
    !provider.thumbnail || failedThumbnails.value.has(provider.name);
</script>

<template>
    <section class="providers-section" :class="{ 'providers-section--live-mobile': liveMobile }">
        <header v-if="liveMobile" class="providers-section__header providers-section__header--casino">
            <v-icon icon="mdi-cards-spade" size="20" class="providers-section__header-icon" aria-hidden="true" />
            <h3 class="providers-section__title providers-section__title--casino">Casino Provider</h3>
        </header>
        <header v-else class="providers-section__header">
            <h3 class="providers-section__title">OUR PROVIDERS</h3>
        </header>

        <div class="providers-section__grid">
            <button v-for="provider in visibleProviderCards" :key="provider.name" type="button"
                class="providers-section__card"
                @click="goToCasino(provider.name)">
                <div class="providers-section__media">
                    <img v-if="provider.thumbnail && !failedThumbnails.has(provider.name)" :src="provider.thumbnail"
                        :alt="provider.name" loading="lazy" decoding="async" class="providers-section__image"
                        @error="handleProviderImageError(provider.name)" />
                    <span v-if="showProviderFallback(provider)" class="providers-section__fallback"
                        aria-hidden="true">
                        <v-icon icon="mdi-cards-playing-outline" size="24" class="tw-text-white" />
                    </span>
                </div>
                <div v-if="!liveMobile" class="providers-section__name">
                    <span class="providers-section__name-text">{{ provider.name }}</span>
                </div>
            </button>
        </div>
    </section>
</template>

<style scoped>
.providers-section {
    background: #ffffff;
    border: 1px solid #dbe4ff;
    overflow: hidden;
}

.providers-section__header {
    background: var(--theme-primary-gradient,
            linear-gradient(94deg, #b6842d 0%, #ebda8d 50%, #b7862f 100%));
    border-bottom: 1px solid var(--color-nav-border, rgba(255, 255, 255, 0.15));
    padding: 6px 10px;
    margin-bottom: 0;
}

.providers-section__title {
    display: inline-block;
    margin: 0;
    color: #ffffff;
    font-size: 1.125rem;
    text-transform: uppercase;
    font-weight: 800;
    letter-spacing: 0.03em;
    padding: 0;
}

.providers-section__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    background: #ffffff;
    align-items: stretch;
    min-width: 0;
}

.providers-section__card {
    appearance: none;
    border: 1px solid #3f5ea5;
    padding: 0;
    margin: 0;
    cursor: pointer;
    overflow: hidden;
    background: #0b2157;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    text-align: left;
    box-sizing: border-box;
}

.providers-section__media {
    display: grid;
    width: 100%;
    min-width: 0;
    flex: 0 0 auto;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background: #0b2157;
}

.providers-section__image,
.providers-section__fallback {
    grid-area: 1 / 1;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
}

.providers-section__image {
    object-fit: cover;
    object-position: center;
    display: block;
    transition: transform 0.2s ease;
}

.providers-section__fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem;
    background: rgba(0, 0, 0, 0.48);
    color: #fff;
    font-weight: 800;
    font-size: 0.65rem;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.providers-section__name {
    flex-shrink: 0;
    margin: 0 3px 4px;
    padding: 2px 12px;
    border: 0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    transform: skew(338deg);
    background: var(--color-nav-deep, #212e44);
    border-top: 1px solid rgba(255, 255, 255, 0.22);
    box-sizing: border-box;
}

.providers-section__name-text {
    display: block;
    transform: skew(22deg);
    color: #ffffff;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
    font-size: 9px;
    font-weight: 700;
    text-align: center;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.providers-section__card:hover .providers-section__media .providers-section__image {
    transform: scale(1.03);
}

@media (max-width: 767px) {
    .providers-section:not(.providers-section--live-mobile) {
        border: none;
        background: #0c1f52;
    }

    .providers-section:not(.providers-section--live-mobile) .providers-section__header {
        display: flex;
        align-items: center;
        height: 38px;
        min-height: 38px;
        padding: 0 10px;
        background: var(--theme-primary-gradient,
                linear-gradient(90deg, #7a5c1f 0%, #9d7728 22%, #b6842d 45%, #d4b85a 72%, #ebda8d 100%));
        border-bottom: 1px solid rgba(0, 0, 0, 0.2);
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.45),
            inset 0 -1px 0 rgba(0, 0, 0, 0.08);
        clip-path: polygon(0 0, 100% 0, calc(100% - clamp(40px, 15vw, 64px)) 100%, 0 100%);
    }

    .providers-section:not(.providers-section--live-mobile) .providers-section__title {
        font-size: 14px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
    }

    .providers-section:not(.providers-section--live-mobile) .providers-section__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 3px;
        padding: 3px clamp(6px, 2vw, 10px) 4px;
        background: #0c1f52;
    }

    .providers-section:not(.providers-section--live-mobile) .providers-section__card {
        border: 1px solid #2a4a8f;
        background: #0b2157;
        overflow: hidden;
    }

    .providers-section:not(.providers-section--live-mobile) .providers-section__media {
        aspect-ratio: 1 / 1;
        flex: 0 0 auto;
    }

    .providers-section:not(.providers-section--live-mobile) .providers-section__image {
        object-fit: cover;
        object-position: center;
    }

    .providers-section:not(.providers-section--live-mobile) .providers-section__name {
        margin: 0 2px 3px;
        padding: 2px 10px;
        background: linear-gradient(180deg, #f3e2a8 0%, #e4c45a 35%, #c9a032 70%, #9d7728 100%);
        border: 0;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
    }

    .providers-section:not(.providers-section--live-mobile) .providers-section__name-text {
        padding: 4px 0;
        font-size: 7px;
        font-weight: 800;
        letter-spacing: 0.02em;
        color: #1a1a1a;
        text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35);
        white-space: normal;
        line-height: 1.05;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    /* Live page mobile: white grid, rounded image tiles, no text labels (reference) */
    .providers-section--live-mobile {
        margin-top: 0;
        background: #ffffff;
        border: none;
    }

    .providers-section--live-mobile .providers-section__header--casino {
        display: flex;
        align-items: center;
        gap: 8px;
        height: auto;
        min-height: 0;
        padding: 10px clamp(10px, 3.5vw, 16px) 8px;
        background: #ffffff;
        border: none;
        box-shadow: none;
        clip-path: none;
    }

    .providers-section--live-mobile .providers-section__header-icon {
        color: #1ea85d;
        flex-shrink: 0;
    }

    .providers-section--live-mobile .providers-section__title--casino {
        margin: 0;
        color: #1a2332;
        font-size: 15px;
        font-weight: 800;
        letter-spacing: 0;
        text-transform: none;
        text-shadow: none;
    }

    .providers-section--live-mobile .providers-section__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        padding: 0 clamp(10px, 3.5vw, 16px) 10px;
        background: #ffffff;
    }

    .providers-section--live-mobile .providers-section__card {
        border: none;
        border-radius: 10px;
        background: #f0f0f0;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .providers-section--live-mobile .providers-section__media {
        aspect-ratio: 4 / 3;
        width: 100%;
        min-width: 0;
        border-radius: 10px;
        flex: 0 0 auto;
    }

    .providers-section--live-mobile .providers-section__image,
    .providers-section--live-mobile .providers-section__fallback {
        border-radius: inherit;
    }

    .providers-section--live-mobile .providers-section__card:active {
        opacity: 0.92;
    }
}
</style>

<style>
/* Right rail: parent sets 16/9 tiles — keep images filling the grid cell */
.sports-home-right-rail .providers-section__media {
    width: 100%;
    min-height: 0;
}

.sports-home-right-rail .providers-section__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}
</style>
