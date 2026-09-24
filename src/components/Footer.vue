<template>
  <footer class="site-footer">
    <ReferenceFooter />
  </footer>
</template>

<script setup>
import ReferenceFooter from '@/components/footer/ReferenceFooter.vue'
</script>

<style scoped>
.site-footer {
  position: relative;
  z-index: 3;
  flex-shrink: 0;
  width: 100%;
  padding: 0 12px 12px;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .site-footer {
    padding: 0 0 16px;
  }
}
</style>
