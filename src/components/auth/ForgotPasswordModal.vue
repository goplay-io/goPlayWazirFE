<template>
  <Teleport to="body">
    <div
      v-if="isForgotPasswordModalOpen"
      class="login-modal-root login-modal-root--light login-modal-root--forgot auth-page--forgot"
      role="presentation"
      @keydown.esc="handleClose"
    >
      <div class="login-modal-backdrop" aria-hidden="true" @click="handleClose" />

      <div
        class="login-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-title"
        @click.stop
      >
        <div class="login-modal-inner">
          <div class="auth-page-card">
            <button type="button" class="auth-page-back" :aria-label="t('common.back')" @click="handleClose">
              <v-icon size="20">mdi-arrow-left</v-icon>
            </button>

            <AuthDownloadBanner variant="login" />

            <h1 id="forgot-title" class="auth-page-heading">
              {{ step === 'verify' ? t('auth.forgotPassword.title') : t('auth.forgotPassword.resetTitle') }}
            </h1>

            <form
              v-if="step === 'verify'"
              class="auth-modal-form"
              :class="{ 'auth-modal-form--compact': otpSent }"
              @submit.prevent="otpSent ? handleVerifyOtp() : handleSendOtp()"
            >
              <div v-if="successMessage" class="auth-modal-success">
                {{ successMessage }}
              </div>

              <AuthFloatField
                v-model="username"
                :label="t('auth.login.username')"
                icon="mdi-account-outline"
                autocomplete="username"
                :readonly="otpSent"
                @input="onUsernameInput"
              />

              <AuthFloatField
                v-model="phoneDisplay"
                :label="t('auth.forgotPassword.mobileLabel')"
                icon="mdi-phone-outline"
                type="tel"
                inputmode="numeric"
                maxlength="10"
                prefix="+91"
                autocomplete="tel"
                :readonly="otpSent"
                @input="onPhoneInput"
              />

              <AuthFloatField
                v-if="otpSent"
                v-model="otpValue"
                :label="t('auth.signup.otp')"
                icon="mdi-shield-key-outline"
                type="text"
                inputmode="numeric"
                maxlength="6"
                autocomplete="one-time-code"
                @input="onOtpInput"
              />

              <div class="auth-modal-form__actions">
                <button
                  v-if="otpSent"
                  type="submit"
                  class="auth-page-btn auth-page-btn--primary"
                  :disabled="!canVerifyOtp || verifyingOtp"
                >
                  <span v-if="verifyingOtp" class="auth-page-btn__spinner" />
                  <span v-else>{{ t('auth.forgotPassword.verifyOtp') }}</span>
                </button>
                <button
                  v-else
                  type="submit"
                  class="auth-page-btn auth-page-btn--gradient"
                  :disabled="!canSendOtp || sendingOtp"
                >
                  <span v-if="sendingOtp" class="auth-page-btn__spinner" />
                  <span v-else>{{ t('auth.forgotPassword.getOtpWhatsapp') }}</span>
                </button>
              </div>
            </form>

            <form v-else class="auth-modal-form auth-modal-form--compact" @submit.prevent="handleResetPassword">
              <p class="auth-modal-section-heading">{{ t('auth.forgotPassword.loginPasswordSection') }}</p>

              <AuthFloatField
                v-model="password"
                :label="t('auth.login.password')"
                icon="mdi-lock-outline"
                autocomplete="new-password"
                password-toggle
                :show-password-label="t('auth.login.showPassword')"
                :hide-password-label="t('auth.login.hidePassword')"
              />

              <AuthFloatField
                v-model="passwordConfirmation"
                :label="t('auth.forgotPassword.confirmPassword')"
                icon="mdi-lock-outline"
                autocomplete="new-password"
                password-toggle
                :show-password-label="t('auth.login.showPassword')"
                :hide-password-label="t('auth.login.hidePassword')"
              />

              <p class="auth-modal-hint">
                {{ t('auth.forgotPassword.passwordHint') }}
              </p>

              <p class="auth-modal-section-heading auth-modal-section-heading--divider">
                {{ t('auth.forgotPassword.walletPasswordSection') }}
              </p>

              <label class="auth-modal-checkbox-row">
                <input v-model="walletSameAsPassword" type="checkbox" class="auth-modal-checkbox" />
                <span>{{ t('auth.forgotPassword.sameAsPassword') }}</span>
              </label>

              <template v-if="!walletSameAsPassword">
                <AuthFloatField
                  v-model="walletPassword"
                  :label="t('auth.signup.withdrawalPassword')"
                  icon="mdi-lock-outline"
                  autocomplete="new-password"
                  password-toggle
                  :show-password-label="t('auth.login.showPassword')"
                  :hide-password-label="t('auth.login.hidePassword')"
                />

                <AuthFloatField
                  v-model="walletPasswordConfirmation"
                  :label="t('auth.forgotPassword.confirmWalletPassword')"
                  icon="mdi-lock-outline"
                  autocomplete="new-password"
                  password-toggle
                  :show-password-label="t('auth.login.showPassword')"
                  :hide-password-label="t('auth.login.hidePassword')"
                />
              </template>

              <div class="auth-modal-form__actions">
                <button
                  type="submit"
                  class="auth-page-btn auth-page-btn--primary"
                  :disabled="resetLoading"
                >
                  <span v-if="resetLoading" class="auth-page-btn__spinner" />
                  <span v-else>{{ t('auth.forgotPassword.updatePassword') }}</span>
                </button>
              </div>
            </form>

            <p class="auth-page-footer">
              {{ t('auth.forgotPassword.backToLogin') }}
              <button type="button" @click="goToLogin">{{ t('auth.forgotPassword.loginLink') }}</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import { useForgotPasswordModal } from '@/composables/useForgotPasswordModal'
