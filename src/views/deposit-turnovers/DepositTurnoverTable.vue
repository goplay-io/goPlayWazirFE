<template>
  <div class="account-page-table-wrap">
    <div class="account-page-table-scroll">
      <v-data-table
        :headers="tableHeaders"
        :items="rows"
        :loading="loading"
        density="compact"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :items-per-page-options="[10, 25, 50]"
        class="tw-bg-transparent account-page-table account-page-table--wide"
      >
        <template #item.transaction_time="{ item }">
          <span class="account-page-cell account-page-cell--nowrap">
            {{ formatDateTime(item.transaction_time) }}
          </span>
        </template>

        <template #item.amount="{ item }">
          <span class="account-page-cell account-page-cell--positive">
            {{ formatAmount(item.amount) }}
          </span>
        </template>

        <template #item.cashable="{ item }">
          <span class="account-page-cell">
            {{ formatAmount(item.cashable) }}
          </span>
        </template>

        <template #item.turnover="{ item }">
          <span class="account-page-cell">
            {{ formatTurnover(item) }}
          </span>
        </template>

        <template #item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ formatStatus(item.status) }}
          </v-chip>
        </template>

        <template #item.redeemed_at="{ item }">
          <span class="account-page-cell account-page-cell--nowrap">
            {{ formatDateTime(item.redeemed_at) }}
          </span>
        </template>

        <template #item.updated_at="{ item }">
          <span class="account-page-cell account-page-cell--nowrap">
            {{ formatDateTime(item.updated_at) }}
          </span>
        </template>

        <template #no-data>
          <div class="account-page-empty tw-text-center tw-py-8">
            <v-icon size="48" class="account-page-empty__icon tw-mb-4">mdi-cash-plus</v-icon>
            <p class="account-page-empty__title">{{ t('depositTurnover.noData') }}</p>
            <p class="account-page-empty__note">{{ t('depositTurnover.noDataDescription') }}</p>
          </div>
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const page = ref(1)
const itemsPerPage = ref(10)

const tableHeaders = computed(() => [
  { title: t('depositTurnover.tableHeaders.transactionTime'), key: 'transaction_time', sortable: true },
  { title: t('depositTurnover.tableHeaders.amount'), key: 'amount', sortable: true },
  { title: t('depositTurnover.tableHeaders.cashable'), key: 'cashable', sortable: true },
  { title: t('depositTurnover.tableHeaders.turnover'), key: 'turnover', sortable: false },
  { title: t('depositTurnover.tableHeaders.status'), key: 'status', sortable: true },
  { title: t('depositTurnover.tableHeaders.redeemedDate'), key: 'redeemed_at', sortable: true },
  { title: t('depositTurnover.tableHeaders.updateTime'), key: 'updated_at', sortable: true }
])

const formatAmount = (value) => {
  if (value == null || value === '') return '-'
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium'
  })
}

const formatTurnover = (item) => {
  const completed = Number(item.turnover_completed ?? 0)
  const required = Number(item.turnover_required ?? 0)
  if (!required) return '-'
  return `${formatAmount(completed)} / ${formatAmount(required)}`
}

const formatStatus = (status) => {
  if (!status) return '-'
  const normalized = String(status).toLowerCase()
  if (normalized === 'awarded') return t('depositTurnover.statusOptions.awarded')
  if (normalized === 'inprogress') return t('depositTurnover.statusOptions.inprogress')
  if (normalized === 'redeemed') return t('depositTurnover.statusOptions.redeemed')
  return status
}

const getStatusColor = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'awarded') return 'blue'
  if (normalized === 'inprogress') return 'orange'
  if (normalized === 'redeemed') return 'green'
  return 'grey'
}
</script>
