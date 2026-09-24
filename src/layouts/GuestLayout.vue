<template>
  <!-- Header: announcement above toolbar (WazirWin reference) -->
  <v-app-bar
    v-if="!(isMobile && isClearScreenPage)"
    ref="guestAppBarRef"
    app
    :height="guestAppBarHeightPx"
    class="tw-bg-theme-header guest-app-bar tw-py-0"
    :class="{ 'guest-app-bar--search-open': !isMobile && showSearchDropdown }" elevation="0">
    <div class="guest-app-bar-inner header-shell tw-flex tw-flex-col tw-w-full tw-max-w-full tw-min-h-0">
      <HeaderAnnouncementBar
        v-if="showAnnouncementStrip"
        @dismiss="dismissAnnouncementStrip"
      />

      <div
        class="guest-toolbar-row tw-flex tw-items-center tw-w-full tw-min-h-[39px] tw-h-[54px] md:tw-min-h-[90px] md:tw-h-[90px] tw-shrink-0">
        <div class="guest-toolbar-left tw-inline-flex tw-items-center tw-gap-0 tw-flex-none md:tw-gap-3">
        <router-link v-if="isCasinoPage && authStore.isUiAuthenticated" to="/sports/live"
          class="guest-mobile-menu-btn guest-mobile-home-btn md:tw-hidden"
          :aria-label="t('components.mobileBottomNav.live')">
          <v-icon size="24">mdi-home</v-icon>
        </router-link>
        <button v-else type="button" class="guest-mobile-menu-btn md:tw-hidden" :aria-label="t('common.menu')"
          @click="uiStore.toggleSidebar()">
          <img
            src="/svg/burger-menu.png"
            alt=""
            class="guest-mobile-menu-btn__icon"
            width="12"
            height="14"
          />
        </button>

        <HeaderBrandLink
          class="guest-header-brand"
          :alt="t('components.guestLayout.logoAlt')"
        />
        </div>

        <!-- Desktop center search (reference layout) -->
        <div
          v-if="!isMobile && !isAuthPage"
          class="header-desktop-search-slot tw-hidden md:tw-flex tw-flex-1 tw-justify-center tw-min-w-0 tw-px-4"
        >
          <div
            ref="desktopInlineSearchRoot"
            class="header-desktop-search tw-relative tw-flex tw-items-center tw-w-full tw-max-w-[280px] xl:tw-max-w-[380px]"
          >
            <SearchMagnify :size="15" :stroke-width="2" class="header-desktop-search__icon" />
            <input
              ref="headerSearchInput"
              v-model="inlineSearchQuery"
              type="text"
              :placeholder="t('components.searchDialog.desktopPlaceholder')"
              class="header-desktop-search__input tw-flex-1 tw-min-w-0 tw-bg-transparent tw-border-0 tw-outline-none"
              @focus="ensureInlineSearchData"
              @keydown.enter.prevent="submitInlineSearch"
            />
            <div v-if="showSearchDropdown" class="header-search-dropdown header-search-dropdown--desktop">
              <div class="header-search-dropdown__body">
                <SearchResults
                  :search-query="debouncedSearchQuery"
                  :loading="searchLoading"
                  :error="searchError"
                  :casino-games="casinoGames"
                  @event-selected="handleInlineEventSelected"
                  @game-selected="handleInlineGameSelected"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Right: wallet (demo) → profile / auth -->
        <div
          class="guest-toolbar-right tw-flex tw-items-center tw-justify-end tw-min-w-0 tw-gap-1.5 md:tw-gap-4 tw-ml-auto">
          <button
            v-if="isMobile && (authStore.isUiAuthenticated || authStore.isDemoUser) && !isAuthPage"
            type="button"
            @click="openInlineSearch"
            :aria-label="t('common.search')"
            class="header-mobile-search-btn md:tw-hidden"
          >
            <SearchMagnify :size="22" :stroke-width="2" class="header-mobile-search-btn__icon" />
          </button>

          <!-- Demo user mobile: combined wallet + profile pill -->
          <template v-if="authStore.isDemoUser && isMobile">
            <button type="button" class="header-mobile-wallet-user-pill" :aria-label="userName"
              @click="userMenuOpen = true">
              <WalletInfo compact @open-exposure-modal="openExposureModal" />
              <v-icon size="20" class="header-mobile-wallet-user-pill__icon">mdi-account</v-icon>
            </button>
          </template>

          <!-- Demo user: wallet pill (desktop) + profile drawer trigger -->
          <template v-else-if="authStore.isDemoUser">
            <div class="guest-demo-user-cluster tw-flex tw-items-center tw-min-w-0 md:tw-gap-3 max-md:tw-contents">
              <div v-if="!isMobile"
                class="guest-header-wallet-desktop tw-min-w-0 tw-max-w-[min(280px,38vw)] md:tw-shrink">
                <WalletInfo @open-exposure-modal="openExposureModal" />
              </div>
              <div
                class="header-user-trigger tw-flex tw-items-center tw-gap-1 tw-cursor-pointer tw-select-none tw-group tw-shrink-0"
                role="button"
                tabindex="0"
                @click="userMenuOpen = true"
                @keydown.enter.prevent="userMenuOpen = true"
                @keydown.space.prevent="userMenuOpen = true">
                <span
                  class="tw-text-sm tw-font-extrabold tw-text-white tw-tracking-wide tw-uppercase tw-transition-colors tw-duration-200 tw-whitespace-nowrap">
                  {{ userName }}
                </span>
                <v-icon size="14" :class="{ 'tw-rotate-180': userMenuOpen }"
                  class="tw-transition-transform tw-duration-200 chevron-icon">mdi-chevron-down</v-icon>
              </div>
            </div>
          </template>

          <!-- Pure guest: WazirWin reference auth actions -->
          <template v-else>
            <div v-if="!isMobile" class="guest-desktop-auth-cluster tw-flex tw-items-center tw-gap-2 tw-shrink-0">
              <div class="header-desktop-datetime">
                <div class="header-desktop-datetime__date">{{ formattedHeaderDate }}</div>
                <span class="header-desktop-datetime__time">{{ formattedHeaderTime }}</span>
              </div>
              <div class="guest-desktop-auth-actions tw-flex tw-items-center tw-gap-1">
                <button type="button" class="guest-ref-auth-btn guest-ref-auth-btn--login" @click="handleGuestLoginClick">
                  <v-icon size="17" class="guest-ref-auth-btn__icon">mdi-login</v-icon>
                  <span>{{ t('components.mobileBottomNav.login') }}</span>
                </button>
                <router-link to="/signup" class="guest-ref-auth-btn guest-ref-auth-btn--register" @click="handleGuestSignupClick">
                  <v-icon size="16" class="guest-ref-auth-btn__icon">mdi-account-plus-outline</v-icon>
                  <span>{{ t('auth.login.registerCta') }}</span>
                </router-link>
                <button type="button" class="guest-ref-auth-btn guest-ref-auth-btn--get-id" @click="handleGuestGetIdClick">
                  <v-icon size="17" class="guest-ref-auth-btn__icon">mdi-login</v-icon>
                  <span>{{ t('auth.login.getIdCta') }}</span>
                </button>
              </div>
            </div>
            <div v-else class="guest-auth-pair tw-inline-flex tw-items-center">
              <button type="button" class="guest-ref-auth-btn guest-ref-auth-btn--login guest-ref-auth-btn--mobile" @click="handleGuestLoginClick">
                <span>{{ t('components.mobileBottomNav.login') }}</span>
              </button>
              <router-link to="/signup" class="guest-ref-auth-btn guest-ref-auth-btn--register guest-ref-auth-btn--mobile" @click="handleGuestSignupClick">
                <span>{{ t('auth.login.signupCta') }}</span>
              </router-link>
              <button type="button" class="guest-ref-auth-btn guest-ref-auth-btn--get-id guest-ref-auth-btn--mobile" @click="handleGuestGetIdClick">
                <span>{{ t('auth.login.getIdCta') }}</span>
              </button>
            </div>
          </template>
        </div>
      </div>

      <div
        v-if="shouldShowSubHeader"
        class="header-subheader-wrap tw-shrink-0 tw-px-2 md:tw-px-0"
      >
        <HeaderSubHeader />
      </div>

    </div>

  </v-app-bar>

  <MobileSearchModal
    :open="isMobile && showInlineSearch && !isAuthPage"
    :title="t('common.search')"
    :close-label="t('common.close')"
    @close="closeInlineSearch"
  >
    <template #input>
      <input
        ref="mobileSearchInput"
        v-model="inlineSearchQuery"
        type="text"
        :placeholder="t('components.searchDialog.mobilePlaceholder')"
        @focus="ensureInlineSearchData"
        @keydown.enter.prevent="submitInlineSearch"
      />
    </template>
    <template v-if="showSearchDropdown" #results>
      <SearchResults
        compact
        :search-query="debouncedSearchQuery"
        :loading="searchLoading"
        :error="searchError"
        :casino-games="casinoGames"
        @event-selected="handleInlineEventSelected"
        @game-selected="handleInlineGameSelected"
      />
    </template>
  </MobileSearchModal>

  <!-- Main content with sidebar -->
  <div
    class="guest-layout-root tw-bg-theme-background tw-flex tw-flex-col"
    :class="[
      (useMobileBodyScroll || showSiteFooter)
        ? 'tw-min-h-screen'
        : 'tw-h-full tw-max-h-full tw-overflow-hidden',
      { 'layout-home-shell-bg': showHomeExchangeSection },
    ]"
  >
    <!-- Reserve space for fixed v-app-bar (same pattern as Layout.vue) -->
    <div
      v-if="!isMobile"
      class="layout-header-flow-spacer tw-shrink-0 tw-pointer-events-none"
      :style="{ height: guestDesktopHeaderFlowSpacerPx + 'px', width: '100%' }"
      aria-hidden="true"
    />

    <div
      class="guest-layout-body-stack tw-flex tw-flex-1 tw-min-h-0 tw-flex-col"
      :class="{ 'guest-layout-body-stack--footer-doc': showSiteFooter }"
      :style="showSiteFooter ? {
        '--layout-sticky-top': `${guestDesktopHeaderFlowSpacerPx}px`,
        '--layout-sticky-pane-h': `calc(100vh - ${guestDesktopHeaderFlowSpacerPx}px)`,
      } : undefined"
    >
    <div
      class="guest-layout-body tw-flex tw-min-w-0 tw-gap-0"
      :class="[
        showHomeExchangeSection ? '' : 'tw-bg-white',
        useMobileBodyScroll ? 'guest-layout-body--mobile-body' : '',
        showSiteFooter
          ? 'guest-layout-body--footer-doc'
          : 'tw-flex-1 tw-min-h-0',
        useReferenceSportsLayout ? 'guest-layout-body--reference-pad' : '',
        showLayoutRightRail ? 'guest-layout-body--with-right-rail' : '',
        isFullWidthPage ? 'guest-layout-body--full-width' : '',
      ]"
    >
      <div
        v-if="!isCasinoListingPage && !isClearScreenPage && !isFullWidthPage"
        class="layout-sidebar-column"
      >
        <Sidebar v-model="sidebarOpen" :top-offset="mobileSidebarTopOffsetPx" />
      </div>

      <!-- Scrollable content column: spacer sits outside the scrollport so content never paints under the nav -->
      <div
        class="guest-layout-main tw-flex tw-flex-1 tw-flex-col tw-min-w-0 tw-bg-theme-background"
        :class="[
          showSiteFooter ? 'guest-layout-main--footer-doc' : (useMobileBodyScroll ? 'guest-layout-main--mobile-body' : 'tw-overflow-hidden tw-min-h-0'),
          isFullWidthPage ? 'guest-layout-main--full-width' : '',
        ]"
        :style="showSiteFooter ? undefined : mainContentStyle"
      >
      <v-container
        id="guest-main-scroll"
        fluid
        :class="[
        'tw-flex tw-flex-col tw-min-w-0 layout-app-main-scroll',
        {
          'tw-flex-1 tw-min-h-0 tw-overflow-y-auto scrollbar-primary': !useMobileBodyScroll && !showSiteFooter,
          'layout-app-main-scroll--mobile-bet': useMobileBodyScroll,
        },
        { 'tw-min-h-0': isMultiMarketPage && !isMobile },
        isMobile ? 'tw-pt-0 tw-px-0' : 'tw-p-0'
      ]" :style="isMobile ? { paddingLeft: '0px', paddingRight: '0px' } : {}">
        <!-- <LayoutMobileSportsTabStrip v-if="!showHomeExchangeSection && !isExchangeSportDetailPage" /> -->
        <div class="layout-page-content" :class="{
          'tw-min-h-0': (isMultiMarketPage || isBetPage) && !isMobile,
          'tw-flex tw-flex-col tw-flex-1': (isMultiMarketPage || isBetPage) && !isMobile,
          'mm-multi-market-slot tw-relative tw-overflow-hidden': isMultiMarketPage && !isMobile,
        }">
          <div v-if="isLayoutShellPage" class="guest-sports-shell"
            :class="{ 'guest-sports-shell--single-col': !isMobile && (isBetPage || isMultiMarketPage || !showDesktopSportsShellRail) }">
            <div
              class="guest-sports-shell__content"
              :class="{
                'guest-sports-shell__content--home-pad': showHomeExchangeSection,
                'guest-sports-shell__content--reference-home': showHomeExchangeSection,
              }"
            >
              <SportsMainBanner v-if="isSportsShellPage && showSportsShellMainBanner && !isMultiMarketPage" />
              <HomeReferenceMiddleSections v-if="showHomeExchangeSection && !isMultiMarketPage" />
              <SportsSharedGifRow
                v-if="isSportsShellPage && showSportsShellGifRow && !isMultiMarketPage && !isMobile && !showHomeExchangeSection"
              />
              <div v-if="isSportsShellPage && isMobile && showMobileNewLaunchInShell"
                class="layout-mobile-new-launch-wrap md:tw-hidden">
                <NewLaunchGames />
              </div>
              <slot />
            </div>
            <div v-if="!isMobile && !isBetPage && !isMultiMarketPage && showDesktopSportsShellRail"
              class="guest-sports-shell__rail">
              <SportsSharedRail variant="desktop" />
            </div>
          </div>
          <template v-else>
            <slot />
          </template>
          <SportsSharedRail v-if="isLayoutShellPage && isMobile && showMobileProvidersInLayoutRail" variant="mobile"
            segment="providers" />
          <HomeMobileEndSections
            v-if="showMobileFooter || showMobileFooterOnly"
            :footer-only="showMobileFooterOnly"
          />
        </div>

      </v-container>

    </div>

      <!-- Right rail: bet slip + promo (desktop) -->
      <LayoutRightRail
        v-if="showLayoutRightRail"
        :show-whatsapp="!showHomeExchangeSection"
        :whatsapp-url="guestWhatsappUrl"
        :sticky-footer-doc="showSiteFooter"
        :open-bets-use-unsettled="showHomeExchangeSection"
        :home-reference-layout="showHomeExchangeSection"
      />
    </div>

    <div v-if="showMobileBottomNav" class="layout-mobile-bottom-nav-spacer md:tw-hidden" aria-hidden="true" />

    <Footer v-if="showSiteFooter" />
    </div>
  </div>

  <MobileBottomNav v-if="showMobileBottomNav" />

  <Teleport to="body">
    <DesktopCustomerSupportFloat />
  </Teleport>

  <UserAccountDrawer
    v-if="authStore.isDemoUser"
    v-model="userMenuOpen"
    :user-name="userName"
    :wallet-rows="demoWalletSummaryRows"
    :nav-items="USER_DRAWER_NAV_ITEMS"
    :show-wallet-summary="true"
    :show-payment-actions="true"
    :show-claim-bonus="true"
    @logout="handleLogout"
    @navigate="handleDemoDrawerNavigate"
    @deposit="goToDemoDeposit"
    @withdraw="goToDemoWithdraw"
    @claim-bonus="goToDemoBonuses"
    @exposure-click="openExposureModal"
  />
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import Footer from '@/components/Footer.vue'
import HomeMobileEndSections from '@/components/home/HomeMobileEndSections.vue'
import Sidebar from '@/layouts/Sidebar.vue'
import useDevices from '@/composables/useDevices.js'
import { useUIStore } from '@/stores/ui.js'
import { useAuthStore } from '@/stores/auth.js'
import { useEventsStore } from '@/stores/events/events'
import { getCasinoGames } from '@/api/event/casino'
import { sortCasinoGamesByPriority } from '@/utils/casinoGamePriority'
import { USER_DRAWER_NAV_ITEMS } from '@/constants/userDrawerNavItems.js'
import HeaderBrandLink from '@/components/HeaderBrandLink.vue'
import SearchResults from '@/components/SearchResults.vue'
import SearchMagnify from '@/components/Icons/SearchMagnify.vue'
import MobileSearchModal from '@/components/MobileSearchModal.vue'
import MobileBottomNav from '@/components/MobileBottomNav.vue'
import DesktopCustomerSupportFloat from '@/components/DesktopCustomerSupportFloat.vue'
import SportsSharedRail from '@/components/sports/SportsSharedRail.vue'
import LayoutRightRail from '@/components/layout/LayoutRightRail.vue'
import HomeReferenceMiddleSections from '@/components/home/HomeReferenceMiddleSections.vue'
import SportsMainBanner from '@/components/sports/SportsMainBanner.vue'
import SportsSharedGifRow from '@/components/sports/SportsSharedGifRow.vue'
// import LayoutMobileSportsTabStrip from '@/components/sports/LayoutMobileSportsTabStrip.vue'
import NewLaunchGames from '@/views/sports/Home/NewLaunchGames.vue'
import { useMobileSportsShellChrome } from '@/composables/useMobileSportsShellChrome.js'
import { useHeaderLayoutMetrics, useAppBarHeightObserver } from '@/composables/useHeaderLayoutMetrics.js'
import WalletInfo from '@/components/WalletInfo.vue'
import UserAccountDrawer from '@/components/UserAccountDrawer.vue'
import HeaderAnnouncementBar from '@/components/HeaderAnnouncementBar.vue'
import HeaderSubHeader from '@/components/HeaderSubHeader.vue'
import { useExposureDialog } from '@/composables/useExposureDialog'
import { useSettingsStore } from '@/stores/settings.js'
import { openLoginModal } from '@/composables/useLoginModal.js'
import { buildWhatsAppSupportUrl } from '@/utils/whatsappSupportUrl.js'

