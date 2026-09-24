import imgCasinoJokerBet from '@/assets/images/CasinoJokerBet.webp';
import imgCasinoPoker from '@/assets/images/casinoPoker.webp';
import imgCasinoFruitRace from '@/assets/images/casinoFruitRace1.webp';
import imgWheelBet from '@/assets/images/wheelBetCasinoNew.webp';
import imgCasinoBetNumber from '@/assets/images/casinoBetNumber.webp';

/** Static main slider tiles — replaces /casino/trandings in sports shell chrome. */
export const STATIC_MAIN_SLIDER_IMAGES = [
  {
    id: 'casino-joker-bet',
    name: 'Joker Bet',
    targetType: 'game',
    targetId: '150071',
    image: imgCasinoJokerBet,
  },
  {
    id: 'casino-poker',
    name: 'Casino Poker',
    targetType: 'game',
    targetId: '150032',
    image: imgCasinoPoker,
  },
  {
    id: 'casino-fruit-race',
    name: 'Fruit Race',
    targetType: 'game',
    targetId: 'JL_422',
    image: imgCasinoFruitRace,
  },
  {
    id: 'wheel-bet',
    name: 'Wheel Bet',
    targetType: 'game',
    targetId: '150063',
    image: imgWheelBet,
  },
  {
    id: 'bet-number',
    name: 'Bet Number',
    targetType: 'game',
    targetId: '150045',
    image: imgCasinoBetNumber,
  },
];
