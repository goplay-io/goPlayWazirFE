<template>
    <v-dialog ref="dialogRef" v-model="dialog" :max-width="isMobile ? '100%' : '1200'" :fullscreen="isMobile"
        content-class="banner-popup-dialog" scrollable :retain-focus="false" :persistent="false">
        <v-card class="banner-card" elevation="0">
            <div class="banner-border-container">
                <!-- Close Button - Inside the border -->
                <button type="button" @click.stop.prevent="closeDialog" @mousedown.stop @touchstart.stop
                    class="banner-close-btn" aria-label="Close banner">
                    <v-icon size="20" color="white">mdi-close</v-icon>
                </button>

                <div v-if="banners.length === 0"
                    class="banner-container tw-text-center tw-py-8 tw-text-theme-text-secondary">
                    No banners available
                </div>

                <div v-else class="banner-container" v-for="(banner, index) in banners" :key="banner.id || index"
                    :class="{ 'tw-cursor-pointer': banner.action_url }" @click="handleBannerClick(banner)">
                    <div class="banner-wrapper tw-relative">
                        <!-- Desktop Image -->
                        <img v-if="banner.desktop_image && !isMobile" :src="banner.desktop_image"
                            :alt="banner.name || 'Banner'" class="banner-image" @error="handleImageError" />

                        <!-- Mobile Image -->
                        <img v-else-if="banner.mobile_image && isMobile" :src="banner.mobile_image"
                            :alt="banner.name || 'Banner'" class="banner-image" @error="handleImageError" />

                        <!-- Fallback to desktop image if mobile image not available -->
                        <img v-else-if="banner.desktop_image" :src="banner.desktop_image" :alt="banner.name || 'Banner'"
                            class="banner-image" @error="handleImageError" />

                        <!-- No image message -->
                        <div v-else class="tw-text-sm tw-text-theme-text-secondary tw-py-4 tw-text-center">
                            No image available
                        </div>
                    </div>
                </div>
            </div>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import useDevices from '@/composables/useDevices.js'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    banners: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['update:modelValue', 'close'])

const route = useRoute()
const { isMobile } = useDevices()
const loading = ref(false)
const dialogRef = ref(null)

// Use banners from props
const banners = computed(() => {
    const bannerList = props.banners || []
    return bannerList
})

const dialog = computed({
    get: () => {
        return props.modelValue
    },
    set: (value) => {
        emit('update:modelValue', value)
    }
})

const closeDialog = (event) => {
    if (event) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
    }

    // Set dialog to false - this will trigger the computed setter which emits
    // The watch on modelValue will handle emitting the 'close' event
    dialog.value = false
}

const BANNER_URL_PATTERN = /^https?:\/\/[\w\-.]+(:\d+)?(\/[^\s]*)?$/i

const handleBannerClick = (banner) => {
    if (banner.action_url) {
        const url = banner.action_url.trim()

        // Only open URLs that are valid http/https URLs
        if (BANNER_URL_PATTERN.test(url)) {
            window.open(url, '_blank', 'noopener,noreferrer')
        }
    }
}

const handleImageError = (event) => {
    // Hide broken images
    event.target.style.display = 'none'
}


// Banners are now passed as props, no need to fetch
// Watch for banners changes
watch(() => props.banners, () => {
    // Banners updated
}, { immediate: true, deep: true })

// Watch for modelValue changes - handle dialog close
watch(() => props.modelValue, (newValue, oldValue) => {
    // If dialog was closed (changed from true to false), emit close event
    // Only emit if oldValue exists (not on initial mount)
    if (oldValue !== undefined && oldValue === true && newValue === false) {
        emit('close')
    }
})
</script>

<style scoped>
/* Banner card styling */
.banner-card {
    background: transparent !important;
    box-shadow: none !important;
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
}

/* Banner border container - attractive border with close button inside */
.banner-border-container {
    position: relative;
    background: linear-gradient(135deg,
            var(--color-primary) 0%,
            var(--color-primary-hover) 25%,
            var(--color-secondary) 50%,
            var(--color-primary) 75%,
            var(--color-primary-hover) 100%);
    border-radius: 16px;
    padding: 4px;
    box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.3),
        0 8px 32px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    max-width: 100%;
    width: fit-content;
    margin: auto;
    animation: bannerSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.banner-border-container::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
    background: var(--color-surface);
    border-radius: 12px;
    z-index: 0;
}

