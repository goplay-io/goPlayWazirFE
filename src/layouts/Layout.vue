<template>
  <!--
    Footer pages use document/body scroll (site-footer-page-scroll) — same idea as mobile bet.
    Locked inner scroll + Vuetify v-main was clipping the event list and right rail.
    Non-footer pages keep the bounded h-full shell with #app-main-scroll.
  -->
  <div
    class="tw-bg-theme-background tw-flex tw-flex-col"
    :class="[
      (useMobileBodyScroll || showSiteFooter)
        ? 'tw-min-h-screen'
        : 'tw-h-full tw-max-h-full tw-overflow-hidden',
      { 'layout-home-shell-bg': showHomeExchangeSection },
    ]"
  >
    <!-- Full Width Header (mobile casino game uses in-page bar only — reference has no app header) -->
    <Header
      v-if="!(isMobile && isClearScreenPage)"
      @toggle-drawer="handleToggleDrawer"
      @set-active-tab="handleSetActiveTab"
      :activeTab="activeTab"
    />

    <!-- Fixed v-app-bar does not take up layout flow; reserve the same height as Header.vue headerBarTotalPx
         so TopNavigation is not painted under the gold bar (otherwise you see an empty white strip = v-main surface). -->
    <div
      v-if="!isMobile"
      class="layout-header-flow-spacer tw-shrink-0 tw-pointer-events-none"
      :style="{ height: desktopHeaderFlowSpacerPx + 'px', width: '100%' }"
      aria-hidden="true"
    />

    <!-- Content Area: footer pages grow with content (body scrolls); others use inner #app-main-scroll. -->
    <div
      class="layout-body-stack tw-flex tw-flex-1 tw-min-h-0 tw-flex-col"
      :class="{ 'layout-body-stack--footer-doc': showSiteFooter }"
      :style="showSiteFooter ? {
        '--layout-sticky-top': `${desktopHeaderFlowSpacerPx}px`,
        '--layout-sticky-pane-h': `calc(100vh - ${desktopHeaderFlowSpacerPx}px)`,
      } : undefined"
    >
      <div
        class="layout-content-row tw-flex tw-min-w-0 tw-gap-0"
        :class="[
          showHomeExchangeSection ? '' : 'tw-bg-white',
          useMobileBodyScroll ? 'layout-content-row--mobile-bet' : '',
          showSiteFooter
            ? 'layout-content-row--footer-doc'
            : 'tw-flex-1 tw-min-h-0 tw-overflow-hidden',
          useReferenceSportsLayout ? 'layout-content-row--reference-pad' : '',
          showLayoutRightRail ? 'layout-content-row--with-right-rail' : '',
          isFullWidthPage ? 'layout-content-row--full-width' : '',
        ]"
      >
      <!-- Sidebar: reference 20% column (lg+) + mobile overlay drawer -->
      <div
        v-if="props.sidebar && !isClearScreenPage && !isCasinoListingPage && !isFullWidthPage"
        class="layout-sidebar-column"
      >
        <Sidebar
          v-model="sidebarOpen"
          :compact="false"
          :top-offset="mobileSidebarTopOffsetPx"
        />
      </div>

      <!-- Main Content Area -->
      <!-- Desktop: header spacer already reserves space for fixed v-app-bar; Vuetify --v-layout-top on v-main
           would duplicate it — empty band reads as white (very visible on bet page absolute layout). -->
      <v-main class="tw-flex tw-flex-col tw-min-w-0" :class="[
        'tw-flex-1',
        showSiteFooter
          ? 'layout-v-main--footer-doc'
          : (useMobileBodyScroll ? 'layout-v-main--mobile-bet-overflow' : 'tw-overflow-hidden tw-min-h-0'),
        { 'tw-ml-0': !props.sidebar },
        !isMobile ? 'layout-v-main--desktop' : 'layout-v-main--mobile',
        useMobileBodyScroll ? 'layout-v-main--mobile-bet' : '',
        isMobile && isClearScreenPage ? 'layout-v-main--clear-screen' : '',
        !isMobile && isSportsBetPage ? 'layout-v-main--bet-desktop' : '',
        isFullWidthPage ? 'layout-v-main--full-width' : '',
        activeTab === 'casino'
          ? 'casino-layout-main'
          : activeTab === 'sports'
            ? 'sports-layout-main'
            : 'tw-bg-theme-surface-alt'
      ]">

        <v-container
          id="app-main-scroll"
          fluid
          class="tw-flex tw-flex-col tw-min-w-0 tw-overflow-x-clip layout-app-main-scroll"
          :class="[
          {
            'tw-flex-1 tw-min-h-0': !showSiteFooter && !useMobileBodyScroll,
            'tw-overflow-y-auto scrollbar-primary': !showSiteFooter && !isMultiMarketPage && !useMobileBodyScroll && !(isMobile && isClearScreenPage),
            'layout-app-main-scroll--footer-doc': showSiteFooter,
            'layout-app-main-scroll--mobile-bet': useMobileBodyScroll,
            'layout-app-main-scroll--clear-screen': isMobile && isClearScreenPage,
          },
          isMobile
            ? 'tw-pt-0 tw-px-0'
            : 'tw-p-0',
          activeTab === 'sports' || activeTab === 'casino' ? '' : 'tw-bg-theme-surface-alt'
        ]" :style="isMobile ? { paddingLeft: '0px', paddingRight: '0px', marginLeft: 0, marginRight: 0 } : {}">
          <!-- Mobile INPLAY / sport tabs: hidden when HomeExchangeSection or sport detail owns navigation -->
          <!-- <LayoutMobileSportsTabStrip v-if="!showHomeExchangeSection && !isExchangeSportDetailPage" /> -->
          <div class="layout-page-content" :class="{
            'tw-px-0': isMobile,
            'tw-min-h-0': (isMultiMarketPage || isBetPage) && !isMobile,
            'tw-flex tw-flex-col tw-flex-1': (isMultiMarketPage || isBetPage) && !isMobile,
            'mm-multi-market-slot tw-relative tw-overflow-hidden': isMultiMarketPage && !isMobile,
          }">
            <div v-if="isLayoutShellPage" class="sports-layout-shell"
              :class="{ 'sports-layout-shell--single-col': !isMobile && (isBetPage || isMultiMarketPage || !showDesktopSportsShellRail) }">
              <div
                class="sports-layout-shell__content"
                :class="{
                  'sports-layout-shell__content--home-pad': showHomeExchangeSection,
                  'sports-layout-shell__content--reference-home': showHomeExchangeSection,
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
                <slot></slot>
              </div>
              <div v-if="!isMobile && !isBetPage && !isMultiMarketPage && showDesktopSportsShellRail"
                class="sports-layout-shell__rail">
                <SportsSharedRail variant="desktop" />
              </div>
            </div>
            <template v-else>
              <slot></slot>
            </template>
            <SportsSharedRail v-if="isLayoutShellPage && isMobile && showMobileProvidersInLayoutRail" variant="mobile"
              segment="providers" />
            <HomeMobileEndSections
              v-if="showMobileFooter || showMobileFooterOnly"
              :footer-only="showMobileFooterOnly"
            />
          </div>

        </v-container>

      </v-main>

      <!-- Right rail: bet slip + promo (desktop only) -->
      <LayoutRightRail
        v-if="showLayoutRightRail"
        :sticky-footer-doc="showSiteFooter"
        :open-bets-use-unsettled="showHomeExchangeSection"
        :home-reference-layout="showHomeExchangeSection"
      />
      </div>

      <!-- Reserve space for fixed bottom nav at the body-stack level (reliable vs v-main__wrap flex) -->
      <div v-if="showMobileBottomNav" class="layout-mobile-bottom-nav-spacer md:tw-hidden" aria-hidden="true" />

      <!-- Full-width footer: after main content; reached via document scroll -->
      <Footer v-if="showSiteFooter" />
    </div>

    <MobileBottomNav v-if="showMobileBottomNav" />

    <!-- Mobile floating actions -->
    <Teleport to="body">
      <DesktopCustomerSupportFloat />
    </Teleport>

  </div>
