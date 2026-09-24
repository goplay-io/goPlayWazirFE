import { defineStore } from 'pinia'
import eventAPI from '@/api/event'
import { getEventsList, clearEventsListCache } from '@/api/event/events'
import { clearEventTypesCache } from '@/api/event/eventTypes'
import { filterActiveListEvents } from '@/utils/eventListStatus'

// Module-level: one in-flight promise shared across all callers (SportsHome + SportsTree etc.)
let _eventsInFlight = null
let _eventTypesInFlight = null

export const useEventsStore = defineStore('events', {    state: () => ({
        eventTypes: [],
        allEvents: [], // Store all events from getEventList
        loading: false,
        eventsLoading: false, // Separate loading state for events
        error: null,
        eventsError: null, // Separate error state for events
        fetched: false, // Track if we've already fetched data this session
        eventsFetched: false, // Track if events have been fetched
        lastFetchTime: null, // Track when we last fetched data
        lastEventsFetchTime: null, // Track when we last fetched events
    }),

    getters: {
        // Get all event types
        allEventTypes: (state) => state.eventTypes,
        
        // Get event type by ID
        getEventTypeById: (state) => (id) => {
            return state.eventTypes.find(type => type.id === id)
        },
        
        // Get event type by name
        getEventTypeByName: (state) => (name) => {
            return state.eventTypes.find(type => 
                type.name.toLowerCase() === name.toLowerCase()
            )
        },
        
        // Get sports (filtering out esports and racing)
        sportsTypes: (state) => {
            const excludeCategories = ['esports', 'racing', 'e-sports', 'horse racing', 'greyhound racing']
            return state.eventTypes.filter(type => 
                !excludeCategories.some(category => 
                    type.name.toLowerCase().includes(category.toLowerCase())
                )
            )
        },
        
        // Get esports
        esportsTypes: (state) => {
            return state.eventTypes.filter(type => 
                type.name.toLowerCase().includes('virtual') || 
                type.name.toLowerCase().includes('esport') ||
                type.name.toLowerCase().includes('e-sport')
            )
        },
        
        // Get racing events
        racingTypes: (state) => {
            return state.eventTypes.filter(type => 
                type.name.toLowerCase().includes('racing') || 
                type.name.toLowerCase().includes('horse') ||
                type.name.toLowerCase().includes('greyhound')
            )
        },
        
        // Get race types (Horse Racing: 7, Greyhound Racing: 4339)
        getRaceTypes: (state) => {
            const raceTypeIds = [7, 4339];
            return state.eventTypes.filter(type => 
                raceTypeIds.includes(type.id)
            )
        },
          // Check if loading
        isLoading: (state) => state.loading,
        
        // Get error
        getError: (state) => state.error,
        
        // Check if data has been fetched this session
        isFetched: (state) => state.fetched,
        
        // Check if we have data (either loaded or fetched)
        hasData: (state) => state.eventTypes.length > 0,
        
        // Get all events
        getAllEvents: (state) => state.allEvents,
        
        // Check if events are loading
        isEventsLoading: (state) => state.eventsLoading,
        
        // Get events error
        getEventsError: (state) => state.eventsError,
        
        // Check if events have been fetched
        areEventsFetched: (state) => state.eventsFetched,
        
        // Check if we have events data
        hasEventsData: (state) => state.allEvents.length > 0,
        
        // Get events with merged event_type_name
        getEventsWithTypeNames: (state) => {
            return state.allEvents.map(event => {
                const eventType = state.eventTypes.find(type => type.id === event.event_type_id)
                return {
                    ...event,
                    event_type_name: eventType ? eventType.name : null
                }
            })
        },
        
        // Get events grouped by event type (for components like Live.vue)
        getEventsGroupedByType: (state) => {
            const groupedEvents = {}
            
            state.allEvents.forEach(event => {
                const eventType = state.eventTypes.find(type => type.id === event.event_type_id)
                const eventTypeName = eventType ? eventType.name : `Unknown Type ${event.event_type_id}`
                
                if (!groupedEvents[eventTypeName]) {
                    groupedEvents[eventTypeName] = {
                        event_type_name: eventTypeName,
                        event_type_id: event.event_type_id,
                        events: []
                    }
                }
                
                groupedEvents[eventTypeName].events.push({
                    ...event,
                    event_type_name: eventTypeName
                })
            })
            
            return Object.values(groupedEvents)
        },
    },    actions: {
        // Fetch event types from API (only once per session; concurrent callers share one request)
        async fetchEventTypes(force = false) {
            if (this.fetched && this.eventTypes.length > 0 && !force) {
                return this.eventTypes
            }

            if (_eventTypesInFlight) {
                await _eventTypesInFlight
                return this.eventTypes
            }

            this.loading = true
            this.error = null

            _eventTypesInFlight = (async () => {
                try {
                    if (force) {
                        clearEventTypesCache()
                    }

                    const response = await eventAPI.getAllEventTypes()

                    // Handle different response structures: response.data.menu or response.menu or response.data
                    const eventTypesData = response?.data?.menu || response?.menu || response?.data || response || []

                    if (Array.isArray(eventTypesData) && eventTypesData.length > 0) {
                        this.eventTypes = eventTypesData.map(type => ({
                            id: type.id,
                            name: type.name,
                            slug: type.name.toLowerCase().replace(/\s+/g, '_'),
                            icon: this.getIconForEventType(type.name),
                            category: this.getCategoryForEventType(type.name),
                            ...type // spread any additional properties
                        }))

                        this.fetched = true
                        this.lastFetchTime = new Date().toISOString()
                        this.mergeEventTypesIntoEvents()
                    }
                } catch (error) {
                    this.error = error.message || 'Failed to fetch event types'
                    console.error('Error fetching event types:', error)
                } finally {
                    this.loading = false
                    _eventTypesInFlight = null
                }
            })()

            await _eventTypesInFlight
            return this.eventTypes
        },
        
        // Initialize event types (with session check)
        async initializeEventTypes() {
            if (!this.hasData) {
                await this.fetchEventTypes()
            }
            return this.eventTypes
        },
        
        // Force refresh (ignores session cache)
        async refreshEventTypes() {
            return await this.fetchEventTypes(true)
        },
        
        // Helper method to get icon for event type
        getIconForEventType(name) {
            const iconMap = {
                'Cricket': 'mdi-cricket',
                'Football': 'mdi-soccer',
                'Tennis': 'mdi-tennis',
                'Basketball': 'mdi-basketball',
                'Table Tennis': 'mdi-ping-pong',
                'Baseball': 'mdi-baseball',
                'Kabaddi': 'mdi-handball',
                'Binary': 'mdi-binary-tree',
                'Politics': 'mdi-vote',
                'Volleyball': 'mdi-volleyball',
                'Ice Hockey': 'mdi-hockey-sticks',
                'Darts': 'mdi-dart',
                'Rugby': 'mdi-rugby',
                'Mixed Martial Arts': 'mdi-karate',
                'Futsal': 'mdi-soccer',
                'Sports Book': 'mdi-book',
                'Virtual Cricket': 'mdi-cricket',
                'Virtual Soccer': 'mdi-soccer',
                'Virtual Tennis': 'mdi-tennis',
                'Virtual Baseball': 'mdi-baseball',
                'Horse Racing': 'mdi-horse-variant',
                'Greyhound Racing': 'mdi-dog'
            }
            
            // Try exact match first
            if (iconMap[name]) {
                return iconMap[name]
            }
            
            // Try partial matches
            const lowerName = name.toLowerCase()
            for (const [key, icon] of Object.entries(iconMap)) {
                if (lowerName.includes(key.toLowerCase())) {
                    return icon
                }
            }
            
            return 'mdi-circle' // default icon
        },
        
        // Helper method to categorize event types
        getCategoryForEventType(name) {
            const lowerName = name.toLowerCase()
            
            if (lowerName.includes('virtual') || lowerName.includes('esport') || lowerName.includes('e-sport')) {
                return 'esports'
            }
            
            if (lowerName.includes('racing') || lowerName.includes('horse') || lowerName.includes('greyhound')) {
                return 'racing'
            }
            
            return 'sports'
        },
        
        // Clear error
        clearError() {
            this.error = null
        },
        // Fetch all events using API — deduplicated: concurrent callers share the same in-flight request.
        async fetchAllEvents(force = false) {
            // Already fetched this session — return cached list (may be empty).
            if (this.eventsFetched && !force) {
                return this.allEvents
            }

            // A fetch is already in progress — wait for it instead of firing a second request.
            if (_eventsInFlight) {
                await _eventsInFlight
                return this.allEvents
            }

            this.eventsLoading = true
            this.eventsError = null

            _eventsInFlight = (async () => {
                try {
                    if (force) {
                        clearEventsListCache()
                    }

                    const response = await getEventsList()
                    const events =
                        response?.data?.data?.events
                        || response?.data?.events
                        || response?.events
                        || []
                    this.allEvents = filterActiveListEvents(events)
                    this.eventsFetched = true
                    this.lastEventsFetchTime = new Date().toISOString()
                    this.mergeEventTypesIntoEvents()
                } catch (error) {
                    this.eventsError = error.message || 'Failed to fetch events'
                    console.error('Error fetching events:', error)
                } finally {
                    this.eventsLoading = false
                    _eventsInFlight = null
                }
            })()

            await _eventsInFlight
            return this.allEvents
        },
        
        // Initialize events (with session check) — may fetch if the store is still cold.
        async initializeEvents() {
            if (this.eventsFetched) {
                return this.allEvents
            }
            await this.fetchAllEvents()
            return this.allEvents
        },

        /**
         * Join AppLayout prefetch if in flight; never starts GET /events/list.
         * Sport pages should use this + client-side filters only.
         */
        async waitForEvents() {
            if (this.eventsFetched) {
                return this.allEvents
            }
            if (_eventsInFlight) {
                await _eventsInFlight
            }
            return this.allEvents
        },

        /** Fire-and-forget warm-up so home can paint from cache when it mounts. */
        prefetchAllEvents() {
            if (this.eventsFetched) return
            if (_eventsInFlight) return
            this.fetchAllEvents().catch(() => {})
        },
        
        // Force refresh events (ignores session cache)
        async refreshEvents() {
            return await this.fetchAllEvents(true)
        },
        
        // Clear events error
        clearEventsError() {
            this.eventsError = null
        },
        
        // Merge event types into events to add event_type_name
        mergeEventTypesIntoEvents() {
            if (this.allEvents.length > 0 && this.eventTypes.length > 0) {
                const typeById = new Map(this.eventTypes.map((type) => [type.id, type]))
                this.allEvents = this.allEvents.map(event => {
                    const eventType = typeById.get(event.event_type_id)
                    return {
                        ...event,
                        event_type_name: eventType ? eventType.name : null
                    }
                })
            }
        },
        
        // Reset store
        reset() {
            this.eventTypes = []
            this.allEvents = []
            this.loading = false
            this.eventsLoading = false
            this.error = null
            this.eventsError = null
            this.fetched = false
            this.eventsFetched = false
            this.lastFetchTime = null
            this.lastEventsFetchTime = null
            _eventTypesInFlight = null
            _eventsInFlight = null
            clearEventTypesCache()
            clearEventsListCache()
        }
    }
})
