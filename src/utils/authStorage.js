import appConstants from '../constants/appConstants.js'

export const getAuthNamespace = () => {
  const envNamespace = import.meta.env.VITE_AUTH_STORAGE_NAMESPACE
  const appType = appConstants.APP_TYPE
  return (envNamespace || appType || 'default').toString().trim().toLowerCase()
}

export const getAuthAppType = () => appConstants.APP_TYPE

const buildKey = (type) => `${type}_${getAuthNamespace()}`

export const AUTH_STORAGE_KEYS = {
  user: () => buildKey('auth_user'),
}

export const getStoredUser = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEYS.user())
  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

export const setStoredUser = (user) => {
  if (typeof window === 'undefined') {
    return
  }

  if (!user) {
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.user())
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEYS.user(), JSON.stringify(user))
}

export const removeStoredUser = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEYS.user())
}
