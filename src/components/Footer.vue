<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__desktop">
        <div class="site-footer__grid">
          <div class="site-footer__brand-col">
            <router-link to="/sports/live" class="site-footer__logo-link" aria-label="Home">
              <img
                :src="logoUrl"
                alt="Logo"
                class="site-footer__logo"
              />
            </router-link>
            <div class="site-footer__social-block">
              <p class="site-footer__follow">{{ t('footer.followUs') }}</p>
              <div class="site-footer__social">
                <a
                  v-for="item in socialLinks"
                  :key="item.alt"
                  :href="item.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="site-footer__social-btn"
                  :aria-label="item.alt"
                >
                  <img :src="item.icon" alt="" class="site-footer__social-icon" />
                </a>
              </div>
            </div>
          </div>

          <div class="site-footer__cols">
            <nav class="site-footer__col site-footer__col--help" aria-label="Help">
              <h3 class="site-footer__heading">{{ t('footer.help.title') }}</h3>
              <ul class="site-footer__links">
                <li>
                  <router-link to="/responsible-gaming" class="site-footer__link">
                    {{ t('footer.links.responsibleGaming') }}
                  </router-link>
                </li>
                <li>
                  <router-link to="/terms-and-conditions" class="site-footer__link">
                    {{ t('footer.links.terms') }}
                  </router-link>
                </li>
                <li>
                  <button
                    type="button"
                    class="site-footer__link site-footer__link--btn"
                    @click="onDownloadApp"
                  >
                    {{ t('footer.links.downloadApp') }}
                  </button>
                  <span class="site-footer__note">{{ t('footer.links.downloadAppNote') }}</span>
                </li>
              </ul>
            </nav>

            <nav class="site-footer__col site-footer__col--info" aria-label="Information">
              <h3 class="site-footer__heading">{{ t('footer.info.title') }}</h3>
              <ul class="site-footer__links">
                <li>
                  <router-link to="/privacy-policy" class="site-footer__link">
                    {{ t('footer.links.privacyPolicy') }}
                  </router-link>
                </li>
                <li>
                  <router-link to="/rules" class="site-footer__link">
                    {{ t('footer.links.rules') }}
                  </router-link>
                </li>
              </ul>
            </nav>

            <nav class="site-footer__col site-footer__col--about" aria-label="About">
              <h3 class="site-footer__heading">{{ t('footer.aboutSection.title') }}</h3>
              <ul class="site-footer__links">
                <li>
                  <router-link to="/about-us" class="site-footer__link">
                    {{ t('footer.links.aboutUs') }}
                  </router-link>
                </li>
                <li>
                  <router-link to="/bonuses" class="site-footer__link">
                    {{ t('footer.links.promotions') }}
                  </router-link>
                </li>
                <li>
                  <router-link to="/contact" class="site-footer__link">
                    {{ t('footer.links.contactUs') }}
                  </router-link>
                </li>
              </ul>
            </nav>

            <div class="site-footer__badges" aria-label="Partners">
              <img
                v-for="badge in partnerBadges"
                :key="badge.alt"
                :src="badge.src"
                :alt="badge.alt"
                class="site-footer__badge"
                :class="badge.className"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMobileAppConfig } from '@/composables/useMobileAppConfig'

const FOOTER_LOGO = '/goplay-logo.png'

const { t } = useI18n()
const { requestApkDownload } = useMobileAppConfig()

const logoUrl = computed(() => FOOTER_LOGO)

const socialLinks = [
  { href: 'https://cutt.ly/Fe6bCRjH', icon: '/svg/fb1.png', alt: 'Facebook' },
  { href: 'https://cutt.ly/Ye6bBEiE', icon: '/svg/insta1.png', alt: 'Instagram' },
  { href: 'https://cutt.ly/8e6b0dHV', icon: '/svg/telegram1.png', alt: 'Telegram' },
  { href: 'https://cutt.ly/le6bMc66', icon: '/svg/twitter1.png', alt: 'Twitter' },
]