import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPassword,
} from '@/api/user/login.js'
import { useSettingsStore } from '@/stores/settings'
import AuthFloatField from '@/components/auth/AuthFloatField.vue'
import AuthDownloadBanner from '@/components/auth/AuthDownloadBanner.vue'
import '@/assets/auth-modal.css'
import '@/assets/auth-page.css'

const { t } = useI18n()
const router = useRouter()
const { isForgotPasswordModalOpen, closeForgotPasswordModal } = useForgotPasswordModal()
const settingsStore = useSettingsStore()
const { showSuccess, showError } = useSnackbar()

const PHONE_PATTERN = /^\d{10}$/
const OTP_PATTERN = /^\d{6}$/

const step = ref('verify')
const username = ref('')
const phoneDisplay = ref('')
const otpValue = ref('')
const otpSent = ref(false)
const otpVerified = ref(false)
const sendingOtp = ref(false)
const verifyingOtp = ref(false)
const resetLoading = ref(false)
const password = ref('')
const passwordConfirmation = ref('')
const walletSameAsPassword = ref(true)
const walletPassword = ref('')
const walletPasswordConfirmation = ref('')
const successMessage = ref('')

const fullPhoneNumber = computed(() => {
  const digits = String(phoneDisplay.value || '').replace(/\D/g, '')
  return digits ? `+91${digits}` : ''
})

const canSendOtp = computed(() => {
  const name = username.value.trim()
  return !!name && name.length <= 220 && PHONE_PATTERN.test(phoneDisplay.value)
})

const canVerifyOtp = computed(() => OTP_PATTERN.test(otpValue.value))

watch(isForgotPasswordModalOpen, async open => {
  lockBodyScroll(open)
  if (open && !settingsStore.settings) {
    await settingsStore.fetchSettings()
  }
  if (!open) resetForm()
})

watch(walletSameAsPassword, same => {
  if (!same) return
  walletPassword.value = ''
  walletPasswordConfirmation.value = ''
})

function lockBodyScroll(lock) {
  if (typeof document === 'undefined') return
  document.body.style.overflow = lock ? 'hidden' : ''
}

function resetForm() {
  step.value = 'verify'
  username.value = ''
  phoneDisplay.value = ''
  otpValue.value = ''
  otpSent.value = false
  otpVerified.value = false
  sendingOtp.value = false
  verifyingOtp.value = false
  resetLoading.value = false
  password.value = ''
  passwordConfirmation.value = ''
  walletSameAsPassword.value = true
  walletPassword.value = ''
  walletPasswordConfirmation.value = ''
  successMessage.value = ''
}

function handleClose() {
  closeForgotPasswordModal()
}

function goToLogin() {
  closeForgotPasswordModal()
  router.push('/login')
}

function getResponseData(response) {
  return response?.data?.data ?? response?.data ?? response ?? {}
}

function getApiError(error, fallback) {
  const data = error?.response?.data
  const fieldMsg = Array.isArray(data?.errors) ? data.errors[0]?.msg : null
  return fieldMsg || data?.message || error?.message || fallback
}

function onUsernameInput(event) {
  username.value = String(event.target.value || '').replace(/\s/g, '')
}

function onPhoneInput(event) {
  phoneDisplay.value = String(event.target.value || '').replace(/\D/g, '').slice(0, 10)
}

function onOtpInput(event) {
  const nextValue = String(event.target.value || '').replace(/\D/g, '').slice(0, 6)
  if (otpValue.value !== nextValue) otpVerified.value = false
  otpValue.value = nextValue
}

function validateIdentity() {
  if (!username.value.trim()) {
    showError(t('auth.forgotPassword.usernameRequired'))
    return false
  }

  if (!PHONE_PATTERN.test(phoneDisplay.value)) {
    showError(t('auth.forgotPassword.phoneInvalid'))
    return false
  }

  return true
}

