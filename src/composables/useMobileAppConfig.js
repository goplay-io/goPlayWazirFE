import { computed, ref } from 'vue'

const configCache = new Map()
const pendingRequests = new Map()

const appKey = String(import.meta.env.VITE_MOBILE_APP_KEY || 'zuplay').trim()

function getPublicApiBase() {
  const explicitBase =
    import.meta.env.VITE_PUBLIC_API_BASE ||
    import.meta.env.VITE_API_BASE_URL

  if (explicitBase) return String(explicitBase).replace(/\/+$/, '')

  const userBase = String(import.meta.env.VITE_USER_BASE || '')
  if (userBase) return userBase.replace(/\/user\/?$/, '').replace(/\/+$/, '')

  return typeof window !== 'undefined' ? window.location.origin : ''
}

function getEndpoint(action) {
  if (!appKey) return null
  return `${getPublicApiBase()}/public/mobile-app/${action}/${encodeURIComponent(appKey)}`
}

async function readJson(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || 'Mobile app configuration is unavailable')
  }
  return data
}

export function useMobileAppConfig() {
  const config = ref(configCache.get(appKey) || null)
  const loading = ref(false)
  const error = ref(null)

  const apkDownloadEnabled = computed(
    () => config.value?.apkDownloadEnabled === true
  )

  const loadConfig = async () => {
    if (!appKey) return null
    if (configCache.has(appKey)) {
      config.value = configCache.get(appKey)
      return config.value
    }

    loading.value = true
    error.value = null
    try {
      if (!pendingRequests.has(appKey)) {
        pendingRequests.set(
          appKey,
          fetch(getEndpoint('config'), {
            method: 'GET',
            headers: { Accept: 'application/json' },
          }).then(readJson)
        )
      }
      const result = await pendingRequests.get(appKey)
      configCache.set(appKey, result)
      config.value = result
      return result
    } catch (requestError) {
      error.value = requestError
      return null
    } finally {
      pendingRequests.delete(appKey)
      loading.value = false
    }
  }

  const requestApkDownload = async () => {
    if (!apkDownloadEnabled.value) {
      throw new Error('APK download is not available')
    }

    try {
      const response = await fetch(getEndpoint('download'), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
      const result = await readJson(response)
      if (!result?.downloadUrl) {
        throw new Error('APK download is not available')
      }

      if (typeof window !== 'undefined') {
        const downloadLink = document.createElement('a')
        downloadLink.href = result.downloadUrl
        downloadLink.download = `${appKey}.apk`
        downloadLink.style.display = 'none'
        document.body.appendChild(downloadLink)
        downloadLink.click()
        downloadLink.remove()
      }
    } catch (requestError) {
      throw requestError
    }
  }

  return {
    appKey,
    config,
    loading,
    error,
    apkDownloadEnabled,
    loadConfig,
    requestApkDownload,
  }
}
