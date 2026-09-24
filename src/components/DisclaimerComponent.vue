<template>
  <div class="disclaimer-container tw-w-full tw-rounded-lg tw-bg-theme-surface/30 tw-border tw-border-theme-border tw-p-4">
    <p class="tw-text-xs tw-leading-relaxed tw-text-theme-text-secondary tw-font-medium tw-text-justify">
      <v-icon size="14" class="tw-text-theme-primary tw-mr-2 tw-align-text-top">
        mdi-shield-alert-outline
      </v-icon>
      {{ t('common.disclaimer') }}
    </p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.disclaimer-container {
  --scrollbar-width: 6px;
}

.tw-scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.tw-scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.tw-scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.tw-scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.tw-scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}
</style>
