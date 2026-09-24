<script setup>
import { useI18n } from 'vue-i18n';
import SportsBetSlip from '@/views/sports/Bet/SportsBetSlip.vue';
import { useLayoutBetSlip } from '@/composables/useLayoutBetSlip';
import { useAuthStore } from '@/stores/auth';

defineProps({
  showWhatsapp: {
    type: Boolean,
    default: false,
  },
  whatsappUrl: {
    type: String,
    default: '',
  },
  stickyFooterDoc: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();
const authStore = useAuthStore();

const {
  betStore,
  buttons,
  slipOpen,
  showBetHistory,
  bet_processing,
  betAllow,
  handleButtonsUpdate,
  toggleSlip,
} = useLayoutBetSlip();
</script>

<template>
  <aside
    class="layout-right-rail tw-shrink-0 tw-hidden md:tw-flex tw-flex-col tw-overflow-y-auto scrollbar-primary"
    :class="{ 'layout-right-rail--footer-doc': stickyFooterDoc }"
  >
    <div v-if="authStore.isUiAuthenticated" class="layout-right-rail__slip">
      <SportsBetSlip
        :slipOpen="slipOpen"
        :toggleSlip="toggleSlip"
        :bet_error="betStore.bet_error"
        :betAllow="betAllow"
        :bet="betStore.bet"
        :buttons="buttons"
        :changeAmount="betStore.changeAmount"
        :placeBet="betStore.placeBet"
        :betHistory="betStore.betHistory"
        :betHistoryCount="betStore.betHistoryCount"
        :minAmount="betStore.minAmount"
        :maxAmount="betStore.maxAmount"
        v-model:bet_status="betStore.bet_status"
        v-model:bet_processing="bet_processing"
        v-model:showBetHistory="showBetHistory"
        @update:buttons="handleButtonsUpdate"
      />
    </div>

    <router-link to="/why-choose-us" class="layout-right-rail__why" aria-label="Why Choose Us">
      <img
        src="/why-choose-us.png"
        alt="Why Choose Us"
        class="layout-right-rail__img"
      />
    </router-link>

    <component
      :is="showWhatsapp && whatsappUrl ? 'a' : 'div'"
      v-if="showWhatsapp"
      v-bind="showWhatsapp && whatsappUrl
        ? { href: whatsappUrl, target: '_blank', rel: 'noopener noreferrer' }
        : {}"
      class="layout-right-rail__whatsapp"
      :aria-label="t('footer.social.whatsapp')"
    >
      <img
        src="/svg/whatsapp1.png"
        alt=""
        class="layout-right-rail__whatsapp-img"
        width="402"
        height="111"
      />
    </component>
  </aside>
</template>

<style scoped>
.layout-right-rail__why {
  display: block;
  width: 100%;
  line-height: 0;
  text-decoration: none;
}

.layout-right-rail__img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
  border-radius: 4px;
}

.layout-right-rail__whatsapp {
  display: block;
  width: 100%;
  padding: 0;
  margin: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  line-height: 0;
  text-decoration: none;
}

.layout-right-rail__whatsapp-img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 4px;
  object-fit: contain;
}
</style>
