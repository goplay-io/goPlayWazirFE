<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import SportsBetSlip from '../sports/Bet/SportsBetSlip.vue';
import FloatingBetSlip from '../sports/Bet/FloatingBetSlip.vue';
import BetHeader from '@/components/BetHeader.vue';
import Loading from '@/components/Loading.vue';
import EventData from '@/utils/eventData';
import {
    HORSE_RACING_EVENT_TYPE_ID,
    GREYHOUND_RACING_EVENT_TYPE_ID,
} from '@/composables/useEventTypes';

import { fetchButtons } from "@/api/user/profile.js";
import { getEventById } from "@/api/event/events.js";
import { useOddsWebSocketForMarkets } from '@/composables/useOddsWebSocket';
import { useBetOpenCountDown } from '@/composables/useBetOpenCountDown';
import useDevices from '@/composables/useDevices';
import { useBetStore } from '@/stores/bet';
import NonFancyCalculator from "@/composables/PayoutCalculators/NonFancyCalculator";
import PayoutValue from '@/components/PayoutValue.vue';
import RunnerStatusOverlay from '@/components/RunnerStatusOverlay.vue';
import numeral from 'numeral';
import { formatMarketBetLimit } from '@/utils/marketBetLimitFormat.js';
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar';
import { useDemoUser } from '@/composables/useDemoUser';
import OneClickBetting from '@/components/OneClickBetting.vue';
import { useOneClickBettingStore } from '@/stores/oneClickBetting';
import { useInlineBetSlipHost } from '@/composables/useInlineBetSlipHost';
import { useRunnerCppEmitter } from '@/composables/useRunnerCppEmitter';
import TVLiveStream from '@/components/TVLiveStream.vue';
import ScoreCardTVMobile from '../sports/Bet/ScoreCardTVMobile.vue';
import BetMobileMatchedBetsSection from '../sports/Bet/BetMobileMatchedBetsSection.vue';
import { useScorecardTvStore } from '@/stores/scorecardTv';

const { t } = useI18n();
const route = useRoute();
const { isMobile, isDesktop } = useDevices();

// State
const event_id = ref(route.params.event_id);
const market_id = ref(route.params.market_id);
const event = ref(null);
const market = ref(null);
const country_code = ref('Unknown');
const event_name = ref('Unknown event');
const competition_name = ref('');
const event_type_id = ref(null);
const event_open_time = ref('Unknown time');
const event_open_time_diff = ref('Unknown time');
const loading = ref(false);
const buttons = ref([]);
const slipOpen = ref(!isMobile.value);
const showInlineSlip = ref(false);
const {
  inlineSlipHostEl,
  inlineSlipTarget,
  removeInlineSlipHost,
  mountInlineSlipHostBelowButton,
  captureOddClick,
  scrollIntoView: scrollInlineSlipIntoView,
} = useInlineBetSlipHost();
const runners = ref([]);
const bet_allow_before_time = ref(null);
const showBetHistory = ref(false);
const mobileToolbarView = ref('markets');
const mobileOpenBetCount = ref(0);

const toggleMobileOpenBets = () => {
    mobileToolbarView.value = mobileToolbarView.value === 'openBets' ? 'markets' : 'openBets';
};
/** Parity with sports Bet.vue — score tab icon only when scorecard HTML exists */
const scorecardContentAvailable = ref(false);

function onScorecardAvailable(available) {
    scorecardContentAvailable.value = !!available;
}
const userBetAllow = ref(false);
const betStatus = ref(null);
const bet_processing = ref(false);
const marketBetAllow = ref(true);
const runnerCppPreview = ref(null);
const tvLiveStreamSrc = computed(() => event.value?.tv_live_stream_url || '');
/** Same rule as sports Bet: only show TV block when API provides a real stream URL. */
const hasTvStreamUrl = computed(() => !!(tvLiveStreamSrc.value && String(tvLiveStreamSrc.value).trim()));

// Composables & stores
const { betAllow, timeBeforeBet, startCountdown } = useBetOpenCountDown(event_open_time, bet_allow_before_time);
const betStore = useBetStore();
const scorecardTvStore = useScorecardTvStore();
const oneClickStore = useOneClickBettingStore();
const { showWarning } = useSnackbar();
const { checkIsDemoUser } = useDemoUser();

const isBettingAllowed = computed(() => betAllow.value && userBetAllow.value && marketBetAllow.value);

const RACING_HEADER_SPORT_LABELS = {
    [GREYHOUND_RACING_EVENT_TYPE_ID]: 'Grey Hound',
    [HORSE_RACING_EVENT_TYPE_ID]: 'Horse Racing',
};

/** Shorter BetHeader line: remove redundant “(AUS)” when flag is shown; “2nd May” → “2 May”. */
function compactRacingTitle(raw, showCountryFlag) {
    if (!raw || typeof raw !== 'string') return raw || '';
    let s = raw.trim();
    if (showCountryFlag) {
        s = s.replace(/\s*\([A-Z]{2,3}\)\s*/i, ' ').replace(/\s+/g, ' ').trim();
    }
    s = s.replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, '$1');
    return s.trim();
}

/** Venue tab label — “TOWNSVILLE 14 AUG” → “TOWNSVILLE”, “Newcastle 13th Aug” → “Newcastle”. */
function extractRacingVenueLabel(raw) {
    if (!raw || typeof raw !== 'string') return raw || '';
    const s = raw.trim();
    const withOrdinal = s.match(/^(.+?)\s+\d{1,2}(?:st|nd|rd|th)?\s+\S/i);
    if (withOrdinal) return withOrdinal[1].trim();
    const plainDate = s.match(/^(.+?)\s+\d{1,2}\s+\S/i);
    if (plainDate) return plainDate[1].trim();
    return s;
}

function racingVenueFromCompetition(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const parts = raw.split(' - ').map((part) => part.trim()).filter(Boolean);
    if (!parts.length) return '';
    return parts[parts.length - 1];
}

const headerSportName = computed(() => {
    const id = Number(event_type_id.value);
    return RACING_HEADER_SPORT_LABELS[id] || '';
});

