<template>
  <div class="sport-events-table-header tw-mb-1">
    <div class="sport-events-table-header__inner">
      <div class="sport-events-table-header__left">
        <span v-if="iconSrc || icon" class="sport-events-table-header__icon-wrap">
          <img v-if="iconSrc" :src="iconSrc" alt="" class="sport-events-table-header__icon-img" width="16" height="16" />
          <component :is="icon" v-else-if="icon" :width="16" :height="16" class="sport-events-table-header__icon" />
        </span>
        <h2 class="sport-events-table-header__title">{{ title }}</h2>
        <div v-if="showFeedFilters" class="feed-mode-pills">
          <button type="button" class="feed-mode-pill"
            :class="{ 'feed-mode-pill--active': feedLiveActive }"
            @click="$emit('toggle-live')">
            <FeedModePillPrefix :active="feedLiveActive" />
            {{ liveLabel }}
          </button>
          <button type="button" class="feed-mode-pill feed-mode-pill--virtual"
            :class="{ 'feed-mode-pill--active': feedVirtualActive }"
            @click="$emit('toggle-virtual')">
            <FeedModePillPrefix :active="feedVirtualActive" />
            Virtual
          </button>
          <button type="button" class="feed-mode-pill"
            :class="{ 'feed-mode-pill--active': feedPremiumActive }"
            @click="$emit('toggle-premium')">
            <FeedModePillPrefix :active="feedPremiumActive" />
            {{ premiumLabel }}
          </button>
        </div>
        <div v-if="showViewBy && !isMobile" class="view-by-group">
          <span class="view-by-label">View by:</span>
          <v-select
            :model-value="sortBy"
            :items="viewByOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="compact"
            hide-details
            :list-props="{ density: 'compact' }"
            :menu-props="viewByMenuProps"
            class="sport-filter-select sport-filter-select--view-by"
            @update:model-value="$emit('update:sortBy', $event)"
          />
        </div>
      </div>
      <div class="sport-events-table-header__right">
        <div class="sport-events-table-header__meta-spacer" aria-hidden="true" />
        <div class="sport-events-table-header__market-cols">
          <span>1</span>
          <span>X</span>
          <span>2</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import FeedModePillPrefix from '@/components/sports/FeedModePillPrefix.vue'
import useDevices from '@/composables/useDevices.js'

defineProps({
  title: { type: String, required: true },
  icon: { type: [Object, Function], default: null },
  iconSrc: { type: String, default: '' },
  showFeedFilters: { type: Boolean, default: false },
  feedLiveActive: { type: Boolean, default: false },
  feedPremiumActive: { type: Boolean, default: false },
  feedVirtualActive: { type: Boolean, default: false },
  liveLabel: { type: String, default: 'LIVE' },
  premiumLabel: { type: String, default: 'PREMIUM' },
  sortBy: { type: String, default: 'time' },
  showViewBy: { type: Boolean, default: true },
  viewByOptions: {
    type: Array,
    default: () => [
      { title: 'TIME', value: 'time' },
      { title: 'COMPETITION', value: 'competition' }
    ]
  },
  viewByMenuProps: {
    type: Object,
    default: () => ({
      location: 'bottom',
      offset: 0,
      contentProps: { class: 'sport-view-by-menu' }
    })
  }
})

defineEmits(['toggle-live', 'toggle-premium', 'toggle-virtual', 'update:sortBy'])

const { isMobile } = useDevices()
</script>
