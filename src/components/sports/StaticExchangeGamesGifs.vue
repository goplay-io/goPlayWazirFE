<template>
  <div v-if="displayItems.length > 0" class="sports-shared-gif-showcase">
    <section class="hot-games-header" aria-label="Hot Games">
      <img :src="hotGamesIcon" alt="" class="hot-games-header__icon" width="20" height="20" />
      <span class="hot-games-header__title">HOT GAMES</span>
    </section>
    <div class="sports-shared-gif-trending">
    <div class="exchangeGames-content" :class="{ 'exchangeGames-content--mobile': isMobile }">
      <button v-for="item in displayItems" :key="item.id" type="button" class="exchangeGames-item position-relative"
        :class="{ ch_div: item.isGif }" :aria-label="`Open ${item.alt}`" @click="navigate(item)">
        <img class="img-fluid" :src="item.src" :alt="item.alt" loading="lazy" decoding="async" />
      </button>
    </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSelectedGame } from '@/composables/useSelectedGame';
import useDevices from '@/composables/useDevices';
import {
  DESKTOP_EXCHANGE_GAMES_COUNT,
  STATIC_EXCHANGE_GAMES_ITEMS,
} from '@/data/staticExchangeGamesGifs.js';
import casinoSections from '@/constants/casinoSections';
import { loadPublicInfo } from '@/utils/publicInfoCache';
import { findPublicSection, getCurrentSkinSections, getPublicSectionItems } from '@/utils/publicCasinoSections';
import { getImageUrl } from '@/utils/imageUrl';
import hotGamesIcon from '@/assets/img/icon/fire.webp';

const router = useRouter();
const { setSelectedGame } = useSelectedGame();
const { isMobile } = useDevices();
const cmsItems = ref([]);

const fallbackItems = computed(() =>
  STATIC_EXCHANGE_GAMES_ITEMS.slice(0, DESKTOP_EXCHANGE_GAMES_COUNT),
);

/** CMS items when the section has at least one image; otherwise static fallback. */
const displayItems = computed(() => (
  cmsItems.value.length > 0 ? cmsItems.value : fallbackItems.value
));

onMounted(async () => {
  try {
    const info = await loadPublicInfo();
    const section = findPublicSection(getCurrentSkinSections(info), {
      code: casinoSections.SECTION_CODES.ZUPLAY_HOT_GAMES,
      aliases: ['zuplayhotgames', 'hotgames', 'hotgame'],
    });
    if (!section) return;

    const items = getPublicSectionItems(section)
      .filter((item) => item?.imageUrl || item?.imagePath || item?.url_thumb)
      .map((item, index) => ({
        id: String(item.id ?? item.gameId ?? `hot-${index}`),
        src: getImageUrl(item.imageUrl || item.imagePath || item.url_thumb || item.thumbnail_url),
        alt: item.title || item.name || item.providerName || 'Casino game',
        gameId: item.gameId || (item.type === 'game' ? item.id : null),
        provider: item.providerName || item.provider || null,
        game: item.categoryName || item.category || null,
        isGif: String(item.imageUrl || item.imagePath || '').toLowerCase().endsWith('.gif'),
      }));

    if (items.length > 0) {
      cmsItems.value = items;
    }
  } catch (error) {
    console.warn('Failed to load zuplay_hot_games section:', error);
  }
});

function navigate(item) {
  // 3) Game detail — /casino/game/{gameId}
  if (item.gameId) {
    setSelectedGame({
      id: item.gameId,
      game_id: String(item.gameId),
      name: item.alt,
    });
    router.push({ name: 'casino-game', params: { gameId: item.gameId } });
    return;
  }

  const query = {};

  // 1) Provider only — /casino?provider={provider}
  if (item.provider) query.provider = item.provider;

  // 2) Provider + game — /casino?provider={provider}&gamename={game}
  if (item.game) query.gamename = item.game;

  router.push({
    name: 'casino-home',
    query,
  });
}
</script>

<style scoped>
.sports-shared-gif-showcase {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-bottom: 4px;
}

.hot-games-header {
  display: flex;
  align-items: center;
  width: 100%;
  height: 37px;
  padding: 0 12px;
  margin-bottom: 0;
  overflow: hidden;
  border-radius: 4px;
  background-color: #360952;
}

.hot-games-header__icon {
  display: block;
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
}

.hot-games-header__title {
  display: inline-flex;
  align-items: center;
  padding: 0 4px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.5px;
  text-transform: uppercase;
}

.sports-shared-gif-trending {
  width: 100%;
  box-sizing: border-box;
}

/* Match reference: #promotionDiv … flex flex-col gap-y-2 + inline-flex gap-1 + md:w-[100px] */
.exchangeGames-content {
  display: inline-flex;
  flex-direction: row;
  align-items: stretch;
  gap: 4px;
  width: 100%;
  min-height: 10vh;
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 4px;
  box-sizing: border-box;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.exchangeGames-content::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.exchangeGames-item {
  flex: 0 0 100px;
  width: 100px;
  min-width: 100px;
  max-width: 100px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  font-family: inherit;
  line-height: 0;
  overflow: hidden;
}

.img-fluid {
  display: block;
  width: 100px;
  height: 88px;
  border-radius: 8px;
  object-fit: cover;
  object-position: center;
}

@media (max-width: 767px) {
  /* Reference: inline-flex gap-1 (4px), img w-1/4 ≈ 99×87px, object-fit fill */
  .exchangeGames-content--mobile {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: stretch;
    gap: 4px;
    min-height: 0;
    padding: 0;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    touch-action: pan-x;
    scrollbar-width: none;
    -ms-overflow-style: none;
    box-sizing: border-box;
  }

  .exchangeGames-content--mobile::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  .exchangeGames-content--mobile .exchangeGames-item {
    position: relative;
    flex: 0 0 25%;
    width: 25%;
    min-width: 25%;
    max-width: none;
    height: 87px;
    border-radius: 8px;
    overflow: hidden;
    display: block;
    line-height: 0;
  }

  .exchangeGames-content--mobile .img-fluid {
    display: block;
    width: 100%;
    height: 87px;
    border-radius: 8px;
    object-fit: fill;
    object-position: center;
  }
}
</style>
