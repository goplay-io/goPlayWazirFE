<script setup>
import { computed, onMounted, ref } from 'vue'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import { cleanReferencePageHtml } from '@/utils/referencePageHtml'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  contentPath: {
    type: String,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  compactInset: {
    type: Number,
    default: 12,
  },
})

const rawContent = ref('')
const content = computed(() => cleanReferencePageHtml(rawContent.value))

const compactShellStyle = computed(() => {
  if (!props.compact) return undefined
  return { '--reference-shell-inset': `${props.compactInset}px` }
})

onMounted(async () => {
  const response = await fetch(props.contentPath)
  rawContent.value = await response.text()
})
</script>

<template>
  <div
    class="info-page account-page reference-info-page"
    :class="{ 'reference-info-page--compact': compact }"
    :style="compactShellStyle"
  >
    <AccountPageHeader :title="title" />
    <div class="info-page__shell">
      <div class="info-page__content reference-prose" v-html="content" />
    </div>
  </div>
</template>
