<template>
  <div class="account-page wallet-transaction-page">
    <AccountPageHeader :title="t('wallet.withdrawal.title')" />

    <Loading v-if="walletStatusLoading" min-height="360px" />
    <WalletBlockedState
      v-else-if="isWalletBlocked"
      :title="t('wallet.withdrawal.blockedTitle')"
      :message="t('wallet.withdrawal.blockedMessage')"
    />
    <div
      v-else-if="needsWalletPassword"
      class="wallet-transaction-page__content"
    >
      <div class="tw-border tw-border-theme-border tw-rounded-xl tw-shadow-md tw-p-4 sm:tw-p-6 tw-max-w-xl">
        <div class="tw-flex tw-items-center tw-gap-3 tw-mb-4 tw-pb-4 tw-border-b tw-border-theme-border">
          <v-icon size="24" class="tw-text-primary">mdi-wallet-plus</v-icon>
          <div>
            <div class="tw-text-lg tw-font-semibold tw-text-theme-text">
              {{ t('wallet.withdrawal.setWalletPasswordTitle') }}
            </div>
            <div class="tw-text-xs tw-text-theme-text-secondary tw-mt-1">
              {{ t('wallet.withdrawal.setWalletPasswordMessage') }}
            </div>
          </div>
        </div>

        <v-form @submit.prevent="setWalletPassword">
          <v-text-field
            v-model="walletPassword.newPassword"
            :type="showWalletNewPassword ? 'text' : 'password'"
            :label="t('changePassword.walletPassword')"
            :placeholder="t('changePassword.walletPassword')"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-wallet-plus"
            color="primary"
            class="tw-mb-4"
            :append-inner-icon="showWalletNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showWalletNewPassword = !showWalletNewPassword"
            :rules="passwordRules"
            required
          />

          <v-text-field
            v-model="walletPassword.confirmPassword"
            :type="showWalletConfirmPassword ? 'text' : 'password'"
            :label="t('changePassword.confirmPassword')"
            :placeholder="t('changePassword.confirmPassword')"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-wallet-check"
            color="primary"
            class="tw-mb-4"
            :append-inner-icon="showWalletConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showWalletConfirmPassword = !showWalletConfirmPassword"
            :rules="[confirmWalletPasswordRule]"
            required
          />

          <v-btn
            type="submit"
            color="primary"
            variant="elevated"
            size="large"
            block
            :loading="walletPasswordLoading"
            :disabled="walletPasswordLoading"
          >
            <template v-slot:prepend>
              <v-icon size="18">mdi-shield-plus</v-icon>
            </template>
            {{ walletPasswordLoading ? t('changePassword.setting') : t('changePassword.set') }}
          </v-btn>
        </v-form>
      </div>
    </div>
    <template v-else>
    <div class="wallet-transaction-page__content">
      <div class="wallet-transaction-page__overview tw-mb-4 sm:tw-mb-6">
        <div class="tw-grid tw-grid-cols-2 md:tw-grid-cols-[1fr_1fr_2fr] tw-gap-4 sm:tw-gap-6 tw-items-stretch">
          <BalanceCard :balance="balance" :cashable="cashable" title-key="wallet.balance.availableBalance" icon="mdi-wallet" :animation-delay="0.1" />
          <MetricCard :value="pendingAmount" :title="t('wallet.withdrawal.pending')" icon="mdi-clock-outline"
            background-svg="/src/assets/pending.svg" :animation-delay="0.2" :trand-icon="false" color="#360952"
            :amountColor="true" />
          <WithdrawalRequestForm
            class="tw-opacity-0 tw-animate-slideInUp tw-w-full tw-min-h-0 tw-col-span-2 md:tw-col-span-1"
            style="animation-delay: 0.3s"
            @request-created="handleRequestCreated" />
        </div>
      </div>

      <div class="wallet-transaction-page__history">
        <WithdrawalHistoryTable :withdrawals="withdrawals" :loading="loading" @filter-change="handleFilterChange"
          @request-cancelled="handleRequestCancelled" />
      </div>
    </div>
    </template>
  </div>
</template>

<script setup>
import WithdrawalRequestForm from './WithdrawalRequestForm.vue'
import WithdrawalHistoryTable from './WithdrawalHistoryTable.vue'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import BalanceCard from '@/components/BalanceCard.vue'
import MetricCard from '@/components/MetricCard.vue'
import Loading from '@/components/Loading.vue'
import WalletBlockedState from '@/components/WalletBlockedState.vue'
import { useWallet } from '@/composables/useWallet.js'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar.js'
import { useAuthStore } from '@/stores/auth.js'
import { changePassword } from '@/api/user/profile.js'
import * as requests from '@/api/wallet/wallet.js'
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import appConstants from '../../constants/appConstants'

