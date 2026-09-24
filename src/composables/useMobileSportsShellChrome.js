import { computed } from "vue";
import { useRoute } from "vue-router";
import useDevices from "@/composables/useDevices.js";

const SPORTS_SHELL_ROUTE_NAMES = new Set([
  "sport",
  "race-types",
  "racing-races",
  "live",
  "sport-bet",
  "multi-market",
  "popular-events",
  "races-bet",
  "e-sports",
  "sports-book",
]);

/** Casino lobby + category listing — same desktop two-column shell + rail as sports (not full-screen game). */
const CASINO_SHELL_ROUTE_NAMES = new Set(["casino-home", "casino-category"]);

/** Mobile layout rail: no bottom Our Providers on these routes (in-page or N/A). */
const MOBILE_PROVIDERS_RAIL_EXCLUDED = new Set([
  "live",
  "sport",
  "race-types",
  "casino-home",
  "casino-category",
]);

/** Desktop layout rail: no New Launch / Our Providers sidebar on home live (in-page showcase instead). */
const DESKTOP_SHELL_RAIL_EXCLUDED = new Set(["live"]);

const HORSE_GREYHOUND_SLUGS = new Set(["horse_racing", "greyhound_racing"]);

export function isHorseGreyhoundRacingRoute(route) {
  if (route.name === "race-types" || route.name === "races-bet") {
    return true;
  }
  if (route.name === "racing-races") {
    const slug = String(route.params.event_type_name || "").toLowerCase();
    return HORSE_GREYHOUND_SLUGS.has(slug);
  }
  return false;
}

/**
 * Shared sports-shell chrome for Layout + GuestLayout.
 * - Tab strip + deposit/withdraw row: all mobile app pages except full-screen casino game (login/signup use bare layout).
 * - showMobileSportsChrome: sports/casino listing only — drives gifs, New Launch, providers rail inside sports shell.
 */
export function useMobileSportsShellChrome() {
  const route = useRoute();
  const { isMobile } = useDevices();

  const isSportsShellPage = computed(() =>
    SPORTS_SHELL_ROUTE_NAMES.has(route.name),
  );

  const isCasinoShellPage = computed(() =>
    CASINO_SHELL_ROUTE_NAMES.has(route.name),
  );

  const isCasinoListingPage = computed(() =>
    CASINO_SHELL_ROUTE_NAMES.has(route.name),
  );

  const isLayoutShellPage = computed(
    () => isSportsShellPage.value,
  );

  const showMobileSportsChrome = computed(() => {
    if (!isMobile.value) return false;
    const p = route.path;
    const sportsOrRacing =
      p.startsWith("/sports") ||
      p.startsWith("/racing") ||
      p === "/race-types" ||
      p === "/sports-book";
    const casinoListing =
      p.startsWith("/casino") && !p.startsWith("/casino/game");
    return sportsOrRacing || casinoListing;
  });

  const suppressMobileSportsShellMarketingChrome = computed(
    () =>
      route.name === "sport-bet" ||
      route.name === "races-bet" ||
      route.name === "popular-events" ||
      route.name === "sports-book" ||
      route.name === "multi-market",
  );

  /** Mobile sport/racing/multi-market bet shells — body scroll, no layout tab strip. */
  const isMobileMarketShellPage = computed(
    () =>
      isMobile.value &&
      (route.name === "sport-bet" ||
        route.name === "races-bet" ||
        route.name === "multi-market"),
  );

  /**
   * INPLAY / sport tabs — hidden on focused market shells (bet / multi-market).
   * Popular events keeps the strip for sport navigation (no shell marketing chrome).
   */
  const showMobileSportsTabStrip = computed(() => {
    if (!isMobile.value) return false;
    const p = route.path;
    if (p.startsWith("/casino/game")) return false;
    if (suppressMobileSportsShellMarketingChrome.value) {
      return route.name === "popular-events";
    }
    return true;
  });

  const showMobileNewLaunchInShell = computed(
    () =>
      showMobileSportsChrome.value &&
      !suppressMobileSportsShellMarketingChrome.value &&
      route.name !== "live" &&
      route.name !== "sport" &&
      route.name !== "race-types" &&
      route.name !== "racing-races",
  );

  /**
   * Exchange sport detail pages (sidebar sport click) — no home marketing chrome.
   * Shows focused sport page with breadcrumb title instead.
   */
  const isExchangeSportDetailPage = computed(
    () =>
      route.name === "sport" ||
      route.name === "racing-races" ||
      route.name === "race-types",
  );

  const isHorseGreyhoundRacingPage = computed(() =>
    isHorseGreyhoundRacingRoute(route),
  );

  const showSportsShellMainBanner = computed(
    () =>
      !suppressMobileSportsShellMarketingChrome.value &&
      !isExchangeSportDetailPage.value,
  );

  /** Bet / multi-market / etc.: no shell gifs — desktop Bet.vue uses absolute fill from v-container top and would paint over them. */
  const showSportsShellGifRow = computed(() => {
    if (suppressMobileSportsShellMarketingChrome.value) return false;
    if (isExchangeSportDetailPage.value) return false;
    return true;
  });

  /**
   * Providers rail in layout.
   * - Live / sport / racing / casino listing: no bottom providers on mobile.
   */
  const showMobileProvidersInLayoutRail = computed(
    () =>
      showMobileSportsChrome.value &&
      !suppressMobileSportsShellMarketingChrome.value &&
      !MOBILE_PROVIDERS_RAIL_EXCLUDED.has(route.name) &&
      !isHorseGreyhoundRacingPage.value,
  );

  const showDesktopSportsShellRail = computed(
    () =>
      isLayoutShellPage.value &&
      !DESKTOP_SHELL_RAIL_EXCLUDED.has(route.name) &&
      !isExchangeSportDetailPage.value &&
      !isHorseGreyhoundRacingPage.value &&
      route.name !== "live" &&
      route.name !== "e-sports",
  );

  /** Exchange / Casino / Sports Book + sport filters — home page only. */
  const showHomeExchangeSection = computed(() => {
    if (suppressMobileSportsShellMarketingChrome.value) return false;
    if (isCasinoShellPage.value) return false;
    if (isExchangeSportDetailPage.value) return false;
    return route.name === "live" || route.name === "e-sports";
  });

  return {
    isSportsShellPage,
    isCasinoShellPage,
    isCasinoListingPage,
    isLayoutShellPage,
    isExchangeSportDetailPage,
    showMobileSportsChrome,
    suppressMobileSportsShellMarketingChrome,
    isMobileMarketShellPage,
    showMobileSportsTabStrip,
    showMobileNewLaunchInShell,
    showSportsShellGifRow,
    showSportsShellMainBanner,
    showMobileProvidersInLayoutRail,
    showDesktopSportsShellRail,
    showHomeExchangeSection,
    isHorseGreyhoundRacingPage,
  };
}
