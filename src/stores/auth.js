import { defineStore } from "pinia";
import { loginUser, logout, demoLogin } from "../api/user/login.js";
import { getProfile } from "../api/user/profile.js";
import { getChipInfo } from "../api/wallet/wallet.js";
import { useWalletStore } from "./wallet.js";
import appConstants from "../constants/appConstants.js";
import router from "@/router";
import {
  getStoredUser,
  removeStoredUser,
  setStoredUser,
} from "../utils/authStorage.js";

const isFullDemoUser = (user) =>
  (user?.is_demo === true || user?.id === "demo") &&
  user?.demo_access === "full";

const isPreviewDemoUser = (user) =>
  (user?.is_demo === true || user?.id === "demo") &&
  user?.demo_access !== "full";

const _restoredUser = (() => {
  const u = getStoredUser();
  if (!u) {
    return null;
  }
  // Preview demo is ephemeral; full demo (login-page button) should survive refresh.
  if (isPreviewDemoUser(u)) {
    removeStoredUser();
    return null;
  }
  return u;
})();

const normalizeProfileUser = (userData) => {
  if (!userData || typeof userData !== "object") {
    return null;
  }

  return {
    ...userData,
    id: userData.id ?? userData.user_id,
    username:
      userData.username || userData.user_name || userData.User_username || "",
    first_name: userData.first_name ?? userData.User_FirstName,
    last_name: userData.last_name ?? userData.User_LastName,
    role_id: Number(userData.role_id),
    parent_id: userData.parent_id ?? null,
    is_withdrawal: !!userData.is_withdrawal,
    require_password_change: !!userData.require_password_change,
  };
};

const extractUserFromResponse = (response) => {
  let responseData = response;

  if (responseData?.data && typeof responseData.data === "object") {
    responseData = responseData.data;
  }

  if (responseData?.data && typeof responseData.data === "object") {
    responseData = responseData.data;
  }

  if (Array.isArray(responseData)) {
    responseData = responseData[0];
  }

  const userData = responseData?.user ?? responseData ?? null;
  return normalizeProfileUser(Array.isArray(userData) ? userData[0] : userData);
};

