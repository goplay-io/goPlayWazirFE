<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStarredEvents } from '@/composables/useStarredEvents';
import { useMobileEventOddsSide } from '@/composables/useMobileEventOddsSide';
import { isPremiumEvent } from '@/utils/premiumStatus';
import { isVirtualEvent } from '@/utils/virtualStatus';
import { isTruthyInPlay, isILive } from '@/utils/liveStatus';
import { getEventBetRoute } from '@/composables/useEventTypes';
import { prefetchBetEvent } from '@/composables/useBetEventPrefetch';
import { formatMarketBetLimit } from '@/utils/marketBetLimitFormat.js';

const MOBILE_ODDS_SWIPE_THRESHOLD_PX = 48;
const MOBILE_ODDS_TEAMS = ['TEAM_2', 'TEAM_3', 'TEAM_1'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const props = defineProps({
    event: {
        type: Object,
        required: true
    },
    animationDelay: {
        type: Number,
        default: 0
    },
    showStar: {
        type: Boolean,
        default: true
    },
    showCompetition: {
        type: Boolean,
        default: false
    },
    /** Home upcoming feed: semi-transparent overlay on odds (reference zuplay). */
    showUpcomingOddsOverlay: {
        type: Boolean,
        default: false
    },
    /** Reference home table row: date/time column + stacked team names (GamesTableData). */
    referenceLayout: {
        type: Boolean,
        default: false
    },
    /** Reference home section: inplay rows show live badge, upcoming rows show date/time. */
    referencePlayMode: {
        type: String,
        default: '',
        validator: (value) => !value || value === 'inplay' || value === 'upcoming',
    },
});

const router = useRouter();
const { isEventStarred, toggleEventStarred, starredIds } = useStarredEvents();
const { sides, getSportKey, setOddsSide } = useMobileEventOddsSide();

const touchStartX = ref(0);

const isStarred = computed(() => {
    void starredIds.value;
    return isEventStarred(props.event);
});

const sportKey = computed(() => getSportKey(props.event));

const mobileOddsSide = computed(() => sides.value[sportKey.value] ?? 'back');

const isPremium = computed(() => isPremiumEvent(props.event));

const isVirtual = computed(() => isVirtualEvent(props.event));

const isInPlay = computed(
    () =>
        isTruthyInPlay(props.event?.in_play) ||
        isILive({ openDate: props.event?.open_date }),
);

const shouldShowUpcomingOddsOverlay = computed(() => {
    if (!props.showUpcomingOddsOverlay) return false;
    if (props.referenceLayout) return props.referencePlayMode === 'upcoming';
    return !isInPlay.value;
});

const showReferenceInplayBadge = computed(
    () => props.referenceLayout && props.referencePlayMode === 'inplay',
);

const showInplayBadge = computed(
    () => (props.referenceLayout ? showReferenceInplayBadge.value : isInPlay.value),
);

/** Reference home: green TV icon when isTv === 1 (monkeydon bundle) or a stream URL exists. */
const showReferenceTvIcon = computed(() => {
    if (!props.referenceLayout) return false;
    const event = props.event;
    if (event?.isTv === 1 || event?.is_tv === 1) return true;
    const stream = event?.tv_channel || event?.tv_live_stream_url;
    return !!(stream && String(stream).trim());
});

const competitionName = computed(() => {
    const name = props.event?.competition_name;
    return name ? String(name).trim() : '';
});

/** Split "Home v Away" / "Home vs Away" into two lines (ZU reference `.teamName`). */
const teamNameLines = computed(() => {
    const raw = String(props.event?.name || '').trim();
    if (!raw) return [];
    const parts = raw.split(/\s+v(?:s)?\s+/i).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return [parts[0], parts.slice(1).join(' v ')];
    return [raw];
});

const formattedDate = computed(() => {
    if (!props.event.open_date) return '';
    try {
        const d = new Date(props.event.open_date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${d.getFullYear()} ${hours}:${mins}`;
    } catch (e) {
        return props.event.open_date_format || '';
    }
});

/** Reference GamesTableData: Today / Tomorrow / DD/MM/YYYY in the date column. */
const primaryDateLabel = computed(() => {
    if (!props.event.open_date) return '';
    try {
        const d = new Date(props.event.open_date);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (d.toDateString() === now.toDateString()) return 'Today';
        if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${d.getFullYear()}`;
    } catch (e) {
        return '';
    }
});

/** Reference GamesTableData: HH:mm in the date column. */
const secondaryTimeLabel = computed(() => {
    if (!props.event.open_date) return '';
    try {
        const d = new Date(props.event.open_date);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch (e) {
        return '';
    }
});

/** Upcoming pill: HH:mm if today, else DD MMM (ZU reference). */
const timePillLabel = computed(() => {
    if (!props.event.open_date) return '';
    try {
        const d = new Date(props.event.open_date);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) {
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
        return `${String(d.getDate()).padStart(2, '0')} ${MONTH_SHORT[d.getMonth()]}`;
    } catch (e) {
        return '';
    }
});

const hasActivePrice = (price) => {
    if (price == null || price === '') return false;
    const n = Number(price);
    return !Number.isNaN(n) && n !== 0;
};

const getPriceDisplay = (price) => (hasActivePrice(price) ? price : '--');

const formatReferenceOddPrice = (price) => {
    if (!hasActivePrice(price)) return '-';
    const n = Number(price);
    if (Number.isNaN(n)) return '-';
    const fixed = n.toFixed(2);
    return fixed.endsWith('.00') ? fixed.split('.')[0] : fixed;
};

const getReferenceOddPrice = (teamKey, side) =>
    formatReferenceOddPrice(getOddRawPrice(teamKey, side));

const getReferenceOddStake = (teamKey, side) => {
    const idx = side === 'lay' ? 8 : 2;
    const size = props.event?.values?.[teamKey]?.[idx];
    if (size == null || size === '') return '';
    const n = Number(size);
    if (Number.isNaN(n) || n <= 0) return '';
    return String(n);
};

/** Reference inPlayTime column: live score lines or date/time fallback. */
const referenceStatusLines = computed(() => {
    const eventData = props.event ?? {};
    if (props.referencePlayMode === 'inplay') {
        const scoreLines = [
            eventData.score_line1 ?? eventData.live_score_line1 ?? eventData.inplay_score_1,
            eventData.score_line2 ?? eventData.live_score_line2 ?? eventData.inplay_score_2,
            eventData.score_line3 ?? eventData.live_score_line3 ?? eventData.inplay_score_3,
        ]
            .map((line) => (line == null ? '' : String(line).trim()))
            .filter(Boolean);
        if (scoreLines.length) return scoreLines.slice(0, 3);
        if (Array.isArray(eventData.live_score_lines)) {
            return eventData.live_score_lines.map((line) => String(line).trim()).filter(Boolean).slice(0, 3);
        }
        if (typeof eventData.live_score === 'string' && eventData.live_score.includes('\n')) {
            return eventData.live_score.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 3);
        }
        if (secondaryTimeLabel.value) return [secondaryTimeLabel.value];
        return ['Live'];
    }

    const lines = [];
    if (primaryDateLabel.value) lines.push(primaryDateLabel.value);
    if (secondaryTimeLabel.value) lines.push(secondaryTimeLabel.value);
    return lines;
});

const getSizeDisplay = (size) => {
    if (size == null || size === '') return '';
    const n = Number(size);
    if (Number.isNaN(n) || n <= 0) return '';
    if (n < 5000) return '<5K';
    return formatMarketBetLimit(n, { uppercase: true });
};

const getOddRawPrice = (teamKey, side) => {
    const idx = side === 'lay' ? 7 : 1;
    return props.event?.values?.[teamKey]?.[idx];
};

const getOddPrice = (teamKey, side) => getPriceDisplay(getOddRawPrice(teamKey, side));

const getOddStake = (teamKey, side) => {
    const idx = side === 'lay' ? 8 : 2;
    return getSizeDisplay(props.event?.values?.[teamKey]?.[idx]);
};

const handleEventClick = () => {
    const eventId = props.event?.event_id || props.event?.id;
    if (eventId) {
        prefetchBetEvent(eventId);
    }
    const route = getEventBetRoute(props.event);
    if (route) router.push(route);
};

const handleStarClick = () => {
    toggleEventStarred(props.event);
};

function onMobileOddsTouchStart(e) {
    touchStartX.value = e.touches[0]?.clientX ?? 0;
}

function onMobileOddsTouchEnd(e) {
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.value;
    const delta = endX - touchStartX.value;
    if (Math.abs(delta) < MOBILE_ODDS_SWIPE_THRESHOLD_PX) return;
    e.stopPropagation();
    setOddsSide(sportKey.value, delta < 0 ? 'lay' : 'back');
}

function handleOddsButtonClick(e) {
    e.stopPropagation();
}
</script>

<template>
    <div
        @click="handleEventClick"
        class="event-row-card tw-cursor-pointer"
        :class="{ 'event-row-card--reference': referenceLayout }"
        :style="{ animationDelay: `${animationDelay}s` }"
    >
        <div class="event-row-content">
            <!-- Mobile reference home (<768px) — monkeydon 50/50 teams | odds row -->
            <div
                v-if="referenceLayout"
                class="event-row-reference-mobile"
                :class="{ 'event-row-reference-mobile--upcoming': referencePlayMode === 'upcoming' }"
            >
                <div class="event-row-ref-mobile-teams">
                    <div class="event-row-ref-mobile-score">
                        <span
                            v-for="(line, idx) in referenceStatusLines"
                            :key="`m-score-${idx}-${line}`"
                            class="event-row-ref-mobile-score-line"
                        >
                            {{ line }}
                        </span>
                    </div>
                    <div class="event-row-ref-mobile-names">
                        <span
                            v-for="(line, idx) in teamNameLines"
                            :key="`m-name-${idx}-${line}`"
                            class="event-row-ref-mobile-name"
                        >
                            {{ line }}
                        </span>
                    </div>
                </div>

                <div
                    class="event-row-ref-mobile-odds"
                    @touchstart.passive="onMobileOddsTouchStart"
                    @touchend="onMobileOddsTouchEnd"
                >
                    <div
                        v-if="shouldShowUpcomingOddsOverlay"
                        class="event-row-ref-mobile-odds-overlay"
                        aria-hidden="true"
                    >
                        Upcoming
                    </div>
                    <div
                        class="event-row-ref-mobile-odds-track"
                        :class="{ 'event-row-ref-mobile-odds-track--lay': mobileOddsSide === 'lay' }"
                    >
                        <div class="event-row-ref-mobile-odds-panel">
                            <button
                                v-for="teamKey in MOBILE_ODDS_TEAMS"
                                :key="`ref-back-${teamKey}`"
                                type="button"
                                class="event-row-ref-mobile-btn"
                                :class="teamKey === 'TEAM_3'
                                    ? 'event-row-ref-mobile-btn--empty'
                                    : 'event-row-ref-mobile-btn--back'"
                                @click="handleOddsButtonClick"
                            >
                                <span class="event-row-ref-mobile-btn__price">
                                    {{ teamKey === 'TEAM_3' ? '-' : getReferenceOddPrice(teamKey, 'back') }}
                                </span>
                                <span class="event-row-ref-mobile-btn__stake">
                                    {{
                                        teamKey === 'TEAM_3'
                                            ? '-'
                                            : (getReferenceOddStake(teamKey, 'back') || '-')
                                    }}
                                </span>
                            </button>
                        </div>
                        <div class="event-row-ref-mobile-odds-panel">
                            <button
                                v-for="teamKey in MOBILE_ODDS_TEAMS"
                                :key="`ref-lay-${teamKey}`"
                                type="button"
                                class="event-row-ref-mobile-btn"
                                :class="teamKey === 'TEAM_3'
                                    ? 'event-row-ref-mobile-btn--empty'
                                    : 'event-row-ref-mobile-btn--lay'"
                                @click="handleOddsButtonClick"
                            >
                                <span class="event-row-ref-mobile-btn__price">
                                    {{ teamKey === 'TEAM_3' ? '-' : getReferenceOddPrice(teamKey, 'lay') }}
                                </span>
                                <span class="event-row-ref-mobile-btn__stake">
                                    {{
                                        teamKey === 'TEAM_3'
                                            ? '-'
                                            : (getReferenceOddStake(teamKey, 'lay') || '-')
                                    }}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mobile standard (<768px) -->
            <div v-else class="event-row-mobile">
                <div class="event-row-mobile__name-wrap">
                    <div class="event-row-mobile__name-block">
                        <p v-if="competitionName" class="event-row-mobile-competition">
                            {{ competitionName }}
                        </p>
                        <span
                            v-for="(line, idx) in teamNameLines"
                            :key="`${idx}-${line}`"
                            class="event-row-mobile-name"
                        >{{ line }}</span>
                    </div>
                </div>

                <div class="event-row-mobile__status">
                    <div class="event-row-mobile__symbols">
                        <span v-if="event.bm_active" class="event-row-market-symbol">B</span>
                        <span v-if="event.fancy_active" class="event-row-market-symbol">F</span>
                        <span v-if="event.toss_active" class="event-row-market-symbol">T</span>
                        <span v-if="isPremium" class="event-row-market-symbol">P</span>
                        <span v-if="isVirtual" class="event-row-market-symbol">V</span>
                        <span v-if="event.custom_active" class="event-row-market-symbol">{{ event.custom_active }}</span>
                    </div>
                    <span v-if="showInplayBadge" class="event-row-inplay-badge">Inplay</span>
                    <span v-else-if="timePillLabel" class="event-row-time-pill">{{ timePillLabel }}</span>
                </div>

                <!-- Swipe odds: keep handlers/structure untouched -->
                <div
                    class="event-row-mobile__odds"
                    @touchstart.passive="onMobileOddsTouchStart"
                    @touchend="onMobileOddsTouchEnd"
                >
                    <div
                        v-if="shouldShowUpcomingOddsOverlay"
                        class="event-row-mobile__odds-overlay"
                        aria-hidden="true"
                    >
                        Upcoming
                    </div>
                    <button
                        v-for="teamKey in MOBILE_ODDS_TEAMS"
                        :key="teamKey"
                        type="button"
                        class="event-row-ref-btn"
                        :class="teamKey === 'TEAM_3'
                            ? 'event-row-ref-btn--empty'
                            : (mobileOddsSide === 'lay' ? 'event-row-ref-btn--lay' : 'event-row-ref-btn--back')"
                        @click="handleOddsButtonClick"
                    >
                        <span class="event-row-ref-btn__price">
                            {{ teamKey === 'TEAM_3' ? '--' : getOddPrice(teamKey, mobileOddsSide) }}
                        </span>
                        <span
                            v-if="teamKey !== 'TEAM_3' && getOddStake(teamKey, mobileOddsSide)"
                            class="event-row-ref-btn__stake"
                        >
                            {{ getOddStake(teamKey, mobileOddsSide) }}
                        </span>
                    </button>
                </div>
            </div>

            <!-- Desktop reference home row (monkeydon GamesTableData layout) -->
            <div v-if="referenceLayout" class="event-row-reference-desktop">
                <div class="event-row-reference-body">
                    <div class="event-row-reference-left">
                        <div class="event-row-reference-score">
                            <span
                                v-for="(line, idx) in referenceStatusLines"
                                :key="`score-${idx}-${line}`"
                                class="event-row-reference-score-line"
                            >
                                {{ line }}
                            </span>
                        </div>
                        <div class="event-row-reference-names">
                            <div class="event-row-reference-names__stack">
                                <div
                                    v-for="(line, idx) in teamNameLines"
                                    :key="`${idx}-${line}`"
                                    class="event-row-reference-name-row"
                                >
                                    <span class="event-row-reference-name-dot" aria-hidden="true" />
                                    <span class="event-row-reference-name">{{ line }}</span>
                                </div>
                            </div>
                            <span
                                v-if="showReferenceTvIcon"
                                class="event-row-reference-tv-icon"
                                aria-label="TV stream available"
                            >
                                <img
                                    src="/svg/sports-icons/event-row-tv-icon.svg"
                                    alt=""
                                    width="13"
                                    height="11"
                                />
                            </span>
                        </div>
                    </div>
                    <div class="event-row-reference-odds">
                        <div
                            v-if="shouldShowUpcomingOddsOverlay"
                            class="event-row-reference-odds-overlay"
                            aria-hidden="true"
                        >
                            Upcoming
                        </div>
                        <div class="event-row-reference-odds-group">
                            <button type="button" class="event-odd-btn event-odd-btn--back" @click="handleOddsButtonClick">
                                <span class="event-odd-btn__price">{{ getReferenceOddPrice('TEAM_2', 'back') }}</span>
                                <span v-if="getOddStake('TEAM_2', 'back')" class="event-odd-btn__stake">{{ getOddStake('TEAM_2', 'back') }}</span>
                            </button>
                            <button type="button" class="event-odd-btn event-odd-btn--lay" @click="handleOddsButtonClick">
                                <span class="event-odd-btn__price">{{ getReferenceOddPrice('TEAM_2', 'lay') }}</span>
                                <span v-if="getOddStake('TEAM_2', 'lay')" class="event-odd-btn__stake">{{ getOddStake('TEAM_2', 'lay') }}</span>
                            </button>
                        </div>
                        <div class="event-row-reference-odds-group">
                            <button type="button" class="event-odd-btn event-odd-btn--back event-odd-btn--empty" @click="handleOddsButtonClick">
                                <span class="event-odd-btn__price">-</span>
                            </button>
                            <button type="button" class="event-odd-btn event-odd-btn--lay event-odd-btn--empty" @click="handleOddsButtonClick">
                                <span class="event-odd-btn__price">-</span>
                            </button>
                        </div>
                        <div class="event-row-reference-odds-group">
                            <button type="button" class="event-odd-btn event-odd-btn--back" @click="handleOddsButtonClick">
                                <span class="event-odd-btn__price">{{ getReferenceOddPrice('TEAM_1', 'back') }}</span>
                                <span v-if="getOddStake('TEAM_1', 'back')" class="event-odd-btn__stake">{{ getOddStake('TEAM_1', 'back') }}</span>
                            </button>
                            <button type="button" class="event-odd-btn event-odd-btn--lay" @click="handleOddsButtonClick">
                                <span class="event-odd-btn__price">{{ getReferenceOddPrice('TEAM_1', 'lay') }}</span>
                                <span v-if="getOddStake('TEAM_1', 'lay')" class="event-odd-btn__stake">{{ getOddStake('TEAM_1', 'lay') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Desktop default row -->
            <div v-else class="event-row-desktop">
                <div class="event-row-desktop__status">
                    <span v-if="isInPlay" class="event-row-inplay-badge event-row-inplay-badge--desktop">Inplay</span>
                    <span v-else-if="timePillLabel" class="event-row-time-pill event-row-time-pill--desktop">{{ timePillLabel }}</span>
                </div>

                <div class="event-row-desktop__left">
                    <div class="event-row-name-wrap">
                        <span v-if="competitionName && showCompetition" class="event-row-competition-pill">
                            {{ competitionName }}
                        </span>
                        <template v-for="(line, idx) in teamNameLines" :key="`${idx}-${line}`">
                            <br v-if="idx > 0" class="event-row-name-break" />
                            <span class="event-row-name">{{ line }}</span>
                        </template>
                    </div>
                </div>

                <div class="event-row-desktop__meta">
                    <span v-if="event.bm_active" class="event-row-market-symbol">B</span>
                    <span v-if="event.fancy_active" class="event-row-market-symbol">F</span>
                    <span v-if="event.toss_active" class="event-row-market-symbol">T</span>
                    <span v-if="isPremium" class="event-row-market-symbol">P</span>
                    <span v-if="isVirtual" class="event-row-market-symbol">V</span>
                    <span v-if="event.custom_active" class="event-row-market-symbol">{{ event.custom_active }}</span>
                </div>

                <div class="event-row-desktop__odds">
                    <div
                        v-if="shouldShowUpcomingOddsOverlay"
                        class="event-row-desktop__odds-overlay"
                        aria-hidden="true"
                    >
                        Upcoming
                    </div>
                    <div class="event-odd-stack">
                        <button type="button" class="event-odd-btn event-odd-btn--back" @click="handleOddsButtonClick">
                            <span class="event-odd-btn__price">{{ getOddPrice('TEAM_2', 'back') }}</span>
                            <span v-if="getOddStake('TEAM_2', 'back')" class="event-odd-btn__stake">{{ getOddStake('TEAM_2', 'back') }}</span>
                        </button>
                        <button type="button" class="event-odd-btn event-odd-btn--lay" @click="handleOddsButtonClick">
                            <span class="event-odd-btn__price">{{ getOddPrice('TEAM_2', 'lay') }}</span>
                            <span v-if="getOddStake('TEAM_2', 'lay')" class="event-odd-btn__stake">{{ getOddStake('TEAM_2', 'lay') }}</span>
                        </button>
                    </div>
                    <div class="event-odd-stack">
                        <button type="button" class="event-odd-btn event-odd-btn--empty" @click="handleOddsButtonClick">
                            <span class="event-odd-btn__price">--</span>
                        </button>
                        <button type="button" class="event-odd-btn event-odd-btn--empty" @click="handleOddsButtonClick">
                            <span class="event-odd-btn__price">--</span>
                        </button>
                    </div>
                    <div class="event-odd-stack">
                        <button type="button" class="event-odd-btn event-odd-btn--back" @click="handleOddsButtonClick">
                            <span class="event-odd-btn__price">{{ getOddPrice('TEAM_1', 'back') }}</span>
                            <span v-if="getOddStake('TEAM_1', 'back')" class="event-odd-btn__stake">{{ getOddStake('TEAM_1', 'back') }}</span>
                        </button>
                        <button type="button" class="event-odd-btn event-odd-btn--lay" @click="handleOddsButtonClick">
                            <span class="event-odd-btn__price">{{ getOddPrice('TEAM_1', 'lay') }}</span>
                            <span v-if="getOddStake('TEAM_1', 'lay')" class="event-odd-btn__stake">{{ getOddStake('TEAM_1', 'lay') }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.event-row-card {
    position: relative;
    background: #ffffff;
    border-left: 1px solid #d1d5db;
    border-right: 1px solid #d1d5db;
    border-bottom: 1px solid #d1d5db;
    border-top: none;
    transition: background-color 0.15s ease;
    overflow: hidden;
    margin: 0;
}

.event-row-card:hover {
    background: #fafafa;
}

.event-row-content {
    position: relative;
    z-index: 2;
    width: 100%;
    padding: 0;
    box-sizing: border-box;
}

.event-row-mobile,
.event-row-desktop,
.event-row-reference-desktop,
.event-row-reference-mobile {
    display: none;
}

/* ── Desktop ─────────────────────────────────────────────── */
@media (min-width: 768px) {
    .event-row-card {
        min-height: 44px;
        height: 44px;
        box-sizing: border-box;
    }

    .event-row-content {
        padding: 0;
        height: 100%;
    }

    .event-row-desktop,
    .event-row-reference-desktop {
        display: flex;
        align-items: stretch;
        min-width: 0;
        width: 100%;
        height: 44px;
        min-height: 44px;
        box-sizing: border-box;
    }

    .event-row-reference-desktop {
        height: 48px;
        min-height: 48px;
    }

    .event-row-desktop__status {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 60px;
        margin-left: 16px;
        padding: 0;
    }

    /* Reference: `div.w-full.flex.btn-gamelist` */
    .event-row-desktop__left {
        flex: 1 1 auto;
        min-width: 0;
        width: 100%;
        display: flex;
        align-items: center;
        cursor: pointer;
    }

    /* Reference: `.teamName` — ml-2 my-2, 11px/700, leading-tight, md:w-full */
    .event-row-desktop .event-row-name-wrap {
        flex: 0 0 auto;
        width: 100%;
        margin: 8px 0 8px 8px;
        gap: 0;
        line-height: 13.75px;
    }

    .event-row-desktop__meta {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
        width: 108px;
        min-width: 108px;
        max-width: 108px;
        margin-right: 0;
        padding: 0 20px;
        box-sizing: border-box;
    }

    .event-row-desktop__odds {
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: repeat(6, 53px);
        gap: 2px;
        width: 328px;
        min-width: 328px;
        max-width: 328px;
        height: 34px;
        margin-right: 8px;
        justify-self: end;
        position: relative;
    }

    .event-row-desktop__odds-overlay {
        position: absolute;
        inset: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.8);
        color: #d1d5db;
        font-size: 14px;
        font-weight: 400;
        line-height: 1.2;
        text-align: center;
        padding: 0;
        pointer-events: auto;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .event-row-desktop .event-odd-btn {
        width: 53px;
        height: 34px;
        min-height: 34px;
        max-height: 34px;
        border-radius: 4px;
        padding: 0;
        gap: 3px;
    }

    .event-row-desktop .event-odd-btn--back {
        background: #8dd9ff;
    }

    .event-row-desktop .event-odd-btn--lay {
        background: #ff94bc;
    }

    .event-row-desktop .event-odd-btn--empty {
        background: #a3a3a3;
    }

    .event-row-desktop .event-odd-btn__price {
        font-size: 12px;
        font-weight: 700;
        line-height: 18px;
        color: #0c0a09 !important;
    }

    .event-row-desktop .event-odd-btn__stake {
        font-size: 9px;
        font-weight: 600;
        line-height: 13.5px;
        margin-top: -4px;
        color: #0c0a09 !important;
    }

    .event-row-mobile {
        display: none !important;
    }
}

/* ── Mobile ──────────────────────────────────────────────── */
@media (max-width: 767.98px) {
    .event-row-desktop {
        display: none !important;
    }

    .event-row-content {
        padding: 0;
    }

    /* Reference home mobile — measured monkeydon.com @ 390px */
    .event-row-reference-mobile {
        display: grid;
        grid-template-columns: 1fr 1fr;
        width: 100%;
        min-width: 0;
        height: 48px;
        min-height: 48px;
        overflow: hidden;
        box-sizing: border-box;
    }

    .event-row-card--reference {
        height: 48px !important;
        min-height: 48px !important;
        border-bottom: none !important;
    }

    .event-row-ref-mobile-teams {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        align-items: stretch;
        min-width: 0;
        height: 100%;
        box-sizing: border-box;
    }

    .event-row-ref-mobile-score {
        grid-column: span 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 0;
        padding: 0 2px;
        box-sizing: border-box;
    }

    .event-row-ref-mobile-score-line {
        display: block;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 9px;
        font-weight: 500;
        line-height: 13.5px;
        text-align: center;
        color: #4cae50;
    }

    .event-row-reference-mobile--upcoming .event-row-ref-mobile-score-line {
        color: rgba(255, 255, 255, 0.85);
    }

    .event-row-ref-mobile-names {
        grid-column: span 5;
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;
        padding: 0 4px;
        border-left: 1px solid rgba(84, 84, 84, 0.6);
        border-right: 1px solid rgba(84, 84, 84, 0.6);
        box-sizing: border-box;
    }

    .event-row-ref-mobile-name {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 11px;
        font-weight: 700;
        line-height: 16.5px;
        color: rgba(255, 255, 255, 0.95);
    }

    .event-row-ref-mobile-odds {
        position: relative;
        min-width: 0;
        height: 100%;
        overflow: hidden;
        box-sizing: border-box;
    }

    .event-row-ref-mobile-odds-overlay {
        position: absolute;
        inset: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.8);
        color: #d1d5db;
        font-size: 14px;
        font-weight: 400;
        line-height: 1.2;
        pointer-events: auto;
    }

    .event-row-ref-mobile-odds-track {
        display: flex;
        width: 200%;
        height: 100%;
        transition: transform 0.2s ease;
        touch-action: pan-y;
    }

    .event-row-ref-mobile-odds-track--lay {
        transform: translateX(-50%);
    }

    .event-row-ref-mobile-odds-panel {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1px;
        width: 50%;
        height: 100%;
        padding: 1px;
        box-sizing: border-box;
        flex-shrink: 0;
    }

    .event-row-ref-mobile-btn {
        width: 100%;
        height: 100%;
        min-height: 0;
        margin: 0;
        padding: 1px 4px;
        border: none;
        border-radius: 2px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        cursor: pointer;
        color: #000;
    }

    .event-row-ref-mobile-btn--back {
        background: #a7d8fd;
    }

    .event-row-ref-mobile-btn--lay {
        background: #f9c9d4;
    }

    .event-row-ref-mobile-btn--empty {
        background: #a3a3a3;
        cursor: default;
    }

    .event-row-ref-mobile-btn__price {
        display: block;
        width: 100%;
        font-size: 14px;
        font-weight: 600;
        line-height: 20px;
        text-align: center;
        color: #000;
    }

    .event-row-ref-mobile-btn__stake {
        display: block;
        width: 100%;
        font-size: 10px;
        font-weight: 400;
        line-height: 12px;
        text-align: center;
        color: #000;
    }

    .event-row-mobile {
        display: flex;
        align-items: stretch;
        gap: 2px;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        height: 57px;
        min-height: 57px;
        overflow: hidden;
        box-sizing: border-box;
    }

    .event-row-card {
        border-bottom: 1px solid #d1d5db;
        border-top: none;
        background: #fff;
        height: 57px;
        min-height: 57px;
        box-sizing: border-box;
        margin-top: 0;
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
    }

    .event-row-card + .event-row-card {
        margin-top: 1px;
    }

    .event-row-card:hover {
        background: #fff;
    }

    /* Shrinks on narrow viewports; status (70px) + odds (154px) stay fixed */
    .event-row-mobile__name-wrap {
        flex: 1 1 auto;
        min-width: 0;
        width: auto;
        max-width: 145px;
        display: flex;
        align-items: center;
        height: 100%;
        overflow: hidden;
    }

    .event-row-mobile__name-block {
        flex: 1 1 auto;
        width: 100%;
        max-width: 120px;
        min-width: 0;
        height: 40px;
        margin: 8px 0 8px 8px;
        display: grid;
        align-content: center;
        gap: 0;
        overflow: hidden;
    }

    .event-row-mobile__name-block:has(.event-row-mobile-competition):not(:has(.event-row-mobile-name:nth-of-type(2))) {
        grid-template-rows: 18.625px 21.375px;
    }

    .event-row-mobile__name-block:has(.event-row-mobile-competition):has(.event-row-mobile-name:nth-of-type(2)) {
        grid-template-rows: 11.5px 14.25px 14.25px;
    }

    .event-row-mobile__name-block:not(:has(.event-row-mobile-competition)):has(.event-row-mobile-name:nth-of-type(2)) {
        grid-template-rows: 14.25px 14.25px;
    }

    .event-row-mobile-competition {
        margin: 0;
        color: #000000;
        font-size: 7px;
        font-weight: 700;
        line-height: 8.75px;
        text-decoration: underline;
        text-underline-offset: 1px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .event-row-mobile-name {
        margin: 0;
        color: #000000;
        font-size: 10px;
        font-weight: 700;
        line-height: 12.5px;
        height: 14px;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .event-row-mobile-date {
        margin: 0 !important;
        color: #ff5733 !important;
        font-size: 10px;
        font-weight: 400;
        line-height: 1.2;
        white-space: nowrap;
    }

    .event-row-mobile__status {
        flex: 0 0 auto;
        width: auto;
        min-width: 70px;
        height: 40px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;
        gap: 4px;
        padding: 0 4px;
        margin: 8px 0;
        box-sizing: border-box;
    }

    .event-row-mobile__symbols {
        width: auto;
        min-width: 0;
        max-width: none;
        height: 15.56px;
        display: flex;
        flex-wrap: nowrap;
        justify-content: flex-end;
        align-items: center;
        align-content: center;
        gap: 1px;
    }

    .event-row-mobile__odds {
        position: relative;
        flex: 0 0 154px;
        width: 154px;
        min-width: 154px;
        height: 40px;
        display: flex;
        gap: 2px;
        align-items: center;
        margin: 8px 4px 8px 0;
        margin-left: auto;
        touch-action: pan-y;
    }

    .event-row-mobile__odds-overlay {
        position: absolute;
        inset: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 40px;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.8);
        color: #d1d5db;
        font-size: 14px;
        font-weight: 400;
        line-height: 1.2;
        text-align: center;
        padding: 0;
        pointer-events: auto;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .event-row-mobile__odds .event-row-ref-btn {
        flex: 0 0 50px;
        width: 50px;
        min-width: 50px;
        height: 40px;
        min-height: 40px;
        max-height: 40px;
        border-radius: 4px;
        padding: 0;
        gap: 0;
    }

    .event-row-ref-btn {
        width: 50px;
        height: 40px;
        min-height: 40px;
        border-radius: 4px;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0;
        padding: 0;
        box-sizing: border-box;
        font-size: 12px;
        font-weight: 700;
        line-height: 18px;
    }

    .event-row-ref-btn__price {
        font-size: 12px;
        font-weight: 700;
        line-height: 18px;
        color: #0c0a09;
    }

    .event-row-ref-btn__stake {
        font-size: 9px;
        font-weight: 600;
        line-height: 13.5px;
        margin-top: -4px;
        color: #0c0a09;
    }

    .event-row-inplay-badge {
        width: 62px;
        height: 16px;
        min-width: 62px;
        font-size: 9.06px;
        font-weight: 700;
        line-height: 13.59px;
        border-radius: 2.83px;
    }

    .event-row-time-pill {
        width: 62px;
        height: 16px;
        min-width: 62px;
        font-size: 9.06px;
        font-weight: 700;
        line-height: 13.59px;
        border-radius: 2.83px;
    }
}

/* ── Shared pieces ───────────────────────────────────────── */
.event-row-name-wrap {
    min-width: 0;
    display: block;
    color: #000000;
    font-size: 11px;
    font-weight: 700;
    line-height: 13.75px;
}

.event-row-competition-pill {
    display: flex;
    align-items: center;
    width: fit-content;
    max-width: 150px;
    padding: 1px 4px;
    border-radius: 8px;
    background: #ca86f3;
    color: #111111;
    font-size: 7px;
    font-weight: 700;
    line-height: 8.75px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.event-row-name {
    color: #000000;
    font-size: 11px;
    font-weight: 700;
    line-height: 13.75px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.event-row-name-break {
    display: none;
}

@media (min-width: 768px) {
    .event-row-name-break {
        display: block;
    }
}

.event-row-date {
    color: #6b7280;
    font-size: 10px;
    font-weight: 400;
    line-height: 1.2;
    white-space: nowrap;
}

.event-row-star-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    line-height: 0;
    position: relative;
    z-index: 4;
}

.event-row-star-btn:focus-visible {
    outline: 2px solid #d4a017;
    outline-offset: 1px;
    border-radius: 2px;
}

.event-row-desktop__star {
    flex-shrink: 0;
    align-self: flex-start;
    margin-top: 2px;
}

.event-row-inplay-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 22.61px;
    min-width: 60px;
    padding: 0;
    box-sizing: border-box;
    border-radius: 2.83px;
    background: #31b840;
    color: #ffffff;
    font-size: 9.06px;
    font-weight: 700;
    line-height: 13.59px;
    white-space: nowrap;
    flex-shrink: 0;
}

.event-row-inplay-badge--desktop {
    width: 60px;
    height: 22.61px;
    padding: 0;
    border-radius: 2.83px;
    font-size: 9.06px;
    font-weight: 700;
}

/* Reference home desktop row — measured from monkeydon.com */
.event-row-reference-body {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    width: 100%;
    height: 100%;
    min-height: 48px;
}

.event-row-reference-left {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 5fr);
    min-width: 0;
    height: 100%;
}

.event-row-reference-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    padding: 0 2px;
    box-sizing: border-box;
}

.event-row-reference-score-line {
    display: block;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 9px;
    font-weight: 500;
    line-height: 13.5px;
    text-align: center;
    color: #4cae50;
}

.event-row-reference-names {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 0;
    height: 100%;
    padding: 0 4px;
    border-left: 1px solid rgba(84, 84, 84, 0.6);
    border-right: 1px solid rgba(84, 84, 84, 0.6);
    box-sizing: border-box;
}

.event-row-reference-names__stack {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0;
    min-width: 0;
    flex: 1 1 auto;
    margin-right: 4px;
}

.event-row-reference-name-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    min-width: 0;
    height: 20px;
}

.event-row-reference-name-dot {
    width: 5px;
    height: 5px;
    margin-right: 2px;
    padding: 1px;
    flex-shrink: 0;
    box-sizing: border-box;
}

.event-row-reference-name {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 700;
    line-height: 20px;
    color: #ffffff;
}

.event-row-reference-tv-icon {
    position: absolute;
    top: 2px;
    right: 2px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 13px;
    height: 11px;
    pointer-events: none;
}

.event-row-reference-tv-icon img {
    display: block;
    width: 13px;
    height: 11px;
    object-fit: contain;
}

.event-row-reference-odds {
    position: relative;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 0 2px;
    height: 100%;
    min-width: 0;
    padding: 1px 2px 1px 0;
    box-sizing: border-box;
}

.event-row-reference-odds-group {
    grid-column: span 4;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    height: 100%;
    min-width: 0;
}

.event-row-reference-odds .event-odd-btn {
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 1px 4px;
    border-radius: 2px;
    gap: 0;
}

.event-row-reference-odds .event-odd-btn--back {
    background: #a7d8fd;
}

.event-row-reference-odds .event-odd-btn--lay {
    background: #f9c9d4;
}

.event-row-reference-odds .event-odd-btn--empty.event-odd-btn--back {
    background: #a7d8fd;
}

.event-row-reference-odds .event-odd-btn--empty.event-odd-btn--lay {
    background: #f9c9d4;
}

.event-row-reference-odds .event-odd-btn__price {
    font-size: 15px;
    font-weight: 600;
    line-height: 20px;
    color: #000000 !important;
}

.event-row-reference-odds .event-odd-btn__stake {
    font-size: 10px;
    font-weight: 400;
    line-height: 12px;
    margin-top: 0;
    color: #000000 !important;
    text-align: center;
}

.event-row-reference-odds-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.8);
    color: #d1d5db;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.2;
    text-align: center;
    pointer-events: auto;
    white-space: nowrap;
}

.event-row-time-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 22.61px;
    min-width: 60px;
    padding: 0;
    box-sizing: border-box;
    border-radius: 2.83px;
    background: #ebecef;
    color: #360952;
    font-size: 9.06px;
    font-weight: 700;
    line-height: 13.59px;
    white-space: nowrap;
    flex-shrink: 0;
}

