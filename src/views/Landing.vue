<template>
  <div class="tw-relative tw-w-full tw-h-full tw-min-h-screen landing-wrapper">
    <div class="landing-backdrop"></div>
    <v-container
      fluid
      class="tw-relative tw-px-4 tw-py-1 tw-space-y-8 tw-text-theme-text"
      style="z-index: 10; position: relative;"
    >
      <!-- Demo login / loading state -->
      <Loading v-if="initializing" minHeight="60vh" />

      <div v-else class="tw-space-y-2">
        <!-- Hero section -->
        <v-row class="tw-items-center tw-justify-center tw-gap-y-4">
          <v-col cols="12" md="6" class="tw-flex tw-items-center tw-justify-center">
            <div class="tw-w-full tw-space-y-6 tw-text-center md:tw-text-left">
              <LandingHeroTitle />
              
              <!-- Feature badges -->
              <div class="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-3">
                <div class="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-theme-border tw-bg-theme-surface/60 tw-px-3 tw-py-1">
                  <v-icon size="18" class="tw-text-[var(--color-nav)]">mdi-lightning-bolt</v-icon>
                  <span class="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-theme-text-secondary">
                    {{ t('landing.hero.badgeLiveOdds') }}
                  </span>
                </div>
                <div class="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-theme-border tw-bg-theme-surface/60 tw-px-3 tw-py-1">
                  <v-icon size="18" class="tw-text-sky-400">mdi-shield-check</v-icon>
                  <span class="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-theme-text-secondary">
                    {{ t('landing.hero.badgeSecureWallet') }}
                  </span>
                </div>
              </div>
            </div>
          </v-col>

          <!-- Hero visual -->
          <v-col cols="12" md="6">
            <v-card
              class="tw-relative tw-w-full tw-overflow-hidden tw-rounded-2xl tw-bg-gradient-to-br tw-from-theme-surface tw-via-theme-surface-alt tw-to-black tw-border tw-border-theme-border tw-shadow-xl"
            >
              <div
                ref="heroCarouselWrap"
                class="tw-w-full hero-carousel-wrap"
                :style="{ height: `${heroCarouselHeight}px` }"
              >
                <v-carousel
                  hide-delimiter-background
                  height="100%"
                  cycle
                  show-arrows="hover"
                  interval="10000"
                  class="tw-w-full tw-rounded-2xl"
                >
                  <v-carousel-item>
                    <div class="hero-slide hero-slide--sports">
                      <img class="hero-slide__bg" :src="heroSlideSports" alt="" />
                      <div class="hero-slide__overlay" />
                      <div class="hero-slide__content">
                        <h3>{{ t('landing.hero.slideSportsTitle') }}</h3>
                        <p>{{ t('landing.hero.slideSportsBody') }}</p>
                      </div>
                    </div>
                  </v-carousel-item>

                  <v-carousel-item>
                    <div class="hero-slide hero-slide--casino">
                      <img class="hero-slide__bg" :src="heroSlideCasino" alt="" />
                      <div class="hero-slide__overlay" />
                      <div class="hero-slide__content">
                        <h3>{{ t('landing.hero.slideCasinoTitle') }}</h3>
                        <p>{{ t('landing.hero.slideCasinoBody') }}</p>
                      </div>
                    </div>
                  </v-carousel-item>

                  <v-carousel-item>
                    <div class="hero-slide hero-slide--racing">
                      <img class="hero-slide__bg" :src="heroSlideRacing" alt="" />
                      <div class="hero-slide__overlay" />
                      <div class="hero-slide__content">
                        <h3>{{ t('landing.hero.slideRacingTitle') }}</h3>
                        <p>{{ t('landing.hero.slideRacingBody') }}</p>
                      </div>
                    </div>
                  </v-carousel-item>
                </v-carousel>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Sports / events section -->
        <section id="sports-section" class="tw-space-y-6 !tw-mt-6">
          <div v-if="eventsLoading" class="tw-flex tw-justify-center tw-py-10">
            <Loading minHeight="200px" />
          </div>

          <div v-else class="tw-space-y-6">
            <div>
              <EventSlider
                :event-type-list="eventTypeList"
                :event-list="eventList"
                :show-market-status="false"
                :redirect-to-login-on-event-click="authStore.isDemoPreview"
              />
            </div>

            <div>
              <CompetitionSlider :competitions="competitions" />
            </div>

          </div>
        </section>

        <!-- Gif row above casino -->
        <div class="tw-mb-6">
          <GifRow />
        </div>

        <!-- Casino section -->
        <section class="tw-space-y-6">
          <NewLaunchGames />

          <div class="tw-flex tw-items-center tw-justify-between tw-gap-3">
            <div class="tw-flex tw-items-center tw-gap-3">
              <v-icon class="tw-text-[var(--color-nav)]">mdi-cards-playing-spade</v-icon>
              <div>
                <h2 class="tw-text-xl tw-font-bold">
                  {{ t('landing.casinoSection.title') }}
                </h2>
              </div>
            </div>
            <v-btn
              size="small"
              variant="text"
              class="landing-nav-btn tw-hidden md:tw-inline-flex"
              @click="goToCasinoHome"
            >
              {{ t('landing.casinoSection.ctaCasino') }}
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </div>

          <div v-if="casinoLoading" class="tw-flex tw-justify-center tw-py-8">
            <Loading minHeight="200px" />
          </div>

          <div v-else>
            <div
              v-if="filteredCasinoGames.length"
              class="tw-py-1"
            >
              <!-- Provider tabs (same as casino Home, no category row) -->
              <div class="tw-relative tw-border-b tw-border-theme-border tw-bg-theme-surface tw-mb-3">
                <div class="tw-flex tw-items-center tw-gap-1 tw-overflow-x-auto scrollbar-hide tw-px-1 tw-py-1">
                  <div v-for="product in availableProducts" :key="product" class="tw-flex-shrink-0">
                    <div
                      class="tw-relative tw-overflow-hidden tw-rounded-lg tw-border tw-border-theme-border tw-bg-theme-surface tw-shadow-sm tw-transition-all tw-duration-300 hover:tw-shadow-md hover:tw--translate-y-0.5"
                    >
                      <button
                        @click="changeProduct(product)"
                        type="button"
                        class="tw-flex tw-items-center tw-justify-center tw-gap-1 tw-px-2 tw-py-1.5 tw-text-xs tw-font-semibold tw-whitespace-nowrap tw-transition-all tw-duration-300 tw-no-underline tw-border-0 tw-cursor-pointer"
                        :class="activeCasinoGroup === product
                          ? 'landing-provider-tab-active'
                          : 'landing-provider-tab-inactive'"
                      >
                        <v-icon v-if="isPriorityProduct(product)" icon="mdi-star" size="10" />
                        <v-icon :icon="getProductIcon(product)" size="12" />
                        <span>{{ product }}</span>
                        <v-chip
                          size="x-small"
                          :variant="activeCasinoGroup === product ? 'flat' : 'tonal'"
                          class="tw-ml-1"
                          :class="activeCasinoGroup === product ? 'landing-provider-count-chip-active' : 'landing-provider-count-chip'"
                        >
                          {{ getProductGameCount(product) }}
                        </v-chip>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 md:tw-grid-cols-4 lg:tw-grid-cols-5 xl:tw-grid-cols-6 tw-gap-x-2 tw-gap-y-3">
                <div
                  v-for="game in filteredCasinoGames"
                  :key="game.id"
                  @click="playGame(game)"
                  class="tw-relative tw-overflow-hidden tw-aspect-video tw-bg-transparent tw-rounded-md tw-cursor-pointer hover:tw-scale-[1.02] tw-transition-transform tw-duration-300"
                >
                  <img
                    :src="game.url_thumb"
                    :alt="game.name"
                    loading="lazy"
                    decoding="async"
                    class="tw-w-full tw-h-full tw-object-fill tw-object-center tw-transition-transform tw-duration-300"
                    @error="handleCasinoImageError($event)"
                  />
                  <div
                    class="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black tw-bg-opacity-40 tw-opacity-0 image-placeholder"
                  >
                    <v-icon icon="mdi-cards-variant" size="48" class="tw-text-white" />
                  </div>
                  <div
                    class="tw-absolute tw-inset-0 tw-bg-black tw-bg-opacity-0 hover:tw-bg-opacity-30 tw-transition-all tw-duration-300 tw-flex tw-items-center tw-justify-center"
                  >
                    <v-icon
                      icon="mdi-play-circle"
                      size="40"
                      class="tw-text-white tw-opacity-0 hover:tw-opacity-100 tw-transition-opacity tw-duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="tw-text-center tw-py-6 tw-text-theme-text-secondary tw-text-sm">
              {{ t('landing.casinoSection.noData') }}
            </div>
          </div>
        </section>
      </div>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LandingHeroTitle from '@/components/LandingHeroTitle.vue'
