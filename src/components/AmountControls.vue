<script setup>
const props = defineProps({
  amount: {
    type: Number,
    required: true
  },
  min: {
    type: Number,
    default: 0
  },
  maxDigits: {
    type: Number,
    default: 9 // Maximum 9 zeros (1 billion) by default
  }
})

const emit = defineEmits(['update:amount'])

const calculateStep = (value) => {
  if (value === 0) return 100
  // Convert to string to count digits
  const length = Math.abs(value).toString().length
  // Limit to maxDigits zeros
  return Math.pow(10, Math.min(length - 1, props.maxDigits))
}

const increment = () => {
  const step = calculateStep(props.amount)
  emit('update:amount', Number(props.amount) + step)
}

const decrement = () => {
  const step = calculateStep(props.amount)
  const newValue = Number(props.amount) - step
  if (newValue >= props.min) {
    emit('update:amount', newValue)
  }
}
</script>

<template>
  <div class="tw-flex tw-items-center tw-gap-1.5 tw-rounded-xl tw-bg-[#e9eef7] tw-p-1">
    <!-- Decrement Button -->
    <v-btn @click="decrement" :disabled="amount <= min" icon variant="flat" size="x-small"
      class="tw-group theme-bg-count tw-rounded-lg tw-w-9 tw-h-9 tw-min-w-9 tw-flex tw-items-center tw-justify-center tw-transition-all tw-duration-300 hover:tw-bg-primary disabled:tw-opacity-50 disabled:tw-cursor-not-allowed">
      <v-icon size="18"
        class="tw-text-theme-text-muted tw-transition-colors tw-duration-300 group-hover:tw-text-white">
        mdi-minus
      </v-icon>
    </v-btn>

    <!-- Increment Button -->
    <v-btn @click="increment" icon variant="flat" size="x-small"
      class="tw-group theme-bg-count tw-rounded-lg tw-w-9 tw-h-9 tw-min-w-9 tw-flex tw-items-center tw-justify-center tw-transition-all tw-duration-300 hover:tw-bg-primary">
      <v-icon size="18" class="tw-text-primary tw-transition-colors tw-duration-300 group-hover:tw-text-white">
        mdi-plus
      </v-icon>
    </v-btn>
  </div>
</template>
