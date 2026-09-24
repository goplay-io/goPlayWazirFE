<script setup>
import liveCardsBannerGif from '@/assets/live/casino/live-cards-banner.gif';

defineProps({
    to: {
        type: [String, Object],
        default: '/casino?provider=MAC88+VIRTUALS',
    },
});
</script>

<template>
    <RouterLink :to="to" class="live-card-games-banner">
        <img
            class="live-card-games-banner__gif"
            :src="liveCardsBannerGif"
            alt="Play Live Card Games - Teenpatti, Andar Bahar, 7 Up Down"
            loading="lazy"
            decoding="async"
        />
    </RouterLink>
</template>

<style scoped>
.live-card-games-banner {
    position: relative;
    display: block;
    overflow: hidden;
    text-decoration: none;
    border-radius: 2px;
}

.live-card-games-banner__gif {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
    object-position: center;
}
</style>
