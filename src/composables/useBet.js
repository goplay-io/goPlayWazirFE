import { useBetStore } from '@/stores/bet'

/**
 * @deprecated Use useBetStore directly instead
 * This composable is kept for backward compatibility and will be removed in future versions.
 * 
 * Migration guide:
 * - Replace `const { bet, placeBet, ... } = useBet(props)` 
 * - With `const betStore = useBetStore()`
 * - Then use `betStore.bet`, `betStore.placeBet()`, etc.
 */
export function useBet(props) {
    console.warn('useBet composable is deprecated. Please use useBetStore directly.')
    
    const betStore = useBetStore()
    
    // Initialize the store if eventId is provided
    if (props?.event_id) {
        betStore.initializeBet(props.event_id)
    }
    
    // Return store properties and methods for backward compatibility
    return {
        bet: betStore.bet,
        bet_status: betStore.bet_status,
        bet_error: betStore.bet_error,
        betHistory: betStore.betHistory,
        selectedRunnerId: betStore.selectedRunnerId,
        selectedMarketId: betStore.selectedMarketId,
        selectedMarketType: betStore.selectedMarketType,
        minAmount: betStore.minAmount,
        maxAmount: betStore.maxAmount,
        betHistoryCount: betStore.betHistoryCount,
        placeBet: betStore.placeBet,
        refreshBetHistory: betStore.refreshBetHistory,
        handleSelectBet: betStore.handleSelectBet,
        changeAmount: betStore.changeAmount,
        validateStake: betStore.validateStake
    }
}
