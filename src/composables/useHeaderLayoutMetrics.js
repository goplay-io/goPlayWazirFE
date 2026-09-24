import { ref, computed, watch, watchEffect, nextTick, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings.js'
import { useAuthStore } from '@/stores/auth'
import useDevices from '@/composables/useDevices.js'

/** Primary toolbar row — must match Header.vue / GuestLayout.vue. */
export const HEADER_TOOLBAR_DESKTOP_PX = 66
/** Guest / logged-out mobile toolbar. */
export const HEADER_TOOLBAR_MOBILE_PX = 57
/** Logged-in mobile toolbar — reference navbar row is 65.5px. */
export const HEADER_TOOLBAR_MOBILE_AUTH_PX = 65.5

/** Logged-out guest toolbar — reference navbar row is 59px. */
export const GUEST_TOOLBAR_DESKTOP_PX = 59

/** Authenticated header announcement lane. */
export const ANNOUNCE_STRIP_DESKTOP_PX = 30
export const ANNOUNCE_STRIP_MOBILE_PX = 28

/**
 * Match reference <marquee scrollamount="5" scrolldelay="85"> ≈ 58.82 px/s.
 */
export const ANNOUNCE_MARQUEE_PX_PER_SEC = 5 / 0.085

/**
 * Reference main uses md:mt-[100px] under a ~95.5px fixed navbar, leaving a ~4–5px
 * white band under the announcement. Keep content/sticky offset in sync with that gap.
 */
export const HEADER_CONTENT_FOLLOW_GAP_DESKTOP_PX = 4

/**
 * Logged-out reference: 59 + 30 = 89px bar, md:mt-[100px] → 11px white band.
 */
export const GUEST_HEADER_CONTENT_FOLLOW_GAP_DESKTOP_PX = 11

/** Guest/demo header announcement lane (taller desktop strip). */
export const GUEST_ANNOUNCE_STRIP_MESSAGE_PX = 42
export const GUEST_ANNOUNCE_STRIP_BLANK_PX = 12

/** Desktop guest filler row when the marquee is dismissed. */
export const GUEST_HEADER_TOP_STRIP_PX = 6

/** Mobile featured-events slider below the toolbar. */
export const HEADER_SLIDER_STRIP_PX = 56

/** Session-scoped — shared between Header/GuestLayout and Layout. */
const isAnnouncementStripDismissed = ref(false)

/** Live measured height of the fixed v-app-bar (ResizeObserver). */
export const measuredAppBarHeightPx = ref(0)

function syncAppHeaderInsetCss(insetPx, isMobileViewport, fullInset = false, toolbarPx = null) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--app-header-bar-height', `${insetPx}px`)
  if (toolbarPx != null) {
    root.style.setProperty('--mobile-header-toolbar-px', `${toolbarPx}px`)
  }
  const inset = isMobileViewport
    ? fullInset
      ? `${insetPx}px`
      : `calc(env(safe-area-inset-top, 0px) + ${insetPx}px)`
    : '0px'
  root.style.setProperty('--app-header-inset', inset)
  root.style.setProperty('--mobile-snackbar-top', inset)
}

/**
 * Observe the fixed app bar so layout padding can match the real painted height
 * (guards against Vuetify/toolbar content exceeding the calculated constants).
 * @param {import('vue').Ref} appBarRef — v-app-bar component or element ref
 */
export function useAppBarHeightObserver(appBarRef) {
  let resizeObserver = null

  const resolveEl = () => {
    const raw = appBarRef.value
    if (!raw) return null
    return raw.$el ?? raw
  }

  const measure = () => {
    const el = resolveEl()
    if (!el) return
    const height = Math.ceil(el.getBoundingClientRect().height)
    if (height > 0) measuredAppBarHeightPx.value = height
  }

  onMounted(async () => {
    await nextTick()
    measure()
    const el = resolveEl()
    if (el && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measure)
      resizeObserver.observe(el)
    }
    window.addEventListener('resize', measure, { passive: true })
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
    window.removeEventListener('resize', measure)
    measuredAppBarHeightPx.value = 0
  })

  return { measure }
}

/**
 * Header height + announcement visibility for Layout / Header / GuestLayout.
 * @param {{ variant?: 'auth' | 'guest' }} options
 */
