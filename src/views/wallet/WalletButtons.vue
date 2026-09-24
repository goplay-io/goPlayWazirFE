<template>
  <div class="wallet-page-actions">
    <v-btn
      variant="flat"
      size="small"
      class="wallet-page-actions__btn"
      @click="$router.push('/deposit')"
    >
      <v-icon size="14" class="tw-mr-1">mdi-plus-circle-outline</v-icon>
      {{ t('wallet.deposit.title') }}
    </v-btn>
    <v-btn
      variant="flat"
      size="small"
      class="wallet-page-actions__btn"
      @click="$router.push('/withdrawal')"
    >
      <v-icon size="14" class="tw-mr-1">mdi-bank-outline</v-icon>
      {{ t('wallet.withdrawal.title') }}
    </v-btn>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.wallet-page-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.wallet-page-actions__btn {
  min-height: 28px !important;
  min-width: 0 !important;
  padding: 0 10px !important;
  border: 1px solid rgba(255, 255, 255, 0.65) !important;
  border-radius: 6px !important;
  background: transparent !important;
  color: #ffffff !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  letter-spacing: 0;
  text-transform: none !important;
  box-shadow: none !important;
}

.wallet-page-actions__btn :deep(.v-btn__content),
.wallet-page-actions__btn :deep(.v-icon) {
  color: #ffffff !important;
}

.wallet-page-actions__btn:hover {
  background: rgba(255, 255, 255, 0.12) !important;
}

@media (min-width: 768px) {
  .wallet-page-actions__btn {
    min-height: 32px !important;
    padding: 0 14px !important;
    font-size: 13px !important;
  }
}
</style>
