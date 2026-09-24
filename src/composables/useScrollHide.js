import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable for hiding/showing elements based on scroll direction
 * Detects scrolling in all scrollable containers (window, document, and nested elements)
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.hideThreshold - Minimum scroll distance before hiding (default: 50)
 * @param {number} options.showDelay - Delay in ms before showing after scroll stops (default: 150)
 * @returns {Object} Scroll visibility state and control methods
 */
export function useScrollHide(options = {}) {
  const { hideThreshold = 50, showDelay = 150 } = options

  const isVisible = ref(true)
  const lastScrollY = ref(0)
  const scrollTimeout = ref(null)
  const isScrolling = ref(false)

  /**
   * Handles scroll events from any scrollable element
   * @param {Event} event - The scroll event
   */
  const handleScroll = (event) => {
    // Mark that scrolling is happening
    isScrolling.value = true

    // Get scroll position from the event target (could be window, document, or any scrollable element)
    let currentScrollY = 0

    if (event.target === document || event.target === document.documentElement || event.target === window) {
      currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
    } else {
      // For scrollable containers, use their scrollTop
      currentScrollY = event.target.scrollTop || 0
    }

    // Clear existing timeout
    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
    }

    // Check if near the bottom of the page/container (within 50px)
    const isNearBottom = event.target === document || event.target === document.documentElement || event.target === window
      ? window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 50
      : event.target.scrollTop + event.target.clientHeight >= event.target.scrollHeight - 50

    // Hide when scrolling down, show when scrolling up
    // Don't hide when near bottom to prevent show/hide glitch at end of page
    if (!isNearBottom && currentScrollY > lastScrollY.value && currentScrollY > hideThreshold) {
      // Scrolling down - hide
      isVisible.value = false
    } else if (currentScrollY < lastScrollY.value) {
      // Scrolling up - show immediately
      isVisible.value = true
    }

    lastScrollY.value = currentScrollY

    // Show after scrolling stops (with delay)
    scrollTimeout.value = setTimeout(() => {
      isScrolling.value = false
      isVisible.value = true
    }, showDelay)
  }

  /**
   * Manually show the element
   */
  const show = () => {
    isVisible.value = true
  }

  /**
   * Manually hide the element
   */
  const hide = () => {
    isVisible.value = false
  }

  /**
   * Initialize scroll listeners
   */
  const initialize = () => {
    lastScrollY.value = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0

    // Listen to scroll events on document with capture phase to catch all scroll events
    // This will catch scroll events from window, document, and all scrollable containers
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true })

    // Also listen to window scroll as fallback
    window.addEventListener('scroll', handleScroll, { passive: true })
  }

  /**
   * Clean up scroll listeners
   */
  const cleanup = () => {
    document.removeEventListener('scroll', handleScroll, { capture: true })
    window.removeEventListener('scroll', handleScroll)
    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
    }
  }

  // Auto-initialize on mount
  onMounted(() => {
    initialize()
  })

  // Auto-cleanup on unmount
  onUnmounted(() => {
    cleanup()
  })

  return {
    // Refs
    isVisible,
    isScrolling,

    // Methods
    show,
    hide,
    initialize,
    cleanup
  }
}













