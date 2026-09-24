<script setup>
import { computed } from 'vue';
import MatchOdds from '@/views/sports/Bet/MatchOdds.vue';
import BookMakers from '@/views/sports/Bet/bookmaker/BookMakers.vue';
import Fancy from '@/views/sports/Bet/Fancy.vue';
import OtherMarkets from '@/views/sports/Bet/OtherMarkets.vue';
import { formatMarketData } from '@/utils/multiMarketUtils';

const props = defineProps({
    eventData: {
        type: Object,
        required: true,
    },
    market: {
        type: Object,
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

const marketComponent = computed(() => {
    const components = {
        'MATCH_ODDS': MatchOdds,
        'BOOKMAKER': BookMakers,
        'FANCY': Fancy,
        'OTHER_MARKETS': OtherMarkets,
    };
    return components[props.marketType] || null;
});

const marketProps = computed(() => {
    return formatMarketData(
        props.eventData,
        props.market,
        props.marketType,
        props.betStore,
        props.isFavorite,
        props.onToggleFavorite
    );
});
</script>

<template>
    <div class="mm-market-item">
        <component v-if="marketComponent" :is="marketComponent" v-bind="marketProps" />
    </div>
</template>
