import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'

export function useForgotPasswordModal() {
  const uiStore = useUIStore()

  const isForgotPasswordModalOpen = computed(() => uiStore.forgotPasswordModalOpen)

  function openForgotPasswordModal() {
    uiStore.openForgotPasswordModal()
  }

  function closeForgotPasswordModal() {
    uiStore.closeForgotPasswordModal()
  }

  return {
    isForgotPasswordModalOpen,
    openForgotPasswordModal,
    closeForgotPasswordModal,
  }
}

export function openForgotPasswordModal() {
  const uiStore = useUIStore()
  uiStore.openForgotPasswordModal()
}

export function closeForgotPasswordModal() {
  const uiStore = useUIStore()
  uiStore.closeForgotPasswordModal()
}
