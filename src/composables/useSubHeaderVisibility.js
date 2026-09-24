import { computed } from 'vue'
import { useRoute } from 'vue-router'

/** Inner scroll row min-height (reference: min-h-[38px]). */
export const SUB_HEADER_STRIP_PX = 38

export const SUB_HEADER_TOTAL_PX = SUB_HEADER_STRIP_PX

/**
 * Match React Header: hide subheader on casino game routes and deep event paths.
 */
export function useSubHeaderVisibility() {
  const route = useRoute()

  const isCasinoGameRoute = computed(() => {
    const path = route.path
    return path === '/casino/game' || path.startsWith('/casino/game/')
      || path.includes('/dc/gamev1.1/')
  })

  const shouldShowSubHeader = computed(() => {
    if (isCasinoGameRoute.value) return false
    const segments = route.path.split('/').filter(Boolean)
    return segments.length < 5
  })

  return {
    isCasinoGameRoute,
    shouldShowSubHeader,
  }
}
