import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'

export function useLoginModal() {
  const uiStore = useUIStore()

  const isLoginModalOpen = computed(() => uiStore.loginModalOpen)
  const loginModalRedirect = computed(() => uiStore.loginModalRedirect)
  const authModalView = computed(() => uiStore.authModalView)

  function openLoginModal(options = {}) {
    uiStore.openLoginModal({ ...options, view: options.view || 'login' })
  }

  function openSignupModal(options = {}) {
    uiStore.openLoginModal({ ...options, view: 'signup' })
  }

  function openForgotPasswordModal(options = {}) {
    uiStore.openLoginModal({ ...options, view: 'forgot' })
  }

  function setAuthModalView(view) {
    uiStore.setAuthModalView(view)
  }

  function closeLoginModal() {
    uiStore.closeLoginModal()
  }

  return {
    isLoginModalOpen,
    loginModalRedirect,
    authModalView,
    openLoginModal,
    openSignupModal,
    openForgotPasswordModal,
    setAuthModalView,
    closeLoginModal,
  }
}

/** Open modal from router guards / non-setup contexts */
export function openLoginModal(options = {}) {
  const uiStore = useUIStore()
  uiStore.openLoginModal({ ...options, view: options.view || 'login' })
}

export function openSignupModal(options = {}) {
  const uiStore = useUIStore()
  uiStore.openLoginModal({ ...options, view: 'signup' })
}

export function openForgotPasswordModal(options = {}) {
  const uiStore = useUIStore()
  uiStore.openLoginModal({ ...options, view: 'forgot' })
}

export function closeLoginModal() {
  const uiStore = useUIStore()
  uiStore.closeLoginModal()
}
