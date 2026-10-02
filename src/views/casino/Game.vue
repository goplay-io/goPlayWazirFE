<template>
  <div class="game-view" :class="{ 'game-view--mobile-shell': isMobile }">
    <div class="game-view__stage">
      <!-- Loading State -->
      <div v-if="loading" class="game-view__state game-view__state--loading">
        <Loading minHeight="100%" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="game-view__state game-view__state--error">
        <div class="game-view__error">
          <v-icon
            icon="mdi mdi-controller"
            size="72"
            class="game-view__error-icon"
          />
          <h3 class="game-view__error-title">
            {{ t('casino.game.notAvailable') }}
          </h3>
          <p class="game-view__error-text">
            {{ t('casino.game.temporarilyUnavailable') }}
          </p>
          <button type="button" class="game-view__error-btn" @click="goBack">
            {{ t('casino.game.goBack') }}
          </button>
        </div>
      </div>

      <!-- Game Iframe -->
      <iframe
        v-else-if="gameUrl"
        :src="gameUrl"
        class="game-iframe"
        frameborder="0"
        allowfullscreen
        allow="payment; autoplay; encrypted-media; fullscreen"
      ></iframe>
    </div>

    <button
      type="button"
      class="game-view__bar"
      :class="{ 'game-view__bar--desktop': !isMobile }"
      :aria-label="t('casino.game.goBack')"
      @click="goBack"
    >
      <svg
        class="game-view__back-icon"
        viewBox="0 0 24 24"
        width="30"
        height="30"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
          fill="currentColor"
        />
      </svg>
      <span v-if="gameTitle" class="game-view__title">{{ gameTitle }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import useDevices from '@/composables/useDevices';
import { getCasinoGame } from '../../api/event/casino';
import { useWallet } from '../../composables/useWallet';
import { useFavoriteGames } from '../../composables/useFavoriteGames';
import { useSelectedGame } from '../../composables/useSelectedGame';
import { useSnackbar } from '../../composables/useSnackbar/useSnackbar';
import { useAuthStore } from '../../stores/auth';
import { enrichGameForFavorite } from '@/utils/casinoGameLookup';
import Loading from '@/components/Loading.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isMobile } = useDevices();
const { showError } = useSnackbar();
const { fetchWalletBalance } = useWallet();
const { addFavoriteGame } = useFavoriteGames();
const { getSelectedGame, clearSelectedGame } = useSelectedGame();

const loading = ref(true);
const error = ref(null);
const gameUrl = ref(null);
const gameTitle = ref('');
let balanceInterval = null;

const upgradeRequiredPattern = /upgrade required|full account|please upgrade/i;

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.replace('/casino');
};

const isDemoUpgradeRestriction = (err) => {
  const status = err?.response?.status;
  const message = String(err?.response?.data?.message || err?.message || '');
  const errorName = String(err?.response?.data?.error || '');

  return (
    authStore.isDemoUser &&
    (status === 426 ||
      upgradeRequiredPattern.test(message) ||
      upgradeRequiredPattern.test(errorName))
  );
};

const loadGame = async () => {
  const gameId = route.params.gameId;

  if (!gameId) {
    error.value = t('casino.game.idRequired');
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await getCasinoGame(gameId);

    if (response.url) {
      gameUrl.value = response.url;
    } else if (response.data && response.data.url) {
      gameUrl.value = response.data.url;
    } else if (response.iframeUrl) {
      gameUrl.value = response.iframeUrl;
    } else if (response.data && response.data.iframeUrl) {
      gameUrl.value = response.data.iframeUrl;
    } else {
      throw new Error(t('casino.game.invalidResponse'));
    }

    const game = getSelectedGame();
    if (game?.name) {
      gameTitle.value = game.name;
    }
    if (game) {
      const enriched = await enrichGameForFavorite(game, gameId);
      addFavoriteGame(enriched);
      clearSelectedGame();
    }
  } catch (err) {
    console.error('Error loading game:', err);
    if (isDemoUpgradeRestriction(err)) {
      const apiMessage =
        err?.response?.data?.message ||
        'This feature requires a full account. Please upgrade to access this route.';

      showError(apiMessage, { timeout: 3500 });

      if (window.history.length > 1) {
        router.back();
      } else {
        router.replace('/sports');
      }
      return;
    }
    error.value =
      err.response?.data?.message ||
      err.message ||
      'Failed to load game. Please try again.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadGame();

  fetchWalletBalance().catch((err) => {
    console.warn('Failed to fetch wallet balance on game page:', err);
  });

  balanceInterval = setInterval(() => {
    fetchWalletBalance().catch((err) => {
      console.warn('Failed to fetch wallet balance in interval:', err);
      if (err.response && [401, 403].includes(err.response.status)) {
        if (balanceInterval) {
          clearInterval(balanceInterval);
          balanceInterval = null;
        }
      }
    });
  }, 5000);
});

onUnmounted(() => {
  if (balanceInterval) {
    clearInterval(balanceInterval);
    balanceInterval = null;
  }
});
</script>

<style scoped>
.game-view {
  --game-shell-bg: #000000;
  --game-bar-bg: #23201f;
  --game-accent: var(--color-wazir-green, #49915e);

  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + var(--app-header-bar-height, 56px));
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  display: flex;
  flex-direction: column;
  background: var(--game-shell-bg);
  color: #ffffff;
}

.game-view--mobile-shell {
  top: 0;
}

.game-view__stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  background: var(--game-shell-bg);
}

.game-view__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 40px;
  min-height: 40px;
  flex: 0 0 40px;
  padding: 8px 12px;
  margin: 0;
  border: 0;
  border-top: 1px solid rgba(84, 84, 84, 0.55);
  background: var(--game-bar-bg);
  color: var(--game-accent);
  cursor: pointer;
  box-sizing: border-box;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  min-height: calc(40px + env(safe-area-inset-bottom, 0px));
  flex-basis: calc(40px + env(safe-area-inset-bottom, 0px));
}

.game-view__bar--desktop {
  height: 36px;
  min-height: 36px;
  flex-basis: 36px;
  padding-bottom: 8px;
}

.game-view__back-icon {
  display: block;
  flex-shrink: 0;
  color: var(--game-accent);
}

.game-view__title {
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-view__state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--game-shell-bg);
}

.game-view__state--loading :deep(.loading-spinner) {
  border-color: rgba(255, 255, 255, 0.18);
  border-top-color: var(--game-accent);
}

.game-view__error {
  text-align: center;
  padding: 24px 16px;
  max-width: 360px;
}

.game-view__error-icon {
  color: rgba(255, 255, 255, 0.45) !important;
  margin-bottom: 16px;
}

.game-view__error-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  color: #ffffff;
}

.game-view__error-text {
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.65);
}

.game-view__error-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  padding: 10px 24px;
  border: 0;
  border-radius: 4px;
  background: var(--game-accent);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
}

.game-view__error-btn:hover {
  filter: brightness(1.08);
}

.game-iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: #000000;
}
</style>
