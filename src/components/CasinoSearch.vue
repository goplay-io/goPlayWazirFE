<template>
  <div
    class="casino-search-root tw-flex tw-min-w-0"
    :class="inline
      ? 'casino-search-root--inline tw-flex-none tw-w-auto tw-justify-end'
      : 'tw-w-full tw-justify-stretch'"
  >
    <div
      class="casino-search-inner tw-flex tw-w-full tw-min-w-0"
      :class="inline ? 'tw-max-w-none' : 'tw-max-w-none'"
    >
      <div class="casino-search-bar tw-flex tw-w-full tw-items-stretch">
        <span class="casino-search-bar__icon" aria-hidden="true">
          <SearchMagnify :size="24" :stroke-width="2" class="casino-search-bar__icon-svg" />
        </span>
        <input
          ref="desktopInput"
          type="text"
          autocomplete="off"
          :value="modelValue"
          :placeholder="placeholder || t('common.search')"
          class="casino-search-bar__input"
          @input="onInputNative"
          @keydown.escape.prevent="$emit('update:modelValue', '')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SearchMagnify from '@/components/Icons/SearchMagnify.vue'

const { t } = useI18n()

defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  inline: {
    type: Boolean,
    default: false
  },
  resultCount: {
    type: Number,
    default: null
  },
  games: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'game-selected'])
const desktopInput = ref(null)

let debounceTimer = null
const updateValue = (value) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:modelValue', value)
  }, 300)
}

const onInputNative = (e) => {
  updateValue(e?.target?.value ?? '')
}

</script>

<style scoped>
</style>