export function useHeaderLayoutMetrics(options = {}) {
  const variant = options.variant ?? 'auth'
  const settingsStore = useSettingsStore()
  const authStore = useAuthStore()
  const { isMobile } = useDevices()

  const tickerText = computed(() => {
    const list = settingsStore.announcement
    if (!list?.length) return ''
    // Reference announcement uses normal sans text (11px/500). API copy often uses
    // Mathematical Bold unicode; NFKC folds those back to regular Latin/digits.
    return list
      .map((item) => String(item ?? '').normalize('NFKC'))
      .join('     ✦     ')
  })

  const showAnnouncementStrip = computed(() => {
    if (isAnnouncementStripDismissed.value || !tickerText.value) return false
    // Logged-out guests + demo share the same announcement strip as logged-in (reference).
    if (variant === 'guest') return true
    return authStore.isUiAuthenticated
  })

  const usesAuthMarqueeLayout = computed(
    () => variant === 'auth' || variant === 'guest',
  )

  function dismissAnnouncementStrip() {
    isAnnouncementStripDismissed.value = true
  }

  const announceStripPx = computed(() => {
    if (!showAnnouncementStrip.value) return 0
    if (usesAuthMarqueeLayout.value) {
      return isMobile.value ? ANNOUNCE_STRIP_MOBILE_PX : ANNOUNCE_STRIP_DESKTOP_PX
    }
    return isMobile.value ? ANNOUNCE_STRIP_MOBILE_PX : GUEST_ANNOUNCE_STRIP_MESSAGE_PX
  })

  const headerBarTotalPx = computed(() => {
    const toolbar = isMobile.value
      ? (variant === 'auth' ? HEADER_TOOLBAR_MOBILE_AUTH_PX : HEADER_TOOLBAR_MOBILE_PX)
      : variant === 'guest'
        ? GUEST_TOOLBAR_DESKTOP_PX
        : HEADER_TOOLBAR_DESKTOP_PX
    let total = toolbar

    if (variant === 'guest' && !isMobile.value && !showAnnouncementStrip.value && !usesAuthMarqueeLayout.value) {
      total += GUEST_HEADER_TOP_STRIP_PX
    }

    total += announceStripPx.value
    return total
  })

  /**
   * Layout inset for spacers / sticky offsets — prefer live measured height on mobile
   * (includes safe-area padding once mobile-header.css is applied).
   */
  const effectiveHeaderInsetPx = computed(() => {
    const calculated = headerBarTotalPx.value
    const measured = measuredAppBarHeightPx.value || 0
    if (isMobile.value && measured > 0) {
      return Math.max(measured, calculated)
    }
    if (showAnnouncementStrip.value && measured > calculated) return measured
    return calculated
  })

  /** v-app-bar :height — calculated constants only (prevents ResizeObserver feedback loop). */
  const appBarHeightPx = computed(() => headerBarTotalPx.value)

  const desktopHeaderFlowSpacerPx = computed(() => {
    if (isMobile.value) return 0
    const gap = variant === 'guest'
      ? GUEST_HEADER_CONTENT_FOLLOW_GAP_DESKTOP_PX
      : HEADER_CONTENT_FOLLOW_GAP_DESKTOP_PX
    return effectiveHeaderInsetPx.value + gap
  })

  const mobileMainPaddingTop = computed(() =>
    `calc(env(safe-area-inset-top, 0px) + ${effectiveHeaderInsetPx.value}px)`,
  )

  const applyHeaderInsetCss = () => {
    const calculated = headerBarTotalPx.value
    const measured = measuredAppBarHeightPx.value || 0
    const measuredIncludesSafeArea = isMobile.value && measured > calculated
    const toolbarPx = isMobile.value
      ? (variant === 'auth' ? HEADER_TOOLBAR_MOBILE_AUTH_PX : HEADER_TOOLBAR_MOBILE_PX)
      : null
    syncAppHeaderInsetCss(
      measuredIncludesSafeArea ? measured : effectiveHeaderInsetPx.value,
      isMobile.value,
      measuredIncludesSafeArea,
      toolbarPx,
    )
  }

  watchEffect(applyHeaderInsetCss)

  watch(
    [headerBarTotalPx, measuredAppBarHeightPx, isMobile],
    () => nextTick(applyHeaderInsetCss),
    { flush: 'post' },
  )

  watch(headerBarTotalPx, (next, prev) => {
    if (prev == null || next === prev) return
    measuredAppBarHeightPx.value = next < prev ? next : 0
  })

  return {
    tickerText,
    showAnnouncementStrip,
    dismissAnnouncementStrip,
    headerBarTotalPx,
    effectiveHeaderInsetPx,
    appBarHeightPx,
    desktopHeaderFlowSpacerPx,
    mobileMainPaddingTop,
  }
}
