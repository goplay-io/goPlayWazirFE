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
  return props.inline ? formatQuickAmountMobile(amount) : formatQuickAmount(amount);
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
          <div v-if="inline" class="slip-odds-stepper">
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
          <input
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

        <div class="slip-quick-grid">
          <button
            v-for="button in finalButtons"
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

        <div
          class="slip-util-row"
          :class="{ 'slip-util-row--mobile': inline }"
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
            {{ inline ? t('sports.home.betslipCancel') : t('sports.home.cancelBet') }}
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
              {{ t('sports.home.placeBet') }}
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
  background: #ffffff;
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
