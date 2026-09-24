<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="mobile-search-modal-overlay"
      @click.self="$emit('close')"
    >
      <div
        class="mobile-search-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div class="mobile-search-modal__header">
          <h2 :id="titleId" class="mobile-search-modal__title">{{ title }}</h2>
          <button
            type="button"
            class="mobile-search-modal__close"
            :aria-label="closeLabel"
            @click="$emit('close')"
          >
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <div class="mobile-search-modal__divider" aria-hidden="true" />
        <div class="mobile-search-modal__body">
          <div class="mobile-search-modal__field">
            <v-icon size="18" class="mobile-search-modal__icon">mdi-magnify</v-icon>
            <slot name="input" />
          </div>
          <div v-if="$slots.results" class="mobile-search-modal__results">
            <slot name="results" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useId } from 'vue'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  closeLabel: { type: String, default: 'Close' },
})

defineEmits(['close'])

const titleId = useId()
</script>

<style scoped>
.mobile-search-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.58);
}

.mobile-search-modal {
  width: min(100%, 360px);
  border-radius: 12px;
  background: #1a1a1a;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}

.mobile-search-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
}

.mobile-search-modal__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
  color: #ffffff;
}

.mobile-search-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #ff6b00;
  flex-shrink: 0;
}

.mobile-search-modal__close :deep(.v-icon) {
  color: #ff6b00 !important;
}

.mobile-search-modal__divider {
  height: 1px;
  margin: 0 16px;
  background: #333333;
}

.mobile-search-modal__body {
  padding: 16px;
}

.mobile-search-modal__field {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 8px;
  background: #ffffff;
}

.mobile-search-modal__icon {
  color: #ff6b00 !important;
  flex-shrink: 0;
}

.mobile-search-modal__field :deep(input) {
  flex: 1 1 0;
  min-width: 0;
  padding: 10px 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #111111;
  font-size: 16px; /* iOS Safari auto-zooms inputs below 16px */
  font-weight: 400;
  line-height: 1.35;
}

.mobile-search-modal__field :deep(input::placeholder) {
  color: #8e8e93;
  opacity: 1;
}

.mobile-search-modal__results {
  margin-top: 12px;
  max-height: min(50vh, 320px);
  overflow-y: auto;
  border-radius: 8px;
  background: #ffffff;
}

.mobile-search-modal__results :deep(.search-results--compact button) {
  display: block;
  width: 100%;
  padding: 11px 16px;
  margin: 0;
  border: none;
  border-bottom: 1px solid #ececec;
  border-radius: 0;
  background: #ffffff;
}

.mobile-search-modal__results :deep(.search-results--compact button:last-child) {
  border-bottom: none;
}

.mobile-search-modal__results :deep(.search-results__title) {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.35;
  color: #111111;
}

.mobile-search-modal__results :deep(.search-results--compact button:active) {
  background: #f5f5f5;
}

.mobile-search-modal__results :deep(.search-results__state) {
  padding: 12px 16px;
  font-size: 14px;
  color: #5a6a72;
}

.mobile-search-modal__results :deep(.tw-text-theme-text) {
  color: #111827 !important;
}

.mobile-search-modal__results :deep(.tw-text-theme-text-secondary) {
  color: #6b7280 !important;
}

.mobile-search-modal__results :deep(.tw-border-theme-border) {
  border-color: #e5e7eb !important;
}

.mobile-search-modal__results :deep(button:hover) {
  background: #f8fafc !important;
}
</style>
