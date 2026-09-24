import { useDateRangeFilter } from './useDateRangeFilter';
import { ref } from 'vue';
import MockDate from 'mockdate';

// Mock appConstants - using relative path or module name that matches your setup
jest.mock('@/constants/appConstants', () => ({
    default: {
        FILTER_RANGE_DAYS: 6
    }
}), { virtual: true });

describe('useDateRangeFilter', () => {
    const MOCK_TODAY = '2025-08-21T12:00:00Z';
    const MOCK_TODAY_DATE = '2025-08-21';
    const MOCK_30_DAYS_AGO = '2025-07-23'; // 30 days ago including today
    const MOCK_6_DAYS_AGO = '2025-08-16';  // 6 days ago including today

    beforeEach(() => {
        MockDate.set(MOCK_TODAY);
    });

    afterEach(() => {
        MockDate.reset();
    });

    describe('constructor and MAX_DATE_RANGE', () => {
        it('uses appConstants.FILTER_RANGE_DAYS if maxDateRange is not provided', () => {
            const { MAX_DATE_RANGE } = useDateRangeFilter();
            expect(MAX_DATE_RANGE.value).toBe(6);
        });
        it('uses static maxDateRange if provided', () => {
            const { MAX_DATE_RANGE } = useDateRangeFilter(10);
            expect(MAX_DATE_RANGE.value).toBe(10);
        });
        it('uses reactive maxDateRange if provided', () => {
            const maxDays = ref(20);
            const { MAX_DATE_RANGE } = useDateRangeFilter(maxDays);
            expect(MAX_DATE_RANGE.value).toBe(20);
            maxDays.value = 25;
            expect(MAX_DATE_RANGE.value).toBe(25);
        });
        it('falls back to 6 if appConstants.FILTER_RANGE_DAYS is not set', () => {
            jest.doMock('@/constants/appConstants', () => ({ default: {} }), { virtual: true });
            // Re-import after mock
            const { useDateRangeFilter: useDateRangeFilterNoConst } = require('./useDateRangeFilter');
            const { MAX_DATE_RANGE } = useDateRangeFilterNoConst();
            expect(MAX_DATE_RANGE.value).toBe(6);
        });
    });

    describe('getDefaultDates', () => {
        it('returns last 6 days by default', () => {
            const { getDefaultDates } = useDateRangeFilter();
            const defaults = getDefaultDates();
            expect(defaults).toEqual({
                start_date: '2025-08-16',
                end_date: '2025-08-21'
            });
        });
    });

    describe('setDefaultDates', () => {
        it('sets fromDate and toDate to default values', () => {
            const { setDefaultDates, fromDate, toDate } = useDateRangeFilter();
            setDefaultDates();
            expect(fromDate.value).toBe('2025-08-16');
            expect(toDate.value).toBe('2025-08-21');
        });
    });

    describe('validateDates', () => {
        it('validates empty dates as valid', () => {
            const { validateDates, fromDate, toDate, dateValidationError } = useDateRangeFilter();
            fromDate.value = '';
            toDate.value = '';
            expect(validateDates()).toBe(true);
            expect(dateValidationError.value).toBe('');
        });
        it('requires both dates if one is set', () => {
            const { validateDates, fromDate, toDate, dateValidationError } = useDateRangeFilter();
            fromDate.value = '2025-08-16';
            toDate.value = '';
            expect(validateDates()).toBe(false);
            expect(dateValidationError.value).toMatch(/Both start and end dates/);
            fromDate.value = '';
            toDate.value = '2025-08-21';
            expect(validateDates()).toBe(false);
            expect(dateValidationError.value).toMatch(/Both start and end dates/);
        });
        it('validates that start date is not after end date', () => {
            const { validateDates, fromDate, toDate, dateValidationError } = useDateRangeFilter();
            fromDate.value = '2025-08-21';
            toDate.value = '2025-08-16';
            expect(validateDates()).toBe(false);
            expect(dateValidationError.value).toMatch(/Start date cannot be later/);
        });
        it('validates correct date range', () => {
            const { validateDates, fromDate, toDate, dateValidationError } = useDateRangeFilter();
            fromDate.value = '2025-08-16';
            toDate.value = '2025-08-21';
            expect(validateDates()).toBe(true);
            expect(dateValidationError.value).toBe('');
        });
        it('validates maximum date range limit', () => {
            const { validateDates, fromDate, toDate, dateValidationError } = useDateRangeFilter(3);
            fromDate.value = '2025-08-16';
            toDate.value = '2025-08-21'; // 6 days
            expect(validateDates()).toBe(false);
            expect(dateValidationError.value).toMatch(/Date range cannot exceed 3 days/);
        });
        it('allows same start and end date', () => {
            const { validateDates, fromDate, toDate, dateValidationError } = useDateRangeFilter();
            fromDate.value = '2025-08-21';
            toDate.value = '2025-08-21';
            expect(validateDates()).toBe(true);
            expect(dateValidationError.value).toBe('');
        });
        it('handles leap year edge case', () => {
            const { validateDates, fromDate, toDate, dateValidationError } = useDateRangeFilter(2);
            fromDate.value = '2024-02-28';
            toDate.value = '2024-02-29';
            expect(validateDates()).toBe(true);
            expect(dateValidationError.value).toBe('');
        });
    });

    describe('handleDateChange', () => {
        it('triggers validation when dates change', () => {
            const { fromDate, toDate, handleDateChange, dateValidationError } = useDateRangeFilter();
            fromDate.value = '2025-08-21';
            toDate.value = '2025-08-16';
            handleDateChange();
            expect(dateValidationError.value).toMatch(/Start date cannot be later/);
            fromDate.value = '2025-08-16';
            toDate.value = '2025-08-21';
            handleDateChange();
            expect(dateValidationError.value).toBe('');
        });
    });

    describe('getCurrentFilters', () => {
        it('returns user dates if both are set', () => {
            const { fromDate, toDate, getCurrentFilters } = useDateRangeFilter();
            fromDate.value = '2025-08-10';
            toDate.value = '2025-08-20';
            expect(getCurrentFilters()).toEqual({
                start_date: '2025-08-10',
                end_date: '2025-08-20'
            });
        });
        it('returns defaults if user dates are empty', () => {
            const { fromDate, toDate, getCurrentFilters } = useDateRangeFilter();
            fromDate.value = '';
            toDate.value = '';
            expect(getCurrentFilters()).toEqual({
                start_date: '2025-08-16',
                end_date: '2025-08-21'
            });
        });
        it('returns defaults if only one date is set', () => {
            const { fromDate, toDate, getCurrentFilters } = useDateRangeFilter();
            fromDate.value = '2025-08-10';
            toDate.value = '';
            expect(getCurrentFilters()).toEqual({
                start_date: '2025-08-16',
                end_date: '2025-08-21'
            });
            fromDate.value = '';
            toDate.value = '2025-08-20';
            expect(getCurrentFilters()).toEqual({
                start_date: '2025-08-16',
                end_date: '2025-08-21'
            });
        });
    });

    describe('setDatesFromFilters', () => {
        it('sets fromDate and toDate from complete filter object', () => {
            const { fromDate, toDate, setDatesFromFilters } = useDateRangeFilter();
            setDatesFromFilters({ start_date: '2025-08-01', end_date: '2025-08-05' });
            expect(fromDate.value).toBe('2025-08-01');
            expect(toDate.value).toBe('2025-08-05');
        });
        it('handles partial filter data gracefully', () => {
            const { fromDate, toDate, setDatesFromFilters } = useDateRangeFilter();
            fromDate.value = 'initial';
            toDate.value = 'initial';
            setDatesFromFilters({ start_date: '2025-08-01' });
            expect(fromDate.value).toBe('2025-08-01');
            expect(toDate.value).toBe('initial');
            setDatesFromFilters({ end_date: '2025-08-05' });
            expect(fromDate.value).toBe('2025-08-01');
            expect(toDate.value).toBe('2025-08-05');
        });
        it('handles null or undefined filter object', () => {
            const { fromDate, toDate, setDatesFromFilters } = useDateRangeFilter();
            fromDate.value = 'initial';
            toDate.value = 'initial';
            setDatesFromFilters(null);
            expect(fromDate.value).toBe('initial');
            expect(toDate.value).toBe('initial');
            setDatesFromFilters(undefined);
            expect(fromDate.value).toBe('initial');
            expect(toDate.value).toBe('initial');
        });
    });

    describe('clearDates', () => {
        it('resets all date fields and validation errors', () => {
            const { fromDate, toDate, dateValidationError, clearDates } = useDateRangeFilter();
            fromDate.value = '2025-08-01';
            toDate.value = '2025-08-05';
            dateValidationError.value = 'Some error';
            clearDates();
            expect(fromDate.value).toBe('');
            expect(toDate.value).toBe('');
            expect(dateValidationError.value).toBe('');
        });
    });

    describe('isValidForApiCall', () => {
        it('returns true for empty dates (uses defaults)', () => {
            const { fromDate, toDate, isValidForApiCall } = useDateRangeFilter();
            fromDate.value = '';
            toDate.value = '';
            expect(isValidForApiCall()).toBe(true);
        });
        it('returns true for valid date ranges', () => {
            const { fromDate, toDate, isValidForApiCall } = useDateRangeFilter();
            fromDate.value = '2025-08-16';
            toDate.value = '2025-08-21';
            expect(isValidForApiCall()).toBe(true);
        });
        it('returns false for invalid date ranges', () => {
            const { fromDate, toDate, isValidForApiCall } = useDateRangeFilter();
            fromDate.value = '2025-08-21';
            toDate.value = '2025-08-16';
            expect(isValidForApiCall()).toBe(false);
        });
        it('returns false for partial dates', () => {
            const { fromDate, toDate, isValidForApiCall } = useDateRangeFilter();
            fromDate.value = '2025-08-16';
            toDate.value = '';
            expect(isValidForApiCall()).toBe(false);
            fromDate.value = '';
            toDate.value = '2025-08-21';
            expect(isValidForApiCall()).toBe(false);
        });
        it('returns false when date range exceeds maximum', () => {
            const { fromDate, toDate, isValidForApiCall } = useDateRangeFilter(3);
            fromDate.value = '2025-08-16';
            toDate.value = '2025-08-21';
            expect(isValidForApiCall()).toBe(false);
        });
    });

    describe('computed properties', () => {
        it('hasValidationError reflects validation state', () => {
            const { dateValidationError, hasValidationError } = useDateRangeFilter();
            expect(hasValidationError.value).toBe(false);
            dateValidationError.value = 'Some error';
            expect(hasValidationError.value).toBe(true);
            dateValidationError.value = '';
            expect(hasValidationError.value).toBe(false);
        });
        it('hasDateRange reflects presence of both dates', () => {
            const { fromDate, toDate, hasDateRange } = useDateRangeFilter();
            expect(hasDateRange.value).toBe(false);
            fromDate.value = '2025-08-16';
            expect(hasDateRange.value).toBe(false);
            toDate.value = '2025-08-21';
            expect(hasDateRange.value).toBe(true);
            fromDate.value = '';
            expect(hasDateRange.value).toBe(false);
        });
    });

    describe('integration scenarios', () => {
        it('handles complete workflow with custom parameters', () => {
            const {
                fromDate,
                toDate,
                setDatesFromFilters,
                validateDates,
                getCurrentFilters,
                clearDates,
                hasDateRange,
                hasValidationError,
                MAX_DATE_RANGE
            } = useDateRangeFilter(7);
            // Start with empty state
            expect(hasDateRange.value).toBe(false);
            expect(hasValidationError.value).toBe(false);
            expect(MAX_DATE_RANGE.value).toBe(7);
            // Set dates from filters
            setDatesFromFilters({ start_date: '2025-08-18', end_date: '2025-08-21' });
            expect(hasDateRange.value).toBe(true);
            // Validate
            expect(validateDates()).toBe(true);
            // Get current filters
            const filters = getCurrentFilters();
            expect(filters).toEqual({ start_date: '2025-08-18', end_date: '2025-08-21' });
            // Clear and verify
            clearDates();
            expect(hasDateRange.value).toBe(false);
            expect(fromDate.value).toBe('');
            expect(toDate.value).toBe('');
        });
        it('handles date range limit validation workflow', () => {
            const {
                fromDate,
                toDate,
                validateDates,
                handleDateChange,
                hasValidationError,
                dateValidationError
            } = useDateRangeFilter(7);
            // Set range that exceeds limit
            fromDate.value = '2025-08-10';
            toDate.value = '2025-08-20'; // 11 days, exceeds 7 day limit
            // Validate through handleDateChange
            handleDateChange();
            expect(hasValidationError.value).toBe(true);
            expect(dateValidationError.value).toMatch(/Date range cannot exceed 7 days/);
            // Fix the range
            fromDate.value = '2025-08-18';
            toDate.value = '2025-08-21'; // 4 days, within limit
            handleDateChange();
            expect(hasValidationError.value).toBe(false);
            expect(dateValidationError.value).toBe('');
        });
        it('handles workflow with reactive maxDateRange', () => {
            const maxDays = ref(5);
            const {
                fromDate,
                toDate,
                validateDates,
                MAX_DATE_RANGE,
                dateValidationError
            } = useDateRangeFilter(maxDays);
            // Set dates that are within initial limit
            fromDate.value = '2025-08-19';
            toDate.value = '2025-08-21'; // 3 days
            expect(validateDates()).toBe(true);
            expect(MAX_DATE_RANGE.value).toBe(5);
            // Reduce the limit to make current range invalid
            maxDays.value = 2;
            expect(MAX_DATE_RANGE.value).toBe(2);
            expect(validateDates()).toBe(false);
            expect(dateValidationError.value).toMatch(/Date range cannot exceed 2 days/);
            // Increase limit again
            maxDays.value = 10;
            expect(validateDates()).toBe(true);
        });
    });
});