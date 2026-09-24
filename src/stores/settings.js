import { defineStore } from 'pinia'
import { getClientSettings } from '../api/user/settings.js'

/** Shared in-flight promise so concurrent callers hit /settings/client once. */
let _settingsInFlight = null

const normalizeAnnouncements = (value) => {
    if (Array.isArray(value)) {
        return value.filter((item) => typeof item === 'string' && item.trim() !== '')
    }

    if (typeof value === 'string') {
        const trimmedValue = value.trim()
        if (!trimmedValue) {
            return []
        }

        try {
            const parsed = JSON.parse(trimmedValue)
            if (Array.isArray(parsed)) {
                return parsed.filter((item) => typeof item === 'string' && item.trim() !== '')
            }
        } catch (error) {
            // Fallback for old plain text values.
        }

        return [trimmedValue]
    }

    return []
}

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        settings: null,
        loading: false,
        error: null
    }),

    getters: {
        logo: (state) => state.settings?.logo || null,
        announcement: (state) => normalizeAnnouncements(state.settings?.announcement),
        upcomingEvent: (state) => state.settings?.upcoming_event || null,
        whatsappChannel: (state) => state.settings?.whatsapp_channel || null,
        telegramChannel: (state) => state.settings?.telegram_channel || null,
    },

    actions: {
        async fetchSettings(force = false) {
            if (this.settings && !force) {
                return this.settings
            }

            if (_settingsInFlight) {
                return _settingsInFlight
            }

            this.loading = true
            this.error = null

            _settingsInFlight = (async () => {
                try {
                    const response = await getClientSettings()

                    let settingsData = response

                    if (response?.data && typeof response.data === 'object') {
                        settingsData = response.data.settings || response.data
                    }

                    this.settings = settingsData
                    return settingsData
                } catch (error) {
                    console.error('Failed to fetch settings:', error)
                    this.error = error
                    this.settings = null
                    return null
                } finally {
                    this.loading = false
                    _settingsInFlight = null
                }
            })()

            return _settingsInFlight
        }
    }
})
