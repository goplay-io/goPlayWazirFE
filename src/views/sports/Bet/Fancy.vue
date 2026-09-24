<script setup>
import {
  isFancyMarketCatalogEligible,
  matchesSortPriority,
} from '@/utils/fancyMarketVisibility';
import { sortFancyMarketsByTabPriorities } from '@/utils/runnerSort';

import { defineProps, computed, ref, provide } from 'vue';
import FancyBackLay from './fancy/FancyBackLay.vue';
import FancyBackOnlyOdds from './fancy/FancyBackOnlyOdds.vue';
import FancyOddEven from './fancy/FancyOddEven.vue';
import RulesDialog from '@/components/RulesDialog.vue';

const props = defineProps({
  fancyData: Array,
  fancyTabs: Object,
  binaryData: {
    type: Array,
    default: () => []
  },
  betHistory: {
    type: Array,
    default: null
  },
  betOutcomes: {
    type: Object,
    default: null
  },
  eventTypeId: [String, Number],
  eventName: String,
  betAllow: Boolean,
  inPlay: {
    type: Boolean,
    default: false,
  },
  eventId: [String, Number],
});

/** fancyTabs keys from API may be null / "null" — use a single display label. */
function normalizeFancyTabLabel(tabName) {
  if (tabName == null || tabName === '') return 'Others';
  const s = String(tabName).trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return 'Others';
  return s;
}

const preferredOrder = ['sessions', 'w/p market', 'odd/even', 'xtra market', 'meter', 'khadda', 'over by over'];
const normalizeTabName = (v) => String(v || '').toLowerCase().replace(/[/_-]/g, ' ').replace(/\s+/g, ' ').trim();
const tabRank = (name) => {
  const n = normalizeTabName(name);
  const idx = preferredOrder.findIndex((x) => normalizeTabName(x) === n);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
};

const marketsForTab = (sortPriorities) => {
  if (!Array.isArray(sortPriorities) || !props.fancyData) return [];
  const markets = props.fancyData.filter(
    (market) => matchesSortPriority(sortPriorities, market?.sort_priority) && isFancyMarketCatalogEligible(market)
  );
  return sortFancyMarketsByTabPriorities(markets, sortPriorities);
};

const addMarketsToMergedTab = (merged, tabName, sortPriorities, markets) => {
  if (!markets.length) return;

  const displayTabName = normalizeFancyTabLabel(tabName);
  let entry = merged.get(displayTabName);
  if (!entry) {
    entry = { sortPriorities: new Set(), marketsById: new Map() };
    merged.set(displayTabName, entry);
  }
  if (Array.isArray(sortPriorities)) {
    sortPriorities.forEach((p) => entry.sortPriorities.add(p));
  }
  markets.forEach((m, i) => {
    const id = m.market_id ?? m.id ?? `_row_${i}_${m.sort_priority}`;
    entry.marketsById.set(id, m);
  });
};

// Order tabs based on fancyTabs metadata, fallback to default order if missing
const orderedFancyTabs = computed(() => {
  if (!props.fancyTabs || !props.fancyData) return [];

  const merged = new Map();

  for (const [tabName, sortPriorities] of Object.entries(props.fancyTabs)) {
    if (!Array.isArray(sortPriorities)) continue;
    addMarketsToMergedTab(merged, tabName, sortPriorities, marketsForTab(sortPriorities));
  }

  const acc = [];
  for (const [displayTabName, entry] of merged) {
    const sortPriorities = Array.from(entry.sortPriorities);
    const markets = sortFancyMarketsByTabPriorities(
      Array.from(entry.marketsById.values()),
      sortPriorities
    );
    const normalizedTab = displayTabName.trim().toLowerCase();
    const componentType =
      normalizedTab === 'odd/even' ? 'oddEven' :
      normalizedTab === 'khadda'   ? 'khadda'  : 'others';
    acc.push({ tabName: displayTabName, sortPriorities, markets, componentType });
  }

  return acc.sort((a, b) => {
    const ra = tabRank(a.tabName);
    const rb = tabRank(b.tabName);
    if (ra !== rb) return ra - rb;
    return String(a.tabName).localeCompare(String(b.tabName));
  });
});

