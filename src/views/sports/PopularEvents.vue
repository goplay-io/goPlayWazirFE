<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFeaturedEventsStore } from '@/stores/events/featuredEvents'
import { useEventsStore } from '@/stores/events/events'
import { useEventTypes } from '@/composables/useEventTypes'
import { EventData } from '@/utils/eventData'

const router = useRouter()
const featuredEventsStore = useFeaturedEventsStore()
const eventsStore = useEventsStore()
const { getEventTypeIcon, getSportIcon } = useEventTypes()

const loading = ref(false)

const events = computed(() => featuredEventsStore.events || [])

const toDateTimeLabel = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

const getEventDisplayName = (event) => {
  return event?.name || EventData.getEventName(event) || ''
}

const getEventIcon = (event) => {
  const typeId = event?.event_type_id
  if (typeId != null) {
    const icon = getEventTypeIcon(Number(typeId))
    if (icon) return icon
  }
  return getSportIcon(event?.event_type_name) || null
}

const openEvent = (event) => {
  const eventId = event?.event_id || event?.id
  if (!eventId) return
  router.push(`/sports/bet/${eventId}`)
}

onMounted(async () => {
  if (featuredEventsStore.events?.length > 0) return
  loading.value = true
  try {
    await eventsStore.fetchAllEvents()
    featuredEventsStore.setFromAllEvents(eventsStore.allEvents)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="featured-events">
    <header class="featured-events__header">POPULAR EVENTS</header>

    <div v-if="loading" class="featured-events__status">Loading...</div>
    <div v-else-if="events.length === 0" class="featured-events__status">No popular events found.</div>

    <div v-else class="featured-events__list">
      <button
        v-for="event in events"
        :key="String(event.event_id || event.id)"
        type="button"
        class="featured-events__item"
        @click="openEvent(event)"
      >
        <span class="featured-events__icon">
          <component
            v-if="getEventIcon(event)"
            :is="getEventIcon(event)"
            :width="16"
            :height="16"
            class="featured-events__icon-img"
          />
          <v-icon v-else size="16" class="featured-events__icon-fallback">mdi-trophy-outline</v-icon>
        </span>
        <div class="featured-events__info">
          <p class="featured-events__name">{{ getEventDisplayName(event) }}</p>
          <span v-if="toDateTimeLabel(event.open_date)" class="featured-events__time">
            {{ toDateTimeLabel(event.open_date) }}
          </span>
        </div>
      </button>
    </div>
  </section>
</template>

<style scoped>
.featured-events {
  width: 100%;
  background: #000000;
  min-height: 100%;
}

.featured-events__header {
  background: var(--theme-orange);
  color: #ffffff;
  text-align: center;
  font-weight: 800;
  font-size: 20px;
  letter-spacing: 0.04em;
  line-height: 1;
  padding: 6px 8px;
  text-transform: uppercase;
}

.featured-events__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px;
  padding-bottom: calc(var(--mobile-bottom-nav-height, 72px) + 8px);
}

.featured-events__item {
  width: 100%;
  min-height: 0;
  border: none;
  border-radius: 10px;
  background: #595959;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  text-align: left;
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.featured-events__item:active {
  opacity: 0.92;
}

.featured-events__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.featured-events__icon-img {
  display: block;
}

.featured-events__icon :deep(img),
.featured-events__icon :deep(.sport-nav-icon) {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.featured-events__icon-fallback {
  color: #d84f3f !important;
}

.featured-events__info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.featured-events__name {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.15;
  color: #ffffff;
}

.featured-events__time {
  display: inline-flex;
  align-items: center;
  background: #167122;
  color: #ffffff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  padding: 5px 5px;
  white-space: nowrap;
}

.featured-events__status {
  padding: 12px 8px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
}

@media (min-width: 768px) {
  .featured-events {
    max-width: 640px;
    margin: 0 auto;
    border: 1px solid #2a2a2a;
  }

  .featured-events__header {
    font-size: 14px;
  }
}
</style>
