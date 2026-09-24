<script setup>
import { defineProps, computed, inject } from 'vue';
import NonFancyCalculator from '@/composables/PayoutCalculators/NonFancyCalculator';
import { useRunnerCppEmitter } from '@/composables/useRunnerCppEmitter';
import RunnerPayouts from '@/components/sports/RunnerPayouts.vue';
import RulesInfoButton from '@/components/RulesInfoButton.vue';
// import PinIcon from '@/components/PinIcon.vue';
import MarketMinMaxColumnRow from '@/components/MarketMinMaxColumnRow.vue';
import RunnerStatusOverlay from '@/components/RunnerStatusOverlay.vue';
import CashoutButton from '@/components/CashoutButton.vue';
import { isMarketSuspended } from '@/utils/eventData';
import {
  getBetLockOverlayStatus,
  isBetLockInteractionBlockedForMarket,
  isMarketBetAllow,
} from '@/utils/betLockOverlay';
import { sortBackLayBookmakers, isCashoutEligibleBookmaker } from './bookmakerTypes';
import { useBetStore } from '@/stores/bet';
import useFavoriteMarkets from '@/composables/useFavoriteMarkets';
import numeral from 'numeral';
import { formatMarketBetLimit } from '@/utils/marketBetLimitFormat.js';

const betStore = useBetStore();
const { toggleFavorite, isFavorited } = useFavoriteMarkets();

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
        default: () => false
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

// Process bookmaker data - handle new API structure
const bookmakersList = computed(() => {
    if (!props.bookMakersData) return [];

    let list;
    if (typeof props.bookMakersData === 'object' && !Array.isArray(props.bookMakersData)) {
        list = Object.values(props.bookMakersData);
    } else {
        list = Array.isArray(props.bookMakersData) ? props.bookMakersData : [];
    }

    return sortBackLayBookmakers(list);
});

// Extract runner IDs for payout calculation
const marketIds = computed(() => {
    const result = {};

    bookmakersList.value.forEach(bookmaker => {
        if (bookmaker?.market_id && bookmaker?.runners?.length > 0) {
            result[bookmaker.market_id] = bookmaker.runners.map(runner =>
                String(runner.selection_id || runner.id)
            );
        }
    });

    return result;
});

// Use event-specific betOutcomes if provided, otherwise fall back to betStore
const eventBetOutcomes = computed(() => {
    return props.betOutcomes ?? betStore.betOutcomes;
});

const betSummary = computed(() => {
    const { betSummary } = NonFancyCalculator(marketIds.value, props.selectedBet, eventBetOutcomes.value);
    return betSummary;
});

const activeMarketId = computed(() => {
    if (!props.selectedBet?.market_id) return null;
    return String(props.selectedBet.market_id);
});

const activeBookmaker = computed(() => {
    if (!activeMarketId.value) return null;
    return bookmakersList.value.find((bookmaker) => String(bookmaker?.market_id) === activeMarketId.value) || null;
});

useRunnerCppEmitter({
    getSummary: () => betSummary.value?.[activeBookmaker.value?.market_id],
    getRunners: () => activeBookmaker.value?.runners || [],
    getMeta: () => ({
        eventId: props.eventId,
        marketId: activeBookmaker.value?.market_id,
        marketName: activeBookmaker.value?.name || 'Bookmaker'
    }),
    onRunnerCppUpdate: props.onRunnerCppUpdate,
    watchSources: () => [betSummary.value, activeMarketId.value]
});

const isBetLockBlocked = (bookmaker) =>
    isBetLockInteractionBlockedForMarket(bookmaker, { betAllow: props.betAllow, inPlay: props.inPlay });

const getRunnerOverlayStatus = (runner, bookmaker) =>
    getBetLockOverlayStatus({
        betAllow: props.betAllow,
        marketBetAllow: isMarketBetAllow(bookmaker, { inPlay: props.inPlay }),
        inPlay: props.inPlay,
    }) ?? (runner?.status !== 'ACTIVE' ? 'SUSPENDED' : runner?.status);

const selectBet = async (odd, backOrLay, runnerId, runnerName, bookmakerName, marketId, minAmount, maxAmount, betting_type, runnerCount) => {
    const bookmaker = bookmakersList.value.find((bm) => String(bm?.market_id) === String(marketId));
    if (isBetLockBlocked(bookmaker)) return;

    await betStore.handleSelectBet({
        odd,
        backOrLay,
        runnerId,
        runnerName,
        marketId,
        eventId: props.eventId,
        type: 'BM',
        marketTypeName: bookmakerName,
        minAmount,
        maxAmount,
        betting_type: betting_type || 'ODDS',
        bet_delay: bookmaker?.bet_delay
    }, props.eventTypeId, props.eventName, runnerCount || 0);
};