// Group markets by tabs for filter chips — keep in sync with orderedFancyTabs
const groupedFancyData = computed(() => {
  if (!props.fancyTabs || !props.fancyData) {
    const filteredData = (props.fancyData || []).filter(isFancyMarketCatalogEligible);
    return { All: filteredData };
  }

  const groups = {};
  for (const tab of orderedFancyTabs.value) {
    if (tab.markets.length) groups[tab.tabName] = [...tab.markets];
  }

  if (Object.keys(groups).length === 0) {
    const filteredData = (props.fancyData || []).filter(isFancyMarketCatalogEligible);
    return { All: filteredData };
  }

  return groups;
});

const getFancyByType = computed(() => {
  const result = {
    oddEven: [],
    khadda: [],
    others: []
  };

  if (!props.fancyData || !Array.isArray(props.fancyData)) return result;

  props.fancyData.forEach((fancy) => {
    const bettingType = String(fancy?.betting_type || '').toUpperCase();
    const isOddEvenByType = bettingType === 'ODD_EVEN' || bettingType === 'ODDEVEN';

    if (isOddEvenByType) {
      result.oddEven.push(fancy);
      return;
    }

    if (bettingType === 'KHADO') {
      result.khadda.push(fancy);
    } else {
      result.others.push(fancy);
    }
  });

  return result;
});

function fancyTabKey(name) {
  return String(name || '').trim().toLowerCase();
}

function isSessionTabName(name) {
  const key = fancyTabKey(name);
  return key === 'sessions' || key === 'session';
}

const binaryMarkets = computed(() =>
  Array.isArray(props.binaryData) ? props.binaryData.filter(isFancyMarketCatalogEligible) : []
);

const taggedBinaryMarkets = computed(() =>
  binaryMarkets.value.map((market) => ({ ...market, __binary: true }))
);

const allFancyCategoryNames = computed(() => {
  const apiDisplayByKey = new Map();
  for (const raw of Object.keys(props.fancyTabs || {})) {
    const display = normalizeFancyTabLabel(raw);
    const key = fancyTabKey(display);
    if (key) apiDisplayByKey.set(key, display);
  }

  const names = [];
  const seen = new Set();
  const add = (raw) => {
    const fallback = normalizeFancyTabLabel(raw);
    const key = fancyTabKey(fallback);
    if (!key || seen.has(key)) return;
    seen.add(key);
    names.push(apiDisplayByKey.get(key) || fallback);
  };

  preferredOrder.forEach(add);
  apiDisplayByKey.forEach((display) => add(display));
  return names;
});

const sessionTabDisplayName = computed(() =>
  allFancyCategoryNames.value.find((name) => isSessionTabName(name)) || 'Sessions'
);

const orderedFancyTabsWithBinary = computed(() => {
  const tabs = orderedFancyTabs.value.map((tab) => ({
    ...tab,
    markets: [...tab.markets],
  }));
  const binaries = taggedBinaryMarkets.value;
  if (!binaries.length) return tabs;

  const sessionIdx = tabs.findIndex((tab) => isSessionTabName(tab.tabName));
  if (sessionIdx >= 0) {
    tabs[sessionIdx].markets.push(...binaries);
    return tabs;
  }

  tabs.push({
    tabName: sessionTabDisplayName.value,
    sortPriorities: [],
    markets: binaries,
    componentType: 'others',
  });
  return tabs.sort((a, b) => {
    const ra = tabRank(a.tabName);
    const rb = tabRank(b.tabName);
    if (ra !== rb) return ra - rb;
    return String(a.tabName).localeCompare(String(b.tabName));
  });
});

const groupedEvents = computed(() =>
  allFancyCategoryNames.value.map((name) => ({ name }))
);

const activeTabHasVisibleMarkets = computed(() => {
  const groups = groupedFancyData.value || {};
  const binaryVisible = binaryMarkets.value.length > 0 && (
    activeCategory.value === 'All' || isSessionTabName(activeCategory.value)
  );

  if (activeCategory.value === 'All') {
    const fancyVisible = Object.entries(groups).some(([key, markets]) => (
      key !== 'All' && Array.isArray(markets) && markets.length > 0
    ));
    return fancyVisible || binaryVisible;
  }

  const activeKey = fancyTabKey(activeCategory.value);
  const fancyVisible = Object.entries(groups).some(([key, markets]) => (
    fancyTabKey(key) === activeKey && Array.isArray(markets) && markets.length > 0
  ));
  return fancyVisible || binaryVisible;
});

