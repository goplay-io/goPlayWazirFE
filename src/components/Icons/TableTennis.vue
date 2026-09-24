<template>
  <img
    :src="iconSrc"
    :width="width"
    :height="height"
    alt=""
    class="sport-nav-icon"
  />
</template>

<script setup>
import iconSrc from '@/assets/img/icon/20.png'

defineProps({
  width: {
    type: [String, Number],
    default: 24
  },
  height: {
    type: [String, Number],
    default: 24
  }
})
</script>

<style scoped>
.sport-nav-icon {
  display: block;
  object-fit: contain;
}
</style>
