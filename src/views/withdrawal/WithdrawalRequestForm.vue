<template>
  <div
    class="deposit-request-box tw-relative tw-p-4 sm:tw-p-4 tw-overflow-hidden tw-transition-all tw-duration-300">
    <div class="deposit-request-box__actions">
      <button type="button" class="deposit-request-option" @click="showBankDialog = true">
        <span class="deposit-request-option__icon">
          <BankDepositIcon :size="optionIconSize" color="var(--color-header-bg, #360952)" />
        </span>
        <span class="deposit-request-option__label">{{ t('wallet.withdrawal.bank') }}</span>
        <v-icon :size="chevronIconSize" class="deposit-request-option__chevron">mdi-chevron-right</v-icon>
      </button>
      <button type="button" class="deposit-request-option" @click="showCryptoDialog = true">
        <span class="deposit-request-option__icon">
          <UsdtIcon :size="optionIconSize" />
        </span>
        <span class="deposit-request-option__label">{{ t('wallet.withdrawal.crypto') }}</span>
        <v-icon :size="chevronIconSize" class="deposit-request-option__chevron">mdi-chevron-right</v-icon>
      </button>
    </div>

    <BankWithdrawalDialog v-model="showBankDialog" @request-created="handleRequestCreated" />
    <CryptoWithdrawalDialog v-model="showCryptoDialog" @request-created="handleRequestCreated" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BankDepositIcon from '@/components/Icons/BankDepositIcon.vue'
import UsdtIcon from '@/components/Icons/UsdtIcon.vue'
import BankWithdrawalDialog from './BankWithdrawalDialog.vue'
import CryptoWithdrawalDialog from './CryptoWithdrawalDialog.vue'
import useDevices from '@/composables/useDevices.js'

const emit = defineEmits(['request-created'])

const showBankDialog = ref(false)
const showCryptoDialog = ref(false)

const { t } = useI18n()
const { isMobile } = useDevices()
const optionIconSize = computed(() => (isMobile.value ? 20 : 26))
const chevronIconSize = computed(() => (isMobile.value ? 14 : 18))

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

  .deposit-request-option__icon {
    width: 1.5rem;
    height: 1.5rem;
  }
}
</style>
