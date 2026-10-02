<template>
  <template v-if="visible">
    <div class="originals-fab">
      <button
        type="button"
        class="originals-fab__btn"
        title="Enjoy the Original Crash Games"
        :aria-expanded="open"
        aria-label="Enjoy the Original Crash Games"
        @click="open = !open"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12.707 14.293l3 3a1 1 0 0 1 .293 .707v2a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-2a1 1 0 0 1 .293 -.707l3 -3a1 1 0 0 1 1.414 0m-6.707 -6.293a1 1 0 0 1 .707 .293l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1 -.707 .293h-2a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2zm14 0a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-2a1 1 0 0 1 -.707 -.293l-3 -3a1 1 0 0 1 0 -1.414l3 -3a1 1 0 0 1 .707 -.293zm-6 -6a2 2 0 0 1 2 2v2a1 1 0 0 1 -.293 .707l-3 3a1 1 0 0 1 -1.414 0l-3 -3a1 1 0 0 1 -.293 -.707v-2a2 2 0 0 1 2 -2z" />
        </svg>
      </button>
    </div>

    <div v-if="open" class="originals-sheet" role="dialog" aria-label="Originals and crash games">
      <div class="originals-sheet__header">
        <div class="originals-sheet__tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="originals-sheet__tab"
            :class="{ 'originals-sheet__tab--active': tab.id === activeTabId }"
            @click="activeTabId = tab.id"
          >
            <span v-if="tab.emoji" aria-hidden="true">{{ tab.emoji }}</span>
            <svg v-else width="14" height="14" viewBox="0 0 64 64" fill="#49915e" aria-hidden="true">
              <path fill-rule="evenodd" d="M10.2208 25.2081C8.58995 23.849 8.72593 21.3034 10.4923 20.1258L22.5839 12.7529L30.5466 12.458L39.7792 6.91839C46.1332 3.10599 53.757 2.0196 60.923 3.90539C62.9758 10.2502 62.0646 17.1819 58.4418 22.7807L51.1908 33.9869L50.6009 42.2446L42.3433 54.3361C41.4141 55.0795 40.1911 55.3464 39.0367 55.0578L38.8483 55.0107C38.6265 54.9553 38.424 54.8406 38.2623 54.6789L37.9195 54.3361L32.611 45.7836L26.1229 46.6683L21.1093 41.6547L16.6855 36.9361L17.8652 30.153L10.4923 25.4343L10.2208 25.2081ZM52.9603 19.2411C52.9603 23.4759 49.5273 26.9089 45.2925 26.9089C41.0576 26.9089 37.6246 23.4759 37.6246 19.2411C37.6246 15.0062 41.0576 11.5732 45.2925 11.5732C49.5273 11.5732 52.9603 15.0062 52.9603 19.2411ZM17.376 44.2883L2 58.9329L4.01489 61.0484L19.3909 46.4039L17.376 44.2883ZM10.2577 58.9316L21.2972 48.4172L23.3121 50.5327L12.2725 61.0471L10.2577 58.9316ZM13.0396 40.1595L2 50.6739L4.01489 52.7894L15.0545 42.275L13.0396 40.1595Z" />
            </svg>
            {{ tab.label }}
          </button>
          <span class="originals-sheet__underline" :style="{ left: `${activeIndex * 50}%` }" />
        </div>
        <button type="button" class="originals-sheet__close" aria-label="Close" @click="open = false">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#49915e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 9l4 0l0 -4" />
            <path d="M3 3l6 6" />
            <path d="M5 15l4 0l0 4" />
            <path d="M3 21l6 -6" />
            <path d="M19 9l-4 0l0 -4" />
            <path d="M15 9l6 -6" />
            <path d="M19 15l-4 0l0 4" />
            <path d="M15 15l6 6" />
          </svg>
        </button>
      </div>
      <div class="originals-sheet__body">
        <div class="originals-sheet__grid">
          <button
            v-for="game in activeGames"
            :key="game.id"
            type="button"
            class="originals-sheet__tile"
            :title="game.name"
            @click="openGame(game)"
          >
            <img :src="game.image" :alt="game.name" />
          </button>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSelectedGame } from '@/composables/useSelectedGame'
import { openLoginModal } from '@/composables/useLoginModal.js'
import useDevices from '@/composables/useDevices.js'
import { HOME_ORIGINALS_TABS } from '@/data/homeOriginalsGames'
import { loadCasinoSectionItems } from '@/utils/publicInfoCache'
import { pushCasinoSectionNavItem } from '@/utils/casinoSectionNavigation'
import { resolveGameImageTiles } from '@/utils/sectionItems'

