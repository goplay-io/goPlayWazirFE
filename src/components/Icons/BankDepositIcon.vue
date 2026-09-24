<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 14 14"
    class="bank-deposit-icon"
  >
    <g fill="none" fill-rule="evenodd" clip-rule="evenodd">
      <path :fill="color" d="M10.284 5.934v5.054h2.664V5.933l-.038.001zm-4.616 0v5.054h2.664V5.934zm-4.616-.001v5.055h2.664V5.934H1.052Z"/>
      <path :fill="colorLight" d="M6.386.233a1.21 1.21 0 0 1 1.248.013l5.911 3.87c.42.277.547.754.385 1.161c-.156.392-.55.657-1.02.657H1.09c-.47 0-.864-.265-1.02-.657c-.162-.407-.034-.884.385-1.16l.001-.001l5.91-3.87zM0 11.877c0-.6.572-.889 1-.889h12c.428 0 1 .289 1 .89v1.167c0 .6-.572.889-1 .889H1c-.428 0-1-.289-1-.89z"/>
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size:  { type: [String, Number], default: 24 },
  color: { type: String, default: 'var(--color-nav)' }
})

const colorLight = computed(() => {
  if (props.color === '#2d52c4') return '#85c7f2'
  return props.color
})
</script>
