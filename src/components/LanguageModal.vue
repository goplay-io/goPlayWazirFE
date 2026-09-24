<template>
  <div
    class="lang-modal-overlay"
    @click.self="close"
  >
    <div class="lang-modal">
      <div class="lang-modal__header">
        <div class="lang-modal__header-left">
          <v-icon size="18" class="lang-modal__header-icon">mdi-translate</v-icon>
          <span class="lang-modal__title">{{ t('components.sidebar.selectlanguage') }}</span>
        </div>
        <button
          type="button"
          class="lang-modal__close"
          aria-label="Close"
          @click="close"
        >
          <v-icon size="20">mdi-close</v-icon>
        </button>
      </div>

      <div class="lang-modal__body">
        <div class="lang-modal__grid">
          <button
            v-for="lang in locales"
            :key="lang.code"
            type="button"
            class="lang-btn"
            :class="{ 'lang-btn--selected': isSelected(lang.code) }"
            role="menuitemradio"
            :aria-checked="isSelected(lang.code)"
            @click="onSelect(lang.code)"
          >
            <span class="lang-btn__label">{{ lang.value }}</span>
            <v-icon
              v-if="isSelected(lang.code)"
              size="16"
              class="lang-btn__check"
            >
              mdi-check
            </v-icon>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  availableLocales: {
    type: Array,
    default: () => []
  }
})

const { t, locale } = useI18n()

const locales = computed(() => props.availableLocales || [])

const emit = defineEmits(['select', 'close'])

function onSelect(code) {
  emit('select', code)
  emit('close')
}

function close() {
  emit('close')
}

function isSelected(code) {
  return locale && locale.value === code
}
</script>

<style scoped>
.lang-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.4);
  box-sizing: border-box;
}

.lang-modal {
  width: 100%;
  max-width: 680px;
  max-height: 84vh;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 18px 40px rgba(54, 9, 82, 0.28);
}

.lang-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  background: var(--color-header-bg, #360952);
  color: #ffffff;
}

.lang-modal__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.lang-modal__header-icon {
  color: #ffffff !important;
  flex-shrink: 0;
}

.lang-modal__title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  color: #ffffff;
  letter-spacing: 0.02em;
}

.lang-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  line-height: 1;
  flex-shrink: 0;
  opacity: 0.9;
}

.lang-modal__close:hover {
  opacity: 1;
}

.lang-modal__close :deep(.v-icon) {
  color: #ffffff !important;
}

.lang-modal__body {
  padding: 16px;
  overflow: auto;
  max-height: calc(84vh - 48px);
  background: #ffffff;
}

.lang-modal__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.lang-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 40px;
  margin: 0;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f5f5f5;
  color: #111111;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.lang-btn__label {
  text-align: center;
  word-break: break-word;
  white-space: normal;
}

.lang-btn:hover {
  border-color: var(--color-header-bg, #360952);
  background: #efe6f5;
}

.lang-btn--selected {
  background: var(--color-header-bg, #360952);
  border-color: var(--color-header-bg, #360952);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(54, 9, 82, 0.28);
}

.lang-btn__check {
  color: #ffffff !important;
  flex-shrink: 0;
}

@media (max-width: 540px) {
  .lang-modal__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
