<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    color: { type: String, default: 'primary' },
    size: { type: String, default: 'small' },
    ariaLabel: { type: String, default: 'Show rules' }
});

const emit = defineEmits(['click']);

function handleClick() {
    emit('click');
}
</script>

<template>
    <button type="button" class="rules-info-btn" :aria-label="ariaLabel" @click="handleClick"
        :style="{ '--rules-btn-color': color === 'white' ? '#ffffff' : color }">
        <v-icon class="rules-info-btn__icon">mdi-information-outline</v-icon>
    </button>
</template>

<style scoped>
.rules-info-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: opacity 0.15s;
}

.rules-info-btn:hover {
    opacity: 0.75;
}

.rules-info-btn :deep(.rules-info-btn__icon) {
    color: var(--rules-btn-color, #ffffff) !important;
    font-size: 14px !important;
}
</style>