import Loading from '@/components/Loading.vue'
import EventSlider from '@/views/sports/Home/EventSlider.vue'
import CompetitionSlider from '@/views/sports/Home/CompetitionSlider.vue'
import NewLaunchGames from '@/views/sports/Home/NewLaunchGames.vue'
import GifRow from '@/components/GifRow.vue'
import { getEventTypes } from '@/api/event/eventTypes'
import { getCasinoGames } from '@/api/event/casino'
import { sortCasinoGamesByPriority } from '@/utils/casinoGamePriority'
import { useEventTypes } from '@/composables/useEventTypes'
import { useAuthStore } from '@/stores/auth'
import { useEventsStore } from '@/stores/events/events'
import { useSnackbar } from '@/composables/useSnackbar/useSnackbar'
import { useOddsWebSocket } from '@/composables/useOddsWebSocket'
import { useFavoriteGames } from '@/composables/useFavoriteGames';
import { useMarketOdds } from '@/composables/useMarketOdds'
import { useSelectedGame } from '@/composables/useSelectedGame'

import heroSlideSports from '@/assets/landing_slider/sports.webp'
import heroSlideCasino from '@/assets/landing_slider/casino.webp'
import heroSlideRacing from '@/assets/landing_slider/racing.webp'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const eventsStore = useEventsStore()
const { showError } = useSnackbar()
const { getEventTypeName, eventTypes } = useEventTypes()
const { setSelectedGame } = useSelectedGame();

