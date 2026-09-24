import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchBetHistory } from '@/api/event/bet.js'
import { useAuthStore } from './auth'
import { useOneClickBettingStore } from './oneClickBetting'
import { useWallet } from '@/composables/useWallet'
import { getApiClient } from '@/api/axios'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar';
import { startSpeedCashCooldown } from '@/composables/useCashout';
import { getOffPlayBetBlockReason } from '@/utils/betPlacementGuard';
import i18n from '@/plugins/i18n';

export const useBetStore = defineStore('bet', () => {
    const authStore = useAuthStore()
    const oneClickStore = useOneClickBettingStore()
    const { updateFromResponse } = useWallet()
    const { showSuccess, showError } = useSnackbar()

    // State
    const bet = ref({
        user_id: null,
        type: null,
        market_type_name: null,
        event_id: null,
        event_type_id: null,
        event_name: null,
        odd: null,
        nation: null,
        stake: null,
        is_back: null,
        runner_id: null,
        runner_name: null,
        market_id: null,
        fancy_odd: null,
        rate: null,
        betting_type: null,
        bet_delay: 0,
        runner_count: null,
        is_cashout_hedge: false
    })

    const bet_status = ref(null)
    const bet_error = ref(null)
    const placingCountdown = ref(0)
    let placeDelayInterval = null

    const normalizeBetDelay = (value) => {
        const seconds = Number(value)
        return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 0
    }

    const clearPlaceDelayTimer = () => {
        if (placeDelayInterval) {
            clearInterval(placeDelayInterval)
            placeDelayInterval = null
        }
    }

    /** Market bet_delay (seconds). Zero = place immediately like FairplayFE. */
    const waitForPlaceDelay = (delaySeconds) => new Promise((resolve) => {
        clearPlaceDelayTimer()
        const seconds = normalizeBetDelay(delaySeconds)
        if (!seconds) {
            placingCountdown.value = 0
            resolve()
            return
        }

        const delayMs = seconds * 1000
        const startedAt = Date.now()
        placingCountdown.value = seconds

        placeDelayInterval = setInterval(() => {
            const remainingMs = Math.max(0, delayMs - (Date.now() - startedAt))
            placingCountdown.value = Math.ceil(remainingMs / 1000)
            if (remainingMs <= 0) {
                clearPlaceDelayTimer()
                placingCountdown.value = 0
                resolve()
            }
        }, 100)
    })

    const betHistory = ref([])
    const betOutcomes = ref({})
    const selectedRunnerId = ref(null)
    const selectedMarketId = ref(null)
    const selectedMarketType = ref(null)
    const minAmount = ref(0)
    const maxAmount = ref(0)
    const currentEventId = ref(null)

    // Getters
    const betHistoryCount = computed(() => betHistory.value.length)

    // Actions
    const initializeBet = (eventId) => {
        currentEventId.value = eventId
        bet.value.user_id = authStore.currentUser?.id
        bet.value.event_id = eventId
        clearBetSelection()
    }

    const clearBetSelection = () => {
        bet.value.type = null
        bet.value.market_type_name = null
        bet.value.event_type_id = null
        bet.value.event_name = null
        bet.value.odd = null
        bet.value.nation = null
        bet.value.stake = null
        bet.value.is_back = null
        bet.value.runner_id = null
        bet.value.runner_name = null
        bet.value.market_id = null
        bet.value.fancy_odd = null
        bet.value.rate = null
        bet.value.betting_type = null
        bet.value.bet_delay = 0
        bet.value.is_cashout_hedge = false
        selectedRunnerId.value = null
        selectedMarketId.value = null
        selectedMarketType.value = null
        minAmount.value = 0
        maxAmount.value = 0
        bet_error.value = null
    }

    const clearBetSelectionOnly = () => {
        const preservedEventId = bet.value.event_id
        const preservedEventTypeId = bet.value.event_type_id
        const preservedEventName = bet.value.event_name

        bet.value.type = null
        bet.value.market_type_name = null
        bet.value.odd = null
        bet.value.nation = null
        bet.value.stake = null
        bet.value.is_back = null
        bet.value.runner_id = null
        bet.value.runner_name = null
        bet.value.market_id = null
        bet.value.fancy_odd = null
        bet.value.rate = null
        bet.value.betting_type = null
        bet.value.bet_delay = 0
        bet.value.is_cashout_hedge = false
        selectedRunnerId.value = null
        selectedMarketId.value = null
        selectedMarketType.value = null
        minAmount.value = 0
        maxAmount.value = 0
        bet_error.value = null

        bet.value.event_id = preservedEventId
        bet.value.event_type_id = preservedEventTypeId
        bet.value.event_name = preservedEventName
    }

    const clearStake = () => {
        bet.value.stake = null
    }

    const clearAll = () => {
        clearBetSelection()
        clearStake()
    }

    const handleSelectBet = async (betDetails, event_type_id, event_name, runner_count = null) => {
        const {
            odd,
            backOrLay,
            runnerId,
            runnerName,
            marketId,
            eventId,
            type,
            marketTypeName,
            base,
            minAmount: betMinAmount,
            maxAmount: betMaxAmount,
            betting_type,
            bet_delay,
            rate,
            skipOneClick = false,
            isCashoutHedge = false
        } = betDetails

        if (!odd || Number(odd) === 0) {
            bet_error.value = 'Cannot select odds with value 0.';
            return;
        }

        if (!currentEventId.value && eventId) {
            currentEventId.value = eventId
        }

        if (currentEventId.value !== eventId) {
            await switchEvent(eventId)
        }

        minAmount.value = betMinAmount
        maxAmount.value = betMaxAmount

        bet.value.type = type
        bet.value.market_type_name = marketTypeName
        bet.value.event_id = eventId
        bet.value.event_type_id = event_type_id
        bet.value.event_name = event_name
        bet.value.odd = odd
        bet.value.nation = runnerName
        bet.value.is_back = backOrLay === "back"
        bet.value.runner_id = runnerId
        bet.value.runner_name = runnerName
        bet.value.market_id = marketId
        bet.value.fancy_odd = base
        bet.value.rate = rate ?? base // Keep rate populated for fancy/line payload mapping
        bet.value.betting_type = betting_type
        bet.value.bet_delay = normalizeBetDelay(bet_delay)
        bet.value.runner_count = runner_count
        bet.value.is_cashout_hedge = Boolean(isCashoutHedge)

        selectedRunnerId.value = runnerId
        selectedMarketId.value = marketId
        selectedMarketType.value = type

        bet_error.value = null

        if (!skipOneClick && oneClickStore.isActive && !oneClickStore.editMode) {
            try {
                changeAmount(oneClickStore.currentAmount, maxAmount.value, true)
                await new Promise(resolve => setTimeout(resolve, 0))
                await placeBet()
                if (bet_status.value === 'failed') {
                    const errorMessage = bet_error.value || 'Failed to place bet'
                    showError(errorMessage)
                }
            } catch (error) {
                console.error('One-click bet failed:', error)
                const errorMessage = bet_error.value || error.message || 'Failed to place bet'
                showError(errorMessage)
            }
        }
    }

    const changeAmount = (amount, maxAmountLimit, replace = false) => {
        const max = Number(maxAmountLimit || maxAmount.value)

        if (replace) {
            bet.value.stake = parseInt(amount)
        } else {
            const currentStake = parseFloat(bet.value.stake) || 0
            const newStake = currentStake + parseInt(amount)

            if (newStake > max) {
                bet.value.stake = parseInt(amount)
            } else {
                bet.value.stake = newStake
            }
        }
    }

    const setMaxStake = () => {
        if (maxAmount.value > 0) {
            bet.value.stake = maxAmount.value
        }
    }

    const validateStake = () => {
        const stake = Number(bet.value.stake)
        const min = Number(minAmount.value)
        const max = Number(maxAmount.value)

        if (bet.value.is_cashout_hedge) {
            if (stake < min) {
                bet_error.value = `Stake must be at least ${minAmount.value}`
                return false
            }

            bet_error.value = null
            return true
        }

        if (stake < min || stake > max) {
            bet_error.value = `Stake must be between ${minAmount.value} and ${maxAmount.value}`
            return false
        }

        bet_error.value = null
        return true
    }

    const placeBet = async () => {
        if (bet_status.value === 'processing') {
            return
        }

        const offPlayBlock = getOffPlayBetBlockReason(bet.value.market_id)
        if (offPlayBlock) {
            bet_error.value = i18n.global.t('sports.home.offPlayMarketBetNotAllowed')
            bet_status.value = 'failed'
            setTimeout(() => {
                bet_status.value = null
            }, 3000)
            return
        }

        if (!validateStake()) {
            bet_status.value = "failed"
            setTimeout(() => {
                bet_status.value = null
            }, 3000)
            return
        }

        bet_status.value = "processing"
        const placeDelayPromise = waitForPlaceDelay(bet.value.bet_delay)
        try {
            const betPayload = {
                stake: Number(bet.value.stake),
                is_back: bet.value.is_back ? 1 : 0,
                market_id: bet.value.market_id,
                odd: bet.value.odd,
                runner_id: bet.value.runner_id,
                event_name: bet.value.event_name
            }

            const betType = String(bet.value.type || '').toUpperCase()
            const bettingType = String(bet.value.betting_type || '').toUpperCase()
            const isLineBet = betType === 'LINE' || bettingType === 'LINE'

            if (isLineBet) {
                betPayload.rate = 100
                betPayload.fancy_odd = 100
            } else if (betType === 'F') {
                const rateValue = bet.value.rate ?? bet.value.fancy_odd
                if (rateValue !== null && rateValue !== undefined && rateValue !== '') {
                    const normalizedRate = Number(rateValue)
                    betPayload.rate = normalizedRate
                    betPayload.fancy_odd = normalizedRate
                }
            }

            const api = getApiClient('event')
            const response = await api.post('/bet', betPayload)
            updateFromResponse(response)

            await placeDelayPromise

            const acceptedOdd = response?.accepted_odd ?? response?.data?.accepted_odd ?? bet.value.odd
            const successMessage = response?.message
              || `Bet(s) matched at odds ${acceptedOdd}`

            const cashoutMarketId = bet.value.is_cashout_hedge ? bet.value.market_id : null

            clearBetSelectionOnly()
            clearPlaceDelayTimer()
            placingCountdown.value = 0
            bet_status.value = "success"
            showSuccess(successMessage)

            if (cashoutMarketId) {
                startSpeedCashCooldown(cashoutMarketId)
            }

            // Reset bet_status after a delay
            // Note: Bet history and market data refresh is handled by page-level watchers
            // (Bet.vue and MultiMarket/index.vue) to avoid duplicate refreshes
            setTimeout(() => {
                bet_status.value = null
            }, 1000)

            return response
        } catch (error) {
            console.error("Error placing bet:", error)
            clearPlaceDelayTimer()
            placingCountdown.value = 0
            bet_error.value = error.response?.data?.error || error.message || 'Session expired'
            bet_status.value = "failed"

            setTimeout(() => {
                bet_status.value = null
            }, 1000)

            if (error.response && error.response.status === 401) {
                setTimeout(async () => {
                    await authStore.logout()
                }, 2000)
            }

            throw error
        }
    }

    const refreshBetHistory = async (eventId = null) => {
        try {
            const targetEventId = eventId || currentEventId.value
            if (!targetEventId) return

            // Block API calls for all demo users (both preview and full demo)
            if (authStore.isDemoUser) {
                betHistory.value = []
                betOutcomes.value = {}
                return { bets: [], outcomes: {} }
            }

            const result = await fetchBetHistory(targetEventId)
            betHistory.value = result?.bets ?? []
            betOutcomes.value = result?.outcomes ?? {}
            return result
        } catch (error) {
            console.error('Error refreshing bet history:', error)
            betHistory.value = []
            betOutcomes.value = {}
        }
    }

    const setBetHistory = (history) => {
        betHistory.value = history || []
    }

    const setBetOutcomes = (outcomes) => {
        betOutcomes.value = outcomes || {}
    }

    const resetStore = () => {
        clearAll()
        betHistory.value = []
        betOutcomes.value = {}
        bet_status.value = null
        clearPlaceDelayTimer()
        placingCountdown.value = 0
        bet_error.value = null
        currentEventId.value = null
    }

    const switchEvent = async (newEventId) => {
        if (currentEventId.value !== newEventId) {
            currentEventId.value = newEventId
            clearBetSelection()
            await refreshBetHistory(newEventId)
        }
    }

    return {
        // State
        bet,
        bet_status,
        bet_error,
        placingCountdown,
        betHistory,
        betOutcomes,
        selectedRunnerId,
        selectedMarketId,
        selectedMarketType,
        minAmount,
        maxAmount,
        currentEventId,

        // Getters
        betHistoryCount,
        // Actions
        initializeBet,
        switchEvent,
        clearBetSelection,
        clearBetSelectionOnly,
        clearStake,
        clearAll,
        handleSelectBet,
        changeAmount,
        setMaxStake,
        validateStake,
        placeBet,
        refreshBetHistory,
        setBetHistory,
        setBetOutcomes,
        resetStore,
        switchEvent
    }
})
