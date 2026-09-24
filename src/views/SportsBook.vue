<template>
  <div class="sportsbook-page tw-w-full tw-bg-theme-background">
    <Loading v-if="loading" minHeight="60vh" class="sportsbook-loading" />
    <div v-else-if="iframeUrl" class="sportsbook-iframe-wrap">
      <iframe :src="iframeUrl" class="sportsbook-iframe" title="Sports book" />
    </div>
    <div
      v-else
      class="sportsbook-placeholder tw-flex tw-min-h-[60vh] tw-flex-col tw-items-center tw-justify-center tw-gap-6 tw-px-6 tw-text-center tw-bg-theme-background"
    >
      <div>
        <h1 class="tw-text-3xl tw-font-bold tw-text-theme-text">Coming soon</h1>
        <p class="tw-mt-3 tw-text-base tw-text-theme-text-secondary">
          Sports Book will be available here soon.
        </p>
      </div>
      <v-btn
        class="sportsbook-back-btn"
        variant="flat"
        prepend-icon="mdi-arrow-left"
        @click="goBack"
      >
        Back
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getPremiumSportsBookUrl } from '@/api/event/premium.js';
import { getSportsBookUrl } from '@/api/event/sportsbook.js';
import Loading from '@/components/Loading.vue';

const router = useRouter();
const iframeUrl = ref(null);
const loading = ref(true);

const extractUrl = (result) => {
  if (typeof result === 'string') return result || null;
  return result?.data?.url ?? result?.url ?? null;
};

const fetchSportsBookUrl = async () => {
  loading.value = true;
  iframeUrl.value = null;
  try {
    try {
      const url = extractUrl(await getPremiumSportsBookUrl());
      if (url) iframeUrl.value = url;
    } catch {
      /* try legacy endpoint */
    }
    if (!iframeUrl.value) {
      try {
        const url = extractUrl(await getSportsBookUrl());
        if (url) iframeUrl.value = url;
      } catch {
        /* show coming-soon placeholder */
      }
    }
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  fetchSportsBookUrl();
});
</script>

<style scoped>
.sportsbook-placeholder {
  min-height: min(100dvh, 900px);
}

.sportsbook-back-btn {
  background: var(--theme-orange, #f26c20) !important;
  color: #fff !important;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.01em;
}

.sportsbook-back-btn:hover {
  background: #ff7a2f !important;
}

.sportsbook-back-btn :deep(.v-icon) {
  color: #fff !important;
}

.sportsbook-loading :deep(.loading-spinner) {
  border-color: rgba(255, 255, 255, 0.16);
  border-top-color: var(--color-primary, #f26c20);
}

.sportsbook-iframe-wrap {
  width: 100%;
  background: var(--color-background, #0a0a0a);
}

.sportsbook-iframe {
  display: block;
  width: 100%;
  min-height: min(85dvh, 900px);
  height: 85dvh;
  border: none;
}
</style>
