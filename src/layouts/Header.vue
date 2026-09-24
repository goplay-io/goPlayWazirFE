<template> <v-app-bar ref="appBarRef" app :height="appBarHeightPx" v-model="headerBarVisible"
    class="tw-bg-theme-header header-bar tw-py-0"     :class="{
      'header-bar--search-open': !isMobile && showSearchDropdown,
      'header-bar--mobile-drawer-open': isMobile && uiStore.isSidebarOpen
    }" elevation="0">
    <div class="header-shell tw-flex tw-flex-col tw-w-full tw-max-w-full tw-min-h-0">
      <!-- Primary toolbar row -->
      <div
        class="header-toolbar-row tw-flex tw-items-center tw-w-full tw-min-h-[41px] tw-h-[65.5px] md:tw-min-h-[66px] md:tw-h-[66px] tw-shrink-0">
        <div class="header-toolbar-left tw-inline-flex tw-items-center tw-gap-2 tw-flex-none md:tw-gap-3">
        <router-link
          v-if="isCasinoPage && authStore.isUiAuthenticated"
          to="/sports/live"
          class="header-mobile-menu-btn header-mobile-home-btn md:tw-hidden"
          :aria-label="t('components.mobileBottomNav.live')"
        >
          <v-icon size="24">mdi-home</v-icon>
        </router-link>
        <button
          v-else
          type="button"
          class="header-mobile-menu-btn md:tw-hidden"
          :aria-label="t('common.menu')"
          @click="emit('toggle-drawer')"
        >
          <img
            src="/svg/burger-menu.png"
            alt=""
            class="header-mobile-menu-btn__icon"
            width="21"
            height="15"
          />
        </button>

        <!-- Left side - Logo + desktop tools -->
        <div class="header-logo-area tw-flex tw-items-center md:tw-ml-4">
          <HeaderBrandLink :alt="t('components.header.logoAlt')" />

          <!-- Desktop logged-in: icons removed per design -->
        </div>
        </div>

        <!-- Right cluster: nav links → tools → wallet (grouped + separated for scanability) -->
        <div
          class="header-toolbar-right tw-flex tw-items-center tw-justify-end tw-min-w-0 tw-gap-1.5 sm:tw-gap-2 md:tw-gap-3 tw-ml-auto tw-mr-1.5 sm:tw-mr-2 md:tw-mr-4">

          <!-- Deposit / Withdraw (logged-in + demo; desktop only — hidden on bet pages) -->
          <!-- <template v-if="authStore.isUiAuthenticated && !isMobile && !isBetPage">
            <router-link to="/deposit" class="header-wallet-action-btn header-wallet-action-btn--deposit">
              <BankDepositIcon :size="14" color="#ffffff" class="header-wallet-action-btn__icon" />
              <span class="header-wallet-action-btn__label">{{ t('wallet.deposit.title') }}</span>
            </router-link>
            <router-link to="/withdrawal" class="header-wallet-action-btn header-wallet-action-btn--withdraw">
              <WalletIcon :size="14" color="#ffffff" class="header-wallet-action-btn__icon" />
              <span class="header-wallet-action-btn__label">{{ t('wallet.withdrawal.title') }}</span>
            </router-link>
          </template> -->

          <!-- Rules Link -->
          <!-- <router-link v-if="!authStore.isDemoUser" to="/rules"
            class="header-rules-btn tw-hidden md:tw-inline-flex tw-items-center tw-no-underline tw-whitespace-nowrap tw-shrink-0">
            {{ t('components.mobileBottomNav.rules') }}
          </router-link> -->

          <!-- Logged-in desktop: search + deposit/withdraw share reference gap/alignment -->
          <template v-if="!authStore.isUiAuthenticated">
            <div class="guest-auth-pair tw-inline-flex tw-items-center">
              <router-link to="/signup" class="signup-btn" @click="handleGuestSignupClick">
                <span class="signup-text">{{ t('auth.login.signupCta') }}</span>
              </router-link>
              <button type="button" class="login-btn" @click="handleGuestLoginClick">
                <span class="login-text">{{ t('auth.login.loginButton') }}</span>
              </button>
            </div>
          </template>

          <!-- Authenticated (real + full demo): Deposit/Withdraw + BAL/EXP + profile -->
          <template v-else>
            <div class="header-wallet-cluster">
              <div
                v-if="!isMobile"
                ref="desktopInlineSearchRoot"
                class="header-inline-search tw-relative tw-flex tw-items-center tw-h-7 tw-w-[169px] tw-min-w-[169px] tw-max-w-[169px]"
              >
                <input ref="headerSearchInput" v-model="inlineSearchQuery" type="text"
                  :placeholder="t('components.searchDialog.desktopPlaceholder')"
                  class="header-inline-search__input tw-flex-1 tw-min-w-0 tw-w-full tw-bg-transparent tw-border-0 tw-outline-none tw-text-xs"
                  @focus="ensureInlineSearchData" @keydown.enter.prevent="submitInlineSearch" />
                <div v-if="showSearchDropdown" class="header-search-dropdown">
                  <div class="header-search-dropdown__body">
                    <SearchResults :search-query="debouncedSearchQuery" :loading="searchLoading" :error="searchError"
                      :casino-games="casinoGames" @event-selected="handleInlineEventSelected"
                      @game-selected="handleInlineGameSelected" />
                  </div>
                </div>
              </div>

              <div class="header-action-col tw-flex tw-flex-col tw-gap-0.5 tw-items-center">
                <router-link to="/deposit" class="header-action-btn header-action-btn--deposit">
                  Deposit
                </router-link>
                <div class="header-bal-exp__row">
                  <span>(</span><span class="tw-font-semibold">BAL:</span><span> {{ formattedBalance }})</span>
                </div>
              </div>
              <div class="header-action-col tw-flex tw-flex-col tw-gap-0.5 tw-items-center">
                <router-link to="/withdrawal" class="header-action-btn header-action-btn--withdraw">
                  Withdraw
                </router-link>
                <div class="header-bal-exp__row header-bal-exp__row--exp" @click="openModal">
                  <span>(</span><span class="tw-font-semibold">EXP:</span><span> {{ formattedExposure }})</span>
                </div>
              </div>
            </div>

            <div
              class="header-auth-cluster tw-flex tw-items-center tw-min-w-0 md:tw-gap-2 md:tw-pl-2 md:tw-ml-1 max-md:tw-contents">
              <button v-if="!isMobile" type="button"
                class="header-account-icon-btn"
                :aria-label="userName"
                @click="userMenuOpen = true">
                <img
                  src="/svg/green-avatar.png"
                  alt=""
                  class="header-account-icon-btn__img"
                  width="28"
                  height="28"
                />
              </button>
            </div>
          </template>
        </div>
      </div>

      <!-- Announcement marquee below toolbar -->
      <div v-if="showAnnouncementStrip"
        class="header-announce-strip header-announce-strip--lane header-announce-strip--below header-announce-strip--with-message tw-shrink-0 tw-flex tw-items-center tw-w-full tw-relative">
        <div class="header-announce-speaker" aria-hidden="true">
          <img src="/svg/speaker_icon.png" alt="" class="header-announce-speaker__img" width="22" height="20" />
        </div>
        <div class="header-ticker-wrap header-ticker-wrap--strip tw-min-w-0 tw-flex-1">
          <div class="header-ticker-track-wrap">
            <div
              ref="tickerTrackRef"
              class="header-ticker-track"
              :class="{ 'header-ticker-track--from-right': isMobile && authStore.isUiAuthenticated }"
              :style="{ animationDuration: tickerDuration }"
            >
              <span class="header-ticker-text">{{ tickerText }}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <span class="header-ticker-text">{{ tickerText }}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </v-app-bar>
  <SearchDialog v-model="showSearchDialog" />
  <UserAccountDrawer
    v-if="authStore.isUiAuthenticated"
    v-model="userMenuOpen"
    :user-name="userName"
    :wallet-rows="walletSummaryRows"
    :nav-items="userDrawerNavItems"
    :show-wallet-summary="true"
    :show-payment-actions="true"
    :show-claim-bonus="true"
    @logout="handleLogout"
    @navigate="handleUserMenuItemClick"
    @deposit="goToDeposit"
    @withdraw="goToWithdraw"
    @claim-bonus="goToBonuses"
    @exposure-click="openModal"
  />
  <MobileSearchModal
    :open="isMobile && showInlineSearch"
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
  <Teleport to="body">
    <LanguageModal v-if="showLanguageModal" :available-locales="availableLocales" @select="setLocale"
      @close="closeLanguageDialog" />
  </Teleport>

