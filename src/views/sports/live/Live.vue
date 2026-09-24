<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Loading from '@/components/Loading.vue';
import EventRow from '@/components/EventRow.vue';
import FeedModePillPrefix from '@/components/sports/FeedModePillPrefix.vue';
import LiveShowcaseSections from '@/views/sports/live/LiveShowcaseSections.vue';
import HomeEventsSectionHeader from '@/components/home/HomeEventsSectionHeader.vue';
import HomeGameProvidersSection from '@/components/home/HomeGameProvidersSection.vue';
import HomeHorizontalGamesSection from '@/components/home/HomeHorizontalGamesSection.vue';
import PopularGamesSection from '@/views/sports/live/PopularGamesSection.vue';
import HomeSeoFaqAccordion from '@/components/home/HomeSeoFaqAccordion.vue';
import { useEventsStore } from '@/stores/events/events';
import { useAuthStore } from '@/stores/auth';
import { loadPrefetchEventDetails } from '@/composables/useBetEventPrefetch';
import { useEventTypes, HOME_INPLAY_UPCOMING_SPORT_IDS } from '@/composables/useEventTypes';
import { sportTableHeaderIconSrc } from '@/constants/subHeaderIcons.js';
import { useOddsWebSocket } from '@/composables/useOddsWebSocket';
import { useCompetitionGrouping } from '@/composables/useCompetitionGrouping';
import { compareEventsByOpenDate, sortEventsWithStarPriority } from '@/utils/eventStarSort';
import { pruneStarredEventsFromApiResponse, useStarredEvents } from '@/composables/useStarredEvents';
import useDevices from '@/composables/useDevices.js';
import { isLiveFeedEvent } from '@/utils/liveStatus';
import { isPremiumEvent } from '@/utils/premiumStatus';
import { isVirtualEvent } from '@/utils/virtualStatus';

const { getEventTypeName, getEventTypeIcon, getEventTypeById } = useEventTypes();
const { t } = useI18n();
const route = useRoute();
const eventsStore = useEventsStore();
const authStore = useAuthStore();
const { isMobile } = useDevices();
const { starredIds, isEventStarred } = useStarredEvents();

const events = ref([]);
const finalData = ref([]);
/** Full-page loader only when shared store has no events yet. */
const loading = computed(
    () => eventsStore.eventsLoading && !eventsStore.eventsFetched
);
const error = ref(null);
const sortBy = ref('time');
/** Per sport section (event_type_id) feed filters */
const sectionFeedModes = ref({});
const isLiveForGrouping = computed(() => false);

const SPORT_PRIORITY = ['cricket', 'tennis', 'football'];

const selectedSport = ref(-1);

watch(
  () => route.query.sport,
  (sport) => {
    if (sport == null || sport === '') {
      selectedSport.value = -1;
      return;
    }
    const raw = Array.isArray(sport) ? sport[0] : sport;
    const id = Number(raw);
    selectedSport.value = Number.isFinite(id) ? id : -1;
  },
  { immediate: true }
);

/** Home strip: IN-PLAY → inplay only, UPCOMING → upcoming only, sport tile → both. */
const stripFeedMode = computed(() => {
    const feed = route.query.feed;
    const feedValue = Array.isArray(feed) ? feed[0] : feed;
    if (feedValue === 'upcoming' && Number(selectedSport.value) === -1) {
        return 'upcoming';
    }
    if (Number(selectedSport.value) !== -1) {
        return 'combined';
    }
    return 'inplay';
});

const isHomeInplayOrUpcomingView = computed(() => {
    if (Number(selectedSport.value) !== -1) return false;
    const mode = stripFeedMode.value;
    return mode === 'inplay' || mode === 'upcoming';
});

const isRedBlinkingEvent = (event) =>
    isLiveFeedEvent({
        eventName: event?.name,
        competitionName: event?.competition_name,
        inPlay: event?.in_play,
        openDate: event?.open_date
    });

const isInplayEvent = (event) =>
    event?.in_play === true || event?.in_play === 1 || event?.in_play === '1';

const isUpcomingEvent = (event) => !isInplayEvent(event);

const filterEventsByPlayState = (list, { inplay }) => {
    const base = Array.isArray(list) ? list : [];
    return inplay ? base.filter(isInplayEvent) : base.filter(isUpcomingEvent);
};

const applyFeedModeToList = (list, { live, premium, virtual }) => {
    const base = Array.isArray(list) ? list : [];
    if (virtual) {
        return base.filter(isVirtualEvent);
    }
    if (live && premium) {
        return base.filter((e) => isRedBlinkingEvent(e) || isPremiumEvent(e));
    }
    if (live) {
        return base.filter(isRedBlinkingEvent);
    }
    if (premium) {
        return base.filter(isPremiumEvent);
    }
    return base;
};

const isAnySectionFeedFilterActive = computed(() =>
    Object.values(sectionFeedModes.value).some(
        (mode) => mode && (mode.live || mode.premium || mode.virtual)
    )
);

const isFeedFilterActive = computed(() => isAnySectionFeedFilterActive.value);

const getSectionFeedFlags = (sportId) => {
    const key = String(sportId);
    const stored = sectionFeedModes.value[key];
    if (stored) {
        return { live: !!stored.live, premium: !!stored.premium, virtual: !!stored.virtual };
    }
    return { live: false, premium: false, virtual: false };
};

const getFeedFlagsForSport = (sportId) => getSectionFeedFlags(sportId);

const isSportFeedLiveActive = (sportId) => getFeedFlagsForSport(sportId).live;
const isSportFeedPremiumActive = (sportId) => getFeedFlagsForSport(sportId).premium;
const isSportFeedVirtualActive = (sportId) => getFeedFlagsForSport(sportId).virtual;

