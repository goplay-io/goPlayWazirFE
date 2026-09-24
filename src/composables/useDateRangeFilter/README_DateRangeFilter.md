# Date Range Filter Composable

This composable provides consistent date range filtering functionality across all betting-related pages.

## Usage

### Basic Setup

```javascript
import { useDateRangeFilter } from '@/composables/useDateRangeFilter.js'

// In your component's setup function
const {
    fromDate,
    toDate,
    dateValidationError,
    handleDateChange,
    getCurrentFilters,
    setDatesFromFilters,
    isValidForApiCall
} = useDateRangeFilter()
```

### Template Usage

```vue
<template>
    <!-- Date Range Inputs -->
    <v-text-field 
        v-model="fromDate" 
        label="From Date" 
        type="date" 
        variant="outlined" 
        density="compact"
        :error="dateValidationError" 
        @update:model-value="handleDateChange" 
    />
    
    <v-text-field 
        v-model="toDate" 
        label="To Date" 
        type="date" 
        variant="outlined" 
        density="compact"
        :error="dateValidationError" 
        @update:model-value="handleDateChange" 
    />
    
    <!-- Search Button -->
    <v-btn @click="fetchData" :disabled="!isValidForApiCall()">
        Search
    </v-btn>
    
    <!-- Error Display -->
    <v-alert v-if="dateValidationError" type="error">
        {{ dateValidationError }}
    </v-alert>
</template>
```

### API Integration

```javascript
// Fetch data function
const fetchData = () => {
    if (!isValidForApiCall()) return
    
    const filters = getCurrentFilters()
    // filters will always have start_date and end_date (defaults to last 6 days)
    
    apiCall(filters)
}

// Initialize with default dates
onMounted(() => {
    // Set default dates in inputs
    setDefaultDates()
    
    // Or set from initial filters
    setDatesFromFilters({ start_date: '2025-06-10', end_date: '2025-06-16' })
    
    fetchData()
})
```

## Available Methods

### State
- `fromDate` - Reactive ref for start date input
- `toDate` - Reactive ref for end date input  
- `dateValidationError` - Reactive ref for validation error message

### Methods
- `getDefaultDates()` - Returns object with 6-day default range
- `setDefaultDates()` - Sets input fields to 6-day default
- `validateDates()` - Validates current date inputs
- `handleDateChange()` - Called when date inputs change
- `getCurrentFilters()` - Gets current filters with defaults if needed
- `setDatesFromFilters(filters)` - Sets inputs from filter object
- `clearDates()` - Clears all date inputs
- `isValidForApiCall()` - Checks if ready for API call

### Computed Properties
- `hasValidationError` - Boolean indicating if there's a validation error
- `hasDateRange` - Boolean indicating if both dates are set

## Examples

### 1. Bet History Page

```javascript
// BetHistoryTable.vue
import { useDateRangeFilter } from '@/composables/useDateRangeFilter.js'

const { fromDate, toDate, dateValidationError, handleDateChange, getCurrentFilters, setDefaultDates } = useDateRangeFilter()

const fetchBetHistory = () => {
    const filters = getCurrentFilters()
    // Add any additional filters
    filters.event_type_id = selectedEventType.value
    
    emit('filter-change', filters)
}

onMounted(() => {
    setDefaultDates()
    fetchBetHistory()
})
```

### 2. Unsettled Bets Page

```javascript
// UnsettledBetsTable.vue  
import { useDateRangeFilter } from '@/composables/useDateRangeFilter.js'

const { fromDate, toDate, getCurrentFilters, setDatesFromFilters, isValidForApiCall } = useDateRangeFilter()

const fetchData = () => {
    if (!isValidForApiCall()) return
    const filters = getCurrentFilters()
    emit('filter-change', filters)
}

onMounted(() => {
    if (props.initialFilters.start_date || props.initialFilters.end_date) {
        setDatesFromFilters(props.initialFilters)
    }
    fetchData()
})
```

## Migration Guide

To migrate existing pages:

1. **Replace imports**: Remove individual date state and add composable import
2. **Replace state**: Remove individual `fromDate`, `toDate`, `dateValidationError` refs
3. **Replace validation**: Remove custom validation functions
4. **Replace date handling**: Remove custom date change handlers
5. **Update fetch logic**: Use `getCurrentFilters()` instead of manual filter building
6. **Update initialization**: Use composable methods instead of custom default date logic

## Benefits

- ✅ **Consistency** - Same 6-day default across all pages
- ✅ **Validation** - Unified validation rules and error messages
- ✅ **Maintainability** - Single source of truth for date logic
- ✅ **Reusability** - Easy to add to new pages
- ✅ **Flexibility** - Supports custom initialization and additional filters
