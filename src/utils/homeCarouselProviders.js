/**
 * Port of wazir-userfrontend:
 * - CasinoProviders (carousel fields only)
 * - getCarouselProviders / fetchBannerImage from commonUtils + casino.helpers
 */

/** Same order as reference CasinoProviders.ts (subProviderName !== 'all'). */
export const CASINO_CAROUSEL_PROVIDERS = [
  { subProviderName: 'MAC88', img: 'Mac88 gaming' },
  { subProviderName: 'FUN GAMES', img: 'fun games' },
  { subProviderName: 'MAC EXCITE', img: 'mac_excite' },
  { subProviderName: 'SPRIBE', img: 'spribe' },
  { subProviderName: 'VIVO', img: 'vivo games' },
  { subProviderName: 'KINGMAKER', img: 'kingmaker' },
  { subProviderName: 'EVOLUTION', img: 'evolution' },
  { subProviderName: 'TURBO', img: 'turbo' },
  { subProviderName: 'EZUGI', img: 'ezugi' },
  { subProviderName: 'JILI', img: 'jili gaming' },
  { subProviderName: 'AE SEXY', img: 'sexybcrt' },
  { subProviderName: 'PLAYTECH', img: 'playtech' },
  { subProviderName: 'SMARTSOFT', img: 'smartsoft gaming' },
  { subProviderName: 'BETSOFT', img: 'betsoft' },
  { subProviderName: 'GAMZIX', img: 'gamzix' },
  { subProviderName: 'BetGames_TV', img: 'betgames.tv' },
  { subProviderName: 'EVOPLAY', img: 'evoplay entertainment' },
  { subProviderName: 'ASIA GAMING', img: 'asia gaming' },
  { subProviderName: 'ROYAL GAMING', img: 'royal gaming' },
  { subProviderName: 'WINFINITY', img: 'winfinity' },
];

const DESKTOP_BANNERS = {
  'Mac88 gaming': '/home/carousel/mac88-gaming.webp',
  'fun games': '/home/carousel/fun-games.webp',
  mac_excite: '/home/carousel/mac_excite.webp',
  spribe: '/home/carousel/spribe.webp',
  evolution: '/home/carousel/evolution.webp',
  turbo: '/home/carousel/turbo.webp',
  ezugi: '/home/carousel/ezugi-games.webp',
  'jili gaming': '/home/carousel/jili.webp',
  playtech: '/home/carousel/playtech.webp',
  sexybcrt: '/home/carousel/sexy-bcrt.webp',
  'smartsoft gaming': '/home/carousel/smartsoft.webp',
  betsoft: '/home/carousel/betsoft.webp',
  gamzix: '/home/carousel/gamzix.webp',
  'betgames.tv': '/home/carousel/betgames.webp',
  'evoplay entertainment': '/home/carousel/evoplay-entertainment.webp',
  'asia gaming': '/home/carousel/asia-gaming.webp',
  winfinity: '/home/carousel/winfinity.webp',
  popok: '/home/carousel/popok.webp',
  kingmaker: '/home/carousel/kingmaker.webp',
  'vivo games': '/home/carousel/vivo-games.webp',
};

const MOBILE_BANNERS = {
  'Mac88 gaming': '/home/carousel/mobile/mac88-gaming.webp',
  'fun games': '/home/carousel/mobile/fun-games.webp',
  mac_excite: '/home/carousel/mobile/mac_excite.webp',
  spribe: '/home/carousel/mobile/spribe.webp',
  evolution: '/home/carousel/mobile/evolution.webp',
  turbo: '/home/carousel/mobile/turbo.webp',
  ezugi: '/home/carousel/mobile/ezugi-games.webp',
  'jili gaming': '/home/carousel/mobile/jili.webp',
  playtech: '/home/carousel/mobile/playtech.webp',
  sexybcrt: '/home/carousel/mobile/sexy-bcrt.webp',
  'smartsoft gaming': '/home/carousel/mobile/smartsoft.webp',
  betsoft: '/home/carousel/mobile/betsoft.webp',
  gamzix: '/home/carousel/mobile/gamzix.webp',
  'betgames.tv': '/home/carousel/mobile/betgames.webp',
  'evoplay entertainment': '/home/carousel/mobile/evoplay-entertainment.webp',
  'asia gaming': '/home/carousel/mobile/asia-gaming.webp',
  winfinity: '/home/carousel/mobile/winfinity.webp',
  popok: '/home/carousel/popok.webp',
  kingmaker: '/home/carousel/mobile/kingmaker.webp',
  'vivo games': '/home/carousel/mobile/vivo-games.webp',
};

/** Reference fetchBannerImage(item.img) */
export function fetchBannerImage(imgKey, isMobile = false) {
  const map = isMobile ? MOBILE_BANNERS : DESKTOP_BANNERS;
  return map[imgKey] || '';
}

/** Reference getCarouselProviders() */
export function getCarouselProviders() {
  return CASINO_CAROUSEL_PROVIDERS
    .filter((provider) => provider.subProviderName !== 'all')
    .map((provider) => ({
      subProviderName: provider.subProviderName,
      img: provider.img,
    }))
    .reduce((result, value, index, array) => {
      if (index % 2 === 0) result.push(array.slice(index, index + 2));
      return result;
    }, []);
}