const partnerBadges = [
  { src: '/svg/gaming-curacao 1.webp', alt: 'Gaming Curacao', className: 'site-footer__badge--curacao' },
  { src: '/svg/game-care.png', alt: 'Game Care', className: 'site-footer__badge--square' },
  { src: '/svg/18plus.png', alt: '18+', className: 'site-footer__badge--square' },
  { src: '/svg/gamble-aware.png', alt: 'Gamble Aware', className: 'site-footer__badge--aware' },
]

async function onDownloadApp() {
  try {
    await requestApkDownload()
  } catch (e) {
    // snackbar handled inside composable / modal flow
  }
}
</script>

<style scoped>
.site-footer {
  position: relative;
  z-index: 3;
  width: 100%;
  background: var(--color-header-bg, #360952);
  color: #ffffff;
  flex-shrink: 0;
}

.site-footer__inner {
  width: 100%;
  box-sizing: border-box;
  padding: 0 20px;
}

@media (min-width: 1024px) {
  .site-footer__inner {
    padding: 0 112px;
  }
}

.site-footer__desktop {
  display: none;
}

@media (min-width: 1024px) {
  .site-footer__desktop {
    display: flex;
    margin-top: 32px;
    padding: 20px 0 40px;
  }
}

.site-footer__grid {
  display: flex;
  width: 100%;
  margin-top: 12px;
  gap: 20px;
}

@media (min-width: 1024px) {
  .site-footer__grid {
    gap: 96px;
  }
}

.site-footer__brand-col {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.site-footer__logo-link {
  display: inline-flex;
  line-height: 0;
}

.site-footer__logo {
  display: block;
  width: 160px;
  min-width: 80px;
  height: auto;
  max-width: 160px;
  object-fit: contain;
}

.site-footer__social-block {
  margin-top: 8px;
  padding-bottom: 20px;
}

.site-footer__follow {
  margin: 8px 0 0 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: normal;
  text-transform: uppercase;
  color: #ffffff;
}

.site-footer__social {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.site-footer__social-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26.23px;
  height: 26.23px;
  line-height: 0;
}

.site-footer__social-icon {
  width: 26.23px;
  height: 26.23px;
  object-fit: contain;
}

.site-footer__cols {
  display: inline-flex;
  flex-wrap: nowrap;
  gap: 96px;
  align-items: flex-start;
  min-width: 0;
}

.site-footer__col {
  flex: 0 0 auto;
  min-width: 120px;
}

.site-footer__col--help {
  margin-left: 20px;
}

.site-footer__heading {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 19.5px;
  letter-spacing: normal;
  text-transform: uppercase;
  color: #ffffff;
}

.site-footer__links {
  list-style: none;
  margin: 0;
  padding: 0;
}

.site-footer__links li:first-child {
  margin-top: 12px;
}

.site-footer__links li + li {
  margin-top: 0;
}

.site-footer__link {
  display: inline-block;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #ffffff;
  text-decoration: none;
  white-space: nowrap;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.site-footer__link:hover {
  color: #00ad6f;
  text-decoration: none;
}

.site-footer__note {
  display: block;
  margin-top: 0;
  font-size: 9px;
  line-height: 1.2;
  color: #ffffff;
}

.site-footer__badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex: 0 0 auto;
  gap: 40px;
  width: auto;
  min-height: 70px;
  margin-top: 20px;
}

.site-footer__badge {
  object-fit: contain;
  flex-shrink: 0;
}

.site-footer__badge--curacao {
  width: 100px;
  height: auto;
}

.site-footer__badge--square {
  width: 30px;
  height: 30px;
}

.site-footer__badge--aware {
  width: 40px;
  height: 30px;
}

@media (max-width: 1023.98px) {
  .site-footer {
    display: none;
  }
}
</style>