// Keep hero carousel ratio on small screens (avoid "square" look)
const heroCarouselWrap = ref(null)
const heroCarouselHeight = ref(typeof window !== 'undefined' && window.innerWidth < 640 ? 110 : 260)
let heroCarouselResizeObserver = null

const updateHeroCarouselHeight = () => {
  const el = heroCarouselWrap.value
  if (!el) return

  const width = el.clientWidth || 0
  if (!width) return

  // Match the desktop hero "wide" shape on mobile too (avoid square/tall look).
  // Desktop is roughly ~21:9 at 260px height on typical widths.
  const aspectW = 21
  const aspectH = 9
  const hWide = Math.round((width * aspectH) / aspectW)

  // Make the whole slider box shorter on mobile.
  const isMobile = width < 640 // Tailwind "sm" breakpoint
  const maxH = isMobile ? 120 : 260
  const minH = isMobile ? 80 : 180

  heroCarouselHeight.value = Math.min(maxH, Math.max(minH, hWide))
}

// Demo login state
const initializing = ref(true)
const demoLoading = ref(false)

// Sports/events data
const eventTypeList = ref([])
const eventList = ref([])
const eventsLoading = ref(false)

// Live odds via OddsDistributor WebSocket
const { watchForEvents: watchForEventOdds, stopOddsFetching: stopEventOddsFetching } = useOddsWebSocket(
  () => eventList.value
)

// Casino: API structure only (Provider → Category → Games)
const casinoLoading = ref(false)
const casinoGamesData = ref({})
const activeCasinoGroup = ref('')

const availableProducts = computed(() => Object.keys(casinoGamesData.value))

watch(
  availableProducts,
  (products) => {
    if (!products.length) {
      activeCasinoGroup.value = ''
      return
    }
    if (!activeCasinoGroup.value || !products.includes(activeCasinoGroup.value)) {
      activeCasinoGroup.value = products[0]
    }
  },
  { immediate: true },
)

