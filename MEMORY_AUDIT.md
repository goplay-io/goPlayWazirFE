# Memory & Performance Audit

**Date:** April 15, 2026  
**Branch:** stage  
**Scope:** All views, composables, and stores

---

## Already Fixed

| File | Fix Applied |
|---|---|
| `src/views/casino/Home.vue` | `ref({})` → `shallowRef([])` + `Object.freeze()` per game; flat normalized array; count maps built once at load; removed 6 dead functions; infinite scroll (60 tiles at a time) |
| `src/components/CasinoSearch.vue` | 300ms debounce on search emit; result list capped at 50 items; "Showing X of Y" label |

---

## A — Leaked Intervals / Listeners

### `src/composables/useFavoriteMarkets.js` — HIGH
Module-level `pollingInterval` is started in `startPolling()` but may not be cleared if the composable instance persists across navigation. If the composable is called in a component that unmounts and remounts, a second polling interval starts while the first is still running.

**Fix:** Ensure `stopPolling()` is called in every consumer's `onUnmounted`, or move interval management inside the component lifecycle.

---

### `src/views/sports/Home/BigWinsSlider.vue` — MEDIUM
`requestAnimationFrame` loop inside `startAutoScroll()` can stack multiple animation frames if called again before the previous frame completes (e.g. on tab visibility change or parent re-render).

**Fix:** Store the frame ID and call `cancelAnimationFrame(frameId)` before starting a new loop. Clear in `onUnmounted`.

---

### `src/composables/useOddsWebSocket.js` — MEDIUM
`wsRef` and `reconnectTimeoutRef` live at module scope. Multiple component instances importing this composable can conflict — one component closing the socket clears a timeout that another component is waiting on.

**Fix:** Move refs inside the composable factory function so each call gets its own isolated state, or use a singleton pattern with explicit reference counting.

---

## B — Deep Reactivity on Large Data

