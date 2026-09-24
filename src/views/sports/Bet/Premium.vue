<script setup>
import Loading from '@/components/Loading.vue';

defineProps({
  premiumUrl: { type: String, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
});
</script>

<template>
  <div class="premium-container tw-min-h-[400px] tw-rounded tw-overflow-hidden">
    <Loading v-if="loading" minHeight="400px" />
    <div v-else-if="error"
      class="tw-flex tw-items-center tw-justify-center tw-min-h-[400px] tw-p-6 tw-text-theme-text-secondary">
      {{ error }}
    </div>
    <iframe v-else-if="premiumUrl" :src="premiumUrl" class="premium-iframe" title="Premium market" />
  </div>
</template>

<style scoped>
.premium-container {
  background: #fff;
  color: var(--color-text);
  margin: 0;
  border-top: 1px solid #e8e8e8;
}

.premium-iframe {
  width: 100%;
  min-height: 500px;
  height: 70vh;
  border: none;
  border-radius: 0;
}
</style>