const { balance, cashable, isWalletBlocked, fetchWalletBalance } = useWallet()
const { showError, showSuccess } = useSnackbar()
const authStore = useAuthStore()

const { t } = useI18n()

const loading = ref(true)
const walletStatusLoading = ref(true)
const walletPasswordLoading = ref(false)
const showWalletNewPassword = ref(false)
const showWalletConfirmPassword = ref(false)
const walletPassword = ref({
  newPassword: '',
  confirmPassword: ''
})

const needsWalletPassword = computed(() => !authStore.currentUser?.is_withdrawal)

const passwordRules = [
  v => !!v || t('validation.required'),
  v => (v && v.length >= 8) || t('changePassword.passwordTooShort'),
  v => /(?=.*[a-zA-Z])(?=.*\d)/.test(v || '') || t('changePassword.passwordNeedsLettersNumbers')
]

const confirmWalletPasswordRule = computed(() => {
  return (
    walletPassword.value.newPassword === walletPassword.value.confirmPassword ||
    t('changePassword.passwordMismatch')
  )
})

const setWalletPassword = async () => {
  try {
    walletPasswordLoading.value = true

    if (walletPassword.value.newPassword !== walletPassword.value.confirmPassword) {
      throw new Error(t('changePassword.passwordMismatch'))
    }
    if (walletPassword.value.newPassword.length < 8) {
      throw new Error(t('changePassword.passwordTooShort'))
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(walletPassword.value.newPassword)) {
      throw new Error(t('changePassword.passwordNeedsLettersNumbers'))
    }

    const response = await changePassword({
      type: 'withdrawal_password',
      password: walletPassword.value.newPassword,
      password_confirmation: walletPassword.value.confirmPassword
    })

    if (!response.success) {
      throw new Error(response.message || t('changePassword.passwordError'))
    }

    if (authStore.user) {
      authStore.setUser({
        ...authStore.user,
        is_withdrawal: true
      })
    }

    walletPassword.value = { newPassword: '', confirmPassword: '' }
    showSuccess(t('changePassword.walletPasswordSet'))
  } catch (error) {
    showError(error.message || t('changePassword.passwordError'))
  } finally {
    walletPasswordLoading.value = false
  }
}

const withdrawals = ref([])
const pendingAmount = ref(0)
const currentFilters = ref({
  status: 'pending',
  paymentType: '',
  fromDate: '',
  toDate: ''
})

const handleFilterChange = async (filters) => {
  currentFilters.value = { ...filters }
  await fetchWithdrawals()
}

const handleRequestCancelled = async (requestId) => {
  if (currentFilters.value.status === 'pending') {
    withdrawals.value = withdrawals.value.filter(withdrawal => withdrawal.id !== requestId)
  }

  setTimeout(async () => {
    await fetchWithdrawals()
  }, 500)

  try {
    await fetchWalletBalance()
  } catch (error) {
    console.error('Failed to refresh wallet balance:', error)
  }
}

const handleRequestCreated = async (requestData) => {
  if (currentFilters.value.status === 'pending' && requestData.amount) {
    const newAmount = typeof requestData.amount === 'number'
      ? requestData.amount
      : parseFloat(requestData.amount) || 0

    const tempWithdrawal = {
      id: `temp-${Date.now()}`,
      amount: newAmount,
      status_name: 'P',
      created_on: new Date().toISOString()
    }
    withdrawals.value = [tempWithdrawal, ...withdrawals.value]
  }

  setTimeout(async () => {
    await fetchWithdrawals()
  }, 500)

  try {
    await fetchWalletBalance()
  } catch (error) {
    console.error('Failed to refresh wallet balance:', error)
  }
}

const fetchWithdrawals = async () => {
  try {
    loading.value = true

    const queryParams = {
      type: 'withdrawal'
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

    const response = await requests.getWithdrawHistory(queryParams)
    withdrawals.value = response.data?.data || response.data || []
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    showError('Failed to fetch withdrawal history')
  } finally {
    loading.value = false
  }
}

const calculatePendingAmount = () => {
  if (currentFilters.value.status === 'pending' && withdrawals.value && withdrawals.value.length > 0) {
    const total = withdrawals.value.reduce((sum, withdrawal) => {
      const amount = typeof withdrawal.amount === 'number'
        ? withdrawal.amount
        : parseFloat(withdrawal.amount) || 0
      return sum + amount
    }, 0)
    pendingAmount.value = total
  } else {
    pendingAmount.value = 0
  }
  sessionStorage.setItem('withdrawalPendingAmount', pendingAmount.value.toString())
}

watch(
  [withdrawals, () => currentFilters.value.status],
  () => {
    calculatePendingAmount()
  },
  { deep: true, immediate: true }
)

onMounted(async () => {
  const stored = sessionStorage.getItem('withdrawalPendingAmount')
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
