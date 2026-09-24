<template>
  <div
    class="deposit-request-box tw-relative tw-p-4 sm:tw-p-4 tw-overflow-hidden tw-transition-all tw-duration-300">
    <div v-if="optionsLoading" class="deposit-request-box__empty">
      {{ t('common.loading') }}
    </div>
    <div v-else-if="!hasAvailableOptions" class="deposit-request-box__empty">
      No payment options available
    </div>
    <div v-else class="deposit-request-box__actions">
      <button v-if="canShowBankDeposit" type="button" class="deposit-request-option" @click="showBankDialog = true">
        <span class="deposit-request-option__icon">
          <BankDepositIcon :size="optionIconSize" color="var(--color-header-bg, #360952)" />
        </span>
        <span class="deposit-request-option__label">{{ t('wallet.deposit.bankDeposit') }}</span>
        <v-icon :size="chevronIconSize" class="deposit-request-option__chevron">mdi-chevron-right</v-icon>
      </button>
      <button v-if="canShowUpiDeposit" type="button" class="deposit-request-option" @click="showUpiDialog = true">
        <span class="deposit-request-option__icon">
          <UpiIcon :size="optionIconSize" />
        </span>
        <span class="deposit-request-option__label">{{ t('wallet.deposit.upi') }}</span>
        <v-icon :size="chevronIconSize" class="deposit-request-option__chevron">mdi-chevron-right</v-icon>
      </button>
      <button v-if="canShowCryptoDeposit" type="button" class="deposit-request-option" @click="showCryptoDialog = true">
        <span class="deposit-request-option__icon deposit-request-option__icon--crypto">
          <transition name="crypto-icon-swipe">
            <component v-if="currentCryptoIcon" :is="currentCryptoIcon" :key="currentCryptoType" :size="optionIconSize" />
            <v-icon v-else key="fallback" :size="optionIconSize">mdi-currency-btc</v-icon>
          </transition>
        </span>
        <span class="deposit-request-option__label">{{ t('wallet.deposit.crypto') }}</span>
        <v-icon :size="chevronIconSize" class="deposit-request-option__chevron">mdi-chevron-right</v-icon>
      </button>
      <button
        v-if="canShowWhatsappDeposit"
        type="button"
        class="deposit-request-option"
        @click="openWhatsApp">
        <span class="deposit-request-option__icon">
          <WhatsAppIcon :size="optionIconSize" />
        </span>
        <span class="deposit-request-option__label">{{ t('wallet.deposit.whatsapp') }}</span>
        <v-icon :size="chevronIconSize" class="deposit-request-option__chevron">mdi-open-in-new</v-icon>
      </button>
    </div>

    <BankDepositDialog v-model="showBankDialog" @request-created="handleRequestCreated" />
    <UpiDepositDialog v-model="showUpiDialog" @request-created="handleRequestCreated" />
    <CryptoDepositDialog v-model="showCryptoDialog" @request-created="handleRequestCreated" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import BankDepositIcon from '@/components/Icons/BankDepositIcon.vue'
import UpiIcon from '@/components/Icons/UpiIcon.vue'
import WhatsAppIcon from '@/components/Icons/WhatsAppIcon.vue'
import BankDepositDialog from './BankDepositDialog.vue'
import UpiDepositDialog from './UpiDepositDialog.vue'
import CryptoDepositDialog from './CryptoDepositDialog.vue'
import { useCrypto } from '@/composables/useCrypto.js'
import useDevices from '@/composables/useDevices.js'
import { getParentPaymentOptions } from '@/api/wallet/paymentMethods.js'
import { getParentWhatsappNumber } from '@/api/wallet/wallet.js'

const { t } = useI18n()
const { isMobile } = useDevices()
const optionIconSize = computed(() => (isMobile.value ? 20 : 26))
const chevronIconSize = computed(() => (isMobile.value ? 14 : 18))

const emit = defineEmits(['request-created'])

const { getIconByName } = useCrypto()

const showBankDialog = ref(false)
const showUpiDialog = ref(false)
const showCryptoDialog = ref(false)

const parentCryptoTypes = ref([])
const cryptoIconIndex = ref(0)
const cryptoRotateInterval = ref(null)
const optionsLoading = ref(true)
const paymentOptions = ref({
  bank: false,
  upi: false,
  crypto: false
})
const whatsAppDepositUrl = ref('')

const canShowBankDeposit = computed(() => Boolean(paymentOptions.value.bank))
const canShowUpiDeposit = computed(() => Boolean(paymentOptions.value.upi))
const canShowCryptoDeposit = computed(() => Boolean(paymentOptions.value.crypto))
const canShowWhatsappDeposit = computed(() => Boolean(whatsAppDepositUrl.value))
const hasAvailableOptions = computed(() =>
  canShowBankDeposit.value ||
  canShowUpiDeposit.value ||
  canShowCryptoDeposit.value ||
  canShowWhatsappDeposit.value
)

const currentCryptoType = computed(() => {
  const types = parentCryptoTypes.value
  if (!types.length) return null
  return types[cryptoIconIndex.value % types.length]
})

