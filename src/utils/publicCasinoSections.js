const flattenSections = (sections) => {
  if (Array.isArray(sections)) return sections
  if (!sections || typeof sections !== 'object') return []
  return Object.values(sections).flatMap((group) => (Array.isArray(group) ? group : []))
}

const normalized = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '')

const getHost = (url) => {
  try { return new URL(url).hostname.toLowerCase() } catch { return '' }
}

export const getCurrentSkinSections = (info) => {
  const sections = info?.sections
  if (Array.isArray(sections)) return sections
  if (!sections || typeof sections !== 'object') return []

  const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : ''
  const skins = Array.isArray(info?.skins) ? info.skins : []
  const wazirSkinMatch = (candidate) => {
    const key = normalized(candidate?.key)
    const name = normalized(candidate?.name)
    return key === 'wazir' || key === 'wazirwin' || key === 'monkeydon'
      || name.includes('wazir') || name.includes('monkeydon')
  }

  const skin = skins.find((candidate) => getHost(candidate?.url) === hostname)
    || skins.find(wazirSkinMatch)
    || skins.find((candidate) => normalized(candidate?.name) === 'zuplay')
    || skins.find((candidate) => normalized(candidate?.key) === 'zuplay')
  if (skin?.id != null) return Array.isArray(sections[String(skin.id)]) ? sections[String(skin.id)] : []
  return []
}

export const findPublicSection = (sections, { code = '', aliases = [] } = {}) => {
  const expectedCode = normalized(code)
  const expectedAliases = aliases.map(normalized).filter(Boolean)
  return flattenSections(sections).find((section) => {
    const sectionCode = normalized(section?.code)
    const name = normalized(section?.name)
    return (expectedCode && sectionCode === expectedCode)
      || expectedAliases.some((alias) => sectionCode.includes(alias) || name.includes(alias))
  }) || null
}

export const getPublicSectionItems = (section) => (
  Array.isArray(section?.items) ? section.items : []
)
