import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
    state: () => ({
        currentTheme: 'light'
    }),

    getters: {
        isDark: () => false
    },

    actions: {
        setTheme() {
            this.currentTheme = 'light'
            localStorage.setItem('theme', 'light')
            document.documentElement.setAttribute('data-theme', 'light')
        },

        toggleTheme() {
            // Dark theme removed
        },

        initTheme() {
            localStorage.setItem('theme', 'light')
            document.documentElement.setAttribute('data-theme', 'light')
        }
    }
})