<template>
  <component :is="layoutComponent" v-bind="layoutProps">
    <router-view :key="pageRefreshKey" />
  </component>

  <!-- Banner Popup - v-if ensures the overlay/scrim is fully destroyed when not shown -->
  <BannerPopup v-if="showBannerPopup" v-model="showBannerPopup" :banners="matchedBanners" @close="handleBannerClose" />

  <ApkDownloadModal />

  <LoginModal />
  <ForgotPasswordModal />

  <GlobalSnackbar />

  <ExposureDialog v-model="showExposureDialog" />
  <BonusRulesModal v-model="showBonusRulesModal" />

  <Teleport to="body">
    <SkinDock />
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useEventsStore } from '@/stores/events/events'
import Layout from '@/layouts/Layout.vue'
import GuestLayout from '@/layouts/GuestLayout.vue'
import BannerPopup from '@/components/BannerPopup.vue'
import ApkDownloadModal from '@/components/ApkDownloadModal.vue'
import LoginModal from '@/components/auth/LoginModal.vue'
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal.vue'
import GlobalSnackbar from '@/components/GlobalSnackbar.vue'
import ExposureDialog from '@/layouts/ExposureDialog.vue'
import BonusRulesModal from '@/components/BonusRulesModal.vue'
import SkinDock from '@/components/SkinDock.vue'
import useBannerPopup from '@/composables/useBannerPopup.js'
import { useExposureDialog } from '@/composables/useExposureDialog'
import { useBonusRulesModal } from '@/composables/useBonusRulesModal'

const route = useRoute()
const authStore = useAuthStore()
const eventsStore = useEventsStore()
const { pageRefreshKey } = storeToRefs(useUIStore())

// Banner popup for all pages
const { showBannerPopup, matchedBanners, handleBannerClose } = useBannerPopup()
const { showExposureDialog } = useExposureDialog()
const { showBonusRulesModal } = useBonusRulesModal()

const BareLayout = {
  setup(_, { slots }) {
    return () => slots.default?.()
  },
}

// Full demo (Try Demo) and real users share Layout/Header; preview/guest stay on GuestLayout
const isLoggedInUi = computed(() => authStore.isUiAuthenticated)

const layoutMeta = computed(() => route.meta?.layout)
const layoutProps = computed(() => route.meta?.layoutProps || {})

const layoutComponent = computed(() => {
  // Explicit layout override (e.g. login/landing)
  if (layoutMeta.value === 'none') return BareLayout
  if (layoutMeta.value === 'guest') return GuestLayout
  if (layoutMeta.value === 'auth') return Layout

  return isLoggedInUi.value ? Layout : GuestLayout
})

// Kick off events/list during setup (before child onMounted) so Live joins an in-flight request.
// Do not prefetch menu/list here — home/live does not need it on first paint.
eventsStore.prefetchAllEvents()
</script>