const headerVenueName = computed(() => {
    const fromCompetition = racingVenueFromCompetition(competition_name.value);
    if (fromCompetition) return fromCompetition;

    return extractRacingVenueLabel(
        compactRacingTitle(
            event_name.value,
            !!(country_code.value && country_code.value !== 'Unknown')
        )
    );
});

const handleButtonsUpdate = (updatedButtons) => {
    buttons.value = updatedButtons || [];
};

const mobileTimeBeforeBet = computed(() => {
    if (!timeBeforeBet.value) return '';
    if (betAllow.value) return 'OPEN';
    return isMobile.value
        ? timeBeforeBet.value.replace('BET STARTS IN: ', '')
        : timeBeforeBet.value;
});

const filteredBetHistory = computed(() => {
    const currentEventId = String(route.params.event_id ?? '').trim();
    const currentMarketId = String(route.params.market_id ?? '').trim();

    if (!currentEventId || !currentMarketId || !betStore.betHistory?.length) return [];

    return betStore.betHistory.filter(h => {
        if (!h) return false;
        const hMarket = String(h.market_id || h.marketId || '').trim();
        const hEvent = String(h.event_id || h.eventId || '').trim();
        return hMarket === currentMarketId && (hEvent ? hEvent === currentEventId : true);
    });
});

/** Match the list: badge count is for this race market only, not all event bets. */
const filteredBetHistoryCount = computed(() => filteredBetHistory.value.length);

const runnerIds = computed(() =>
    runners.value
        .map(r => r.selection_id || r.id || r.values?.[0])
        .filter(Boolean)
);

const betSummary = computed(() => {
    const { betSummary } = NonFancyCalculator(
        runnerIds.value,
        betStore.bet,
        betStore.betOutcomes,
        market_id.value
    );
    return betSummary;
});

// Helpers
const transformOddsToValues = (runner) => {
    const back = runner.back || [];
    const lay = runner.lay || [];
    const id = runner.selection_id || runner.id || runner.runner_id;
    return [
        id,
        runner.status || 'ACTIVE',
        back[0]?.price ?? null, back[0]?.size ?? null,
        back[1]?.price ?? null, back[1]?.size ?? null,
        back[2]?.price ?? null, back[2]?.size ?? null,
        lay[0]?.price ?? null,  lay[0]?.size ?? null,
        lay[1]?.price ?? null,  lay[1]?.size ?? null,
        lay[2]?.price ?? null,  lay[2]?.size ?? null,
    ];
};

const normalizeRunners = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map(r => {
        const id = r.selection_id || r.id || r.values?.[0];
        return { ...r, selection_id: id, id, values: r.values || [] };
    });
};

const isRunnerActive = (runner) => {
    const status = runner?.status || runner?.values?.[1];
    const marketOpen = !betStatus.value || betStatus.value === 'OPEN';
    return status === 'ACTIVE' && isBettingAllowed.value && marketOpen;
};

const updateTimeDiff = () => {
    if (typeof window?.humanReadableDiff === 'function') {
        event_open_time_diff.value = window.humanReadableDiff(event_open_time.value);
        return;
    }
    const target = new Date(event_open_time.value);
    if (isNaN(target.getTime())) return;
    const diffMs = target.getTime() - Date.now();
    const absMin = Math.round(Math.abs(diffMs) / 60000);
    if (absMin < 1) {
        event_open_time_diff.value = diffMs >= 0 ? 'now' : 'just now';
    } else if (absMin < 60) {
        event_open_time_diff.value = diffMs >= 0 ? `in ${absMin}m` : `${absMin}m ago`;
    } else {
        const absH = Math.round(absMin / 60);
        event_open_time_diff.value = diffMs >= 0 ? `in ${absH}h` : `${absH}h ago`;
    }
};

// Core logic
const constructEvent = () => {
    event_name.value = EventData.getEventName(event.value);
    competition_name.value = EventData.getCompetitionName(event.value);
    event_type_id.value = EventData.getEventTypeId(event.value);
    country_code.value = EventData.getCountryCode(event.value);
    bet_allow_before_time.value = EventData.getBetUnlockBeforeTime(event.value);
    market.value = EventData.findRaceMarket(event.value, market_id.value);
    event_open_time.value = EventData.getRaceMarketStartTime(market.value);

    updateTimeDiff();

    runners.value = (market.value?.runners ?? []).map(r => {
        const normalized = normalizeRunners([r])[0];
        if (!normalized.values?.length) normalized.values = transformOddsToValues(normalized);
        return normalized;
    });

    if (market.value) {
        marketBetAllow.value = market.value.bet_allow !== false && market.value.bet_allow !== 0;
        betStatus.value = market.value.active === false || !marketBetAllow.value ? 'SUSPENDED' : 'OPEN';
    } else {
        betStatus.value = 'OPEN';
    }
};

const updateRunnersWithOdds = (currentRunners, oddsData) => {
    if (!Array.isArray(oddsData) || !oddsData.length) return currentRunners;

    const marketOdds = oddsData.find(item =>
        String(item?.marketId) === String(market_id.value) ||
        String(item?.market_id) === String(market_id.value)
    );

    if (!marketOdds?.runners) return currentRunners;

    const oddsRunnersObj = marketOdds.runners;

    if (marketOdds.status) {
        betStatus.value = marketOdds.status;
    }

    return currentRunners.map(runner => {
        const runnerId = String(runner.selection_id || runner.runner_id || runner.id || runner.values?.[0] || '');
        const matchedKey = runnerId && oddsRunnersObj[runnerId]
            ? runnerId
            : Object.keys(oddsRunnersObj).find(k => String(k) === runnerId);
        const updatedRunner = matchedKey ? oddsRunnersObj[matchedKey] : null;

        if (!updatedRunner || !matchedKey) {
            return {
                ...runner,
                status: runner.status || runner.values?.[1] || 'ACTIVE',
                values: runner.values || transformOddsToValues(runner),
            };
        }

        const runnerStatus = updatedRunner.status || runner.status || 'ACTIVE';
        return {
            ...runner,
            selection_id: matchedKey,
            id: matchedKey,
            runner_id: matchedKey,
            status: runnerStatus,
            priceBack: updatedRunner.back?.[0]?.price,
            priceLay: updatedRunner.lay?.[0]?.price,
            sizeBack: updatedRunner.back?.[0]?.size,
            sizeLay: updatedRunner.lay?.[0]?.size,
            back: updatedRunner.back || runner.back,
            lay: updatedRunner.lay || runner.lay,
            values: transformOddsToValues({ ...updatedRunner, selection_id: matchedKey, id: matchedKey, runner_id: matchedKey, status: runnerStatus }),
        };
    });
};