@keyframes bannerSlideIn {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

/* Ensure close button is positioned relative to border container */
.banner-border-container .banner-close-btn {
    position: absolute !important;
    top: 12px !important;
    right: 12px !important;
    z-index: 10001 !important;
}

/* Style only the content wrapper, not the overlay itself */
:deep(.banner-popup-dialog) {
    box-shadow: none;
    background: transparent;
    padding: 0;
}

/* Only style the overlay content that has our specific class */
:deep(.v-overlay__content.banner-popup-dialog) {
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: auto !important;
    max-width: 1200px !important;
    width: auto !important;
}

/* Mobile overlay adjustments */
@media (max-width: 640px) {
    :deep(.v-overlay__content.banner-popup-dialog) {
        max-width: 100% !important;
        width: 100% !important;
        height: 100% !important;
    }
}

.banner-container {
    position: relative;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    background: transparent;
    border-radius: 12px;
    overflow: hidden;
    z-index: 1;
    color: var(--color-text);
}

.banner-close-btn {
    position: absolute !important;
    z-index: 10001 !important;
    background: var(--color-surface-alt) !important;
    backdrop-filter: blur(8px);
    pointer-events: auto !important;
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
    border: 2px solid var(--color-border) !important;
    border-radius: 50% !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.15),
        0 2px 4px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    touch-action: manipulation !important;
    -webkit-tap-highlight-color: transparent !important;
}

.banner-close-btn:hover {
    background: var(--color-surface) !important;
    border-color: var(--color-border-strong) !important;
    transform: scale(1.15) rotate(90deg);
    box-shadow:
        0 6px 20px rgba(0, 0, 0, 0.2),
        0 4px 8px rgba(0, 0, 0, 0.15) !important;
}

.banner-close-btn:active {
    transform: scale(1.05) rotate(90deg);
    background: var(--color-surface-alt) !important;
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.15),
        inset 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.banner-close-btn:focus {
    outline: 3px solid var(--color-primary) !important;
    outline-offset: 2px !important;
}

.banner-close-btn :deep(.v-icon) {
    color: var(--color-text-secondary) !important;
}

.banner-close-btn:hover :deep(.v-icon) {
    color: var(--color-text) !important;
}

.banner-wrapper {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    z-index: 2;
}

/* Desktop Banner Image - Proper dimensions */
.banner-image {
    width: auto;
    max-width: 600px;
    max-height: 600px;
    height: auto;
    object-fit: contain;
    display: block;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    margin: 0 auto;
    transition: transform 0.3s ease;
}

.banner-wrapper:hover .banner-image {
    transform: scale(1.02);
}

/* Ensure images maintain aspect ratio */
.banner-image[src] {
    aspect-ratio: auto;
}

/* Mobile Banner Image - Proper dimensions */
@media (max-width: 640px) {
    .banner-border-container {
        border-radius: 12px;
        padding: 6px;
        margin: 1rem;
        max-width: calc(100% - 2rem);
    }

    .banner-container {
        padding: 0.25rem;
        min-height: 200px;
        width: 100%;
        max-width: 100%;
        border-radius: 8px;
    }

    .banner-wrapper {
        width: 100%;
        max-width: 100%;
        padding: 0;
    }

    .banner-image {
        width: 100%;
        max-width: 600px;
        max-height: 600px;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        object-fit: contain;
        display: block;
    }

    .banner-close-btn {
        top: 10px !important;
        right: 10px !important;
        min-width: 40px !important;
        width: 40px !important;
        height: 40px !important;
    }

    .banner-close-btn :deep(.v-icon) {
        font-size: 22px !important;
    }
}

/* Tablet view - Medium screens */
@media (min-width: 641px) and (max-width: 1024px) {
    .banner-border-container {
        padding: 7px;
        border-radius: 14px;
    }

    .banner-image {
        max-width: 600px;
        max-height: 600px;
    }

    .banner-container {
        padding: 0.75rem;
    }
}
</style>

<style>
/* Global styles for banner popup - only apply when the overlay is active */
.v-overlay--active .v-overlay__content.banner-popup-dialog {
    z-index: 9999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    max-width: 1200px !important;
    width: auto !important;
}

.v-overlay--active:has(.banner-popup-dialog) {
    z-index: 9999 !important;
}

.v-overlay--active:has(.banner-popup-dialog) .v-overlay__scrim {
    z-index: 9998 !important;
    background-color: rgba(0, 0, 0, 0.7) !important;
    backdrop-filter: blur(2px) !important;
}

/* Mobile adjustments for overlay */
@media (max-width: 640px) {
    .v-overlay--active .v-overlay__content.banner-popup-dialog {
        max-width: 100% !important;
        width: 100% !important;
        height: 100% !important;
    }
}
</style>
