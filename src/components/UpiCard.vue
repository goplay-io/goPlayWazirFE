<template>
  <div
    class="upi-card tw-w-full tw-rounded-2xl tw-p-3 tw-relative tw-overflow-hidden tw-cursor-pointer tw-transition-all tw-duration-200 tw-flex tw-flex-col tw-gap-2"
    @click="onCardClick"
  >
    <div class="upi-card-bg tw-absolute tw-inset-0 tw-pointer-events-none" />

    <div class="tw-relative tw-z-10 tw-flex tw-items-center tw-gap-2 tw-min-w-0">
      <div class="upi-card-icon tw-shrink-0 tw-w-8 tw-h-8 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
        <v-icon color="primary" size="18">mdi-cash-fast</v-icon>
      </div>
      <div class="tw-min-w-0 tw-flex-1">
        <div class="tw-text-[10px] tw-font-medium tw-text-theme-text-secondary tw-uppercase tw-tracking-widest tw-mb-0.5">
          {{ t('components.upiCard.payTo') }}
        </div>
        <div class="tw-font-semibold tw-text-theme-text tw-text-base tw-tracking-tight tw-break-all tw-leading-snug">
          {{ account.upi_id || '—' }}
        </div>
      </div>
    </div>

    <div class="tw-relative tw-z-10 tw-flex tw-items-center tw-justify-between tw-gap-2 tw-pt-1.5 tw-border-t tw-border-theme-border/50">
      <div class="tw-flex tw-items-center tw-gap-2 tw-min-w-0 tw-flex-1">
        <v-icon size="16" class="tw-shrink-0 tw-text-theme-text-secondary">mdi-account-outline</v-icon>
        <span class="tw-text-sm tw-text-theme-text-secondary tw-truncate">{{ account.holder_name || '—' }}</span>
      </div>
      <div class="upi-card-actions tw-shrink-0 tw-opacity-0 tw-transition-opacity tw-duration-200 tw-flex tw-gap-1">
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
    <QrCodeDialog v-model="qrDialogOpen" :value="upiQrValue" :title="t('components.upiCard.qrTitle')" :show-value="true" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import QrCodeDialog from '@/components/QrCodeDialog.vue'

const props = defineProps({
  account: { type: Object, required: true },
})

const emit = defineEmits(['edit', 'delete', 'cardClick'])

const qrDialogOpen = ref(false)

const { t } = useI18n()

const upiQrValue = computed(() => {
  const pa = props.account?.upi_id ?? ''
  const pn = encodeURIComponent(props.account?.holder_name ?? '')
  if (!pa) return ''
  return pn ? `upi://pay?pa=${pa}&pn=${pn}` : `upi://pay?pa=${pa}`
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
.upi-card {
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  border: 2px solid #8a19ce;
  box-shadow: 0 10px 30px rgba(54, 9, 82, 0.12), 0 4px 15px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(10px);
  transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
}

.upi-card::before {
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

.upi-card:hover {
  border-color: #360952;
  box-shadow: 0 20px 40px rgba(54, 9, 82, 0.2), 0 8px 25px rgba(15, 23, 42, 0.1);
}

.upi-card-bg {
  background: transparent;
}

.upi-card-icon {
  background: rgba(138, 25, 206, 0.15);
  border: 1px solid rgba(138, 25, 206, 0.4);
}

.upi-card :deep(.tw-text-theme-text) {
  color: #1f2937 !important;
}

.upi-card :deep(.tw-text-theme-text-secondary) {
  color: #6b7280 !important;
}

.upi-card :deep(.upi-card-icon .v-icon) {
  color: #8a19ce !important;
}

.upi-card :deep(.upi-card-actions .v-btn) {
  background: rgba(138, 25, 206, 0.12) !important;
  border: 1.5px solid #8a19ce !important;
}

.upi-card :deep(.upi-card-actions .v-btn .v-icon) {
  color: #8a19ce !important;
}

.upi-card :deep(.upi-card-actions .v-btn--color-error) {
  background: rgba(220, 38, 38, 0.10) !important;
  border-color: #dc2626 !important;
}

.upi-card :deep(.upi-card-actions .v-btn--color-error .v-icon) {
  color: #dc2626 !important;
}

.upi-card:hover .upi-card-actions,
.upi-card-actions:focus-within {
  opacity: 1;
}

.upi-card-actions {
  pointer-events: none;
}

.upi-card:hover .upi-card-actions,
.upi-card-actions:focus-within {
  pointer-events: auto;
}
</style>
