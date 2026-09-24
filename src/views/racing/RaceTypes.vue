<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Loading from '@/components/Loading.vue';
import Flag from '@/components/Flag.vue';
import Countdown from '@/components/Icons/Countdown.vue';
import ClockTicking from '@/components/Icons/ClockTicking.vue';
import Clock from '@/components/Icons/Clock.vue';
import Calendar from '@/components/Icons/Calendar.vue';
import GreyhoundRacing from '@/components/Icons/Greyhound Racing.vue';
import HorseRacing from '@/components/Icons/Horse Racing.vue';
import { getAllRaces } from '@/api/event/races';
import { useEventsStore } from '@/stores/events/events';
import { groupRaces, categorizeRaceTimes, getUniqueCountryCodes } from '@/utils/raceUtils';
import horseRacingBg from '@/assets/horse-racing.jpg';
import houndRacingBg from '@/assets/hound-racing.jpg';

const { t } = useI18n()
const router = useRouter();
const iconMap = {
    GreyhoundRacing,
    HorseRacing
}

const backgroundImageMap = {
    'Horse Racing': horseRacingBg,
    'Greyhound Racing': houndRacingBg
}

const getIconComponent = (name) => {
    return iconMap[name] || null
}

const getBackgroundImage = (name) => {
    return backgroundImageMap[name] || null
}

const navigateToRace = (raceKey) => {
    const underscoreRaceKey = raceKey.toLowerCase().replace(/\s+/g, '_');
    router.push(`/racing/races/${underscoreRaceKey}`);
};

const props = defineProps({
    user_id: String
})

const eventsStore = useEventsStore();
const loading = ref(false);
const eventTypeList = ref([]);
const raceCounts = ref({});
const groupedRaces = ref({});

const raceTypesArray = computed(() => {
    return Object.entries(raceCounts.value).map(([key, group]) => {
        // Extract countries for this specific race type
        const racesOfThisType = groupedRaces.value[key] || [];
        const countries = getUniqueCountryCodes(racesOfThisType);
        
        return {
            key,
            name: key,
            ...group,
            icon: getIconComponent(key.replace(/\s+/g, '')),
            backgroundImage: getBackgroundImage(key),
            countries
        };
    });
});

