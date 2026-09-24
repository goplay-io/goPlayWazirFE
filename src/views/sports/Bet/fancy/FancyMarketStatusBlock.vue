<script setup>
import { computed } from 'vue';

const props = defineProps({
    ballRunning: {
        type: Boolean,
        default: false,
    },
    suspended: {
        type: Boolean,
        default: false,
    },
});

const label = computed(() => {
    if (props.ballRunning) return 'BALL_RUNNING';
    if (props.suspended) return 'SUSPENDED';
    return '';
});

const showOverlay = computed(() => props.ballRunning || props.suspended);
</script>

<template>
    <div
        v-if="showOverlay"
        class="fancy-market-status-overlay ball-running-status"
        :class="{
            'fancy-market-status-overlay--ball-running': ballRunning,
            'fancy-market-status-overlay--suspended': suspended && !ballRunning,
        }"
        role="status"
        :aria-label="label"
    >
        <span class="fancy-market-status-overlay__label">{{ label }}</span>
    </div>
</template>

<style scoped>
.fancy-market-status-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    pointer-events: none;
    background: transparent;
    border: none;
    border-radius: var(--sports-bet-odds-btn-radius);
    box-sizing: border-box;
}

.fancy-market-status-overlay__label {
    margin: auto;
    color: #fff;
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
    letter-spacing: normal;
    text-transform: none;
    text-align: center;
    text-shadow: none;
    pointer-events: none;
    white-space: nowrap;
}

.fancy-market-status-overlay--suspended {
    inset: 0;
    height: 100%;
    align-items: center;
    justify-content: center;
}

.fancy-market-status-overlay--ball-running {
    inset: 0 0 18px;
    height: auto;
    align-items: flex-start;
    justify-content: center;
}
</style>
