<template>
  <div
    class="casino-search-root tw-flex tw-min-w-0 tw-justify-end"
    :class="inline
      ? 'casino-search-root--inline tw-flex-none tw-w-auto'
      : 'tw-flex-1 max-md:tw-w-full max-md:tw-flex-initial md:tw-flex-initial'"
  >
    <div
      class="casino-search-inner tw-flex tw-w-full tw-min-w-[120px]"
      :class="inline ? 'tw-max-w-none' : 'tw-max-w-sm max-md:tw-max-w-none md:tw-max-w-sm'"
    >
      <div class="casino-search-bar tw-flex tw-w-full tw-items-stretch">
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
