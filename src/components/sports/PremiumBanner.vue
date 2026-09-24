<script setup>
import premiumBannerGif from '@/assets/premium-new.gif';
</script>

<template>
    <div class="premium-banner">
        <img
            class="premium-banner__img"
            :src="premiumBannerGif"
            alt="Premium"
            loading="lazy"
            decoding="async"
        />
    </div>
</template>

<style scoped>
.premium-banner {
    width: 100%;
    background-color: #ff6b00;
}

.premium-banner__img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
}
</style>
