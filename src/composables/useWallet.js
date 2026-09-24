import { computed } from 'vue'
import { useWalletStore } from '../stores/wallet.js'
import { getChipInfo } from '../api/wallet/wallet.js'

export function useWallet() {
    const walletStore = useWalletStore()
    const formatAmount = (amount) => {
        const value = parseFloat(amount ?? 0)
        return walletStore.numberFormatter.format(Number.isNaN(value) ? 0 : value)
    }

    // Reactive computed values
    const balance = computed(() => walletStore.balance)
    const exposure = computed(() => walletStore.exposure)
    const cashable = computed(() => walletStore.cashable)
    const bonus = computed(() => walletStore.bonus)
    const isWalletBlocked = computed(() => walletStore.isWalletBlocked)

    const formattedBalance = computed(() => walletStore.formattedBalance)
    const formattedExposure = computed(() => walletStore.formattedExposure)
    const formattedBonus = computed(() => walletStore.formattedBonus)
    const availableBalance = computed(() => walletStore.availableBalance)
    const formattedAvailableBalance = computed(() => walletStore.formattedAvailableBalance)

    const currencySymbol = computed(() => walletStore.currencySymbol)

    const formattedCashable = computed(() => formatAmount(walletStore.cashable))

    // Actions
    const updateBalance = (balance) =>
        walletStore.updateWallet({ balance })

    const updateExposure = (exposure) =>
        walletStore.updateWallet({ exposure })

    const updateCashable = (cashable) =>
        walletStore.updateWallet({ cashable })

    const updateBonus = (bonus) =>
        walletStore.updateWallet({ bonus })

    const updateWallet = (data) =>
        walletStore.updateWallet(data)

    const clearWallet = () =>
        walletStore.clearWallet()

    // Fetch wallet data from API and update store
    const fetchWalletBalance = async () => {
        try {
            const response = await getChipInfo()

            const source = response?.data ?? response

            if (source) {
                walletStore.updateWallet({
                    balance: source.balance ?? '0',
                    exposure: source.exposure ?? '0',
                    cashable: source.cashable ?? '0',
                    bonus: source.bonus ?? '0',
                    is_wallet_blocked: source.is_wallet_blocked ?? false
                })
            }

            return response
        } catch (error) {
            console.error('Failed to fetch wallet balance:', error)
            throw error
        }
    }

    // Initialize wallet data if user is authenticated
    const initializeWallet = async () => {
        const { useAuthStore } = await import('../stores/auth.js')
        const authStore = useAuthStore()

        if (authStore.isUiAuthenticated) {
            try {
                await fetchWalletBalance()
            } catch (error) {
                console.error('Failed to initialize wallet:', error)
            }
        }
    }

    // Update wallet from API response (useful for bet responses)
    const updateFromResponse = (response) => {
        const source = response?.data ?? response

        if (source?.balance !== undefined &&
            source?.exposure !== undefined) {

            walletStore.updateWallet({
                balance: source.balance,
                exposure: source.exposure,
                cashable: source.cashable,
                bonus: source.bonus,
                is_wallet_blocked: source.is_wallet_blocked
            })
        }
    }

    const getCurrencySymbol = () =>
        walletStore.currencySymbol

    return {
        // State
        balance,
        exposure,
        cashable,
        bonus,
        isWalletBlocked,
        formattedBalance,
        formattedExposure,
        formattedBonus,
        availableBalance,
        formattedAvailableBalance,
        formattedCashable,
        currencySymbol,
        formatAmount,

        // Helpers
        getCurrencySymbol,

        // Actions
        updateBalance,
        updateExposure,
        updateCashable,
        updateBonus,
        updateWallet,
        clearWallet,

        // API
        fetchWalletBalance,
        initializeWallet,
        updateFromResponse
    }
}