const openRules = inject('openRules');

// Helper function to handle favorite toggle
const handleToggleFavorite = (marketId, eventId) => {
    // Check if onToggleFavorite was actually provided (not just default null)
    if (props.onToggleFavorite && typeof props.onToggleFavorite === 'function') {
        // Use parent's handler if provided (for MultiMarket page)
        props.onToggleFavorite(marketId, eventId);
    } else {
        // Otherwise use the composable (for regular bet page)
        toggleFavorite(marketId, eventId);
    }
};

// Helper function to check if favorited
const isMarketFavorited = (marketId, eventId) => {
    // Check if onToggleFavorite was provided - if so, we're in MultiMarket context and should use props
    if (props.onToggleFavorite && typeof props.onToggleFavorite === 'function') {
        // Use parent's function if provided (MultiMarket page)
        return props.isFavorite ? props.isFavorite(marketId) : false;
    }
    // Otherwise use the composable (regular bet page)
    return isFavorited(marketId, eventId);
};

const isRunnerBetDisabled = (runner, bookmaker) =>
    runner?.status !== 'ACTIVE' || !props.betAllow || isBetLockBlocked(bookmaker) || isMarketSuspended(bookmaker);

const hasActivePrice = (price) => {
    if (price == null || price === '') return false;
    const n = Number(price);
    return !Number.isNaN(n) && n !== 0;
};

const getPriceDisplay = (price) => (hasActivePrice(price) ? price : 0);

const hasActiveSize = (size) => {
    if (size == null || size === '') return false;
    const n = Number(size);
    return !Number.isNaN(n) && n !== 0;
};

const getSizeDisplay = (size) => {
    if (size == null || size === '') return '0.0';
    const n = Number(size);
    if (Number.isNaN(n) || n === 0) return '0.0';
    return numeral(size).format('0a');
};


</script>

