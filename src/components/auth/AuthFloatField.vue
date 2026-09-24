<template>
  <div>
    <div
      class="auth-modal-float-field"
      :class="{
        'auth-modal-float-field--float': isFloated,
        'auth-modal-float-field--error': !!error,
      }"
    >
      <v-icon v-if="icon" size="18" class="auth-modal-float-field__icon">{{ icon }}</v-icon>
      <div
        class="auth-modal-float-field__body"
        :class="{
          'auth-modal-float-field__body--password': passwordToggle,
          'auth-modal-float-field__body--prefixed': !!prefix,
        }"
      >
        <span v-if="prefix" class="auth-modal-float-field__prefix">{{ prefix }}</span>
        <label class="auth-modal-float-field__label" :for="fieldId">{{ label }}</label>
        <input
          :id="fieldId"
          :value="modelValue"
          :type="resolvedType"
          :autocomplete="autocomplete"
          :disabled="disabled"
          :readonly="readonly"
          :maxlength="maxlength"
          :inputmode="inputmode"
          class="auth-modal-float-field__input"
          @input="onInput"
          @focus="focused = true"
          @blur="focused = false"
        />
        <button
          v-if="passwordToggle"
          type="button"
          class="auth-modal-float-field__toggle"
          :aria-label="showPassword ? hidePasswordLabel : showPasswordLabel"
          tabindex="-1"
          @click="showPassword = !showPassword"
        >
          <v-icon size="18">
            {{ showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline' }}
          </v-icon>
        </button>
        <span class="auth-modal-float-field__line" aria-hidden="true" />
      </div>
    </div>
    <p v-if="error" class="auth-modal-field-error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  icon: { type: String, default: '' },
  type: { type: String, default: 'text' },
  autocomplete: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
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

const focused = ref(false)
const showPassword = ref(false)

const fieldId = computed(
  () => props.inputId || `auth-field-${Math.random().toString(36).slice(2, 9)}`,
)

const isFloated = computed(() => focused.value || !!String(props.modelValue || '').length)

const resolvedType = computed(() => {
  if (!props.passwordToggle) return props.type
  return showPassword.value ? 'text' : 'password'
})

function onInput(event) {
  const value = event.target.value
  emit('update:modelValue', value)
  emit('input', event)
}
</script>
