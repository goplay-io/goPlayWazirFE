<script setup>
import { computed, onMounted, watch } from 'vue'
import BetHistory from '@/components/BetHistory.vue'
import { useUnsettledOpenBets } from '@/composables/useUnsettledOpenBets'
import { useDemoUser } from '@/composables/useDemoUser'
import { useBetStore } from '@/stores/bet'

const props = defineProps({
  active: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:openBetCount'])

const { isDemoUser } = useDemoUser()
const betStore = useBetStore()

const {
  totalBetCount: unsettledBetCount,
  eventGroups: unsettledEventGroups,
  eventPage: unsettledEventPage,
  totalEventPages: unsettledTotalEventPages,
  loading: unsettledLoading,
  canGoPrevEventPage: canGoPrevUnsettledEventPage,
  canGoNextEventPage: canGoNextUnsettledEventPage,
  refreshUnsettledBets,
  goToPrevEventPage: goToPrevUnsettledEventPage,
  goToNextEventPage: goToNextUnsettledEventPage,
} = useUnsettledOpenBets({ apiLimit: 20, eventsPerPage: 5 })

const showEventPagination = computed(
  () =>
    !isDemoUser.value
    && (unsettledTotalEventPages.value > 1 || canGoNextUnsettledEventPage.value),
)

const loadUnsettledOpenBets = async () => {
  if (isDemoUser.value) {
    emit('update:openBetCount', 0)
    return
  }
  await refreshUnsettledBets()
}

watch(unsettledBetCount, (count) => {
  emit('update:openBetCount', count)
}, { immediate: true })

watch(
  () => props.active,
  (isActive) => {
    if (isActive) loadUnsettledOpenBets()
  },
)

watch(
  () => betStore.bet_status,
  (status) => {
    if (status === 'success') loadUnsettledOpenBets()
  },
)

onMounted(() => {
  loadUnsettledOpenBets()
})
</script>

<template>
  <section class="bet-mobile-open-bets" aria-live="polite">
    <BetHistory
      embedded
      :event-groups="isDemoUser ? [] : unsettledEventGroups"
      :loading="unsettledLoading"
      class="bet-mobile-open-bets__history"
    />

    <div
      v-if="showEventPagination"
      class="bet-mobile-open-bets__pagination"
    >
      <button
        type="button"
        class="bet-mobile-open-bets__pagination-btn"
        :disabled="!canGoPrevUnsettledEventPage || unsettledLoading"
        aria-label="Previous events"
        @click="goToPrevUnsettledEventPage"
      >
        ‹
      </button>
      <span class="bet-mobile-open-bets__pagination-label">
        {{ unsettledEventPage }} / {{ unsettledTotalEventPages }}
      </span>
      <button
        type="button"
        class="bet-mobile-open-bets__pagination-btn"
        :disabled="!canGoNextUnsettledEventPage || unsettledLoading"
        aria-label="Next events"
        @click="goToNextUnsettledEventPage"
      >
        ›
      </button>
    </div>
  </section>
</template>

<style scoped>
.bet-mobile-open-bets {
  width: 100%;
  min-height: 220px;
  margin: 0 0 0.5rem;
  padding: 0;
  box-sizing: border-box;
  background: #ffffff;
}

.bet-mobile-open-bets__history {
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  background: transparent !important;
}

.bet-mobile-open-bets :deep(.bet-history-root--embedded) {
  overflow: visible !important;
  max-width: 100% !important;
}

.bet-mobile-open-bets :deep(.bet-history-embedded-slip) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}

.bet-mobile-open-bets :deep(.bet-history-embedded-table-scroll) {
  width: 100% !important;
  max-width: 100% !important;
}

.bet-mobile-open-bets :deep(.bet-history-embedded-table) {
  min-width: 400px !important;
}

.bet-mobile-open-bets :deep(.bet-panel-empty-message--embedded-slip) {
  min-height: 220px;
  background: #ffffff !important;
}

.bet-mobile-open-bets__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-height: 32px;
  padding: 4px 8px 12px;
  box-sizing: border-box;
  background: #ffffff;
}

.bet-mobile-open-bets__pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #360952;
  border-radius: 4px;
  background: #ffffff;
  color: #360952;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.bet-mobile-open-bets__pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.bet-mobile-open-bets__pagination-label {
  min-width: 48px;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  color: #000000;
  text-align: center;
}
</style>
