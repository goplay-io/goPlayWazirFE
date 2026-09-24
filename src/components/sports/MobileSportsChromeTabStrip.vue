<template>
  <div class="mobile-sports-chrome-tab-strip-wrap">
    <div ref="stripRef" class="mobile-sports-chrome-tab-strip" @scroll="onStripScroll">
      <button v-for="tab in mobileSportTabs" :key="tab.id" type="button" class="mobile-sports-chrome-tab"
        :class="{
          'mobile-sports-chrome-tab--active': activeTabId === tab.id,
          'mobile-sports-chrome-tab--gold': tab.id === 'casino' && activeTabId !== tab.id,
          'mobile-sports-chrome-tab--quick': isQuickGameTab(tab),
          'mobile-sports-chrome-tab--new': tab.isNew
        }" @click="onTabClick(tab)">
        <span v-if="tab.isNew" class="mobile-sports-chrome-tab__new">NEW</span>
        <span class="mobile-sports-chrome-tab__icon-wrap">
          <component
            :is="tab.icon"
            v-if="tab.icon"
            :width="tab.iconSize || 24"
            :height="tab.iconSize || 24"
            class="mobile-sports-chrome-tab__icon mobile-sports-chrome-tab__icon--sport"
          />
          <v-icon v-else class="mobile-sports-chrome-tab__icon mobile-sports-chrome-tab__icon--mdi" size="24">
            mdi-trophy-outline
          </v-icon>
        </span>
        <span class="mobile-sports-chrome-tab__label">{{ tab.name }}</span>
      </button>
    </div>
    <div v-if="showScrollTrack" class="mobile-sports-chrome-tab-strip__scroll-track" aria-hidden="true">
      <span class="mobile-sports-chrome-tab-strip__scroll-thumb" :style="scrollThumbStyle" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEventTypes, HORSE_RACING_EVENT_TYPE_ID, GREYHOUND_RACING_EVENT_TYPE_ID, includeInSportNavMenu, sortEventTypesForSportNav } from '@/composables/useEventTypes';
import {
  FANTASY11_ROUTE,
  CRICKET_BATTLE_ROUTE,
  insertQuickGameTabsAfterTennis,
  insertCasinoTabAfterQuickGames,
  isQuickGameTab
} from '@/composables/useQuickGameTabs';
import InplayIcon from '@/components/Icons/Inplay.vue';
import CasinoIcon from '@/components/Icons/Casino.vue';

const route = useRoute();
const router = useRouter();
const { eventTypes, getEventTypeIcon, getRacingRacesListRoute } = useEventTypes();

const stripRef = ref(null);
const scrollThumbLeft = ref(0);
const scrollThumbWidth = ref(0);
const showScrollTrack = ref(false);

const scrollThumbStyle = computed(() => ({
  width: `${scrollThumbWidth.value}px`,
  transform: `translateX(${scrollThumbLeft.value}px)`,
}));

function updateScrollThumb() {
  const el = stripRef.value;
  if (!el) return;
  const { scrollWidth, clientWidth, scrollLeft } = el;
  const overflow = scrollWidth - clientWidth;
  showScrollTrack.value = overflow > 4;
  if (!showScrollTrack.value) return;
  const trackInset = 10;
  const trackWidth = Math.max(0, clientWidth - trackInset * 2);
  const thumbWidth = Math.max(24, (clientWidth / scrollWidth) * trackWidth);
  const maxThumbTravel = trackWidth - thumbWidth;
  const ratio = overflow > 0 ? scrollLeft / overflow : 0;
  scrollThumbWidth.value = thumbWidth;
  scrollThumbLeft.value = ratio * maxThumbTravel;
}

function onStripScroll() {
  updateScrollThumb();
}

let resizeObserver = null;

