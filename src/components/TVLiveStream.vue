<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  src: { type: String, default: '' },
  /** When true the collapsible header is hidden (mobile toggle flow manages visibility externally) */
  noHeader: { type: Boolean, default: false },
  /** Initial open state — desktop defaults to closed */
  isOpen: { type: Boolean, default: false }
});

const hasSrc = computed(() => !!(props.src && String(props.src).trim()));

const open = ref(props.isOpen);
watch(() => props.isOpen, (v) => { open.value = v; }, { immediate: true });
</script>

<template>
  <div class="tv-live-wrap tw-bg-white tw-overflow-hidden">
    <!-- Collapsible header — desktop only; hidden on mobile via noHeader prop -->
    <div
      v-if="!noHeader"
      @click="open = !open"
      class="tv-live-header tw-flex tw-justify-between tw-items-center tw-cursor-pointer tw-transition-colors"
    >
      <span class="tv-live-section-title">LIVE STREAM</span>
      <v-icon
        size="16"
        :class="open ? 'tw-rotate-180' : ''"
        class="tw-transition-transform tw-duration-200 tw-text-white"
      >
        mdi-chevron-down
      </v-icon>
    </div>

    <!-- Content: shown directly when noHeader (mobile), otherwise collapsible -->
    <transition v-if="!noHeader" name="slide-fade">
      <div v-show="open" class="tv-live-body tw-p-1.5 sm:tw-p-2 tw-bg-[#ececec]">
        <div v-if="hasSrc" class="tv-live-frame tw-aspect-video tw-w-full tw-overflow-hidden tw-bg-black">
          <iframe :src="src" class="tw-w-full tw-h-full" allowfullscreen allow="autoplay; encrypted-media" title="TV Live Stream" />
        </div>
        <p v-else class="tw-text-theme-text-muted tw-text-sm tw-text-center tw-py-6 tw-bg-theme-surface tw-border tw-border-theme-border">
          No stream URL provided.
        </p>
      </div>
    </transition>
    <div v-else class="tv-live-body tw-overflow-hidden tw-bg-black">
      <div v-if="hasSrc" class="tv-live-frame tw-aspect-video tw-w-full tw-overflow-hidden">
        <iframe :src="src" class="tw-w-full tw-h-full" allowfullscreen allow="autoplay; encrypted-media" title="TV Live Stream" />
      </div>
      <p v-else class="tw-text-theme-text-muted tw-text-sm tw-text-center tw-py-6 tw-bg-theme-surface tw-border tw-border-theme-border">
        No stream URL provided.
      </p>
    </div>
  </div>
</template>

<style scoped>
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

.tv-live-wrap {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.tv-live-header {
  padding: 8px 12px;
  background: var(--color-header-bg);
}

.tv-live-header:hover {
  filter: brightness(1.08);
}

.tv-live-section-title {
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.tv-live-body {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.tv-live-frame {
  width: 100%;
  max-width: 100%;
}

.tv-live-frame iframe {
  display: block;
  width: 100%;
  max-width: 100%;
  border: 0;
}
</style>
