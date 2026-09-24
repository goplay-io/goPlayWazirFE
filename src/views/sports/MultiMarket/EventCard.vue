<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import useDevices from '@/composables/useDevices';
import MarketGroup from './MarketGroup.vue';
import Fancy from '@/views/sports/Bet/Fancy.vue';
import EventData from '@/utils/eventData';
import { getValidFavoritedMarkets, getValidMarketCount, isEventVisibleInMultiMarket, formatMarketData } from '@/utils/multiMarketUtils';
import { readFavoriteMarketIdsForEvent } from '@/utils/favoriteMarketsSync';

const props = defineProps({
  eventData: {
    type: Object,
    required: true,
  },
  betStore: {
    type: Object,
    required: true,
  },
  isFavorite: {
    type: Function,
    required: true,
  },
  onToggleFavorite: {
    type: Function,
    required: true,
  },
  refreshKey: {
    type: Number,
    default: 0,
  },
});

const { t } = useI18n();
const { isMobile } = useDevices();

const collapsed = ref(false);

const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
};

const eventTitle = computed(() => {
  const ev = props.eventData.event;
  if (!ev) return t('components.multiMarket.eventFallback');
  const name = EventData.getEventName(ev);
  return name && name !== 'Unknown event'
    ? name
    : t('components.multiMarket.eventFallback');
});

const unknownEventTime = computed(() => t('components.betHeader.unknownTime'));

const formattedEventTime = computed(() => {
  const raw = EventData.getEventOpenTime(props.eventData.event);
  if (!raw || raw === 'Unknown time' || raw === unknownEventTime.value) {
    return unknownEventTime.value;
  }

  try {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return raw;
  }
});

const eventBetRoute = computed(() => {
  const id = props.eventData.eventId ?? props.eventData.event?.id;
  if (id == null || id === '') return null;
  return { name: 'sport-bet', params: { event_id: String(id) } };
});

const favoritedMarkets = computed(() => {
  props.refreshKey;
  return getValidFavoritedMarkets(props.eventData);
});
const validMarketCount = computed(() => {
  props.refreshKey;
  return getValidMarketCount(props.eventData);
});

const fancyProps = computed(() => {
  props.refreshKey;
  return formatMarketData(
    props.eventData,
    null,
    'FANCY',
    props.betStore,
    props.isFavorite,
    props.onToggleFavorite,
  );
});

const hasFancyMarkets = computed(() => favoritedMarkets.value.FANCY.length > 0);

const shouldShowCard = computed(() => {
  props.refreshKey;
  if (!isEventVisibleInMultiMarket(props.eventData)) return false;
  const storedIds = readFavoriteMarketIdsForEvent(props.eventData.eventId);
  if (storedIds.length === 0) return false;
  const sections =
    favoritedMarkets.value.MATCH_ODDS.length +
    favoritedMarkets.value.BOOKMAKER.length +
    favoritedMarkets.value.FANCY.length +
    favoritedMarkets.value.OTHER_MARKETS.length;
  return sections > 0;
});
</script>

