<template>
  <main class="auth-page auth-page--login">
    <div class="auth-page-login-shell">
      <AuthDownloadBanner variant="login" class="auth-page-login-banner-mobile" />

      <div class="auth-page-card">
        <Transition name="login-error-fade">
        <div
          v-if="isMobile && loginToastVisible && loginToastMessage"
          class="login-modal-toast login-modal-toast--light"
          role="alert"
          aria-live="polite"
        >
          <v-icon size="18" class="login-modal-toast__icon">mdi-shield-alert</v-icon>
          <span class="login-modal-toast__text">{{ loginToastMessage }}</span>
          <button
            type="button"
            class="login-modal-toast__close"
            :aria-label="t('components.globalSnackbar.close')"
            @click="dismissLoginToast"
          >
            <v-icon size="16">mdi-close</v-icon>
          </button>
        </div>
      </Transition>

        <AuthDownloadBanner variant="login" class="auth-page-login-banner-desktop" />

        <h1 class="auth-page-heading">
        {{ t('auth.login.loginHeading') }}
      </h1>

      <form class="auth-page-form" @submit.prevent="handleLogin">
        <div class="auth-page-field">
          <div class="auth-page-input-wrap">
            <input
              id="login-page-username"
              v-model="username"
              type="text"
              class="auth-page-input auth-page-input--lower"
              :placeholder="t('auth.login.enterUsername')"
              autocomplete="username"
            />
          </div>
          <router-link to="/forgot-password" class="auth-page-link">
            {{ t('auth.login.forgotUsername') }}
          </router-link>
        </div>

        <div class="auth-page-field">
          <div class="auth-page-input-wrap auth-page-input-wrap--password">
            <input
              id="login-page-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="auth-page-input"
              :placeholder="t('auth.login.enterPassword')"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="auth-page-input-toggle"
              :aria-label="showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')"
              @click="showPassword = !showPassword"
            >
              <v-icon size="20">
                {{ showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline' }}
              </v-icon>
            </button>
          </div>
          <router-link to="/forgot-password" class="auth-page-link">
            {{ t('auth.login.forgotPasswordLink') }}
          </router-link>
        </div>

        <button
          type="submit"
          class="auth-page-btn auth-page-btn--primary"
          :class="{ 'auth-page-btn--loading': loading }"
          :disabled="loading || !hasLoginDetails"
          :aria-busy="loading"
        >
          <span v-if="loading" class="auth-page-btn__spinner" />
          <span v-else>{{ t('auth.login.loginButton') }}</span>
        </button>

        <button
          type="button"
          class="auth-page-btn auth-page-btn--gradient"
          :class="{ 'auth-page-btn--loading': demoLoading }"
          :disabled="loading || demoLoading"
          :aria-busy="demoLoading"
          @click="handleDemoLogin"
        >
          <span v-if="demoLoading" class="auth-page-btn__spinner" />
          <span v-else>{{ t('auth.login.demoButton') }}</span>
        </button>
      </form>

      <p class="auth-page-footer">
        {{ t('auth.login.signupPrompt') }}
        <router-link to="/signup">{{ t('auth.login.signupCta') }}</router-link>
      </p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import { useFavoriteGames } from '@/composables/useFavoriteGames'
import useDevices from '@/composables/useDevices.js'
import { useMobileAppConfig } from '@/composables/useMobileAppConfig.js'
import AuthDownloadBanner from '@/components/auth/AuthDownloadBanner.vue'
import '@/assets/auth-page.css'

const LOGIN_REDIRECT_MESSAGE_KEY = 'login_redirect_message'
const DEFAULT_FORCE_LOGIN_MESSAGE = 'Session expired or revoked. Please login again.'
const NO_TOKEN_PROVIDED_MESSAGE_PATTERN = /no token provided/i
const LOGIN_TOAST_TIMEOUT_MS = 5000

let loginToastTimer = null

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const { showSuccess, showError } = useSnackbar()
const { refreshFavouriteGames } = useFavoriteGames()
const { isMobile } = useDevices()
const { loadConfig: loadMobileAppConfig } = useMobileAppConfig()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const demoLoading = ref(false)
const loginToastVisible = ref(false)
const loginToastMessage = ref('')

const hasLoginDetails = computed(
  () => Boolean(username.value.trim() && password.value),
)

const redirectTarget = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect !== '/login' ? redirect : null
})

