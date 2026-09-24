<template>
  <div class="account-page payment-methods-page">
    <AccountPageHeader :title="t('wallet.paymentMethods.title')">
      <template #actions>
        <v-btn
          variant="flat"
          size="small"
          class="payment-methods-btn-primary payment-methods-btn-primary--header"
          :prepend-icon="'mdi-plus'"
          :disabled="addButtonDisabled"
          @click="openAddDialog"
        >
          {{ addButtonLabel }}
        </v-btn>
      </template>
    </AccountPageHeader>

    <div class="payment-methods-content">
      <!-- Tabs -->
      <div>
        <v-tabs v-model="activeTab" bg-color="transparent" class="payment-methods-tabs">
          <v-tab value="bank">{{ t('wallet.paymentMethods.tabs.bank') }}</v-tab>
          <v-tab value="upi">{{ t('wallet.paymentMethods.tabs.upi') }}</v-tab>
          <v-tab value="crypto">{{ t('wallet.paymentMethods.tabs.crypto') }}</v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="tw-bg-transparent">
          <!-- Bank Accounts -->
          <v-window-item value="bank">
            <div class="tw-pt-4">
              <div v-if="loading" class="tw-flex tw-justify-center tw-items-center tw-h-64">
                <v-progress-circular indeterminate size="48" color="var(--color-header-bg, #360952)" />
              </div>
              <div v-else-if="bankAccounts.length === 0" class="payment-methods-empty tw-text-center tw-py-16">
                <v-icon size="64" class="tw-mb-4 payment-methods-empty-icon">mdi-bank-outline</v-icon>
                <h3 class="tw-text-xl tw-font-medium tw-mb-2 payment-methods-empty-title">{{ t('wallet.paymentMethods.empty.bank') }}</h3>
                <p class="payment-methods-empty-text tw-mb-4">{{ t('wallet.paymentMethods.emptyDescription.bank') }}</p>
              </div>
              <div v-else class="tw-p-2">
                <div class="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6 tw-justify-items-stretch">
                  <div
                    v-for="(account, index) in bankAccounts"
                    :key="account.id"
                    class="tw-w-full tw-max-w-xs"
                  >
                    <BankCard
                      :account="account"
                      @edit="openEditBank(account)"
                      @delete="openDeleteDialog('bank', account)"
                      @cardClick="openEditBank(account)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </v-window-item>

          <!-- UPI Accounts -->
          <v-window-item value="upi">
            <div class="tw-pt-4">
              <div v-if="loading" class="tw-flex tw-justify-center tw-items-center tw-h-64">
                <v-progress-circular indeterminate size="48" color="var(--color-header-bg, #360952)" />
              </div>
              <div v-else-if="upiAccounts.length === 0" class="payment-methods-empty tw-text-center tw-py-16">
                <v-icon size="64" class="tw-mb-4 payment-methods-empty-icon">mdi-cellphone</v-icon>
                <h3 class="tw-text-xl tw-font-medium tw-mb-2 payment-methods-empty-title">{{ t('wallet.paymentMethods.empty.upi') }}</h3>
                <p class="payment-methods-empty-text tw-mb-4">{{ t('wallet.paymentMethods.emptyDescription.upi') }}</p>
              </div>
              <div v-else class="tw-p-2">
                <div class="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6 tw-justify-items-stretch">
                  <div
                    v-for="account in upiAccounts"
                    :key="account.id"
                    class="tw-w-full tw-max-w-xs"
                  >
                    <UpiCard
                      :account="account"
                      @edit="openEditUpi(account)"
                      @delete="openDeleteDialog('upi', account)"
                      @cardClick="openEditUpi(account)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </v-window-item>

          <!-- Crypto Accounts -->
          <v-window-item value="crypto">
            <div class="tw-pt-4">
              <div v-if="loading" class="tw-flex tw-justify-center tw-items-center tw-h-64">
                <v-progress-circular indeterminate size="48" color="var(--color-header-bg, #360952)" />
              </div>
              <div v-else-if="cryptoAccountsWithName.length === 0" class="payment-methods-empty tw-text-center tw-py-16">
                <v-icon size="64" class="tw-mb-4 payment-methods-empty-icon">mdi-currency-btc</v-icon>
                <h3 class="tw-text-xl tw-font-medium tw-mb-2 payment-methods-empty-title">{{ t('wallet.paymentMethods.empty.crypto') }}</h3>
                <p class="payment-methods-empty-text tw-mb-4">{{ t('wallet.paymentMethods.emptyDescription.crypto') }}</p>
              </div>
              <div v-else class="tw-p-2">
                <div class="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6 tw-justify-items-stretch">
                  <div
                    v-for="account in cryptoAccountsWithName"
                    :key="account.id"
                    class="tw-w-full tw-max-w-xs"
                  >
                    <CryptoCard
                      :account="account"
                      @edit="openEditCrypto(account)"
                      @delete="openDeleteDialog('crypto', account)"
                      @cardClick="openEditCrypto(account)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </v-window-item>
        </v-window>
      </div>

      <!-- Bank Create/Edit Dialog -->
      <v-dialog v-model="bankDialogOpen" max-width="480" persistent class="tw-rounded-xl" content-class="payment-methods-dialog">
        <v-card class="tw-rounded-xl payment-methods-dialog-card">
          <v-card-title class="payment-methods-dialog-title">{{ bankEditing ? t('wallet.paymentMethods.editBank') : t('wallet.paymentMethods.addBank') }}</v-card-title>
          <v-card-text class="tw-pt-4 payment-methods-dialog-body">
            <v-text-field v-model="bankForm.bank_name" :label="t('wallet.paymentMethods.form.bankName')" variant="outlined" density="compact" class="tw-mb-3 payment-methods-dialog-field" hide-details required />
            <v-text-field v-model="bankForm.holder_name" :label="t('wallet.paymentMethods.form.holderName')" variant="outlined" density="compact" class="tw-mb-3 payment-methods-dialog-field" hide-details required />
            <v-text-field v-model="bankForm.account_number" :label="t('wallet.paymentMethods.form.accountNumber')" variant="outlined" density="compact" class="tw-mb-3 payment-methods-dialog-field" hide-details required />
            <v-text-field v-model="bankForm.account_ifsc" :label="t('wallet.paymentMethods.form.ifsc')" variant="outlined" density="compact" class="tw-mb-3 payment-methods-dialog-field" hide-details required />
            <v-select
              v-model="bankForm.status"
              :label="t('wallet.paymentMethods.form.status')"
              :items="bankStatusOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
              class="payment-methods-dialog-field"
            />
          </v-card-text>
          <v-card-actions class="tw-px-6 tw-pb-4 tw-gap-2">
            <v-spacer />
            <v-btn variant="text" class="payment-methods-btn-cancel" @click="bankDialogOpen = false">{{ t('common.cancel') }}</v-btn>
            <v-btn variant="elevated" class="payment-methods-btn-primary" :loading="submitting" @click="submitBank">
              {{ bankEditing ? t('common.update') : t('common.create') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- UPI Create/Edit Dialog -->
      <v-dialog v-model="upiDialogOpen" max-width="480" persistent class="tw-rounded-xl" content-class="payment-methods-dialog">
        <v-card class="tw-rounded-xl payment-methods-dialog-card">
          <v-card-title class="payment-methods-dialog-title">{{ upiEditing ? t('wallet.paymentMethods.editUpi') : t('wallet.paymentMethods.addUpi') }}</v-card-title>
          <v-card-text class="tw-pt-4 payment-methods-dialog-body">
            <v-text-field v-model="upiForm.upi_id" :label="t('wallet.paymentMethods.form.upiId')" variant="outlined" density="compact" class="tw-mb-3 payment-methods-dialog-field" hide-details required />
            <v-text-field v-model="upiForm.holder_name" :label="t('wallet.paymentMethods.form.holderName')" variant="outlined" density="compact" class="payment-methods-dialog-field" hide-details required />
          </v-card-text>
          <v-card-actions class="tw-px-6 tw-pb-4 tw-gap-2">
            <v-spacer />
            <v-btn variant="text" class="payment-methods-btn-cancel" @click="upiDialogOpen = false">{{ t('common.cancel') }}</v-btn>
            <v-btn variant="elevated" class="payment-methods-btn-primary" :loading="submitting" @click="submitUpi">
              {{ upiEditing ? t('common.update') : t('common.create') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Crypto Create/Edit Dialog -->
      <v-dialog v-model="cryptoDialogOpen" max-width="480" persistent class="tw-rounded-xl" content-class="payment-methods-dialog">
        <v-card class="tw-rounded-xl payment-methods-dialog-card">
          <v-card-title class="payment-methods-dialog-title">{{ cryptoEditing ? t('wallet.paymentMethods.editCrypto') : t('wallet.paymentMethods.addCrypto') }}</v-card-title>
          <v-card-text class="tw-pt-4 payment-methods-dialog-body">
            <v-select
              v-model="cryptoForm.crypto_currency_id"
              :label="t('wallet.paymentMethods.form.currency')"
              :items="cryptoCurrencies"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="compact"
              class="tw-mb-3 payment-methods-dialog-field"
              hide-details
              clearable
            />
            <v-text-field v-model="cryptoForm.address" :label="t('wallet.paymentMethods.form.address')" variant="outlined" density="compact" class="payment-methods-dialog-field" hide-details required />
          </v-card-text>
          <v-card-actions class="tw-px-6 tw-pb-4 tw-gap-2">
            <v-spacer />
            <v-btn variant="text" class="payment-methods-btn-cancel" @click="cryptoDialogOpen = false">{{ t('common.cancel') }}</v-btn>
            <v-btn variant="elevated" class="payment-methods-btn-primary" :loading="submitting" @click="submitCrypto">
              {{ cryptoEditing ? t('common.update') : t('common.create') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Delete Confirmation Dialog -->
      <v-dialog v-model="deleteDialogOpen" max-width="400" persistent content-class="payment-methods-dialog">
        <v-card class="tw-rounded-xl payment-methods-dialog-card">
          <v-card-title class="payment-methods-dialog-title">{{ t('wallet.paymentMethods.deleteTitle') }}</v-card-title>
          <v-card-text class="tw-pt-4 payment-methods-dialog-body payment-methods-dialog-text">
            {{ t('wallet.paymentMethods.deleteText', { label: deleteTarget?.label }) }}
          </v-card-text>
          <v-card-actions class="tw-px-6 tw-pb-4 tw-gap-2">
            <v-spacer />
            <v-btn variant="text" class="payment-methods-btn-cancel" :disabled="submitting" @click="deleteDialogOpen = false">{{ t('common.cancel') }}</v-btn>
            <v-btn color="error" variant="elevated" class="payment-methods-btn-delete" :loading="submitting" @click="confirmDelete">{{ t('wallet.paymentMethods.delete') }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '@/api'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import BankCard from '@/components/BankCards/BankCard.vue'
import UpiCard from '@/components/UpiCard.vue'
import CryptoCard from '@/components/CryptoCard.vue'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'

const { t } = useI18n()
const { showSuccess, showError } = useSnackbar()
const route = useRoute()

const validTabs = ['bank', 'upi', 'crypto']
const initialTab = validTabs.includes(route.query.tab) ? route.query.tab : 'bank'
const activeTab = ref(initialTab)
const loading = ref(false)
const submitting = ref(false)
const bankAccounts = ref([])
const upiAccounts = ref([])
const cryptoAccounts = ref([])
const cryptoCurrencies = ref([])

const bankDialogOpen = ref(false)
const bankEditing = ref(null)
const bankForm = ref({ bank_name: '', holder_name: '', account_number: '', account_ifsc: '', status: 'active' })

const upiDialogOpen = ref(false)
const upiEditing = ref(null)
const upiForm = ref({ upi_id: '', holder_name: '' })

const cryptoDialogOpen = ref(false)
const cryptoEditing = ref(null)
const cryptoForm = ref({ crypto_currency_id: null, address: '' })

const deleteDialogOpen = ref(false)
const deleteTarget = ref(null)

const bankStatusOptions = [
  { value: 'active', label: t('wallet.paymentMethods.status.active') },
  { value: 'suspended', label: t('wallet.paymentMethods.status.suspended') },
  { value: 'pending_verification', label: t('wallet.paymentMethods.status.pendingVerification') },
]

const cryptoAccountsWithName = computed(() => {
  return cryptoAccounts.value.map((row) => ({
    ...row,
    currencyName: row.crypto_currency_name || cryptoCurrencies.value.find((c) => c.id === row.crypto_currency_id)?.name || `#${row.crypto_currency_id}`,
  }))
})

const addButtonLabel = computed(() => {
  if (activeTab.value === 'bank') return t('wallet.paymentMethods.addBank')
  if (activeTab.value === 'upi') return t('wallet.paymentMethods.addUpi')
  return t('wallet.paymentMethods.addCrypto')
})

const addButtonDisabled = computed(() => {
  if (activeTab.value === 'bank') return bankAccounts.value.length >= 3
  if (activeTab.value === 'upi') return upiAccounts.value.length >= 3
  return cryptoAccountsWithName.value.length >= 3
})

async function fetchBankAccounts() {
  try {
    const res = await api.wallet.getBankAccounts()
    const data = res?.data?.data ?? res?.data ?? []
    bankAccounts.value = Array.isArray(data) ? data : []
  } catch {
    bankAccounts.value = []
  }
}

async function fetchUpiAccounts() {
  try {
    const res = await api.wallet.getUpiAccounts()
    const data = res?.data?.data ?? res?.data ?? []
    upiAccounts.value = Array.isArray(data) ? data : []
  } catch {
    upiAccounts.value = []
  }
}

async function fetchCryptoAccounts() {
  try {
    const res = await api.wallet.getCryptoAccounts()
    const data = res?.data?.data ?? res?.data ?? []
    cryptoAccounts.value = Array.isArray(data) ? data : []
  } catch {
    cryptoAccounts.value = []
  }
}

async function fetchCryptoCurrencies() {
  try {
    const res = await api.wallet.getCryptoCurrencies()
    const data = res?.data?.data ?? res?.data ?? []
    cryptoCurrencies.value = Array.isArray(data) ? data : []
  } catch {
    cryptoCurrencies.value = []
  }
}

async function loadForTab(tab) {
  loading.value = true
  try {
    if (tab === 'bank') await fetchBankAccounts()
    else if (tab === 'upi') await fetchUpiAccounts()
    else if (tab === 'crypto') {
      await Promise.all([fetchCryptoAccounts(), fetchCryptoCurrencies()])
    }
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  if (addButtonDisabled.value) return
  if (activeTab.value === 'bank') {
    bankEditing.value = null
    bankForm.value = { bank_name: '', holder_name: '', account_number: '', account_ifsc: '', status: 'active' }
    bankDialogOpen.value = true
  } else if (activeTab.value === 'upi') {
    upiEditing.value = null
    upiForm.value = { upi_id: '', holder_name: '' }
    upiDialogOpen.value = true
  } else {
    cryptoEditing.value = null
    cryptoForm.value = { crypto_currency_id: null, address: '' }
    fetchCryptoCurrencies().then(() => {
      cryptoDialogOpen.value = true
    })
  }
}

function openEditBank(item) {
  bankEditing.value = item
  bankForm.value = {
    bank_name: item.bank_name ?? '',
    holder_name: item.holder_name ?? '',
    account_number: item.account_number ?? '',
    account_ifsc: item.account_ifsc ?? '',
    status: item.status ?? 'active',
  }
  bankDialogOpen.value = true
}

function openEditUpi(item) {
  upiEditing.value = item
  upiForm.value = { upi_id: item.upi_id ?? '', holder_name: item.holder_name ?? '' }
  upiDialogOpen.value = true
}

function openEditCrypto(item) {
  cryptoEditing.value = item
  cryptoForm.value = { crypto_currency_id: item.crypto_currency_id ?? null, address: item.address ?? '' }
  fetchCryptoCurrencies().then(() => {
    cryptoDialogOpen.value = true
  })
}

async function submitBank() {
  const f = bankForm.value
  if (!f.bank_name?.trim() || !f.holder_name?.trim() || !f.account_number?.trim() || !f.account_ifsc?.trim()) {
    showError(t('wallet.paymentMethods.fillRequired'))
    return
  }
  submitting.value = true
  try {
    if (bankEditing.value) {
      await api.wallet.updateBankAccount(bankEditing.value.id, f)
      showSuccess(t('wallet.paymentMethods.bankUpdated'))
    } else {
      await api.wallet.createBankAccount(f)
      showSuccess(t('wallet.paymentMethods.bankCreated'))
    }
    bankDialogOpen.value = false
    await fetchBankAccounts()
  } catch (e) {
    showError(e?.response?.data?.message || t('wallet.paymentMethods.requestFailed'))
  } finally {
    submitting.value = false
  }
}

async function submitUpi() {
  const f = upiForm.value
  if (!f.upi_id?.trim() || !f.holder_name?.trim()) {
    showError(t('wallet.paymentMethods.fillRequired'))
    return
  }
  submitting.value = true
  try {
    if (upiEditing.value) {
      await api.wallet.updateUpiAccount(upiEditing.value.id, f)
      showSuccess(t('wallet.paymentMethods.upiUpdated'))
    } else {
      await api.wallet.createUpiAccount(f)
      showSuccess(t('wallet.paymentMethods.upiCreated'))
    }
    upiDialogOpen.value = false
    await fetchUpiAccounts()
  } catch (e) {
    showError(e?.response?.data?.message || t('wallet.paymentMethods.requestFailed'))
  } finally {
    submitting.value = false
  }
}

async function submitCrypto() {
  const id = cryptoForm.value.crypto_currency_id != null ? Number(cryptoForm.value.crypto_currency_id) : null
  if (id == null || !cryptoForm.value.address?.trim()) {
    showError(t('wallet.paymentMethods.selectCurrencyAndAddress'))
    return
  }
  submitting.value = true
  const payload = { crypto_currency_id: id, address: cryptoForm.value.address.trim() }
  try {
    if (cryptoEditing.value) {
      await api.wallet.updateCryptoAccount(cryptoEditing.value.id, payload)
      showSuccess(t('wallet.paymentMethods.cryptoUpdated'))
    } else {
      await api.wallet.createCryptoAccount(payload)
      showSuccess(t('wallet.paymentMethods.cryptoCreated'))
    }
    cryptoDialogOpen.value = false
    await fetchCryptoAccounts()
  } catch (e) {
    showError(e?.response?.data?.message || t('wallet.paymentMethods.requestFailed'))
  } finally {
    submitting.value = false
  }
}

function openDeleteDialog(type, item) {
  const label = item.bank_name || item.upi_id || item.address
  deleteTarget.value = { type, id: item.id, label }
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  submitting.value = true
  try {
    if (deleteTarget.value.type === 'bank') await api.wallet.deleteBankAccount(deleteTarget.value.id)
    else if (deleteTarget.value.type === 'upi') await api.wallet.deleteUpiAccount(deleteTarget.value.id)
    else await api.wallet.deleteCryptoAccount(deleteTarget.value.id)
    showSuccess(t('wallet.paymentMethods.deleteSuccessGeneric'))
    deleteDialogOpen.value = false
    deleteTarget.value = null
    if (activeTab.value === 'bank') await fetchBankAccounts()
    else if (activeTab.value === 'upi') await fetchUpiAccounts()
    else await fetchCryptoAccounts()
  } catch (e) {
    showError(e?.response?.data?.message || 'Delete failed')
  } finally {
    submitting.value = false
  }
}

watch(activeTab, (tab) => {
  loadForTab(tab)
}, { immediate: true })
</script>

<style scoped>
.payment-methods-page {
  min-height: 100%;
}

.payment-methods-content {
  padding: 0 12px 16px;
}

.payment-methods-empty-title {
  color: #111111 !important;
}

.payment-methods-empty-text {
  color: #6b7280 !important;
}

.payment-methods-empty-icon {
  color: var(--color-header-bg, #360952) !important;
  opacity: 0.85;
}

.payment-methods-tabs {
  border-bottom: 1px solid #e5e7eb;
}

.payment-methods-tabs :deep(.v-tab) {
  color: #6b7280 !important;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-size: 0.75rem;
}

.payment-methods-tabs :deep(.v-tab--selected) {
  color: var(--color-header-bg, #360952) !important;
}

.payment-methods-tabs :deep(.v-tab__slider) {
  background-color: var(--color-header-bg, #360952) !important;
  height: 2px;
}

.payment-methods-btn-primary {
  background: linear-gradient(135deg, #921ada 0%, #8a19ce 50%, #471368 100%) !important;
  color: #ffffff !important;
  border: 0 !important;
  box-shadow: none !important;
  letter-spacing: 0.02em;
  text-transform: none;
  font-weight: 700;
}

.payment-methods-btn-primary :deep(.v-btn__content),
.payment-methods-btn-primary :deep(.v-icon) {
  color: #ffffff !important;
}

.payment-methods-btn-primary:hover {
  filter: brightness(1.05);
}

.payment-methods-btn-primary.v-btn--disabled {
  opacity: 0.55 !important;
}

.payment-methods-btn-primary--header {
  min-height: 28px !important;
  height: 28px !important;
  padding: 0 10px !important;
  font-size: 10px !important;
  border-radius: 6px !important;
}

.payment-methods-btn-primary--header :deep(.v-btn__overlay),
.payment-methods-btn-primary--header :deep(.v-btn__underlay) {
  opacity: 0 !important;
}

.payment-methods-btn-primary--header :deep(.v-icon) {
  font-size: 14px !important;
}

@media (max-width: 640px) {
  .payment-methods-btn-primary--header :deep(.v-btn__prepend) {
    display: none;
  }

  .payment-methods-btn-primary--header {
    padding: 0 8px !important;
  }
}
</style>

<style>
/* v-dialog content is teleported to <body>, so these rules must be unscoped */
.payment-methods-dialog .payment-methods-dialog-card {
  background: #ffffff !important;
  border: 1px solid var(--color-header-bg, #360952) !important;
  box-shadow: 0 18px 40px rgba(54, 9, 82, 0.28) !important;
  overflow: hidden;
  color: #111111 !important;
}

.payment-methods-dialog .payment-methods-dialog-title {
  background: var(--color-header-bg, #360952) !important;
  color: #ffffff !important;
  border-bottom: none;
  padding: 14px 20px !important;
  font-weight: 800 !important;
  font-size: 14px !important;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.payment-methods-dialog .payment-methods-dialog-body {
  background: #ffffff;
  color: #111111 !important;
}

.payment-methods-dialog .payment-methods-dialog-text {
  color: #6b7280 !important;
  font-size: 0.92rem;
}

.payment-methods-dialog .payment-methods-dialog-field .v-field {
  background: #ffffff !important;
  border-radius: 8px !important;
}

.payment-methods-dialog .payment-methods-dialog-field .v-field__outline {
  --v-field-border-width: 1.5px;
  --v-field-border-opacity: 1;
  color: #d1d5db !important;
}

.payment-methods-dialog .payment-methods-dialog-field .v-field--focused .v-field__outline {
  --v-field-border-width: 2px;
  color: var(--color-header-bg, #360952) !important;
}

.payment-methods-dialog .payment-methods-dialog-field .v-label,
.payment-methods-dialog .payment-methods-dialog-field .v-field-label {
  color: #6b7280 !important;
  opacity: 1 !important;
  font-weight: 600;
}

.payment-methods-dialog .payment-methods-dialog-field input,
.payment-methods-dialog .payment-methods-dialog-field .v-field__input {
  color: #111111 !important;
  -webkit-text-fill-color: #111111 !important;
  font-weight: 600;
}

.payment-methods-dialog .payment-methods-dialog-field .v-select__selection-text {
  color: #111111 !important;
  font-weight: 600;
}

.payment-methods-dialog .payment-methods-dialog-field .v-icon {
  color: #6b7280 !important;
}

.payment-methods-dialog .payment-methods-btn-primary {
  background: linear-gradient(135deg, #921ada 0%, #8a19ce 50%, #471368 100%) !important;
  color: #ffffff !important;
  border: 0 !important;
  box-shadow: none !important;
  letter-spacing: 0.02em;
  text-transform: none;
  font-weight: 700;
}

.payment-methods-dialog .payment-methods-btn-primary .v-btn__content,
.payment-methods-dialog .payment-methods-btn-primary .v-icon {
  color: #ffffff !important;
}

.payment-methods-dialog .payment-methods-btn-primary:hover {
  filter: brightness(1.05);
}

.payment-methods-dialog .payment-methods-btn-primary.v-btn--disabled {
  opacity: 0.55 !important;
}

.payment-methods-dialog .payment-methods-btn-cancel {
  color: #6b7280 !important;
  font-weight: 600;
  text-transform: none;
}

.payment-methods-dialog .payment-methods-btn-cancel .v-btn__content {
  color: #6b7280 !important;
}

.payment-methods-dialog .payment-methods-btn-delete {
  background: #dc2626 !important;
  color: #ffffff !important;
  border: 0 !important;
  text-transform: none;
  font-weight: 700;
}

.payment-methods-dialog .payment-methods-btn-delete .v-btn__content,
.payment-methods-dialog .payment-methods-btn-delete .v-icon {
  color: #ffffff !important;
}

.payment-methods-dialog .payment-methods-btn-delete:hover {
  background: #b91c1c !important;
}
</style>
