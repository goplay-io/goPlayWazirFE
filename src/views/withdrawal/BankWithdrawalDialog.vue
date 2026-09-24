<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :fullscreen="$vuetify.display.smAndDown"
    max-width="520"
    persistent
    content-class="deposit-dialog withdrawal-dialog deposit-dialog--rounded"
    transition="dialog-bottom-transition"
  >
    <v-card class="deposit-dialog-card tw-rounded-2xl">
        <v-card-title class="deposit-dialog-title tw-border-b">
        <BankDepositIcon :size="20" color="#ffffff" class="dialog-title-icon tw-shrink-0" />
        <span class="tw-truncate">{{ t('wallet.withdrawal.bankWithdrawal') }}</span>
        <v-spacer class="tw-shrink" />
        <v-btn icon size="default" variant="text" :disabled="submitting" @click="closeDialog"
          class="tw-shrink-0 tw-ml-1" aria-label="Close">
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="deposit-dialog-body">
          <div v-if="$vuetify.display.smAndDown" class="deposit-step-indicator tw-mb-0">
            <span class="deposit-step-indicator__text">Step {{ step }} of 3</span>
            <div class="deposit-step-indicator__dots">
              <span v-for="i in 3" :key="i" :class="['deposit-step-indicator__dot', { 'deposit-step-indicator__dot--active': i === step }]" />
            </div>
          </div>

        <v-stepper
          v-model="step"
          :items="stepperItems"
          hide-actions
          :mobile="$vuetify.display.smAndDown"
          class="deposit-stepper tw-bg-transparent tw-shadow-none"
        >
          <v-stepper-window>
            <v-stepper-window-item :value="1">
              <div class="deposit-step-content">
                <div class="deposit-step-heading-row">
                  <p class="deposit-step-heading tw-mb-0">{{ t('wallet.withdrawal.chooseBankAccount') }}</p>
                  <v-btn icon size="small" variant="tonal" color="primary" class="tw-shrink-0 dialog-add-btn" aria-label="Add bank account"
                    @click="goToAddBankAccount">
                    <v-icon size="20">mdi-plus</v-icon>
                  </v-btn>
                </div>
                <div v-if="loadingAccounts" class="tw-py-4 tw-text-center">{{ t('common.loading') }}</div>
                <div v-else-if="bankAccounts.length === 0" class="tw-py-4 tw-text-center">{{ t('wallet.withdrawal.noBankAccounts') }}</div>
                <div v-else class="withdrawal-account-list tw-flex tw-flex-col tw-gap-3 tw-mb-4">
                  <button v-for="acc in bankAccounts" :key="acc.id" type="button" class="withdrawal-account-item"
                    :class="{ 'withdrawal-account-item--selected': selectedAccount?.id === acc.id }"
                    @click="selectedAccount = acc">
                    <div class="withdrawal-account-item__icon">
                      <BankDepositIcon :size="20" />
                    </div>
                    <div class="withdrawal-account-item__body tw-min-w-0 tw-flex-1 tw-text-left">
                      <div class="withdrawal-account-item__title">{{ acc.bank_name || t('wallet.withdrawal.bank') }}</div>
                      <div class="withdrawal-account-item__meta">{{ t('wallet.withdrawal.holder') }}: {{ acc.holder_name || t('common.dash') }}</div>
                      <div class="withdrawal-account-item__meta tw-font-mono tw-tracking-wide">{{ formattedBankNumber(acc) }}</div>
                      <div v-if="acc.account_ifsc" class="withdrawal-account-item__meta">{{ t('wallet.deposit.ifscCode') }}: {{ acc.account_ifsc }}</div>
                    </div>
                    <div v-if="selectedAccount?.id === acc.id" class="withdrawal-account-item__check">
                      <v-icon size="20" class="dialog-check-icon">mdi-check-circle</v-icon>
                    </div>
                  </button>
                </div>
                <div class="deposit-actions">
                  <v-btn variant="outlined" size="default" rounded="lg" @click="closeDialog" :disabled="submitting"
                    class="tw-border-theme-border-strong" color="default">{{ t('common.cancel') }}</v-btn>
                  <v-btn color="primary" variant="elevated" size="default" rounded="lg" @click="step = 2"
                    :disabled="!selectedAccount">{{ t('wallet.deposit.next') }}</v-btn>
                </div>
              </div>
            </v-stepper-window-item>

            <v-stepper-window-item :value="2">
              <div class="deposit-step-content">
                <div class="deposit-summary-bar">
                  <span class="deposit-summary-prefix">{{ t('wallet.withdrawal.to') }}</span>
                  <span class="deposit-summary-value">{{ selectedAccount?.bank_name }} •••• {{ (selectedAccount?.account_number || '').slice(-4) }}</span>
                </div>
                <p class="deposit-step-heading">{{ t('wallet.withdrawal.enterAmount') }}</p>
                <div class="deposit-field-wrap">
                  <v-text-field v-model="withdrawalAmount" type="number" step="0.01" min="1" :max="cashable"
                    variant="outlined" density="comfortable" hide-details :loading="submitting"
                    rounded="lg" :disabled="submitting" ref="amountField" color="primary"
                    base-color="#111111" bg-color="white" placeholder="0.00" />
                </div>
                <p class="deposit-step-label">{{ t('wallet.deposit.quick') }}</p>
                <div class="tw-grid tw-grid-cols-3 tw-gap-3 tw-mb-0">
                  <button v-for="amt in quickAmounts" :key="amt" type="button" :disabled="submitting || amt > parseFloat(cashable)"
                    :class="['deposit-bank-option', { 'deposit-bank-option--selected': isAmountSelected(amt) }]"
                    @click="onQuickSelect(amt)">
                    <span class="deposit-bank-option__label">{{ amt.toLocaleString() }}</span>
                    <v-icon v-if="isAmountSelected(amt)" class="deposit-bank-option__check" size="16">mdi-check-circle</v-icon>
                  </button>
                </div>
                <div class="deposit-actions">
                  <v-btn variant="outlined" size="default" rounded="lg" @click="step = 1"
                    class="tw-border-theme-border-strong" color="default">{{ t('common.back') }}</v-btn>
                  <v-btn variant="outlined" size="default" rounded="lg" @click="closeDialog" :disabled="submitting"
                    class="tw-border-theme-border-strong" color="default">{{ t('common.cancel') }}</v-btn>
                  <v-btn color="primary" variant="elevated" size="default" rounded="lg" @click="step = 3"
                    :disabled="!isAmountValid">{{ t('wallet.deposit.next') }}</v-btn>
                </div>
              </div>
            </v-stepper-window-item>

            <v-stepper-window-item :value="3">
              <div class="deposit-step-content">
                <div class="deposit-summary-box">
                  <div class="deposit-summary-row">
                    <span><strong>Amount:</strong> {{ confirmedAmount }}</span>
                    <span><strong>To:</strong> {{ selectedAccount?.bank_name }} •••• {{ (selectedAccount?.account_number || '').slice(-4) }}</span>
                  </div>
                </div>
                <div class="tw-mt-4">
                  <v-text-field v-model="withdrawalPassword" label="Withdrawal Password" type="password" variant="outlined"
                    density="compact" :rules="passwordRules" hide-details="auto" :loading="submitting"
                    :disabled="submitting" ref="passwordField" color="primary" base-color="#111111"
                    bg-color="white" placeholder="Enter your withdrawal password">
                    <template #prepend-inner>
                      <v-icon size="18">mdi-lock</v-icon>
                    </template>
                  </v-text-field>
                </div>
                <p class="tw-text-xs tw-mt-3">{{ t('wallet.withdrawal.processingTime') }}</p>
                <div class="deposit-actions">
                  <v-btn variant="outlined" size="default" rounded="lg" @click="step = 2" :disabled="submitting"
                    class="tw-border-theme-border-strong" color="default">{{ t('common.back') }}</v-btn>
                  <v-btn variant="outlined" size="default" rounded="lg" @click="closeDialog" :disabled="submitting"
                    class="tw-border-theme-border-strong" color="default">{{ t('common.cancel') }}</v-btn>
                  <v-btn color="primary" variant="elevated" size="default" rounded="lg" @click="confirmSubmit"
                    :loading="submitting" :disabled="!withdrawalPassword || withdrawalPassword.length < 4">{{ t('common.confirm') }}</v-btn>
                </div>
              </div>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import BankDepositIcon from '@/components/Icons/BankDepositIcon.vue'
