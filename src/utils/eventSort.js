import { parseOpenDateMs } from './liveStatus'

const TEST_MATCHES_COMPETITION = 'test matches'

export function isTestMatchesEvent(event) {
    return String(event?.competition_name || '').trim().toLowerCase() === TEST_MATCHES_COMPETITION
}

export function startOfLocalDay(date = new Date()) {
    const d = new Date(date)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function startOfNextLocalDay(date = new Date()) {
    const next = startOfLocalDay(date)
    next.setDate(next.getDate() + 1)
    return next
}

export function isOpenDateBeforeToday(openDate, now = new Date()) {
    const openMs = parseOpenDateMs(openDate)
    if (openMs == null) return false
    return openMs < startOfLocalDay(now).getTime()
}

/**
 * Effective sort timestamp for time view.
 * Ongoing Test Matches (open date before today) sort after today's one-day fixtures.
 */
export function getEventSortTime(event, now = new Date()) {
    const openMs = parseOpenDateMs(event?.open_date)
    if (openMs == null) return Number.POSITIVE_INFINITY

    if (isTestMatchesEvent(event) && isOpenDateBeforeToday(event.open_date, now)) {
        return startOfNextLocalDay(now).getTime()
    }

    return openMs
}

export function compareEventsByStartTime(a, b, now = new Date()) {
    const timeA = getEventSortTime(a, now)
    const timeB = getEventSortTime(b, now)

    if (timeA !== timeB) return timeA - timeB

    const openA = parseOpenDateMs(a?.open_date) ?? Number.POSITIVE_INFINITY
    const openB = parseOpenDateMs(b?.open_date) ?? Number.POSITIVE_INFINITY
    return openA - openB
}

export function sortEventsByStartTime(events, now = new Date()) {
    if (!Array.isArray(events) || events.length === 0) return events
    return [...events].sort((a, b) => compareEventsByStartTime(a, b, now))
}
