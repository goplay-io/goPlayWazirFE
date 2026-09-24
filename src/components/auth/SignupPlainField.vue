<template>
  <div class="signup-plain-field-wrap">
    <div
      class="signup-plain-field"
      :class="{
        'signup-plain-field--phone': prefix,
        'signup-plain-field--password': passwordToggle,
        'signup-plain-field--error': !!error,
      }"
    >
      <div v-if="prefix" class="signup-plain-field__prefix-wrap">
        <span class="signup-plain-field__prefix">{{ prefix }}</span>
      </div>
      <input
        :id="fieldId"
        :value="modelValue"
        :type="resolvedType"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :maxlength="maxlength"
        :inputmode="inputmode"
        class="signup-plain-field__input"
        @input="onInput"
      />
      <button
        v-if="passwordToggle"
        type="button"
        class="signup-plain-field__toggle"
        :aria-label="showPassword ? hidePasswordLabel : showPasswordLabel"
        tabindex="-1"
        @click="showPassword = !showPassword"
      >
        <v-icon size="18">
          {{ showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline' }}
        </v-icon>
      </button>
    </div>
    <p v-if="error" class="auth-modal-field-error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, required: true },
  type: { type: String, default: 'text' },
  autocomplete: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  passwordToggle: { type: Boolean, default: false },
  prefix: { type: String, default: '' },
  maxlength: { type: [String, Number], default: undefined },
  inputmode: { type: String, default: undefined },
  error: { type: String, default: '' },
  inputId: { type: String, default: '' },
  showPasswordLabel: { type: String, default: 'Show password' },
  hidePasswordLabel: { type: String, default: 'Hide password' },
})

const emit = defineEmits(['update:modelValue', 'input'])

const showPassword = ref(false)

const fieldId = computed(
  () => props.inputId || `signup-field-${Math.random().toString(36).slice(2, 9)}`,
)

const resolvedType = computed(() => {
  if (props.passwordToggle) return showPassword.value ? 'text' : 'password'
  return props.type
})

function onInput(e) {
  emit('update:modelValue', e.target.value)
  emit('input', e)
}
</script>
