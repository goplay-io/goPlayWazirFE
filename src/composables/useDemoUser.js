import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable for checking if the current user is a demo user
 * @returns {Object} Object with isDemoUser computed property and helper methods
 */
export const useDemoUser = () => {
  const authStore = useAuthStore()

  /**
   * Computed property that checks if the current user is a demo user
   */
  const isDemoUser = computed(() => {
    // Only "preview demo" should be treated as demo-limited.
    // Full demo (clicked from login) behaves like a logged-in user.
    return authStore.isDemoPreview === true
  })

  /**
   * Check if user is demo (non-reactive version for use in functions)
   */
  const checkIsDemoUser = () => {
    return authStore.isDemoPreview === true
  }

  return {
    isDemoUser,
    checkIsDemoUser
  }
}
