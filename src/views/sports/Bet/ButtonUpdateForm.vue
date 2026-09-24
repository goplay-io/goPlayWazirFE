<script setup>
import { onMounted, ref, watch } from 'vue'
import { fetchButtons, updateButtons } from "@/api/user/profile.js"
import AmountControls from "@/components/AmountControls.vue"
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import { useI18n } from 'vue-i18n'

const { showSuccess } = useSnackbar()
const { t } = useI18n()

const props = defineProps({
  buttons: {
    type: Array,
    required: true
  }
})

const formData = ref([])
const isSubmitting = ref(false)
const errorMessage = ref('')
const showModal = ref(true)

const emit = defineEmits(['close', 'update:success'])

const mapButtons = (buttons = []) => buttons.map(button => ({
  id: button.id,
  title: button.title,
  amount: button.amount
}))

onMounted(() => {
  if (props.buttons?.length > 0) {
    formData.value = mapButtons(props.buttons)
  }
})

watch(() => props.buttons, (newValue) => {
  if (newValue?.length > 0) {
    formData.value = mapButtons(newValue)
  }
}, { deep: true })

const closeDrawer = () => {
  showModal.value = false
  setTimeout(() => emit('close'), 300)
}

const handleSubmit = async () => {
  try {
    isSubmitting.value = true
    errorMessage.value = ''

    const apiData = formData.value.reduce((acc, button, index) => {
      const num = index + 1
      acc[`title${num}`] = button.title
      acc[`amount${num}`] = button.amount
      return acc
    }, {})

    await updateButtons(apiData)

    let refreshedButtons = mapButtons(formData.value)

    try {
      const response = await fetchButtons()
      if (response?.buttons?.length) {
        refreshedButtons = mapButtons(response.buttons)
      }
    } catch (refreshError) {
      console.error('Error refreshing buttons after update:', refreshError)
    }

    formData.value = refreshedButtons
    emit('update:success', refreshedButtons)
    setTimeout(() => {
      closeDrawer()
      showSuccess(t('components.buttonUpdate.successUpdate'))
    }, 500)
  } catch (error) {
    console.error("Error updating buttons:", error)
    errorMessage.value = t('components.buttonUpdate.errorUpdating')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="showModal" class="btn-update-overlay" @click="closeDrawer">
      <Transition name="slip-pop" appear>
        <div class="btn-update-shell" @mousedown.stop @click.stop>
          <div class="btn-update-card">
            <div class="btn-update-header">
              <span class="btn-update-header__title">{{ t('components.buttonUpdate.title') }}</span>
              <button
                type="button"
                class="btn-update-header__close"
                :aria-label="t('common.cancel')"
                @click="closeDrawer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div class="btn-update-body">
              <div v-if="errorMessage" class="btn-update-error">{{ errorMessage }}</div>

              <form @submit.prevent="handleSubmit">
                <div class="btn-update-grid custom-scroll">
                  <div
                    v-for="(button, index) in formData"
                    :key="button.id"
                    class="btn-update-row"
                  >
                    <input
                      v-model="button.title"
                      class="btn-update-input btn-update-input--title"
                      :placeholder="t('components.buttonUpdate.buttonLabel', { n: index + 1 })"
                    />
                    <div class="btn-update-amount-wrap">
                      <input
                        v-model.number="button.amount"
                        type="number"
                        :min="0"
                        class="btn-update-input btn-update-input--amount"
                      />
                      <AmountControls
                        class="btn-update-amount-controls"
                        v-model:amount="button.amount"
                        :min="0"
                      />
                    </div>
                  </div>
                </div>

                <div class="btn-update-footer">
                  <button
                    type="button"
                    class="btn-update-footer__cancel"
                    @click="closeDrawer"
                  >
                    {{ t('common.cancel') }}
                  </button>
                  <button
                    type="submit"
                    class="btn-update-footer__submit"
                    :disabled="isSubmitting"
                  >
                    {{ isSubmitting ? t('sports.home.processing') : t('components.buttonUpdate.updateButtons') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.btn-update-overlay {
  position: fixed;
  inset: 0;
  z-index: 1201;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 96px 16px 16px;
  background: rgba(0, 0, 0, 0.5);
}

.btn-update-shell {
  width: 368px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 112px);
  background: var(--color-header-bg, #360952);
  border-radius: 8px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -2px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  pointer-events: auto;
}

.btn-update-card {
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.btn-update-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 37px;
  padding: 8px;
  background: var(--color-header-bg, #360952);
  border-radius: 4px 4px 0 0;
  color: #fff;
}

.btn-update-header__title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.btn-update-header__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 16px;
  margin: 0 8px 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.btn-update-header__close svg {
  width: 16px;
  height: 16px;
}

.btn-update-body {
  color: #000;
  background: #fff;
}

.btn-update-error {
  margin: 8px 8px 0;
  padding: 8px 10px;
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
}

.btn-update-grid {
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  overflow-y: auto;
  max-height: min(52vh, 320px);
}

.btn-update-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn-update-amount-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.btn-update-input {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  color: #000;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  height: 27px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.btn-update-input::placeholder {
  color: #6b7280;
}

.btn-update-input--title {
  background: #fff;
}

.btn-update-input--amount {
  flex: 1 1 auto;
  min-width: 0;
  text-align: center;
}

.btn-update-input:focus {
  border-color: var(--color-header-bg, #360952);
}

.btn-update-input[type=number]::-webkit-inner-spin-button,
.btn-update-input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none;
}

.btn-update-input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}

.btn-update-footer {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #fff;
}

.btn-update-footer__cancel,
.btn-update-footer__submit {
  flex: 1 1 0;
  min-height: 40px;
  height: 40px;
  padding: 0 12px;
  border-radius: 3.12px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  cursor: pointer;
}

.btn-update-footer__cancel {
  border: 1px solid #475569;
  background: transparent;
  color: #000;
}

.btn-update-footer__submit {
  border: 0;
  background: var(--color-header-bg, #360952);
  color: #fff;
}

.btn-update-footer__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slip-pop-enter-active {
  transition: opacity 0.18s ease, transform 0.18s ease-out;
}

.slip-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease-in;
}

.slip-pop-enter-from,
.slip-pop-leave-to {
  opacity: 0;
  transform: scale(0.94);
}

.slip-pop-enter-to,
.slip-pop-leave-from {
  opacity: 1;
  transform: scale(1);
}

.custom-scroll::-webkit-scrollbar {
  width: 3px;
}

.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

:deep(.btn-update-amount-controls > div) {
  background: #f3f4f6 !important;
  border: 1px solid #e5e7eb;
  border-radius: 4px !important;
  padding: 2px !important;
}

:deep(.btn-update-amount-controls .theme-bg-count) {
  background: #ffffff !important;
  border: 1px solid #e5e7eb !important;
  box-shadow: none !important;
  color: #000 !important;
}

:deep(.btn-update-amount-controls .theme-bg-count .v-icon) {
  color: #000 !important;
}

:deep(.btn-update-amount-controls .theme-bg-count:disabled .v-icon) {
  color: #94a3b8 !important;
}

@media (min-width: 768px) {
  .btn-update-overlay {
    align-items: center;
    padding-top: 16px;
  }
}

@media (max-width: 420px) {
  .btn-update-grid {
    grid-template-columns: 1fr;
  }
}
</style>