const setSectionFeedMode = (sportId, patch) => {
    const key = String(sportId);
    const current = sectionFeedModes.value[key] || { live: false, premium: false, virtual: false };
    sectionFeedModes.value = {
        ...sectionFeedModes.value,
        [key]: { ...current, ...patch }
    };
};

const toggleSectionFeedLive = (sportId) => {
    const { live, premium, virtual } = getSectionFeedFlags(sportId);
    const nextLive = !live;
    setSectionFeedMode(sportId, {
        live: nextLive,
        premium: nextLive ? false : premium,
        virtual: nextLive ? false : virtual
    });
};

const toggleSectionFeedPremium = (sportId) => {
    const { live, premium, virtual } = getSectionFeedFlags(sportId);
    const nextPremium = !premium;
    setSectionFeedMode(sportId, {
        premium: nextPremium,
        live: nextPremium ? false : live,
        virtual: nextPremium ? false : virtual
    });
};

const toggleSectionFeedVirtual = (sportId) => {
    const { live, premium, virtual } = getSectionFeedFlags(sportId);
    const nextVirtual = !virtual;
    setSectionFeedMode(sportId, {
        virtual: nextVirtual,
        live: nextVirtual ? false : live,
        premium: nextVirtual ? false : premium
    });
};

// Use OddsDistributor WebSocket for real-time odds
const { startOddsFetching, stopOddsFetching, watchForEvents } = useOddsWebSocket(
    () => events.value,
    {
        onUpdate: (updatedEvents) => {
            const grouped = groupEventsByType(updatedEvents);
            finalData.value = sortEventTypes(grouped);
        }
    }
);

// Filter events for the selected tab
const filteredEvents = computed(() => {
    if (!finalData.value || finalData.value.length === 0) return [];

    let list = Number(selectedSport.value) === -1
        ? finalData.value.flatMap((group) => group.events || [])
        : finalData.value
            .filter((group) => Number(group?.event_type_id) === Number(selectedSport.value))
            .flatMap((group) => group.events || []);

    if (isHomeInplayOrUpcomingView.value) {
        list = list.filter((event) =>
            HOME_INPLAY_UPCOMING_SPORT_IDS.has(Number(event?.event_type_id))
        );
    }

    return list;
});

const feedFilteredInplayEvents = computed(() =>
    applyFeedModeToList(inplayFlatEvents.value, getSectionFeedFlags(selectedSport.value))
);

const groupEventsByCompetition = (eventsList = []) => {
    void starredIds.value;
    const groups = {};
    eventsList.forEach((event) => {
        const key = String(event?.competition_name || t('pages.live.eventTypeFallback', { id: event?.competition_id ?? 'N/A' }));
        if (!groups[key]) {
            groups[key] = {
                name: key,
                events: []
            };
        }
        groups[key].events.push(event);
    });
    return Object.values(groups)
        .map((group) => ({
            ...group,
            events: sortEventsWithStarPriority(group.events, isEventStarred),
        }))
        .sort((a, b) => {
            const aHasStar = a.events.some(isEventStarred);
            const bHasStar = b.events.some(isEventStarred);
            if (aHasStar !== bHasStar) return aHasStar ? -1 : 1;
            return compareEventsByOpenDate(a.events[0], b.events[0]);
        });
};




/** Marketing chrome does not depend on events/list — show immediately. */
const showMarketingSections = true;

const isReferenceHome = computed(
    () => route.name === 'live' || route.name === 'e-sports',
);

const inplayTabData = computed(() => [{
    events: isFeedFilterActive.value
        ? inplaySportSections.value.flatMap((section) => section.events || [])
        : inplayFlatEvents.value
}]);

const upcomingTabData = computed(() => [{
    events: isFeedFilterActive.value
        ? upcomingSportSections.value.flatMap((section) => section.events || [])
        : upcomingFlatEvents.value
}]);

const { sortEvents: sortInplayEvents, groupedEventsByCompetition: inplayGroupedByCompetition } =
    useCompetitionGrouping(inplayTabData, sortBy, isLiveForGrouping);

const { sortEvents: sortUpcomingEvents, groupedEventsByCompetition: upcomingGroupedByCompetition } =
    useCompetitionGrouping(upcomingTabData, sortBy, isLiveForGrouping);

const sortEvents = sortInplayEvents;
const groupedEventsByCompetition = inplayGroupedByCompetition;

const sectionHasVisibleEvents = (sections, groupedCompetition) => {
    if (Number(selectedSport.value) === -1) {
        if (sortBy.value === 'time') {
            return sections.some((s) => (s.events?.length ?? 0) > 0);
        }
        return sections.some((sg) =>
            (sg.competitionGroups ?? []).some((g) => (g.events?.length ?? 0) > 0)
        );
    }
    if (sortBy.value === 'time') {
        return sections.flatMap((s) => s.events || []).length > 0;
    }
    return (groupedCompetition ?? []).some((g) => (g.events?.length ?? 0) > 0);
};

const hasFilteredVisibleInplayEvents = computed(() =>
    sectionHasVisibleEvents(inplaySportSections.value, inplayGroupedByCompetition.value)
);

const hasFilteredVisibleUpcomingEvents = computed(() =>
    sectionHasVisibleEvents(upcomingSportSections.value, upcomingGroupedByCompetition.value)
);

const hasFilteredVisibleEvents = computed(
    () => hasFilteredVisibleInplayEvents.value || hasFilteredVisibleUpcomingEvents.value
);

