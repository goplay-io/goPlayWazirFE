<script setup>
defineProps({
  active: {
    type: Boolean,
    default: false,
  },
  size: {
    type: [Number, String],
    default: 12,
  },
})
</script>

<template>
  <span class="feed-mode-pill__prefix" aria-hidden="true">
    <span class="feed-mode-pill__icon-stage" :class="{ 'feed-mode-pill__icon-stage--active': active }">
      <span class="feed-mode-pill__glyph feed-mode-pill__glyph--plus">+</span>
      <v-icon
        :size="size"
        class="feed-mode-pill__glyph feed-mode-pill__glyph--check"
        color="currentColor"
      >
        mdi-check-bold
      </v-icon>
    </span>
  </span>
</template>

<style scoped>
.feed-mode-pill__prefix {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.feed-mode-pill__icon-stage {
  position: relative;
  width: 12px;
  height: 12px;
  display: inline-block;
}

.feed-mode-pill__glyph {
  position: absolute;
  left: 50%;
  top: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform-origin: center center;
  transition:
    transform 0.48s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.48s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.feed-mode-pill__glyph--plus {
  width: 12px;
  height: 12px;
  font-weight: inherit;
  line-height: 1;
  transform: translate(-50%, -50%) rotate(0deg) scale(1);
  opacity: 1;
}

.feed-mode-pill__glyph--check {
  transform: translate(-50%, -50%) rotate(-720deg) scale(0.9);
  opacity: 0;
}

.feed-mode-pill__icon-stage--active .feed-mode-pill__glyph--plus {
  transform: translate(-50%, -50%) rotate(720deg) scale(0.9);
  opacity: 0;
}

.feed-mode-pill__icon-stage--active .feed-mode-pill__glyph--check {
  transform: translate(-50%, -50%) rotate(0deg) scale(1);
  opacity: 1;
}

.feed-mode-pill__glyph--check :deep(svg) {
  stroke-width: 0.35px;
}
</style>
