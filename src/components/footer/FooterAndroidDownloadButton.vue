<script setup>
import { useMobileAppConfig } from '@/composables/useMobileAppConfig'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { requestApkDownload } = useMobileAppConfig()

async function onDownload() {
  try {
    await requestApkDownload()
  } catch {
    // handled by composable / snackbar flow
  }
}
</script>

<template>
  <button
    type="button"
    class="footer-android-btn"
    :title="t('footer.links.downloadApp')"
    :aria-label="t('footer.links.downloadApp')"
    @click="onDownload"
  >
    <div class="footer-android-btn__left">
      <img
        src="/svg/sports-icons/android-green.svg"
        alt=""
        class="footer-android-btn__icon"
        width="24"
        height="24"
      />
      <div class="footer-android-btn__text">
        <span class="footer-android-btn__label">{{ t('footer.downloadLabel') }}</span>
        <span class="footer-android-btn__title">{{ t('footer.androidAppLabel') }}</span>
      </div>
    </div>
    <svg
      class="footer-android-btn__chevron"
      viewBox="0 0 512 512"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-128 128c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 137.4 150.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l128 128z"
      />
    </svg>
  </button>
</template>

<style scoped>
.footer-android-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 200px;
  min-height: 52px;
  padding: 8px 12px 8px 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  background: #1a1a1a;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.25);
  color: #ffffff;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.footer-android-btn:active {
  transform: scale(0.98);
}

@media (min-width: 768px) {
  .footer-android-btn {
    max-width: 350px;
  }
}

.footer-android-btn__left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-android-btn__icon {
  display: block;
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.footer-android-btn__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  line-height: 1.25;
  font-size: 12px;
}

.footer-android-btn__label {
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
}

.footer-android-btn__title {
  font-weight: 600;
  text-transform: uppercase;
  color: #ffffff;
}

.footer-android-btn__chevron {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #ffffff;
}
</style>
