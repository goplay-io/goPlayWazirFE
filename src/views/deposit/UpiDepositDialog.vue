<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :fullscreen="$vuetify.display.smAndDown"
    :max-width="step === 3 && !$vuetify.display.smAndDown ? 840 : 520"
    persistent
    content-class="deposit-dialog deposit-dialog--rounded"
    transition="dialog-bottom-transition">
    <template v-slot:default>
      <v-card class="deposit-dialog-card tw-rounded-2xl">
        <v-card-title class="deposit-dialog-title tw-border-b">
          <UpiIcon :size="20" color="#ffffff" class="dialog-title-icon tw-shrink-0" />
          <span class="tw-truncate">{{ t('wallet.deposit.upiDeposit') }}</span>
          <v-spacer class="tw-shrink" />
          <v-btn icon size="default" variant="text" :disabled="submitting" @click="closeDialog"
            class="tw-shrink-0 tw-ml-1" aria-label="Close">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="deposit-dialog-body">
          <div v-if="$vuetify.display.smAndDown" class="deposit-step-indicator tw-mb-0">
            <span class="deposit-step-indicator__text">{{ t('wallet.deposit.step', { current: step, total: 3 }) }}</span>
            <div class="deposit-step-indicator__dots">
              <span v-for="i in 3" :key="i" :class="['deposit-step-indicator__dot', { 'deposit-step-indicator__dot--active': i === step }]" />
            </div>
          </div>
          <v-stepper v-model="step" :items="stepperItems" hide-actions :mobile="$vuetify.display.smAndDown" class="deposit-stepper tw-bg-transparent tw-shadow-none">
            <v-stepper-window>
              <v-stepper-window-item :value="1">
                <div class="deposit-step-content">
                  <p class="deposit-step-heading">{{ t('wallet.deposit.enterAmount') }}</p>
                  <div class="deposit-field-wrap">
                    <v-text-field v-model="depositAmount" type="number" step="0.01" min="1"
                      variant="outlined" density="comfortable" hide-details :loading="submitting"
                      rounded="lg" :disabled="submitting" ref="amountField" color="primary"
                      base-color="#111111" bg-color="white" placeholder="0.00">
                    </v-text-field>
                  </div>
                  <p class="deposit-step-label">Quick Amount</p>
                  <div class="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 tw-gap-2 tw-mb-0">
                    <button v-for="amt in quickAmounts" :key="amt" type="button" :disabled="submitting"
                      :class="['deposit-bank-option', { 'deposit-bank-option--selected': isAmountSelected(amt) }]"
                      @click="onQuickSelect(amt)">
                      <span class="deposit-bank-option__label">{{ amt.toLocaleString() }}</span>
                      <v-icon v-if="isAmountSelected(amt)" class="deposit-bank-option__check" size="16">mdi-check-circle</v-icon>
                    </button>
                  </div>
                  <div class="deposit-actions">
                    <v-btn variant="outlined" size="default" rounded="lg" @click="closeDialog" :disabled="submitting"
                      class="tw-border-theme-border-strong" color="default">{{ t('common.cancel') }}</v-btn>
                    <v-btn color="primary" variant="elevated" size="default" rounded="lg" @click="goToAccountStep"
                      :loading="loadingParent" :disabled="!isAmountValid || loadingParent">{{ t('wallet.deposit.next') }}</v-btn>
                  </div>
                </div>
              </v-stepper-window-item>

              <v-stepper-window-item :value="2">
                <div class="deposit-step-content">
                  <div v-if="loadingParent" class="deposit-step-label">{{ t('wallet.deposit.loadingOptions') }}</div>
                  <p class="deposit-step-heading deposit-step-heading--muted">{{ t('wallet.deposit.chooseUpiAccount') }}</p>
                  <div v-if="!loadingParent && parentUpiList.length === 0" class="deposit-step-label tw-mb-2">
                    {{ t('wallet.deposit.noUpiAccounts') }}
                  </div>
                  <div v-else class="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 tw-gap-2 tw-mb-2">
                    <button v-for="(acc, idx) in parentUpiList" :key="acc.id" type="button"
                      :class="['deposit-bank-option', { 'deposit-bank-option--selected': selectedAccount?.id === acc.id }]"
                      @click="selectedAccount = acc">
                      <span class="deposit-bank-option__label">{{ t('wallet.deposit.option', { n: idx + 1 }) }}</span>
                      <v-icon v-if="selectedAccount?.id === acc.id" class="deposit-bank-option__check" size="16">mdi-check-circle</v-icon>
                    </button>
                  </div>
                  <div class="deposit-actions">
                    <v-btn variant="outlined" size="default" rounded="lg" @click="step = 1"
                      class="tw-border-theme-border-strong" color="default">{{ t('common.back') }}</v-btn>
                    <v-btn variant="outlined" size="default" rounded="lg" @click="closeDialog" :disabled="submitting"
                      class="tw-border-theme-border-strong" color="default">{{ t('common.cancel') }}</v-btn>
                    <v-btn color="primary" variant="elevated" size="default" rounded="lg" @click="step = 3"
                      :disabled="!selectedAccount || parentUpiList.length === 0">{{ t('wallet.deposit.next') }}</v-btn>
                  </div>
                </div>
              </v-stepper-window-item>

              <v-stepper-window-item :value="3">
                <div class="deposit-step-content deposit-step-three">
                  <div class="deposit-step-three__left">
                    <p class="deposit-amount-to-pay tw-font-bold tw-mb-2">
                      Amount to pay: {{ confirmedAmount }}
                    </p>
                    <div class="deposit-qr-wrap">
                    <p class="deposit-step-label">{{ t('wallet.deposit.scanToPay', { type: t('wallet.deposit.upi') }) }}</p>
                    <div v-if="upiQrImageLoading" class="deposit-qr-box deposit-qr-box--loading">
                      <v-progress-circular indeterminate color="primary" size="32" />
                    </div>
                    <div v-else-if="showUpiQrImage" class="deposit-qr-box">
                      <img
                        :src="upiQrImageUrl"
                        :alt="t('wallet.deposit.scanToPay', { type: t('wallet.deposit.upi') })"
                        class="deposit-qr-image"
                        @error="upiQrImageFailed = true"
                      />
                    </div>
                    <div v-else-if="upiQrValue" class="deposit-qr-box">
                      <qrcode-vue :value="upiQrValue" :size="180" level="H" render-as="svg"
                        class="deposit-qr-svg"></qrcode-vue>
                    </div>
                  </div>
                  <p class="deposit-step-heading tw-mt-1">Payment details (copy to pay)</p>
                  <div class="bank-info-fields">
                    <div v-if="selectedAccount?.holder_name" class="bank-info-field">
                      <p class="bank-info-field__label">Holder Name</p>
                      <div class="bank-info-field__value" @click="selectedAccount?.holder_name && copyBankField(selectedAccount.holder_name, 'Holder Name')">
                        <span>{{ selectedAccount?.holder_name || '—' }}</span>
                        <v-btn icon="mdi-content-copy" size="x-small" variant="text" class="bank-info-field__copy"
                          @click.stop="copyBankField(selectedAccount?.holder_name, 'Holder Name')"></v-btn>
                      </div>
                    </div>
                    <div class="bank-info-field">
                      <p class="bank-info-field__label">UPI ID</p>
                      <div class="bank-info-field__value" @click="upiId && copyUpiId()">
                        <span>{{ upiId || '—' }}</span>
                        <v-btn icon="mdi-content-copy" size="x-small" variant="text" class="bank-info-field__copy"
                          @click.stop="copyUpiId"></v-btn>
                      </div>
                    </div>
                  </div>
                  <p class="deposit-step-label deposit-step-hint">
                    Complete the payment in your UPI app using the QR code or UPI ID above.
                  </p>
                    <div class="deposit-field-wrap">
                    <p class="deposit-step-label">{{ t('wallet.deposit.uploadReceipt') }}</p>
                    <v-file-input
                      v-model="receiptFile"
                      accept="image/*"
                      variant="outlined"
                      density="comfortable"
                      :hide-details="!receiptError"
                      :error-messages="receiptError"
                      :disabled="submitting"
                      prepend-icon="mdi-file-upload-outline"
                      show-size
                      clearable
                      rounded="lg"
                    />
                  </div>
                  <div class="deposit-field-wrap">
                    <p class="deposit-step-label">{{ t('wallet.deposit.transactionId') }}</p>
                    <v-text-field
                      v-model="txnId"
                      variant="outlined"
                      density="comfortable"
                      :hide-details="!txnIdError"
                      :error-messages="txnIdError"
                      :disabled="submitting"
                      rounded="lg"
                      color="primary"
                      base-color="#111111"
                      bg-color="white"
                      :placeholder="t('wallet.deposit.transactionIdPlaceholder')"
                      maxlength="100"
                      counter="100"
                    />
                  </div>
                  <div class="deposit-checkbox-wrap">
                    <v-checkbox v-model="paymentCompleted" :label="t('wallet.deposit.paymentCompleted')" hide-details color="primary"
                      :disabled="submitting" density="comfortable"></v-checkbox>
                  </div>
                    <div class="deposit-actions">
                      <v-btn variant="outlined" size="default" rounded="lg" @click="step = 2" :disabled="submitting"
                        class="tw-border-theme-border-strong" color="default">{{ t('common.back') }}</v-btn>
                      <v-btn variant="outlined" size="default" rounded="lg" @click="closeDialog" :disabled="submitting"
                        class="tw-border-theme-border-strong" color="default">{{ t('common.cancel') }}</v-btn>
                      <v-btn color="primary" variant="elevated" size="default" rounded="lg" @click="confirmSubmit"
                        :loading="submitting" :disabled="!paymentCompleted">{{ t('common.confirm') }}</v-btn>
                    </div>
                  </div>
                  <div class="deposit-step-three__right">
                    <div class="deposit-receipt-preview">
                      <template v-if="receiptPreviewUrl">
                        <img :src="receiptPreviewUrl" :alt="t('wallet.deposit.receiptPreview')" class="deposit-receipt-preview__img" />
                      </template>