/** Mobile: empty state only while a feed filter is active and has no matches. */
const showFilterEmptyState = computed(
    () => isFeedFilterActive.value && !hasFilteredVisibleEvents.value
);

const showCombinedEventList = computed(() => {
    if (!finalData.value?.length) return false;
    if (isFeedFilterActive.value) {
        return hasFilteredVisibleEvents.value;
    }
    if (stripFeedMode.value === 'upcoming') {
        return upcomingFlatEvents.value.length > 0;
    }
    if (stripFeedMode.value === 'inplay') {
        return inplayFlatEvents.value.length > 0;
    }
    return inplayFlatEvents.value.length > 0 || upcomingFlatEvents.value.length > 0;
});

const combinedSportSections = computed(() => {
    void starredIds.value;
    const mode = stripFeedMode.value;
    const inplayById = new Map(inplaySportSections.value.map((s) => [Number(s.id), s]));
    const upcomingById = new Map(upcomingSportSections.value.map((s) => [Number(s.id), s]));
    const orderedIds = [];

    const orderSource = mode === 'upcoming'
        ? upcomingSportSections.value
        : inplaySportSections.value;

    for (const section of orderSource) {
        const id = Number(section.id);
        if (!orderedIds.includes(id)) orderedIds.push(id);
    }

    if (mode === 'combined') {
        for (const section of upcomingSportSections.value) {
            const id = Number(section.id);
            if (!orderedIds.includes(id)) orderedIds.push(id);
        }
    }

    return orderedIds.map((id) => {
        const inplay = inplayById.get(id);
        const upcoming = upcomingById.get(id);
        const base = inplay || upcoming;
        const inplayEvents = mode === 'upcoming' ? [] : (inplay?.events ?? []);
        const upcomingEvents = mode === 'inplay' ? [] : (upcoming?.events ?? []);
        return {
            id,
            name: base.name,
            iconSrc: base.iconSrc,
            icon: base.icon,
            inplayEvents,
            upcomingEvents,
        };
    }).filter((section) => {
        if (section.inplayEvents.length > 0 || section.upcomingEvents.length > 0) return true;
        if (!isMobile.value) return false;
        const flags = getFeedFlagsForSport(section.id);
        return flags.live || flags.premium || flags.virtual;
    });
});

// Group events by event type
const groupEventsByType = (eventsList) => {
    const grouped = {};

    eventsList.forEach(event => {
        const eventTypeId = event.event_type_id;
        const eventTypeName = getEventTypeName(eventTypeId) || t('pages.live.eventTypeFallback', { id: eventTypeId });

        if (!grouped[eventTypeId]) {
            grouped[eventTypeId] = {
                event_type_id: eventTypeId,
                event_type_name: eventTypeName,
                events: []
            };
        }

        grouped[eventTypeId].events.push(event);
    });

    return Object.values(grouped);
};

const sortEventTypes = (groupedData) => {
    return groupedData.sort((a, b) => {
        const aName = a.event_type_name.toLowerCase();
        const bName = b.event_type_name.toLowerCase();
        const aIdx = SPORT_PRIORITY.findIndex(s => aName.includes(s));
        const bIdx = SPORT_PRIORITY.findIndex(s => bName.includes(s));
        const aRank = aIdx === -1 ? SPORT_PRIORITY.length : aIdx;
        const bRank = bIdx === -1 ? SPORT_PRIORITY.length : bIdx;
        return aRank - bRank;
    });
};

const buildSportSections = (flatEvents) => {
    void starredIds.value;
    const grouped = groupEventsByType(Array.isArray(flatEvents) ? flatEvents : []);
    return sortEventTypes(grouped)
        .filter((group) => Array.isArray(group?.events) && group.events.length > 0)
        .map((group) => {
            const raw = group.events || [];
            const sportId = Number(group.event_type_id);
            const eventsForDisplay = applyFeedModeToList(raw, getFeedFlagsForSport(sportId));
            const starSortedEvents = sortEventsWithStarPriority(eventsForDisplay, isEventStarred);
            return {
                id: Number(group.event_type_id),
                name: String(group.event_type_name || getEventTypeName(group.event_type_id) || ''),
                iconSrc: sportTableHeaderIconSrc(getEventTypeById(Number(group.event_type_id))?.key),
                icon: getEventTypeIcon(Number(group.event_type_id)),
                events: starSortedEvents,
                competitionGroups: groupEventsByCompetition(starSortedEvents)
            };
        })
        .filter((section) => {
            if (section.events.length > 0) return true;
            if (!isMobile.value) return true;
            // On mobile, keep the section if a feed filter is active so the
            // header remains visible and an empty-state message can be shown.
            const flags = getFeedFlagsForSport(section.id);
            return flags.live || flags.premium || flags.virtual;
        });
};

const inplayFlatEvents = computed(() =>
    filterEventsByPlayState(filteredEvents.value, { inplay: true })
);

const upcomingFlatEvents = computed(() =>
    filterEventsByPlayState(filteredEvents.value, { inplay: false })
);

const inplaySportSections = computed(() => buildSportSections(inplayFlatEvents.value));

const upcomingSportSections = computed(() => buildSportSections(upcomingFlatEvents.value));

const referenceInplaySections = computed(() =>
    inplaySportSections.value
        .map((section) => ({
            id: section.id,
            name: section.name,
            iconSrc: section.iconSrc,
            icon: section.icon,
            inplayEvents: section.events ?? [],
            upcomingEvents: [],
        }))
        .filter((section) => {
            if (section.inplayEvents.length > 0) return true;
            if (!isMobile.value) return false;
            const flags = getFeedFlagsForSport(section.id);
            return flags.live || flags.premium || flags.virtual;
        }),
);