const currentCryptoIcon = computed(() => {
  const name = currentCryptoType.value
  return name ? getIconByName(name) : null
})

async function loadParentPaymentOptions() {
  optionsLoading.value = true
  try {
    const res = await getParentPaymentOptions('deposit')
    const data = res?.data?.data ?? res?.data ?? {}
    paymentOptions.value = {
      bank: Boolean(data?.available?.bank),
      upi: Boolean(data?.available?.upi),
      crypto: Boolean(data?.available?.crypto)
    }
    const types = Array.isArray(data?.crypto_options)
      ? data.crypto_options.map(option => option.name).filter(Boolean)
      : []
    parentCryptoTypes.value = types
    cryptoIconIndex.value = 0
  } catch (e) {
    console.error('Failed to load parent payment options:', e)
    paymentOptions.value = { bank: false, upi: false, crypto: false }
    parentCryptoTypes.value = []
  } finally {
    optionsLoading.value = false
  }
}

async function loadWhatsappNumber() {
  try {
    const res = await getParentWhatsappNumber()
    const data = res?.data?.data ?? res?.data ?? {}
    const raw = data?.whatsapp_number
    const digits = typeof raw === 'string' ? raw.replace(/\D/g, '') : ''
    whatsAppDepositUrl.value = digits ? `https://wa.me/${digits}` : ''
  } catch (e) {
    console.error('Failed to load parent WhatsApp number:', e)
    whatsAppDepositUrl.value = ''
  }
}

function startCryptoIconRotation() {
  stopCryptoIconRotation()
  if (parentCryptoTypes.value.length <= 1) return
  cryptoRotateInterval.value = setInterval(() => {
    cryptoIconIndex.value = (cryptoIconIndex.value + 1) % parentCryptoTypes.value.length
  }, 5000)
}

function stopCryptoIconRotation() {
  if (cryptoRotateInterval.value) {
    clearInterval(cryptoRotateInterval.value)
    cryptoRotateInterval.value = null
  }
}

onMounted(() => {
  Promise.all([loadParentPaymentOptions(), loadWhatsappNumber()]).then(() => {
    startCryptoIconRotation()
  })
})

onUnmounted(() => {
  stopCryptoIconRotation()
})

const WHATSAPP_URL_PATTERN = /^https:\/\/wa\.me\/\d{7,15}$/

function openWhatsApp() {
  const url = whatsAppDepositUrl.value
  if (url && WHATSAPP_URL_PATTERN.test(url)) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

const handleRequestCreated = (requestData) => {
  emit('request-created', requestData)
}
</script>

<style scoped>
.deposit-request-box__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.deposit-request-box__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 3.25rem;
  color: var(--color-text);
  font-size: 0.875rem;
}

.deposit-request-box {
  background: #ffffff !important;
  border: 1px solid var(--color-header-bg, #360952) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
}

.deposit-request-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  color: #111111;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  transition: border-color 0.25s ease, background 0.25s ease;
  text-align: left;
  outline: none;
}

.deposit-request-option:hover {
  border-color: var(--color-header-bg, #360952);
  background: #f3e8ff;
}

.deposit-request-option:active {
  border-color: #8a19ce;
}

.deposit-request-option:focus-visible {
  outline: 2px solid var(--color-header-bg, #360952);
  outline-offset: 2px;
}

.deposit-request-option--disabled,
.deposit-request-option:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.deposit-request-option__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0;
  background: transparent;
  color: var(--color-header-bg, #360952);
}

.deposit-request-option__label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.deposit-request-option__chevron {
  color: #9ca3af;
  flex-shrink: 0;
  transition: color 0.2s ease, transform 0.2s ease;
}

.deposit-request-option:hover .deposit-request-option__chevron {
  color: var(--color-header-bg, #360952);
  transform: translateX(2px);
}

.deposit-request-option__icon--crypto {
  width: 2.25rem;
  height: 2.25rem;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.deposit-request-option__icon--crypto > * {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  flex-shrink: 0;
}

.crypto-icon-swipe-enter-active,
.crypto-icon-swipe-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.crypto-icon-swipe-leave-active {
  position: absolute;
  top: 50%;
  left: 50%;
}
.crypto-icon-swipe-leave-from {
  transform: translate(-50%, -50%) translateX(0);
}
.crypto-icon-swipe-leave-to {
  transform: translate(-50%, -50%) translateX(-100%);
}

.crypto-icon-swipe-enter-from {
  transform: translate(-50%, -50%) translateX(100%);
}
.crypto-icon-swipe-enter-to {
  transform: translate(-50%, -50%) translateX(0);
}

@media (max-width: 768px) {
  .deposit-request-box {
    padding: 0.75rem !important;
  }

  .deposit-request-box__actions {
    gap: 0.375rem;
  }

  .deposit-request-option {
    gap: 0.375rem;
    padding: 0.5rem 0.4375rem;
    font-size: 0.6875rem;
    min-width: 0;
  }

  .deposit-request-option__icon,
  .deposit-request-option__icon--crypto {
    width: 1.5rem;
    height: 1.5rem;
  }
}
</style>
