<template>
    <div class="game-view" :class="{ 'game-view--mobile-shell': isMobile }">
      <button
        v-if="isMobile"
        type="button"
        class="game-view__bar"
        :aria-label="t('casino.game.goBack')"
        @click="goBack"
      >
        <img
          src="/zuplay/svg/arrow1.png"
          alt=""
          class="game-view__back-icon"
          width="20"
          height="13"
        />
        <span v-if="gameTitle" class="game-view__title">{{ gameTitle }}</span>
      </button>

      <div class="game-view__stage">
        <!-- Loading State -->
        <div v-if="loading" class="tw-absolute tw-inset-0 tw-bg-theme-background">
          <Loading minHeight="100%" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="tw-flex tw-justify-center tw-items-center tw-absolute tw-inset-0 tw-bg-theme-background">
          <div class="tw-text-center tw-animate-fadeIn">
            <div class="tw-mb-6 tw-relative tw-w-24 tw-h-24 tw-mx-auto">
              <v-icon
                icon="mdi mdi-controller"
                size="80"
                class="tw-text-theme-text-secondary tw-animate-bounce"
              ></v-icon>
            </div>
            <h3 class="tw-text-2xl tw-font-bold tw-text-theme-text tw-mb-3">
              {{ t('casino.game.notAvailable') }}
            </h3>
            <p class="tw-text-theme-text-secondary tw-mb-6 tw-max-w-sm tw-mx-auto">
              {{ t('casino.game.temporarilyUnavailable') }}
            </p>
            <div class="tw-flex tw-gap-3 tw-justify-center">
              <v-btn @click="goBack" color="primary" variant="elevated" class="tw-px-8">
                {{ t('casino.game.goBack') }}
              </v-btn>
            </div>
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
    
    // Handle different possible response structures
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

    // Add game to favorites only after iframe URL loads successfully
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
    error.value = err.response?.data?.message || err.message || 'Failed to load game. Please try again.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadGame();
  
  // Fetch balance immediately (handle errors gracefully)
  fetchWalletBalance().catch((error) => {
    // Silently handle balance fetch errors - don't let them break the game page
    console.warn('Failed to fetch wallet balance on game page:', error);
  });
  
  // Set up interval to fetch balance every 5 seconds
  balanceInterval = setInterval(() => {
    fetchWalletBalance().catch((error) => {
      // Silently handle balance fetch errors in interval
      console.warn('Failed to fetch wallet balance in interval:', error);
      // Stop interval if we get 401/403 (token expired)
      if (error.response && [401, 403].includes(error.response.status)) {
        if (balanceInterval) {
          clearInterval(balanceInterval);
          balanceInterval = null;
        }
      }
    });
  }, 5000);
});

onUnmounted(() => {
  // Clean up interval when component is unmounted
  if (balanceInterval) {
    clearInterval(balanceInterval);
    balanceInterval = null;
  }
});
</script>

<style scoped>
.game-view {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + var(--app-header-bar-height, 56px));
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.game-view--mobile-shell {
  top: 0;
  display: flex;
  flex-direction: column;
}

.game-view__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 34px;
  min-height: 34px;
  flex: 0 0 34px;
  padding: 8px;
  margin: 0;
  border: 0;
  background: var(--color-header-bg, #360952);
  color: #ffffff;
  cursor: pointer;
  box-sizing: border-box;
}

.game-view__back-icon {
  display: block;
  width: 20px;
  height: 13.3281px;
  object-fit: fill;
  transform: rotate(-90deg);
  flex-shrink: 0;
}

.game-view__title {
  font-size: 12px;
  line-height: 18px;
  font-weight: 400;
  color: #ffffff;
}

.game-view__stage {
  position: absolute;
  inset: 0;
}

.game-view--mobile-shell .game-view__stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
}

.game-iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tw-animate-fadeIn {
  animation: fadeIn 0.6s ease-out;
}
</style>
