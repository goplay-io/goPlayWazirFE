<template>
  <v-dialog v-model="dialog" max-width="500" persistent>
    <v-card class="tw-rounded-2xl tw-overflow-hidden" elevation="0">
      <!-- Gradient Background -->
      <div class="tw-relative tw-bg-theme-background-alt tw-p-8 tw-border-b tw-border-theme-border">
        <!-- Close Button - Top Right -->
        <v-btn
          icon
          variant="text"
          size="small"
          @click="close"
          class="tw-absolute tw-top-2 tw-right-2 tw-z-20 tw-text-theme-text-muted hover:tw-text-theme-text"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
        
        <!-- Decorative Elements -->
        <div class="tw-absolute tw-top-0 tw-right-0 tw-w-32 tw-h-32 tw-bg-primary/10 tw-rounded-full tw--mr-16 tw--mt-16"></div>
        <div class="tw-absolute tw-bottom-0 tw-left-0 tw-w-24 tw-h-24 tw-bg-primary/10 tw-rounded-full tw--ml-12 tw--mb-12"></div>
        
        <!-- Content -->
        <div class="tw-relative tw-z-10">
          <!-- Icon -->
          <div class="tw-flex tw-justify-center tw-mb-4">
            <div class="tw-w-20 tw-h-20 tw-bg-primary/20 tw-rounded-full tw-flex tw-items-center tw-justify-center">
              <v-icon size="48" color="primary">mdi-login</v-icon>
            </div>
          </div>
          
          <!-- Title -->
          <h2 class="tw-text-2xl tw-font-bold tw-text-center tw-mb-2 tw-text-theme-text">
            {{ t('components.demoSignup.title') }}
          </h2>
          
          <!-- Subtitle -->
          <p class="tw-text-center tw-text-theme-text-muted tw-text-sm">
            {{ t('components.demoSignup.subtitle') }}
          </p>
        </div>
      </div>

      <!-- Body Content -->
      <v-card-text class="tw-p-6 tw-space-y-4 tw-bg-theme-surface">
        <!-- Benefits List -->
        <div class="tw-space-y-3">
          <div v-for="(benefit, index) in benefits" :key="index" 
            class="tw-flex tw-items-start tw-gap-3 tw-animate-fade-in" 
            :style="{ animationDelay: `${index * 0.1}s` }">
            <div class="tw-w-8 tw-h-8 tw-bg-primary/10 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-mt-0.5">
              <v-icon size="20" color="primary">{{ benefit.icon }}</v-icon>
            </div>
            <div class="tw-flex-1">
              <h3 class="tw-font-semibold tw-text-theme-text tw-text-sm tw-mb-1">
                {{ t(benefit.titleKey) }}
              </h3>
              <p class="tw-text-theme-text-muted tw-text-xs">
                {{ t(benefit.descriptionKey) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Special Offer Badge -->
        <div class="tw-mt-6 tw-p-4 tw-bg-theme-background-alt tw-rounded-xl tw-border tw-border-theme-border tw-text-center">
          <div class="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-mb-2">
            <v-icon size="24" color="primary">mdi-gift</v-icon>
            <span class="tw-font-bold tw-text-primary tw-text-sm">
              {{ t('components.demoSignup.offer.title') }}
            </span>
          </div>
          <p class="tw-text-xs tw-text-theme-text-muted">
            {{ t('components.demoSignup.offer.subtitle') }}
          </p>
        </div>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="tw-px-6 tw-pb-6 tw-pt-0 tw-flex tw-flex-col tw-gap-2 tw-bg-theme-surface">
        <v-btn
          @click="handleLogin"
          variant="flat"
          size="small"
          block
          class="tw-h-9 tw-rounded-full tw-bg-theme-background-alt tw-text-theme-text tw-border tw-border-theme-border tw-font-semibold tw-text-sm hover:tw-bg-theme-background tw-normal-case"
        >
          {{ t('components.demoSignup.cta.login') }}
        </v-btn>
        
        <v-btn
          @click="close"
          variant="text"
          size="small"
          class="tw-text-theme-text-muted tw-text-xs tw-normal-case"
        >
          {{ t('components.demoSignup.cta.continueDemo') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const router = useRouter()
const dialog = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal
})

watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
})

const benefits = [
  {
    icon: 'mdi-wallet',
    titleKey: 'components.demoSignup.benefits.depositWithdraw.title',
    descriptionKey: 'components.demoSignup.benefits.depositWithdraw.description',
  },
  {
    icon: 'mdi-shield-check',
    titleKey: 'components.demoSignup.benefits.secureSafe.title',
    descriptionKey: 'components.demoSignup.benefits.secureSafe.description',
  },
  {
    icon: 'mdi-trophy',
    titleKey: 'components.demoSignup.benefits.fullAccess.title',
    descriptionKey: 'components.demoSignup.benefits.fullAccess.description',
  },
  {
    icon: 'mdi-head-lightbulb',
    titleKey: 'components.demoSignup.benefits.expertSupport.title',
    descriptionKey: 'components.demoSignup.benefits.expertSupport.description',
  },
]

const handleLogin = () => {
  close()
  router.push('/login')
}

const close = () => {
  dialog.value = false
}
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
  opacity: 0;
}
</style>
