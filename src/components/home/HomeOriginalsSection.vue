<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSelectedGame } from '@/composables/useSelectedGame';
import { openLoginModal } from '@/composables/useLoginModal.js';
import { HOME_ORIGINALS_TABS } from '@/data/homeOriginalsGames';
import { loadCasinoSectionItems } from '@/utils/publicInfoCache';
import { pushCasinoSectionNavItem } from '@/utils/casinoSectionNavigation';
import { resolveGameImageTiles } from '@/utils/sectionItems';

const router = useRouter();
const authStore = useAuthStore();
const { setSelectedGame } = useSelectedGame();

const activeTabId = ref(HOME_ORIGINALS_TABS[0]?.id ?? 'originals');
const scrollRef = ref(null);
const cmsGamesByTab = ref({});

const activeTab = computed(() =>
  HOME_ORIGINALS_TABS.find((tab) => tab.id === activeTabId.value) ?? HOME_ORIGINALS_TABS[0],
);

const visibleGames = computed(() => {
  const tab = activeTab.value;
  if (!tab) return [];
  const cmsItems = cmsGamesByTab.value[tab.id] || [];
  return resolveGameImageTiles(cmsItems, tab.games ?? []);
});

onMounted(async () => {
  const next = {};
  await Promise.all(
    HOME_ORIGINALS_TABS.map(async (tab) => {
      if (!tab.sectionCode) return;
      try {
        next[tab.id] = await loadCasinoSectionItems(tab.sectionCode);
      } catch (error) {
        console.warn(`Failed to load ${tab.sectionCode}:`, error);
        next[tab.id] = [];
      }
    }),
  );
  cmsGamesByTab.value = next;
});

const openGame = (game) => {
  if (game.navItem && !game.staticTile) {
    if (game.navItem.navType === 'game' && !authStore.isUiAuthenticated) {
      openLoginModal({ redirect: `/casino/game/${game.navItem.gameId}` });
      return;
    }
    pushCasinoSectionNavItem(router, game.navItem, { setSelectedGame });
    return;
  }

  const gameId = game.id;
  if (!gameId) return;
  if (!authStore.isUiAuthenticated) {
    openLoginModal({ redirect: `/casino/game/${gameId}` });
    return;
  }
  setSelectedGame({
    id: gameId,
    game_id: String(gameId),
    name: game.name || 'Casino game',
  });
  router.push({ name: 'casino-game', params: { gameId: String(gameId) } });
};

const scrollBy = (direction) => {
  const container = scrollRef.value;
  if (!container) return;
  const amount = direction === 'forward' ? 320 : -320;
  container.scrollBy({ left: amount, behavior: 'smooth' });
};

const selectTab = (tabId) => {
  activeTabId.value = tabId;
  if (scrollRef.value) {
    scrollRef.value.scrollLeft = 0;
  }
};
</script>

<template>
  <section class="home-originals-section">
    <div class="home-originals-section__card">
      <div class="home-originals-section__header">
        <div class="home-originals-section__tabs scrollbar-hide">
          <button
            v-for="tab in HOME_ORIGINALS_TABS"
            :key="tab.id"
            type="button"
            class="home-originals-section__tab"
            :class="{ 'home-originals-section__tab--active': tab.id === activeTabId }"
            @click="selectTab(tab.id)"
          >
            <span class="home-originals-section__tab-label">{{ tab.label }}</span>
          </button>
        </div>

        <div class="home-originals-section__actions">
          <button type="button" class="home-originals-section__scroll-btn" aria-label="Scroll left" @click="scrollBy('backward')">
            <v-icon icon="mdi-chevron-left" size="20" />
          </button>
          <button type="button" class="home-originals-section__scroll-btn" aria-label="Scroll right" @click="scrollBy('forward')">
            <v-icon icon="mdi-chevron-right" size="20" />
          </button>
        </div>
      </div>

      <div class="home-originals-section__body">
        <div ref="scrollRef" class="home-originals-section__track scrollbar-hide">
          <button
            v-for="game in visibleGames"
            :key="`${activeTabId}-${game.id}`"
            type="button"
            class="home-originals-section__game"
            @click="openGame(game)"
          >
            <img
              :src="game.image"
              :alt="game.name"
              class="home-originals-section__game-img"
              loading="lazy"
              decoding="async"
            />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-originals-section {
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.home-originals-section__card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* border: 1px solid rgba(255, 255, 255, 0.16); */
  border-radius: 10px;
  background: #333333;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.home-originals-section__header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 6px;
  padding: 0 2px 0 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  position: relative;
}

.home-originals-section__tabs {
  display: flex;
  align-items: stretch;
  min-width: 0;
  max-width: calc(100% - 64px);
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.home-originals-section__tabs::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.home-originals-section__tab {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 7px 8px;
  border: 0;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
}

.home-originals-section__tab-label {
  display: inline-block;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  white-space: nowrap;
  text-transform: capitalize;
}

.home-originals-section__tab--active .home-originals-section__tab-label {
  background: linear-gradient(90deg, #49915e 0%, #6ecf8a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 400;
}

/* Thin green underline — full tab width, flush with header border */
.home-originals-section__tab--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  border-radius: 0;
  background: #49915e;
  z-index: 1;
}

.home-originals-section__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding-right: 4px;
  align-self: center;
}

.home-originals-section__scroll-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: #545454;
  color: #8fbc9a;
  line-height: 0;
  cursor: pointer;
}

.home-originals-section__scroll-btn :deep(.v-icon) {
  color: #498b5c;
  opacity: 1;
}

.home-originals-section__scroll-btn:hover {
  background: #454545;
  color: #a8d4b4;
}

.home-originals-section__body {
  padding: 10px 8px 10px;
  box-sizing: border-box;
}

.home-originals-section__track {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.home-originals-section__track::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.home-originals-section__game {
  flex: 0 0 auto;
  width: 118px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

@media (min-width: 640px) {
  .home-originals-section__game {
    width: 128px;
  }
}

@media (min-width: 768px) {
  .home-originals-section__game {
    width: 160px;
  }
}

.home-originals-section__game-img {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  background: #2a2d31;
  transition: transform 0.3s ease;
}

.home-originals-section__game:hover .home-originals-section__game-img {
  transform: scale(1.05);
}
</style>
