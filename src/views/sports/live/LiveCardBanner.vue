<script setup>
import LiveShowcaseHeading from '@/views/sports/live/LiveShowcaseHeading.vue';
import LiveImageCarousel from '@/views/sports/live/LiveImageCarousel.vue';
import {
    LIVE_CARDS_SLIDES,
    LIVE_CASINO_SLIDES,
    LIVE_CARDS_VIEW_MORE_PATH,
    LIVE_CASINO_VIEW_MORE_PATH,
} from '@/data/livePageShowcase.js';
</script>

<template>
    <div class="live-card-banner">
        <section class="live-card-banner__section" aria-label="Live Cards">
            <LiveShowcaseHeading title="Live Cards" class="live-card-banner__heading" />

            <LiveImageCarousel
                :slides="LIVE_CARDS_SLIDES"
                variant="cards"
                class="live-card-banner__carousel live-card-banner__carousel--cards"
            />

            <div class="live-card-banner__see-more">
                <RouterLink :to="LIVE_CARDS_VIEW_MORE_PATH" class="live-card-banner__link">
                    VIEW MORE
                    <span class="live-card-banner__link-arrow" aria-hidden="true">
                        <v-icon icon="mdi-arrow-right" size="10" />
                    </span>
                </RouterLink>
            </div>
        </section>

        <section class="live-card-banner__section" aria-label="Live Casino">
            <LiveShowcaseHeading title="Live Casino" class="live-card-banner__heading" />

            <LiveImageCarousel
                :slides="LIVE_CASINO_SLIDES"
                variant="casino"
                class="live-card-banner__carousel live-card-banner__carousel--casino"
            />

            <div class="live-card-banner__see-more">
                <RouterLink :to="LIVE_CASINO_VIEW_MORE_PATH" class="live-card-banner__link">
                    VIEW MORE
                    <span class="live-card-banner__link-arrow" aria-hidden="true">
                        <v-icon icon="mdi-arrow-right" size="10" />
                    </span>
                </RouterLink>
            </div>
        </section>
    </div>
</template>

<style scoped>
.live-card-banner {
    width: 100%;
    margin-top: 8px;
    background: transparent;
}

.live-card-banner__section {
    width: 100%;
}

.live-card-banner__section + .live-card-banner__section {
    margin-top: 8px;
}

.live-card-banner__carousel {
    margin-top: 2px;
    margin-bottom: 2px;
}

.live-card-banner__see-more {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    min-height: 24px;
    padding: 2px 8px 6px;
    background-size: 32px 28px;
    background-repeat: repeat;
}

.live-card-banner__link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--color-header-bg, #360952);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-decoration: none;
    text-transform: uppercase;
}

.live-card-banner__link:hover {
    opacity: 0.85;
}

.live-card-banner__link-arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border: 1.5px solid currentColor;
    border-radius: 2px;
    color: inherit;
    flex-shrink: 0;
}

@media (min-width: 769px) {
    .live-card-banner {
        margin-top: 10px;
    }

    .live-card-banner__see-more {
        padding: 2px 0 8px;
    }
}
</style>
