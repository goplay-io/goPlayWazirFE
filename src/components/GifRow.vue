<template>
  <div v-if="loading" class="tw-flex tw-justify-center tw-py-6">
    <span class="loader"></span>
  </div>
  <div v-else-if="gifs.length">
    <h2 v-if="showHeading" class="tw-mb-3 tw-text-xl tw-font-bold tw-text-theme-text">Trending Games</h2>
    <div class="gif-grid">
      <button
        v-for="item in gifs"
        :key="item.id"
        @click="navigate(item)"
        class="gif-item-wrap gif-button"
      >
        <img
          :src="item.gifUrl"
          :alt="item.targetName"
          @error="onError($event)"
          loading="lazy"
          class="gif-item"
        />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSelectedGame } from '@/composables/useSelectedGame'
import { getTrandings } from '@/api/event/casino'

defineProps({
  showHeading: {
    type: Boolean,
    default: true
  }
})

const router = useRouter()
const { setSelectedGame } = useSelectedGame()
const emit = defineEmits(['content-state'])

const loading = ref(true)
const gifs = ref([])

onMounted(async () => {
  try {
    const res = await getTrandings()
    const data = res?.data?.data ?? res?.data ?? []
    gifs.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Failed to load trending GIFs', e)
    gifs.value = []
  } finally {
    loading.value = false
    emit('content-state', { hasContent: gifs.value.length > 0, count: gifs.value.length })
  }
})

function navigate(item) {
  if (item.targetType === 'game') {
    setSelectedGame({ id: item.targetId, game_id: String(item.targetId), name: item.targetName })
    router.push({ name: 'casino-game', params: { gameId: item.targetId } })
  } else {
    router.push({ name: 'casino-category', params: { category: item.targetName } })
  }
}

function onError(e) {
  e.target.style.display = 'none'
}
</script>

<style scoped>
.gif-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
  overflow: hidden;
  padding: 0;
  box-sizing: border-box;
}

.gif-item-wrap {
  display: block;
}

a.gif-item-wrap {
  text-decoration: none;
  cursor: pointer;
}

.gif-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
}

.gif-item {
  width: 100%;
  height: auto;
  object-fit: fill;
  border-radius: 8px;
  display: block;
}

.loader {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Mobile: single row of four compact thumbnails; section inset 1px vertical, 2px horizontal */
@media (max-width: 767px) {
  .gif-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 2px;
    padding: 1px 2px;
  }

  .gif-item-wrap {
    display: block;
    background: transparent;
    border-radius: 3px;
    overflow: hidden;
    line-height: 0;
  }

  .gif-item {
    width: 100%;
    height: auto;
    border-radius: 3px;
    object-fit: cover;
    display: block;
  }
}
</style>