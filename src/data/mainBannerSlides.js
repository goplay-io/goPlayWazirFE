/**
 * Main hero banner carousel slides — matched to zuplay.com CMS
 * `public/banner/list?org=zuplay` (active desktop carousel images).
 *
 * Each slide can have ONE of:
 *   provider: 'slug'   → navigates to /casino?provider=slug
 *   gameId:  '150036'  → navigates to /casino/game/150036
 *   href:    '/path'   → navigates to that path
 *   (neither)          → no navigation on click
 */
export const MAIN_BANNER_SLIDES = [
  {
    id: "banner-aviator",
    src: "/banners/aviator-desktop.webp",
    mobileSrc: "/banners/aviator-mobile.webp",
    alt: "Aviator",
    // Reference redirect: /live-casino/spribe/860001
    gameId: "860001",
  },
];
