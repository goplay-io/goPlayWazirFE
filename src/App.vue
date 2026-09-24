<script setup>
import { onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { sharedWs } from '@/composables/sharedWs'
import { loadPublicInfo } from '@/utils/publicInfoCache'

onMounted(() => {
  if (sharedWs.url) {
    sharedWs.warmup()
  }
  void loadPublicInfo().catch((error) => {
    console.warn('Failed to load public application information:', error)
  })
})
</script>

<template>
  <div class="app-scale-wrapper">
    <v-app class="tw-bg-theme-background tw-text-theme-text app-root">
      <AppLayout />
    </v-app>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

/* Wrapper: keep app at native size so the viewport has no “reserved” bottom gap */
.app-scale-wrapper {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  position: relative;
  margin: 0;
  overflow: visible;
}

.app-root {
  width: 100%;
  height: 100%;
  min-height: 100vh;
}
</style>