<template>
    <!-- Back/Lay Bookmakers with 6 boxes (3 back, 3 lay) -->
    <div v-for="(bookmaker, idx) in bookmakersList" :key="`backlayer-${idx}`">
        <div v-if="bookmaker?.active !== false"
            class="bookmaker-bl-root match-odds-root tw-overflow-hidden tw-border tw-border-[#d9d9d9] tw-bg-[#efefef]">
            <div v-if="bookmaker?.message" class="market-message-banner">
                <marquee class="tw-text-xs tw-text-marquee">
                    {{ bookmaker?.message }}
                </marquee>
            </div>
            <!-- Header Bar — Match Odds–style mobile (gold cross-cut + grey MIN/MAX strip) -->
            <div
                class="bookmaker-bl-header-bar bookmaker-header-bar tw-flex tw-max-w-full tw-flex-row tw-items-stretch tw-overflow-hidden tw-border-b tw-border-[#d9d9d9]">

                <!-- LEFT: gold + cross-cut (same as Match Odds mobile) -->
                <div
                    class="bookmaker-bl-orange-header tw-relative tw-z-0 tw-flex tw-flex-none tw-w-max tw-flex-nowrap tw-items-center tw-gap-x-1 tw-bg-[#F26C20] tw-pl-2 tw-pr-7 tw-py-1 tw-min-w-[220px] md:tw-px-2.5 md:tw-py-1">

                    <div class="tw-flex tw-min-w-0 tw-shrink tw-items-center md:tw-gap-2.5">
                        <!-- PinIcon hidden — market header favourite pin disabled for now
                        <PinIcon :active="isMarketFavorited(bookmaker.market_id, props.eventId)" size="16" class="match-odds-pin tw-shrink-0"
                            @click="handleToggleFavorite(bookmaker.market_id, props.eventId)" />
                        -->
                        <div
                            class="bookmaker-bl-orange-header__labels tw-flex tw-flex-1 tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-x-1 md:tw-gap-x-1.5">
                            <span
                                class="bookmaker-bl-section-title match-odds-section-title tw-relative tw-z-[2] tw-min-w-0 tw-font-bold tw-text-black tw-uppercase tw-text-[10px] tw-leading-none sm:tw-text-[11px] md:tw-leading-tight"
                                :title="(bookmaker?.title || bookmaker?.name || '').trim() || undefined">
                                {{ (bookmaker?.title || bookmaker?.name || 'BOOKMAKER').trim() }}
                            </span>
                        </div>
                    </div>

                    <CashoutButton
                        v-if="bookmaker?.runners?.length === 2 && isCashoutEligibleBookmaker(bookmaker, props.eventTypeId) && (props.cashoutActive || props.speedCashoutActive)"
                        class="market-header-cashout tw-flex-none tw-relative tw-z-[3]"
                        :marketId="bookmaker?.market_id" :runners="bookmaker?.runners"
                        :outcomes="eventBetOutcomes" :betAllow="props.betAllow && isMarketBetAllow(bookmaker, { inPlay: props.inPlay })"
                        :marketStatus="bookmaker?.status" :eventId="props.eventId" :eventTypeId="props.eventTypeId"
                        :eventName="props.eventName" :providerId="props.providerId" :minBet="bookmaker?.min_bet" :maxBet="bookmaker?.max_bet"
                        :bettingType="bookmaker?.betting_type" marketType="BM" :marketTypeName="bookmaker?.name"
                            :cashoutActive="props.cashoutActive" :speedCashoutActive="props.speedCashoutActive"
                        size="x-small" />

                    <RulesInfoButton @click="openRules && openRules()" color="white" size="x-small" class="tw-flex-shrink-0 tw-relative tw-z-[3] tw-ml-auto" />
                    <div class="bookmaker-bl-header-cut" aria-hidden="true"></div>
                    <div class="bookmaker-bl-header-cut-fold" aria-hidden="true"></div>
                </div>

                <!-- RIGHT: MIN / MAX + BACK / LAY (desktop) -->
                <div
                    class="bookmaker-bl-header-grey tw-relative tw-z-[1] tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-between tw-gap-1.5 tw-bg-[#efefef] tw-py-1 tw-pl-1 tw-pr-0 tw-w-auto md:tw-grid md:tw-grid-cols-[minmax(0,1fr)_auto] md:tw-items-center md:tw-justify-start md:tw-gap-x-3 md:tw-gap-y-0 md:tw-pl-2 md:tw-pr-0">

                    <div
                        class="sports-bet-header-limits bookmaker-header-limits tw-ml-auto tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-x-1 tw-gap-y-0 tw-text-right tw-font-semibold tw-leading-none md:tw-ml-0 md:tw-min-w-0 md:tw-w-full md:tw-shrink md:tw-flex-nowrap md:tw-justify-center md:tw-overflow-visible md:tw-whitespace-nowrap md:tw-text-center md:tw-font-semibold md:tw-text-[#525252]">
                        <span class="match-odds-header-limit-text tw-whitespace-nowrap">Min:{{
                            formatMarketBetLimit(bookmaker?.min_bet) }}</span>
                        <span class="match-odds-header-limit-text tw-whitespace-nowrap">Max:{{
                            formatMarketBetLimit(bookmaker?.max_bet) }}</span>
                    </div>

                    <!-- BACK / LAY — one each (same as fancy) -->
                    <div class="bookmaker-bl-header-backlay-inline tw-flex tw-min-w-0 tw-shrink-0 md:tw-justify-self-end">
                        <div class="odds-header-groups odds-header-groups--dual tw-text-center">
                            <span class="match-odds-header-col-label sports-bet-back-label">Back</span>
                            <span class="match-odds-header-col-label sports-bet-lay-label">Lay</span>
                        </div>
                    </div>

                </div>

            </div>
            <!-- Runners -->
            <v-card-text class="bookmaker-bl-runners match-odds-runners tw-p-0"
                :class="{ 'bet-allow-disabled': isBetLockBlocked(bookmaker) || isMarketSuspended(bookmaker) }">
                <div v-if="bookmaker?.runners?.length">
                    <div v-for="(runner, index) in bookmaker.runners"
                        :key="`${bookmaker.market_id}-${runner.id || index}`"
                        class="match-odds-runner-row bookmaker-bl-runner-row row-separator tw-px-1 tw-py-1 tw-bg-white last:tw-border-b-0 md:tw-py-0"
                        :data-market-id="bookmaker.market_id" :data-runner-id="runner.selection_id || runner.id">
                        <div class="tw-flex tw-justify-between tw-items-center tw-gap-2 md:tw-gap-2 tw-min-w-0">
                            <div class="tw-flex-1 tw-min-w-0 tw-pr-2 tw-overflow-hidden">
                                <h3 class="match-odds-runner-name bookmaker-runner-name tw-mb-0 tw-break-words tw-text-black md:tw-leading-snug"
                                    :title="runner?.name || undefined">
                                    {{ runner?.name || `Runner ${index + 1}` }}
                                </h3>
                                <RunnerPayouts
                                    v-if="betSummary?.[bookmaker.market_id]?.[runner.selection_id || runner.id]?.potential_payout || betSummary?.[bookmaker.market_id]?.[runner.selection_id || runner.id]?.current_potential_payout != null"
                                    :potential-payout="betSummary?.[bookmaker.market_id]?.[runner.selection_id || runner.id]?.potential_payout"
                                    :current-potential-payout="betSummary?.[bookmaker.market_id]?.[runner.selection_id || runner.id]?.current_potential_payout"
                                />
                            </div>

                            <!-- One Back + one Lay (fancy-style) -->
                            <div
                                class="match-odds-odds-ladder bookmaker-bl-odds-ladder tw-relative tw-flex tw-items-center tw-gap-2 md:tw-gap-2 tw-shrink-0">
                                <div
                                    class="match-odds-odds-strip bookmaker-bl-odds-strip tw-relative tw-flex tw-items-center tw-gap-2 md:tw-gap-2">
                                    <div class="tw-flex tw-gap-2 md:tw-gap-2 back-group">
                                        <v-btn size="default" rounded="0"
                                            class="match-odds-price-cell odds-back-bg-1 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-back hover:tw-bg-odds-back-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                                            variant="elevated" :disabled="isRunnerBetDisabled(runner, bookmaker) || !hasActivePrice(runner?.back?.[0]?.price)"
                                            @click="selectBet(runner?.back?.[0]?.price, 'back', runner?.selection_id || runner?.id, runner?.name, bookmaker?.name, bookmaker.market_id, bookmaker.min_bet, bookmaker.max_bet, bookmaker?.betting_type, bookmaker.runners.length)">
                                            <div class="tw-text-center tw-w-full">
                                                <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{
                                                    getPriceDisplay(runner?.back?.[0]?.price) }}</div>
                                                <div
                                                    class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                                                    {{ hasActivePrice(runner?.back?.[0]?.price) ? getSizeDisplay(bookmaker?.max_bet) : '0.0' }}
                                                </div>
                                            </div>
                                        </v-btn>
                                    </div>

                                    <div class="tw-flex tw-gap-2 md:tw-gap-2 lay-group">
                                        <v-btn size="default" rounded="0"
                                            class="match-odds-price-cell odds-lay-bg-1 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-lay hover:tw-bg-odds-lay-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                                            variant="elevated" :disabled="isRunnerBetDisabled(runner, bookmaker) || !hasActivePrice(runner?.priceLay ?? runner?.lay?.[0]?.price)"
                                            @click="selectBet(runner?.priceLay ?? runner?.lay?.[0]?.price, 'lay', runner?.selection_id || runner?.id, runner?.name, bookmaker?.name, bookmaker.market_id, bookmaker.min_bet, bookmaker.max_bet, bookmaker?.betting_type, bookmaker.runners.length)">
                                            <div class="tw-text-center tw-w-full">
                                                <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{
                                                    getPriceDisplay(runner?.priceLay ?? runner?.lay?.[0]?.price) }}
                                                </div>
                                                <div
                                                    class="mo-size tw-text-[8px] tw-text-black tw-leading-tight tw-flex tw-justify-center tw-items-center">
                                                    {{ hasActivePrice(runner?.priceLay ?? runner?.lay?.[0]?.price)
                                                        ? (hasActiveSize(runner?.lay?.[0]?.size)
                                                            ? getSizeDisplay(runner.lay[0].size)
                                                            : getSizeDisplay(bookmaker?.max_bet))
                                                        : '0.0' }}
                                                </div>
                                            </div>
                                        </v-btn>
                                    </div>

                                    <RunnerStatusOverlay
                                        class="bookmaker-bl-status-overlay"
                                        :runner-status="getRunnerOverlayStatus(runner, bookmaker)"
                                        :market-status="bookmaker?.status" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </v-card-text>
        </div>
    </div>
