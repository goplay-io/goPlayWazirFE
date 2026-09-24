<template>
  <div class="deposit-history-root">
    <AccountPageHeader :title="t('wallet.withdrawal.history')" />

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
          :menu-props="{ contentClass: 'withdrawal-history-dropdown-menu' }"
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
          :menu-props="{ contentClass: 'withdrawal-history-dropdown-menu' }"
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
        :items="withdrawals"
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
            :text="getStatusInfo(item.status_name).text"
            size="x-small"
            variant="tonal"
          />
        </template>

        <template #item.amount="{ item }">
          <span class="account-page-cell tw-font-semibold">
            {{ item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="tw-flex tw-justify-center tw-gap-2">
            <v-btn
              v-if="canCancelWithdrawal(item)"
              @click="showCancelConfirmation(item)"
              size="small"
              color="error"
              variant="outlined"
              :loading="cancelingRequestId === item.id"
              class="tw-text-xs"
            >
              <v-icon size="16" class="tw-mr-1">mdi-cancel</v-icon>
              Cancel
            </v-btn>
            <span v-else class="account-page-cell tw-text-xs tw-italic">
              {{ getActionText(item) }}
            </span>
          </div>
        </template>

        <template #no-data>
          <div class="account-page-empty tw-text-center tw-py-8">
            <v-icon size="48" class="account-page-empty__icon tw-mb-4">mdi-cash-minus</v-icon>
            <p class="account-page-empty__title">{{ t('wallet.withdrawal.noHistory') }}</p>
            <p class="account-page-empty__note">{{ t('wallet.deposit.historyWillAppear') }}</p>
          </div>
        </template>
      </v-data-table>
      </div>
    </div>

    <v-dialog v-model="showCancelModal" max-width="400" persistent>
      <template #default>
        <v-card class="cancel-dialog-card">
          <v-card-title class="cancel-dialog-card__title">
            Cancel Withdrawal Request
          </v-card-title>

          <v-card-text class="cancel-dialog-card__body">
            <div class="tw-flex tw-items-center tw-gap-3 tw-mb-4">
              <div class="cancel-dialog-card__icon-wrap">
                <v-icon size="24" class="tw-text-error">mdi-cancel</v-icon>
              </div>
              <div>
                <p class="tw-font-semibold tw-mb-1">Cancel Request</p>
                <p class="tw-text-sm tw-opacity-80">Please confirm the cancellation</p>
              </div>
            </div>

            <div class="cancel-dialog-card__summary">
              <div class="tw-flex tw-justify-between tw-items-center tw-mb-2">
                <span class="tw-text-sm">Amount:</span>
                <span class="tw-font-semibold tw-text-lg">
                  {{ selectedRequest?.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </span>
              </div>
              <div class="tw-flex tw-justify-between tw-items-center">
                <span class="tw-text-sm">Status:</span>
                <v-chip
                  :color="getStatusInfo(selectedRequest?.status_name).color"
                  :text="getStatusInfo(selectedRequest?.status_name).text"
                  size="x-small"
                  variant="tonal"
                />
              </div>
            </div>

            <p class="tw-text-xs tw-opacity-70 tw-mt-3">
              This action cannot be undone. Your withdrawal request will be permanently cancelled.
            </p>
          </v-card-text>

          <v-card-actions class="cancel-dialog-card__actions">
            <v-spacer />
            <v-btn
              variant="outlined"
              @click="closeCancelModal"
              :disabled="cancelingRequestId"
              class="cancel-dialog-card__keep-btn"
            >
              Keep Request
            </v-btn>
            <v-btn color="error" variant="elevated" @click="confirmCancel" :loading="cancelingRequestId">
              Cancel Request
            </v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
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
import * as requests from '@/api/wallet/wallet.js'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import { useCrypto } from '@/composables/useCrypto.js'

const { showSuccess, showError } = useSnackbar()
const { t } = useI18n()
const { getIconByName } = useCrypto()

defineProps({
  withdrawals: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['filter-change', 'request-cancelled'])

const showCancelModal = ref(false)
const selectedRequest = ref(null)
const cancelingRequestId = ref(null)

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

const canCancelWithdrawal = (item) => {
  return !item.status_name || item.status_name === 'pending' || getStatusInfo(item.status_name).text === 'pending'
}

const getActionText = (item) => {
  const statusInfo = getStatusInfo(item.status_name)
  switch (statusInfo.text) {
    case 'approved':
      return t('wallet.withdrawal.actionCompleted')
    case 'rejected':
      return t('wallet.withdrawal.actionRejected')
    case 'cancelled':
      return t('wallet.withdrawal.actionCancelled')
    default:
      return t('wallet.withdrawal.actionPending')
  }
}

const showCancelConfirmation = (request) => {
  selectedRequest.value = request
  showCancelModal.value = true
}

const closeCancelModal = () => {
  showCancelModal.value = false
  selectedRequest.value = null
  cancelingRequestId.value = null
}

const confirmCancel = async () => {
  if (!selectedRequest.value) return

  try {
    cancelingRequestId.value = selectedRequest.value.id
    await requests.cancelRequest(selectedRequest.value.id)
    showSuccess('Withdrawal request cancelled successfully')
    emit('request-cancelled', selectedRequest.value.id)
    closeCancelModal()
  } catch (error) {
    console.error('Error cancelling withdrawal request:', error)
    showError('Failed to cancel withdrawal request. Please try again.')
    cancelingRequestId.value = null
  }
}

const getStatusInfo = (status) => {
  const statusMap = {
    A: { text: 'approved', color: 'green' },
    R: { text: 'rejected', color: 'red' },
    P: { text: 'pending', color: '#8a19ce' },
  }

  return statusMap[status] || { text: 'pending', color: '#8a19ce' }
}

const getPaymentTypeInfo = (type) => {
  const map = {
    bank: { icon: BankDepositIcon, label: 'Bank' },
    upi: { icon: UpiIcon, label: 'UPI' },
    crypto: { icon: UsdtIcon, label: 'Crypto' },
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
  { title: t('wallet.withdrawal.statusOptions.pending'), value: 'pending' },
  { title: t('wallet.withdrawal.statusOptions.approved'), value: 'approved' },
  { title: t('wallet.withdrawal.statusOptions.rejected'), value: 'rejected' },
])

const paymentTypeOptions = computed(() => [
  { title: t('wallet.deposit.paymentOptions.all'), value: '' },
  { title: t('wallet.deposit.paymentOptions.bank'), value: 'bank' },
  { title: t('wallet.deposit.paymentOptions.upi'), value: 'upi' },
  { title: t('wallet.deposit.paymentOptions.crypto'), value: 'crypto' },
])

const tableHeaders = computed(() => [
  { title: t('wallet.withdrawal.date'), key: 'created_on', sortable: true },
  { title: t('wallet.withdrawal.payment'), key: 'payment_type', sortable: true },
  { title: t('wallet.withdrawal.amount'), key: 'amount', sortable: true },
  { title: t('wallet.withdrawal.status'), key: 'status_name', sortable: true },
  { title: t('wallet.withdrawal.actions'), key: 'actions', sortable: false },
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

:deep(.cancel-dialog-card) {
  background: #ffffff !important;
  border: 1px solid var(--color-header-bg, #360952);
  color: #111111 !important;
  border-radius: 8px !important;
  overflow: hidden;
}

:deep(.cancel-dialog-card__title) {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff !important;
  background: var(--color-header-bg, #360952) !important;
  padding: 14px 16px !important;
  border-bottom: none;
}

:deep(.cancel-dialog-card__body),
:deep(.cancel-dialog-card__body) p,
:deep(.cancel-dialog-card__body) span {
  color: #1f2937 !important;
}

:deep(.cancel-dialog-card__icon-wrap) {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background: #f3e8ff;
  border: 1px solid #e9d5ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.cancel-dialog-card__summary) {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
}

:deep(.cancel-dialog-card__actions) {
  padding-top: 0;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

:deep(.cancel-dialog-card__keep-btn) {
  color: var(--color-header-bg, #360952) !important;
  border-color: var(--color-header-bg, #360952) !important;
}
</style>

<style>
.withdrawal-history-dropdown-menu .v-list {
  background: #ffffff !important;
}

.withdrawal-history-dropdown-menu .v-list-item,
.withdrawal-history-dropdown-menu .v-list-item-title,
.withdrawal-history-dropdown-menu .v-list-item__content {
  color: #111111 !important;
  opacity: 1 !important;
}

.withdrawal-history-dropdown-menu .v-list-item--active {
  background: rgba(54, 9, 82, 0.12) !important;
}

.withdrawal-history-dropdown-menu .v-list-item:hover {
  background: #f3e8ff !important;
}
</style>
