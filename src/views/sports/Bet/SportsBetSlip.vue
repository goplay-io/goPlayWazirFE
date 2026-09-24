<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import BetHistory from '@/components/BetHistory.vue';
import useDevices from '@/composables/useDevices';
import ButtonUpdateForm from './ButtonUpdateForm.vue';
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar';
import { useDemoUser } from '@/composables/useDemoUser';
import DemoSignupDialog from '@/components/DemoSignupDialog.vue';
import { useOneClickBettingStore } from '@/stores/oneClickBetting';
import { useI18n } from 'vue-i18n'
import { useBetStore } from '@/stores/bet';
import { useOddsLadder } from '@/composables/useOddsLadder';
import emptyBetslipTicketsIcon from '@/assets/icons/empty-betslip-tickets.png';
import { useEventTypes } from '@/composables/useEventTypes';
import { useUnsettledOpenBets } from '@/composables/useUnsettledOpenBets';
import { applyStakeInput } from '@/utils/stakeInput.js';
import BetSlipFeedbackBanner from '@/components/sports/BetSlipFeedbackBanner.vue';
import BetPlacingOverlay from '@/components/BetPlacingOverlay.vue';
import { useBetSlipFeedback } from '@/composables/useBetSlipFeedback';


const props = defineProps({
  slipOpen: null,
  toggleSlip: null,
  bet_error: null,
  betAllow: null,
  bet: null,
  buttons: null,
  changeAmount: null,
  placeBet: null,
  betHistory: null,
  betHistoryCount: {
    type: Number,
    default: 0,
  },
  minAmount: null,
  maxAmount: null,
  runnerCpp: {
    type: Object,
    default: null
  },
  groupByEvent: {
    type: Boolean,
    default: false
  },
  /** Fetch open bets from /bet/unsettled (market page MY BETS panel) */
  openBetsUseUnsettled: {
    type: Boolean,
    default: true,
  },
  /** Racing (and similar): light headers / chrome to match main column */
  lightChrome: {
    type: Boolean,
    default: false
  },
  sportName: {
    type: String,
    default: '',
  },
  competitionName: {
    type: String,
    default: '',
  },
});

const betAllow = ref(props.betAllow || false);
const { isMobile } = useDevices();
const { showSuccess, showError, showWarning } = useSnackbar();
const { isDemoUser } = useDemoUser();
const oneClickStore = useOneClickBettingStore();
const betStore = useBetStore();
const { getEventTypeName, getEventTypeIcon } = useEventTypes();

const { t } = useI18n()

const bet_status = defineModel('bet_status', { required: true })
const bet_processing = defineModel('bet_processing', { required: true })
const showBetHistory = defineModel('showBetHistory', { required: true })

const { inlineMessage, clearInlineMessage } = useBetSlipFeedback({
  betStatus: bet_status,
  getBetError: () => props.bet_error,
  getBetRunnerId: () => props.bet?.runner_id,
  showSuccess,
  showError,
  t,
});

const emit = defineEmits(['update:buttons'])

// Static fallback buttons for demo users
const staticFallbackButtons = [
  { id: 1, title: '100', amount: 100 },
  { id: 2, title: '500', amount: 500 },
  { id: 3, title: '1000', amount: 1000 },
  { id: 4, title: '5000', amount: 5000 },
  { id: 5, title: '10000', amount: 10000 },
  { id: 6, title: '25000', amount: 25000 },
  { id: 7, title: '50000', amount: 50000 },
  { id: 8, title: '100000', amount: 100000 }
];

// Dialog state for demo user signup
const showDemoDialog = ref(false);

// Use static fallback for demo users or when API failed (empty/null buttons)
const finalButtons = computed(() => {
  if (isDemoUser.value || !props.buttons || props.buttons.length === 0) {
    return staticFallbackButtons;
  }
  return props.buttons;
});

const showUpdateForm = ref(false);
const betSlipOpen = ref(false); // Bet slip panel closed by default
const slipPanelTab = ref('betslip'); // desktop: 'betslip' | 'openBet'

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
} = useUnsettledOpenBets({ apiLimit: 20, eventsPerPage: 5 });

