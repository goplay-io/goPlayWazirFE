<template>
  <div class="sport-page-title-header">
    <div class="sport-page-title-header__breadcrumb">
      <router-link to="/sports/live" class="sport-page-title-header__home" aria-label="Home">
        <img :src="homeIcon" alt="" class="sport-page-title-header__home-icon" width="15" height="15" />
      </router-link>
      <img src="/zuplay/svg/arrow1.png" alt="" class="sport-page-title-header__chevron" width="14" height="10" />
    </div>
    <span class="sport-page-title-header__title">{{ title }}</span>
  </div>
</template>

<script setup>
import homeIcon from '@/assets/img/icon/page-title/header-home-image.png'

defineProps({
  title: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.sport-page-title-header {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 0;
  padding: 6px 16px;
  margin-bottom: 0;
  border-radius: 8px 8px 0 0;
  background: var(--color-header-bg, #360952);
  color: #ffffff;
}

.sport-page-title-header__breadcrumb {
  display: none;
  align-items: center;
  gap: 12px;
  margin-left: 0;
  flex-shrink: 0;
}

@media (min-width: 769px) {
  .sport-page-title-header__breadcrumb {
    display: inline-flex;
  }
}

.sport-page-title-header__home {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 0;
}

.sport-page-title-header__home-icon {
  display: block;
  width: 15px;
  height: 15px;
  object-fit: contain;
}

.sport-page-title-header__chevron {
  display: block;
  width: 14px;
  height: 10px;
  margin: 1px 0 0;
  object-fit: contain;
  transform: rotate(90deg);
  flex-shrink: 0;
}

.sport-page-title-header__title {
  margin-left: 8px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
  color: #ffffff;
  text-transform: capitalize;
}

@media (max-width: 768px) {
  .sport-page-title-header {
    height: 32px;
    min-height: 32px;
    padding: 0;
    border-radius: 5px 5px 0 0;
    text-align: center;
  }

  .sport-page-title-header__breadcrumb {
    display: none;
  }

  .sport-page-title-header__title {
    margin-left: 8px;
    font-weight: 600;
    line-height: 22.5px;
  }
}
</style>