<template v-else>
                        <div class="deposit-receipt-preview__empty">
                          <v-icon size="40" class="deposit-receipt-preview__empty-icon">mdi-image-outline</v-icon>
                          <span class="deposit-receipt-preview__label">{{ t('wallet.deposit.receiptPreview') }}</span>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </v-stepper-window-item>
            </v-stepper-window>
          </v-stepper>
        </v-card-text>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import QrcodeVue from 'qrcode.vue'
import UpiIcon from '@/components/Icons/UpiIcon.vue'
import { useWallet } from '@/composables/useWallet.js'
import * as requests from '@/api/wallet/wallet.js'
import { getApiClient } from '@/api/axios.js'
import { getParentPaymentMethods } from '@/api/wallet/paymentMethods.js'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import { getEligibilitySessionId } from '@/utils/paymentEligibility.js'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'request-created'])

const { showSuccess, showError } = useSnackbar()

const depositAmount = ref('')
const receiptFile = ref(null)
const receiptPreviewUrl = ref(null)
const txnId = ref('')
const txnIdError = ref('')
const receiptError = ref('')
const MIN_TRANSACTION_ID_LENGTH = 12

const validateTransactionId = (value = txnId.value) => {
  const normalized = String(value || '').trim()
  if (!normalized) return t('wallet.deposit.transactionIdRequired')
  if (normalized.length < MIN_TRANSACTION_ID_LENGTH) {
    return t('wallet.deposit.transactionIdMinLength', {
      count: MIN_TRANSACTION_ID_LENGTH
    })
  }
  return true
}

