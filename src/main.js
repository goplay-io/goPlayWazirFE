import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'



// Vuetify – components/directives are auto-imported by vite-plugin-vuetify (tree-shaken)
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'

// Tailwind
import './assets/main.css'
import './assets/sports-bet-desktop-typography.css'
import './assets/sports-bet-mobile-typography.css'
import './assets/sports-bet-odds-cells.css'
import './assets/sports-bet-slip-form.css'
import './assets/theme.css'
import './assets/sport-table-header.css'
import './assets/account-page.css'
import './assets/info-page.css'
import './assets/wallet-dialog.css'
import './assets/mobile-header.css'
import './assets/market-header.css'

import i18n from './plugins/i18n'

const vuetify = createVuetify({
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                dark: false,
                colors: {
                    primary: '#000000',
                    secondary: '#1a1a1a',
                    surface: '#212121',
                    background: '#121212',
                    error: '#dc2626',
                    warning: '#f59e0b',
                    success: '#16a34a',
                    info: '#4154f1',
                    back: '#8dd9ff',
                    lay: '#ff94bc',
                    'on-primary': '#ffffff',
                    'on-secondary': '#ffffff',
                    'on-surface': '#ffffff',
                    'on-background': '#444444',
                    'on-error': '#ffffff',
                    'on-back': '#000000',
                    'on-lay': '#000000',
                    'surface-variant': '#1e1e1e',
                    'on-surface-variant': '#919191',
                    outline: '#333333',
                    'outline-variant': '#4c4c4c',
                }
            }
        }
    }
})

const app = createApp(App)
const pinia = createPinia()

// i18n initialized in src/plugins/i18n.js

app.use(pinia)
app.use(router)
app.use(vuetify)
app.use(i18n)

import { useAuthStore } from './stores/auth.js'
import { useSettingsStore } from './stores/settings.js'
import { useWallet } from './composables/useWallet.js'

const authStore = useAuthStore(pinia)
const settingsStore = useSettingsStore(pinia)

// Same bootstrap as goPlayClientFE / FairplayFE: optimistic session when user is in localStorage;
// server restore still runs and can clear invalid sessions.
const authInitialization = authStore.initializeAuth()
const authReady = Promise.resolve(authInitialization).catch((error) => {
    console.error('Auth initialization failed:', error)
})
if (authStore.user && !authStore.hasValidatedSession) {
    authStore.hasValidatedSession = true
}

async function mountApp() {
    if (!authStore.user) {
        try {
            await authInitialization
        } catch (error) {
            console.error('Auth initialization failed:', error)
        }
    }

    app.mount('#app')
}

void mountApp()

authReady
    .then(() => {
        console.log('Auth initialization completed')

        try {
            const { initializeWallet } = useWallet()
            initializeWallet().catch((error) => {
                console.error('Failed to initialize wallet on app load:', error)
            })
        } catch (e) {
            console.error('Failed to setup wallet initialization on app load:', e)
        }
    })
    .catch((error) => {
        console.error('Auth initialization failed:', error)
    })

settingsStore.fetchSettings().catch((error) => {
    console.error('Failed to fetch settings on app load:', error)
})
