// composables/useDragScroll.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useDragScroll(containerRef, options = {}) {
  const { disableTouch = false } = options
  
  const isDragging = ref(false)
  const isPointerDown = ref(false)
  const startX = ref(0)
  const scrollLeft = ref(0)
  const hasMoved = ref(false)

  // Check if device is mobile/touch device
  const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  const handleStart = (e) => {
    if (!containerRef.value) return
    
    // Skip touch events on mobile if disableTouch is true
    if (disableTouch && e.type.includes('touch') && isTouchDevice()) return

    isPointerDown.value = true
    isDragging.value = false
    hasMoved.value = false

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
    startX.value = clientX - containerRef.value.offsetLeft
    scrollLeft.value = containerRef.value.scrollLeft

    // Set initial cursor; only switch to grabbing after threshold
    containerRef.value.style.cursor = 'grab'
  }

  const handleMove = (e) => {
    if (!containerRef.value || !isPointerDown.value) return
    
    // Skip touch events on mobile if disableTouch is true
    if (disableTouch && e.type.includes('touch') && isTouchDevice()) return

    e.preventDefault()

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
    const x = clientX - containerRef.value.offsetLeft
    const walk = (x - startX.value) * 1.5 // Optimal scroll speed

    // Only enter dragging mode once movement exceeds a small threshold
    if (!isDragging.value && Math.abs(walk) > 5) {
      isDragging.value = true
      hasMoved.value = true
      containerRef.value.style.cursor = 'grabbing'
      containerRef.value.style.userSelect = 'none'
      document.body.style.userSelect = 'none'
    }

    if (!isDragging.value) return

    containerRef.value.scrollLeft = scrollLeft.value - walk

    // Already dragging; ensure flag stays true
    hasMoved.value = true
  }

  const handleEnd = (e) => {
    if (!containerRef.value) return
    const didDrag = hasMoved.value
    isPointerDown.value = false
    isDragging.value = false
    containerRef.value.style.cursor = 'grab'
    containerRef.value.style.userSelect = ''
    document.body.style.userSelect = ''

    // Defer clearing hasMoved until after the click event dispatch
    if (didDrag) {
      requestAnimationFrame(() => {
        hasMoved.value = false
      })
    } else {
      hasMoved.value = false
    }
  }

  // Prevent clicks on nav items when dragging
  const handleClick = (e) => {
    if (hasMoved.value) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }

  onMounted(() => {
    if (!containerRef.value) return

    const container = containerRef.value

    // Mouse events
    container.addEventListener('mousedown', handleStart)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleEnd)

    // Touch events for mobile
    container.addEventListener('touchstart', handleStart, { passive: false })
    document.addEventListener('touchmove', handleMove, { passive: false })
    document.addEventListener('touchend', handleEnd)

    // Prevent clicks when dragging
    container.addEventListener('click', handleClick, true)

    // Set initial cursor
    container.style.cursor = 'grab'
    container.style.scrollBehavior = 'auto'
  })

  onUnmounted(() => {
    if (!containerRef.value) return

    const container = containerRef.value

    // Cleanup all event listeners
    container.removeEventListener('mousedown', handleStart)
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleEnd)
    container.removeEventListener('touchstart', handleStart)
    document.removeEventListener('touchmove', handleMove)
    document.removeEventListener('touchend', handleEnd)
    container.removeEventListener('click', handleClick, true)
  })

  return {
    isDragging,
    hasMoved
  }
}