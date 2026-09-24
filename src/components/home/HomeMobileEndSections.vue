<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings.js'
import { useRoute } from 'vue-router'
import useDevices from '@/composables/useDevices.js'
import HomePageBottomText from '@/components/home/HomePageBottomText.vue'
import HomeMobileFooter from '@/components/home/HomeMobileFooter.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const { isMobile } = useDevices()
const route = useRoute()

const props = defineProps({
  footerOnly: {
    type: Boolean,
    default: false,
  },
})

const showGuestWhatsappBanner = computed(() => !props.footerOnly && !authStore.isUiAuthenticated)

/** Homepage bottom copy lives in LiveShowcaseSections (below providers). */
const showBottomText = computed(() => !props.footerOnly && route.name !== 'live')

const whatsappUrl = computed(() => {
  const val = settingsStore.whatsappChannel?.trim()
  if (!val) return ''
  if (/^https?:\/\//i.test(val)) return val
  if (val.startsWith('+') || /^\d[\d\s\-().]+$/.test(val)) {
    return `https://wa.me/${val.replace(/\D/g, '')}`
  }
  return `https://whatsapp.com/channel/${val.replace(/^@/, '')}`
})
</script>

<template>
  <div class="home-mobile-end">
    <HomePageBottomText v-if="showBottomText" />

    <template v-if="isMobile">
      <router-link
        v-if="!footerOnly"
        to="/why-choose-us"
        class="home-mobile-end__why"
        aria-label="Why Choose Us"
      >
        <img
          src="/why-choose-us.png"
          alt="Why Choose Us"
          class="home-mobile-end__why-img"
          loading="lazy"
        />
      </router-link>

      <component
        v-if="showGuestWhatsappBanner"
        :is="whatsappUrl ? 'a' : 'div'"
        v-bind="whatsappUrl ? { href: whatsappUrl, target: '_blank', rel: 'noopener noreferrer' } : {}"
        class="home-mobile-end__whatsapp"
        :aria-label="t('footer.social.whatsapp')"
      >
        <img
          src="/svg/whatsapp1.png"
          alt=""
          class="home-mobile-end__whatsapp-img"
          width="350"
          height="111"
          loading="lazy"
        />
      </component>

      <HomeMobileFooter />
    </template>
  </div>
</template>

<style scoped>
.home-mobile-end {
  width: 100%;
  margin-top: 0;
  padding: 0 0 8px;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .home-mobile-end {
    padding-bottom: 16px;
  }
}

.home-mobile-end__why {
  display: block;
  width: 100%;
  margin: 12px 0 0;
  padding-left: 4px;
  line-height: 0;
  border-radius: 4px;
  overflow: hidden;
}

.home-mobile-end__why-img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
}

.home-mobile-end__whatsapp {
  display: block;
  width: 100%;
  margin: 12px 0 0;
  padding: 0 0 0 4px;
  border: 0;
  background: transparent;
  line-height: 0;
  text-decoration: none;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.home-mobile-end__whatsapp-img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
}
</style>
