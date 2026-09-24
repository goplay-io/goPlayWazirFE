<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  positions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);
const close = () => emit('update:modelValue', false);

const { t } = useI18n();

const formatPosition = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  return value;
};
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="368"
    width="368"
    :scrim-opacity="0.5"
    content-class="positions-dialog-content"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="positions-dialog-shell">
      <div class="positions-dialog-card">
        <div class="positions-dialog-header">
          <span class="positions-dialog-header__title">{{ title }}</span>
          <button
            type="button"
            class="positions-dialog-header__close"
            :aria-label="t('components.fancy.close')"
            @click="close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div class="positions-dialog-body">
          <div v-if="positions.length" class="positions-dialog-grid">
            <div
              v-for="(pos, idx) in positions"
              :key="idx"
              class="positions-dialog-grid__row"
            >
              <div class="positions-dialog-grid__cell">{{ pos.run }}</div>
              <div
                class="positions-dialog-grid__cell"
                :class="{
                  'positions-dialog-grid__cell--positive': Number(pos.amount) > 0,
                  'positions-dialog-grid__cell--negative': Number(pos.amount) < 0,
                }"
              >
                {{ formatPosition(pos.amount) }}
              </div>
            </div>
          </div>

          <div v-else class="positions-dialog-empty">
            {{ t('components.fancy.noPositions') }}
          </div>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped>
.positions-dialog-shell {
  background: var(--color-header-bg, #360952);
  border-radius: 8px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

.positions-dialog-card {
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.positions-dialog-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 37px;
  padding: 8px;
  background: var(--color-header-bg, #360952);
  border-radius: 4px 4px 0 0;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.positions-dialog-header__title {
  flex: 1;
  min-width: 0;
}

.positions-dialog-header__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 16px;
  margin: 0 8px 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.positions-dialog-header__close svg {
  width: 16px;
  height: 16px;
}

.positions-dialog-body {
  color: #000;
}

.positions-dialog-grid__row {
  display: flex;
  width: 100%;
  height: 27px;
  background: #fff;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
}

.positions-dialog-grid__cell {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 27px;
  border: 1px solid #e5e7eb;
  text-align: center;
  color: #000;
}

.positions-dialog-grid__cell--positive {
  color: #22c55e;
}

.positions-dialog-grid__cell--negative {
  color: #ef4444;
}

.positions-dialog-empty {
  min-height: 54px;
  padding: 16px 8px;
  background: #fff;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
}
</style>

<!-- v-dialog content is teleported to <body> -->
<style>
.positions-dialog-content {
  width: 368px !important;
  max-width: calc(100vw - 32px) !important;
  margin: 96px auto 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  overflow: visible !important;
}

@media (min-width: 768px) {
  .positions-dialog-content {
    margin-top: 16px !important;
  }
}
</style>
