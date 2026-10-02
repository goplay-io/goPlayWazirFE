<template>
  <v-menu v-model="open" offset-y :close-on-content-click="true" transition="slide-y-transition">
    <template v-slot:activator="{ props: menuProps }">
      <div
        v-bind="menuProps"
        class="skin-switcher-trigger tw-flex tw-items-center tw-justify-center tw-rounded-full tw-shrink-0 tw-cursor-pointer tw-transition-colors tw-duration-200 hover:tw-bg-white/20"
        :class="compact ? 'skin-switcher-trigger--compact' : 'tw-w-9 tw-h-9'"
        role="button"
        tabindex="0"
        :aria-label="ariaLabel"
      >
        <img
          v-if="currentSkinIcon"
          :src="currentSkinIcon"
          :alt="currentSkinLabel"
          class="skin-switcher-trigger__logo"
        />
        <v-icon v-else :size="compact ? 16 : 22" class="skin-switcher-trigger__icon">mdi-tshirt-crew</v-icon>
      </div>
    </template>

    <div class="tw-mt-1.5">
      <div
        class="tw-min-w-44 tw-rounded-xl tw-shadow-2xl tw-overflow-hidden"
        style="background-color: var(--color-background-alt); border: 1px solid var(--color-border);"
      >
        <div class="tw-p-1.5 tw-flex tw-flex-col tw-gap-0.5">
          <a
            v-for="skin in sortedSkins"
            :key="skin.key"
            :href="skin.url"
            class="tw-flex tw-items-center tw-gap-2.5 tw-px-3 tw-py-2 tw-rounded-lg tw-transition-all tw-duration-150 tw-no-underline"
            :class="skin.key === currentSkin
              ? 'tw-bg-theme-surface-alt'
              : 'hover:tw-bg-theme-surface-alt'"
          >
            <img
              v-if="skin.icon"
              :src="skin.icon"
              :alt="skin.label"
              class="tw-w-5 tw-h-5 tw-flex-shrink-0 tw-object-contain tw-rounded-sm"
            />
            <span
              class="tw-text-xs tw-font-bold"
              :class="skin.key === currentSkin ? 'tw-text-[#49915e]' : 'tw-text-theme-text'"
            >{{ skin.label }}</span>
            <v-icon
              v-if="skin.key === currentSkin"
              size="14"
              class="tw-ml-auto tw-text-[#49915e]"
            >mdi-check-circle</v-icon>
          </a>
        </div>
      </div>
    </div>
  </v-menu>
</template>

<script setup>
import { ref, computed } from 'vue'
import { skins, resolveSkinIcon } from '@/constants/skins.js'

const props = defineProps({
  currentSkin: {
    type: String,
    default: '',
  },
  compact: {
    type: Boolean,
    default: false,
  },
  ariaLabel: {
    type: String,
    default: 'Switch site',
  },
})

const open = ref(false)

const currentSkinEntry = computed(() =>
  skins.find((skin) => skin.key === props.currentSkin),
)

const currentSkinIcon = computed(() => resolveSkinIcon(currentSkinEntry.value?.icon))
const currentSkinLabel = computed(() => currentSkinEntry.value?.label || 'Site')

const sortedSkins = computed(() =>
  [...skins].sort((a, b) => {
    const aIsCurrent = a.key === props.currentSkin
    const bIsCurrent = b.key === props.currentSkin
    if (aIsCurrent !== bIsCurrent) return aIsCurrent ? -1 : 1

    const aPriority = Number.isFinite(Number(a.sort_priority)) ? Number(a.sort_priority) : 0
    const bPriority = Number.isFinite(Number(b.sort_priority)) ? Number(b.sort_priority) : 0
    return aPriority - bPriority
  }),
)
</script>

<style scoped>
.skin-switcher-trigger {
  background: rgba(255, 255, 255, 0.08);
  border: 1.5px solid rgba(255, 255, 255, 0.22);
}

.skin-switcher-trigger--compact {
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
}

.skin-switcher-trigger__logo {
  width: 26px;
  height: 26px;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.skin-switcher-trigger--compact .skin-switcher-trigger__logo {
  width: 22px;
  height: 22px;
}

.skin-switcher-trigger__icon {
  color: rgba(255, 255, 255, 0.95) !important;
}

@media (max-width: 767.98px) {
  .skin-switcher-trigger__icon {
    font-size: 16px !important;
  }
}
</style>