</template>

<script setup>
import Header from './Header.vue'
import Sidebar from './Sidebar.vue'
import FloatingBonusButton from '../components/FloatingBonusButton.vue'
import { useWalletRefresh } from '@/composables/useWalletRefresh.js'
import { useUIStore } from '@/stores/ui.js'
import useDevices from '@/composables/useDevices.js'
import { defineProps, watch, onMounted, onUnmounted, computed, ref, Teleport } from 'vue'
import { usePageSwitchStore } from '@/stores/pageSwitchStore.js'
import { useRoute, useRouter } from 'vue-router'
import Footer from '@/components/Footer.vue'
import DesktopCustomerSupportFloat from '@/components/DesktopCustomerSupportFloat.vue'
import HomeMobileEndSections from '@/components/home/HomeMobileEndSections.vue'
import MobileBottomNav from '@/components/MobileBottomNav.vue'
import HomeReferenceMiddleSections from '@/components/home/HomeReferenceMiddleSections.vue'
import SportsMainBanner from '@/components/sports/SportsMainBanner.vue'
import SportsSharedGifRow from '@/components/sports/SportsSharedGifRow.vue'
import SportsSharedRail from '@/components/sports/SportsSharedRail.vue'
import LayoutRightRail from '@/components/layout/LayoutRightRail.vue'
// import LayoutMobileSportsTabStrip from '@/components/sports/LayoutMobileSportsTabStrip.vue'
import NewLaunchGames from '@/views/sports/Home/NewLaunchGames.vue'
import { useMobileSportsShellChrome } from '@/composables/useMobileSportsShellChrome.js'
import { useHeaderLayoutMetrics } from '@/composables/useHeaderLayoutMetrics.js'

