import { defineStore } from 'pinia'

export const useWalletStore = defineStore('wallet', {
    state: () => ({
        balance: sessionStorage.getItem('balance') || '0',
        exposure: sessionStorage.getItem('exposure') || '0',
        cashable: sessionStorage.getItem('cashable') || '0',
        bonus: sessionStorage.getItem('bonus') || '0',
        isWalletBlocked: false,
    }),

    getters: {
        currencyConfig: () => {
            const currency = import.meta.env.VITE_CURRENCY || 'INR'

            const locale =
                currency === 'INR' ? 'en-IN' :
                currency === 'USD' ? 'en-US' :
                currency === 'EUR' ? 'en-IE' :
                currency === 'GBP' ? 'en-GB' :
                'en-US'

            return { currency, locale }
        },

        numberFormatter() {
            return new Intl.NumberFormat(this.currencyConfig.locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
        },

        currencySymbol() {
            return ''
        },

        availableBalance: (state) => {
            return parseFloat(state.balance || 0) +
                   parseFloat(state.cashable || 0)
        },

        walletAmountFormatter() {
            return new Intl.NumberFormat(this.currencyConfig.locale, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            })
        },

        formattedBalance() {
            const total =
                parseFloat(this.balance || 0) +
                parseFloat(this.cashable || 0)

            return this.walletAmountFormatter.format(total)
        },

        formattedExposure() {
            return this.walletAmountFormatter.format(parseFloat(this.exposure || 0))
        },

        formattedBonus() {
            return this.numberFormatter.format(parseFloat(this.bonus || 0))
        },

        formattedAvailableBalance() {
            return this.numberFormatter.format(this.availableBalance)
        }
    },

    actions: {
        updateWallet({ balance, exposure, cashable, bonus, is_wallet_blocked }) {
            if (balance !== undefined && balance !== null) {
                this.balance = balance.toString()
                sessionStorage.setItem('balance', this.balance)
            }

            if (exposure !== undefined && exposure !== null) {
                this.exposure = exposure.toString()
                sessionStorage.setItem('exposure', this.exposure)
            }

            if (cashable !== undefined && cashable !== null) {
                this.cashable = cashable.toString()
                sessionStorage.setItem('cashable', this.cashable)
            }

            if (bonus !== undefined && bonus !== null) {
                this.bonus = bonus.toString()
                sessionStorage.setItem('bonus', this.bonus)
            }

            if (is_wallet_blocked !== undefined && is_wallet_blocked !== null) {
                this.isWalletBlocked = is_wallet_blocked === true ||
                    is_wallet_blocked === 1 ||
                    is_wallet_blocked === '1' ||
                    is_wallet_blocked === 'true'
            }

            this.updateBalanceElements()
            this.updateExposureElements()
        },

        updateBalance(balance) {
            this.updateWallet({ balance })
        },

        updateExposure(exposure) {
            this.updateWallet({ exposure })
        },

        updateCashable(cashable) {
            this.updateWallet({ cashable })
        },

        updateBonus(bonus) {
            this.updateWallet({ bonus })
        },

        updateBalanceElements() {
            document.querySelectorAll('._balance').forEach(el => {
                el.textContent = this.formattedBalance
            })
        },

        updateExposureElements() {
            document.querySelectorAll('._exposure').forEach(el => {
                el.textContent = this.formattedExposure
            })
        },

        clearWallet() {
            this.balance = '0'
            this.exposure = '0'
            this.cashable = '0'
            this.bonus = '0'
            this.isWalletBlocked = false

            sessionStorage.removeItem('balance')
            sessionStorage.removeItem('exposure')
            sessionStorage.removeItem('cashable')
            sessionStorage.removeItem('bonus')

            this.updateBalanceElements()
            this.updateExposureElements()
        }
    }
})
