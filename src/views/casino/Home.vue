<template>
    <v-container fluid class="casino-page tw-px-0 tw-pb-2 md:tw-pb-4 tw-pt-0 md:tw-pt-0 max-w-[99vw] tw-mx-auto md:tw-max-w-[890px]">
        <!-- Top bar: CASINO title + search (mobile search only) -->
        <!-- <div v-if="props.showHeader" class="casino-listing-top-bar">
            <h1 class="casino-listing-top-bar__title">
                {{ t('casino.home.heading') }}
            </h1>
            <CasinoSearch
                v-model="searchQuery"
                :result-count="filteredGames.length"
                :games="filteredGames"
                :placeholder="t('casino.home.searchPlaceholder')"
                class="casino-listing-top-bar__search md:tw-hidden"
                @game-selected="playGame"
            />
        </div> -->

        <div class="casino-page-body tw-px-1 md:tw-px-0 tw-mt-1">
            <!-- Loading State -->
            <Loading v-if="loading" />

            <!-- Main Content -->
            <div v-else>
                <CasinoSearch
                    v-model="searchQuery"
                    :result-count="filteredGames.length"
                    :games="filteredGames"
                    :placeholder="t('casino.home.searchPlaceholder')"
                    class="casino-tabs-search-mobile md:tw-hidden"
                    @game-selected="playGame"
                />

                <!-- Provider + game-type tab rails -->
                <div class="casino-tabs-stack">
                    <CasinoTabsL2Rail
                        :items="gameTypeFilterItems"
                        :active-key="activeGameType"
                        @select="changeGameType"
                    />

                    <div class="casino-tabs-l1-search-row">
                        <CasinoTabsL1Rail
                            :items="productFilterItems"
                            :active-key="activeProduct"
                            @select="changeProduct"
                        />

                        <CasinoSearch
                            v-model="searchQuery"
                            :result-count="filteredGames.length"
                            :games="filteredGames"
                            :placeholder="t('casino.home.searchPlaceholder')"
                            inline
                            class="casino-tabs-search max-md:tw-hidden"
                            @game-selected="playGame"
                        />
                    </div>
                </div>

                <!-- Games grid -->
                <div v-if="filteredGames.length > 0">
                    <div
                        class="casino-games-grid tw-grid tw-grid-cols-3 md:tw-grid-cols-6 tw-gap-1 md:tw-gap-2">
                        <div v-for="(game, index) in displayedGames" :key="game.id" v-memo="[game.id]"
                            class="casino-game-tile" @click="playGame(game)">
                            <div class="casino-game-tile__media">
                                <img :src="game.url_thumb" :alt="game.name" loading="lazy" decoding="async"
                                    class="tw-w-full tw-h-full tw-object-cover tw-object-center"
                                    :fetchpriority="index < 6 ? 'high' : 'low'" @error="handleImageError($event)" />
                                <div
                                    class="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/50 tw-opacity-0 image-placeholder">
                                    <v-icon icon="mdi-cards-variant" size="36" class="tw-text-white"></v-icon>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="displayedGames.length < filteredGames.length" v-intersect="onIntersect"
                        class="tw-flex tw-justify-center tw-items-center tw-py-2 md:tw-py-4">
                        <v-progress-circular indeterminate class="nav-progress" size="28" />
                    </div>
                </div>

                <!-- Empty state -->
                <div v-else class="tw-text-center tw-py-6 md:tw-py-8 tw-px-3">
                    <v-icon icon="mdi-casino-chip" size="52"
                        class="tw-mb-3 tw-text-gray-400"></v-icon>
                    <h3 class="tw-mb-1.5 tw-text-lg tw-font-semibold tw-text-gray-900">{{
                        t('casino.home.noGamesFound') }}</h3>
                    <p class="tw-mx-auto tw-max-w-md tw-text-gray-600">
                        {{ searchQuery ? t('casino.home.noGamesSearchDescription') :
                            t('casino.home.noGamesFilterDescription') }}
                    </p>
                    <v-btn v-if="searchQuery || activeProduct !== 'all' || activeGameType !== 'all'" variant="outlined"
                        class="tw-mt-4 nav-outline-btn" @click="clearFilters">
                        {{ t('casino.home.clearFilters') }}
                    </v-btn>
                </div>
            </div>
        </div>
        <!-- Bottom clearance for fixed mobile nav bar -->
        <div class="casino-mobile-nav-spacer md:tw-hidden" aria-hidden="true" />
    </v-container>
