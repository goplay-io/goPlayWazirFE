import { ref, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getBanners } from '@/api/user/banner'

const BANNER_LIST_CACHE_KEY = 'banner_list_cache'

export default function useBannerPopup() {
  const route = useRoute()
  const authStore = useAuthStore()
  const showBannerPopup = ref(false)
  const matchedBanners = ref([])
  const bannerQueue = ref([])
  const currentBannerIndex = ref(0)

  const getBannersFromCache = () => {
    try {
      const stored = sessionStorage.getItem(BANNER_LIST_CACHE_KEY)
      if (!stored) return null
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : null
    } catch (e) {
      return null
    }
  }

  const setBannersCache = (banners) => {
    if (banners && Array.isArray(banners)) {
      sessionStorage.setItem(BANNER_LIST_CACHE_KEY, JSON.stringify(banners))
    }
  }

  const getCurrentUserId = () => {
    // Use user ID if logged in, otherwise use 'guest' for anonymous users
    return authStore.user?.id || 'guest'
  }

  // Get all shown banner IDs for current user
  const getShownBannerIds = () => {
    const userId = getCurrentUserId()
    const shownKey = `banner_shown_${userId}`
    const stored = sessionStorage.getItem(shownKey)
    if (!stored) return []
    try {
      return JSON.parse(stored)
    } catch (e) {
      return []
    }
  }

  // Check if banner has been shown for current user
  const hasBannerBeenShown = (bannerId) => {
    const shownIds = getShownBannerIds()
    return shownIds.includes(bannerId)
  }

  // Mark banners as shown for current user (accepts single ID or array of IDs)
  const markBannersAsShown = (bannerIds) => {
    const userId = getCurrentUserId()
    const shownKey = `banner_shown_${userId}`
    const currentIds = getShownBannerIds()
    
    // Convert single ID to array if needed
    const idsToAdd = Array.isArray(bannerIds) ? bannerIds : [bannerIds]
    
    // Add new IDs and remove duplicates
    const updatedIds = [...new Set([...currentIds, ...idsToAdd])]
    
    sessionStorage.setItem(shownKey, JSON.stringify(updatedIds))
  }

  // Clear banner session storage for a specific user (or current user if no userId provided)
  const clearBannerSession = (userId = null) => {
    const targetUserId = userId || getCurrentUserId()
    const shownKey = `banner_shown_${targetUserId}`
    sessionStorage.removeItem(shownKey)
  }

  // Normalize path - ensure it starts with /, remove trailing slashes, and handle parameters
  const normalizePath = (path) => {
    if (!path) return ''
    
    // Ensure path starts with /
    let normalized = path.startsWith('/') ? path : `/${path}`
    
    // Remove trailing slash except for root
    normalized = normalized === '/' ? '/' : normalized.replace(/\/$/, '')
    
    return normalized
  }

  // Check if a path matches the current route, handling parameterized routes
  const matchesRoute = (bannerPath, currentPath) => {
    // Normalize both paths
    const normalizedBannerPath = normalizePath(bannerPath)
    const normalizedCurrentPath = normalizePath(currentPath)
    
    // Exact match (no parameters) - highest priority
    if (normalizedBannerPath === normalizedCurrentPath) {
      return true
    }
    
    // Check if banner path contains parameters (e.g., /sports/bet/:event_id)
    // Only match parameterized routes if no exact match exists
    if (normalizedBannerPath.includes(':')) {
      // Replace :param with regex pattern that matches any value
      const pattern = normalizedBannerPath
        .replace(/:[^/]+/g, '[^/]+') // Replace :param with [^/]+ (matches any non-slash characters)
        .replace(/\*/g, '.*') // Replace * with .* (matches any characters)
      
      // Create regex and test against current path
      const regex = new RegExp(`^${pattern}$`)
      return regex.test(normalizedCurrentPath)
    }
    
    return false
  }

  // Check if banner path is exact match (no parameters)
  const isExactMatch = (bannerPath, currentPath) => {
    const normalizedBannerPath = normalizePath(bannerPath)
    const normalizedCurrentPath = normalizePath(currentPath)
    return normalizedBannerPath === normalizedCurrentPath && !normalizedBannerPath.includes(':')
  }

  const showNextBanner = () => {
    if (currentBannerIndex.value < bannerQueue.value.length) {
      matchedBanners.value = [bannerQueue.value[currentBannerIndex.value]]
      showBannerPopup.value = true
    } else {
      // No more banners in queue
      showBannerPopup.value = false
      matchedBanners.value = []
      bannerQueue.value = []
      currentBannerIndex.value = 0
    }
  }

  // Handle banner close - show next banner in queue
  const handleBannerClose = () => {
    // Mark current banner as shown
    if (matchedBanners.value.length > 0 && matchedBanners.value[0]?.id) {
      markBannersAsShown(matchedBanners.value[0].id)
    }
    
    // Move to next banner
    currentBannerIndex.value++
    showNextBanner()
  }

  // Check if route should have banner popup
  const shouldCheckBanners = () => {
    // Always check banners for all routes
    return true
  }

  const checkBannersForRoute = async () => {
    try {
      showBannerPopup.value = false
      matchedBanners.value = []
      bannerQueue.value = []
      currentBannerIndex.value = 0
      
      if (!shouldCheckBanners()) {
        return
      }

      let banners = getBannersFromCache()
      if (banners === null) {
        try {
          const response = await getBanners()
          if (response?.data && Array.isArray(response.data)) {
            banners = response.data
          } else if (Array.isArray(response)) {
            banners = response
          } else {
            banners = []
          }
          setBannersCache(banners)
        } catch (error) {
          showBannerPopup.value = false
          matchedBanners.value = []
          return
        }
      }
      
      // Normalize current route path
      const currentPath = normalizePath(route.path)
      
      // Separate banners into exact matches and parameterized matches
      const exactMatches = []
      const parameterizedMatches = []
      
      banners.forEach(banner => {
        if (!banner.category_url) return
        
        const bannerPath = normalizePath(banner.category_url)
        
        // Check for exact match first
        if (isExactMatch(bannerPath, currentPath)) {
          exactMatches.push(banner)
        } 
        // Check for parameterized match only if no exact match
        else if (matchesRoute(bannerPath, currentPath)) {
          parameterizedMatches.push(banner)
        }
      })
      
      // Prioritize exact matches - only use parameterized if no exact matches exist
      const matchingBanners = exactMatches.length > 0 ? exactMatches : parameterizedMatches

      if (matchingBanners.length > 0) {
        const userId = getCurrentUserId()
        
        // Filter banners to only show those not yet shown for this user
        const bannersToShow = matchingBanners.filter(banner => {
          const bannerId = banner.id
          // Skip if banner doesn't have an ID
          if (!bannerId) {
            return false
          }
          const hasShown = hasBannerBeenShown(bannerId)
          return !hasShown
        })
        
        if (bannersToShow.length > 0) {
          // Initialize queue with banners to show sequentially
          bannerQueue.value = bannersToShow
          currentBannerIndex.value = 0
          
          // Show first banner
          showNextBanner()
        } else {
          showBannerPopup.value = false
          matchedBanners.value = []
          bannerQueue.value = []
          currentBannerIndex.value = 0
        }
      } else {
        showBannerPopup.value = false
        matchedBanners.value = []
        bannerQueue.value = []
        currentBannerIndex.value = 0
      }
    } catch (error) {
      showBannerPopup.value = false
      matchedBanners.value = []
    }
  }

  // Check on route change
  watch(() => route.path, () => {
    checkBannersForRoute()
  }, { immediate: true })

  // Check on user change (login/logout) - reset and check banners again
  watch(() => authStore.user?.id, (newUserId, oldUserId) => {
    if (newUserId !== oldUserId) {
      // If user logged out (newUserId is null/undefined), clear their banner session
      if (oldUserId && !newUserId) {
        clearBannerSession(oldUserId)
      }
      
      // Reset state and check banners again for new user
      showBannerPopup.value = false
      matchedBanners.value = []
      checkBannersForRoute()
    }
  })

  // Check on mount
  onMounted(() => {
    checkBannersForRoute()
  })

  return {
    showBannerPopup,
    matchedBanners,
    handleBannerClose
  }
}