</template>

<script setup>

import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { useUIStore } from '../stores/ui'
import { useExposureDialog } from '@/composables/useExposureDialog'
import { useBonusRulesModal } from '@/composables/useBonusRulesModal'
import SearchDialog from '../components/SearchDialog.vue'
import LanguageModal from '@/components/LanguageModal.vue'
import EventSliderCompact from '@/views/sports/Home/EventSliderCompact.vue'
import useDevices from '@/composables/useDevices.js'
import { useFeaturedEventsStore } from '@/stores/events/featuredEvents'
import { AVAILABLE_LOCALES } from '@/constants/locales.js'
import appConstants from '../constants/appConstants.js'
import { USER_DRAWER_NAV_ITEMS } from '@/constants/userDrawerNavItems.js'

import { useEventsStore } from '@/stores/events/events'
import { getCasinoGames } from '@/api/event/casino'
import { sortCasinoGamesByPriority } from '@/utils/casinoGamePriority'
import SearchResults from '@/components/SearchResults.vue'
import MobileSearchModal from '@/components/MobileSearchModal.vue'
import HeaderBrandLink from '@/components/HeaderBrandLink.vue'
import { useWallet } from '@/composables/useWallet.js'
import BankDepositIcon from '@/components/Icons/BankDepositIcon.vue'
import WalletIcon from '@/components/Icons/WalletIcon.vue'
import UserAccountDrawer from '@/components/UserAccountDrawer.vue'
import {
  useHeaderLayoutMetrics,
  useAppBarHeightObserver,
  ANNOUNCE_MARQUEE_PX_PER_SEC,
} from '@/composables/useHeaderLayoutMetrics.js'

const { t, locale } = useI18n()
const { formattedBalance, formattedExposure, formattedBonus, fetchWalletBalance } = useWallet()

const walletSummaryRows = computed(() => [
  { key: 'balance', labelKey: 'header.user.walletSummary.balance', value: formattedBalance.value },
  { key: 'exposure', labelKey: 'header.user.walletSummary.exposure', value: formattedExposure.value },
  { key: 'bonus', labelKey: 'header.user.walletSummary.bonus', value: `₹ ${formattedBonus.value}` },
])
const featuredEventsStore = useFeaturedEventsStore()
const eventsStore = useEventsStore()
const { isMobile } = useDevices()
const authStore = useAuthStore()

const {
  tickerText,
  showAnnouncementStrip,
  appBarHeightPx,
  effectiveHeaderInsetPx,
} = useHeaderLayoutMetrics({ variant: 'auth' })

const appBarRef = ref(null)
useAppBarHeightObserver(appBarRef)

const tickerTrackRef = ref(null)
const tickerCopyWidthPx = ref(0)

const measureTickerCopyWidth = () => {
  const track = tickerTrackRef.value
  if (!track) return
  const first = track.querySelector('.header-ticker-text')
  if (!first) return
  const width = first.getBoundingClientRect().width
  if (width > 0) tickerCopyWidthPx.value = width
}

const tickerDuration = computed(() => {
  const width = tickerCopyWidthPx.value || Math.max(tickerText.value.length * 7, 400)
  const secs = Math.max(8, width / ANNOUNCE_MARQUEE_PX_PER_SEC)
  return `${secs.toFixed(2)}s`
})

watch([tickerText, showAnnouncementStrip], async () => {
  await nextTick()
  measureTickerCopyWidth()
}, { flush: 'post' })

