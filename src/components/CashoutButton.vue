<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useBetStore } from '@/stores/bet';
import useCashout, { getSpeedCashCooldownSeconds } from '@/composables/useCashout';
import useDevices from '@/composables/useDevices';

const betStore = useBetStore();
const { isMobile } = useDevices();
const {
  isCashoutAvailable,
  isLossCutAvailable,
  isSpeedCashAvailable,
  executeSpeedCash,
  isProcessing
} = useCashout();

const rootEl = ref(null);
const showSpeedCashDialog = ref(false);
const speedCashError = ref('');
const nowTick = ref(Date.now());
let cooldownTicker = null;

const props = defineProps({
  marketId: [String, Number],
  runners: Array,
  outcomes: Object,
  betAllow: Boolean,
  marketStatus: {
    type: String,
    default: null
  },
  eventId: [String, Number],
  eventTypeId: [String, Number],
  eventName: String,
  providerId: [String, Number],
  minBet: Number,
  maxBet: Number,
  bettingType: String,
  marketType: {
    type: String,
    default: 'MO'
  },
  marketTypeName: String,
size: {
    type: String,
    default: 'small'
  },
  cashoutActive: {
    type: Boolean,
    default: true
  },
  speedCashoutActive: {
    type: Boolean,
    default: true
  }
});

const INACTIVE_STATUSES = ['SUSPENDED', 'REMOVED', 'LOSER', 'WINNER', 'BALL_RUNNING', 'BALL RUNNING'];

onMounted(() => {
  cooldownTicker = setInterval(() => {
    nowTick.value = Date.now();
  }, 250);
});

onUnmounted(() => {
  if (cooldownTicker) clearInterval(cooldownTicker);
});

const effectiveBetAllow = computed(() => {
  if (!props.betAllow) return false;
  if (props.marketStatus && INACTIVE_STATUSES.includes(String(props.marketStatus).toUpperCase())) return false;

  if (props.runners?.length) {
    const allInactive = props.runners.every((runner) => {
      const status = String(runner?.status || '').toUpperCase();
      return status !== 'ACTIVE' && status !== '';
    });
    if (allInactive) return false;
  }

  return true;
});

/** Prefer parent prop; fall back to store so exposure updates after bets settle. */
const resolvedOutcomes = computed(() => props.outcomes ?? betStore.betOutcomes ?? {});

const speedCashAvailability = computed(() => isSpeedCashAvailable(
  props.marketId,
  props.runners,
  resolvedOutcomes.value,
  props.eventTypeId,
  props.providerId
));

const speedCashCooldownSeconds = computed(() => {
  nowTick.value;
  return getSpeedCashCooldownSeconds(props.marketId);
});

const isSpeedCashOnCooldown = computed(() => speedCashCooldownSeconds.value > 0);

const isCashoutFeatureEnabled = computed(() => props.cashoutActive !== false);
const isSpeedCashoutFeatureEnabled = computed(() => props.speedCashoutActive !== false);

const showSpeedCash = computed(() =>
  isSpeedCashoutFeatureEnabled.value && speedCashAvailability.value.available
);

const availability = computed(() => isCashoutAvailable(
  props.marketId,
  props.runners,
  resolvedOutcomes.value,
  effectiveBetAllow.value,
  props.minBet,
  props.maxBet,
  props.bettingType || 'ODDS'
));

const lossCutAvailability = computed(() => isLossCutAvailable(
  props.marketId,
  props.runners,
  resolvedOutcomes.value,
  effectiveBetAllow.value,
  props.minBet,
  props.maxBet,
  props.bettingType || 'ODDS'
));

const cashoutDisplayAmount = computed(() => availability.value.displayPL ?? availability.value.lockedPL);
const lossCutDisplayAmount = computed(() => lossCutAvailability.value.displayPL ?? lossCutAvailability.value.lockedPL);
const isTwoRunnerMarket = computed(() => props.runners?.length === 2);
const showCashoutButton = computed(() =>
  isTwoRunnerMarket.value && isCashoutFeatureEnabled.value && !showSpeedCash.value && availability.value.available === true
);
const showLossCutButton = computed(() =>
  isTwoRunnerMarket.value && isCashoutFeatureEnabled.value && lossCutAvailability.value.available === true
);
const showSpeedCashButton = computed(() => isTwoRunnerMarket.value && showSpeedCash.value);
const shouldRender = computed(() =>
  isTwoRunnerMarket.value && (showSpeedCash.value || isCashoutFeatureEnabled.value)
);
const isSpeedCashDisabled = computed(() => isProcessing.value || isSpeedCashOnCooldown.value);

const textClass = computed(() => {
  const classes = {
    'x-small': 'tw-text-xs',
    'small': 'tw-text-sm',
    'default': 'tw-text-base',
    'large': 'tw-text-lg',
    'x-large': 'tw-text-xl'
  };
  return classes[props.size] || 'tw-text-sm';
});

const lockedPlClass = computed(() => {
  const classes = {
    'x-small': 'tw-text-[10px]',
    'small': 'tw-text-xs',
    'default': 'tw-text-sm',
    'large': 'tw-text-base',
    'x-large': 'tw-text-lg'
  };
  return classes[props.size] || 'tw-text-xs';
});

