<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Loading from '@/components/Loading.vue';
import EventRow from '@/components/EventRow.vue';
import EventSliderCompact from '@/views/sports/Home/EventSliderCompact.vue';
import NewLaunchGames from '@/views/sports/Home/NewLaunchGames.vue';
import FavoriteCasinoGames from '@/views/sports/Home/FavoriteCasinoGames.vue';
import ProvidersSection from '@/views/sports/Home/ProvidersSection.vue';
import StaticSlotSection from '@/views/sports/Home/StaticSlotSection.vue';
import { getEventTypes } from '@/api/event/eventTypes';
import { useEventTypes, includeInSportNavMenu } from '@/composables/useEventTypes';
import { useOddsWebSocket } from '@/composables/useOddsWebSocket';
import { useCompetitionGrouping } from '@/composables/useCompetitionGrouping';
import { useStarredEvents } from '@/composables/useStarredEvents';
import { compareEventsWithStarPriority } from '@/utils/eventStarSort';
import { isPremiumEvent } from '@/utils/premiumStatus';
import { useAuthStore } from '@/stores/auth';
import { useEventsStore } from '@/stores/events/events';
import { useFeaturedEventsStore } from '@/stores/events/featuredEvents';
import useDevices from '@/composables/useDevices.js';
import { insertQuickGameTabsAfterTennis, isQuickGameTab } from '@/composables/useQuickGameTabs';
import InplayIcon from '@/components/Icons/Inplay.vue';

const { getEventTypeName, eventTypes: defaultEventTypes, getEventTypeIcon } = useEventTypes();
const router = useRouter();
const authStore = useAuthStore();
const eventsStore = useEventsStore();
const featuredEventsStore = useFeaturedEventsStore();
const { isMobile } = useDevices();

const loading = ref(true);
const error = ref(null);
const noEvent = ref(false);
const allEvents = ref([]);
const events = ref([]);
const eventTypes = ref([]);

// Featured events come from the store (seeded by this page's fetch + persisted in sessionStorage).
const featuredEvents = computed(() => featuredEventsStore.events);

const selectedTab = ref(null);
const sortBy = ref('time');
const feedLiveEnabled = ref(false);
const feedPremiumEnabled = ref(false);

const viewByOptions = [
    { title: 'TIME', value: 'time' },
    { title: 'COMPETITION', value: 'competition' }
];

const viewByMenuProps = {
    location: 'bottom',
    /* Flush under the activator, aligned to its width (Vuetify default min width) */
    offset: 0,
    contentProps: {
        class: 'sport-view-by-menu'
    }
};

const SPORT_PRIORITY = ['cricket', 'football', 'tennis'];
const EXCLUDED_TAB_NAMES = ['casino', 'sports book'];

const isInplayTab = computed(() => selectedTab.value === 'inplay');

const normalizeEventType = (item) => {
    const id = Number(item?.id ?? item?.event_type_id ?? item?.eventTypeId);
    const name = String(item?.name ?? item?.event_type_name ?? item?.title ?? '').trim();
    if (!Number.isFinite(id) || !name) return null;
    return { id, name };
};

