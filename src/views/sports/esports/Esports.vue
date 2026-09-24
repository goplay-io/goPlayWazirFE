<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n'
import LiveDot from '@/components/LiveDot.vue';
import Loading from '@/components/Loading.vue';
import EventRow from '@/components/EventRow.vue';
import { getEventsList } from '@/api/event/events';
import { useStarredEvents } from '@/composables/useStarredEvents';
import { sortEventsWithStarPriority } from '@/utils/eventStarSort';

const events = ref([]);
const finalData = ref();
const loading = ref(false);
const menuList = ref([]);
const noEvent = ref(false);
const activeTab = ref(0);
const { t } = useI18n()
const { starredIds, isEventStarred } = useStarredEvents();

const refreshData = async () => {
  events.value = window.filterVirtualEvents(events.value);
  finalData.value = window.groupByEventTypes(events.value, menuList.value);
}


// Computed property for filtered events based on active tab
const filteredEvents = computed(() => {
    void starredIds.value;
    if (!finalData.value || finalData.value.length === 0) return [];
    // Show events for selected tab
    const selectedParent = finalData.value[activeTab.value];
    const list = selectedParent ? selectedParent.events : [];
    return sortEventsWithStarPriority(list, isEventStarred);
});

// Computed property to get the event type name
const eventTypeName = computed(() => {
    return t('pages.esports.title')
});

// Computed property to get the event icon
const eventIcon = computed(() => {
    return '🎮';
});

onMounted(async () => {
  let res = await window.getEventTypes();
  menuList.value = res.data.menu;

  loading.value = true;
  const response = await getEventsList();
  events.value = response.data.events;
  refreshData();
  loading.value = false;
});

const intervalId = setInterval(refreshData, 1000);

// Watch for tab changes to immediately refresh data for the new tab
watch(activeTab, () => {
    refreshData();
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>
<template>
        <v-container fluid class="tw-px-2 md:tw-px-4">
            <v-row v-if="finalData">
                <v-col cols="12">
                    <v-card class="tw-p-3 tw-rounded-lg tw-text-textLight1 tw-text-sm">
                        <v-card-text class="tw-p-0">
                            <div class="tw-mb-4">
                                <div class="tw-mb-3">
                                    <v-card-title
                                        class="tw-text-2xl tw-font-bold tw-flex tw-items-center tw-p-0 tw-m-0">
                                        <span v-html="eventIcon" class="tw-mr-2" style="font-size: 24px;"></span>
                                        {{ eventTypeName.charAt(0).toUpperCase() + eventTypeName.slice(1).toLowerCase()
                                        }}
                                    </v-card-title>
                                </div>
                                
                                <!-- Category Filter Chips -->
                                <div class="tw-mb-3">
                                    <v-chip-group
                                        v-model="activeTab"
                                        mandatory
                                        selected-class="tw-bg-primary tw-text-white"
                                        class="tw-gap-2"
                                    >
                                        <v-chip 
                                            v-for="(parent, index) in finalData" 
                                            :key="index" 
                                            :value="index"
                                            variant="flat"
                                            class="tw-text-theme-text hover:tw-bg-primary tw-transition-colors tw-flex tw-items-center tw-gap-2"
                                            :class="{ 'tw-bg-primary tw-text-white': activeTab === index }"
                                            @click="activeTab = index"
                                        >
                                            <span>{{ parent.event_type_name }}</span>
                                            <span class="tw-bg-theme-surface-alt tw-text-xs tw-rounded-full tw-w-5 tw-h-5 tw-flex tw-items-center tw-justify-center tw-font-semibold tw-ml-1 border">
                                                {{ parent.events.length }}
                                            </span>
                                        </v-chip>
                                    </v-chip-group>
                                </div>
                            </div>

                            <div
                                class="tw-hidden lg:tw-flex tw-w-full tw-border tw-border-bgVariant2 tw-py-2 tw-px-3 tw-text-sm tw-mb-2 tw-text-textLight1 tw-font-semibold tw-bg-bgVariant1 tw-rounded-lg">
                                <div class="tw-w-3/4 tw-text-left">{{ t('pages.esports.game') }}</div>
                                <div class="tw-w-1/4 tw-flex tw-justify-between tw-text-xs">
                                    <div class="tw-text-center tw-w-1/3">{{ t('pages.esports.col1') }}</div>
                                    <div class="tw-text-center tw-w-1/3">{{ t('pages.esports.colX') }}</div>
                                    <div class="tw-text-center tw-w-1/3">{{ t('pages.esports.col2') }}</div>
                                </div>
                            </div>

                            <div v-if="!loading">
                                <EventRow
                                    v-for="(event, index) in filteredEvents"
                                    :key="event.id" :event="event" />
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <!-- Loading State -->
            <Loading v-else-if="loading" />

            <!-- No Events State -->
            <v-row v-else-if="noEvent">
                <v-col cols="12" class="tw-mt-5">
                    <div class="tw-flex tw-justify-center tw-items-center tw-min-h-[500px]">
                        <v-alert type="info" variant="tonal" class="tw-text-center">
                                {{ t('pages.esports.noEvents', { type: eventTypeName }) }}
                            </v-alert>
                    </div>
                </v-col>
            </v-row>

            <!-- Fallback Loading State -->
            <Loading v-else />
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
</style>
