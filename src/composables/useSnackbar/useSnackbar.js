import { ref, reactive } from 'vue'

// Global snackbar state
const snackbarState = reactive({
  show: false,
  message: '',
  color: 'success',
  timeout: 2000,
  location: 'top',
  icon: null,
  closable: true
})

export const useSnackbar = () => {
  /**
   * Show a snackbar notification
   * @param {string} message - The message to display
   * @param {object} options - Optional configuration
   * @param {string} options.color - Color theme: 'success', 'error', 'warning', 'info'
   * @param {number} options.timeout - Auto-hide timeout in milliseconds
   * @param {string} options.location - Position: 'top', 'bottom', 'top center', etc.
   * @param {string} options.icon - Material Design icon name
   * @param {boolean} options.closable - Whether to show close button
   */
  const showSnackbar = (message, options = {}) => {
    // Hide any existing snackbar first
    snackbarState.show = false
    
    // Small delay to ensure proper state reset
    setTimeout(() => {
      snackbarState.message = message
      snackbarState.color = options.color || 'success'
      snackbarState.timeout = options.timeout || 4000
      snackbarState.location = options.location || 'top'
      snackbarState.icon = options.icon || getDefaultIcon(options.color || 'success')
      snackbarState.closable = options.closable !== false
      snackbarState.show = true
    }, 50)
  }

  /**
   * Show a success snackbar
   * @param {string} message - The success message
   * @param {object} options - Optional configuration
   */
  const showSuccess = (message, options = {}) => {
    showSnackbar(message, {
      color: 'success',
      icon: 'mdi-check-circle',
      ...options
    })
  }

  /**
   * Show an error snackbar
   * @param {string} message - The error message
   * @param {object} options - Optional configuration
   */
  const showError = (message, options = {}) => {
    showSnackbar(message, {
      color: 'error',
      icon: 'mdi-shield-alert',
      timeout: 5000,
      ...options
    })
  }

  /**
   * Show a warning snackbar
   * @param {string} message - The warning message
   * @param {object} options - Optional configuration
   */
  const showWarning = (message, options = {}) => {
    showSnackbar(message, {
      color: 'warning',
      icon: 'mdi-alert',
      timeout: 3000,
      ...options
    })
  }

  /**
   * Show an info snackbar
   * @param {string} message - The info message
   * @param {object} options - Optional configuration
   */
  const showInfo = (message, options = {}) => {
    showSnackbar(message, {
      color: 'info',
      icon: 'mdi-information',
      ...options
    })
  }

  /**
   * Hide the current snackbar
   */
  const hideSnackbar = () => {
    snackbarState.show = false
  }

  /**
   * Get default icon for a color theme
   * @param {string} color - The color theme
   * @returns {string} - The icon name
   */
  const getDefaultIcon = (color) => {
    const iconMap = {
      success: 'mdi-check-circle',
      error: 'mdi-alert-circle',
      warning: 'mdi-alert',
      info: 'mdi-information'
    }
    return iconMap[color] || 'mdi-information'
  }

  return {
    // State
    snackbarState,
    
    // Methods
    showSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideSnackbar
  }
}
