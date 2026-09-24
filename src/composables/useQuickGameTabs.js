import Fantasy11Icon from '@/components/Icons/Fantasy11.vue'
import CricketBattleIcon from '@/components/Icons/CricketBattle.vue'
import { TENNIS_EVENT_TYPE_ID } from '@/composables/useEventTypes'

export const FANTASY11_ROUTE = '/casino/game/CLC_lobby'
export const CRICKET_BATTLE_ROUTE = '/casino/game/151185'

export const quickGameTabs = [
  {
    id: 'quick-fantasy11',
    name: 'Fantasy 11',
    route: FANTASY11_ROUTE,
    icon: Fantasy11Icon,
    iconSize: 22,
    quickVariant: 'fantasy11',
    isQuickGame: true,
    isNew: true
  },
  {
    id: 'quick-cricket-battle',
    name: 'Cricket Battle',
    route: CRICKET_BATTLE_ROUTE,
    icon: CricketBattleIcon,
    iconSize: 22,
    quickVariant: 'cricket-battle',
    isQuickGame: true,
    isNew: true
  }
]

export function insertQuickGameTabsAfterTennis(tabs) {
  const list = Array.isArray(tabs) ? tabs : []
  const alreadyInserted = list.some((tab) => tab?.isQuickGame)
  if (alreadyInserted) return list

  const tennisIndex = list.findIndex((tab) => {
    const name = String(tab?.name || '').toLowerCase()
    return Number(tab?.id) === 2 || name === 'tennis'
  })

  if (tennisIndex < 0) return [...list, ...quickGameTabs]

  return [
    ...list.slice(0, tennisIndex + 1),
    ...quickGameTabs,
    ...list.slice(tennisIndex + 1)
  ]
}

/** Insert Casino immediately after Fantasy 11 / Cricket Battle (reference navbar order). */
export function insertCasinoTabAfterQuickGames(tabs, casinoTab) {
  const list = Array.isArray(tabs) ? tabs : []
  const tennisIdx = list.findIndex(
    (row) => Number(row?.id ?? row?.value) === TENNIS_EVENT_TYPE_ID
      || String(row?.name || '').toLowerCase() === 'tennis'
  )
  if (tennisIdx < 0) return [...list, casinoTab]

  let lastQuickAfterTennis = tennisIdx
  for (let i = tennisIdx + 1; i < list.length; i += 1) {
    if (isQuickGameTab(list[i])) lastQuickAfterTennis = i
    else break
  }
  const casinoIndex = lastQuickAfterTennis + 1
  return [
    ...list.slice(0, casinoIndex),
    casinoTab,
    ...list.slice(casinoIndex)
  ]
}

export const isQuickGameTab = (tab) => Boolean(tab?.isQuickGame)
