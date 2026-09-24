# Cold-load fix for sports list pages (Live / Sport)

**Date:** 2026-07-11  
**Scope:** Client skins — `bettingClientVue`, `goplay99Client`, `winbuzz`, `FairplayFE`

## Problem

On first visit or hard refresh of list pages (`Live.vue`, `Sport.vue`), users often saw:

1. A brief **“No events”** flash before the events API finished
2. Event rows with **blank odds (`-`)** until the OddsDistributor WebSocket delivered the first frame

Navigating away and back felt fine because the socket and in-memory odds cache were already warm. The events HTTP API was typically fast; the delay was **frontend sequencing**, not a slow list API.

## Root cause

| Issue | Detail |
|---|---|
| Odds after events only | Pages `await` the events fetch, then subscribe to odds. Prices never came from cache on list pages. |
| Bet vs list mismatch | Bet pages already hydrated via `sharedWs.getCachedOddsForMarkets`; list `useOddsWebSocket` only waited for the next WS message. |
| Loading started `false` | First paint could show the empty state before `onMounted` set loading. |
| Winbuzz / Fairplay | List pages opened a **dedicated WebSocket per page** instead of `sharedWs`, with **no app-level warmup**. |

## Solution

### 1. Hydrate list odds immediately

In list `useOddsWebSocket`:

1. Apply **cached** odds from `sharedWs` as soon as market IDs are known
2. For markets still missing from cache (true cold load), fire a **one-shot** `POST /odds/latest` (`getLatestOdds`)
3. Seed the shared cache from that HTTP response so later navigation stays warm
4. Continue normal WS subscribe for live updates

This is not continuous polling — at most one HTTP hydrate per market-id set when cache misses.

### 2. Shared socket + warmup (Winbuzz / Fairplay)

Aligned with `bettingClientVue` / `goplay99Client`:

- List odds use **`sharedWs`** (singleton) instead of a per-page socket
- `App.vue` calls **`sharedWs.warmup()`** on mount so connect cost is paid early
- `sharedWs` now caches latest odds frames and exposes `getCachedOddsForMarkets` / `cacheOdds`

### 3. Loading flash

`Live.vue` and `Sport.vue` initialize `loading = ref(true)` so the UI shows a loader until the first fetch completes (Fairplay `Sport.vue` already did this).

## Behaviour after the fix

```
App mount
  └─ sharedWs.warmup()          // socket connecting early

Live / Sport mount
  └─ loading = true
  └─ fetch events (HTTP)
  └─ watchForEvents()
       ├─ hydrateOdds(marketIds)
       │    ├─ apply sharedWs cache (instant if warm)
       │    └─ getLatestOdds(missing) once if needed
       └─ sharedWs.subscribeMarkets(...)  // live stream continues
```

- **Warm navigation:** prices paint from cache immediately  
- **Cold load:** prices paint from one HTTP hydrate, then stay live via WS  
- **Empty flash:** avoided by starting in loading state  

## Performance notes

- No extra polling loop was added
- HTTP hydrate runs only for **uncached** market IDs, and is deduped while in flight
- Winbuzz/Fairplay **reduce** connection churn by reusing one shared socket
- Events list API path is unchanged

## Files changed

### All four skins

| Area | Files |
|---|---|
| List odds hydrate | `src/composables/useOddsWebSocket.js` |
| Shared WS cache API | `src/composables/sharedWs.js` |
| Loading flag | `src/views/sports/live/Live.vue`, `src/views/sports/Sport.vue` |

### Winbuzz / Fairplay only

| Area | Files |
|---|---|
| App WS warmup | `src/App.vue` |
| List path → sharedWs | `src/composables/useOddsWebSocket.js` (rewritten list path) |
| Odds cache + warmup | `src/composables/sharedWs.js` |

### Already present (unchanged pattern)

- `bettingClientVue` / `goplay99Client`: `App.vue` already called `sharedWs.warmup()`
- Fairplay `Sport.vue`: already used `loading = ref(true)`

## Key APIs

| Symbol | Role |
|---|---|
| `sharedWs.warmup()` | Open OddsDistributor socket early |
| `sharedWs.getCachedOddsForMarkets(ids)` | Read last known odds per market |
| `sharedWs.cacheOdds(data)` | Seed cache from HTTP hydrate |
| `sharedWs.subscribeMarkets(ids)` | Live odds subscription |
| `getLatestOdds(marketIds)` | One-shot HTTP fill for cache misses |

## How to verify

1. Hard refresh Live and Sport (cold load) — rows should show prices shortly after the list appears, without a long blank-odds wait
2. Confirm no “No events” flash while the first fetch is in progress
3. Navigate Live → Sport → Live — odds should appear immediately from cache when markets overlap
4. On Winbuzz/Fairplay, confirm only one OddsDistributor WS in DevTools Network (not a new socket per list page)

## Out of scope

- Live event **filter** differences between skins (`open_date` vs `in_play` vs UI feed toggles)
- Admin apps (`goPlayRolexFE`, `bettingABJNS`) — no Live/Sport client list pages