onMounted(async () => {
  await nextTick()
  measureTickerCopyWidth()
  window.addEventListener('resize', measureTickerCopyWidth, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', measureTickerCopyWidth)
})

const featuredEvents = computed(() => featuredEventsStore.events)
const uiStore = useUIStore()
const router = useRouter()
const route = useRoute()
const closeMobileSidebarOverlay = () => {
  if (!isMobile.value) return
  if (uiStore.isSidebarOpen) uiStore.closeSidebar()
}

const handleGuestLoginClick = () => {
  closeMobileSidebarOverlay()
  router.push({ name: 'login' })
}

const handleGuestSignupClick = () => {
  closeMobileSidebarOverlay()
}

const isBetPage = computed(() => route.name === 'sport-bet' || route.name === 'races-bet')
const isCasinoPage = computed(() => route.path.startsWith('/casino/game'))

// ── Scroll-hide for mobile bet pages ──────────────────────────────────────
// Replaces Vuetify's built-in scroll-behavior="hide" which glitches at the
// bottom of the scroll container (rapid hide→show loop from micro-scrolls).
const headerBarVisible = ref(true)
let _scrollEl = null
let _scrollLastY = 0
let _scrollTimer = null
const SCROLL_HIDE_THRESHOLD = 30  // px of downward travel before hiding
const SCROLL_BOTTOM_BUFFER = 80   // px from bottom where we never hide

function _onBetScroll() {
  const el = _scrollEl
  const currentY = el
    ? el.scrollTop
    : (window.scrollY || document.documentElement.scrollTop)
  const scrollHeight = el ? el.scrollHeight : document.documentElement.scrollHeight
  const clientHeight = el ? el.clientHeight : window.innerHeight
  const isNearBottom = currentY + clientHeight >= scrollHeight - SCROLL_BOTTOM_BUFFER
  clearTimeout(_scrollTimer)
  if (!isNearBottom && currentY > _scrollLastY + SCROLL_HIDE_THRESHOLD) {
    headerBarVisible.value = false
  } else if (currentY < _scrollLastY) {
    headerBarVisible.value = true
  }
  _scrollLastY = currentY
  _scrollTimer = setTimeout(() => { headerBarVisible.value = true }, 300)
}

function _attachScrollListener() {
  _detachScrollListener()
  const useDocumentScroll = document.body.classList.contains('mobile-page-scroll')
  if (useDocumentScroll) {
    _scrollLastY = window.scrollY || document.documentElement.scrollTop
    window.addEventListener('scroll', _onBetScroll, { passive: true })
    return
  }
  _scrollEl = document.querySelector('#app-main-scroll')
  if (_scrollEl) {
    _scrollLastY = _scrollEl.scrollTop
    _scrollEl.addEventListener('scroll', _onBetScroll, { passive: true })
  }
}

function _detachScrollListener() {
  window.removeEventListener('scroll', _onBetScroll)
  if (_scrollEl) {
    _scrollEl.removeEventListener('scroll', _onBetScroll)
    _scrollEl = null
  }
  clearTimeout(_scrollTimer)
  headerBarVisible.value = true
}

watch([isBetPage, isMobile], ([betPage, mobile]) => {
  if (betPage && mobile) {
    nextTick(_attachScrollListener)
  } else {
    _detachScrollListener()
  }
})

// Reset scroll tracking on route change within bet pages (new match = scroll back to top)
watch(() => route.fullPath, () => {
  if (isMobile.value && isBetPage.value && _scrollEl) {
    _scrollLastY = _scrollEl.scrollTop
    headerBarVisible.value = true
  }
})
// ─────────────────────────────────────────────────────────────────────────

const userMenuOpen = ref(false)
const { openExposureDialog } = useExposureDialog()
const { openBonusRulesModal } = useBonusRulesModal()
const showSearchDialog = ref(false)
const showLanguageModal = ref(false)
const showInlineSearch = ref(false)
const availableLocales = AVAILABLE_LOCALES
const inlineSearchQuery = ref('')
const debouncedSearchQuery = ref('')
const headerSearchInput = ref(null)
const mobileSearchInput = ref(null)
const casinoGames = ref([])
const searchLoading = ref(false)
const searchError = ref(null)
let searchDebounceTimer = null

watch(
  () => uiStore.accountMenuOpenRequestId,
  (id, prev) => {
    if (id && id !== prev && authStore.isUiAuthenticated) {
      userMenuOpen.value = true
    }
  },
)


function openModal() {
  userMenuOpen.value = false
  closeMobileSidebarOverlay()
  openExposureDialog()
}

async function refreshPage() {
  if (authStore.isUiAuthenticated) {
    fetchWalletBalance().catch(() => {})
  }
  uiStore.triggerPageRefresh()
}

function openSearchDialog() {
  closeMobileSidebarOverlay()
  showSearchDialog.value = true
}

const openInlineSearch = () => {
  closeMobileSidebarOverlay()
  if (isMobile.value) {
    showInlineSearch.value = true
    ensureInlineSearchData()
    nextTick(() => {
      mobileSearchInput.value?.focus?.()
    })
    return
  }
  openSearchDialog()
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
let userMenuScrollTargetEl = null

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

function onDocumentScrollCloseDesktopSearch(e) {
  if (isMobile.value || !showSearchDropdown.value) return
  const root = desktopInlineSearchRoot.value
  const t = e?.target
  if (!root) return
  if (t instanceof Node && root.contains(t)) return
  closeDesktopInlineSearchDropdown()
}

function syncDesktopSearchOutsideListeners(enabled) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  document.removeEventListener('pointerdown', onDocumentPointerDownCloseDesktopSearch, true)
  window.removeEventListener('scroll', onDocumentScrollCloseDesktopSearch, true)
  document.removeEventListener('wheel', onDocumentScrollCloseDesktopSearch, true)
  document.removeEventListener('touchmove', onDocumentScrollCloseDesktopSearch, true)
  if (!enabled) return
  document.addEventListener('pointerdown', onDocumentPointerDownCloseDesktopSearch, true)
  window.addEventListener('scroll', onDocumentScrollCloseDesktopSearch, true)
  document.addEventListener('wheel', onDocumentScrollCloseDesktopSearch, true)
  document.addEventListener('touchmove', onDocumentScrollCloseDesktopSearch, true)
}

let userMenuScrollCloseReady = false
let userMenuScrollCloseTimer = null

function isInsideUserAccountDrawer(target) {
  if (!(target instanceof Node) || typeof target.closest !== 'function') return false
  return Boolean(
    target.closest('.user-account-drawer') ||
    target.closest('.v-navigation-drawer') ||
    target.closest('.v-overlay') ||
    target.closest('.header-mobile-wallet-user-pill') ||
    target.closest('.header-user-trigger')
  )
}

function onMobileUserMenuScrollClose(e) {
  if (!isMobile.value || !userMenuOpen.value || !userMenuScrollCloseReady) return
  const t = e?.target
  if (isInsideUserAccountDrawer(t)) return
  // Nested market/multimarket tables often emit scroll/touchmove when the drawer
  // opens (body scroll lock / layout shift). Ignore those passive container scrolls.
  if (
    t instanceof Element &&
    t.closest?.(
      '.bet-markets-scrollable, .bet-markets-section, .multi-market-page, .multi-market-event-card, .fancy-markets-root'
    )
  ) {
    return
  }
  userMenuOpen.value = false
}

function syncMobileUserMenuCloseListeners(enabled) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  clearTimeout(userMenuScrollCloseTimer)
  userMenuScrollCloseReady = false
  window.removeEventListener('scroll', onMobileUserMenuScrollClose, true)
  document.removeEventListener('wheel', onMobileUserMenuScrollClose, true)
  if (userMenuScrollTargetEl) {
    userMenuScrollTargetEl.removeEventListener('scroll', onMobileUserMenuScrollClose, true)
    userMenuScrollTargetEl = null
  }
  if (!enabled) return
  // Delay arming close-on-scroll so drawer open isn't cancelled by layout/scroll
  // events from market tables and nested scroll containers.
  userMenuScrollCloseTimer = setTimeout(() => {
    if (!userMenuOpen.value || !isMobile.value) return
    userMenuScrollCloseReady = true
    window.addEventListener('scroll', onMobileUserMenuScrollClose, true)
    document.addEventListener('wheel', onMobileUserMenuScrollClose, true)
    userMenuScrollTargetEl = document.querySelector('#app-main-scroll')
    userMenuScrollTargetEl?.addEventListener('scroll', onMobileUserMenuScrollClose, true)
  }, 400)
}

