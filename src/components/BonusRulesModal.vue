<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="560"
    transition="dialog-transition"
    content-class="bonus-rules-dialog-wrapper"
    scrollable
  >
    <v-card class="account-help-dialog-card">
      <v-card-title class="tw-flex tw-items-center tw-justify-between account-help-dialog-title">
        <span class="tw-text-base tw-font-bold tw-tracking-wide">{{ t('bonus.rules.title') }}</span>
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

      <v-card-text class="tw-pt-4 tw-pb-2 account-help-dialog-body">
        <div v-if="loading" class="tw-flex tw-justify-center tw-py-8">
          <v-progress-circular indeterminate color="#360952" size="36" />
        </div>

        <div
          v-else-if="rulesHtml"
          class="account-help-dialog-content"
          v-html="sanitizedHtml"
        />

        <div v-else class="tw-space-y-4">
          <p class="tw-text-sm tw-leading-relaxed account-help-dialog-text">
            {{ t('bonus.rules.intro') }}
          </p>
          <ol class="tw-list-decimal tw-list-inside tw-space-y-2 tw-text-sm tw-pl-1 account-help-dialog-text">
            <li v-for="(rule, index) in ruleItems" :key="index">{{ rule }}</li>
          </ol>
          <p class="tw-text-sm tw-leading-relaxed account-help-dialog-note">
            {{ t('bonus.rules.note') }}
          </p>
        </div>
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
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DOMPurify from 'dompurify'
import { getBonusRules } from '@/api/wallet/wallet'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])

const { t, tm } = useI18n()

const loading = ref(false)
const rulesHtml = ref('')

const ruleItems = computed(() => {
  const items = tm('bonus.rules.items')
  return Array.isArray(items) ? items : []
})

const sanitizedHtml = computed(() => DOMPurify.sanitize(rulesHtml.value || ''))

async function fetchRules() {
  loading.value = true
  rulesHtml.value = ''

  try {
    const response = await getBonusRules()
    const data = response?.data ?? response
    const html = data?.content ?? data?.html ?? data?.rules ?? (typeof data === 'string' ? data : '')

    if (typeof html === 'string' && html.trim()) {
      rulesHtml.value = html
    }
  } catch {
    // Fall back to localized static rules copy.
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      fetchRules()
    }
  },
)
</script>
