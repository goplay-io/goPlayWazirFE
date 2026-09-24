<template>
  <div class="tw-w-full">
    <!-- One Click Bet confirmation popup from stake bar -->
    <teleport to="body">
      <transition name="ocb-slide">
        <div v-if="showOnEnableDialog" class="ocb-teleport-root">
          <!-- Scrim -->
          <div class="ocb-scrim" />
          <!-- Card anchored above stake bar -->
          <div class="ocb-popup-wrap">
            <v-card class="ocb-card" elevation="0">
              <v-card-title class="ocb-card-title">One Click Bet ON</v-card-title>
              <v-card-text class="ocb-card-body">
                <p>Stake selected will be placed immediately once you click on the market odds.</p>
                <p class="ocb-card-warning">Attention: Back/Lay at your own risk</p>
              </v-card-text>
              <v-card-actions class="ocb-card-actions">
                <v-btn block variant="outlined" color="white" class="ocb-ok-btn" @click="showOnEnableDialog = false">
                  OK
                </v-btn>
              </v-card-actions>
            </v-card>
            <!-- Arrow pointing down to stake bar -->
            <div class="ocb-arrow" />
          </div>
        </div>
      </transition>
    </teleport>
    <!-- Mobile Toggle View - Always show when mobile and hideActiveState -->
    <!-- Mobile Toggle -->
    <div v-if="!stickyOnly && mobile && (hideActiveState || !oneClickStore.isActive)"
      class="tw-flex tw-items-center tw-gap-1 tw-leading-none">
      <span class="tw-text-[10px] tw-font-semibold tw-whitespace-nowrap">
        1-Click Bet
      </span>

      <v-switch :model-value="oneClickStore.active" @update:model-value="oneClickStore.toggleActive" hide-details color="secondary"
        density="compact" inset size="x-small" class="tw-scale-75 tw-origin-left tw-flex-shrink-0 one-click-toggle" />
    </div>

    <!-- Desktop Checkbox UI - Shown when not active (explicit dark text: winbuzz --color-text is white on light slip rail) -->
    <div v-else-if="!stickyOnly && !mobile && !oneClickStore.isActive" class="one-click-desktop-inactive">
      <label class="tw-flex tw-items-center tw-gap-3 tw-cursor-pointer tw-select-none">
        <input type="checkbox" :checked="oneClickStore.active" @change="oneClickStore.toggleActive"
          class="one-click-rail-checkbox tw-cursor-pointer" />
        <span class="one-click-desktop-inactive__label">1 Click Betting Enabled</span>
      </label>
    </div>

    <!-- Action Bar - Shown when active (sticky bottom, black/white) -->
    <div v-else-if="oneClickStore.isActive && !hideActiveState" class="one-click-sticky">
      <!-- View mode: single row -->
      <div v-if="!oneClickStore.editMode"
        class="tw-max-w-3xl tw-mx-auto tw-px-3 tw-py-2 tw-flex tw-items-center tw-gap-2">
        <!-- Label + deactivate checkbox -->
        <label class="tw-flex tw-items-center tw-gap-1.5 tw-cursor-pointer tw-select-none tw-shrink-0">
          <input type="checkbox" :checked="oneClickStore.active" @change="oneClickStore.toggleActive"
            class="one-click-checkbox tw-h-3.5 tw-w-3.5 tw-cursor-pointer tw-rounded" />
          <span class="tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-white tw-whitespace-nowrap">
            1 Click
          </span>
        </label>
        <!-- Amount Buttons -->
        <div class="tw-flex tw-gap-1.5 tw-flex-1">
          <button v-for="btnAmount in oneClickStore.amountsList" :key="btnAmount" type="button"
            @click="oneClickStore.setAmount(btnAmount)" :class="[
              'tw-flex-1 tw-rounded tw-py-1 tw-text-xs tw-font-bold tw-transition-all tw-whitespace-nowrap',
              oneClickStore.currentAmount === btnAmount
                ? 'tw-bg-white tw-text-black'
                : 'tw-bg-white/10 tw-text-white tw-border tw-border-white/20 hover:tw-bg-white/20'
            ]">
            {{ btnAmount.toLocaleString() }}
          </button>
        </div>
        <!-- Edit icon -->
        <v-btn icon density="compact" variant="text"
          class="tw-text-white/60 hover:tw-text-white tw-shrink-0" size="small" @click="startEdit" title="Edit amounts">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="tw-h-4 tw-w-4 tw-fill-current">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l8.06-8.06.92.92L5.92 20.08zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.82 1.82 3.75 3.75 1.82-1.82z" />
          </svg>
        </v-btn>
      </div>

      <!-- Edit mode: two rows -->
      <div v-else class="tw-max-w-3xl tw-mx-auto tw-px-3 tw-pt-2 tw-pb-2 tw-flex tw-flex-col tw-gap-1.5">
        <!-- Row 1: label + save -->
        <div class="tw-flex tw-items-center tw-justify-between">
          <label class="tw-flex tw-items-center tw-gap-1.5 tw-cursor-pointer tw-select-none">
            <input type="checkbox" :checked="oneClickStore.active" @change="oneClickStore.toggleActive"
              class="one-click-checkbox tw-h-3.5 tw-w-3.5 tw-cursor-pointer tw-rounded" />
            <span class="tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-white tw-whitespace-nowrap">
              1 Click
            </span>
          </label>
          <v-btn icon density="compact" variant="flat" color="white"
            class="tw-shrink-0" size="small" @click="saveEdit" title="Save amounts">
            <svg viewBox="0 0 24 24" aria-hidden="true" class="tw-h-4 tw-w-4 tw-fill-current">
              <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zM12 19a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm5-10H5V5h12v4z" />
            </svg>
          </v-btn>
        </div>
        <!-- Row 2: inputs grid -->
        <div class="tw-flex tw-flex-wrap tw-gap-1.5">
          <input
            v-for="(value, index) in editValues"
            :key="index"
            v-model="editValues[index]"
            type="number"
            min="1"
            class="one-click-edit-field"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useOneClickBettingStore } from '@/stores/oneClickBetting'

