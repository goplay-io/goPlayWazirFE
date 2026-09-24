<template>
  <div class="info-page account-page">
    <AccountPageHeader :title="t('pages.contact.title')" />

    <div class="info-page__body">
      <p class="info-page__intro">{{ t('pages.contact.heroIntro') }}</p>

      <section class="info-page__section">
        <div class="info-page__grid info-page__grid--2">
          <div class="info-page__feature">
            <v-icon size="28" class="info-page__feature-icon">mdi-whatsapp</v-icon>
            <h3 class="info-page__feature-title">{{ t('pages.contact.whatsapp') }}</h3>
            <p class="info-page__feature-text">{{ t('pages.contact.whatsappDesc') }}</p>
            <a
              :href="whatsappLink"
              target="_blank"
              rel="noopener noreferrer"
              class="info-page__contact-btn"
            >
              <v-icon size="18">mdi-whatsapp</v-icon>
              <span>{{ t('pages.contact.openWhatsapp') }}</span>
              <v-icon size="16">mdi-arrow-right</v-icon>
            </a>
          </div>

          <div class="info-page__feature">
            <v-icon size="28" class="info-page__feature-icon">mdi-email</v-icon>
            <h3 class="info-page__feature-title">{{ t('pages.contact.email') }}</h3>
            <p class="info-page__feature-text">{{ t('pages.contact.emailDesc') }}</p>
            <a :href="`mailto:${emailAddress}`" class="info-page__contact-btn">
              <v-icon size="18">mdi-email</v-icon>
              <span>{{ emailAddress }}</span>
              <v-icon size="16">mdi-arrow-right</v-icon>
            </a>
          </div>
        </div>
      </section>

      <section class="info-page__section">
        <h2 class="info-page__section-title">{{ t('pages.contact.supportHoursTitle') }}</h2>
        <div class="info-page__feature">
          <v-icon size="28" class="info-page__feature-icon">mdi-clock-outline</v-icon>
          <h3 class="info-page__feature-title">{{ t('pages.contact.supportBadge') }}</h3>
          <p class="info-page__feature-text">{{ t('pages.contact.supportDescription') }}</p>
        </div>
      </section>

      <section class="info-page__section">
        <h2 class="info-page__section-title">{{ t('pages.contact.additionalTitle') }}</h2>
        <div class="info-page__grid info-page__grid--3">
          <div class="info-page__feature">
            <v-icon size="28" class="info-page__feature-icon">mdi-headset</v-icon>
            <h3 class="info-page__feature-title">{{ t('pages.contact.quickResponseTitle') }}</h3>
            <p class="info-page__feature-text">{{ t('pages.contact.quickResponseDesc') }}</p>
          </div>
          <div class="info-page__feature">
            <v-icon size="28" class="info-page__feature-icon">mdi-shield-check</v-icon>
            <h3 class="info-page__feature-title">{{ t('pages.contact.secureCommTitle') }}</h3>
            <p class="info-page__feature-text">{{ t('pages.contact.secureCommDesc') }}</p>
          </div>
          <div class="info-page__feature">
            <v-icon size="28" class="info-page__feature-icon">mdi-account-multiple</v-icon>
            <h3 class="info-page__feature-title">{{ t('pages.contact.expertTeamTitle') }}</h3>
            <p class="info-page__feature-text">{{ t('pages.contact.expertTeamDesc') }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'

const whatsappNumber = '+1234567890'
const emailAddress = 'info.live@gmail.com'

const whatsappLink = computed(() => {
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '')
  return `https://wa.me/${cleanNumber}`
})

const { t } = useI18n()
</script>