const filteredCasinoGames = computed(() => {
  const data = casinoGamesData.value
  const provider = activeCasinoGroup.value
  if (!provider) return []
  const providerData = data[provider]
  if (!providerData || typeof providerData !== 'object') return []
  const games = []
  Object.keys(providerData).forEach((category) => {
    const list = Array.isArray(providerData[category])
      ? sortCasinoGamesByPriority(providerData[category])
      : []
    games.push(...list)
  })
  return games
})

function changeProduct(product) {
  activeCasinoGroup.value = product
}

function isPriorityProduct(product) {
  const priorityProducts = ['MAC88', 'MAC EXCITE', 'MAC88 VIRTUALS', 'COLOR PREDICTION', 'FUN GAMES']
  return priorityProducts.includes(product)
}

function getProductGameCount(provider) {
  const providerData = casinoGamesData.value[provider]
  if (!providerData || typeof providerData !== 'object') return 0
  return Object.values(providerData).reduce((sum, cat) => sum + (Array.isArray(cat) ? cat.length : 0), 0)
}

function getProductIcon(product) {
  const icons = {
    'MAC88': 'mdi-cards-playing-spade',
    'MAC EXCITE': 'mdi-lightning-bolt',
    'MAC88 VIRTUALS': 'mdi-virtual-reality',
    'COLOR PREDICTION': 'mdi-palette',
    'FUN GAMES': 'mdi-gamepad-variant',
    'EVOLUTION': 'mdi-cards-variant',
    'PRAGMATIC': 'mdi-diamond-stone',
    'EZUGI': 'mdi-crown',
  }
  return icons[product] || 'mdi-casino-chip'
}

function playGame(game) {
  setSelectedGame(game);
  router.push({ name: 'casino-game', params: { gameId: game.id } })
}

function handleCasinoImageError(event) {
  event.target.style.display = 'none'
  const placeholder = event.target.nextElementSibling
  if (placeholder?.classList?.contains('image-placeholder')) {
    placeholder.classList.remove('tw-opacity-0')
    placeholder.classList.add('tw-opacity-100')
  }
}

// Group events by event type (same logic as Featured.vue)
const groupEventsByType = (events) => {
  const grouped = {}
  events.forEach((event) => {
    const eventTypeId = event.event_type_id
    const eventTypeName = getEventTypeName(eventTypeId) || `Event Type ${eventTypeId}`

    if (!grouped[eventTypeId]) {
      grouped[eventTypeId] = {
        id: eventTypeId,
        name: eventTypeName,
        events: [],
      }
    }

    grouped[eventTypeId].events.push(event)
  })

  return grouped
}

