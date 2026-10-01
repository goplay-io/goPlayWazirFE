<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n'
import Loading from '@/components/Loading.vue';
import EventRow from '@/components/EventRow.vue';
import FeedModePillPrefix from '@/components/sports/FeedModePillPrefix.vue';
import HomeEventsSectionHeader from '@/components/home/HomeEventsSectionHeader.vue';
import HomeProviderCarousel from '@/components/home/HomeProviderCarousel.vue';
import HomePromotionQuickActions from '@/components/home/HomePromotionQuickActions.vue';
import { useEventsStore } from '@/stores/events/events';
import { useEventTypes, includeInSportNavMenu } from '@/composables/useEventTypes';
import { sportTableHeaderIconSrc } from '@/constants/subHeaderIcons.js';
import { getReferenceSidebarIconSrc } from '@/constants/sidebarIcons.js';
import { useOddsWebSocket } from '@/composables/useOddsWebSocket';
import { useStarredEvents } from '@/composables/useStarredEvents';
import useDevices from '@/composables/useDevices.js';
import { isPremiumEvent } from '@/utils/premiumStatus';
import { isVirtualEvent } from '@/utils/virtualStatus';
import { isLiveFeedEvent } from '@/utils/liveStatus';
import { sortEventsWithStarPriority } from '@/utils/eventStarSort';
import { useAuthStore } from '@/stores/auth';
import { loadPrefetchEventDetails } from '@/composables/useBetEventPrefetch';

const route = useRoute();
const { t } = useI18n()
const authStore = useAuthStore();
const eventsStore = useEventsStore();
const { getEventTypeName, eventTypes: defaultEventTypes, getEventTypeIcon, getEventTypeById } = useEventTypes();
const { isMobile } = useDevices();

const event_type_id = ref(parseInt(route.params.event_type_id));
const competition_id = ref(route.params.competition_id != null ? parseInt(route.params.competition_id) : null);
const noEvent = ref(false);
const events = ref([]);
const finalData = ref([]);
const error = ref(null);
/** Per sport + section feed filters (inplay/upcoming are independent). */
const sectionFeedModes = ref({});

const getSectionFeedKey = (sportId, sectionMode) => `${String(sportId)}:${sectionMode}`;
const visibleEventIds = ref([]);

const PRELOAD_ODDS_COUNT = 24;
const VIEWPORT_ROOT_MARGIN = '240px 0px';

let visibilityObserver = null;
const observedElements = new WeakMap();

const getEventId = (event) => String(event?.event_id ?? event?.id ?? '');

const isInplayEvent = (event) =>
    event?.in_play === true || event?.in_play === 1 || event?.in_play === '1';

const isRedBlinkingEvent = (event) =>
    isLiveFeedEvent({
        eventName: event?.name,
        competitionName: event?.competition_name,
        inPlay: event?.in_play,
        openDate: event?.open_date,
    });

const applyFeedModeToList = (list, { live, premium, virtual }) => {
    const base = Array.isArray(list) ? list : [];
    if (virtual) {
        return base.filter(isVirtualEvent);
    }
    if (live && premium) {
        return base.filter((event) => isRedBlinkingEvent(event) || isPremiumEvent(event));
    }
    if (live) {
        return base.filter(isRedBlinkingEvent);
    }
    if (premium) {
        return base.filter(isPremiumEvent);
    }
    return base;
};

const getFeedFlagsForSport = (sportId, sectionMode) => {
    const key = getSectionFeedKey(sportId, sectionMode);
    const stored = sectionFeedModes.value[key];
    if (stored) {
        return { live: !!stored.live, premium: !!stored.premium, virtual: !!stored.virtual };
    }
    return { live: false, premium: false, virtual: false };
};

const isSportFeedLiveActive = (sportId, sectionMode) => getFeedFlagsForSport(sportId, sectionMode).live;
const isSportFeedPremiumActive = (sportId, sectionMode) => getFeedFlagsForSport(sportId, sectionMode).premium;
const isSportFeedVirtualActive = (sportId, sectionMode) => getFeedFlagsForSport(sportId, sectionMode).virtual;

const setSectionFeedMode = (sportId, sectionMode, patch) => {
    const key = getSectionFeedKey(sportId, sectionMode);
    const current = sectionFeedModes.value[key] || { live: false, premium: false, virtual: false };
    sectionFeedModes.value = {
        ...sectionFeedModes.value,
        [key]: { ...current, ...patch },
    };
};

const toggleSectionFeedLive = (sportId, sectionMode) => {
    const { live, premium, virtual } = getFeedFlagsForSport(sportId, sectionMode);
    const nextLive = !live;
    setSectionFeedMode(sportId, sectionMode, {
        live: nextLive,
        premium: nextLive ? false : premium,
        virtual: nextLive ? false : virtual,
    });
};

const toggleSectionFeedPremium = (sportId, sectionMode) => {
    const { live, premium, virtual } = getFeedFlagsForSport(sportId, sectionMode);
    const nextPremium = !premium;
    setSectionFeedMode(sportId, sectionMode, {
        premium: nextPremium,
        live: nextPremium ? false : live,
        virtual: nextPremium ? false : virtual,
    });
};

const toggleSectionFeedVirtual = (sportId, sectionMode) => {
    const { live, premium, virtual } = getFeedFlagsForSport(sportId, sectionMode);
    const nextVirtual = !virtual;
    setSectionFeedMode(sportId, sectionMode, {
        virtual: nextVirtual,
        live: nextVirtual ? false : live,
        premium: nextVirtual ? false : premium,
    });
};

