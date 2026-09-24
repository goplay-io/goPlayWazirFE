<template>
  <div>
    <div class="signup-step3-content">
      <div class="signup-password-section">
        <div class="signup-passwords-grid">
          <div class="login-field-wrapper">
            <label class="login-field-label">
              <v-icon size="16" class="tw-mr-1.5">mdi-lock-outline</v-icon>
              {{ t('auth.signup.password') }}
            </label>
            <v-text-field
              :model-value="password"
              @update:model-value="$emit('update:password', $event)"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              :placeholder="t('auth.signup.enterPassword')"
              class="login-input-modern"
              :rules="[rules.required, rules.password]"
              hide-details="auto"
              density="comfortable"
            >
              <template #append-inner>
                <v-icon
                  size="20"
                  class="tw-cursor-pointer tw-select-none"
                  :icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                  @click.stop="$emit('update:showPassword', !showPassword)"
                />
              </template>
            </v-text-field>
          </div>
          <div class="login-field-wrapper">
            <label class="login-field-label">
              <v-icon size="16" class="tw-mr-1.5">mdi-lock-check-outline</v-icon>
              {{ t('auth.signup.passwordConfirm') }}
            </label>
            <v-text-field
              :model-value="passwordConfirm"
              @update:model-value="$emit('update:passwordConfirm', $event)"
              :type="showPasswordConfirm ? 'text' : 'password'"
              variant="outlined"
              :placeholder="t('auth.signup.enterPasswordConfirm')"
              class="login-input-modern"
              :rules="[rules.required, rules.passwordMatch]"
              hide-details="auto"
              density="comfortable"
            >
              <template #append-inner>
                <v-icon
                  size="20"
                  class="tw-cursor-pointer tw-select-none"
                  :icon="showPasswordConfirm ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                  @click.stop="$emit('update:showPasswordConfirm', !showPasswordConfirm)"
                />
              </template>
            </v-text-field>
          </div>
        </div>
      </div>
    </div>
    <div class="signup-step-actions signup-step3-actions">
      <v-btn variant="outlined" class="signup-btn-back" @click="$emit('back')">
        <v-icon start size="18">mdi-arrow-left</v-icon>
        {{ t('common.back') }}
      </v-btn>
      <v-btn
        type="submit"
        class="signup-btn-submit"
        :loading="loading"
        :disabled="loading"
      >
        <v-icon start size="18">mdi-account-plus</v-icon>
        {{ t('auth.signup.signupButton') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  password: { type: String, default: '' },
  passwordConfirm: { type: String, default: '' },
  showPassword: { type: Boolean, default: false },
  showPasswordConfirm: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  rules: { type: Object, required: true },
});

defineEmits([
  'update:password',
  'update:passwordConfirm',
  'update:showPassword',
  'update:showPasswordConfirm',
  'back',
]);

const { t } = useI18n();
</script>
