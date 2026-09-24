<template>
  <div
    v-if="visible"
    class="bet-placing-overlay"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div class="bet-placing-overlay__ring" aria-hidden="true">
      <svg class="bet-placing-overlay__svg" viewBox="0 0 48 48">
        <circle
          class="bet-placing-overlay__track"
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke-width="5"
        />
        <circle
          class="bet-placing-overlay__arc"
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke-width="5"
          stroke-linecap="round"
        />
      </svg>
    </div>
    <p class="bet-placing-overlay__text">{{ label }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBetStore } from '@/stores/bet'
import { storeToRefs } from 'pinia'

const { t } = useI18n()
const betStore = useBetStore()
const { bet_status, placingCountdown } = storeToRefs(betStore)

const visible = computed(() => bet_status.value === 'processing')

const label = computed(() => {
  const seconds = Number(placingCountdown.value) || 0
  if (seconds > 0) {
    return t('sports.home.placingIn', { seconds })
  }
  return t('sports.home.placing')
})
</script>

<style scoped>
.bet-placing-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.62);
  border-radius: inherit;
  pointer-events: auto;
  box-sizing: border-box;
}

.bet-placing-overlay__ring {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}

.bet-placing-overlay__svg {
  display: block;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  animation: bet-placing-spin 0.9s linear infinite;
}

.bet-placing-overlay__track {
  stroke: rgba(229, 231, 235, 0.92);
}

.bet-placing-overlay__arc {
  stroke: #facc15;
  stroke-dasharray: 28 85;
}

.bet-placing-overlay__text {
  margin: 0;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.01em;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

@keyframes bet-placing-spin {
  to {
    transform: rotate(270deg);
  }
}
</style>