const openBetCount = computed(() => {
  if (props.openBetsUseUnsettled && !isDemoUser.value) {
    return unsettledBetCount.value
  }
  return props.betHistoryCount ?? props.betHistory?.length ?? 0
})

const showOpenBetEventPagination = computed(() =>
  props.openBetsUseUnsettled
  && !isDemoUser.value
  && (unsettledTotalEventPages.value > 1 || canGoNextUnsettledEventPage.value),
)

const loadUnsettledOpenBets = async () => {
  if (!props.openBetsUseUnsettled || isDemoUser.value || isMobile.value) return
  await refreshUnsettledBets()
}

const displayOdd = computed(() => props.bet?.odd ?? null);

const { increaseOdd, decreaseOdd, canAdjustOdds, usesExchangeOddsLadder } = useOddsLadder(() => props.bet);

const slipDensity = computed(() => isMobile.value ? 'comfortable' : 'compact');
const hasSlipSelection = computed(() => !!props.bet?.odd);
const slipPanelFillsRail = computed(
  () => !isMobile.value && slipPanelTab.value === 'betslip' && hasSlipSelection.value,
);

/** Colored panel body (back = blue, lay = pink) when a selection is active */
const slipTinted = computed(() => !!(props.bet?.odd));
const slipIsBack = computed(() => slipTinted.value && props.bet?.is_back);

const slipSportName = computed(() => {
  if (props.sportName) return props.sportName;
  return getEventTypeName(Number(props.bet?.event_type_id)) || '';
});

const slipCompetitionName = computed(() => props.competitionName || '');

const slipSportCompetitionLabel = computed(() => {
  const sport = slipSportName.value;
  const comp = slipCompetitionName.value;
  if (sport && comp) return `${sport} : ${comp}`;
  return sport || comp || props.bet?.market_type_name || '';
});

const slipSportIcon = computed(() => getEventTypeIcon(Number(props.bet?.event_type_id)));

const showDesktopSelectionDark = computed(
  () => !isMobile.value && hasSlipSelection.value,
);

function formatQuickAmount(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return String(amount);
  return n.toLocaleString();
}

function formatLimitShort(amount) {
  const n = Number(amount);
  if (amount == null || Number.isNaN(n)) return '-';
  return n.toLocaleString();
}

/** Back returns the win; lay/no returns the stake. Points markets price at odd/100. */
const slipProfit = computed(() => {
  const stake = Number(props.bet?.stake);
  const odd = Number(props.bet?.odd);
  if (!stake || !odd || Number.isNaN(stake) || Number.isNaN(odd)) return '0.00';
  if (!props.bet?.is_back) return stake.toFixed(2);
  const decimalOdd = usesExchangeOddsLadder(props.bet) ? odd : (odd + 100) / 100;
  return (stake * (decimalOdd - 1)).toFixed(2);
});

// Watch for bet.odd changes and control bet slip visibility
watch(() => props.bet?.odd, (newOdd, oldOdd) => {
  if (newOdd) {
    if (!isMobile.value) {
      slipPanelTab.value = 'betslip';
    }
    if (!(oneClickStore.isActive && !oneClickStore.editMode)) {
      // Bet selected or changed - open bet slip accordion
      betSlipOpen.value = true;
    }
  } else if (!newOdd && oldOdd) {
    // Bet cleared - close bet slip
    betSlipOpen.value = false;
  }
}, { immediate: true });

const isButtonDisabled = () => {
  return !betAllow.value || !props.bet.odd;
};

const isMinMaxDisabled = (amount) => {
  return !betAllow.value || !props.bet.odd || amount == null;
};

const handleStakeInput = (event) => {
  applyStakeInput(props.bet, event);
};

const handleEditStake = () => {
  showUpdateForm.value = true;
};
const closeUpdateForm = () => {
  showUpdateForm.value = false;
};

