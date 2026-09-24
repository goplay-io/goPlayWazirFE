<template>
    <span :class="['blinking-badge tw-text-[6px] tw-font-bold tw-leading-none tw-p-1 tw-rounded-sm', customClass]"
        style="min-width: 12px; display: inline-block; text-align: center;">
        {{ text }}
    </span>
</template>

<script setup>
defineProps({
    text: {
        type: String,
        default: 'NEW'
    },
    customClass: {
        type: String,
        default: ''
    }
})
</script>

<style scoped>
@keyframes blink-badge {

    0%,
    100% {
        background-color: #7f1d1d;
        color: #fff;
    }

    50% {
        background-color: #fde047;
        color: #000;
    }
}

.blinking-badge {
    animation: blink-badge 1.3s infinite;
}
</style>