.event-row-time-pill--desktop {
    width: 60px;
    height: 22.61px;
    min-height: 22.61px;
    padding: 0;
    border-radius: 2.83px;
}

.event-row-market-symbol {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 15.56px;
    min-width: 15.56px;
    height: 14.15px;
    padding: 0;
    border-radius: 2px;
    background: #001f3f;
    color: #ffffff;
    font-size: 8px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: normal;
    text-transform: uppercase;
    white-space: nowrap;
    flex-shrink: 0;
    box-sizing: border-box;
}

.event-odd-stack {
    display: contents;
}

.event-odd-btn {
    width: 53px;
    height: 34px;
    min-height: 34px;
    border: none;
    border-radius: 4px;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 0;
    cursor: pointer;
}

.event-odd-btn--back {
    background: #8dd9ff;
}

.event-odd-btn--lay {
    background: #ff94bc;
}

/* Middle (X/draw) column: always grey with "--", no size on the home table. */
.event-odd-btn--empty {
    background: #a3a3a3;
    cursor: default;
}

.event-odd-btn__price {
    font-size: 12px;
    font-weight: 700;
    line-height: 18px;
    color: #0c0a09 !important;
}

.event-odd-btn__stake {
    font-size: 9px;
    font-weight: 600;
    line-height: 13.5px;
    margin-top: -4px;
    color: #0c0a09 !important;
}

