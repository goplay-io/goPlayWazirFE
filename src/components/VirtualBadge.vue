<script setup>
import { computed } from 'vue';

const props = defineProps({
    size: {
        type: String,
        default: 'sm',
        validator: (value) => ['xs', 'sm', 'md'].includes(value),
    },
});

const iconSize = computed(() => {
    if (props.size === 'md') return 18;
    if (props.size === 'xs') return 14;
    return 16;
});

const boxClass = computed(() => {
    if (props.size === 'md') return 'tw-w-[22px] tw-h-[22px]';
    if (props.size === 'xs') return 'tw-w-[18px] tw-h-[18px]';
    return 'tw-w-[20px] tw-h-[20px]';
});
</script>

<template>
    <span
        class="virtual-badge tw-inline-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-leading-none"
        :class="boxClass"
        aria-label="Virtual"
        title="Virtual"
    >
        <v-icon :size="iconSize">mdi-controller-classic</v-icon>
    </span>
</template>

<style scoped>
.virtual-badge {
    color: #111827;
}

.virtual-badge :deep(.v-icon) {
    color: currentColor;
}
</style>
