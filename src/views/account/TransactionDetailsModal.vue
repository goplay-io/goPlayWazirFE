<template>
  <v-dialog
    v-model="internalShow"
    :max-width="betDetailsDialogMaxWidth"
    :fullscreen="false"
    persistent
    scrim="background"
    content-class="bet-details-overlay-content"
    class="bet-details-dialog"
  >
    <template #default>
      <div
        class="bet-details-modal-shell tw-shadow-lg tw-overflow-hidden"
        :class="{
          'bet-details-mobile': isMobile,
          'bet-details-modal-shell--centered': isMobile,
          'bet-details-modal-shell--casino': isCasinoView,
          'tw-bg-theme-surface': !isCasinoView,
        }"
      >
        <!-- Modal Header -->
        <div
          class="bet-details-modal-header tw-flex tw-justify-between tw-items-center tw-px-4 tw-py-3 tw-text-white tw-border-b tw-border-slate-950/40">
          <h2 class="tw-text-base tw-font-semibold tw-tracking-tight tw-m-0">{{ t('account.statement.betDetails') }}</h2>
          <button
            type="button"
            @click="closeDialog"
            class="bet-details-modal-close tw-bg-transparent tw-text-white/90 hover:tw-bg-white/12 hover:tw-text-white tw-text-sm tw-p-2 tw-inline-flex tw-items-center tw-justify-center tw-border-0 tw-cursor-pointer"
            :aria-label="t('components.globalSnackbar.close')"
          >
            <svg class="tw-w-5 tw-h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
        <div
          class="tw-p-0 tw-overflow-auto modal-body"
          :class="{
            'tw-bg-theme-background-alt': !isCasinoView,
            'modal-body--casino': isCasinoView,
            'modal-body--mobile': isMobile,
            'modal-body--sheet': isMobile,
          }"
          :style="isMobile ? 'max-height: min(72dvh, 520px)' : 'max-height: 80vh'"
        >
          <!-- Loading State -->
          <div v-if="loading" class="tw-flex tw-justify-center tw-items-center tw-py-6 tw-px-4">
            <v-progress-circular indeterminate color="primary" size="36"></v-progress-circular>
            <span class="tw-ml-3 tw-text-theme-text">{{ t('common.loading') }}</span>
          </div>

          <!-- Bet Details Table -->
          <div v-else-if="betData && betData.length > 0">
            <table class="bet-simple-table" :class="{ 'bet-simple-table--mobile': isMobile }">
              <colgroup>
                <col class="bet-col-nation" />
                <col class="bet-col-rate" />
                <col class="bet-col-amount" />
                <col class="bet-col-winloss" />
              </colgroup>
              <thead>
                <tr>
                  <th class="bet-th bet-th-theme tw-text-left">{{ t('account.statement.tableHeaders.nation') }}</th>
                  <th class="bet-th bet-th-theme tw-text-center bet-th-compact">{{ t('account.statement.tableHeaders.rate') }}</th>
                  <th class="bet-th bet-th-theme tw-text-center bet-th-compact">{{ t('account.statement.tableHeaders.amount') }}</th>
                  <th class="bet-th bet-th-theme tw-text-center bet-th-compact bet-th-winloss">{{ t('account.statement.tableHeaders.winLoss') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in betData" :key="index" :class="getBetRowClass(item)">
                  <!-- Col 1: event name + runner name + date -->
                  <td class="bet-td tw-align-top" :class="{ 'bet-td-nation--mobile': isMobile }">
                    <template v-if="isMobile">
                      <div class="bet-nation-mobile">
                        <p v-if="item.event_name" class="bet-nation-mobile__event">{{ item.event_name }}</p>
                        <p class="bet-nation-mobile__meta">
                          <span class="bet-nation-mobile__selection">{{ nationDisplay(item) }}</span>
                          <span class="bet-nation-mobile__dot" aria-hidden="true">·</span>
                          <time class="bet-nation-mobile__time" :datetime="item.place_date || undefined">{{
                            item.place_date ? formatDate(item.place_date) : '—'
                          }}</time>
                        </p>
                      </div>
                    </template>
                    <template v-else>
                      <span v-if="item.event_name" class="tw-block tw-font-bold tw-text-black tw-text-xs tw-leading-snug tw-mb-0.5">{{ item.event_name }}</span>
                      <span class="tw-block tw-text-black tw-text-xs tw-leading-snug">
                        <span class="tw-font-bold">Nation:</span> {{ nationDisplay(item) }}
                      </span>
                      <span class="tw-block tw-text-black tw-text-xs tw-mt-0.5">
                        <span class="tw-font-bold">Place Date:</span> {{ item.place_date ? formatDate(item.place_date) : '-' }}
                      </span>
                    </template>
                  </td>
                  <!-- Col 2: Rate/Odds -->
                  <td class="bet-td tw-text-center tw-text-black tw-text-xs tw-font-medium tw-align-middle">{{ item.rate || '-' }}</td>
                  <!-- Col 3: Amount -->
                  <td class="bet-td tw-text-center tw-text-black tw-text-xs tw-font-medium tw-align-middle">{{ formatAmount(item.amount) }}</td>
                  <!-- Col 4: Profit/Loss -->
                  <td class="bet-td tw-text-center tw-text-xs tw-font-semibold tw-align-middle"
                    :class="item.win_loss != null ? (item.win_loss >= 0 ? 'tw-text-green-700' : 'tw-text-red-600') : 'tw-text-black'">
                    {{ item.win_loss != null ? formatProfitLoss(item.win_loss) : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- No Data State -->
          <div v-else class="tw-text-center tw-py-8 tw-px-4">
            <v-icon size="48" class="tw-mb-4 tw-text-theme-text-secondary">mdi-file-document-outline</v-icon>
            <p class="tw-text-theme-text tw-mb-2">{{ t('account.statement.noBetDetails') }}</p>
          </div>
        </div>
      </div>
    </template>
  </v-dialog>
</template>

<script setup>
import { formatDate } from '@/utils/dateUtils.js'
import { watch, ref, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getBetsByMarketorRound } from '@/api/report/reports.js'
import useDevices from '@/composables/useDevices.js'

const { t } = useI18n()
const { isMobile } = useDevices()

const betDetailsDialogMaxWidth = computed(() =>
  isMobile.value ? 'min(560px, calc(100vw - 32px))' : 900
)

const props = defineProps({
  modelValue: Boolean,
  transaction: Object
})
const emit = defineEmits(['update:modelValue'])

const CASINO_EVENT_TYPE_ID = 99999

function isCasinoTransaction(txn) {
  if (!txn) return false
  if (txn.market_id || txn.order_id) return false
  if (Boolean(txn.game_id)) return true
  if (Number(txn.event_type_id) === CASINO_EVENT_TYPE_ID) return true
  if (txn.event_type_name === 'Casino') return true
  const label = String(
    txn.event_type_name || txn.sport_name || txn.sports || ''
  ).toLowerCase()
  return label.includes('casino')
}

const isCasinoView = computed(() => isCasinoTransaction(props.transaction))

function resolveBetDate(txn) {
  if (!txn) return null
  if (txn.group_date) {
    return String(txn.group_date).slice(0, 10)
  }
  if (txn.created_on) {
    const date = new Date(txn.created_on)
    if (!Number.isNaN(date.getTime())) {
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
  }
  return null
}

const internalShow = ref(props.modelValue)
const loading = ref(false)
const betData = ref([])

watch(() => props.modelValue, (val) => {
  internalShow.value = val
  if (val && props.transaction) {
    fetchBetDetails()
  }
  document.body.style.overflow = val ? 'hidden' : ''
})
watch(internalShow, (val) => {
  emit('update:modelValue', val)
  document.body.style.overflow = val ? 'hidden' : ''
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

function closeDialog() {
  internalShow.value = false
  betData.value = []
}

async function fetchBetDetails() {
  if (!props.transaction) return

  try {
    loading.value = true
    betData.value = []

    let response
    if (isCasinoTransaction(props.transaction)) {
      const gameId = props.transaction.game_id
      const betDate = resolveBetDate(props.transaction)
      if (!gameId || !betDate) {
        betData.value = []
        return
      }
      response = await getBetsByMarketorRound({ gameId, betDate })
    } else {
      const marketId = props.transaction.market_id || props.transaction.order_id
      response = await getBetsByMarketorRound({ marketId })
    }

    const responsePayload = response && response.data ? response.data : response
    const nestedData = responsePayload?.data ?? responsePayload
    const rawData = Array.isArray(nestedData)
      ? nestedData
      : Array.isArray(nestedData?.data)
        ? nestedData.data
        : []

    if (rawData.length > 0) {
      const eventName = props.transaction?.event_name || props.transaction?.description || null
      betData.value = rawData.map(item => normalizeBetItem(item, eventName))
    }
  } catch (error) {
    console.error('Failed to fetch bet details:', error)
    betData.value = []
  } finally {
    loading.value = false
  }
}

function normalizeBetItem(item, eventName = null) {
  const isBack = item?.is_back === true || item?.is_back === 1 || item?.is_back === '1'
  const hasRoundIdItem = Boolean(item?.round_id)
  const side = hasRoundIdItem ? t('account.statement.betTypes.back') : (isBack ? t('account.statement.betTypes.back') : t('account.statement.betTypes.lay'))
  const oddValue = item?.odd || item?.odd === 0 ? item.odd : null
  const rateValue = item?.rate || item?.bet_odds || null
  const composedRate = oddValue != null ? (rateValue ? `${oddValue}/${rateValue}` : oddValue) : rateValue

  return {
    ...item,
    event_name: eventName || item.event_name || null,
    is_back: isBack,
    nation: item.runner_name || item.nation || item.selection_name || '-',
    side,
    rate: composedRate || '-',
    amount: item.stake ?? item.amount ?? 0,
    win_loss: item.profit_loss != null ? item.profit_loss : item.win_loss,
    place_date: item.created_on || item.place_date || null,
    match_date: item.created_on || item.match_date || null,
    rowType: side,
  }
}

function formatAmount(amount) {
  if (amount === null || amount === undefined || amount === '') return '0.00'
  return parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatProfitLoss(amount) {
  if (amount === null || amount === undefined || amount === '') return '0.00'
  const value = parseFloat(amount)
  const formatted = formatAmount(Math.abs(value))
  return value >= 0 ? `+${formatted}` : `-${formatted}`
}

function getBetRowClass(item) {
  if (!item || item.is_back == null) return ''
  return item.is_back ? 'bet-row-back' : 'bet-row-lay'
}

function nationDisplay(item) {
  if (!item) return '-'
  return (item.nation && item.nation !== '-') ? item.nation : (item.round_id || '-')
}
</script>

<style scoped>
/* Theme-aligned modal header */
.bet-details-modal-header {
  background: var(--color-header-bg, #360952);
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.16);
}

.bet-details-modal-shell {
  border-radius: 0 !important;
}

.bet-details-modal-shell--centered {
  border-radius: 12px !important;
  max-height: min(92dvh, 720px);
  display: flex;
  flex-direction: column;
}

.bet-details-modal-shell--centered .modal-body--sheet {
  flex: 0 1 auto;
  min-height: 0;
}

.bet-details-modal-close {
  border-radius: 0 !important;
  min-width: 2.25rem;
  min-height: 2.25rem;
}

.bet-details-modal-shell--casino,
.bet-details-modal-shell--casino .modal-body,
.modal-body--casino {
  background: #000 !important;
}

.bet-details-modal-shell--casino .bet-simple-table tr.bet-row-back,
.bet-details-modal-shell--casino .bet-simple-table tr.bet-row-back td,
.bet-details-modal-shell--casino .bet-simple-table tr.bet-row-lay,
.bet-details-modal-shell--casino .bet-simple-table tr.bet-row-lay td {
  background-color: #000 !important;
}

.bet-details-modal-shell--casino .bet-td {
  border-bottom-color: rgba(255, 255, 255, 0.12) !important;
}

.bet-details-modal-shell--casino .bet-simple-table :deep(.tw-text-black),
.bet-details-modal-shell--casino .bet-td.tw-text-black {
  color: #fff !important;
}

.bet-details-modal-shell--casino .bet-nation-mobile__event {
  color: #fff !important;
}

.bet-details-modal-shell--casino .bet-nation-mobile__meta {
  color: rgba(255, 255, 255, 0.7) !important;
}

@media (max-width: 768px) {
  .bet-details-mobile .modal-body--mobile {
    background: #fff !important;
    padding-top: 0;
    padding-bottom: 0;
  }

  .bet-details-mobile .modal-body--mobile.modal-body--casino {
    background: #000 !important;
  }

  .bet-details-mobile .modal-body--mobile .bet-simple-table {
    margin-top: 0;
    margin-bottom: 0;
  }

  .bet-details-mobile .modal-body--mobile tbody tr:last-child td {
    border-bottom: none;
  }

  [data-theme='dark'] .bet-details-mobile .modal-body--mobile {
    background: var(--color-surface-elevated, #1e1e1e) !important;
  }

  [data-theme='dark'] .bet-details-mobile .modal-body--mobile.modal-body--casino {
    background: #000 !important;
  }

  .bet-details-mobile .bet-th {
    padding: 8px 8px;
    font-size: 10px;
    letter-spacing: 0.02em;
    background-color: var(--color-header-bg, #360952);
    color: #ffffff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    word-break: normal;
    overflow-wrap: normal;
  }

  /* Numeric headers: one line (table word-break was splitting "Amount") */
  .bet-details-mobile .bet-th.bet-th-compact {
    white-space: nowrap;
    padding-left: 4px;
    padding-right: 4px;
  }

  .bet-simple-table--mobile .bet-col-nation {
    width: 40%;
  }
  .bet-simple-table--mobile .bet-col-rate {
    width: 14%;
  }
  .bet-simple-table--mobile .bet-col-amount {
    width: 23%;
  }
  .bet-simple-table--mobile .bet-col-winloss {
    width: 23%;
  }

  [data-theme='dark'] .bet-details-mobile .bet-th {
    background-color: rgba(255, 255, 255, 0.06);
    border-bottom-color: rgba(255, 255, 255, 0.12);
  }

  .bet-details-mobile .bet-td {
    padding: 10px 10px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    vertical-align: middle;
  }

  /* Back (blue) / lay (pink) — same as desktop; was disabled via !isMobile on <tr> */
  .bet-details-mobile:not(.bet-details-modal-shell--casino) .bet-simple-table tr.bet-row-back,
  .bet-details-mobile:not(.bet-details-modal-shell--casino) .bet-simple-table tr.bet-row-back td {
    background-color: var(--color-back-bg-1) !important;
  }

  .bet-details-mobile:not(.bet-details-modal-shell--casino) .bet-simple-table tr.bet-row-lay,
  .bet-details-mobile:not(.bet-details-modal-shell--casino) .bet-simple-table tr.bet-row-lay td {
    background-color: var(--color-lay-bg-1) !important;
  }

  [data-theme='dark'] .bet-details-mobile .bet-td {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }

  .bet-details-mobile .bet-td-nation--mobile {
    padding-right: 4px;
  }

  .bet-nation-mobile {
    margin: 0;
    min-width: 0;
  }

  .bet-nation-mobile__event {
    margin: 0 0 4px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.25;
    color: #111;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  [data-theme='dark'] .bet-nation-mobile__event {
    color: var(--color-text, #f0f0f0);
  }

  .bet-nation-mobile__meta {
    margin: 0;
    font-size: 10px;
    line-height: 1.35;
    color: #5c6370;
    word-break: break-word;
  }

  [data-theme='dark'] .bet-nation-mobile__meta {
    color: rgba(255, 255, 255, 0.65);
  }

  .bet-nation-mobile__dot {
    margin: 0 0.2em;
    opacity: 0.7;
  }

  :deep(.v-overlay__content.bet-details-overlay-content) {
    margin: 0 !important;
    width: calc(100vw - 32px) !important;
    max-width: min(560px, calc(100vw - 32px)) !important;
    max-height: calc(100dvh - 32px) !important;
    height: auto !important;
    top: 50% !important;
    left: 50% !important;
    right: auto !important;
    bottom: auto !important;
    transform: translate(-50%, -50%) !important;
    align-self: center !important;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22) !important;
    border-radius: 12px !important;
    overflow: hidden !important;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .modal-body {
    padding-bottom: calc(120px + env(safe-area-inset-bottom, 0px));
  }
}

.modal-body :deep(.tw-text-theme-text) {
  color: #343434 !important;
}

.bet-simple-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  word-break: break-word;
  overflow-wrap: break-word;
  font-family: inherit;
}

.bet-col-nation {
  width: 55%;
}
.bet-col-rate {
  width: 15%;
}
.bet-col-amount {
  width: 15%;
}
.bet-col-winloss {
  width: 15%;
}

.bet-th {
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 700;
  background: var(--color-header-bg, #360952);
  border-bottom: 2px solid #8a19ce;
}

.bet-th-theme {
  color: #ffffff;
  text-shadow: none;
}

[data-theme="dark"] .bet-th-theme {
  color: var(--color-text, #f0f0f0);
  background-color: rgba(255, 255, 255, 0.08);
  border-bottom-color: rgba(255, 255, 255, 0.15);
}

.bet-td {
  padding: 10px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}

.bet-simple-table tr.bet-row-back,
.bet-simple-table tr.bet-row-back td {
  background-color: var(--color-back-bg-1);
}

.bet-simple-table tr.bet-row-lay,
.bet-simple-table tr.bet-row-lay td {
  background-color: var(--color-lay-bg-1);
}

.bet-simple-table tbody tr:hover td {
  filter: brightness(0.985);
}

.bet-simple-table :deep(td .tw-text-xs),
.bet-simple-table :deep(td.tw-text-xs) {
  font-size: 13px !important;
  line-height: 1.45;
}

.bet-simple-table :deep(.tw-text-green-700) {
  color: #198754 !important;
}

.bet-simple-table :deep(.tw-text-red-600) {
  color: #cc3b3b !important;
}

.bet-simple-table :deep(.tw-text-black) {
  color: #2b2b2b !important;
}

@media (min-width: 769px) {
  :deep(.v-overlay__content.bet-details-overlay-content) {
    top: 40px !important;
    transform: none !important;
    border-radius: 0 !important;
  }
}
</style>
