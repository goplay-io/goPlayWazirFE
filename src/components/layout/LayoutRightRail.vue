<script setup>
import { useI18n } from 'vue-i18n';
import SportsBetSlip from '@/views/sports/Bet/SportsBetSlip.vue';
import HomeGuestBetSlipRail from '@/components/layout/HomeGuestBetSlipRail.vue';
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
  /** Home / layout rail: load account-wide unsettled open bets instead of event-scoped history. */
  openBetsUseUnsettled: {
    type: Boolean,
    default: false,
  },
  /** monkeydon.com home: bet slip card only — no Why Choose Us / WhatsApp promos. */
  homeReferenceLayout: {
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
    :class="{
      'layout-right-rail--footer-doc': stickyFooterDoc,
      'layout-right-rail--home-ref': homeReferenceLayout,
    }"
  >
    <div
      v-if="homeReferenceLayout || authStore.isUiAuthenticated"
      class="layout-right-rail__slip"
      :class="{ 'layout-right-rail__slip--home-ref': homeReferenceLayout }"
    >
      <HomeGuestBetSlipRail v-if="homeReferenceLayout && !authStore.isUiAuthenticated" />
      <SportsBetSlip
        v-else-if="authStore.isUiAuthenticated"
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
        :open-bets-use-unsettled="openBetsUseUnsettled"
        v-model:bet_status="betStore.bet_status"
        v-model:bet_processing="bet_processing"
        v-model:showBetHistory="showBetHistory"
        @update:buttons="handleButtonsUpdate"
      />
    </div>

    <template v-if="!homeReferenceLayout">
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
    </template>
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
