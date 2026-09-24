import { ref, nextTick } from 'vue';

/**
 * Composable for handling horizontal scroll functionality with navigation buttons
 * @param {Object} options - Configuration options
 * @param {Object} options.scrollContainer - The ref to the scrollable container element
 * @param {number} options.scrollStep - The amount to scroll by (default: 384)
 * @param {number} options.initDelay - Delay before initializing scroll buttons (default: 100)
 * @returns {Object} Scroll functionality and state
 */
export function useScrollButtons(options = {}) {
  const { scrollContainer, scrollStep = 384, initDelay = 100 } = options;
  
  if (!scrollContainer) {
    throw new Error('useScrollButtons: scrollContainer ref is required');
  }
  
  const canScrollLeft = ref(false);
  const canScrollRight = ref(false);

  /**
   * Updates the state of scroll buttons based on current scroll position
   */
  const updateScrollButtons = () => {
    if (scrollContainer.value) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value;
      canScrollLeft.value = scrollLeft > 0;
      canScrollRight.value = scrollLeft < scrollWidth - clientWidth;
    }
  };

  /**
   * Scrolls the container to the left by the specified step
   */
  const scrollLeft = () => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollBy({
        left: -scrollStep,
        behavior: 'smooth'
      });
    }
  };

  /**
   * Scrolls the container to the right by the specified step
   */
  const scrollRight = () => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollBy({
        left: scrollStep,
        behavior: 'smooth'
      });
    }
  };

  /**
   * Initializes scroll button states after component is mounted
   */
  const initializeScrollButtons = () => {
    setTimeout(() => {
      updateScrollButtons();
    }, initDelay);
  };

  /**
   * Updates scroll buttons after content changes
   */
  const refreshScrollButtons = () => {
    nextTick(() => {
      updateScrollButtons();
    });
  };

  return {
    // Refs
    canScrollLeft,
    canScrollRight,
    
    // Methods
    updateScrollButtons,
    scrollLeft,
    scrollRight,
    initializeScrollButtons,
    refreshScrollButtons
  };
}
