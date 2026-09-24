<script setup>
import { ref, computed } from 'vue';
import EventRow from '@/components/EventRow.vue';
import FeedModePillPrefix from '@/components/sports/FeedModePillPrefix.vue';
import { useEventTypes } from '@/composables/useEventTypes';
import { useStarredEvents } from '@/composables/useStarredEvents';
import { compareEventsWithStarPriority } from '@/utils/eventStarSort';
import { isPremiumEvent } from '@/utils/premiumStatus';
import { isVirtualEvent } from '@/utils/virtualStatus';

/**
 * Exchange schedule list — same event feed as Live.vue parent:
 * GET /events/list (active rows filtered client-side). No separate API.
 */
const props = defineProps({
    allEvents: {
        type: Array,
        default: () => []
    },
    feedLive: {
        type: Boolean,
        default: false
    },
    feedPremium: {
        type: Boolean,
        default: false
    },
    feedVirtual: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['toggle-feed-live', 'toggle-feed-premium', 'toggle-feed-virtual']);

const exchangePlayCutMaskId = 'live-exchange-play-cut-mask';

const scheduleTab = ref('today');

const scheduleTabs = [
    { id: 'today', label: 'TODAY' },
    { id: 'tomorrow', label: 'TOMORROW' },
    { id: 'upcoming', label: 'UPCOMING' }
];

const { getEventTypeName } = useEventTypes();
const { starredIds, isEventStarred } = useStarredEvents();

const SPORT_PRIORITY = ['cricket', 'football', 'tennis'];

const isLiveEvent = (event) =>
    event?.in_play === true || event?.in_play === 1 || event?.in_play === '1';

const getScheduleBounds = () => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);
    return { todayStart, todayEnd, tomorrowStart, tomorrowEnd };
};