.event-row-ref-btn {
    flex: 1 1 0;
    min-width: 0;
    min-height: 26px;
    margin: 0;
    padding: 2px 2px;
    border: none;
    border-radius: 4px;
    font-size: var(--sports-bet-mobile-odds-price-size, 12px);
    font-weight: var(--sports-bet-mobile-odds-price-weight, 700);
    line-height: var(--sports-bet-mobile-odds-price-line-height, 1.1);
    color: #0c0a09;
    cursor: pointer;
    transition: filter 0.12s ease;
}

.event-row-ref-btn--back {
    background: var(--color-back-bg-1, #90d9ff);
}

.event-row-ref-btn--lay {
    background: var(--color-lay-bg-1, #ff9ebc);
}

.event-row-ref-btn--empty {
    background: #a3a3a3;
    cursor: default;
}

.event-row-ref-btn__price {
    display: block;
    font-size: inherit;
    font-weight: inherit;
    line-height: 1.1;
}

.event-row-ref-btn__stake {
    display: block;
    font-size: 9px;
    font-weight: 700;
    line-height: 1.1;
    color: #0c0a09;
}

.event-row-ref-btn:hover {
    filter: brightness(0.97);
}

/* Mobile overrides — must follow shared rules (reference #inplay h-18 row) */
@media (max-width: 767.98px) {
    .event-row-inplay-badge:not(.event-row-inplay-badge--desktop),
    .event-row-time-pill:not(.event-row-time-pill--desktop) {
        width: 62px;
        height: 16px;
        min-width: 62px;
        min-height: 16px;
        font-size: 9.06px;
        font-weight: 700;
        line-height: 13.59px;
        border-radius: 2.83px;
    }

    .event-row-mobile__odds .event-row-ref-btn {
        line-height: 18px;
    }

    .event-row-mobile__odds .event-row-ref-btn__price {
        font-size: 12px;
        font-weight: 700;
        line-height: 18px;
    }

    .event-row-mobile__odds .event-row-ref-btn__stake {
        font-size: 9px;
        font-weight: 600;
        line-height: 13.5px;
        margin-top: -4px;
    }
}

@media (max-width: 390px) {
    .event-row-mobile__name-wrap {
        max-width: 120px;
    }

    .event-row-mobile__name-block {
        max-width: 100%;
    }
}

@media (max-width: 360px) {
    .event-row-mobile__name-wrap {
        max-width: 100px;
    }
}

@media (max-width: 320px) {
    .event-row-mobile__name-wrap {
        max-width: 84px;
    }
}
</style>
