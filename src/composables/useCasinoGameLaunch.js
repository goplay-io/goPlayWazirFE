import { ref } from 'vue'
import { getCasinoGame } from '@/api/event/casino'

function extractGameUrl(response) {
  if (response?.url) return response.url
  if (response?.data?.url) return response.data.url
  if (response?.iframeUrl) return response.iframeUrl
  if (response?.data?.iframeUrl) return response.data.iframeUrl
  return null
}

export function useCasinoGameLaunch() {
  const loading = ref(false)
  const error = ref(null)
  const gameUrl = ref(null)
  const lastError = ref(null)

  async function launchGame(gameId) {
    if (!gameId) {
      error.value = 'Game ID required'
      gameUrl.value = null
      lastError.value = null
      return false
    }

    loading.value = true
    error.value = null
    gameUrl.value = null
    lastError.value = null

    try {
      const response = await getCasinoGame(gameId)
      const url = extractGameUrl(response)
      if (!url) throw new Error('Invalid game response')
      gameUrl.value = url
      return true
    } catch (err) {
      lastError.value = err
      error.value = err?.response?.data?.message || err?.message || 'Failed to load game'
      return false
    } finally {
      loading.value = false
    }
  }

  function resetGame() {
    loading.value = false
    error.value = null
    gameUrl.value = null
    lastError.value = null
  }

  return {
    loading,
    error,
    gameUrl,
    lastError,
    launchGame,
    resetGame,
  }
}
