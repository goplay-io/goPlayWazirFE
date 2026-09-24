<script setup>
import { ref, watch, computed } from 'vue';
import { useScorecardWebSocket } from '@/composables/useScorecardWebSocket.js';

const props = defineProps({
  eventId: { type: [String, Number], default: null },
  scoreActive: { type: Boolean, default: false },
  collapsible: { type: Boolean, default: false },
  scoreType: { type: String, default: 'Manual' },
  scorecardUrl: { type: String, default: '' },
});

const emit = defineEmits(['scorecardAvailable']);

const open = ref(true);
const htmlContent = ref('');

const isSportsRadar = computed(() =>
  String(props.scoreType || 'Manual').toLowerCase() === 'sportradar'
);

const showScorecard = computed(() =>
  props.scoreActive && props.eventId != null && props.eventId !== ''
);

const showManualContent = computed(() => !isSportsRadar.value && !!htmlContent.value);
const showSportsRadarContent = computed(() => isSportsRadar.value && !!props.scorecardUrl);

const eventIdRef = ref(props.eventId);
const manualScoreActiveRef = ref(props.scoreActive && !isSportsRadar.value);

watch(() => props.eventId, (v) => { eventIdRef.value = v; });
watch(
  () => [props.scoreActive, isSportsRadar.value],
  ([active, sportsRadar]) => { manualScoreActiveRef.value = !!active && !sportsRadar; }
);

// Injected into srcdoc — runs inside the iframe with allow-same-origin so it can
// directly manipulate window.frameElement to set its own height precisely.
// IntersectionObserver handles the case where the iframe was hidden on load.
const resizeScript = `<script>
(function(){
  function resize(){
    var fe=window.frameElement;
    if(!fe)return;
    var h=Math.ceil(document.body?document.body.scrollHeight:document.documentElement.scrollHeight);
    if(h>0)fe.style.height=h+'px';
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',resize);}
  window.addEventListener('load',resize);
  if(typeof ResizeObserver!=='undefined'){
    new ResizeObserver(resize).observe(document.body||document.documentElement);
  }
  if(typeof IntersectionObserver!=='undefined'){
    new IntersectionObserver(function(entries){
      entries.forEach(function(e){if(e.isIntersecting)resize();});
    }).observe(document.body||document.documentElement);
  }
})();
<\/script>`;

function emitSportsRadarAvailability() {
  if (!isSportsRadar.value) return;
  emit('scorecardAvailable', !!(props.scoreActive && props.scorecardUrl));
}

function setAvailableFromPayload(payload) {
  const raw = typeof payload === 'string' ? payload : payload?.data ?? '';
  const usable = typeof raw === 'string' && raw.trim().length > 0;
  if (usable) {
    htmlContent.value =
      '<style>html,body{margin:0;padding:0;overflow:hidden;}</style>' + resizeScript + raw.trim();
  } else {
    htmlContent.value = '';
  }
  if (!isSportsRadar.value) {
    emit('scorecardAvailable', usable);
  }
}

watch(
  () => [props.eventId, props.scoreActive, isSportsRadar.value, props.scorecardUrl],
  () => {
    htmlContent.value = '';
    if (isSportsRadar.value) {
      emitSportsRadarAvailability();
    } else {
      emit('scorecardAvailable', false);
    }
  }
);

useScorecardWebSocket(eventIdRef, manualScoreActiveRef, {
  onData(payload) {
    setAvailableFromPayload(payload);
  },
});
</script>

<template>
  <div v-if="showScorecard && (showManualContent || showSportsRadarContent)" class="scorecard-root tw-overflow-hidden">
    <template v-if="collapsible">
      <div
        class="tw-bg-theme-surface tw-border tw-border-theme-border tw-rounded tw-overflow-hidden tw-mb-3"
      >
        <!-- Same header pattern as MatchOdds.vue -->
        <div
          role="button"
          tabindex="0"
          @click="open = !open"
          @keydown.enter.prevent="open = !open"
          @keydown.space.prevent="open = !open"
          class="mo-market-header tw-bg-[var(--color-nav)] tw-px-2 sm:tw-px-3 tw-py-1.5 tw-flex tw-items-center tw-gap-1.5 sm:tw-gap-2 tw-min-w-0 max-md:tw-overflow-x-auto max-md:tw-overflow-y-hidden tw-cursor-pointer"
        >
          <h2
            class="tw-text-white tw-font-bold tw-text-sm tw-m-0 tw-min-w-0 tw-truncate tw-uppercase md:tw-flex-shrink-0 max-md:tw-basis-auto"
          >
            Score Card
          </h2>
          <div class="tw-flex tw-items-center tw-gap-1 tw-ml-auto tw-flex-shrink-0">
            <v-icon
              size="18"
              :class="open ? 'tw-rotate-180' : ''"
              class="tw-transition-transform tw-duration-200 tw-text-white"
            >
              mdi-chevron-down
            </v-icon>
          </div>
        </div>
        <transition name="slide-fade">
          <div v-show="open">
            <iframe
              v-if="showSportsRadarContent"
              class="scorecard-iframe sportsradar-scorecard-iframe"
              :src="scorecardUrl"
              title="Score card"
            />
            <iframe
              v-else-if="showManualContent"
              class="scorecard-iframe"
              :srcdoc="htmlContent"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </transition>
      </div>
    </template>
    <template v-else>
      <iframe
        v-if="showSportsRadarContent"
        class="scorecard-iframe sportsradar-scorecard-iframe"
        :src="scorecardUrl"
        title="Score card"
      />
      <iframe
        v-else-if="showManualContent"
        class="scorecard-iframe"
        :srcdoc="htmlContent"
        sandbox="allow-scripts allow-same-origin"
      />
    </template>
  </div>
</template>

<style scoped>
.scorecard-root {
  margin-bottom: 0;
}
.scorecard-iframe {
  width: 100%;
  height: 1px;
  border: none;
  background: transparent;
  overflow: hidden;
  display: block;
}
.sportsradar-scorecard-iframe {
  height: 220px;
  min-height: 200px;
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
