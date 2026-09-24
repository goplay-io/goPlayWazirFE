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
          <v-icon start size="20" class="dialog-title-icon tw-shrink-0">mdi-currency-btc</v-icon>
          <span class="tw-truncate">{{ t('wallet.deposit.cryptoDeposit') }}</span>
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
                  <div v-if="loadingCryptoOptions" class="deposit-step-label">{{ t('wallet.deposit.loadingOptions') }}</div>
                  <p class="deposit-step-heading">{{ t('wallet.deposit.enterAmount') }}</p>
                  <div class="deposit-field-wrap">
                    <v-select
                      v-model="selectedCurrency"
                      :items="cryptoOptions"
                      item-title="name"
                      item-value="crypto_currency_id"
                      :item-props="getCurrencySelectItemProps"
                      return-object
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      rounded="lg"
                      color="primary"
                      base-color="theme-text"
                      bg-color="theme-surface"
                      :label="t('wallet.deposit.chooseCurrencyType')"
                      :disabled="submitting || loadingCryptoOptions || cryptoOptions.length === 0"
                    >
                      <template #selection="{ item }">
                        <div class="crypto-select-selection">
                          <component v-if="getCryptoIcon(item.raw)" :is="getCryptoIcon(item.raw)" :size="20" />
                          <span>{{ item.raw?.name || t('wallet.deposit.crypto') }}</span>
                        </div>
                      </template>
                      <template #item="{ props: itemProps, item }">
                        <v-list-item v-bind="itemProps" class="crypto-select-item">
                          <template #prepend>
                            <span class="crypto-select-item__icon">
                              <component v-if="getCryptoIcon(item.raw)" :is="getCryptoIcon(item.raw)" :size="20" />
                              <v-icon v-else size="20">mdi-currency-btc</v-icon>
                            </span>
                          </template>
                        </v-list-item>
                      </template>
                    </v-select>
                  </div>
                  <div v-if="!loadingCryptoOptions && cryptoOptions.length === 0" class="deposit-step-label tw-mb-2">
                    {{ t('wallet.deposit.noCryptoAccounts') }}
                  </div>
                  <div class="deposit-field-wrap">
                    <v-text-field v-model="depositAmount" :label="t('wallet.deposit.enterAmount')" type="number" step="0.01" min="1"
                      variant="outlined" density="comfortable" hide-details :loading="submitting"
                      rounded="lg" :disabled="submitting" ref="amountField" color="primary"
                      base-color="theme-text" bg-color="theme-surface" placeholder="0.00">
                    </v-text-field>
                  </div>
                  <div v-if="isAmountValid && selectedCurrency" class="deposit-summary-bar">
                    <span class="deposit-summary-prefix">Amount to pay</span>
                    <span class="deposit-summary-value">{{ formattedCurrencyPaymentAmount }} {{ selectedCurrencyCode }}</span>
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
                      class="tw-text-theme-text tw-border-theme-border-strong" color="default">Cancel</v-btn>
                    <v-btn color="primary" variant="elevated" size="default" rounded="lg" @click="goToAccountStep"
                      :loading="loadingParent" :disabled="!selectedCurrency || !isCurrencyAvailable(selectedCurrency) || !isAmountValid || loadingParent || loadingCryptoOptions">Next</v-btn>
                  </div>
                </div>
              </v-stepper-window-item>

              <v-stepper-window-item :value="2">
                <div class="deposit-step-content">
                  <div class="deposit-summary-bar">
                    <span class="deposit-summary-prefix">Currency</span>
                    <span class="deposit-summary-value">{{ selectedCurrency?.name }}</span>
                  </div>
                  <div v-if="loadingParent" class="deposit-step-label">{{ t('wallet.deposit.loadingOptions') }}</div>
                  <p class="deposit-step-heading deposit-step-heading--muted">{{ t('wallet.deposit.chooseCryptoAccount') }}</p>
                  <div v-if="!loadingParent && parentCryptoList.length === 0" class="deposit-step-label tw-mb-2">
                    No eligible crypto account is available for this currency and amount.
                  </div>
                  <div v-else class="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 tw-gap-2 tw-mb-2">
                    <button v-for="(acc, idx) in parentCryptoList" :key="acc.id" type="button"
                      :class="['deposit-bank-option', { 'deposit-bank-option--selected': selectedAccount?.id === acc.id }]"
                      @click="selectedAccount = acc">
                      <span class="deposit-bank-option__label">{{ t('wallet.deposit.option', { n: idx + 1 }) }}</span>
                      <v-icon v-if="selectedAccount?.id === acc.id" class="deposit-bank-option__check" size="16">mdi-check-circle</v-icon>
                    </button>
                  </div>
                  <div class="deposit-actions">
                    <v-btn variant="outlined" size="default" rounded="lg" @click="step = 1"
                      class="tw-text-theme-text tw-border-theme-border-strong" color="default">Back</v-btn>
                    <v-btn variant="outlined" size="default" rounded="lg" @click="closeDialog" :disabled="submitting"
                      class="tw-text-theme-text tw-border-theme-border-strong" color="default">Cancel</v-btn>
                    <v-btn color="primary" variant="elevated" size="default" rounded="lg" @click="step = 3"
                      :disabled="!selectedAccount || parentCryptoList.length === 0">Next</v-btn>
                  </div>
                </div>
              </v-stepper-window-item>

              <v-stepper-window-item :value="3">
                <div class="deposit-step-content deposit-step-three">
                  <div class="deposit-step-three__left">
                    <p class="deposit-amount-to-pay tw-font-bold tw-text-theme-text tw-mb-2">
                      Amount to pay: {{ formattedCurrencyPaymentAmount }} {{ selectedCurrencyCode }}
                    </p>
                    <div class="deposit-qr-wrap">
                    <p class="deposit-step-label">{{ t('wallet.deposit.scanToPay', { type: selectedAccount?.crypto_currency_name || t('wallet.deposit.crypto') }) }}</p>
                    <div v-if="cryptoQrImageLoading" class="deposit-qr-box deposit-qr-box--loading">
                      <v-progress-circular indeterminate color="primary" size="32" />
                    </div>
                    <div v-else-if="showCryptoQrImage" class="deposit-qr-box">
                      <img
                        :src="cryptoQrImageUrl"
                        :alt="t('wallet.deposit.scanToPay', { type: selectedAccount?.crypto_currency_name || t('wallet.deposit.crypto') })"
                        class="deposit-qr-image"
                        @error="cryptoQrImageFailed = true"
                      />
                    </div>
                    <div v-else-if="walletAddress" class="deposit-qr-box deposit-qr-box--crypto">
                      <qrcode-vue :value="walletAddress" :size="180" level="H" render-as="svg"
                        class="deposit-qr-svg"></qrcode-vue>
                      <div class="deposit-qr-overlay">
                        <div class="deposit-qr-overlay-icon">
                          <component v-if="getIconByName(selectedAccount?.crypto_currency_name)" :is="getIconByName(selectedAccount?.crypto_currency_name)" :size="32" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p class="deposit-step-heading tw-mt-1">Payment details (copy to pay)</p>
                  <div class="bank-info-fields">
                    <div class="bank-info-field">
                      <p class="bank-info-field__label">Currency</p>
                      <div class="bank-info-field__value">
                        <span>{{ selectedAccount?.crypto_currency_name || '—' }}</span>
                      </div>
                    </div>
                    <div class="bank-info-field">
                      <p class="bank-info-field__label">Wallet Address</p>
                      <div class="bank-info-field__value" @click="copyWalletAddress">
                        <span>{{ walletAddress || '—' }}</span>
                        <v-btn icon="mdi-content-copy" size="x-small" variant="text" class="bank-info-field__copy"
                          @click.stop="copyWalletAddress"></v-btn>
                      </div>
                    </div>
                  </div>
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
                      :label="t('wallet.deposit.uploadReceipt')"
                      show-size
                      clearable
                      rounded="lg"
                    />
                  </div>
                  <div class="deposit-field-wrap">
                    <p class="deposit-step-label">{{ t('wallet.deposit.transactionId') }}</p>
                    <v-text-field
                      v-model="txnId"
                      :label="t('wallet.deposit.transactionId')"
                      variant="outlined"
                      density="comfortable"
                      :hide-details="!txnIdError"
                      :error-messages="txnIdError"
                      :disabled="submitting"
                      rounded="lg"
                      color="primary"
                      base-color="theme-text"
                      bg-color="theme-surface"
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
                        class="tw-text-theme-text tw-border-theme-border-strong" color="default">{{ t('common.back') }}</v-btn>
                      <v-btn variant="outlined" size="default" rounded="lg" @click="closeDialog" :disabled="submitting"
                        class="tw-text-theme-text tw-border-theme-border-strong" color="default">{{ t('common.cancel') }}</v-btn>
                      <v-btn color="primary" variant="elevated" size="default" rounded="lg" @click="confirmSubmit"
                        :loading="submitting" :disabled="!paymentCompleted || !selectedAccount">{{ t('common.confirm') }}</v-btn>
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
import { useCrypto } from '@/composables/useCrypto.js'
import * as requests from '@/api/wallet/wallet.js'
import { useWalletQrImage } from '@/composables/useWalletQrImage.js'
import { getParentCryptoOptions, getParentPaymentMethods } from '@/api/wallet/paymentMethods.js'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import { getEligibilitySessionId } from '@/utils/paymentEligibility.js'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'request-created'])

