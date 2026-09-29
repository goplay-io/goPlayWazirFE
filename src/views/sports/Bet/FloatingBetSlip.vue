<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar';
import { useDemoUser } from '@/composables/useDemoUser';
import DemoSignupDialog from '@/components/DemoSignupDialog.vue';
import ButtonUpdateForm from './ButtonUpdateForm.vue';
import { useI18n } from 'vue-i18n';
import { useOddsLadder } from '@/composables/useOddsLadder';
import { applyStakeInput } from '@/utils/stakeInput.js';
import BetSlipFeedbackBanner from '@/components/sports/BetSlipFeedbackBanner.vue';
import BetPlacingOverlay from '@/components/BetPlacingOverlay.vue';
import { useBetSlipFeedback } from '@/composables/useBetSlipFeedback';

const SLIP_WIDTH = 400;
const SLIP_APPROX_HEIGHT = 274;
const GAP = 6;

const props = defineProps({
  bet_error: null,
  betAllow: null,
  bet: null,
  buttons: null,
  changeAmount: null,
  placeBet: null,
  minAmount: null,
  maxAmount: null,
  anchorRect: { type: Object, default: null },
  /** When true, render in document flow (inline host) instead of fixed to viewport */
  inline: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'update:buttons', 'inline-mounted']);

const slipEl = ref(null);

const onDocMousedown = (e) => {
  if (slipEl.value && !slipEl.value.contains(e.target)) {
    handleClose();
  }
};

onMounted(() => {
  if (props.inline) {
    nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => emit('inline-mounted'));
      });
    });
    return;
  }
  setTimeout(() => document.addEventListener('mousedown', onDocMousedown), 0);
});
onUnmounted(() => document.removeEventListener('mousedown', onDocMousedown));

const { t } = useI18n();
const { showSuccess, showError, showWarning } = useSnackbar();
const { isDemoUser } = useDemoUser();

const slipStyle = computed(() => {
  if (props.inline) return undefined;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!props.anchorRect) {
    const left = Math.max(8, (vw - SLIP_WIDTH) / 2);
    return { top: `${vh - SLIP_APPROX_HEIGHT - 72}px`, left: `${left}px`, width: `${SLIP_WIDTH}px` };
  }

  const r = props.anchorRect;
  const centerX = r.left + r.width / 2;
  let left = centerX - SLIP_WIDTH / 2;
  left = Math.max(8, Math.min(left, vw - SLIP_WIDTH - 8));

  const showAbove = r.top > vh * 0.5;
  if (showAbove) {
    const top = Math.max(8, r.top - GAP - SLIP_APPROX_HEIGHT);
    return { top: `${top}px`, left: `${left}px`, width: `${SLIP_WIDTH}px` };
  }
  return { top: `${r.bottom + GAP}px`, left: `${left}px`, width: `${SLIP_WIDTH}px` };
});

const bet_status = defineModel('bet_status', { required: true });
const bet_processing = defineModel('bet_processing', { required: true });

const { inlineMessage, clearInlineMessage } = useBetSlipFeedback({
  betStatus: bet_status,
  getBetError: () => props.bet_error,
  getBetRunnerId: () => props.bet?.runner_id,
  showSuccess,
  showError,
  t,
});

const showDemoDialog = ref(false);
const showUpdateForm = ref(false);
const betAllow = ref(props.betAllow || false);

const displayOdd = computed(() => props.bet?.odd ?? null);

const { increaseOdd, decreaseOdd, canAdjustOdds, usesExchangeOddsLadder } = useOddsLadder(() => props.bet);

const staticFallbackButtons = [
  { id: 1, title: '100', amount: 100 },
  { id: 2, title: '500', amount: 500 },
  { id: 3, title: '1000', amount: 1000 },
  { id: 4, title: '5000', amount: 5000 },
  { id: 5, title: '10000', amount: 10000 },
  { id: 6, title: '25000', amount: 25000 },
  { id: 7, title: '50000', amount: 50000 },
  { id: 8, title: '100000', amount: 100000 },
];

const finalButtons = computed(() => {
  if (isDemoUser.value || !props.buttons || props.buttons.length === 0) return staticFallbackButtons;
  return props.buttons;
});

const slipIsBack = computed(() => !!(props.bet?.odd) && props.bet?.is_back);
const slipDensity = computed(() => 'comfortable');

function formatQuickAmount(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return String(amount);
  return n.toLocaleString();
}

function formatQuickAmountMobile(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return String(amount);
  if (n >= 1000 && n % 1000 === 0) return `${n / 1000}k`;
  if (n >= 1000 && n % 500 === 0) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toLocaleString();
}

