<script setup>
import { defineProps, defineEmits, ref, provide, computed } from 'vue';
import RulesDialog from '@/components/RulesDialog.vue';
import BookmakerBackLay from './BookmakerBackLay.vue';
import BookmakerBackOnly from './BookmakerBackOnly.vue';
import BookmakerGinnie from './BookmakerGinnie.vue';
import WhoWillWinTheMatch from './WhoWillWinTheMatch.vue';
import { sortBackLayBookmakers } from './bookmakerTypes';

const props = defineProps({
  bookMakersData: Object,
  selectedBet: Object,
  betHistory: {
    type: Array,
    default: null
  },
  betOutcomes: {
    type: Object,
    default: null
  },
  eventTypeId: [String, Number],
  eventName: String,
  betAllow: Boolean,
  eventId: [String, Number],
  providerId: [String, Number],
  inPlay: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Function,
    default: null
  },
  onToggleFavorite: {
    type: Function,
    default: null
  },
  onRunnerCppUpdate: {
    type: Function,
    default: null
  },
  cashoutActive: {
    type: Boolean,
    default: true
  },
  speedCashoutActive: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits([]);

const WHO_WILL_WIN_TYPE = 'WHO_WILL_WIN_THE_MATCH';

const whoWillWinMarkets = computed(() => {
  if (!props.bookMakersData) return [];
  const list = Array.isArray(props.bookMakersData)
    ? props.bookMakersData
    : Object.values(props.bookMakersData);
  return list.filter((bm) => String(bm?.type || '').toUpperCase() === WHO_WILL_WIN_TYPE);
});

const getBookmakersByBettingType = computed(() => {
  const result = {
    backLay: [],
    backOnly: [],
    ginnie: []
  };

  if (!props.bookMakersData) return result;

  const bookmakersList = Array.isArray(props.bookMakersData)
    ? props.bookMakersData
    : Object.values(props.bookMakersData);

  bookmakersList.forEach((bookmaker) => {
    if (String(bookmaker?.type || '').toUpperCase() === WHO_WILL_WIN_TYPE) {
      return;
    }
    const bettingType = String(bookmaker?.betting_type || '').toUpperCase();
    if (bettingType === 'BACK_ONLY_ODDS') {
      result.backOnly.push(bookmaker);
    } else if (bettingType === 'GINNIE_ODDS') {
      result.ginnie.push(bookmaker);
    } else {
      result.backLay.push(bookmaker);
    }
  });

  result.backLay = sortBackLayBookmakers(result.backLay);

  return result;
});

// Centralized Rules dialog control
const rulesOpen = ref(false);
const showRules = () => { rulesOpen.value = true; };
provide('openRules', showRules);
</script>

<template>

  <!-- Back/Lay Bookmakers (Default) -->
  <template v-if="getBookmakersByBettingType.backLay.length > 0">
    <BookmakerBackLay 
      v-for="(bookmaker, idx) in getBookmakersByBettingType.backLay"
      :key="`backlayer-${idx}`"
      :bookMakersData="{ [idx]: bookmaker }" 
      :selectedBet="selectedBet" 
      :betHistory="betHistory"
      :betOutcomes="betOutcomes"
      :eventTypeId="eventTypeId" 
      :eventName="eventName" 
      :betAllow="betAllow"
      :eventId="eventId"
      :providerId="providerId"
      :inPlay="inPlay"
      :isFavorite="isFavorite"
      :onToggleFavorite="onToggleFavorite"
      :onRunnerCppUpdate="onRunnerCppUpdate"
      :cashoutActive="cashoutActive"
      :speedCashoutActive="speedCashoutActive"
    />
  </template>

  <!-- Back Only Bookmakers -->
  <template v-if="getBookmakersByBettingType.backOnly.length > 0">
    <BookmakerBackOnly 
      v-for="(bookmaker, idx) in getBookmakersByBettingType.backOnly"
      :key="`backonly-${idx}`"
      :bookMakersData="{ [idx]: bookmaker }" 
      :selectedBet="selectedBet" 
      :betHistory="betHistory"
      :betOutcomes="betOutcomes"
      :eventTypeId="eventTypeId" 
      :eventName="eventName" 
      :betAllow="betAllow"
      :eventId="eventId"
      :providerId="providerId"
      :inPlay="inPlay"
      :isFavorite="isFavorite"
      :onToggleFavorite="onToggleFavorite"
      :onRunnerCppUpdate="onRunnerCppUpdate"
      :cashoutActive="cashoutActive"
      :speedCashoutActive="speedCashoutActive"
    />
  </template>

  <!-- Ginnie Bookmakers -->
  <template v-if="getBookmakersByBettingType.ginnie.length > 0">
    <BookmakerGinnie 
      v-for="(bookmaker, idx) in getBookmakersByBettingType.ginnie"
      :key="`ginnie-${idx}`"
      :bookMakersData="{ [idx]: bookmaker }" 
      :selectedBet="selectedBet" 
      :betHistory="betHistory"
      :betOutcomes="betOutcomes"
      :eventTypeId="eventTypeId" 
      :eventName="eventName" 
      :betAllow="betAllow"
      :eventId="eventId"
      :inPlay="inPlay"
      :isFavorite="isFavorite"
      :onToggleFavorite="onToggleFavorite"
      :onRunnerCppUpdate="onRunnerCppUpdate"
      :cashoutActive="cashoutActive"
      :speedCashoutActive="speedCashoutActive"
    />
  </template>

  <!-- Who Will Win The Match (type WHO_WILL_WIN_THE_MATCH) -->
  <template v-if="whoWillWinMarkets.length > 0">
    <WhoWillWinTheMatch
      :bookMakersData="whoWillWinMarkets"
      :selectedBet="selectedBet"
      :betHistory="betHistory"
      :betOutcomes="betOutcomes"
      :eventTypeId="eventTypeId"
      :eventName="eventName"
      :betAllow="betAllow"
      :eventId="eventId"
      :inPlay="inPlay"
      :isFavorite="isFavorite"
      :onToggleFavorite="onToggleFavorite"
      :onRunnerCppUpdate="onRunnerCppUpdate"
      :cashoutActive="cashoutActive"
      :speedCashoutActive="speedCashoutActive"
    />
  </template>

  <!-- Rules Dialog -->
  <RulesDialog v-model="rulesOpen" sportName="bookmaker" />
</template>

