<template>
  <v-dialog
    v-model="dialog"
    :max-width="isMobile ? '92%' : '420'"
    content-class="apk-download-dialog"
    :persistent="false"
    :retain-focus="false"
  >
    <v-card class="apk-download-card" elevation="0">
      <button
        type="button"
        class="apk-download-close"
        aria-label="Close"
        @click.stop.prevent="close"
      >
        <v-icon size="20" color="white">mdi-close</v-icon>
      </button>

      <button
        type="button"
        class="apk-download-poster-btn"
        aria-label="Download official app"
        @click="downloadApk"
      >
        <img
          :src="POSTER_URL"
          alt="Download official app — weekly iPhone giveaway"
          class="apk-download-poster"
          loading="eager"
          decoding="async"
        />
      </button>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import useDevices from '@/composables/useDevices.js'
import { useMobileAppConfig } from '@/composables/useMobileAppConfig.js'

const POSTER_URL = 'https://speedcdn.io/assets/v9-modal-popup/apk-download-poster2.webp'

const { isMobile } = useDevices()
const {
  appKey,
  apkDownloadEnabled,
  loadConfig,
  requestApkDownload
} = useMobileAppConfig()
const storageKey = `apk_download_modal_shown_${appKey || 'unconfigured'}`
const show = ref(false)

const dialog = computed({
  get: () => show.value,
  set: (value) => {
    show.value = value
    if (!value) markShown()
  }
})

function markShown() {
  try {
    sessionStorage.setItem(storageKey, '1')
  } catch {
    // ignore quota / private mode
  }
}

function close() {
  show.value = false
  markShown()
}

async function downloadApk() {
  try {
    await requestApkDownload()
    markShown()
    show.value = false
  } catch {
    // Keep the dialog open so the user can retry a temporary network failure.
  }
}

onMounted(async () => {
  await loadConfig()
  if (!apkDownloadEnabled.value) return

  try {
    if (sessionStorage.getItem(storageKey) === '1') return
  } catch {
    // If sessionStorage is unavailable, still show once this mount.
  }
  markShown()
  show.value = true
})
</script>

<style scoped>
.apk-download-card {
  position: relative;
  background: transparent !important;
  box-shadow: none !important;
  overflow: visible;
}

.apk-download-close {
  position: absolute;
  top: 0px;
  right: 0px;
  z-index: 2;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.85);
  background: rgba(20, 20, 20, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

.apk-download-close:hover {
  transform: scale(1.08);
}

.apk-download-poster-btn {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  line-height: 0;
}

.apk-download-poster {
  display: block;
  width: 100%;
  height: auto;
  max-height: min(82vh, 720px);
  object-fit: contain;
  border-radius: 12px;
}
</style>

<style>
.v-overlay__content.apk-download-dialog {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: auto !important;
}
</style>
