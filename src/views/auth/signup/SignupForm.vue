<template>
  <div class="signup-form-root">
    <div class="signup-step-wrap">
      <Transition name="step-slide">
        <!-- Step 1: account details + password -->
        <div v-if="step === 1" key="step1" class="signup-ref-form">
          <SignupPlainField
            v-model="username"
            :placeholder="t('auth.signup.enterUsername')"
            autocomplete="username"
            :error="errors.username"
            input-id="signup-username"
            @input="onUsernameInput($event)"
          />

          <SignupPlainField
            v-model="phoneDisplay"
            :placeholder="t('auth.signup.enterPhone')"
            type="tel"
            inputmode="numeric"
            maxlength="15"
            prefix="+91"
            autocomplete="tel"
            :error="errors.phone"
            input-id="signup-phone"
            @input="onPhoneInput($event); errors.phone = ''"
          />

          <SignupPlainField
            v-model="password"
            :placeholder="t('auth.signup.enterPassword')"
            autocomplete="new-password"
            password-toggle
            :error="errors.password"
            input-id="signup-password"
            :show-password-label="t('auth.login.showPassword')"
            :hide-password-label="t('auth.login.hidePassword')"
            @input="errors.password = ''"
          />

          <SignupPlainField
            v-model="passwordConfirm"
            :placeholder="t('auth.signup.enterPasswordConfirm')"
            autocomplete="new-password"
            password-toggle
            :error="errors.passwordConfirm"
            input-id="signup-password-confirm"
            :show-password-label="t('auth.login.showPassword')"
            :hide-password-label="t('auth.login.hidePassword')"
            @input="errors.passwordConfirm = ''"
          />

          <SignupPlainField
            v-model="referralId"
            :placeholder="t('auth.signup.referralIdPlaceholder')"
            autocomplete="off"
            input-id="signup-referral-id"
          />

          <div class="signup-ref-form__actions">
            <button
              type="button"
              class="signup-ref-submit-btn"
              :class="{ 'auth-page-btn--loading': sendingOtp }"
              :disabled="!canProceedStep1 || sendingOtp"
              :aria-busy="sendingOtp"
              @click="handleProceedToOtp"
            >
              <span v-if="sendingOtp" class="auth-page-btn__spinner" />
              <span v-else>{{ t('auth.signup.signupButton') }}</span>
            </button>
          </div>

          <p class="signup-ref-terms">
            {{ t('auth.signup.agreeTermsPrefix') }}
            <router-link to="/terms-and-conditions" class="signup-ref-terms__link">
              {{ t('auth.signup.agreeTermsLink') }}
            </router-link>
          </p>
        </div>

        <!-- Step 2: OTP verification -->
        <div v-else key="step2" class="signup-ref-form signup-ref-form--otp">
          <div class="signup-ref-otp-block">
            <p class="signup-ref-otp-hint">{{ t('auth.signup.otpStepHint') }}</p>

            <div class="signup-ref-otp-boxes">
              <template v-for="(_, i) in otpDigits" :key="i">
                <input
                  :ref="el => { if (el) otpInputRefs[i] = el }"
                  v-model="otpDigits[i]"
                  @input="onOtpDigitInput(i, $event)"
                  @keydown="onOtpKeydown(i, $event)"
                  @paste.prevent="onOtpPaste($event)"
                  type="text"
                  inputmode="numeric"
                  maxlength="1"
                  class="signup-ref-otp-digit"
                  :disabled="otpVerified"
                  autocomplete="one-time-code"
                />
              </template>
            </div>

            <Transition name="verify-toggle" mode="out-in">
              <span v-if="otpVerified" key="verified" class="signup-ref-otp-verified">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </span>
            </Transition>

            <button
              type="button"
              class="signup-ref-verify-otp-btn"
              :class="{ 'auth-page-btn--loading': verifyingOtp || loading }"
              :disabled="!otpValidForVerify || verifyingOtp || otpVerified || loading"
              :aria-busy="verifyingOtp || loading"
              @click="handleVerifyAndSignup"
            >
              <span v-if="verifyingOtp || loading" class="signup-spinner" />
              <span v-else>{{ t('auth.signup.verifyOtp') }}</span>
            </button>

            <div class="signup-ref-otp-resend-wrap">
              <span v-if="otpCountdownText" class="signup-ref-otp-countdown">{{ otpCountdownText }}</span>
              <button
                v-else-if="!otpVerified"
                type="button"
                class="signup-ref-otp-resend"
                :disabled="sendingOtp"
                @click="handleSendOtp"
              >
                {{ t('auth.signup.resendOtp') }}
              </button>
            </div>

            <button type="button" class="signup-ref-otp-back" @click="handleBackToStep1">
              {{ t('auth.signup.goBack') }}
            </button>
          </div>
        </div>
      </Transition>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar';