defineProps({
  mobile: {
    type: Boolean,
    default: false
  },
  hideActiveState: {
    type: Boolean,
    default: false
  },
  stickyOnly: {
    type: Boolean,
    default: false
  }
})

const oneClickStore = useOneClickBettingStore()
const editValues = ref([])
const showOnEnableDialog = ref(false)

watch(
  () => oneClickStore.isActive,
  (val, oldVal) => {
    if (val && !oldVal) {
      showOnEnableDialog.value = true
    }
  }
)

const startEdit = () => {
  editValues.value = oneClickStore.amountsList.map(value => String(value))
  oneClickStore.toggleEditMode()
}

const saveEdit = () => {
  const cleaned = editValues.value
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value > 0)

  const unique = []
  cleaned.forEach(value => {
    if (!unique.includes(value)) unique.push(value)
  })

  if (unique.length > 0) {
    oneClickStore.updateSettingsList(unique)
  }

  oneClickStore.toggleEditMode()
}
</script>

<style scoped>
/* Sticky bottom bar — all devices, black background */
.one-click-sticky {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #111;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

/* Mobile: sit above fixed bottom nav on bet / market pages */
@media (max-width: 767.98px) {
  .one-click-sticky {
    bottom: var(--mobile-bottom-nav-inset, calc(var(--mobile-bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px)));
  }

  .ocb-popup-wrap {
    bottom: calc(var(--mobile-bottom-nav-inset, calc(var(--mobile-bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px))) + 48px + 4px);
  }
}

/* Native edit field — matches button row height */
.one-click-edit-field {
  flex: 1;
  min-width: 72px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  text-align: center;
  padding: 4px 4px;
  outline: none;
  /* remove number spinner arrows */
  -moz-appearance: textfield;
}
.one-click-edit-field::-webkit-outer-spin-button,
.one-click-edit-field::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.one-click-edit-field:focus {
  border-color: rgba(255, 255, 255, 0.7);
}

/* Teleport root — single child required by <transition>, no visual effect */
.ocb-teleport-root {
  position: fixed;
  inset: 0;
  z-index: 99998;
  pointer-events: none;
}

/* Scrim — full screen dim behind everything */
.ocb-scrim {
  position: fixed;
  inset: 0;
  z-index: 99998;
  background: rgba(0, 0, 0, 0.55);
  pointer-events: all;
}

/* Card wrapper — fixed just above the stake bar, centered */
.ocb-popup-wrap {
  position: fixed;
  bottom: calc(48px + env(safe-area-inset-bottom, 0px) + 4px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(360px, calc(100vw - 32px));
  pointer-events: all;
}

.ocb-card {
  background: #000 !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  border-radius: 10px !important;
  width: 100%;
  text-align: center;
}

.ocb-card-title {
  color: #fff !important;
  font-size: 1rem !important;
  font-weight: 800 !important;
  padding: 16px 16px 4px !important;
  justify-content: center;
}

.ocb-card-body {
  color: #fff !important;
  font-size: 0.85rem !important;
  line-height: 1.55 !important;
  padding: 4px 16px 0 !important;
}

.ocb-card-body p {
  margin: 0 0 6px;
  opacity: 0.88;
}

.ocb-card-warning {
  opacity: 1 !important;
  font-weight: 800;
  color: #facc15 !important;
}

.ocb-card-actions {
  padding: 12px 16px 16px !important;
}

.ocb-ok-btn {
  font-weight: 800 !important;
  letter-spacing: 0.05em !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

/* Downward arrow pointing at the stake bar */
.ocb-arrow {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #000;
}

/* Slide-up transition — applied to both scrim and card together */
.ocb-slide-enter-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}
.ocb-slide-leave-active {
  transition: transform 0.16s ease, opacity 0.16s ease;
}
.ocb-slide-enter-from {
  transform: translateY(20px);
  opacity: 0;
}
.ocb-slide-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

.one-click-toggle :deep(.v-switch__track) {
  border: 1px solid rgb(var(--v-theme-primary));
  opacity: 1 !important;
}

/* Purple rail row — sits directly under the live stream bar */
.one-click-desktop-inactive {
  padding: 8px;
  background: var(--color-header-bg);
}

.one-click-desktop-inactive__label {
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}

.one-click-rail-checkbox {
  appearance: none;
  -webkit-appearance: none;
  flex-shrink: 0;
  width: 20px;
  height: 22px;
  margin: 0;
  border: 0;
  border-radius: 3px;
  background: #ffffff;
}

.one-click-rail-checkbox:checked::after {
  content: "";
  display: block;
  width: 6px;
  height: 12px;
  margin: 2px auto 0;
  border: solid var(--color-header-bg);
  border-width: 0 3px 3px 0;
  transform: rotate(45deg);
}

.one-click-checkbox {
  accent-color: var(--color-primary);
}
</style>