const uiStore = useUIStore()
const { isMobile } = useDevices()
const pageSwitchStore = usePageSwitchStore()
const route = useRoute()
const router = useRouter()

/** Mobile-only featured events slider strip below the toolbar. */
const SLIDER_STRIP_PX = 56

const {
  desktopHeaderFlowSpacerPx,
  effectiveHeaderInsetPx,
} = useHeaderLayoutMetrics({ variant: 'auth' })

const stickyTopBelowHeaderPx = computed(() => {
  let total = effectiveHeaderInsetPx.value
  if (isMobile.value && uiStore.featuredSliderVisible) total += SLIDER_STRIP_PX
  return total
})
/** Mobile overlay drawer starts below header (+ optional top nav on routes that show it) */
const mobileSidebarTopOffsetPx = computed(() => {
  if (!isMobile.value) return 0
  return stickyTopBelowHeaderPx.value
})

// Pages that show only the header (no sidebar, announcement, upcoming event, top nav)
const clearScreenPages = ['/casino/game']

const isClearScreenPage = computed(() =>
  clearScreenPages.some((path) => route.path === path || route.path.startsWith(path + '/'))
)

/** Info/doc pages that span the full content width (no sidebar or right rail). */
const isFullWidthPage = computed(() => route.meta?.layoutProps?.fullWidth === true)

const isSportsBookPage = computed(
  () => route.path === '/sports-book' || route.path.startsWith('/sports-book/'),
)

// Hide footer / bottom nav on bet pages (they manage their own layout/scroll)
const isBetPage = computed(() => route.name === 'sport-bet' || route.name === 'races-bet')

/** Sports event bet detail — grey chrome in Bet.vue; v-main should match (racing bet uses lighter tokens). */
const isSportsBetPage = computed(() => route.name === 'sport-bet')

// Check if we're on multi-market page
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

/** WazirWin AppLayout gutters + 20%/80% split (not casino / sportsbook / full-width). */
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

