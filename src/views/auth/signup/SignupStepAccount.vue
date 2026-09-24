<template>
  <div class="signup-step1-fields">
    <div class="signup-username-phone-row">
      <div class="login-field-wrapper">
        <label class="login-field-label">
          <v-icon size="18" class="tw-mr-2">mdi-account-outline</v-icon>
          {{ t('auth.signup.username') }}
        </label>
        <v-text-field
          :model-value="username"
          @update:model-value="$emit('update:username', $event)"
          variant="outlined"
          :placeholder="t('auth.signup.enterUsername')"
          class="login-input-modern"
          :rules="[rules.required, rules.usernameLength]"
          hide-details="auto"
          density="comfortable"
        />
      </div>
      <div class="login-field-wrapper">
        <label class="login-field-label">
          <v-icon size="18" class="tw-mr-2 signup-whatsapp-icon">mdi-whatsapp</v-icon>
          {{ t('auth.signup.phoneNumber') }}
        </label>
        <v-text-field
          :model-value="phoneDisplay"
          @update:model-value="$emit('update:phoneDisplay', $event)"
          type="tel"
          inputmode="numeric"
          maxlength="15"
          variant="outlined"
          :placeholder="t('auth.signup.enterPhone')"
          class="login-input-modern"
          :rules="[rules.required, rules.phone]"
          hide-details="auto"
          density="comfortable"
          :disabled="otpSent"
        >
          <template v-slot:prepend-inner>
            <span class="tw-text-theme-text tw-font-medium tw-mr-1">+91</span>
          </template>
          <template v-slot:append-inner>
            <v-btn
              v-if="!otpSent"
              type="button"
              size="small"
              variant="tonal"
              :loading="sendingOtp"
              :disabled="!canSendOtp || sendingOtp"
              class="tw-text-xs"
              @click="$emit('sendOtp')"
            >
              {{ t('auth.signup.sendOtp') }}
            </v-btn>
            <v-icon v-else size="20" class="tw-text-emerald-500">mdi-check-circle</v-icon>
          </template>
        </v-text-field>
      </div>
    </div>
    <Transition name="otp-reveal">
      <div v-if="otpSent" class="signup-otp-block">
        <label class="login-field-label signup-otp-label">
          <v-icon size="18" class="tw-mr-2">mdi-shield-key-outline</v-icon>
          {{ t('auth.signup.otpLabelWithVerify') }}
        </label>
        <div class="signup-otp-row signup-otp-row--first">
          <div class="signup-otp-boxes">
            <v-otp-input
              :model-value="otp"
              @update:model-value="$emit('update:otp', $event)"
              :length="6"
              variant="outlined"
              density="comfortable"
              class="signup-otp-input"
              :error="typeof rules.otp(otp) === 'string'"
              :disabled="otpVerified"
              hide-details
            />
            <Transition name="verify-done" mode="out-in">
              <div v-if="otpVerified" key="done" class="signup-otp-verified-wrap">
                <v-icon size="22" class="tw-text-emerald-500">mdi-check-circle</v-icon>
              </div>
              <div v-else key="pending" class="signup-otp-pending-wrap">
                <v-btn
                  type="button"
                  size="small"
                  :loading="verifyingOtp"
                  :disabled="!otpValidForVerify || verifyingOtp"
                  class="signup-verify-otp-btn"
                  @click="$emit('verifyOtp')"
                >
                  {{ t('auth.signup.verify') }}
                </v-btn>
              </div>
            </Transition>
          </div>
        </div>
        <div v-if="otpSent && (!otpVerified || !otpCountdownText)" class="signup-otp-row signup-otp-row--second">
          <span v-if="otpCountdownText" class="signup-otp-countdown">{{ otpCountdownText }}</span>
          <template v-else>
            <v-btn
              type="button"
              size="small"
              variant="tonal"
              :loading="sendingOtp"
              :disabled="sendingOtp"
              class="signup-resend-btn"
              @click="$emit('sendOtp')"
            >
              {{ t('auth.signup.resendOtp') }}
            </v-btn>
            <v-btn
              type="button"
              size="small"
              variant="text"
              class="signup-change-phone-btn"
              @click="$emit('changePhone')"
            >
              {{ t('auth.signup.changePhoneNumber') }}
            </v-btn>
          </template>
        </div>
      </div>
    </Transition>
    <div class="signup-step-actions signup-step1-actions">
      <div></div>
      <v-btn class="signup-btn-next" @click="$emit('next')">
        {{ t('common.next') }}
        <v-icon end size="18">mdi-arrow-right</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  username: { type: String, default: '' },
  phoneDisplay: { type: String, default: '' },
  otp: { type: String, default: '' },
  otpSent: { type: Boolean, default: false },
  otpVerified: { type: Boolean, default: false },
  sendingOtp: { type: Boolean, default: false },
  verifyingOtp: { type: Boolean, default: false },
  otpCountdownText: { type: String, default: null },
  canSendOtp: { type: Boolean, default: false },
  otpValidForVerify: { type: Boolean, default: false },
  rules: { type: Object, required: true },
});

