<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchBigWins } from '@/api/event/bet';

const { t } = useI18n();

const bigWins = ref([]);
const displayedWins = ref([]);
const tickInterval = ref(null);

/** Reference keeps ~13 rows in the 450px body. */
const MAX_VISIBLE_ROWS = 13;
/** Reference prepends a new row about every second. */
const TICK_MS = 1000;

let rotateIndex = 0;

onMounted(async () => {
  try {
    const response = await fetchBigWins();
    bigWins.value = response?.bigWins || [];
    initializeDisplayedWins();
    startTicker();
  } catch (error) {
    console.error(t('components.bigWins.fetchError'), error);
  }
});

function initializeDisplayedWins() {
  if (bigWins.value.length === 0) {
    displayedWins.value = [];
    return;
  }

  const initialCount = Math.min(MAX_VISIBLE_ROWS, bigWins.value.length);
  displayedWins.value = bigWins.value.slice(0, initialCount).map((win, index) =>
    createDisplayedWin(win, index),
  );
  rotateIndex = initialCount % bigWins.value.length;
}

function createDisplayedWin(win, suffix = 0) {
  return {
    ...win,
    _uid: `${win.id ?? 'win'}-${Date.now()}-${suffix}-${Math.random().toString(36).slice(2, 7)}`,
  };
}

function prependNextWin() {
  if (bigWins.value.length === 0) return;

  const nextWin = bigWins.value[rotateIndex % bigWins.value.length];
  rotateIndex = (rotateIndex + 1) % bigWins.value.length;

  displayedWins.value = [
    createDisplayedWin(nextWin),
    ...displayedWins.value.slice(0, MAX_VISIBLE_ROWS - 1),
  ];
}

function startTicker() {
  stopTicker();
  if (bigWins.value.length === 0) return;

  tickInterval.value = window.setInterval(prependNextWin, TICK_MS);
}

function stopTicker() {
  if (tickInterval.value) {
    clearInterval(tickInterval.value);
    tickInterval.value = null;
  }
}

watch(
  () => bigWins.value.length,
  (length) => {
    if (length > 0) {
      initializeDisplayedWins();
      startTicker();
    } else {
      displayedWins.value = [];
      stopTicker();
    }
  },
);

onUnmounted(stopTicker);

function getDisplayName(win) {
  return win?.event_name || win?.game_name || 'Unknown';
}

function getUserName(win) {
  return win?.user_name || win?.username || '';
}

function formatWinnings(amount) {
  if (amount == null || amount === '') return '₹0';
  const value = Number.parseFloat(amount);
  if (!Number.isFinite(value)) return '₹0';
  if (Number.isInteger(value)) return `₹${value}`;
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function hasThumb(win) {
  return Boolean(win?.url_thumb);
}
</script>

<template>
  <section v-if="displayedWins.length > 0" class="recent-wins-section" aria-label="Recent wins">
    <div class="recent-wins-section__panel">
      <div class="recent-wins-section__header">
        <div class="recent-wins-section__header-cell recent-wins-section__header-cell--left">
          {{ t('components.bigWins.title') }}
        </div>
        <div class="recent-wins-section__header-cell recent-wins-section__header-cell--left">
          {{ t('components.bigWins.winner') }}
        </div>
        <div class="recent-wins-section__header-cell recent-wins-section__header-cell--right">
          {{ t('components.bigWins.winnings') }}
        </div>
      </div>

      <div class="recent-wins-section__body">
        <TransitionGroup
          tag="div"
          name="recent-wins-row"
          class="recent-wins-section__body-inner"
        >
          <div
            v-for="win in displayedWins"
            :key="win._uid"
            class="recent-wins-section__row"
          >
            <div class="recent-wins-section__cell recent-wins-section__cell--game">
              <div class="recent-wins-section__game">
                <img
                  v-if="hasThumb(win)"
                  :src="win.url_thumb"
                  :alt="getDisplayName(win)"
                  class="recent-wins-section__thumb"
                  loading="lazy"
                  decoding="async"
                />
                <div v-else class="recent-wins-section__thumb recent-wins-section__thumb--fallback">
                  <v-icon icon="mdi-trophy" size="16" class="recent-wins-section__trophy" />
                </div>
                <span class="recent-wins-section__game-name">{{ getDisplayName(win) }}</span>
              </div>
            </div>

            <div class="recent-wins-section__cell recent-wins-section__cell--winner">
              <span class="recent-wins-section__winner-badge">
                {{ getUserName(win) || 'Anonymous' }}
              </span>
            </div>

            <div class="recent-wins-section__cell recent-wins-section__cell--amount">
              {{ formatWinnings(win.profit_loss) }}
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Reference: zuplay.com recent wins table (`.my-5.w-full > .bg-gray-200.rounded`) */
.recent-wins-section {
  width: 100%;
  margin: 20px 0;
  padding: 0;
  box-sizing: border-box;
}

.recent-wins-section__panel {
  width: 100%;
  margin: 0 auto;
  border-radius: 4px;
  overflow: hidden;
  background: #e5e7eb;
}

.recent-wins-section__header {
  display: flex;
  align-items: stretch;
  padding: 0 8px;
  border-radius: 4px 4px 0 0;
  background: var(--color-header-bg, #360952);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
}

.recent-wins-section__header-cell {
  flex: 1 1 0;
  padding: 10px;
  min-width: 0;
}

.recent-wins-section__header-cell--left {
  text-align: left;
}

.recent-wins-section__header-cell--right {
  text-align: right;
}

/* Reference body: `.overflow-hidden.w-full.px-2.h-[450px]` */
.recent-wins-section__body {
  width: 100%;
  height: 450px;
  padding: 0 8px;
  overflow: hidden;
  box-sizing: border-box;
  background: transparent;
}

.recent-wins-section__body-inner {
  width: 100%;
  position: relative;
}

.recent-wins-section__row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
  border-bottom: 1px solid #d1d5db;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #000000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.recent-wins-section__cell {
  flex: 1 1 0;
  min-width: 0;
}

.recent-wins-section__cell--game {
  padding: 0 4px 0 10px;
  text-align: left;
}

.recent-wins-section__cell--winner {
  padding: 0 10px;
  text-align: left;
}

.recent-wins-section__cell--amount {
  padding: 0 10px;
  font-size: 14px;
  font-weight: 500;
  line-height: 21px;
  color: #16a34a;
  text-align: right;
}

.recent-wins-section__game {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  font-weight: 600;
}

.recent-wins-section__game-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-transform: capitalize;
}

.recent-wins-section__thumb {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  object-fit: cover;
}

.recent-wins-section__thumb--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: rgba(54, 9, 82, 0.12);
}

.recent-wins-section__trophy {
  color: #360952;
}

.recent-wins-section__winner-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--color-header-bg, #360952);
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  text-transform: capitalize;
}

/* Reference: `.animate-slidedownallrows` */
@keyframes slidedownallrows {
  0% {
    transform: translateY(-100%);
  }

  100% {
    transform: translateY(0);
  }
}

.recent-wins-row-enter-active {
  animation: slidedownallrows 0.5s ease-out;
}

.recent-wins-row-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.recent-wins-row-leave-active {
  position: absolute;
  width: 100%;
  opacity: 0;
}

@media (max-width: 767px) {
  .recent-wins-section__cell--game,
  .recent-wins-section__cell--winner {
    max-width: 140px;
  }
}
</style>