let restoreSessionPromise = null;
let hasInitializedAuth = false;
let initializeAuthPromise = null;
let demoPreviewPromise = null;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: _restoredUser,
    token: null,
    hasValidatedSession: isFullDemoUser(_restoredUser),
  }),

  getters: {
    isAuthenticated: (state) => {
      // Real auth is now backed by secure cookies; user presence is the client-side signal.
      return !!state.user && state.hasValidatedSession;
    },
    isDemoUser: (state) => {
      // Demo session sets a synthetic user id
      return state.user?.id === "demo" || state.user?.is_demo === true;
    },
    isDemoFull: (state) => {
      return (
        (state.user?.id === "demo" || state.user?.is_demo === true) &&
        state.user?.demo_access === "full"
      );
    },
    isDemoPreview: (state) => {
      return (
        (state.user?.id === "demo" || state.user?.is_demo === true) &&
        state.user?.demo_access !== "full"
      );
    },
    // Treat demo sessions as NOT authenticated for UI/routing decisions.
    // (We still keep token for demo API calls on landing.)
    isRealAuthenticated: (state) => {
      if (!state.user || !state.hasValidatedSession) return false;
      const isDemoUser = state.user.id === 'demo' || state.user.is_demo === true;
      return !isDemoUser;
    },
    // Logged-in UI/session: real users OR explicit full-demo (button click).
    // Preview demo (silent WS token on landing) must NOT be treated as logged-in.
    isUiAuthenticated: (state) => {
      if (!state.user || !state.hasValidatedSession) return false;
      const isDemoUser = state.user.id === 'demo' || state.user.is_demo === true;
      if (!isDemoUser) return true; // real authenticated user
      return state.user.demo_access === 'full'; // only full demo (explicit Try Demo) counts
    },
    currentUser: (state) => state.user,
  },

  actions: {
    setToken(token) {
      this.token = token;
    },

    setUser(userData) {
      const username =
        userData.username || userData.user_name || userData.userName || "";

      // Always format user data to match your requirements
      const formattedUser = {
        id: userData.id,
        name:
          username ||
          userData.name ||
          `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
          "User",
        username,
        role_id: Number(userData.role_id),
        parent_id: userData.parent_id ?? null,
        is_withdrawal: userData.is_withdrawal || false,
        require_password_change: !!userData.require_password_change,
        // demo flags (for layout/routing decisions)
        is_demo: !!userData.is_demo || userData.id === "demo",
        demo_access:
          userData.demo_access || (userData.id === "demo" ? "preview" : null),
      };

      this.user = formattedUser;
      this.hasValidatedSession = true;
      setStoredUser(formattedUser);
    },

    clearLocalSession() {
      const walletStore = useWalletStore();
      this.token = null;
      this.user = null;
      this.hasValidatedSession = false;
      walletStore.clearWallet();
      removeStoredUser();
    },

    async login(credentials) {
      try {
        const response = await loginUser(credentials);

        // Extract data based on the known API response structure
        // Axios interceptor returns response.data, so if API returns:
        // { success: true, data: { token, user, chips }, message }
        // Then response = { success: true, data: { token, user, chips }, message }
        // So we need response.data to get { token, user, chips }
        // But also handle case where response is already the data object
        let responseData = response;

        // If response has a 'data' property, use it (nested structure)
        if (response?.data && typeof response.data === "object") {
          responseData = response.data;
        }

        // If responseData still has a 'data' property, use that (double nested)
        if (responseData?.data && typeof responseData.data === "object") {
          responseData = responseData.data;
        }

        const userData = responseData?.user;
        const chips = responseData?.chips;

        

        if (!userData) {
          console.error("[Auth] No user data in response:", responseData);
          throw new Error("No user data received from server");
        }

        if (Number(userData.role_id) !== appConstants.ROLE_IDS.CLIENT) {
          throw new Error("Unauthorized access");
        }

        // Clear any stale demo token when user switches to real login.
        this.setToken(null);
        this.setUser(userData);

        // Header "Balance" is balance + cashable (see wallet store). Login API only returns
        // partial chips (no cashable/bonus), so always sync from GET /wallet/chip after session exists.
        const applyChipSource = (src) => {
          if (!src || typeof src !== "object") return;
          const walletStore = useWalletStore();
          walletStore.updateWallet({
            balance: src.balance ?? "0",
            exposure: src.exposure ?? "0",
            cashable: src.cashable,
            bonus: src.bonus,
          });
        };

        try {
          const walletResponse = await getChipInfo();
          applyChipSource(walletResponse?.data ?? walletResponse);
        } catch (walletError) {
          console.error("Failed to fetch wallet after login:", walletError);
          if (chips) {
            applyChipSource({
              balance: chips.balance,
              exposure: chips.exposure,
              cashable: chips.cashable,
              bonus: chips.bonus,
            });
          }
        }

        return response;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },

    async demoLoginPreview() {
      // Never POST /demo-login while a real shared session may still exist —
      // that overwrites the cookie and logs the user out across skins.
      if (this.isRealAuthenticated) {
        return null;
      }

      if (restoreSessionPromise) {
        await restoreSessionPromise;
        if (this.isRealAuthenticated || this.isUiAuthenticated) {
          return null;
        }
      }

      if (demoPreviewPromise) {
        return demoPreviewPromise;
      }

      demoPreviewPromise = (async () => {
        try {
          try {
            const response = await getProfile(
              {},
              { metadata: { suppressUnauthorizedModal: true } },
            );
            const userData = extractUserFromResponse(response);

            if (
              userData &&
              userData.id !== "demo" &&
              userData.is_demo !== true &&
              Number(userData.role_id) === appConstants.ROLE_IDS.CLIENT
            ) {
              this.setUser(userData);
              return response;
            }

            // Server already has a session (e.g. demo) — do not re-issue /demo-login.
            if (userData) {
              return response;
            }
          } catch (profileError) {
            const status = profileError?.response?.status;
            if (status !== 401 && status !== 403) {
              return null;
            }
          }

          return await demoLogin();
        } catch (error) {
          console.error("Demo login error:", error);
          throw error;
        } finally {
          demoPreviewPromise = null;
        }
      })();

      return demoPreviewPromise;
    },

    async demoLoginFull() {
      // Establish the server session first, then mark the user as a full demo.
      try {
        const response = await demoLogin();
        this.setUser({
          id: "demo",
          name: "Demo User",
          role_id: appConstants.ROLE_IDS.CLIENT,
          is_withdrawal: false,
          require_password_change: false,
          is_demo: true,
          demo_access: "full",
        });
        return response;
      } catch (error) {
        throw error;
      }
    },

    initializeAuth() {
      if (hasInitializedAuth) {
        return initializeAuthPromise || Promise.resolve(this.user);
      }

      hasInitializedAuth = true;

      initializeAuthPromise = (async () => {
        if (typeof window === "undefined") {
          return this.user;
        }

        const userInStorage = getStoredUser();

        if (isFullDemoUser(userInStorage)) {
          this.user = userInStorage;
          this.hasValidatedSession = true;
          return this.restoreSessionFromServer();
        }

        if (userInStorage?.is_demo || userInStorage?.id === "demo") {
          removeStoredUser();
          this.user = null;
        } else if (userInStorage) {
          if (JSON.stringify(this.user) !== JSON.stringify(userInStorage)) {
            this.user = userInStorage;
          }
        } else if (this.user) {
          this.user = null;
        }

        if (!this.user || !this.hasValidatedSession) {
          return this.restoreSessionFromServer();
        }

        return this.user;
      })();

      return initializeAuthPromise;
    },

    async restoreSessionFromServer({ force = false } = {}) {
      if (this.isDemoFull) {
        if (restoreSessionPromise) {
          return restoreSessionPromise;
        }

        restoreSessionPromise = (async () => {
          try {
            // Another skin may have logged in a real user on the shared cookie.
            // Prefer that over re-asserting demo (which would overwrite the real session).
            try {
              const response = await getProfile(
                {},
                { metadata: { suppressUnauthorizedModal: true } },
              );
              const userData = extractUserFromResponse(response);

              if (
                userData &&
                userData.id !== "demo" &&
                userData.is_demo !== true &&
                Number(userData.role_id) === appConstants.ROLE_IDS.CLIENT
              ) {
                this.setUser(userData);

                try {
                  const walletResponse = await getChipInfo();
                  const source = walletResponse?.data ?? walletResponse;
                  if (source) {
                    const walletStore = useWalletStore();
                    walletStore.updateWallet({
                      balance: source.balance ?? "0",
                      exposure: source.exposure ?? "0",
                      cashable: source.cashable,
                      bonus: source.bonus,
                    });
                  }
                } catch (walletError) {
                  console.error(
                    "Failed to fetch wallet after session restore:",
                    walletError,
                  );
                }

                return this.user;
              }
            } catch (profileError) {
              const status = profileError?.response?.status;
              if (status !== 401 && status !== 403) {
                // Keep local full-demo; do not POST /demo-login (can wipe real cookie).
                return this.user;
              }
            }

            await demoLogin();
            if (!this.hasValidatedSession) {
              this.hasValidatedSession = true;
            }
            return this.user;
          } catch (error) {
            console.error("Demo session restore error:", error);
            this.clearLocalSession();
            return null;
          } finally {
            restoreSessionPromise = null;
          }
        })();

        return restoreSessionPromise;
      }

      if (this.isDemoUser) {
        return this.user;
      }

      if (this.user && this.hasValidatedSession && !force) {
        return this.user;
      }

      if (restoreSessionPromise) {
        return restoreSessionPromise;
      }

      restoreSessionPromise = (async () => {
        try {
          const response = await getProfile(
            {},
            { metadata: { suppressUnauthorizedModal: true } },
          );
          const userData = extractUserFromResponse(response);

          if (!userData || userData.id === "demo" || userData.is_demo === true) {
            this.clearLocalSession();
            return null;
          }

          if (Number(userData.role_id) !== appConstants.ROLE_IDS.CLIENT) {
            this.clearLocalSession();
            return null;
          }

          this.setUser(userData);
          
          try {
            const walletResponse = await getChipInfo();
            const source = walletResponse?.data ?? walletResponse;
            if (source) {
              const walletStore = useWalletStore();
              walletStore.updateWallet({
                balance: source.balance ?? "0",
                exposure: source.exposure ?? "0",
                cashable: source.cashable,
                bonus: source.bonus,
              });
            }
          } catch (walletError) {
            console.error("Failed to fetch wallet after session restore:", walletError);
          }

          return this.user;
        } catch (error) {
          if (error?.response?.status === 401) {
            this.clearLocalSession();
            return null;
          }

          return this.user;
        } finally {
          restoreSessionPromise = null;
        }
      })();

      return restoreSessionPromise;
    },

    async logout() {
      try {
        // Call logout API to invalidate session on server
        await logout();
      } catch (error) {
        // Even if API call fails, we should still clear local state
        // This ensures user can logout even if server is unreachable
        console.error("Logout API error:", error);
      } finally {
        // Store user ID before clearing (for banner session cleanup)
        const userId = this.user?.id;

        // Always clear local state regardless of API call success/failure
        this.clearLocalSession();

        // Clear banner session storage for the logged out user
        if (userId && typeof window !== "undefined") {
          const bannerKey = `banner_shown_${userId}`;
          window.sessionStorage.removeItem(bannerKey);
          console.log(`✅ Cleared banner session for user ${userId} on logout`);
        }

        if (router.currentRoute.value.path !== "/") {
          router.replace("/");
        }
      }
    },
  },
});