const { showSuccess, showError } = useSnackbar()
const { getIconByName } = useCrypto()

const depositAmount = ref('')
const receiptFile = ref(null)
const receiptPreviewUrl = ref(null)
const txnId = ref('')
const txnIdError = ref('')
const receiptError = ref('')

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
  if (txnId.value.trim()) txnIdError.value = ''
})

onUnmounted(() => {
  if (receiptPreviewUrl.value) URL.revokeObjectURL(receiptPreviewUrl.value)
})

const submitting = ref(false)
const step = ref(1)
const amountField = ref(null)
const paymentCompleted = ref(false)
const parentCryptoList = ref([])
const cryptoOptions = ref([])
const eligibilitySessionId = ref(null)
const loadingParent = ref(false)
const loadingCryptoOptions = ref(false)
const selectedAccount = ref(null)
const selectedCurrency = ref(null)
const responseCurrency = ref(null)

const walletAddress = computed(() => selectedAccount.value?.address ?? '')

const cryptoQrCodeUrl = computed(() => String(selectedAccount.value?.qr_code ?? '').trim())
const {
  imageFailed: cryptoQrImageFailed,
  imageLoading: cryptoQrImageLoading,
  imageUrl: cryptoQrImageUrl,
  showImage: showCryptoQrImage,
} = useWalletQrImage(cryptoQrCodeUrl, { logLabel: 'crypto' })
watch(selectedCurrency, () => {
  parentCryptoList.value = []
  selectedAccount.value = null
  eligibilitySessionId.value = null
  responseCurrency.value = null
})

