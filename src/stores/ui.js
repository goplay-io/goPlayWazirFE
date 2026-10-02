import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
    state: () => ({
        sidebarCompact: localStorage.getItem('sidebarCompact') === 'true',
        sidebarOpen: true,
        featuredSliderVisible: false,
        loginModalOpen: false,
        loginModalRedirect: null,
        loginModalForce: false,
        /** User dismissed an automatic session-expired login prompt. */
        autoLoginModalDismissed: false,
        /** 'login' | 'signup' | 'forgot' — single auth modal view (reference LoginBox). */
        authModalView: 'login',
        authModalCampaignId: '',
        authModalReferralId: '',
        forgotPasswordModalOpen: false,
        /** Increment to remount the active route without a full browser reload. */
        pageRefreshKey: 0,
        /** Bumped by MobileBottomNav (and similar) to open the account drawer. */
        accountMenuOpenRequestId: 0,
        /** Mobile bottom nav bar visibility (toggle via chevron above nav). */
        mobileBottomNavVisible: true,
    }),

    getters: {
        isSidebarCompact: (state) => state.sidebarCompact,
        isSidebarOpen: (state) => state.sidebarOpen
    },

    actions: {
        setSidebarCompact(compact) {
            this.sidebarCompact = compact
            localStorage.setItem('sidebarCompact', compact.toString())
        },

        toggleSidebarCompact() {
            this.setSidebarCompact(!this.sidebarCompact)
        },

        setSidebarOpen(open) {
            this.sidebarOpen = open
        },

        toggleSidebar() {
            this.setSidebarOpen(!this.sidebarOpen)
        },

        closeSidebar() {
            this.setSidebarOpen(false)
        },

        setFeaturedSliderVisible(visible) {
            this.featuredSliderVisible = visible
        },

        openLoginModal(options = {}) {
            const force = Boolean(options.force)
            if (force && this.autoLoginModalDismissed) return

            this.loginModalOpen = true
            this.authModalView = options.view || 'login'
            this.loginModalRedirect =
                typeof options.redirect === 'string' && options.redirect
                    ? options.redirect
                    : null
            this.loginModalForce = force
            this.authModalCampaignId = String(options.campaignId || '').trim()
            this.authModalReferralId = String(options.referralId || '').trim()
        },

        dismissAutoLoginModal() {
            this.autoLoginModalDismissed = true
        },

        clearAutoLoginDismissal() {
            this.autoLoginModalDismissed = false
        },

        closeLoginModal() {
            this.loginModalOpen = false
            this.loginModalRedirect = null
            this.loginModalForce = false
            this.authModalView = 'login'
            this.authModalCampaignId = ''
            this.authModalReferralId = ''
        },

        setAuthModalView(view) {
            if (view === 'login' || view === 'signup' || view === 'forgot') {
                this.authModalView = view
            }
        },

        openForgotPasswordModal() {
            this.loginModalOpen = true
            this.authModalView = 'forgot'
        },

        closeForgotPasswordModal() {
            if (this.authModalView === 'forgot') {
                this.authModalView = 'login'
            }
        },

        triggerPageRefresh() {
            this.pageRefreshKey += 1
        },

        requestOpenAccountMenu() {
            this.accountMenuOpenRequestId += 1
        },

        setMobileBottomNavVisible(visible) {
            this.mobileBottomNavVisible = Boolean(visible)
        },

        toggleMobileBottomNav() {
            this.mobileBottomNavVisible = !this.mobileBottomNavVisible
        },
    }
})