import { useWallet } from '@/composables/useWallet.js'
import * as requests from '@/api/wallet/wallet.js'
import * as paymentMethodsApi from '@/api/wallet/paymentMethods.js'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'request-created'])
const router = useRouter()

const { showSuccess, showError } = useSnackbar()
const { cashable } = useWallet()

const withdrawalAmount = ref('')
const withdrawalPassword = ref('')
const submitting = ref(false)
const step = ref(1)
const amountField = ref(null)
const passwordField = ref(null)
const bankAccounts = ref([])
const loadingAccounts = ref(false)
const selectedAccount = ref(null)

const stepperItems = [
  { title: 'Bank Account', value: 1 },
  { title: 'Amount', value: 2 },
  { title: 'Confirm', value: 3 }
]
const quickAmounts = [100, 500, 1000, 5000, 10000, 50000]

const confirmedAmount = computed(() => parseFloat(withdrawalAmount.value || 0).toFixed(2))
const isAmountSelected = (amt) => parseFloat(withdrawalAmount.value) === amt
const validateAmount = (value) => {
  const amount = value !== undefined ? value : withdrawalAmount.value
  if (!amount || amount === '') return 'Amount is required'
  const num = parseFloat(amount)
  if (isNaN(num) || num <= 0) return 'Enter a valid amount'
  if (num > parseFloat(cashable.value)) return 'Amount cannot exceed cashable balance'
  return true
}
const validatePassword = (v) => (v !== undefined ? v : withdrawalPassword.value)?.length >= 4 ? true : 'Min 4 characters'
const isAmountValid = computed(() => validateAmount() === true)
const passwordRules = [validatePassword]

watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    step.value = 1
    selectedAccount.value = null
    withdrawalPassword.value = ''
  } else if (isOpen && bankAccounts.value.length === 0 && !loadingAccounts.value) {
    loadingAccounts.value = true
    paymentMethodsApi.getBankAccounts().then(res => {
      bankAccounts.value = res.data?.data ?? res.data ?? []
    }).catch(e => { console.error(e); showError('Failed to load bank accounts'); bankAccounts.value = [] }).finally(() => { loadingAccounts.value = false })
  }
})

watch(step, (s) => {
  if (s === 1 && bankAccounts.value.length === 0 && !loadingAccounts.value) {
    loadingAccounts.value = true
    paymentMethodsApi.getBankAccounts().then(res => {
      bankAccounts.value = res.data?.data ?? res.data ?? []
    }).catch(e => { console.error(e); showError('Failed to load bank accounts'); bankAccounts.value = [] }).finally(() => { loadingAccounts.value = false })
  }
})

const formattedBankNumber = (acc) => {
  const num = acc.account_number || ''
  if (!num) return '•••• •••• •••• —'
  const last4 = num.slice(-4)
  return `•••• •••• •••• ${last4}`
}

const { t } = useI18n()

const closeDialog = () => emit('update:modelValue', false)
const goToAddBankAccount = () => {
  closeDialog()
  router.push({ path: '/payment-methods', query: { tab: 'bank' } })
}
const setAmount = (amt) => { withdrawalAmount.value = String(amt) }
const onQuickSelect = (amt) => { if (!submitting.value) setAmount(amt) }

const confirmSubmit = async () => {
  if (validateAmount() !== true) { amountField.value?.validate(); return }
  if (validatePassword(withdrawalPassword.value) !== true) { passwordField.value?.validate(); return }
  try {
    submitting.value = true
    const payload = { amount: withdrawalAmount.value, password: withdrawalPassword.value, payment_method_id: selectedAccount.value?.id, payment_type: 'bank' }
    const response = await requests.createWithdrawalRequest(payload)
    if (response?.success) {
      withdrawalAmount.value = ''
      withdrawalPassword.value = ''
      closeDialog()
      emit('request-created', payload)
      showSuccess('Withdrawal request submitted successfully')
    }
  } catch (error) {
    showError(error.message || 'Failed to submit withdrawal request')
  } finally {
    submitting.value = false
    closeDialog()
  }
}
</script>