// Copied from Featured.vue
const competitions = computed(() => {
  if (!Array.isArray(eventList.value) || eventList.value.length === 0) {
    return []
  }

  const featuredEvents = eventList.value.filter(
    (event) => event.is_featured === true || event.is_featured === 1,
  )

  const groupedEvents = groupEventsByType(featuredEvents)
  const competitionMap = new Map()

  Object.values(groupedEvents).forEach((group) => {
    group.events.forEach((event) => {
      if (event.competition_name && event.competition_name.trim() !== '') {
        if (!competitionMap.has(event.competition_name)) {
          competitionMap.set(event.competition_name, {
            sportType: group.name,
            event_type_id: event.event_type_id,
            competition_id: event.competition_id ?? null,
          })
        }
      }
    })
  })

  return Array.from(competitionMap.entries())
    .map(([name, data]) => ({
      name,
      sportType: data.sportType,
      event_type_id: data.event_type_id,
      competition_id: data.competition_id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const goToCasinoHome = () => {
  router.push({ name: 'casino-home' })
}

const loadSportsData = async () => {
  eventsLoading.value = true
  try {
    const [res, eventRows] = await Promise.all([
      getEventTypes(),
      eventsStore.fetchAllEvents()
    ])
    eventTypeList.value = res?.data?.menu || res?.menu || []
    eventList.value = Array.isArray(eventRows) ? eventRows : []
  } catch (error) {
    console.error('Error loading sports data for landing:', error)
    showError('Failed to load sports events for demo.')
  } finally {
    eventsLoading.value = false
  }
}

const loadCasinoData = async () => {
  casinoLoading.value = true
  try {
    const response = await getCasinoGames()
    let responseData = response
    if (response?.data && typeof response.data === 'object') {
      responseData = response.data
    }
    if (responseData?.data && typeof responseData.data === 'object') {
      responseData = responseData.data
    }
    casinoGamesData.value = responseData || {}
  } catch (error) {
    console.error('Error loading casino data for landing:', error)
  } finally {
    casinoLoading.value = false
  }
}

const handleDemoLogin = async (force = false) => {
  if (demoLoading.value) return

  if (!force && authStore.isAuthenticated) {
    return
  }

  demoLoading.value = true
  try {
    // Landing uses a silent "preview demo" token (does NOT count as logged-in)
    await authStore.demoLoginPreview()
    // Demo login successful - no snackbar message needed
  } catch (error) {
    console.error('Landing demo login error:', error)
    const message = error?.message || 'Failed to start demo session.'
    showError(message)
  } finally {
    demoLoading.value = false
  }
}

const initializeLanding = async () => {
  try {
    const tasks = [loadSportsData(), loadCasinoData()]
    // Don't block sports/events fetch on demo login.
    if (!authStore.isAuthenticated) {
      tasks.push(handleDemoLogin(false))
    }
    await Promise.all(tasks)
  } finally {
    initializing.value = false
  }
}

onMounted(() => {
  updateHeroCarouselHeight()
  if (typeof ResizeObserver !== 'undefined' && heroCarouselWrap.value) {
    heroCarouselResizeObserver = new ResizeObserver(() => {
      updateHeroCarouselHeight()
    })
    heroCarouselResizeObserver.observe(heroCarouselWrap.value)
  }
  initializeLanding()
})

onUnmounted(() => {
  // Stop odds polling when leaving landing page
  stopEventOddsFetching()
  heroCarouselResizeObserver?.disconnect?.()
  heroCarouselResizeObserver = null
})

// Start watching events for odds once component is mounted and events load
watchForEventOdds()
</script>

<style scoped>
.landing-wrapper {
  position: relative;
}

.landing-backdrop {
  position: fixed;
  inset: 0;
  background-color: var(--color-background);
  opacity: 0.4;
  z-index: 6;
  pointer-events: none;
}

.hero-carousel-wrap :deep(.v-carousel),
.hero-carousel-wrap :deep(.v-window),
.hero-carousel-wrap :deep(.v-window__container),
.hero-carousel-wrap :deep(.v-carousel-item) {
  height: 100% !important;
}

.hero-slide {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  padding: 1.25rem;
  background-size: cover;
  background-position: center;
}

.hero-slide--sports {
  background-image: none;
}

.hero-slide--casino {
  background-image: none;
}

.hero-slide--racing {
  background-image: none;
}

.hero-slide__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.hero-slide__overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.18), transparent 55%);
}

.hero-slide__content {
  position: relative;
  color: white;
  max-width: 260px;
}

.hero-slide__content h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.hero-slide__content p {
  font-size: 0.8rem;
  opacity: 0.9;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.landing-nav-btn {
  color: var(--color-nav) !important;
}

.landing-nav-btn:hover {
  background-color: color-mix(in srgb, var(--color-nav) 12%, transparent) !important;
}

.landing-provider-tab-active {
  background-image: linear-gradient(to right, var(--color-nav), var(--color-nav-hover));
  color: var(--color-nav-text) !important;
}

.landing-provider-tab-inactive {
  background-color: var(--color-surface-alt);
  color: var(--color-text) !important;
}

.landing-provider-tab-inactive:hover {
  background-color: color-mix(in srgb, var(--color-nav) 12%, transparent) !important;
  color: var(--color-nav) !important;
}

.landing-provider-count-chip {
  background-color: color-mix(in srgb, var(--color-nav) 14%, transparent) !important;
  color: var(--color-nav) !important;
  border: 1px solid color-mix(in srgb, var(--color-nav) 35%, transparent) !important;
}

.landing-provider-count-chip-active {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.35) !important;
}

@media (max-width: 640px) {
  .hero-slide {
    padding: 0.75rem;
    align-items: flex-end;
  }

  .hero-slide__content {
    max-width: 220px;
  }

  .hero-slide__content h3 {
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .hero-slide__content p {
    font-size: 0.75rem;
  }
}
</style>