const refreshButtons = (updatedButtons) => {
  // Only update if not demo user (demo users use static fallback)
  if (!isDemoUser.value) {
    // Note: finalButtons is now a computed property, so we need to handle this differently
    // The parent component should handle button updates for non-demo users
    emit('update:buttons', updatedButtons);
  }
};

// Handle place bet - show dialog for demo users
const handlePlaceBet = () => {
  if (isDemoUser.value) {
    showDemoDialog.value = true;
    return;
  }
  // For non-demo users, call the actual placeBet function
  if (props.placeBet) {
    props.placeBet();
  }
};

const clearSlipSelection = () => {
  clearInlineMessage();
  if (props.bet) {
    props.bet.stake = null;
    props.bet.odd = null;
  }
};

// Watch for bet status changes and show snackbars
watch(() => bet_status.value, (newStatus) => {
  if (newStatus === 'success') {
    loadUnsettledOpenBets();
  }
});

watch(slipPanelTab, (tab) => {
  if (tab === 'openBet') {
    loadUnsettledOpenBets();
  }
});

onMounted(() => {
  loadUnsettledOpenBets();
});

watch(showBetHistory, (open) => {
  if (open && !isMobile.value) {
    slipPanelTab.value = 'openBet';
    showBetHistory.value = false;
  }
});

// Watch for betting blocked status
watch(() => props.betAllow, (newValue, oldValue) => {
  // Update local betAllow ref with prop value
  betAllow.value = newValue;

  // Only show warning if betting was previously allowed and is now blocked
  // Avoid showing on initial load by checking if oldValue exists
  if (newValue === false && oldValue === true) {
    showWarning(t('sports.home.bettingBlocked'), { timeout: 8000 });
  }
});

</script>

