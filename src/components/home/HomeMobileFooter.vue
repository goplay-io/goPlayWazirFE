<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings.js'

const settingsStore = useSettingsStore()

const socialLinks = computed(() => [
  {
    href: 'https://cutt.ly/Fe6bCRjH',
    icon: '/svg/fb.png',
    label: 'Facebook',
  },
  {
    href: 'https://cutt.ly/Ye6bBEiE',
    icon: '/svg/insta.png',
    label: 'Instagram',
  },
  {
    href: settingsStore.telegramChannel
      ? normalizeTelegramUrl(settingsStore.telegramChannel)
      : 'https://cutt.ly/8e6b0dHV',
    icon: '/svg/telegram.png',
    label: 'Telegram',
  },
  {
    href: 'https://cutt.ly/le6bMc66',
    icon: '/svg/twitter.png',
    label: 'Twitter',
  },
])

const partnerBadges = [
  { src: '/svg/gaming-curacao%201.webp', alt: 'Gaming Curacao', class: 'home-mobile-footer__badge--curacao' },
  { src: '/svg/game-care1.webp', alt: 'GamCare', class: 'home-mobile-footer__badge--square' },
  { src: '/svg/18plus1.png', alt: '18+ Only', class: 'home-mobile-footer__badge--square' },
  { src: '/svg/gamble-aware%201.webp', alt: 'BeGambleAware', class: 'home-mobile-footer__badge--aware' },
]

const footerLinks = [
  { to: '/about-us', label: 'About us' },
  { to: '/bonuses', label: 'Promotions' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/faqs', label: 'FAQs' },
  { to: '/responsible-gaming', label: 'Responsible Gambling' },
  { to: '/terms-and-conditions', label: 'Terms and Conditions' },
  { to: '/rules', label: 'Rules' },
  { to: '/privacy-policy', label: 'Privacy Policy' },
]

function normalizeTelegramUrl(val) {
  const trimmed = val?.trim()
  if (!trimmed) return '#'
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('@')) return `https://t.me/${trimmed.slice(1)}`
  return `https://t.me/${trimmed.replace(/\s/g, '')}`
}
</script>

<template>
  <footer class="home-mobile-footer">
    <div class="home-mobile-footer__follow">
      <h2 class="home-mobile-footer__follow-title">FOLLOW US ON</h2>
      <div class="home-mobile-footer__social">
        <a
          v-for="item in socialLinks"
          :key="item.label"
          :href="item.href"
          target="_blank"
          rel="noopener noreferrer"
          class="home-mobile-footer__social-link"
          :aria-label="item.label"
        >
          <img :src="item.icon" alt="" class="home-mobile-footer__social-icon" loading="lazy" />
        </a>
      </div>
    </div>

    <div class="home-mobile-footer__badges" aria-label="Partners">
      <img
        v-for="badge in partnerBadges"
        :key="badge.alt"
        :src="badge.src"
        :alt="badge.alt"
        class="home-mobile-footer__badge"
        :class="badge.class"
        loading="lazy"
      />
    </div>

    <div class="home-mobile-footer__links-wrap">
      <nav class="home-mobile-footer__links" aria-label="Footer links">
        <template v-for="(link, index) in footerLinks" :key="link.to">
          <span v-if="index > 0" class="home-mobile-footer__sep" aria-hidden="true"> | </span>
          <router-link :to="link.to" class="home-mobile-footer__link">
            {{ link.label }}
          </router-link>
        </template>
      </nav>
    </div>

    <div class="home-mobile-footer__partner">
      <a
        href="https://dash.zuplay.com/"
        target="_blank"
        rel="noopener noreferrer"
        class="home-mobile-footer__partner-link"
        aria-label="Affiliate program"
      >
        <img
          src="/zuplay/svg/affiliate.png"
          alt=""
          class="home-mobile-footer__partner-img"
          loading="lazy"
        />
      </a>
    </div>
  </footer>
</template>

<style scoped>
.home-mobile-footer {
  display: grid;
  place-content: center;
  width: 100%;
  max-width: 100%;
  margin: 20px auto 0;
  padding: 0;
  box-sizing: border-box;
  background: transparent;
  color: #000000;
  overflow-x: hidden;
}

.home-mobile-footer__follow {
  margin-top: 12px;
  text-align: center;
}

.home-mobile-footer__follow-title {
  margin: 8px 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: normal;
  text-transform: uppercase;
  color: #000000;
}

.home-mobile-footer__social {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
}

.home-mobile-footer__social-link {
  display: inline-flex;
  line-height: 0;
}

.home-mobile-footer__social-icon {
  width: 26.23px;
  height: 26.23px;
  object-fit: contain;
}

.home-mobile-footer__badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  margin-top: 20px;
  padding: 0 40px;
  box-sizing: border-box;
}

.home-mobile-footer__badge {
  display: block;
  object-fit: contain;
}

.home-mobile-footer__badge--curacao {
  width: 100px;
  height: 32.58px;
}

.home-mobile-footer__badge--square {
  width: 30px;
  height: 30px;
}

.home-mobile-footer__badge--aware {
  width: 40px;
  height: 30px;
}

.home-mobile-footer__links-wrap {
  margin-top: 16px;
  text-align: center;
}

.home-mobile-footer__links {
  display: block;
  margin: 8px 40px 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 21px;
  text-align: center;
  color: #000000;
}

.home-mobile-footer__sep {
  color: #000000;
  user-select: none;
}

.home-mobile-footer__link {
  color: #000000;
  text-decoration: none;
  white-space: nowrap;
}

.home-mobile-footer__link:hover {
  text-decoration: underline;
}

.home-mobile-footer__partner {
  width: 100%;
  margin-top: 16px;
  padding: 0 64px;
  box-sizing: border-box;
}

.home-mobile-footer__partner-link {
  display: flex;
  gap: 12px;
  line-height: 0;
}

.home-mobile-footer__partner-img {
  display: block;
  width: 258px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}
</style>