// Shared filter state
const activeCategory = ref('All');
const changeCategory = (category) => {
  activeCategory.value = category;
};

// Centralized Rules dialog control
const rulesOpen = ref(false);
const showRules = () => { rulesOpen.value = true; };
provide('openRules', showRules);

</script>

<template>
  <div class="fancy-markets-root">
    <!-- Category chips (the Fancy Market / Premium Market row lives in Bet.vue) -->
    <div class="fancy-nav-chrome">
      <div class="fancy-tabs-shell">
        <div class="fancy-tabs-row">
          <button type="button"
            class="tab-btn fancy-filter-tab tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-transition-colors tw-outline-none focus:tw-ring-2 focus:tw-ring-[var(--color-nav)]"
            :class="activeCategory === 'All' ? 'fancy-filter-tab-active' : 'fancy-filter-tab-inactive'"
            @click="changeCategory('All')">
            ALL
          </button>
          <button v-for="group in groupedEvents" :key="group.name" type="button"
            class="tab-btn fancy-filter-tab tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-transition-colors tw-outline-none focus:tw-ring-2 focus:tw-ring-[var(--color-nav)]"
            :class="activeCategory === group.name ? 'fancy-filter-tab-active' : 'fancy-filter-tab-inactive'"
            @click="changeCategory(group.name)">
            {{ group.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Light content surface (markets table/cards) — matches reference -->
    <div class="fancy-markets-body">
      <div class="fancy-grid-container">
      <template v-for="tab in orderedFancyTabsWithBinary" :key="tab.tabName">
        <!-- Back/Lay Tabs -->
        <FancyBackLay v-if="tab.componentType === 'others'" :fancyData="tab.markets"
          :fancyTabs="{ [tab.tabName]: tab.sortPriorities }" :betHistory="betHistory" :betOutcomes="betOutcomes"
          :eventTypeId="eventTypeId" :eventName="eventName" :betAllow="betAllow" :inPlay="inPlay" :eventId="eventId"
          :activeCategory="activeCategory" />

        <!-- Odd/Even (Dedicated Layout) -->
        <FancyOddEven v-else-if="tab.componentType === 'oddEven'" :fancyData="tab.markets"
          :fancyTabs="{ [tab.tabName]: tab.sortPriorities }" :betHistory="betHistory" :betOutcomes="betOutcomes"
          :eventTypeId="eventTypeId" :eventName="eventName" :betAllow="betAllow" :inPlay="inPlay" :eventId="eventId"
          :activeCategory="activeCategory" />

        <!-- Back Only Odds Tabs (Khadda) -->
        <FancyBackOnlyOdds v-else-if="tab.componentType === 'khadda'" :fancyData="tab.markets"
          :fancyTabs="{ [tab.tabName]: tab.sortPriorities }" :betHistory="betHistory" :betOutcomes="betOutcomes"
          :eventTypeId="eventTypeId" :eventName="eventName" :betAllow="betAllow" :inPlay="inPlay" :eventId="eventId"
          :activeCategory="activeCategory" />
      </template>

      <!-- Fallback when tabs metadata is missing -->
      <template v-if="orderedFancyTabs.length === 0">
        <FancyBackLay v-if="getFancyByType.others.length > 0" :fancyData="getFancyByType.others" :fancyTabs="null"
          :betHistory="betHistory" :betOutcomes="betOutcomes" :eventTypeId="eventTypeId" :eventName="eventName"
          :betAllow="betAllow" :eventId="eventId"
          :activeCategory="activeCategory" />
        <FancyOddEven v-if="getFancyByType.oddEven.length > 0" :fancyData="getFancyByType.oddEven"
          :fancyTabs="null" :betHistory="betHistory" :betOutcomes="betOutcomes" :eventTypeId="eventTypeId"
          :eventName="eventName" :betAllow="betAllow" :eventId="eventId"
          :activeCategory="activeCategory" />
        <FancyBackOnlyOdds v-if="getFancyByType.khadda.length > 0" :fancyData="getFancyByType.khadda"
          :fancyTabs="null" :betHistory="betHistory" :betOutcomes="betOutcomes" :eventTypeId="eventTypeId"
          :eventName="eventName" :betAllow="betAllow" :eventId="eventId"
          :activeCategory="activeCategory" />
      </template>

      <div v-if="!activeTabHasVisibleMarkets" class="fancy-market fancy-empty-market">
        <div class="fancy-message">No real-time records found</div>
      </div>
      </div>
    </div>
  </div>

  <!-- Rules Dialog -->
  <RulesDialog v-model="rulesOpen" sportName="fancy Markets" />
</template>

<style scoped>
.fancy-markets-root {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

.fancy-nav-chrome {
  background: #ffffff;
  padding: 8px 0 8px;
  box-sizing: border-box;
}

.fancy-markets-body {
  background: var(--color-surface, #fff);
  color: var(--color-text);
  border-radius: 0;
  /* padding: 0.5rem 0 0.75rem; */
  /* margin: 0.6rem 0 0; */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--color-border, #e5e7eb);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-x: hidden;
}

/* @media (min-width: 768px) {
  .fancy-markets-body {
    padding: 0.5rem 0 0.75rem;
  }
} */

.fancy-tabs-shell {
  margin: 0;
  background: transparent;
  border: 0;
  padding: 0.15rem 0;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  box-sizing: border-box;
}

.fancy-tabs-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 5px;
  width: max-content;
  min-width: 0;
  background: transparent;
  box-sizing: border-box;
}

.fancy-filter-tab {
  flex: 0 0 auto;
  border-radius: 2.83px;
  border: 0 !important;
  flex-shrink: 0;
  color: #1f1235;
  background: #d1d5db;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.1;
  min-height: 0;
  padding: 3px 8px !important;
  position: relative;
  box-sizing: border-box;
  white-space: nowrap;
  box-shadow: none;
}

.fancy-filter-tab-active {
  background: #ca86f3 !important;
  border: 0 !important;
  color: #1f1235 !important;
  z-index: 1;
}

.fancy-filter-tab-inactive {
  background: #d1d5db !important;
  border: 0 !important;
  color: #1f1235 !important;
}

.fancy-filter-tab-inactive:hover {
  background: #d5d8de !important;
}

@media (max-width: 767px) {
  .fancy-markets-root {
    padding-left: 0;
    box-sizing: border-box;
  }

  .fancy-markets-body {
    padding-right: 0;
    margin-top: 0;
    margin-left: 0;
    margin-right: 0;
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-shadow: none;
  }

  .fancy-tabs-shell {
    scrollbar-width: none;
  }

  .fancy-tabs-shell::-webkit-scrollbar {
    display: none;
  }

  .fancy-tabs-row {
    width: max-content;
    min-width: 0;
    padding: 0;
  }

  /* Market blocks keep outer border on all sides */
  .fancy-grid-container :deep(.fancy-card-item.fancy-market-block) {
    border-radius: 0 !important;
    border: 1px solid #d9d9d9 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  /* Khadda mobile: hide limits column; full-width back under NO + YES */
  .fancy-markets-root :deep(.fancy-row-cols-khadda .khadda-odds-meta-grid) {
    display: block !important;
    width: var(--sports-bet-odds-pair-width) !important;
    max-width: var(--sports-bet-odds-pair-width) !important;
    min-width: var(--sports-bet-odds-pair-width) !important;
    margin-left: auto;
  }

  .fancy-markets-root :deep(.fancy-row-cols-khadda .khadda-meta-block),
  .fancy-markets-root :deep(.fancy-row-cols-khadda .fancy-market-limits) {
    display: none !important;
  }

  .fancy-markets-root :deep(.fancy-row-cols-khadda .khadda-odds-block > .tw-h-10:empty),
  .fancy-markets-root :deep(.fancy-row-cols-khadda .khadda-odds-block > div.tw-h-10:first-child) {
    display: none !important;
  }

  .fancy-markets-root :deep(.fancy-row-cols-khadda .khadda-odds-block) {
    width: var(--sports-bet-odds-pair-width) !important;
    max-width: var(--sports-bet-odds-pair-width) !important;
    min-width: var(--sports-bet-odds-pair-width) !important;
    gap: var(--sports-bet-odds-btn-gap) !important;
  }

  .fancy-markets-root :deep(.fancy-row-cols-khadda .khadda-odds-block .fancy-odds-btn.v-btn),
  .fancy-markets-root :deep(.fancy-row-cols-khadda .khadda-odds-block .khadda-odds-vbtn.v-btn) {
    grid-column: 1 / -1 !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    height: var(--sports-bet-odds-btn-height) !important;
    min-height: var(--sports-bet-odds-btn-height) !important;
    max-height: var(--sports-bet-odds-btn-height) !important;
  }
}

@media (min-width: 768px) {
  .fancy-markets-root {
    gap: 8px;
  }

  .fancy-nav-chrome {
    padding-bottom: 0;
  }
}

.fancy-grid-container {
  display: flex;
  flex-direction: column;
  gap: 0px;
  padding-left: 0;
  padding-right: 0;
  position: relative;
  min-height: 100px;
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

@media (min-width: 768px) {
  .fancy-grid-container {
    gap: 0px;
    padding-left: 0;
    padding-right: 0;
  }
}

.fancy-grid-container > * {
  display: block;
  width: 100%;
}

.fancy-grid-container :deep(.fancy-card-item) {
  width: 100%;
  box-sizing: border-box;
  display: block;
  height: auto;
  margin: 0;
  padding: 0;
}

@media (min-width: 768px) {
  .fancy-grid-container :deep(.fancy-card-item) {
    width: 100%;
    max-width: 100%;
  }
}

/* Min / Max column — same typography as Match Odds header limits */
.fancy-markets-root :deep(.fancy-market-limits) {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: var(--sports-bet-odds-btn-gap);
  font-family: inherit;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.2;
  color: #525252;
  letter-spacing: 0;
}

.fancy-markets-root :deep(.fancy-market-limit-line) {
  margin: 0;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .fancy-markets-root :deep(.fancy-market-limits) {
    font-size: 11px;
    line-height: 1.25;
    letter-spacing: 0.01em;
  }

  .fancy-markets-root :deep(.fancy-market-limit-line) {
    text-transform: none;
  }
}

/* YES/NO odds — mobile: square cells; desktop: rounded (reference images) */
.fancy-markets-root :deep(.fancy-odds-btn.v-btn),
.fancy-markets-root :deep(.fancy-row-cols .v-btn),
.fancy-markets-root :deep(.odd-even-box.v-btn),
.fancy-markets-root :deep(.khadda-odds-vbtn.v-btn) {
  border-radius: var(--sports-bet-odds-btn-radius) !important;
  overflow: hidden;
  height: var(--sports-bet-odds-btn-height) !important;
  min-height: var(--sports-bet-odds-btn-height) !important;
  max-height: var(--sports-bet-odds-btn-height) !important;
  margin: 0 !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.fancy-markets-root :deep(.fancy-odds-btn .v-btn__overlay),
.fancy-markets-root :deep(.fancy-odds-btn .v-btn__underlay),
.fancy-markets-root :deep(.fancy-row-cols .v-btn .v-btn__overlay),
.fancy-markets-root :deep(.fancy-row-cols .v-btn .v-btn__underlay),
.fancy-markets-root :deep(.odd-even-box .v-btn__overlay),
.fancy-markets-root :deep(.odd-even-box .v-btn__underlay),
.fancy-markets-root :deep(.khadda-odds-vbtn .v-btn__overlay),
.fancy-markets-root :deep(.khadda-odds-vbtn .v-btn__underlay) {
  border-radius: var(--sports-bet-odds-btn-radius) !important;
}

.fancy-markets-root :deep(.fancy-odds-btn .v-btn__content),
.fancy-markets-root :deep(.fancy-row-cols .v-btn .v-btn__content),
.fancy-markets-root :deep(.odd-even-box .v-btn__content),
.fancy-markets-root :deep(.khadda-odds-vbtn .v-btn__content) {
  align-items: center !important;
  display: flex !important;
  justify-content: center !important;
  line-height: 1.05 !important;
  min-height: 0 !important;
  padding: 1px 2px !important;
  width: 100% !important;
}

.fancy-markets-root :deep(.fancy-odds-price),
.fancy-markets-root :deep(.mo-price),
.fancy-markets-root :deep(.khadda-odds-line--price) {
  line-height: 1.05 !important;
  margin: 0 !important;
}

.fancy-markets-root :deep(.fancy-odds-size),
.fancy-markets-root :deep(.mo-size),
.fancy-markets-root :deep(.khadda-odds-line--size) {
  line-height: 1 !important;
  margin: 0 !important;
}

.fancy-markets-root :deep(.ball-running-status),
.fancy-markets-root :deep(.fancy-market-status-overlay),
.fancy-markets-root :deep(.odd-even-status) {
  border-radius: var(--sports-bet-odds-btn-radius) !important;
}

.fancy-markets-root :deep(.fancy-odds-block:not(.fancy-odds-block--status-active)),
.fancy-markets-root :deep(.odd-even-odds-block:not(.fancy-odds-block--status-active)),
.fancy-markets-root :deep(.khadda-odds-block:not(.fancy-odds-block--status-active)) {
  border-radius: 0;
}

/* Keep lay/back button colors visible under semi-transparent status overlay (desktop) */
.fancy-markets-root :deep(.fancy-odds-block:has(.fancy-market-status-overlay) .v-btn--disabled::after),
.fancy-markets-root :deep(.odd-even-odds-block:has(.fancy-market-status-overlay) .v-btn--disabled::after),
.fancy-markets-root :deep(.khadda-odds-block:has(.fancy-market-status-overlay) .v-btn--disabled::after) {
  background-color: transparent !important;
}

/* Phone: dim odds behind grey status overlay (screenshot 1) */
.fancy-markets-root :deep(.fancy-odds-block--status-active:has(.fancy-market-status-overlay--phone) .fancy-odds-btn),
.fancy-markets-root :deep(.fancy-odds-block--status-active:has(.fancy-market-status-overlay--phone) .odd-even-box),
.fancy-markets-root :deep(.fancy-odds-block--status-active:has(.fancy-market-status-overlay--phone) .khadda-odds-vbtn),
.fancy-markets-root :deep(.odd-even-odds-block.fancy-odds-block--status-active:has(.fancy-market-status-overlay--phone) .fancy-odds-btn),
.fancy-markets-root :deep(.odd-even-odds-block.fancy-odds-block--status-active:has(.fancy-market-status-overlay--phone) .odd-even-box),
.fancy-markets-root :deep(.khadda-odds-block.fancy-odds-block--status-active:has(.fancy-market-status-overlay--phone) .khadda-odds-vbtn) {
  opacity: 0.38 !important;
}

.fancy-markets-root :deep(.fancy-odds-block--status-active:has(.fancy-market-status-overlay--phone) .v-btn--disabled::after),
.fancy-markets-root :deep(.odd-even-odds-block.fancy-odds-block--status-active:has(.fancy-market-status-overlay--phone) .v-btn--disabled::after),
.fancy-markets-root :deep(.khadda-odds-block.fancy-odds-block--status-active:has(.fancy-market-status-overlay--phone) .v-btn--disabled::after) {
  background-color: transparent !important;
}

@media (min-width: 768px) {
  .fancy-markets-root :deep(.fancy-odds-btn.v-btn),
  .fancy-markets-root :deep(.fancy-row-cols .v-btn),
  .fancy-markets-root :deep(.odd-even-box.v-btn),
  .fancy-markets-root :deep(.khadda-odds-vbtn.v-btn) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
    height: var(--sports-bet-odds-btn-height-md) !important;
    min-height: var(--sports-bet-odds-btn-height-md) !important;
    max-height: var(--sports-bet-odds-btn-height-md) !important;
    box-shadow: none !important;
  }

  .fancy-markets-root :deep(.fancy-odds-btn .v-btn__overlay),
  .fancy-markets-root :deep(.fancy-odds-btn .v-btn__underlay),
  .fancy-markets-root :deep(.fancy-row-cols .v-btn .v-btn__overlay),
  .fancy-markets-root :deep(.fancy-row-cols .v-btn .v-btn__underlay),
  .fancy-markets-root :deep(.odd-even-box .v-btn__overlay),
  .fancy-markets-root :deep(.odd-even-box .v-btn__underlay),
  .fancy-markets-root :deep(.khadda-odds-vbtn .v-btn__overlay),
  .fancy-markets-root :deep(.khadda-odds-vbtn .v-btn__underlay) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .fancy-markets-root :deep(.ball-running-status),
  .fancy-markets-root :deep(.fancy-market-status-overlay),
  .fancy-markets-root :deep(.odd-even-status) {
    border-radius: var(--sports-bet-odds-btn-radius) !important;
  }

  .fancy-markets-root :deep(.fancy-odds-block:not(.fancy-odds-block--status-active)),
  .fancy-markets-root :deep(.odd-even-odds-block:not(.fancy-odds-block--status-active)),
  .fancy-markets-root :deep(.khadda-odds-block:not(.fancy-odds-block--status-active)) {
    border-radius: 0;
  }
}
</style>
