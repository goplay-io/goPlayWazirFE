<template>
  <template v-if="visible">
    <button
      v-if="!open"
      type="button"
      class="floating-mini-games"
      :style="fabShellStyle"
      :aria-label="t('components.miniGames.open')"
      @click="open = true"
    >
      <img
        :src="MINI_GAMES_LOBBY_ICON"
        :alt="t('components.miniGames.shortLabel')"
        class="floating-mini-games__art"
        :width="MINI_GAMES_FAB_SIZE_PX"
        :height="MINI_GAMES_FAB_SIZE_PX"
        loading="lazy"
        decoding="async"
      />
    </button>

    <MiniGamesLobby v-model="open" />
  </template>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import useDevices from '@/composables/useDevices.js'
import MiniGamesLobby from '@/components/MiniGamesLobby.vue'
import { MINI_GAMES_LOBBY_ICON, MINI_GAMES_FAB_SIZE_PX } from '@/constants/miniGamesStatic'

const fabShellStyle = {
  '--mg-fab-size': `${MINI_GAMES_FAB_SIZE_PX}px`,
}

const { t } = useI18n()
const route = useRoute()
const { isMobile } = useDevices()
const open = ref(false)

const HIDDEN_ROUTES = [
  /^\/login/,
  /^\/signup/,
  /^\/forgot-password/,
  /^\/sports\/bet\//,
  /^\/racing\/bet\//,
  /^\/casino\/game\//,
]

const visible = computed(
  () => isMobile.value && !HIDDEN_ROUTES.some((pattern) => pattern.test(route.path)),
)

watch(
  () => route.path,
  () => {
    open.value = false
  },
)
</script>

<style scoped>
.floating-mini-games {
  position: fixed;
  top: calc(100dvh - 80px);
  left: 0;
  bottom: auto;
  z-index: 49;
  width: var(--mg-fab-size, var(--mini-games-fab-size, 70px));
  height: var(--mg-fab-size, var(--mini-games-fab-size, 70px));
  border: 0;
  padding: 0;
  margin: 0;
  background: transparent;
  cursor: pointer;
  touch-action: manipulation;
  filter: drop-shadow(0 4px 10px rgba(29, 78, 216, 0.28));
}

.floating-mini-games__art {
  display: block;
  width: var(--mg-fab-size, var(--mini-games-fab-size, 70px));
  height: var(--mg-fab-size, var(--mini-games-fab-size, 70px));
  object-fit: contain;
  pointer-events: none;
}

.floating-mini-games:active {
  transform: scale(0.96);
}

@media (min-width: 768px) {
  .floating-mini-games {
    display: none;
  }
}
</style>