/** Mobile: document/body scroll (pull-to-refresh + bottom nav clearance). Casino game keeps inner scroll. */
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
  if (isMobile.value) {
    return false;
  }
  return !isExchangeSportDetailPage.value;
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

// Active tab state management
const activeTab = ref('sports')

// Computed property for v-model binding with the sidebar
const sidebarOpen = computed({
  get: () => uiStore.isSidebarOpen,
  set: (value) => uiStore.setSidebarOpen(value)
})

// Props for the layout, if needed in the future
const props = defineProps({
  topNavigation: {
    type: Boolean,
    default: false
  },
  sidebar: {
    type: Boolean,
    default: true
  }
})

// Handle toggle drawer behavior based on device type
const handleToggleDrawer = () => {
  uiStore.toggleSidebar()
}

// Handle tab switching from header
const handleSetActiveTab = (tab) => {
  activeTab.value = tab

  // Auto-redirect to the home page of the selected section
  if (tab === 'sports') {
    // Only redirect if not already on a sports route (sports featured is sports home)
    if (!route.path.startsWith('/sports') && !route.path.startsWith('/racing')) {
      router.push({ name: 'home' })
    }
  } else if (tab === 'casino') {
    // Only redirect if not already on a casino route
    if (!route.path.startsWith('/casino')) {
      router.push('/casino')
    }
  }
}

// Auto-switch tab based on current route
const updateActiveTab = () => {
  if (route.path.startsWith('/sports') || route.path.startsWith('/racing')) {
    activeTab.value = 'sports'
  } else if (route.path.startsWith('/casino') || route.path.includes('casino')) {
    activeTab.value = 'casino'
  } else {
    // Default to sports for other routes
    activeTab.value = 'sports'
  }
}

// Watch for route changes to update active tab
watch(() => route.path, () => {
  updateActiveTab()
}, { immediate: true })

// Watch for mobile state changes and close sidebar on mobile
watch(isMobile, (newIsMobile) => {
  if (newIsMobile) {
    uiStore.closeSidebar()
  } else {
    uiStore.setSidebarOpen(true)
    uiStore.setSidebarCompact(false)
  }
}, { immediate: true })

const MOBILE_PAGE_BODY_SCROLL_CLASS = 'mobile-page-scroll'
const SITE_FOOTER_BODY_SCROLL_CLASS = 'site-footer-page-scroll'

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

// Ensure sidebar is closed on mobile when component mounts
onMounted(() => {
  syncBodyScrollClasses()
  if (isMobile.value && uiStore.isSidebarOpen) {
    uiStore.closeSidebar()
  }
})

onUnmounted(() => {
  document.body.classList.remove(MOBILE_PAGE_BODY_SCROLL_CLASS)
  document.body.classList.remove(SITE_FOOTER_BODY_SCROLL_CLASS)
})

// Auto-refresh wallet balance every 2 minutes
useWalletRefresh(2)


</script>

<style scoped>
/* White band under fixed header/announcement — home uses .layout-home-shell-bg override */
.layout-header-flow-spacer {
  background: #ffffff;
}

.layout-home-shell-bg .layout-header-flow-spacer {
  background: var(--color-login-input-bg) !important;
}

.casino-layout-main {
  position: relative;
  min-height: 0;
  flex: 1 1 auto;
  z-index: 0;
}

@media (max-width: 767px) {
  .layout-v-main--clear-screen.casino-layout-main {
    padding-top: 0 !important;
  }
}

/* Full-screen casino game: fixed iframe fills below header — no 100vh min or inner scroll */
.layout-v-main--clear-screen.casino-layout-main {
  min-height: 0 !important;
  flex: 1 1 auto !important;
}

.layout-v-main--clear-screen.casino-layout-main :deep(.v-main__wrap) {
  min-height: 0 !important;
}

.sports-layout-main {
  position: relative;
  min-height: 0;
  flex: 1 1 auto;
  z-index: 0;
}

