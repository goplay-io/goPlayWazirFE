<script setup>
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ScoreCard from './ScoreCard.vue';
import SrWidgetScoreCard from './SrWidgetScoreCard.vue';
import TVLiveStream from '@/components/TVLiveStream.vue';
import useDevices from '@/composables/useDevices';
import { useScorecardTvStore } from '@/stores/scorecardTv';
import { storeToRefs } from 'pinia';

const props = defineProps({
  eventId: { type: [String, Number], default: null },
  eventTypeId: { type: [String, Number], default: null },
  scoreActive: { type: Boolean, default: false },
  scoreType: { type: String, default: 'Manual' },
  scorecardUrl: { type: String, default: '' },
  tvSrc: { type: String, default: '' },
  tvActive: { type: Boolean, default: false },
});

const emit = defineEmits(['scorecardAvailable']);

const { t } = useI18n();
const { isMobile } = useDevices();
const scorecardTvStore = useScorecardTvStore();
const { panelVisible, activeTab } = storeToRefs(scorecardTvStore);

const isSrCard = computed(() =>
  String(props.scoreType || 'Manual').toLowerCase() === 'sr_card',
);

watch(
  () => [isSrCard.value, props.scoreActive],
  ([srCard, active]) => {
    if (srCard && active) emit('scorecardAvailable', true);
  },
  { immediate: true },
);

const showScoreTab = computed(() => props.scoreActive);
const showTvTab = computed(() => props.tvActive);
const canShowPanel = computed(
  () => isMobile.value && (showScoreTab.value || showTvTab.value),
);

const showPanel = computed(() => canShowPanel.value && panelVisible.value);

/** Mobile market page: open scorecard by default when score is available. */
watch(
  [() => props.eventId, showScoreTab],
  () => {
    if (!isMobile.value || !props.eventId || !showScoreTab.value) return;
    scorecardTvStore.openPanel('score');
  },
  { immediate: true },
);

watch(
  [showScoreTab, showTvTab],
  () => {
    if (!showScoreTab.value && activeTab.value === 'score' && showTvTab.value) {
      scorecardTvStore.setTab('tv');
    }
    if (!showTvTab.value && activeTab.value === 'tv' && showScoreTab.value) {
      scorecardTvStore.setTab('score');
    }
  },
  { immediate: true },
);

const onScorecardAvailable = (ok) => {
  emit('scorecardAvailable', ok);
};

function selectTab(tab) {
  scorecardTvStore.setTab(tab);
  if (!panelVisible.value) scorecardTvStore.openPanel(tab);
}
</script>

<template>
  <div v-if="showPanel" class="scorecard-tv-mobile-panel">
    <div class="scorecard-tv-mobile-tabs-wrap">
      <ul class="scorecard-tv-mobile-tabs" role="tablist">
        <li v-if="showScoreTab" role="presentation" class="scorecard-tv-mobile-tabs__item">
          <button
            type="button"
            role="tab"
            class="scorecard-tv-mobile-tab"
            :class="{ 'scorecard-tv-mobile-tab--active': activeTab === 'score' }"
            :aria-selected="activeTab === 'score'"
            @click="selectTab('score')"
          >
            {{ t('components.betMarketsToolbar.score') }}
          </button>
        </li>
        <li v-if="showTvTab" role="presentation" class="scorecard-tv-mobile-tabs__item">
          <button
            type="button"
            role="tab"
            class="scorecard-tv-mobile-tab"
            :class="{ 'scorecard-tv-mobile-tab--active': activeTab === 'tv' }"
            :aria-selected="activeTab === 'tv'"
            @click="selectTab('tv')"
          >
            <span class="scorecard-tv-mobile-tab__label">
              {{ t('components.betHeader.liveTv') }}
              <span class="scorecard-tv-mobile-tab__dot" aria-hidden="true" />
            </span>
          </button>
        </li>
      </ul>
      <div class="scorecard-tv-mobile-tabs-divider" aria-hidden="true" />
    </div>

    <div class="scorecard-tv-mobile-content" role="tabpanel">
      <SrWidgetScoreCard
        v-if="activeTab === 'score' && showScoreTab && isSrCard"
        :event-id="eventId"
        :event-type-id="eventTypeId"
        :score-active="scoreActive"
        :collapsible="false"
        class="scorecard-tv-mobile-score"
      />
      <ScoreCard
        v-else-if="activeTab === 'score' && showScoreTab"
        :event-id="eventId"
        :score-active="scoreActive"
        :score-type="scoreType"
        :scorecard-url="scorecardUrl"
        :collapsible="false"
        class="scorecard-tv-mobile-score"
        @scorecard-available="onScorecardAvailable"
      />
      <div v-else-if="activeTab === 'tv' && showTvTab" class="scorecard-tv-mobile-tv">
        <TVLiveStream :src="tvSrc" no-header />
      </div>
    </div>
  </div>
</template>

<style scoped>
.scorecard-tv-mobile-panel {
  width: 100%;
  max-width: 100%;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  box-sizing: border-box;
  margin-bottom: var(--sports-bet-market-gap, 0.625rem);
}

.scorecard-tv-mobile-tabs-wrap {
  padding: 0px 0px 0;
}

.scorecard-tv-mobile-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  margin: 0;
  padding: 0;
  list-style: none;
  width: 100%;
  background: #360952;
  border-radius: 5px 5px 0 0;
  text-align: center;
}

.scorecard-tv-mobile-tabs__item {
  margin: 0;
}

.scorecard-tv-mobile-tab {
  appearance: none;
  display: inline-block;
  width: 130px;
  height: 30px;
  margin: 0;
  padding: 0;
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 4px 4px 0 0;
  background: transparent;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 15px;
  letter-spacing: normal;
  text-transform: uppercase;
  text-align: center;
  cursor: pointer;
}

.scorecard-tv-mobile-tab--active {
  border-bottom-color: #fafafa;
  border-radius: 4px;
}

.scorecard-tv-mobile-tab__label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.scorecard-tv-mobile-tab__dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: #dc2626;
  flex-shrink: 0;
}

.scorecard-tv-mobile-tabs-divider {
  height: 1px;
  background: #e5e7eb;
}

.scorecard-tv-mobile-content {
  min-height: 180px;
  background: #fff;
}

.scorecard-tv-mobile-score :deep(.scorecard-root) {
  margin-bottom: 0;
}

.scorecard-tv-mobile-score :deep(.scorecard-iframe),
.scorecard-tv-mobile-score :deep(.sportsradar-scorecard-iframe) {
  width: 100%;
  min-height: 180px;
  height: 180px;
  border: none;
  display: block;
}

.scorecard-tv-mobile-tv {
  min-height: 180px;
  overflow: hidden;
}

.scorecard-tv-mobile-tv :deep(.tv-live-stream-root),
.scorecard-tv-mobile-tv :deep(.tv-live-stream-iframe),
.scorecard-tv-mobile-tv :deep(iframe) {
  width: 100%;
  min-height: 180px;
  height: 180px;
  border: none;
  display: block;
}

.scorecard-tv-mobile-panel :deep(*) {
  max-width: 100%;
  box-sizing: border-box;
}
</style>
