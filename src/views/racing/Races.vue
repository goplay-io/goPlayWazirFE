<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Loading from '@/components/Loading.vue';
import Flag from '@/components/Flag.vue';
import { getAllRaces } from '@/api/event/races';
import { useEventsStore } from '@/stores/events/events';
import {
    groupRacesByCounty,
    isRaceAvailable,
    getUniqueCountryCodes,
    getRacingFlagCode,
} from '@/utils/raceUtils';
import SportPageTitleHeader from '@/components/sports/SportPageTitleHeader.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const eventsStore = useEventsStore();
const eventName = ref(route.params.event_type_name || 'Racing');
const selectedRegion = ref(null);
const eventTypeList = ref([]);
const racesList = ref({});
const event_type_id = ref(null);
const regions = ref([]);
const loading = ref(false);
const noEvent = ref(false);

const displayEventName = computed(() => {
    const name = eventName.value
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    return `${name} Schedule`;
});

const navigateToRace = (eventId, marketId) => {
    router.push(`/racing/bet/${eventId}/${marketId}`);
};

const loadEvents = async () => {
    loading.value = true;
    noEvent.value = false;
    regions.value = [];
    selectedRegion.value = null;
    racesList.value = {};

    try {
        if (!eventsStore.hasData) {
            await eventsStore.fetchEventTypes();
        }

        eventTypeList.value = eventsStore.allEventTypes;

        const matchedEventType = eventTypeList.value.find(event =>
            event.name.toLowerCase().replace(/\s+/g, '_') === eventName.value.toLowerCase()
        );

        event_type_id.value = matchedEventType ? matchedEventType.id : null;

        if (!event_type_id.value) {
            console.warn('Event type not found for:', eventName.value);
            noEvent.value = true;
            return;
        }

        const response = await getAllRaces({ event_type_id: event_type_id.value });
        const races = response.data?.races || response.races || [];

        racesList.value = groupRacesByCounty(races);
        regions.value = getUniqueCountryCodes(races);
        selectedRegion.value = regions.value[0] ?? null;
    } catch (error) {
        console.error('Error loading races:', error);
        noEvent.value = true;
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    await loadEvents();
});

const filteredEvents = computed(() => {
    if (!selectedRegion.value || !racesList.value[selectedRegion.value]) {
        return [];
    }
    const countryData = racesList.value[selectedRegion.value];
    const allEvents = [];
    Object.keys(countryData).forEach((evName, index) => {
        const races = countryData[evName];
        if (!Array.isArray(races) || races.length === 0) return;
        allEvents.push({ eventName: evName, races, index: index + 1 });
    });
    return allEvents;
});

watch(() => route.params.event_type_name, async (newName) => {
    if (newName) {
        eventName.value = newName;
        noEvent.value = false;
        await loadEvents();
    }
});

/** Match reference: 12-hour clock with space after colon — e.g. "7: 20 PM" */
const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
        const date = new Date(timeString);
        if (Number.isNaN(date.getTime())) return timeString;
        const formatted = date.toLocaleString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
        return formatted.replace(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i, '$1: $2 $3');
    } catch {
        return timeString;
    }
};

const isRaceLiveSoon = (market) => {
    const raw = market?.market_start_time_format;
    if (!raw) return false;
    try {
        const start = new Date(raw);
        if (Number.isNaN(start.getTime())) return false;
        const mins = (start.getTime() - Date.now()) / 60000;
        return mins < 10;
    } catch {
        return false;
    }
};

/** Venue label without trailing date / region clutter */
const venueDisplayName = (eventGroup) => {
    const raw = (eventGroup?.eventName ?? '').trim();
    if (!raw) return '';
    return raw
        .replace(/\s+\d{1,2}(st|nd|rd|th)?\s+[A-Za-z]{3}\b.*$/i, '')
        .replace(/\s*\([A-Z]{2,4}\)\s*$/i, '')
        .trim() || raw;
};
</script>

