<script setup>
defineProps({
    title: {
        type: String,
        required: true,
    },
});
</script>

<template>
    <div class="live-showcase-heading">
        <h3 class="live-showcase-heading__title">{{ title }}</h3>
    </div>
</template>

<style scoped>
.live-showcase-heading {
    width: 100%;
    padding: 7px 10px;
    box-sizing: border-box;
    background: var(--color-header-bg, #360952);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

.live-showcase-heading__title {
    margin: 0;
    padding: 0;
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.06em;
    line-height: 1.2;
    text-align: left;
    text-transform: uppercase;
    white-space: nowrap;
}

@media (min-width: 769px) {
    .live-showcase-heading {
        padding: 8px 12px;
    }

    .live-showcase-heading__title {
        font-size: 16px;
    }
}
</style>
