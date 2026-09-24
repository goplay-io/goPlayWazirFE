<template>
    <div v-if="currentUpcomingEvent"
        class="tw-w-full tw-flex tw-items-center tw-gap-1.5 tw-px-2 tw-py-1 lg:tw-py-0 tw-overflow-hidden tw-relative tw-flex-shrink-0 sm:tw-gap-3 sm:tw-px-3 sm:tw-py-0.5 xl:tw-gap-4 tw-z-20 tw-cursor-pointer"
        @click="navigateToEvent">

        <div
            class="tw-relative tw-px-2 tw-py-1.5 lg:tw-py-1 tw-inline-flex tw-items-center tw-flex-shrink-0 tw-rounded-l tw-shadow-md sm:tw-px-3 sm:tw-py-2 fixture-badge">
            <!-- Blinking background -->
            <div
                class="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-green-600 tw-to-green-700 tw-rounded-l tw-animate-pulse">
            </div>

            <!-- Text content (stays visible) -->
            <span
                class="tw-relative tw-z-10 tw-text-white tw-font-bold tw-text-[0.6rem] tw-uppercase tw-tracking-wide tw-whitespace-nowrap sm:tw-text-xs">
                {{ t('components.upcomingEvent.upcoming') }}
            </span>
        </div>

        <Transition name="fixture-slide" mode="out-in">
            <div
                :key="currentUpcomingEvent?.event_id || `${matchDetails}-${formattedDateTime}`"
                class="tw-flex tw-items-center tw-gap-1.5 tw-flex-1 tw-min-w-0 sm:tw-gap-2">
                <!-- Event Icon (Common for both name and date) -->
                <component v-if="eventIcon" :is="eventIcon"
                    class="tw-w-3 tw-h-3 tw-text-green-400 tw-flex-shrink-0 sm:tw-w-4 sm:tw-h-4" />
                <v-icon v-else size="12" class="tw-text-green-400 tw-flex-shrink-0 sm:tw-text-base">mdi-calendar</v-icon>

                <!-- Event Details Box (Name + Date always stacked) -->
                <div class="tw-flex tw-flex-col tw-gap-0.5 tw-flex-1 tw-min-w-0">
                    <!-- Match Details -->
                    <div class="tw-flex tw-items-center tw-flex-1 tw-min-w-0">
                        <span class="tw-text-theme-text tw-font-semibold tw-text-[0.65rem] tw-truncate sm:tw-text-sm">
                            {{ matchDetails }}
                        </span>
                    </div>

                    <!-- Date and Time -->
                    <div
                        class="tw-flex tw-items-center tw-gap-1 tw-text-theme-text tw-font-medium tw-text-[0.6rem] tw-whitespace-nowrap sm:tw-gap-1.5 sm:tw-text-xs">
                        <v-icon size="10" class="tw-text-theme-text sm:tw-text-sm">mdi-clock-outline</v-icon>
                        <span class="tw-font-medium">{{ formattedDateTime }}</span>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings.js'
import { useEventTypes } from '@/composables/useEventTypes.js'
import { useI18n } from 'vue-i18n'
import { useEventsStore } from '@/stores/events/events.js'
import { prefetchBetEvent } from '@/composables/useBetEventPrefetch'

const router = useRouter()
const settingsStore = useSettingsStore()
const eventsStore = useEventsStore()
const { getEventTypeIcon } = useEventTypes()
const { t } = useI18n()
const activeIndex = ref(0)
const rotationTimer = ref(null)
const ROTATION_DELAY_MS = 4000
const resolvedUpcomingEvents = ref([])
let resolveRequestId = 0

const parseUpcomingEvents = (value) => {
    if (!value) return []

    let parsed = value
    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) return []

        try {
            parsed = JSON.parse(trimmed)
        } catch (error) {
            return []
        }
    }

    const normalizedList = Array.isArray(parsed) ? parsed : [parsed]
    return normalizedList.filter((item) => {
        if (!item || typeof item !== 'object') return false
        return Boolean(item.name || item.event_name)
    })
}

const parseUpcomingEventIds = (value) => {
    if (!value) return []

    let parsed = value
    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) return []

        try {
            parsed = JSON.parse(trimmed)
        } catch (error) {
            const numericValue = Number(trimmed)
            return Number.isFinite(numericValue) ? [numericValue] : []
        }
    }

    const list = Array.isArray(parsed) ? parsed : [parsed]
    return list
        .map((item) => {
            if (typeof item === 'number') return item
            if (typeof item === 'string') return Number(item)
            if (item && typeof item === 'object') return Number(item.event_id)
            return NaN
        })
        .filter((id) => Number.isFinite(id))
}

