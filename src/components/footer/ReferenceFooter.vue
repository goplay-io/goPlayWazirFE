<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings.js'
import { buildWhatsAppSupportUrl } from '@/utils/whatsappSupportUrl.js'
import { useMobileAppConfig } from '@/composables/useMobileAppConfig'
import FooterPartnerLogos from '@/components/footer/FooterPartnerLogos.vue'
import FooterAndroidDownloadButton from '@/components/footer/FooterAndroidDownloadButton.vue'

const { t } = useI18n()
const router = useRouter()
const settingsStore = useSettingsStore()
const { loadConfig } = useMobileAppConfig()

const BRAND_NAME = 'wazirwin'

const quickLinks = [
  { titleKey: 'footer.links.rulesAndRegulations', to: '/rules' },
  { titleKey: 'footer.links.privacyPolicy', to: '/privacy-policy' },
  { titleKey: 'footer.links.responsibleGaming', to: '/responsible-gaming' },
  { titleKey: 'footer.links.exclusionPolicy', to: '/exclusion-policy' },
  { titleKey: 'footer.links.terms', to: '/terms-and-conditions' },
]

const telegramLink = computed(() => {
  const value = settingsStore.telegramChannel?.trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const path = value.startsWith('@') ? value.slice(1) : value
  return `https://t.me/${path.replace(/\s/g, '')}`
})

const whatsappLink = computed(() =>
  buildWhatsAppSupportUrl(settingsStore.whatsappChannel),
)

function navigateTo(path) {
  router.push(path)
}

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="reference-footer">
    <div class="reference-footer__section reference-footer__section--padded">
      <span class="reference-footer__heading">{{ t('footer.connectWithUs') }}</span>
      <div class="reference-footer__social">
        <a
          v-if="telegramLink"
          :href="telegramLink"
          target="_blank"
          rel="noopener noreferrer"
          class="reference-footer__social-btn"
          aria-label="Telegram"
        >
          <img
            src="/svg/footer-icons/telegram-green-icon.svg"
            alt=""
            class="reference-footer__social-icon"
            width="30"
            height="30"
          />
        </a>
        <a
          v-if="whatsappLink"
          :href="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          class="reference-footer__social-btn"
          :aria-label="t('footer.social.whatsapp')"
        >
          <img
            src="/svg/footer-icons/whatsapp-green-icon.svg"
            alt=""
            class="reference-footer__social-icon"
            width="30"
            height="30"
          />
        </a>
      </div>
    </div>

    <div class="reference-footer__divider" />

    <div class="reference-footer__section reference-footer__section--partners">
      <FooterPartnerLogos />
    </div>

    <div class="reference-footer__divider" />

    <div class="reference-footer__section reference-footer__section--download">
      <FooterAndroidDownloadButton />
    </div>

    <div class="reference-footer__divider" />

    <div class="reference-footer__section reference-footer__section--padded reference-footer__section--links">
      <span class="reference-footer__quick-links-title">
        {{ t('footer.quickLinks.title') }}
      </span>
      <div class="reference-footer__links-grid">
        <button
          v-for="link in quickLinks"
          :key="link.to"
          type="button"
          class="reference-footer__link"
          @click="navigateTo(link.to)"
        >
          {{ t(link.titleKey) }}
        </button>
      </div>
    </div>

    <div class="reference-footer__divider" />

    <div class="reference-footer__section reference-footer__section--legal">
      <img
        src="/svg/footer-icons/gaming-curacao-icon.svg"
        alt="Gaming Curacao"
        class="reference-footer__curacao"
        loading="lazy"
      />

      <div class="reference-footer__divider reference-footer__divider--inset" />

      <span class="reference-footer__copyright">
        © 2023 {{ BRAND_NAME }}. All rights reserved.
      </span>
    </div>
  </div>
</template>

<style scoped>
.reference-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding-top: 12px;
  border-radius: 10px;
  background: var(--color-event-name, #333333);
  color: #ffffff;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .reference-footer {
    padding-top: 16px;
  }
}

.reference-footer__section {
  width: 100%;
  box-sizing: border-box;
}

.reference-footer__section--padded {
  padding: 0 12px;
}

@media (min-width: 768px) {
  .reference-footer__section--padded {
    padding: 0 16px;
  }
}

.reference-footer__section--partners {
  padding: 16px 0;
}

@media (min-width: 768px) {
  .reference-footer__section--partners {
    padding: 20px 0;
  }
}

.reference-footer__section--download {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
}

@media (min-width: 768px) {
  .reference-footer__section--download {
    padding: 20px 0;
  }
}

.reference-footer__section--links {
  padding-top: 16px;
  padding-bottom: 16px;
}

@media (min-width: 768px) {
  .reference-footer__section--links {
    padding-top: 20px;
    padding-bottom: 20px;
  }
}

.reference-footer__section--legal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 0;
}

@media (min-width: 768px) {
  .reference-footer__section--legal {
    padding: 20px 0;
  }
}

.reference-footer__heading {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}

.reference-footer__social {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.reference-footer__social-btn {
  display: inline-flex;
  padding: 8px;
  border-radius: 6px;
  background: var(--color-login-input-bg, #23201f);
  line-height: 0;
}

.reference-footer__social-icon {
  display: block;
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.reference-footer__divider {
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.reference-footer__divider--inset {
  width: 100%;
}

.reference-footer__quick-links-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  text-decoration: underline;
  text-decoration-color: #49915e;
  text-underline-offset: 4px;
}

@media (min-width: 768px) {
  .reference-footer__quick-links-title {
    font-size: 20px;
  }
}

.reference-footer__links-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
  margin-top: 8px;
}

@media (min-width: 768px) {
  .reference-footer__links-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.reference-footer__link {
  padding: 0;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  color: #ffffff;
  text-align: left;
  cursor: pointer;
}

@media (min-width: 768px) {
  .reference-footer__link {
    font-size: 16px;
  }
}

.reference-footer__link:hover {
  text-decoration: underline;
}

.reference-footer__curacao {
  width: 144px;
  max-width: 100%;
  object-fit: contain;
}

.reference-footer__copyright {
  font-size: 14px;
  font-weight: 700;
  color: #7b7b7b;
}
</style>
