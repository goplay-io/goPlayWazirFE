<template>
  <div class="mobile-bottom-nav-shell md:tw-hidden">
    <nav
      v-show="uiStore.mobileBottomNavVisible"
      class="mobile-bottom-nav"
      aria-label="Primary mobile navigation"
    >
      <div class="mobile-bottom-nav__inner">
        <template v-for="tab in tabs" :key="tab.key">
        <!-- Home: raised FAB -->
        <button
          v-if="tab.key === 'home'"
          type="button"
          class="mobile-bottom-nav__item mobile-bottom-nav__item--home"
          :aria-label="tab.label"
          @click="goHome"
        >
          <img
            :src="tab.icon"
            :alt="tab.label"
            class="mobile-bottom-nav__home-icon"
          />
        </button>

        <!-- Helpline: external WhatsApp -->
        <a
          v-else-if="tab.key === 'helpline'"
          class="mobile-bottom-nav__item"
          :href="helplineHref"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="tab.label"
        >
          <img
            :src="tab.icon"
            :alt="tab.label"
            class="mobile-bottom-nav__icon"
            :class="tab.iconClass || 'mobile-bottom-nav__icon--lg'"
            aria-hidden="true"
          />
          <span class="mobile-bottom-nav__label">{{ tab.label }}</span>
        </a>

        <!-- Account / Login -->
        <button
          v-else-if="tab.key === 'account'"
          type="button"
          class="mobile-bottom-nav__item"
          :aria-label="tab.label"
          @click="onAccountClick"
        >
          <img
            :src="tab.icon"
            :alt="tab.label"
            class="mobile-bottom-nav__icon"
            :class="tab.iconClass || 'mobile-bottom-nav__icon--lg'"
            aria-hidden="true"
          />
          <span class="mobile-bottom-nav__label">{{ tab.label }}</span>
        </button>

        <!-- Router tabs (Inplay, Casino, Offers) -->
        <RouterLink
          v-else-if="tab.to"
          :to="tab.to"
          class="mobile-bottom-nav__item"
          :class="{ 'is-active': isRouteActive(tab.match) }"
        >
          <img
            :src="tab.icon"
            :alt="tab.label"
            class="mobile-bottom-nav__icon"
            :class="tab.iconClass"
            aria-hidden="true"
          />
          <span class="mobile-bottom-nav__label">{{ tab.label }}</span>
        </RouterLink>
      </template>
      </div>
    </nav>

    <button
      type="button"
      class="mobile-bottom-nav__toggle"
      :class="{ 'mobile-bottom-nav__toggle--collapsed': !uiStore.mobileBottomNavVisible }"
      :aria-expanded="uiStore.mobileBottomNavVisible"
      :aria-label="uiStore.mobileBottomNavVisible
        ? t('components.mobileBottomNav.hideBottomNav')
        : t('components.mobileBottomNav.showBottomNav')"
      @click="onToggleNav"
    >
      <img
        src="/zuplay/svg/arrow1.png"
        alt=""
        class="mobile-bottom-nav__toggle-icon"
        width="12"
        height="8"
        aria-hidden="true"
      />
    </button>
  </div>
</template>

<script setup>
import { computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { useLoginModal } from '@/composables/useLoginModal'
import { buildWhatsAppSupportUrl } from '@/utils/whatsappSupportUrl'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const uiStore = useUIStore()
const settingsStore = useSettingsStore()
const { openLoginModal } = useLoginModal()

const isLoggedIn = computed(
  () => authStore.isUiAuthenticated || authStore.isDemoUser,
)

const loggedInTabs = [
  {
    key: 'casino',
    labelKey: 'components.mobileBottomNav.casino',
    icon: '/zuplay/bottomsvg/casino.png',
    iconClass: 'mobile-bottom-nav__icon',
    to: '/casino',
    match: ['/casino'],
  },
  {
    key: 'wallet',
    labelKey: 'components.mobileBottomNav.wallet',
    icon: '/zuplay/bottomsvg/wallet.png',
    iconClass: 'mobile-bottom-nav__icon',
    to: '/wallet',
    match: ['/wallet', '/deposit', '/withdrawal'],
  },
  {
    key: 'home',
    labelKey: 'components.mobileBottomNav.home',
    icon: '/zuplay/bottomsvg/home_icon.png',
  },
  {
    key: 'helpline',
    labelKey: 'components.mobileBottomNav.helpline',
    icon: '/zuplay/bottomsvg/whatsapp-icon.png',
    iconClass: 'mobile-bottom-nav__icon--lg',
  },
  {
    key: 'account',
    labelKey: 'components.mobileBottomNav.account',
    icon: '/zuplay/bottomsvg/avatar.png',
    iconClass: 'mobile-bottom-nav__icon--lg',
  },
]

const loggedOutTabs = [
  {
    key: 'inplay',
    labelKey: 'components.mobileBottomNav.inplay',
    icon: '/zuplay/bottomsvg/inplay.png',
    iconClass: 'mobile-bottom-nav__icon--inplay',
    to: '/sports/live',
    match: ['/sports/live'],
  },
  {
    key: 'casino',
    labelKey: 'components.mobileBottomNav.casino',
    icon: '/zuplay/bottomsvg/casino.png',
    to: '/casino',
    match: ['/casino'],
  },
  {
    key: 'home',
    labelKey: 'components.mobileBottomNav.home',
    icon: '/zuplay/bottomsvg/home_icon.png',
  },
  {
    key: 'helpline',
    labelKey: 'components.mobileBottomNav.helpline',
    icon: '/zuplay/bottomsvg/whatsapp-icon.png',
    iconClass: 'mobile-bottom-nav__icon--lg',
  },
  {
    key: 'account',
    labelKey: 'components.mobileBottomNav.login',
    icon: '/zuplay/bottomsvg/avatar.png',
    iconClass: 'mobile-bottom-nav__icon--lg',
  },
]

const tabs = computed(() => {
  const source = isLoggedIn.value ? loggedInTabs : loggedOutTabs
  return source.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
  }))
})

