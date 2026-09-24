<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
})

const { t } = useI18n()
</script>

<template>
  <div class="tw-flex tw-min-h-[360px] tw-items-center tw-justify-center tw-py-8">
    <section class="tw-w-full tw-max-w-xl tw-rounded-lg tw-border tw-border-theme-border tw-bg-theme-surface tw-p-6 tw-text-center tw-shadow-sm sm:tw-p-8">
      <div class="tw-mx-auto tw-mb-5 tw-flex tw-h-16 tw-w-16 tw-items-center tw-justify-center tw-rounded-full tw-bg-theme-primary/10">
        <v-icon icon="mdi-lock-alert-outline" size="36" class="tw-text-theme-primary" />
      </div>
      <h2 class="tw-mb-3 tw-text-xl tw-font-semibold tw-text-theme-text sm:tw-text-2xl">{{ title }}</h2>
      <p class="tw-mx-auto tw-mb-6 tw-max-w-md tw-text-sm tw-leading-6 tw-text-theme-text-secondary sm:tw-text-base">
        {{ message }}
      </p>
      <v-btn
        variant="elevated"
        class="wallet-blocked-state__support-btn"
        :to="{ name: 'contact' }"
        prepend-icon="mdi-face-agent"
      >
        {{ t('wallet.blocked.contactSupport') }}
      </v-btn>
    </section>
  </div>
</template>

<style scoped>
.wallet-blocked-state__support-btn {
  background: linear-gradient(180deg, #f57c2f 0%, #e85a10 100%) !important;
  color: #ffffff !important;
  border: 0 !important;
  box-shadow: none !important;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: none;
}

.wallet-blocked-state__support-btn :deep(.v-btn__content),
.wallet-blocked-state__support-btn :deep(.v-icon) {
  color: #ffffff !important;
}

.wallet-blocked-state__support-btn:hover {
  filter: brightness(1.05);
}
</style>
