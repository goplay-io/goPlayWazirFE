import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'

export function useLoginModal() {
  const uiStore = useUIStore()

  const isLoginModalOpen = computed(() => uiStore.loginModalOpen)
  const loginModalRedirect = computed(() => uiStore.loginModalRedirect)

  function openLoginModal(options = {}) {
    uiStore.openLoginModal(options)
  }

  function closeLoginModal() {
    uiStore.closeLoginModal()
  }

  return {
    isLoginModalOpen,
    loginModalRedirect,
    openLoginModal,
    closeLoginModal,
  }
}

/** Open modal from router guards / non-setup contexts */
export function openLoginModal(options = {}) {
  const uiStore = useUIStore()
  uiStore.openLoginModal(options)
}

export function closeLoginModal() {
  const uiStore = useUIStore()
  uiStore.closeLoginModal()
}
