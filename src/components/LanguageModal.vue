<template>
  <div class="lang-modal-overlay" @click.self="close">
    <div class="lang-modal" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <button type="button" class="lang-modal__close" aria-label="Close" @click="close">
        <svg width="24" height="24" viewBox="0 0 512 512" aria-hidden="true">
          <path fill="#ffffff" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" />
          <path fill="#333333" d="M209 175c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47z" />
        </svg>
      </button>

      <div class="lang-modal__body">
        <div class="lang-modal__heading-row">
          <div class="lang-modal__intro">
            <h3 :id="titleId" class="lang-modal__title">{{ t('components.sidebar.selectlanguage') }}</h3>
            <p class="lang-modal__hint">{{ t('components.sidebar.languageHint') }}</p>
          </div>
        </div>
        <ul class="lang-modal__grid">
          <li v-for="lang in locales" :key="lang.code">
            <button
              type="button"
              class="lang-btn"
              :class="{ 'lang-btn--selected': pendingCode === lang.code }"
              @click="pendingCode = lang.code"
            >
              <span>{{ lang.value }}</span>
            </button>
          </li>
        </ul>
      </div>

      <div class="lang-modal__footer">
        <button type="button" class="lang-modal__confirm" @click="confirm">
          {{ t('common.confirm') }}
        </button>
        <button type="button" class="lang-modal__cancel" @click="close">
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  availableLocales: {
    type: Array,
    default: () => [],
  },
})

const { t, locale } = useI18n()
const titleId = 'lang-modal-title'
const pendingCode = ref(locale.value)

const locales = computed(() => props.availableLocales || [])

const emit = defineEmits(['select', 'close'])

function confirm() {
  if (pendingCode.value) emit('select', pendingCode.value)
  emit('close')
}

function close() {
  emit('close')
}
</script>

<style scoped>
.lang-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.4);
}

.lang-modal {
  position: relative;
  width: 90%;
  max-width: 500px;
  max-height: 80%;
  overflow-y: auto;
  background: #333333;
  border-radius: 0;
  box-shadow: none;
  font-family: Lato, ui-sans-serif, system-ui, sans-serif;
}

.lang-modal__close {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
  display: block;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  line-height: 0;
}

.lang-modal__body {
  padding: 24px 24px 16px;
  background: #333333;
}

.lang-modal__heading-row {
  display: flex;
  align-items: flex-start;
}

.lang-modal__intro {
  margin: 0 0 0 16px;
  text-align: center;
}

.lang-modal__title {
  margin: 0;
  color: #ffffff;
  font-family: inherit;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
}

.lang-modal__hint {
  margin: 8px 0 0;
  color: #ffffff;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

.lang-modal__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.lang-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 36px;
  margin: 0;
  padding: 8px 12px;
  border: 0 solid #49915e;
  border-radius: 6px;
  background: transparent;
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  text-align: center;
  text-transform: capitalize;
  cursor: pointer;
}

.lang-btn--selected {
  border-width: 1px;
}

.lang-modal__footer {
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-start;
  padding: 12px 24px;
  background: #333333;
}

.lang-modal__confirm,
.lang-modal__cancel {
  box-sizing: border-box;
  height: 38px;
  margin: 0 0 0 12px;
  padding: 8px 16px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
}

.lang-modal__confirm {
  border: 1px solid transparent;
  background: #49915e;
  color: #171716;
}

.lang-modal__cancel {
  border: 0;
  background: #23201f;
  color: #ffffff;
}

@media (max-width: 639.98px) {
  .lang-modal__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
