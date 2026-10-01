import uvGamesGif from '@/assets/gifs/uv_games.gif'
import miniAviator from '@/assets/mini-games/mini_aviator.webp'
import miniJetx from '@/assets/mini-games/mini_jetx.webp'
import miniDice from '@/assets/mini-games/mini_dice.webp'
import miniLimbo from '@/assets/mini-games/mini_limbo.webp'
import miniRps from '@/assets/mini-games/mini_rps.webp'
import miniFortuneWheel from '@/assets/mini-games/mini_fortune_wheel.webp'
import miniCoinflip from '@/assets/mini-games/mini_coinflip.webp'
import miniCrashx from '@/assets/mini-games/mini_crashx.webp'
import miniSlide from '@/assets/mini-games/mini_slide.webp'

/** Portrait mini-game card ratio (120x160 reference) */
export const CASINO_GIF_ASPECT_RATIO = '120 / 160'

/** Animated mini-games FAB — reference monkeydon.com @ 390px: 70×70 fixed uv_games gif */
export const MINI_GAMES_LOBBY_ICON = uvGamesGif

export const MINI_GAMES_FAB_SIZE_PX = 70

export function buildMiniGameHref(query = {}) {
  if (query.game) return `/casino/game/${encodeURIComponent(query.game)}`
  const params = new URLSearchParams()
  if (query.provider) params.set('provider', query.provider)
  if (query.type) params.set('type', query.type)
  const qs = params.toString()
  return qs ? `/casino?${qs}` : '/casino'
}

/** MAC88 Lite mini games (casino ids 150900–150908) with local portrait assets. */
export const STATIC_MINI_GAMES = [
  {
    id: 'mini-aviator',
    gameId: '150900',
    name: 'Aviator',
    gameName: 'Aviator',
    image: miniAviator,
    thumbnail: miniAviator,
    providerName: 'MAC88',
    playerCount: 223,
    casinoQuery: { game: '150900' },
  },
  {
    id: 'mini-limbo',
    gameId: '150903',
    name: 'Limbo',
    gameName: 'Limbo',
    image: miniLimbo,
    thumbnail: miniLimbo,
    providerName: 'MAC88',
    playerCount: 142,
    casinoQuery: { game: '150903' },
  },
  {
    id: 'mini-dice',
    gameId: '150902',
    name: 'Dice',
    gameName: 'Dice',
    image: miniDice,
    thumbnail: miniDice,
    providerName: 'MAC88',
    playerCount: 121,
    casinoQuery: { game: '150902' },
  },
  {
    id: 'mini-jetx',
    gameId: '150901',
    name: 'JetX',
    gameName: 'JetX',
    image: miniJetx,
    thumbnail: miniJetx,
    providerName: 'MAC88',
    playerCount: 98,
    casinoQuery: { game: '150901' },
  },
  {
    id: 'mini-rps',
    gameId: '150904',
    name: 'Rock Paper Scissors',
    gameName: 'Rock Paper Scissors',
    image: miniRps,
    thumbnail: miniRps,
    providerName: 'MAC88',
    playerCount: 87,
    casinoQuery: { game: '150904' },
  },
  {
    id: 'mini-fortune-wheel',
    gameId: '150905',
    name: 'Fortune Wheel',
    gameName: 'Fortune Wheel',
    image: miniFortuneWheel,
    thumbnail: miniFortuneWheel,
    providerName: 'MAC88',
    playerCount: 76,
    casinoQuery: { game: '150905' },
  },
  {
    id: 'mini-coinflip',
    gameId: '150906',
    name: 'Coin Flip',
    gameName: 'Coin Flip',
    image: miniCoinflip,
    thumbnail: miniCoinflip,
    providerName: 'MAC88',
    playerCount: 65,
    casinoQuery: { game: '150906' },
  },
  {
    id: 'mini-crashx',
    gameId: '150907',
    name: 'Crash X',
    gameName: 'Crash X',
    image: miniCrashx,
    thumbnail: miniCrashx,
    providerName: 'MAC88',
    playerCount: 54,
    casinoQuery: { game: '150907' },
  },
  {
    id: 'mini-xroulette',
    gameId: '150908',
    name: 'Xroulette',
    gameName: 'Xroulette',
    image: miniSlide,
    thumbnail: miniSlide,
    providerName: 'MAC88',
    playerCount: 48,
    casinoQuery: { game: '150908' },
  },
]