<template>
  <div
    :class="[
      'sports-bet-slip-root slip-form-root tw-flex tw-min-h-0 tw-w-full tw-flex-col',
      isMobile
        ? 'sports-bet-slip-stack tw-gap-2'
        : ['bet-slip-tabbed-panel', slipPanelFillsRail ? 'bet-slip-tabbed-panel--fill' : ''],
    ]"
  >
    <div v-if="!isMobile" class="bet-slip-tabs">
      <div class="bet-slip-tabs__group">
        <button
          type="button"
          class="bet-slip-tabs__tab"
          :class="{ 'bet-slip-tabs__tab--active': slipPanelTab === 'betslip' }"
          @click="slipPanelTab = 'betslip'"
        >
          {{ t('components.betSlipToolbar.betslip') }}
        </button>
        <button
          type="button"
          class="bet-slip-tabs__tab"
          :class="{ 'bet-slip-tabs__tab--active': slipPanelTab === 'openBet' }"
          @click="slipPanelTab = 'openBet'"
        >
          {{ t('components.betSlipToolbar.openBet') }} ({{ openBetCount }})
        </button>
      </div>
    </div>

  <v-card
    v-if="isMobile || slipOpen !== false"
    v-show="isMobile || slipPanelTab === 'betslip'"
    :class="[
      'bet-slip-vcard tw-flex tw-flex-col tw-shrink-0 tw-overflow-hidden',
      hasSlipSelection ? 'tw-bg-transparent tw-p-0' : 'bet-slip-vcard--empty',
      isMobile
        ? 'tw-rounded-none tw-border-0 tw-shadow-none'
        : hasSlipSelection
          ? 'tw-min-h-0 tw-flex-1 tw-rounded-none tw-border-0 tw-shadow-none'
          : 'tw-flex-shrink-0 tw-rounded-none tw-border-0 tw-shadow-none',
      lightChrome ? 'bet-slip--light-chrome' : '',
    ]"
    elevation="0">

    <transition name="slide-fade">
      <div :class="hasSlipSelection ? 'tw-transition-colors tw-bg-transparent' : 'bet-slip-empty-state'">
        <template v-if="!hasSlipSelection">
          <img
            class="bet-slip-empty-state__icon"
            :src="emptyBetslipTicketsIcon"
            alt=""
            width="75.33"
            height="75.33"
          />
          <p class="bet-slip-empty-state__text">
            {{ t('components.betSlipToolbar.emptyStateTitle') }}
          </p>
        </template>

        <div
          v-else
          id="betSlip"
          role="tabpanel"
          :class="[
            'slip-body-card',
            slipIsBack ? 'slip-body-card--back' : 'slip-body-card--lay',
            showDesktopSelectionDark ? 'slip-body-card--desktop-selection' : '',
          ]"
        >
          <BetPlacingOverlay />

          <!-- Desktop: dark selection summary -->
          <div v-if="showDesktopSelectionDark" class="slip-selection-dark">
            <div v-if="slipSportCompetitionLabel" class="slip-selection-dark__meta">
              <span v-if="slipSportIcon" class="slip-selection-dark__icon" aria-hidden="true">
                <component :is="slipSportIcon" :width="14" :height="14" />
              </span>
              <span class="slip-selection-dark__meta-text">{{ slipSportCompetitionLabel }}</span>
            </div>
            <p v-if="bet.event_name" class="slip-selection-dark__event">
              {{ bet.event_name }}
            </p>
            <div class="slip-selection-dark__pick">
              <div class="slip-selection-dark__pick-main">
                <span
                  class="slip-selection-dark__odd"
                  :class="slipIsBack ? 'slip-selection-dark__odd--back' : 'slip-selection-dark__odd--lay'"
                >
                  {{ displayOdd }}
                </span>
                <span class="slip-selection-dark__runner">{{ bet.runner_name }}</span>
              </div>
              <span class="slip-selection-dark__limits">
                Min: {{ formatLimitShort(minAmount) }}/Max: {{ formatLimitShort(maxAmount) }}
              </span>
            </div>
          </div>

          <div :class="showDesktopSelectionDark ? 'slip-body-card__fields' : undefined">
          <!-- Stake label + max bet -->
          <div v-if="bet.odd" class="slip-stake-head">
            <span class="slip-stake-head__label">{{ t('sports.home.stake') }}</span>
            <span class="slip-stake-head__limit">
              {{ t('sports.home.maxBet') }}: {{ formatLimitShort(maxAmount) }}
            </span>
          </div>

          <!-- Odds stepper + stake input -->
          <div
            v-if="bet.odd"
            class="slip-odds-stake-row"
          >
            <button
              type="button"
              :disabled="!canAdjustOdds || !betAllow"
              class="slip-odds-step slip-odds-step--minus"
              :aria-label="t('sports.home.decreaseOdds')"
              @click="decreaseOdd"
            >
              −
            </button>
            <input
              :value="displayOdd"
              readonly
              tabindex="-1"
              class="slip-odds-input"
              :aria-label="t('sports.home.odds')"
            />
            <button
              type="button"
              :disabled="!canAdjustOdds || !betAllow"
              class="slip-odds-step slip-odds-step--plus"
              :aria-label="t('sports.home.increaseOdds')"
              @click="increaseOdd"
            >
              +
            </button>
            <input
              :value="bet.stake"
              @input="handleStakeInput"
              type="number"
              name="stake"
              inputmode="decimal"
              step="0.01"
              :placeholder="'0'"
              :disabled="!betAllow"
              class="slip-stake-input"
            />
          </div>

          <!-- Quick stakes grid -->
          <div v-if="bet.odd" class="slip-quick-grid">
            <button
              v-for="button in finalButtons"
              :key="button.id"
              type="button"
              :disabled="isButtonDisabled()"
              class="slip-quick-cell"
              :class="{ 'slip-quick-cell--active': button.amount == bet.stake }"
              @click="changeAmount(button.amount, maxAmount, false)"
            >
              {{ formatQuickAmount(button.amount) }}
            </button>
          </div>

          <!-- Min | Max | Edit | Clear -->
          <div v-if="bet.odd" class="slip-util-row">
            <v-btn
              rounded="0"
              :density="slipDensity"
              :disabled="isMinMaxDisabled(minAmount)"
              variant="flat"
              @click="changeAmount(minAmount, minAmount, true)"
              class="slip-util slip-util--min"
            >
              {{ t('sports.home.min').toUpperCase() }}
            </v-btn>
            <v-btn
              rounded="0"
              :density="slipDensity"
              :disabled="isMinMaxDisabled(maxAmount)"
              variant="flat"
              @click="changeAmount(maxAmount, maxAmount, true)"
              class="slip-util slip-util--max"
            >
              {{ t('sports.home.max').toUpperCase() }}
            </v-btn>
            <v-btn
              rounded="0"
              :density="slipDensity"
              :disabled="!betAllow || isDemoUser"
              variant="flat"
              @click="handleEditStake"
              class="slip-util slip-util--edit"
            >
              {{ t('sports.home.editStakes') }}
            </v-btn>
            <v-btn
              rounded="0"
              :density="slipDensity"
              :disabled="!betAllow"
              variant="flat"
              @click="bet.stake = null"
              class="slip-util slip-util--clear"
            >
              {{ t('sports.home.betslipClear') }}
            </v-btn>
          </div>

          <BetSlipFeedbackBanner
            v-if="inlineMessage"
            :type="inlineMessage.type"
            :message="inlineMessage.message"
          />

          <!-- Cancel bet | Place bet -->
          <div v-if="bet.odd" class="slip-action-row">
            <v-btn
              rounded="0"
              :density="slipDensity"
              :disabled="!betAllow"
              variant="flat"
              @click="clearSlipSelection"
              class="slip-reset-btn"
            >
              {{ t('sports.home.cancelBet') }}
            </v-btn>
            <v-btn
              rounded="0"
              :density="slipDensity"
              :disabled="bet_status == 'processing' || !bet.stake || bet.stake < 1 || !bet.odd || !betAllow"
              variant="flat"
              @click="handlePlaceBet"
              class="slip-place-btn"
            >
              <template v-if="bet_status == 'processing'">{{ t('sports.home.processing') }}</template>
              <template v-else>
                <span class="slip-place-btn__label">{{ t('sports.home.placeBet') }}</span>
                <span class="slip-place-btn__profit">({{ t('sports.home.profit') }}: {{ slipProfit }})</span>
              </template>
            </v-btn>
          </div>
          </div>
        </div>
      </div>
    </transition>
  </v-card>

    <div
      v-if="!isMobile"
      v-show="slipPanelTab === 'openBet'"
      class="bet-slip-open-bet-pane"
    >
      <div class="tw-p-1">
        <BetHistory
          embedded
          :bet-history="openBetsUseUnsettled ? null : betHistory"
          :event-groups="openBetsUseUnsettled ? unsettledEventGroups : null"
          :loading="openBetsUseUnsettled ? unsettledLoading : false"
          class="tw-border-none tw-shadow-none"
        />
      </div>
      <div
        v-if="showOpenBetEventPagination"
        class="bet-slip-open-bet-pagination"
      >
        <button
          type="button"
          class="bet-slip-open-bet-pagination__btn"
          :disabled="!canGoPrevUnsettledEventPage || unsettledLoading"
          aria-label="Previous events"
          @click="goToPrevUnsettledEventPage"
        >
          ‹
        </button>
        <span class="bet-slip-open-bet-pagination__label">
          {{ unsettledEventPage }} / {{ unsettledTotalEventPages }}
        </span>
        <button
          type="button"
          class="bet-slip-open-bet-pagination__btn"
          :disabled="!canGoNextUnsettledEventPage || unsettledLoading"
          aria-label="Next events"
          @click="goToNextUnsettledEventPage"
        >
          ›
        </button>
      </div>
    </div>

    <!-- Update Stakes Modal -->
    <ButtonUpdateForm v-if="showUpdateForm && !isDemoUser" @close="closeUpdateForm" :buttons="finalButtons"
      @update:success="refreshButtons" persistent />

    <!-- Demo Signup Dialog -->
    <DemoSignupDialog v-model="showDemoDialog" />
  </div>