onMounted(async () => {
    loading.value = true;

    try {
        if (!eventsStore.hasData) {
            await eventsStore.fetchEventTypes();
        }

        eventTypeList.value = eventsStore.getRaceTypes;

        if (eventTypeList.value.length === 0) {
            console.warn('No horse or greyhound racing event types found');
            raceCounts.value = {};
            return;
        }

        const raceEventTypeIds = eventTypeList.value.map(et => et.id).filter(Boolean);
        const response = await getAllRaces();
        const allRaces = response.data?.races || response.races || [];
        const filteredRaces = allRaces.filter(race => 
            raceEventTypeIds.includes(race.event_type_id)
        );

        const grouped = groupRaces(eventTypeList.value, filteredRaces);
        groupedRaces.value = grouped;
        raceCounts.value = categorizeRaceTimes(grouped);
    } catch (error) {
        console.error('Error loading race types:', error);
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <v-container fluid class="racing-page tw-px-4 tw-py-6">
        <v-row no-gutters class="sports-home-main-grid">
            <v-col cols="12" class="tw-p-0">
        <!-- Header Section -->
        <div class="header-section">
            <v-icon icon="mdi-horse-human" class="header-icon" size="24"></v-icon>
            <h1 class="header-title">{{ t('sports.racing.title') }}</h1>
        </div>

        <!-- Race Types Grid -->
        <div v-if="!loading" class="race-grid">
            <v-card v-for="raceType in raceTypesArray" :key="raceType.key"
                class="race-card tw-overflow-hidden tw-transition-all tw-duration-300 hover:tw-shadow-2xl hover:tw-transform hover:-tw-translate-y-2"
                elevation="4" variant="flat">
                
                <!-- Background Image with Dark Overlay -->
                <div v-if="raceType.backgroundImage" 
                    class="race-card-background"
                    :style="{ backgroundImage: `url(${raceType.backgroundImage})` }">
                    <div class="race-card-overlay"></div>
                </div>

                <v-card-text class="card-content">
                    <!-- Race Type Header -->
                    <div class="race-header">
                        <div class="tw-flex tw-items-center">
                            <component v-if="raceType.icon" :is="raceType.icon"
                                class="race-icon" />
                            <v-icon v-else icon="mdi-horse-human" class="race-icon"
                                size="32"></v-icon>
                                <div>
                                <h3 class="race-title">{{ raceType.name }}</h3>
                            </div>
                        </div>
                        <v-btn 
                            @click.stop="navigateToRace(raceType.key)"
                            variant="text"
                            size="small"
                            icon="mdi-arrow-right"
                            class="tw-bg-white/10 tw-backdrop-blur-sm tw-border tw-border-white/20 tw-text-white hover:tw-bg-white/20 tw-shadow-md">
                        </v-btn>
                    </div>

                    <!-- Available Countries Flags (MOVED TO TOP) -->
                    <div v-if="raceType.countries && raceType.countries.length > 0" class="countries-container">
                        <p class="countries-label">Available Countries</p>
                        <div class="flags-grid">
                            <Flag v-for="country in raceType.countries" :key="country" :code="country" size="md" :title="country" />
                        </div>
                    </div>

                    <!-- Race Statistics - Horizontal scroll on mobile -->
                    <div class="stats-container">
                        <!-- Now Running -->
                        <div class="stat-row">
                                <div class="stat-label">
                                <ClockTicking color="currentColor" width="16" height="16"
                                    class="tw-text-success" />
                                <span class="tw-text-white">{{ t('sports.racing.stats.nowRunning') }}</span>
                                </div>
                            <span class="stat-value">{{ raceType.now }}</span>
                        </div>

                        <!-- Starting Soon -->
                        <div class="stat-row">
                                <div class="stat-label">
                                <Countdown color="currentColor" width="16" height="16"
                                    class="tw-text-warning" />
                                <span class="tw-text-white">{{ t('sports.racing.stats.startingSoon') }}</span>
                                </div>
                            <span class="stat-value">{{ raceType.startingSoon }}</span>
                        </div>

                        <!-- Upcoming in 1 Hour -->
                        <div class="stat-row">
                                <div class="stat-label">
                                <Clock color="currentColor" width="16" height="16" class="tw-text-info" />
                                <span class="tw-text-white">{{ t('sports.racing.stats.nextHour') }}</span>
                                </div>
                            <span class="stat-value">{{ raceType.in1Hour }}</span>
                        </div>

                        <!-- Upcoming in 2 Hours -->
                        <div class="stat-row">
                                <div class="stat-label">
                                <Clock color="currentColor" width="16" height="16"
                                    class="tw-text-primary" />
                                <span class="tw-text-white">{{ t('sports.racing.stats.next2Hours') }}</span>
                                </div>
                            <span class="stat-value">{{ raceType.in2Hours }}</span>
                        </div>

                        <!-- Today's Total -->
                        <div class="stat-row stat-total">
                                <div class="stat-label">
                                <Calendar color="currentColor" width="16" height="16"
                                    class="tw-text-white" />
                                <span class="tw-text-white tw-font-semibold">{{ t('sports.racing.stats.totalToday') }}</span>
                                </div>
                            <span class="stat-value stat-value-large">{{ raceType.today }}</span>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </div>

        <!-- Loading State -->
        <div v-else class="tw-flex tw-justify-center tw-items-center tw-min-h-[500px]">
            <Loading speed="0.8s" />
        </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<style scoped>
/* Match Races.vue / desktop: light page shell, not full-bleed dark gradient */
.racing-page {
    background: var(--color-background);
    min-height: 100%;
    border-radius: 0;
}

.sports-home-main-grid {
    align-items: flex-start;
}

/* Container */
.tw-px-4 {
    padding-left: 10px;
    padding-right: 10px;
}

.tw-py-6 {
    padding-top: 8px;
    padding-bottom: calc(var(--mobile-bottom-nav-height, 56px) + 10px);
}

/* Header — same bar treatment as Races.vue (.races-header) */
.header-section {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    margin-bottom: 12px;
    padding: 8px 10px;
    border-radius: 0;
    box-sizing: border-box;
    background: var(--color-nav);
    border: none;
    border-bottom: 2px solid var(--color-primary);
}

.header-icon {
    color: var(--color-primary) !important;
    flex-shrink: 0;
}

.header-title {
    font-size: 0.9375rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--color-nav-text);
    margin: 0;
    line-height: 1.25;
}

/* Race Grid */
.race-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
}

/* Race Card */
.race-card {
    position: relative;
    min-height: 200px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    border: 1px solid rgba(0, 180, 216, 0.2) !important;
    border-radius: 12px !important;
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.35),
        inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
    background: transparent !important;
}