</template>

<script setup>
import { ref, shallowRef, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getCasinoGames } from '../../api/event/casino';
import { useSelectedGame } from '@/composables/useSelectedGame';
import { useFavoriteGames } from '@/composables/useFavoriteGames';
import { useAuthStore } from '@/stores/auth';
import CasinoSearch from '../../components/CasinoSearch.vue';
import CasinoTabsL1Rail from '@/components/casino/CasinoTabsL1Rail.vue';
import CasinoTabsL2Rail from '@/components/casino/CasinoTabsL2Rail.vue';
import Loading from '@/components/Loading.vue';
import useDevices from '@/composables/useDevices';
import { sortCasinoGamesByPriority } from '@/utils/casinoGamePriority';
import ultrawinHtml from '../../assets/Ultrawin.html?raw';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { setSelectedGame } = useSelectedGame();
const { isMobile } = useDevices();
const authStore = useAuthStore();
const { favoriteGames, refreshFavouriteGames } = useFavoriteGames();
const props = defineProps({
    showHeader: {
        type: Boolean,
        default: true,
    },
});

const loading = ref(true);
const allGames = shallowRef([]);
const providers = ref([]);
let providerCountMap = {};
let categoryCountMap = {};
let globalCategoryCountMap = {};
let providerCategoryMap = {};

const totalGames = ref(0);
const activeProduct = ref('all');
const activeGameType = ref('all');
const searchQuery = ref('');
const PAGE_SIZE = computed(() => (isMobile.value ? 12 : 24));
const visibleCount = ref(PAGE_SIZE.value);
const isLoggedInUser = computed(() => authStore.isRealAuthenticated);

const normalizeProviderKey = (value) => String(value ?? '').trim().toLowerCase();

const findGameTypeMatch = (queryValue) => {
    const normalized = normalizeCategoryKey(queryValue);
    if (!normalized || normalized === 'all') return 'all';

    return availableGameTypes.value.find(
        (gameType) =>
            normalizeCategoryKey(gameType) === normalized ||
            normalizeCategoryKey(gameType).includes(normalized) ||
            normalized.includes(normalizeCategoryKey(gameType)),
    );
};

const applyFiltersFromRoute = () => {
    const providerFromQuery = String(route.query.provider ?? '').trim();
    const gameFromQuery = String(route.query.gamename ?? route.query.game ?? '').trim();

    if (providerFromQuery) {
        if (normalizeProviderKey(providerFromQuery) === 'all') {
            activeProduct.value = 'all';
        } else {
            const matchedProvider = providers.value.find(
                (provider) => normalizeProviderKey(provider) === normalizeProviderKey(providerFromQuery),
            );
            if (matchedProvider) activeProduct.value = matchedProvider;
        }
    }

    if (gameFromQuery) {
        const matchedGameType = findGameTypeMatch(gameFromQuery);
        if (matchedGameType) activeGameType.value = matchedGameType;
    } else if (providerFromQuery && normalizeProviderKey(providerFromQuery) !== 'all') {
        activeGameType.value = 'all';
    }
};