</template>

<style scoped>
.v-btn:disabled {
    opacity: 1 !important;
}

/* Disabled ladder cells: hide Vuetify lock adornment so "-" stays visible */
.bookmaker-bl-root :deep(.match-odds-price-cell.v-btn--disabled .v-icon),
.bookmaker-bl-root :deep(.match-odds-price-cell[disabled] .v-icon) {
    display: none !important;
}

.bet-allow-disabled {
    --v-disabled-opacity: 1;
}

.bet-allow-disabled .odds-back-bg-1.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-back-bg-1.v-btn[disabled] {
    background-color: var(--color-back-bg-1) !important;
}

.bet-allow-disabled .odds-back-bg-2.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-back-bg-2.v-btn[disabled] {
    background-color: var(--color-back-bg-1) !important;
}

.bet-allow-disabled .odds-back-bg-3.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-back-bg-3.v-btn[disabled] {
    background-color: var(--color-back-bg-1) !important;
}

.bet-allow-disabled .odds-lay-bg-1.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-lay-bg-1.v-btn[disabled] {
    background-color: var(--color-lay-bg-1) !important;
}

.bet-allow-disabled .odds-lay-bg-2.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-lay-bg-2.v-btn[disabled] {
    background-color: var(--color-lay-bg-1) !important;
}