const amountIconSize = computed(() => {
  const sizes = {
    'x-small': 10,
    'small': 12,
    'default': 14,
    'large': 16,
    'x-large': 18
  };
  return sizes[props.size] || 12;
});

const getRunnerBetId = (runner) => runner?.selection_id || runner?.selectionId || runner?.id;

const loadHedgeBet = async (hedgeAvailability, marketTypeName, { isCashoutHedge = false } = {}) => {
  const { hedgeRunner, hedgeOdd, hedgeSide, hedgeStake, idealStake } = hedgeAvailability;
  const targetRunnerId = getRunnerBetId(hedgeRunner);

  rootEl.value?.dispatchEvent(new CustomEvent('cashout-slip-target', {
    detail: { runnerId: targetRunnerId, marketId: props.marketId },
    bubbles: true
  }));

  await betStore.handleSelectBet({
    odd: hedgeOdd,
    backOrLay: hedgeSide,
    runnerId: targetRunnerId,
    runnerName: hedgeRunner.name || 'Hedge',
    marketId: props.marketId,
    eventId: props.eventId,
    type: props.marketType,
    betting_type: props.bettingType || 'ODDS',
    marketTypeName,
    minAmount: props.minBet,
    maxAmount: props.maxBet,
    skipOneClick: true,
    isCashoutHedge
  }, props.eventTypeId, props.eventName, props.runners?.length || 0);

  await new Promise((resolve) => setTimeout(resolve, 50));
  const stakeAmount = isCashoutHedge && idealStake != null ? idealStake : hedgeStake;
  betStore.bet.stake = Number(Number(stakeAmount).toFixed(2));
};

const handleCashoutClick = async () => {
  if (!availability.value.available) {
    console.warn('Cashout not available:', availability.value.reason);
    return;
  }

  await loadHedgeBet(availability.value, props.marketTypeName || 'Cashout', { isCashoutHedge: true });
};

const handleLossCutClick = async () => {
  if (!lossCutAvailability.value.available) {
    console.warn('Loss cut not available:', lossCutAvailability.value.reason);
    return;
  }

  await loadHedgeBet(lossCutAvailability.value, props.marketTypeName || 'Loss Cut');
};

const getRunnerDisplayName = (runner, fallback) =>
  (runner?.name || runner?.runner_name || runner?.runnerName || fallback || 'Runner').trim();

const speedCashRunnerColumns = computed(() => {
  const runners = props.runners || [];
  const netProfit = speedCashAvailability.value?.netProfit
    ?? speedCashAvailability.value?.estimatedPayout;
  return [
    { name: getRunnerDisplayName(runners[0], 'Runner 1'), amount: netProfit },
    { name: getRunnerDisplayName(runners[1], 'Runner 2'), amount: netProfit }
  ];
});

const openSpeedCashDialog = () => {
  if (!speedCashAvailability.value.available || isSpeedCashDisabled.value) return;
  speedCashError.value = '';
  showSpeedCashDialog.value = true;
};

const closeSpeedCashDialog = () => {
  if (isProcessing.value) return;
  showSpeedCashDialog.value = false;
};

const confirmSpeedCash = async () => {
  if (isSpeedCashOnCooldown.value) return;
  speedCashError.value = '';
  const result = await executeSpeedCash({
    marketId: props.marketId,
    eventId: props.eventId
  });

  if (!result.success) {
    speedCashError.value = result.error || 'Speed Cash failed';
    return;
  }

  showSpeedCashDialog.value = false;
};
</script>

