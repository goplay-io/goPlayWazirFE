import { ref } from 'vue';
import { eventMatchesStarId, getEventStarId } from '@/utils/eventStarSort';

const STORAGE_KEY = 'starred_sports_events';

const starredIds = ref([]);

const loadStarred = () => {
    try {
        if (typeof window === 'undefined') return;
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            starredIds.value = [];
            return;
        }
        const parsed = JSON.parse(stored);
        starredIds.value = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (error) {
        console.error('Error loading starred events:', error);
        starredIds.value = [];
    }
};

const saveStarred = () => {
    try {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(starredIds.value));
        }
    } catch (error) {
        console.error('Error saving starred events:', error);
    }
};

const isEventStarred = (eventOrId) => {
    if (!eventOrId) return false;
    if (typeof eventOrId === 'object') {
        return starredIds.value.some((storedId) => eventMatchesStarId(eventOrId, storedId));
    }
    return starredIds.value.includes(String(eventOrId));
};

const toggleEventStarred = (event) => {
    const id = getEventStarId(event);
    if (!id) return;

    if (isEventStarred(event)) {
        starredIds.value = starredIds.value.filter((storedId) => !eventMatchesStarId(event, storedId));
    } else {
        starredIds.value = [...starredIds.value, id];
    }
    saveStarred();
};

/**
 * Remove starred IDs from localStorage when they are not in the API event list.
 */
export function pruneStarredEventsFromApiResponse(events) {
    if (!Array.isArray(events)) {
        return;
    }

    const before = starredIds.value.length;
    if (before === 0) return;

    if (events.length === 0) {
        starredIds.value = [];
        saveStarred();
        return;
    }

    const eventIdSet = new Set();
    for (const event of events) {
        const starId = getEventStarId(event);
        if (starId) eventIdSet.add(starId);
        if (event?.event_id != null) eventIdSet.add(String(event.event_id));
        if (event?.id != null) eventIdSet.add(String(event.id));
    }

    starredIds.value = starredIds.value.filter((storedId) => eventIdSet.has(String(storedId)));

    if (starredIds.value.length !== before) {
        saveStarred();
    }
}

if (typeof window !== 'undefined') {
    loadStarred();
}

export function useStarredEvents() {
    return {
        starredIds,
        isEventStarred,
        toggleEventStarred,
        loadStarred,
        pruneStarredEventsFromApiResponse,
    };
}
