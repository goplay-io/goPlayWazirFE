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
  <div class="casino-tabs-l1-wrap">
    <div class="casino-tabs-l1-scroll-shell">
      <button
        type="button"
        class="casino-tabs-l1__scroll casino-tabs-l1__scroll--prev"
        :class="{ 'casino-tabs-l1__scroll--hidden': !canScrollPrev }"
        aria-label="Scroll providers left"
        @click="scrollPrev"
      >
        <img
          src="/zuplay/svg/arrow1.png"
          alt=""
          class="casino-tabs-l1__scroll-icon casino-tabs-l1__scroll-icon--prev"
        />
      </button>

      <button
        type="button"
        class="casino-tabs-l1__scroll casino-tabs-l1__scroll--next"
        :class="{ 'casino-tabs-l1__scroll--hidden': !canScrollNext }"
        aria-label="Scroll providers right"
        @click="scrollNext"
      >
        <img
          src="/zuplay/svg/arrow1.png"
          alt=""
          class="casino-tabs-l1__scroll-icon casino-tabs-l1__scroll-icon--next"
        />
      </button>

      <div
        ref="trackRef"
        class="casino-tabs-l1__track casino-scroll-x tw-flex tw-w-full"
        @scroll="updateScrollState"
      >
        <button
          v-for="item in items"
          :key="item.key"
          type="button"
          class="casino-tabs-l1__btn"
          :class="{ 'casino-tabs-l1__btn--active': activeKey === item.key }"
          @click="onSelect(item.key)"
        >
          <span class="casino-tabs-l1__label">{{ item.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