const { t } = useI18n()

const uiStore = useUIStore()
const authStore = useAuthStore()
const eventsStore = useEventsStore()
const settingsStore = useSettingsStore()
const { isMobile } = useDevices()

const router = useRouter()
const route = useRoute()

const activeTab = ref('sports')
const { openExposureDialog } = useExposureDialog()
const showInlineSearch = ref(false)
const inlineSearchQuery = ref('')
const debouncedSearchQuery = ref('')
const headerSearchInput = ref(null)
const mobileSearchInput = ref(null)
const casinoGames = ref([])
const searchLoading = ref(false)
const searchError = ref(null)
let searchDebounceTimer = null

const sidebarOpen = computed({
  get: () => uiStore.isSidebarOpen,
  set: (value) => uiStore.setSidebarOpen(value)
})

const guestWhatsappUrl = computed(() => {
  const val = settingsStore.whatsappChannel?.trim()
  if (!val) return ''
  if (/^https?:\/\//i.test(val)) return val
  if (val.startsWith('+') || /^\d[\d\s\-().]+$/.test(val)) {
    return `https://wa.me/${val.replace(/\D/g, '')}`
  }
  return `https://whatsapp.com/channel/${val.replace(/^@/, '')}`
})

const isBetPage = computed(() => route.name === 'sport-bet' || route.name === 'races-bet')
const isCasinoPage = computed(() => route.path.startsWith('/casino/game'))

const isAuthPage = computed(() =>
  route.name === 'login' || route.name === 'signup' || route.name === 'forgot-password',
)

const isClearScreenPage = computed(() =>
  isAuthPage.value ||
  route.path === '/casino/game' ||
  route.path.startsWith('/casino/game/'),
)

/** Info/doc pages that span the full content width (no sidebar or right rail). */
const isFullWidthPage = computed(() => route.meta?.layoutProps?.fullWidth === true)

const isSportsBookPage = computed(
  () => route.path === '/sports-book' || route.path.startsWith('/sports-book/'),
)

const isMultiMarketPage = computed(() => route.name === 'multi-market')

const {
  isSportsShellPage,
  isLayoutShellPage,
  showMobileSportsChrome,
  suppressMobileSportsShellMarketingChrome,
  isMobileMarketShellPage,
  showMobileNewLaunchInShell,
  showSportsShellGifRow,
  showSportsShellMainBanner,
  showMobileProvidersInLayoutRail,
  showDesktopSportsShellRail,
  showHomeExchangeSection,
  isExchangeSportDetailPage,
  isCasinoListingPage,
  isHorseGreyhoundRacingPage,
} = useMobileSportsShellChrome()

const useReferenceSportsLayout = computed(
  () =>
    !isMobile.value &&
    !isClearScreenPage.value &&
    !isCasinoListingPage.value &&
    !isSportsBookPage.value &&
    !isFullWidthPage.value,
)

const showMobileBottomNav = computed(
  () => isMobile.value && !isClearScreenPage.value,
)

const useMobileBodyScroll = computed(
  () => isMobile.value && !isClearScreenPage.value && !showSiteFooter.value,
)

const showSiteFooter = computed(() => {
  if (isBetPage.value || isMultiMarketPage.value || isClearScreenPage.value) {
    return false;
  }
  if (isHorseGreyhoundRacingPage.value) {
    return !isMobile.value;
  }
  return !isMobile.value;
})

const showMobileFooter = computed(
  () =>
    isMobile.value &&
    isLayoutShellPage.value &&
    !isClearScreenPage.value &&
    !isHorseGreyhoundRacingPage.value,
)

const showMobileFooterOnly = computed(
  () =>
    isMobile.value &&
    isLayoutShellPage.value &&
    !isClearScreenPage.value &&
    (isHorseGreyhoundRacingPage.value ||
      isBetPage.value ||
      isMultiMarketPage.value),
)

const showLayoutRightRail = computed(
  () =>
    !isMobile.value &&
    !isClearScreenPage.value &&
    !isBetPage.value &&
    !isMultiMarketPage.value &&
    !isCasinoListingPage.value &&
    !isFullWidthPage.value,
)

const mobileSidebarTopOffsetPx = computed(() =>
  isMobile.value ? guestHeaderInsetPx.value : 0,
)

const mainContentStyle = computed(() => ({}))

const updateActiveTab = () => {
  if (route.path.startsWith('/sports') || route.path.startsWith('/racing')) {
    activeTab.value = 'sports'
  } else if (route.path.startsWith('/casino') || route.path.includes('casino')) {
    activeTab.value = 'casino'
  } else {
    activeTab.value = 'sports'
  }
}

watch(() => route.path, () => {
  updateActiveTab()
}, { immediate: true })

watch(isMobile, (newIsMobile) => {
  if (newIsMobile) {
    uiStore.closeSidebar()
  } else {
    uiStore.setSidebarOpen(true)
    uiStore.setSidebarCompact(false)
  }
}, { immediate: true })

onMounted(() => {
  syncBodyScrollClasses()
  guestHeaderClockTimer = setInterval(() => {
    currentDateTime.value = new Date()
  }, 1000)
  if (isMobile.value && uiStore.isSidebarOpen) {
    uiStore.closeSidebar()
  }
})

const SITE_FOOTER_BODY_SCROLL_CLASS = 'site-footer-page-scroll'
const MOBILE_PAGE_BODY_SCROLL_CLASS = 'mobile-page-scroll'

function syncBodyScrollClasses() {
  document.body.classList.toggle(
    MOBILE_PAGE_BODY_SCROLL_CLASS,
    useMobileBodyScroll.value,
  )
  document.body.classList.toggle(
    SITE_FOOTER_BODY_SCROLL_CLASS,
    showSiteFooter.value,
  )
}

watch(
  [isMobile, useMobileBodyScroll, showSiteFooter],
  syncBodyScrollClasses,
  { immediate: true },
)

const closeMobileSidebarOverlay = () => {
  if (!isMobile.value) return
  if (uiStore.isSidebarOpen) uiStore.closeSidebar()
}

const currentDateTime = ref(new Date())
let guestHeaderClockTimer = null

function getOrdinal(day) {
  if (day > 3 && day < 21) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

const formattedHeaderDate = computed(() => {
  const d = currentDateTime.value
  const month = d.toLocaleString('en-US', { month: 'long' })
  const day = d.getDate()
  return `${month} ${day}${getOrdinal(day)} ${d.getFullYear()}`
})

const formattedHeaderTime = computed(() =>
  currentDateTime.value
    .toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    .toLowerCase()
)

const whatsappLink = computed(() => {
  const channel = settingsStore.whatsappChannel
  return channel ? buildWhatsAppSupportUrl(channel) : ''
})

const handleGuestLoginClick = () => {
  closeMobileSidebarOverlay()
  if (route.name === 'login') return
  openLoginModal()
}

const handleGuestSignupClick = () => {
  closeMobileSidebarOverlay()
}

const handleGuestGetIdClick = () => {
  closeMobileSidebarOverlay()
  if (whatsappLink.value) {
    window.open(whatsappLink.value, '_blank', 'noopener,noreferrer')
    return
  }
  router.push({ name: 'signup' })
}

const openInlineSearch = () => {
  closeMobileSidebarOverlay()
  showInlineSearch.value = true
  ensureInlineSearchData()
  nextTick(() => {
    if (isMobile.value) {
      mobileSearchInput.value?.focus?.()
      return
    }
    headerSearchInput.value?.focus?.()
  })
}

const closeInlineSearch = () => {
  showInlineSearch.value = false
  inlineSearchQuery.value = ''
  debouncedSearchQuery.value = ''
}

const submitInlineSearch = () => {
  // Results are shown inline in the dropdown list.
}

const showSearchDropdown = computed(() => debouncedSearchQuery.value.trim().length > 0)

const desktopInlineSearchRoot = ref(null)

function closeDesktopInlineSearchDropdown() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
  inlineSearchQuery.value = ''
  debouncedSearchQuery.value = ''
  headerSearchInput.value?.blur?.()
}

function onDocumentPointerDownCloseDesktopSearch(e) {
  if (isMobile.value) return
  const root = desktopInlineSearchRoot.value
  const t = e.target
  if (!root || !(t instanceof Node) || root.contains(t)) return
  closeDesktopInlineSearchDropdown()
}

watch([showSearchDropdown, isMobile], ([dropdownOpen, mobile]) => {
  if (typeof document === 'undefined') return
  document.removeEventListener('pointerdown', onDocumentPointerDownCloseDesktopSearch, true)
  if (dropdownOpen && !mobile) {
    document.addEventListener('pointerdown', onDocumentPointerDownCloseDesktopSearch, true)
  }
})

async function ensureInlineSearchData() {
  if (searchLoading.value) return
  searchLoading.value = true
  searchError.value = null
  try {
    if (!eventsStore.hasEventsData) {
      await eventsStore.fetchAllEvents()
    }
    if (casinoGames.value.length === 0) {
      const response = await getCasinoGames()
      const gamesData = response?.data || response || {}
      const games = []
      Object.keys(gamesData).forEach((product) => {
        const productData = gamesData[product]
        if (!productData || typeof productData !== 'object') return
        Object.keys(productData).forEach((gameType) => {
          const list = Array.isArray(productData[gameType])
            ? sortCasinoGamesByPriority(productData[gameType])
            : []
          list.forEach((game) => {
            games.push({
              ...game,
              product: game.product || product,
              game_type: game.game_type || gameType
            })
          })
        })
      })
      casinoGames.value = games
    }
  } catch (err) {
    searchError.value = err?.message || 'Failed to load search data'
  } finally {
    searchLoading.value = false
  }
}

function handleInlineEventSelected() {
  closeInlineSearch()
}

function handleInlineGameSelected() {
  closeInlineSearch()
}

watch(
  () => router.currentRoute.value.fullPath,
  () => {
    if (isMobile.value && showInlineSearch.value) {
      closeInlineSearch()
    }
  }
)

watch(inlineSearchQuery, (value) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = value
  }, 120)
})

