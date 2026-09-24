/**
 * Normalizes image URLs from the API: strips the base URL and keeps the path under /api/uploads.
 * Example: http://3.109.32.17:8001/uploads/banners/desktop_1771064612522_aacnhc.jpg → /api/uploads/banners/desktop_1771064612522_aacnhc.jpg
 * @param {string} url - Full or relative image URL
 * @returns {string} Path /api/uploads/... (or original url if no /upload found)
 */
export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return ''
  if (!url.startsWith('http://') && !url.startsWith('https://')) return url
  const uploadIndex = url.indexOf('/upload')
  if (uploadIndex !== -1) return '/api' + url.substring(uploadIndex)
  return url
}

const useOriginalImageUrl = () => import.meta.env.VITE_USE_ORIGINAL_IMAGE_URL === 'true'

/**
 * Resolves an image path for use in img src. When VITE_USE_ORIGINAL_IMAGE_URL is not "true" (default),
 * normalizes full URLs to /api/uploads path; when "true", uses the URL as-is.
 * @param {string} imagePath - Path or full URL from API
 * @param {object} options - { baseURL: string (optional) }
 * @returns {string} Final URL for img src
 */
export function getImageUrl(imagePath, options = {}) {
  if (!imagePath) return ''
  const resolved = useOriginalImageUrl() ? imagePath : normalizeImageUrl(imagePath)

  if (resolved.startsWith('http://') || resolved.startsWith('https://')) return resolved

  if (resolved.startsWith('/')) {
    const baseURL = options.baseURL ?? import.meta.env.VITE_USER_BASE ?? (typeof window !== 'undefined' ? window.location.origin : '')
    const origin = resolved.startsWith('/api/uploads')
      ? (typeof window !== 'undefined' ? window.location.origin : (baseURL ? new URL(baseURL).origin : ''))
      : (baseURL || '').replace(/\/$/, '')
    return origin ? `${origin}${resolved}` : resolved
  }

  return resolved
}
