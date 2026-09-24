<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { HOME_REFERENCE_PROVIDERS } from '@/data/homeReferenceProviders.js';

const router = useRouter();
const { t } = useI18n();
const scrollRef = ref(null);

const providers = computed(() => HOME_REFERENCE_PROVIDERS);
const midpoint = computed(() => Math.ceil(providers.value.length / 2));
const firstRow = computed(() => providers.value.slice(0, midpoint.value));
const secondRow = computed(() => providers.value.slice(midpoint.value));

const scrollBy = (direction) => {
  const container = scrollRef.value;
  if (!container) return;
  const amount = direction === 'forward' ? 320 : -320;
  container.scrollBy({ left: amount, behavior: 'smooth' });
};

const onSeeAll = () => {
  router.push({ name: 'casino-home' });
};

const openProvider = (provider) => {
  router.push({
    name: 'casino-home',
    query: {
      provider: provider.subProviderName,
      category: 'ALL',
    },
  });
};
</script>

<template>
  <section class="home-game-providers">
    <div class="home-game-providers__card">
      <div class="home-game-providers__header">
        <button type="button" class="home-game-providers__title-btn" @click="onSeeAll">
          <span class="home-game-providers__title">{{ t('components.homeGameProviders.title') }}</span>
        </button>
        <div class="home-game-providers__actions">
          <button type="button" class="home-game-providers__see-all" @click="onSeeAll">
            {{ t('components.homeGameProviders.seeAll') }}
          </button>
          <button type="button" class="home-game-providers__scroll-btn" aria-label="Scroll left" @click="scrollBy('backward')">
            ‹
          </button>
          <button type="button" class="home-game-providers__scroll-btn" aria-label="Scroll right" @click="scrollBy('forward')">
            ›
          </button>
        </div>
      </div>

      <div class="home-game-providers__body">
        <div ref="scrollRef" class="home-game-providers__track scrollbar-hide">
          <div class="home-game-providers__rows">
            <div class="home-game-providers__row">
              <button
                v-for="provider in firstRow"
                :key="provider.gameId"
                type="button"
                class="home-game-providers__item"
                @click="openProvider(provider)"
              >
                <img :src="provider.image" :alt="provider.name" loading="lazy" decoding="async" />
              </button>
            </div>
            <div class="home-game-providers__row">
              <button
                v-for="provider in secondRow"
                :key="provider.gameId"
                type="button"
                class="home-game-providers__item"
                @click="openProvider(provider)"
              >
                <img :src="provider.image" :alt="provider.name" loading="lazy" decoding="async" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-game-providers {
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

@media (max-width: 767.98px) {
  /* Reference ProvidersSection.tsx: px-[6px] within AppLayout px-1 */
  .home-game-providers {
    padding: 0 6px;
  }
}

.home-game-providers__card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: #333333;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.home-game-providers__header,
.home-games-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.home-game-providers__title-btn {
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.home-game-providers__title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  text-transform: capitalize;
}

.home-game-providers__actions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.home-game-providers__see-all {
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: #49915e;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.home-game-providers__scroll-btn {
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

.home-game-providers__body {
  padding: 10px;
}

.home-game-providers__track {
  overflow-x: auto;
  scroll-behavior: smooth;
}

.home-game-providers__rows {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  min-width: min-content;
}

.home-game-providers__row {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Reference: bg-bg_color_casinoProvider, min-w 124px / 150px, logo object-contain 80% */
.home-game-providers__item {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 124px;
  width: 124px;
  height: 80px;
  padding: 8px;
  border: 0;
  border-radius: 6px;
  background: #2a2d31;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  line-height: 0;
  box-sizing: border-box;
}

.home-game-providers__item img {
  display: block;
  width: 80%;
  max-height: 80%;
  object-fit: contain;
}

@media (min-width: 768px) {
  .home-game-providers__item {
    min-width: 150px;
    width: 150px;
    height: 88px;
  }
}
</style>
