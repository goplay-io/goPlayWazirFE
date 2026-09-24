<script setup>
import { useI18n } from 'vue-i18n'
import AccountPageHeader from '@/components/account/AccountPageHeader.vue'
import HomePageBottomText from '@/components/home/HomePageBottomText.vue'

const { t } = useI18n()
</script>

<template>
  <div class="info-page account-page refer-friend-page">
    <AccountPageHeader :title="t('pages.referFriend.title')" />

    <div class="refer-friend-page__body">
      <div class="refer-friend-page__flow-wrap">
        <img
          src="/svg/refer-flow.png"
          alt=""
          class="refer-friend-page__flow"
          width="350"
          height="auto"
        />
      </div>

      <div class="refer-friend-page__text">
        <HomePageBottomText always-expanded />
      </div>
    </div>
  </div>
</template>

<style scoped>
.refer-friend-page {
  margin-top: 1px;
  border-radius: 5px 5px 0 0;
  overflow: hidden;
}

.refer-friend-page :deep(.account-page-header) {
  border-radius: 4px 4px 0 0;
}

.refer-friend-page :deep(.account-page-header__breadcrumb) {
  margin-left: 16px;
  margin-right: 0;
  gap: 8px;
}

.refer-friend-page__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
}

@media (min-width: 768px) {
  .refer-friend-page__body {
    padding: 0;
    margin: 4px;
  }
}

.refer-friend-page__flow-wrap {
  display: flex;
  width: 100%;
  margin: 8px 0;
}

@media (max-width: 767px) {
  .refer-friend-page__flow-wrap {
    margin: 0;
  }
}

.refer-friend-page__flow {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
  padding: 0;
  border-radius: 8px;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .refer-friend-page__flow {
    width: 350px;
    max-width: 350px;
    padding: 0;
  }
}

.refer-friend-page__text {
  padding: 0;
  background: #ffffff;
}

@media (min-width: 768px) {
  .refer-friend-page__text {
    padding: 0 80px;
  }
}

.refer-friend-page__text :deep(.home-bottom-text) {
  margin: 0;
}
</style>