</template>

<style scoped>
/* Desktop tabbed slip panel — BETSLIP | OPEN BET */
.bet-slip-tabbed-panel {
  overflow: hidden;
  background: transparent;
  flex-shrink: 0;
  width: 100%;
  min-width: 400px;
  max-width: 400px;
  box-sizing: border-box;
}

.bet-slip-tabbed-panel--fill {
  flex: 1 1 auto;
  min-height: 0;
}

/* In the rail the slip aligns with the tab strip — bottom corners only. */
.bet-slip-tabbed-panel .slip-body-card {
  border-radius: 0 0 4px 4px;
}

.bet-slip-open-bet-pane {
  flex-shrink: 0;
  width: 100%;
  min-width: 400px;
  min-height: 311px;
  box-sizing: border-box;
  background: var(--bet-slip-empty-bg);
  border-radius: 0 0 4px 4px;
  overflow: hidden;
}

.bet-slip-open-bet-pane:has(.bet-history-embedded-events) {
  background: #ffffff;
  min-height: 314px;
}

.bet-slip-open-bet-pane > .tw-p-1 {
  padding: 0 !important;
}

.bet-slip-open-bet-pane :deep(.bet-history-root--embedded) {
  background: transparent !important;
  box-shadow: none !important;
  border: 0 !important;
  border-radius: 0 0 4px 4px !important;
  width: 100%;
  min-width: 400px;
}