/** Full-page loader only when shared store has no events yet. */
const loading = computed(
    () => eventsStore.eventsLoading && !eventsStore.eventsFetched
);

const SPORT_PRIORITY = ['cricket', 'football', 'tennis'];
const EXCLUDED_TAB_NAMES = ['casino', 'sports book', 'cricket'];

const normalizeEventType = (item) => {
    const id = Number(item?.id ?? item?.event_type_id ?? item?.eventTypeId);
    const name = String(item?.name ?? item?.event_type_name ?? item?.title ?? '').trim();
    if (!Number.isFinite(id) || !name) return null;
    return { id, name };
};

const sportTabs = computed(() => {
    const apiMenu = Array.isArray(eventsStore.eventTypes) ? eventsStore.eventTypes : [];
    const normalizedApiMenu = apiMenu.map(normalizeEventType).filter(Boolean);
    const fallbackMenu = (defaultEventTypes.value || []).map((item) => ({
        id: Number(item.id),
        name: String(item.name || '').trim()
    }));
    const menu = normalizedApiMenu.length > 0 ? normalizedApiMenu : fallbackMenu;

    const filtered = menu.filter((item) => {
        if (!item || !Number.isFinite(Number(item.id)) || !item.name) return false;
        if (!includeInSportNavMenu(item)) return false;
        const lowered = item.name.toLowerCase();
        return !EXCLUDED_TAB_NAMES.some((name) => lowered.includes(name));
    });

    return [...filtered].sort((a, b) => {
        const aName = String(a.name || '').toLowerCase();
        const bName = String(b.name || '').toLowerCase();
        const aIdx = SPORT_PRIORITY.findIndex((name) => aName.includes(name));
        const bIdx = SPORT_PRIORITY.findIndex((name) => bName.includes(name));
        const aRank = aIdx === -1 ? SPORT_PRIORITY.length : aIdx;
        const bRank = bIdx === -1 ? SPORT_PRIORITY.length : bIdx;
        if (aRank !== bRank) return aRank - bRank;
        return aName.localeCompare(bName);
    });
});

// Match bettingClientVue: empty list → time default for all sports (incl. football / tennis)
const COMPETITION_DEFAULT_TYPES = [];

function getDefaultSortView(eventTypeId) {
    return COMPETITION_DEFAULT_TYPES.includes(Number(eventTypeId)) ? 'competition' : 'time';
}

/** Match bettingClientVue: ?view= wins, else getDefaultSortView */
function initSortBy(eventTypeId) {
    const raw = route.query.view;
    const q = Array.isArray(raw) ? raw[0] : raw;
    if (q === 'time' || q === 'competition') return q;
    return getDefaultSortView(eventTypeId);
}

const sortBy = ref(initSortBy(parseInt(route.params.event_type_id, 10)));

// Computed property to get the event type
const eventTypeName = computed(() => {
    return getEventTypeName(event_type_id.value) || t('sports.home.title');
});

// When a competition_id is present, prefer showing that competition's name
const showCompetitionName = computed(() => {
    return competition_id.value != null && !Number.isNaN(competition_id.value);
});

const competitionName = computed(() => {
    if (!showCompetitionName.value) return null;
    const eventsForType = finalData.value?.[0]?.events || [];
    return eventsForType.find(e => e.competition_id === competition_id.value || e.competition_id === competition_id.value?.toString())?.competition_name
        || eventsForType[0]?.competition_name
        || 'Competition';
});

const pageTitle = computed(() => {
    if (showCompetitionName.value && competitionName.value) {
        return competitionName.value;
    }
    const name = String(eventTypeName.value || '').trim();
    if (!name) return 'Sport';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
});

/** Same green SVG icons as home in-play table headers (Live.vue / GamesTableHeader). */
const currentSportIconSrc = computed(() => {
    const id = Number(event_type_id.value);
    const key = getEventTypeById(id)?.key;
    if (key) return sportTableHeaderIconSrc(key);
    return getReferenceSidebarIconSrc({ id, name: eventTypeName.value })
        || sportTableHeaderIconSrc('other');
});
const currentSportIcon = computed(() => getEventTypeIcon(event_type_id.value));

const { starredIds, isEventStarred } = useStarredEvents();

const sportEvents = computed(() => finalData.value?.[0]?.events || []);

const inplayEventsList = computed(() => {
    void starredIds.value;
    const base = sportEvents.value.filter(isInplayEvent);
    const filtered = applyFeedModeToList(base, getFeedFlagsForSport(event_type_id.value, 'inplay'));
    return sortEventsWithStarPriority(filtered, isEventStarred);
});

const upcomingEventsList = computed(() => {
    void starredIds.value;
    const base = sportEvents.value.filter((event) => !isInplayEvent(event));
    const filtered = applyFeedModeToList(base, getFeedFlagsForSport(event_type_id.value, 'upcoming'));
    return sortEventsWithStarPriority(filtered, isEventStarred);
});

const allDisplayedEvents = computed(() => [
    ...inplayEventsList.value,
    ...upcomingEventsList.value,
]);