const referenceUpcomingSections = computed(() =>
    upcomingSportSections.value
        .map((section) => ({
            id: section.id,
            name: section.name,
            iconSrc: section.iconSrc,
            icon: section.icon,
            inplayEvents: [],
            upcomingEvents: section.events ?? [],
        }))
        .filter((section) => section.upcomingEvents.length > 0),
);

const activeEventSections = computed(() =>
    isReferenceHome.value ? referenceInplaySections.value : combinedSportSections.value,
);

const showReferenceInplayContent = computed(() => {
    if (!isReferenceHome.value) return false;
    if (loading.value || error.value) return false;
    if (showFilterEmptyState.value) return true;
    return referenceInplaySections.value.some((section) => section.inplayEvents.length > 0);
});

const showReferenceUpcomingContent = computed(
    () => isReferenceHome.value && referenceUpcomingSections.value.length > 0,
);

// Fetch live events — delegates to the events store so the request is shared with
// the sidebar (SportsTree) via the store's in-flight deduplication.
const applyLiveEvents = (allEventsList) => {
    const list = Array.isArray(allEventsList) ? allEventsList : [];
    pruneStarredEventsFromApiResponse(list);
    events.value = list;
    finalData.value = sortEventTypes(groupEventsByType(list));
};

onMounted(async () => {
    loadPrefetchEventDetails({ in_play: true });

    // Silent preview demo — sets session cookie for odds WS; does not count as logged-in.
    const demoPromise = !authStore.isUiAuthenticated
        ? authStore.demoLoginPreview().catch(() => {})
        : Promise.resolve();

    // Paint from AppLayout cache when available — this page never starts GET /events/list.
    if (eventsStore.eventsFetched) {
        applyLiveEvents(eventsStore.allEvents);
    }

    try {
        error.value = null;
        const [, allEventsList] = await Promise.all([
            demoPromise,
            eventsStore.waitForEvents(),
        ]);
        applyLiveEvents(allEventsList);
    } catch (err) {
        console.error(t('pages.live.fetchError'), err);
        error.value = err.message || t('pages.live.failedToLoad');
        finalData.value = [];
    }

    requestAnimationFrame(() => {
        watchForEvents();
    });
});

watch(
    () => eventsStore.allEvents,
    (list) => {
        if (!eventsStore.eventsFetched) return;
        applyLiveEvents(list);
    },
    { deep: true }
);

watch(
    () => eventsStore.eventsError,
    (next) => {
        if (next) error.value = next;
    }
);

onUnmounted(() => {
    stopOddsFetching();
});
</script>