const loadEventData = async () => {
    loading.value = true;
    try {
        betStore.initializeBet(event_id.value);
        const isDemoUser = checkIsDemoUser();

        const promises = [getEventById(event_id.value)];
        if (!isDemoUser) {
            promises.push(betStore.refreshBetHistory(event_id.value), fetchButtons().catch(e => {
                console.warn('Buttons API failed, using static fallback:', e);
                return null;
            }));
        }

        const [eventRes, , buttonsRes] = await Promise.all(promises);

        event.value =
            eventRes?.data?.event ??
            eventRes?.data ??
            eventRes?.event ??
            eventRes;

        if (isDemoUser) {
            buttons.value = [];
            userBetAllow.value = true;
            betAllow.value = true;
        } else {
            buttons.value = buttonsRes?.buttons || [];
            userBetAllow.value = event.value?.bet_allow === true || event.value?.bet_allow === 1;
            betAllow.value = userBetAllow.value;
        }

        constructEvent();
        refreshData();
        startCountdown();
    } catch (err) {
        console.error('Error fetching event data:', err);
    } finally {
        loading.value = false;
    }
};

const refreshData = () => {
    updateTimeDiff();
};

const selectBet = async (odd, backOrLay, runnerId, runnerName, minAmount, maxAmount) => {
    const marketLabel = market.value?.market_name || market.value?.name || '';
    const finalEventName = marketLabel
        ? `${event_name.value} (${marketLabel})`
        : String(event_name.value || '');
    await betStore.handleSelectBet(
        { odd, backOrLay, runnerId, runnerName, marketId: market_id.value, eventId: event_id.value, type: 'R', betting_type: 'ODDS', marketTypeName: 'Racing', minAmount, maxAmount, bet_delay: market.value?.bet_delay },
        event_type_id.value,
        finalEventName,
        runners.value.length || 0,
    );
    if (!(oneClickStore.isActive && !oneClickStore.editMode)) {
        slipOpen.value = true;
    }
};

const toggleSlip = () => {
    betStore.clearBetSelection();
    slipOpen.value = !slipOpen.value;
};

const closeInlineSlip = () => {
    showInlineSlip.value = false;
    removeInlineSlipHost();
    betStore.clearBetSelection();
};

const handleLayClick = () => showWarning('Lay bet is not allowed on this market !');

const handleRunnerCppUpdate = (payload) => {
    const currentMarketId = betStore.bet?.market_id ? String(betStore.bet.market_id) : null;
    const payloadMarketId = payload?.marketId != null ? String(payload.marketId) : null;

    if (!payload) {
        if (!currentMarketId) runnerCppPreview.value = null;
        return;
    }
    if (currentMarketId && payloadMarketId && payloadMarketId !== currentMarketId) return;

    const hasRunners = payload.runners && Object.keys(payload.runners).length > 0;
    if (!hasRunners) {
        if (!currentMarketId || !payloadMarketId || payloadMarketId === currentMarketId) {
            runnerCppPreview.value = null;
        }
        return;
    }
    runnerCppPreview.value = payload;
};

// Watchers
watch(() => betStore.bet?.odd, (newOdd) => {
    if (!newOdd) {
        if (betStore.bet_status !== 'success' && isMobile.value) {
            showInlineSlip.value = false;
        }
        if (isMobile.value) {
            removeInlineSlipHost();
        }
        return;
    }
    if (oneClickStore.isActive && !oneClickStore.editMode) return;
    if (isMobile.value) {
        showInlineSlip.value = false;
        nextTick(() => {
            const mounted = mountInlineSlipHostBelowButton();
            if (mounted) {
                showInlineSlip.value = true;
            }
        });
    } else {
        slipOpen.value = true;
    }
});

watch(() => betStore.bet?.market_id, () => { runnerCppPreview.value = null; });
watch(() => betStore.bet?.odd, (v) => { if (!v) runnerCppPreview.value = null; });

watch(
    () => event.value?.event_id,
    () => {
        scorecardContentAvailable.value = false;
        scorecardTvStore.reset();
    }
);

watch(
    () => event.value?.score_active,
    (v) => {
        if (!v) scorecardContentAvailable.value = false;
    }
);

watch(() => betStore.bet_status, async (newStatus) => {
    if (newStatus === 'success' && !checkIsDemoUser()) {
        try {
            await betStore.refreshBetHistory(event_id.value);
        } catch (err) {
            console.error('Error refreshing racing bet history after placement:', err);
        }
    }
});

watch(isMobile, (val) => {
    if (val && slipOpen.value && !betStore.bet?.odd) slipOpen.value = false;
});

watch(() => [route.params.event_id, route.params.market_id], async ([newEventId, newMarketId]) => {
    if (newEventId && newEventId !== event_id.value) {
        scorecardTvStore.reset();
        event_id.value = newEventId;
        await loadEventData();
    } else if (newMarketId && newMarketId !== market_id.value) {
        market_id.value = newMarketId;
        await loadEventData();
    }
});

useRunnerCppEmitter({
    getSummary: () => betSummary.value,
    getRunners: () => runners.value,
    getMeta: () => ({ eventId: event_id.value, marketId: market_id.value, marketName: market.value?.name || 'Racing' }),
    onRunnerCppUpdate: handleRunnerCppUpdate,
    watchSources: () => [betSummary.value, runners.value, betStore.bet?.market_id],
});

// Real-time odds via WebSocket (falls back to polling when WS unavailable)
useOddsWebSocketForMarkets(
    () => market_id.value ? [market_id.value] : [],
    {
        onData: (oddsData) => {
            if (!Array.isArray(oddsData) || !oddsData.length) return;
            const updated = updateRunnersWithOdds(runners.value, oddsData);
            if (updated !== runners.value) runners.value = updated;
        },
    }
);

