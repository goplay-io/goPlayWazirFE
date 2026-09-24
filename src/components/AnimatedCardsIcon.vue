<template>
    <v-icon :icon="icon" :class="iconClass" :size="size"></v-icon>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    icon: {
        type: String,
        default: 'mdi-cards',
    },
    size: {
        type: [String, Number],
        default: 24,
    },
    color: {
        type: String,
        default: '',
    },
});

const iconClass = computed(() => {
    const classes = ['animated-cards-icon'];

    if (props.color) {
        classes.push(...props.color.split(' ').filter(c => c));
    }

    return classes.join(' ');
});
</script>

<style scoped>
/* Cards icon animation */
.animated-cards-icon {
    animation: cardShuffle 3s ease-in-out infinite;
    transform-origin: center;
}

@keyframes cardShuffle {

    0%,
    100% {
        transform: rotate(0deg) scale(1);
    }

    25% {
        transform: rotate(-5deg) scale(1.05);
    }

    50% {
        transform: rotate(5deg) scale(1.1);
    }

    75% {
        transform: rotate(-3deg) scale(1.05);
    }
}
</style>
