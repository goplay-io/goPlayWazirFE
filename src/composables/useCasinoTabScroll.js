import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

export function useCasinoTabScroll(trackRef, watchSources = []) {
  const canScrollPrev = ref(false)
  const canScrollNext = ref(false)

  function updateScrollState() {
    const el = trackRef.value
    if (!el) {
      canScrollPrev.value = false
      canScrollNext.value = false
      return
    }

    const maxScroll = el.scrollWidth - el.clientWidth
    canScrollPrev.value = el.scrollLeft > 1
    canScrollNext.value = maxScroll > 1 && el.scrollLeft < maxScroll - 1
  }

  function scrollPrev() {
    trackRef.value?.scrollBy({ left: -220, behavior: 'smooth' })
  }

  function scrollNext() {
    trackRef.value?.scrollBy({ left: 220, behavior: 'smooth' })
  }

  let resizeObserver

  onMounted(async () => {
    await nextTick()
    updateScrollState()
    window.addEventListener('resize', updateScrollState, { passive: true })

    if (trackRef.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateScrollState)
      resizeObserver.observe(trackRef.value)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateScrollState)
    resizeObserver?.disconnect()
  })

  if (watchSources.length) {
    watch(watchSources, async () => {
      await nextTick()
      updateScrollState()
    }, { deep: true })
  }

  return {
    canScrollPrev,
    canScrollNext,
    updateScrollState,
    scrollPrev,
    scrollNext,
  }
}