<template>
  <div
    v-if="shouldShowCard"
    class="multi-market-event-card tw-bg-theme-surface tw-rounded-lg tw-border tw-border-theme-border tw-overflow-hidden"
  >
    <!-- Event header: bet-page style (mobile) | grey bar + go to event (desktop) -->
    <div class="mm-event-header-stack">
      <div v-if="isMobile" class="mm-event-header-mobile">
        <button
          type="button"
          class="mm-event-mobile-toggle"
          @click="toggleCollapse"
        >
          <div class="mm-event-mobile-info tw-min-w-0 tw-flex-1">
            <h3 class="mm-event-mobile-title tw-truncate" :title="eventTitle">
              {{ eventTitle }}
            </h3>
            <span class="mm-event-mobile-time">{{ formattedEventTime }}</span>
          </div>
          <v-icon
            class="mm-event-mobile-chevron tw-flex-shrink-0"
            :icon="collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'"
            size="20"
            aria-hidden="true"
          />
        </button>
        <router-link
          v-if="eventBetRoute"
          :to="eventBetRoute"
          class="mm-event-mobile-goto"
          :aria-label="t('components.multiMarket.openEventDetails')"
        >
          <v-icon icon="mdi-arrow-right" size="18" class="mm-event-mobile-goto-icon" />
        </router-link>
      </div>

      <div v-if="!isMobile" class="mm-event-header-desktop">
        <button
          type="button"
          class="mm-event-desktop-toggle"
          @click="toggleCollapse"
        >
          <h3 class="mm-event-desktop-title">
            {{ eventTitle }}
          </h3>
        </button>
        <router-link
          v-if="eventBetRoute"
          :to="eventBetRoute"
          class="mm-event-goto"
          :aria-label="t('components.multiMarket.openEventDetails')"
          @click.stop
        >
          <span class="mm-event-goto-disc" aria-hidden="true">
            <v-icon icon="mdi-arrow-right" size="16" class="mm-event-goto-icon" />
          </span>
        </router-link>
      </div>
    </div>

    <!-- Event Markets (Expandable) -->
    <transition name="expand">
      <div v-show="!collapsed" class="mm-event-markets-body tw-flex tw-flex-col tw-gap-2 md:tw-gap-3 tw-p-2 md:tw-p-0">
        <!-- Match Odds Group -->
        <MarketGroup :eventData="eventData" :markets="favoritedMarkets.MATCH_ODDS" marketType="MATCH_ODDS"
          :betStore="betStore" :isFavorite="isFavorite" :onToggleFavorite="onToggleFavorite" />

        <!-- Bookmaker Group -->
        <MarketGroup :eventData="eventData" :markets="favoritedMarkets.BOOKMAKER" marketType="BOOKMAKER"
          :betStore="betStore" :isFavorite="isFavorite" :onToggleFavorite="onToggleFavorite" />

        <!-- Fancy Group -->
        <div v-if="hasFancyMarkets">
          <component :is="Fancy" v-bind="fancyProps" />
        </div>

        <!-- Other Markets Group -->
        <MarketGroup :eventData="eventData" :markets="favoritedMarkets.OTHER_MARKETS" marketType="OTHER_MARKETS"
          :betStore="betStore" :isFavorite="isFavorite" :onToggleFavorite="onToggleFavorite" />

        <!-- Empty State for Event -->
        <div v-if="validMarketCount === 0" class="tw-text-center tw-text-sm tw-text-theme-text-secondary tw-py-3">
          {{ t('pages.multiMarket.noPinnedMarkets') }}
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

.expand-enter-from {
  max-height: 0;
  opacity: 0;
}

.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/*
 * App theme tokens (--color-text, --color-text-secondary) target dark headers/nav.
 * Event cards here are light surfaces — without overrides, secondary copy is white/light grey on white.
 */
.multi-market-event-card {
  --mm-card-heading: #1a1a1a;
  --mm-card-muted: #4b5563;
  --mm-card-subtle: #6b7280;
  --mm-header-bg: #e8e8ec;
  --mm-header-bg-hover: #dedee4;
  --mm-header-border: rgba(0, 0, 0, 0.08);
  color: var(--mm-card-heading);
}

/* Mobile only — matches BetHeader on the market page */
@media (max-width: 767px) {
  .mm-event-header-mobile {
    display: flex;
    align-items: stretch;
    width: 100%;
    min-height: 36px;
    background: #272727;
    border-bottom: 1px solid #333;
  }

  .mm-event-mobile-toggle {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
    margin: 0;
    padding: 0.3rem 0.5rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font: inherit;
    color: inherit;
    text-align: left;
  }

  .mm-event-mobile-toggle:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .mm-event-mobile-toggle:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: -2px;
  }

  .mm-event-mobile-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  .mm-event-mobile-title {
    margin: 0;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.02em;
    line-height: 1.15;
    color: var(--theme-orange) !important;
    text-transform: uppercase;
  }

  .mm-event-mobile-time {
    font-size: 10px;
    font-weight: 400;
    line-height: 1.2;
    color: #ffffff;
    letter-spacing: 0.01em;
  }

  .mm-event-mobile-chevron {
    color: #e8e8e8 !important;
  }

  .mm-event-mobile-goto {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    padding: 0 10px;
    border-left: 1px solid #333;
    background: #43a047;
    text-decoration: none;
    transition: background-color 0.15s ease;
  }

  .mm-event-mobile-goto:hover {
    background: #388e3c;
  }

  .mm-event-mobile-goto:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: -2px;
  }

  .mm-event-mobile-goto-icon {
    color: #ffffff !important;
  }

  .mm-event-header-stack {
    border-bottom: none;
  }
}

