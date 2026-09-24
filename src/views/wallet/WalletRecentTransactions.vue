<template>
  <div class="wallet-recent-section">
    <div class="wallet-recent-section__head">
      <h2 class="wallet-recent-section__title">{{ t('wallet.recent.title') }}</h2>
      <p class="wallet-recent-section__subtitle">{{ t('wallet.recent.subtitle') }}</p>
    </div>

    <div class="account-page-table-wrap wallet-recent-section__table">
      <div class="account-page-table-scroll">
        <v-data-table
          :headers="tableHeaders"
          :items="recentTransactions"
          :loading="loading"
          density="compact"
          class="tw-bg-transparent account-page-table"
          :items-per-page="-1"
          hide-default-footer
        >
          <template #item.transaction_id="{ item }">
            <span class="account-page-cell">{{ getTransactionId(item) }}</span>
          </template>

          <template #item.created_at="{ item }">
            <span class="account-page-cell account-page-cell--nowrap">
              {{ formatDateTime(item.created_at) }}
            </span>
          </template>

          <template #item.description="{ item }">
            <span class="account-page-cell account-page-cell--remark">
              {{ getDescription(item) }}
            </span>
          </template>

          <template #item.status="{ item }">
            <span
              class="account-page-cell wallet-recent-status"
              :class="`wallet-recent-status--${getStatusInfo(item).tone}`"
            >
              {{ getStatusInfo(item).label }}
            </span>
          </template>

          <template #item.amount="{ item }">
            <span
              class="account-page-cell"
              :class="item.transaction_type === 'credit' ? 'account-page-cell--credit' : 'account-page-cell--negative'"
            >
              {{ formatAmount(item.amount, item.transaction_type) }}
            </span>
          </template>

          <template #no-data>
            <div class="account-page-empty tw-text-center tw-py-8">
              <p class="account-page-empty__title">{{ t('account.statement.noTransactions') }}</p>
            </div>
          </template>
        </v-data-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  recentTransactions: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const tableHeaders = computed(() => [
  { title: 'Transaction ID', key: 'transaction_id', sortable: false, align: 'center' },
  { title: 'Date & Time', key: 'created_at', sortable: false, align: 'center' },
  { title: 'Description', key: 'description', sortable: false, align: 'center' },
  { title: 'Status', key: 'status', sortable: false, align: 'center' },
  { title: 'Amount', key: 'amount', sortable: false, align: 'center' },
])

const formatAmount = (amount, transactionType) => {
  const numAmount = parseFloat(amount)
  if (Number.isNaN(numAmount)) return '-'
  const formatted = Number.isInteger(numAmount) ? String(numAmount) : numAmount.toFixed(2)
  return transactionType === 'credit' ? `+${formatted}` : `-${formatted}`
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`
}

const getStatusLabel = (transaction) => {
  const status = (transaction.status || '').toLowerCase()
  if (status) return status
  if (transaction.transaction_type === 'credit') return 'completed'
  if (transaction.transaction_type === 'debit') return 'pending'
  return 'pending'
}

const getStatusInfo = (transaction) => {
  const status = getStatusLabel(transaction).toLowerCase()
  const statusMap = {
    approved: { label: 'APPROVED', tone: 'success' },
    completed: { label: 'COMPLETED', tone: 'success' },
    rejected: { label: 'REJECTED', tone: 'danger' },
    failed: { label: 'FAILED', tone: 'danger' },
    pending: { label: 'PENDING', tone: 'warning' },
    cancelled: { label: 'CANCELLED', tone: 'warning' },
    a: { label: 'APPROVED', tone: 'success' },
    r: { label: 'REJECTED', tone: 'danger' },
    p: { label: 'PENDING', tone: 'warning' },
  }
  return statusMap[status] || statusMap.pending
}

const getDescription = (transaction) => transaction.description || '-'

const getTransactionId = (transaction) =>
  transaction.transaction_id || transaction.id || '-'
</script>

<style scoped>
.wallet-recent-section__head {
  margin-bottom: 10px;
}

.wallet-recent-section__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
  color: #111111;
}

.wallet-recent-section__subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 18px;
  color: #6b7280;
}

.wallet-recent-section__table {
  padding-top: 0;
}

.wallet-recent-status {
  font-weight: 700;
  text-transform: uppercase;
}

.wallet-recent-status--success {
  color: #22c55e !important;
}

.wallet-recent-status--danger {
  color: #ef4444 !important;
}

.wallet-recent-status--warning {
  color: #f97316 !important;
}
</style>