watch([showSearchDropdown, isMobile], ([dropdownOpen, mobile]) => {
  syncDesktopSearchOutsideListeners(dropdownOpen && !mobile)
})

watch([userMenuOpen, isMobile], ([menuOpen, mobile]) => {
  syncMobileUserMenuCloseListeners(menuOpen && mobile)
})

watch(userMenuOpen, (open) => {
  if (!open) return
  closeMobileSidebarOverlay()
  if (authStore.isUiAuthenticated) {
    fetchWalletBalance().catch(() => {})
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

function setLocale(lang) {
  locale.value = lang
  try {
    localStorage.setItem('locale', lang)
  } catch (e) {
    console.error('Failed to persist locale', e)
  }
  showLanguageModal.value = false
  userMenuOpen.value = false
}

function closeLanguageDialog() {
  showLanguageModal.value = false
  userMenuOpen.value = false
}

// Computed properties for user display
const userName = computed(() => {
  return authStore.currentUser?.username || authStore.currentUser?.name || t('header.user.fallbackName')
})

const userRole = computed(() => {
  const roleId = authStore.currentUser?.role_id || appConstants.ROLE_IDS.CLIENT
  switch (roleId) {
    case appConstants.ROLE_IDS.SUPER_MASTER:
      return 'SM'
    case appConstants.ROLE_IDS.MASTER:
      return 'M'
    case appConstants.ROLE_IDS.CLIENT:
      return 'C'
    default:
      return 'C'
  }
})

const userRoleText = computed(() => {
  const roleId = authStore.currentUser?.role_id || appConstants.ROLE_IDS.CLIENT
  switch (roleId) {
    case appConstants.ROLE_IDS.SUPER_MASTER:
      return t('header.user.roles.superMaster')
    case appConstants.ROLE_IDS.MASTER:
      return t('header.user.roles.master')
    case appConstants.ROLE_IDS.CLIENT:
      return t('header.user.roles.client')
    default:
      return t('header.user.roles.client')
  }
})

const userAvatar = computed(() => {
  return authStore.currentUser?.avatar || null
})

const userDrawerNavItems = computed(() => USER_DRAWER_NAV_ITEMS)

function goToBonuses() {
  userMenuOpen.value = false
  router.push('/bonuses')
}

function goToDeposit() {
  userMenuOpen.value = false
  router.push('/deposit')
}

function goToWithdraw() {
  userMenuOpen.value = false
  router.push('/withdrawal')
}

// Props
const props = defineProps({
  activeTab: {
    type: String,
    default: 'sports'
  }
})

// Emit events
const emit = defineEmits(['toggle-drawer', 'set-active-tab'])

// Handle logout (auth store redirects to /)
const handleLogout = async () => {
  userMenuOpen.value = false
  await authStore.logout()
}

const handleUserMenuItemClick = (item) => {
  if (item.action === 'language') {
    userMenuOpen.value = false
    nextTick(() => {
      showLanguageModal.value = true
    })
    return
  }
  if (item.action === 'exposure') {
    closeMobileSidebarOverlay()
    openExposureDialog()
    return
  }
  if (item.action === 'bonus-rules') {
    openBonusRulesModal()
    return
  }
  userMenuOpen.value = false
}

onMounted(() => {
  uiStore.setFeaturedSliderVisible(false)
  if (isMobile.value && isBetPage.value) {
    nextTick(_attachScrollListener)
  }
})

onUnmounted(() => {
  _detachScrollListener()
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (typeof document !== 'undefined') {
    syncDesktopSearchOutsideListeners(false)
    syncMobileUserMenuCloseListeners(false)
    document.body.style.overflow = ''
  }
})

</script>

<style scoped>
/* Mobile responsive header */
.header-bar {
  overflow: hidden !important;
  box-shadow: none !important;
  border: none !important;
}

.header-bar--search-open {
  overflow: visible !important;
}

.header-bar--search-open :deep(.v-toolbar__content) {
  overflow: visible !important;
}

/* All text and icons inside the header bar are white */
:deep(.v-app-bar .v-icon),
:deep(.v-app-bar .v-btn__content),
:deep(.v-app-bar .v-btn .v-icon) {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Override Tailwind theme-text classes inside the header */
:deep(.v-app-bar .tw-text-theme-text),
:deep(.v-app-bar .tw-text-theme-text-secondary),
:deep(.v-app-bar .tw-text-theme-text-muted) {
  color: rgba(255, 255, 255, 0.85) !important;
}

/* Tab buttons inactive state */
:deep(.v-app-bar button.tw-text-theme-text) {
  color: rgba(255, 255, 255, 0.8) !important;
}

/* Bonus button */
:deep(.v-app-bar .bonus-btn) {
  color: rgba(255, 255, 255, 0.9) !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

/* User profile dropdown trigger - border visible on dark bg */
:deep(.v-app-bar .tw-border-theme-border) {
  border-color: rgba(255, 255, 255, 0.25) !important;
}

/* User info box inside profile button */
:deep(.v-app-bar .tw-bg-theme-surface) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Dropdown chevron */
:deep(.v-app-bar .tw-text-theme-text-secondary .v-icon),
:deep(.v-app-bar .tw-bg-theme-background-alt) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.7) !important;
}

:deep(.v-toolbar__content) {
  padding: 0 !important;
  overflow: hidden !important;
  align-items: stretch !important;
}

@media (min-width: 768px) {
  :deep(.v-toolbar__content) {
    padding: 0 !important;
  }
}

/* Force Vuetify components to use black header shell (logged-in + guest) */
:deep(.v-toolbar.v-app-bar),
:deep(.v-toolbar__content),
.header-shell,
.header-toolbar-row {
  background-color: var(--color-header-bg) !important;
  background: var(--color-header-bg) !important;
  background-image: none !important;
  box-shadow: none !important;
  border: none !important;
}

/* Ensure nav icon uses proper theme colors */
:deep(.v-app-bar-nav-icon .v-icon) {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Ensure avatar uses primary color correctly */
:deep(.v-avatar.tw-bg-primary) {
  background-color: var(--color-primary) !important;
}

:deep(.v-avatar.tw-bg-primary span) {
  color: white !important;
}

/* Fix Vuetify menu and card backgrounds */
:deep(.v-card.v-sheet) {
  background-color: var(--color-surface) !important;
  background: var(--color-surface) !important;
}

/* REMOVED: overly broad :deep(.v-list.v-sheet), :deep(.v-menu > .v-overlay__content),
   :deep(.v-sheet), :deep(.v-theme--light), :deep(.v-theme--dark) background rules.
   They were setting background-color: white on every Vuetify component including
   v-icon (which carries a .v-theme--* class), causing white square boxes to appear
   over any dark/colored background. Dropdown backgrounds are now controlled by
   the global nav token in theme.css. */


/* Ensure all icons inherit proper theme colors */
:deep(.v-app-bar-nav-icon .v-icon) {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Custom animations matching sidebar */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 20px, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.tw-animate-slideInUp {
  animation: slideInUp 0.4s ease-out forwards;
}

/* Ensure User Profile Dropdown borders are visible */
.tw-border-2.tw-border-theme-border {
  border: 1px solid var(--color-border) !important;
  border-color: var(--color-border) !important;
}

/* Fallback border colors if CSS variables fail */
.tw-border-2.tw-border-theme-border {
  border: 1px solid #e5e7eb !important;
  /* gray-200 as fallback */
}



.tw-border-2.tw-border-theme-border {
  border: 1px solid #374151 !important;
  /* gray-700 as fallback */
}

/* User Profile Dropdown Theme Styling */
.user-profile-dropdown {
  background: var(--color-background-alt);
  border: 1px solid var(--color-border);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
}



.user-profile-dropdown .menu-item {
  transition: all 0.2s ease;
}

.user-profile-dropdown .menu-item:hover {
  background-color: var(--color-surface);
  transform: translateX(4px);
}

.user-profile-dropdown .logout-button:hover {
  background-color: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

/* Ensure all icons have no background color */
.user-profile-dropdown .menu-item .tw-bg-transparent,
.user-profile-dropdown .logout-button .tw-bg-transparent {
  background-color: transparent !important;
  background: transparent !important;
}

/* Remove any Vuetify icon backgrounds */
.user-profile-dropdown .v-icon {
  background-color: transparent !important;
  background: transparent !important;
}

/* Ensure all tw-border-2 elements have visible borders */
.tw-border-2 {
  border: 2px solid !important;
}

/* Bonus button - override tw-border-2 to use theme color */
a.bonus-btn {
  border: 2px solid var(--color-primary) !important;
}

/* Wallet icon alignment */
.wallet-icon {
  margin-top: 0.25rem !important;
}

/* Wallet icon button styling - matching sidebar compact buttons */
.wallet-icon-btn {
  background-color: var(--color-surface-alt) !important;
  border: 1px solid #3a7064 !important;
  border-radius: 0.5rem !important;
  transition: all 0.3s ease !important;
}

.wallet-icon-btn:hover,
.wallet-icon-btn.wallet-icon-active {
  background: linear-gradient(to bottom, #34d77e, #148154) !important;
  border: 0 !important;
}

.wallet-icon-btn:hover :deep(svg),
.wallet-icon-btn:hover :deep(path),
.wallet-icon-btn:hover :deep(g),
.wallet-icon-btn.wallet-icon-active :deep(svg),
.wallet-icon-btn.wallet-icon-active :deep(path),
.wallet-icon-btn.wallet-icon-active :deep(g) {
  color: white !important;
  fill: white !important;
}

/* Enhanced hover effects */
.hover-lift {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.2);
}

/* Search button styling to match theme toggle */
.search-btn {
  background-color: var(--color-surface) !important;
  border-color: var(--color-border) !important;
  color: var(--color-text-secondary) !important;
  transition: all 0.3s ease !important;
  border-radius: 50% !important;
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
}

.search-btn:hover {
  background-color: var(--color-surface-alt) !important;
  border-color: var(--color-border) !important;
  color: var(--color-primary) !important;
  transform: scale(1.05);
}

.search-btn:active {
  transform: scale(0.95);
}

/* Icon color adjustments for better visibility */
.search-btn .v-icon {
  transition: color 0.3s ease;
}

/* Remove button overlay during transitions */
.search-btn .v-btn__overlay {
  opacity: 0 !important;
}

/* Dark theme specific styling */




/* Light theme specific styling */
.search-btn:hover {
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

/* Rules button styling to match search button */
.rules-btn {
  background-color: var(--color-surface) !important;
  border-color: var(--color-border) !important;
  color: var(--color-text-secondary) !important;
  transition: all 0.3s ease !important;
  border-radius: 50% !important;
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
}

.rules-btn:hover {
  background-color: var(--color-surface-alt) !important;
  border-color: var(--color-border) !important;
  color: var(--color-primary) !important;
  transform: scale(1.05);
}

.rules-btn:active {
  transform: scale(0.95);
}

/* Icon color adjustments for better visibility */
.rules-btn .v-icon {
  transition: color 0.3s ease;
}

/* Remove button overlay during transitions */
.rules-btn .v-btn__overlay {
  opacity: 0 !important;
}

/* Dark theme specific styling */




/* Light theme specific styling */
.rules-btn:hover {
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);
}

/* Fix chevron icon - remove any Vuetify/default background */
.chevron-icon {
  background: transparent !important;
  background-color: transparent !important;
  color: rgba(255, 255, 255, 0.8) !important;
}

.chevron-icon :deep(.v-icon__svg),
.chevron-icon :deep(svg) {
  color: rgba(255, 255, 255, 0.8) !important;
  fill: rgba(255, 255, 255, 0.8) !important;
}

/* Bonuses: readable on mobile without crowding logo */
.header-bonus-link {
  padding: 3px 8px !important;
  font-size: 10px !important;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

@media (min-width: 640px) {
  .header-bonus-link {
    padding: 4px 10px !important;
    font-size: 11px !important;
  }
}

@media (min-width: 768px) {
  .header-bonus-link {
    padding: 4px 12px !important;
    font-size: 12px !important;
  }
}

/* Bare search icon button */
.search-icon-btn {
  background: transparent !important;
  border: none !important;
}

.search-icon-btn :deep(.v-icon),
.search-icon-btn :deep(svg) {
  color: rgba(255, 255, 255, 0.9) !important;
}

.search-icon-btn:hover :deep(.v-icon),
.search-icon-btn:hover :deep(svg) {
  color: #ffffff !important;
}

.header-inline-search__input::placeholder {
  color: #999999;
}

.header-inline-search {
  background: #ffffff !important;
  background-color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  border-radius: 6px;
  padding: 0 12px 0 10px;
  gap: 0;
}

.header-inline-search__input {
  color: #333333 !important;
}

.header-inline-search__icon {
  color: #666666 !important;
  flex-shrink: 0;
  display: block;
}



.header-search-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 10000;
  background: #1c1d21;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  max-height: min(72vh, 560px);
}

.header-search-dropdown__body {
  padding: 4px 0;
}

.mobile-inline-search-overlay {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  /* Above v-main (sport tabs, wallet row, …) which follows Header in DOM; below app bar when search-open */
  z-index: 2000;
  background: rgba(0, 0, 0, 0.58);
  pointer-events: auto;
}

/* Same tint as .mobile-inline-search-overlay — marquee sits inside v-app-bar above the fixed overlay z-stack */
.header-announce-marquee-dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.58);
  pointer-events: none;
  z-index: 2;
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

/* Mobile search inside marquee row: circular border */
button.header-announce-search.search-icon-btn {
  border: 2px solid rgba(255, 255, 255, 0.92) !important;
}

button.header-announce-search.search-icon-btn:hover {
  border-color: #ffffff !important;
}


/* ── Blinking action buttons ───────────────────────────────── */
.blink-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-decoration: none !important;
  white-space: nowrap;
  cursor: pointer;
  color: #fff;
  border: none;
  position: relative;
}

.blink-btn--deposit {
  background-color: #16a34a;
  box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7);
  animation: blinkGreen 1.2s ease-in-out infinite;
}

.blink-btn--withdraw {
  background-color: #dc2626;
  box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
  animation: blinkRed 1.2s ease-in-out infinite;
}

.blink-btn--bonus {
  background-color: #0f2d5e;
  color: #facc15;
  box-shadow: none;
  animation: blinkNavyYellow 1s steps(1) infinite;
}

@keyframes blinkGreen {
  0% {
    box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.75);
    background-color: #16a34a;
  }

  50% {
    box-shadow: 0 0 0 7px rgba(22, 163, 74, 0);
    background-color: #15803d;
  }

  100% {
    box-shadow: 0 0 0 0 rgba(22, 163, 74, 0);
    background-color: #16a34a;
  }
}

@keyframes blinkRed {
  0% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.75);
    background-color: #dc2626;
  }

  50% {
    box-shadow: 0 0 0 7px rgba(220, 38, 38, 0);
    background-color: #b91c1c;
  }

  100% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
    background-color: #dc2626;
  }
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

