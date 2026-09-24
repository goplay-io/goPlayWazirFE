const DEFAULT_WHATSAPP_SUPPORT_PHONE = '1234567890'

function extractPhoneDigits(value) {
  if (!value) return ''

  const trimmed = String(value).trim()

  if (/^https?:\/\//i.test(trimmed)) {
    const apiMatch = trimmed.match(/[?&]phone=(\d+)/i)
    if (apiMatch?.[1]) return apiMatch[1]

    const waMeMatch = trimmed.match(/wa\.me\/(\d+)/i)
    if (waMeMatch?.[1]) return waMeMatch[1]
  }

  return trimmed.replace(/\D/g, '')
}

export function buildWhatsAppSupportUrl(phoneOrChannel) {
  const phone = extractPhoneDigits(phoneOrChannel) || DEFAULT_WHATSAPP_SUPPORT_PHONE
  return `https://api.whatsapp.com/send/?phone=${phone}&text&type=phone_number&app_absent=0`
}