const getGameTypeIcon = (key) => {
    if (key === 'all') return 'mdi-view-grid-outline';
    const k = String(key).toLowerCase();
    const icons = {
        'dragon tiger': 'mdi-fire',
        baccarat: 'mdi-cards-playing',
        sicbo: 'mdi-dice-multiple',
        'sic bo': 'mdi-dice-multiple',
        'live sic bo': 'mdi-dice-multiple',
        roulette: 'mdi-circle-outline',
        'live roulette': 'mdi-circle-outline',
        'color prediction': 'mdi-chart-pie',
        'chicken games': 'mdi-food-drumstick',
        'andar bahar': 'mdi-cards',
        mines: 'mdi-mine',
        aviator: 'mdi-airplane',
        teenpatti: 'mdi-cards-playing-club',
        lottery: 'mdi-numeric',
        'live poker': 'mdi-cards-playing-outline',
        'live lobby': 'mdi-office-building',
        'crash games': 'mdi-chart-line-variant',
        'casual games': 'mdi-gamepad-variant',
        'scratch cards': 'mdi-cards-outline',
        blackjack: 'mdi-cards-playing-heart',
        poker: 'mdi-cards-playing-club',
        slots: 'mdi-slot-machine',
        lightning: 'mdi-lightning-bolt',
    };
    for (const [frag, icon] of Object.entries(icons)) {
        if (k.includes(frag)) return icon;
    }
    return 'mdi-cards-playing-outline';
};

const normalizeCategoryKey = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

const decodeEntities = (value) =>
    String(value || '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

const resolveUltrawinIconSrc = (rawSrc) => {
    const src = decodeEntities(rawSrc).trim();
    if (!src) return null;
    if (src.startsWith('data:image')) return src;

    const fileName = src.split('/').pop();
    if (!fileName) return null;
    return new URL(`../../assets/Ultrawin_files/${fileName}`, import.meta.url).href;
};

const buildUltrawinCategorySvgs = (html) => {
    const map = {};
    const cardRegex =
        /<img[^>]*src="([^"]+)"[^>]*>\s*<div[^>]*>\s*([^<]+?)\s*<\/div>/gim;

    let match;
    while ((match = cardRegex.exec(html)) !== null) {
        const [, src, label] = match;
        const normalizedLabel = normalizeCategoryKey(decodeEntities(label));
        const resolvedSrc = resolveUltrawinIconSrc(src);
        if (!normalizedLabel || !resolvedSrc) continue;
        if (!map[normalizedLabel]) map[normalizedLabel] = resolvedSrc;
    }
    return map;
};

const ULTRAWIN_CATEGORY_SVGS = Object.freeze(buildUltrawinCategorySvgs(ultrawinHtml));

const getGameTypeIconSrc = (key) => {
    if (key === 'all') return null;
    const normalizedKey = normalizeCategoryKey(key);

    if (ULTRAWIN_CATEGORY_SVGS[normalizedKey]) return ULTRAWIN_CATEGORY_SVGS[normalizedKey];

    for (const [label, iconSrc] of Object.entries(ULTRAWIN_CATEGORY_SVGS)) {
        if (normalizedKey.includes(label) || label.includes(normalizedKey)) return iconSrc;
    }
    return null;
};

