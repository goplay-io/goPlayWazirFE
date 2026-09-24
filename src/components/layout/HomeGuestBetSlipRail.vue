<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { openLoginModal } from '@/composables/useLoginModal.js';
import emptyBetslipTicketsIcon from '@/assets/icons/empty-betslip-tickets.png';

const { t } = useI18n();
const activeTab = ref('betslip');

const onLoginClick = () => {
  openLoginModal({ redirect: '/sports/live' });
};
</script>

<template>
  <div class="home-ref-bet-slip">
    <div class="home-ref-bet-slip__inner">
      <div class="home-ref-bet-slip__tabs-wrap">
        <div class="home-ref-bet-slip__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            class="home-ref-bet-slip__tab"
            :class="{ 'home-ref-bet-slip__tab--active': activeTab === 'betslip' }"
            :aria-selected="activeTab === 'betslip'"
            @click="activeTab = 'betslip'"
          >
            {{ t('components.betSlipToolbar.betslip') }}
          </button>
          <button
            type="button"
            role="tab"
            class="home-ref-bet-slip__tab"
            :class="{ 'home-ref-bet-slip__tab--active': activeTab === 'openBet' }"
            :aria-selected="activeTab === 'openBet'"
            @click="activeTab = 'openBet'"
          >
            {{ t('components.betSlipToolbar.openBet') }}
          </button>
        </div>
      </div>

      <div
        v-if="activeTab === 'betslip'"
        class="home-ref-bet-slip__empty"
        role="tabpanel"
      >
        <img
          class="home-ref-bet-slip__empty-icon"
          :src="emptyBetslipTicketsIcon"
          alt=""
          width="75"
          height="75"
        />
        <p class="home-ref-bet-slip__empty-text">
          {{ t('components.betSlipToolbar.emptyStateTitle') }}
        </p>
      </div>

      <p v-else class="home-ref-bet-slip__login-prompt" role="tabpanel">
        {{ t('components.betSlipToolbar.loginForOpenBets') }}
        <button type="button" class="home-ref-bet-slip__login-link" @click="onLoginClick">
          {{ t('components.betSlipToolbar.loginLink') }}
        </button>
      </p>
    </div>
  </div>
</template>

<style scoped>
.home-ref-bet-slip {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: #333333;
  box-sizing: border-box;
}

.home-ref-bet-slip__inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 8px 0;
  box-sizing: border-box;
}

.home-ref-bet-slip__tabs-wrap {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 4px;
}

.home-ref-bet-slip__tabs {
  display: flex;
  width: 75%;
  gap: 4px;
  padding: 2px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  box-sizing: border-box;
}

.home-ref-bet-slip__tab {
  flex: 1 1 50%;
  min-width: 0;
  padding: 8px;
  border: 0;
  border-radius: 6px;
  background: #333333;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  text-transform: capitalize;
  white-space: nowrap;
  cursor: pointer;
}

.home-ref-bet-slip__tab--active {
  background: #49915e;
  color: #171716;
}

.home-ref-bet-slip__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 200px;
  padding: 16px 8px;
  box-sizing: border-box;
}

.home-ref-bet-slip__empty-icon {
  display: block;
  width: 75px;
  height: 75px;
  object-fit: contain;
  transform: rotate(-9.91deg);
}

.home-ref-bet-slip__empty-text {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  text-transform: uppercase;
}

.home-ref-bet-slip__login-prompt {
  margin: 0;
  padding: 16px 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 1.4;
  text-align: center;
}

.home-ref-bet-slip__login-link {
  padding: 0;
  border: 0;
  background: transparent;
  background-image: linear-gradient(90deg, #49915e, #49915e);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.home-ref-bet-slip__login-link:hover {
  text-decoration: underline;
}
</style>
