<template>
  <div class="account-page wallet-page">
    <AccountPageHeader :title="t('wallet.title')">
      <template #actions>
        <WalletButtons />
      </template>
    </AccountPageHeader>

    <div class="wallet-page__content">
      <div class="wallet-page__overview">
        <div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-items-stretch">
          <BalanceCard
            :balance="balance"
            :cashable="cashable"
            title-key="wallet.balance.availableBalance"
            icon="mdi-wallet"
            :animation-delay="0.1"
          />
          <MetricCard
            :value="exposureAmount"
            :title="t('wallet.balance.exposure')"
            icon="mdi-chart-line"
            background-svg="/src/assets/pending.svg"
            :animation-delay="0.2"
            :trand-icon="false"
            color="#49915e"
            :amount-color="true"
          />
          <MetricCard
            :value="bonusAmount"
            :title="t('wallet.bonus.title')"
            icon="mdi-star-circle-outline"
            background-svg="/src/assets/pending.svg"
            :animation-delay="0.3"
            :trand-icon="false"
            color="#4cae50"
            :amount-color="true"
          />
        </div>
      </div>

      <WalletRecentTransactions
        :recent-transactions="latestTransactions"
        :loading="loading"
      />
    </div>
  </div>
</template>

<script setup>
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import BalanceCard from '@/components/BalanceCard.vue'
import MetricCard from '@/components/MetricCard.vue'
import WalletButtons from './WalletButtons.vue'
import WalletRecentTransactions from './WalletRecentTransactions.vue'
import { useWallet } from '../../composables/useWallet.js'
import { getWalletData } from '../../api/wallet/wallet.js'
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { balance, cashable, bonus, exposure, fetchWalletBalance } = useWallet()
const { t } = useI18n()

const loading = ref(true)
const recentTransactions = ref([])

const bonusAmount = computed(() => Number(bonus.value || 0))
const exposureAmount = computed(() => Number(exposure.value || 0))
const latestTransactions = computed(() => (recentTransactions.value || []).slice(0, 5))

const fetchWalletInfo = async () => {
  try {
    loading.value = true
    await fetchWalletBalance()
    const response = await getWalletData()
    const walletInfo = response.data || response
    recentTransactions.value = walletInfo?.transactions || []
  } catch (err) {
    console.error('Error fetching wallet info:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchWalletInfo()
})
</script>

<style scoped>
.wallet-page__content {
  padding: 16px 12px 28px;
}

.wallet-page__overview {
  margin-bottom: 16px;
}

.wallet-page :deep(.balance-card-theme) {
  background: #49915e !important;
  border: 1px solid #4cae50 !important;
  border-radius: 8px;
}

.wallet-page :deep(.metric-card-light) {
  background: #333333 !important;
  border: 1px solid #545454 !important;
  border-radius: 8px;
}

.wallet-page :deep(.metric-card-light__label) {
  color: rgba(255, 255, 255, 0.75) !important;
}

.wallet-page :deep(.metric-card-light__value) {
  color: #ffffff !important;
}
</style>
