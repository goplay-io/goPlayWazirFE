<template>
  <div class="account-page">
    <AccountPageHeader :title="t('bonus.statement.title')">
      <template #actions>
        <button
          type="button"
          class="bonus-statement-help-btn"
          :aria-label="t('bonus.statement.title')"
          @click="showRedeemHelp = true"
        >
          <v-icon size="20">mdi-help-circle-outline</v-icon>
        </button>
      </template>
    </AccountPageHeader>

    <AccountPageFilters
      v-model:selected-event-type="selectedStatus"
      v-model:from-date="fromDate"
      v-model:to-date="toDate"
      :type-label="t('bonus.statement.status')"
      :type-options="statusOptions"
      type-item-title="label"
      type-item-value="value"
      :show-date-filters="selectedStatus !== 'pending'"
      :loading="loading"
      :has-validation-error="selectedStatus !== 'pending' && hasValidationError"
      @date-change="handleDateChange"
      @type-change="handleFilterChange"
      @apply="handleFilterClick"
    />

    <BonusStatementTable
      :items="items"
      :loading="loading"
    />

    <BonusRedeemHelpDialog v-model="showRedeemHelp" />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import AccountPageFilters from '@/components/account/AccountPageFilters.vue'
import BonusStatementTable from './BonusStatementTable.vue'
import BonusRedeemHelpDialog from './BonusRedeemHelpDialog.vue'
import { getBonusStatement } from '@/api/wallet/wallet'
import { ref, computed, onMounted } from 'vue'
import { useDateRangeFilter } from '@/composables/useDateRangeFilter/useDateRangeFilter.js'

const { t } = useI18n()

const loading = ref(true)
const items = ref([])
const selectedStatus = ref('pending')
const showRedeemHelp = ref(false)

const statusOptions = computed(() => [
  { label: t('bonus.statement.statusPending'), value: 'pending' },
  { label: t('bonus.statement.statusInactive'), value: 'inactive' },
  { label: t('bonus.statement.statusRedeemed'), value: 'redeemed' },
  { label: t('bonus.statement.statusExpired'), value: 'expired' },
  { label: t('bonus.statement.statusRedeemFailed'), value: 'redeem_failed' },
])

const {
  fromDate,
  toDate,
  handleDateChange,
  getCurrentFilters,
  setDefaultDates,
  isValidForApiCall,
  hasValidationError,
} = useDateRangeFilter(6)

const handleFilterChange = () => {
  if (selectedStatus.value === 'pending' || isValidForApiCall()) {
    handleFilterClick()
  }
}

const handleFilterClick = async () => {
  if (selectedStatus.value === 'pending' || isValidForApiCall()) {
    await fetchBonusStatement()
  }
}

const fetchBonusStatement = async () => {
  try {
    loading.value = true
    const params = {}
    if (selectedStatus.value) {
      params.status = selectedStatus.value
    }
    if (selectedStatus.value !== 'pending') {
      const filters = getCurrentFilters()
      params.start_date = filters.start_date
      params.end_date = filters.end_date
    }
    const response = await getBonusStatement(params)
    const data = response?.data?.data ?? response?.data ?? response
    items.value = data?.items ?? []
  } catch (error) {
    console.error('Failed to fetch bonus statement:', error)
    items.value = []
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

<style scoped>
.bonus-statement-help-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-header-bg, #360952);
  cursor: pointer;
}
</style>
