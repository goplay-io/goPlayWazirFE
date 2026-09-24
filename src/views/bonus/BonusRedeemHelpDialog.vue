<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
    transition="dialog-transition"
    content-class="bonus-redeem-help-dialog"
  >
    <v-card class="account-help-dialog-card">
      <v-card-title class="tw-flex tw-items-center tw-justify-between account-help-dialog-title">
        <span class="tw-text-base tw-font-bold tw-tracking-wide">{{ t('bonus.statement.redeemHelpTitle') }}</span>
        <v-btn
          icon
          variant="text"
          size="small"
          class="account-help-dialog-close-btn"
          @click="$emit('update:modelValue', false)"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text class="tw-pt-4 tw-pb-2 tw-space-y-4 account-help-dialog-body">
        <p class="tw-text-sm tw-leading-relaxed account-help-dialog-text">
          {{ t('bonus.statement.redeemHelpIntro') }}
        </p>
        <ol class="tw-list-decimal tw-list-inside tw-space-y-2 tw-text-sm tw-pl-1 account-help-dialog-text">
          <li>{{ t('bonus.statement.redeemHelpStep1') }}</li>
          <li>{{ t('bonus.statement.redeemHelpStep2') }}</li>
          <li>{{ t('bonus.statement.redeemHelpStep3') }}</li>
          <li>{{ t('bonus.statement.redeemHelpStep4') }}</li>
        </ol>
        <p class="tw-text-sm tw-leading-relaxed account-help-dialog-note">
          {{ t('bonus.statement.redeemHelpNote') }}
        </p>
      </v-card-text>
      <v-card-actions class="tw-justify-end tw-px-4 tw-pb-4 account-help-dialog-actions">
        <v-btn
          variant="elevated"
          class="tw-font-bold account-help-dialog-btn"
          @click="$emit('update:modelValue', false)"
        >
          {{ t('common.gotIt') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])

const { t } = useI18n()
</script>