// Lifecycle
onMounted(async () => {
    if (isMobile.value) slipOpen.value = false;
    await loadEventData();
});

onUnmounted(() => {
    removeInlineSlipHost();
});
</script>

<template>
    <div class="bet-page-container">

        <Loading v-if="loading" minHeight="100vh" />

        <div v-else class="bet-main-layout">
            <div class="bet-markets-section">
                <div class="bet-markets-scrollable" @click.capture="captureOddClick">
                    <div class="bet-header-fixed">
                        <v-card class="tw-rounded-none tw-overflow-hidden" elevation="0">
                            <BetHeader
                                :event_name="headerVenueName"
                                :event-name-full="event_name"
                                :competition_name="competition_name"
                                :sport-name="headerSportName"
                                :sport-id="event_type_id"
                                :country_code="country_code"
                                :event_open_time="event_open_time"
                                :inPlay="false"
                                :event_open_time_diff="event_open_time_diff"
                                :slipOpen="slipOpen"
                                :racing-market-header="true"
                                :tv-channel-active="!!event?.tv_channel_active"
                                :has-tv-stream="hasTvStreamUrl"
                                :score-channel-active="!!event?.score_active"
                                :score-active="isMobile && !!event?.score_active && scorecardContentAvailable"
                                :show-open-bets="isMobile"
                                :open-bets-active="mobileToolbarView === 'openBets'"
                                :betHistoryCount="isMobile ? mobileOpenBetCount : filteredBetHistoryCount"
                                @toggle-slip="toggleSlip"
                                @toggle-open-bets="toggleMobileOpenBets"
                            />
                        </v-card>
                    </div>
                    <BetMobileMatchedBetsSection
                        v-if="isMobile"
                        v-show="mobileToolbarView === 'openBets'"
                        :active="mobileToolbarView === 'openBets'"
                        @update:open-bet-count="mobileOpenBetCount = $event"
                    />
                    <template v-if="!isMobile || mobileToolbarView === 'markets'">
                    <ScoreCardTVMobile
                        v-if="(event?.score_active || (event?.tv_channel_active && hasTvStreamUrl)) && event?.event_id != null"
                        :event-id="event.event_id"
                        :score-active="!!event?.score_active"
                        :score-type="event.score_type"
                        :scorecard-url="event.scorecard_url || ''"
                        :tv-src="tvLiveStreamSrc"
                        :tv-active="!!event?.tv_channel_active && hasTvStreamUrl"
                        @scorecard-available="onScorecardAvailable"
                    />
                    <div
                        v-if="market"
                        class="tw-bg-[#efefef] tw-border tw-border-[#d9d9d9] tw-overflow-hidden match-odds-root"
                    >
                        <div class="match-odds-header-bar mo-bl-header-bar tw-flex tw-flex-row tw-items-stretch tw-overflow-hidden tw-border-b tw-border-[#d9d9d9]">
                            <div class="match-odds-orange-header tw-relative tw-z-0 tw-flex tw-flex-none tw-w-max tw-flex-nowrap tw-items-center tw-gap-x-1 tw-bg-[#F26C20] tw-pl-2 tw-pr-7 tw-py-1 tw-min-w-[220px] md:tw-px-2.5 md:tw-py-1">
                                <div class="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2 md:tw-gap-2.5">
                                    <span
                                        class="match-odds-section-title tw-relative tw-z-[2] tw-min-w-0 tw-truncate tw-font-bold tw-text-black tw-uppercase tw-text-[10px] tw-leading-none sm:tw-text-[11px] md:tw-leading-tight"
                                        :title="market?.name ?? t('sports.racing.unknownRace')"
                                    >
                                        {{ market?.name ?? t('sports.racing.unknownRace') }}
                                    </span>
                                    <v-chip
                                        v-if="timeBeforeBet"
                                        size="x-small"
                                        variant="flat"
                                        class="tw-flex-shrink-0 !tw-rounded-full !tw-bg-amber-600 !tw-text-white !tw-h-5 tw-uppercase tw-tracking-wide tw-text-[9px] md:tw-text-[10px] tw-font-semibold"
                                    >
                                        {{ isMobile ? mobileTimeBeforeBet : timeBeforeBet }}
                                    </v-chip>
                                </div>
                                <div class="match-odds-header-cut" aria-hidden="true"></div>
                                <div class="match-odds-header-cut-fold" aria-hidden="true"></div>
                            </div>

                            <div
                                class="match-odds-header-grey tw-relative tw-z-[1] tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-between tw-gap-1.5 tw-bg-[#efefef] tw-py-1 tw-pl-1 tw-pr-0 tw-w-auto md:tw-grid md:tw-grid-cols-[minmax(0,1fr)_auto] md:tw-items-center md:tw-justify-start md:tw-gap-x-3 md:tw-gap-y-0 md:tw-pl-2 md:tw-pr-0"
                            >
                                <div
                                    class="sports-bet-header-limits match-odds-header-limits tw-ml-auto tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-x-1 tw-gap-y-0 tw-text-right tw-font-semibold tw-leading-none md:tw-ml-0 md:tw-min-w-0 md:tw-w-full md:tw-shrink md:tw-flex-nowrap md:tw-justify-center md:tw-overflow-visible md:tw-whitespace-nowrap md:tw-text-center md:tw-font-semibold md:tw-text-[#525252]"
                                    :class="{ 'tw-opacity-70': !isBettingAllowed }"
                                >
                                    <span class="match-odds-header-limit-text tw-whitespace-nowrap">Min:{{ formatMarketBetLimit(market?.min_bet) }}</span>
                                    <span class="match-odds-header-limit-text tw-whitespace-nowrap">Max:{{ formatMarketBetLimit(market?.max_bet) }}</span>
                                </div>

                                <div class="match-odds-header-backlay-inline tw-flex tw-min-w-0 tw-shrink-0 md:tw-justify-self-end">
                                    <div class="odds-header-groups odds-header-groups--dual tw-text-center">
                                        <span class="match-odds-header-col-label sports-bet-back-label">Back</span>
                                        <span class="match-odds-header-col-label sports-bet-lay-label">Lay</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <v-card-text class="match-odds-runners tw-p-0" :class="{ 'bet-allow-disabled': !isBettingAllowed }">
                                <div v-if="runners?.length">
                                    <div
                                        v-for="runner in runners"
                                        :key="runner.selection_id || runner.id || runner.values?.[0]"
                                        class="match-odds-runner-row tw-px-1 tw-py-1 tw-bg-white row-separator last:tw-border-b-0 md:tw-py-0"
                                        :data-market-id="market_id"
                                        :data-runner-id="runner.selection_id || runner.id || runner.values?.[0]"
                                    >
                                        <div class="tw-flex tw-justify-between tw-items-center tw-gap-2 md:tw-gap-2 tw-min-w-0">

                                            <!-- Runner Name & Payout -->
                                            <div class="tw-flex-1 tw-min-w-0 tw-pr-1">
                                                <h3 class="match-odds-runner-name tw-mb-0 tw-break-words tw-text-xs tw-font-bold tw-text-black sm:tw-text-sm md:tw-leading-snug">
                                                    {{ runner.name }}
                                                </h3>
                                                <div
                                                    v-if="betSummary?.[runner.selection_id || runner.id || runner.values?.[0]]?.potential_payout || betSummary?.[runner.selection_id || runner.id || runner.values?.[0]]?.per_unit"
                                                    class="tw-flex tw-flex-wrap tw-gap-2 tw-text-xs"
                                                >
                                                    <PayoutValue :value="betSummary?.[runner.selection_id || runner.id || runner.values?.[0]]?.potential_payout" />
                                                    <PayoutValue :value="betSummary?.[runner.selection_id || runner.id || runner.values?.[0]]?.per_unit" :paranthesis="true" :abs="true" />
                                                </div>
                                            </div>

                                            <div class="match-odds-odds-ladder tw-relative tw-flex tw-items-center tw-gap-2 md:tw-gap-2 tw-shrink-0">
                                                <PayoutValue
                                                    v-if="betSummary?.[runner.selection_id || runner.id || runner.values?.[0]]?.current_potential_payout !== null"
                                                    :value="betSummary?.[runner.selection_id || runner.id || runner.values?.[0]]?.current_potential_payout"
                                                    class="tw-text-xs tw-mr-2"
                                                />

                                                <div class="tw-flex tw-gap-2 md:tw-gap-2">
                                                        <!-- Back 3 (desktop only) -->
                                                        <v-btn v-if="isDesktop" size="default" rounded="0" variant="elevated"
                                                            class="match-odds-price-cell odds-back-bg-3 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-flex-shrink-0 tw-bg-odds-back hover:tw-bg-odds-back-hover tw-text-black tw-font-bold"
                                                            :disabled="!isRunnerActive(runner)"
                                                            @click="selectBet(runner.values[6], 'back', runner.values[0], runner?.name, market?.min_bet, market?.max_bet)">
                                                            <div class="tw-text-center tw-w-full">
                                                                <template v-if="runner?.values?.[6] != null">
                                                                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ runner.values[6] }}</div>
                                                                    <div class="mo-size tw-text-[8px] tw-text-gray-600 tw-leading-tight tw-flex tw-justify-center tw-items-center">
                                                                        <template v-if="runner?.values?.[7]">{{ runner.values[7] }}</template>
                                                                        <span v-else>-</span>
                                                                    </div>
                                                                </template>
                                                                <div v-else class="tw-text-center tw-w-full tw-flex tw-items-center tw-justify-center tw-min-h-[32px]">
                                                                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">-</div>
                                                                </div>
                                                            </div>
                                                        </v-btn>

                                                        <!-- Back 2 (desktop only) -->
                                                        <v-btn v-if="isDesktop" size="default" rounded="0" variant="elevated"
                                                            class="match-odds-price-cell odds-back-bg-2 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-flex-shrink-0 tw-bg-odds-back hover:tw-bg-odds-back-hover tw-text-black tw-font-bold"
                                                            :disabled="!isRunnerActive(runner)"
                                                            @click="selectBet(runner.values[4], 'back', runner.values[0], runner?.name, market?.min_bet, market?.max_bet)">
                                                            <div class="tw-text-center tw-w-full">
                                                                <template v-if="runner?.values?.[4] != null">
                                                                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ runner.values[4] }}</div>
                                                                    <div class="mo-size tw-text-[8px] tw-text-gray-600 tw-leading-tight tw-flex tw-justify-center tw-items-center">
                                                                        <template v-if="runner?.values?.[5]">{{ runner.values[5] }}</template>
                                                                        <span v-else>-</span>
                                                                    </div>
                                                                </template>
                                                                <div v-else class="tw-text-center tw-w-full tw-flex tw-items-center tw-justify-center tw-min-h-[32px]">
                                                                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">-</div>
                                                                </div>
                                                            </div>
                                                        </v-btn>

                                                        <!-- Back 1 (always) -->
                                                        <v-btn size="default" rounded="0" variant="elevated"
                                                            class="match-odds-price-cell odds-back-bg-1 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-back hover:tw-bg-odds-back-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                                                            :disabled="!isRunnerActive(runner)"
                                                            @click="selectBet(runner.values[2], 'back', runner.values[0], runner?.name, market?.min_bet, market?.max_bet)">
                                                            <div class="tw-text-center tw-w-full">
                                                                <template v-if="runner?.values?.[2] != null">
                                                                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ runner.values[2] }}</div>
                                                                    <div class="mo-size tw-text-[8px] tw-text-gray-600 tw-leading-tight tw-flex tw-justify-center tw-items-center">
                                                                        <template v-if="runner?.values?.[3]">{{ runner.values[3] }}</template>
                                                                        <span v-else>-</span>
                                                                    </div>
                                                                </template>
                                                                <div v-else class="tw-text-center tw-w-full tw-flex tw-items-center tw-justify-center tw-min-h-[32px]">
                                                                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">-</div>
                                                                </div>
                                                            </div>
                                                        </v-btn>
                                                    </div>

                                                    <div class="tw-flex tw-gap-2 md:tw-gap-2">
                                                        <!-- Lay 1 (always) -->
                                                        <v-btn size="default" rounded="0" variant="elevated"
                                                            class="match-odds-price-cell odds-lay-bg-1 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-lay hover:tw-bg-odds-lay-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                                                            :disabled="!isRunnerActive(runner)"
                                                            @click="handleLayClick">
                                                            <div class="tw-text-center tw-w-full">
                                                                <template v-if="runner?.values?.[8] != null">
                                                                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ runner.values[8] }}</div>
                                                                    <div class="mo-size tw-text-[8px] tw-text-gray-600 tw-leading-tight tw-flex tw-justify-center tw-items-center">
                                                                        <template v-if="runner?.values?.[9]">{{ runner.values[9] }}</template>
                                                                        <span v-else>-</span>
                                                                    </div>
                                                                </template>
                                                                <div v-else class="tw-text-center tw-w-full tw-flex tw-items-center tw-justify-center tw-min-h-[32px]">
                                                                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">-</div>
                                                                </div>
                                                            </div>
                                                        </v-btn>

                                                        <!-- Lay 2 (desktop only) -->
                                                        <v-btn v-if="isDesktop" size="default" rounded="0" variant="elevated"
                                                            class="match-odds-price-cell odds-lay-bg-2 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-lay hover:tw-bg-odds-lay-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                                                            :disabled="!isRunnerActive(runner)"
                                                            @click="handleLayClick">
                                                            <div class="tw-text-center tw-w-full">
                                                                <template v-if="runner?.values?.[10] != null">
                                                                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ runner.values[10] }}</div>
                                                                    <div class="mo-size tw-text-[8px] tw-text-gray-600 tw-leading-tight tw-flex tw-justify-center tw-items-center">
                                                                        <template v-if="runner?.values?.[11]">{{ runner.values[11] }}</template>
                                                                        <span v-else>-</span>
                                                                    </div>
                                                                </template>
                                                                <div v-else class="tw-text-center tw-w-full tw-flex tw-items-center tw-justify-center tw-min-h-[32px]">
                                                                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">-</div>
                                                                </div>
                                                            </div>
                                                        </v-btn>

                                                        <!-- Lay 3 (desktop only) -->
                                                        <v-btn v-if="isDesktop" size="default" rounded="0" variant="elevated"
                                                            class="match-odds-price-cell odds-lay-bg-3 tw-w-[69px] tw-h-[40px] md:tw-h-[34px] tw-bg-odds-lay hover:tw-bg-odds-lay-hover tw-flex-shrink-0 tw-text-black tw-font-bold"
                                                            :disabled="!isRunnerActive(runner)"
                                                            @click="handleLayClick">
                                                            <div class="tw-text-center tw-w-full">
                                                                <template v-if="runner?.values?.[12] != null">
                                                                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">{{ runner.values[12] }}</div>
                                                                    <div class="mo-size tw-text-[8px] tw-text-gray-600 tw-leading-tight tw-flex tw-justify-center tw-items-center">
                                                                        <template v-if="runner?.values?.[13]">{{ runner.values[13] }}</template>
                                                                        <span v-else>-</span>
                                                                    </div>
                                                                </template>
                                                                <div v-else class="tw-text-center tw-w-full tw-flex tw-items-center tw-justify-center tw-min-h-[32px]">
                                                                    <div class="mo-price tw-font-bold tw-text-xs tw-leading-tight">-</div>
                                                                </div>
                                                            </div>
                                                        </v-btn>
                                                    </div>

                                                    <!-- Status Overlay spans all 6 buttons -->
                                                    <RunnerStatusOverlay :runner-status="runner?.status" :market-status="betStatus" :values="runner?.values" />
                                                </div>
                                        </div>
                                    </div>
                                </div>
                        </v-card-text>
                    </div>
                    </template>
                </div>
            </div>

            <!-- Right column — parity with sports Bet.vue `.bet-slip-fixed` -->
            <div v-if="!isMobile" class="bet-slip-fixed">
                <div v-if="event?.tv_channel_active && hasTvStreamUrl" class="tw-shrink-0 tw-mb-2">
                    <TVLiveStream :src="tvLiveStreamSrc" />
                </div>
                <!-- One Click Betting -->
                <div class="tw-mb-2">
                    <OneClickBetting />
                </div>
                <SportsBetSlip
                    :slipOpen="slipOpen"
                    :toggleSlip="toggleSlip"
                    :bet_error="betStore.bet_error"
                    :betAllow="userBetAllow"
                    :bet="betStore.bet"
                    :buttons="buttons"
                    :changeAmount="betStore.changeAmount"
                    :placeBet="betStore.placeBet"
                    :betHistory="filteredBetHistory"
                    :betHistoryCount="filteredBetHistoryCount"
                    :minAmount="betStore.minAmount"
                    :maxAmount="betStore.maxAmount"
                    :runnerCpp="runnerCppPreview"
                    v-model:bet_status="betStore.bet_status"
                    v-model:bet_processing="bet_processing"
                    v-model:showBetHistory="showBetHistory"
                    @update:buttons="handleButtonsUpdate"
                />
            </div>
        </div>

        <!-- Mobile: inline bet slip below tapped odds -->
        <Teleport
            v-if="isMobile && showInlineSlip && inlineSlipTarget && betStore.bet?.odd && (!oneClickStore.isActive || oneClickStore.editMode)"
            :to="inlineSlipTarget"
        >
            <FloatingBetSlip
                inline
                :key="`${betStore.bet?.market_id}-${betStore.bet?.runner_id}-${betStore.bet?.is_back}`"
                :bet_error="betStore.bet_error"
                :betAllow="userBetAllow"
                :bet="betStore.bet"
                :buttons="buttons"
                :changeAmount="betStore.changeAmount"
                :placeBet="betStore.placeBet"
                :minAmount="betStore.minAmount"
                :maxAmount="betStore.maxAmount"
                v-model:bet_status="betStore.bet_status"
                v-model:bet_processing="bet_processing"
                @close="closeInlineSlip"
                @update:buttons="handleButtonsUpdate"
                @inline-mounted="scrollInlineSlipIntoView"
            />
        </Teleport>

        <!-- One-click sticky bottom bar (mobile) -->
        <OneClickBetting v-if="isMobile" sticky-only />

    </div>
