<template>
    <v-container fluid class="casino-page tw-w-full tw-max-w-none tw-px-0 tw-pb-2 md:tw-pb-4 tw-pt-0 md:tw-pt-0">
        <div class="casino-listing-top-bar">
            <button type="button" class="casino-mobile-back" aria-label="Back" @click="goBack">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true">
                    <path d="M5.3673 11.2346L0 5.8673L5.3673 0.5L6.32 1.4527L1.90539 5.8673L6.32 10.2819L5.3673 11.2346Z" fill="#49915e" />
                </svg>
            </button>
            <h1 class="casino-listing-top-bar__title">
                {{ t('casino.home.title') }}
            </h1>
            <CasinoSearch
                v-model="searchQuery"
                :result-count="filteredGames.length"
                :games="filteredGames"
                placeholder="Search Games (Atleast 3 chars.....)"
                class="casino-listing-top-bar__search"
                @game-selected="playGame"
            />
        </div>

        <div class="casino-page-body tw-px-1 md:tw-px-0">
            <Loading v-if="loading" />

            <div v-else>
                <div class="casino-tabs-stack">
                    <CasinoTabsL1Rail
                        :items="productFilterItems"
                        :active-key="activeProduct"
                        @select="changeProduct"
                    />
                </div>

                <!-- Games: ALL = category sections; provider = flat grid -->
                <div v-if="filteredGames.length > 0">
                    <template v-if="showCategorySections">
                        <section
                            v-for="section in displayedSections"
                            :key="section.title"
                            class="casino-category-section"
                        >
                            <h2 class="casino-category-section__title">{{ section.title }}</h2>
                            <div class="casino-games-grid">
                                <div
                                    v-for="(game, index) in section.games"
                                    :key="game.id"
                                    v-memo="[game.id]"
                                    class="casino-game-tile"
                                    @click="playGame(game)"
                                >
                                    <div class="casino-game-tile__media">
                                        <img
                                            :src="game.url_thumb"
                                            :alt="game.name"
                                            loading="lazy"
                                            decoding="async"
                                            :fetchpriority="index < 5 ? 'high' : 'low'"
                                            @error="handleImageError($event)"
                                        />
                                        <div
                                            class="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/50 tw-opacity-0 image-placeholder">
                                            <v-icon icon="mdi-cards-variant" size="36" class="tw-text-white"></v-icon>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </template>

                    <div v-else class="casino-games-grid">
                        <div
                            v-for="(game, index) in displayedGames"
                            :key="game.id"
                            v-memo="[game.id]"
                            class="casino-game-tile"
                            @click="playGame(game)"
                        >
                            <div class="casino-game-tile__media">
                                <img
                                    :src="game.url_thumb"
                                    :alt="game.name"
                                    loading="lazy"
                                    decoding="async"
                                    :fetchpriority="index < 6 ? 'high' : 'low'"
                                    @error="handleImageError($event)"
                                />
                                <div
                                    class="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/50 tw-opacity-0 image-placeholder">
                                    <v-icon icon="mdi-cards-variant" size="36" class="tw-text-white"></v-icon>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        v-if="hasMoreGames"
                        v-intersect="onIntersect"
                        class="tw-flex tw-justify-center tw-items-center tw-py-2 md:tw-py-4"
                    >
                        <v-progress-circular indeterminate class="nav-progress" size="28" />
                    </div>
                </div>

                <!-- Empty state -->
                <div v-else class="tw-text-center tw-py-6 md:tw-py-8 tw-px-3">
                    <v-icon icon="mdi-casino-chip" size="52"
                        class="tw-mb-3 tw-text-white/40"></v-icon>
                    <h3 class="tw-mb-1.5 tw-text-lg tw-font-semibold tw-text-white">{{
                        t('casino.home.noGamesFound') }}</h3>
                    <p class="tw-mx-auto tw-max-w-md tw-text-white/60">
                        {{ searchQuery ? t('casino.home.noGamesSearchDescription') :
                            t('casino.home.noGamesFilterDescription') }}
                    </p>
                    <v-btn v-if="searchQuery || activeProduct !== 'all'" variant="outlined"
                        class="tw-mt-4 nav-outline-btn" @click="clearFilters">
                        {{ t('casino.home.clearFilters') }}
                    </v-btn>
                </div>
            </div>
        </div>
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
import Loading from '@/components/Loading.vue';
import useDevices from '@/composables/useDevices';
import { sortCasinoGamesByPriority } from '@/utils/casinoGamePriority';

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
const searchQuery = ref('');
const PAGE_SIZE = computed(() => (isMobile.value ? 12 : 24));
const visibleCount = ref(PAGE_SIZE.value);
const isLoggedInUser = computed(() => authStore.isRealAuthenticated);

