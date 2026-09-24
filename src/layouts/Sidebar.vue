<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useDevices from '@/composables/useDevices.js'
import SportsTree from '@/components/SportsTree.vue'
import LanguageModal from '@/components/LanguageModal.vue'
import { AVAILABLE_LOCALES } from '@/constants/locales.js'
import goplayLogo from '@/assets/goplay-logo.png'

const { isMobile } = useDevices()
const { locale } = useI18n()

const showLanguageModal = ref(false)
const availableLocales = AVAILABLE_LOCALES
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 375)

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  topOffset: { type: Number, default: 100 },
})

const emit = defineEmits(['update:modelValue'])

const drawerModel = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

/** Must match Vuetify `:width` — CSS-only width breaks close translateX. */
const mobileDrawerWidth = computed(() => Math.min(320, Math.round(viewportWidth.value * 0.8)))

function syncViewportWidth() {
  viewportWidth.value = window.innerWidth
}

onMounted(() => {
  syncViewportWidth()
  window.addEventListener('resize', syncViewportWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', syncViewportWidth)
})

function onNavigate() {
  if (isMobile.value) drawerModel.value = false
}

function closeDrawer() {
  drawerModel.value = false
}

function setLocale(lang) {
  locale.value = lang
  try {
    localStorage.setItem('locale', lang)
  } catch (e) {
    console.error('Failed to persist locale', e)
  }
  showLanguageModal.value = false
}
</script>

<template>
  <!-- Mobile: full-height purple drawer (ZU AppLayout pattern) -->
  <v-navigation-drawer
    v-if="isMobile"
    v-model="drawerModel"
    :width="mobileDrawerWidth"
    temporary
    touchless
    location="left"
    class="sidebar-root sidebar-root--mobile"
  >
    <div class="sidebar-mobile-shell">
      <div class="sidebar-mobile-header">
        <img :src="goplayLogo" alt="Goplay" class="sidebar-mobile-logo" />
        <button
          type="button"
          class="sidebar-mobile-close"
          :aria-label="'Close'"
          @click="closeDrawer"
        >
          <v-icon size="22">mdi-close</v-icon>
        </button>
      </div>

      <div class="sidebar-content sidebar-content--mobile">
        <div class="sidebar-tree-wrap">
          <SportsTree
            mobile-drawer
            :languages-active="showLanguageModal"
            @navigate="onNavigate"
            @open-languages="showLanguageModal = true"
          />
        </div>
        <Teleport to="body">
          <LanguageModal
            v-if="showLanguageModal"
            :available-locales="availableLocales"
            @close="showLanguageModal = false"
            @select="setLocale"
          />
        </Teleport>
      </div>
    </div>
  </v-navigation-drawer>

  <!-- Desktop: persistent left column — always visible (drawerModel is mobile-only) -->
  <aside v-else class="sidebar-desktop">
    <div class="sidebar-content">
      <div class="sidebar-tree-wrap">
        <SportsTree
          :languages-active="showLanguageModal"
          @navigate="onNavigate"
          @open-languages="showLanguageModal = true"
        />
      </div>
      <Teleport to="body">
        <LanguageModal
          v-if="showLanguageModal"
          :available-locales="availableLocales"
          @close="showLanguageModal = false"
          @select="setLocale"
        />
      </Teleport>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-root {
  background-color: #ffffff !important;
  overflow: hidden;
}

.sidebar-root :deep(.v-navigation-drawer) {
  z-index: 3001 !important;
}

.sidebar-root :deep(.v-navigation-drawer__scrim) {
  z-index: 3000 !important;
}

.sidebar-root :deep(.v-navigation-drawer__content) {
  overflow: hidden;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.sidebar-tree-wrap {
  flex: 1 1 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-desktop {
  flex: 0 0 290px;
  width: 290px;
  min-width: 290px;
  max-width: 290px;
  align-self: stretch;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--color-event-name, #333333);
  border-radius: 8px;
  overflow: hidden;
  border-right: none;
  margin-right: 6px;
  z-index: 1;
}

@media (min-width: 1024px) {
  .layout-sidebar-column .sidebar-desktop {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    max-width: none;
    margin-right: 0;
  }
}

/* Mobile purple drawer — do not override width/transform; Vuetify owns close slide. */
.sidebar-root--mobile {
  background: #360952 !important;
  top: 0 !important;
  height: 100% !important;
  max-height: 100dvh !important;
  z-index: 3001 !important;
}

.sidebar-root--mobile :deep(.v-navigation-drawer__content) {
  width: 100%;
  height: 100%;
  background: #360952;
}

.sidebar-mobile-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #360952;
  color: #ffffff;
}

.sidebar-mobile-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 46px;
  padding: 8px 12px;
  background: #360952;
}

.sidebar-mobile-logo {
  display: block;
  height: 30px;
  width: auto;
  max-width: 138px;
  object-fit: contain;
}

.sidebar-mobile-close {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
}

.sidebar-content--mobile {
  background: #360952;
  color: #ffffff;
}
</style>
