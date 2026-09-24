<script setup>
import { useI18n } from 'vue-i18n'
import homeIcon from '@/assets/img/icon/page-title/header-home-image.png'
import chevronIcon from '@/assets/img/icon/page-title/right-arrow.png'

defineProps({
  title: {
    type: String,
    required: true,
  },
})

const { t } = useI18n()
</script>

<template>
  <header class="account-page-header">
    <div class="account-page-header__breadcrumb">
      <router-link to="/" class="account-page-header__home" :aria-label="t('common.home')">
        <img :src="homeIcon" alt="" class="account-page-header__home-icon" width="15" height="15" />
      </router-link>
      <img :src="chevronIcon" alt="" class="account-page-header__chevron" width="14" height="10" />
    </div>
    <div class="account-page-header__title-wrap">
      <h1 class="account-page-header__title">{{ title }}</h1>
    </div>
    <div v-if="$slots.actions" class="account-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>
