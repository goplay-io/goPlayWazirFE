import imgGif1 from "@/assets/mainslider/17742714763511130.gif";
import imgGif2 from "@/assets/mainslider/17721764783098752.gif";
import imgGif3 from "@/assets/mainslider/17814456767483963.gif";
import imgGif4 from "@/assets/mainslider/17721765018272496.gif";
import imgGif5 from "@/assets/mainslider/17721764078548857.gif";
import imgGif6 from "@/assets/mainslider/17721764146044131.gif";
import imgGif7 from "@/assets/mainslider/17753849476434381.gif";
import imgGif8 from "@/assets/mainslider/17721764215895316.gif";
import imgFantasy11 from "@/assets/mainslider/myfanytasyposter.png";
import imgHc from "@/assets/mainslider/hc.webp";
import imgLightningRoulette from "@/assets/mainslider/evo_xxxtremelightningroulette.webp";
import imgAviator from "@/assets/mainslider/sbe_aviator1.jpg";
import imgBbb from "@/assets/mainslider/bbb.webp";
import imgDt2 from "@/assets/mainslider/dt2.webp";
import imgDtMac88 from "@/assets/mainslider/dt_mac88.webp";
import imgDtl2020 from "@/assets/mainslider/dtl_20_20.webp";
import imgDt1day from "@/assets/mainslider/dt_1day.webp";
import imgBaccaratOneDay from "@/assets/mainslider/baccarat_one_day.webp";
import imgBaccaratMac88 from "@/assets/mainslider/baccarat_mac88.webp";
import img29b from "@/assets/mainslider/29b.webp";
import imgSicbo from "@/assets/mainslider/sicbo_mac88.webp";
import imgRoulette from "@/assets/mainslider/roulette_mac88.webp";
import imgPoker2020 from "@/assets/mainslider/20_20_poker.webp";
import imgPoker1Day from "@/assets/mainslider/poker_1_day.webp";
import imgLucky7 from "@/assets/mainslider/lucky_7.webp";
import imgAndarBahar from "@/assets/mainslider/andar_bahar.webp";
import imgTp1d from "@/assets/mainslider/tp1d.webp";
import imgTeenpattiTest from "@/assets/mainslider/teenpatti_test.webp";
import img2CardsTeenpatti from "@/assets/mainslider/2_cards_teenpatti.webp";
import imgMuflisTeenpatti from "@/assets/mainslider/muflis_teenpati.webp";
import img32Cards from "@/assets/mainslider/32_cards.webp";
import imgAmarAkbarAnthony from "@/assets/mainslider/amar_akbar_anthony.webp";

/** Shell gif row shows first 8 tiles (swipeable single row on mobile, single row on desktop). */
export const DESKTOP_EXCHANGE_GAMES_COUNT = 8;

/**
 * Static exchange-games strip — each item uses one of three redirect types:
 *
 * 1) Provider only     → /casino?provider={provider}
 * 2) Provider + game   → /casino?provider={provider}&gamename={game}
 * 3) Game detail page  → /casino/game/{gameId}  (set `gameId` only)
 */