const oddsTargetEvents = computed(() => {
    const list = allDisplayedEvents.value;
    if (!Array.isArray(list) || list.length === 0) return [];

    const visibleSet = new Set(visibleEventIds.value);
    if (visibleSet.size === 0) {
        return list.slice(0, PRELOAD_ODDS_COUNT);
    }

    const visible = list.filter((event) => visibleSet.has(getEventId(event)));
    if (visible.length > 0) {
        return visible;
    }

    return list.slice(0, PRELOAD_ODDS_COUNT);
});

const addVisibleEventId = (eventId) => {
    if (!eventId) return;
    if (visibleEventIds.value.includes(eventId)) return;
    visibleEventIds.value = [...visibleEventIds.value, eventId];
};

const removeVisibleEventId = (eventId) => {
    if (!eventId) return;
    if (!visibleEventIds.value.includes(eventId)) return;
    visibleEventIds.value = visibleEventIds.value.filter((id) => id !== eventId);
};

const initializeVisibilityObserver = () => {
    if (visibilityObserver || typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    visibilityObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const eventId = observedElements.get(entry.target);
                if (!eventId) return;
                if (entry.isIntersecting) {
                    addVisibleEventId(eventId);
                } else {
                    removeVisibleEventId(eventId);
                }
            });
        },
        {
            root: null,
            threshold: 0,
            rootMargin: VIEWPORT_ROOT_MARGIN
        }
    );
};

const cleanupVisibilityObserver = () => {
    if (visibilityObserver) {
        visibilityObserver.disconnect();
        visibilityObserver = null;
    }
    visibleEventIds.value = [];
};

const vObserveEventVisibility = {
    mounted(el, binding) {
        initializeVisibilityObserver();
        const eventId = String(binding.value ?? '');
        if (!eventId || !visibilityObserver) return;
        observedElements.set(el, eventId);
        visibilityObserver.observe(el);
    },
    updated(el, binding) {
        if (!visibilityObserver) return;
        const nextId = String(binding.value ?? '');
        const prevId = observedElements.get(el);
        if (!nextId) {
            if (prevId) {
                removeVisibleEventId(prevId);
                visibilityObserver.unobserve(el);
                observedElements.delete(el);
            }
            return;
        }
        if (prevId !== nextId) {
            if (prevId) removeVisibleEventId(prevId);
            observedElements.set(el, nextId);
        }
    },
    unmounted(el) {
        const eventId = observedElements.get(el);
        if (eventId) removeVisibleEventId(eventId);
        if (visibilityObserver) visibilityObserver.unobserve(el);
        observedElements.delete(el);
    }
};

// Watch for route parameter changes and refresh list
watch(
    () => ({
        event_type_id: route.params.event_type_id,
        competition_id: route.params.competition_id,
        league: route.query.league
    }),
    (newParams, oldParams) => {
        const typeChanged = oldParams && newParams.event_type_id !== oldParams.event_type_id;
        const competitionChanged = oldParams && newParams.competition_id !== oldParams.competition_id;
        const leagueChanged = oldParams && newParams.league !== oldParams.league;
        if (!typeChanged && !competitionChanged && !leagueChanged) return;
        if (!newParams.event_type_id) return;

        stopOddsFetching();
        cleanupVisibilityObserver();
        events.value = [];
        event_type_id.value = parseInt(newParams.event_type_id);
        competition_id.value = newParams.competition_id != null ? parseInt(newParams.competition_id) : null;
        if (typeChanged || competitionChanged) {
            sortBy.value = initSortBy(event_type_id.value);
        }
        sectionFeedModes.value = {};
        noEvent.value = false;
        loadPrefetchEventDetails({ event_type_id: event_type_id.value });
        applySportFilter();
        watchForEvents();
    },
    { deep: true }
);

// Align with SportsTree sidebar grouping for ?league= filter
function competitionGroupKeyFromEvent(ev) {
    const n = ev?.competition_name;
    if (n == null || n === '') return 'Others';
    const s = String(n).trim();
    if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return 'Others';
    return s;
}

// Filter shared store list client-side — no per-navigation list API.
function applySportFilter() {
    noEvent.value = false;
    error.value = eventsStore.eventsError;

    const leagueRaw = route.query?.league;
    const leagueFilter =
        leagueRaw == null ? '' : Array.isArray(leagueRaw) ? String(leagueRaw[0] ?? '') : String(leagueRaw);

    const filteredEvents = eventsStore.allEvents.filter((event) => {
        const typeMatches = event.event_type_id === event_type_id.value;
        if (!typeMatches) return false;
        if (competition_id.value != null && !Number.isNaN(competition_id.value)) {
            return (
                event.competition_id === competition_id.value ||
                event.competition_id === competition_id.value?.toString()
            );
        }
        if (leagueFilter.trim()) {
            return competitionGroupKeyFromEvent(event) === leagueFilter.trim();
        }
        return true;
    });

    if (filteredEvents.length === 0) {
        noEvent.value = false;
        events.value = [];
        finalData.value = [{
            event_type_id: event_type_id.value,
            event_type_name: eventTypeName.value,
            events: []
        }];
        return;
    }

    noEvent.value = false;
    events.value = filteredEvents;
    finalData.value = [{
        event_type_id: event_type_id.value,
        event_type_name: eventTypeName.value,
        events: filteredEvents
    }];
}

watch(
    () => eventsStore.allEvents,
    () => {
        applySportFilter();
    },
    { deep: true }
);

