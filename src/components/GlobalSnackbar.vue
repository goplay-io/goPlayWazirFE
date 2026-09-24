<template>
  <v-snackbar
    v-model="snackbarState.show"
    :timeout="snackbarState.timeout"
    :location="snackbarState.location"
    :z-index="10050"
    transition="fade-transition"
    color="transparent"
    elevation="0"
    rounded="0"
    class="snackbar-root"
    content-class="global-snackbar-overlay"
  >
    <div :class="['snackbar-pill', pillClass]">
      <!-- Icon badge -->
      <div
        v-if="snackbarState.icon"
        :class="['snackbar-icon-slot tw-flex tw-items-center tw-justify-center tw-shrink-0', badgeClass]"
      >
        <v-icon size="18" :class="iconClass">{{ snackbarState.icon }}</v-icon>
      </div>

      <!-- Message -->
      <span class="snackbar-message tw-flex-1 tw-overflow-hidden tw-text-sm tw-font-medium tw-leading-snug">
        {{ snackbarState.message }}
      </span>

      <!-- Close -->
      <button
        v-if="snackbarState.closable"
        type="button"
        @click="hideSnackbar"
        class="snackbar-close tw-flex tw-items-center tw-justify-center tw-shrink-0 tw-p-1 tw-border-0 tw-bg-transparent tw-cursor-pointer"
        :aria-label="t('components.globalSnackbar.close')"
      >
        <v-icon size="18">mdi-close</v-icon>
      </button>
    </div>
  </v-snackbar>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'

const { t } = useI18n()
const { snackbarState, hideSnackbar } = useSnackbar()

const variants = {
  success: {
    pill:   'snackbar-pill--success',
    badge:  '',
    icon:   'snackbar-icon--success',
  },
  error: {
    pill:   'snackbar-pill--error',
    badge:  'snackbar-icon-slot--error',
    icon:   'snackbar-icon--error',
  },
  warning: {
    pill:   'snackbar-pill--warning',
    badge:  '',
    icon:   'snackbar-icon--warning',
  },
  info: {
    pill:   'snackbar-pill--info',
    badge:  '',
    icon:   'snackbar-icon--info',
  },
}

const current   = computed(() => variants[snackbarState.color] ?? variants.info)
const pillClass  = computed(() => current.value.pill)
const badgeClass = computed(() => current.value.badge)
const iconClass  = computed(() => current.value.icon)
</script>

<style scoped>
:deep(.v-snackbar__wrapper) {
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

:deep(.v-snackbar__content) {
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
}

.snackbar-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(184, 136, 49, 0.16);
  min-width: 260px;
  max-width: 420px;
  width: 100%;
  box-sizing: border-box;
  background: #fffaf0;
  color: #2f2618;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.snackbar-message {
  color: #2f2618;
}

.snackbar-icon-slot {
  width: 1.25rem;
  height: 1.25rem;
}

.snackbar-close :deep(.v-icon) {
  color: rgba(47, 38, 24, 0.6) !important;
}

.snackbar-close:hover :deep(.v-icon) {
  color: #2f2618 !important;
}

.snackbar-pill--success {
  border-left: 4px solid var(--color-success);
}

.snackbar-pill--error {
  background: #c62828;
  border: none;
  color: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}

.snackbar-pill--error .snackbar-message {
  color: #fff;
}

.snackbar-icon-slot--error {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  width: 1.75rem;
  height: 1.75rem;
}

.snackbar-pill--error .snackbar-close :deep(.v-icon) {
  color: rgba(255, 255, 255, 0.85) !important;
}

.snackbar-pill--error .snackbar-close:hover :deep(.v-icon) {
  color: #fff !important;
}

.snackbar-pill--warning {
  border-left: 4px solid var(--color-warning);
}

.snackbar-pill--info {
  border-left: 4px solid var(--color-primary);
}

.snackbar-icon--success {
  color: var(--color-success);
}

.snackbar-icon--error {
  color: #fff;
}

.snackbar-icon--warning {
  color: var(--color-warning);
}

.snackbar-icon--info {
  color: var(--color-primary);
}

@media (max-width: 767px) {
  :deep(.v-snackbar__wrapper),
  :deep(.v-snackbar__content) {
    width: 100% !important;
    max-width: 100% !important;
  }

  .snackbar-pill {
    min-width: 0;
    min-height: var(--mobile-sport-tabs-px);
    max-width: none;
    width: 100%;
    border-radius: 0;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
  }
}
</style>

<style>
/* Desktop: centered pill */
.global-snackbar-overlay.v-overlay__content {
  top: 8px !important;
  bottom: auto !important;
  left: 12px !important;
  right: 12px !important;
  margin: 0 auto;
  max-width: 420px;
}

/* Mobile: full width in sport-tab row slot (below header) */
@media (max-width: 767px) {
  .global-snackbar-overlay.v-overlay__content {
    top: var(--mobile-snackbar-top) !important;
    bottom: auto !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    min-height: var(--mobile-sport-tabs-px);
    margin: 0 !important;
    padding: 0 !important;
    transform: none !important;
    inset-inline: 0 !important;
    z-index: 10050 !important;
  }

  .global-snackbar-overlay .v-snackbar__wrapper,
  .global-snackbar-overlay .v-snackbar__content {
    width: 100% !important;
    max-width: 100% !important;
    min-height: var(--mobile-sport-tabs-px);
  }
}
</style>