<template>
  <div v-if="shouldRender" ref="rootEl" class="tw-flex tw-gap-1">
    <v-btn
      v-if="showSpeedCashButton"
      :size="isMobile ? 'x-small' : size"
      density="default"
      variant="flat"
      color="success"
      class="tw-flex-shrink-0 cashout-action-btn cashout-action-btn--speed"
      :class="{ 'cashout-action-btn--mobile': isMobile }"
      :disabled="isSpeedCashDisabled"
      :style="isMobile ? { height: '18px', minWidth: '0', padding: '0 6px' } : {}"
      @click="openSpeedCashDialog"
    >
      <span :class="isMobile ? 'cashout-action-btn__label' : textClass">
        Speed Cash{{ isSpeedCashOnCooldown ? ` (${speedCashCooldownSeconds}s)` : '' }}
      </span>
    </v-btn>

    <v-btn
      v-if="showCashoutButton"
      :size="isMobile ? 'x-small' : size"
      density="default"
      variant="flat"
      color="orange"
      class="tw-flex-shrink-0 cashout-action-btn cashout-action-btn--cashout"
      :class="{ 'cashout-action-btn--mobile': isMobile }"
      :style="isMobile ? { height: '18px', minWidth: '0', padding: '0 6px' } : {}"
      @click="handleCashoutClick"
    >
      <span :class="isMobile ? 'cashout-action-btn__label' : textClass">Cashout</span>
      <template v-if="!isMobile">
        <span class="tw-ml-1 tw-inline-flex tw-items-center" :class="lockedPlClass">
          (<v-icon :size="amountIconSize" class="cashout-amount-icon">mdi-currency-inr</v-icon>{{ cashoutDisplayAmount }})
        </span>
      </template>
    </v-btn>

    <v-btn
      v-if="showLossCutButton"
      :size="isMobile ? 'x-small' : size"
      density="default"
      variant="flat"
      color="success"
      class="tw-flex-shrink-0 cashout-action-btn cashout-action-btn--loss-cut"
      :class="{ 'cashout-action-btn--mobile': isMobile }"
      :style="isMobile ? { height: '18px', minWidth: '0', padding: '0 6px' } : {}"
      @click="handleLossCutClick"
    >
      <span :class="isMobile ? 'cashout-action-btn__label' : textClass">Loss cut</span>
      <template v-if="!isMobile">
        <span class="tw-ml-1 tw-inline-flex tw-items-center" :class="lockedPlClass">
          (<v-icon :size="amountIconSize" class="cashout-amount-icon">mdi-currency-inr</v-icon>{{ lossCutDisplayAmount }})
        </span>
      </template>
    </v-btn>
  </div>

  <v-dialog
    v-model="showSpeedCashDialog"
    max-width="400"
    content-class="speed-cash-dialog-overlay"
  >
    <div class="speed-cash-dialog">
      <div class="speed-cash-dialog__header">
        <h2 class="speed-cash-dialog__title">SPEED CASH</h2>
        <button
          type="button"
          class="speed-cash-dialog__close"
          aria-label="Close"
          :disabled="isProcessing"
          @click="closeSpeedCashDialog"
        >
          <v-icon size="18" color="white">mdi-close</v-icon>
        </button>
      </div>

      <div class="speed-cash-dialog__runners">
        <div
          v-for="(column, index) in speedCashRunnerColumns"
          :key="`${column.name}-${index}`"
          class="speed-cash-dialog__runner"
          :class="{ 'speed-cash-dialog__runner--divider': index === 0 }"
        >
          <span class="speed-cash-dialog__runner-name">{{ column.name }}</span>
          <span class="speed-cash-dialog__runner-amount">{{ column.amount }}</span>
        </div>
      </div>

      <p class="speed-cash-dialog__fee">
        We are deducting {{ speedCashAvailability.feePercent }}% fee on Speed Cashout.
      </p>

      <p v-if="speedCashError" class="speed-cash-dialog__error">{{ speedCashError }}</p>

      <button
        type="button"
        class="speed-cash-dialog__confirm"
        :disabled="isProcessing"
        @click="confirmSpeedCash"
      >
        <v-progress-circular
          v-if="isProcessing"
          indeterminate
          size="18"
          width="2"
          color="white"
          class="tw-mr-2"
        />
        SPEED CASH
      </button>
    </div>
  </v-dialog>
</template>

<style scoped>
.cashout-action-btn {
  text-transform: none !important;
  letter-spacing: normal;
}

.cashout-action-btn--mobile,
.cashout-action-btn--mobile :deep(.v-btn__content) {
  font-size: 10px !important;
  line-height: 1.1;
}

.cashout-action-btn__label {
  font-size: 10px;
  line-height: 1.1;
  font-weight: 600;
  text-transform: none;
}

.cashout-amount-icon {
  margin-right: 1px;
  opacity: 0.95;
}

.speed-cash-dialog {
  overflow: hidden;
  border-radius: 10px;
  background: #ffffff;
  color: #111827;
  border: 1px solid var(--color-header-bg, #360952);
  box-shadow: 0 18px 40px rgba(54, 9, 82, 0.28);
}

.speed-cash-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
}

.speed-cash-dialog__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #111827;
}

.speed-cash-dialog__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 9999px;
  background: var(--color-header-bg, #360952);
  cursor: pointer;
  flex-shrink: 0;
}

.speed-cash-dialog__close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.speed-cash-dialog__runners {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px dashed #111827;
  border-bottom: 1px dashed #111827;
}

.speed-cash-dialog__runner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 12px;
  text-align: center;
}

.speed-cash-dialog__runner--divider {
  border-right: 1px dashed #111827;
}

.speed-cash-dialog__runner-name {
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.25;
  text-transform: uppercase;
  color: #111827;
}

.speed-cash-dialog__runner-amount {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
  color: var(--color-success, #16a34a);
}

.speed-cash-dialog__fee {
  margin: 0;
  padding: 12px 16px;
  text-align: center;
  font-size: 0.875rem;
  color: #111827;
}

.speed-cash-dialog__error {
  margin: 0;
  padding: 0 16px 8px;
  text-align: center;
  font-size: 0.875rem;
  color: #c62828;
}

.speed-cash-dialog__confirm {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  border: none;
  margin: 0;
  padding: 14px 16px;
  background: var(--color-header-bg, #360952);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
}

.speed-cash-dialog__confirm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.speed-cash-dialog__confirm:not(:disabled):hover {
  filter: brightness(1.08);
}
</style>
