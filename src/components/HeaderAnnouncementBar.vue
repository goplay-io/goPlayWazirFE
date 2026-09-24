<template>
  <div class="announcement-bar">
    <div ref="trackRef" class="announcement-bar__marquee">
      <div
        class="announcement-bar__track"
        :style="{ '--announce-speed': `${marqueeSpeedSec}s` }"
      >
        <p
          v-for="(message, index) in announcementItems"
          :key="`announce-a-${index}`"
          class="announcement-bar__item"
        >
          <span>{{ message }}</span>
        </p>
        <p
          v-for="(message, index) in announcementItems"
          :key="`announce-b-${index}`"
          class="announcement-bar__item"
        >
          <span>{{ message }}</span>
        </p>
      </div>
    </div>
    <button
      type="button"
      class="announcement-bar__close"
      :aria-label="t('common.close')"
      @click="emit('dismiss')"
    >
      <v-icon size="12">mdi-close</v-icon>
    </button>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings.js'

const emit = defineEmits(['dismiss'])

const { t } = useI18n()
const settingsStore = useSettingsStore()

const announcementItems = computed(() => {
  const list = settingsStore.announcement
  if (!list?.length) return []
  return list
    .map((item) => String(item ?? '').normalize('NFKC').trim())
    .filter(Boolean)
})

const trackRef = ref(null)
const marqueeSpeedSec = ref(40)

function updateMarqueeSpeed() {
  const track = trackRef.value
  if (!track) return
  const textWidth = track.scrollWidth
  if (textWidth > 0) {
    marqueeSpeedSec.value = Math.max(20, textWidth / 100)
  }
}

watch(announcementItems, async () => {
  await nextTick()
  updateMarqueeSpeed()
}, { immediate: true })

onMounted(async () => {
  await nextTick()
  updateMarqueeSpeed()
  window.addEventListener('resize', updateMarqueeSpeed, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMarqueeSpeed)
})
</script>

<style scoped>
.announcement-bar {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 32px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 2px;
  background: var(--color-login-input-bg, #23201f);
}

.announcement-bar__marquee {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  overflow: clip;
}

.announcement-bar__track {
  display: flex;
  align-items: center;
  gap: 4.8rem;
  width: max-content;
  height: 100%;
  padding-left: 4.8rem;
  animation: announcement-bar-marquee var(--announce-speed, 40s) linear infinite;
}

.announcement-bar__track:hover {
  animation-play-state: paused;
}

.announcement-bar__item {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--color-wazir-green, #49915e);
  white-space: nowrap;
}

.announcement-bar__close {
  position: absolute;
  top: 50%;
  right: 2px;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 9999px;
  background: #000000;
  color: #ffffff;
  cursor: pointer;
  transform: translateY(-50%);
  flex-shrink: 0;
}

.announcement-bar__close :deep(.v-icon) {
  color: #ffffff !important;
}

@keyframes announcement-bar-marquee {
  to {
    transform: translateX(-50%);
  }
}

@media (max-width: 767.98px) {
  .announcement-bar__item {
    font-size: 12px;
  }
}
</style>