<template>
    <v-container fluid class="tw-px-0 live-page-container">
        <v-row no-gutters class="sports-home-main-grid">
            <v-col cols="12" class="tw-p-0">
                <div class="inplay-main tw-text-textLight1 tw-text-sm tw-min-w-0">
                    <div class="tw-p-0">
                        <div class="tw-pb-0 lg:tw-pb-0">
                            <!-- Reference home: In Play → image sections → Upcoming events -->
                            <template v-if="isReferenceHome">
                                <div class="home-events-stack">
                                    <div class="events-table-section events-table-section--reference">
                                        <Loading v-if="loading" min-height="240px" />

                                        <div v-else-if="error" class="tw-mt-5 tw-px-4 tw-pb-4">
                                            <v-alert type="error" variant="tonal" class="tw-text-center">
                                                {{ error }}
                                            </v-alert>
                                        </div>

                                        <template v-else>
                                            <HomeEventsSectionHeader
                                                mode="inplay"
                                                :title="t('components.homeEvents.inplayTitle')"
                                            />
                                            <div class="events-table-section__body">
                                                <div v-if="showFilterEmptyState" class="sports-no-markets-empty">
                                                    {{ t('sports.home.noMarketsAvailable') }}
                                                </div>
                                                <template v-else-if="showReferenceInplayContent">
                                                    <div
                                                        v-for="(sportGroup, sportIndex) in referenceInplaySections"
                                                        :key="`inplay-${sportGroup.id}`"
                                                        class="sport-section-block"
                                                        :class="{ 'sport-section-block--first': sportIndex === 0 }"
                                                    >
                                                        <div class="sport-section-header">
                                                            <div class="sport-section-header__left">
                                                                <div class="sport-section-header__brand">
                                                                    <span
                                                                        v-if="sportGroup.iconSrc || sportGroup.icon"
                                                                        class="sport-section-header__icon-wrap"
                                                                    >
                                                                        <img
                                                                            v-if="sportGroup.iconSrc"
                                                                            :src="sportGroup.iconSrc"
                                                                            alt=""
                                                                            class="sport-section-header__icon"
                                                                            width="18"
                                                                            height="18"
                                                                        />
                                                                        <component
                                                                            v-else
                                                                            :is="sportGroup.icon"
                                                                            :width="15.37"
                                                                            :height="16.63"
                                                                            class="sport-section-header__icon"
                                                                        />
                                                                    </span>
                                                                    <h3 class="sport-section-header__title">
                                                                        {{ sportGroup.name }}
                                                                    </h3>
                                                                </div>
                                                                <div class="sport-section-header__filters">
                                                                    <div class="feed-mode-pills">
                                                                        <button
                                                                            type="button"
                                                                            class="feed-mode-pill"
                                                                            :class="{ 'feed-mode-pill--active': isSportFeedLiveActive(sportGroup.id) }"
                                                                            @click="toggleSectionFeedLive(sportGroup.id)"
                                                                        >
                                                                            <FeedModePillPrefix :active="isSportFeedLiveActive(sportGroup.id)" />
                                                                            LIVE
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            class="feed-mode-pill feed-mode-pill--virtual"
                                                                            :class="{ 'feed-mode-pill--active': isSportFeedVirtualActive(sportGroup.id) }"
                                                                            @click="toggleSectionFeedVirtual(sportGroup.id)"
                                                                        >
                                                                            <FeedModePillPrefix :active="isSportFeedVirtualActive(sportGroup.id)" />
                                                                            VIRTUAL
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            class="feed-mode-pill feed-mode-pill--premium"
                                                                            :class="{ 'feed-mode-pill--active': isSportFeedPremiumActive(sportGroup.id) }"
                                                                            @click="toggleSectionFeedPremium(sportGroup.id)"
                                                                        >
                                                                            <FeedModePillPrefix :active="isSportFeedPremiumActive(sportGroup.id)" />
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
                                                            v-if="!sportGroup.inplayEvents.length"
                                                            class="sports-no-markets-empty sports-no-markets-empty--section"
                                                        >
                                                            {{ t('sports.home.noMarketsAvailable') }}
                                                        </div>
                                                        <EventRow
                                                            v-for="(event, eventIndex) in sportGroup.inplayEvents"
                                                            :key="`ref-in-${event.id}`"
                                                            :event="event"
                                                            reference-layout
                                                            reference-play-mode="inplay"
                                                            :show-competition="false"
                                                            :animation-delay="Math.min((sportIndex * 100 + eventIndex) * 0.02, 0.5)"
                                                        />
                                                    </div>
                                                </template>
                                                <div v-else class="sports-no-markets-empty">
                                                    {{ t('sports.home.noMarketsAvailable') }}
                                                </div>
                                            </div>
                                        </template>
                                    </div>

                                    <template v-if="showMarketingSections">
                                        <HomeGameProvidersSection />
                                        <HomeHorizontalGamesSection
                                            title="Indian Card Games"
                                            use-reference-images
                                            :see-all-query="{ provider: 'MAC88' }"
                                        />
                                    </template>

                                    <div
                                        v-if="showReferenceUpcomingContent"
                                        class="events-table-section events-table-section--reference events-table-section--upcoming"
                                    >
                                        <HomeEventsSectionHeader
                                            mode="upcoming"
                                            :title="t('components.homeEvents.upcomingTitle')"
                                        />
                                        <div class="events-table-section__body">
                                            <div
                                                v-for="(sportGroup, sportIndex) in referenceUpcomingSections"
                                                :key="`upcoming-${sportGroup.id}`"
                                                class="sport-section-block sport-section-block--upcoming"
                                                :class="{ 'sport-section-block--first': sportIndex === 0 }"
                                            >
                                                <div class="sport-section-header">
                                                    <div class="sport-section-header__left">
                                                        <div class="sport-section-header__brand">
                                                            <span
                                                                v-if="sportGroup.iconSrc || sportGroup.icon"
                                                                class="sport-section-header__icon-wrap"
                                                            >
                                                                <img
                                                                    v-if="sportGroup.iconSrc"
                                                                    :src="sportGroup.iconSrc"
                                                                    alt=""
                                                                    class="sport-section-header__icon"
                                                                    width="18"
                                                                    height="18"
                                                                />
                                                                <component
                                                                    v-else
                                                                    :is="sportGroup.icon"
                                                                    :width="15.37"
                                                                    :height="16.63"
                                                                    class="sport-section-header__icon"
                                                                />
                                                            </span>
                                                            <h3 class="sport-section-header__title">
                                                                {{ sportGroup.name }}
                                                            </h3>
                                                        </div>
                                                        <div class="sport-section-header__filters">
                                                            <div class="feed-mode-pills">
                                                                <button
                                                                    type="button"
                                                                    class="feed-mode-pill"
                                                                    :class="{ 'feed-mode-pill--active': isSportFeedLiveActive(sportGroup.id) }"
                                                                    @click="toggleSectionFeedLive(sportGroup.id)"
                                                                >
                                                                    <FeedModePillPrefix :active="isSportFeedLiveActive(sportGroup.id)" />
                                                                    LIVE
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    class="feed-mode-pill feed-mode-pill--virtual"
                                                                    :class="{ 'feed-mode-pill--active': isSportFeedVirtualActive(sportGroup.id) }"
                                                                    @click="toggleSectionFeedVirtual(sportGroup.id)"
                                                                >
                                                                    <FeedModePillPrefix :active="isSportFeedVirtualActive(sportGroup.id)" />
                                                                    VIRTUAL
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    class="feed-mode-pill feed-mode-pill--premium"
                                                                    :class="{ 'feed-mode-pill--active': isSportFeedPremiumActive(sportGroup.id) }"
                                                                    @click="toggleSectionFeedPremium(sportGroup.id)"
                                                                >
                                                                    <FeedModePillPrefix :active="isSportFeedPremiumActive(sportGroup.id)" />
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
                                                <EventRow
                                                    v-for="(event, eventIndex) in sportGroup.upcomingEvents"
                                                    :key="`ref-up-${event.id}`"
                                                    :event="event"
                                                    reference-layout
                                                    reference-play-mode="upcoming"
                                                    :show-competition="false"
                                                    :show-upcoming-odds-overlay="true"
                                                    :animation-delay="Math.min((sportIndex * 100 + eventIndex) * 0.02, 0.5)"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div v-if="showMarketingSections" class="live-showcase live-showcase--reference-home">
                                        <PopularGamesSection reference-layout />
                                        <HomeSeoFaqAccordion />
                                    </div>
                                </div>
                            </template>

                            <!-- Default live page layout -->
                            <template v-else>
                                <div class="events-table-section">
                                    <Loading v-if="loading" min-height="240px" />

                                    <div v-else-if="error" class="tw-mt-5 tw-px-4 tw-pb-4">
                                        <v-alert type="error" variant="tonal" class="tw-text-center">
                                            {{ error }}
                                        </v-alert>
                                    </div>

                                    <div v-else-if="showFilterEmptyState" class="sports-no-markets-empty">
                                        {{ t('sports.home.noMarketsAvailable') }}
                                    </div>

                                    <template v-else-if="showCombinedEventList">
                                        <div v-for="(sportGroup, sportIndex) in activeEventSections"
                                            :key="sportGroup.id" class="sport-section-block"
                                            :class="{
                                                'sport-section-block--first': sportIndex === 0,
                                                'sport-section-block--empty': !sportGroup.inplayEvents.length && !sportGroup.upcomingEvents.length
                                            }">
                                            <div class="sport-section-header">
                                                <div class="sport-section-header__left">
                                                    <div class="sport-section-header__brand">
                                                        <span v-if="sportGroup.iconSrc || sportGroup.icon"
                                                            class="sport-section-header__icon-wrap">
                                                            <img v-if="sportGroup.iconSrc"
                                                                :src="sportGroup.iconSrc" alt=""
                                                                class="sport-section-header__icon" />
                                                            <component v-else :is="sportGroup.icon" :width="15.37"
                                                                :height="16.63" class="sport-section-header__icon" />
                                                        </span>
                                                        <h2 class="sport-section-header__title">
                                                            {{ sportGroup.name }}
                                                        </h2>
                                                    </div>
                                                </div>
                                            </div>
                                            <div v-if="!sportGroup.inplayEvents.length && !sportGroup.upcomingEvents.length"
                                                class="sports-no-markets-empty sports-no-markets-empty--section">
                                                {{ t('sports.home.noMarketsAvailable') }}
                                            </div>
                                            <template v-else>
                                                <EventRow v-for="(event, eventIndex) in sportGroup.inplayEvents"
                                                    :key="`in-${event.id}`" :event="event"
                                                    :show-competition="!isMobile"
                                                    :animation-delay="Math.min((sportIndex * 100 + eventIndex) * 0.02, 0.5)" />
                                                <EventRow v-for="(event, eventIndex) in sportGroup.upcomingEvents"
                                                    :key="`up-${event.id}`" :event="event"
                                                    :show-competition="!isMobile"
                                                    :show-upcoming-odds-overlay="stripFeedMode === 'upcoming' || stripFeedMode === 'combined'"
                                                    :animation-delay="Math.min((sportIndex * 100 + sportGroup.inplayEvents.length + eventIndex) * 0.02, 0.5)" />
                                            </template>
                                        </div>
                                    </template>

                                    <div v-else-if="!showCombinedEventList" class="sports-no-markets-empty">
                                        {{ t('sports.home.noMarketsAvailable') }}
                                    </div>
                                </div>

                                <LiveShowcaseSections
                                    v-if="showMarketingSections"
                                    :class="{ 'live-mobile-showcase': isMobile }"
                                />
                            </template>

                        </div>
                    </div>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<style scoped>
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

