<script setup>
import { useI18n } from 'vue-i18n'
import homeIcon from '@/assets/img/icon/page-title/header-home-image.png'
import chevronIcon from '@/assets/img/icon/page-title/right-arrow.png'
import {
  WHY_CHOOSE_US_CLOSING,
  WHY_CHOOSE_US_SECTIONS,
} from '@/data/whyChooseUsContent.js'

const { t } = useI18n()
</script>

<template>
  <div class="info-page account-page why-choose-us-page">
    <header class="why-choose-us-page__strip">
      <div class="why-choose-us-page__strip-breadcrumb">
        <router-link to="/" class="why-choose-us-page__strip-home" :aria-label="t('common.home')">
          <img :src="homeIcon" alt="" class="why-choose-us-page__strip-home-icon" width="15" height="15" />
        </router-link>
        <img :src="chevronIcon" alt="" class="why-choose-us-page__strip-chevron" width="14" height="10" />
      </div>
      <div class="why-choose-us-page__strip-title">
        {{ t('pages.whyChooseUs.stripPrefix') }}
        <span class="why-choose-us-page__strip-title-cap">{{ t('pages.whyChooseUs.stripSuffix') }}</span>
      </div>
    </header>

    <div class="why-choose-us-page__body">
      <div class="why-choose-us-page__content">
        <h1 class="why-choose-us-page__title">{{ t('pages.whyChooseUs.title') }}</h1>

        <p class="why-choose-us-page__paragraph why-choose-us-page__intro">
          {{ t('pages.whyChooseUs.intro') }}
        </p>

        <section
          v-for="section in WHY_CHOOSE_US_SECTIONS"
          :key="section.id"
          class="why-choose-us-page__section"
        >
          <h3 class="why-choose-us-page__heading">{{ section.title }}</h3>
          <p class="why-choose-us-page__paragraph">{{ section.body }}</p>
        </section>

        <section class="why-choose-us-page__section">
          <h3 class="why-choose-us-page__heading">{{ WHY_CHOOSE_US_CLOSING.title }}</h3>
          <p
            v-for="(paragraph, index) in WHY_CHOOSE_US_CLOSING.paragraphs"
            :key="index"
            class="why-choose-us-page__paragraph"
          >
            {{ paragraph }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.why-choose-us-page {
  width: 100%;
  max-width: 100%;
  margin: 0;
  border-radius: 0;
  overflow: hidden;
  background: #ffffff;
}

/* Reference: bg-skin-page-header strip — 32px, rounded top, purple */
.why-choose-us-page__strip {
  display: flex;
  align-items: center;
  width: 100%;
  height: 32px;
  min-height: 32px;
  margin: 0;
  padding: 0;
  border-radius: 4px 4px 0 0;
  background: var(--color-header-bg, #360952);
  text-align: center;
  box-sizing: border-box;
}

.why-choose-us-page__strip-breadcrumb {
  display: none;
  align-items: center;
  gap: 20px;
  margin-left: 40px;
  margin-right: 20px;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .why-choose-us-page__strip-breadcrumb {
    display: inline-flex;
  }
}

.why-choose-us-page__strip-home {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.why-choose-us-page__strip-home-icon {
  display: block;
  width: 15px;
  height: 15px;
  object-fit: contain;
}

.why-choose-us-page__strip-chevron {
  display: block;
  width: 14px;
  height: 10px;
  margin-top: 2px;
  object-fit: contain;
  transform: rotate(90deg);
}

.why-choose-us-page__strip-title {
  margin-left: 8px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  line-height: 22.5px;
  letter-spacing: normal;
  white-space: nowrap;
}

.why-choose-us-page__strip-title-cap {
  text-transform: capitalize;
}

/* Reference: bg-white flex flex-col px-2 py-2 lg:px-28 */
.why-choose-us-page__body {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: #ffffff;
  padding: 8px;
  margin: 0;
  box-sizing: border-box;
  color: #000000;
}

@media (min-width: 1024px) {
  .why-choose-us-page__body {
    padding: 8px 112px;
  }
}

/* Reference: inner .mt-2.content */
.why-choose-us-page__content {
  margin-top: 8px;
  width: 100%;
  min-width: 0;
}

.why-choose-us-page__title {
  margin: 0;
  padding: 2px 0;
  color: #000000;
  font-size: 25.5px;
  font-weight: 700;
  line-height: 38.25px;
  letter-spacing: normal;
}

.why-choose-us-page__intro,
.why-choose-us-page__paragraph {
  margin: 0;
  padding: 10px 0;
  color: #000000;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
}

.why-choose-us-page__section {
  margin: 0;
}

.why-choose-us-page__heading {
  margin: 0;
  padding: 2px 0;
  color: #000000;
  font-size: 18px;
  font-weight: 700;
  line-height: 27px;
  letter-spacing: normal;
}
</style>