const normalizeProviderKey = (value) => String(value ?? '').trim().toLowerCase();

const applyFiltersFromRoute = () => {
    const providerFromQuery = String(route.query.provider ?? '').trim();

    if (!providerFromQuery) return;

    if (normalizeProviderKey(providerFromQuery) === 'all') {
        activeProduct.value = 'all';
        return;
    }

    const matchedProvider = providers.value.find(
        (provider) => normalizeProviderKey(provider) === normalizeProviderKey(providerFromQuery),
    );
    if (matchedProvider) activeProduct.value = matchedProvider;
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

watch(
    () => route.query.provider,
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

const filteredGames = computed(() => {
    const product = activeProduct.value;
    const query = searchQuery.value?.toLowerCase() || '';

    const matchesQuery = (game) =>
        !query ||
        game.name?.toLowerCase().includes(query) ||
        game.category?.toLowerCase().includes(query) ||
        game.provider?.toLowerCase().includes(query) ||
        game.product?.toLowerCase().includes(query) ||
        game.game_type?.toLowerCase().includes(query);

    if (product === 'recent') {
        return recentGames.value.filter(matchesQuery);
    }

    return allGames.value.filter((game) => {
        if (product && product !== 'all' && game.provider !== product) return false;
        return matchesQuery(game);
    });
});

const formatSectionTitle = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return 'OTHER';
    return raw
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .toUpperCase();
};

const showCategorySections = computed(
    () => activeProduct.value === 'all' && !searchQuery.value.trim(),
);

/** ALL view: one section per provider (Fantasy11, MAC88 Live, …) in tab order */
const gamesByCategory = computed(() => {
    const map = new Map();
    filteredGames.value.forEach((game) => {
        const key = String(game.provider || game.product || 'Other').trim() || 'Other';
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(game);
    });

    const orderedKeys = [
        ...providers.value.filter((p) => map.has(p)),
        ...[...map.keys()].filter((k) => !providers.value.includes(k)),
    ];

    return orderedKeys.map((key) => ({
        title: formatSectionTitle(key),
        games: map.get(key) || [],
    }));
});

const visibleSectionCount = ref(4);

const displayedGames = computed(() => filteredGames.value.slice(0, visibleCount.value));

const displayedSections = computed(() => {
    if (!showCategorySections.value) return [];
    return gamesByCategory.value.slice(0, visibleSectionCount.value);
});

const hasMoreGames = computed(() => {
    if (showCategorySections.value) {
        return visibleSectionCount.value < gamesByCategory.value.length;
    }
    return displayedGames.value.length < filteredGames.value.length;
});

const onIntersect = (isIntersecting) => {
    if (!isIntersecting) return;
    if (showCategorySections.value) {
        visibleSectionCount.value += 3;
        return;
    }
    visibleCount.value += PAGE_SIZE.value;
};

watch([activeProduct, searchQuery], () => {
    visibleCount.value = PAGE_SIZE.value;
    visibleSectionCount.value = 4;
});

const changeProduct = (product) => {
    activeProduct.value = product;
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

function goBack() {
    if (window.history.length > 1) router.back()
    else router.push('/sports/live')
}

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