/* Disabled button styling - keep original colors with very light overlay */
.v-btn:disabled {
    opacity: 0.5 !important;
}

.sport-filter-select :deep(.v-field__input) {
    color: #ffffff !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    padding-inline: 0.3rem !important;
    font-size: 0.7rem !important;
    font-weight: 700 !important;
    min-height: 26px !important;
}

.sport-filter-select :deep(.v-field__prefix) {
    color: rgba(255, 255, 255, 0.6) !important;
    font-size: 0.7rem !important;
    font-weight: 400 !important;
    padding-left: 0.4rem !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
}

.sport-filter-select :deep(.v-field) {
    background: var(--color-nav-deep) !important;
    border-radius: 6px !important;
    border: 1px solid rgba(255, 255, 255, 0.14) !important;
    min-height: 26px !important;
    box-shadow: none !important;
}

.sport-filter-select :deep(.v-field:hover) {
    border-color: rgba(255, 255, 255, 0.28) !important;
}

.sport-filter-select :deep(.v-select__selection-text) {
    color: #ffffff !important;
    font-size: 0.7rem !important;
    font-weight: 700 !important;
}

.sport-filter-select :deep(.v-field__append-inner) {
    padding-top: 0 !important;
}

.sport-filter-select :deep(.v-icon) {
    color: rgba(255, 255, 255, 0.8) !important;
    font-size: 0.8rem !important;
}

.sport-filter-select :deep(.v-field__outline) {
    color: rgba(255, 255, 255, 0.35) !important;
}

.sport-filter-select.sport-filter-select--header :deep(.v-field) {
    background:var(--theme-orange) !important;
    /* linear-gradient(94deg, #b6842d, #ebda8d 55%, #b7862f) !important;*/
    border: 1px solid rgba(157, 119, 41, 0.85) !important;
    border-radius: 9999px !important;
}

.sport-filter-select.sport-filter-select--header :deep(.v-field__input) {
    color: #2d2416 !important;
    font-size: 8px !important;
    font-weight: 800 !important;
    letter-spacing: 0.03em !important;
    text-transform: uppercase !important;
    min-height: 18px !important;
    padding-inline: 6px 3px !important;
}

.sport-filter-select.sport-filter-select--header :deep(.v-select__selection-text) {
    color: #2d2416 !important;
    font-size: 8px !important;
    font-weight: 800 !important;
    letter-spacing: 0.03em !important;
    text-transform: uppercase !important;
}

.sport-filter-select.sport-filter-select--header :deep(.v-icon) {
    color: rgba(45, 36, 22, 0.9) !important;
    font-size: 10px !important;
}

