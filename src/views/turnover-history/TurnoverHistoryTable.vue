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
        <template #item.event_date="{ item }">
          <span class="account-page-cell account-page-cell--nowrap">
            {{ formatDateTime(item.event_date) }}
          </span>
        </template>

        <template #item.transaction_type="{ item }">
          <v-chip
            size="x-small"
            variant="tonal"
            :color="getTransactionChipColor(item.transaction_type)"
            :text="formatTransactionType(item.transaction_type)"
          />
        </template>

        <template #item.event_name="{ item }">
          <span
            class="account-page-cell tw-max-w-xs tw-truncate tw-block"
            :title="item.event_name || '-'"
          >
            {{ item.event_name || '-' }}
          </span>
        </template>

        <template #item.market="{ item }">
          <span class="account-page-cell">
            {{ item.market || '-' }}
          </span>
        </template>

        <template #item.market_type="{ item }">
          <span class="account-page-cell">
            {{ (item.market_type || '').toString().toUpperCase() || '-' }}
          </span>
        </template>

        <template #item.amount="{ item }">
          <span
            class="account-page-cell"
            :class="item.amount >= 0 ? 'account-page-cell--positive' : 'account-page-cell--negative'"
          >
            {{ formatAmount(item.amount) }}
          </span>
        </template>

        <template #item.turnover_balance="{ item }">
          <span class="account-page-cell">
            {{ formatAmount(item.turnover_balance) }}
          </span>
        </template>

        <template #no-data>
          <div class="account-page-empty tw-text-center tw-py-8">
            <v-icon size="48" class="account-page-empty__icon tw-mb-4">mdi-chart-areaspline</v-icon>
            <p class="account-page-empty__title">{{ t('turnoverHistory.noData') }}</p>
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
  { title: t('turnoverHistory.tableHeaders.eventDate'), key: 'event_date', sortable: true },
  { title: t('turnoverHistory.tableHeaders.transactionType'), key: 'transaction_type', sortable: true },
  { title: t('turnoverHistory.tableHeaders.eventName'), key: 'event_name', sortable: false },
  { title: t('turnoverHistory.tableHeaders.market'), key: 'market', sortable: false },
  { title: t('turnoverHistory.tableHeaders.marketType'), key: 'market_type', sortable: false },
  { title: t('turnoverHistory.tableHeaders.amount'), key: 'amount', sortable: true },
  { title: t('turnoverHistory.tableHeaders.turnoverBalance'), key: 'turnover_balance', sortable: true }
])

const formatAmount = (value) => {
  if (value === null || value === undefined || value === '') return '0.00'
  const num = Number(value)
  if (Number.isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const formatTransactionType = (type) => {
  if (!type) return '-'
  switch (type) {
    case 'bet_placement':
      return t('turnoverHistory.transactionTypeOptions.betPlacement')
    case 'bet_settlement':
      return t('turnoverHistory.transactionTypeOptions.betSettlement')
    case 'bet_rollback':
      return t('turnoverHistory.transactionTypeOptions.betRollback')
    case 'bet_void':
      return t('turnoverHistory.transactionTypeOptions.betVoid')
    default:
      return type
  }
}

const getTransactionChipColor = (type) => {
  switch (type) {
    case 'bet_placement':
      return 'blue'
    case 'bet_settlement':
      return 'green'
    case 'bet_rollback':
      return 'orange'
    case 'bet_void':
      return 'red'
    default:
      return 'grey'
  }
}
</script>
