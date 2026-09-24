<template>
  <router-link to="/" class="logo header-brand-link tw-no-underline">
    <img
      v-if="activeLogo"
      :src="activeLogo"
      :alt="alt"
      class="img-fluid header-brand-img"
    />
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import goplayLogo from '@/assets/goplay-logo.png'

defineProps({
  alt: { type: String, required: true },
})

const activeLogo = computed(() => goplayLogo)
</script>
