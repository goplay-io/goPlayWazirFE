<template>
  <section class="auth-ref-signup">
    <div v-if="!otpSent" class="auth-ref-signup-step">
      <div class="auth-ref-field">
        <label class="auth-ref-field-label auth-ref-field-label--semibold" for="auth-signup-phone">
          {{ t('auth.login.mobileNumber') }}
        </label>
        <div class="auth-ref-phone-row">
          <div class="auth-ref-phone-prefix">
            <span class="auth-ref-phone-code">+91</span>
            <span class="auth-ref-phone-flag" aria-hidden="true">🇮🇳</span>
          </div>
          <input
            id="auth-signup-phone"
            v-model="phoneNumber"
            type="tel"
            inputmode="numeric"
            maxlength="10"
            autocomplete="tel"
            class="auth-ref-phone-input"
            :placeholder="t('auth.signup.enterPhoneNumber')"
            @input="onPhoneInput"
          />
        </div>
      </div>

      <button
        type="button"
        class="auth-ref-btn auth-ref-btn--shimmer"
        :disabled="getOtpDisabled || sendingOtp"
        :aria-busy="sendingOtp"
        @click="handleGetOtp"
      >
        <span v-if="sendingOtp" class="auth-ref-btn__spinner" />
        <span v-else class="auth-ref-btn__label">{{ t('auth.signup.getOtp') }}</span>
        <span class="auth-ref-shimmer" aria-hidden="true" />
      </button>
    </div>

    <form v-else class="auth-ref-signup-step" @submit.prevent="handleRegister">
      <div class="auth-ref-field">
        <label class="auth-ref-field-label">{{ t('auth.login.mobileNumber') }}</label>
        <div class="auth-ref-phone-row auth-ref-phone-row--readonly">
          <div class="auth-ref-phone-prefix">
            <span class="auth-ref-phone-code">+91</span>
            <span class="auth-ref-phone-flag" aria-hidden="true">🇮🇳</span>
          </div>
          <input
            type="text"
            readonly
            tabindex="-1"
            class="auth-ref-phone-input"
            :value="phoneNumber"
          />
          <button
            type="button"
            class="auth-ref-phone-edit"
            :aria-label="t('auth.signup.editPhone')"
            @click="handleEditPhone"
          >
            <v-icon size="20">mdi-pencil-outline</v-icon>
          </button>
        </div>
        <div class="auth-ref-phone-count">{{ phoneNumber.length }}/10</div>
      </div>

      <div class="auth-ref-field">
        <label class="auth-ref-field-label">{{ t('auth.signup.enterOtp') }}</label>
        <div class="auth-ref-otp-grid">
          <input
            v-for="(_, index) in otpDigits"
            :key="index"
            :ref="el => { if (el) otpInputRefs[index] = el }"
            v-model="otpDigits[index]"
            type="text"
            inputmode="numeric"
            maxlength="1"
            class="auth-ref-otp-cell"
            autocomplete="one-time-code"
            @input="onOtpDigitInput(index, $event)"
            @keydown="onOtpKeydown(index, $event)"
            @paste.prevent="index === 0 ? onOtpPaste($event) : null"
          />
        </div>
        <div class="auth-ref-otp-resend-row">
          <span v-if="otpSecondsRemaining > 0" class="auth-ref-otp-timer">
            {{ t('auth.signup.resendOtpIn') }} {{ formatResendTimer }}
          </span>
          <button
            v-else
            type="button"
            class="auth-ref-otp-resend-btn"
            :disabled="sendingOtp"
            @click="handleGetOtp"
          >
            {{ t('auth.signup.resendOtp') }}
          </button>
        </div>
      </div>

      <div class="auth-ref-field">
        <label class="auth-ref-field-label auth-ref-field-label--semibold" for="auth-signup-username">
          {{ t('auth.login.username') }}
        </label>
        <input
          id="auth-signup-username"
          v-model="username"
          type="text"
          autocomplete="username"
          class="auth-ref-input"
          :placeholder="t('auth.login.enterUsername')"
          @input="errors.username = ''"
          @blur="validateUsernameField"
        />
        <p v-if="errors.username" class="auth-ref-field-error">{{ errors.username }}</p>
      </div>

      <div class="auth-ref-field">
        <label class="auth-ref-field-label auth-ref-field-label--semibold" for="auth-signup-password">
          {{ t('auth.login.password') }}
        </label>
        <div class="auth-ref-input-wrap">
          <input
            id="auth-signup-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            class="auth-ref-input"
            :placeholder="t('auth.signup.enterYourPassword')"
            @input="errors.password = ''"
          />
          <button
            type="button"
            class="auth-ref-input-toggle"
            :aria-label="showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')"
            @click="showPassword = !showPassword"
          >
            <v-icon size="16">{{ showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline' }}</v-icon>
          </button>
        </div>
      </div>

      <div class="auth-ref-field">
        <label class="auth-ref-field-label auth-ref-field-label--semibold" for="auth-signup-password-confirm">
          {{ t('auth.forgotPassword.confirmPassword') }}
        </label>
        <div class="auth-ref-input-wrap">
          <input
            id="auth-signup-password-confirm"
            v-model="passwordConfirm"
            :type="showConfirmPassword ? 'text' : 'password'"
            autocomplete="new-password"
            class="auth-ref-input"
            :placeholder="t('auth.signup.enterPasswordConfirm')"
            @input="errors.passwordConfirm = ''"
          />
          <button
            type="button"
            class="auth-ref-input-toggle"
            :aria-label="showConfirmPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <v-icon size="16">{{ showConfirmPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline' }}</v-icon>
          </button>
        </div>
        <p v-if="passwordConfirm && password !== passwordConfirm" class="auth-ref-field-error">
          {{ t('auth.signup.passwordMismatch') }}
        </p>
      </div>

      <div class="auth-ref-field">
        <label class="auth-ref-field-label auth-ref-field-label--semibold" for="auth-signup-campaign">
          {{ t('auth.signup.campaignId') }}
        </label>
        <input
          id="auth-signup-campaign"
          v-model="campaignCode"
          type="text"
          class="auth-ref-input"
          :placeholder="t('auth.signup.campaignIdPlaceholder')"
          :disabled="campaignLocked"
          @blur="campaignCode = campaignCode.trim().toLowerCase()"
        />
      </div>

      <button
        type="submit"
        class="auth-ref-btn auth-ref-btn--shimmer"
        :disabled="registerDisabled || loading"
        :aria-busy="loading"
      >
        <span v-if="loading" class="auth-ref-btn__spinner" />
        <span v-else class="auth-ref-btn__label">{{ t('auth.login.registerCta') }}</span>
        <span class="auth-ref-shimmer" aria-hidden="true" />
      </button>
    </form>

    <p class="auth-ref-footer">
      {{ t('auth.signup.alreadyHaveAccount') }}
      <button type="button" @click="emit('sign-in-click')">{{ t('auth.signup.loginLink') }}</button>
    </p>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import { signup, sendSignupOtp, verifySignupOtp } from '@/api/user/login.js'

const OTP_LENGTH = 6
const DEFAULT_LAST_NAME = 'user'
const RESEND_SECONDS = 60

const props = defineProps({
  initialCampaignId: { type: String, default: '' },
  initialReferralId: { type: String, default: '' },
})

const emit = defineEmits(['sign-in-click', 'success'])

const { t } = useI18n()
const { showSuccess, showError } = useSnackbar()

const phoneNumber = ref('')
const otpDigits = ref(Array(OTP_LENGTH).fill(''))
const otpInputRefs = ref([])
const username = ref('')
const password = ref('')
const passwordConfirm = ref('')
const campaignCode = ref('')
const campaignLocked = ref(false)
const otpSent = ref(false)
const sendingOtp = ref(false)
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const otpExpiresAt = ref(null)
const tickNow = ref(Date.now())
let tickInterval = null

const errors = reactive({
  username: '',
  password: '',
  passwordConfirm: '',
})

const fullPhoneNumber = computed(() => {
  const digits = phoneNumber.value.replace(/\D/g, '')
  return digits ? `+91${digits}` : ''
})

const otp = computed(() => otpDigits.value.join(''))

const getOtpDisabled = computed(() => phoneNumber.value.length !== 10)

const otpSecondsRemaining = computed(() => {
  const exp = otpExpiresAt.value
  if (!exp || exp <= tickNow.value) return 0
  return Math.ceil((exp - tickNow.value) / 1000)
})

const formatResendTimer = computed(() => {
  const sec = otpSecondsRemaining.value
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const registerDisabled = computed(() => {
  const name = username.value.trim()
  return (
    otp.value.length !== OTP_LENGTH
    || !name
    || name.length < 3
    || !password.value
    || !passwordConfirm.value
    || password.value !== passwordConfirm.value
    || !!errors.username
  )
})

function resetForm() {
  phoneNumber.value = ''
  otpDigits.value = Array(OTP_LENGTH).fill('')
  username.value = ''
  password.value = ''
  passwordConfirm.value = ''
  otpSent.value = false
  sendingOtp.value = false
  loading.value = false
  showPassword.value = false
  showConfirmPassword.value = false
  otpExpiresAt.value = null
  errors.username = ''
  errors.password = ''
  errors.passwordConfirm = ''
}

defineExpose({ resetForm })

function onPhoneInput(event) {
  phoneNumber.value = String(event.target.value || '').replace(/\D/g, '').slice(0, 10)
}

function onOtpDigitInput(index, event) {
  const val = String(event.target.value || '').replace(/\D/g, '')
  otpDigits.value[index] = val.slice(-1)
  if (val && index < OTP_LENGTH - 1) {
    nextTick(() => otpInputRefs.value[index + 1]?.focus())
  }
}

function onOtpKeydown(index, event) {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    nextTick(() => otpInputRefs.value[index - 1]?.focus())
  }
}

function onOtpPaste(event) {
  const text = (event.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
  text.split('').forEach((ch, i) => { otpDigits.value[i] = ch })
  nextTick(() => otpInputRefs.value[Math.min(text.length, OTP_LENGTH - 1)]?.focus())
}

function getApiError(err, fallback) {
  const data = err?.response?.data
  const fieldMsg = Array.isArray(data?.errors) ? data.errors[0]?.msg : null
  return fieldMsg || data?.message || err?.message || fallback
}

function validateUsernameField() {
  const name = username.value.trim()
  if (!name || name.length < 3 || name.length > 220) {
    errors.username = t('auth.signup.usernameLength')
    return false
  }
  if (/\s/.test(name)) {
    errors.username = t('auth.signup.usernameNoSpaces')
    return false
  }
  errors.username = ''
  return true
}

function validateRegisterForm() {
  if (!validateUsernameField()) return false
  if (password.value.length < 8) {
    showError(t('auth.signup.passwordMin'))
    return false
  }
  if (password.value !== passwordConfirm.value) {
    showError(t('auth.signup.passwordMismatch'))
    return false
  }
  if (otp.value.length !== OTP_LENGTH) {
    showError(t('auth.signup.otpInvalid'))
    return false
  }
  return true
}

function startResendTimer(seconds = RESEND_SECONDS) {
  otpExpiresAt.value = Date.now() + seconds * 1000
}

async function handleGetOtp() {
  if (getOtpDisabled.value) return

  const provisionalUsername = phoneNumber.value.trim()
  sendingOtp.value = true
  try {
    const res = await sendSignupOtp({
      username: provisionalUsername,
      phone_number: fullPhoneNumber.value,
    })
    otpSent.value = true
    otpDigits.value = Array(OTP_LENGTH).fill('')
    username.value = username.value || provisionalUsername
    const expiresAt = res?.data?.data?.expires_at ?? res?.data?.expires_at
    startResendTimer(typeof expiresAt === 'number' ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)) : RESEND_SECONDS)
    showSuccess(t('auth.signup.otpSent'))
    await nextTick()
    otpInputRefs.value[0]?.focus()
  } catch (err) {
    const expiresAt = err?.response?.data?.expires_at
    if (err?.response?.status === 429 && typeof expiresAt === 'number') {
      otpSent.value = true
      startResendTimer(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)))
      showSuccess(t('auth.signup.otpAlreadySentUseOrResend'))
    } else {
      showError(getApiError(err, t('auth.signup.otpSendFailed')))
    }
  } finally {
    sendingOtp.value = false
  }
}

function handleEditPhone() {
  otpSent.value = false
  otpDigits.value = Array(OTP_LENGTH).fill('')
  username.value = ''
  password.value = ''
  passwordConfirm.value = ''
  otpExpiresAt.value = null
}

async function handleRegister() {
  if (!validateRegisterForm()) return

  loading.value = true
  try {
    await verifySignupOtp({ otp: otp.value.trim() })
    const name = username.value.trim()
    const referral = (campaignCode.value || props.initialReferralId || props.initialCampaignId || '').trim()
    await signup({
      username: name,
      first_name: name,
      last_name: DEFAULT_LAST_NAME,
      otp: otp.value.trim(),
      password: password.value,
      domain: import.meta.env.VITE_SIGNUP_DOMAIN || '',
      ...(referral ? { campaign_id: referral } : {}),
    })
    showSuccess(t('auth.signup.success'))
    emit('success')
  } catch (error) {
    showError(getApiError(error, t('auth.signup.failed')))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const referral = props.initialReferralId || props.initialCampaignId || ''
  campaignCode.value = referral
  campaignLocked.value = Boolean(referral)
  tickInterval = setInterval(() => { tickNow.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (tickInterval) clearInterval(tickInterval)
})
</script>
