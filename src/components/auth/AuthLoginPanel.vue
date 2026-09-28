<template>
  <div class="auth-ref-login-shell">
  <form class="auth-ref-form auth-ref-form--login" @submit.prevent="handleLogin">
    <div class="auth-ref-login-tabs">
      <button
        type="button"
        class="auth-ref-login-tab"
        :class="{ 'auth-ref-login-tab--active': loginMode === 'phone' }"
        @click="loginMode = 'phone'"
      >
        {{ t('auth.login.mobileNumber') }}
      </button>
      <button
        type="button"
        class="auth-ref-login-tab"
        :class="{ 'auth-ref-login-tab--active': loginMode === 'username' }"
        @click="loginMode = 'username'"
      >
        {{ t('auth.login.username') }}
      </button>
    </div>

    <div class="auth-ref-field">
      <label class="auth-ref-field-label" :for="loginMode === 'username' ? 'auth-login-username' : 'auth-login-phone'">
        {{ loginMode === 'username' ? t('auth.login.username') : t('auth.login.mobileNumber') }}
      </label>
      <input
        v-if="loginMode === 'username'"
        id="auth-login-username"
        v-model="username"
        type="text"
        class="auth-ref-input"
        :placeholder="t('auth.login.enterUsername')"
        autocomplete="username"
      />
      <div v-else class="auth-ref-phone-row">
        <div class="auth-ref-phone-prefix">
          <span class="auth-ref-phone-code">+91</span>
          <span class="auth-ref-phone-flag" aria-hidden="true">🇮🇳</span>
        </div>
        <input
          id="auth-login-phone"
          v-model="phoneNumber"
          type="tel"
          inputmode="numeric"
          maxlength="10"
          class="auth-ref-phone-input"
          :placeholder="t('auth.login.enterMobileNumber')"
          autocomplete="tel"
        />
      </div>
      <p v-if="fieldError" class="auth-ref-field-error">{{ fieldError }}</p>
    </div>

    <div class="auth-ref-field">
      <label class="auth-ref-field-label" for="auth-login-password">{{ t('auth.login.password') }}</label>
      <div class="auth-ref-password-wrap">
        <input
          id="auth-login-password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          class="auth-ref-input auth-ref-input--password"
          :placeholder="t('auth.login.enterYourPassword')"
          autocomplete="current-password"
        />
        <button
          type="button"
          class="auth-ref-input-toggle auth-ref-input-toggle--absolute"
          :aria-label="showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')"
          @click="showPassword = !showPassword"
        >
          <v-icon size="16">{{ showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline' }}</v-icon>
        </button>
      </div>
    </div>

    <div class="auth-ref-link-row">
      <button type="button" class="auth-ref-link" @click="emit('forgot')">
        {{ t('auth.login.forgotPasswordLink') }}
      </button>
    </div>

    <button
      type="submit"
      class="auth-ref-btn"
      :disabled="loading || demoLoading || !hasLoginDetails"
      :aria-busy="loading"
    >
      <span v-if="loading" class="auth-ref-btn__spinner" />
      <span v-else>{{ t('auth.login.login') }}</span>
    </button>

    <button
      type="button"
      class="auth-ref-btn"
      :disabled="loading || demoLoading"
      :aria-busy="demoLoading"
      @click="handleDemoLogin"
    >
      <span v-if="demoLoading" class="auth-ref-btn__spinner" />
      <span v-else>{{ t('auth.login.demoLogin') }}</span>
    </button>

    <button
      type="button"
      class="auth-ref-btn auth-ref-btn--apk"
      @click="handleApkDownload"
    >
      <v-icon size="16">mdi-android</v-icon>
      <span>{{ t('auth.login.downloadApk') }}</span>
      <span aria-hidden="true">↓</span>
    </button>

    <p class="auth-ref-footer auth-ref-footer--login">
      <span>{{ t('auth.login.newUser') }}</span>
      <button type="button" @click="emit('signup')">{{ t('auth.login.signupCta') }}</button>
    </p>
  </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import { useFavoriteGames } from '@/composables/useFavoriteGames'
import { useMobileAppConfig } from '@/composables/useMobileAppConfig.js'

const emit = defineEmits(['success', 'signup', 'forgot'])

const props = defineProps({
  forceMessage: { type: String, default: '' },
})

const { t } = useI18n()
const authStore = useAuthStore()
const { showSuccess, showError } = useSnackbar()
const { refreshFavouriteGames } = useFavoriteGames()
const { loadConfig, requestApkDownload } = useMobileAppConfig()

const loginMode = ref('phone')
const username = ref('')
const phoneNumber = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const demoLoading = ref(false)
const fieldError = ref('')

const hasLoginDetails = computed(() => {
  const id = loginMode.value === 'username'
    ? username.value.trim()
    : phoneNumber.value.trim()
  return Boolean(id && password.value)
})

watch([loginMode, username, phoneNumber, password], () => {
  fieldError.value = ''
})

watch(() => props.forceMessage, (message) => {
  if (message) showError(message, { timeout: 6000 })
}, { immediate: true })

function getLoginErrorMessage(error, fallback) {
  const data = error?.response?.data
  const fieldMsg = Array.isArray(data?.errors) ? data.errors[0]?.msg : null
  return fieldMsg || data?.message || error?.message || fallback
}

function resolveLoginIdentity() {
  if (loginMode.value === 'phone') {
    const digits = phoneNumber.value.replace(/\D/g, '')
    if (digits.length !== 10) {
      fieldError.value = t('auth.signup.phoneInvalid')
      return null
    }
    return digits
  }
  const name = username.value.trim()
  if (!name) {
    fieldError.value = t('auth.login.fillFields')
    return null
  }
  return name
}

async function handleLogin() {
  const identity = resolveLoginIdentity()
  if (!identity || !password.value) {
    if (!fieldError.value) fieldError.value = t('auth.login.fillFields')
    return
  }

  loading.value = true
  try {
    await authStore.login({ username: identity, password: password.value })
    if (!authStore.isAuthenticated || !authStore.user) {
      showError(t('auth.login.authCheckFailed'))
      return
    }
    await refreshFavouriteGames()
    showSuccess(t('auth.login.success'))
    username.value = ''
    phoneNumber.value = ''
    password.value = ''
    emit('success')
  } catch (error) {
    showError(getLoginErrorMessage(error, t('auth.login.loginFailed')))
  } finally {
    loading.value = false
  }
}

async function handleDemoLogin() {
  demoLoading.value = true
  try {
    await authStore.demoLoginFull()
    if (!authStore.isAuthenticated || !authStore.user) {
      showError(t('auth.login.demoFailed'))
      return
    }
    showSuccess(t('auth.login.demoSuccess'))
    emit('success')
  } catch (error) {
    showError(getLoginErrorMessage(error, t('auth.login.demoFailed')))
  } finally {
    demoLoading.value = false
  }
}

async function handleApkDownload() {
  try {
    await requestApkDownload()
  } catch {
    showError(t('auth.login.apkUnavailable'))
  }
}

onMounted(() => {
  loadConfig()
})
</script>
