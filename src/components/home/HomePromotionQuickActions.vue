<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { openLoginModal } from '@/composables/useLoginModal.js';

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();

const showQuickActions = computed(() => true);

const onDepositClick = () => {
  if (authStore.isUiAuthenticated) {
    router.push('/deposit');
    return;
  }
  openLoginModal({ redirect: '/deposit' });
};

const onReferClick = () => {
  if (authStore.isUiAuthenticated) {
    router.push('/affiliate');
    return;
  }
  openLoginModal({ redirect: '/affiliate' });
};

const onPromotionClick = () => {
  router.push('/bonuses');
};
</script>

<template>
  <section class="home-promotion-actions">
    <button
      type="button"
      class="home-promotion-actions__banner"
      :style="{ backgroundImage: 'url(/home/promotionBanner.webp)' }"
      @click="onPromotionClick"
    >
      <h3 class="home-promotion-actions__banner-title">
        {{ t('components.homePromotion.title') }}
      </h3>
    </button>

    <div v-if="showQuickActions" class="home-promotion-actions__grid">
      <button type="button" class="home-promotion-actions__cta home-promotion-actions__cta--deposit" @click="onDepositClick">
        <span class="home-promotion-actions__cta-icon-wrap">
          <img src="/home/deposit-icon.svg" alt="" class="home-promotion-actions__cta-icon" width="18" height="18" />
        </span>
        <span class="home-promotion-actions__cta-copy">
          <span class="home-promotion-actions__cta-title">{{ t('components.homePromotion.depositTitle') }}</span>
          <span class="home-promotion-actions__cta-subtitle">{{ t('components.homePromotion.depositSubtitle') }}</span>
        </span>
      </button>

      <button type="button" class="home-promotion-actions__cta home-promotion-actions__cta--refer" @click="onReferClick">
        <span class="home-promotion-actions__cta-icon-wrap home-promotion-actions__cta-icon-wrap--refer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="3" y="8" width="18" height="4" rx="1" />
            <path d="M12 8v13" />
            <path d="M19 12v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9" />
            <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
          </svg>
        </span>
        <span class="home-promotion-actions__cta-copy">
          <span class="home-promotion-actions__cta-title">{{ t('components.homePromotion.referTitle') }}</span>
          <span class="home-promotion-actions__cta-subtitle">{{ t('components.homePromotion.referSubtitle') }}</span>
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.home-promotion-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.home-promotion-actions__banner {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 70px;
  padding: 0 17px;
  border: 0;
  border-radius: 10px;
  background-color: #333333;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
  text-align: left;
  transition: transform 0.3s ease;
}

.home-promotion-actions__banner:hover {
  transform: scale(1.01);
}

.home-promotion-actions__banner:active {
  transform: scale(0.97);
}

.home-promotion-actions__banner-title {
  margin: 0;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.219px;
  line-height: normal;
}

.home-promotion-actions__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.home-promotion-actions__cta {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #333333;
  cursor: pointer;
  text-align: left;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.home-promotion-actions__cta:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.home-promotion-actions__cta:active {
  transform: scale(0.95);
}

.home-promotion-actions__cta--refer {
  background: linear-gradient(135deg, #1f4d33 0%, #2d6a4f 100%);
  border-color: rgba(73, 145, 94, 0.45);
}

.home-promotion-actions__cta-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  flex-shrink: 0;
}

.home-promotion-actions__cta-icon-wrap--refer {
  background: rgba(73, 145, 94, 0.3);
}

.home-promotion-actions__cta-icon {
  display: block;
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.home-promotion-actions__cta-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.home-promotion-actions__cta-title {
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home-promotion-actions__cta-subtitle {
  color: rgba(255, 255, 255, 0.82);
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