</template>

<style scoped>
/* Root + two-column chrome — same tokens as sports Bet.vue `.bet-page-container` */
.bet-page-container {
  background: var(--color-background);
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

/* Stack markets + slip vertically on small screens (slip hidden on mobile anyway) */
.bet-main-layout {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  gap: 5px;
}

.bet-header-fixed {
  flex-shrink: 0;
}

@media (max-width: 767.98px) {
  .bet-header-fixed {
    margin-bottom: 3px;
    background: #ffffff;
  }

  /* White side gutters + rounded purple bar (reference market header ul) */
  .bet-header-fixed :deep(.v-card) {
    background: #ffffff !important;
    background-color: #ffffff !important;
    padding: 0 0 !important;
    overflow: visible !important;
    border-radius: 0 !important;
  }

  .bet-header-fixed :deep(.bet-header-bar) {
    border-radius: 5px 5px 0 0 !important;
    overflow: hidden;
  }
}

@media (min-width: 1024px) {
  /* Match sports Bet.vue: markets grow, slip stays fixed 406px */
  .bet-page-container {
    height: 100%;
    overflow: hidden !important;
    width: 100%;
    max-width: none;
  }

  .bet-main-layout {
    flex: 1;
    flex-direction: row;
    overflow: hidden !important;
    min-height: 0;
    min-width: 0;
    width: 100%;
    max-width: none;
    gap: 0;
  }

  .bet-markets-section {
    flex: 1 1 auto;
    width: auto;
    min-width: var(--layout-sports-middle-width);
    max-width: none;
    display: flex;
    flex-direction: column;
    overflow: hidden !important;
  }

  .bet-header-fixed {
    flex-shrink: 0;
    width: 100%;
  }

  .bet-markets-scrollable {
    flex: 1;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    padding: 0 0px 8px 0px;
    min-height: 0;
    background: #ffffff;
  }

  .bet-slip-fixed {
    flex: 0 0 var(--bet-slip-rail-width);
    width: var(--bet-slip-rail-width);
    min-width: var(--bet-slip-rail-width);
    max-width: var(--bet-slip-rail-width);
    overflow-y: auto;
    background-color: #ffffff;
    padding: 0 0 8px 6px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    min-height: 0;
    align-self: flex-start;
  }

  .bet-markets-scrollable::-webkit-scrollbar {
    width: 6px;
  }

  .bet-markets-scrollable::-webkit-scrollbar-track {
    background: transparent;
  }

  .bet-markets-scrollable::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  .bet-markets-scrollable::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.3);
  }

  .bet-slip-fixed::-webkit-scrollbar {
    width: 4px;
  }

  .bet-slip-fixed::-webkit-scrollbar-track {
    background: transparent;
  }

  .bet-slip-fixed::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  /* Flush slip card chrome with divider (same tweaks as racing slip-column) */
  .bet-slip-fixed :deep(.bet-slip-vcard) {
    border-left: none;
    border-right: none;
    border-top: none;
    border-bottom: none;
    box-shadow: none;
  }

  .bet-slip-fixed :deep(.bet-slip-vcard > div:first-child) {
    flex-shrink: 0;
    min-height: 44px;
    box-sizing: border-box;
    padding-top: 2px;
    padding-bottom: 2px;
  }
}