const PANEL_TABS = ['originals', 'crash-games']
  .map((id) => HOME_ORIGINALS_TABS.find((tab) => tab.id === id))
  .filter(Boolean)
  .map((tab) => ({
    ...tab,
    label: tab.id === 'originals' ? 'ORIGINALS' : 'CRASH GAMES',
    emoji: tab.id === 'originals' ? '🔥' : '',
  }))

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { isMobile } = useDevices()
const { setSelectedGame } = useSelectedGame()

const open = ref(false)
const activeTabId = ref('originals')
const cmsGamesByTab = ref({})

const visible = computed(() => isMobile.value && route.path === '/sports/live')

const tabs = computed(() =>
  PANEL_TABS.map((tab) => ({
    ...tab,
    games: resolveGameImageTiles(cmsGamesByTab.value[tab.id] || [], tab.games ?? []),
  })),
)

const activeIndex = computed(() => tabs.value.findIndex((tab) => tab.id === activeTabId.value))
const activeGames = computed(() => tabs.value[Math.max(activeIndex.value, 0)]?.games ?? [])

onMounted(async () => {
  const next = {}
  await Promise.all(
    PANEL_TABS.map(async (tab) => {
      if (!tab.sectionCode) return
      try {
        next[tab.id] = await loadCasinoSectionItems(tab.sectionCode)
      } catch (error) {
        console.warn(`Failed to load ${tab.sectionCode}:`, error)
        next[tab.id] = []
      }
    }),
  )
  cmsGamesByTab.value = next
})

const openGame = (game) => {
  if (game.navItem && !game.staticTile) {
    open.value = false
    if (game.navItem.navType === 'game' && !authStore.isUiAuthenticated) {
      openLoginModal({ redirect: `/casino/game/${game.navItem.gameId}` })
      return
    }
    pushCasinoSectionNavItem(router, game.navItem, { setSelectedGame })
    return
  }

  const gameId = game.id
  if (!gameId) return
  open.value = false
  if (!authStore.isUiAuthenticated) {
    openLoginModal({ redirect: `/casino/game/${gameId}` })
    return
  }
  setSelectedGame({
    id: gameId,
    game_id: String(gameId),
    name: game.name || 'Casino game',
  })
  router.push({ name: 'casino-game', params: { gameId: String(gameId) } })
}

watch(
  () => route.path,
  () => {
    open.value = false
  },
)
</script>

<style scoped>
.originals-fab {
  position: fixed;
  right: calc(1.5rem + env(safe-area-inset-right, 0px));
  bottom: calc(55px + env(safe-area-inset-bottom, 0px));
  z-index: 10000;
  width: max-content;
}

.originals-fab__btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 8px;
  border: 0;
  border-radius: 9999px;
  background: #23201f;
  color: #49915e;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  overflow: hidden;
}

.originals-fab__btn svg {
  display: block;
  transition: transform 0.3s;
}

.originals-fab__btn:hover svg {
  transform: scale(1.1) rotate(180deg);
}

.originals-sheet {
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  width: 90%;
  height: 85%;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
  background: #23201f;
  font-family: Lato, "Helvetica Neue", sans-serif;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.originals-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 33px;
  padding: 0 8px;
  border-bottom: 1px solid #e5e7eb;
  background: #23201f;
}

.originals-sheet__tabs {
  position: relative;
  display: flex;
  align-items: center;
  width: 90%;
  height: 100%;
}

.originals-sheet__tab {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1 1 0;
  height: 32px;
  padding: 8px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #ffffff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.05em;
  white-space: nowrap;
  cursor: pointer;
}

.originals-sheet__tab--active {
  color: #49915e;
}

.originals-sheet__underline {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 50%;
  height: 2px;
  border-radius: 2px;
  background: #49915e;
  pointer-events: none;
}

.originals-sheet__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 4px;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  cursor: pointer;
}

.originals-sheet__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 0 12px;
}

.originals-sheet__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  padding: 0 4px;
  box-sizing: border-box;
}

.originals-sheet__tile {
  display: block;
  width: 100%;
  aspect-ratio: 0.85;
  padding: 0;
  border: 0;
  border-radius: 6px;
  overflow: hidden;
  background: transparent;
  cursor: pointer;
}

.originals-sheet__tile img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