.bet-allow-disabled .odds-lay-bg-3.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-lay-bg-3.v-btn[disabled] {
    background-color: var(--color-lay-bg-1) !important;
}

.bet-allow-disabled .v-btn.v-btn--disabled,
.bet-allow-disabled .v-btn[disabled] {
    position: relative;
    opacity: 1 !important;
    color: #000 !important;
}

.bet-allow-disabled .v-btn.v-btn--disabled .v-btn__content,
.bet-allow-disabled .v-btn.v-btn--disabled *,
.bet-allow-disabled .v-btn[disabled] .v-btn__content,
.bet-allow-disabled .v-btn[disabled] * {
    color: inherit !important;
}

.bet-allow-disabled .v-btn.v-btn--disabled::after,
.bet-allow-disabled .v-btn[disabled]::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    pointer-events: none;
    border-radius: inherit;
}

.tw-z-10 {
    z-index: 10 !important;
}

.row-separator {
    border-bottom: 1px solid #d8d8d8 !important;
}

/* Long team names: wrap instead of sliding under 82px BACK/LAY cells */
.bookmaker-runner-name-cell {
    max-width: 100%;
}

.bookmaker-bl-root .bookmaker-runner-name {
    overflow-wrap: anywhere;
    word-break: break-word;
}

.odds-box-size {
    width: 69px !important;
    height: 40px !important;
    min-height: 40px !important;
}

.bookmaker-header-bar {
    max-width: 100%;
}

