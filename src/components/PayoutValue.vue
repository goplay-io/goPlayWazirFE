<script setup>

defineProps({
    value: {
        type: Number,
        default: null
    },
    paranthesis: {
        type: Boolean,
        default: false
    },
    abs: {
        type: Boolean,
        default: false
    },
    small: {
        type: Boolean,
        default: false
    }
});
</script>

<template>
    <p
        v-if="value !== 0 && value !== null"
        :class="[
            'tw-m-0 tw-leading-tight tw-font-semibold',
            small ? 'tw-text-[10px]' : 'tw-text-xs',
            { 'tw-text-green-500': value > 0, 'tw-text-red-500': value < 0 },
        ]"
    >
        <span v-if="paranthesis">(</span>
        {{ abs ? Math.abs(value) : value }}
        <span v-if="paranthesis">)</span>
    </p>
</template>