onMounted(async () => {
    loading.value = true;
    try {
        const response = await getCasinoGames();
        let responseData = response;
        if (response?.data && typeof response.data === 'object') responseData = response.data;
        if (responseData?.data && typeof responseData.data === 'object') responseData = responseData.data;

        const games = [];
        const _providerCountMap = {};
        const _categoryCountMap = {};
        const _globalCategoryCountMap = {};
        const _providerCategoryMap = {};
        const _providers = [];

        Object.keys(responseData || {}).forEach((provider) => {
            const providerData = responseData[provider];
            if (!providerData || typeof providerData !== 'object') return;
            _providers.push(provider);
            _providerCountMap[provider] = 0;
            _categoryCountMap[provider] = {};
            _providerCategoryMap[provider] = Object.keys(providerData);

            Object.keys(providerData).forEach((category) => {
                const gameList = Array.isArray(providerData[category])
                    ? sortCasinoGamesByPriority(providerData[category])
                    : [];
                _categoryCountMap[provider][category] = gameList.length;
                _globalCategoryCountMap[category] = (_globalCategoryCountMap[category] || 0) + gameList.length;
                _providerCountMap[provider] += gameList.length;

                gameList.forEach((game) => {
                    games.push(
                        Object.freeze({
                            id: game.id,
                            name: game.name,
                            url_thumb: game.url_thumb,
                            provider,
                            category,
                            product: game.product ?? null,
                            game_type: game.game_type ?? null,
                            game_priority: game.game_priority ?? null,
                            position: game.position ?? null,
                        }),
                    );
                });
            });
        });

        allGames.value = Object.freeze(games);
        providers.value = _providers;
        totalGames.value = games.length;
        providerCountMap = _providerCountMap;
        categoryCountMap = _categoryCountMap;
        globalCategoryCountMap = _globalCategoryCountMap;
        providerCategoryMap = _providerCategoryMap;
        activeProduct.value = 'all';

        if (isLoggedInUser.value && favoriteGames.value.length === 0) {
            await refreshFavouriteGames();
        }

        applyFiltersFromRoute();

        if (activeProduct.value === 'all' && activeGameType.value === 'all') {
            const dragonTiger = availableGameTypes.value.find(
                (gt) => normalizeCategoryKey(gt) === 'dragon tiger',
            );
            if (dragonTiger) activeGameType.value = dragonTiger;
        }
    } catch (error) {
        console.error('Error loading casino data:', error);
        activeProduct.value = 'all';
    } finally {
        loading.value = false;
    }
});

const productFilterItems = computed(() => {
    const rest = providers.value.map((p) => ({
        key: p,
        label: p,
    }));
    const allItem = { key: 'all', label: t('casino.home.allProviders') };
    if (!isLoggedInUser.value) return [allItem, ...rest];
    return [allItem, { key: 'recent', label: 'RECENT' }, ...rest];
});

const gameTypeFilterItems = computed(() => {
    const items = [{ key: 'all', label: t('casino.home.allTypes') }];
    availableGameTypes.value.forEach((gt) => {
        items.push({
            key: gt,
            label: formatGameTypeName(gt),
        });
    });
    return items;
});

watch([activeProduct, activeGameType, searchQuery], () => {
    visibleCount.value = PAGE_SIZE.value;
});

watch(
    () => [route.query.provider, route.query.gamename, route.query.game],
    () => {
        if (!loading.value) applyFiltersFromRoute();
    },
);

const recentGames = computed(() => {
    const allGamesById = new Map(
        allGames.value.map((game) => [String(game?.id ?? ''), game]).filter(([id]) => id),
    );

    return [...favoriteGames.value]
        .reverse()
        .map((favGame) => {
            const gameId = String(favGame?.game_id ?? favGame?.id ?? '');
            const matchedGame = allGamesById.get(gameId);
            if (matchedGame) return matchedGame;

            return {
                id: favGame?.id ?? favGame?.game_id,
                game_id: favGame?.game_id ?? favGame?.id,
                name: favGame?.name || '',
                url_thumb: favGame?.thumbnail_url || favGame?.url_thumb || '',
                provider: favGame?.provider_name || favGame?.provider || '',
                category: favGame?.category_name || favGame?.category || '',
                product: favGame?.product ?? null,
                game_type: favGame?.game_type ?? favGame?.type ?? null,
            };
        })
        .filter((game) => game?.id);
});

const recentGameTypes = computed(() => {
    const seen = new Set();
    recentGames.value.forEach((game) => {
        const category = String(game?.category ?? '').trim();
        if (category) seen.add(category);
    });
    return Array.from(seen);
});

