<template>
  <footer class="app-footer tw-bg-theme-surface tw-border-t tw-border-theme-border">
    <div class="tw-px-4 md:tw-px-6 tw-py-2 md:tw-py-4">
      <!-- Desktop Layout -->
      <div class="tw-hidden md:tw-flex tw-items-center tw-justify-between tw-gap-6">
        <!-- Left Section - SSL Security Badge -->
        <div class="tw-flex tw-items-center tw-gap-4">
          <!-- Shield Badge -->
          <div class="security-badge">
            <div class="shield-container">
              <svg class="shield-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" 
                      fill="currentColor" class="shield-fill"/>
                <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="badge-text">
              <span class="badge-title">{{ t('footer.security.badgeTitle') }}</span>
              <span class="badge-subtitle">{{ t('footer.security.badgeSubtitle') }}</span>
            </div>
          </div>
          
          <!-- Security Info Text -->
          <div class="tw-flex tw-flex-col tw-gap-1">
            <span class="tw-text-base tw-font-bold tw-text-theme-text">
              {{ t('footer.security.safeLabel') }}
            </span>
            <span class="tw-text-sm tw-text-theme-text-secondary">
              {{ t('footer.security.safeDescription') }}
            </span>
          </div>
        </div>

        <!-- Center Section - Copyright -->
        <div class="tw-flex tw-items-center tw-justify-center">
          <span class="tw-text-sm tw-text-theme-text-secondary">
            {{ t('footer.copyright.text', { year: currentYear }) }}
          </span>
        </div>

        <!-- Right Section - Certification Badges -->
        <div class="tw-flex tw-items-center tw-gap-3">
          <!-- 18+ Badge -->
          <div class="age-badge" :title="t('footer.badges.ageOnly')">
            <span class="tw-text-base tw-font-bold">{{ t('footer.badges.ageOnlyShort') }}</span>
          </div>

          <!-- Responsible Gaming Badge -->
          <a
            class="cert-badge"
            :title="t('footer.badges.responsibleGaming')"
            href="https://www.gamcare.org.uk/"
            target="_blank"
            rel="noopener noreferrer"
          >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="tw-w-5 tw-h-5"
              >
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
              <path
                d="M12 6v6l4 2"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </a>

          <!-- GT Badge -->
          <a
            class="gt-badge"
            :title="t('footer.badges.gamingTrust')"
            href="https://www.gamblingtherapy.org/en"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="tw-text-base tw-font-bold">{{ t('footer.badges.gtLabel') }}</span>
          </a>
        </div>
      </div>

      <!-- Mobile Layout -->
      <div class="md:tw-hidden tw-flex tw-flex-col tw-gap-6">
        <!-- Security Row -->
        <div class="tw-flex tw-items-center tw-justify-between tw-gap-4">
          <!-- SSL Badge - Compact -->
          <div class="tw-flex tw-items-center tw-gap-3">
            <div class="security-badge-mobile">
              <svg class="tw-w-7 tw-h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" 
                      fill="currentColor" class="shield-fill"/>
                <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="tw-flex tw-flex-col">
              <span class="tw-text-sm tw-font-bold tw-text-theme-text">
                {{ t('footer.security.safeLabel') }}
              </span>
              <span class="tw-text-xs tw-text-theme-text-secondary">
                {{ t('footer.security.safeDescriptionShort') }}
              </span>
            </div>
          </div>

          <!-- Certification Badges -->
          <div class="tw-flex tw-items-center tw-gap-2">
            <!-- 18+ Badge -->
            <div class="age-badge-mobile" :title="t('footer.badges.ageOnly')">
              <span class="tw-text-sm tw-font-bold">{{ t('footer.badges.ageOnlyShort') }}</span>
            </div>

            <!-- Responsible Gaming Badge -->
            <div class="cert-badge-mobile" :title="t('footer.badges.responsibleGamingShort')">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="tw-w-4 tw-h-4">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>

            <!-- GT Badge -->
            <div class="gt-badge-mobile" :title="t('footer.badges.gamingTrust')">
              <span class="tw-text-sm tw-font-bold">{{ t('footer.badges.gtLabel') }}</span>
            </div>
          </div>
        </div>

        <!-- Copyright Row -->
        <div class="tw-text-center">
          <span class="tw-text-xs tw-text-theme-text-secondary">
            {{ t('footer.copyright.text', { year: currentYear }) }}
          </span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.app-footer {
  position: relative;
  z-index: 0;
  background-color: #000000;
}

/* Security Badge - Desktop */
.security-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px 12px 14px;
  background: linear-gradient(135deg, var(--color-success) 0%, #15803d 100%);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
}

.shield-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.shield-icon {
  width: 32px;
  height: 32px;
}

.shield-fill {
  color: white;
}

.badge-text {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.badge-title {
  font-size: 16px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.badge-subtitle {
  font-size: 10px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.3px;
  line-height: 1.2;
}

/* Security Badge - Mobile */
.security-badge-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, var(--color-success) 0%, #15803d 100%);
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3);
}

.security-badge-mobile .shield-fill {
  color: white;
}

/* 18+ Age Badge - Desktop */
.age-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-surface-alt);
  border: 2px solid var(--color-error);
  border-radius: 50%;
  color: var(--color-error);
  transition: all 0.3s ease;
}

.age-badge:hover {
  background: var(--color-error);
  color: white;
  transform: scale(1.05);
}

/* 18+ Age Badge - Mobile */
.age-badge-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: var(--color-surface-alt);
  border: 2px solid var(--color-error);
  border-radius: 50%;
  color: var(--color-error);
}

/* Certification Badge - Desktop */
.cert-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-text-secondary);
  transition: all 0.3s ease;
}

.cert-badge:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: scale(1.05);
}

/* Certification Badge - Mobile */
.cert-badge-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-text-secondary);
}

/* GT Badge - Desktop */
.gt-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-text);
  border-radius: 10px;
  color: var(--color-background);
  transition: all 0.3s ease;
}

.gt-badge:hover {
  background: var(--color-primary);
  color: white;
  transform: scale(1.05);
}

/* GT Badge - Mobile */
.gt-badge-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: var(--color-text);
  border-radius: 8px;
  color: var(--color-background);
}

/* Footer specific adjustments */
.app-footer {
  box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.05);
  background-color: #000000;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .security-badge {
    padding: 10px 16px 10px 12px;
  }
  
  .shield-icon {
    width: 32px;
    height: 32px;
  }
  
  .badge-title {
    font-size: 14px;
  }
  
  .badge-subtitle {
    font-size: 9px;
  }
  
  .age-badge,
  .cert-badge,
  .gt-badge {
    width: 36px;
    height: 36px;
  }
}
</style>














