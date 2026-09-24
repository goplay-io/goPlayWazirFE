import { computed, onUnmounted, ref, watch } from 'vue'
import { getApiClient } from '@/api/axios.js'

export const normalizeWalletQrPath = (qrPath) => {
  let path = String(qrPath || '').trim()
  if (!path) return ''

  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname
    } catch {
      return path
    }
  }

  path = path.split('?')[0].split('#')[0]
  path = path.replace(/^(\/wallet)+(?=\/uploads\/)/, '')

  if (path.startsWith('/uploads/qr-codes/')) return path

  const filename = path.split('/').filter(Boolean).pop()
  return filename ? `/uploads/qr-codes/${filename}` : ''
}

export function useWalletQrImage(qrCodeRef, options = {}) {
  const imageFailed = ref(false)
  const imageLoading = ref(false)
  const imageUrl = ref('')
  const showImage = computed(() => Boolean(imageUrl.value) && !imageFailed.value)
  const logLabel = options.logLabel || 'wallet'

  const revokeImageUrl = () => {
    if (!imageUrl.value) return
    URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = ''
  }

  watch(qrCodeRef, (qrCode, _previousQrCode, onCleanup) => {
    let cancelled = false

    revokeImageUrl()
    imageFailed.value = false
    imageLoading.value = false

    if (!qrCode) return

    const qrPath = normalizeWalletQrPath(qrCode)
    if (!qrPath) return

    imageLoading.value = true

    getApiClient('wallet').get(qrPath, { responseType: 'blob' })
      .then((response) => {
        if (cancelled) return
        imageUrl.value = URL.createObjectURL(response.data)
      })
      .catch((error) => {
        if (cancelled) return
        console.error(`Failed to load ${logLabel} QR code:`, error)
        imageFailed.value = true
        imageUrl.value = ''
      })
      .finally(() => {
        if (!cancelled) imageLoading.value = false
      })

    onCleanup(() => {
      cancelled = true
    })
  })

  onUnmounted(revokeImageUrl)

  return {
    imageFailed,
    imageLoading,
    imageUrl,
    showImage,
    revokeImageUrl,
  }
}