watch(receiptFile, (file) => {
  if (receiptPreviewUrl.value) {
    URL.revokeObjectURL(receiptPreviewUrl.value)
    receiptPreviewUrl.value = null
  }
  const f = Array.isArray(file) ? file[0] : file
  if (f && f.type && f.type.startsWith('image/')) {
    receiptPreviewUrl.value = URL.createObjectURL(f)
    receiptError.value = ''
  } else if (f && f.type) {
    receiptFile.value = null
    showError(t('wallet.deposit.onlyImages'))
  }
}, { immediate: true })

watch(txnId, () => {
  if (!txnIdError.value) return
  const validation = validateTransactionId()
  txnIdError.value = validation === true ? '' : validation
})

onUnmounted(() => {
  if (receiptPreviewUrl.value) URL.revokeObjectURL(receiptPreviewUrl.value)
  if (upiQrImageUrl.value) URL.revokeObjectURL(upiQrImageUrl.value)
})

const submitting = ref(false)
const step = ref(1)
const amountField = ref(null)
const paymentCompleted = ref(false)
const parentUpiList = ref([])
const eligibilitySessionId = ref(null)
const loadingParent = ref(false)
const selectedAccount = ref(null)

const upiId = computed(() => selectedAccount.value?.upi_id ?? '')
const upiQrCodeUrl = computed(() => String(selectedAccount.value?.qr_code ?? '').trim())
const upiQrImageFailed = ref(false)
const upiQrImageLoading = ref(false)
const upiQrImageUrl = ref('')
const showUpiQrImage = computed(() => Boolean(upiQrImageUrl.value) && !upiQrImageFailed.value)

