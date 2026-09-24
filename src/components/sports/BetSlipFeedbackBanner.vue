<script setup>
defineProps({
  type: {
    type: String,
    default: 'error',
    validator: (value) => ['error', 'success'].includes(value),
  },
  message: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <Transition name="slip-feedback-fade">
    <div
      v-if="message"
      class="slip-feedback-banner-wrap"
      role="alert"
      aria-live="polite"
    >
      <div
        class="slip-feedback-banner"
        :class="`slip-feedback-banner--${type}`"
      >
        <v-icon size="14" class="slip-feedback-banner__icon">
          {{ type === 'success' ? 'mdi-check-circle' : 'mdi-alert' }}
        </v-icon>
        <span class="slip-feedback-banner__text">{{ message }}</span>
      </div>
    </div>
  </Transition>
</template>
