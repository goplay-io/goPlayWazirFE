<template>
  <div class="auth-ref-forgot">
    <div class="auth-ref-form auth-ref-form--forgot">
      <div class="auth-ref-field">
        <label class="auth-ref-field-label">
          {{ method === 'mobile' ? t('auth.login.mobileNumber') : t('auth.login.username') }}
        </label>
        <div class="auth-ref-composite-row">
          <div ref="methodDropdownRef" class="auth-ref-method-dropdown">
            <button
              type="button"
              class="auth-ref-method-trigger"
              :aria-expanded="methodDropdownOpen"
              aria-haspopup="listbox"
              @click="methodDropdownOpen = !methodDropdownOpen"
            >
              <span>{{ methodLabel }}</span>
              <v-icon
                size="22"
                class="auth-ref-method-chevron"
                :class="{ 'auth-ref-method-chevron--open': methodDropdownOpen }"
              >
                mdi-menu-down
              </v-icon>
            </button>
            <ul v-if="methodDropdownOpen" role="listbox" class="auth-ref-method-menu">
              <li>
                <button
                  type="button"
                  role="option"
                  :aria-selected="method === 'mobile'"
                  :class="{ 'auth-ref-method-option--active': method === 'mobile' }"
                  class="auth-ref-method-option"
                  @click="pickMethod('mobile')"
                >
                  {{ t('auth.forgotPassword.mobileLabel') }}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="option"
                  :aria-selected="method === 'username'"
                  :class="{ 'auth-ref-method-option--active': method === 'username' }"
                  class="auth-ref-method-option"
                  @click="pickMethod('username')"
                >
                  {{ t('auth.login.username') }}
                </button>
              </li>
            </ul>
          </div>

          <div v-if="method === 'mobile'" class="auth-ref-composite-input">
            <span class="auth-ref-composite-prefix">+91 🇮🇳</span>
            <input
              id="auth-forgot-phone"
              v-model="mobile"
              type="tel"
              inputmode="numeric"
              maxlength="10"
              class="auth-ref-composite-field"
              :placeholder="t('auth.login.mobileNumber')"
              @input="onMobileInput"
            />
          </div>
          <input
            v-else
            v-model="username"
            type="text"
            class="auth-ref-composite-field auth-ref-composite-field--solo"
            :placeholder="t('auth.login.enterUsername')"
            @input="onUsernameInput"
          />

          <button
            type="button"
            class="auth-ref-composite-otp-btn"
            :disabled="getOtpDisabled || sendingOtp"
            :aria-busy="sendingOtp"
            @click="handleSendOtp"
          >
            <span v-if="sendingOtp" class="auth-ref-btn__spinner auth-ref-btn__spinner--sm" />
            <span v-else>{{ t('auth.signup.getOtp') }}</span>
          </button>
        </div>
      </div>

      <div class="auth-ref-field">
        <label class="auth-ref-field-label" for="auth-forgot-otp">{{ t('auth.signup.otp') }}</label>
        <input
          id="auth-forgot-otp"
          v-model="otp"
          type="text"
          inputmode="numeric"
          maxlength="6"
          class="auth-ref-input"
          :class="{ 'auth-ref-input--disabled': !otpSent }"
          :disabled="!otpSent"
          :placeholder="t('auth.signup.enterOtp')"
          autocomplete="one-time-code"
          @input="onOtpInput"
        />
      </div>

      <div class="auth-ref-field">
        <label class="auth-ref-field-label" for="auth-forgot-password">{{ t('auth.login.password') }}</label>
        <div class="auth-ref-input-wrap" :class="{ 'auth-ref-input-wrap--disabled': !otpSent }">
          <input
            id="auth-forgot-password"
            v-model="newPassword"
            :type="showPassword ? 'text' : 'password'"
            class="auth-ref-input"
            :disabled="!otpSent"
            :placeholder="t('auth.login.enterPassword')"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="auth-ref-input-toggle"
            :disabled="!otpSent"
            :aria-label="showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')"
            @click="showPassword = !showPassword"
          >
            <v-icon size="16">{{ showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline' }}</v-icon>
          </button>
        </div>
      </div>

      <div class="auth-ref-field">
        <label class="auth-ref-field-label" for="auth-forgot-confirm">{{ t('auth.forgotPassword.confirmPassword') }}</label>
        <div class="auth-ref-input-wrap" :class="{ 'auth-ref-input-wrap--disabled': !otpSent }">
          <input
            id="auth-forgot-confirm"
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="auth-ref-input"
            :disabled="!otpSent"
            :placeholder="t('auth.forgotPassword.confirmPassword')"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="auth-ref-input-toggle"
            :disabled="!otpSent"
            :aria-label="showConfirmPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <v-icon size="16">{{ showConfirmPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline' }}</v-icon>
          </button>
        </div>
      </div>

      <button
        type="button"
        class="auth-ref-btn"
        :disabled="!otpSent || resetting"
        :aria-busy="resetting"
        @click="handleResetPassword"
      >
        <span v-if="resetting" class="auth-ref-btn__spinner" />
        <span v-else>{{ t('auth.forgotPassword.changePassword') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPassword,
} from '@/api/user/login.js'

const emit = defineEmits(['success'])

const { t } = useI18n()
const { showSuccess, showError } = useSnackbar()

const method = ref('mobile')
const username = ref('')
const mobile = ref('')
const otp = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const otpSent = ref(false)
const sendingOtp = ref(false)
const resetting = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const methodDropdownOpen = ref(false)
const methodDropdownRef = ref(null)

const methodLabel = computed(() =>
  method.value === 'mobile' ? t('auth.forgotPassword.mobileLabel') : t('auth.login.username'),
)

const getOtpDisabled = computed(() =>
  method.value === 'mobile' ? !/^\d{10}$/.test(mobile.value) : !username.value.trim(),
)

function resetForm() {
  method.value = 'mobile'
  username.value = ''
  mobile.value = ''
  otp.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  otpSent.value = false
  sendingOtp.value = false
  resetting.value = false
  showPassword.value = false
  showConfirmPassword.value = false
  methodDropdownOpen.value = false
}

defineExpose({ resetForm })

function resolveIdentity() {
  if (method.value === 'mobile') {
    const digits = mobile.value.replace(/\D/g, '')
    return {
      username: digits,
      phone_number: digits ? `+91${digits}` : '',
    }
  }
  const name = username.value.trim()
  return { username: name, phone_number: '' }
}

function getApiError(error, fallback) {
  const data = error?.response?.data
  const fieldMsg = Array.isArray(data?.errors) ? data.errors[0]?.msg : null
  return fieldMsg || data?.message || error?.message || fallback
}

function onUsernameInput(event) {
  username.value = String(event.target.value || '').replace(/\s/g, '')
}

function onMobileInput(event) {
  mobile.value = String(event.target.value || '').replace(/\D/g, '').slice(0, 10)
}

function onOtpInput(event) {
  otp.value = String(event.target.value || '').replace(/\D/g, '').slice(0, 6)
}

function pickMethod(nextMethod) {
  method.value = nextMethod
  username.value = ''
  mobile.value = ''
  methodDropdownOpen.value = false
}

function onDocumentClick(event) {
  if (!methodDropdownOpen.value) return
  if (methodDropdownRef.value && !methodDropdownRef.value.contains(event.target)) {
    methodDropdownOpen.value = false
  }
}

async function handleSendOtp() {
  const identity = resolveIdentity()
  if (!identity.username) {
    showError(method.value === 'mobile' ? t('auth.forgotPassword.phoneInvalid') : t('auth.forgotPassword.usernameRequired'))
    return
  }

  sendingOtp.value = true
  try {
    await sendForgotPasswordOtp({
      username: identity.username,
      ...(identity.phone_number ? { phone_number: identity.phone_number } : {}),
    })
    otpSent.value = true
    showSuccess(t('auth.forgotPassword.otpSentWhatsapp'))
  } catch (error) {
    if (error?.response?.status === 429) {
      otpSent.value = true
      showSuccess(t('auth.forgotPassword.otpAlreadySent'))
    } else {
      showError(getApiError(error, t('auth.forgotPassword.otpSendFailed')))
    }
  } finally {
    sendingOtp.value = false
  }
}

function validatePasswords() {
  if (!newPassword.value || newPassword.value.length < 8) {
    showError(t('auth.forgotPassword.minLength', { field: t('auth.login.password') }))
    return false
  }
  if (newPassword.value !== confirmPassword.value) {
    showError(t('auth.forgotPassword.passwordMismatch'))
    return false
  }
  if (!/^\d{6}$/.test(otp.value)) {
    showError(t('auth.forgotPassword.otpInvalid'))
    return false
  }
  return true
}

async function handleResetPassword() {
  if (!otpSent.value) return
  if (!validatePasswords()) return

  const identity = resolveIdentity()
  resetting.value = true
  try {
    await verifyForgotPasswordOtp({
      username: identity.username,
      otp: otp.value,
    })
    await resetForgotPassword({
      username: identity.username,
      otp: otp.value,
      password: newPassword.value,
      password_confirmation: confirmPassword.value,
      withdrawal_password: newPassword.value,
      withdrawal_password_confirmation: confirmPassword.value,
    })
    showSuccess(t('auth.forgotPassword.resetSuccess'))
    emit('success')
  } catch (error) {
    showError(getApiError(error, t('auth.forgotPassword.resetFailed')))
  } finally {
    resetting.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocumentClick)
})
</script>
