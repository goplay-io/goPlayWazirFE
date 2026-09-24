import { ref, computed } from 'vue'
import * as reports from '@/api/report/reports.js'

const DEFAULT_API_LIMIT = 20
const DEFAULT_EVENTS_PER_PAGE = 5

function groupBetsByEvent(betsList) {
  const grouped = new Map()

  betsList.forEach((bet) => {
    const eventName =
      bet.event_name ||
      bet.eventName ||
      bet.event?.name ||
      'Unknown event'
    const sportName =
      bet.event_type_name ||
      bet.sport_name ||
      bet.sportName ||
      bet.event?.sport_name ||
      ''
    const eventId = bet.event_id || bet.eventId || bet.event?.id || eventName
    const key = String(eventId)

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        eventName,
        sportName,
        eventLabel: sportName ? `${eventName} (${sportName})` : eventName,
        bets: [],
      })
    }

    grouped.get(key).bets.push(bet)
  })

  return Array.from(grouped.values())
}

function parseUnsettledResponse(response) {
  if (!response?.success) {
    return { bets: [], totalCount: 0 }
  }

  const payload = response.data

  if (payload?.meta?.pagination) {
    return {
      bets: Array.isArray(payload.data) ? payload.data : [],
      totalCount: payload.meta.pagination.total_count ?? 0,
    }
  }

  if (Array.isArray(payload)) {
    return { bets: payload, totalCount: payload.length }
  }

  return { bets: [], totalCount: 0 }
}

export function useUnsettledOpenBets(options = {}) {
  const apiLimit = options.apiLimit ?? DEFAULT_API_LIMIT
  const eventsPerPage = options.eventsPerPage ?? DEFAULT_EVENTS_PER_PAGE

  const bets = ref([])
  const totalBetCount = ref(0)
  const apiPage = ref(1)
  const eventPage = ref(1)
  const loading = ref(false)

  const allEventGroups = computed(() => groupBetsByEvent(bets.value))

  const totalEventPages = computed(() =>
    Math.max(1, Math.ceil(allEventGroups.value.length / eventsPerPage)),
  )

  const eventGroups = computed(() => {
    const start = (eventPage.value - 1) * eventsPerPage
    return allEventGroups.value.slice(start, start + eventsPerPage)
  })

  const hasMoreApiPages = computed(() => bets.value.length < totalBetCount.value)

  const canGoPrevEventPage = computed(() => eventPage.value > 1)

  const canGoNextEventPage = computed(
    () => eventPage.value < totalEventPages.value || hasMoreApiPages.value,
  )

  const mergeBets = (existing, incoming) => {
    const seen = new Set(existing.map((bet) => bet.id))
    const merged = [...existing]

    incoming.forEach((bet) => {
      if (bet?.id == null || !seen.has(bet.id)) {
        merged.push(bet)
        if (bet?.id != null) seen.add(bet.id)
      }
    })

    return merged
  }

  const fetchUnsettledBets = async ({ reset = false } = {}) => {
    if (reset) {
      apiPage.value = 1
      eventPage.value = 1
      bets.value = []
      totalBetCount.value = 0
    }

    loading.value = true

    try {
      const response = await reports.getUnsettledBets({
        page: apiPage.value,
        limit: apiLimit,
      })
      const { bets: fetchedBets, totalCount } = parseUnsettledResponse(response)

      bets.value = reset ? fetchedBets : mergeBets(bets.value, fetchedBets)
      totalBetCount.value = totalCount

      const maxEventPage = Math.max(1, Math.ceil(allEventGroups.value.length / eventsPerPage))
      if (eventPage.value > maxEventPage) {
        eventPage.value = maxEventPage
      }
    } catch (error) {
      console.error('Failed to fetch unsettled open bets:', error)
      if (reset) {
        bets.value = []
        totalBetCount.value = 0
      }
    } finally {
      loading.value = false
    }
  }

  const fetchNextApiPage = async () => {
    if (!hasMoreApiPages.value || loading.value) return false

    apiPage.value += 1
    await fetchUnsettledBets({ reset: false })
    return true
  }

  const goToPrevEventPage = () => {
    if (eventPage.value > 1) {
      eventPage.value -= 1
    }
  }

  const goToNextEventPage = async () => {
    const nextPage = eventPage.value + 1
    const eventsNeeded = nextPage * eventsPerPage

    while (allEventGroups.value.length < eventsNeeded && hasMoreApiPages.value && !loading.value) {
      const fetched = await fetchNextApiPage()
      if (!fetched) break
    }

    if (nextPage <= totalEventPages.value) {
      eventPage.value = nextPage
    }
  }

  const refreshUnsettledBets = () => fetchUnsettledBets({ reset: true })

  return {
    bets,
    totalBetCount,
    eventPage,
    totalEventPages,
    eventGroups,
    allEventGroups,
    loading,
    hasMoreApiPages,
    canGoPrevEventPage,
    canGoNextEventPage,
    fetchUnsettledBets,
    refreshUnsettledBets,
    goToPrevEventPage,
    goToNextEventPage,
  }
}