@media (max-width: 1024px) {
  .bet-markets-scrollable {
    padding: 4px 5px calc(72px + env(safe-area-inset-bottom, 0px)) !important;
  }
}

/* Match Odds market panel design (racing) */
.v-btn:disabled {
  opacity: 0.5 !important;
}

.match-odds-root :deep(.match-odds-price-cell.v-btn--disabled .v-icon),
.match-odds-root :deep(.match-odds-price-cell[disabled] .v-icon) {
  display: none !important;
}

.bet-allow-disabled {
  --v-disabled-opacity: 1;
}

.bet-allow-disabled .odds-back-bg-1.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-back-bg-1.v-btn[disabled],
.bet-allow-disabled .odds-back-bg-2.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-back-bg-2.v-btn[disabled],
.bet-allow-disabled .odds-back-bg-3.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-back-bg-3.v-btn[disabled] {
  background-color: var(--color-back-bg-1) !important;
}

.bet-allow-disabled .odds-lay-bg-1.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-lay-bg-1.v-btn[disabled],
.bet-allow-disabled .odds-lay-bg-2.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-lay-bg-2.v-btn[disabled],
.bet-allow-disabled .odds-lay-bg-3.v-btn.v-btn--disabled,
.bet-allow-disabled .odds-lay-bg-3.v-btn[disabled] {
  background-color: var(--color-lay-bg-1) !important;
}

