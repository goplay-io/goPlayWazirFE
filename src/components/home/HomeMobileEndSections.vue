<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import useDevices from '@/composables/useDevices.js'
import HomePageBottomText from '@/components/home/HomePageBottomText.vue'
import HomeMobileFooter from '@/components/home/HomeMobileFooter.vue'

const { isMobile } = useDevices()
const route = useRoute()

const props = defineProps({
  footerOnly: {
    type: Boolean,
    default: false,
  },
})

/** Homepage bottom copy lives in LiveShowcaseSections (below providers). */
const showBottomText = computed(() => !props.footerOnly && route.name !== 'live')
</script>

<template>
  <div class="home-mobile-end">
    <HomePageBottomText v-if="showBottomText" />

    <HomeMobileFooter v-if="isMobile" />
  </div>
</template>

<style scoped>
.home-mobile-end {
  width: 100%;
  margin-top: 0;
  padding: 0 0 8px;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .home-mobile-end {
    padding-bottom: 16px;
  }
}
</style>