function formatQuickLabel(amount) {
  if (props.inline) return `+ ${amount}`;
  return formatQuickAmount(amount);
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

const slipProfitLabel = computed(() => {
  const value = Number(slipProfit.value);
  if (!Number.isFinite(value) || value === 0) return '0';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
});

const referenceQuickButtons = [
  { id: 'ref-100', amount: 100 },
  { id: 'ref-200', amount: 200 },
  { id: 'ref-300', amount: 300 },
  { id: 'ref-500', amount: 500 },
  { id: 'ref-1000', amount: 1000 },
  { id: 'ref-2000', amount: 2000 },
];

const quickButtons = computed(() => (props.inline ? referenceQuickButtons : finalButtons.value));

const slipDelayLabel = computed(() => {
  const value = Number(props.bet?.bet_delay);
  if (!Number.isFinite(value)) return '';
  return `${value}s`;
});

const isButtonDisabled = () => !betAllow.value || !props.bet?.odd;

const isMinMaxDisabled = (amount) =>
  !betAllow.value || !props.bet?.odd || amount == null;

const handleStakeInput = (event) => {
  applyStakeInput(props.bet, event);
};

const clearSlipSelection = () => {
  clearInlineMessage();
  if (props.bet) {
    props.bet.stake = null;
    props.bet.odd = null;
  }
  handleClose();
};

const handlePlaceBet = () => {
  if (isDemoUser.value) {
    showDemoDialog.value = true;
    return;
  }
  if (props.placeBet) props.placeBet();
};

const handleClose = () => {
  emit('close');
};

const refreshButtons = (updatedButtons) => {
  if (!isDemoUser.value) {
    emit('update:buttons', updatedButtons);
  }
  showUpdateForm.value = false;
};

watch(() => props.betAllow, (newValue, oldValue) => {
  betAllow.value = newValue;
  if (newValue === false && oldValue === true) {
    showWarning(t('sports.home.bettingBlocked'), { timeout: 8000 });
  }
});

watch(() => bet_status.value, (newStatus) => {
  if (newStatus === 'success') {
    handleClose();
  }
});
</script>

<template>
  <Teleport to="body" :disabled="inline">
    <div
      ref="slipEl"
      :class="[
        'slip-form-root',
        inline ? 'slip-form-root--mobile-inline inline-bet-slip-embed' : 'floating-bet-slip',
      ]"
      :style="slipStyle"
    >
      <BetPlacingOverlay />

      <div
        v-if="inline"
        class="slip-mobile-header"
      >
        <span class="slip-mobile-header__runner">{{ bet?.runner_name || bet?.market_name || '' }}</span>
        <div class="slip-mobile-header__limits">
          <div>{{ t('sports.home.min') }}: {{ formatLimitShort(minAmount) }}</div>
          <div>{{ t('sports.home.max') }}: {{ formatLimitShort(maxAmount) }}</div>
        </div>
      </div>

      <div
        v-if="bet?.odd"
        id="betSlip"
        role="dialog"
        aria-label="Bet slip"
        :class="[
          'slip-body-card',
          inline ? 'slip-body-card--mobile' : 'slip-body-card--desktop-selection',
          slipIsBack ? 'slip-body-card--back' : 'slip-body-card--lay',
        ]"
      >
        <div class="slip-body-card__fields">
        <div v-if="!inline" class="slip-stake-head">
          <span class="slip-stake-head__label">{{ t('sports.home.stake') }}</span>
          <span class="slip-stake-head__limit">
            {{ t('sports.home.maxBet') }}: {{ formatLimitShort(maxAmount) }}
          </span>
        </div>

        <div
          class="slip-odds-stake-row"
          :class="{ 'slip-odds-stake-row--mobile': inline }"
        >
          <div v-if="inline" class="slip-odds-field">
            <label class="slip-field-label">{{ t('sports.home.odds') }}</label>
            <div class="slip-odds-stepper">
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
            </div>
          </div>
          <template v-else>
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
          </template>
          <div v-if="inline" class="slip-stake-field">
            <label class="slip-field-label">{{ t('sports.home.stake') }}</label>
            <input
              :value="bet.stake"
              @input="handleStakeInput"
              type="number"
              name="stake"
              inputmode="decimal"
              step="0.01"
              :placeholder="`Max bet: ${formatLimitShort(maxAmount)}`"
              :disabled="!betAllow"
              class="slip-stake-input"
            />
          </div>
          <input
            v-else
            :value="bet.stake"
            @input="handleStakeInput"
            type="number"
            name="stake"
            inputmode="decimal"
            step="0.01"
            placeholder="0"
            :disabled="!betAllow"
            class="slip-stake-input"
          />
        </div>

        <div class="slip-quick-box" :class="{ 'slip-quick-box--mobile': inline }">
        <div class="slip-quick-grid">
          <button
            v-for="button in quickButtons"
            :key="button.id"
            type="button"
            :disabled="isButtonDisabled()"
            class="slip-quick-cell"
            :class="{ 'slip-quick-cell--active': button.amount == bet.stake }"
            @click="changeAmount(button.amount, maxAmount, false)"
          >
            {{ formatQuickLabel(button.amount) }}
          </button>
        </div>
        </div>

        <div
          v-if="!inline"
          class="slip-util-row"
        >
          <v-btn
            rounded="0"
            :density="slipDensity"
            :disabled="isMinMaxDisabled(minAmount)"
            variant="flat"
            class="slip-util slip-util--min"
            @click="changeAmount(minAmount, minAmount, true)"
          >
            {{ t('sports.home.min').toUpperCase() }}
          </v-btn>
          <v-btn
            rounded="0"
            :density="slipDensity"
            :disabled="isMinMaxDisabled(maxAmount)"
            variant="flat"
            class="slip-util slip-util--max"
            @click="changeAmount(maxAmount, maxAmount, true)"
          >
            {{ t('sports.home.max').toUpperCase() }}
          </v-btn>
          <v-btn
            rounded="0"
            :density="slipDensity"
            :disabled="!betAllow || isDemoUser"
            variant="flat"
            class="slip-util slip-util--edit"
            @click="showUpdateForm = true"
          >
            {{ t('sports.home.editStakes') }}
          </v-btn>
          <v-btn
            rounded="0"
            :density="slipDensity"
            :disabled="!betAllow"
            variant="flat"
            class="slip-util slip-util--clear"
            @click="bet.stake = null"
          >
            {{ t('sports.home.betslipClear') }}
          </v-btn>
        </div>

        <BetSlipFeedbackBanner
          v-if="inlineMessage"
          :type="inlineMessage.type"
          :message="inlineMessage.message"
        />

        <div
          class="slip-action-row"
          :class="{ 'slip-action-row--mobile': inline }"
        >
          <v-btn
            rounded="0"
            :density="slipDensity"
            :disabled="!betAllow"
            variant="flat"
            class="slip-reset-btn"
            @click="clearSlipSelection"
          >
            {{ t('sports.home.cancelBet') }}
          </v-btn>
          <v-btn
            rounded="0"
            :density="slipDensity"
            :disabled="bet_status == 'processing' || !bet.stake || bet.stake < 1 || !bet.odd || !betAllow"
            variant="flat"
            class="slip-place-btn"
            @click="handlePlaceBet"
          >
            <template v-if="bet_status == 'processing'">{{ t('sports.home.processing') }}</template>
            <template v-else-if="inline">
              <span class="slip-place-btn__stack">
                <span class="slip-place-btn__label">{{ t('sports.home.placeBet') }}</span>
                <span class="slip-place-btn__profit">{{ t('sports.home.profit') }} : {{ slipProfitLabel }}</span>
              </span>
              <span v-if="slipDelayLabel" class="slip-place-btn__delay">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M9.91095 3.68857L10.3814 3.21808C10.5643 3.03525 10.5643 2.7388 10.3814 2.55606C10.1986 2.37323 9.90225 2.37323 9.71942 2.55606L9.24893 3.02655C8.45956 2.36884 7.50037 1.9715 6.47717 1.87848V0.93631H6.92972C7.18826 0.93631 7.39783 0.726654 7.39783 0.468109C7.39783 0.209564 7.18826 0 6.92972 0H5.08832C4.82977 0 4.62021 0.209564 4.62021 0.468109C4.62021 0.726654 4.82977 0.93631 5.08832 0.93631H5.54086V1.87848C2.97958 2.11139 0.9375 4.26306 0.9375 6.92844C0.9375 9.73141 3.20572 12 6.00906 12C8.81195 12 11.0805 9.73178 11.0805 6.92844C11.0805 5.73111 10.6682 4.59723 9.91095 3.68857ZM6.00897 11.0637C3.72885 11.0637 1.87372 9.20865 1.87372 6.92844C1.87372 4.64832 3.72885 2.79327 6.00897 2.79327C8.28918 2.79327 10.1442 4.64832 10.1442 6.92844C10.1442 9.20865 8.28918 11.0637 6.00897 11.0637ZM8.1785 4.759C8.36133 4.94183 8.36133 5.23828 8.1785 5.42102L6.34003 7.25949C6.1572 7.44232 5.86075 7.44232 5.67801 7.25949C5.49518 7.07666 5.49518 6.78021 5.67801 6.59747L7.51639 4.759C7.69922 4.57617 7.99567 4.57617 8.1785 4.759Z" fill="currentColor" />
                </svg>
                <span>{{ slipDelayLabel }}</span>
              </span>
            </template>
            <template v-else>
              <span class="slip-place-btn__label">{{ t('sports.home.placeBet') }}</span>
              <span class="slip-place-btn__profit">({{ t('sports.home.profit') }}: {{ slipProfit }})</span>
            </template>
          </v-btn>
        </div>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <ButtonUpdateForm
      v-if="showUpdateForm && !isDemoUser"
      @close="showUpdateForm = false"
      :buttons="finalButtons"
      @update:success="refreshButtons"
      persistent
    />
  </Teleport>
  <DemoSignupDialog v-model="showDemoDialog" />
</template>

<style scoped>
.floating-bet-slip {
  position: fixed;
  z-index: 1201;
  overflow-y: auto;
  max-height: 80vh;
  animation: slip-pop 0.18s ease-out;
}

.inline-bet-slip-embed {
  position: relative;
  width: 100%;
  max-width: 100%;
  animation: slip-pop 0.18s ease-out;
}

.slip-form-root--mobile-inline {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: transparent;
}

.slip-form-root--mobile-inline :deep(.slip-body-card) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

@keyframes slip-pop {
  from {
    opacity: 0;
    transform: scale(0.94) translateY(-6px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