import { signup, sendSignupOtp, verifySignupOtp } from '@/api/user/login.js';
import SignupPlainField from '@/components/auth/SignupPlainField.vue';

const props = defineProps({
  initialCampaignId: { type: String, default: '' },
  initialReferralId: { type: String, default: '' },
});

const { t } = useI18n();
const router = useRouter();
const route  = useRoute();
const { showSuccess, showError } = useSnackbar();

const OTP_LENGTH = 6;
const DEFAULT_LAST_NAME = 'user';

const emit = defineEmits(['step-change']);

const step = ref(1);

const errors = reactive({
  phone: '',
  username: '',
  password: '',
  passwordConfirm: '',
});

function clearErrors() {
  Object.keys(errors).forEach(k => { errors[k] = ''; });
}

const username = ref('');
const phoneDisplay = ref('');

const password = ref('');
const passwordConfirm = ref('');
const referralId = ref('');
const loading = ref(false);

const otpDigits = ref(Array(OTP_LENGTH).fill(''));
const otpInputRefs = ref([]);
const otpSent = ref(false);
const otpVerified = ref(false);
const otpExpiresAt = ref(null);
const sendingOtp = ref(false);
const verifyingOtp = ref(false);
const tickNow = ref(Date.now());
let tickInterval = null;

const fullPhoneNumber = computed(() => {
  const digits = String(phoneDisplay.value || '').replace(/\D/g, '');
  return digits ? `+91${digits}` : '';
});

const otp = computed(() => otpDigits.value.join(''));

const canProceedStep1 = computed(() => {
  const name = (username.value || '').trim();
  return !!fullPhoneNumber.value
    && !!name
    && name.length >= 3
    && name.length <= 220
    && !!password.value
    && !!passwordConfirm.value;
});

const otpSecondsRemaining = computed(() => {
  const exp = otpExpiresAt.value;
  if (!exp || exp <= tickNow.value) return 0;
  return Math.ceil((exp - tickNow.value) / 1000);
});

watch(otpSecondsRemaining, (sec) => {
  if (sec <= 0 && otpVerified.value) otpVerified.value = false;
});

watch(step, (value) => {
  emit('step-change', value);
}, { immediate: true });

const otpValidForVerify = computed(() => {
  const v = otp.value.trim();
  return v.length === OTP_LENGTH && /^\d+$/.test(v);
});