.header-wallet-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 108px;
  height: 30px;
  padding: 0 6px;
  border: none;
  border-radius: 0;
  box-shadow: none;
  animation: none;
  filter: none;
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  text-decoration: none !important;
  color: #ffffff;
  white-space: nowrap;
  cursor: pointer;
}

.header-wallet-action-btn--deposit,
.header-wallet-action-btn--withdraw {
  background-color: var(--theme-orange);
}

.header-wallet-action-btn:hover,
.header-wallet-action-btn:focus-visible {
  box-shadow: none;
  animation: none;
  filter: none;
}

.header-wallet-action-btn--deposit:hover,
.header-wallet-action-btn--deposit:focus-visible,
.header-wallet-action-btn--withdraw:hover,
.header-wallet-action-btn--withdraw:focus-visible {
  background-color: var(--color-button-dark-hover);
}

.header-wallet-action-btn__icon {
  flex-shrink: 0;
}

.header-wallet-action-btn__label {
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 767.98px) {
  .header-wallet-action-btn {
    width: 36px;
    height: 30px;
    padding: 0;
  }

  .header-wallet-action-btn__label {
    display: none;
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

/* Mobile: ticker aligns with logo (same inset as header-logo-slot tw-ml-2), not offset by desktop logo column */
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

.header-announce-strip--below {
  background: #ffffff !important;
  border: none;
  box-shadow: none;
  margin-left: calc(50% - 50vw) !important;
  margin-right: calc(50% - 50vw) !important;
  width: 100vw !important;
  max-width: 100vw !important;
}

.header-announce-strip--below .header-ticker-text {
  color: #000000 !important;
}

.header-announce-strip--below .header-ticker-track .header-ticker-text {
  color: #000000 !important;
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

/* Marquee shares row with mobile search: grow into remaining width */
.header-announce-strip--lane .header-ticker-wrap--strip {
  flex: 1 1 0 !important;
  min-width: 0 !important;
  width: auto !important;
  max-width: none !important;
  padding: 0;
  gap: 0;
}

@media (max-width: 767.98px) {

  /* Bleed to viewport: toolbar __content uses 4px horizontal pad (not --header-right-pad 8px) */
  .header-announce-strip--lane {
    min-height: 0;
  }

  .header-announce-strip--lane .header-ticker-text {
    font-size: 9px;
  }

  .header-announce-strip--lane .header-ticker-icon {
    font-size: 9px;
  }

  .header-announce-strip--lane .header-ticker-wrap {
    padding: 0;
    gap: 4px;
  }

  /* Logged-in mobile: text enters from the right edge of the ticker lane */
  .header-announce-strip--lane .header-ticker-track-wrap {
    container-type: inline-size;
  }

  .header-ticker-track--from-right {
    animation-name: headerTickerScrollFromRight;
  }
}

.header-action-col {
  flex-shrink: 0;
}

.header-wallet-cluster {
  display: flex;
  align-items: flex-start;
  flex-shrink: 0;
  gap: 8px;
  min-width: 0;
}

.header-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 22px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none !important;
  text-align: center;
  white-space: nowrap;
  flex-shrink: 0;
  transition: opacity 0.15s ease;
}

.header-action-btn:active {
  opacity: 0.7;
}

.header-action-btn--deposit {
  background: linear-gradient(to left top, rgb(64, 19, 92), rgb(163, 27, 245), rgb(202, 134, 243));
  border: 0;
  border-color: transparent;
  color: #000000 !important;
}

.header-action-btn--withdraw {
  background-color: rgb(54 9 82);
  border-color: #ffffff;
  color: #ffffff !important;
}

.header-bal-exp__row {
  font-size: 9px;
  font-weight: 400;
  color: #ffffff;
  line-height: 1.5;
  white-space: nowrap;
  text-transform: uppercase;
}

.header-bal-exp__row .tw-font-semibold {
  color: rgb(202 134 243);
}

.header-bal-exp__row--exp {
  cursor: pointer;
}

@media (min-width: 768px) {
  .header-bar :deep(.v-toolbar.v-app-bar),
  .header-bar :deep(.v-toolbar__content) {
    background: var(--color-header-bg) !important;
    background-color: var(--color-header-bg) !important;
  }

  .header-toolbar-row {
    border: none !important;
    border-bottom: 1px solid #ffffff !important;
    padding: 12px 40px;
    box-sizing: border-box;
  }

  .header-logo-area {
    margin-left: 0 !important;
  }

  .header-logo-slot {
    margin-left: 0 !important;
  }

  .header-toolbar-right {
    margin-right: 0 !important;
    gap: 8px !important;
  }

  .header-wallet-cluster {
    gap: 24px;
    padding: 0 8px;
    align-items: flex-start;
  }

  .header-wallet-cluster .header-inline-search {
    align-self: flex-start;
    margin-top: 0;
  }

  .header-desktop-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    flex-shrink: 0;
    background: var(--theme-orange);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
    color: #ffffff;
    transition: filter 0.2s ease;
  }

  .header-desktop-icon-btn:hover {
    filter: brightness(1.1);
  }

  .header-desktop-icon-btn :deep(.v-icon) {
    color: #ffffff !important;
  }

  .header-action-btn {
    width: 80px;
    height: 24px;
    border-radius: 3.12px;
    font-size: 10.02px;
    font-weight: 700;
    letter-spacing: normal;
  }

  .header-action-col {
    gap: 0 !important;
  }

  .header-bal-exp__row {
    font-size: 11px;
    font-weight: 400;
    line-height: 16.5px;
  }

  .header-account-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #ffffff;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    transition: background 0.2s ease, border-radius 0.2s ease;
  }

  .header-account-icon-btn:hover {
    background: rgb(82, 82, 82);
    border-radius: 13px;
  }

  .header-account-icon-btn__img {
    display: block;
    width: 28px;
    height: 28px;
    margin: auto;
    object-fit: fill;
    border-radius: 0;
  }

  .header-logo-slot img {
    /* height: 34px !important; */
    width: auto;
    object-fit: contain;
  }

  .header-announce-strip--lane {
    background: var(--color-header-marquee-bg) !important;
    border: none !important;
    box-shadow: none !important;
    min-height: 30px !important;
    height: 30px !important;
  }

  .header-announce-strip--lane .header-ticker-wrap {
    padding: 0 0 0 0;
  }

  .header-announce-strip--lane .header-ticker-text {
    color: #ffffff !important;
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

  .header-announce-strip--below.header-announce-strip--lane .header-ticker-text {
    color: #000000 !important;
    text-transform: none;
    font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    font-size: 11px;
    font-weight: 500;
    font-style: normal;
    letter-spacing: normal;
    line-height: 16.5px;
    -webkit-font-smoothing: auto;
    -moz-osx-font-smoothing: auto;
  }

  .header-inline-search {
    width: 169px !important;
    min-width: 169px !important;
    max-width: 169px !important;
    height: 28px !important;
    border-radius: 6px !important;
    border: 1px solid rgb(209, 213, 219) !important;
    background: #ffffff !important;
    padding: 0 !important;
  }

  .header-inline-search__input {
    font-size: 12px !important;
    line-height: 18px !important;
    color: #000000 !important;
    padding: 8px 16px !important;
    height: 28px !important;
  }

  .header-wallet-action-btn {
    height: 30px;
    border-radius: 14px !important;
    padding: 0 12px !important;
    font-size: 10px !important;
    letter-spacing: 0.04em !important;
    font-weight: 800 !important;
  }

  .header-wallet-action-btn--deposit,
  .header-wallet-action-btn--withdraw {
    background: var(--theme-orange) !important;
    color: #ffffff !important;
  }

  .header-user-trigger {
    padding-left: 10px !important;
    margin-left: 4px !important;
    border-left: 1px solid rgba(255, 255, 255, 0.18) !important;
  }

  .header-user-trigger span {
    font-size: 11px !important;
    font-weight: 700 !important;
    color: #ffffff !important;
    text-transform: uppercase;
  }

  .chevron-icon {
    color: rgba(255, 255, 255, 0.86) !important;
  }

  .header-logo-slot {
    width: var(--header-logo-slot);
    min-width: var(--header-logo-slot);
    padding-top: 6px;
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
  font-style: normal;
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: normal;
  line-height: 16.5px;
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

/* Mobile logged-in: first frame off-screen right (100cqi = track-wrap width) */
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

/* Prevent Vuetify from giving white bg to any direct children of the toolbar */
:deep(.v-toolbar__content > div) {
  background: transparent !important;
}

/* Strip border/bg from HeaderButtonGroup in header */
.header-btn-group :deep(.creative-button-group) {
  background: transparent !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
  padding: 4px 8px !important;
}

.header-btn-group :deep(.creative-btn .v-icon) {
  color: rgba(255, 255, 255, 0.85) !important;
}

/* Pre-login guest buttons */
.header-guest-signup-btn,
.header-rules-btn {
  color: #ffffff !important;
  border: 1px solid #360952 !important;
  background: linear-gradient(135deg, #921ada 0%, #8a19ce 50%, #471368 100%) !important;
  border-radius: 4px !important;
  padding: 6px 20px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: opacity 0.15s ease;
}

.header-guest-login-btn {
  color: #ffffff !important;
  border: 1px solid #ffffff !important;
  background: transparent !important;
  border-radius: 4px !important;
  padding: 6px 20px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: opacity 0.15s ease;
}

.header-guest-login-btn:hover,
.header-guest-signup-btn:hover,
.header-rules-btn:hover {
  opacity: 0.85;
}

/* Profile dropdown: wallet summary (matches reference — gold accent, label / value columns) */
.header-profile-wallet-summary {
  border-top: 2px solid #b8860b;
  border-bottom: 2px solid #b8860b;
  background: #f9fafb;
  padding: 6px 0;
}

.header-profile-wallet-summary__row--clickable {
  cursor: pointer;
}

.header-profile-wallet-summary__row--clickable:hover {
  background: rgba(0, 0, 0, 0.04);
}

.header-profile-wallet-summary__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 12px;
}

.header-profile-wallet-summary__label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.72);
  line-height: 1.25;
  text-align: left;
}

.header-profile-wallet-summary__value {
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #111827;
  flex-shrink: 0;
}

/* Mobile: menu + logout list scrolls; keeps touch scrolling on iOS and avoids chaining to the page */
.header-user-menu-card__scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
}