const parseOpenDate = (event) => {
    if (!event?.open_date) return null;
    const parsed = new Date(event.open_date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const matchesScheduleTab = (event, tab) => {
    const openDate = parseOpenDate(event);
    const { todayStart, todayEnd, tomorrowStart, tomorrowEnd } = getScheduleBounds();

    if (tab === 'today') {
        if (isLiveEvent(event)) return true;
        if (!openDate) return false;
        return openDate >= todayStart && openDate <= todayEnd;
    }

    if (tab === 'tomorrow') {
        if (!openDate) return false;
        return openDate >= tomorrowStart && openDate <= tomorrowEnd;
    }

    if (!openDate) return true;
    return openDate > tomorrowEnd;
};

const applyFeedFilters = (list) => {
    if (props.feedVirtual) {
        return list.filter(isVirtualEvent);
    }
    if (props.feedLive && props.feedPremium) {
        return list.filter((event) => isLiveEvent(event) || isPremiumEvent(event));
    }
    if (props.feedLive) {
        return list.filter((event) => isLiveEvent(event));
    }
    if (props.feedPremium) {
        return list.filter(isPremiumEvent);
    }
    return list;
};

const getSportRank = (event) => {
    const typeName = String(
        getEventTypeName(event?.event_type_id) || event?.event_type_name || ''
    ).toLowerCase();
    const idx = SPORT_PRIORITY.findIndex((name) => typeName.includes(name));
    return idx === -1 ? SPORT_PRIORITY.length : idx;
};

const sortExchangeEvents = (list) =>
    [...list].sort((a, b) => {
        const rankDiff = getSportRank(a) - getSportRank(b);
        if (rankDiff !== 0) return rankDiff;
        return compareEventsWithStarPriority(a, b, isEventStarred);
    });

const filteredEvents = computed(() => {
    void starredIds.value;
    const source = Array.isArray(props.allEvents) ? props.allEvents : [];
    const byDate = source.filter((event) => matchesScheduleTab(event, scheduleTab.value));
    return sortExchangeEvents(applyFeedFilters(byDate));
});

const toggleFeedLive = () => {
    emit('toggle-feed-live');
};

const toggleFeedPremium = () => {
    emit('toggle-feed-premium');
};

const toggleFeedVirtual = () => {
    emit('toggle-feed-virtual');
};
</script>

<template>
    <section class="live-exchange" aria-label="Exchange games">
        <header class="live-exchange__header">
            <div class="live-exchange__title-row">
                <span class="live-exchange__icon-wrap" aria-hidden="true">
                    <svg class="live-exchange__play-cutout" viewBox="0 0 32 32" width="22" height="22">
                        <defs>
                            <mask :id="exchangePlayCutMaskId">
                                <circle cx="16" cy="16" r="14" fill="white" />
                                <path fill="black" d="M12.5 9.5 L12.5 22.5 L23.5 16 Z" />
                            </mask>
                        </defs>
                        <circle cx="16" cy="16" r="14" fill="#ffffff" :mask="`url(#${exchangePlayCutMaskId})`" />
                    </svg>
                </span>
                <h2 class="live-exchange__title">EXCHANGE GAMES</h2>
            </div>
            <div class="live-exchange__mode-pills">
                <button type="button" class="live-exchange__mode-pill"
                    :class="{ 'live-exchange__mode-pill--active': feedLive }" @click="toggleFeedLive">
                    <FeedModePillPrefix :active="feedLive" />
                    LIVE
                </button>
                <button type="button" class="live-exchange__mode-pill live-exchange__mode-pill--premium"
                    :class="{ 'live-exchange__mode-pill--active': feedPremium }" @click="toggleFeedPremium">
                    <FeedModePillPrefix :active="feedPremium" />
                    PREMIUM
                </button>
                <button type="button" class="live-exchange__mode-pill live-exchange__mode-pill--virtual"
                    :class="{ 'live-exchange__mode-pill--active': feedVirtual }" @click="toggleFeedVirtual">
                    <FeedModePillPrefix :active="feedVirtual" />
                    VIRTUAL
                </button>
            </div>
        </header>

        <div class="live-exchange__tabs" role="tablist" aria-label="Schedule">
            <button v-for="tab in scheduleTabs" :key="tab.id" type="button" role="tab" class="live-exchange__tab"
                :class="{ 'live-exchange__tab--active': scheduleTab === tab.id }"
                :aria-selected="scheduleTab === tab.id" @click="scheduleTab = tab.id">
                <span class="live-exchange__tab-label">{{ tab.label }}</span>
            </button>
        </div>

        <div class="live-exchange__list">
            <template v-if="filteredEvents.length > 0">
                <EventRow v-for="(event, index) in filteredEvents" :key="event.id || event.event_id" :event="event"
                    :animation-delay="Math.min(index * 0.02, 0.5)" />
            </template>
            <p v-else class="live-exchange__empty">Not found</p>
        </div>
    </section>
</template>

<style scoped>
/* Reference: gold slanted header + translucent pills; slanted schedule tabs with white gaps */
.live-exchange {
    width: 100%;
    margin-top: 0;
    background: #ffffff;
}

.live-exchange__header {
    --exchange-gold: linear-gradient(90deg, #7a5c1f 0%, #9d7728 22%, #b6842d 45%, #d4b85a 72%, #ebda8d 100%);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    height: 38px;
    min-height: 38px;
    max-height: 38px;
    padding: 0 10px;
    background: var(--theme-primary-gradient, var(--exchange-gold));
    border: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.45),
        inset 0 -1px 0 rgba(0, 0, 0, 0.08);
    clip-path: none;
    overflow: hidden;
}

.live-exchange__title-row {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1 1 0;
    overflow: hidden;
}

.live-exchange__icon-wrap {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
}

.live-exchange__play-cutout {
    display: block;
    width: 26px;
    height: 26px;
}

.live-exchange__title {
    margin: 0;
    min-width: 0;
    flex: 1 1 auto;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.12em;
    line-height: 1;
    color: #ffffff;
    text-transform: uppercase;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.live-exchange__mode-pills {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex: 0 0 auto;
    flex-shrink: 0;
    justify-content: flex-end;
    margin-right: 0;
}

.live-exchange__mode-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 1px;
    margin: 0;
    padding: 8px 3px;
    min-height: 24px;
    box-sizing: border-box;
    border-radius: 999px;
    border: 1px solid #ffffff;
    background: transparent;
    box-shadow: none;
    color: #ffffff;
    font-size: 10px;
    font-weight: 400;
    line-height: 1;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    cursor: pointer;
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
    transition:
        background 0.25s ease,
        border-color 0.25s ease,
        color 0.25s ease,
        box-shadow 0.25s ease;
}

.live-exchange__mode-pill--active {
    background: #00ad6f;
    border-color: transparent;
    color: #ffffff;
    box-shadow: none;
}

.live-exchange__mode-pill--active :deep(.feed-mode-pill__prefix-icon) {
    color: #ffffff !important;
}

.live-exchange__tabs {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    padding: 4px clamp(10px, 3.5vw, 16px) 0;
    margin: 0;
    background: #ececec;
    border-bottom: none;
    overflow: visible;
    box-sizing: border-box;
}

.live-exchange__tab {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    border: 1px solid #ffffff;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    transform: none;
    padding: 2px 20px;
    margin-right: 4px;
    margin-bottom: 0;
    background-color: #6a6a6a;
    color: #ffffff;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    transition:
        background 0.15s ease,
        color 0.15s ease;
    -webkit-tap-highlight-color: transparent;
}

.live-exchange__tab:last-child {
    margin-right: 0;
}

.live-exchange__tab--active {
    background: var(--theme-primary-gradient,
            linear-gradient(90deg, #7a5c1f 0%, #9d7728 22%, #b6842d 45%, #d4b85a 72%, #ebda8d 100%));
    color: #ffffff;
    font-weight: 900;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35);
    z-index: 1;
}

.live-exchange__tab-label {
    display: inline-block;
    transform: none;
    line-height: 1;
    padding: 5px 0;
    pointer-events: none;
}

.live-exchange__tab:focus-visible {
    outline: 2px solid #2c3e50;
    outline-offset: 1px;
    z-index: 2;
}

.live-exchange__list {
    background: #ececec;
}

.live-exchange__empty {
    margin: 0;
    padding: 28px 12px;
    text-align: center;
    color: #5a5a5a;
    font-size: 12px;
    font-weight: 600;
    background: #efefef;
}

/* Narrow mobile: keep LIVE/PREMIUM pills clear of the title (matches live-inplay-header--mobile) */
@media (max-width: 480px) {
    .live-exchange__header {
        gap: 4px;
        padding: 0 8px;
    }

    .live-exchange__title-row {
        gap: 4px;
    }

    .live-exchange__icon-wrap {
        width: 22px;
        height: 22px;
    }

    .live-exchange__play-cutout {
        width: 22px;
        height: 22px;
    }

    .live-exchange__title {
        font-size: 11px;
        letter-spacing: 0.06em;
    }

    .live-exchange__mode-pills {
        gap: 3px;
        margin-right: 0;
    }
}
</style>
