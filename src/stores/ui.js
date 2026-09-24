import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
    state: () => ({
        sidebarCompact: localStorage.getItem('sidebarCompact') === 'true',
        sidebarOpen: true,
        featuredSliderVisible: false,
        loginModalOpen: false,
        loginModalRedirect: null,
        loginModalForce: false,
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
            this.loginModalOpen = true
            this.loginModalRedirect =
                typeof options.redirect === 'string' && options.redirect
                    ? options.redirect
                    : null
            this.loginModalForce = Boolean(options.force)
        },

        closeLoginModal() {
            this.loginModalOpen = false
            this.loginModalRedirect = null
            this.loginModalForce = false
        },

        openForgotPasswordModal() {
            this.forgotPasswordModalOpen = true
        },

        closeForgotPasswordModal() {
            this.forgotPasswordModalOpen = false
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
