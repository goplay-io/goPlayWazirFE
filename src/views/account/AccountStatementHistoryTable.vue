<template>
  <div class="account-page-table-wrap">
    <div class="account-page-table-scroll">
      <v-data-table
        :headers="tableHeaders"
        :items="transactions"
        :loading="loading"
        density="compact"
        class="tw-bg-transparent account-page-table"
        :items-per-page="50"
        :sort-by="[{ key: 'created_on', order: 'desc' }]"
      >
        <template #item.row_number="{ index }">
          <span class="account-page-cell">{{ index + 1 }}</span>
        </template>

        <template #item.created_on="{ item }">
          <span class="account-page-cell account-page-cell--nowrap" :title="formatDate(item.created_on)">
            {{ formatDate(item.created_on) }}
          </span>
        </template>

        <template #item.credit="{ item }">
          <span class="account-page-cell account-page-cell--credit">
            {{ formatCredit(item) }}
          </span>
        </template>

        <template #item.debit="{ item }">
          <span
            class="account-page-cell"
            :class="{ 'account-page-cell--negative': isDebitValue(item) }"
          >
            {{ formatDebit(item) }}
          </span>
        </template>

        <template #item.current_balance="{ item }">
          <span class="account-page-cell account-page-cell--credit">
            {{ formatAmount(item.current_balance) }}
          </span>
        </template>

        <template #item.sports="{ item }">
          <span class="account-page-cell account-page-cell--nowrap">
            {{ getSportsLabel(item) }}
          </span>
        </template>

        <template #item.description="{ item }">
          <a
            v-if="canOpenBetDetails(item)"
            href="#"
            class="account-page-cell account-page-cell--remark account-page-cell--link"
            @click.prevent="openModal(item)"
          >
            {{ getDescriptionText(item) }}
          </a>
          <span v-else class="account-page-cell account-page-cell--remark">
            {{ getDescriptionText(item) }}
          </span>
        </template>

        <template #no-data>
          <div class="account-page-empty tw-text-center tw-py-8">
            <v-icon size="48" class="account-page-empty__icon tw-mb-4">mdi-file-document-outline</v-icon>
            <p class="account-page-empty__title">{{ t('account.statement.noTransactions') }}</p>
            <p class="account-page-empty__note">{{ t('account.statement.managementNote') }}</p>
          </div>
        </template>
      </v-data-table>
    </div>

    <TransactionDetailsModal v-model="showModal" :transaction="selectedTransaction" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDate } from '@/utils/dateUtils.js'
import TransactionDetailsModal from './TransactionDetailsModal.vue'

const { t } = useI18n()

const props = defineProps({
  transactions: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  eventTypes: {
    type: Array,
    default: () => []
  }
})

const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '0.00'
  return parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatCredit = (item) => {
  const value = parseFloat(item.amount)
  if (isNaN(value) || value < 0) return '-'
  return formatAmount(value)
}

const isDebitValue = (item) => {
  const value = parseFloat(item.amount)
  return !isNaN(value) && value < 0
}

const formatDebit = (item) => {
  const value = parseFloat(item.amount)
  if (isNaN(value) || value >= 0) return '-'
  return `-${formatAmount(Math.abs(value))}`
}

const getDescriptionText = (item) => {
  if (item.description && item.description.trim() !== '') {
    return item.description
  }

  if (item.event_name) {
    const eventName = item.bet_event_name || 'Unknown Event'
    const betType = item.bet_type || 'Unknown Type'
    const nation = item.nation ? ` [${item.nation}]` : ''
    return `${eventName} - ${betType}${nation}`
  }

  if (item.transaction_type === 'credit') {
    return 'B-Deposit from Up-line'
  }
  if (item.transaction_type === 'debit') {
    return 'B-Withdraw To Up-line'
  }

  return '-'
}

const getSportsLabel = (item) => {
  if (item.event_type_name) return item.event_type_name
  if (item.sport_name) return item.sport_name
  if (item.sports) return item.sports

  const typeId = item.event_type_id
  if (typeId == null) return ''

  const match = props.eventTypes.find((type) => type.id === typeId)
  return match?.name || match?.event_type_name || ''
}

const tableHeaders = computed(() => [
  { title: t('account.statement.tableHeaders.srNo'), key: 'row_number', sortable: false, width: '56px' },
  { title: t('common.date'), key: 'created_on', sortable: true, width: '140px' },
  { title: t('account.statement.credit'), key: 'credit', sortable: false, width: '90px' },
  { title: t('account.statement.debit'), key: 'debit', sortable: false, width: '90px' },
  { title: t('account.statement.balance'), key: 'current_balance', sortable: true, width: '90px' },
  { title: t('account.statement.sports'), key: 'sports', sortable: false, width: '100px' },
  { title: t('account.statement.remark'), key: 'description', sortable: false, minWidth: '220px' }
])

function canOpenBetDetails(item) {
  if (!item) return false
  if (item.market_id || item.order_id) return true
  return isCasinoStatementRow(item)
}

function isCasinoStatementRow(item) {
  if (!item || item.market_id || item.order_id) return false
  return Boolean(item.game_id) || item.event_type_name === 'Casino'
}

const showModal = ref(false)
const selectedTransaction = ref(null)

function openModal(item) {
  selectedTransaction.value = item
  showModal.value = true
}
</script>
