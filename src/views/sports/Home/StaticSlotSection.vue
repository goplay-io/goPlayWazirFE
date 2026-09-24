<script setup>
import { useRouter } from 'vue-router';
import { useSelectedGame } from '@/composables/useSelectedGame';

const router = useRouter();
const { setSelectedGame } = useSelectedGame();

const slotGames = [
    {
        id: 'slot-3-pot-dragons',
        name: '3 Pot Dragons',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID372_en-US_1767692825296.6545.jpg'
    },
    {
        id: 'slot-arena-fighter',
        name: 'Arena Fighter',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID228_en-US_1767693098807.2217.jpg'
    },
    {
        id: 'slot-book-of-gold',
        name: 'Book of Gold',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID087_en-US_1767693612237.8777.jpg'
    },
    {
        id: 'slot-crash-cricket',
        name: 'Crash Cricket',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID469_en-US_1767694487243.5332.jpg'
    },
    {
        id: 'slot-drop-ball',
        name: 'Drop Ball',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID604_en-US_1767696893928.0554.jpg'
    },
    {
        id: 'slot-fortune-gems',
        name: 'Fortune Gems',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID109_en-US_1767697406347.0288.png'
    },
    {
        id: 'slot-gem-party',
        name: 'Gem Party',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID010_en-US_1767698109130.2136.jpg'
    },
    {
        id: 'slot-god-of-martial',
        name: 'God Of Martial',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID004_en-US_1767698239466.2769.jpg'
    },
    {
        id: 'slot-jhandi-munda',
        name: 'Jhandi Munda',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID397_en-US_1767699753226.7424.jpg'
    },
    {
        id: 'slot-jungle-king',
        name: 'Jungle King',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID016_en-US_1767699951547.7632.jpg'
    },
    {
        id: 'slot-money-coming',
        name: 'Money Coming',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID051_en-US_1767701508935.1465.jpg'
    },
    {
        id: 'slot-nightfall-hunting',
        name: 'Nightfall Hunting',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID324_en-US_1767701969425.8708.jpg'
    },
    {
        id: 'slot-party-night',
        name: 'Party Night',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID076_en-US_1767702131959.0105.jpg'
    },
    {
        id: 'slot-pilot-coin',
        name: 'Pilot Coin',
        url_thumb: 'https://cdn.dreamcasino.live/gmz_pilot_coin/thumb.webp'
    },
    {
        id: 'slot-poker-king',
        name: 'Poker King',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID113_en-US_1767703875683.7317.jpg'
    },
    {
        id: 'slot-super-rich',
        name: 'Super Rich',
        url_thumb: 'https://files.mac444cache.com/Document/Game/JL_1125x840_GameID100_en-US_1767762269674.8345.jpg'
    }
];

const handleGameClick = (game) => {
    setSelectedGame(game);
    router.push({ name: 'casino-game', params: { gameId: game.id } });
};

const handleImageError = (event) => {
    event.target.style.display = 'none';
    const placeholder = event.target.nextElementSibling;
    placeholder?.classList.replace('tw-opacity-0', 'tw-opacity-100');
};
</script>

<template>
    <section class="slot-section">
        <header class="slot-section__header">
            <h3 class="slot-section__title">SLOTS</h3>
        </header>

        <div v-if="slotGames.length === 0" class="slot-section__state slot-section__state--empty">
            Slot games are not available right now.
        </div>

        <div v-else class="slot-grid">
            <article
                v-for="game in slotGames"
                :key="game.id"
                class="slot-grid__card"
                @click="handleGameClick(game)"
            >
                <div class="slot-grid__media">
                    <img
                        :src="game.url_thumb"
                        :alt="game.name"
                        loading="lazy"
                        decoding="async"
                        class="slot-grid__img"
                        @error="handleImageError"
                    />
                    <div class="image-placeholder slot-grid__placeholder tw-opacity-0">
                        <v-icon icon="mdi-cards-variant" size="34" class="tw-text-white" />
                    </div>
                </div>
                <div class="slot-grid__name">{{ game.name }}</div>
            </article>
        </div>
    </section>
</template>

<style scoped>
.slot-section {
    border: 1px solid rgba(255, 255, 255, 0.35);
    background: var(--color-nav, #071123);
    overflow: hidden;
}

.slot-section__header {
    background: var(--color-nav, #071123);
    border-bottom: 1px solid var(--color-nav-border, rgba(255, 255, 255, 0.15));
    padding: 6px 10px;
}

.slot-section__title {
    display: inline-block;
    margin: 0;
    color: #ffffff;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    line-height: 1;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
    transform-origin: center;
    animation: header-zoom-stretch 2.2s ease-in-out infinite;
}

.slot-section__state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 120px;
}

.slot-section__state--empty {
    color: var(--color-text, #0f172a);
    font-size: 0.85rem;
    padding: 0.75rem;
}

.slot-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1px;
    background: var(--color-nav, #071123);
}

.slot-grid__card {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid #3f5ea5;
    background: #0b2157;
}

.slot-grid__media {
    position: relative;
    aspect-ratio: 4 / 3;
    background: #0b2157;
}

.slot-grid__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center center;
    display: block;
}

.slot-grid__placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.48);
}

.slot-grid__name {
    font-size: 11px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.1;
    text-align: center;
    padding: 5px 3px;
    min-height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-nav-deep, #212e44);
    border-top: 1px solid rgba(255, 255, 255, 0.22);
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

@media (min-width: 576px) {
    .slot-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (min-width: 768px) {
    .slot-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

@media (min-width: 992px) {
    .slot-grid {
        grid-template-columns: repeat(6, minmax(0, 1fr));
    }
}

@media (min-width: 1400px) {
    .slot-grid {
        grid-template-columns: repeat(7, minmax(0, 1fr));
    }
}

@keyframes header-zoom-stretch {
    0%,
    100% {
        transform: scale(1, 1);
    }
    35% {
        transform: scale(1.12, 0.9);
    }
    65% {
        transform: scale(0.95, 1.08);
    }
}
</style>
