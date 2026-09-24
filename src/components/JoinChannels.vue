<template>
  <div class="tw-flex tw-flex-col tw-items-center lg:tw-items-start tw-gap-3 tw-py-6 tw-px-4">
    <p class="tw-text-sm tw-text-theme-text tw-font-medium">
      {{ t('common.joinOurChannels') }}
    </p>
    <div class="tw-flex tw-items-center tw-gap-4 tw-mt-1">
      <Whatsapp :size="24" />
      <Telegram :size="24" />
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import Whatsapp from './Whatsapp.vue'
import Telegram from './Telegram.vue'

const { t } = useI18n()
</script>

<style scoped>
</style>