watch(depositAmount, () => {
  parentCryptoList.value = []
  selectedAccount.value = null
  eligibilitySessionId.value = null
  responseCurrency.value = null
})

const stepperItems = [
  { title: t('wallet.deposit.stepper.amount'), value: 1 },
  { title: t('wallet.deposit.stepper.cryptoAccount'), value: 2 },
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

const isAmountValid = computed(() => validateAmount() === true)
const selectedCurrencyCode = computed(() => selectedCurrency.value?.code || responseCurrency.value?.code || '')
const selectedCurrencyMultiplier = computed(() => {
  const multiplier = Number(responseCurrency.value?.multiplier ?? selectedCurrency.value?.multiplier)
  return Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1
})
const currencyPaymentAmount = computed(() => {
  const amount = parseFloat(depositAmount.value || 0)
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return amount / selectedCurrencyMultiplier.value
})
const formattedCurrencyPaymentAmount = computed(() => {
  const value = currencyPaymentAmount.value
  if (!Number.isFinite(value)) return '0'
  return value.toFixed(8).replace(/\.?0+$/, '')
})
const receiptDisplayFile = computed(() => {
  const f = receiptFile.value
  return Array.isArray(f) ? f[0] : f
})

const getCryptoIcon = (currency) =>
  getIconByName(currency?.name || currency?.code || currency?.crypto_currency_code || '')

const getCurrencySelectItemProps = (currency) => ({
  disabled: !isCurrencyAvailable(currency),
  title: currency?.name || t('wallet.deposit.crypto')
})

function sortCryptoOptions(options = []) {
  return [...options].sort((a, b) => {
    const availability = Number(!isCurrencyAvailable(a)) - Number(!isCurrencyAvailable(b))
    if (availability !== 0) return availability
    return String(a?.name || a?.code || '').localeCompare(String(b?.name || b?.code || ''))
  })
}

async function loadCryptoCurrencyOptions() {
  loadingCryptoOptions.value = true
  cryptoOptions.value = []
  selectedCurrency.value = null
  try {
    const res = await getParentCryptoOptions('deposit')
    const data = res?.data?.data ?? res?.data
    cryptoOptions.value = sortCryptoOptions(Array.isArray(data?.list) ? data.list : [])
    return true
  } catch (e) {
    console.error('Failed to load crypto options:', e)
    showError(t('wallet.deposit.loadOptionsFailed'))
    return false
  } finally {
    loadingCryptoOptions.value = false
  }
}

async function loadParentCryptoAccounts() {
  loadingParent.value = true
  parentCryptoList.value = []
  eligibilitySessionId.value = null
  selectedAccount.value = null
  responseCurrency.value = null
  try {
    const res = await getParentPaymentMethods('crypto', depositAmount.value, {
      crypto_currency_id: selectedCurrency.value?.crypto_currency_id
    })
    const data = res?.data?.data ?? res?.data
    parentCryptoList.value = Array.isArray(data?.list) ? data.list : []
    responseCurrency.value = data?.currency ?? null
    eligibilitySessionId.value = getEligibilitySessionId(data)
    if (parentCryptoList.value.length === 1) {
      selectedAccount.value = parentCryptoList.value[0]
    }
    return true
  } catch (e) {
    console.error('Failed to load parent crypto options:', e)
    showError(t('wallet.deposit.loadOptionsFailed'))
    return false
  } finally {
    loadingParent.value = false
  }
}

function isCurrencyAvailable(currency) {
  return Boolean(currency?.has_available_account)
}

async function goToAccountStep() {
  if (!selectedCurrency.value || !isCurrencyAvailable(selectedCurrency.value)) return
  if (validateAmount() !== true || loadingParent.value) {
    if (amountField.value) amountField.value.validate()
    return
  }
  if (await loadParentCryptoAccounts()) step.value = 2
}

watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    paymentCompleted.value = false
    step.value = 1
    selectedAccount.value = null
    selectedCurrency.value = null
    parentCryptoList.value = []
    cryptoOptions.value = []
    eligibilitySessionId.value = null
    responseCurrency.value = null
    receiptFile.value = null
    txnId.value = ''
    txnIdError.value = ''
    receiptError.value = ''
    depositAmount.value = ''
  } else if (isOpen && cryptoOptions.value.length === 0 && !loadingCryptoOptions.value) {
    loadCryptoCurrencyOptions()
  }
})

