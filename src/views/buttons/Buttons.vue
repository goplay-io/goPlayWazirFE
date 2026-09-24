<script setup>
import { onMounted, ref } from 'vue';
import { fetchButtons, updateButtons } from "@/api/user/profile.js";
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Loading from "@/components/Loading.vue";
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar';

const router = useRouter();
const { t } = useI18n();
const { showSuccess, showError } = useSnackbar();

const formData = ref([]);
const isLoading = ref(false);
const isSubmitting = ref(false);

// Fetch buttons data on component mount
onMounted(async () => {
    await loadButtons();
});

const loadButtons = async () => {
    try {
        isLoading.value = true;
        
        const response = await fetchButtons();
        
        if (response.buttons && response.buttons.length > 0) {
            formData.value = response.buttons.map(button => ({
                id: button.id,
                title: button.title,
                amount: button.amount
            }));
        }
    } catch (error) {
        console.error("Error fetching buttons:", error);
        showError(t('buttons.errorLoading'));
    } finally {
        isLoading.value = false;
    }
};

const handleSubmit = async () => {
    try {
        isSubmitting.value = true;

        // Format the data according to the API structure
        const apiData = {};

        // Map array data to numbered fields (title1, amount1, etc.)
        formData.value.forEach((button, index) => {
            const num = index + 1;
            apiData[`title${num}`] = button.title;
            apiData[`amount${num}`] = button.amount;
        });

        // Call the API to update the buttons
        await updateButtons(apiData);

        showSuccess(t('buttons.successUpdate'));

    } catch (error) {
        console.error("Error updating buttons:", error);
        showError(t('buttons.errorUpdating'));
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <!-- Loading overlay -->
    <Loading v-if="isLoading" />    <div class="tw-container tw-mx-auto tw-p-3 buttons-page">
      <div class="buttons-page-heading user-menu-mobile-heading user-menu-mobile-heading--spaced">
        <h1 class="tw-text-lg tw-font-bold buttons-page__title user-menu-mobile-heading__title">{{ t('buttons.updateStake') }}</h1>
      </div>
      
      <!-- Main Content Card -->
      <div class="tw-relative tw-border tw-rounded-lg tw-p-4 tw-shadow-md tw-max-w-4xl tw-mx-auto buttons-page__card">
        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="tw-space-y-3">
          <!-- Headers -->
          <div class="tw-grid tw-grid-cols-2 tw-gap-4 tw-mb-2">
            <div class="tw-font-semibold tw-text-sm tw-pb-1 tw-border-b buttons-page__header-cell">
              {{ t('buttons.buttonLabel') }}
            </div>
            <div class="tw-font-semibold tw-text-sm tw-pb-1 tw-border-b buttons-page__header-cell">
              {{ t('buttons.stakeAmount') }}
            </div>
          </div>          <!-- Button Fields -->
          <div class="tw-space-y-2">
            <div 
              v-for="(button, index) in formData" 
              :key="button.id" 
              class="tw-grid tw-grid-cols-2 tw-gap-3"
            >
              <div>
                <v-text-field
                  v-model="button.title"
                  :placeholder="t('buttons.buttonPlaceholder', { n: index + 1 })"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="tw-bg-theme-surface buttons-page__field"
                ></v-text-field>
              </div>

              <div>
                <v-text-field
                  v-model="button.amount"
                  :placeholder="t('buttons.amountPlaceholder', { n: index + 1 })"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="tw-bg-theme-surface buttons-page__field"
                ></v-text-field>
              </div>
            </div>
          </div>          <!-- Action Buttons -->
          <div class="tw-flex tw-justify-between tw-items-center tw-pt-4 tw-border-t buttons-page__actions">
            <!-- Reset Button -->
            <v-btn
              @click="loadButtons"
              variant="outlined"
              :disabled="isLoading || isSubmitting"
              class="buttons-page__reset-btn"
            >
              <v-icon start>mdi-refresh</v-icon>
              {{ t('buttons.reset') }}
            </v-btn>
            
            <!-- Update Button -->
            <v-btn
              type="submit"
              :loading="isSubmitting"
              :disabled="isSubmitting || isLoading"
              color="primary"
              variant="flat"
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
          </div></form>
      </div>    </div>
</template>

<style scoped>
.buttons-page__title {
  color: #111827 !important;
}

.buttons-page__card {
  background: #121212 !important;
  border-color: #d6c59b !important;
}

.buttons-page__header-cell {
  color: #ffffff !important;
  border-color: #d6c59b !important;
}

.buttons-page__actions {
  border-color: #d6c59b !important;
}

.buttons-page__field :deep(.v-field) {
  background: #121212 !important;
}

.buttons-page__field :deep(.v-field__input),
.buttons-page__field :deep(input),
.buttons-page__field :deep(.v-field-label),
.buttons-page__field :deep(.v-label) {
  color: #ffffff !important;
  opacity: 1 !important;
}

.buttons-page__field :deep(.v-field__outline) {
  --v-field-border-opacity: 1 !important;
  color: #333 !important;
}

.buttons-page__field :deep(.v-field--focused .v-field__outline) {
  color: #f26c20 !important;
}

.buttons-page__update-btn {
  background: #f26c20 !important;
  border: 1px solid #f26c20 !important;
  color: #ffffff !important;
}

.buttons-page__update-btn :deep(.v-btn__content),
.buttons-page__update-btn :deep(.v-icon) {
  color: #ffffff !important;
}

.buttons-page__reset-btn {
  background: #121212 !important;
  border: 1px solid #333 !important;
  color: #ffffff !important;
}

.buttons-page__reset-btn :deep(.v-btn__content),
.buttons-page__reset-btn :deep(.v-icon) {
  color: #ffffff !important;
}

.buttons-page__reset-btn:hover {
  background: #333 !important;
  border-color: #333 !important;
}
</style>
