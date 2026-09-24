<script setup>
import { computed } from 'vue';

const props = defineProps({
    /**
     * Runner status from API (ACTIVE, SUSPENDED, REMOVED, WINNER, LOSER, etc.)
     */
    runnerStatus: {
        type: String,
        default: null
    },
    /**
     * Market status from API (OPEN, SUSPENDED, etc.)
     */
    marketStatus: {
        type: String,
        default: null
    },
    /**
     * For sports markets - indicates if ball is running
     */
    ballRunning: {
        type: Boolean,
        default: false
    },
    /**
     * Alternative way to pass runner status (for racing markets using values array)
     */
    values: {
        type: Array,
        default: null
    }
});

// Get the effective runner status
const effectiveRunnerStatus = computed(() => {
    return props.runnerStatus || props.values?.[1] || null;
});

const normalizedStatus = computed(() => {
    return String(effectiveRunnerStatus.value || '').toUpperCase();
});

const UNAVAILABLE_MARKET_STATUSES = [
    'SUSPENDED',
    'CLOSED',
    'INACTIVE',
    'REMOVED',
    'UNAVAILABLE',
    'NOT_AVAILABLE',
    'NOT AVAILABLE',
];

const normalizedMarketStatus = computed(() => {
    return String(props.marketStatus || '').toUpperCase();
});

const isMarketUnavailable = computed(() =>
    UNAVAILABLE_MARKET_STATUSES.includes(normalizedMarketStatus.value)
);

// Determine if overlay should be shown
const shouldShow = computed(() => {
    const status = normalizedStatus.value;
    if (isMarketUnavailable.value) return true;
    if (props.ballRunning) return true;
    return ['SUSPENDED', 'REMOVED', 'LOSER', 'WINNER', 'BALL_RUNNING', 'BALL RUNNING'].includes(status);
});

// Get status text for overlay
const statusText = computed(() => {
    const marketStatus = normalizedMarketStatus.value;
    if (marketStatus === 'BALL_RUNNING' || marketStatus === 'BALL RUNNING') return 'BALL_RUNNING';
    if (isMarketUnavailable.value) return 'SUSPENDED';

    if (props.ballRunning) return 'BALL_RUNNING';

    const status = normalizedStatus.value;
    if (status === 'REMOVED') return 'REMOVED';
    if (status === 'LOSER') return 'LOSER';
    if (status === 'WINNER') return 'WINNER';
    if (status === 'SUSPENDED') return 'SUSPENDED';
    if (status === 'BALL_RUNNING' || status === 'BALL RUNNING') return 'BALL_RUNNING';

    return '';
});

const overlayModifierClass = computed(() => {
    if (statusText.value === 'SUSPENDED') return 'status-overlay--suspended';
    if (statusText.value === 'BALL_RUNNING') return 'status-overlay--ball-running';
    if (statusText.value === 'WINNER') return 'status-overlay--winner';
    if (statusText.value === 'LOSER' || statusText.value === 'REMOVED') return 'status-overlay--loser';
    return 'status-overlay--default';
});
</script>

<template>
    <div
        v-if="shouldShow"
        class="status-overlay"
        :class="overlayModifierClass"
    >
        <span class="status-overlay__text">{{ statusText }}</span>
    </div>
</template>

<style scoped>
.status-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    pointer-events: none;
    box-sizing: border-box;
    border-radius: var(--sports-bet-odds-btn-radius);
}

.status-overlay__text {
    margin: auto;
    color: #fff;
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
    letter-spacing: normal;
    text-transform: none;
    text-shadow: none;
}

.status-overlay--ball-running {
    inset: 0 0 18px;
    height: auto;
    align-items: flex-start;
    justify-content: center;
}

.status-overlay--winner .status-overlay__text {
    color: #66f28b;
}

.status-overlay--loser .status-overlay__text,
.status-overlay--default .status-overlay__text {
    color: #fff;
}
</style>
