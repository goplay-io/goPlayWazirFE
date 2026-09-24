<template>
  <div class="account-page-table-wrap">
    <div class="account-page-table-scroll">
      <v-data-table
        :headers="tableHeaders"
        :items="bets"
        :row-props="getRowProps"
        density="compact"
        :loading="loading"
        class="tw-bg-transparent account-page-table account-page-table--wide"
        :items-per-page="50"
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

        <template #item.nation="{ item }">
          <span class="account-page-cell">
            {{ item.runner_name || item.nation || item.selection_name || t('common.dash') }}
          </span>
        </template>

        <template #item.odd="{ item }">
          <span class="account-page-cell">
            {{ formatOdds(item) }}
          </span>
        </template>

        <template #item.stake="{ item }">
          <span class="account-page-cell">
            {{ formatAmount(item.stake) }}
          </span>
        </template>

        <template #item.profit_loss="{ item }">
          <span class="account-page-cell" :class="getProfitLossClass(item.profit_loss)">
            {{ formatProfitLoss(item.profit_loss) }}
          </span>
        </template>

        <template #no-data>
          <div class="account-page-empty tw-text-center tw-py-8">
            <v-icon size="48" class="account-page-empty__icon tw-mb-4">mdi-history</v-icon>
            <p class="account-page-empty__title">{{ t('betHistory.noBetsFound', { status: '' }) }}</p>
            <p class="account-page-empty__note">{{ t('common.betHistoryEmpty') }}</p>
          </div>
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script setup>
import { formatDate } from '@/utils/dateUtils.js'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { t } = useI18n()

defineProps({
  bets: {
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

const formatOdds = (item) => {
  if (!item.odd && !item.rate) return '-'
  const mainOdd = item.odd || item.rate
  const fancyOdd = item.fancy_odd
  return fancyOdd ? `${mainOdd}/${fancyOdd}` : mainOdd.toString()
}

const formatProfitLoss = (amount) => {
  if (amount === null || amount === undefined) return '-'
  const formattedAmount = formatAmount(Math.abs(amount))
  return amount >= 0 ? `+${formattedAmount}` : `-${formattedAmount}`
}

const getProfitLossClass = (amount) => {
  if (amount === null || amount === undefined || amount === 0) return ''
  return amount > 0 ? 'account-page-cell--positive' : 'account-page-cell--negative'
}

const isBackBet = (item) => {
  const raw =
    item?.is_back ??
    item?.isBack ??
    item?.back_lay ??
    item?.backLay ??
    item?.BackLay ??
    item?.back_or_lay ??
    item?.backOrLay

  if (raw === true || raw === 1) return true
  if (raw === false || raw === 0) return false
  if (raw == null || raw === '') return false

  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase()
    if (s === '1' || s === 'true' || s === 'back' || s === 'b') return true
    if (s === '0' || s === 'false' || s === 'lay' || s === 'l') return false
  }

  return false
}

const getBetTypeBadgeClass = (item) => {
  if (isBackBet(item)) {
    return 'bet-type-badge bet-type-badge--back'
  }
  return 'bet-type-badge bet-type-badge--lay'
}

const getRowProps = (data) => {
  const row = data?.internalItem?.raw ?? data?.item?.raw ?? data?.item ?? data
  return {
    class: isBackBet(row) ? 'bet-history-row--back' : 'bet-history-row--lay'
  }
}

const getEventTypeLabel = (item) => {
  return item?.event_type_name || item?.sport_name || ''
}

const getMarketName = (item) => {
  return item?.market_name || item?.market || t('common.dash')
}

const getMarketTypeLabel = (item) => {
  return item?.market_type_name || item?.market_type || item?.type || ''
}

const tableHeaders = computed(() => [
  { title: t('common.number'), key: 'row_number', sortable: false, width: '60px' },
  { title: 'B/L', key: 'bet_type', sortable: false, width: '56px' },
  { title: t('common.date'), key: 'created_on', sortable: true, width: '160px' },
  { title: t('betHistory.event'), key: 'event_name', sortable: true },
  { title: t('unsettledBets.columns.marketName'), key: 'market_name', sortable: false },
  { title: 'Runner', key: 'nation', sortable: false },
  { title: t('betHistory.odds'), key: 'odd', sortable: true },
  { title: t('betHistory.stake'), key: 'stake', sortable: true },
  { title: t('betHistory.profit'), key: 'profit_loss', sortable: true }
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

:deep(.bet-history-row--back td) {
  background-color: var(--color-back-bg-1) !important;
}

:deep(.bet-history-row--lay td) {
  background-color: var(--color-lay-bg-1) !important;
}

:deep(.bet-history-row--back:hover td) {
  background-color: var(--color-back-bg-2) !important;
}

:deep(.bet-history-row--lay:hover td) {
  background-color: var(--color-lay-bg-2) !important;
}

:deep(.bet-history-row--back td),
:deep(.bet-history-row--lay td) {
  color: #000000 !important;
}

:deep(.bet-history-row--back .account-page-cell:not(.account-page-cell--positive):not(.account-page-cell--negative)),
:deep(.bet-history-row--lay .account-page-cell:not(.account-page-cell--positive):not(.account-page-cell--negative)) {
  color: #000000 !important;
}

:deep(.bet-history-row--back .account-page-cell--muted),
:deep(.bet-history-row--lay .account-page-cell--muted) {
  color: rgba(0, 0, 0, 0.55) !important;
}
</style>