.bet-slip-open-bet-pane :deep(.bet-history-embedded-events),
.bet-slip-open-bet-pane :deep(.bet-history-event-body),
.bet-slip-open-bet-pane :deep(.v-list) {
  background: #ffffff !important;
}

.bet-slip-open-bet-pane :deep(.bet-history-rows-scroll) {
  max-height: none !important;
  overflow: visible !important;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.bet-slip-open-bet-pane :deep(.bet-history-rows-stack) {
  gap: 0;
  width: 100%;
}

.bet-slip-open-bet-pane :deep(.bet-history-row-item.v-list-item) {
  min-height: 0 !important;
  padding: 0 !important;
}

.bet-slip-open-bet-pane :deep(.bet-history-row-band--embedded-slip) {
  min-height: 27.5px;
}

.bet-slip-open-bet-pane :deep(.bet-history-row-band--embedded-slip),
.bet-slip-open-bet-pane :deep(.bet-history-row-band--back),
.bet-slip-open-bet-pane :deep(.bet-history-row-band--lay) {
  background: #ffffff !important;
}

.bet-slip-open-bet-pane :deep(.bet-panel-empty-message) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 311px;
  margin: 0;
  padding: 0 0.75rem;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0;
  text-transform: uppercase;
  text-align: center;
  color: #000000;
  background: var(--bet-slip-empty-bg) !important;
  border: 0 !important;
  border-radius: 0 0 4px 4px;
}

.bet-slip-open-bet-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-height: 32px;
  padding: 4px 8px 8px;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 0 0 4px 4px;
}

.bet-slip-open-bet-pagination__btn {
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

.bet-slip-open-bet-pagination__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.bet-slip-open-bet-pagination__label {
  min-width: 48px;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  color: #000000;
  text-align: center;
}

.bet-slip-tabs {
  flex-shrink: 0;
  display: flex;
  width: 100%;
  box-sizing: border-box;
}

/* Vuetify's elevated variant paints v-theme--light `surface`, which is #212121. */
.bet-slip-vcard.v-card {
  background: transparent !important;
  color: inherit !important;
}

.bet-slip-vcard--empty.v-card {
  background: var(--bet-slip-empty-bg) !important;
  padding: 0 !important;
  border-radius: 0 0 4px 4px;
  overflow: hidden;
}

.bet-slip-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  box-sizing: border-box;
  width: 100%;
  min-width: 400px;
  height: 311px;
  min-height: 311px;
  padding: 0;
  background: var(--bet-slip-empty-bg);
  border-radius: 0 0 4px 4px;
}

.bet-slip-empty-state__icon {
  display: block;
  height: 75.33px;
  width: 75.33px;
  margin: 0 auto;
  object-fit: fill;
  transform: rotate(-9.91deg);
  opacity: 1;
}

