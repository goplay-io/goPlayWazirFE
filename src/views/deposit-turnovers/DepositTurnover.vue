<template>
  <div class="account-page">
    <AccountPageHeader :title="t('depositTurnover.title')" />

    <AccountPageFilters
      v-model:selected-event-type="selectedStatus"
      v-model:from-date="fromDate"
      v-model:to-date="toDate"
      :type-label="t('depositTurnover.transactionType')"
      :type-options="statusOptions"
      type-item-title="label"
      type-item-value="value"
      :loading="loading"
      :has-validation-error="hasValidationError"
      @date-change="handleDateChange"
      @type-change="handleStatusChange"
      @apply="handleFilterClick"
    />

    <DepositTurnoverTable
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
import DepositTurnoverTable from './DepositTurnoverTable.vue'
import { getDepositTurnovers } from '@/api/wallet/wallet.js'
import { useDateRangeFilter } from '@/composables/useDateRangeFilter/useDateRangeFilter.js'

const { t } = useI18n()

const rows = ref([])
const loading = ref(false)
const selectedStatus = ref('all')

const statusOptions = computed(() => [
  { label: t('depositTurnover.statusOptions.all'), value: 'all' },
  { label: t('depositTurnover.statusOptions.awarded'), value: 'awarded' },
  { label: t('depositTurnover.statusOptions.inprogress'), value: 'inprogress' },
  { label: t('depositTurnover.statusOptions.redeemed'), value: 'redeemed' }
])

const {
  fromDate,
  toDate,
  handleDateChange,
  getCurrentFilters,
  setDefaultDates,
  isValidForApiCall,
  hasValidationError
} = useDateRangeFilter()

const buildQueryParams = () => {
  const filters = getCurrentFilters()
  const params = {}

  if (selectedStatus.value && selectedStatus.value !== 'all') {
    params.status = selectedStatus.value
  }
  if (filters.start_date) params.start_date = filters.start_date
  if (filters.end_date) params.end_date = filters.end_date

  return params
}

const fetchTurnovers = async () => {
  if (!isValidForApiCall()) return

  try {
    loading.value = true
    const params = buildQueryParams()
    const response = await getDepositTurnovers(params)

    if (response) {
      const payload = response.data || response
      const records = payload.data || payload
      rows.value = Array.isArray(records) ? records : []
    } else {
      rows.value = []
    }
  } catch (error) {
    console.error('Failed to fetch deposit turnovers:', error)
    rows.value = []
  } finally {
    loading.value = false
  }
}

const handleFilterClick = async () => {
  await fetchTurnovers()
}

const handleStatusChange = async () => {
  if (isValidForApiCall()) {
    await fetchTurnovers()
  }
}

onMounted(async () => {
  setDefaultDates()
  setTimeout(() => {
    fetchTurnovers()
  }, 100)
})
</script>