onMounted(() => {
  nextTick(() => {
    updateScrollThumb();
    if (typeof ResizeObserver !== 'undefined' && stripRef.value) {
      resizeObserver = new ResizeObserver(() => updateScrollThumb());
      resizeObserver.observe(stripRef.value);
    }
  });
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

/** Mobile tab order matches desktop navbar (reference pills-tab). */
const EXCLUDED_TAB_NAMES = ['casino'];

const sportTabs = computed(() => {
  // Static menu from useEventTypes — same source as TopNavigation / no menu/list API.
  const menu = (eventTypes.value || []).map((item) => ({
    id: Number(item.id),
    name: String(item.name || '').trim()
  }));

  const filtered = menu.filter((item) => {
    if (!item || !Number.isFinite(Number(item.id)) || !item.name) return false;
    if (!includeInSportNavMenu(item)) return false;
    const lowered = item.name.toLowerCase();
    return !EXCLUDED_TAB_NAMES.some((name) => lowered.includes(name));
  });

  return sortEventTypesForSportNav(filtered);
});

const CASINO_TAB = { id: 'casino', value: 'casino', name: 'CASINO', icon: CasinoIcon };

/** CASINO after Fantasy 11 / Cricket Battle (same as desktop navbar). */
const sportTabsWithCasino = computed(() => {
  const sportOnlyRows = sportTabs.value.map((sport) => ({
    id: String(sport.id),
    value: sport.id,
    name: String(sport?.name || '').toUpperCase(),
    icon: getEventTypeIcon(Number(sport?.id))
  }));
  const rowsWithQuickGames = insertQuickGameTabsAfterTennis(sportOnlyRows);
  return insertCasinoTabAfterQuickGames(rowsWithQuickGames, CASINO_TAB);
});

const mobileSportTabs = computed(() => [
  { id: '-1', value: -1, name: 'INPLAY', icon: InplayIcon },
  ...sportTabsWithCasino.value
]);

const activeTabId = computed(() => {
  const p = route.path;
  if (p === FANTASY11_ROUTE) return 'quick-fantasy11';
  if (p === CRICKET_BATTLE_ROUTE) return 'quick-cricket-battle';
  if (p.startsWith('/casino')) return 'casino';
  if (p === '/sports/live' || route.name === 'live') return '-1';
  const sportMatch = p.match(/^\/sports\/(\d+)/);
  if (sportMatch) return sportMatch[1];
  if (p.includes('/racing/races/horse_racing')) return String(HORSE_RACING_EVENT_TYPE_ID);
  if (p.includes('/racing/races/greyhound')) return String(GREYHOUND_RACING_EVENT_TYPE_ID);
  return null;
});

const getTabRoute = (tabValue) => {
  if (Number(tabValue) === -1) return '/sports/live';
  const sport = sportTabs.value.find((s) => Number(s.id) === Number(tabValue));
  if (!sport) return null;
  const racing = getRacingRacesListRoute(sport);
  if (racing) return racing;
  return `/sports/${sport.id}`;
};

const onTabClick = (tab) => {
  if (tab?.route) {
    router.push(tab.route);
    return;
  }
  if (Number(tab?.value) === -1) {
    router.push('/sports/live');
    return;
  }
  if (tab?.value === 'casino') {
    router.push('/casino');
    return;
  }
  const to = getTabRoute(tab?.value);
  if (to) router.push(to);
};

watch(mobileSportTabs, () => nextTick(updateScrollThumb));
</script>

<style scoped>
/* Rounded dark menu rail — inset pill; horizontal scroll inside */
.mobile-sports-chrome-tab-strip-wrap {
  width: 100%;
  max-width: 100%;
  background: #2b2b2b;
  border-radius: 14px;
  overflow: hidden;
  box-sizing: border-box;
}

.mobile-sports-chrome-tab-strip {
  display: flex;
  align-items: stretch;
  gap: 0;
  width: 100%;
  max-width: 100%;
  min-height: 58px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
  /* padding: 8px 4px 2px; me*/
  box-sizing: border-box;
}

.mobile-sports-chrome-tab-strip::-webkit-scrollbar {
  display: none;
}

.mobile-sports-chrome-tab-strip__scroll-track {
  position: relative;
  height: 4px;
  margin: 0 10px 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.mobile-sports-chrome-tab-strip__scroll-thumb {
  display: block;
  height: 100%;
  min-width: 28px;
  border-radius: 999px;
  background: #8a8a8a;
  transition: transform 0.08s linear, width 0.08s linear;
  will-change: transform, width;
}

.mobile-sports-chrome-tab {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  margin: 0;
  border: 0;
  background: transparent;
  color: #ffffff99;
  height: 58px;
  padding: 2px 20px 4px;
  min-width: max-content;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1;
  white-space: nowrap;
  text-transform: uppercase;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.mobile-sports-chrome-tab:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 18%;
  right: 0;
  width: 1px;
  height: 64%;
  background: rgba(255, 255, 255, 0.14);
  pointer-events: none;
}

.mobile-sports-chrome-tab--gold:not(.mobile-sports-chrome-tab--active) {
  color: #e8c56a;
}

.mobile-sports-chrome-tab--gold:not(.mobile-sports-chrome-tab--active) .mobile-sports-chrome-tab__icon--mdi {
  color: #e8c56a !important;
}

@keyframes fantasy-tab-pulse {
  0%   { background-color: #FFD700; }
  50%  { background-color: #FFBE00; }
  100% { background-color: #FFD700; }
}

.mobile-sports-chrome-tab--quick {
  min-width: max-content;
  border-radius: 8px;
  margin: 0 3px;
  padding-bottom: 6px;
}

.mobile-sports-chrome-tab--quick:not(.mobile-sports-chrome-tab--active) {
  background-color: #FFD700;
  color: #1a1a1a;
  animation: fantasy-tab-pulse 2.4s ease-in-out infinite;
}

.mobile-sports-chrome-tab--quick:not(.mobile-sports-chrome-tab--active) .mobile-sports-chrome-tab__label {
  color: #1a1a1a;
}

.mobile-sports-chrome-tab--quick:not(.mobile-sports-chrome-tab--active) .mobile-sports-chrome-tab__icon--sport,
.mobile-sports-chrome-tab--quick:not(.mobile-sports-chrome-tab--active) .mobile-sports-chrome-tab__icon--mdi {
  color: #1a1a1a !important;
}

.mobile-sports-chrome-tab--quick:not(:last-child)::after {
  display: none;
}

.mobile-sports-chrome-tab--quick.mobile-sports-chrome-tab--active {
  background-color: #FFC200;
  border-radius: 8px;
}

.mobile-sports-chrome-tab__new {
  position: absolute;
  top: 1px;
  right: 4px;
  z-index: 1;
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.06em;
  background: #dc2626;
  color: #ffffff;
  padding: 2px 4px;
  line-height: 1;
  border-radius: 2px;
  white-space: nowrap;
}

.mobile-sports-chrome-tab:not(.mobile-sports-chrome-tab--active):not(.mobile-sports-chrome-tab--gold) .mobile-sports-chrome-tab__icon--mdi {
  color: #ffffff !important;
}

.mobile-sports-chrome-tab--active {
  color: #ffffff;
}

.mobile-sports-chrome-tab--active .mobile-sports-chrome-tab__label {
  color: var(--theme-orange, #f26c20);
}

.mobile-sports-chrome-tab__label {
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-align: center;
  max-width: none;
  white-space: nowrap;
  line-height: 1.05;
  color: inherit;
}

.mobile-sports-chrome-tab__icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
}

.mobile-sports-chrome-tab__icon {
  flex-shrink: 0;
}

.mobile-sports-chrome-tab__icon--mdi {
  opacity: 1;
}

.mobile-sports-chrome-tab__icon--inplay {
  display: block;
  flex-shrink: 0;
}
</style>