defineEmits([
  'update:username',
  'update:phoneDisplay',
  'update:otp',
  'sendOtp',
  'verifyOtp',
  'changePhone',
  'next',
]);

const { t } = useI18n();
</script>

<style scoped>
.otp-reveal-enter-active {
  transition: opacity 0.35s ease-out, transform 0.35s ease-out;
}
.otp-reveal-leave-active {
  transition: opacity 0.25s ease-in, transform 0.25s ease-in;
}
.otp-reveal-enter-from,
.otp-reveal-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
.otp-reveal-enter-to,
.otp-reveal-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.signup-otp-pending-wrap,
.signup-otp-verified-wrap {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 0;
}

.signup-otp-row--second {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.signup-change-phone-btn {
  margin-left: auto;
  font-size: 0.8125rem !important;
  font-weight: 500 !important;
  text-transform: none !important;
  color: var(--color-text-muted) !important;
}
.signup-change-phone-btn:hover {
  color: var(--color-primary) !important;
}

.verify-done-enter-active,
.verify-done-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.verify-done-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
.verify-done-enter-from {
  opacity: 0;
  transform: scale(0.85);
}
.verify-done-enter-to,
.verify-done-leave-from {
  opacity: 1;
  transform: scale(1);
}

.signup-otp-block {
  margin-top: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
}
.signup-otp-block .signup-otp-label {
  margin-bottom: 0.5rem;
}

.signup-otp-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.signup-otp-row--first {
  gap: 0;
}
.signup-otp-boxes {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1 1 0;
  min-width: 0;
}
.signup-otp-boxes > :deep(.signup-otp-input) {
  flex: 1 1 0;
  min-width: 0;
}

.signup-otp-input {
  min-width: 0;
}
.signup-otp-input :deep(.v-otp-input) {
  display: flex;
  gap: 0.625rem;
  justify-content: flex-start;
}
.signup-otp-input :deep(.v-field) {
  background-color: color-mix(in srgb, var(--color-surface) 95%, transparent 5%);
  border: 1.5px solid var(--color-border);
  border-radius: 0.75rem;
  max-width: 3rem;
  min-height: 48px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.signup-otp-input :deep(.v-field:hover) {
  border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border) 60%);
}
.signup-otp-input :deep(.v-field--focused) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent);
}
.signup-otp-input :deep(.v-field--error) {
  border-color: rgb(var(--v-theme-error));
}
.signup-otp-input :deep(.v-field__input) {
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
}

.signup-otp-countdown {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.signup-verify-otp-btn {
  background: linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 90%, var(--color-primary)) 100%) !important;
  color: white !important;
  border-radius: 0.5rem !important;
  padding: 0.375rem 0.75rem !important;
  font-size: 0.8125rem !important;
  font-weight: 600 !important;
  text-transform: none !important;
  box-shadow: 0 2px 6px color-mix(in srgb, var(--color-primary) 25%, transparent) !important;
}
.signup-verify-otp-btn:hover:not(:disabled) {
  box-shadow: 0 4px 10px color-mix(in srgb, var(--color-primary) 35%, transparent) !important;
}

.signup-resend-btn {
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: none;
  border-radius: 0.5rem;
}

.signup-whatsapp-icon {
  color: var(--color-text);
}

@media (max-width: 400px) {
  .signup-otp-row {
    flex-direction: column;
    align-items: stretch;
  }
  .signup-otp-boxes {
    justify-content: center;
  }
  .signup-otp-input :deep(.v-otp-input) {
    justify-content: center;
  }
  .signup-otp-countdown {
    text-align: center;
  }
}
</style>
