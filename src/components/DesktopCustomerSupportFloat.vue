<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { buildWhatsAppSupportUrl } from '@/utils/whatsappSupportUrl'

const DISMISS_STORAGE_KEY = 'desktop-customer-support-dismissed'

const { t } = useI18n()
const route = useRoute()
const settingsStore = useSettingsStore()

const visible = ref(true)

const isClearScreenPage = computed(() => {
  const path = route.path
  return path === '/casino/game' || path.startsWith('/casino/game/')
})

const showWidget = computed(() => visible.value && !isClearScreenPage.value)

const whatsappUrl = computed(() =>
  buildWhatsAppSupportUrl(settingsStore.whatsappChannel),
)

onMounted(() => {
  try {
    visible.value = sessionStorage.getItem(DISMISS_STORAGE_KEY) !== '1'
  } catch {
    visible.value = true
  }
})

function dismissWidget() {
  visible.value = false
  try {
    sessionStorage.setItem(DISMISS_STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

function openSupport() {
  window.open(whatsappUrl.value, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div v-if="showWidget" class="desktop-support-float" aria-live="polite">
    <div class="desktop-support-float__inner">
      <button
        type="button"
        class="desktop-support-float__close"
        :aria-label="t('components.desktopCustomerSupport.close')"
        @click="dismissWidget"
      >
        <img
          src="/svg/close-wp.png"
          alt=""
          class="desktop-support-float__close-icon"
          width="22"
          height="22"
        />
      </button>

      <button
        type="button"
        class="desktop-support-float__cta"
        :aria-label="t('components.desktopCustomerSupport.label')"
        @click="openSupport"
      >
        <img
          src="/svg/whatsapp2.png"
          alt=""
          class="desktop-support-float__icon"
          width="32"
          height="32"
        />
        <span class="desktop-support-float__label">
          {{ t('components.desktopCustomerSupport.label') }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Reference: fixed bottom-20 left-0 z-40 md:block hidden */
.desktop-support-float {
  display: none;
  position: fixed;
  bottom: 80px;
  left: 0;
  z-index: 40;
  pointer-events: none;
}

@media (min-width: 768px) {
  .desktop-support-float {
    display: block;
  }
}

.desktop-support-float__inner {
  position: relative;
  pointer-events: auto;
}

.desktop-support-float__close {
  position: absolute;
  top: -6px;
  left: calc(100% - 11px);
  z-index: 50;
  display: block;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  line-height: 0;
}

.desktop-support-float__close-icon {
  display: block;
  width: 22px;
  height: 22px;
  object-fit: contain;
}

/* Reference: whatsapp_zuplay rounded-full text-[14px] font-semibold p-2 bg-green-500 */
.desktop-support-float__cta {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 8px;
  border: 0;
  border-radius: 9999px;
  background: #22c55e;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
  cursor: pointer;
  white-space: nowrap;
}

.desktop-support-float__icon {
  display: block;
  width: 32px;
  height: 32px;
  margin-left: 1px;
  object-fit: contain;
  flex-shrink: 0;
}

.desktop-support-float__label {
  display: block;
  margin-left: 8px;
}
</style>