const sportTabs = computed(() => {
    const apiMenu = Array.isArray(eventTypes.value) ? eventTypes.value : [];
    const normalizedApiMenu = apiMenu.map(normalizeEventType).filter(Boolean);
    const fallbackMenu = (defaultEventTypes.value || []).map((item) => ({ id: Number(item.id), name: String(item.name || '').trim() }));
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

const topTabs = computed(() => {
    const tabs = sportTabs.value.map((sport) => ({
        id: sport.id,
        name: String(sport.name).toUpperCase(),
        isInplay: false,
        icon: getEventTypeIcon(Number(sport.id))
    }));

    return isMobile.value ? insertQuickGameTabsAfterTennis(tabs) : tabs;
});

const currentSportLabel = computed(() => {
    const selected = topTabs.value.find((tab) => Number(tab.id) === Number(selectedTab.value));
    return selected?.name || 'SPORT';
});

const currentSportIcon = computed(() => {
    const selected = topTabs.value.find((tab) => Number(tab.id) === Number(selectedTab.value));
    return selected?.icon || null;
});

const currentTabData = computed(() => [{ events: events.value }]);
const isLiveForGrouping = computed(() => {
    if (isInplayTab.value) return true;
    return feedLiveEnabled.value;
});
const { starredIds, isEventStarred } = useStarredEvents();
const { sortEvents, groupedEventsByCompetition } = useCompetitionGrouping(currentTabData, sortBy, isLiveForGrouping);

const inplaySortedEvents = computed(() => {
    void starredIds.value;
    const list = Array.isArray(events.value) ? events.value : [];

    const getRank = (event) => {
        const typeName = String(event?.event_type_name || getEventTypeName(event?.event_type_id) || '').toLowerCase();
        const idx = SPORT_PRIORITY.findIndex((name) => typeName.includes(name));
        return idx === -1 ? SPORT_PRIORITY.length : idx;
    };

    return [...list].sort((a, b) => {
        const rankDiff = getRank(a) - getRank(b);
        if (rankDiff !== 0) return rankDiff;
        return compareEventsWithStarPriority(a, b, isEventStarred);
    });
});

const timeEvents = computed(() => {
    void starredIds.value;
    if (isInplayTab.value) return inplaySortedEvents.value;
    return sortEvents(events.value || []);
});

const normalizeEventsForTab = (rows) => {
    let normalized = Array.isArray(rows) ? rows : [];
    const isLiveEvent = (event) => event?.in_play === true || event?.in_play === 1 || event?.in_play === '1';

    if (isInplayTab.value) {
        normalized = normalized.filter((event) => isLiveEvent(event));
        if (feedPremiumEnabled.value) {
            normalized = normalized.filter((event) => isLiveEvent(event) || isPremiumEvent(event));
        }
    } else {
        normalized = normalized.filter((event) => Number(event?.event_type_id) === Number(selectedTab.value));

        if (feedLiveEnabled.value && feedPremiumEnabled.value) {
            normalized = normalized.filter((event) => isLiveEvent(event) || isPremiumEvent(event));
        } else if (feedLiveEnabled.value) {
            normalized = normalized.filter((event) => isLiveEvent(event));
        } else if (feedPremiumEnabled.value) {
            normalized = normalized.filter((event) => isPremiumEvent(event));
        }
    }

    return normalized;
};

const applyFilter = () => {
    events.value = normalizeEventsForTab(allEvents.value);
    noEvent.value = events.value.length === 0;
};

const loadEventTypes = async () => {
    const res = await getEventTypes();
    eventTypes.value = res?.data?.menu || res?.menu || [];
};

const fetchAllEvents = async () => {
    try {
        // Keep spinner only when we don't already have paintable data.
        const hasCached = eventsStore.eventsFetched;
        if (!hasCached) {
            loading.value = true;
        }
        error.value = null;

        await eventsStore.waitForEvents();
        allEvents.value = eventsStore.allEvents;
        // Persist featured events to store + sessionStorage — used by slider, available on revisit.
        featuredEventsStore.setFromAllEvents(allEvents.value);
    } catch (err) {
        console.error('Sports home fetch failed:', err);
        error.value = err?.message || 'Failed to load sports events';
        allEvents.value = [];
        noEvent.value = true;
    } finally {
        loading.value = false;
    }
};

const { watchForEvents, stopOddsFetching } = useOddsWebSocket(
    () => events.value,
    {
        onUpdate: (updatedEvents) => {
            const updates = Array.isArray(updatedEvents) ? updatedEvents : [];
            const updateMap = new Map(
                updates.map((event) => [String(event?.event_id ?? event?.id), event])
            );

            // Merge live WS updates into cached source data, then re-apply current filters.
            allEvents.value = (allEvents.value || []).map((event) => {
                const key = String(event?.event_id ?? event?.id);
                const patch = updateMap.get(key);
                return patch ? { ...event, ...patch } : event;
            });
            applyFilter();
            noEvent.value = events.value.length === 0;
        }
    }
);

const onTabClick = (tab) => {
    if (tab?.route) {
        router.push(tab.route);
        return;
    }
    selectedTab.value = tab?.id;
};

const isTopTabActive = (tab) => !tab?.route && selectedTab.value === tab?.id;

const toggleFeedLive = () => {
    const nextLive = !feedLiveEnabled.value;
    feedLiveEnabled.value = nextLive;
    if (nextLive) feedPremiumEnabled.value = false;
};

const toggleFeedPremium = () => {
    const nextPremium = !feedPremiumEnabled.value;
    feedPremiumEnabled.value = nextPremium;
    if (nextPremium) feedLiveEnabled.value = false;
};

const isFantasySportTab = (tab) => {
    if (!tab || tab.isInplay) return false;
    return tab.quickVariant === 'fantasy11' || String(tab.name || '').toLowerCase().includes('fantasy');
};

// Tab/filter changes re-filter the cached allEvents — no extra API call.
watch([selectedTab, feedLiveEnabled, feedPremiumEnabled], applyFilter);

onMounted(async () => {
    // Don't block the events list on demo login — run in parallel.
    const demoPromise = !authStore.isUiAuthenticated
        ? authStore.demoLoginPreview().catch(() => {})
        : Promise.resolve();

    // Single fetch: full events list (active filtered client-side) + event types in parallel.
    await Promise.all([loadEventTypes(), fetchAllEvents(), demoPromise]);

    if (sportTabs.value.length > 0) {
        // Setting selectedTab fires watch above → applyFilter().
        selectedTab.value = sportTabs.value[0].id;
    } else {
        applyFilter();
    }

    watchForEvents();
});

onUnmounted(() => {
    stopOddsFetching();
});
</script>

<template>
    <div class="sports-home-layout" :class="{ 'sports-home-layout--mobile': isMobile }">
        <section class="sports-home-layout__sports-pane">
            <div class="sports-home-tab-strip">
                <button v-for="tab in topTabs" :key="String(tab.id)" type="button" class="sports-home-tab" :class="{
                    'sports-home-tab--active': isTopTabActive(tab),
                    'sports-home-tab--quick': isQuickGameTab(tab),
                    'sports-home-tab--fantasy': isFantasySportTab(tab)
                }" @click="onTabClick(tab)">
                    <span v-if="tab.isNew || isFantasySportTab(tab)" class="sports-home-tab__new">NEW</span>
                    <span class="sports-home-tab__icon-wrap min-[769px]:tw-hidden">
                        <InplayIcon
                            v-if="tab.isInplay"
                            :width="22"
                            :height="22"
                            class="sports-home-tab__icon sports-home-tab__icon--sport"
                        />
                        <component :is="tab.icon" v-else-if="tab.icon" :width="tab.iconSize || 22" :height="tab.iconSize || 22"
                            class="sports-home-tab__icon sports-home-tab__icon--sport" />
                        <v-icon v-else class="sports-home-tab__icon sports-home-tab__icon--mdi" size="22">
                            mdi-trophy-outline
                        </v-icon>
                    </span>
                    <span class="sports-home-tab__label">{{ tab.name }}</span>
                </button>
            </div>

            <section v-if="isMobile" class="sports-home-mobile-showcase">
                <div class="sports-home-mobile-showcase__card">
                    <NewLaunchGames />
                </div>
                <div class="sports-home-mobile-showcase__card">
                    <FavoriteCasinoGames />
                </div>
            </section>

            <EventSliderCompact v-if="!isMobile && featuredEvents.length > 0" class="tw-block"
                :event-list="featuredEvents" />

            <v-container fluid class="tw-px-0 sports-home-content-wrap">
                <Loading v-if="loading" />

                <v-row v-else-if="error">
                    <v-col cols="12" class="tw-mt-5">
                        <v-alert type="error" variant="tonal" class="tw-text-center">
                            {{ error }}
                        </v-alert>
                    </v-col>
                </v-row>

                <v-row no-gutters v-else class="sports-home-main-grid">
                    <v-col cols="12" md="8" lg="9" class="tw-p-0">
                        <div class="tw-text-textLight1 tw-text-sm tw-min-w-0 sports-home-exchange-wrap">
                            <div class="tw-p-0">
                                <div
                                    class="sport-home-feed-bar tw-mb-1 tw-flex tw-items-center tw-justify-between tw-gap-2">
                                    <div class="feed-title-wrap">
                                        <div class="feed-title-row">
                                            <component :is="currentSportIcon" v-if="currentSportIcon" :width="16"
                                                :height="16" class="feed-title-icon" />
                                            <span class="feed-title-text">{{ currentSportLabel }}</span>
                                        </div>
                                        <div
                                            class="feed-mode-pills tw-flex tw-items-center tw-gap-1.5 tw-flex-wrap tw-min-w-0">
                                            <button type="button" class="feed-mode-pill"
                                                :class="{ 'feed-mode-pill--active': feedLiveEnabled }"
                                                @click="toggleFeedLive">
                                                <span class="feed-mode-pill__prefix">{{ feedLiveEnabled ? '+' : '-'
                                                    }}</span> LIVE
                                            </button>
                                            <button type="button" class="feed-mode-pill"
                                                :class="{ 'feed-mode-pill--active': feedPremiumEnabled }"
                                                @click="toggleFeedPremium">
                                                <span class="feed-mode-pill__prefix">{{ feedPremiumEnabled ? '+' : '-'
                                                    }}</span> PREMIUM
                                            </button>
                                        </div>
                                        <div class="view-by-group">
                                            <span class="view-by-label">View by:</span>
                                            <v-select v-model="sortBy" :items="viewByOptions" item-title="title"
                                                item-value="value" variant="outlined" density="compact" hide-details
                                                :list-props="{ density: 'compact' }" :menu-props="viewByMenuProps"
                                                class="sport-filter-select sport-filter-select--view-by" />
                                        </div>
                                    </div>

                                    <div class="feed-right-wrap tw-hidden sm:tw-block">
                                        <div class="feed-col-heads">
                                            <span>1</span>
                                            <span>X</span>
                                            <span>2</span>
                                        </div>
                                    </div>
                                </div>

                                <template v-if="events && events.length > 0">
                                    <div class="tw-pb-5 lg:tw-pb-0">
                                        <template v-if="sortBy === 'time'">
                                            <EventRow v-for="(event, index) in timeEvents"
                                                :key="event.id || event.event_id" :event="event"
                                                :animation-delay="Math.min(index * 0.02, 0.5)" />
                                        </template>

                                        <template v-else-if="sortBy === 'competition'">
                                            <template v-for="(group, groupIndex) in groupedEventsByCompetition"
                                                :key="group.name">
                                                <div class="competition-name-box tw-mb-1 tw-overflow-visible tw-mt-2">
                                                    <v-card-title
                                                        class="tw-flex tw-items-center tw-gap-2 tw-py-0 tw-overflow-visible">
                                                        <h2
                                                            class="tw-text-white tw-font-extrabold tw-text-sm md:tw-text-base tw-m-0 tw-break-words tw-whitespace-normal">
                                                            {{ group.name }}
                                                        </h2>
                                                    </v-card-title>
                                                </div>

                                                <EventRow v-for="(event, eventIndex) in group.events"
                                                    :key="event.id || event.event_id" :event="event" :show-star="false"
                                                    :animation-delay="Math.min((groupIndex * 100 + eventIndex) * 0.02, 0.5)" />
                                            </template>
                                        </template>
                                    </div>
                                </template>

                                <div v-else class="sports-home-empty-state">
                                    Not found
                                </div>
                            </div>
                        </div>
                    </v-col>
                    <v-col cols="12" md="4" lg="3" class="tw-pl-2 tw-pr-0 tw-hidden md:tw-block">
                        <aside class="sports-home-right-rail">
                            <div class="sports-home-layout__desktop-casino-inner">
                                <NewLaunchGames />
                            </div>
                            <div class="sports-home-layout__desktop-casino-inner">
                                <FavoriteCasinoGames />
                            </div>
                            <div class="sports-home-layout__desktop-casino-inner">
                                <StaticSlotSection />
                            </div>
                            <div class="sports-home-layout__desktop-casino-inner">
                                <ProvidersSection />
                            </div>
                        </aside>
                    </v-col>
                </v-row>
            </v-container>
        </section>

        <section v-if="isMobile" class="sports-home-layout__casino-pane">
            <div class="sports-home-layout__casino-inner">
                <StaticSlotSection />
            </div>
            <div class="sports-home-layout__casino-inner">
                <ProvidersSection />
            </div>
        </section>
    </div>
</template>

<style scoped>
.sports-home-layout {
    display: block;
    background: #ececec;
}

.sports-home-layout--mobile {
    display: flex;
    flex-direction: column;
    min-height: 100%;
}

.sports-home-layout--mobile .sports-home-layout__sports-pane {
    flex: 1 1 auto;
    max-height: none;
    overflow-y: visible;
    overscroll-behavior: auto;
    background: #ffffff;
}

.sports-home-mobile-showcase {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
    background: #b7862f;
}

.sports-home-mobile-showcase__card {
    width: 100%;
}

.sports-home-content-wrap {
    padding-top: 8px;
    padding-bottom: 8px;
}

@media (max-width: 768px) {
    .sports-home-content-wrap {
        padding-top: 0;
        padding-bottom: 4px;
    }
}

.sports-home-layout--mobile .sports-home-layout__casino-pane {
    flex: 1 1 auto;
    min-height: 0;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface-alt);
    margin-top: 0;
}