.bet-allow-disabled .v-btn:disabled {
  position: relative;
  opacity: 1 !important;
  color: #000 !important;
}

.bet-allow-disabled .v-btn:disabled .v-btn__content,
.bet-allow-disabled .v-btn:disabled * {
  color: inherit !important;
}

.bet-allow-disabled .v-btn:disabled::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
  border-radius: inherit;
}

.row-separator {
  border-bottom: 1px solid #d8d8d8 !important;
}

.match-odds-root,
.match-odds-header-bar {
  max-width: 100%;
}

.match-odds-orange-header .match-odds-header-cut,
.match-odds-orange-header .match-odds-header-cut-fold {
  pointer-events: none;
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 1.75rem;
}

.match-odds-orange-header .match-odds-header-cut {
  z-index: 2;
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  background-color: #efefef !important;
}

.match-odds-orange-header .match-odds-header-cut-fold {
  display: none !important;
}

.odds-header-groups {
  display: grid;
  grid-template-columns: var(--sports-bet-odds-btn-width) var(--sports-bet-odds-btn-width);
  column-gap: var(--sports-bet-odds-btn-gap);
  width: var(--sports-bet-odds-pair-width);
  align-items: center;
}

.odds-header-groups-mobile {
  display: grid;
  grid-template-columns: 69px 69px;
  column-gap: var(--sports-bet-odds-btn-gap);
  width: var(--sports-bet-odds-pair-width);
  align-items: center;
}

