<script setup>

import liveCasinoBannerGif from '@/assets/live/casino/live-casino-banner.gif';



defineProps({

    to: {

        type: [String, Object],

        default: '/casino?provider=all&gamename=others',

    },

});

</script>



<template>

    <RouterLink :to="to" class="live-casino-games-banner">

        <img class="live-casino-games-banner__gif" :src="liveCasinoBannerGif"
            alt="Play Live Casino Games - Roulette, Blackjack, Baccarat, Poker" loading="lazy" decoding="async" />

    </RouterLink>

</template>



<style scoped>
.live-casino-games-banner {

    position: relative;

    display: block;

    overflow: hidden;

    text-decoration: none;

    border-radius: 2px;

}



.live-casino-games-banner__gif {
    display: block;
    width: 100%;
    max-width: 100%;
    height: auto;
    aspect-ratio: 900 / 160;
    object-fit: cover;
    object-position: center;
    vertical-align: top;
}
</style>