### `src/composables/useMarkets.js` — HIGH
`matchOddsData`, `bookMakersData`, `lineData`, `fancyData` and others are all stored as `ref()` with deeply nested objects. Vue walks every property to install reactive getters/setters. Any sub-property change (e.g. a single runner's odds tick) triggers the full dependency graph of every watcher/computed that touches the object.

**Fix:** Use `shallowRef()` for the top-level market data holder. Reassign the whole object on update instead of mutating sub-properties. Vue only re-triggers watchers once per assignment instead of once per field.

```js
// Before
const matchOddsData = ref({ runners: [] })
matchOddsData.value.runners[0].back = newOdds  // triggers deep watcher

// After
const matchOddsData = shallowRef({ runners: [] })
matchOddsData.value = { ...matchOddsData.value, runners: newRunners }
```

---

### `src/views/sports/Bet/Bet.vue` — MEDIUM-HIGH
`useMarkets()` is called inside an async data-loading function that re-runs every time the event changes. Each call creates a completely new set of reactive state instances (`matchOddsData`, `bookMakersData`, `fancyData`, etc.). Old instances are not explicitly destroyed — Vue GC has to collect them eventually.

**Fix:** Call `useMarkets()` once at the top of `<script setup>` and call a `reset()` method on it when loading a new event instead of creating a new instance.

---

### `src/composables/useMultiMarketEvents.js` — HIGH
Each event in the multi-market pinned list gets its own `useEvent()` + `useMarkets()` instantiation. 10 pinned events = 10 separate reactive market-state trees in memory simultaneously, all receiving WebSocket updates independently.

**Fix:** Maintain a single keyed map `{ [eventId]: { odds, markets } }` stored in `shallowRef`. Update entries by key on each WebSocket message rather than having 10 separate composable instances.

---

### `src/stores/events/events.js` — MEDIUM
The `getEventsGroupedByType` store getter rebuilds a brand new grouped object on every single call. Any component that accesses this getter in a `computed` will re-run the full grouping loop whenever any event in the store changes.

**Fix:** Convert to a Pinia `computed` getter (already automatically memoized by Pinia) and ensure it only depends on `allEvents` — not any derived property.

---

## C — Module-Level Shared State That Never Clears

### `src/composables/useFavoriteGames.js` — MEDIUM
`const favoriteGames = ref([])` lives at module scope. It is loaded once from `localStorage` when the module is first imported and never explicitly cleared. After a user logs out and a different user logs in (without a full page refresh), the previous user's favorites are still in memory and shown.

**Fix:** Export a `clearFavorites()` function and call it from the logout handler in `src/stores/auth.js`.

---

### `src/composables/useSelectedGame.js` — MEDIUM
`const selectedGame = ref(null)` holds a full game object at module scope indefinitely. After the user navigates away from the casino game page, the object is never released.

**Fix:** Set `selectedGame.value = null` inside the casino game route's `onUnmounted`, or use a router `afterEach` guard to clear it.

---

### `src/composables/useFavoriteMarkets.js` — MEDIUM
`markets`, `outcomes`, and `refreshToken` refs at module scope accumulate data across multiple visits to the sports pages. Outcomes from markets the user no longer watches are never removed.

**Fix:** Add a `clearMarkets()` function called on route leave (`onBeforeRouteLeave`) inside the component that uses this composable.

---

### `src/stores/bet.js` — MEDIUM
`outcomes` can accumulate data from multiple event visits within a session. Each event page appends to the outcomes map without clearing entries from previously visited events.

**Fix:** Call `$reset()` or explicitly clear `outcomes` when navigating away from a bet/event page.

---

## D — Unbounded `v-for` Lists

### `src/views/casino/Category.vue` — MEDIUM
`v-for="game in filteredGames"` renders all matching games in a 6-column grid with no pagination. Depending on the category, this can be 100–500+ tiles.

**Fix:** Apply the same infinite-scroll pattern used in `casino/Home.vue` — `displayedGames = filteredGames.slice(0, visibleCount)` with a `v-intersect` sentinel.

---

### `src/views/sports/Sport.vue` — MEDIUM
Event rows rendered with a plain `v-for` over the full filtered event list for the selected sport. A popular sport like Cricket or Football can have 100+ events.

**Fix:** Either cap the initial render to ~50 rows with a "Show more" / infinite scroll sentinel, or use `vue-virtual-scroller` for a row-height-based virtual list.

---

### `src/views/sports/Home/Featured.vue` — MEDIUM
`EventSlider` receives the full event list prop with no cap. All featured events are rendered at once even though only ~5–6 are visible in the slider at a time.

**Fix:** Slice the input list to a reasonable maximum (e.g. 20) before passing it to the slider component. Beyond that, users cannot realistically interact with them.

---

## E — Expensive Computeds

### `src/views/sports/Home/Featured.vue` — `orderedEventList` — MEDIUM
```js
computed(() => [...eventList.value].sort(...))
```
Spreads and sorts the entire array on every event update (including individual odds ticks). Sorting is O(n log n) and happens in the hot path of WebSocket updates.

**Fix:** Only re-sort when the event list membership changes (i.e. events are added/removed), not on every property mutation. Use a separate `watch` that compares lengths or IDs before re-sorting.

---

### `src/views/sports/Home/Featured.vue` — `competitions` — MEDIUM
Rebuilds a `new Map()` → `Array.from()` → `.map()` chain on every event list change. Includes nested loops over all events to group by competition.

**Fix:** Memoize with a stable key (e.g. sorted event IDs joined as a string). Only recompute when the list membership changes, not on odds updates.

---

### `src/views/sports/Sport.vue` — `groupedEvents` — MEDIUM
Rebuilds the entire grouped event structure (O(n)) on every single event mutation — including odds ticks from WebSocket updates.

**Fix:** Same pattern — watch for structural changes (IDs/count) separately from odds changes, and only regroup on structural changes.

---

### `src/composables/useEventTypes.js` — LOW-MEDIUM
```js
const eventTypes = computed(() => [
  { id: 1, label: 'Football', icon: iconComponents.Football || null },
  ...19 items
])
```
This array is static — the icon components and labels never change. Wrapping it in `computed` means Vue evaluates it on every reactive access.

**Fix:** Replace with a plain frozen constant:
```js
const eventTypes = Object.freeze([...])
```

---

### `src/composables/useMarketOdds.js` — `transformRunnersToValues` — MEDIUM
Called on every odds WebSocket tick for every runner. Returns `{ TEAM_1: [runnerId, bestBack, 0, 0, 0, 0, 0, bestLay] }` — 5 placeholder zeros that are never used.

**Fix:** Return a plain object `{ id, back, lay }` — eliminates array allocation and GC pressure on every tick.

---

## F — Other Waste

### `src/views/sports/Home/EventSlider.vue` — LOW
Three separate image lookup objects (`competitionImageMap`, `eventTypeFallbackMap`, `eventTypeFallbackByKey`) defined at module scope with duplicated entries.

**Fix:** Merge into a single map with a priority lookup function.

---

### `src/composables/useFavoriteGames.js` — `normalizeGameObject` — LOW
Maps and stores 18 fields per favorite game object. The UI only uses 7 of them (`id`, `game_id`, `name`, `thumbnail_url`, `product`, `category_name`, `provider_name`).

**Fix:** Reduce the normalized shape to only the fields actually read in the template. Saves memory proportional to MAX_FAVORITES (15 games × 11 unused fields).

---

## Recommended Fix Order

| # | File | Change | Impact |
|---|---|---|---|
| 1 | `casino/Category.vue` | Infinite scroll (same as Home.vue) | MEDIUM |
| 2 | `useMarkets.js` | `shallowRef` for market data | HIGH |
| 3 | `useMultiMarketEvents.js` | Single keyed map instead of N composable instances | HIGH |
| 4 | `useEventTypes.js` | Replace `computed` with `Object.freeze([...])` | LOW-MEDIUM |
| 5 | `useFavoriteMarkets.js` | `onUnmounted` polling cleanup | HIGH |
| 6 | `useFavoriteGames.js` + `useSelectedGame.js` | Clear module state on logout | MEDIUM |
| 7 | `Featured.vue` / `Sport.vue` | Guard expensive computeds against odds-tick re-runs | MEDIUM |
| 8 | `useMarketOdds.js` | Slim down `transformRunnersToValues` output | MEDIUM |