.sports-home-layout__casino-inner {
    padding: 0;
}

.sports-home-layout__desktop-casino {
    margin-top: 0;
    display: grid;
    gap: 0;
}

.sports-home-layout__desktop-casino-inner {
    padding: 0;
}

.sports-home-main-grid {
    align-items: flex-start;
}

.sports-home-exchange-wrap {
    border: 1px solid #d1d1d1;
    background: #ececec;
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

.sports-home-right-rail .sports-home-layout__desktop-casino-inner {
    max-height: 285px;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
}

/* Right rail cards: show one banner per row like reference */
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

/* Keep section heading visible while that section scrolls */
.sports-home-right-rail :deep(.new-launch-header),
.sports-home-right-rail :deep(.favourites-section__header),
.sports-home-right-rail :deep(.slot-section__header),
.sports-home-right-rail :deep(.providers-section__header) {
    position: sticky !important;
    top: 0 !important;
    z-index: 20 !important;
}

/* Match favourites behavior for other right-rail sections */
.sports-home-right-rail :deep(.new-launch-wrap),
.sports-home-right-rail :deep(.slot-section),
.sports-home-right-rail :deep(.providers-section) {
    position: relative !important;
    overflow: visible !important;
}

.sports-home-layout__casino-pane {
    margin-top: 0;
}

.sports-home-layout__sports-pane {
    background: #ececec;
    min-height: 100%;
}

.sports-home-layout__sports-pane :deep(.v-container),
.sports-home-layout__sports-pane :deep(.v-row),
.sports-home-layout__sports-pane :deep(.v-col) {
    background: #ececec;
}

.sport-home-feed-bar {
    background: linear-gradient(180deg, #6d6e72 0%, #5f6064 100%);
    border: 1px solid #8b8d90;
    border-radius: 12px 12px 0 0;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
    min-height: 30px;
    padding: 2px 6px;
    overflow: hidden;
    position: relative;
}

.sport-home-feed-bar::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 52%;
    background: transparent linear-gradient(94deg, #b6842d, #ebda8d 55%, #b7862f);
    clip-path: polygon(0 0, 100% 0, 94% 100%, 0 100%);
    z-index: 0;
}

.feed-title-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    position: relative;
    z-index: 1;
}

.feed-title-row {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border-radius: 999px 16px 16px 999px;
    padding: 2px 8px 2px 6px;
    border: none;
    min-height: 19px;
    box-shadow: none;
}

.feed-title-icon {
    color: #2b2314;
    flex-shrink: 0;
}

.feed-title-text {
    color: #ffffff;
    font-size: 20px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: 0.02em;
    text-transform: uppercase;
}

.feed-right-wrap {
    display: flex;
    align-items: start;
    gap: 0;
    margin-top: -2px;
    min-width: 0;
    margin-left: auto;
    position: relative;
    z-index: 1;
}

.feed-col-heads {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
    width: 420px;
    min-width: 420px;
    max-width: 420px;
    align-self: flex-start;
    margin-top: 0;
    margin-right: 0;
}

.feed-col-heads span {
    text-align: center;
    color: #f5f6f8;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.06em;
    line-height: 1;
}

.feed-mode-pill {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin: 0;
    padding: 1px 8px;
    border-radius: 16px;
    border: 1px solid #9c7a2f;
    background: linear-gradient(180deg, #f0dc9a 0%, #b7882f 100%);
    color: #2a2e34;
    font-size: 9px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    cursor: pointer;
    white-space: nowrap;
    min-height: 18px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.feed-mode-pill__prefix {
    font-weight: 800;
    opacity: 1;
}

.feed-mode-pill--active {
    background: linear-gradient(180deg, #33d17a 0%, #1ea85d 100%);
    /* border-color: #198f4f; */
    color: #ffffff;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.feed-mode-pill--active .feed-mode-pill__prefix {
    opacity: 1;
}

/* Label + dropdown: one baseline, matching condensed uppercase caps lock (~reference) */
.view-by-group {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    gap: 0.25rem;
    line-height: 1;
}

@media (max-width: 1024px) {
    .sport-home-feed-bar {
        background: linear-gradient(180deg, #7a7b7d 0%, #66686a 100%);
    }

    .sport-home-feed-bar::before {
        width: 70%;
    }
}

@media (max-width: 1024px) {
    .feed-title-text {
        font-size: 16px;
    }

    .feed-col-heads {
        width: 250px;
        min-width: 250px;
    }
}

.view-by-label {
    margin: 0;
    padding: 0;
    font-size: 9px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: 0.03em;
    color: #ffffff;
    white-space: nowrap;
}

.sport-filter-select.sport-filter-select--view-by {
    flex: 0 0 auto;
    width: auto;
    /* Fits “COMPETITION” at 10px without excess; menu tracks this width */
    min-width: 6.1rem;
    max-width: 6.9rem;
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
    min-height: 17px !important;
    border-radius: 2px !important;
    border: 1px solid #9f7b2e !important;
    background: linear-gradient(180deg, #f0da93 0%, #b7892f 100%) !important;
    box-shadow: none !important;
}

.sport-filter-select.sport-filter-select--view-by :deep(.v-field:hover) {
    border-color: #ffffff !important;
}

.sport-filter-select.sport-filter-select--view-by :deep(.v-field__input) {
    min-height: 17px !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    padding-inline: 5px 1px !important;
    font-size: 9px !important;
    font-weight: 800 !important;
    line-height: 1.1 !important;
    letter-spacing: 0.06em !important;
    color: #111827 !important;
}

.sport-filter-select.sport-filter-select--view-by :deep(.v-field__outline) {
    --v-field-border-opacity: 0;
}

.sport-filter-select.sport-filter-select--view-by :deep(.v-select__selection-text) {
    font-size: 9px !important;
    font-weight: 800 !important;
    line-height: 1.1 !important;
    letter-spacing: 0.06em !important;
    color: #111827 !important;
}

.sport-filter-select.sport-filter-select--view-by :deep(.v-field__append-inner) {
    align-self: center;
    margin-block: 0 !important;
    padding-top: 0 !important;
    padding-inline-end: 3px !important;
    margin-inline-start: -2px !important;
}

.sport-filter-select.sport-filter-select--view-by :deep(.v-icon) {
    font-size: 10px !important;
    opacity: 0.95;
    color: #3b2a12 !important;
}

/* Dark nav strip (visible on mobile): icon above label ≤768px — see reference bar */
.sports-home-tab-strip {
    display: flex;
    align-items: stretch;
    gap: 0;
    overflow-x: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
    background-color: var(--color-nav-deep);
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
    padding: 8px 9px;
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

@media (max-width: 768px) {
    .sports-home-content-wrap {
        padding-top: 4px !important;
        padding-bottom: 4px !important;
    }

    .sports-home-layout--mobile {
        min-height: auto;
    }

    .sports-home-layout--mobile .sports-home-layout__sports-pane {
        padding-bottom: 4px;
    }

    .sports-home-mobile-showcase {
        gap: 3px;
    }

    .sports-home-layout--mobile .sports-home-content-wrap {
        padding-bottom: 78px !important;
    }

    .sports-home-layout--mobile .sports-home-layout__casino-pane {
        border-top-width: 0;
    }

    .sports-home-layout__casino-inner {
        margin-top: 4px;
    }

    .sports-home-layout :deep(.new-launch-grid),
    .sports-home-layout :deep(.favourites-grid),
    .sports-home-layout :deep(.slot-grid),
    .sports-home-layout :deep(.providers-section__grid) {
        gap: 4px !important;
    }

    .sports-home-layout :deep(.new-launch-header),
    .sports-home-layout :deep(.favourites-section__header),
    .sports-home-layout :deep(.slot-section__header),
    .sports-home-layout :deep(.providers-section__header) {
        padding-block: 4px !important;
    }

    .sport-home-feed-bar {
        min-height: 30px;
        border-radius: 0 !important;
        padding: 4px 8px;
        background: linear-gradient(94deg, #b6842d, #ebda8d 55%, #b7862f);
        border: none;
        position: relative;
        overflow: hidden;
    }

    .sport-home-feed-bar::before {
        display: none;
    }

    .sport-home-feed-bar::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 24px;
        height: 100%;
        background: #ffffff;
        clip-path: polygon(100% 0, 100% 100%, 0 100%);
        z-index: 2;
        pointer-events: none;
    }

    .feed-title-wrap {
        gap: 6px;
        flex-wrap: nowrap;
        align-items: center;
        width: 100%;
    }

    .feed-title-row {
        min-height: 17px;
        padding: 1px 6px 1px 4px;
    }

    .feed-title-text {
        font-size: 13px;
        color: #ffffff !important;
    }

    .feed-mode-pills {
        gap: 4px !important;
    }

    .feed-mode-pill {
        min-height: 17px;
        padding: 0 6px;
        font-size: 8px;
    }

    .view-by-group {
        display: inline-flex !important;
    }

    .feed-right-wrap,
    .feed-col-heads {
        display: none !important;
    }

    .view-by-label {
        font-size: 8px;
    }

    .sport-filter-select.sport-filter-select--view-by {
        min-width: 4.8rem;
        max-width: 5.2rem;
    }

    .sport-filter-select.sport-filter-select--view-by :deep(.v-field) {
        min-height: 16px !important;
    }

    .sport-filter-select.sport-filter-select--view-by :deep(.v-field__input) {
        min-height: 16px !important;
        font-size: 8px !important;
        padding-inline: 4px 1px !important;
    }

    .sport-filter-select.sport-filter-select--view-by :deep(.v-select__selection-text) {
        font-size: 8px !important;
    }

    .sports-home-tab-strip {
        background: #dcdcdc;
        border-top: 1px solid #8b6914;
        border-bottom: 1px solid #8b6914;
    }

    .sports-home-tab {
        flex-direction: column;
        gap: 1px;
        padding: 3px 6px 4px;
        min-width: 3.1rem;
        color: #2a2a2a;
        border-right: 1px solid #b8b8b8;
        background: #dcdcdc;
    }

    .sports-home-tab:last-child {
        border-right: none;
    }

    .sports-home-tab:not(.sports-home-tab--active):not(.sports-home-tab--fantasy) {
        color: #2a2a2a;
    }

    .sports-home-tab:not(.sports-home-tab--active):not(.sports-home-tab--fantasy) .sports-home-tab__icon--mdi,
    .sports-home-tab:not(.sports-home-tab--active):not(.sports-home-tab--fantasy) .sports-home-tab__icon--sport {
        color: #2a2a2a !important;
    }

    .sports-home-tab:hover:not(.sports-home-tab--fantasy) {
        color: #1a1a1a;
        border-bottom-color: rgba(176, 141, 50, 0.65);
    }

    .sports-home-tab--active:not(.sports-home-tab--fantasy) {
        background: linear-gradient(180deg, #f3e2a8 0%, #e4c45a 38%, #c9a032 72%, #8b6914 100%);
        color: #1a1a1a;
        border-bottom-color: #6b4a12;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
    }

    /* Fantasy tab: pale pink strip per reference */
    .sports-home-tab--fantasy:not(.sports-home-tab--active) {
        background: #fff0f0 !important;
        color: #c62828;
        border-right: 1px solid #e0bcbc;
    }

    .sports-home-tab--fantasy:not(.sports-home-tab--active) .sports-home-tab__icon--mdi,
    .sports-home-tab--fantasy:not(.sports-home-tab--active) .sports-home-tab__icon--sport {
        color: #c62828 !important;
    }

    .sports-home-tab--active:not(.sports-home-tab--fantasy) .sports-home-tab__icon--mdi,
    .sports-home-tab--active:not(.sports-home-tab--fantasy) .sports-home-tab__icon--sport {
        color: #1a1a1a !important;
    }

    .sports-home-tab__label {
        font-size: 7px;
        letter-spacing: 0.02em;
        text-align: center;
        max-width: 3.6rem;
        white-space: nowrap;
        line-height: 1;
        text-overflow: ellipsis;
        overflow: hidden;
    }

    .sports-home-tab__icon-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .sports-home-tab--quick {
        min-width: 4rem;
        padding-top: 6px;
    }

    .sports-home-tab--fantasy {
        padding-top: 10px;
    }

    .sports-home-tab--quick.sports-home-tab--fantasy {
        padding-top: 6px;
    }
}

@media (max-width: 767.98px) {
    .sports-home-layout :deep(.new-launch-wrap .new-launch-header) {
        padding: 7px 10px !important;
        display: flex !important;
        justify-content: center !important;
    }

    .sports-home-layout :deep(.new-launch-wrap .new-launch-header__text) {
        font-size: 18px !important;
        font-weight: 500 !important;
        line-height: 1 !important;
        letter-spacing: 0.02em !important;
        text-align: center !important;
        animation: none !important;
        transform: none !important;
    }

    .sports-home-layout :deep(.favourites-section__header) {
        display: flex !important;
        justify-content: center !important;
    }

    .sports-home-layout :deep(.favourites-section__title) {
        text-align: center !important;
        font-weight: 500 !important;
    }

    .sports-home-layout :deep(.favourites-section__title--animated) {
        animation: none !important;
        transform: none !important;
    }

    .sports-home-layout :deep(.new-launch-wrap) {
        border: 1px solid #9d7728 !important;
        border-top: 2px solid #b7862f !important;
        border-bottom: 2px solid #b7862f !important;
    }

    .sports-home-layout :deep(.new-launch-wrap .new-launch-grid) {
        display: block !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        padding: 3px 1px !important;
        background: #ffffff !important;
    }

    .sports-home-layout :deep(.new-launch-wrap .new-launch-grid__track) {
        display: flex !important;
        flex-wrap: nowrap !important;
        align-items: stretch !important;
        will-change: transform;
    }

    .sports-home-layout :deep(.new-launch-wrap .new-launch-grid__tile) {
        flex: 0 0 calc(100% / 4) !important;
        width: calc(100% / 4) !important;
        max-width: calc(100% / 4) !important;
        min-width: 0 !important;
        box-sizing: border-box;
        padding: 0 1px !important;
        background: #ffffff !important;
        border: none !important;
    }

    .sports-home-layout :deep(.new-launch-wrap .new-launch-grid__media) {
        position: relative;
        aspect-ratio: 4 / 3 !important;
        overflow: hidden !important;
        background: #0a1628 !important;
        border-radius: 0 !important;
    }

    .sports-home-layout :deep(.new-launch-wrap .new-launch-grid__bg) {
        display: none !important;
    }

    .sports-home-layout :deep(.new-launch-wrap .new-launch-grid__img) {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        object-position: center center;
        display: block !important;
    }

    /* Event rows (mobile): keep compact rows flush with table header */
    .sports-home-layout:not(.sport-page-layout) :deep(.event-row-card) {
        border-top: none !important;
        border-bottom: 1px solid #d1d5db !important;
        background: #ffffff !important;
    }

    .sports-home-layout:not(.sport-page-layout) :deep(.event-row-content) {
        padding: 0 !important;
    }

    .sports-home-layout :deep(.event-row-ref-colheads) {
        display: none !important;
    }

    .sports-home-layout :deep(.event-row-ref-odds) {
        margin-top: 2px;
        gap: 2px;
    }

    .sports-home-layout:not(.sport-page-layout) :deep(.event-row-ref-btn),
    .sports-home-layout:not(.sport-page-layout) :deep(.event-odd-btn) {
        border-radius: 4px;
    }

    .sports-home-layout :deep(.status-badge) {
        min-width: 18px;
        height: 16px;
        border-radius: 9999px;
        border: 1px solid #a7822f;
        background: linear-gradient(180deg, #f3dd9f 0%, #c89f4f 100%);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        color: #2d2516 !important;
        letter-spacing: 0.01em;
    }
}

@media (min-width: 769px) {
    .sports-home-tab__new {
        display: none !important;
    }
}

.sports-home-tab__new {
    position: absolute;
    top: 4px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 0.06em;
    background: #dc2626;
    color: #ffffff;
    padding: 2px 4px;
    line-height: 1;
    border-radius: 2px;
    white-space: nowrap;
}

.sports-home-tab--quick .sports-home-tab__new {
    top: 1px;
    right: 2px;
    left: auto;
    transform: none;
}

/* Desktop dark strip: fantasy uses muted gold text; mobile gray strip uses pink/red (see max-width 768 block) */
@media (min-width: 769px) {
    .sports-home-tab--fantasy:not(.sports-home-tab--active) {
        color: #d4b878;
    }

    .sports-home-tab--fantasy:not(.sports-home-tab--active) .sports-home-tab__icon--mdi,
    .sports-home-tab--fantasy:not(.sports-home-tab--active) .sports-home-tab__icon--sport {
        color: #d4b878 !important;
        opacity: 1;
    }
}

.sports-home-tab--fantasy.sports-home-tab--active {
    color: #f5ecd4;
    border-bottom-color: #d4b878;
}

.sports-home-tab--fantasy.sports-home-tab--active .sports-home-tab__icon--mdi,
.sports-home-tab--fantasy.sports-home-tab--active .sports-home-tab__icon--sport {
    color: #f5ecd4 !important;
}

.sports-home-tab:first-child {
    border-left: none;
}

@media (min-width: 769px) {
    .sports-home-tab:hover {
        color: #ffffff;
        border-bottom-color: rgba(255, 255, 255, 0.5);
    }

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

    .sports-home-tab--active {
        color: #ffffff;
        border-bottom-color: #ffffff;
        background: transparent;
    }
}

.sports-home-tab__icon {
    flex-shrink: 0;
}

.sports-home-tab__icon--mdi {
    opacity: 0.95;
}

.sports-home-tab__label {
    line-height: 1;
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
    border-radius: 0 !important;
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

.competition-name-box {
    background: var(--color-nav-deep);
    border: none;
    border-radius: 0;
}

.sports-home-empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 220px;
    padding: 16px;
    color: var(--color-text);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
}
</style>

<!--
  Menu is teleported; class from viewByMenuProps.contentProps.
  Match reference: white frame, navy panel, bright blue selected row.
-->
<style>
.sport-view-by-menu {
    border-radius: 0 !important;
    border: 1px solid #ffffff !important;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.35) !important;
    overflow: hidden;
    padding: 0 !important;
    background: var(--color-nav-deep, #0f172a) !important;
    /* Do not set min-width — Vuetify sizes to the activator; a large min-width was forcing a wide menu */
}

.sport-view-by-menu .v-list {
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
}

.sport-view-by-menu .v-list-item {
    min-height: 0 !important;
    padding: 2px 6px !important;
    font-size: 10px !important;
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
    font-size: 10px !important;
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
    background: #2563eb !important;
    color: #ffffff !important;
}

.sport-view-by-menu .v-list-item:hover {
    background: rgba(37, 99, 235, 0.55) !important;
}

.sport-view-by-menu .v-list-item--active:hover,
.sport-view-by-menu .v-list-item[aria-selected='true']:hover {
    background: #2563eb !important;
}

.sport-view-by-menu .v-list-item__overlay {
    opacity: 0 !important;
}
</style>