watch(
    () => eventsStore.eventsError,
    (next) => {
        if (next) error.value = next;
    }
);

// Use OddsDistributor WebSocket for real-time odds
const { startOddsFetching, stopOddsFetching, watchForEvents } = useOddsWebSocket(
    () => oddsTargetEvents.value
);

onMounted(async () => {
    initializeVisibilityObserver();

    // Paint immediately from AppLayout cache when available — no list API from this page.
    applySportFilter();

    const demoPromise = !authStore.isUiAuthenticated
        ? authStore.demoLoginPreview().catch(() => {})
        : Promise.resolve();

    await Promise.all([
        eventsStore.initializeEventTypes(),
        eventsStore.waitForEvents(),
        demoPromise,
    ]);
    loadPrefetchEventDetails({ event_type_id: event_type_id.value });

    applySportFilter();
    watchForEvents();
});

onUnmounted(() => {
    cleanupVisibilityObserver();
    stopOddsFetching();
});

</script>

<template>
    <div
        class="sports-home-layout sport-page-layout sport-page-layout--reference"
        :class="{ 'sports-home-layout--mobile': isMobile }"
    >
        <v-container fluid class="tw-px-0 live-page-container sport-page-container">
            <div class="sport-page-reference-stack">
                <HomeProviderCarousel />
                <HomePromotionQuickActions />

                <Loading v-if="loading" min-height="240px" />

                <div v-else-if="error" class="tw-mt-5 tw-px-4 tw-pb-4">
                    <v-alert type="error" variant="tonal" class="tw-text-center">
                        {{ error }}
                    </v-alert>
                </div>

                <template v-else-if="!noEvent">
                    <div class="home-events-stack">
                        <div class="events-table-section events-table-section--reference">
                            <HomeEventsSectionHeader
                                mode="inplay"
                                :title="t('components.homeEvents.inplayTitle')"
                            />
                            <div class="events-table-section__body">
                                <div class="sport-section-block sport-section-block--first">
                                    <div class="sport-section-header">
                                        <div class="sport-section-header__left">
                                            <div class="sport-section-header__brand">
                                                <span
                                                    v-if="currentSportIconSrc || currentSportIcon"
                                                    class="sport-section-header__icon-wrap"
                                                >
                                                    <img
                                                        v-if="currentSportIconSrc"
                                                        :src="currentSportIconSrc"
                                                        alt=""
                                                        class="sport-section-header__icon"
                                                        width="18"
                                                        height="18"
                                                    />
                                                    <component
                                                        v-else
                                                        :is="currentSportIcon"
                                                        :width="15.37"
                                                        :height="16.63"
                                                        class="sport-section-header__icon"
                                                    />
                                                </span>
                                                <h3 class="sport-section-header__title">
                                                    {{ pageTitle }}
                                                </h3>
                                            </div>
                                            <div class="sport-section-header__filters">
                                                <div class="feed-mode-pills">
                                                    <button
                                                        type="button"
                                                        class="feed-mode-pill"
                                                        :class="{ 'feed-mode-pill--active': isSportFeedLiveActive(event_type_id, 'inplay') }"
                                                        @click="toggleSectionFeedLive(event_type_id, 'inplay')"
                                                    >
                                                        <FeedModePillPrefix :active="isSportFeedLiveActive(event_type_id, 'inplay')" />
                                                        LIVE
                                                    </button>
                                                    <button
                                                        type="button"
                                                        class="feed-mode-pill feed-mode-pill--virtual"
                                                        :class="{ 'feed-mode-pill--active': isSportFeedVirtualActive(event_type_id, 'inplay') }"
                                                        @click="toggleSectionFeedVirtual(event_type_id, 'inplay')"
                                                    >
                                                        <FeedModePillPrefix :active="isSportFeedVirtualActive(event_type_id, 'inplay')" />
                                                        VIRTUAL
                                                    </button>
                                                    <button
                                                        type="button"
                                                        class="feed-mode-pill feed-mode-pill--premium"
                                                        :class="{ 'feed-mode-pill--active': isSportFeedPremiumActive(event_type_id, 'inplay') }"
                                                        @click="toggleSectionFeedPremium(event_type_id, 'inplay')"
                                                    >
                                                        <FeedModePillPrefix :active="isSportFeedPremiumActive(event_type_id, 'inplay')" />
                                                        PREMIUM
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="!isMobile" class="sport-section-header__right">
                                            <span class="sport-section-header__meta-spacer" aria-hidden="true" />
                                            <div class="sport-section-header__market-cols">
                                                <span>1</span>
                                                <span>x</span>
                                                <span>2</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        v-if="!inplayEventsList.length"
                                        class="sports-no-markets-empty sports-no-markets-empty--section"
                                    >
                                        {{ t('sports.home.noMarketsAvailable') }}
                                    </div>
                                    <div
                                        v-for="(event, eventIndex) in inplayEventsList"
                                        :key="`inplay-${event.id}`"
                                        v-observe-event-visibility="getEventId(event)"
                                    >
                                        <EventRow
                                            :event="event"
                                            reference-layout
                                            reference-play-mode="inplay"
                                            :show-competition="false"
                                            :animation-delay="Math.min(eventIndex * 0.02, 0.5)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="events-table-section events-table-section--reference events-table-section--upcoming">
                            <HomeEventsSectionHeader
                                mode="upcoming"
                                :title="t('components.homeEvents.upcomingTitle')"
                            />
                            <div class="events-table-section__body">
                                <div class="sport-section-block sport-section-block--first sport-section-block--upcoming">
                                    <div class="sport-section-header">
                                        <div class="sport-section-header__left">
                                            <div class="sport-section-header__brand">
                                                <span
                                                    v-if="currentSportIconSrc || currentSportIcon"
                                                    class="sport-section-header__icon-wrap"
                                                >
                                                    <img
                                                        v-if="currentSportIconSrc"
                                                        :src="currentSportIconSrc"
                                                        alt=""
                                                        class="sport-section-header__icon"
                                                        width="18"
                                                        height="18"
                                                    />
                                                    <component
                                                        v-else
                                                        :is="currentSportIcon"
                                                        :width="15.37"
                                                        :height="16.63"
                                                        class="sport-section-header__icon"
                                                    />
                                                </span>
                                                <h3 class="sport-section-header__title">
                                                    {{ pageTitle }}
                                                </h3>
                                            </div>
                                            <div class="sport-section-header__filters">
                                                <div class="feed-mode-pills">
                                                    <button
                                                        type="button"
                                                        class="feed-mode-pill"
                                                        :class="{ 'feed-mode-pill--active': isSportFeedLiveActive(event_type_id, 'upcoming') }"
                                                        @click="toggleSectionFeedLive(event_type_id, 'upcoming')"
                                                    >
                                                        <FeedModePillPrefix :active="isSportFeedLiveActive(event_type_id, 'upcoming')" />
                                                        LIVE
                                                    </button>
                                                    <button
                                                        type="button"
                                                        class="feed-mode-pill feed-mode-pill--virtual"
                                                        :class="{ 'feed-mode-pill--active': isSportFeedVirtualActive(event_type_id, 'upcoming') }"
                                                        @click="toggleSectionFeedVirtual(event_type_id, 'upcoming')"
                                                    >
                                                        <FeedModePillPrefix :active="isSportFeedVirtualActive(event_type_id, 'upcoming')" />
                                                        VIRTUAL
                                                    </button>
                                                    <button
                                                        type="button"
                                                        class="feed-mode-pill feed-mode-pill--premium"
                                                        :class="{ 'feed-mode-pill--active': isSportFeedPremiumActive(event_type_id, 'upcoming') }"
                                                        @click="toggleSectionFeedPremium(event_type_id, 'upcoming')"
                                                    >
                                                        <FeedModePillPrefix :active="isSportFeedPremiumActive(event_type_id, 'upcoming')" />
                                                        PREMIUM
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="!isMobile" class="sport-section-header__right">
                                            <span class="sport-section-header__meta-spacer" aria-hidden="true" />
                                            <div class="sport-section-header__market-cols">
                                                <span>1</span>
                                                <span>x</span>
                                                <span>2</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        v-if="!upcomingEventsList.length"
                                        class="sports-no-markets-empty sports-no-markets-empty--section"
                                    >
                                        {{ t('sports.home.noMarketsAvailable') }}
                                    </div>
                                    <div
                                        v-for="(event, eventIndex) in upcomingEventsList"
                                        :key="`upcoming-${event.id}`"
                                        v-observe-event-visibility="getEventId(event)"
                                    >
                                        <EventRow
                                            :event="event"
                                            reference-layout
                                            reference-play-mode="upcoming"
                                            :show-competition="false"
                                            :animation-delay="Math.min(eventIndex * 0.02, 0.5)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <div v-else class="sports-no-markets-empty">
                    {{ t('sports.home.noMarketsAvailable') }}
                </div>
            </div>
        </v-container>
    </div>
