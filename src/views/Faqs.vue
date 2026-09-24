<script setup>
import { useI18n } from 'vue-i18n'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import { FAQ_PARAGRAPHS, getFaqParagraphType } from '@/data/faqsContent.js'

const { t } = useI18n()
</script>

<template>
  <div class="info-page account-page faqs-page">
    <AccountPageHeader :title="t('pages.faqs.title')" />

    <div class="faqs-page__body">
      <div class="faqs-page__content">
        <p
          v-for="(paragraph, index) in FAQ_PARAGRAPHS"
          :key="index"
          class="faqs-page__paragraph"
          :class="`faqs-page__paragraph--${getFaqParagraphType(paragraph)}`"
        >
          <strong v-if="getFaqParagraphType(paragraph) !== 'answer'">{{ paragraph }}</strong>
          <template v-else>{{ paragraph }}</template>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.faqs-page {
  margin-top: 1px;
  border-radius: 5px 5px 0 0;
  overflow: hidden;
}

.faqs-page :deep(.account-page-header) {
  border-radius: 4px 4px 0 0;
}

.faqs-page :deep(.account-page-header__breadcrumb) {
  margin-left: 40px;
  margin-right: 20px;
  gap: 20px;
}

.faqs-page__body {
  padding: 0;
  margin: 0;
}

@media (min-width: 768px) {
  .faqs-page__body {
    padding: 0 80px;
    margin: 0 4px;
  }
}

.faqs-page__content {
  margin-top: 16px;
}

@media (max-width: 767px) {
  .faqs-page__content {
    margin-top: 0;
  }
}

.faqs-page__paragraph {
  margin: 0;
  padding: 10px 0;
  color: #000000;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
}

.faqs-page__paragraph strong {
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  color: #000000;
}
</style>