<style scoped>
.deposit-dialog-title { padding: 0.75rem 1rem; font-size: 1.0625rem; font-weight: 600; display: flex; align-items: center; flex-wrap: nowrap; gap: 0.375rem; }
.deposit-dialog-body { padding: 1rem !important; }
.deposit-step-content { padding: 0.25rem 0; }
.deposit-step-heading-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.75rem; }
.deposit-step-heading { font-size: 0.9375rem; font-weight: 600; color: var(--color-text); margin: 0 0 0.75rem 0; }
.deposit-step-label { font-size: 0.875rem; color: var(--color-text-secondary, rgba(0,0,0,0.6)); margin: 0 0 0.5rem 0; }
.deposit-field-wrap { margin-bottom: 1rem; }
.deposit-summary-bar { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; margin-bottom: 1rem; background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: 0.5rem; font-size: 0.875rem; }
.deposit-summary-prefix { color: var(--color-text-secondary); }
.deposit-summary-value { font-weight: 600; color: var(--color-text); }
.deposit-summary-box { padding: 0.625rem 1rem; margin-bottom: 1rem; background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: 0.5rem; }
.deposit-summary-row { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; font-size: 0.875rem; }
.deposit-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.25rem; }
.withdrawal-account-item { display: flex; align-items: flex-start; gap: 0.75rem; width: 100%; padding: 0.875rem 1rem; border: 2px solid var(--color-border-strong, rgba(0,0,0,0.2)); border-radius: 0.75rem; background: var(--color-surface); color: var(--color-text); cursor: pointer; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; text-align: left; }
.withdrawal-account-item:hover { border-color: var(--color-nav); background: var(--color-surface-alt); }
.withdrawal-account-item--selected { border-color: var(--color-nav); background: color-mix(in srgb, var(--color-nav) 12%, #ffffff); box-shadow: 0 0 0 1px var(--color-nav); }
.withdrawal-account-item__icon { flex-shrink: 0; width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--color-nav) 16%, #ffffff); color: var(--color-nav); }
.withdrawal-account-item__title { font-size: 0.9375rem; font-weight: 600; color: var(--color-text); margin-bottom: 0.25rem; }
.withdrawal-account-item__meta { font-size: 0.8125rem; color: var(--color-text-secondary, rgba(0,0,0,0.6)); line-height: 1.35; }
.withdrawal-account-item__meta + .withdrawal-account-item__meta { margin-top: 0.125rem; }
.withdrawal-account-item__check { flex-shrink: 0; margin-top: 0.125rem; }
.deposit-bank-option { display: flex; align-items: center; justify-content: center; gap: 0.375rem; padding: 0.625rem 0.75rem; min-height: 2.75rem; border: 2px solid var(--color-border-strong); border-radius: 0.5rem; background: var(--color-surface); color: var(--color-text); font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
.deposit-bank-option:hover:not(:disabled) { border-color: var(--color-nav); background: var(--color-surface-alt); }
.deposit-bank-option:disabled { opacity: 0.6; cursor: not-allowed; }
.deposit-bank-option--selected { border-color: var(--color-nav); background: color-mix(in srgb, var(--color-nav) 12%, #ffffff); box-shadow: 0 0 0 1px var(--color-nav); }
.deposit-bank-option--selected .deposit-bank-option__label { color: var(--color-nav); font-weight: 600; }
.deposit-bank-option__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.deposit-bank-option__check { color: var(--color-nav); flex-shrink: 0; }

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

:deep(.deposit-stepper .v-stepper-header) { padding: 0.5rem 0 0.75rem; }
:deep(.deposit-stepper .v-stepper-item) { padding: 0 0.375rem; }

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
</style>