:deep(.live-header-select-menu) {
    background: #2f3136 !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    border-radius: 8px !important;
    overflow: hidden;
}

:global(.live-header-select-menu) {
    background: #2f3136 !important;
}

:global(.live-header-select-menu .v-list) {
    background: #2f3136 !important;
    color: #ffffff !important;
    padding: 4px 0 !important;
}

:global(.live-header-select-menu .v-list-item) {
    min-height: 34px !important;
    color: #ffffff !important;
}

:global(.live-header-select-menu .v-list-item-title) {
    color: #ffffff !important;
    font-size: 0.82rem !important;
    font-weight: 600 !important;
}

:global(.live-header-select-menu .v-list-item:hover) {
    background: rgba(255, 255, 255, 0.12) !important;
}

:global(.live-header-select-menu .v-list-item--active) {
    background: rgba(214, 179, 89, 0.28) !important;
}

.competition-name-box {
    background: var(--theme-orange);
    /*linear-gradient(94deg, #b6842d, #ebda8d 55%, #b7862f);*/
    border: 1px solid #9d7728;
    border-radius: 0;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.sports-home-tab-strip {
    display: none;
    align-items: stretch;
    gap: 0;
    overflow-x: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
    background-color: var(--color-nav-deep);
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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

.live-page-container {
    padding-top: 0px;
    padding-bottom: 0px;
    min-height: 100%;
    /* background-color: #1a1a1a; */
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

.inplay-main {
    width: 100%;
}

.events-table-section,
.upcoming-match {
    width: 100%;
}

.home-events-stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
}

.events-table-section--reference {
    padding: 0 6px;
    box-sizing: border-box;
}

@media (max-width: 767.98px) {
    .events-table-section--reference {
        padding: 0;
    }
}

.events-table-section__body {
    border: 1px solid rgba(84, 84, 84, 0.6);
    border-top: 0;
    border-radius: 0 0 10px 10px;
    overflow: hidden;
    background: var(--color-event-name, #333333);
}

@media (min-width: 1025px) {
    .live-page-container .events-table-section,
    .live-page-container .upcoming-match {
        background: var(--color-event-name, #333333);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
    }
}

@media (max-width: 768px) {
    .live-page-container {
        padding-top: 0;
        padding-bottom: 0;
        min-height: auto;
    }

    .sports-home-tab-strip {
        display: flex;
        background: #dcdcdc;
        border-top: 1px solid #8b6914;
        border-bottom: 1px solid #8b6914;
    }

    .sports-home-tab {
        flex-direction: column;
        gap: 2px;
        padding: 4px 6px 5px;
        min-width: 3.1rem;
        color: #2a2a2a;
        border-right: 1px solid #b8b8b8;
        background: #dcdcdc;
    }

    .sports-home-tab:last-child {
        border-right: none;
    }

    /* Inactive tab icon/label colors on the light strip */
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

    /* Active tab: vertical gold → bronze (reference mobile navbar) */
    .sports-home-tab--active {
        background: var(--theme-orange);
         /* linear-gradient(180deg, #f3e2a8 0%, #e4c45a 38%, #c9a032 72%, #8b6914 100%); */
        color: #1a1a1a;
        border-bottom-color: #6b4a12;
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

    /* Trending GIF strip (mobile): tile shrinks to image height (no letterboxing) */
    .live-mobile-feature-grid :deep(.gif-grid) {
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 2px !important;
        padding: 0 4px !important;
    }

    .live-mobile-feature-grid :deep(.gif-item-wrap) {
        display: block !important;
        background: transparent !important;
        border-radius: 3px;
        overflow: hidden;
        line-height: 0;
    }

    .live-mobile-feature-grid :deep(.gif-item) {
        width: 100%;
        height: auto;
        aspect-ratio: unset;
        object-fit: cover;
        border-radius: 3px;
        display: block;
    }

    .live-page-container .tw-text-textLight1.tw-text-sm.tw-min-w-0 {
        width: 100%;
        max-width: 100%;
    }

    .live-mobile-showcase {
        margin-top: 12px;
    }

    .live-page-container .events-table-section {
        padding: 0 0px;
    }

    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-block {
        margin: 0 0 10px;
        border: none;
        border-radius: 0;
        overflow: visible;
        background: transparent;
        isolation: isolate;
    }

    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-block--first {
        margin-top: 0;
    }

    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-block :deep(.event-row-card) {
        border-left: 1px solid #d1d5db;
        border-right: 1px solid #d1d5db;
        border-top: none;
        border-radius: 0;
        margin-top: 0;
    }

    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-block :deep(.sport-section-header + .event-row-card) {
        margin-top: 0 !important;
    }

    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-block :deep(.event-row-card + .event-row-card) {
        margin-top: 1px;
    }

    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-block :deep(.event-row-card:last-child) {
        border-bottom: 1px solid #d1d5db;
    }

    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-header {
        height: 37px;
        min-height: 37px;
        border-radius: 4px 4px 0 0;
        overflow: hidden;
    }

    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-header__left {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        flex: 1 1 0%;
        width: auto;
        min-width: 0;
        max-width: 100%;
        gap: 4px;
        padding: 0;
    }

    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-header__brand {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        flex: 0 1 auto;
        overflow: hidden;
    }

    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-header__icon-wrap {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-left: 12px;
    }

    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-header__icon-wrap :deep(img),
    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-header__icon-wrap :deep(.sport-nav-icon),
    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-header__icon {
        width: 15.37px;
        height: 16.63px;
        object-fit: contain;
    }

    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-header__title {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: normal;
        text-transform: uppercase;
    }

    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-header__filters {
        margin-left: auto;
        margin-right: 0;
        transform: translateX(4px);
        gap: 4px;
        flex-shrink: 0;
    }

    .live-page-container .events-table-section:not(.events-table-section--reference) .sport-section-header__filters .feed-mode-pill {
        padding: 3px 8px;
        min-height: 18px;
        font-size: 12px;
        text-transform: none;
        letter-spacing: 0.01em;
    }

    .live-inplay-header+div.tw-pb-5 {
        padding-top: 0;
    }

    .live-inplay-header-wrap {
        width: 100%;
        background: #ffffff;
    }

    .live-inplay-header.live-inplay-header--mobile {
        justify-content: space-between;
        gap: 8px;
        height: 38px;
        min-height: 38px;
        max-height: 38px;
        margin: 0;
        padding: 0 10px;
        border: none;
        border-radius: 0;
        border-bottom: none;
        background: var(--theme-primary-gradient) !important;
        clip-path: none;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.45),
            inset 0 -1px 0 rgba(0, 0, 0, 0.08);
    }

    .live-inplay-header.live-inplay-header--mobile .live-inplay-header__play-cutout {
        display: block;
        flex-shrink: 0;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
    }

    .live-inplay-header.live-inplay-header--mobile .live-inplay-header__title {
        color: #ffffff;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
    }

    .live-inplay-header.live-inplay-header--mobile .live-inplay-header__filters {
        gap: 4px;
        margin-right: clamp(38px, 14vw, 62px);
    }

    .live-inplay-header.live-inplay-header--mobile .feed-mode-pill {
        padding: 8px 7px;
        min-height: 24px;
        font-size: 10px;
    }

    .live-inplay-header.live-inplay-header--mobile .feed-mode-pill--active {
        background: #00ad6f;
        border-color: transparent;
        color: #ffffff;
    }

    .live-inplay-header-wrap+div.tw-pb-5 {
        padding-top: 0;
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

.feed-mode-pills {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    gap: 4px;
}

.feed-mode-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 1px;
    margin: 0;
    padding: 8px 10px;
    min-height: 26px;
    box-sizing: border-box;
    border-radius: 9999px;
    border: 1px solid #ffffff;
    background: transparent;
    box-shadow: none;
    color: #ffffff;
    font-size: 12px; /*9px*/
    font-weight: 600; /*400*/
    line-height: 1;
    letter-spacing: 0.02em;
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

.feed-mode-pill__prefix {
    font-weight: 800;
    opacity: 1;
}

.feed-mode-pill--active {
    background: #00ad6f;
    border-color: transparent;
    color: #ffffff;
    box-shadow: none;
}

.feed-mode-pill--active :deep(.feed-mode-pill__prefix-icon) {
    color: #ffffff !important;
}

.live-inplay-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 36px;
    padding: 0 12px;
}

.live-inplay-header:not(.live-inplay-header--mobile) {
    background: #f5f5f5;
    border-bottom: 1px solid #e8e8e8;
}

.live-inplay-header__start {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.live-inplay-header__filters {
    margin-left: auto;
}

.live-inplay-header__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #f57c00;
    flex-shrink: 0;
}

.live-inplay-header__title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #404040;
    text-transform: uppercase;
    line-height: 1;
}

.sport-section-header__brand {
    min-width: 0;
    flex: 0 1 auto;
    overflow: hidden;
}

.sport-section-header__filters {
    flex-shrink: 0;
}

.sports-home-main-grid {
    align-items: flex-start;
}

/* Desktop (lg+): rounded card per sport section (Cricket, Football, …) */
@media (min-width: 1025px) {
    .live-inplay-header:not(.live-inplay-header--mobile) {
        background: #f5f5f5;
        border: none;
        border-bottom: none;
        box-shadow: none;
        min-height: 34px;
        padding: 0 10px;
    }

    .live-inplay-header:not(.live-inplay-header--mobile) .live-inplay-header__start {
        gap: 8px;
    }

    .live-inplay-header:not(.live-inplay-header--mobile) .live-inplay-header__title {
        background: none;
        border: none;
        padding: 0;
        font-size: 12px;
        font-weight: 700;
        color: #404040;
    }

    .sport-section-block {
        margin-top: 4px;
        border: none;
        border-radius: 0;
        overflow: visible;
        background: transparent;
        box-shadow: none;
    }

    .sport-section-block--first,
    .live-page-container .live-inplay-header+div.tw-pb-5>.sport-section-block:first-child {
        margin-top: 0;
    }

    .sport-section-block .sport-section-header__title {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .sport-section-block :deep(.event-row-content) {
        padding: 0;
        height: 100%;
    }

    .sport-section-block :deep(.event-row-desktop__meta) {
        width: 108px;
        min-width: 108px;
        max-width: 108px;
        padding: 0 20px;
        box-sizing: border-box;
        justify-content: right;
    }

    .sport-section-block .competition-name-box {
        margin: 0;
        border-radius: 0;
        border-left: none;
        border-right: none;
        border-top: none;
    }

    .sport-section-block :deep(.event-row-card) {
        border-left: 1px solid #d1d5db;
        border-right: 1px solid #d1d5db;
        border-bottom: 1px solid #d1d5db;
        margin-top: 1px;
        height: 44px;
        min-height: 44px;
    }

    .sport-section-block :deep(.event-row-card:last-child) {
        border-bottom: 1px solid #d1d5db;
    }
}

.live-showcase {
    width: 100%;
    margin-top: 0;
    background: transparent;
}

.live-showcase--reference-home {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.live-showcase__bottom-text {
    margin-top: 8px;
}

</style>
