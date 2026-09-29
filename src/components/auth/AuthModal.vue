<template>
  <Teleport to="body">
    <div
      v-if="isLoginModalOpen"
      class="auth-ref-modal-root"
      role="presentation"
      @click.self="handleClose"
      @keydown.esc="handleClose"
    >
      <div class="auth-ref-modal-panel" role="dialog" aria-modal="true" :aria-labelledby="titleId" @click.stop>
        <header class="auth-ref-modal-header">
          <div class="auth-ref-modal-header__top">
            <button type="button" class="auth-ref-modal-close" :aria-label="t('components.globalSnackbar.close')" @click="handleClose">
              <v-icon size="16">mdi-close</v-icon>
            </button>
          </div>
          <div class="auth-ref-modal-header__row">
            <h2 :id="titleId" class="auth-ref-modal-title">{{ modalTitle }}</h2>
            <img :src="logoSrc" :alt="t('auth.login.logoAlt')" class="auth-ref-modal-logo" />
          </div>
        </header>

        <div class="auth-ref-modal-body">
          <AuthLoginPanel
            v-if="authModalView === 'login'"
            :force-message="loginForceMessage"
            @success="handleAuthSuccess"
            @signup="setAuthModalView('signup')"
            @forgot="setAuthModalView('forgot')"
          />

          <AuthSignupPanel
            v-else-if="authModalView === 'signup'"
            ref="signupPanelRef"
            :initial-campaign-id="authModalCampaignId"
            :initial-referral-id="authModalReferralId"
            @sign-in-click="setAuthModalView('login')"
            @success="handleSignupSuccess"
          />

          <AuthForgotPasswordPanel
            v-else
            ref="forgotPanelRef"
            @success="handleForgotSuccess"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { useLoginModal } from '@/composables/useLoginModal'
import { useMobileAppConfig } from '@/composables/useMobileAppConfig.js'
import AuthLoginPanel from '@/components/auth/AuthLoginPanel.vue'
import AuthForgotPasswordPanel from '@/components/auth/AuthForgotPasswordPanel.vue'
import AuthSignupPanel from '@/components/auth/AuthSignupPanel.vue'
import goplayLogo from '@/assets/goplay-wordmark.png'
import '@/assets/auth-modal-ref.css'

const LOGIN_REDIRECT_MESSAGE_KEY = 'login_redirect_message'
const DEFAULT_FORCE_LOGIN_MESSAGE = 'Session expired or revoked. Please login again.'
const NO_TOKEN_PROVIDED_MESSAGE_PATTERN = /no token provided/i

const { t } = useI18n()
const router = useRouter()
const uiStore = useUIStore()
const settingsStore = useSettingsStore()
const { loadConfig: loadMobileAppConfig } = useMobileAppConfig()
const {
  isLoginModalOpen,
  loginModalRedirect,
  authModalView,
  closeLoginModal,
  setAuthModalView,
} = useLoginModal()
const { authModalCampaignId, authModalReferralId } = storeToRefs(uiStore)

const forgotPanelRef = ref(null)
const signupPanelRef = ref(null)
const loginForceMessage = ref('')
const logoSrc = goplayLogo

const titleId = 'auth-modal-title'

const modalTitle = computed(() => {
  if (authModalView.value === 'signup') return t('auth.signup.signUpTitle')
  if (authModalView.value === 'forgot') return t('auth.forgotPassword.title')
  return t('auth.login.logInTitle')
})

function lockBodyScroll(lock) {
  if (typeof document === 'undefined') return
  document.body.style.overflow = lock ? 'hidden' : ''
}

function getStoredRedirectMessage() {
  if (typeof window === 'undefined') return null
  try {
    const rawValue = window.sessionStorage.getItem(LOGIN_REDIRECT_MESSAGE_KEY)
    if (!rawValue) return null
    window.sessionStorage.removeItem(LOGIN_REDIRECT_MESSAGE_KEY)
    const parsed = JSON.parse(rawValue)
    if (!parsed || typeof parsed.message !== 'string') return null
    if (typeof parsed.expiresAt !== 'number' || parsed.expiresAt < Date.now()) return null
    return parsed.message
  } catch {
    return null
  }
}

function handleClose() {
  if (uiStore.loginModalForce) return
  setAuthModalView('login')
  closeLoginModal()
}

async function handleAuthSuccess() {
  closeLoginModal()
  const redirect = loginModalRedirect.value
  if (redirect && redirect !== '/login' && redirect !== '/signup') {
    await router.push(redirect)
  }
}

function handleSignupSuccess() {
  setAuthModalView('login')
}

function handleForgotSuccess() {
  setAuthModalView('login')
}

watch(isLoginModalOpen, async (open) => {
  lockBodyScroll(open)
  if (!open) {
    loginForceMessage.value = ''
    forgotPanelRef.value?.resetForm?.()
    signupPanelRef.value?.resetForm?.()
    return
  }
  await loadMobileAppConfig()
  if (!settingsStore.settings) await settingsStore.fetchSettings()
  if (uiStore.loginModalForce) {
    const message = getStoredRedirectMessage() || DEFAULT_FORCE_LOGIN_MESSAGE
    if (!NO_TOKEN_PROVIDED_MESSAGE_PATTERN.test(message)) {
      loginForceMessage.value = message
    }
  }
})

watch(authModalView, (view) => {
  if (view !== 'forgot') forgotPanelRef.value?.resetForm?.()
  if (view !== 'signup') signupPanelRef.value?.resetForm?.()
})

onMounted(() => {
  loadMobileAppConfig()
  if (!settingsStore.settings) settingsStore.fetchSettings()
})

onUnmounted(() => {
  lockBodyScroll(false)
})
</script>
