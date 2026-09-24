<template>
  <div class="account-page">
    <AccountPageHeader :title="t('turnoverHistory.title')" />

    <AccountPageFilters
      v-model:selected-event-type="transactionType"
      v-model:from-date="fromDate"
      v-model:to-date="toDate"
      :type-label="t('turnoverHistory.transactionType')"
      :type-options="transactionTypeOptions"
      type-item-title="title"
      type-item-value="value"
      type-clearable
      :loading="loading"
      :has-validation-error="hasValidationError"
      @date-change="handleDateChange"
      @type-change="handleFilterChange"
      @apply="handleSearchClick"
    />

    <TurnoverHistoryTable
      :rows="rows"
      :loading="loading"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import AccountPageFilters from '@/components/account/AccountPageFilters.vue'
import TurnoverHistoryTable from './TurnoverHistoryTable.vue'
import { getTurnoverHistory } from '@/api/wallet/wallet.js'
import { useDateRangeFilter } from '@/composables/useDateRangeFilter/useDateRangeFilter.js'

const { t } = useI18n()

const rows = ref([])
const loading = ref(false)
const transactionType = ref('')

const {
  fromDate,
  toDate,
  handleDateChange,
  getCurrentFilters,
  setDefaultDates,
  isValidForApiCall,
  hasValidationError
} = useDateRangeFilter()

const transactionTypeOptions = computed(() => [
  { title: t('turnoverHistory.transactionTypeOptions.all'), value: '' },
  { title: t('turnoverHistory.transactionTypeOptions.betPlacement'), value: 'bet_placement' },
  { title: t('turnoverHistory.transactionTypeOptions.betSettlement'), value: 'bet_settlement' },
  { title: t('turnoverHistory.transactionTypeOptions.betRollback'), value: 'bet_rollback' },
  { title: t('turnoverHistory.transactionTypeOptions.betVoid'), value: 'bet_void' }
])

const buildQueryParams = () => {
  const params = {}
  if (transactionType.value) {
    params.transaction_type = transactionType.value
  }
  const filters = getCurrentFilters()
  if (filters.start_date) params.from = filters.start_date
  if (filters.end_date) params.to = filters.end_date
  return params
}

const fetchTurnoverHistory = async () => {
  if (!isValidForApiCall()) return

  loading.value = true
  try {
    const response = await getTurnoverHistory(buildQueryParams())
    const payload = response?.data || response

    if (payload && Array.isArray(payload.data)) {
      rows.value = payload.data
    } else if (Array.isArray(payload)) {
      rows.value = payload
    } else {
      rows.value = []
    }
  } catch (err) {
    console.error('Failed to load turnover history', err)
    rows.value = []
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  fetchTurnoverHistory()
}

const handleSearchClick = () => {
  fetchTurnoverHistory()
}

onMounted(() => {
  setDefaultDates()
  setTimeout(() => {
    fetchTurnoverHistory()
  }, 100)
})
</script>
