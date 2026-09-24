<template>
  <v-menu v-model="open" offset-y :close-on-content-click="true" transition="slide-y-transition">
    <template v-slot:activator="{ props: menuProps }">
      <div
        v-bind="menuProps"
        class="skin-switcher-trigger tw-flex tw-items-center tw-justify-center tw-w-9 tw-h-9 tw-rounded-full tw-shrink-0 tw-cursor-pointer"
        style="background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,255,255,0.22);"
        role="button"
        tabindex="0"
        :aria-label="ariaLabel"
      >
        <v-icon size="22" style="color: #ffffff;">mdi-tshirt-crew</v-icon>
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
            <span
              class="tw-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-rounded tw-text-[10px] tw-font-extrabold tw-leading-none tw-flex-shrink-0"
              :style="{
                color: skin.color,
                border: `1.5px solid ${skin.color}`,
                background: 'rgba(0,0,0,0.35)',
              }"
            >{{ skin.letter }}</span>
            <span
              class="tw-text-xs tw-font-bold"
              :style="skin.key === currentSkin ? { color: skin.color } : undefined"
              :class="skin.key !== currentSkin ? 'tw-text-theme-text' : ''"
            >{{ skin.label }}</span>
            <v-icon
              v-if="skin.key === currentSkin"
              size="14"
              class="tw-ml-auto"
              :style="{ color: skin.color }"
            >mdi-check-circle</v-icon>
          </a>
        </div>
      </div>
    </div>
  </v-menu>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  currentSkin: {
    type: String,
    default: ''
  },
  ariaLabel: {
    type: String,
    default: 'Switch site'
  }
})

const open = ref(false)

const skins = [
  {
    key: 'goplay',
    label: 'Goplay',
    letter: 'G',
    color: '#22c55e',
    url: import.meta.env.VITE_GOPLAY_SITE_URL || 'http://goplaybet.io/',
  },
  {
    key: 'diamond',
    label: 'Diamond',
    letter: 'D',
    color: '#ffffff',
    url: import.meta.env.VITE_DIAMOND_SITE_URL || 'http://diamond.goplaybet.io/',
  },
  {
    key: 'winbuzz',
    label: 'Win Buzz',
    letter: 'W',
    color: '#eab308',
    url: import.meta.env.VITE_WINBUZZ_SITE_URL || 'http://winbuzz.goplaybet.io/',
  },
  {
    key: 'fairplay',
    label: 'Fair Play',
    letter: 'F',
    color: '#f97316',
    url: import.meta.env.VITE_FAIRPLAY_SITE_URL || 'http://fairplay.goplaybet.io/',
  },
  {
    key: 'reddy',
    label: 'Reddy Book',
    letter: 'R',
    color: '#ef4444',
    url: import.meta.env.VITE_REDDY_SITE_URL || 'http://reddybook.goplaybet.io/',
  },
]

const sortedSkins = computed(() =>
  [...skins].sort((a, b) => (b.key === props.currentSkin) - (a.key === props.currentSkin))
)
</script>