const helplineHref = computed(() =>
  buildWhatsAppSupportUrl(settingsStore.whatsappChannel),
)

function goHome() {
  router.push('/sports/live')
}

function onAccountClick() {
  if (isLoggedIn.value) {
    uiStore.requestOpenAccountMenu()
    return
  }
  openLoginModal()
}

function isRouteActive(paths) {
  const p = route.path
  return paths.some((path) => p === path || p.startsWith(`${path}/`))
}

function syncBottomNavCollapsedClass(visible) {
  document.documentElement.classList.toggle('mobile-bottom-nav-collapsed', !visible)
}

function onToggleNav() {
  uiStore.toggleMobileBottomNav()
}

watch(
  () => uiStore.mobileBottomNavVisible,
  (visible) => syncBottomNavCollapsedClass(visible),
  { immediate: true },
)

onUnmounted(() => {
  document.documentElement.classList.remove('mobile-bottom-nav-collapsed')
})
</script>

<style scoped>
.mobile-bottom-nav-shell {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1100;
  pointer-events: none;
}

.mobile-bottom-nav__toggle {
  position: absolute;
  right: 20px;
  bottom: 7.25vh;
  z-index: 1102;
  display: block;
  margin: 0;
  padding: 8px;
  border: none;
  border-radius: 4px;
  background: var(--color-header-bg, #360952);
  cursor: pointer;
  pointer-events: auto;
  box-sizing: border-box;
  transition: bottom 0.3s ease, transform 0.3s ease;
  transform: rotate(-180deg);
  -webkit-tap-highlight-color: transparent;
}

.mobile-bottom-nav__toggle--collapsed {
  bottom: 0;
  transform: none;
}

.mobile-bottom-nav__toggle-icon {
  display: block;
  width: 12px;
  height: 8px;
  margin: 0 auto;
  object-fit: contain;
  pointer-events: none;
}

.mobile-bottom-nav {
  position: relative;
  z-index: 1101;
  box-sizing: border-box;
  width: 100%;
  height: var(
    --mobile-bottom-nav-inset,
    calc(var(--mobile-bottom-nav-height, 60px) + env(safe-area-inset-bottom, 0px))
  );
  padding-bottom: env(safe-area-inset-bottom, 0);
  background: transparent;
  pointer-events: none;
  overflow: visible;
}

.mobile-bottom-nav__inner {
  pointer-events: auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: stretch;
  height: var(--mobile-bottom-nav-height, 60px);
  background: var(--color-header-bg, #360952);
  border-radius: 30px 30px 0 0;
  box-shadow: 0 -4px 20px #000;
  overflow: visible;
}

.mobile-bottom-nav__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0px;
  min-width: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-decoration: none;
  color: #ffffff;
  -webkit-tap-highlight-color: transparent;
}

.mobile-bottom-nav__item--home {
  overflow: visible;
}

.mobile-bottom-nav__icon {
  display: block;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  object-fit: contain;
  pointer-events: none;
}

.mobile-bottom-nav__icon--lg {
  width: 24px;
  height: 24px;
}

.mobile-bottom-nav__icon--inplay {
  width: 16px;
  height: 16px;
}

.mobile-bottom-nav__label {
  font-size: 10px;
  font-weight: 500;
  color: #ffffff;
  line-height: 15px;
  text-align: center;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-bottom-nav__item.is-active .mobile-bottom-nav__label {
  font-weight: 700;
}

.mobile-bottom-nav__home-icon {
  display: block;
  width: 60px;
  height: 60px;
  margin-top: -20px;
  object-fit: contain;
  position: relative;
  z-index: 2;
  pointer-events: none;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25));
}

@media (max-width: 360px) {
  .mobile-bottom-nav__label {
    font-size: 9px;
  }

  .mobile-bottom-nav__icon {
    width: 18px;
    height: 18px;
  }

  .mobile-bottom-nav__icon--lg {
    width: 22px;
    height: 22px;
  }

  .mobile-bottom-nav__home-icon {
    width: 56px;
    height: 56px;
    margin-top: -18px;
  }
}
</style>
