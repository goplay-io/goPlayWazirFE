<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    class="bonus-icon tw-block tw-flex-shrink-0"
    aria-hidden="true"
  >
    <g fill="none" fill-rule="evenodd">
      <rect x="3.5" y="9.2" width="17" height="11.3" rx="2.4" class="bonus-icon__box" />
      <rect x="2.5" y="6.2" width="19" height="4.4" rx="2.2" class="bonus-icon__lid" />
      <rect x="11" y="6.2" width="2" height="14.3" class="bonus-icon__ribbon" />
      <path
        d="M12 6.2c-2.5 0-4.1-2.1-2.9-3.9.9-1.2 2.5-1.2 3.4 0L12 3.2l-.5-.9c.9-1.2 2.5-1.2 3.4 0 1.2 1.8-.4 3.9-2.9 3.9z"
        class="bonus-icon__bow"
      />
      <path
        d="M18.7 3.2l.5 1.1 1.2.2-.9.8.2 1.2-1-.6-1 .6.2-1.2-.9-.8 1.2-.2z"
        class="bonus-icon__spark"
      />
    </g>
  </svg>
</template>

<script setup>
defineProps({
  size: {
    type: [Number, String],
    default: 18
  }
})
</script>

<style scoped>
.bonus-icon {
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
}

.bonus-icon__box {
  fill: var(--theme-orange, #f57c20);
}

.bonus-icon__lid {
  fill: #ff9438;
}

.bonus-icon__ribbon {
  fill: #84c33c;
}

.bonus-icon__bow {
  fill: #72ab32;
}

.bonus-icon__spark {
  fill: #ffffff;
}
</style>
