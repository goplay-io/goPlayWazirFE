import { ref, onMounted, onUnmounted } from 'vue'
import { useWallet } from './useWallet.js'
import { useAuthStore } from '../stores/auth.js'

/**
 * Composable for automatic wallet balance refresh
 * Provides periodic background updates of wallet balance
 */
export function useWalletRefresh(intervalMinutes = 2) {
    const { fetchWalletBalance } = useWallet()
    const authStore = useAuthStore()
    const refreshInterval = ref(null)
    const isRefreshing = ref(false)

    // Start periodic refresh
    const startRefresh = () => {
        if (refreshInterval.value) {
            clearInterval(refreshInterval.value)
        }

        const intervalMs = intervalMinutes * 60 * 1000 // Convert minutes to milliseconds

        refreshInterval.value = setInterval(async () => {
            const isAuthenticated = authStore.isUiAuthenticated

            if (isAuthenticated && !isRefreshing.value) {
                try {
                    isRefreshing.value = true
                    await fetchWalletBalance()
                    console.log(`Wallet balance auto-refreshed (every ${intervalMinutes} minutes)`)
                } catch (error) {
                    console.error('Auto-refresh wallet balance failed:', error)
                    // If error is 401/403, stop the refresh interval
                    if (error.response && [401, 403].includes(error.response.status)) {
                        console.warn('[Wallet Refresh] Unauthorized, stopping auto-refresh')
                        stopRefresh()
                    }
                } finally {
                    isRefreshing.value = false
                }
            } else {
                if (!isAuthenticated) {
                    console.warn('[Wallet Refresh] Not authenticated, skipping refresh')
                    stopRefresh()
                }
            }
        }, intervalMs)

        console.log(`Wallet auto-refresh started (every ${intervalMinutes} minutes)`)
    }

    // Stop periodic refresh
    const stopRefresh = () => {
        if (refreshInterval.value) {
            clearInterval(refreshInterval.value)
            refreshInterval.value = null
            console.log('Wallet auto-refresh stopped')
        }
    }

    // Manual refresh
    const manualRefresh = async () => {
        const isAuthenticated = authStore.isUiAuthenticated

        if (isAuthenticated && !isRefreshing.value) {
            try {
                isRefreshing.value = true
                await fetchWalletBalance()
                console.log('Manual wallet balance refresh completed')
            } catch (error) {
                console.error('Manual wallet balance refresh failed:', error)
                throw error
            } finally {
                isRefreshing.value = false
            }
        } else {
            const error = new Error('Cannot refresh wallet: user is not authenticated')
            console.error('[Wallet Refresh]', error.message)
            throw error
        }
    }

    // Auto-start on mount, auto-stop on unmount
    onMounted(() => {
        if (authStore.isUiAuthenticated) {
            startRefresh()
        } else {
            console.warn('[Wallet Refresh] Not starting auto-refresh: user not authenticated')
        }
    })

    onUnmounted(() => {
        stopRefresh()
    })

    return {
        isRefreshing,
        startRefresh,
        stopRefresh,
        manualRefresh
    }
}
