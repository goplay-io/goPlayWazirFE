<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { HOME_ORIGINALS_TABS } from '@/data/homeOriginalsGames';

const router = useRouter();
const activeTabId = ref(HOME_ORIGINALS_TABS[0]?.id ?? 'originals');
const scrollRef = ref(null);

const activeTab = computed(() =>
  HOME_ORIGINALS_TABS.find((tab) => tab.id === activeTabId.value) ?? HOME_ORIGINALS_TABS[0],
);

const visibleGames = computed(() => activeTab.value?.games ?? []);

const scrollBy = (direction) => {
  const container = scrollRef.value;
  if (!container) return;
  const amount = direction === 'forward' ? 320 : -320;
  container.scrollBy({ left: amount, behavior: 'smooth' });
};

const onSeeAll = () => {
  router.push({
    name: 'casino-home',
    query: activeTab.value?.seeAllQuery ?? {},
  });
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
          <button type="button" class="home-originals-section__see-all" @click="onSeeAll">
            See All
          </button>
          <button type="button" class="home-originals-section__scroll-btn" aria-label="Scroll left" @click="scrollBy('backward')">
            ‹
          </button>
          <button type="button" class="home-originals-section__scroll-btn" aria-label="Scroll right" @click="scrollBy('forward')">
            ›
          </button>
        </div>
      </div>

      <div class="home-originals-section__body">
        <div ref="scrollRef" class="home-originals-section__track scrollbar-hide">
          <div
            v-for="game in visibleGames"
            :key="`${activeTabId}-${game.id}`"
            class="home-originals-section__game"
          >
            <img
              :src="game.image"
              :alt="game.name"
              class="home-originals-section__game-img"
              loading="lazy"
              decoding="async"
            />
          </div>
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
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: #333333;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.home-originals-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px 0 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.home-originals-section__tabs {
  display: flex;
  align-items: center;
  min-width: 0;
  max-width: calc(100% - 112px);
  overflow-x: auto;
  scroll-behavior: smooth;
}

.home-originals-section__tab {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: 6px 6px 0 0;
  background: transparent;
  cursor: pointer;
}

.home-originals-section__tab-label {
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
  font-weight: 600;
}

.home-originals-section__tab--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: #49915e;
}

.home-originals-section__actions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding-right: 4px;
}

.home-originals-section__see-all {
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: #49915e;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.home-originals-section__scroll-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 4px;
  background: rgba(73, 145, 94, 0.18);
  color: #49915e;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.home-originals-section__body {
  padding: 10px 12px;
}

.home-originals-section__track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 4px;
}

.home-originals-section__game {
  flex: 0 0 auto;
  width: 118px;
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
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  background: #2a2d31;
  transition: transform 0.3s ease;
}

.home-originals-section__game:hover .home-originals-section__game-img {
  transform: scale(1.05);
}
</style>
