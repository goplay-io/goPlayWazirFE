import { defineStore } from 'pinia';

const SESSION_KEY = 'featured_events_cache';

const readSession = () => {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
    } catch {
        return [];
    }
};

const writeSession = (events) => {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(events));
    } catch {
        // session storage full or unavailable — fail silently
    }
};

export const useFeaturedEventsStore = defineStore('featuredEvents', {
    state: () => ({
        events: readSession()
    }),
    actions: {
        /** Call once after the all-events fetch. Filters and persists. */
        setFromAllEvents(allEvents) {
            const featured = Array.isArray(allEvents)
                ? allEvents.filter((e) => e.is_featured === true || e.is_featured === 1)
                : [];
            this.events = featured;
            writeSession(featured);
        },
        clear() {
            this.events = [];
            sessionStorage.removeItem(SESSION_KEY);
        }
    }
});