watch(showInlineSearch, (isOpen) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

watch(isAuthPage, (onAuthPage) => {
  if (onAuthPage) {
    closeInlineSearch()
    closeDesktopInlineSearchDropdown()
  }
})

onUnmounted(() => {
  if (guestHeaderClockTimer) clearInterval(guestHeaderClockTimer)
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onDocumentPointerDownCloseDesktopSearch, true)
    document.body.style.overflow = ''
    document.body.classList.remove(SITE_FOOTER_BODY_SCROLL_CLASS)
    document.body.classList.remove(MOBILE_PAGE_BODY_SCROLL_CLASS)
  }
})

// User profile dropdown (mirrors authenticated Header for demo users)
const userMenuOpen = ref(false)

watch(userMenuOpen, (open) => {
  if (open) closeMobileSidebarOverlay()
})

watch(
  () => uiStore.accountMenuOpenRequestId,
  (id, prev) => {
    if (id && id !== prev && (authStore.isUiAuthenticated || authStore.isDemoUser)) {
      userMenuOpen.value = true
    }
  },
)

const userName = computed(() =>
  authStore.currentUser?.username || authStore.currentUser?.name || 'Demo User'
)

const demoWalletSummaryRows = computed(() => [
  { key: 'balance', labelKey: 'header.user.walletSummary.balance', value: '0' },
  { key: 'exposure', labelKey: 'header.user.walletSummary.exposure', value: '0' },
  { key: 'bonus', labelKey: 'header.user.walletSummary.bonus', value: '₹ 0' },
])

