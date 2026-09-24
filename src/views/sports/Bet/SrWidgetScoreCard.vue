<script setup>
import { ref, watch, computed } from 'vue';
import { useSrWidgetScorecard } from '@/composables/useSrWidgetScorecard.js';

const props = defineProps({
  eventId: { type: [String, Number], default: null },
  eventTypeId: { type: [String, Number], default: null },
  scoreActive: { type: Boolean, default: false },
  collapsible: { type: Boolean, default: false },
});

const open = ref(true);
const iframeKey = ref(0);

const eventIdRef = ref(props.eventId);
const eventTypeIdRef = ref(props.eventTypeId);
const enabledRef = ref(props.scoreActive);

watch(() => props.eventId, (v) => { eventIdRef.value = v; });
watch(() => props.eventTypeId, (v) => { eventTypeIdRef.value = v; });
watch(
  () => props.scoreActive,
  (active) => { enabledRef.value = !!active; },
  { immediate: true },
);

const { scorecardUrl } = useSrWidgetScorecard(
  eventIdRef,
  eventTypeIdRef,
  enabledRef,
);

watch(
  () => [scorecardUrl.value, props.eventId, props.eventTypeId],
  ([url, eventId, sportId], [prevUrl, prevEventId, prevSportId]) => {
    if (url && (url !== prevUrl || eventId !== prevEventId || sportId !== prevSportId)) {
      iframeKey.value += 1;
    }
  },
);

/** Only render after URL resolves — nothing shown if API returns no mapping. */
const showScorecard = computed(() =>
  props.scoreActive
  && props.eventId != null
  && props.eventId !== ''
  && !!scorecardUrl.value,
);

const showPanel = computed(() => !props.collapsible || open.value);
</script>

<template>
  <div v-if="showScorecard && showPanel" class="scorecard-root">
    <template v-if="collapsible">
      <div
        class="tw-bg-theme-surface tw-border tw-border-theme-border tw-rounded-lg sm:tw-rounded-[14px] tw-overflow-hidden"
      >
        <div
          @click="open = !open"
          class="tw-flex tw-justify-between tw-items-center tw-p-2 sm:tw-p-3 tw-cursor-pointer hover:tw-bg-theme-background-alt tw-transition-colors tw-border-b tw-border-theme-border"
        >
          <span class="tw-font-bold tw-text-sm sm:tw-text-base tw-text-theme-text">Score Card</span>
          <v-icon
            size="18"
            :class="open ? 'tw-rotate-180' : ''"
            class="tw-transition-transform tw-duration-200 tw-text-theme-text"
          >
            mdi-chevron-down
          </v-icon>
        </div>
        <transition name="slide-fade">
          <div v-show="open" class="sr-scorecard-shell">
            <iframe
              :key="iframeKey"
              class="scorecard-iframe sr-scorecard-iframe"
              :src="scorecardUrl"
              title="Score card"
            />
          </div>
        </transition>
      </div>
    </template>
    <div v-else class="sr-scorecard-shell">
      <iframe
        :key="iframeKey"
        class="scorecard-iframe sr-scorecard-iframe"
        :src="scorecardUrl"
        title="Score card"
      />
    </div>
  </div>
</template>

<style scoped>
.scorecard-root {
  margin-bottom: 8px;
}

.sr-scorecard-shell {
  width: 100%;
  overflow: hidden;
  background-color: #1e1e1e;
}

.scorecard-iframe {
  width: 100%;
  border: none;
  background: transparent;
  display: block;
}

.sr-scorecard-iframe {
  height: 182px;
  min-height: 182px;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  opacity: 1;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
</style>
