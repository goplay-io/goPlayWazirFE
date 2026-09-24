<template>
  <div class="account-page">
    <AccountPageHeader :title="t('betHistory.title')" />

    <AccountPageFilters
      v-model:selected-event-type="selectedEventType"
      v-model:from-date="fromDate"
      v-model:to-date="toDate"
      :type-options="typeOptions"
      :loading="loading"
      :has-validation-error="hasValidationError"
      @date-change="handleDateChange"
      @apply="handleFilterClick"
    />

    <BetHistoryTable
      :bets="bets"
      :loading="loading"
      :event-types="eventTypes"
    />
  </div>
</template>

<script setup>
import BetHistoryTable from './BetHistoryTable.vue'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import AccountPageFilters from '@/components/account/AccountPageFilters.vue'
import * as reports from '@/api/report/reports.js'
import { getEventTypes } from '@/api/event/eventTypes'
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDateRangeFilter } from '@/composables/useDateRangeFilter/useDateRangeFilter.js'

const { t } = useI18n()

const loading = ref(true)
const bets = ref([])
const eventTypes = ref([])
const selectedEventType = ref(null)

const {
  fromDate,
  toDate,
  handleDateChange,
  getCurrentFilters,
  setDefaultDates,
  isValidForApiCall,
  hasValidationError
} = useDateRangeFilter()

const eventTypeOptions = computed(() => {
  if (!eventTypes.value || !Array.isArray(eventTypes.value)) {
    return []
  }
  return eventTypes.value.map(eventType => ({
    id: eventType.id,
    name: eventType.name || eventType.event_type_name || `Event Type ${eventType.id}`
  }))
})

const typeOptions = computed(() => [
  { id: null, name: t('account.statement.allSports') },
  ...eventTypeOptions.value
])

const handleFilterClick = async () => {
  if (isValidForApiCall()) {
    const filters = getCurrentFilters()
    if (selectedEventType.value) {
      filters.event_type_id = selectedEventType.value
    }
    await fetchBetHistory(filters)
  }
}

const fetchBetHistory = async (filters = {}) => {
  try {
    loading.value = true
    const response = await reports.getBetHistory(filters)

    if (response) {
      if (response.success && response.data) {
        bets.value = Array.isArray(response.data) ? response.data : []
      } else if (Array.isArray(response)) {
        bets.value = response
      } else if (response.data && Array.isArray(response.data)) {
        bets.value = response.data
      } else {
        bets.value = []
      }
    } else {
      bets.value = []
    }
  } catch (error) {
    console.error('Failed to fetch bet history:', error)
    bets.value = []
  } finally {
    loading.value = false
  }
}

const fetchEventTypes = async () => {
  try {
    const response = await getEventTypes()
    if (response && response.data) {
      eventTypes.value = response.data
    } else {
      eventTypes.value = []
    }
  } catch (error) {
    console.error('Failed to fetch event types:', error)
    eventTypes.value = []
  }
}

onMounted(async () => {
  await fetchEventTypes()
  setDefaultDates()
  setTimeout(() => {
    handleFilterClick()
  }, 100)
})
</script>
