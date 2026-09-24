<template>
  <div class="account-page">
    <AccountPageHeader :title="t('profitLoss.title')" />

    <AccountPageFilters
      v-model:from-date="fromDate"
      v-model:to-date="toDate"
      :show-type-filter="false"
      :loading="loading"
      :has-validation-error="hasValidationError"
      @date-change="handleDateChange"
      @apply="handleFilterClick"
    />

    <ProfitLossTable
      :profit-loss-data="profitLossData"
      :loading="loading"
    />
  </div>
</template>

<script setup>
import ProfitLossTable from './ProfitLossTable.vue'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import AccountPageFilters from '@/components/account/AccountPageFilters.vue'
import * as reports from '@/api/report/reports.js'
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDateRangeFilter } from '@/composables/useDateRangeFilter/useDateRangeFilter.js'

const { t } = useI18n()

const loading = ref(true)
const profitLossData = ref([])

const {
  fromDate,
  toDate,
  handleDateChange,
  getCurrentFilters,
  setDefaultDates,
  isValidForApiCall,
  hasValidationError
} = useDateRangeFilter()

const handleFilterClick = async () => {
  if (isValidForApiCall()) {
    const filters = getCurrentFilters()
    await fetchProfitLoss(filters)
  }
}

const fetchProfitLoss = async (filters = {}) => {
  try {
    loading.value = true
    const response = await reports.getProfitLoss(filters)

    if (response) {
      if (response.success && response.data) {
        profitLossData.value = Array.isArray(response.data) ? response.data : []
      } else if (Array.isArray(response)) {
        profitLossData.value = response
      } else if (response.data && Array.isArray(response.data)) {
        profitLossData.value = response.data
      } else {
        profitLossData.value = []
      }
    } else {
      profitLossData.value = []
    }
  } catch (error) {
    console.error('Failed to fetch profit loss:', error)
    profitLossData.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  setDefaultDates()
  setTimeout(() => {
    handleFilterClick()
  }, 100)
})
</script>
