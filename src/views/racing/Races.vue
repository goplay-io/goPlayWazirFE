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

const sportTitle = computed(() =>
    eventName.value
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
);

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

const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
        const date = new Date(timeString);
        if (Number.isNaN(date.getTime())) return timeString;
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
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

</script>

<template>
    <div class="racing-page">
        <div v-if="!loading" class="racing-card">
            <div class="racing-card__header">
                <span class="racing-card__title">{{ sportTitle }}</span>
                <button type="button" class="racing-card__today">Today</button>
            </div>
            <div v-if="regions.length > 0" class="races-schedule">
                            <div class="races-schedule__tabs" role="tablist" aria-label="Region">
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
                                    <span class="races-region-tab__face">
                                        <Flag
                                            :code="getRacingFlagCode(region)"
                                            size="md"
                                            square
                                            class="races-region-tab__flag"
                                        />
                                        <span class="races-region-tab__code">{{ region }}</span>
                                    </span>
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
                                        {{ eventGroup.eventName }}
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
    </div>
</template>

<style scoped>
.racing-page {
    min-height: 100%;
    background: #23201f;
    color: #ffffff;
}

.racing-card {
    margin: 4px;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 2px;
    background: #333333;
    box-sizing: border-box;
}

.racing-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 38px;
    padding: 0 8px;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 2px 2px 0 0;
    box-sizing: border-box;
}

.racing-card__title {
    display: flex;
    align-items: center;
    padding: 4px;
    color: #ffffff;
    font-size: 13px;
    font-weight: 400;
    line-height: 30px;
}

.racing-card__today {
    display: inline-block;
    height: 25px;
    min-width: 79px;
    padding: 2px 6px;
    border: 0;
    border-radius: 2px;
    background: #49915e;
    color: #000000;
    font-size: 12px;
    font-weight: 500;
    line-height: 21px;
    cursor: pointer;
}

.races-schedule__tabs {
    display: flex;
    flex-wrap: nowrap;
    align-items: stretch;
    height: 40.5px;
    border-bottom: 1px solid #dee2e6;
    overflow: visible;
    scrollbar-width: auto;
    scrollbar-color: #d2d2d2 transparent;
}

.races-schedule__tabs::-webkit-scrollbar {
    width: 4px;
    height: 6px;
    background: transparent;
}

.races-schedule__tabs::-webkit-scrollbar-track {
    background: transparent;
    border: 0;
}

.races-schedule__tabs::-webkit-scrollbar-thumb {
    background: #d2d2d2;
    border: 0;
    border-radius: 8px;
}

.races-region-tab {
    display: flex;
    align-items: stretch;
    justify-content: center;
    flex: 1 1 0;
    min-width: 0;
    height: 39.5px;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: #ffffff;
    cursor: pointer;
    box-sizing: border-box;
}

.races-region-tab__face {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 40.5px;
    margin-bottom: -1px;
    padding: 2px 10px;
    border: 1px solid transparent;
    border-radius: 4px;
    box-sizing: border-box;
}

.races-region-tab--active .races-region-tab__face {
    background: #ffffff;
    color: #000000;
    border-color: #dee2e6;
    border-bottom-color: #ffffff;
}

.races-region-tab__flag {
    display: block;
    width: 18px !important;
    height: 18px !important;
    min-width: 18px;
    margin: 0 5px 0 2px;
    flex-shrink: 0;
}

.races-region-tab__flag :deep(img),
.races-region-tab__flag :deep(span) {
    display: block;
    width: 18px !important;
    height: 18px !important;
    border-radius: 0 !important;
    object-fit: contain;
}

.races-region-tab__code {
    margin: 0 4px;
    font-size: 14px;
    font-weight: 500;
    line-height: normal;
    text-transform: uppercase;
    color: inherit;
}

.races-schedule__list {
    display: flex;
    flex-direction: column;
}

.races-venue-card {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 4px 10px;
    background: transparent;
    box-sizing: border-box;
}

.races-venue-card__name {
    margin: 0 3px 0 0;
    padding: 8px 2px;
    color: #ffffff;
    font-size: 15px;
    font-weight: 500;
    line-height: 22px;
}

.races-venue-card__times {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    min-width: 0;
}

.races-time-chip {
    display: inline-block;
    margin: 0 5px 4px 0;
    padding: 2px 8px;
    border: 1px solid #d3d3d3;
    border-radius: 2px;
    background: #f7f7f7;
    color: #000000;
    font-size: 13px;
    font-weight: 500;
    line-height: 19.5px;
    white-space: nowrap;
    text-align: center;
    cursor: pointer;
    box-sizing: border-box;
}

.races-time-chip--disabled {
    cursor: default;
    opacity: 0.55;
    pointer-events: none;
}

@media (min-width: 1024px) {
    .racing-card {
        width: 54%;
        margin-top: 8px;
    }

    .races-venue-card {
        flex-direction: row;
        align-items: flex-start;
    }

    .races-venue-card__name {
        flex: 0 0 16.666%;
        width: 16.666%;
    }

    .races-venue-card__times {
        flex: 1 1 auto;
    }
}
</style>

<style>
.layout-content-row:has(.racing-page) {
    background-color: #23201f !important;
}
</style>