@media (max-width: 767.98px) {
  .match-odds-root {
    isolation: isolate;
  }

  .match-odds-root .mo-bl-header-bar {
    position: relative;
    z-index: 1;
  }

  .match-odds-root .match-odds-mobile-meta-row {
    position: relative;
    z-index: 2;
  }

  .match-odds-root .match-odds-runners {
    position: relative;
    z-index: 2;
    padding-top: 0;
  }

  .match-odds-odds-ladder {
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .match-odds-odds-ladder > .tw-flex {
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .match-odds-root :deep(.match-odds-price-cell.v-btn),
  .match-odds-root :deep(.match-odds-price-cell) {
    width: 69px !important;
    min-width: 69px !important;
    height: var(--sports-bet-odds-btn-height) !important;
    min-height: var(--sports-bet-odds-btn-height) !important;
    max-height: var(--sports-bet-odds-btn-height) !important;
    padding: 0 !important;
    border-radius: var(--sports-bet-odds-btn-radius) !important;
    box-shadow: none !important;
  }

  .match-odds-root :deep(.match-odds-price-cell .v-btn__overlay),
  .match-odds-root :deep(.match-odds-price-cell .v-btn__underlay) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .match-odds-root :deep(.match-odds-price-cell .v-btn__content) {
    padding: 1px 2px !important;
    min-height: 0 !important;
  }

  .match-odds-root :deep(.match-odds-price-cell .mo-price) {
    font-size: var(--sports-bet-mobile-market-odds-price-size) !important;
    font-weight: 700 !important;
    line-height: 1.15 !important;
  }

  .match-odds-root :deep(.match-odds-price-cell .mo-size) {
    font-size: 9px !important;
    font-weight: var(--sports-bet-mobile-market-odds-size-weight) !important;
    line-height: 1.1 !important;
  }
}

@media (min-width: 768px) {
  .match-odds-root {
    background: #fff !important;
    border-color: #e5e7eb !important;
  }

  .match-odds-header-bar {
    min-height: 34px;
    border-bottom-color: #e5e7eb !important;
  }

  .match-odds-orange-header {
    background: var(--theme-orange) !important;
    min-height: 34px;
    padding: 8px 1.75rem 8px 10px !important;
    align-items: center;
  }

  .match-odds-orange-header .match-odds-section-title {
    font-size: 13px !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    color: #ffffff !important;
    text-transform: uppercase;
  }

  .match-odds-orange-header .match-odds-header-cut {
    background-color: #efefef;
  }

  .match-odds-header-grey {
    min-height: 34px;
    padding-top: 7px !important;
    padding-bottom: 7px !important;
    align-items: center;
  }

  .match-odds-header-grey .match-odds-header-limits,
  .match-odds-header-grey .match-odds-header-limits .match-odds-header-limit-text {
    font-size: 12px !important;
    font-weight: 500 !important;
    line-height: 1.2 !important;
    color: #1f2937 !important;
    text-transform: none;
  }

  .match-odds-header-grey .odds-header-groups .sports-bet-back-label {
    color: #111827 !important;
  }

  .match-odds-header-grey .odds-header-groups .sports-bet-lay-label {
    color: #111827 !important;
  }

  .match-odds-runners {
    background: #fff;
  }

  .match-odds-runner-row {
    min-height: 43px;
    padding-top: 4px !important;
    padding-bottom: 2px !important;
    padding-left: 10px !important;
    background: #fff !important;
    border-bottom: 1px solid #e0e0e0 !important;
  }

  .match-odds-runner-row .match-odds-runner-name {
    font-size: 12px !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
    color: #000 !important;
  }

  .match-odds-runner-row:last-child {
    border-bottom: none !important;
  }

  .match-odds-odds-ladder {
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .match-odds-root :deep(.match-odds-price-cell.v-btn) {
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

  .match-odds-root :deep(.match-odds-price-cell .v-btn__overlay),
  .match-odds-root :deep(.match-odds-price-cell .v-btn__underlay) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .match-odds-root :deep(.odds-back-bg-1),
  .match-odds-root :deep(.odds-back-bg-2),
  .match-odds-root :deep(.odds-back-bg-3) {
    background: var(--color-back-bg-1) !important;
  }

  .match-odds-root :deep(.odds-lay-bg-1),
  .match-odds-root :deep(.odds-lay-bg-2),
  .match-odds-root :deep(.odds-lay-bg-3) {
    background: var(--color-lay-bg-1) !important;
  }

  .match-odds-root :deep(.match-odds-price-cell .v-icon) {
    display: none !important;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .odds-header-groups {
    grid-template-columns: 69px 69px;
    width: var(--sports-bet-odds-pair-width);
    column-gap: var(--sports-bet-odds-btn-gap);
  }
}

@media (min-width: 1025px) {
  .odds-header-groups {
    grid-template-columns: 254px 254px;
    width: 514px;
    column-gap: var(--sports-bet-odds-btn-gap);
  }
}

/* ─── Mobile floating bet FAB ───────────────────────────────────────────────
   @keyframes and fixed-center positioning with transform cannot be expressed
   as Tailwind utilities without a custom plugin.
────────────────────────────────────────────────────────────────────────────── */
.mobile-bet-fab {
    position: fixed !important;
    bottom: 20px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    z-index: 100 !important;
    border-radius: 50px !important;
    padding: 0 24px !important;
    min-width: 160px !important;
    height: 56px !important;
    animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
    0%, 100% { box-shadow: 0 4px 20px rgba(var(--v-theme-primary), 0.4); }
    50%       { box-shadow: 0 4px 30px rgba(var(--v-theme-primary), 0.6); }
}
</style>

<style>
@media (min-width: 768px) and (max-width: 1023px) {
  .v-main .v-container:has(.bet-page-container) {
    padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
  }
}

@media (max-width: 767px) {
  .v-main .v-container:has(.bet-page-container) {
    padding-bottom: env(safe-area-inset-bottom, 0px) !important;
  }
}

@media (min-width: 1024px) {
  .v-main .v-container:has(.bet-page-container) {
    position: relative !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  .bet-page-container {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    margin: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
}
</style>