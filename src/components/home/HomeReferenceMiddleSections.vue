<script setup>
import HomeProviderCarousel from '@/components/home/HomeProviderCarousel.vue';
import HomePromotionQuickActions from '@/components/home/HomePromotionQuickActions.vue';
import HomeOriginalsSection from '@/components/home/HomeOriginalsSection.vue';
</script>

<template>
  <div class="home-reference-middle">
    <HomeProviderCarousel />
    <HomePromotionQuickActions />
    <HomeOriginalsSection />
  </div>
</template>

<style scoped>
.home-reference-middle {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
</style>
