<template>
    <div class="tw-relative tw-inline-block">
        <v-btn @click="themeStore.toggleTheme()" variant="outlined" icon rounded="xl"
            class="theme-toggle-btn tw-rounded-full tw-border-2 tw-transition-all tw-duration-300 tw-shadow-md hover:tw-shadow-lg"
            size="x-small">            <div class="icon-container">
                <v-icon 
                    class="icon sun-icon" 
                    :class="{ 'active': themeStore.isDark }"
                    size="16">
                    mdi-weather-sunny
                </v-icon>
                <v-icon 
                    class="icon moon-icon" 
                    :class="{ 'active': !themeStore.isDark }"
                    size="16">
                    mdi-weather-night
                </v-icon>
            </div>
        </v-btn>
    </div>
</template>

<script setup>
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<style scoped>
.theme-toggle-btn { 
    background-color: var(--color-surface) !important;
    border-color: var(--color-border) !important;
    color: var(--color-text-secondary) !important;
    transition: all 0.3s ease !important;
    border-radius: 50% !important;
    width: 32px !important;
    height: 32px !important;
    min-width: 32px !important;
}

.theme-toggle-btn:hover {
    background-color: var(--color-surface-alt) !important;
    border-color: var(--color-border) !important;
    transform: scale(1.05);
}

.theme-toggle-btn:active {
    transform: scale(0.95);
}

/* Icon color adjustments for better visibility */
.theme-toggle-btn .v-icon {
    transition: color 0.3s ease;
}

/* Remove button overlay during transitions */
.theme-toggle-btn .v-btn__overlay {
    opacity: 0 !important;
}

/* Icon container for transition effects */
.icon-container {
    position: relative;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

/* Base icon styles with transition */
.icon {
    position: absolute;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
    opacity: 0;
    transform: rotate(-180deg) scale(0.5);
}

/* Active icon styles */
.icon.active {
    opacity: 1 !important;
    transform: rotate(0deg) scale(1) !important;
}

/* Specific color and animation overrides */
.sun-icon.active {
    color: #facc15 !important; /* yellow-400 */
    transform: rotate(360deg) scale(1) !important;
}

.moon-icon.active {
    color: #2563eb !important; /* blue-600 */
    transform: rotate(0deg) scale(1) !important;
}

/* Non-active states */
.sun-icon:not(.active) {
    transform: rotate(-180deg) scale(0.3) !important;
}

.moon-icon:not(.active) {
    transform: rotate(180deg) scale(0.3) !important;
}

/* Dark theme specific styling */




/* Light theme specific styling */
.theme-toggle-btn:hover {
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}
</style>
