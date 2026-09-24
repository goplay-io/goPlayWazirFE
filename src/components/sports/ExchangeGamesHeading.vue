<template>
    <div
        class="exchange-games-heading"
        :class="{ 'exchange-games-heading--embedded': embedded }"
        aria-label="Exchange games"
    >
        <span class="exchange-games-heading__icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" class="exchange-games-heading__broadcast">
                <path fill="currentColor" d="M6.343 4.938a1 1 0 0 1 0 1.415a8.003 8.003 0 0 0 0 11.317a1 1 0 1 1-1.414 1.414c-3.907-3.906-3.907-10.24 0-14.146a1 1 0 0 1 1.414 0" />
                <path fill="currentColor" d="M19.075 4.938c3.906 3.907 3.906 10.24 0 14.146a1 1 0 0 1-1.415-1.414a8.003 8.003 0 0 0 0-11.317a1 1 0 0 1 1.415-1.415" />
                <path fill="currentColor" d="M9.31 7.812a1 1 0 0 1 0 1.414a3.92 3.92 0 0 0 0 5.544a1 1 0 1 1-1.415 1.414a5.92 5.92 0 0 1 0-8.372a1 1 0 0 1 1.415 0" />
                <path fill="currentColor" d="M16.268 7.812a5.92 5.92 0 0 1 0 8.372a1 1 0 0 1-1.414-1.414a3.92 3.92 0 0 0 0-5.544a1 1 0 0 1 1.414-1.414" />
                <path fill="currentColor" d="M12 10.5a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3" />
            </svg>
        </span>
        <h2 class="exchange-games-heading__title">{{ title }}</h2>
    </div>
</template>

<script setup>
defineProps({
    title: {
        type: String,
        default: 'EXCHANGE GAMES'
    },
    /** When true, sits inside the sport exchange card (white bar + bottom border). */
    embedded: {
        type: Boolean,
        default: false
    }
});
</script>

<style scoped>
.exchange-games-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 32px;
    padding: 7px 10px;
}

.exchange-games-heading__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #f97316;
    color: #ffffff;
}

.exchange-games-heading__broadcast {
    display: block;
}

.exchange-games-heading__title {
    margin: 0;
    font-size: 13px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #1a1a1a;
    white-space: nowrap;
}

.exchange-games-heading--embedded {
    background: #ffffff;
    border-bottom: 1px solid #d4d4d4;
    box-sizing: border-box;
}
</style>
