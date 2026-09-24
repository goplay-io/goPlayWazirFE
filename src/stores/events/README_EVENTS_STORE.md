# Events Store Documentation

## Overview
The `useEventsStore` is a Pinia store that manages event types fetched from the API. It provides organized access to sports, esports, and racing events with their corresponding IDs for route parameters.

## Usage

### Basic Import and Setup
```javascript
import { useEventsStore } from '@/stores/events'

// In your component
const eventsStore = useEventsStore()
```

### Fetching Event Types
```javascript
// Fetch event types (usually done in main layout/app initialization)
await eventsStore.fetchEventTypes()
```

### Available Getters

#### Get All Event Types
```javascript
const allEvents = eventsStore.allEventTypes
// Returns: Array of all event types with id, name, slug, icon, category
```

#### Get Event Type by ID
```javascript
const eventType = eventsStore.getEventTypeById(1)
// Returns: Single event type object or undefined
```

#### Get Event Type by Name
```javascript
const eventType = eventsStore.getEventTypeByName('Football')
// Returns: Single event type object or undefined
```

#### Get Sports (excluding esports/racing)
```javascript
const sports = eventsStore.sportsTypes
// Returns: Array of sports event types
```

#### Get Esports
```javascript
const esports = eventsStore.esportsTypes
// Returns: Array of esports/virtual event types
```

#### Get Racing Events
```javascript
const racing = eventsStore.racingTypes
// Returns: Array of racing event types
```

#### Loading State
```javascript
const isLoading = eventsStore.isLoading
// Returns: Boolean indicating if data is being fetched
```

#### Error State
```javascript
const error = eventsStore.getError
// Returns: Error message string or null
```

## Route Structure

### Sports Routes
Sports routes now include the event type ID for proper API integration:
```
/sports/{sport-slug}/{sport-id}

Examples:
- /sports/football/1
- /sports/cricket/2
- /sports/tennis/3
```

### Esports Routes
```
/sports/e-sports/{esport-id}

Examples:
- /sports/e-sports/10
- /sports/e-sports/11
```

### Racing Routes
```
/racing/{racing-slug}

Examples:
- /racing/horse-racing
- /racing/greyhound-racing
```

## Event Type Object Structure

Each event type object contains:
```javascript
{
  id: 1,                    // API ID for route params
  name: "Football",         // Display name
  slug: "football",         // URL-friendly slug
  icon: "mdi-soccer",       // Material Design Icon
  category: "sports",       // Category: sports, esports, racing
  // ...additional API properties
}
```

## TopNavigation Integration

The TopNavigation component now:
1. Fetches event types on mount
2. Uses store data for all navigation links
3. Includes IDs in route parameters
4. Shows loading state while fetching
5. Handles error states

## Usage in Other Components

### Get Event Type for Current Route
```javascript
import { useRoute } from 'vue-router'
import { useEventsStore } from '@/stores/events'

const route = useRoute()
const eventsStore = useEventsStore()

// Get event type ID from route params
const eventTypeId = route.params.id

// Get full event type object
const currentEventType = eventsStore.getEventTypeById(eventTypeId)
```

### Generate Links with IDs
```javascript
// For sports
const getSportRoute = (sport) => {
  return `/sports/${sport.slug}/${sport.id}`
}

// For esports
const getEsportRoute = (esport) => {
  return `/sports/e-sports/${esport.id}`
}
```

## Store Actions

### fetchEventTypes()
Fetches event types from the API and processes them with icons and categories.

### clearError()
Clears any error state.

### reset()
Resets the store to initial state (empty arrays, no loading, no error).

## Error Handling

The store handles API errors gracefully:
```javascript
if (eventsStore.getError) {
  console.error('Error loading event types:', eventsStore.getError)
  // Handle error in UI
}
```

## API Integration

The store uses the existing `events.getEventTypes()` API call and expects:
```javascript
{
  data: [
    {
      id: 1,
      name: "Football",
      // ...other properties
    }
  ]
}
```

## Benefits

1. **Centralized Data**: All event types managed in one place
2. **Consistent IDs**: Route parameters now include proper IDs for API calls
3. **Type Safety**: Structured objects with predictable properties
4. **Performance**: Data cached in store, no repeated API calls
5. **Maintainability**: Easy to add new event types or modify existing ones
6. **SEO Friendly**: Slugs in URLs for better SEO while maintaining ID for functionality
