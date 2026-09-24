import { ref, onMounted } from 'vue';
import { useBetStore } from '@/stores/bet';
import { useAuthStore } from '@/stores/auth';
import { fetchButtons } from '@/api/user/profile.js';

const getBetAllow = (buttons) =>
  !buttons || !buttons.value?.length || buttons.value[0].bet_allow == 1;

export function useLayoutBetSlip() {
  const betStore = useBetStore();
  const authStore = useAuthStore();

  const buttons = ref([]);
  const slipOpen = ref(true);
  const showBetHistory = ref(false);
  const bet_processing = ref(false);
  const betAllow = ref(true);

  const handleButtonsUpdate = (updatedButtons) => {
    buttons.value = updatedButtons || [];
    betAllow.value = getBetAllow(buttons);
  };

  const toggleSlip = () => {
    slipOpen.value = !slipOpen.value;
  };

  onMounted(async () => {
    if (authStore.isDemoUser) {
      buttons.value = [];
      betAllow.value = true;
      return;
    }

    try {
      const response = await fetchButtons();
      buttons.value = response?.buttons || [];
      betAllow.value = getBetAllow(buttons);
    } catch (error) {
      console.warn('Layout bet slip: buttons API failed', error);
    }
  });

  return {
    betStore,
    buttons,
    slipOpen,
    showBetHistory,
    bet_processing,
    betAllow,
    handleButtonsUpdate,
    toggleSlip,
  };
}