function validatePasswordValue(value, label) {
  if (!value) return t('auth.forgotPassword.fieldRequired', { field: label })
  if (value.length < 8) return t('auth.forgotPassword.minLength', { field: label })
  if (value.length > 255) return t('auth.forgotPassword.maxLength', { field: label })
  if (!/[a-zA-Z]/.test(value)) return t('auth.forgotPassword.mustContainLetters', { field: label })
  if (!/[0-9]/.test(value)) return t('auth.forgotPassword.mustContainNumbers', { field: label })
  return null
}

function validatePasswords() {
  const passwordError = validatePasswordValue(password.value, t('auth.login.password'))
  if (passwordError) {
    showError(passwordError)
    return false
  }

  if (password.value !== passwordConfirmation.value) {
    showError(t('auth.forgotPassword.passwordMismatch'))
    return false
  }

  if (!walletSameAsPassword.value) {
    const walletError = validatePasswordValue(
      walletPassword.value,
      t('auth.signup.withdrawalPassword'),
    )
    if (walletError) {
      showError(walletError)
      return false
    }

    if (walletPassword.value !== walletPasswordConfirmation.value) {
      showError(t('auth.forgotPassword.walletPasswordMismatch'))
      return false
    }
  }

  return true
}

async function handleSendOtp() {
  if (!validateIdentity()) return

  sendingOtp.value = true
  successMessage.value = ''
  try {
    const response = await sendForgotPasswordOtp({
      username: username.value.trim(),
      phone_number: fullPhoneNumber.value,
    })
    getResponseData(response)
    otpSent.value = true
    otpVerified.value = false
    otpValue.value = ''
    successMessage.value = t('auth.forgotPassword.otpSentSuccess')
    showSuccess(t('auth.forgotPassword.otpSentWhatsapp'))
  } catch (error) {
    console.error('Forgot password OTP error:', error)
    if (error?.response?.status === 429) {
      otpSent.value = true
      otpVerified.value = false
      successMessage.value = t('auth.forgotPassword.otpSentSuccess')
      showSuccess(t('auth.forgotPassword.otpAlreadySent'))
    } else {
      showError(getApiError(error, t('auth.forgotPassword.otpSendFailed')))
    }
  } finally {
    sendingOtp.value = false
  }
}

async function handleVerifyOtp() {
  if (!OTP_PATTERN.test(otpValue.value)) {
    showError(t('auth.forgotPassword.otpInvalid'))
    return
  }

  verifyingOtp.value = true
  try {
    await verifyForgotPasswordOtp({
      username: username.value.trim(),
      otp: otpValue.value,
    })
    otpVerified.value = true
    successMessage.value = ''
    step.value = 'reset'
    showSuccess(t('auth.forgotPassword.otpVerified'))
  } catch (error) {
    console.error('Forgot password verify OTP error:', error)
    otpVerified.value = false
    showError(getApiError(error, t('auth.forgotPassword.otpVerifyFailed')))
  } finally {
    verifyingOtp.value = false
  }
}

async function handleResetPassword() {
  if (!otpVerified.value) {
    showError(t('auth.forgotPassword.verifyOtpFirst'))
    step.value = 'verify'
    return
  }

  if (!validatePasswords()) return

  const finalWalletPassword = walletSameAsPassword.value ? password.value : walletPassword.value
  const finalWalletPasswordConfirmation = walletSameAsPassword.value
    ? password.value
    : walletPasswordConfirmation.value

  resetLoading.value = true
  try {
    await resetForgotPassword({
      username: username.value.trim(),
      otp: otpValue.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
      withdrawal_password: finalWalletPassword,
      withdrawal_password_confirmation: finalWalletPasswordConfirmation,
    })
    showSuccess(t('auth.forgotPassword.resetSuccess'))
    await new Promise(resolve => setTimeout(resolve, 500))
    closeForgotPasswordModal()
    await router.push('/login')
  } catch (error) {
    console.error('Forgot password reset error:', error)
    showError(getApiError(error, t('auth.forgotPassword.resetFailed')))
  } finally {
    resetLoading.value = false
  }
}

onMounted(async () => {
  if (!settingsStore.settings) {
    await settingsStore.fetchSettings()
  }
})
</script>

<style scoped>
.login-modal-root {
  position: fixed;
  inset: 0;
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(1.25rem, 6vh) clamp(0.75rem, 3vw, 1.5rem);
  box-sizing: border-box;
  overflow-y: auto;
}

.login-modal-backdrop {
  position: absolute;
  inset: 0;
}

.login-modal-panel {
  position: relative;
  z-index: 1;
  width: min(100%, 450px);
  max-width: 450px;
  max-height: none;
  margin: auto;
  overflow-y: visible;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-self: center;
}

.login-modal-inner {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .login-modal-root {
    align-items: flex-start !important;
    justify-content: center !important;
    padding-top: clamp(5rem, 18vh, 9rem) !important;
    padding-bottom: 2.5rem !important;
  }

  .login-modal-panel {
    margin: 0 auto !important;
  }
}
</style>
