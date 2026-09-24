<script setup>
defineProps({
    size: {
        type: String,
        default: 'sm',
        validator: (value) => ['xs', 'sm', 'md'].includes(value),
    },
});
</script>

<template>
    <span
        class="premium-badge tw-inline-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-font-extrabold tw-text-white tw-bg-[#28a745] tw-leading-none"
        :class="
            size === 'md'
                ? 'tw-w-[16px] tw-h-[16px] tw-text-[10px] tw-rounded-[2px]'
                : size === 'xs'
                  ? 'tw-w-[12px] tw-h-[12px] tw-text-[8px] tw-rounded-[1px]'
                  : 'tw-w-[14px] tw-h-[14px] tw-text-[9px] tw-rounded-[2px]'
        "
        aria-label="Premium"
        title="Premium"
    >
        P
    </span>
</template>
