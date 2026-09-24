export function getEventStarId(event) {
    const eventId = event?.event_id;
    const id = event?.id;
    if (eventId != null && String(eventId) !== '') return String(eventId);
    if (id != null && String(id) !== '') return String(id);
    return '';
}

/** True when a stored star id matches either event_id or id on the event. */
export function eventMatchesStarId(event, storedId) {
    const stored = String(storedId ?? '');
    if (!stored) return false;
    return (
        (event?.event_id != null && String(event.event_id) === stored) ||
        (event?.id != null && String(event.id) === stored)
    );
}

import { compareEventsByStartTime } from './eventSort'

export function compareEventsByOpenDate(a, b) {
    return compareEventsByStartTime(a, b)
}

/**
 * Starred events first; within each tier sort by open_date (date + time ascending).
 */
export function compareEventsWithStarPriority(a, b, isStarred) {
    const aStar = isStarred(a);
    const bStar = isStarred(b);
    if (aStar !== bStar) return aStar ? -1 : 1;
    return compareEventsByOpenDate(a, b);
}

export function sortEventsWithStarPriority(events, isStarred) {
    return [...events].sort((a, b) => compareEventsWithStarPriority(a, b, isStarred));
}
