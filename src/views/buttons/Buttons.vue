<script setup>
import { onMounted, ref } from 'vue'
import { fetchButtons, updateButtons } from '@/api/user/profile.js'
import { useI18n } from 'vue-i18n'
import Loading from '@/components/Loading.vue'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'

const { t } = useI18n()
const { showSuccess, showError } = useSnackbar()

const formData = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)

onMounted(async () => {
  await loadButtons()
})

const loadButtons = async () => {
  try {
    isLoading.value = true

    const response = await fetchButtons()

    if (response.buttons && response.buttons.length > 0) {
      formData.value = response.buttons.map((button) => ({
        id: button.id,
        title: button.title,
        amount: button.amount,
      }))
    }
  } catch (error) {
    console.error('Error fetching buttons:', error)
    showError(t('buttons.errorLoading'))
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  try {
    isSubmitting.value = true

    const apiData = {}

    formData.value.forEach((button, index) => {
      const num = index + 1
      apiData[`title${num}`] = button.title
      apiData[`amount${num}`] = button.amount
    })

    await updateButtons(apiData)

    showSuccess(t('buttons.successUpdate'))
  } catch (error) {
    console.error('Error updating buttons:', error)
    showError(t('buttons.errorUpdating'))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Loading v-if="isLoading" />
  <div class="account-page buttons-page">
    <AccountPageHeader :title="t('buttons.updateStake')" />

    <div class="buttons-page__body">
      <div class="buttons-page__card">
        <form class="buttons-page__form" @submit.prevent="handleSubmit">
          <div class="buttons-page__headers">
            <div class="buttons-page__header-cell">
              {{ t('buttons.buttonLabel') }}
            </div>
            <div class="buttons-page__header-cell">
              {{ t('buttons.stakeAmount') }}
            </div>
          </div>

          <div class="buttons-page__rows">
            <div
              v-for="(button, index) in formData"
              :key="button.id"
              class="buttons-page__row"
            >
              <v-text-field
                v-model="button.title"
                :placeholder="t('buttons.buttonPlaceholder', { n: index + 1 })"
                variant="outlined"
                density="compact"
                hide-details
                color="#49915e"
                base-color="#545454"
                bg-color="#d5d5d5"
                class="buttons-page__field"
              />
              <v-text-field
                v-model="button.amount"
                :placeholder="t('buttons.amountPlaceholder', { n: index + 1 })"
                type="number"
                variant="outlined"
                density="compact"
                hide-details
                color="#49915e"
                base-color="#545454"
                bg-color="#d5d5d5"
                class="buttons-page__field"
              />
            </div>
          </div>

          <div class="buttons-page__actions">
            <v-btn
              variant="outlined"
              :disabled="isLoading || isSubmitting"
              class="buttons-page__reset-btn"
              @click="loadButtons"
            >
              <v-icon start>mdi-refresh</v-icon>
              {{ t('buttons.reset') }}
            </v-btn>

            <v-btn
              type="submit"
              variant="flat"
              :loading="isSubmitting"
              :disabled="isSubmitting || isLoading"
              class="buttons-page__update-btn"
            >
              <template v-if="isSubmitting">
                <v-icon start>mdi-loading</v-icon>
                {{ t('buttons.updating') }}
              </template>
              <template v-else>
                <v-icon start>mdi-content-save</v-icon>
                {{ t('buttons.update') }}
              </template>
            </v-btn>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.buttons-page {
  background: var(--account-page-bg, #23201f);
  color: var(--account-text, #ffffff);
}

.buttons-page__body {
  padding: 16px 12px 28px;
}

.buttons-page__card {
  max-width: 56rem;
  margin: 0 auto;
  padding: 16px;
  border: 1px solid #545454;
  border-radius: 10px;
  background: #333333;
  box-shadow: none;
}

.buttons-page__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.buttons-page__headers,
.buttons-page__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.buttons-page__header-cell {
  padding-bottom: 6px;
  border-bottom: 1px solid #545454;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.buttons-page__rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.buttons-page__field :deep(.v-field) {
  background: #d5d5d5 !important;
  border-radius: 6px !important;
}

.buttons-page__field :deep(.v-field__input),
.buttons-page__field :deep(input) {
  color: #343434 !important;
  opacity: 1 !important;
  font-weight: 600;
}

.buttons-page__field :deep(.v-field__outline) {
  --v-field-border-width: 1px;
  --v-field-border-opacity: 1;
  color: #545454 !important;
}

.buttons-page__field :deep(.v-field--focused .v-field__outline) {
  --v-field-border-width: 2px;
  color: #49915e !important;
}

.buttons-page__field :deep(input::placeholder) {
  color: #343434 !important;
  opacity: 0.65;
}

.buttons-page__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #545454;
}

.buttons-page__update-btn {
  min-height: 36px !important;
  padding: 0 16px !important;
  border: 0 !important;
  border-radius: 8px !important;
  background: #49915e !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  text-transform: none !important;
  box-shadow: none !important;
}

.buttons-page__update-btn :deep(.v-btn__content),
.buttons-page__update-btn :deep(.v-icon) {
  color: #ffffff !important;
}

.buttons-page__update-btn:hover {
  filter: brightness(1.05);
}

.buttons-page__reset-btn {
  min-height: 36px !important;
  padding: 0 16px !important;
  border: 1px solid #545454 !important;
  border-radius: 8px !important;
  background: #23201f !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  text-transform: none !important;
  box-shadow: none !important;
}

.buttons-page__reset-btn :deep(.v-btn__content),
.buttons-page__reset-btn :deep(.v-icon) {
  color: #ffffff !important;
}

.buttons-page__reset-btn:hover {
  background: #333333 !important;
  border-color: #49915e !important;
}

@media (max-width: 640px) {
  .buttons-page__body {
    padding: 12px 8px 24px;
  }

  .buttons-page__card {
    padding: 12px;
  }

  .buttons-page__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .buttons-page__update-btn,
  .buttons-page__reset-btn {
    width: 100%;
  }
}
</style>