function dismissLoginToast() {
  if (loginToastTimer) {
    clearTimeout(loginToastTimer)
    loginToastTimer = null
  }
  loginToastVisible.value = false
}

function showLoginError(message, options = {}) {
  const timeout = options.timeout ?? LOGIN_TOAST_TIMEOUT_MS
  if (isMobile.value) {
    loginToastMessage.value = message
    loginToastVisible.value = true
    if (loginToastTimer) clearTimeout(loginToastTimer)
    loginToastTimer = setTimeout(() => {
      loginToastVisible.value = false
      loginToastTimer = null
    }, timeout)
    return
  }
  showError(message, { timeout, ...options })
}

function getLoginErrorMessage(error, fallback) {
  const data = error?.response?.data
  const fieldMsg = Array.isArray(data?.errors) ? data.errors[0]?.msg : null
  return fieldMsg || data?.message || error?.message || fallback
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

onMounted(async () => {
  await loadMobileAppConfig()
  if (!settingsStore.settings) await settingsStore.fetchSettings()

  const force = route.query.force == 1 || route.query.force === '1'
  if (force) {
    const message = getStoredRedirectMessage() || DEFAULT_FORCE_LOGIN_MESSAGE
    if (!NO_TOKEN_PROVIDED_MESSAGE_PATTERN.test(message)) {
      showLoginError(message, { timeout: 6000 })
    }
  }
})

onUnmounted(() => {
  dismissLoginToast()
})

async function afterAuthSuccess() {
  username.value = ''
  password.value = ''
  const redirect = redirectTarget.value
  if (redirect) {
    await router.push(redirect)
    return
  }
  await router.push('/')
}

const handleLogin = async () => {
  if (!username.value.trim() || !password.value) {
    showLoginError(t('auth.login.fillFields'))
    return
  }

  loading.value = true
  dismissLoginToast()
  try {
    await authStore.login({ username: username.value, password: password.value })
    await nextTick()

    if (!authStore.isAuthenticated || !authStore.user) {
      showLoginError(t('auth.login.authCheckFailed'))
      return
    }

    await refreshFavouriteGames()
    showSuccess(t('auth.login.success'))
    await afterAuthSuccess()
  } catch (error) {
    console.error('Login error:', error)
    showLoginError(getLoginErrorMessage(error, t('auth.login.loginFailed')))
  } finally {
    loading.value = false
  }
}

const handleDemoLogin = async () => {
  demoLoading.value = true
  dismissLoginToast()
  try {
    await authStore.demoLoginFull()
    await nextTick()

    if (!authStore.isAuthenticated || !authStore.user) {
      showLoginError(t('auth.login.demoFailed'))
      return
    }

    showSuccess(t('auth.login.demoSuccess'))
    await afterAuthSuccess()
  } catch (error) {
    console.error('Demo login error:', error)
    showLoginError(getLoginErrorMessage(error, t('auth.login.demoFailed')))
  } finally {
    demoLoading.value = false
  }
}
</script>

<style scoped>
.auth-page--login .auth-page-card {
  position: relative;
  overflow: hidden;
}

.login-modal-toast {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 7;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 2.25rem 0.55rem 0.65rem;
  background: #c62828;
  color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
}

.login-modal-toast__icon {
  flex-shrink: 0;
  color: #fff !important;
}

.login-modal-toast__text {
  flex: 1;
  min-width: 0;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
  color: #fff !important;
}

.login-modal-toast__close {
  position: absolute;
  top: 50%;
  right: 0.35rem;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.login-modal-toast__close :deep(.v-icon) {
  color: rgba(255, 255, 255, 0.9) !important;
}

.login-error-fade-enter-active,
.login-error-fade-leave-active {
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.login-error-fade-enter-from,
.login-error-fade-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
