<template>
  <div
    class="bank-card tw-w-full tw-min-h-[200px] sm:tw-aspect-[1.6/1] sm:tw-min-h-0 tw-rounded-2xl tw-p-4 sm:tw-p-6 tw-relative tw-overflow-hidden tw-cursor-pointer tw-transition-all tw-duration-300 hover:tw-scale-[1.02] hover:tw-shadow-xl"
    @click="onCardClick"
  >
    <div class="bank-card-pattern tw-absolute tw-inset-0 tw-pointer-events-none tw-select-none">
      <svg width="100%" height="100%" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" class="tw-absolute tw-inset-0 tw-w-full tw-h-full">
        <defs>
          <pattern id="bank-card-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" stroke-opacity="0.08" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="320" height="200" fill="url(#bank-card-grid)" />
      </svg>
      <div class="tw-absolute tw-top-8 tw-left-1/2 tw-w-32 tw-h-16 tw-bg-primary tw-opacity-10 tw-blur-2xl tw-rounded-full tw--translate-x-1/2"></div>
      <div class="tw-absolute tw-bottom-0 tw-right-0 tw-w-24 tw-h-24 tw-bg-primary tw-opacity-5 tw-rounded-full tw-translate-x-8 tw-translate-y-8"></div>
    </div>

    <div class="bank-card-content tw-relative tw-z-10 tw-h-full tw-flex tw-flex-col tw-text-theme-text tw-min-h-0">
      <div class="tw-flex tw-items-start tw-justify-between tw-gap-2 tw-min-w-0">
        <div class="tw-font-semibold tw-text-theme-text tw-text-xs sm:tw-text-sm tw-truncate tw-min-w-0">
          {{ account.bank_name || t('components.bankCard.bankNameFallback') }}
        </div>
        <div v-if="account.status" class="tw-shrink-0">
          <v-chip
            :color="statusChipColor"
            variant="flat"
            size="x-small"
            density="compact"
            class="tw-shadow-sm sm:tw-text-xs"
          >
            {{ (account.status || '').replace('_', ' ') }}
          </v-chip>
        </div>
      </div>

      <div class="tw-mt-auto tw-pt-2 sm:tw-pt-4 tw-min-w-0 tw-flex tw-flex-col tw-gap-0.5 sm:tw-gap-0">
        <div class="tw-font-mono tw-text-sm sm:tw-text-base tw-tracking-wide sm:tw-tracking-widest tw-text-theme-text tw-font-semibold tw-mb-1 sm:tw-mb-4 tw-truncate">
          {{ formattedCardNumber }}
        </div>
        <div class="tw-flex tw-items-end tw-justify-between tw-gap-2 tw-min-w-0">
          <div class="tw-min-w-0 tw-flex-1 tw-overflow-hidden">
            <div class="tw-text-[10px] sm:tw-text-xs tw-text-theme-text-secondary tw-uppercase tw-tracking-wider tw-mb-0.5">
              {{ t('components.bankCard.cardHolderLabel') }}
            </div>
            <div class="tw-font-semibold tw-text-theme-text tw-text-xs sm:tw-text-sm tw-truncate">
              {{ account.holder_name || t('components.bankCard.holderNameFallback') }}
            </div>
            <div v-if="account.account_ifsc" class="tw-mt-0.5 sm:tw-mt-1 tw-text-[10px] sm:tw-text-xs tw-text-theme-text-secondary tw-truncate">
              {{ t('components.bankCard.ifscLabel') }}: {{ account.account_ifsc }}
            </div>
          </div>
          <div class="bank-card-actions tw-shrink-0 tw-opacity-100 sm:tw-opacity-0 tw-transition-opacity tw-duration-300 tw-flex tw-gap-1">
            <v-btn
              icon
              size="small"
              variant="tonal"
              color="primary"
              @click.stop="onEdit"
            >
              <v-icon size="18">mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              icon
              size="small"
              variant="tonal"
              color="error"
              @click.stop="onDelete"
            >
              <v-icon size="18">mdi-delete</v-icon>
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  account: { type: Object, required: true },
})

const emit = defineEmits(['edit', 'delete', 'cardClick'])

const formattedCardNumber = computed(() => {
  const str = String(props.account?.account_number ?? '')
  const lastFour = str.slice(-4).padStart(4, '•')
  const masked = '•••• •••• ••••'
  return `${masked} ${lastFour}`
})

const statusChipColor = computed(() => {
  if (props.account.status === 'active') return 'success'
  if (props.account.status === 'suspended') return 'error'
  return 'warning'
})

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
.bank-card {
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  border: 2px solid #8a19ce;
  box-shadow: 0 10px 30px rgba(54, 9, 82, 0.12), 0 4px 15px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(10px);
  transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
}

.bank-card::before {
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

.bank-card:hover {
  border-color: #360952;
  box-shadow: 0 20px 40px rgba(54, 9, 82, 0.2), 0 8px 25px rgba(15, 23, 42, 0.1);
}

.bank-card-pattern {
  color: #8a19ce;
}

.bank-card :deep(.tw-text-theme-text) {
  color: #1f2937 !important;
}

.bank-card :deep(.tw-text-theme-text-secondary) {
  color: #6b7280 !important;
}

.bank-card :deep(.bank-card-actions .v-btn) {
  background: rgba(138, 25, 206, 0.12) !important;
  border: 1.5px solid #8a19ce !important;
}

.bank-card :deep(.bank-card-actions .v-btn .v-icon) {
  color: #8a19ce !important;
}

.bank-card :deep(.bank-card-actions .v-btn--color-error) {
  background: rgba(220, 38, 38, 0.10) !important;
  border-color: #dc2626 !important;
}

.bank-card :deep(.bank-card-actions .v-btn--color-error .v-icon) {
  color: #dc2626 !important;
}

.bank-card-actions {
  pointer-events: auto;
}

@media (min-width: 640px) {
  .bank-card-actions {
    pointer-events: none;
  }
  .bank-card:hover .bank-card-actions,
  .bank-card-actions:focus-within {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
