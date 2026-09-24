<template>
  <main class="auth-page auth-page--signup">
    <div class="auth-page-signup-layout">
      <aside class="auth-page-signup-banner-col">
        <AuthDownloadBanner variant="signup-desktop" />
        <p class="auth-page-signup-copy">
          {{ t('auth.signup.marketingCopy') }}
        </p>
      </aside>

      <section class="auth-page-signup-form-col">
        <div class="auth-page-signup-form-card">
          <AuthDownloadBanner variant="signup-mobile" class="auth-page-signup-banner--mobile" />

          <h1 v-if="signupStep === 1" class="auth-page-heading">{{ t('auth.signup.createAccountTitle') }}</h1>

          <SignupForm
            :initial-campaign-id="signupCampaignId"
            :initial-referral-id="signupReferralId"
            @step-change="signupStep = $event"
          />

          <p v-if="signupStep === 1" class="auth-page-signup-footer">
            {{ t('auth.signup.alreadyHaveAccount') }}
            <router-link to="/login">{{ t('auth.signup.loginLink') }}</router-link>
          </p>
        </div>
      </section>
    </div>

    <GlobalSnackbar />
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import GlobalSnackbar from '@/components/GlobalSnackbar.vue'
import SignupForm from './SignupForm.vue'
import AuthDownloadBanner from '@/components/auth/AuthDownloadBanner.vue'
import { useSettingsStore } from '@/stores/settings'
import '@/assets/auth-modal.css'
import '@/assets/auth-page.css'
import './signupStyles.css'

const { t } = useI18n()
const route = useRoute()
const settingsStore = useSettingsStore()
const signupStep = ref(1)

const signupCampaignId = computed(() =>
  String(
    route?.query?.campaign_id ||
    route?.query?.campaignId ||
    route?.query?.campign_id ||
    ''
  ).trim()
)

const signupReferralId = computed(() =>
  String(
    route?.query?.referral_id ||
    route?.query?.referralId ||
    route?.query?.referalId ||
    ''
  ).trim()
)

onMounted(async () => {
  if (!settingsStore.settings) {
    await settingsStore.fetchSettings()
  }
})
</script>
