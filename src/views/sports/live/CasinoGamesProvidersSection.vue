<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import casinoSections from '@/constants/casinoSections';
import { loadPublicInfo } from '@/utils/publicInfoCache';
import { findPublicSection, getCurrentSkinSections, getPublicSectionItems } from '@/utils/publicCasinoSections';
import { getImageUrl } from '@/utils/imageUrl';
import mac88Img from '@/assets/providers/home-showcase/mac88.png';
import mac88VirtualImg from '@/assets/providers/home-showcase/mac88-virtual.png';
import evolutionImg from '@/assets/providers/home-showcase/evolution.webp';
import ezugiImg from '@/assets/providers/home-showcase/ezugi.webp';
import turboCasinoImg from '@/assets/providers/home-showcase/turbocasino.png';
import spribeCasinoImg from '@/assets/providers/home-showcase/spribecasino.png';
import redTigerImg from '@/assets/providers/home-showcase/redtiger.webp';
import btGameImg from '@/assets/providers/home-showcase/btgame.webp';
import netentImg from '@/assets/providers/home-showcase/netent.webp';
import nolimitImg from '@/assets/providers/home-showcase/nolimit.webp';
import jiliImg from '@/assets/providers/home-showcase/jili.png';

const router = useRouter();
const failedImages = ref(new Set());
const cmsSectionName = ref('');
const cmsProviderCards = ref([]);

/** Same set/order as zuplay.com `.casino-promo-btn` row. */
const fallbackProviderCards = [
    { name: 'MAC88 LIVE', image: mac88Img },
    { name: 'MAC88 VIRTUALS', image: mac88VirtualImg },
    { name: 'Evolution', image: evolutionImg },
    { name: 'Ezugi', image: ezugiImg },
    { name: 'TURBO GAMES', image: turboCasinoImg },
    { name: 'SPRIBE', image: spribeCasinoImg },
    { name: 'Red Tiger', image: redTigerImg },
    { name: 'BT Gaming', image: btGameImg },
    { name: 'NetEnt', image: netentImg },
    { name: 'Nolimit City', image: nolimitImg },
    { name: 'JILI', image: jiliImg },
];

const sectionTitle = computed(() => (
  cmsProviderCards.value.length > 0 && cmsSectionName.value
    ? cmsSectionName.value.toUpperCase()
    : 'CASINO GAME PROVIDERS'
));

/** CMS providers when the section has at least one image; otherwise static fallback. */
const providerCards = computed(() => (
  cmsProviderCards.value.length > 0 ? cmsProviderCards.value : fallbackProviderCards
));

onMounted(async () => {
  try {
    const info = await loadPublicInfo();
    const section = findPublicSection(getCurrentSkinSections(info), {
      code: casinoSections.SECTION_CODES.ZUPLAY_CASINO_PROVIDERS,
      aliases: ['zuplaycasinoproviders', 'casinoproviders', 'providers', 'provider'],
    });
    if (!section) return;

    const items = getPublicSectionItems(section)
      .filter((item) => item?.imageUrl || item?.imagePath || item?.url_thumb)
      .map((item, index) => ({
        name: item.title || item.providerName || item.name || `Provider ${index + 1}`,
        image: getImageUrl(item.imageUrl || item.imagePath || item.url_thumb || item.thumbnail_url),
        providerName: item.providerName || item.provider || '',
        categoryName: item.categoryName || item.category || '',
      }));

    if (items.length > 0) {
      cmsSectionName.value = section.name || '';
      cmsProviderCards.value = items;
    }
  } catch (error) {
    console.warn('Failed to load zuplay_casino_providers section:', error);
  }
});

function goToCasino(providerName, categoryName = '') {
    router.push({
        name: 'casino-home',
        query: {
            ...(providerName ? { provider: providerName } : {}),
            ...(categoryName ? { gamename: categoryName } : {}),
        },
    });
}

function handleImageError(providerName) {
    failedImages.value = new Set([...failedImages.value, providerName]);
}
</script>

<template>
    <section
        v-if="providerCards.length > 0"
        class="casino-games-providers"
        aria-label="Casino games providers"
    >
        <h2 class="casino-games-providers__title">{{ sectionTitle }}</h2>

        <div class="casino-games-providers__rows">
            <button
                v-for="provider in providerCards"
                :key="provider.name"
                type="button"
                class="casino-games-providers__card"
                :aria-label="provider.name"
                @click="goToCasino(provider.providerName || provider.name, provider.categoryName)"
            >
                <img
                    v-if="!failedImages.has(provider.name)"
                    :src="provider.image"
                    :alt="provider.name"
                    class="casino-games-providers__image"
                    loading="lazy"
                    decoding="async"
                    @error="handleImageError(provider.name)"
                />
                <span v-else class="casino-games-providers__fallback">{{ provider.name }}</span>
            </button>
        </div>
    </section>
</template>

<style scoped>
.casino-games-providers {
    width: 100%;
    margin: 20px 0 20px;
    padding: 0;
    box-sizing: border-box;
    background: transparent;
}

/* Reference: text-[18px] font-bold uppercase text-center text-skin-history-date (#360952) */
.casino-games-providers__title {
    margin: 12px 0 12px;
    color: var(--color-header-bg, #360952);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: normal;
    line-height: 27px;
    text-align: center;
    text-transform: uppercase;
}

/* Reference: flex flex-wrap gap-2 justify-center */
.casino-games-providers__rows {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    justify-items: center;
    gap: 8px;
    width: 100%;
    margin: 12px auto 0;
}

.casino-games-providers__card {
    display: flex;
    flex: 0 0 auto;
    width: auto;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 0;
    overflow: visible;
    background: transparent;
    cursor: pointer;
    line-height: 0;
}

.casino-games-providers__card:active {
    opacity: 0.92;
}

/* Reference: w-[160px] md:w-[180px], rounded-lg */
.casino-games-providers__image {
    display: block;
    width: 160px;
    height: auto;
    object-fit: fill;
    border-radius: 8px;
}

.casino-games-providers__fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 160px;
    min-height: 74px;
    padding: 8px;
    border-radius: 8px;
    background: var(--color-header-bg, #360952);
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
    box-sizing: border-box;
}

@media (min-width: 768px) {
    .casino-games-providers__image,
    .casino-games-providers__fallback {
        width: 180px;
    }
}
</style>
