<template>
  <Transition name="mini-games-lobby">
    <div
      v-if="modelValue"
      class="mini-games-lobby"
      :class="{ 'mini-games-lobby--playing': activeGame }"
      role="region"
      :aria-label="t('components.miniGames.title')"
    >
      <div class="mini-games-lobby__header">
        <div class="mini-games-lobby__topbar">
          <div class="mini-games-lobby__topbar-start">
            <button
              v-if="activeGame"
              type="button"
              class="mini-games-lobby__home"
              :aria-label="t('components.miniGames.backToLobby')"
              @click="backToLobby"
            >
              <v-icon size="20" color="#f0b400">mdi-home</v-icon>
            </button>
            <div v-else class="mini-games-lobby__lobby-pill">
              <span class="mini-games-lobby__lobby-text">{{ t('components.miniGames.lobby') }}</span>
              <span class="mini-games-lobby__lobby-count">{{ games.length }}</span>
            </div>
          </div>

          <p v-if="activeGame" class="mini-games-lobby__title">
            {{ t('components.miniGames.miniTitle', { name: activeGame.gameName }) }}
          </p>

          <button
            type="button"
            class="mini-games-lobby__collapse"
            :aria-label="t('components.miniGames.collapse')"
            @click="close"
          >
            <v-icon size="20" color="#ffffff">mdi-chevron-down</v-icon>
          </button>
        </div>
      </div>

      <div class="mini-games-lobby__body">
        <div v-if="activeGame" class="mini-games-lobby__player">
          <div v-if="loading" class="mini-games-lobby__player-state">
            <Loading min-height="100%" />
          </div>
          <div v-else-if="error" class="mini-games-lobby__player-state mini-games-lobby__player-state--error">
            <p>{{ error }}</p>
            <button type="button" class="mini-games-lobby__retry" @click="reloadActiveGame">
              {{ t('components.miniGames.retry') }}
            </button>
          </div>
          <iframe
            v-else-if="gameUrl"
            :key="activeGame.gameId"
            :src="gameUrl"
            class="mini-games-lobby__iframe"
            frameborder="0"
            allowfullscreen
            allow="payment; autoplay; encrypted-media; fullscreen"
            :title="activeGame.gameName"
          />
        </div>

        <div v-else class="mini-games-lobby__track">
          <button
            v-for="game in games"
            :key="game.gameId"
            type="button"
            class="mini-games-lobby__card"
            @click="openGame(game)"
          >
            <div class="mini-games-lobby__card-media">
              <img
                :src="game.thumbnail"
                :alt="game.gameName"
                loading="lazy"
                decoding="async"
                class="mini-games-lobby__card-img"
                @error="handleImageError"
              />
              <span v-if="game.playerCount" class="mini-games-lobby__card-badge">
                <v-icon size="11" class="mini-games-lobby__card-badge-icon">mdi-account</v-icon>
                {{ game.playerCount }}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useWallet } from '@/composables/useWallet'
import { useCasinoGameLaunch } from '@/composables/useCasinoGameLaunch'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import { STATIC_MINI_GAMES } from '@/constants/miniGamesStatic'
import Loading from '@/components/Loading.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const authStore = useAuthStore()
const { showError } = useSnackbar()
const { fetchWalletBalance } = useWallet()
const { loading, error, gameUrl, lastError, launchGame, resetGame } = useCasinoGameLaunch()

const games = STATIC_MINI_GAMES
const activeGame = ref(null)
let balanceInterval = null

const upgradeRequiredPattern = /upgrade required|full account|please upgrade/i

function isDemoUpgradeRestriction(err) {
  const status = err?.response?.status
  const message = String(err?.response?.data?.message || err?.message || '')
  const errorName = String(err?.response?.data?.error || '')

  return (
    authStore.isDemoUser
    && (status === 426
      || upgradeRequiredPattern.test(message)
      || upgradeRequiredPattern.test(errorName))
  )
}

function stopBalancePolling() {
  if (balanceInterval) {
    clearInterval(balanceInterval)
    balanceInterval = null
  }
}

function startBalancePolling() {
  if (authStore.isDemoUser) return

  stopBalancePolling()
  fetchWalletBalance().catch(() => {})

  balanceInterval = setInterval(() => {
    fetchWalletBalance().catch((err) => {
      if (err?.response && [401, 403].includes(err.response.status)) {
        stopBalancePolling()
      }
    })
  }, 5000)
}

async function openGame(game) {
  if (!game?.gameId) return

  activeGame.value = game
  const ok = await launchGame(game.gameId)

  if (!ok) {
    if (isDemoUpgradeRestriction(lastError.value)) {
      showError(error.value || t('components.miniGames.loadError'), { timeout: 3500 })
      backToLobby()
    }
    return
  }

  startBalancePolling()
}