.race-card-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 0;
}

.race-card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* Slightly lighter than before so cards read better on light page (mobile + desktop) */
    background: linear-gradient(
        135deg,
        rgba(7, 17, 35, 0.72) 0%,
        rgba(33, 46, 68, 0.62) 45%,
        rgba(0, 0, 0, 0.42) 100%
    );
    z-index: 1;
    transition: background 0.3s ease;
}

.card-content {
    position: relative;
    z-index: 2;
    padding: 8px !important;
}

/* Race Header */
.race-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
}

.race-icon {
    width: 28px;
    height: 28px;
    margin-right: 8px;
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.race-title {
    font-size: 14px;
    font-weight: bold;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    line-height: 1.2;
}

.race-subtitle {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Stats Container */
.stats-container {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}

.stats-container::-webkit-scrollbar {
    display: none;
}

.stat-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 7px;
    background: rgba(7, 17, 35, 0.45);
    backdrop-filter: blur(12px);
    border-radius: 6px;
    border: 1px solid rgba(0, 180, 216, 0.18);
    min-width: 85px;
    flex-shrink: 0;
}

.stat-label {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 9px;
    font-weight: 500;
}

.stat-label span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.stat-value {
    font-size: 16px;
    font-weight: bold;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.stat-value-large {
    font-size: 18px;
}

.stat-total {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background: rgba(0, 180, 216, 0.12);
    border: 1px solid rgba(0, 180, 216, 0.35);
    box-shadow: 0 4px 16px rgba(0, 180, 216, 0.08);
    min-width: 140px;
}

/* Countries Container */
.countries-container {
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.countries-label {
    font-size: 10px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 6px 0;
    letter-spacing: 0.5px;
}

.flags-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}

/* Desktop - Same grid layout as mobile, just bigger */
@media (min-width: 768px) {
    .tw-px-4 {
        padding-left: 16px;
        padding-right: 16px;
    }

    .tw-py-6 {
        padding-top: 16px;
        padding-bottom: 16px;
    }

    .header-section {
        margin-bottom: 16px;
    }

    .header-title {
        font-size: 1.125rem;
    }

    .race-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
    }

    .race-card {
        min-height: 320px;
    }

    .race-card:hover .race-card-overlay {
        background: linear-gradient(
            135deg,
            rgba(7, 17, 35, 0.84) 0%,
            rgba(33, 46, 68, 0.74) 50%,
            rgba(0, 0, 0, 0.52) 100%
        );
    }

    .race-card:hover {
        transform: translateY(-8px);
        box-shadow:
            0 24px 48px rgba(0, 0, 0, 0.45),
            0 0 0 1px rgba(0, 180, 216, 0.25) !important;
    }

    .race-card:hover .v-btn {
        transform: scale(1.02);
    }

    .card-content {
        padding: 12px !important;
    }

    .race-header {
        margin-bottom: 8px;
    }

    .race-icon {
        width: 28px;
        height: 28px;
        margin-right: 8px;
    }

    .race-title {
        font-size: 16px;
    }

    .race-subtitle {
        font-size: 10px;
    }

    .stats-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        overflow: visible;
    }

    .stat-row {
        padding: 10px 8px;
        min-width: unset;
        flex-shrink: unset;
    }

    .stat-label {
        font-size: 10px;
        gap: 3px;
    }

    .stat-value {
        font-size: 18px;
    }

    .stat-value-large {
        font-size: 20px;
    }

    .stat-total {
        grid-column: auto;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        min-width: unset;
    }
}

/* Smooth transitions */
.tw-transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
}

.v-chip {
    transition: all 0.2s ease-in-out;
}

.v-chip:hover {
    transform: scale(1.05);
}

</style>