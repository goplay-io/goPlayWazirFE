<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { openLoginModal } from '@/composables/useLoginModal.js';
import UsdtIcon from '@/components/Icons/UsdtIcon.vue';

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
        <span class="home-promotion-actions__cta-icon-wrap home-promotion-actions__cta-icon-wrap--deposit" aria-hidden="true">
          <UsdtIcon :size="30" class="home-promotion-actions__cta-icon" />
        </span>
        <span class="home-promotion-actions__cta-copy">
          <span class="home-promotion-actions__cta-title">{{ t('components.homePromotion.depositTitle') }}</span>
          <span class="home-promotion-actions__cta-subtitle">{{ t('components.homePromotion.depositSubtitle') }}</span>
        </span>
      </button>

      <button type="button" class="home-promotion-actions__cta home-promotion-actions__cta--refer" @click="onReferClick">
        <span class="home-promotion-actions__cta-icon-wrap home-promotion-actions__cta-icon-wrap--refer" aria-hidden="true">
          <svg class="home-promotion-actions__gift" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8M3 8h18v4H3V8ZM12 8v13M7.5 8a2.5 2.5 0 1 1 0-5C9.5 3 11 5.5 12 8c1-2.5 2.5-5 4.5-5a2.5 2.5 0 1 1 0 5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="home-promotion-actions__cta-copy">
          <span class="home-promotion-actions__cta-title">{{ t('components.homePromotion.referTitle') }}</span>
          <span class="home-promotion-actions__cta-subtitle home-promotion-actions__cta-subtitle--refer">{{ t('components.homePromotion.referSubtitle') }}</span>
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
  border-radius: 12px;
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
  gap: 10px;
  width: 100%;
  min-height: 52px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  text-align: left;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  box-sizing: border-box;
}

.home-promotion-actions__cta:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.home-promotion-actions__cta:active {
  transform: scale(0.97);
}

/* Reference: solid charcoal card */
.home-promotion-actions__cta--deposit {
  background: #333 !important;
  border-color: #545454;
}

/*
 * Reference sampled vertical gradient:
 * top #3c985b → mid #2c7f4a → bottom #1a5c34
 */
.home-promotion-actions__cta--refer {
  background: linear-gradient(90deg, #1e9146 -13.95%, #2c2c2c 83.91%) !important;
  border-color: #49915e;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.home-promotion-actions__cta-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 12px;
  flex-shrink: 0;
}

.home-promotion-actions__cta-icon-wrap--deposit {
  background: transparent;
  width: 30px;
  height: 30px;
}

/* Lighter translucent circle over the green gradient */
.home-promotion-actions__cta-icon-wrap--refer {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.home-promotion-actions__cta-icon {
  display: block;
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.home-promotion-actions__gift {
  display: block;
  color: #000;
}

.home-promotion-actions__cta-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.home-promotion-actions__cta-title {
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home-promotion-actions__cta-subtitle {
  color: rgba(200, 210, 220, 0.85);
  font-size: 11px;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Reference pale mint subtitle on green card */
.home-promotion-actions__cta-subtitle--refer {
  color: #d8f0d4;
}

@media (max-width: 767.98px) {
  .home-promotion-actions__cta {
    min-height: 48px;
    padding: 9px 10px;
    gap: 12px;
    border-radius: 6px;
  }

  .home-promotion-actions__cta-title {
    font-size: 14px;
  }

  .home-promotion-actions__cta-subtitle {
    font-size: 10px;
  }

  .home-promotion-actions__cta-icon-wrap--deposit,
  .home-promotion-actions__cta-icon {
    width: 28px;
    height: 28px;
  }

  .home-promotion-actions__cta-icon-wrap--refer {
    width: 27px;
    height: 27px;
  }
}
</style>