/* Mobile sport/racing bet: document/body scroll — v-main must span full row width */
.layout-v-main--mobile-bet.sports-layout-main {
  min-height: 0 !important;
  flex: 1 1 auto !important;
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;
  align-self: stretch !important;
}

.layout-v-main--mobile-bet.sports-layout-main :deep(.v-main__wrap) {
  flex: 0 0 auto !important;
  min-height: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
}

/* Mobile bet: body scroll — parents must not clip growing page height */
.layout-content-row--mobile-bet {
  overflow: visible !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}

.layout-v-main--mobile-bet-overflow {
  overflow: visible !important;
}

.layout-v-main--mobile-bet-overflow :deep(.v-main__wrap) {
  overflow: visible !important;
}

.layout-app-main-scroll--mobile-bet {
  overflow: visible !important;
  padding-bottom: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  flex: 0 0 auto !important;
}

.layout-app-main-scroll--mobile-bet .layout-page-content {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}

#app-main-scroll.layout-app-main-scroll {
  padding-bottom: 1.5rem;
}

@media (max-width: 767px) {
  #app-main-scroll.layout-app-main-scroll:not(.layout-app-main-scroll--clear-screen) {
    padding-bottom: 0 !important;
  }
}

.layout-footer {
  flex-shrink: 0;
  position: relative;
  z-index: 3;
}

/* Footer pages: document/body scrolls; content grows so site-footer sits at viewport bottom */
.layout-body-stack--footer-doc {
  flex: 1 1 auto;
  min-height: 0;
  overflow: visible;
}

.layout-content-row--footer-doc {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: auto;
  min-height: 0;
  overflow: visible;
  align-items: flex-start;
}

.layout-content-row--full-width > .layout-v-main {
  flex: 1 1 auto !important;
  width: 100% !important;
  max-width: 100% !important;
}

.layout-v-main--full-width {
  flex: 1 1 auto !important;
  width: 100% !important;
  max-width: 100% !important;
}

.layout-content-row--full-width .layout-page-content {
  width: 100%;
  max-width: 100%;
}

/*
 * Sticky left nav: pins under the header while the middle column scrolls, then
 * releases with the content row so it never overlays the full-width footer.
 * align-self:flex-start + viewport height are required — stretch would make the
 * pane as tall as the event list and sticky would have nowhere to pin.
 */
.layout-body-stack--footer-doc .layout-sidebar-column :deep(.sidebar-desktop) {
  height: 100% !important;
  max-height: 100% !important;
}

.layout-right-rail--footer-doc {
  position: sticky;
  top: var(--layout-sticky-top, 0px);
  align-self: flex-start;
  max-height: var(--layout-sticky-pane-h, 100vh);
  overflow-y: auto;
  z-index: 1;
}

.layout-v-main--footer-doc {
  overflow: visible !important;
  min-width: 0 !important;
  min-height: 0 !important;
  height: auto !important;
  flex: 1 1 auto !important;
  max-width: 100%;
}

.layout-v-main--footer-doc :deep(.v-main__wrap) {
  display: block !important;
  overflow: visible !important;
  min-height: 0 !important;
  height: auto !important;
  max-height: none !important;
  flex: none !important;
}

.layout-body-stack--footer-doc .sports-layout-main,
.layout-body-stack--footer-doc .casino-layout-main {
  min-height: 0 !important;
  height: auto !important;
  flex: 1 1 auto !important;
}

.layout-app-main-scroll--footer-doc {
  display: block !important;
  overflow: visible !important;
  flex: none !important;
  min-height: 0 !important;
  height: auto !important;
  max-height: none !important;
}

.layout-body-stack--footer-doc .layout-page-content,
.layout-body-stack--footer-doc .sports-layout-shell,
.layout-body-stack--footer-doc .sports-layout-shell__content {
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
  overflow: visible !important;
}