const availableGameTypes = computed(() => {
    if (activeProduct.value === 'recent') return recentGameTypes.value;

    if (!activeProduct.value || activeProduct.value === 'all') {
        const seen = new Set();
        providers.value.forEach((p) => (providerCategoryMap[p] || []).forEach((c) => seen.add(c)));
        return Array.from(seen);
    }
    return providerCategoryMap[activeProduct.value] || [];
});

const filteredGames = computed(() => {
    const product = activeProduct.value;
    const gameType = activeGameType.value;
    const query = searchQuery.value?.toLowerCase() || '';

    if (product === 'recent') {
        return recentGames.value.filter((game) => {
            if (gameType !== 'all' && game.category !== gameType) return false;
            if (
                query &&
                !(
                    game.name?.toLowerCase().includes(query) ||
                    game.category?.toLowerCase().includes(query) ||
                    game.provider?.toLowerCase().includes(query) ||
                    game.product?.toLowerCase().includes(query) ||
                    game.game_type?.toLowerCase().includes(query)
                )
            ) {
                return false;
            }
            return true;
        });
    }

    return allGames.value.filter((game) => {
        if (product && product !== 'all' && game.provider !== product) return false;
        if (gameType !== 'all' && game.category !== gameType) return false;
        if (
            query &&
            !(
                game.name?.toLowerCase().includes(query) ||
                game.category?.toLowerCase().includes(query) ||
                game.provider?.toLowerCase().includes(query) ||
                game.product?.toLowerCase().includes(query) ||
                game.game_type?.toLowerCase().includes(query)
            )
        )
            return false;
        return true;
    });
});

const displayedGames = computed(() => filteredGames.value.slice(0, visibleCount.value));

const onIntersect = (isIntersecting) => {
    if (isIntersecting) visibleCount.value += PAGE_SIZE.value;
};

const changeProduct = (product) => {
    activeProduct.value = product;
    if (product === 'all') {
        const dragonTiger = availableGameTypes.value.find(
            (gt) => normalizeCategoryKey(gt) === 'dragon tiger',
        );
        activeGameType.value = dragonTiger || 'all';
    } else {
        activeGameType.value = 'all';
    }
};

const changeGameType = (gameType) => {
    activeGameType.value = gameType;
};

const formatGameTypeName = (gameType) => {
    return gameType
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const playGame = (game) => {
    setSelectedGame(game);
    router.push({
        name: 'casino-game',
        params: { gameId: game.id },
    });
};

const clearFilters = () => {
    activeProduct.value = 'all';
    activeGameType.value = 'all';
    searchQuery.value = '';
};

watch(isLoggedInUser, async (isLoggedIn) => {
    if (isLoggedIn && favoriteGames.value.length === 0) {
        await refreshFavouriteGames();
    }
    if (!isLoggedIn && activeProduct.value === 'recent') {
        activeProduct.value = 'all';
    }
});

const handleImageError = (event) => {
    event.target.style.display = 'none';
    const media = event.target.closest('.casino-game-tile__media');
    const placeholder = media?.querySelector('.image-placeholder');
    if (placeholder) {
        placeholder.classList.remove('tw-opacity-0');
        placeholder.classList.add('tw-opacity-100');
    }
};
</script>

<style scoped>
.v-container {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
}

.casino-mobile-nav-spacer {
    height: calc(var(--mobile-bottom-nav-height, 56px) + env(safe-area-inset-bottom, 0px) + 8px);
    flex-shrink: 0;
}

.nav-outline-btn {
    color: var(--color-nav) !important;
    border-color: color-mix(in srgb, var(--color-nav) 45%, transparent) !important;
}

.nav-outline-btn:hover {
    background-color: color-mix(in srgb, var(--color-nav) 12%, transparent) !important;
}

.nav-progress :deep(.v-progress-circular__overlay) {
    stroke: var(--color-nav) !important;
}

.casino-game-tile {
    contain: layout style paint;
}

img {
    transition: opacity 0.3s ease;
}

</style>