const closeDialog = () => emit('update:modelValue', false)

const setAmount = (amount) => {
  depositAmount.value = amount.toString()
}

const copyWalletAddress = async () => {
  try {
    await navigator.clipboard.writeText(walletAddress.value)
    showSuccess(t('common.copiedToClipboard', { label: t('wallet.deposit.walletAddress') }))
  } catch (error) {
    console.error('Failed to copy:', error)
    showError(t('common.copyFailed', { label: t('wallet.deposit.walletAddress') }))
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
  if (!selectedAccount.value) {
    showError(t('wallet.deposit.loadOptionsFailed'))
    return
  }

  let hasError = false
  if (!receiptDisplayFile.value) {
    receiptError.value = t('wallet.deposit.receiptRequired')
    hasError = true
  }
  if (!txnId.value.trim()) {
    txnIdError.value = t('wallet.deposit.transactionIdRequired')
    hasError = true
  }
  if (hasError) return

  try {
    submitting.value = true
    const depositData = {
      amount: depositAmount.value,
      payment_method_id: selectedAccount.value?.id,
      payment_type: 'crypto',
      crypto_currency_id: selectedCurrency.value?.crypto_currency_id,
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
    console.error('Failed to submit crypto deposit request:', error)
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
  padding: 0.75rem !important;
}

.deposit-step-content {
  padding: 0;
}
.deposit-dialog-body {
  padding: 0.25rem 0.75rem 0.75rem !important;
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

.deposit-field-wrap {
  margin-bottom: 0.75rem;
}

.crypto-select-selection {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.crypto-select-item__icon {
  display: inline-flex;
  align-items: center;
  margin-right: 0.625rem;
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
  width: 205px;
  height: 205px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.deposit-qr-box--crypto {
  position: relative;
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

.deposit-qr-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.deposit-qr-overlay-icon {
  background: #fff;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-border-strong, rgba(0, 0, 0, 0.2));
}

.deposit-qr-overlay-icon svg {
  width: 1.25em;
  height: 1.25em;
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

:deep(.v-btn) {
  border-radius: 8px;
}

:deep(.v-btn--variant-outlined) {
  background-color: transparent !important;
  color: var(--color-text) !important;
  border: 1px solid var(--color-border-strong) !important;
}

:deep(.v-btn--variant-outlined:hover) {
  background-color: var(--color-surface-alt) !important;
  border-color: var(--color-border-strong) !important;
}

[data-theme="dark"] :deep(.v-btn--variant-outlined) {
  color: var(--color-text-inverse, #ffffff) !important;
  border-color: rgba(64, 64, 64, 0.8) !important;
  background-color: rgba(26, 26, 26, 0.5) !important;
}

[data-theme="dark"] :deep(.v-btn--variant-outlined:hover) {
  background-color: rgba(42, 42, 42, 0.8) !important;
  border-color: rgba(96, 96, 96, 0.8) !important;
}

[data-theme="light"] :deep(.v-btn--variant-outlined) {
  color: var(--color-text, var(--neutral-700)) !important;
  border-color: var(--neutral-300) !important;
  background-color: rgba(255, 255, 255, 0.8) !important;
}

[data-theme="light"] :deep(.v-btn--variant-outlined:hover) {
  background-color: var(--neutral-50) !important;
  border-color: var(--neutral-400) !important;
}

:deep(.v-btn--color-primary) {
  background: var(--color-nav) !important;
  border: 1px solid var(--color-nav) !important;
  color: #ffffff !important;
}

:deep(.v-btn--color-primary .v-btn__content),
:deep(.v-btn--color-primary .v-icon) {
  color: #ffffff !important;
}

:deep(.v-selection-control--color-primary .v-selection-control__input > .v-icon),
:deep(.v-field--focused .v-field__outline) {
  color: var(--color-nav) !important;
}

:deep(.deposit-dialog-card .v-btn--variant-elevated) {
  background: var(--color-nav) !important;
  border: 1px solid var(--color-nav) !important;
  color: #ffffff !important;
}

:deep(.deposit-dialog-card .v-btn--variant-elevated .v-btn__content),
:deep(.deposit-dialog-card .v-btn--variant-elevated .v-icon) {
  color: #ffffff !important;
}

:deep(.deposit-dialog-card .v-btn--variant-elevated.v-btn--disabled) {
  background: var(--color-nav) !important;
  border: 1px solid var(--color-nav) !important;
  opacity: 0.55 !important;
}

:deep(.deposit-dialog-card .v-btn--variant-elevated.v-btn--color-primary) {
  background: var(--color-nav) !important;
  border: 1px solid var(--color-nav) !important;
}

.dialog-title-icon {
  color: var(--color-nav) !important;
}
</style>
