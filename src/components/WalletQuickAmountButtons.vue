<template>
    <div class="tw-grid tw-grid-cols-3 tw-gap-3">
        <v-btn v-for="amount in quickAmounts" :key="amount" @click="$emit('select', amount)" variant="flat"
            size="default" :disabled="isDisabled(amount)" border="lightgreen"
            class="quick-amount-btn tw-text-sm tw-py-3 tw-px-4 tw-h-auto tw-min-h-[48px]"
            rounded="pill"
            :color="buttonColor(amount)">
            {{ amount.toLocaleString() }}
        </v-btn>
    </div>

</template>

<script setup>
import { computed } from 'vue'
import { useWallet } from '@/composables/useWallet.js'

const props = defineProps({
    submitting: { type: Boolean, default: false },
    disableUsingAvailable: { type: Boolean, default: false }
})

defineEmits(['select'])

const { balance } = useWallet()

const quickAmounts = [100, 500, 1000, 5000, 10000, 50000]

const isDisabled = (amount) => {
    if (props.submitting) return true
    if (props.disableUsingAvailable) {
        const currentBalance = parseFloat(balance.value)
        if (Number.isFinite(currentBalance)) {
            return amount > currentBalance
        }
        return true
    }
    return false
}

const buttonColor = (amount) => {
    return isDisabled(amount) ? 'dark' : 'background'
}
</script>

<style scoped>
.quick-amount-btn:not(.v-btn--disabled):hover {
    background-color: rgb(var(--v-theme-primary)) !important;
    color: #ffffff !important;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2) !important;
}
</style>
