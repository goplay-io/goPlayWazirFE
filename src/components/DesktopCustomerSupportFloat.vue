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

const isHomePage = computed(() => route.path === '/sports/live')

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

  <a
    v-if="isHomePage"
    class="mobile-whatsapp-float"
    :href="whatsappUrl"
    target="_blank"
    rel="noopener noreferrer"
    title="WhatsAppContact"
    :aria-label="t('components.desktopCustomerSupport.label')"
  >
    <span class="mobile-whatsapp-float__glyph">
      <svg width="49" height="49" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M16 31C23.732 31 30 24.732 30 17C30 9.26801 23.732 3 16 3C8.26801 3 2 9.26801 2 17C2 19.5109 2.661 21.8674 3.81847 23.905L2 31L9.31486 29.3038C11.3014 30.3854 13.5789 31 16 31ZM16 28.8462C22.5425 28.8462 27.8462 23.5425 27.8462 17C27.8462 10.4576 22.5425 5.15385 16 5.15385C9.45755 5.15385 4.15385 10.4576 4.15385 17C4.15385 19.5261 4.9445 21.8675 6.29184 23.7902L5.23077 27.7692L9.27993 26.7569C11.1894 28.0746 13.5046 28.8462 16 28.8462Z" fill="#BFC8D0" />
        <path d="M28 16C28 22.6274 22.6274 28 16 28C13.4722 28 11.1269 27.2184 9.19266 25.8837L5.09091 26.9091L6.16576 22.8784C4.80092 20.9307 4 18.5589 4 16C4 9.37258 9.37258 4 16 4C22.6274 4 28 9.37258 28 16Z" fill="url(#mobile-whatsapp-float-green)" />
        <path fill-rule="evenodd" clip-rule="evenodd" d="M16 30C23.732 30 30 23.732 30 16C30 8.26801 23.732 2 16 2C8.26801 2 2 8.26801 2 16C2 18.5109 2.661 20.8674 3.81847 22.905L2 30L9.31486 28.3038C11.3014 29.3854 13.5789 30 16 30ZM16 27.8462C22.5425 27.8462 27.8462 22.5425 27.8462 16C27.8462 9.45755 22.5425 4.15385 16 4.15385C9.45755 4.15385 4.15385 9.45755 4.15385 16C4.15385 18.5261 4.9445 20.8675 6.29184 22.7902L5.23077 26.7692L9.27993 25.7569C11.1894 27.0746 13.5046 27.8462 16 27.8462Z" fill="white" />
        <path d="M12.5 9.49989C12.1672 8.83131 11.6565 8.8905 11.1407 8.8905C10.2188 8.8905 8.78125 9.99478 8.78125 12.05C8.78125 13.7343 9.52345 15.578 12.0244 18.3361C14.438 20.9979 17.6094 22.3748 20.2422 22.3279C22.875 22.2811 23.4167 20.0154 23.4167 19.2503C23.4167 18.9112 23.2062 18.742 23.0613 18.696C22.1641 18.2654 20.5093 17.4631 20.1328 17.3124C19.7563 17.1617 19.5597 17.3656 19.4375 17.4765C19.0961 17.8018 18.4193 18.7608 18.1875 18.9765C17.9558 19.1922 17.6103 19.083 17.4665 19.0015C16.9374 18.7892 15.5029 18.1511 14.3595 17.0426C12.9453 15.6718 12.8623 15.2001 12.5959 14.7803C12.3828 14.4444 12.5392 14.2384 12.6172 14.1483C12.9219 13.7968 13.3426 13.254 13.5313 12.9843C13.7199 12.7145 13.5702 12.305 13.4803 12.05C13.0938 10.953 12.7663 10.0347 12.5 9.49989Z" fill="white" />
        <defs>
          <linearGradient id="mobile-whatsapp-float-green" x1="26.5" y1="7" x2="4" y2="28" gradientUnits="userSpaceOnUse">
            <stop stop-color="#5BD066" />
            <stop offset="1" stop-color="#27B43E" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  </a>
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

.mobile-whatsapp-float {
  display: none;
}

@media (max-width: 767.98px) {
  .mobile-whatsapp-float {
    display: flex;
    position: fixed;
    top: calc(100dvh - 130px);
    bottom: auto;
    left: 12px;
    z-index: 50;
    width: max-content;
    height: max-content;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    border-radius: 9999px;
    background: transparent;
    cursor: pointer;
    line-height: 0;
    text-decoration: none;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mobile-whatsapp-float__glyph {
    display: block;
    margin-top: -3px;
    margin-left: -3px;
    background: transparent;
    line-height: 0;
  }

  .mobile-whatsapp-float svg {
    display: block;
    width: 49px;
    height: 49px;
  }
}
</style>
