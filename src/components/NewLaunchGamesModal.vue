<template>
  <div 
    v-if="modelValue"
    class="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-p-4 tw-bg-black/35 tw-z-[1002]" 
    @click.self="close"
  >
    <div class="tw-w-full tw-max-w-[900px] tw-max-h-[85vh] tw-rounded-2xl tw-p-[1.5px] bg-gradient-primary tw-shadow-[0_10px_30px_rgba(20,129,84,0.08),0_2px_8px_rgba(0,0,0,0.12)]">
      <div class="tw-rounded-[13px] tw-bg-theme-surface-alt tw-overflow-hidden tw-flex tw-flex-col tw-max-h-[85vh]">
        <!-- Header -->
        <div class="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-p-[18px] tw-border-b tw-border-theme-border">
          <div class="tw-flex tw-items-center tw-gap-2.5">
            <v-icon size="24" class="tw-text-secondary">mdi-new-box</v-icon>
            <div class="tw-text-lg tw-font-bold tw-text-theme-text">{{ t('components.newLaunchGames.title') }}</div>
            <v-chip v-if="newLaunchGames.length > 0" size="small" color="secondary" variant="tonal">
              {{ newLaunchGames.length }}
            </v-chip>
          </div>

          <button 
            class="tw-bg-transparent tw-border-0 tw-text-theme-text-secondary tw-cursor-pointer tw-text-xl tw-px-2 tw-py-1 tw-leading-none hover:tw-text-theme-text tw-transition-colors" 
            @click="close"
          >
            ✕
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="tw-flex tw-justify-center tw-items-center tw-py-12">
          <div class="tw-text-center">
            <span class="loader"></span>
            <p class="tw-text-theme-text-secondary tw-mt-3">{{ t('components.newLaunchGames.loading') }}</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="tw-text-center tw-py-12 tw-px-6">
          <v-icon icon="mdi-alert-circle" size="64" class="tw-text-red-500 tw-mb-3"></v-icon>
          <p class="tw-text-theme-text-secondary tw-text-lg">{{ error }}</p>
        </div>

        <!-- No Games -->
        <div v-else-if="newLaunchGames.length === 0" class="tw-text-center tw-py-12 tw-px-6">
          <v-icon icon="mdi-package-variant" size="64" class="tw-text-theme-text-muted tw-mb-3"></v-icon>
          <p class="tw-text-theme-text-secondary tw-text-lg">{{ t('components.newLaunchGames.noGames') }}</p>
          <p class="tw-text-theme-text-muted tw-text-sm tw-mt-2">{{ t('components.newLaunchGames.checkBackSoon') }}</p>
        </div>

        <!-- Games Grid -->
        <div v-else class="tw-overflow-y-auto tw-p-[18px] scrollbar-thin">
          <div class="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 md:tw-grid-cols-4 lg:tw-grid-cols-5 tw-gap-x-2 tw-gap-y-4">
            <div 
              v-for="game in newLaunchGames" 
              :key="game.id" 
              @click="playGame(game)"
              class="tw-relative tw-overflow-hidden tw-aspect-video tw-bg-transparent tw-cursor-pointer tw-rounded-lg hover:tw-scale-[1.02] tw-transition-transform tw-duration-300"
            >
              <!-- New Badge -->
              <div class="tw-absolute tw-top-2 tw-right-2 tw-z-10">
                <v-chip size="x-small" color="red" variant="elevated" class="tw-font-bold tw-shadow-lg">
                  NEW
                </v-chip>
              </div>

              <img 
                :src="game.url_thumb || game.thumbnail_url" 
                :alt="game.name" 
                loading="lazy" 
                decoding="async"
                class="tw-w-full tw-h-full tw-object-fill tw-object-center tw-transition-transform tw-duration-300 tw-rounded-lg"
                @error="handleImageError($event)" 
              />

              <!-- Placeholder for broken images -->
              <div
                class="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black tw-bg-opacity-40 tw-opacity-0 image-placeholder tw-rounded-lg">
                <v-icon icon="mdi-cards-variant" size="48" class="tw-text-white"></v-icon>
              </div>

              <!-- Hover play overlay -->
              <div
                class="tw-absolute tw-inset-0 tw-bg-black tw-bg-opacity-0 hover:tw-bg-opacity-30 tw-transition-all tw-duration-300 tw-flex tw-items-center tw-justify-center tw-rounded-lg">
                <v-icon icon="mdi-play-circle" size="40"
                  class="tw-text-white tw-opacity-0 hover:tw-opacity-100 tw-transition-opacity tw-duration-300"></v-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getNewLaunchCasinoGames } from '@/api/event/casino';
import { useSelectedGame } from '@/composables/useSelectedGame';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();
const router = useRouter();
const { setSelectedGame } = useSelectedGame();

const loading = ref(false);
const error = ref(null);
const newLaunchGames = ref([]);

// Load new launch games when modal opens
watch(() => props.modelValue, async (newVal) => {
  if (newVal && newLaunchGames.value.length === 0) {
    await loadNewLaunchGames();
  }
});

const loadNewLaunchGames = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await getNewLaunchCasinoGames();
    
    // Handle different response structures
    const games = Array.isArray(response.data) 
      ? response.data 
      : response.data?.data || [];

    // Transform games to have consistent properties
    newLaunchGames.value = games.map(game => ({
      ...game,
      url_thumb: game.thumbnail_url || game.url_thumb,
      id: game.id || game.game_id
    }));
  } catch (err) {
    console.error('Error loading new launch games:', err);
    error.value = err.response?.data?.message || t('components.newLaunchGames.errorLoading');
  } finally {
    loading.value = false;
  }
};

const playGame = (game) => {
  setSelectedGame(game);
  router.push({ 
    name: 'casino-game', 
    params: { gameId: game.game_id || game.id }
  });
  close();
};

const handleImageError = (event) => {
  event.target.style.display = 'none';
  const placeholder = event.target.nextElementSibling;
  if (placeholder && placeholder.classList.contains('image-placeholder')) {
    placeholder.classList.remove('tw-opacity-0');
    placeholder.classList.add('tw-opacity-100');
  }
};

const close = () => {
  emit('update:modelValue', false);
};
</script>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(to bottom, #34d77e, #148154);
}

/* Loader styles */
.loader {
  transform: translateZ(1px);
}

.loader:after {
  content: '$';
  display: inline-block;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  text-align: center;
  line-height: 28px;
  font-size: 20px;
  font-weight: bold;
  background: #FFD700;
  color: #DAA520;
  border: 3px double;
  box-sizing: border-box;
  box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, .1);
  animation: coin-flip 4s cubic-bezier(0, 0.2, 0.8, 1) infinite;
}

@keyframes coin-flip {
  0%, 100% {
    animation-timing-function: cubic-bezier(0.5, 0, 1, 0.5);
  }
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(1800deg);
    animation-timing-function: cubic-bezier(0, 0.5, 0.5, 1);
  }
  100% {
    transform: rotateY(3600deg);
  }
}

/* Scrollbar styling */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(52, 215, 126, 0.3) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(52, 215, 126, 0.3);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(52, 215, 126, 0.5);
}
</style>
