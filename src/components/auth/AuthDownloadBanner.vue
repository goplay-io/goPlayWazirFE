<template>
  <button
    v-if="clickable"
    type="button"
    class="auth-download-banner"
    :class="`auth-download-banner--${variant}`"
    :aria-label="ariaLabel"
    @click="handleClick"
  >
    <img :src="bannerSrc" :alt="ariaLabel" class="auth-download-banner__img" />
  </button>
  <div v-else class="auth-download-banner" :class="`auth-download-banner--${variant}`">
    <img :src="bannerSrc" :alt="ariaLabel" class="auth-download-banner__img" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMobileAppConfig } from '@/composables/useMobileAppConfig.js'
import downloadAppImage from '@/assets/auth/download-app-image.webp'
import signupImage from '@/assets/auth/signup-image.webp'
import signupMobileImage from '@/assets/auth/signupbanner-mobile-image.webp'

const props = defineProps({
  variant: {
    type: String,
    default: 'login',
    validator: (v) => ['login', 'signup-desktop', 'signup-mobile'].includes(v),
  },
  clickable: {
    type: Boolean,
    default: true,
  },
})

const { t } = useI18n()
const { apkDownloadEnabled, loadConfig, requestApkDownload } = useMobileAppConfig()

const bannerSrc = computed(() => {
  if (props.variant === 'signup-desktop') return signupImage
  if (props.variant === 'signup-mobile') return signupMobileImage
  return downloadAppImage
})

const ariaLabel = computed(() => t('auth.login.downloadAppBannerAlt'))

async function handleClick() {
  if (!props.clickable) return
  await loadConfig()
  if (!apkDownloadEnabled.value) return
  try {
    await requestApkDownload()
  } catch {
    /* APK unavailable — banner still visible */
  }
}
</script>
