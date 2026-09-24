<template>
  <div class="account-page wallet-transaction-page">
    <AccountPageHeader :title="t('wallet.deposit.title')" />

    <Loading v-if="walletStatusLoading" min-height="360px" />
    <WalletBlockedState
      v-else-if="isWalletBlocked"
      :title="t('wallet.deposit.blockedTitle')"
      :message="t('wallet.deposit.blockedMessage')"
    />
    <template v-else>
    <div class="wallet-transaction-page__content">
      <div class="wallet-transaction-page__overview tw-mb-4 sm:tw-mb-6">
        <div class="tw-grid tw-grid-cols-2 md:tw-grid-cols-[1fr_1fr_2fr] tw-gap-4 sm:tw-gap-6 tw-items-stretch">
          <BalanceCard :balance="balance" :cashable="cashable" title-key="wallet.balance.availableBalance" icon="mdi-wallet" :animation-delay="0.1" />
          <MetricCard :value="pendingAmount" :title="t('wallet.deposit.pending')" icon="mdi-clock-outline"
            background-svg="/src/assets/pending.svg" :animation-delay="0.2" :trand-icon="false" color="#360952"
            :amountColor="true" />
          <DepositRequestForm
            class="tw-opacity-0 tw-animate-slideInUp tw-w-full tw-min-h-0 tw-col-span-2 md:tw-col-span-1"
            style="animation-delay: 0.3s"
            @request-created="handleRequestCreated" />
        </div>
      </div>

      <div class="wallet-transaction-page__history">
        <DepositHistoryTable :deposits="deposits" :loading="loading" @filter-change="handleFilterChange" />
      </div>
    </div>
    </template>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import DepositRequestForm from './DepositRequestForm.vue'
import DepositHistoryTable from './DepositHistoryTable.vue'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import BalanceCard from '@/components/BalanceCard.vue'
import MetricCard from '@/components/MetricCard.vue'
import Loading from '@/components/Loading.vue'
import WalletBlockedState from '@/components/WalletBlockedState.vue'
import { useWallet } from '@/composables/useWallet.js'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import * as requests from '@/api/wallet/wallet.js'
import { ref, onMounted, watch } from 'vue'
import appConstants from '../../constants/appConstants.js'

const { t } = useI18n()

const { balance, cashable, isWalletBlocked, fetchWalletBalance } = useWallet()
const { showError } = useSnackbar()

const loading = ref(true)
const walletStatusLoading = ref(true)

const deposits = ref([])
const pendingAmount = ref(0)
const currentFilters = ref({
  status: 'pending',
  paymentType: '',
  fromDate: '',
  toDate: ''
})

const calculatePendingAmount = () => {
  if (currentFilters.value.status === 'pending' && deposits.value && deposits.value.length > 0) {
    const total = deposits.value.reduce((sum, deposit) => {
      const amount = typeof deposit.amount === 'number'
        ? deposit.amount
        : parseFloat(deposit.amount) || 0
      return sum + amount
    }, 0)
    pendingAmount.value = total
  } else {
    pendingAmount.value = 0
  }
  sessionStorage.setItem('depositPendingAmount', pendingAmount.value.toString())
}

watch(
  [deposits, () => currentFilters.value.status],
  () => {
    calculatePendingAmount()
  },
  { deep: true, immediate: true }
)

const handleFilterChange = async (filters) => {
  currentFilters.value = { ...filters }
  await fetchDeposits()
}

const handleRequestCreated = async (requestData) => {
  if (currentFilters.value.status === 'pending' && requestData.amount) {
    const newAmount = typeof requestData.amount === 'number'
      ? requestData.amount
      : parseFloat(requestData.amount) || 0

    const tempDeposit = {
      id: `temp-${Date.now()}`,
      amount: newAmount,
      status_name: 'P',
      created_on: new Date().toISOString()
    }
    deposits.value = [tempDeposit, ...deposits.value]
  }

  setTimeout(async () => {
    await fetchDeposits()
  }, 500)
}

const fetchDeposits = async () => {
  try {
    loading.value = true

    const queryParams = {
      type: 'deposit'
    }

    if (currentFilters.value.status === 'pending') {
      queryParams.status_id = appConstants.PENDING_REQUEST_STATUS_ID
    } else if (currentFilters.value.status === 'approved') {
      queryParams.status_id = appConstants.APPROVED_REQUEST_STATUS_ID
    } else if (currentFilters.value.status === 'rejected') {
      queryParams.status_id = appConstants.REJECTED_REQUEST_STATUS_ID
    }

    if (currentFilters.value.status !== 'pending') {
      if (currentFilters.value.fromDate) {
        queryParams.from_date = currentFilters.value.fromDate
      }
      if (currentFilters.value.toDate) {
        queryParams.to_date = currentFilters.value.toDate
      }
    }

    if (currentFilters.value.paymentType) {
      queryParams.payment_type = currentFilters.value.paymentType
    }

    const response = await requests.getDepositHistory(queryParams)
    deposits.value = response.data?.data || response.data || []
  } catch (error) {
    console.error('Error fetching deposits:', error)
    showError('Failed to fetch deposit history')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const stored = sessionStorage.getItem('depositPendingAmount')
  if (stored) {
    pendingAmount.value = parseFloat(stored) || 0
  }
  try {
    await fetchWalletBalance()
  } catch (error) {
    console.error('Failed to refresh wallet status:', error)
  } finally {
    walletStatusLoading.value = false
  }
})
</script>

<style scoped>
.wallet-transaction-page__content {
  padding: 16px 12px 16px;
  margin-top: 12px;
}

.wallet-transaction-page__overview,
.wallet-transaction-page__history {
  background: transparent;
  border: none;
  padding: 0;
}

.wallet-transaction-page__history {
  margin-top: 8px;
}

.wallet-transaction-page :deep(.balance-card-theme) {
  background: linear-gradient(135deg, #921ada 0%, #8a19ce 50%, #471368 100%) !important;
  border: 1px solid var(--color-header-bg, #360952) !important;
  border-radius: 8px;
}

.wallet-transaction-page :deep(.metric-card-light) {
  background: #360952 !important;
  border: 1px solid #8a19ce !important;
  border-radius: 8px;
}

.wallet-transaction-page :deep(.metric-card-light__label) {
  color: rgba(255, 255, 255, 0.75) !important;
}

.wallet-transaction-page :deep(.metric-card-light__value) {
  color: #ffffff !important;
}

.wallet-transaction-page :deep(.deposit-request-box) {
  background: #ffffff !important;
  border: 1px solid var(--color-header-bg, #360952) !important;
}
</style>
