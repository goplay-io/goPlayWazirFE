# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Wallet Store Usage

The application uses a centralized wallet store to manage user balance and exposure. Here's how to use it:

### Using the Wallet Composable in Components

```javascript
import { useWallet } from '@/composables/useWallet.js'

export default {
  setup() {
    const { 
      formattedBalance, 
      formattedExposure, 
      formattedAvailableBalance,
      fetchWalletBalance,
      updateFromResponse 
    } = useWallet()

    return {
      formattedBalance,
      formattedExposure,
      formattedAvailableBalance,
      fetchWalletBalance,
      updateFromResponse
    }
  }
}
```

### Direct Store Access

```javascript
import { useWalletStore } from '@/stores/wallet.js'

const walletStore = useWalletStore()

// Update balance and exposure
walletStore.updateWallet(1000, 250)

// Get formatted values
console.log(walletStore.formattedBalance) // "₹1,000"
console.log(walletStore.formattedExposure) // "₹250"
```

### API Integration

The wallet composable provides methods for API integration:

```javascript
import { useWallet } from '@/composables/useWallet.js'

const { fetchWalletBalance, updateFromResponse, depositRequest, withdrawRequest } = useWallet()

// Fetch wallet data from API
await fetchWalletBalance()

// Update wallet from any API response (like bet responses)
updateFromResponse(betResponse)

// Handle deposit/withdraw with automatic wallet refresh
await depositRequest(depositData)
await withdrawRequest(withdrawData)
```

### DOM Elements with Classes

The store also updates DOM elements with the classes `_balance` and `_exposure` for backward compatibility:

```html
<span class="_balance"></span> <!-- Automatically updated -->
<span class="_exposure"></span> <!-- Automatically updated -->
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://127.0.0.1:3000

# Currency Configuration
VITE_CURRENCY=INR
```

### Supported Currencies
- `INR` - Indian Rupee (₹)
- `USD` - US Dollar ($)
- `EUR` - Euro (€)
- `GBP` - British Pound (£)