function handleDemoDrawerNavigate(item) {
  if (item?.action === 'exposure') {
    userMenuOpen.value = false
    openExposureModal()
    return
  }
  userMenuOpen.value = false
  if (item?.to) router.push(item.to)
}

function goToDemoDeposit() {
  userMenuOpen.value = false
  router.push('/deposit')
}

function goToDemoWithdraw() {
  userMenuOpen.value = false
  router.push('/withdrawal')
}

function goToDemoBonuses() {
  userMenuOpen.value = false
  router.push('/bonuses')
}

const userAvatar = computed(() => authStore.currentUser?.avatar || null)

const handleLogout = async () => {
  userMenuOpen.value = false
  await authStore.logout()
  // Keep demo users on login screen after logout.
  router.push({ name: 'login' })
}

const openExposureModal = () => {
  closeMobileSidebarOverlay()
  openExposureDialog()
}

const {
  showAnnouncementStrip,
  dismissAnnouncementStrip,
  shouldShowSubHeader,
  appBarHeightPx: guestAppBarHeightPx,
  effectiveHeaderInsetPx: guestHeaderInsetPx,
  desktopHeaderFlowSpacerPx: guestDesktopHeaderFlowSpacerPx,
} = useHeaderLayoutMetrics({ variant: 'guest' })

