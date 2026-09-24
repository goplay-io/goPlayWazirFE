import { computed } from 'vue'
import { useStarredEvents } from '@/composables/useStarredEvents'
import { compareEventsByOpenDate, sortEventsWithStarPriority } from '@/utils/eventStarSort'
import { getEventSortTime } from '@/utils/eventSort'
import { isPremiumEvent } from '@/utils/premiumStatus'

/**
 * @param {import('vue').Ref} eventsList - [{ events: [...] }]
 * @param {import('vue').Ref} sortByRef - 'time' | 'competition'
 * @param {import('vue').Ref<boolean>} isLiveRef
 * @param {import('vue').Ref<boolean>} [isPremiumRef] - when true, keep premium events (premium_active / provider)
 *   If both live and premium are on, events match **OR** (in-play or premium), not both at once.
 */
export function useCompetitionGrouping(eventsList, sortByRef, isLiveRef, isPremiumRef = { value: false }) {
    const { starredIds, isEventStarred } = useStarredEvents()

    const isLiveEvent = (event) =>
        event.in_play === true || event.in_play === 1 || event.in_play === '1'

    const applyLivePremiumFilter = (events) => {
        const liveOn = !!isLiveRef.value
        const premiumOn = !!isPremiumRef.value
        if (!liveOn && !premiumOn) return events
        if (liveOn && premiumOn) {
            return events.filter((e) => isLiveEvent(e) || isPremiumEvent(e))
        }
        if (liveOn) return events.filter((e) => isLiveEvent(e))
        return events.filter((e) => isPremiumEvent(e))
    }

    const sortEvents = (events) => {
        void starredIds.value
        const filtered = applyLivePremiumFilter(events)

        if (sortByRef.value === 'competition') {
            return [...filtered].sort((a, b) => {
                const nameA = (a.competition_name || '').toLowerCase()
                const nameB = (b.competition_name || '').toLowerCase()
                return nameA.localeCompare(nameB)
            })
        }

        return sortEventsWithStarPriority(filtered, isEventStarred)
    }

    const groupedEventsByCompetition = computed(() => {
        void starredIds.value
        const sorted = sortEvents(eventsList.value?.[0]?.events || [])
        const groups = {}

        sorted.forEach(event => {
            const competitionName = event.competition_name || 'Other'
            if (!groups[competitionName]) {
                groups[competitionName] = []
            }
            groups[competitionName].push(event)
        })

        return Object.keys(groups)
            .map(name => ({
                name,
                events: [...groups[name]].sort(compareEventsByOpenDate)
            }))
            .sort((a, b) => {
                const earliestA = Math.min(...a.events.map((event) => getEventSortTime(event)))
                const earliestB = Math.min(...b.events.map((event) => getEventSortTime(event)))
                return earliestA - earliestB
            })
    })

    return {
        sortEvents,
        groupedEventsByCompetition
    }
}