.bet-slip-empty-state__text {
  margin: 4px 0 0;
  color: #000000;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0;
  text-align: center;
  text-transform: uppercase;
}

.bet-slip-vcard--empty > :first-child {
  min-height: 0 !important;
}

.bet-slip-tabs__group {
  display: flex;
  width: 100%;
  min-width: 400px;
  height: 33px;
  min-height: 33px;
  background: var(--color-header-bg, #360952);
  border-radius: 5px 5px 0 0;
  overflow: hidden;
  box-sizing: border-box;
}

.bet-slip-tabs__tab {
  display: inline-flex;
  flex: 1 1 50%;
  max-width: 50%;
  align-items: center;
  justify-content: center;
  gap: 0;
  height: 33px;
  min-height: 33px;
  padding: 0;
  border: 0;
  background: #ca86f3;
  color: #000000;
  font-size: 10px;
  font-weight: 700;
  line-height: 15px;
  text-transform: uppercase;
  letter-spacing: 0;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.bet-slip-tabs__tab--active {
  background: transparent;
  color: #ffffff;
}

/* Match Odds typography — slip root (desktop + mobile) */
.sports-bet-slip-root {
  font-family: inherit;
}

/* Match Odds scale — BET SLIP title on blue bar (white text) */
.sports-bet-slip-root .bet-slip-header-title {
  font-family: inherit !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  line-height: 1.2 !important;
  letter-spacing: 0 !important;
  color: #fff !important;
  text-transform: uppercase;
}

/* BET HISTORY on gold bar (dark text on primary gradient, same scale as market titles) */
.sports-bet-slip-root .bet-history-header-title {
  font-family: inherit !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  line-height: 1.2 !important;
  letter-spacing: 0 !important;
  color: #111827 !important;
  text-transform: uppercase;
}

.sports-bet-slip-root .slip-mobile-limits {
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
  color: #525252;
}

.sports-bet-slip-root .slip-back-lay-chip {
  font-family: inherit !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  letter-spacing: 0 !important;
  text-transform: uppercase;
}

.sports-bet-slip-root .slip-back-lay-chip--back,
.sports-bet-slip-root .slip-back-lay-chip--back :deep(.v-chip__content) {
  color: #2196f3 !important;
}

.sports-bet-slip-root .slip-back-lay-chip--lay,
.sports-bet-slip-root .slip-back-lay-chip--lay :deep(.v-chip__content) {
  color: #f44336 !important;
}

.bet-slip-vcard :deep(.v-card__underlay),
.bet-slip-vcard :deep(.v-card__overlay) {
  opacity: 0 !important;
}

/* Header: light blue + charcoal wedge (mockup) */
.bet-slip-header__brand {
  clip-path: polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%);
  position: relative;
}

.bet-slip-header__brand::after {
  content: '';
  position: absolute;
  right: -3px;
  top: 0;
  width: 8px;
  height: 100%;
  background: inherit;
}

.bet-slip-header__accent {
  margin-left: -18px;
  min-height: 44px;
  clip-path: polygon(20px 0, 100% 0, 100% 100%, 0 100%);
  position: relative;
}

.bet-slip-header__accent::before {
  content: '';
  position: absolute;
  left: 16px;
  top: 0;
  width: 4px;
  height: 100%;
  background: #4a5568;
}

@media (min-width: 768px) {
  .bet-slip-header__accent {
    min-height: unset;
  }
}

/* Bet History header: MY BETS style */
.bet-history-header__brand {
  clip-path: polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%);
  position: relative;
}

.bet-history-header__brand::after {
  content: '';
  position: absolute;
  right: -3px;
  top: 0;
  width: 8px;
  height: 100%;
  background: #b7862f;
}

.bet-history-header__accent {
  margin-left: -18px;
  clip-path: polygon(20px 0, 100% 0, 100% 100%, 0 100%);
  position: relative;
}

.bet-history-header__accent::before {
  content: '';
  position: absolute;
  left: 16px;
  top: 0;
  width: 4px;
  height: 100%;
  background: #5a5a5a;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  opacity: 1;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
</style>
