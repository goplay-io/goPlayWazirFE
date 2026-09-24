<template>
    <div v-if="currentAnnouncement"
        class="announcement-banner-wrapper tw-font-semibold tw-w-full tw-h-8 lg:tw-h-7 tw-flex tw-items-center tw-overflow-hidden tw-relative tw-mt-2 tw-z-20">
        <!-- Mic (fixed zone) -->
        <span
            class="tw-absolute tw-right-1 tw-z-20 tw-text-sm tw-transform tw-scale-x-[-1] tw-w-8 tw-h-full tw-flex tw-items-center tw-justify-center tw-mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="1.3em" height="1.3em" viewBox="0 0 20 20">
                <path fill="currentColor"
                    d="M18.15 5.94c.46 1.62.38 3.22-.02 4.48c-.42 1.28-1.26 2.18-2.3 2.48c-.16.06-.26.06-.4.06c-.06.02-.12.02-.18.02c-.06.02-.14.02-.22.02h-6.8l2.22 5.5c.02.14-.06.26-.14.34c-.08.1-.24.16-.34.16H6.95c-.1 0-.26-.06-.34-.16c-.08-.08-.16-.2-.14-.34l-1-5.5H4.25l-.02-.02c-.5.06-1.08-.18-1.54-.62s-.88-1.08-1.06-1.88c-.24-.8-.2-1.56-.02-2.2c.18-.62.58-1.08 1.06-1.3l.02-.02l9-5.4c.1-.06.18-.1.24-.16q.09-.06.24-.12c.16-.08.28-.12.5-.18c1.04-.3 2.24.1 3.22.98s1.84 2.24 2.26 3.86m-2.58 5.98h-.02c.4-.1.74-.34 1.04-.7c.58-.7.86-1.76.86-3.04c0-.64-.1-1.3-.28-1.98c-.34-1.36-1.02-2.5-1.78-3.24s-1.68-1.1-2.46-.88c-.82.22-1.4.96-1.7 2c-.32 1.04-.28 2.36.06 3.72c.38 1.36 1 2.5 1.8 3.24c.78.74 1.62 1.1 2.48.88m-2.54-7.08c.22-.04.42-.02.62.04c.38.16.76.48 1.02 1s.42 1.2.42 1.78c0 .3-.04.56-.12.8c-.18.48-.44.84-.86.94c-.34.1-.8-.06-1.14-.4s-.64-.86-.78-1.5c-.18-.62-.12-1.24.02-1.72s.48-.84.82-.94" />
            </svg>
        </span>

        <!-- Modern Marquee -->
        <div class="tw-absolute tw-left-0 tw-h-full tw-flex tw-items-center tw-overflow-hidden tw-text-xs tw-italic tw-text-theme-text"
            style="width: calc(100% - 2.5rem);">
            <div v-if="isAnimating" class="marquee-track"
                :key="`${currentAnnouncement}-${marqueeRunKey}`"
                :style="{ animationPlayState: isPaused ? 'paused' : 'running' }"
                @animationend="onAnimationEnd"
                @mouseenter="pause"
                @mouseleave="resume">
                <span class="marquee-item">{{ currentAnnouncement }}</span>
            </div>
        </div>
    </div>

</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings.js'

const settingsStore = useSettingsStore()
const GAP_BETWEEN_ANNOUNCEMENTS_MS = 3000
const nextAnnouncementTimer = ref(null)
const activeAnnouncementIndex = ref(0)
const marqueeRunKey = ref(0)
const isAnimating = ref(false)

const announcements = computed(() => {
    const value = settingsStore.announcement

    if (Array.isArray(value)) {
        return value
            .map((item) => String(item ?? '').trim())
            .filter(Boolean)
    }

    const single = String(value ?? '').trim()
    return single ? [single] : []
})

const currentAnnouncement = computed(() => {
    if (!announcements.value.length) return ''
    const safeIndex = activeAnnouncementIndex.value % announcements.value.length
    return announcements.value[safeIndex] || ''
})

const isPaused = ref(false)

const clearNextAnnouncementTimer = () => {
    if (!nextAnnouncementTimer.value) return
    clearTimeout(nextAnnouncementTimer.value)
    nextAnnouncementTimer.value = null
}

const startCurrentAnnouncement = () => {
    if (!currentAnnouncement.value) {
        isAnimating.value = false
        return
    }

    marqueeRunKey.value += 1
    isAnimating.value = true
}

const queueNextAnnouncement = () => {
    clearNextAnnouncementTimer()

    if (!announcements.value.length) {
        isAnimating.value = false
        return
    }

    nextAnnouncementTimer.value = setTimeout(() => {
        activeAnnouncementIndex.value = (activeAnnouncementIndex.value + 1) % announcements.value.length
        startCurrentAnnouncement()
    }, GAP_BETWEEN_ANNOUNCEMENTS_MS)
}

const onAnimationEnd = () => {
    isAnimating.value = false
    queueNextAnnouncement()
}

const pause = () => (isPaused.value = true)
const resume = () => (isPaused.value = false)

watch(announcements, (list) => {
    clearNextAnnouncementTimer()

    if (!list.length) {
        activeAnnouncementIndex.value = 0
        isAnimating.value = false
        return
    }

    activeAnnouncementIndex.value = 0
    startCurrentAnnouncement()
}, { immediate: true })

onUnmounted(() => {
    clearNextAnnouncementTimer()
})
</script>

<style scoped>
.announcement-banner-wrapper {
    display: block;
    width: 100%;
    flex-shrink: 0;
}

@keyframes marquee-reset {
    0% {
        transform: translateX(100%);
    }

    100% {
        transform: translateX(calc(-100% - 1rem));
    }
}

.marquee-track {
    display: inline-flex;
    align-items: center;
    width: max-content;
    white-space: nowrap;
    animation: marquee-reset 10s linear 1 both;
}

.marquee-item {
    display: inline-block;
}

@media (max-width: 1540px) {
    .announcement-banner-wrapper {
        height: 24px;
    }

    .marquee-track {
        font-size: 11px;
    }
}
</style>