<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { openLoginModal } from '@/composables/useLoginModal.js';

const { t } = useI18n();
const route = useRoute();
const activeTab = ref('betslip');

const onLoginClick = () => {
  openLoginModal({ redirect: route.fullPath });
};
</script>

<template>
  <div class="home-ref-bet-slip">
    <div class="home-ref-bet-slip__tab-row">
      <div class="home-ref-bet-slip__tabs" role="tablist" aria-label="Bet slip panels">
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

    <div class="home-ref-bet-slip__body">
      <p class="home-ref-bet-slip__login-prompt" role="tabpanel">
        {{ t('components.betSlipToolbar.loginForOpenBets') }}
        <button type="button" class="home-ref-bet-slip__login-link" @click="onLoginClick">
          {{ t('components.betSlipToolbar.loginLink') }}
        </button>
      </p>
    </div>
  </div>
</template>
