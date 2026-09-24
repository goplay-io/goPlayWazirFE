<script setup>
import MarketItem from './MarketItem.vue';

const props = defineProps({
  eventData: {
    type: Object,
    required: true,
  },
  markets: {
    type: Array,
    required: true,
  },
  marketType: {
    type: String,
    required: true,
  },
  betStore: {
    type: Object,
    required: true,
  },
  isFavorite: {
    type: Function,
    required: true,
  },
  onToggleFavorite: {
    type: Function,
    required: true,
  },
});
</script>

<template>
  <div v-if="markets.length > 0" class="mm-market-group tw-flex tw-flex-col tw-gap-3">
    <MarketItem
      v-for="(item, idx) in markets"
      :key="`${eventData.eventId}-${item.market.market_id}-${idx}`"
      :eventData="eventData"
      :market="item.market"
      :marketType="item.marketType"
      :betStore="betStore"
      :isFavorite="isFavorite"
      :onToggleFavorite="onToggleFavorite"
    />
  </div>
</template>

