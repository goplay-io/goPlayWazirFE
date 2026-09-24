import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useWallet } from "../composables/useWallet";
import { usePageSwitchStore } from "@/stores/pageSwitchStore";
import i18n from "@/plugins/i18n";
import { useSnackbar } from "@/composables/useSnackbar/useSnackbar.js";
import { openLoginModal } from "@/composables/useLoginModal.js";

/** Footer info / legal pages — no sidebar or right rail; content spans full width. */
const INFO_PAGE_LAYOUT = { layoutProps: { fullWidth: true } };

/** Deposit / withdrawal — full content width, no sidebar or right rail. */
const WALLET_TRANSACTION_LAYOUT = { requiresAuth: true, layoutProps: { fullWidth: true } };

const routes = [
  {
    path: "/",
    redirect: "/sports/live",
  },
  {
    path: "/home",
    name: "home",
    redirect: "/sports/live",
  },
  {
    path: "/about-us",
    name: "about-us",
    component: () => import("../views/AboutUs.vue"),
    meta: INFO_PAGE_LAYOUT,
  },
  {
    path: "/why-choose-us",
    name: "why-choose-us",
    component: () => import("../views/WhyChooseUs.vue"),
    meta: { layoutProps: { fullWidth: true } },
  },
  {
    path: "/contact",
    name: "contact",
    component: () => import("../views/Contact.vue"),
  },
  {
    path: "/privacy-policy",
    name: "privacy-policy",
    component: () => import("../views/PrivacyPolicy.vue"),
    meta: INFO_PAGE_LAYOUT,
  },
  {
    path: "/terms-and-conditions",
    name: "terms-and-conditions",
    component: () => import("../views/TermsAndConditions.vue"),
    meta: INFO_PAGE_LAYOUT,
  },
  {
    path: "/responsible-gaming",
    name: "responsible-gaming",
    component: () => import("../views/ResponsibleGaming.vue"),
    meta: INFO_PAGE_LAYOUT,
  },
  {
    path: "/responsible-gambling",
    redirect: "/responsible-gaming",
  },
  {
    path: "/exclusion-policy",
    redirect: "/responsible-gaming",
  },
  {
    path: "/terms-and-policy",
    redirect: "/terms-and-conditions",
  },
  {
    path: "/sitemap",
    name: "sitemap",
    component: () => import("../views/Sitemap.vue"),
    meta: INFO_PAGE_LAYOUT,
  },
  {
    path: "/faqs",
    name: "faqs",
    component: () => import("../views/Faqs.vue"),
  },
  {
    path: "/refer-friend",
    name: "refer-friend",
    component: () => import("../views/ReferFriend.vue"),
  },
  {
    path: "/sports/featured",
    redirect: "/",
  },
  {
    path: "/sports/live",
    name: "live",
    component: () => import("../views/sports/live/Live.vue"),
    meta: { layoutProps: { topNavigation: true } },
  },
  {
    path: "/sports/e-sports",
    name: "e-sports",
    component: () => import("../views/sports/esports/Esports.vue"),
    meta: { layoutProps: { topNavigation: true } },
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/auth/Login.vue"),
    meta: { layout: "guest" },
  },
  {
    path: "/signup",
    name: "signup",
    component: () => import("../views/auth/signup/SignupView.vue"),
    meta: { layout: "guest" },
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: () => import("../views/auth/forgot-password/ForgotPasswordView.vue"),
    meta: { layout: "guest" },
  },
  {
    path: "/logout",
    name: "logout",
    beforeEnter: async (to, from, next) => {
      const authStore = useAuthStore();
      await authStore.logout();
      // After logout, redirect to public landing page
      next("/");
    },
  },
  {
    path: "/casino",
    name: "casino-home",
    component: () => import("../views/casino/Home.vue"),
    meta: { layoutProps: { topNavigation: true } },
  },
  {
    path: "/casino/:category",
    name: "casino-category",
    component: () => import("../views/casino/Category.vue"),
    meta: { layoutProps: { topNavigation: true } },
  },
  {
    path: "/casino/game/:gameId",
    name: "casino-game",
    component: () => import("../views/casino/Game.vue"),
    meta: { requiresAuth: true, layoutProps: { topNavigation: true } },
  },
  {
    path: "/wallet",
    name: "wallet",
    component: () => import("../views/wallet/Wallet.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/turnover-history",
    name: "turnover-history",
    component: () => import("../views/turnover-history/TurnoverHistory.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/withdrawal",
    name: "withdrawal",
    component: () => import("../views/withdrawal/Withdrawal.vue"),
    meta: WALLET_TRANSACTION_LAYOUT,
  },
  {
    path: "/deposit",
    name: "deposit",
    component: () => import("../views/deposit/Deposit.vue"),
    meta: WALLET_TRANSACTION_LAYOUT,
  },
  {
    path: "/account-statement",
    name: "account-statement",
    component: () => import("../views/account/AccountStatement.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/bonus-statement",
    name: "bonus-statement",
    component: () => import("../views/bonus/BonusStatement.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/bonuses",
    name: "bonuses",
    component: () => import("../views/bonus/Bonuses.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/change-password",
    name: "change-password",
    component: () => import("../views/change-password/ChangePassword.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/bet-history",
    name: "bet-history",
    component: () => import("../views/bet-history/BetHistory.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/unsettled-bets",
    name: "unsettled-bets",
    component: () => import("../views/unsettled-bets/UnsettledBets.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/profit-loss",
    name: "profit-loss",
    component: () => import("../views/profit-loss/ProfitLoss.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/buttons",
    name: "buttons",
    component: () => import("../views/buttons/Buttons.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/payment-methods",
    name: "payment-methods",
    component: () => import("../views/payment-methods/PaymentMethods.vue"),
    meta: { requiresAuth: true, layoutProps: { topNavigation: true } },
  },
  {
    path: "/deposit-turnovers",
    name: "deposit-turnovers",
    component: () => import("../views/deposit-turnovers/DepositTurnover.vue"),
    meta: { requiresAuth: true },
  },
  // Sports routes
  {
    path: "/sports/bet/:event_id",
    name: "sport-bet",
    component: () => import("../views/sports/Bet/Bet.vue"),
    // Allow accessing bet page without real login (uses demo token if needed)
    meta: { allowDemo: true, layoutProps: { topNavigation: true } },
  },
  {
    path: "/sports/multi-market",
    name: "multi-market",
    component: () => import("../views/sports/MultiMarket/index.vue"),
    meta: { requiresAuth: true, layoutProps: { topNavigation: true } },
  },
  {
    path: "/sports/popular-events",
    name: "popular-events",
    component: () => import("../views/sports/PopularEvents.vue"),
    meta: { layoutProps: { topNavigation: true } },
  },
  // Individual sport routes
  {
    path: "/sports/:event_type_id/:competition_id?",
    name: "sport",
    component: () => import("../views/sports/Sport.vue"),
    meta: { layoutProps: { topNavigation: true } },
  },
  // requiresAuth: true,
  // Racing routes
  {
    path: "/race-types",
    name: "race-types",
    component: () => import("../views/racing/RaceTypes.vue"),
    meta: {  layoutProps: { topNavigation: true } },
  },
  {
    path: "/racing/bet/:event_id/:market_id",
    name: "races-bet",
    component: () => import("../views/racing/Bet.vue"),
    meta: { requiresAuth:true, layoutProps: { topNavigation: true } },
  },
  {
    path: "/racing/races/:event_type_name",
    name: "racing-races",
    component: () => import("../views/racing/Races.vue"),
    meta: {  layoutProps: { topNavigation: true } },
  },
  // Sports Book route
  {
    path: "/sports-book",
    name: "sports-book",
    component: () => import("../views/SportsBook.vue"),
    meta: { requiresAuth: true, layoutProps: { topNavigation: true } },
  },
  {
    path: "/rules",
    name: "rules",
    component: () => import("../views/Rules.vue"),
    meta: INFO_PAGE_LAYOUT,
  },
  {
    path: "/affiliate",
    name: "affiliate",
    component: () => import("../views/affiliate/AffiliateProgram.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const isSectionTabRoute = (routeLike) => {
  const path = routeLike?.path || "";
  return (
    path.startsWith("/sports/") ||
    path.startsWith("/casino") ||
    path.startsWith("/racing/") ||
    path === "/race-types" ||
    path === "/sports-book"
  );
};

const shouldStartGlobalRouteLoading = (to, from) => {
  // Skip shell-level loading when users switch tabs inside sports/casino sections.
  // Those views already handle their own local loading states for content.
  if (isSectionTabRoute(to) && isSectionTabRoute(from)) {
    return false;
  }
  return true;
};

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const PageSwitchStore = usePageSwitchStore();
  const { showSuccess } = useSnackbar();
  const demoRestrictedPaths = new Set([
    "/wallet",
    "/bonuses",
    "/deposit",
    "/withdrawal",
  ]);

  // Re-fetch settings once per login session when entering authenticated routes
  if (to.meta.requiresAuth && authStore.isUiAuthenticated) {
    const { useSettingsStore } = await import("@/stores/settings.js");
    const settingsStore = useSettingsStore();
    if (!settingsStore.settings) {
      settingsStore.fetchSettings().catch(() => {});
    }
  }
  if (shouldStartGlobalRouteLoading(to, from)) {
    PageSwitchStore.startLoading();
  } else {
    PageSwitchStore.stopLoading();
  }

  // Allow access to logout route regardless of auth status
  if (to.name === "logout") {
    next();
    return;
  }

  const isPublicAuthRoute =
    to.name === "login" ||
    to.path === "/login" ||
    to.name === "signup" ||
    to.path === "/signup" ||
    to.name === "forgot-password" ||
    to.path === "/forgot-password";

  if (isPublicAuthRoute) {
    next();
    return;
  }

  // If this origin has no local auth state yet, restore from backend session cookie
  // only when navigating to auth-protected or demo-enabled routes.
  const shouldRestoreSession =
    !authStore.isAuthenticated && (to.meta.requiresAuth || to.meta.allowDemo);
  if (shouldRestoreSession) {
    await authStore.restoreSessionFromServer();
  }

  const isAuthenticated = authStore.isUiAuthenticated;
  const needsPasswordChange =
    isAuthenticated && authStore.user?.require_password_change === true;

  // Demo users have limited access: block selected account/funds pages.
  if (authStore.isDemoUser && demoRestrictedPaths.has(to.path)) {
    showSuccess(
      i18n.global.t("auth.login.demoSuccess") ||
        "Demo user has limited access. Please log in to continue.",
      { timeout: 3500 },
    );
    openLoginModal({ redirect: to.fullPath });
    next({ path: "/" });
    return;
  }

  // Routes that can be used without real login, but may need a demo token
  if (to.meta.allowDemo) {
    if (!authStore.isAuthenticated) {
      try {
        await authStore.demoLoginPreview();
      } catch (e) {
        openLoginModal({ redirect: to.fullPath });
        next({ path: "/" });
        return;
      }
    }
    next();
    return;
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      openLoginModal({ redirect: to.fullPath });
      next({ path: "/" });
      return;
    }
  }

  // Force password change if required by backend flag
  if (
    needsPasswordChange &&
    to.name !== "change-password" &&
    to.name !== "logout"
  ) {
    next({ name: "change-password", query: { redirect: to.fullPath } });
    return;
  }

  next();
});

// Fetch wallet balance after each navigation to authenticated routes
router.afterEach((to, from) => {
  const authStore = useAuthStore();
  const PageSwitchStore = usePageSwitchStore();
  PageSwitchStore.stopLoading();
  // Only fetch wallet balance for authenticated routes
  if (to.meta.requiresAuth && authStore.isUiAuthenticated) {
    const { initializeWallet } = useWallet();

    // Initialize wallet asynchronously (don't wait for it)
    initializeWallet().catch((error) => {
      console.error("Failed to initialize wallet on route change:", error);
    });
  }
});

export default router;
