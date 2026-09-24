<template>
  <div class="deposit-history-root">
    <AccountPageHeader :title="t('wallet.deposit.history')" />

    <section class="account-page-filters deposit-history-filters">
      <div class="account-page-filters__row">
      <div class="account-page-filter-field">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          item-title="title"
          item-value="value"
          variant="plain"
          density="compact"
          hide-details
          class="account-page-games-select"
          :menu-props="{ contentClass: 'deposit-history-dropdown-menu' }"
          @update:model-value="handleStatusChange"
        />
      </div>

      <div class="account-page-filter-field">
        <v-select
          v-model="paymentTypeFilter"
          :items="paymentTypeOptions"
          item-title="title"
          item-value="value"
          variant="plain"
          density="compact"
          hide-details
          class="account-page-games-select"
          :menu-props="{ contentClass: 'deposit-history-dropdown-menu' }"
          @update:model-value="handlePaymentTypeChange"
        />
      </div>

      <div v-if="!isDateDisabled" class="account-page-filters__dates">
      <div class="account-page-filter-field">
        <v-menu v-model="fromDateMenu" :close-on-content-click="false" min-width="auto">
          <template #activator="{ props: menuProps }">
            <button type="button" class="account-page-filter-field__control" v-bind="menuProps">
              <span>{{ displayFromDate || t('common.fromDate') }}</span>
              <v-icon size="16">mdi-calendar</v-icon>
            </button>
          </template>
          <v-date-picker v-model="fromDate" color="primary" @update:model-value="handleFromDateSelect" />
        </v-menu>
      </div>

      <div class="account-page-filter-field">
        <v-menu v-model="toDateMenu" :close-on-content-click="false" min-width="auto">
          <template #activator="{ props: menuProps }">
            <button type="button" class="account-page-filter-field__control" v-bind="menuProps">
              <span>{{ displayToDate || t('common.toDate') }}</span>
              <v-icon size="16">mdi-calendar</v-icon>
            </button>
          </template>
          <v-date-picker v-model="toDate" color="primary" @update:model-value="handleToDateSelect" />
        </v-menu>
      </div>
      </div>

      <button
        type="button"
        class="account-page-apply-btn"
        :disabled="!!dateValidationError && !isDateDisabled"
        @click="fetchData"
      >
        <v-progress-circular v-if="loading" indeterminate size="16" width="2" color="#ffffff" />
        <span v-else>{{ t('common.submit') }}</span>
      </button>
      </div>
    </section>

    <div v-if="dateValidationError && !isDateDisabled" class="deposit-history-error">
      <v-alert type="error" variant="tonal" density="compact">
        {{ dateValidationError }}
      </v-alert>
    </div>

    <div class="account-page-table-wrap deposit-history-table-wrap">
      <div class="account-page-table-scroll">
      <v-data-table
        :headers="tableHeaders"
        :items="deposits"
        :loading="loading"
        density="comfortable"
        class="account-page-table account-page-table--wide"
        :items-per-page="10"
        :sort-by="[{ key: 'created_on', order: 'desc' }]"
      >
        <template #item.created_on="{ item }">
          <span class="account-page-cell">{{ formatDate(item.created_on) }}</span>
        </template>

        <template #item.payment_type="{ item }">
          <div class="tw-flex tw-items-center tw-justify-center tw-gap-2">
            <component v-if="getPaymentTypeIcon(item)" :is="getPaymentTypeIcon(item)" :size="20" class="tw-shrink-0" />
            <v-icon v-else size="20" class="tw-shrink-0">mdi-help-circle-outline</v-icon>
            <span class="account-page-cell">{{ getPaymentTypeLabel(item) }}</span>
          </div>
        </template>

        <template #item.status_name="{ item }">
          <v-chip
            :color="getStatusInfo(item.status_name).color"
            :text="t(getStatusInfo(item.status_name).text)"
            size="x-small"
            variant="tonal"
          />
        </template>

        <template #item.amount="{ item }">
          <span class="account-page-cell tw-font-semibold">
            {{ item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
          </span>
        </template>

        <template #item.txn_id="{ item }">
          <span class="account-page-cell tw-font-mono">{{ item.txn_id || '—' }}</span>
        </template>

        <template #no-data>
          <div class="account-page-empty tw-text-center tw-py-8">
            <v-icon size="48" class="account-page-empty__icon tw-mb-4">mdi-cash-plus</v-icon>
            <p class="account-page-empty__title">{{ t('wallet.deposit.noRequests') }}</p>
            <p class="account-page-empty__note">{{ t('wallet.deposit.historyWillAppear') }}</p>
          </div>
        </template>
      </v-data-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import BankDepositIcon from '@/components/Icons/BankDepositIcon.vue'
import UpiIcon from '@/components/Icons/UpiIcon.vue'
import UsdtIcon from '@/components/Icons/UsdtIcon.vue'
import { toYMDLocal } from '@/utils/dateUtils.js'
import { useCrypto } from '@/composables/useCrypto.js'

const { t } = useI18n()
const { getIconByName } = useCrypto()

defineProps({
  deposits: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['filter-change'])

const statusFilter = ref('pending')
const paymentTypeFilter = ref('')
const fromDate = ref('')
const toDate = ref('')
const dateValidationError = ref('')
const fromDateMenu = ref(false)
const toDateMenu = ref(false)

const isDateDisabled = computed(() => statusFilter.value === 'pending')

function formatFilterDateDisplay(ymd) {
  if (!ymd) return ''
  const parts = String(ymd).split('-')
  if (parts.length !== 3) return ymd
  const [y, m, d] = parts
  return `${d}/${m}/${y}`
}

const displayFromDate = computed(() => formatFilterDateDisplay(fromDate.value))
const displayToDate = computed(() => formatFilterDateDisplay(toDate.value))

const validateDates = () => {
  if (statusFilter.value === 'pending') {
    dateValidationError.value = ''
    return true
  }

  if (!fromDate.value || !toDate.value) {
    dateValidationError.value = t('wallet.deposit.dateRequired')
    return false
  }

  if (new Date(fromDate.value) > new Date(toDate.value)) {
    dateValidationError.value = t('wallet.deposit.dateInvalidRange')
    return false
  }

  dateValidationError.value = ''
  return true
}

const handleStatusChange = () => {
  if (statusFilter.value === 'pending') {
    fromDate.value = ''
    toDate.value = ''
    dateValidationError.value = ''
    emitFilterChange()
  } else {
    validateDates()
  }
}

const handlePaymentTypeChange = () => {
  emitFilterChange()
}

const handleDateChange = () => {
  validateDates()
}

const handleFromDateSelect = (value) => {
  fromDateMenu.value = false
  fromDate.value = toYMDLocal(value)
  handleDateChange()
}

const handleToDateSelect = (value) => {
  toDateMenu.value = false
  toDate.value = toYMDLocal(value)
  handleDateChange()
}

const fetchData = () => {
  if (validateDates()) {
    emitFilterChange()
  }
}

const emitFilterChange = () => {
  const filters = {
    status: statusFilter.value,
    paymentType: paymentTypeFilter.value || '',
    fromDate: statusFilter.value === 'pending' ? '' : fromDate.value,
    toDate: statusFilter.value === 'pending' ? '' : toDate.value,
  }

  if (validateDates()) {
    emit('filter-change', filters)
  }
}

onMounted(() => {
  emitFilterChange()
})

const formatDate = (value) => {
  if (!value) return t('common.dash')
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const getStatusInfo = (status) => {
  const statusMap = {
    A: { text: 'wallet.deposit.statusOptions.approved', color: 'green' },
    R: { text: 'wallet.deposit.statusOptions.rejected', color: 'red' },
    P: { text: 'wallet.deposit.statusOptions.cancelled', color: '#8a19ce' },
  }

  return statusMap[status] || { text: 'wallet.deposit.statusOptions.pending', color: '#8a19ce' }
}

const getPaymentTypeInfo = (type) => {
  const map = {
    bank: { icon: BankDepositIcon, label: t('wallet.deposit.paymentOptions.bank') },
    upi: { icon: UpiIcon, label: t('wallet.deposit.paymentOptions.upi') },
    crypto: { icon: UsdtIcon, label: t('wallet.deposit.paymentOptions.crypto') },
  }
  return map[type] || { icon: null, label: type || '—' }
}

const getPaymentTypeIcon = (item) => {
  if (item.payment_type === 'crypto' && item.crypto_currency_name) {
    return getIconByName(item.crypto_currency_name) || UsdtIcon
  }
  return getPaymentTypeInfo(item.payment_type).icon
}

const getPaymentTypeLabel = (item) => {
  const info = getPaymentTypeInfo(item.payment_type)
  if (item.payment_type === 'crypto' && item.crypto_currency_name) {
    return `${info.label} (${item.crypto_currency_name})`
  }
  return info.label
}

const statusOptions = computed(() => [
  { title: t('wallet.deposit.statusOptions.pending'), value: 'pending' },
  { title: t('wallet.deposit.statusOptions.approved'), value: 'approved' },
  { title: t('wallet.deposit.statusOptions.rejected'), value: 'rejected' },
])

const paymentTypeOptions = computed(() => [
  { title: t('wallet.deposit.paymentOptions.all'), value: '' },
  { title: t('wallet.deposit.paymentOptions.bank'), value: 'bank' },
  { title: t('wallet.deposit.paymentOptions.upi'), value: 'upi' },
  { title: t('wallet.deposit.paymentOptions.crypto'), value: 'crypto' },
])

const tableHeaders = computed(() => [
  { title: t('common.date'), key: 'created_on', sortable: true, width: '180px' },
  { title: t('wallet.deposit.payment'), key: 'payment_type', sortable: true },
  { title: t('wallet.deposit.amount'), key: 'amount', sortable: true },
  { title: t('wallet.deposit.transactionId'), key: 'txn_id', sortable: false },
  { title: t('wallet.deposit.status'), key: 'status_name', sortable: true },
])
</script>

<style scoped>
.deposit-history-root {
  display: flex;
  flex-direction: column;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
  color: #111111;
  padding: 0 !important;
}

.deposit-history-filters {
  margin-bottom: 0;
}

.deposit-history-error {
  padding: 8px 12px 0;
}

.deposit-history-table-wrap {
  border: none !important;
  background: transparent !important;
}

:deep(.v-data-table .v-data-table__td:first-child),
:deep(.v-data-table .v-data-table__th:first-child),
:deep(.v-data-table .v-table th:first-of-type),
:deep(.v-data-table .v-table td:first-of-type) {
  min-width: 180px;
}
</style>

<style>
.deposit-history-dropdown-menu .v-list {
  background: #ffffff !important;
}

.deposit-history-dropdown-menu .v-list-item,
.deposit-history-dropdown-menu .v-list-item-title,
.deposit-history-dropdown-menu .v-list-item__content {
  color: #111111 !important;
  opacity: 1 !important;
}

.deposit-history-dropdown-menu .v-list-item--active {
  background: rgba(54, 9, 82, 0.12) !important;
}

.deposit-history-dropdown-menu .v-list-item:hover {
  background: #f3e8ff !important;
}
</style>