/* Mobile: gold strip + diagonal cut must stay under the meta row and runners (avoids star/header painting over team names) */
@media (max-width: 767.98px) {
    .odds-header-groups-mobile {
        grid-template-columns: var(--sports-bet-odds-btn-width) var(--sports-bet-odds-btn-width);
        column-gap: 0;
        width: var(--sports-bet-odds-pair-width);
        justify-items: center;
        padding-left: 1px;
    }

    .odds-header-groups-mobile > span {
        width: 100%;
        min-width: 69px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    .odds-header-groups-mobile > span:first-child {
        transform: translateX(7px);
    }

    .bookmaker-bl-root {
        isolation: isolate;
    }

    .bookmaker-bl-root .bookmaker-bl-header-bar {
        position: relative;
        z-index: 1;
    }

    .bookmaker-bl-root .bookmaker-bl-mobile-meta-row {
        position: relative;
        z-index: 2;
    }

    .bookmaker-bl-root .bookmaker-bl-runners {
        position: relative;
        z-index: 2;
        padding-top: 0;
    }

    /* Mobile odds: same square grid as MatchOdds.vue */
    .bookmaker-bl-odds-ladder {
        width: var(--sports-bet-odds-pair-width);
        min-width: var(--sports-bet-odds-pair-width);
        justify-content: flex-end;
        gap: var(--sports-bet-odds-btn-gap) !important;
    }

    .bookmaker-bl-odds-strip {
        width: var(--sports-bet-odds-pair-width);
        min-width: var(--sports-bet-odds-pair-width);
        justify-content: flex-end;
        gap: var(--sports-bet-odds-btn-gap) !important;
    }

    .bookmaker-bl-odds-strip > .back-group,
    .bookmaker-bl-odds-strip > .lay-group {
        width: 69px;
        min-width: 69px;
        gap: var(--sports-bet-odds-btn-gap) !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell.v-btn),
    .bookmaker-bl-root :deep(.match-odds-price-cell) {
        width: 69px !important;
        min-width: 69px !important;
        height: var(--sports-bet-odds-btn-height) !important;
        min-height: var(--sports-bet-odds-btn-height) !important;
        max-height: var(--sports-bet-odds-btn-height) !important;
        padding: 0 !important;
        border-radius: var(--sports-bet-odds-btn-radius) !important;
        box-shadow: none !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell .v-btn__overlay),
    .bookmaker-bl-root :deep(.match-odds-price-cell .v-btn__underlay) {
        border-radius: var(--sports-bet-odds-btn-radius) !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell .v-btn__content) {
        padding: 1px 2px !important;
        min-height: 0 !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell .v-icon) {
        font-size: 12px !important;
    }

    .bookmaker-bl-root .bookmaker-bl-odds-strip :deep(.status-overlay--loser .status-overlay__text) {
        font-size: 12px !important;
        font-weight: 400 !important;
        letter-spacing: normal !important;
        color: #fff !important;
    }
}

/* Orange → MIN/MAX cross-cut (Match Odds mobile reference) */
.bookmaker-bl-orange-header .bookmaker-bl-header-cut,
.bookmaker-bl-orange-header .bookmaker-bl-header-cut-fold {
    pointer-events: none;
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    width: 1.75rem;
}

.bookmaker-bl-orange-header .bookmaker-bl-header-cut {
    z-index: 2;
    clip-path: polygon(100% 0, 0 0, 100% 100%);
    background-color: #efefef !important;
}

/* Fold gradient caused a light/white notch at the wedge — grey cut only */
.bookmaker-bl-orange-header .bookmaker-bl-header-cut-fold {
    display: none !important;
}

/* Mobile: align BACK/LAY with one back + one lay column; desktop: three + three */
.odds-header-groups {
  display: grid;
  grid-template-columns: var(--sports-bet-odds-btn-width) var(--sports-bet-odds-btn-width);
  column-gap: var(--sports-bet-odds-btn-gap);
  width: var(--sports-bet-odds-pair-width);
    align-items: center;
}

.odds-header-groups-mobile {
    display: none;
}

@media (max-width: 767.98px) {
.odds-header-groups-mobile {
    display: grid;
    grid-template-columns: 69px 69px;
    column-gap: var(--sports-bet-odds-btn-gap);
    width: var(--sports-bet-odds-pair-width);
    align-items: center;
}
}

/* Very narrow phones: gold strip no longer uses min-width 220px (fixed above); shrink odds to match BACK/LAY grid */
@media (max-width: 380px) {
    .bookmaker-bl-root :deep(.odds-box-size) {
        width: 76px !important;
        min-width: 76px !important;
    }

    .odds-header-groups-mobile {
        grid-template-columns: 76px 76px;
        width: var(--sports-bet-odds-pair-width);
    }
}

@media (min-width: 768px) {
    .bookmaker-bl-orange-header {
        background: var(--theme-orange) !important;
        min-height: 34px;
        padding: 8px 1.75rem 8px 10px !important;
        align-items: center;
    }

    .bookmaker-bl-orange-header .bookmaker-bl-section-title,
    .bookmaker-bl-orange-header .match-odds-section-title {
        font-family: inherit !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        line-height: 1.2 !important;
        letter-spacing: 0 !important;
        color: #ffffff !important;
        text-transform: uppercase;
        overflow: visible;
        text-overflow: clip;
        flex-shrink: 1;
        min-width: 0;
    }

    .bookmaker-bl-orange-header__labels {
        flex: 1 1 auto;
        min-width: 0;
        overflow: visible;
    }

    .bookmaker-bl-orange-header__labels :deep(.tw-flex) {
        flex-shrink: 0;
    }



    .bookmaker-bl-orange-header .match-odds-header-pill {
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        padding: 2px 7px;
        font-size: 8px;
        font-weight: 800;
        line-height: 1.1;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        background-color: #c4c4c4;
        color: #4a4a4a;
    }

    .bookmaker-bl-header-grey {
        min-height: 34px;
        padding-top: 7px !important;
        padding-bottom: 7px !important;
        align-items: center;
        isolation: isolate;
    }

    .bookmaker-bl-header-grey .bookmaker-header-limits {
        min-width: 0;
        text-align: center !important;
        justify-content: center !important;
        align-items: center !important;
        padding-left: 0 !important;
    }

    .bookmaker-bl-orange-header .bookmaker-bl-header-cut,
    .bookmaker-bl-orange-header .bookmaker-bl-header-cut-fold {
        right: 0;
        width: 1.25rem;
    }

    /* BACK / LAY — same as MatchOdds.vue */
    .bookmaker-bl-header-grey .odds-header-groups .sports-bet-back-label,
    .bookmaker-bl-header-grey .odds-header-groups .sports-bet-lay-label,
    .bookmaker-bl-header-backlay-col .odds-header-groups .sports-bet-back-label,
    .bookmaker-bl-header-backlay-col .odds-header-groups .sports-bet-lay-label {
        font-family: inherit;
        font-size: 12px !important;
        font-weight: 700 !important;
        line-height: 1.2 !important;
        letter-spacing: 0 !important;
        text-transform: none;
    }

    .bookmaker-bl-header-grey .odds-header-groups .sports-bet-back-label {
        color: #111827 !important;
    }

    .bookmaker-bl-header-grey .odds-header-groups .sports-bet-lay-label {
        color: #111827 !important;
    }

    .odds-header-groups {
        justify-items: center;
        text-align: center;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell.v-btn) {
        width: 69px !important;
        min-width: 69px !important;
        height: var(--sports-bet-odds-btn-height-md) !important;
        min-height: var(--sports-bet-odds-btn-height-md) !important;
        max-height: var(--sports-bet-odds-btn-height-md) !important;
        padding: 0 !important;
        border-radius: var(--sports-bet-odds-btn-radius) !important;
        border: 1px solid rgba(0, 0, 0, 0.06) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12) !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell .v-btn__overlay),
    .bookmaker-bl-root :deep(.match-odds-price-cell .v-btn__underlay) {
        border-radius: var(--sports-bet-odds-btn-radius) !important;
    }

    .bookmaker-bl-root :deep(.odds-back-bg-1),
    .bookmaker-bl-root :deep(.odds-back-bg-2),
    .bookmaker-bl-root :deep(.odds-back-bg-3) {
        background: var(--color-back-bg-1) !important;
    }

    .bookmaker-bl-root :deep(.odds-back-bg-1:hover),
    .bookmaker-bl-root :deep(.odds-back-bg-2:hover),
    .bookmaker-bl-root :deep(.odds-back-bg-3:hover) {
        background: var(--color-back-hover) !important;
    }

    .bookmaker-bl-root :deep(.odds-lay-bg-1),
    .bookmaker-bl-root :deep(.odds-lay-bg-2),
    .bookmaker-bl-root :deep(.odds-lay-bg-3) {
        background: var(--color-lay-bg-1) !important;
    }

    .bookmaker-bl-root :deep(.odds-lay-bg-1:hover),
    .bookmaker-bl-root :deep(.odds-lay-bg-2:hover),
    .bookmaker-bl-root :deep(.odds-lay-bg-3:hover) {
        background: var(--color-lay-hover) !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell .v-btn__content) {
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 0 !important;
        padding: 1px 2px !important;
        min-height: 0 !important;
        line-height: 1.05 !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell .mo-price) {
        line-height: 1.05 !important;
        margin: 0 !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell .mo-size) {
        line-height: 1 !important;
        margin: 0 !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell .v-icon) {
        display: none !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell.v-btn--disabled .v-icon),
    .bookmaker-bl-root :deep(.match-odds-price-cell[disabled] .v-icon) {
        display: none !important;
    }

    .bookmaker-bl-root.match-odds-root {
        background: #fff !important;
        border-color: #e5e7eb !important;
        font-family: inherit;
    }

    .bookmaker-bl-header-bar {
        min-height: 34px;
        border-bottom-color: #e5e7eb !important;
    }

    .bookmaker-bl-runners {
        background: #fff;
    }

    .bookmaker-bl-runner-row {
        min-height: 43px;
        padding-top: 4px !important;
        padding-bottom: 2px !important;
        padding-left: 10px !important;
        padding-right: 4px !important;
        background: #fff !important;
        border-bottom: 1px solid #e0e0e0 !important;
    }

    .bookmaker-bl-runner-row .match-odds-runner-name {
        font-family: inherit !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        line-height: 1.25 !important;
        letter-spacing: 0 !important;
        color: #000 !important;
        text-transform: none;
    }

    .bookmaker-bl-runner-row:last-child {
        border-bottom: none !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell.tw-pointer-events-none) {
        border-radius: var(--sports-bet-odds-btn-radius) !important;
        border: 1px solid rgba(0, 0, 0, 0.06) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12) !important;
        height: 40px !important;
        min-height: 40px !important;
        max-height: 40px !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell.tw-pointer-events-none.odds-back-bg-1),
    .bookmaker-bl-root :deep(.match-odds-price-cell.tw-pointer-events-none.odds-back-bg-2),
    .bookmaker-bl-root :deep(.match-odds-price-cell.tw-pointer-events-none.odds-back-bg-3) {
        background: var(--color-back-bg-1) !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell.tw-pointer-events-none.odds-lay-bg-1),
    .bookmaker-bl-root :deep(.match-odds-price-cell.tw-pointer-events-none.odds-lay-bg-2),
    .bookmaker-bl-root :deep(.match-odds-price-cell.tw-pointer-events-none.odds-lay-bg-3) {
        background: var(--color-lay-bg-1) !important;
    }

    .bookmaker-bl-odds-ladder {
        gap: var(--sports-bet-odds-btn-gap) !important;
    }

    .bookmaker-bl-header-grey .bookmaker-header-limits,
    .bookmaker-bl-header-grey .bookmaker-header-limits .match-odds-header-limit-text {
        font-family: inherit !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        line-height: 1.2 !important;
        letter-spacing: 0 !important;
        color: #1f2937 !important;
        text-transform: none;
    }

    .bookmaker-bl-root :deep(.match-odds-pin) {
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
    }

    .bookmaker-bl-root :deep(.match-odds-pin .v-icon) {
        color: #fff !important;
        opacity: 1;
    }
}

