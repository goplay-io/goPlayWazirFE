import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'

export function useForgotPasswordModal() {
  const uiStore = useUIStore()

  const isForgotPasswordModalOpen = computed(
    () => uiStore.loginModalOpen && uiStore.authModalView === 'forgot',
  )

  function openForgotPasswordModal() {
    uiStore.openLoginModal({ view: 'forgot' })
  }

  function closeForgotPasswordModal() {
    uiStore.setAuthModalView('login')
  }

  return {
    isForgotPasswordModalOpen,
    openForgotPasswordModal,
    closeForgotPasswordModal,
  }
}

export function openForgotPasswordModal() {
  const uiStore = useUIStore()
  uiStore.openLoginModal({ view: 'forgot' })
}

export function closeForgotPasswordModal() {
  const uiStore = useUIStore()
  uiStore.setAuthModalView('login')
}
