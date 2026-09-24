<script setup>
import { ref, toRef } from 'vue'
import { useCasinoTabScroll } from '@/composables/useCasinoTabScroll'

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  activeKey: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['select'])

const trackRef = ref(null)
const itemsRef = toRef(props, 'items')

const {
  canScrollPrev,
  canScrollNext,
  updateScrollState,
  scrollPrev,
  scrollNext,
} = useCasinoTabScroll(trackRef, [itemsRef])

function onSelect(key) {
  emit('select', key)
}
</script>

<template>
  <div class="casino-tabs-l2-wrap tw-mt-5">
    <div class="casino-tabs-l2-scroll-shell">
      <button
        type="button"
        class="casino-tabs-l2__scroll casino-tabs-l2__scroll--prev"
        :class="{ 'casino-tabs-l2__scroll--hidden': !canScrollPrev }"
        aria-label="Scroll tabs left"
        @click="scrollPrev"
      >
        <img
          src="/zuplay/svg/arrow1.png"
          alt=""
          class="casino-tabs-l2__scroll-icon casino-tabs-l2__scroll-icon--prev"
        />
      </button>

      <button
        type="button"
        class="casino-tabs-l2__scroll casino-tabs-l2__scroll--next"
        :class="{ 'casino-tabs-l2__scroll--hidden': !canScrollNext }"
        aria-label="Scroll tabs right"
        @click="scrollNext"
      >
        <img
          src="/zuplay/svg/arrow1.png"
          alt=""
          class="casino-tabs-l2__scroll-icon casino-tabs-l2__scroll-icon--next"
        />
      </button>

      <div
        ref="trackRef"
        class="casino-tabs-l2__track casino-scroll-x tw-flex tw-w-full"
        @scroll="updateScrollState"
      >
        <button
          v-for="item in items"
          :key="item.key"
          type="button"
          class="casino-tabs-l2__btn"
          :class="{ 'casino-tabs-l2__btn--active': activeKey === item.key }"
          @click="onSelect(item.key)"
        >
          <span class="casino-tabs-l2__label">{{ item.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