<template>
    <div class="racing-page">
        <SportPageTitleHeader :title="displayEventName" />
        <v-container fluid class="racing-page__inner tw-px-2 md:tw-px-3">
            <v-row no-gutters>
                <v-col cols="12" class="tw-p-0">
                    <div v-if="!loading">
                        <div v-if="regions.length > 0" class="races-schedule">
                            <!-- Country / region tabs -->
                            <div class="races-schedule__tabs scrollbar-hide" role="tablist" aria-label="Region">
                                <button
                                    v-for="region in regions"
                                    :key="region"
                                    type="button"
                                    role="tab"
                                    :aria-selected="selectedRegion === region"
                                    class="races-region-tab"
                                    :class="{ 'races-region-tab--active': selectedRegion === region }"
                                    @click="selectedRegion = region"
                                >
                                    <Flag
                                        :code="getRacingFlagCode(region)"
                                        size="md"
                                        square
                                        class="races-region-tab__flag"
                                    />
                                    <span class="races-region-tab__code">{{ region }}</span>
                                </button>
                            </div>

                            <!-- Venue schedule cards -->
                            <div v-if="filteredEvents.length > 0" class="races-schedule__list">
                                <article
                                    v-for="eventGroup in filteredEvents"
                                    :key="eventGroup.eventName"
                                    class="races-venue-card"
                                >
                                    <h2 class="races-venue-card__name">
                                        {{ venueDisplayName(eventGroup) }}
                                    </h2>
                                    <div class="races-venue-card__times">
                                        <template v-for="(market, idx) in eventGroup.races" :key="market.market_id ?? idx">
                                            <button
                                                v-if="isRaceAvailable(market)"
                                                type="button"
                                                class="races-time-chip"
                                                :class="{ 'races-time-chip--live': isRaceLiveSoon(market) }"
                                                @click="navigateToRace(market.event_id, market.market_id)"
                                            >
                                                {{ formatTime(market.market_start_time_format) }}
                                            </button>
                                            <span
                                                v-else
                                                class="races-time-chip races-time-chip--disabled"
                                                aria-disabled="true"
                                            >
                                                {{ formatTime(market.market_start_time_format) }}
                                            </span>
                                        </template>
                                    </div>
                                </article>
                            </div>
                            <div v-else class="sports-no-markets-empty sports-no-markets-empty--section">
                                {{ t('sports.home.noMarketsAvailable') }}
                            </div>
                        </div>

                        <div v-else class="sports-no-markets-empty">
                            {{ t('sports.home.noMarketsAvailable') }}
                        </div>
                    </div>

                    <Loading v-else />
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<style scoped>
.racing-page {
    min-height: 100%;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    line-height: 1.25;
    color: #111111;
    -webkit-font-smoothing: antialiased;
}

.racing-page__inner {
    padding-top: 12px;
    padding-bottom: 56px;
    background: transparent;
}

.races-schedule {
    width: 100%;
}

/* Centered country tabs — flag + code */
.races-schedule__tabs {
    display: flex;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
    gap: 0;
    min-height: 50px;
    height: 50px;
    margin-bottom: 12px;
    padding: 0 4px;
    overflow-x: auto;
}

.races-region-tab {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    gap: 6px;
    width: 70px;
    min-width: 70px;
    height: 50px;
    margin: 0 2px;
    padding: 0;
    border: none;
    border-radius: 5px;
    background: #d1d5db;
    color: #111111;
    font-family: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s ease, color 0.15s ease;
    box-sizing: border-box;
}

.races-region-tab__flag {
    display: block;
    width: 24px;
    height: 18px;
    border-radius: 0;
    overflow: hidden;
}

.races-region-tab__flag :deep(img) {
    display: block;
    width: 24px !important;
    height: 18px !important;
    border-radius: 0 !important;
    object-fit: contain;
}

.races-region-tab__code {
    display: block;
    height: 12.47px;
    margin-top: -4px;
    font-size: 9.38px;
    font-weight: 600;
    line-height: 14.07px;
    letter-spacing: 0;
    text-transform: uppercase;
    text-align: center;
}

.races-region-tab--active {
    background: var(--color-header-bg, #360952);
    color: #ffffff;
}

.races-region-tab:focus-visible {
    outline: 2px solid var(--color-header-bg, #360952);
    outline-offset: 2px;
}

.races-schedule__list {
    display: flex;
    flex-direction: column;
    gap: 0;
}

/* Venue card — bordered row matching reference layout */
.races-venue-card {
    display: flex;
    align-items: center;
    gap: 8px;
    width: calc(100% - 16px);
    margin: 8px 0px 0;
    padding: 20px 0;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    background: #ffffff;
    box-sizing: border-box;
    font-size: 11px;
    font-weight: 600;
    line-height: 16.5px;
}

.races-venue-card__name {
    flex: 0 0 100px;
    width: 100px;
    min-width: 100px;
    margin: 0 8px;
    font-size: 12px;
    font-weight: 600;
    line-height: 18px;
    color: var(--color-header-bg, #360952);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.races-venue-card__times {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-left: 40px;
    min-width: 0;
}

.races-time-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 70px;
    height: 21px;
    min-width: 70px;
    min-height: 21px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: #d1d5db;
    color: #111111;
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    line-height: 16.5px;
    white-space: nowrap;
    text-align: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s ease, color 0.15s ease, opacity 0.15s ease;
    box-sizing: border-box;
}

.races-time-chip:hover:not(.races-time-chip--disabled) {
    opacity: 0.9;
}

.races-time-chip--live {
    background: var(--color-header-bg, #360952);
    color: #ffffff;
}

.races-time-chip--disabled {
    cursor: default;
    opacity: 0.55;
    pointer-events: none;
}

.races-time-chip:focus-visible {
    outline: 2px solid var(--color-header-bg, #360952);
    outline-offset: 2px;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

@media (min-width: 768px) {
    .races-venue-card__name {
        margin: 0 20px;
    }

    .races-venue-card__times {
        margin-left: 80px;
    }
}

@media (max-width: 767.98px) {
    .racing-page {
        margin-top: 5px;
        padding-left: 2px;
        padding-right: 2px;
    }

    .races-region-tab__code {
        height: auto;
        font-size: 12px;
        line-height: 18px;
    }
}

@media (max-width: 640px) {
    .races-venue-card {
        width: calc(100% - 4px);
    }

    .races-venue-card__times {
        gap: 8px;
    }
}
</style>