const upiQrValue = computed(() => {
  const am = parseFloat(depositAmount.value) || 0
  if (am <= 0 || !upiId.value) return ''
  const pa = encodeURIComponent(upiId.value)
  const pn = encodeURIComponent(selectedAccount.value?.holder_name || t('wallet.deposit.depositFallback'))
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am.toFixed(2)}`
})

const normalizeWalletQrPath = (qrPath) => {
  let path = String(qrPath || '').trim()
  if (!path) return ''

  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname
    } catch {
      return path
    }
  }

  path = path.startsWith('/') ? path : `/uploads/qr-codes/${path}`
  path = path.replace(/^(\/wallet)+(?=\/uploads\/)/, '')

  if (!path.startsWith('/uploads/qr-codes/')) {
    const filename = path.split('/').filter(Boolean).pop()
    return filename ? `/uploads/qr-codes/${filename}` : ''
  }

  return path
}

watch(upiQrCodeUrl, (qrCode, _previousQrCode, onCleanup) => {
  let cancelled = false

  if (upiQrImageUrl.value) {
    URL.revokeObjectURL(upiQrImageUrl.value)
    upiQrImageUrl.value = ''
  }

  upiQrImageFailed.value = false
  upiQrImageLoading.value = false

  if (!qrCode) return

  const client = getApiClient('wallet')
  const qrPath = normalizeWalletQrPath(qrCode)
  if (!qrPath) return

  upiQrImageLoading.value = true

  client.get(qrPath, { responseType: 'blob' })
    .then((response) => {
      if (cancelled) return
      upiQrImageUrl.value = URL.createObjectURL(response.data)
    })
    .catch((error) => {
      if (cancelled) return
      console.error('Failed to load UPI QR code:', error)
      upiQrImageFailed.value = true
      upiQrImageUrl.value = ''
    })
    .finally(() => {
      if (!cancelled) upiQrImageLoading.value = false
    })

  onCleanup(() => {
    cancelled = true
  })
})

const stepperItems = [
  { title: t('wallet.deposit.stepper.amount'), value: 1 },
  { title: t('wallet.deposit.stepper.upiAccount'), value: 2 },
  { title: t('wallet.deposit.stepper.payConfirm'), value: 3 }
]
const quickAmounts = [100, 500, 1000, 5000, 10000, 50000]

const isAmountSelected = (amount) => {
  const current = parseFloat(depositAmount.value)
  return Number.isFinite(current) && current === amount
}

const validateAmount = (value) => {
  const amount = value !== undefined ? value : depositAmount.value
  if (!amount || amount === '') return t('wallet.deposit.amountRequired')
  const num = parseFloat(amount)
  if (isNaN(num)) return t('wallet.deposit.amountInvalid')
  if (num <= 0) return t('wallet.deposit.amountGreaterThanZero')
  return true
}

const confirmedAmount = computed(() => parseFloat(depositAmount.value || 0).toFixed(2))
const isAmountValid = computed(() => validateAmount() === true)
const receiptDisplayFile = computed(() => {
  const f = receiptFile.value
  return Array.isArray(f) ? f[0] : f
})

async function loadParentUpiOptions() {
  loadingParent.value = true
  parentUpiList.value = []
  eligibilitySessionId.value = null
  selectedAccount.value = null
  try {
    const res = await getParentPaymentMethods('upi', depositAmount.value)
    const data = res?.data?.data ?? res?.data
    parentUpiList.value = Array.isArray(data?.list) ? data.list : []
    eligibilitySessionId.value = getEligibilitySessionId(data)
    return true
  } catch (e) {
    console.error('Failed to load parent UPI options:', e)
    showError(t('wallet.deposit.loadOptionsFailed'))
    return false
  } finally {
    loadingParent.value = false
  }
}

async function goToAccountStep() {
  if (validateAmount() !== true || loadingParent.value) {
    if (amountField.value) amountField.value.validate()
    return
  }
  if (await loadParentUpiOptions()) step.value = 2
}

watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    paymentCompleted.value = false
    step.value = 1
    selectedAccount.value = null
    parentUpiList.value = []
    eligibilitySessionId.value = null
    receiptFile.value = null
    txnId.value = ''
    txnIdError.value = ''
    receiptError.value = ''
    depositAmount.value = ''
  }
})

const closeDialog = () => emit('update:modelValue', false)

const setAmount = (amount) => {
  depositAmount.value = amount.toString()
}

const copyUpiId = async () => {
  if (!upiId.value) return
  try {
    await navigator.clipboard.writeText(upiId.value)
    showSuccess(t('common.copiedToClipboard', { label: t('wallet.deposit.upiId') }))
  } catch (error) {
    console.error('Failed to copy:', error)
    showError(t('common.copyFailed', { label: t('wallet.deposit.upiId') }))
  }
}

const copyBankField = async (value, label) => {
  if (value === undefined || value === null || String(value) === '') return
  try {
    await navigator.clipboard.writeText(String(value))
    showSuccess(`${label} copied to clipboard`)
  } catch (error) {
    console.error('Failed to copy:', error)
    showError(`Failed to copy ${label}`)
  }
}

const onQuickSelect = (amount) => {
  if (submitting.value) return
  setAmount(amount)
}

const confirmSubmit = async () => {
  if (validateAmount() !== true) {
    if (amountField.value) amountField.value.validate()
    return
  }

  let hasError = false
  if (!receiptDisplayFile.value) {
    receiptError.value = t('wallet.deposit.receiptRequired')
    hasError = true
  }
  const txnIdValidation = validateTransactionId()
  if (txnIdValidation !== true) {
    txnIdError.value = txnIdValidation
    hasError = true
  }
  if (hasError) return

  try {
    submitting.value = true
    const depositData = {
      amount: depositAmount.value,
      payment_method_id: selectedAccount.value?.id,
      payment_type: 'upi',
      eligibility_session_id: eligibilitySessionId.value,
      txn_id: txnId.value.trim(),
      receiptFile: receiptDisplayFile.value
    }
    const response = await requests.createDepositRequest(depositData)
    if (response?.success) {
      depositAmount.value = ''
      txnId.value = ''
      paymentCompleted.value = false
      emit('update:modelValue', false)
      emit('request-created', depositData)
      showSuccess(t('wallet.deposit.requestSubmitted'))
    }
  } catch (error) {
    console.error('Failed to submit UPI deposit request:', error)
    showError(error?.message || t('wallet.deposit.requestFailed'))
  } finally {
    submitting.value = false
    emit('update:modelValue', false)
  }
}
</script>

<style scoped>
/* Design system: match BankDepositDialog */
.deposit-dialog-title {
  padding: 0.75rem 1rem;
  font-size: 1.0625rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.375rem;
}

.deposit-dialog-body {
  padding: 0.25rem 0.75rem 0.75rem !important;
}

.deposit-step-content {
  padding: 0;
}

.deposit-step-heading {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.deposit-step-heading--muted {
  font-weight: 500;
  color: var(--color-text);
}

.deposit-step-label {
  font-size: 0.875rem;
  color: var(--color-text);
  margin: 0 0 0.375rem 0;
}

.deposit-step-hint {
  margin-bottom: 0;
}

.deposit-field-wrap {
  margin-bottom: 0.75rem;
}

.deposit-summary-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
  background: var(--color-surface-alt, rgba(0, 0, 0, 0.04));
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.deposit-summary-prefix {
  color: var(--color-text);
}

.deposit-summary-value {
  font-weight: 600;
  color: var(--color-text);
}

.deposit-summary-box {
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
  background: var(--color-surface-alt, rgba(0, 0, 0, 0.04));
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
  border-radius: 0.5rem;
}

.deposit-summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.875rem;
}

.deposit-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

@media (max-width: 600px) {
  .deposit-actions {
    flex-direction: column-reverse;
  }
  .deposit-actions .v-btn {
    width: 100%;
  }
}

.deposit-checkbox-wrap {
  margin: 0.5rem 0;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
}

.deposit-qr-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0.75rem;
}

.deposit-qr-box {
  background: #ffffff;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.deposit-qr-box--loading {
  width: 204px;
  height: 204px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.deposit-qr-image,
.deposit-qr-svg {
  width: 180px;
  height: 180px;
  display: block;
}

.deposit-qr-image {
  object-fit: contain;
}

.bank-info-fields {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.bank-info-field__label {
  font-size: 0.875rem;
  color: var(--color-text);
  margin: 0 0 0.25rem 0;
  font-weight: 500;
}

.bank-info-field__value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: var(--color-surface-alt, rgba(0, 0, 0, 0.04));
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: var(--color-text);
  cursor: pointer;
  min-height: 2.5rem;
}

.bank-info-field__value:hover {
  border-color: var(--color-border-strong, rgba(0, 0, 0, 0.2));
}

.bank-info-field__value span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bank-info-field__copy {
  flex-shrink: 0;
}

.deposit-bank-option {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.625rem 0.75rem;
  min-height: 2.75rem;
  border: 2px solid var(--color-border-strong, rgba(0, 0, 0, 0.2));
  border-radius: 0.5rem;
  background: var(--color-surface, #fff);
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;
}

.deposit-bank-option:hover:not(:disabled) {
  border-color: var(--color-nav);
  background: var(--color-surface-alt, rgba(0, 0, 0, 0.02));
}

.deposit-bank-option:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.deposit-bank-option--selected {
  border-color: var(--color-nav);
  background: color-mix(in srgb, var(--color-nav) 12%, #ffffff);
  box-shadow: 0 0 0 1px var(--color-nav);
}

.deposit-bank-option--selected .deposit-bank-option__label {
  color: var(--color-nav);
  font-weight: 600;
}

.deposit-bank-option__check {
  color: var(--color-nav);
}

@media (max-width: 960px) {
  .deposit-dialog-card {
    margin-top: 2rem;
    max-height: calc(100vh - 2rem);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .deposit-dialog-card .v-card-text {
    flex: 1;
    overflow-y: auto;
  }
  .deposit-stepper :deep(.v-stepper-header) {
    display: none;
  }
}

.deposit-step-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.25rem 0 0;
}

.deposit-step-indicator__text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.deposit-step-indicator__dots {
  display: flex;
  gap: 0.375rem;
}

.deposit-step-indicator__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--color-border-strong, rgba(0, 0, 0, 0.2));
  transition: background 0.2s ease;
}

.deposit-step-indicator__dot--active {
  background: var(--color-nav);
  transform: scale(1.2);
}

.deposit-step-three {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
@media (min-width: 600px) {
  .deposit-step-three {
    flex-direction: row;
    align-items: flex-start;
    gap: 1.5rem;
  }
  .deposit-step-three__left {
    flex: 1;
    min-width: 0;
  }
  .deposit-step-three__right {
    width: 280px;
    flex-shrink: 0;
  }
}
.deposit-receipt-preview {
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
  border-radius: 0.75rem;
  overflow: hidden;
  background: var(--color-surface-alt, rgba(0, 0, 0, 0.04));
  aspect-ratio: 3 / 4;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.deposit-receipt-preview__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.deposit-receipt-preview__placeholder,
.deposit-receipt-preview__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--color-text);
}
.deposit-receipt-preview__label {
  font-size: 0.875rem;
}
.deposit-receipt-preview__empty-icon {
  opacity: 0.5;
}

:deep(.deposit-stepper .v-stepper-header) {
  padding: 0.375rem 0 0.5rem;
}

:deep(.deposit-stepper .v-stepper-item) {
  padding: 0 0.25rem;
}

</style>