</template>

<style scoped>
.sport-page-reference-stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
}

.home-events-stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
}

.events-table-section--reference {
    padding: 0;
    box-sizing: border-box;
}

.events-table-section__body {
    border: 1px solid rgba(84, 84, 84, 0.6);
    border-top: 0;
    border-radius: 0 0 10px 10px;
    overflow: hidden;
    background: var(--color-event-name, #333333);
}

@media (min-width: 1025px) {
    .sport-page-container .events-table-section,
    .sport-page-container .upcoming-match {
        background: var(--color-event-name, #333333);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
    }
}

.sport-page-layout--reference.sports-home-layout {
    gap: 0;
    background: transparent;
}

.sport-page-layout--reference.sports-home-layout--mobile {
    padding: 0;
}

.sport-page-container.live-page-container {
    padding-left: 0;
    padding-right: 0;
}

.tw-blinking-dot {
    animation: tw-blink-animation 1.5s linear infinite;
}

@keyframes tw-blink-animation {

    0%,
    100% {
        color: red;
    }

    50% {
        color: rgba(255, 0, 0, 0.1);
    }
}

/* Toolbar styles live in assets/sport-table-header.css */
.sport-page-toolbar {
    overflow: hidden;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
}

.sport-page-toolbar__left {
    min-width: 0;
}

.view-by-group {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    line-height: 1;
}

.sport-page-toolbar__icon {
    color: #ffffff;
}

.view-by-label {
    margin: 0;
    padding: 0;
    font-size: 10px;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: 0.02em;
    color: #ffffff;
    white-space: nowrap;
}

.sport-filter-select.sport-filter-select--view-by {
    flex: 0 0 auto;
    width: auto;
    min-width: 6.8rem;
    max-width: 8rem;
}

.sport-filter-select.sport-filter-select--view-by :deep(.v-input) {
    margin: 0 !important;
    padding: 0 !important;
    align-items: center;
}

.sport-filter-select.sport-filter-select--view-by :deep(.v-input__control) {
    min-height: 0 !important;
}

.sport-filter-select.sport-filter-select--view-by :deep(.v-field) {
    align-items: center;
    min-height: 18px !important;
    border-radius: 9999px !important;
    background: transparent !important;
    border: 1px solid #ffffff !important;
    box-shadow: none !important;
}

.sport-filter-select.sport-filter-select--view-by :deep(.v-field__input) {
    min-height: 18px !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    padding-inline: 6px 2px !important;
    font-size: 10px !important;
    font-weight: 800 !important;
    line-height: 1 !important;
    letter-spacing: 0.04em !important;
    color: #ffffff !important;
}

.sport-filter-select.sport-filter-select--view-by :deep(.v-field__outline) {
    --v-field-border-opacity: 0;
}

.sport-filter-select.sport-filter-select--view-by :deep(.v-select__selection-text) {
    font-size: 10px !important;
    font-weight: 800 !important;
    line-height: 1.1 !important;
    letter-spacing: 0.04em !important;
    color: #ffffff !important;
}

.sport-filter-select.sport-filter-select--view-by :deep(.v-field__append-inner) {
    align-self: center;
    margin-block: 0 !important;
    padding-top: 0 !important;
    padding-inline-end: 6px !important;
    margin-inline-start: -2px !important;
}

.sport-filter-select.sport-filter-select--view-by :deep(.v-icon) {
    color: #ffffff !important;
    font-size: 11px !important;
}

@media (min-width: 640px) {
    .sport-page-toolbar__title {
        font-size: 0.9rem;
    }
}

.feed-mode-pills {
    flex-shrink: 0;
}

.sport-page-events {
    width: 100%;
    background: #ffffff;
    border-radius: 0;
    overflow: hidden;
}

.sports-home-layout.sport-page-layout {
    display: flex;
    flex-direction: column;
    gap: 25px;
    box-sizing: border-box;
    background: #ffffff;
}

.sport-page-exchange-card {
    box-sizing: border-box;
}

@media (min-width: 1025px) {
    .sport-page-exchange-card .sport-page-toolbar {
        margin-bottom: 0 !important;
        border-radius: 4px 4px 0 0 !important;
        border: none !important;
    }

    .sport-page-exchange-card :deep(.event-row-desktop__meta) {
        width: auto;
        min-width: 0;
        max-width: none;
        justify-content: right;
    }
}

@media (max-width: 640px) {
    .sport-page-toolbar__left {
        flex-wrap: nowrap;
        justify-content: flex-start;
    }

    .sport-page-toolbar__icon-wrap :deep(svg),
    .sport-page-toolbar__icon-wrap :deep(img),
    .sport-page-toolbar__icon {
        width: 15.37px !important;
        height: 16.63px !important;
    }

    .sport-page-toolbar__icon-wrap :deep(.v-icon) {
        font-size: 16px !important;
    }

    .sport-page-toolbar__title {
        font-family: var(--font-family-display);
        font-size: var(--sports-toolbar-title-size-mobile);
        font-weight: var(--sports-toolbar-title-weight-mobile);
        line-height: var(--sports-toolbar-title-line-height-mobile);
        color: #ffffff;
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .feed-mode-pills {
        margin-left: auto;
        margin-right: 0;
        gap: 4px;
        flex-shrink: 0;
    }

    .view-by-group {
        display: inline-flex;
        margin-right: 0;
        gap: 0.15rem;
        align-items: center;
        flex-shrink: 0;
    }

    .view-by-label {
        font-size: 7px;
        font-weight: 800;
        color: #ffffff;
    }

    .sport-filter-select.sport-filter-select--view-by {
        min-width: 4.5rem;
        max-width: 5rem;
    }

    .sport-filter-select.sport-filter-select--view-by :deep(.v-field) {
        min-height: 16px !important;
    }

    .sport-filter-select.sport-filter-select--view-by :deep(.v-field__input),
    .sport-filter-select.sport-filter-select--view-by :deep(.v-select__selection-text) {
        font-size: 7px !important;
        padding-inline: 4px 1px !important;
    }

    .sport-filter-select.sport-filter-select--view-by :deep(.v-icon) {
        font-size: 9px !important;
    }

    /* Legacy non-reference sport rows only — reference home rows use theme.css + EventRow.vue */
    .sports-home-layout.sport-page-layout:not(.sport-page-layout--reference) :deep(.event-row-card) {
        border-top: none !important;
        border-bottom: 1px solid #d1d5db !important;
        background: #ffffff !important;
    }

    .sports-home-layout.sport-page-layout:not(.sport-page-layout--reference) :deep(.event-row-content) {
        padding: 0 !important;
    }

    .sports-home-layout:not(.sport-page-layout--reference) :deep(.event-row-ref-colheads) {
        display: none !important;
    }

    .sports-home-layout:not(.sport-page-layout--reference) :deep(.event-row-ref-odds) {
        margin-top: 2px;
        gap: 2px;
    }

    .sports-home-layout.sport-page-layout:not(.sport-page-layout--reference) :deep(.event-row-ref-btn),
    .sports-home-layout.sport-page-layout:not(.sport-page-layout--reference) :deep(.event-odd-btn) {
        border-radius: 4px;
    }

    .sports-home-layout :deep(.status-badge) {
        min-width: 18px;
        height: 16px;
        border-radius: 9999px;
        /* border: 1px solid #a7822f; */
        /* background: linear-gradient(180deg, #f3dd9f 0%, #c89f4f 100%); */
        background: var(--theme-orange);
        /*linear-gradient(94deg, #b6842d, #ebda8d 55%, #b7862f);*/
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        color: #2d2516 !important;
        letter-spacing: 0.01em;
    }
}

.competition-name-box {
    background: var(--color-nav-deep);
    border: none;
    border-radius: 0;
}

.sports-home-layout {
    display: block;
    min-height: 100%;
    background-color: #ffffff;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

.sports-home-layout--mobile {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    padding: 4px;
    box-sizing: border-box;
}

.sports-home-layout--mobile .sports-home-layout__casino-pane {
    flex: 1 1 42%;
    min-height: 42dvh;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface-alt);
}

.sports-home-main-grid {
    align-items: flex-start;
}

.sports-home-right-rail {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: calc(100vh - 170px);
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 2px;
}

.sports-home-right-rail>* {
    width: 100%;
    flex: 0 0 auto;
}

.sports-home-layout__desktop-casino-inner {
    padding: 0;
    max-height: 285px;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
}

.sports-home-right-rail :deep(.new-launch-grid),
.sports-home-right-rail :deep(.favourites-grid),
.sports-home-right-rail :deep(.slot-grid),
.sports-home-right-rail :deep(.providers-section__grid) {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 6px !important;
    background: transparent !important;
}

.sports-home-right-rail :deep(.new-launch-grid) {
    grid-template-columns: 1fr !important;
}

.sports-home-right-rail :deep(.new-launch-grid__media),
.sports-home-right-rail :deep(.favourites-card__media),
.sports-home-right-rail :deep(.slot-grid__media),
.sports-home-right-rail :deep(.providers-section__media) {
    aspect-ratio: 16 / 9 !important;
}

.sports-home-right-rail :deep(.new-launch-grid__tile),
.sports-home-right-rail :deep(.favourites-card),
.sports-home-right-rail :deep(.slot-grid__card),
.sports-home-right-rail :deep(.providers-section__card) {
    border: 1px solid #b8b8b8 !important;
}

.sports-home-right-rail :deep(.new-launch-grid__caption),
.sports-home-right-rail :deep(.providers-section__name) {
    display: none !important;
}

.sports-home-right-rail :deep(.new-launch-header),
.sports-home-right-rail :deep(.favourites-section__header),
.sports-home-right-rail :deep(.slot-section__header),
.sports-home-right-rail :deep(.providers-section__header) {
    position: sticky !important;
    top: 0 !important;
    z-index: 20 !important;
    background: transparent var(--theme-orange) !important;
    /* background: transparent linear-gradient(94deg, #b6842d, #ebda8d 55%, #b7862f) !important; */
    color: #1f1a10 !important;
}

.sports-home-right-rail :deep(.new-launch-wrap),
.sports-home-right-rail :deep(.slot-section),
.sports-home-right-rail :deep(.providers-section) {
    position: relative !important;
    overflow: visible !important;
}

.sports-home-layout__casino-inner {
    padding: 0;
}

.sports-home-tab-strip {
    display: flex;
    align-items: stretch;
    gap: 0;
    overflow-x: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
    background-color: #0a0a0a;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0;
}

.sports-home-tab-strip::-webkit-scrollbar {
    display: none;
}

.sports-home-tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin: 0;
    border: 0;
    border-right: 1px solid rgba(255, 255, 255, 0.2);
    border-bottom: 3px solid transparent;
    background: transparent;
    color: rgba(255, 255, 255, 0.85);
    padding: 9px 10px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.6px;
    line-height: 1;
    white-space: nowrap;
    text-transform: uppercase;
    cursor: pointer;
    flex-shrink: 0;
    transition: color 0.15s, border-color 0.15s, background-color 0.15s;
}

.sport-page-exchange-wrap {
    border: 1px solid #d1d1d1;
    background: #ececec;
}

/* Desktop: border on wrap so toolbar + rows share one rounded box. */
@media (min-width: 769px) {
    .sport-page-exchange-card {
        border: 1px solid #c5c5c5;
        border-radius: 4px 4px 0 0;
        overflow: hidden;
        background: #ffffff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    }

    .sport-page-exchange-card .sport-page-exchange-wrap {
        border: 1px solid #c5c5c5 !important;
        border-radius: 4px 4px 0 0;
        overflow: hidden;
        background: #ffffff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    }

    .sport-page-exchange-card .sport-page-exchange-wrap>.tw-p-0 {
        background: #efefef;
    }

    .sport-page-exchange-card .sport-page-toolbar {
        margin-bottom: 0 !important;
        border-radius: 4px 4px 0 0 !important;
        border: none !important;
        border-bottom: none !important;
    }

    .sport-page-exchange-card :deep(.event-row-card) {
        border-left: none;
        border-right: none;
        border-bottom: 1px solid #d1d5db;
        margin-top: 0 !important;
    }

    .sport-page-events > div:last-child :deep(.event-row-card) {
        border-bottom: none;
    }

    .sport-page-events > div + div {
        margin-top: 0;
    }
}

.sport-page-container:not(.live-page-container) {
    padding-top: 0;
    padding-left: 12px;
    padding-right: 12px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    overflow: hidden;
}

.sport-page-container .sport-page-exchange-card {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    overflow: hidden;
}

.sport-page-container .sport-page-toolbar,
.sport-page-container .sport-page-toolbar__inner {
    border-top-left-radius: 4px !important;
    border-top-right-radius: 4px !important;
}

@media (max-width: 768px) {
    .sport-page-container {
        padding-top: 0;
        padding-left: 0;
        padding-right: 0;
        padding-bottom: calc(var(--mobile-bottom-nav-height, 72px) + 8px);
    }

    .sport-page-events > div + div {
        margin-top: 1px;
    }

    .sport-page-exchange-wrap {
        background: transparent;
        border: none;
    }

    .sports-home-tab-strip {
        background: linear-gradient(180deg, #fbf6e9 0%, #f3ead2 100%);
        border-top: 1px solid #b08d32;
        border-bottom: 1px solid rgba(0, 0, 0, 0.18);
    }

    .sports-home-tab {
        flex-direction: column;
        gap: 2px;
        padding: 4px 6px 5px;
        min-width: 3.1rem;
        color: #2a2a2a;
        border-right: 1px solid rgba(155, 124, 44, 0.45);
    }

    .sports-home-tab:last-child {
        border-right: none;
    }

    .sports-home-tab:not(.sports-home-tab--active) {
        color: #2a2a2a;
    }

    .sports-home-tab:not(.sports-home-tab--active) .sports-home-tab__icon--mdi,
    .sports-home-tab:not(.sports-home-tab--active) .sports-home-tab__icon--sport {
        color: #2a2a2a !important;
    }

    .sports-home-tab:hover {
        color: #1a1a1a;
        border-bottom-color: rgba(176, 141, 50, 0.65);
    }

    .sports-home-tab--active {
        background: linear-gradient(94deg, #b6842d 0%, #ebda8d 55%, #b7862f 100%);
        color: #1a1a1a;
        border-bottom-color: #9d7728;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
    }

    .sports-home-tab--active .sports-home-tab__icon--mdi,
    .sports-home-tab--active .sports-home-tab__icon--sport {
        color: #1a1a1a !important;
    }

    .sports-home-tab__label {
        font-size: 8px;
        letter-spacing: 0.02em;
        text-align: center;
        max-width: 4rem;
        white-space: normal;
        line-height: 1;
    }

    .sports-home-tab__icon-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transform: scale(0.8);
    }
}

@media (min-width: 769px) {
    .sports-home-tab:hover {
        color: #ffffff;
        border-bottom-color: rgba(255, 255, 255, 0.5);
    }
}

.sports-home-tab__icon {
    flex-shrink: 0;
}

.sports-home-tab__icon--mdi {
    opacity: 0.95;
}

@media (min-width: 769px) {
    .sports-home-tab:not(.sports-home-tab--active) .sports-home-tab__icon--mdi {
        color: rgba(255, 255, 255, 0.85) !important;
    }

    .sports-home-tab--active .sports-home-tab__icon--mdi {
        color: #ffffff !important;
    }

    .sports-home-tab:not(.sports-home-tab--active) .sports-home-tab__icon--sport {
        color: rgba(255, 255, 255, 0.85);
    }

    .sports-home-tab--active .sports-home-tab__icon--sport {
        color: #ffffff;
    }
}

.sports-home-tab__label {
    line-height: 1;
}

@media (min-width: 769px) {
    .sports-home-tab--active {
        color: #ffffff;
        border-bottom-color: #ffffff;
        background: transparent;
    }
}
</style>

<!--
  Teleported select menu — match SportsHome styling.
-->
<style>
.sport-view-by-menu {
    border-radius: 0 !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.35) !important;
    overflow: hidden;
    padding: 0 !important;
    background: var(--color-nav-deep, #0f172a) !important;
}

.sport-view-by-menu .v-list {
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
}

.sport-view-by-menu .v-list-item {
    min-height: 0 !important;
    padding: 8px 12px !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    line-height: 1.15 !important;
    letter-spacing: 0.06em;
    text-transform: uppercase !important;
    color: #ffffff !important;
    border-radius: 0 !important;
}

.sport-view-by-menu .v-list-item__content {
    padding-block: 0 !important;
    min-height: 0 !important;
}

.sport-view-by-menu .v-list-item-title {
    font-size: 11px !important;
    font-weight: 800 !important;
    line-height: 1.15 !important;
    letter-spacing: 0.06em !important;
    text-transform: uppercase !important;
}

.sport-view-by-menu .v-list-item__prepend,
.sport-view-by-menu .v-list-item__append {
    width: 0 !important;
    min-width: 0 !important;
    padding: 0 !important;
}

.sport-view-by-menu .v-list-item--active,
.sport-view-by-menu .v-list-item[aria-selected='true'] {
    background: var(--theme-orange) !important;
    color: #ffffff !important;
}

.sport-view-by-menu .v-list-item:hover {
    background: rgba(242, 108, 32, 0.55) !important;
}

.sport-view-by-menu .v-list-item--active:hover,
.sport-view-by-menu .v-list-item[aria-selected='true']:hover {
    background: var(--theme-orange) !important;
}

.sport-view-by-menu .v-list-item__overlay {
    opacity: 0 !important;
}
</style>