const normalizeEventForBanner = (event) => {
    if (!event || typeof event !== 'object') return null

    const eventId = Number(event.event_id ?? event.id)
    if (!Number.isFinite(eventId)) return null

    const name = event.name || event.event_name || ''
    if (!name) return null

    return {
        ...event,
        event_id: eventId,
        name,
        event_name: event.event_name || name,
        open_date: event.open_date || event.event_open_time || null,
        event_type_id: event.event_type_id ?? event.eventTypeId ?? null,
    }
}

const parsedUpcomingEvents = computed(() => parseUpcomingEvents(settingsStore.upcomingEvent))
const parsedUpcomingEventIds = computed(() => parseUpcomingEventIds(settingsStore.upcomingEvent))

const upcomingEvents = computed(() => {
    if (parsedUpcomingEvents.value.length > 0) return parsedUpcomingEvents.value
    return resolvedUpcomingEvents.value
})

const currentUpcomingEvent = computed(() => {
    if (!upcomingEvents.value.length) return null
    const safeIndex = activeIndex.value % upcomingEvents.value.length
    return upcomingEvents.value[safeIndex]
})

const clearRotationTimer = () => {
    if (!rotationTimer.value) return
    clearInterval(rotationTimer.value)
    rotationTimer.value = null
}

const startRotationTimer = () => {
    clearRotationTimer()

    if (upcomingEvents.value.length <= 1) return

    rotationTimer.value = setInterval(() => {
        activeIndex.value = (activeIndex.value + 1) % upcomingEvents.value.length
    }, ROTATION_DELAY_MS)
}

const matchDetails = computed(() => {
    if (!currentUpcomingEvent.value) return ''
    return currentUpcomingEvent.value.name || currentUpcomingEvent.value.event_name || ''
})

const eventIcon = computed(() => {
    if (!currentUpcomingEvent.value?.event_type_id) return null
    return getEventTypeIcon(currentUpcomingEvent.value.event_type_id)
})

const formattedDateTime = computed(() => {
    if (!currentUpcomingEvent.value?.open_date) return ''

    try {
        const date = new Date(currentUpcomingEvent.value.open_date)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')

        const offset = -date.getTimezoneOffset()
        const offsetHours = Math.floor(Math.abs(offset) / 60)
        const offsetMinutes = Math.abs(offset) % 60
        const offsetSign = offset >= 0 ? '+' : '-'
        const timezone = `UTC${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`

        return `${day}/${month}/${year} ${hours}:${minutes} (${timezone})`
    } catch (e) {
        return currentUpcomingEvent.value.open_date || ''
    }
})

const navigateToEvent = () => {
    const eventId = currentUpcomingEvent.value?.event_id
    if (!eventId) return
    prefetchBetEvent(eventId)
    router.push(`/sports/bet/${eventId}`)
}

watch(upcomingEvents, (list) => {
    if (!list.length) {
        activeIndex.value = 0
        clearRotationTimer()
        return
    }

    activeIndex.value = 0
    startRotationTimer()
}, { immediate: true })

watch(parsedUpcomingEventIds, async (ids) => {
    const requestId = ++resolveRequestId

    if (!ids.length || parsedUpcomingEvents.value.length > 0) {
        resolvedUpcomingEvents.value = []
        return
    }

    try {
        await eventsStore.fetchAllEvents()
        if (requestId !== resolveRequestId) return

        const allEvents = (eventsStore.allEvents || [])
            .map(normalizeEventForBanner)
            .filter(Boolean)

        const idSet = new Set(ids.map((id) => Number(id)))
        const filteredEvents = allEvents.filter((event) => {
            const eventId = Number(event?.event_id)
            return idSet.has(eventId)
        })

        const sortedBySelectedOrder = ids
            .map((id) => filteredEvents.find((event) => Number(event?.event_id) === Number(id)))
            .filter(Boolean)

        resolvedUpcomingEvents.value = sortedBySelectedOrder
    } catch (error) {
        if (requestId !== resolveRequestId) return
        resolvedUpcomingEvents.value = []
    }
}, { immediate: true })

onUnmounted(() => {
    resolveRequestId += 1
    clearRotationTimer()
})
</script>

<style scoped>
.fixture-badge {
    clip-path: polygon(0 0,
            calc(100% - 0.375rem) 0,
            100% 50%,
            calc(100% - 0.375rem) 100%,
            0 100%);
}

.fixture-slide-enter-active,
.fixture-slide-leave-active {
    transition: transform 0.35s ease, opacity 0.35s ease;
}

.fixture-slide-enter-from {
    opacity: 0;
    transform: translateX(18px);
}

.fixture-slide-leave-to {
    opacity: 0;
    transform: translateX(-18px);
}

.fixture-slide-enter-to,
.fixture-slide-leave-from {
    opacity: 1;
    transform: translateX(0);
}

@media (min-width: 640px) {
    .fixture-badge {
        clip-path: polygon(0 0,
                calc(100% - 0.5rem) 0,
                100% 50%,
                calc(100% - 0.5rem) 100%,
                0 100%);
    }
}
</style>