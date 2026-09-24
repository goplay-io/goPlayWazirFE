<template>
  <div
    class="crypto-card tw-w-full tw-rounded-2xl tw-p-3 tw-relative tw-overflow-hidden tw-cursor-pointer tw-transition-all tw-duration-200 tw-flex tw-flex-col tw-gap-2"
    @click="onCardClick"
  >
    <div class="crypto-card-bg tw-absolute tw-inset-0 tw-pointer-events-none" />

    <div class="tw-relative tw-z-10 tw-flex tw-items-center tw-gap-2 tw-min-w-0">
      <div class="crypto-card-icon tw-shrink-0 tw-w-8 tw-h-8 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-overflow-hidden">
        <component
          v-if="CryptoIcon"
          :is="CryptoIcon"
          :size="24"
        />
        <v-icon v-else color="primary" size="18">mdi-currency-btc</v-icon>
      </div>
      <div class="tw-min-w-0 tw-flex-1">
        <div class="tw-text-[10px] tw-font-medium tw-text-theme-text-secondary tw-uppercase tw-tracking-widest tw-mb-0.5">
          {{ t('components.cryptoCard.wallet') }}
        </div>
        <div class="tw-font-semibold tw-text-theme-text tw-text-base tw-tracking-tight tw-truncate">
          {{ account.currencyName || '—' }}
        </div>
      </div>
    </div>

    <div class="tw-relative tw-z-10 tw-flex tw-items-center tw-justify-between tw-gap-2 tw-pt-1.5 tw-border-t tw-border-theme-border/50">
      <div class="tw-flex tw-items-center tw-gap-2 tw-min-w-0 tw-flex-1 tw-font-mono tw-text-xs tw-text-theme-text-secondary tw-truncate">
        <v-icon size="14" class="tw-shrink-0 tw-text-theme-text-secondary">mdi-wallet-outline</v-icon>
        <span class="tw-truncate">{{ formattedAddress }}</span>
      </div>
      <div class="crypto-card-actions tw-shrink-0 tw-opacity-0 tw-transition-opacity tw-duration-200 tw-flex tw-gap-1">
        <v-btn icon size="small" variant="tonal" color="primary" @click.stop="onQrClick">
          <v-icon size="18">mdi-qrcode</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="tonal" color="primary" @click.stop="onEdit">
          <v-icon size="18">mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="tonal" color="error" @click.stop="onDelete">
          <v-icon size="18">mdi-delete</v-icon>
        </v-btn>
      </div>
    </div>
    <QrCodeDialog v-model="qrDialogOpen" :value="account.address" :title="t('components.cryptoCard.addressTitle', { currency: account.currencyName || t('components.cryptoCard.wallet') })" :show-value="true" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCrypto } from '@/composables/useCrypto'
import QrCodeDialog from '@/components/QrCodeDialog.vue'

const props = defineProps({
  account: { type: Object, required: true },
})

const emit = defineEmits(['edit', 'delete', 'cardClick'])

const qrDialogOpen = ref(false)

const { getIconByName } = useCrypto()

const CryptoIcon = computed(() => getIconByName(props.account?.currencyName))

const { t } = useI18n()

const formattedAddress = computed(() => {
  const addr = String(props.account?.address ?? '')
  if (!addr) return '—'
  if (addr.length <= 10) return addr
  return '*'.repeat(addr.length - 10) + addr.slice(-10)
})

function onQrClick() {
  qrDialogOpen.value = true
}
function onEdit() {
  emit('edit')
}
function onDelete() {
  emit('delete')
}
function onCardClick() {
  emit('cardClick')
}
</script>

<style scoped>
.crypto-card {
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  border: 2px solid #8a19ce;
  box-shadow: 0 10px 30px rgba(54, 9, 82, 0.12), 0 4px 15px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(10px);
  transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
}

.crypto-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(138, 25, 206, 0.10) 0%,
    rgba(54, 9, 82, 0.04) 100%
  );
  border-radius: inherit;
  pointer-events: none;
  z-index: 1;
}

.crypto-card:hover {
  border-color: #360952;
  box-shadow: 0 20px 40px rgba(54, 9, 82, 0.2), 0 8px 25px rgba(15, 23, 42, 0.1);
}

.crypto-card-bg {
  background: transparent;
}

.crypto-card-icon {
  background: rgba(138, 25, 206, 0.15);
  border: 1px solid rgba(138, 25, 206, 0.4);
}

.crypto-card :deep(.tw-text-theme-text) {
  color: #1f2937 !important;
}

.crypto-card :deep(.tw-text-theme-text-secondary) {
  color: #6b7280 !important;
}

.crypto-card :deep(.crypto-card-icon .v-icon) {
  color: #8a19ce !important;
}

.crypto-card :deep(.crypto-card-actions .v-btn) {
  background: rgba(138, 25, 206, 0.12) !important;
  border: 1.5px solid #8a19ce !important;
}

.crypto-card :deep(.crypto-card-actions .v-btn .v-icon) {
  color: #8a19ce !important;
}

.crypto-card :deep(.crypto-card-actions .v-btn--color-error) {
  background: rgba(220, 38, 38, 0.10) !important;
  border-color: #dc2626 !important;
}

.crypto-card :deep(.crypto-card-actions .v-btn--color-error .v-icon) {
  color: #dc2626 !important;
}

.crypto-card:hover .crypto-card-actions,
.crypto-card-actions:focus-within {
  opacity: 1;
}

.crypto-card-actions {
  pointer-events: none;
}

.crypto-card:hover .crypto-card-actions,
.crypto-card-actions:focus-within {
  pointer-events: auto;
}
</style>
