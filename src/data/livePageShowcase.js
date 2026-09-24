import manifest from "@/assets/live/manifest.json";
const cardModules = import.meta.glob("@/assets/live/cards/*.{webp,png}", {
  eager: true,
  import: "default",
});

const casinoModules = import.meta.glob("@/assets/live/casino/*.webp", {
  eager: true,
  import: "default",
});

const resolveAssetSrc = (modules, file) => {
  const entry = Object.entries(modules).find(([path]) =>
    path.endsWith(`/${file}`),
  );
  return entry ? entry[1] : "";
};

const mapSlides = (items, modules) =>
  items
    .map((item) => ({
      id: item.id,
      src: resolveAssetSrc(modules, item.file),
      alt: item.alt,
      url: item.url || null,
      gameId: item.gameId || null,
    }))
    .filter((item) => Boolean(item.src));

/** Live Cards — horizontal carousel (reference: casino-slider). */
export const LIVE_CARDS_SLIDES = mapSlides(manifest.cards, cardModules);

/** Live Casino — horizontal carousel (reference: casino-live). */
export const LIVE_CASINO_SLIDES = mapSlides(manifest.casino, casinoModules);

export const LIVE_CARDS_VIEW_MORE_PATH = "/casino?provider=MAC88+VIRTUALS";
export const LIVE_CASINO_VIEW_MORE_PATH =
  "/casino?provider=all&gamename=Others";
