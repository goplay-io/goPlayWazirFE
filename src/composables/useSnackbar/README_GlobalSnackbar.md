# Unified Snackbar Component

A centralized snackbar system for displaying notifications throughout the application.

## Overview

The unified snackbar system consists of:
- `GlobalSnackbar.vue` - The global snackbar component
- `useSnackbar.js` - Composable for managing snackbar state and methods
- Integration in `Layout.vue` for global availability

## Usage

Import the composable in any component:

```javascript
import { useSnackbar } from '@/composables/useSnackbar'

export default {
  setup() {
    const { showSuccess, showError, showWarning, showInfo, showSnackbar } = useSnackbar()
    
    // Use the convenience methods
    const handleSuccess = () => {
      showSuccess('Operation completed successfully!')
    }
    
    const handleError = () => {
      showError('Something went wrong!')
    }
    
    const handleWarning = () => {
      showWarning('Please check your input')
    }
    
    const handleInfo = () => {
      showInfo('Here is some information')
    }
    
    // Or use the flexible showSnackbar method
    const handleCustom = () => {
      showSnackbar('Custom message', {
        color: 'purple',
        timeout: 8000,
        icon: 'mdi-star',
        location: 'bottom'
      })
    }
    
    return {
      handleSuccess,
      handleError,
      handleWarning,
      handleInfo,
      handleCustom
    }
  }
}
```

## API Reference

### Convenience Methods

#### `showSuccess(message, options)`
Shows a success snackbar with green color and check icon.

#### `showError(message, options)`
Shows an error snackbar with red color and alert icon.

#### `showWarning(message, options)`  
Shows a warning snackbar with orange color and warning icon.

#### `showInfo(message, options)`
Shows an info snackbar with blue color and info icon.

### Main Method

#### `showSnackbar(message, options)`
Shows a customizable snackbar.

**Parameters:**
- `message` (string) - The message to display
- `options` (object) - Configuration options:
  - `color` (string) - Color theme: 'success', 'error', 'warning', 'info', or any Vuetify color
  - `timeout` (number) - Auto-hide timeout in milliseconds (default: 4000)
  - `location` (string) - Position: 'top', 'bottom', 'top center', etc. (default: 'top')
  - `icon` (string) - Material Design icon name
  - `closable` (boolean) - Whether to show close button (default: true)

### Other Methods

#### `hideSnackbar()`
Manually hide the current snackbar.

## Examples

### Basic Usage
```javascript
// Success notification
showSuccess('Data saved successfully!')

// Error notification
showError('Failed to save data')

// Warning notification
showWarning('Please fill all required fields')

// Info notification
showInfo('Click here to learn more')
```

### Advanced Usage
```javascript
// Custom timeout
showError('Connection failed', { timeout: 10000 })

// Custom position
showSuccess('Profile updated', { location: 'bottom' })

// Custom icon
showInfo('New feature available', { icon: 'mdi-new-box' })

// Non-closable snackbar
showWarning('System maintenance in progress', { 
  closable: false, 
  timeout: 0 // Never auto-hide
})

// Fully custom
showSnackbar('Custom notification', {
  color: 'purple',
  icon: 'mdi-star',
  timeout: 8000,
  location: 'top center'
})
```

## Migration from Local Snackbars

To migrate existing components that use local snackbars:

1. Remove local snackbar state variables
2. Remove local snackbar components from template
3. Import and use the `useSnackbar` composable
4. Replace local snackbar calls with the unified methods

### Before:
```javascript
const showSuccessSnackbar = ref(false)
const showErrorSnackbar = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const handleSuccess = () => {
  successMessage.value = 'Success!'
  showSuccessSnackbar.value = true
}
```

### After:
```javascript
import { useSnackbar } from '@/composables/useSnackbar'

const { showSuccess } = useSnackbar()

const handleSuccess = () => {
  showSuccess('Success!')
}
```

## Features

- ✅ Global state management
- ✅ Multiple notification types (success, error, warning, info)
- ✅ Customizable appearance and behavior
- ✅ Automatic icon selection
- ✅ Flexible positioning
- ✅ Configurable timeouts
- ✅ Optional close button
- ✅ Consistent styling across the app
- ✅ Easy migration from existing implementations

## Styling

The component uses Vuetify's theming system and inherits the app's theme colors. Custom styling can be applied through the component's scoped styles or by modifying the global theme configuration.