const guestAppBarRef = ref(null)
useAppBarHeightObserver(guestAppBarRef)

</script>

<style scoped>
/* White band under fixed header/announcement — matches reference md:mt-[100px] gap */
.layout-header-flow-spacer {
  background: #ffffff;
}

.guest-layout-top-nav {
  background: linear-gradient(180deg, #17191e 0%, #0c0e12 100%);
}

.guest-main-desktop-pad {
  padding-top: 0 !important;
  padding-right: 0 !important;
  padding-bottom: 1.5rem !important;
}

.layout-footer {
  flex-shrink: 0;
  position: relative;
  z-index: 3;
}

.guest-layout-body-stack--footer-doc {
  flex: 1 1 auto;
  min-height: 0;
  overflow: visible;
}

.guest-layout-body--footer-doc {
  flex: 1 1 auto !important;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: auto !important;
  min-height: 0 !important;
  overflow: visible !important;
  align-items: flex-start;
}

.guest-layout-body--full-width > .guest-layout-main {
  flex: 1 1 auto !important;
  width: 100% !important;
  max-width: 100% !important;
}

.guest-layout-main--full-width {
  flex: 1 1 auto !important;
  width: 100% !important;
  max-width: 100% !important;
}

.guest-layout-body--full-width .layout-page-content {
  width: 100%;
  max-width: 100%;
}

.guest-layout-body-stack--footer-doc .layout-sidebar-column :deep(.sidebar-desktop) {
  height: 100% !important;
  max-height: 100% !important;
}

.guest-layout-body-stack--footer-doc .layout-sidebar-column {
  position: sticky;
  top: var(--layout-sticky-top, 0px);
  max-height: var(--layout-sticky-pane-h, 100vh);
  z-index: 2;
  overflow: hidden;
}

.guest-layout-main--footer-doc {
  overflow: visible !important;
  min-width: 0 !important;
  min-height: 0 !important;
  height: auto !important;
  flex: 1 1 auto !important;
  max-width: 100%;
}

.guest-layout-body-stack--footer-doc .layout-page-content,
.guest-layout-body-stack--footer-doc .guest-sports-shell,
.guest-layout-body-stack--footer-doc .guest-sports-shell__content {
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

.guest-layout-body-stack--footer-doc .layout-page-content:has(.casino-page) {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.layout-right-rail--footer-doc {
  position: sticky;
  top: var(--layout-sticky-top, 0px);
  align-self: flex-start;
  max-height: var(--layout-sticky-pane-h, 100vh);
  overflow-y: auto;
  z-index: 1;
}

@media (min-width: 769px) {
  .layout-page-content:has(.bet-page-container),
  .layout-page-content.mm-multi-market-slot {
    flex: 1 1 auto;
    min-height: 0;
    position: relative;
    display: flex;
    flex-direction: column;
  }
}

.guest-sports-shell {
  display: block;
}

.guest-sports-shell__content {
  min-width: 0;
}

.guest-sports-shell__content--home-pad {
  /* Reference middle column is full-bleed (788px @ 1440); no desktop inset */
  padding-left: 0;
  padding-right: 0;
}

@media (max-width: 767px) {
  .guest-sports-shell__content--home-pad {
    padding: 0 4px 4px;
    box-sizing: border-box;
  }
}

.guest-whatsapp-support {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  text-align: center;
  text-decoration: none;
  color: inherit;
  border-radius: 0;
  padding: 10px 0;
  background: linear-gradient(0deg, #0a0a0a80 50%, #323232);
  border: 1px solid #fff;
  margin-bottom: 10px;
  box-sizing: border-box;
  cursor: pointer;
}

.guest-whatsapp-support:hover {
  opacity: 0.95;
}

.guest-whatsapp-support__text {
  display: block;
  width: 100%;
  max-width: 100%;
  padding: 0 8px;
  box-sizing: border-box;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 700;
  line-height: 1.2;
  transform-origin: center center;
  will-change: transform, color;
  animation: guest-whatsapp-text-pulse 5s ease infinite;
}

.guest-whatsapp-support__icon-wrap {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

@keyframes guest-whatsapp-text-pulse {
  0%,
  100% {
    transform: scale(1);
    color: #f0d060;
  }

  50% {
    transform: scale(1.04);
    color: var(--theme-orange, #f26c20);
  }
}

@media (min-width: 960px) {
  .guest-sports-shell {
    display: flex;
    flex-direction: column;
    gap: var(--layout-shell-section-gap, 6px);
  }

  .guest-sports-shell__rail {
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--color-background);
    border-radius: 8px;
  }

  .guest-sports-shell__rail > * {
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
  }

  .guest-sports-shell--single-col {
    display: flex;
    flex-direction: column;
  }
}

@media (min-width: 768px) {
  :deep(.v-toolbar.v-app-bar) {
    background: var(--color-header-bg-gradient, var(--color-header-bg)) !important;
    background-image: var(--color-header-bg-gradient, none) !important;
    box-shadow: none !important;
    border: none !important;
  }

  :deep(.v-toolbar__content) {
    background: var(--color-header-bg-gradient, var(--color-header-bg)) !important;
    background-image: var(--color-header-bg-gradient, none) !important;
    padding: 0 !important;
    align-items: stretch !important;
    box-shadow: none !important;
    border: none !important;
  }
}

@media (max-width: 767.98px) {
  :deep(.v-toolbar.v-app-bar),
  :deep(.v-toolbar__content) {
    padding: 0 !important;
    align-items: stretch !important;
    box-shadow: none !important;
    border: none !important;
  }
}

.guest-app-bar--search-open {
  overflow: visible !important;
}

.guest-app-bar--search-open :deep(.v-toolbar__content) {
  overflow: visible !important;
}


@media (min-width: 768px) {

  :deep(.guest-app-bar.v-toolbar.v-app-bar),
  :deep(.guest-app-bar .v-toolbar__content) {
    background: var(--color-header-bg-gradient, var(--color-header-bg, #360952)) !important;
    background-color: var(--color-header-bg, #360952) !important;
    background-image: var(--color-header-bg-gradient, none) !important;
    box-shadow: none !important;
    border: none !important;
  }

  /* Full-bleed like reference #navbar toolbar (lg:px-10 lives on the row, not Vuetify) */
  :deep(.guest-app-bar .v-toolbar__content) {
    padding: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }
}

/* ── Continuous header ticker ──────────────────────────────── */
.header-ticker-wrap {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  align-self: flex-start;
  height: auto;
  line-height: 16.5px;
  overflow: hidden;
  padding: 0 8px;
  gap: 6px;
  background: transparent;
}

.header-announce-strip--lane {
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  background: var(--color-header-marquee-bg);
  border: none;
  box-shadow: none;
  min-height: 12px;
  padding: 0;
  box-sizing: border-box;
}

.header-top-strip {
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  background: #000000;
  min-height: 6px;
  box-sizing: border-box;
}

.header-announce-strip--with-message {
  min-height: 30px;
  height: 30px;
  padding: 4px 0;
  box-sizing: border-box;
  align-items: flex-start !important;
}

.header-announce-speaker {
  flex: 0 0 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  margin-top: 0;
  flex-shrink: 0;
}

.header-announce-speaker__img {
  display: block;
  width: auto;
  height: 20px;
  max-width: 28px;
  object-fit: contain;
  margin: 0 auto;
}

.header-announce-strip--below {
  background: #ffffff !important;
}

.header-announce-strip--below .header-ticker-text {
  color: #000000 !important;
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  font-size: 11px;
  font-weight: 500;
  font-style: normal;
  letter-spacing: normal;
  line-height: 16.5px;
  text-transform: none;
  -webkit-font-smoothing: auto;
  -moz-osx-font-smoothing: auto;
}

.header-announce-strip--lane .header-ticker-wrap--strip {
  flex: 1 1 0 !important;
  min-width: 0 !important;
  width: auto !important;
  max-width: none !important;
  padding: 0;
  gap: 0;
}

@media (min-width: 768px) {
  .guest-toolbar-row {
    padding: 0 16px;
    height: 90px;
    min-height: 90px;
    width: 100%;
    box-sizing: border-box;
    border-bottom: none;
    background: var(--color-header-bg-gradient, var(--color-header-bg, #360952));
    gap: 8px;
  }

  .guest-header-brand {
    margin-left: 0;
    flex: none;
    display: inline-flex;
    align-items: center;
  }

  .guest-header-brand :deep(.header-brand-img) {
    height: 45px;
    width: auto;
    max-width: 240px;
    object-fit: contain;
  }

  .guest-desktop-auth-cluster {
    gap: 8px;
  }

  .guest-toolbar-right {
    gap: 8px;
    flex-shrink: 0;
  }

  .header-logo-slot {
    width: var(--header-logo-slot);
    min-width: var(--header-logo-slot);
    padding-top: 0;
  }

  .header-top-strip {
    width: 100vw;
    max-width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
  }

  /* Force demo wallet/user cluster area to black like reference header row */
  /* .guest-demo-user-cluster {
    background: #000000 !important;
  } */

  /* .guest-demo-user-cluster .guest-header-wallet-desktop,
  .guest-demo-user-cluster :deep(.wallet-info-root),
  .guest-demo-user-cluster :deep(.wallet-info-root--desktop) {
    background: #000000 !important;
  } */
}

@media (min-width: 1280px) {
  .guest-toolbar-row {
    padding-left: 80px;
    padding-right: 80px;
  }

  .guest-ref-auth-btn--register {
    background: transparent;
    color: #ffffff;
    border: 1px solid var(--color-get-id-border, #4ec9ee);
  }

  .guest-ref-auth-btn--register .guest-ref-auth-btn__icon {
    color: var(--color-wazir-green, #49915e) !important;
  }
}

.header-ticker-wrap--strip {
  flex: none !important;
  width: 100%;
  max-width: 100%;
  padding: 0;
}

.header-ticker-icon {
  flex-shrink: 0;
  font-size: 10px;
  line-height: 1;
}

.header-announce-strip--with-message .header-ticker-icon {
  font-size: 11px;
}

.header-ticker-track-wrap {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  height: auto;
  line-height: 16.5px;
  overflow: hidden;
  position: relative;
  align-self: flex-start;
}

.header-ticker-track {
  display: inline-flex;
  align-items: flex-start;
  line-height: 16.5px;
  white-space: nowrap;
  animation: headerTickerScroll linear infinite;
  will-change: transform;
}

.header-ticker-track-wrap:hover .header-ticker-track {
  animation-play-state: paused;
}

.header-ticker-text {
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: normal;
  line-height: 16.5px;
  font-style: normal;
  text-transform: none;
  -webkit-font-smoothing: auto;
  -moz-osx-font-smoothing: auto;
}

.header-announce-strip--with-message .header-ticker-text {
  font-size: 11px;
}

@keyframes headerTickerScroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}

@keyframes headerTickerScrollFromRight {
  0% {
    transform: translateX(100cqi);
  }

  100% {
    transform: translateX(-50%);
  }
}

.header-shell {
  --header-left-pad: 8px;
  --header-left-pad-md: 16px;
  --header-right-pad: 8px;
  --header-right-pad-md: 16px;
  --header-logo-slot: 136px;
}

@media (min-width: 768px) {
  .header-shell {
    --header-logo-slot: 168px;
  }
}

/* Prevent Vuetify from giving white bg to toolbar children */
:deep(.v-toolbar__content > div) {
  background: transparent !important;
}

/* ── Blinking action buttons ───────────────────────────────── */
.blink-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 5px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  border: none;
  transition: filter 0.2s;
}

.blink-btn--bonus {
  background-color: #0f2d5e;
  color: #facc15;
  box-shadow: none;
  animation: blinkNavyYellow 1s steps(1) infinite;
}

@keyframes blinkNavyYellow {

  0%,
  100% {
    background-color: #0f2d5e;
    color: #facc15;
  }

  50% {
    background-color: #facc15;
    color: #0f2d5e;
  }
}

.blink-btn:hover {
  filter: brightness(1.15);
  animation-play-state: paused;
}

/* Simple Navigation Links — theme orange on header */
.header-nav-link {
  text-decoration: none;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  padding: 7px 10px;
  border: 1px solid var(--theme-orange);
  border-radius: 999px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  background: var(--theme-orange);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.header-nav-link:hover {
  color: #ffffff;
  border-color: var(--color-button-dark-hover);
  background: var(--color-button-dark-hover);
}

.header-nav-link-active {
  color: #ffffff;
  border-color: var(--color-button-dark-hover);
  background: var(--color-button-dark-hover);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  font-weight: 700;
}

.header-nav-link-active:hover {
  color: #ffffff;
}

.search-icon-btn {
  background: transparent !important;
  border-color: rgba(255, 255, 255, 0.92) !important;
}

.search-icon-btn :deep(.v-icon),
.search-icon-btn :deep(svg) {
  color: rgba(255, 255, 255, 0.95) !important;
}

.search-icon-btn:hover {
  border-color: #ffffff !important;
}

.header-inline-search__input::placeholder {
  color: #8e8e93;
}

.header-inline-search {
  background: #2c2c2e;
  border: none;
  border-radius: 6px;
  padding: 0 12px 0 10px;
  gap: 0;
}

.header-inline-search__input {
  color: #ffffff !important;
}

.header-inline-search__icon {
  color: #ffffff !important;
  flex-shrink: 0;
  display: block;
}



.header-search-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 2000;
  background: #1c1d21;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  max-height: min(72vh, 560px);
}

.mobile-inline-search-overlay {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 900;
  background: rgba(0, 0, 0, 0.58);
  pointer-events: auto;
}

.header-announce-marquee-dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.58);
  pointer-events: none;
  z-index: 2;
}

.header-search-dropdown__body {
  padding: 4px 0;
}

.mobile-inline-search-wrap {
  gap: 4px;
}

.mobile-inline-search-back {
  border: none;
  background: transparent;
  color: #ffffff;
  width: 30px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  flex-shrink: 0;
}

.mobile-inline-search-field {
  min-height: 38px;
  border: none;
  border-radius: 6px;
  background: #2c2c2e;
  padding: 0 10px;
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  gap: 0;
}

.mobile-inline-search__icon {
  color: #ffffff !important;
  flex-shrink: 0;
}



.mobile-inline-search-input {
  color: #ffffff;
  text-align: left;
  font-size: clamp(11px, 2.8vw, 13px);
  font-weight: 400;
  line-height: 1.25;
  min-width: 0;
  letter-spacing: 0;
  padding: 0;
}

.mobile-inline-search-input::placeholder {
  color: #8e8e93;
  opacity: 1;
  font-size: inherit;
  letter-spacing: inherit;
}

/* Dark dropdown: readable colors on dark surface */
.header-search-dropdown :deep(.tw-text-theme-text) {
  color: #f5f5f5 !important;
}

.header-search-dropdown :deep(.tw-text-theme-text-secondary) {
  color: #9aa0a6 !important;
}

.header-search-dropdown :deep(.tw-border-theme-border) {
  border-color: rgba(255, 255, 255, 0.07) !important;
}

.header-search-dropdown :deep(button:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
}

/* Roomier rows with separator lines between results */
.header-search-dropdown :deep(.tw-space-y-0 > button) {
  padding: 10px 14px !important;
}

.header-search-dropdown :deep(.tw-space-y-0 > button:last-child) {
  border-bottom: none !important;
}

/* WazirWin guest auth buttons (reference Header logged-out) */
.header-desktop-search {
  height: 36px;
  border-radius: 9999px;
  border: 1px solid var(--color-search-input-border, #545454);
  background: var(--color-search-input-bg, #333333);
  padding: 0 12px 0 36px;
}

.header-desktop-search__icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #ffffff !important;
  flex-shrink: 0;
  pointer-events: none;
}

.header-desktop-search__input {
  color: #ffffff !important;
  font-size: 12px;
  line-height: 1.25;
  width: 100%;
  height: 100%;
}

.header-desktop-search__input::placeholder {
  color: #9ca3af;
}

.header-search-dropdown--desktop {
  left: 0;
  right: 0;
  top: calc(100% + 8px);
}

.header-desktop-datetime {
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  flex-shrink: 0;
}

.header-desktop-datetime__date {
  font-size: 12px;
  line-height: 1.25;
  color: var(--color-header-date-text, #eed1d5);
  white-space: nowrap;
}

.header-desktop-datetime__time {
  font-size: 14px;
  line-height: 1.25;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
}

.guest-ref-auth-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 35px;
  padding: 4px 16px;
  border: none;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-decoration: none !important;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
  transition: filter 0.15s ease, background-color 0.15s ease;
}

.guest-ref-auth-btn__icon {
  color: #000000 !important;
  flex-shrink: 0;
}

.guest-ref-auth-btn--login,
.guest-ref-auth-btn--get-id {
  background: var(--color-wazir-green, #49915e);
  color: #000000;
}

.guest-ref-auth-btn--register {
  background: var(--color-signup-btn-bg, #48494b);
  color: var(--color-wazir-green, #49915e);
}

.guest-ref-auth-btn--login:hover,
.guest-ref-auth-btn--get-id:hover,
.guest-ref-auth-btn--register:hover {
  filter: brightness(1.06);
}

.guest-auth-pair {
  flex-shrink: 0;
  gap: 4px;
  margin: -2px;
}

.guest-ref-auth-btn--mobile {
  height: 27px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  letter-spacing: 0.06em;
}

.guest-ref-auth-btn--mobile.guest-ref-auth-btn--register {
  color: var(--color-wazir-green, #49915e);
}

.guest-ref-auth-btn--mobile .guest-ref-auth-btn__icon {
  display: none;
}

@media (max-width: 768px) {
  .header-nav-link {
    font-size: 11px;
    padding: 6px 9px;
  }
}

.guest-mobile-menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: 0;
  margin-top: 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #ffffff;
}

.guest-mobile-menu-btn__icon {
  display: block;
  height: 15px;
  width: auto;
  max-width: 21px;
  object-fit: contain;
}

.guest-mobile-menu-btn :deep(.v-icon) {
  color: #ffffff !important;
}

.guest-mobile-home-btn {
  text-decoration: none;
}

@media (min-width: 768px) {
  .guest-mobile-menu-btn {
    display: none !important;
  }
}

@media (max-width: 767.98px) {

  .guest-app-bar--search-open .guest-app-bar-inner>* {
    pointer-events: none;
  }

  .guest-mobile-menu-btn {
    margin-left: 0 !important;
    margin-right: 0;
  }

  .guest-app-bar--search-open .mobile-inline-search-wrap,
  .guest-app-bar--search-open .mobile-inline-search-wrap * {
    pointer-events: auto;
  }

  .mobile-inline-search-wrap {
    position: relative;
    z-index: 1200;
  }

  .guest-app-bar--search-open .header-announce-strip--lane {
    z-index: 1;
  }

  .header-search-dropdown--mobile {
    position: fixed;
    left: 0;
    right: 0;
    z-index: 2600;
    width: 100%;
    border: none;
    border-radius: 0 0 12px 12px;
    box-shadow: none;
    overflow: hidden;
    background: #ffffff;
  }

  .header-search-dropdown--mobile .header-search-dropdown__body {
    padding: 0;
    max-height: inherit;
    overflow-y: auto;
  }

  .header-search-dropdown--mobile :deep(.search-results--compact button) {
    display: block;
    width: 100%;
    padding: 11px 16px;
    margin: 0;
    border: none;
    border-bottom: 1px solid #ececec;
    border-radius: 0;
    background: #ffffff;
  }

  .header-search-dropdown--mobile :deep(.search-results--compact button:last-child) {
    border-bottom: none;
  }

  .header-search-dropdown--mobile :deep(.search-results__title) {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.35;
    color: #111111;
  }

  .header-search-dropdown--mobile :deep(.search-results--compact button:active) {
    background: #f5f5f5;
  }

  .header-search-dropdown--mobile :deep(.search-results__state) {
    padding: 12px 16px;
    font-size: 14px;
    color: #5a6a72;
  }

  /* Mobile search open: keep loginInputBg shell (mobile-header.css owns default layering) */
  .guest-app-bar--search-open :deep(.v-toolbar.v-app-bar),
  .guest-app-bar--search-open :deep(.v-toolbar__content),
  .guest-app-bar--search-open .mobile-inline-search-wrap {
    background: var(--color-login-input-bg, #23201f) !important;
    background-color: var(--color-login-input-bg, #23201f) !important;
  }

  .guest-auth-pair {
    gap: 4px !important;
  }

  .header-mobile-wallet-user-pill {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 32px;
    padding: 4px 8px 4px 10px;
    margin: 0;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    background: var(--theme-orange);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
    color: #ffffff;
  }

  .header-mobile-wallet-user-pill__icon {
    color: #ffffff !important;
    flex-shrink: 0;
  }

  .header-announce-strip--mobile-top {
    border-bottom: none;
    min-height: 22px;
  }

  .header-announce-strip--mobile-top .header-ticker-text {
    color: #ffffff !important;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-family: Georgia, 'Times New Roman', serif;
  }

  .header-announce-strip--mobile-top .header-ticker-wrap {
    padding: 3px 8px;
  }

  .header-announce-strip--lane {
    min-height: 0;
  }

  .header-announce-strip--lane .header-ticker-text {
    font-size: 9px;
  }

  .header-announce-strip--lane .header-ticker-wrap {
    padding: 0;
    gap: 4px;
  }

  .header-announce-strip--lane .header-ticker-track-wrap {
    container-type: inline-size;
  }

  .header-ticker-track--from-right {
    animation-name: headerTickerScrollFromRight;
  }

  .header-profile-trigger-mobile {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    background: var(--theme-orange);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
    color: #ffffff;
  }

  .header-profile-trigger-mobile__icon {
    color: #ffffff !important;
  }

  .guest-toolbar-right:has(.guest-header-wallet) {
    padding-top: 15px;
    box-sizing: border-box;
  }

  .guest-header-wallet :deep(.wallet-info-root--mobile) {
    max-width: 100%;
    align-items: center;
  }

  .guest-header-wallet :deep(.wallet-info-root--mobile > div) {
    justify-content: center;
    width: 100%;
  }

  .guest-header-wallet {
    position: relative;
    overflow: visible;
    align-items: center !important;
    justify-content: center;
    gap: 0;
    padding: 0;
    min-height: 0;
  }

  .guest-mobile-user-name {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 3px);
    transform: translateX(-50%);
    max-width: 7.8rem;
    margin: 0;
    padding: 0;
    color: rgba(255, 255, 255, 0.95);
    font-size: 10px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  }

  /* Guest mobile home: New Launch — 4 tiles visible; carousel steps one tile when >4 games */
  :deep(.new-launch-wrap .new-launch-header) {
    padding: 7px 10px !important;
    display: flex !important;
    justify-content: center !important;
  }

  :deep(.new-launch-wrap .new-launch-header__text) {
    font-size: 18px !important;
    font-weight: 500 !important;
    line-height: 1 !important;
    letter-spacing: 0.02em !important;
    text-align: center !important;
    animation: none !important;
    transform: none !important;
  }

  :deep(.favourites-section__header) {
    display: flex !important;
    justify-content: center !important;
  }

  :deep(.favourites-section__title) {
    text-align: center !important;
    font-weight: 500 !important;
  }

  :deep(.favourites-section__title--animated) {
    animation: none !important;
    transform: none !important;
  }

  :deep(.new-launch-wrap .new-launch-grid) {
    display: block !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    box-sizing: border-box !important;
    padding: 3px 1px !important;
    background: #ffffff !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-width: none !important;
    scroll-snap-type: x mandatory !important;
    touch-action: pan-x !important;
    overscroll-behavior-x: contain !important;
  }

  :deep(.new-launch-wrap .new-launch-grid::-webkit-scrollbar) {
    display: none !important;
  }

  :deep(.new-launch-wrap .new-launch-grid__track) {
    display: flex !important;
    flex-wrap: nowrap !important;
    align-items: stretch !important;
    will-change: scroll-position !important;
  }

  :deep(.new-launch-wrap .new-launch-grid__tile) {
    flex: 0 0 calc(100% / 4) !important;
    width: calc(100% / 4) !important;
    max-width: calc(100% / 4) !important;
    min-width: 0 !important;
    box-sizing: border-box;
    padding: 0 1px !important;
    background: #ffffff !important;
    border: none !important;
    scroll-snap-align: start !important;
  }

  :deep(.new-launch-wrap .new-launch-grid__media) {
    position: relative !important;
    aspect-ratio: unset !important;
    overflow: hidden !important;
    background: #0a1628 !important;
    border-radius: 6px !important;
    height: 37vw !important;
    min-height: 0 !important;
  }

  :deep(.new-launch-wrap .new-launch-grid__bg) {
    display: none !important;
  }

  :deep(.new-launch-wrap .new-launch-grid__img) {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    object-position: center center !important;
    display: block !important;
  }
}

.layout-mobile-new-launch-wrap {
  padding: 0 !important;
  margin: 0 !important;
}

.layout-mobile-new-launch-wrap :deep(.new-launch-wrap) {
  border: none !important;
  border-top: 1px solid #b7862f !important;
  border-bottom: 1px solid #b7862f !important;
  background: #0a1628 !important;
  margin: 0 !important;
}

.layout-mobile-new-launch-wrap :deep(.new-launch-header) {
  background: linear-gradient(180deg, #c9a043 0%, #a07828 100%) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2) !important;
  padding: 5px 8px !important;
  display: flex !important;
  justify-content: center !important;
}

.layout-mobile-new-launch-wrap :deep(.new-launch-header__text) {
  font-size: 13px !important;
  font-weight: 800 !important;
  color: #ffffff !important;
  letter-spacing: 0.08em !important;
  line-height: 1 !important;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
}
</style>
