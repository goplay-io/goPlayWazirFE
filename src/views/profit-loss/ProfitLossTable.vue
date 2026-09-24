<template>
  <div class="account-page-table-wrap">
    <div class="account-page-table-scroll">
      <v-data-table
        :headers="tableHeaders"
        :items="profitLossData"
        :loading="loading"
        class="tw-bg-transparent account-page-table account-page-table--wide"
        :items-per-page="50"
        density="compact"
        :sort-by="[{ key: 'created_on', order: 'desc' }]"
      >
        <template #item.row_number="{ index }">
          <span class="account-page-cell">{{ index + 1 }}</span>
        </template>

        <template #item.bet_type="{ item }">
          <span
            class="tw-inline-flex tw-items-center tw-justify-center tw-w-[22px] tw-h-[18px] tw-rounded-[3px] tw-font-bold tw-text-[0.63rem]"
            :class="getBetTypeBadgeClass(item)"
          >
            {{ isBackBet(item) ? 'B' : 'L' }}
          </span>
        </template>

        <template #item.created_on="{ item }">
          <span class="account-page-cell account-page-cell--nowrap">
            {{ formatDate(item.created_on) }}
          </span>
        </template>

        <template #item.event_name="{ item }">
          <div class="tw-max-w-xs">
            <p v-if="getEventTypeLabel(item)" class="account-page-cell--muted">
              {{ getEventTypeLabel(item) }}
            </p>
            <span class="account-page-cell tw-truncate tw-block" :title="item.event_name">
              {{ item.event_name || t('common.dash') }}
            </span>
          </div>
        </template>

        <template #item.market_name="{ item }">
          <div class="tw-max-w-xs">
            <span class="account-page-cell tw-truncate tw-block" :title="getMarketName(item)">
              {{ getMarketName(item) }}
            </span>
            <p v-if="getMarketTypeLabel(item)" class="account-page-cell--muted">
              {{ getMarketTypeLabel(item) }}
            </p>
          </div>
        </template>

        <template #item.runner_name="{ item }">
          <span class="account-page-cell">
            {{ item.runner_name || item.selection_name || item.nation || t('common.dash') }}
          </span>
        </template>

        <template #item.odd="{ item }">
          <span class="account-page-cell">
            {{ formatOdds(item) }}
          </span>
        </template>

        <template #item.stake="{ item }">
          <span class="account-page-cell">
            {{ formatAmount(item.stake || item.amount || 0) }}
          </span>
        </template>

        <template #item.profit_loss="{ item }">
          <span class="account-page-cell" :class="getProfitLossClass(item.profit_loss)">
            {{ formatProfitLoss(item.profit_loss) }}
          </span>
        </template>

        <template #no-data>
          <div class="account-page-empty tw-text-center tw-py-8">
            <v-icon size="48" class="account-page-empty__icon tw-mb-4">mdi-chart-line</v-icon>
            <p class="account-page-empty__title">{{ t('profitLoss.noData') }}</p>
            <p class="account-page-empty__note">{{ t('profitLoss.noDataDescription') }}</p>
          </div>
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDate } from '@/utils/dateUtils.js'

const { t } = useI18n()

defineProps({
  profitLossData: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '0.00'
  return parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatProfitLoss = (amount) => {
  if (amount === null || amount === undefined) return '0.00'
  const formattedAmount = formatAmount(Math.abs(amount))
  return amount >= 0 ? `+${formattedAmount}` : `-${formattedAmount}`
}

const getProfitLossClass = (amount) => {
  if (amount === null || amount === undefined || amount === 0) return ''
  return amount > 0 ? 'account-page-cell--positive' : 'account-page-cell--negative'
}

const isBackBet = (item) => {
  return item?.is_back === true || item?.is_back === 1 || item?.is_back === '1'
}

const getBetTypeBadgeClass = (item) => {
  if (isBackBet(item)) {
    return 'bet-type-badge bet-type-badge--back'
  }
  return 'bet-type-badge bet-type-badge--lay'
}

const formatOdds = (item) => {
  if (!item.odd && !item.rate) return t('common.dash')
  const mainOdd = item.odd || item.rate
  const fancyOdd = item.fancy_odd
  return fancyOdd ? `${mainOdd}/${fancyOdd}` : mainOdd.toString()
}

const getEventTypeLabel = (item) => {
  return item?.event_type_name || item?.event_type || item?.sport_name || ''
}

const getMarketName = (item) => {
  return item?.market_name || item?.market || t('common.dash')
}

const getMarketTypeLabel = (item) => {
  return item?.market_type_name || item?.market_type || item?.type || ''
}

const tableHeaders = computed(() => [
  { title: t('profitLoss.columns.no'), key: 'row_number', sortable: false, width: '60px' },
  { title: 'B/L', key: 'bet_type', sortable: false, width: '56px' },
  { title: t('profitLoss.columns.date'), key: 'created_on', sortable: true },
  { title: t('profitLoss.columns.event'), key: 'event_name', sortable: false },
  { title: t('unsettledBets.columns.marketName'), key: 'market_name', sortable: false },
  { title: 'Runner', key: 'runner_name', sortable: false },
  { title: t('betHistory.odds'), key: 'odd', sortable: false },
  { title: t('betHistory.stake'), key: 'stake', sortable: false },
  { title: t('profitLoss.columns.pnl'), key: 'profit_loss', sortable: true }
])
</script>

<style scoped>
.bet-type-badge {
  border-width: 1px;
  border-style: solid;
}

.bet-type-badge--back {
  color: #111827;
  background-color: var(--color-back-bg-1);
  border-color: color-mix(in srgb, var(--color-back-bg-1) 55%, #111827);
}

.bet-type-badge--lay {
  color: #111827;
  background-color: var(--color-lay-bg-1);
  border-color: color-mix(in srgb, var(--color-lay-bg-1) 55%, #111827);
}
</style>
