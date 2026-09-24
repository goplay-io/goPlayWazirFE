import manifest from '@/assets/populargames/manifest.json';

const imageModules = import.meta.glob('@/assets/populargames/*.webp', {
    eager: true,
    import: 'default',
});

const resolvePopularGameSrc = (file) => {
    const entry = Object.entries(imageModules).find(([path]) => path.endsWith(`/${file}`));
    return entry ? entry[1] : '';
};

/** Local popular games tiles — images in @/assets/populargames (reference: imgsec / popularDiv). */
export const POPULAR_GAMES = manifest
    .map((item) => ({
        id: item.id,
        name: item.name,
        file: item.file,
        gameId: item.gameId || null,
        src: resolvePopularGameSrc(item.file),
    }))
    .filter((item) => Boolean(item.src));
