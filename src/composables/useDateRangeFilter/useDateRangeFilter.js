import { ref, computed, unref } from 'vue'
import appConstants from '@/constants/appConstants'
import { toYMDLocal } from '../../utils/dateUtils.js'

/**
 * Composable for date range filtering functionality
 * Used across bet history, unsettled bets, account statement, and profit loss pages
 */
export function useDateRangeFilter(maxDateRange = null) {
    // Filter states
    const fromDate = ref('')
    const toDate = ref('')
    const dateValidationError = ref('')

    // Handle both static numbers and reactive refs for maxDateRange
    const getMaxDateRange = () => {
        if (maxDateRange !== null) {
            return unref(maxDateRange) // This unwraps ref values or returns static values as-is
        }
        return appConstants.FILTER_RANGE_DAYS || 6
    }

    // Make MAX_DATE_RANGE reactive
    const MAX_DATE_RANGE = computed(() => getMaxDateRange())
    /**
     * Get default date range (last 6 days)
     * @returns {Object} Object with start_date and end_date
     */
    const getDefaultDates = () => {
        const today = new Date()
        const sixDaysAgo = new Date(today)
        sixDaysAgo.setDate(today.getDate() - 5)

        return {
            start_date: sixDaysAgo.toISOString().split('T')[0],
            end_date: today.toISOString().split('T')[0]
        }
    }

    /**
     * Set date inputs to default values
     */
    const setDefaultDates = () => {
        const defaults = getDefaultDates()
        fromDate.value = defaults.start_date
        toDate.value = defaults.end_date
    }

    /**
     * Validate date range
     * @returns {boolean} True if valid, false if invalid
     */
    const validateDates = () => {
        // Allow empty dates (will use defaults for API)
        if (!fromDate.value && !toDate.value) {
            dateValidationError.value = ''
            return true
        }

        // If one date is provided, both should be provided
        if ((fromDate.value && !toDate.value) || (!fromDate.value && toDate.value)) {
            dateValidationError.value = 'Both start and end dates are required when filtering by date'
            return false
        }

        // If both dates are provided, validate the range
        if (fromDate.value && toDate.value && new Date(fromDate.value) > new Date(toDate.value)) {
            dateValidationError.value = 'Start date cannot be later than end date'
            return false
        }

        const diffDays = Math.floor(
            (new Date(toDate.value) - new Date(fromDate.value)) / (1000 * 60 * 60 * 24)
        ) + 1
        if (diffDays > MAX_DATE_RANGE.value) {
            dateValidationError.value = `Date range cannot exceed ${MAX_DATE_RANGE.value} days`
            return false
        }

        dateValidationError.value = ''
        return true
    }

    /**
     * Handle date input changes
     */
    const handleDateChange = () => {
        validateDates()
    }

    /**
     * Get current filter values with defaults if needed
     * @returns {Object} Filter object with start_date and end_date
     */
    const getCurrentFilters = () => {
        const filters = {}

        // Always provide dates - use user selected dates or default to last 6 days
        if (fromDate.value && toDate.value) {
            filters.start_date = toYMDLocal(fromDate.value)
            filters.end_date = toYMDLocal(toDate.value)
        } else {
            // Set default date range (last 6 days) for API call
            const defaults = getDefaultDates()
            filters.start_date = defaults.start_date
            filters.end_date = defaults.end_date
        }

        return filters
    }

    /**
     * Set date inputs from filter object
     * @param {Object} filters - Filter object with start_date and end_date
     */
    const setDatesFromFilters = (filters) => {
        if (filters?.start_date) {
            fromDate.value = filters.start_date
        }
        if (filters?.end_date) {
            toDate.value = filters.end_date
        }
    }

    /**
     * Clear date inputs
     */
    const clearDates = () => {
        fromDate.value = ''
        toDate.value = ''
        dateValidationError.value = ''
    }

    /**
     * Check if dates are valid for API call
     * @returns {boolean} True if valid for API call
     */
    const isValidForApiCall = () => {
        return validateDates()
    }

    return {
        // Reactive state
        fromDate,
        toDate,
        dateValidationError,
        MAX_DATE_RANGE,

        // Methods
        getDefaultDates,
        setDefaultDates,
        validateDates,
        handleDateChange,
        getCurrentFilters,
        setDatesFromFilters,
        clearDates,
        isValidForApiCall,

        // Computed
        hasValidationError: computed(() => !!dateValidationError.value),
        hasDateRange: computed(() => !!(fromDate.value && toDate.value))
    }
}