.header-mobile-menu-btn {
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

.header-mobile-menu-btn__icon {
  display: block;
  height: 15px;
  width: auto;
  max-width: 21px;
  object-fit: contain;
}

.header-mobile-menu-btn :deep(.v-icon) {
  color: #ffffff !important;
}

.header-mobile-home-btn {
  text-decoration: none;
}

@media (min-width: 768px) {
  .header-guest-login-btn,
  .header-guest-signup-btn,
  .header-rules-btn {
    min-height: 30px; /* 40px;*/ 
    padding:0 13px !important;/* 0 18px !important;*/
    border-width: 1.5px !important;
    font-size: 10px !important;
    font-weight: 800 !important;
    letter-spacing: 0.03em;
  }

  .header-mobile-menu-btn {
    display: none !important;
  }
}

@media (max-width: 767.98px) {
  .header-bar--search-open .header-shell>* {
    pointer-events: none;
  }

  .header-mobile-menu-btn {
    margin-left: 0;
    margin-right: 0;
  }

  .header-bar--search-open .mobile-inline-search-wrap,
  .header-bar--search-open .mobile-inline-search-wrap * {
    pointer-events: auto;
  }

  .mobile-inline-search-wrap {
    position: relative;
    z-index: 1200;
  }

  .header-bar--search-open .header-announce-strip--lane {
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

  /* Mobile default: black toolbar (reference layout) */
  .header-bar :deep(.v-toolbar.v-app-bar),
  .header-bar :deep(.v-toolbar__content) {
    background: var(--color-header-bg) !important;
    background-color: var(--color-header-bg) !important;
  }

  /* Mobile search open: keep header shell */
  .header-bar--search-open :deep(.v-toolbar.v-app-bar),
  .header-bar--search-open :deep(.v-toolbar__content),
  .header-bar--search-open .mobile-inline-search-wrap {
    background: var(--color-header-bg) !important;
    background-color: var(--color-header-bg) !important;
    background-image: none !important;
  }

  /* Sidebar scrim ~3000+ — app bar below dimmer (declare before search-open so search can override if both) */
  .header-bar.header-bar--mobile-drawer-open {
    z-index: 1004 !important;
  }

  /* Search chrome above z-2000 dimmer; dimmer sits above v-main so sport tabs + deposit row dim */
  .header-bar.header-bar--search-open {
    z-index: 2500 !important;
  }

  .header-toolbar-right:has(.header-mobile-user-name) {
    padding-top: 15px;
    box-sizing: border-box;
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

  .header-wallet-slot {
    position: relative;
    overflow: visible;
    align-items: center !important;
    justify-content: center;
    gap: 0;
    padding: 0;
    min-height: 0;
  }

  .header-wallet-slot :deep(.wallet-info-root--mobile) {
    align-items: center;
  }

  .header-wallet-slot :deep(.wallet-info-root--mobile > div) {
    justify-content: center;
    width: 100%;
  }

  .header-mobile-user-name {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 3px);
    transform: translateX(-50%);
    flex-shrink: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 7.8rem;
    color: rgba(255, 255, 255, 0.95);
    font-size: 10px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-align: center;
    pointer-events: none;
  }

  .header-search-btn {
    min-width: 0 !important;
    min-height: 0 !important;
    border: none !important;
    padding: 0 !important;
    background: transparent !important;
    align-self: center;
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
}
</style>
