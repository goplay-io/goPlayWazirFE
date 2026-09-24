import { getPublicInfo } from '@/api/user/info'
import { setSkins } from '@/constants/skins'

let publicInfoPromise = null
let inMemoryPublicInfo = null

const normalizeInfo = (response) => {
  let info = response?.data ?? response ?? {}
  if (info?.data && typeof info.data === 'object' && !Array.isArray(info.data)) {
    info = info.data
  }
  return {
    skins: Array.isArray(info?.skins) ? info.skins : [],
    sections: Array.isArray(info?.sections)
      ? info.sections
      : (info?.sections && typeof info.sections === 'object' ? info.sections : []),
    notifications: Array.isArray(info?.notifications) ? info.notifications : [],
  }
}

const applySkinConfigs = (info) => {
  if (Array.isArray(info?.skins) && info.skins.length) {
    setSkins(info.skins)
  }
}

export const loadPublicInfo = () => {
  if (inMemoryPublicInfo) {
    return Promise.resolve(inMemoryPublicInfo)
  }

  if (publicInfoPromise) return publicInfoPromise

  publicInfoPromise = (async () => {
    const info = normalizeInfo(await getPublicInfo())
    inMemoryPublicInfo = info
    applySkinConfigs(info)
    return info
  })().finally(() => {
    publicInfoPromise = null
  })

  return publicInfoPromise
}

export const getCachedPublicInfo = () => inMemoryPublicInfo
