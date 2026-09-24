<script setup>
import { computed } from 'vue';
import { getLiveDotVariant } from '@/utils/liveStatus';

const props = defineProps({
    eventName: {
        type: String,
        default: ''
    },
    competitionName: {
        type: String,
        default: ''
    },
    inPlay: {
        type: [Boolean, Number, String],
        default: false
    },
    openDate: {
        type: [String, Date, Number],
        default: null
    },
    size: {
        type: String,
        default: 'sm',
        validator: (value) => ['xs', 'sm', 'md'].includes(value)
    }
});

const variant = computed(() =>
    getLiveDotVariant({
        eventName: props.eventName,
        competitionName: props.competitionName,
        inPlay: props.inPlay,
        openDate: props.openDate
    })
);

const showDot = computed(() => variant.value === 'red' || variant.value === 'green');
const showGoldenStar = computed(() => variant.value === 'golden');

const sizeClass = computed(() => {
    if (props.size === 'md') return 'tw-h-3 tw-w-3';
    if (props.size === 'xs') return 'tw-h-1.5 tw-w-1.5';
    return 'tw-h-2 tw-w-2';
});

const pingClass = computed(() => {
    if (variant.value === 'green') return 'tw-bg-green-400';
    if (variant.value === 'red') return 'tw-bg-red-400';
    return '';
});

const dotClass = computed(() => {
    if (variant.value === 'green') return 'tw-bg-green-500';
    if (variant.value === 'red') return 'tw-bg-red-500';
    return '';
});

const starGlyphStyle = computed(() => {
    const dotPx = props.size === 'md' ? 12 : props.size === 'xs' ? 6 : 8;
    return { fontSize: `${dotPx * 2}px`, lineHeight: 1 };
});
</script>

<template>
    <span
        v-if="showGoldenStar"
        class="live-golden-star tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-visible"
        :class="sizeClass"
        aria-hidden="true"
    >
        <span class="live-golden-star__glyph" :style="starGlyphStyle">★</span>
    </span>
    <span v-else-if="showDot" class="tw-relative tw-flex tw-flex-shrink-0" :class="sizeClass">
        <span
            class="tw-animate-ping tw-absolute tw-inline-flex tw-h-full tw-w-full tw-rounded-full tw-opacity-75"
            :class="pingClass"
        ></span>
        <span
            class="tw-relative tw-inline-flex tw-rounded-full tw-h-full tw-w-full"
            :class="dotClass"
        ></span>
    </span>
</template>

<style scoped>
.live-golden-star__glyph {
    display: block;
    font-weight: 700;
    line-height: 1;
    background: var(--theme-orange);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
}
</style>