function reloadActiveGame() {
  if (activeGame.value?.gameId) openGame(activeGame.value)
}

function backToLobby() {
  stopBalancePolling()
  resetGame()
  activeGame.value = null
}

function close() {
  backToLobby()
  emit('update:modelValue', false)
}

function handleImageError(event) {
  event.target.style.display = 'none'
}

watch(() => props.modelValue, (open) => {
  if (!open) backToLobby()
})

onUnmounted(() => {
  stopBalancePolling()
})
</script>

<style scoped>
.mini-games-lobby {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 920;
  display: flex;
  flex-direction: column;
  background: #000000;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  box-shadow: 0 -4px 18px rgba(0, 0, 0, 0.42);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-sizing: border-box;
  --mg-header-pt: 10px;
  --mg-header-px: 10px;
  --mg-body-pt: 10px;
  --mg-body-px: 10px;
  --mg-body-pb: 20px;
}

.mini-games-lobby:not(.mini-games-lobby--playing) {
  height: auto;
}

.mini-games-lobby--playing {
  height: min(46vh, 520px);
  max-height: calc(100dvh - var(--app-header-height, 60px) - 72px);
}

.mini-games-lobby__header {
  flex-shrink: 0;
  padding: var(--mg-header-pt) var(--mg-header-px) 0;
  box-sizing: border-box;
}

.mini-games-lobby__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: var(--mg-body-pt) var(--mg-body-px) var(--mg-body-pb);
  box-sizing: border-box;
}

.mini-games-lobby--playing .mini-games-lobby__body {
  --mg-body-pt: 8px;
  --mg-body-px: 4px;
  --mg-body-pb: 4px;
}

.mini-games-lobby__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
  flex-shrink: 0;
}

.mini-games-lobby__topbar-start {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.mini-games-lobby__lobby-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 28px;
  padding: 0 3px 0 11px;
  border: 1px solid #d4a017;
  border-radius: 8px;
  background: #1a1f35;
  box-sizing: border-box;
}

.mini-games-lobby__lobby-text {
  display: inline-flex;
  align-items: center;
  font-family: 'Roboto Condensed', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  color: #ffffff;
  line-height: 1;
  white-space: nowrap;
}

.mini-games-lobby__lobby-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 1px 14px;
  border-radius: 3px;
  background: #ffb400;
  color: #000000;
  font-family: 'Roboto Condensed', sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  margin-right:8px;
}

.mini-games-lobby__home {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.mini-games-lobby__title {
  flex: 1;
  min-width: 0;
  margin: 0;
  text-align: center;
  font-family: 'Roboto Condensed', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 0 10px rgba(212, 160, 23, 0.35);
}

.mini-games-lobby__collapse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  padding: 0;
  margin: 0;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.mini-games-lobby__player {
  flex: 1;
  min-height: 0;
  background: #000000;
  border-radius: 8px;
  overflow: hidden;
}

.mini-games-lobby__player-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  padding: 16px;
  color: #ffffff;
  text-align: center;
}

.mini-games-lobby__player-state--error p {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.mini-games-lobby__retry {
  border: 0;
  border-radius: 9999px;
  padding: 8px 16px;
  background: #f5d000;
  color: #111111;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.mini-games-lobby__iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #000000;
}

.mini-games-lobby__track {
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
  box-sizing: border-box;
}

.mini-games-lobby__track::-webkit-scrollbar {
  display: none;
}

.mini-games-lobby__card {
  flex: 0 0 auto;
  width: 120px;
  border: 0;
  padding: 0;
  margin: 0;
  background: transparent;
  cursor: pointer;
  scroll-snap-align: start;
}

.mini-games-lobby__card-media {
  position: relative;
  width: 120px;
  height: 160px;
  border-radius: 10px;
  overflow: hidden;
  background: #1a1a1a;
  border: 1px solid rgba(120, 108, 255, 0.55);
  box-shadow: 0 0 10px rgba(88, 74, 255, 0.22);
}

.mini-games-lobby__card-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.mini-games-lobby__card-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-width: 34px;
  padding: 2px 6px 2px 4px;
  border-radius: 4px;
  background: #f4c430;
  color: #000000;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.2;
}

.mini-games-lobby__card-badge-icon {
  color: #000000 !important;
}

.mini-games-lobby-enter-active,
.mini-games-lobby-leave-active {
  transition: transform 0.28s ease, opacity 0.2s ease;
}

.mini-games-lobby-enter-from,
.mini-games-lobby-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