export const STATIC_EXCHANGE_GAMES_ITEMS = [
  {
    id: "exchange-gif-1",
    src: imgGif1,
    alt: "Ezugi",
    provider: "Ezugi",
    isGif: true,
  },
  {
    id: "exchange-gif-2",
    src: imgGif2,
    alt: "MAC88 VIRTUALS",
    provider: "all",
    game: "lightning",
    isGif: true,
  },
  {
    id: "exchange-gif-3",
    src: imgGif3,
    alt: "MAC88 FUN GAMES",
    provider: "MAC88 FUN GAMES",
    isGif: true,
  },
  {
    id: "exchange-gif-4",
    src: imgGif4,
    alt: "MAC SEXY",
    provider: "MAC SEXY",
    isGif: true,
  },
  {
    id: "exchange-gif-5",
    src: imgGif5,
    alt: "Aviator",
    provider: "all",
    game: "aviator",
    isGif: true,
  },
  {
    id: "exchange-gif-6",
    src: imgGif6,
    alt: "Mines",
    provider: "all",
    game: "mines",
    isGif: true,
  },
  {
    id: "exchange-gif-7",
    src: imgGif7,
    alt: "Ezugi",
    provider: "Ezugi",
    isGif: true,
  },
  {
    id: "exchange-gif-8",
    src: imgGif8,
    alt: "COLOR AND CHICKEN GAMES",
    provider: "COLOR AND CHICKEN GAMES",
    isGif: true,
  },
  {
    id: "exchange-mobile-muflis-teenpatti",
    src: imgMuflisTeenpatti,
    alt: "Muflis Teenpatti",
    gameId: "150030",
  },
  {
    id: "exchange-mobile-32-cards",
    src: img32Cards,
    alt: "32 Cards",
    gameId: "150010",
  },
  {
    id: "exchange-mobile-fantasy11",
    src: imgFantasy11,
    alt: "Fantasy11",
    gameId: "971",
  },
  {
    id: "exchange-mobile-hc",
    src: imgHc,
    alt: "High Card",
    gameId: "150060",
  },
  {
    id: "exchange-mobile-lightning-roulette",
    src: imgLightningRoulette,
    alt: "Lightning Roulette",
    provider: "all",
    gameId: "825235",
  },
  {
    id: "exchange-mobile-aviator",
    src: imgAviator,
    alt: "Aviator",
    provider: "all",
    game: "aviator",
    gameId: "230009",
  },
  {
    id: "exchange-mobile-bbb",
    src: imgBbb,
    alt: "Bollywood Casino",
    provider: "MAC88 LIVE",
    gameId: "151083",
  },
  {
    id: "exchange-mobile-dt2",
    src: imgDt2,
    alt: "Dragon Tiger",
    gameId: "150067",
  },
  {
    id: "exchange-mobile-dt-mac88",
    src: imgDtMac88,
    alt: "Dragon Tiger",
    gameId: "150001",
  },
  {
    id: "exchange-mobile-dtl-20-20",
    src: imgDtl2020,
    alt: "Dragon Tiger Lion 20-20",
    gameId: "150013",
  },
  {
    id: "exchange-mobile-dt-1day",
    src: imgDt1day,
    alt: "Dragon Tiger One Day",
    gameId: "150036",
  },
  {
    id: "exchange-mobile-baccarat-one-day",
    src: imgBaccaratOneDay,
    alt: "Baccarat One Day",
    gameId: "150052",
  },
  {
    id: "exchange-mobile-baccarat-mac88",
    src: imgBaccaratMac88,
    alt: "Baccarat",
    gameId: "150002",
  },
  {
    id: "exchange-mobile-29b",
    src: img29b,
    alt: "29 Cards Baccarat",
    gameId: "150026",
  },
  {
    id: "exchange-mobile-sicbo",
    src: imgSicbo,
    alt: "Sic Bo",
    gameId: "150003",
  },
  {
    id: "exchange-mobile-roulette",
    src: imgRoulette,
    alt: "Roulette",
    gameId: "150004",
  },
  {
    id: "exchange-mobile-poker-20-20",
    src: imgPoker2020,
    alt: "20-20 Poker",
    gameId: "150005",
  },
  {
    id: "exchange-mobile-poker-1-day",
    src: imgPoker1Day,
    alt: "Poker One Day",
    gameId: "150032",
  },
  {
    id: "exchange-mobile-lucky-7",
    src: imgLucky7,
    alt: "Lucky 7",
    gameId: "150006",
  },
  {
    id: "exchange-mobile-andar-bahar",
    src: imgAndarBahar,
    alt: "Andar Bahar",
    gameId: "150007",
  },
  {
    id: "exchange-mobile-tp1d",
    src: imgTp1d,
    alt: "Teenpatti One Day",
    gameId: "150009",
  },
  {
    id: "exchange-mobile-teenpatti-test",
    src: imgTeenpattiTest,
    alt: "Teenpatti Test",
    gameId: "150023",
  },
  {
    id: "exchange-mobile-2-cards-teenpatti",
    src: img2CardsTeenpatti,
    alt: "2 Cards Teenpatti",
    gameId: "150028",
  },
  {
    id: "exchange-mobile-amar-akbar-anthony",
    src: imgAmarAkbarAnthony,
    alt: "Amar Akbar Anthony",
    gameId: "150014",
  },
];
