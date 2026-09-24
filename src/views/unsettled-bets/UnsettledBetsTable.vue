<template>
  <div class="account-page-table-wrap">
    <div class="account-page-table-scroll">
      <v-data-table-server
        :headers="tableHeaders"
        :items="bets"
        :items-length="totalItems"
        :loading="loading"
        :row-props="getRowProps"
        density="compact"
        class="tw-bg-transparent account-page-table account-page-table--wide"
        :items-per-page="itemsPerPage"
        :page="page"
        :items-per-page-options="[{ value: 20, title: '20' }, { value: 50, title: '50' }, { value: 100, title: '100' }]"
        @update:options="$emit('update:options', $event)"
      >
        <template #item.row_number="{ index }">
          <span class="account-page-cell">{{ (page - 1) * itemsPerPage + index + 1 }}</span>
        </template>

        <template #item.bet_type="{ item }">
          <span
            class="tw-inline-flex tw-items-center tw-justify-center tw-w-[22px] tw-h-[18px] tw-rounded-[3px] tw-font-bold tw-text-[0.63rem]"
            :class="getBetTypeBadgeClass(item)"
          >
            {{ isBackBet(item) ? 'B' : 'L' }}
          </span>
        </template>

        <template #item.place_date="{ item }">
          <span class="account-page-cell account-page-cell--nowrap">
            {{ formatDate(item.created_on || item.place_date) }}
          </span>
        </template>

        <template #item.event_name="{ item }">
          <div class="tw-max-w-xs">
            <p v-if="getEventTypeLabel(item)" class="account-page-cell--muted">
              {{ getEventTypeLabel(item) }}
            </p>
            <span class="account-page-cell tw-truncate tw-block" :title="item.event_name || t('common.dash')">
              {{ item.event_name || t('common.dash') }}
            </span>
          </div>
        </template>

        <template #item.nation="{ item }">
          <span class="account-page-cell">
            {{ item.runner_name || item.nation || item.selection_name || t('common.dash') }}
          </span>
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

        <template #item.rate="{ item }">
          <span class="account-page-cell">
            {{ formatOdds(item) }}
          </span>
        </template>

        <template #item.amount="{ item }">
          <span class="account-page-cell">
            {{ formatAmount(item.stake || item.amount) }}
          </span>
        </template>

        <template #no-data>
          <div class="account-page-empty tw-text-center tw-py-8">
            <v-icon size="48" class="account-page-empty__icon tw-mb-4">mdi-clock-outline</v-icon>
            <p class="account-page-empty__title">{{ t('unsettledBets.noBets') }}</p>
            <p class="account-page-empty__note">{{ t('unsettledBets.noDataDescription') }}</p>
          </div>
        </template>
      </v-data-table-server>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDate } from '@/utils/dateUtils.js'
import { useI18n } from 'vue-i18n'

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
  totalItems: {
    type: Number,
    default: 0
  },
  page: {
    type: Number,
    default: 1
  },
  itemsPerPage: {
    type: Number,
    default: 50
  }
})

defineEmits(['update:options'])

const tableHeaders = computed(() => [
  { title: t('unsettledBets.columns.no'), key: 'row_number', sortable: false, width: '60px' },
  { title: 'B/L', key: 'bet_type', sortable: false, width: '56px' },
  { title: t('unsettledBets.columns.placeDate'), key: 'place_date', sortable: false },
  { title: t('unsettledBets.columns.event'), key: 'event_name', sortable: false },
  { title: t('unsettledBets.columns.marketName'), key: 'market_name', sortable: false },
  { title: 'Runner', key: 'nation', sortable: false },
  { title: t('unsettledBets.columns.rate'), key: 'rate', sortable: false },
  { title: t('unsettledBets.columns.amount'), key: 'amount', sortable: false }
])

const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '0.00'
  return parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatOdds = (item) => {
  if (!item.odd && !item.rate) return t('common.dash')
  const mainOdd = item.odd || item.rate
  const fancyOdd = item.fancy_odd
  return fancyOdd ? `${mainOdd}/${fancyOdd}` : mainOdd.toString()
}

const getMarketName = (item) => {
  const marketTypeMap = {
    MO: t('unsettledBets.marketTypes.MO'),
    BM: t('unsettledBets.marketTypes.BM'),
    FC: t('unsettledBets.marketTypes.FC'),
    OP: t('unsettledBets.marketTypes.OP')
  }

  return marketTypeMap[item.type] || item.market_name || item.market_type || item.type || t('common.dash')
}

const getEventTypeLabel = (item) => {
  return item?.event_type_name || item?.event_type || item?.sport_name || ''
}

const getMarketTypeLabel = (item) => {
  return item?.market_type_name || item?.market_type || item?.type || ''
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
    class: isBackBet(row) ? 'unsettled-bet-row--back' : 'unsettled-bet-row--lay'
  }
}
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

:deep(.unsettled-bet-row--back td) {
  background-color: var(--color-back-bg-1) !important;
}

:deep(.unsettled-bet-row--lay td) {
  background-color: var(--color-lay-bg-1) !important;
}

:deep(.unsettled-bet-row--back:hover td) {
  background-color: var(--color-back-bg-2) !important;
}

:deep(.unsettled-bet-row--lay:hover td) {
  background-color: var(--color-lay-bg-2) !important;
}

:deep(.unsettled-bet-row--back td),
:deep(.unsettled-bet-row--lay td) {
  color: #000000 !important;
}

:deep(.unsettled-bet-row--back .account-page-cell),
:deep(.unsettled-bet-row--lay .account-page-cell) {
  color: #000000 !important;
}

:deep(.unsettled-bet-row--back .account-page-cell--muted),
:deep(.unsettled-bet-row--lay .account-page-cell--muted) {
  color: rgba(0, 0, 0, 0.55) !important;
}
</style>
