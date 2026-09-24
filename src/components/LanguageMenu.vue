<template>
  <v-card class="tw-bg-theme-surface tw-border tw-border-primary tw-mr-9 md:tw-ml-7 tw-rounded-xl" style="border-radius:12px; overflow:hidden;">
    <v-card-text class="tw-px-3 tw-py-2">
      <div class="tw-font-semibold tw-text-xs tw-text-theme-text tw-mb-2">
        {{ t('components.header.language') }}
      </div>
      
      <div class="tw-flex tw-flex-col tw-gap-2 locale-list">
        <button
          v-for="lang in locales"
          :key="lang.code"
          role="menuitemradio"
          :aria-checked="isSelected(lang.code)"
          :aria-label="lang.value"
          class="tw-border-none tw-cursor-pointer tw-text-sm tw-font-semibold tw-rounded-lg tw-transition-all tw-w-full tw-flex tw-items-center tw-justify-between"
          :class="[
            isSelected(lang.code) 
              ? 'tw-bg-gradient-to-br tw-from-[#34d77e] tw-to-[#148154] tw-text-white tw-shadow-[0_8px_24px_rgba(20,129,84,0.18)] tw-px-3.5 tw-py-2 tw-min-h-[40px] tw-rounded-xl' 
              : 'tw-bg-[rgba(255,255,255,0.02)] tw-text-theme-text tw-px-3 tw-py-1.5 tw-min-h-[36px] hover:tw-bg-gradient-to-br hover:tw-from-[#34d77e] hover:tw-to-[#148154] hover:tw-text-white'
          ]"
          @click="selectLanguage(lang.code)"
        >
          <span>{{ lang.value }}</span>
          <v-icon v-if="isSelected(lang.code)" size="18" class="tw-text-white">
            mdi-check
          </v-icon>
        </button>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AVAILABLE_LOCALES } from '@/constants/locales.js'

const LOCALE_STORAGE_KEY = 'locale'

const props = defineProps({
  availableLocales: {
    type: Array,
    default: () => AVAILABLE_LOCALES
  }
})

const emit = defineEmits(['select'])
const { t, locale } = useI18n()
const locales = computed(() => props.availableLocales)

const selectedCode = ref(locale.value || '')

onMounted(() => {
  initializeLocale()
})

function initializeLocale() {
  try {
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
    
    if (storedLocale && isValidLocale(storedLocale)) {
      updateLocale(storedLocale)
    } else if (locale.value) {
      selectedCode.value = locale.value
    }
  } catch (error) {
    console.warn('Failed to load locale from localStorage:', error)
  }
}

function selectLanguage(code) {
  updateLocale(code)
  persistLocale(code)
  emit('select', code)
}

function updateLocale(code) {
  locale.value = code
  selectedCode.value = code
}

function persistLocale(code) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, code)
  } catch (error) {
    console.error('Failed to persist locale to localStorage:', error)
  }
}

function isValidLocale(code) {
  return locales.value.some(lang => lang.code === code)
}

function isSelected(code) {
  return selectedCode.value === code
}
</script>

<style scoped>
.locale-list {
  max-height: 220px; /* approx. 5 items at ~40px each */
  overflow-y: auto;
  padding-right: 6px; /* avoid content under scrollbar */
}

.locale-list::-webkit-scrollbar {
  width: 6px;
}

.locale-list::-webkit-scrollbar-thumb {
  background: rgba(58,112,100,0.6);
  border-radius: 3px;
}
</style>