.mm-event-header-desktop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  min-height: 38px;
  padding: 0 10px;
  box-sizing: border-box;
  border-radius: 0;
  border-top: 1px solid #6b7280;
  background: linear-gradient(to bottom, #d1d1d1, #e8e8e8);
}

.mm-event-desktop-toggle {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  padding: 6px 4px 6px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
  color: inherit;
}

.mm-event-desktop-toggle:hover {
  filter: brightness(0.98);
}

.mm-event-desktop-title {
  margin: 0;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.2;
  color: #000000 !important;
  text-transform: uppercase;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mm-event-goto {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 8px;
  border-radius: 0;
  background-color: #43a047;
  text-decoration: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.mm-event-goto:hover {
  background-color: #388e3c;
}

.mm-event-goto:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.mm-event-goto-disc {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 0;
  background-color: rgba(255, 255, 255, 0.28);
}

.mm-event-goto-icon {
  color: #ffffff !important;
}

.mm-event-desktop-toggle:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
  border-radius: 0;
}

.mm-event-header-stack {
  border-bottom: 1px solid var(--mm-header-border);
}

.multi-market-event-card :deep(.tw-text-theme-text),
.multi-market-event-card :deep(h3.tw-text-theme-text) {
  color: var(--mm-card-heading) !important;
}

.multi-market-event-card :deep(.tw-text-theme-text-secondary),
.multi-market-event-card :deep(.tw-text-theme-text-secondary .v-icon) {
  color: var(--mm-card-muted) !important;
}

.multi-market-event-card :deep(.tw-text-theme-text-muted) {
  color: var(--mm-card-subtle) !important;
}

/* Market message strip (e.g. MatchOdds marquee): use theme marquee red inside light cards */
.multi-market-event-card :deep(.tw-text-marquee) {
  color: var(--color-marquee) !important;
}

@media (min-width: 768px) {
  .multi-market-event-card {
    background: #ffffff !important;
    border: 1px solid #d9d9d9 !important;
    border-radius: 2px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    margin-bottom: 0;
  }

  .mm-event-header-desktop {
    border-top: none;
    min-height: 40px;
    padding: 0 12px;
    border-bottom: 1px solid #d9d9d9;
    background: linear-gradient(to bottom, #d4d4d4, #ebebeb);
  }

  .mm-event-header-stack {
    border-bottom: none;
  }

  .mm-event-desktop-title {
    font-size: 0.875rem;
    letter-spacing: 0.05em;
  }

  .mm-event-goto {
    border-radius: 4px;
    padding: 6px 10px;
  }

  .mm-event-goto-disc {
    border-radius: 50%;
    background-color: #ffffff;
    width: 24px;
    height: 24px;
  }

  .mm-event-goto-icon {
    color: #2e7d32 !important;
  }

  /* Reference: burgundy CASHOUT pill on gold market headers */
  .multi-market-event-card :deep(.match-odds-orange-header span.tw-bg-gray-200\/90),
  .multi-market-event-card :deep(.bookmaker-bl-orange-header span.tw-bg-gray-200\/90),
  .multi-market-event-card :deep(.ginnie-orange-header span.tw-bg-gray-200\/90) {
    background-color: #7a1520 !important;
    color: #ffffff !important;
  }

  /* Markets sit flush inside the white card; panels keep side borders only at card edges */
  .multi-market-event-card :deep(.match-odds-root),
  .multi-market-event-card :deep(.bookmaker-bl-root),
  .multi-market-event-card :deep(.bookmaker-bo-root),
  .multi-market-event-card :deep(.bookmaker-ginnie-root),
  .multi-market-event-card :deep(.market-panel) {
    border-radius: 0 !important;
    border-left: none !important;
    border-right: none !important;
    margin-bottom: 0 !important;
  }

}
</style>
