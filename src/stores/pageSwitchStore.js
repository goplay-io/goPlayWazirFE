import { defineStore } from 'pinia'

export const usePageSwitchStore = defineStore('pageSwitch', {
    state: () => ({
        loading: false
    }),
    actions: {
        setLoading(value) {
            this.loading = value
        },
        startLoading() {
            this.loading = true
        },
        stopLoading() {
            this.loading = false
        }
    }
})
 