@media (min-width: 768px) and (max-width: 1024px) {
    .odds-header-groups,
    .odds-header-groups--dual {
        grid-template-columns: 69px 69px;
        width: var(--sports-bet-odds-pair-width);
        column-gap: var(--sports-bet-odds-btn-gap);
    }
}

/* Desktop: one Back + one Lay — same footprint as fancy */
@media (min-width: 1025px) {
    .bookmaker-bl-header-backlay-inline {
        display: flex !important;
    }

    .bookmaker-bl-header-backlay-col {
        display: none !important;
    }

    .bookmaker-bl-odds-ladder.match-odds-odds-ladder,
    .bookmaker-bl-odds-strip {
        width: var(--sports-bet-odds-pair-width) !important;
        min-width: var(--sports-bet-odds-pair-width) !important;
        max-width: var(--sports-bet-odds-pair-width) !important;
        flex-shrink: 0;
        gap: var(--sports-bet-odds-btn-gap) !important;
    }

    .bookmaker-bl-odds-strip .back-group,
    .bookmaker-bl-odds-strip .lay-group {
        width: var(--sports-bet-odds-btn-width) !important;
        min-width: var(--sports-bet-odds-btn-width) !important;
        flex-shrink: 0;
        gap: 0 !important;
    }

    .bookmaker-bl-odds-strip :deep(.status-overlay) {
        width: auto !important;
        left: 0 !important;
        right: 0 !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell.v-btn),
    .bookmaker-bl-root :deep(.match-odds-price-cell.tw-pointer-events-none) {
        width: var(--sports-bet-odds-btn-width) !important;
        min-width: var(--sports-bet-odds-btn-width) !important;
        height: var(--sports-bet-odds-btn-height-md) !important;
        min-height: var(--sports-bet-odds-btn-height-md) !important;
        max-height: var(--sports-bet-odds-btn-height-md) !important;
        border-radius: var(--sports-bet-odds-btn-radius) !important;
        border: 1px solid rgba(0, 0, 0, 0.06) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12) !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell .v-btn__overlay),
    .bookmaker-bl-root :deep(.match-odds-price-cell .v-btn__underlay) {
        border-radius: var(--sports-bet-odds-btn-radius) !important;
    }

    .bookmaker-bl-root :deep(.match-odds-price-cell.v-btn--disabled .v-icon),
    .bookmaker-bl-root :deep(.match-odds-price-cell[disabled] .v-icon) {
        display: none !important;
    }
}
</style>
