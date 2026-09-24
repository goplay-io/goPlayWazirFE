<template>
  <div class="row mx-0 mt-3 mainslider_imgs">
    <div class="mainslider_imgs__grid">
      <button
        v-for="item in STATIC_MAIN_SLIDER_IMAGES"
        :key="item.id"
        type="button"
        class="mainslider_imgs__item"
        :aria-label="`Open ${item.name}`"
        @click="navigate(item)"
      >
        <img
          :src="item.image"
          :alt="item.name"
          loading="lazy"
          decoding="async"
          class="mainslider_imgs__img"
        />
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useSelectedGame } from '@/composables/useSelectedGame';
import { STATIC_MAIN_SLIDER_IMAGES } from '@/data/staticMainSliderImages.js';

const router = useRouter();
const { setSelectedGame } = useSelectedGame();

function navigate(item) {
  if (item.targetType === 'game') {
    setSelectedGame({
      id: item.targetId,
      game_id: String(item.targetId),
      name: item.name,
    });
    router.push({ name: 'casino-game', params: { gameId: item.targetId } });
    return;
  }

  router.push({ name: 'casino-category', params: { category: item.name } });
}
</script>

<style scoped>
.mainslider_imgs {
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  margin-top: 0.75rem;
  padding-top: 6px;
  padding-right: 10px;
  box-sizing: border-box;
}

.mainslider_imgs__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  overflow: hidden;
  padding: 0;
  box-sizing: border-box;
}

.mainslider_imgs__item {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  font-family: inherit;
}

.mainslider_imgs__img {
  width: 100%;
  height: auto;
  object-fit: fill;
  border-radius: 6px;
  display: block;
}

@media (max-width: 1400px) {
  .mainslider_imgs__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .mainslider_imgs {
    margin-top: 0;
    padding: 1px 2px;
  }

  .mainslider_imgs__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 2px;
  }

  .mainslider_imgs__item {
    border-radius: 3px;
    overflow: hidden;
    line-height: 0;
  }

  .mainslider_imgs__img {
    border-radius: 3px;
    object-fit: cover;
  }
}
</style>