const otpCountdownText = computed(() => {
  const sec = otpSecondsRemaining.value;
  if (sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return t('auth.signup.otpRequestAgainIn', { time: `${m}:${String(s).padStart(2, '0')}` });
});

function onPhoneInput(e) {
  phoneDisplay.value = String(e.target.value || '').replace(/\D/g, '').slice(0, 15);
}

function onUsernameInput(e) {
  const raw = e.target.value;
  if (/\s/.test(raw)) {
    username.value = raw.replace(/\s/g, '');
    errors.username = t('auth.signup.usernameNoSpaces');
  } else {
    errors.username = '';
  }
}

function onOtpDigitInput(index, e) {
  const val = e.target.value.replace(/\D/g, '');
  otpDigits.value[index] = val.slice(-1);
  if (val && index < OTP_LENGTH - 1) nextTick(() => otpInputRefs.value[index + 1]?.focus());
}

function onOtpKeydown(index, e) {
  if (e.key === 'Backspace' && !otpDigits.value[index] && index > 0)
    nextTick(() => otpInputRefs.value[index - 1]?.focus());
}

function onOtpPaste(e) {
  const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
  text.split('').forEach((ch, i) => { otpDigits.value[i] = ch; });
  nextTick(() => otpInputRefs.value[Math.min(text.length, OTP_LENGTH - 1)]?.focus());
}

function getApiError(err, fallback) {
  const data = err?.response?.data;
  const fieldMsg = Array.isArray(data?.errors) ? data.errors[0]?.msg : null;
  return fieldMsg || data?.message || err?.message || fallback;
}

function validateStep1() {
  clearErrors();
  const name = (username.value || '').trim();
  const pwd = password.value;
  let valid = true;

  if (!name || name.length < 3 || name.length > 220) {
    errors.username = t('auth.signup.usernameLength');
    valid = false;
  } else if (/\s/.test(name)) {
    errors.username = t('auth.signup.usernameNoSpaces');
    valid = false;
  }

  if (!fullPhoneNumber.value) {
    errors.phone = t('auth.signup.phoneInvalid');
    valid = false;
  }

  if (!pwd) {
    errors.password = t('validation.required');
    valid = false;
  } else if (pwd.length < 8) {
    errors.password = t('auth.signup.passwordMin');
    valid = false;
  } else if (!/[a-zA-Z]/.test(pwd)) {
    errors.password = t('auth.signup.passwordLetters');
    valid = false;
  } else if (!/[0-9]/.test(pwd)) {
    errors.password = t('auth.signup.passwordNumbers');
    valid = false;
  }

  if (pwd !== passwordConfirm.value) {
    errors.passwordConfirm = t('auth.signup.passwordMismatch');
    valid = false;
  }

  if (!valid) showError(t('validation.required'));
  return valid;
}

async function handleSendOtp() {
  const name = (username.value || '').trim();
  if (!name || name.length < 3 || name.length > 220) { showError(t('auth.signup.usernameLength')); return; }
  if (/\s/.test(name)) { showError(t('auth.signup.usernameNoSpaces')); return; }
  if (!fullPhoneNumber.value) { showError(t('auth.signup.phoneInvalid')); return; }

  sendingOtp.value = true;
  try {
    const res = await sendSignupOtp({ username: name, phone_number: fullPhoneNumber.value });
    otpSent.value = true;
    otpVerified.value = false;
    otpDigits.value = Array(OTP_LENGTH).fill('');
    const expiresAt = res?.data?.data?.expires_at ?? res?.data?.expires_at;
    if (typeof expiresAt === 'number') otpExpiresAt.value = expiresAt;
    showSuccess(t('auth.signup.otpSent'));
    await nextTick();
    otpInputRefs.value[0]?.focus();
  } catch (err) {
    console.error('Send OTP error:', err);
    const expiresAt = err?.response?.data?.expires_at;
    if (typeof expiresAt === 'number') otpExpiresAt.value = expiresAt;
    if (err?.response?.status === 429 && typeof expiresAt === 'number') {
      otpSent.value = true;
      otpVerified.value = false;
      showSuccess(t('auth.signup.otpAlreadySentUseOrResend'));
    } else {
      showError(getApiError(err, t('auth.signup.otpSendFailed')));
    }
  } finally {
    sendingOtp.value = false;
  }
}

async function handleProceedToOtp() {
  if (!validateStep1()) return;
  await handleSendOtp();
  if (otpSent.value) step.value = 2;
}

function handleBackToStep1() {
  step.value = 1;
  otpSent.value = false;
  otpVerified.value = false;
  otpDigits.value = Array(OTP_LENGTH).fill('');
  otpExpiresAt.value = null;
}

async function handleSignup() {
  const name = (username.value || '').trim();
  const referral = (referralId.value || '').trim();
  const campaignFromRoute = String(route.query?.campaign_id || route.query?.campaignId || route.query?.campign_id || '').trim();
  const referralPayload = referral || campaignFromRoute || props.initialCampaignId || props.initialReferralId;

  loading.value = true;
  try {
    await signup({
      username: name,
      first_name: name,
      last_name: DEFAULT_LAST_NAME,
      otp: otp.value.trim(),
      password: password.value,
      domain: import.meta.env.VITE_SIGNUP_DOMAIN || '',
      ...(referralPayload ? { campaign_id: referralPayload } : {}),
    });
    showSuccess(t('auth.signup.success'));
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.replace('/login');
  } catch (error) {
    console.error('Signup error:', error);
    showError(getApiError(error, t('auth.signup.failed')));
  } finally {
    loading.value = false;
  }
}

async function handleVerifyAndSignup() {
  if (!otpValidForVerify.value) { showError(t('auth.signup.otpInvalid')); return; }
  verifyingOtp.value = true;
  try {
    await verifySignupOtp({ otp: otp.value.trim() });
    otpVerified.value = true;
    showSuccess(t('auth.signup.otpVerified'));
    await handleSignup();
  } catch (err) {
    console.error('Verify OTP error:', err);
    showError(getApiError(err, t('auth.signup.otpVerifyFailed')));
  } finally {
    verifyingOtp.value = false;
  }
}

onMounted(() => {
  const fromQuery = [
    route.query?.referral_id,
    route.query?.referalId,
    route.query?.referralId,
    route.query?.campaign_id,
    route.query?.campaignId,
    route.query?.campign_id,
  ].map(v => String(Array.isArray(v) ? v[0] : v || '').trim()).find(Boolean) || '';

  referralId.value = props.initialReferralId || props.initialCampaignId || fromQuery;
  tickInterval = setInterval(() => { tickNow.value = Date.now(); }, 1000);
});

onUnmounted(() => {
  if (tickInterval) clearInterval(tickInterval);
});
</script>
