/**
 * Originals tabbed section — matched to monkeydon.com reference home.
 * Static luckmedia.link thumbnails per tab (Originals, Scratch Card, Lottery, Crash Games).
 */
const thumb = (slug) => `https://luckmedia.link/${slug}/thumb_3_4_custom.webp`;

export const HOME_ORIGINALS_TABS = [
  {
    id: 'originals',
    label: 'Originals',
    seeAllQuery: { provider: 'MAC88' },
    games: [
      { id: 'evo_dream_catcher', name: 'Dream Catcher', image: thumb('evo_dream_catcher') },
      { id: 'evo_poker_lobby', name: 'Poker Lobby', image: thumb('evo_poker_lobby') },
      { id: 'spb_aviator', name: 'Aviator', image: thumb('spb_aviator') },
      { id: 'spb_mines', name: 'Mines', image: thumb('spb_mines') },
      { id: 'kng_teen_patti', name: 'Teen Patti', image: thumb('kng_teen_patti') },
      { id: 'sms_jetx', name: 'JetX', image: thumb('sms_jetx') },
    ],
  },
  {
    id: 'scratch-card',
    label: 'Scratch Card',
    seeAllQuery: { gamename: 'scratch card' },
    games: [
      { id: 'hcw_gold_rush', name: 'Gold Rush', image: thumb('hcw_gold_rush') },
      { id: 'hcw_balloons', name: 'Balloons', image: thumb('hcw_balloons') },
      { id: 'hcw_scratchy_mini', name: 'Scratchy Mini', image: thumb('hcw_scratchy_mini') },
      { id: 'spi_fortune_wheel', name: 'Fortune Wheel', image: thumb('spi_fortune_wheel') },
      { id: 'jil_pappu', name: 'Pappu', image: thumb('jil_pappu') },
      { id: 'jil_tower', name: 'Tower', image: thumb('jil_tower') },
    ],
  },
  {
    id: 'lottery',
    label: 'Lottery',
    seeAllQuery: { gamename: 'lottery' },
    games: [
      { id: 'tvb_keno', name: 'Keno', image: thumb('tvb_keno') },
      { id: 'jdb_jogo_do_bicho', name: 'Jogo Do Bicho', image: thumb('jdb_jogo_do_bicho') },
      { id: 'wzd_extra_bingo', name: 'Extra Bingo', image: thumb('wzd_extra_bingo') },
      { id: 'kng_color_game', name: 'Color Game', image: thumb('kng_color_game') },
      { id: 'jil_bingo_carnaval', name: 'Bingo Carnaval', image: thumb('jil_bingo_carnaval') },
    ],
  },
  {
    id: 'crash-games',
    label: 'Crash Games',
    seeAllQuery: { gamename: 'crash games' },
    games: [
      { id: 'pgp_spaceman', name: 'Spaceman', image: thumb('pgp_spaceman') },
      { id: 'sms_footballx', name: 'FootballX', image: thumb('sms_footballx') },
      { id: 'gmz_pilot', name: 'Pilot', image: thumb('gmz_pilot') },
      { id: 'gmz_pilot_cup', name: 'Pilot Cup', image: thumb('gmz_pilot_cup') },
      { id: 'gmz_pilot_coin', name: 'Pilot Coin', image: thumb('gmz_pilot_coin') },
      { id: 'sms_towerx', name: 'TowerX', image: thumb('sms_towerx') },
      { id: 'sms_helicopter_x', name: 'Helicopter X', image: thumb('sms_helicopter_x') },
      { id: 'pgp_big_bass_crash', name: 'Big Bass Crash', image: thumb('pgp_big_bass_crash') },
      { id: 'jil_go_rush', name: 'Go Rush', image: thumb('jil_go_rush') },
      { id: 'hcw_limbo', name: 'Limbo', image: thumb('hcw_limbo') },
    ],
  },
];
