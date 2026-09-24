import { ref, nextTick, onMounted, onUnmounted } from 'vue';

/**
 * Composable for managing masonry layout with two columns
 * Positions cards using absolute positioning based on their heights
 */
export function useMasonryLayout() {
  const gridContainer = ref(null);
  
  let isCalculating = false;
  let isAnimating = false;
  let resizeTimeout = null;
  let mutationObserver = null;
  let layoutTimeout = null;
  let observerEnabled = true;

  const isDesktopMasonry = () => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 768;
  };

  // Cache of last computed positions to avoid redundant reflows
  let cachedHeights = [];
  let cachedContainerWidth = 0;

  const calculateMasonryLayout = () => {
    if (!gridContainer.value || isCalculating || isAnimating) return;
    isCalculating = true;
    
    // Temporarily disable observer during calculation to prevent feedback loop
    observerEnabled = false;

    nextTick(() => {
      requestAnimationFrame(() => {
        const cards = Array.from(gridContainer.value.querySelectorAll('.fancy-card-item'));
        if (cards.length === 0) {
          isCalculating = false;
          observerEnabled = true;
          return;
        }

        if (!isDesktopMasonry()) {
          // Reset to flow layout on mobile
          cards.forEach(card => {
            card.style.removeProperty('top');
            card.style.removeProperty('left');
            card.style.removeProperty('right');
            card.style.removeProperty('position');
            card.style.removeProperty('width');
          });
          gridContainer.value.style.height = 'auto';
          cachedHeights = [];
          cachedContainerWidth = 0;
          isCalculating = false;
          observerEnabled = true;
          return;
        }

        // Measure heights WITHOUT stripping styles (cards keep absolute position so no reflow blink)
        // Read offsetHeight directly — works even when position:absolute
        const containerWidth = gridContainer.value.offsetWidth;
        const currentHeights = cards.map(card => card.offsetHeight);

        // If nothing changed, skip re-layout entirely
        const heightsUnchanged = cachedContainerWidth === containerWidth &&
          cachedHeights.length === currentHeights.length &&
          currentHeights.every((h, i) => h === cachedHeights[i]);

        if (heightsUnchanged) {
          isCalculating = false;
          setTimeout(() => { observerEnabled = true; }, 100);
          return;
        }

        // Heights changed — update cache and recompute positions
        cachedHeights = currentHeights;
        cachedContainerWidth = containerWidth;

        const COLUMN_GAP = 8;
        const VERTICAL_GAP = 8;
        const columnWidth = (containerWidth - COLUMN_GAP) / 2;
        const leftColumnLeft = 0;
        const rightColumnLeft = columnWidth + COLUMN_GAP;

        let leftColumnHeight = 0;
        let rightColumnHeight = 0;

        cards.forEach((card, index) => {
          const column = index % 2;
          const cardHeight = currentHeights[index];
          const moreInThisColumn = index + 2 < cards.length;

          card.style.position = 'absolute';
          card.style.width = `${columnWidth}px`;

          if (column === 0) {
            card.style.left = `${leftColumnLeft}px`;
            card.style.top = `${leftColumnHeight}px`;
            leftColumnHeight += cardHeight + (moreInThisColumn ? VERTICAL_GAP : 0);
          } else {
            card.style.left = `${rightColumnLeft}px`;
            card.style.top = `${rightColumnHeight}px`;
            rightColumnHeight += cardHeight + (moreInThisColumn ? VERTICAL_GAP : 0);
          }
        });

        const maxHeight = Math.max(leftColumnHeight, rightColumnHeight);
        gridContainer.value.style.height = `${maxHeight}px`;

        isCalculating = false;
        setTimeout(() => {
          observerEnabled = true;
        }, 100);
      });
    });
  };

  const setupResizeObserver = () => {
    if (!gridContainer.value) return;

    let lastHeights = new Map();

    // Use ResizeObserver to watch for actual size changes (more efficient than MutationObserver)
    const resizeObserver = new ResizeObserver((entries) => {
      // Don't trigger if observer is disabled or calculation is in progress
      if (!observerEnabled || isCalculating || isAnimating) return;

      // Check if there's a meaningful size change
      let hasSignificantChange = false;

      entries.forEach(entry => {
        const card = entry.target;
        const currentHeight = entry.contentRect.height;
        const lastHeight = lastHeights.get(card) || 0;

        // Only trigger if height changed by more than 5px (to avoid minor fluctuations)
        if (Math.abs(currentHeight - lastHeight) > 5) {
          hasSignificantChange = true;
          lastHeights.set(card, currentHeight);
        }
      });

      if (hasSignificantChange) {
        // Set animation flag to prevent recalculation during animation
        isAnimating = true;

        // Clear any pending timeouts
        if (layoutTimeout) clearTimeout(layoutTimeout);

        // Debounce the recalculation to wait for expand/collapse animation
        layoutTimeout = setTimeout(() => {
          isAnimating = false;
          // Only recalculate if not already calculating and observer is enabled
          if (!isCalculating && observerEnabled) {
            calculateMasonryLayout();
          }
        }, 500); // Wait for v-expand-transition animation (300ms) + buffer to complete
      }
    });

    // Observe all cards for size changes
    const cards = gridContainer.value.querySelectorAll('.fancy-card-item');
    cards.forEach(card => {
      // Initialize height tracking
      lastHeights.set(card, card.offsetHeight);
      resizeObserver.observe(card);
    });

    mutationObserver = resizeObserver;
  };

  const setupResizeListener = () => {
    window.addEventListener('resize', () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        calculateMasonryLayout();
      }, 100);
    });
  };

  const cleanup = () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    if (layoutTimeout) clearTimeout(layoutTimeout);
    if (mutationObserver) {
      mutationObserver.disconnect();
    }
  };

  // Initialize on mount
  onMounted(() => {
    calculateMasonryLayout();
    setupResizeListener();
    
    nextTick(() => {
      setupResizeObserver();
    });
  });

  // Cleanup on unmount
  onUnmounted(() => {
    cleanup();
  });

  return {
    gridContainer,
    calculateMasonryLayout
  };
}
