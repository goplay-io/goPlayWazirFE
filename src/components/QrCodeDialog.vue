<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="360"
    persistent
    class="qr-dialog-rounded"
  >
    <v-card class="qr-dialog-card tw-rounded-2xl tw-overflow-hidden">
      <v-card-title class="tw-text-base tw-font-semibold tw-text-theme-text">
        {{ title }}
      </v-card-title>
      <v-card-text class="tw-flex tw-flex-col tw-items-center tw-pt-2 tw-pb-4">
        <div v-if="value" class="tw-p-4 tw-bg-white tw-rounded-xl tw-mb-3">
          <qrcode-vue
            :value="value"
            :size="200"
            level="H"
            render-as="svg"
            class="tw-block"
          />
        </div>
        <p v-if="value && showValue" class="tw-text-xs tw-text-theme-text-secondary tw-break-all tw-text-center tw-max-w-full">
          {{ value }}
        </p>
      </v-card-text>
      <v-card-actions class="tw-justify-end tw-px-4 tw-pb-4">
        <v-btn variant="tonal" @click="$emit('update:modelValue', false)">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import QrcodeVue from 'qrcode.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  value: { type: String, default: '' },
  title: { type: String, default: 'QR Code' },
  showValue: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.qr-dialog-card {
  border: 2px solid rgb(var(--v-theme-primary));
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: none;
}

.qr-dialog-rounded :deep(.v-overlay__content) {
  border-radius: 16px !important;
  overflow: hidden;
}

.qr-dialog-rounded :deep(.v-overlay__content > *) {
  border-radius: 16px !important;
  overflow: hidden;
  max-width: 100%;
}
</style>