.layout-body-stack--footer-doc .layout-page-content:has(.casino-page) {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

/* Bet / multi-market: fill the main column so absolute page roots size correctly */
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

/* See v-main comment: spacer + Vuetify app-bar layout inset both apply on desktop */
.layout-v-main--desktop {
  --v-layout-top: 0px;
  padding-top: 0 !important;
}

.layout-v-main--desktop :deep(.v-main__wrap) {
  padding-top: 0 !important;
}

/* Same strip as TopNavigation.vue .top-nav — avoids a white band (theme background) behind the progress bar / seams; most visible on bet detail with absolute fill layout. */
.layout-sticky-top-nav {
  background: linear-gradient(180deg, #17191e 0%, #0c0e12 100%);
}

/* Bet page: match Bet.vue chrome; min-height must not be 100vh or flex cannot shrink and .bet-markets-scrollable never scrolls */
@media (min-width: 769px) {
  .layout-v-main--bet-desktop {
    background-color: #ececec !important;
    min-height: 0 !important;
  }

  .layout-v-main--bet-desktop :deep(.v-main__wrap) {
    background-color: #ececec;
    min-height: 0 !important;
  }
}

.sports-layout-shell {
  display: block;
}

.sports-layout-shell__content {
  min-width: 0;
}

.sports-layout-shell__content--home-pad {
  padding-left: 0px;
  padding-right: 0px;
}

@media (max-width: 767px) {
  .sports-layout-shell__content--home-pad {
    padding: 0 4px 4px;
    box-sizing: border-box;
  }
}

@media (min-width: 960px) {
  .sports-layout-shell {
    display: flex;
    flex-direction: column;
    gap: var(--layout-shell-section-gap, 6px);
  }

  .sports-layout-shell__rail {
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--color-background);
    border-radius: 8px;
  }

  /* Rail root (SportsSharedRail) must grow with the grid row so long pages (e.g. Live) don’t show an empty band under short sidebar content */
  .sports-layout-shell__rail>* {
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
  }

  .sports-layout-shell--single-col {
    display: flex;
    flex-direction: column;
  }
}

/* Extra bottom padding for multi-market page on mobile */
@media (max-width: 640px) {
  .multi-market-page-container {
    padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)) !important;
  }
}

/* Mobile New Launch block (matches Live.vue chrome below gifs) */
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
  animation: none !important;
  transform: none !important;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
}

.layout-mobile-new-launch-wrap :deep(.new-launch-grid) {
  display: block !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  box-sizing: border-box !important;
  padding: 3px 1px !important;
  margin: 0 !important;
  background: #ffffff !important;
  -webkit-overflow-scrolling: touch !important;
  scrollbar-width: none !important;
  scroll-snap-type: x mandatory !important;
  touch-action: pan-x !important;
  overscroll-behavior-x: contain !important;
}

.layout-mobile-new-launch-wrap :deep(.new-launch-grid::-webkit-scrollbar) {
  display: none !important;
}

.layout-mobile-new-launch-wrap :deep(.new-launch-grid__track) {
  display: flex !important;
  flex-wrap: nowrap !important;
  align-items: stretch !important;
  will-change: scroll-position !important;
}

.layout-mobile-new-launch-wrap :deep(.new-launch-grid__tile) {
  flex: 0 0 calc(100% / 4) !important;
  width: calc(100% / 4) !important;
  max-width: calc(100% / 4) !important;
  min-width: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  box-sizing: border-box;
  padding: 0 1px !important;
  background: #ffffff !important;
  scroll-snap-align: start !important;
}

.layout-mobile-new-launch-wrap :deep(.new-launch-grid__media) {
  position: relative !important;
  aspect-ratio: unset !important;
  overflow: hidden !important;
  background: #0a1628 !important;
  border-radius: 6px !important;
  height: 37vw !important;
  min-height: 0 !important;
}

.layout-mobile-new-launch-wrap :deep(.new-launch-grid__bg) {
  display: none !important;
}

.layout-mobile-new-launch-wrap :deep(.new-launch-grid__img) {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  object-position: center center !important;
  background: transparent !important;
  display: block !important;
}
</style>
