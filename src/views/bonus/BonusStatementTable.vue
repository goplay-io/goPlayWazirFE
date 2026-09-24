<template>
  <div class="account-page-table-wrap">
    <div class="account-page-table-scroll">
      <v-data-table
        :headers="tableHeaders"
        :items="items"
        :loading="loading"
        density="compact"
        class="tw-bg-transparent account-page-table account-page-table--wide"
        :items-per-page="50"
        :sort-by="[{ key: 'award_date', order: 'desc' }]"
      >
        <template #item.bonus_category_name="{ item }">
          <span
            class="account-page-cell tw-max-w-xs tw-truncate tw-block"
            :title="item.bonus_category_name || '-'"
          >
            {{ item.bonus_category_name || '-' }}
          </span>
        </template>

        <template #item.bonus_name="{ item }">
          <span
            class="account-page-cell tw-max-w-xs tw-truncate tw-block"
            :title="item.bonus_name || '-'"
          >
            {{ item.bonus_name || '-' }}
          </span>
        </template>

        <template #item.bonus_status="{ item }">
          <v-chip
            :color="getStatusColor(item.bonus_status)"
            :text="getStatusText(item.bonus_status)"
            size="x-small"
            variant="tonal"
          />
        </template>

        <template #item.award_amount="{ item }">
          <span class="account-page-cell account-page-cell--positive">
            {{ formatAmount(item.award_amount) }}
          </span>
        </template>

        <template #item.award_date="{ item }">
          <span class="account-page-cell account-page-cell--nowrap">
            {{ formatDate(item.award_date) }}
          </span>
        </template>

        <template #item.turnover_required="{ item }">
          <span class="account-page-cell">
            {{ formatAmount(item.turnover_required) }}
          </span>
        </template>

        <template #item.turnover_met="{ item }">
          <span class="account-page-cell account-page-cell--positive">
            {{ formatAmount(item.turnover_met) }}
          </span>
        </template>

        <template #item.turnover_left="{ item }">
          <span class="account-page-cell" style="color: #f59e0b !important; font-weight: 700;">
            {{ formatAmount(getTurnoverLeft(item)) }}
          </span>
        </template>

        <template #item.redeemed_amount="{ item }">
          <span class="account-page-cell">
            {{ formatAmount(item.redeemed_amount) }}
          </span>
        </template>

        <template #item.redeem_date="{ item }">
          <span class="account-page-cell account-page-cell--nowrap">
            {{ formatDate(item.redeem_date) }}
          </span>
        </template>

        <template #item.expiry_date="{ item }">
          <span class="account-page-cell account-page-cell--nowrap" style="font-weight: 700;">
            {{ formatExpiryDate(item.expiry_date) }}
          </span>
        </template>

        <template #no-data>
          <div class="account-page-empty tw-text-center tw-py-8">
            <v-icon size="48" class="account-page-empty__icon tw-mb-4">mdi-gift-outline</v-icon>
            <p class="account-page-empty__title">{{ t('bonus.statement.noBonuses') }}</p>
            <p class="account-page-empty__note">{{ t('bonus.statement.managementNote') }}</p>
          </div>
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDate, formatDateOnly } from '@/utils/dateUtils.js'

const { t } = useI18n()

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const tableHeaders = computed(() => [
  { title: t('bonus.statement.bonusCategory'), key: 'bonus_category_name', sortable: false },
  { title: t('bonus.statement.bonusName'), key: 'bonus_name', sortable: false },
  { title: t('bonus.statement.status'), key: 'bonus_status', sortable: false },
  { title: t('bonus.statement.expiryDate'), key: 'expiry_date', sortable: false },
  { title: t('bonus.statement.awardAmount'), key: 'award_amount', sortable: false },
  { title: t('bonus.statement.awardDate'), key: 'award_date', sortable: false },
  { title: t('bonus.statement.turnoverRequired'), key: 'turnover_required', sortable: false },
  { title: t('bonus.statement.turnoverLeft'), key: 'turnover_left', sortable: false },
  { title: t('bonus.statement.turnoverMet'), key: 'turnover_met', sortable: false },
  { title: t('bonus.statement.redeemedAmount'), key: 'redeemed_amount', sortable: false },
  { title: t('bonus.statement.redeemDate'), key: 'redeem_date', sortable: false },
])

const formatAmount = (val) => {
  if (val === null || val === undefined) return '0.00'
  return parseFloat(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const getTurnoverLeft = (item) => {
  const required = parseFloat(item?.turnover_required ?? 0) || 0
  const met = parseFloat(item?.turnover_met ?? 0) || 0
  return Math.max(0, required - met)
}

const formatExpiryDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  const dateOnly = formatDateOnly(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(date)
  expiry.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return `${dateOnly} (${t('bonus.statement.expired')})`
  if (diffDays === 0) return `${dateOnly} (${t('bonus.statement.today')})`
  return `${dateOnly} (${t('bonus.statement.daysLeft', { count: diffDays })})`
}

const STATUS_TO_KEY = {
  pending: 'statusPending',
  pending_approval: 'statusPending',
  inactive: 'statusInactive',
  redeemed: 'statusRedeemed',
  expired: 'statusExpired',
  redeem_failed: 'statusRedeemFailed',
}

const getStatusColor = (status) => {
  const map = {
    pending: 'orange',
    pending_approval: 'orange',
    inactive: 'grey',
    redeemed: 'blue',
    expired: 'error',
    redeem_failed: 'error',
  }
  return map[status] || 'grey'
}

const getStatusText = (status) => {
  const key = status ? STATUS_TO_KEY[status] : null
  return key ? t(`bonus.statement.${key}`) : (status || '-')
}
</script>
