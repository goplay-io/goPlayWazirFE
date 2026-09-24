<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n'
// Import all competition-specific images
import bblImage from '@/assets/competations/BBL.png';
import fifaWorldCupImage from '@/assets/competations/FIFA World Cup.png';
import uefaChampionsLeagueImage from '@/assets/competations/UEFA Champions League.png';
import wbblImage from '@/assets/competations/WBBL.png';

// TODO: Import fallback logos for event types below
// Add your fallback logo imports here, for example:
import footballFallback from '@/assets/competations/Soccer.png';
// import tennisFallback from '@/assets/competations/Tennis.png';
import cricketFallback from '@/assets/competations/Cricket.png';
import generalFallback from '@/assets/competations/General.jpg';
// ... add more as needed

const props = defineProps({
  competition: {
    type: Object,
    required: true
  },
  animationDelay: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['competition-click']);

const handleClick = () => {
  emit('competition-click', props.competition);
};

// Map competition names to their specific images
const competitionImageMap = {
  'BBL': bblImage,
  'FIFA World Cup': fifaWorldCupImage,
  'UEFA Champions League': uefaChampionsLeagueImage,
  'WBBL': wbblImage
};

// Map event type names to their fallback logos
// Update this map by adding your imported fallback logos above and referencing them here
const eventTypeFallbackMap = {
  'Football': footballFallback,
  'Soccer': footballFallback, // Use same image for Soccer
  // 'Tennis': tennisFallback,
  'Cricket': cricketFallback,
  // 'Rugby': rugbyFallback,
  // 'Horse Racing': horseRacingFallback,
  // 'Table Tennis': tableTennisFallback,
  // 'Futsal': futsalFallback,
  // 'Darts': dartsFallback,
  // 'Greyhound Racing': greyhoundRacingFallback,
  // 'Baseball': baseballFallback,
  // 'Basketball': basketballFallback,
  // 'Ice Hockey': iceHockeyFallback,
  // 'Binary': binaryFallback,
  // 'Sports book': sportsBookFallback,
  // 'Kabaddi': kabaddiFallback,
  // 'Casino': casinoFallback,
  // 'Volleyball': volleyballFallback,
  // 'Politics': politicsFallback,
  // 'Mixed Martial Arts': mmaFallback,
};

// Helper function to get fallback image for event type
const getFallbackImage = (eventTypeName) => {
  if (!eventTypeName) return null;
  return eventTypeFallbackMap[eventTypeName] || null;
};

// Get background image: competition-specific, then event type fallback, then general fallback
const imageUrl = computed(() => {
  const competitionName = props.competition.name;
  const competitionImage = competitionImageMap[competitionName];
  if (competitionImage) return competitionImage;

  const eventTypeName = props.competition.event_type_name || props.competition.sportType;
  const fallbackImage = getFallbackImage(eventTypeName);
  if (fallbackImage) return fallbackImage;

  return generalFallback;
});
const { t } = useI18n()
</script>

<template>
  <div 
    @click="handleClick"
    :style="{ 
      animationDelay: `${animationDelay}s`,
      backgroundImage: imageUrl ? `url(${imageUrl})` : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }"
    class="tw-rounded-xl tw-p-5 tw-w-[140px] tw-h-[160px] tw-relative tw-overflow-hidden tw-cursor-pointer tw-group tw-opacity-0 tw-animate-slideInUp tw-transition-all tw-duration-300 hover:tw-scale-105 hover:tw-shadow-2xl">
    
    <!-- Dark Overlay with gradient -->
    <div class="tw-absolute tw-inset-0 tw-bg-gradient-to-b tw-from-black/40 tw-via-black/30 tw-to-black/50 tw-transition-opacity tw-duration-300 group-hover:tw-opacity-60"></div>

    <!-- Content -->
    <div class="tw-relative tw-z-10 tw-h-full tw-flex tw-flex-col tw-justify-between">
      <!-- Competition Name -->
      <div class="tw-flex-1 tw-flex tw-items-start">
        <h3 
          :class="[
            'tw-font-bold tw-text-white tw-leading-tight tw-drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]',
            competition.name.length <= 10 ? 'tw-text-xl' :
              competition.name.length <= 15 ? 'tw-text-lg' :
                competition.name.length <= 20 ? 'tw-text-base' : 'tw-text-sm'
          ]">
          {{ competition.name }}
        </h3>
      </div>

      <!-- Bottom CTA -->
      <div class="tw-mt-auto tw-pt-3 tw-border-t tw-border-white/20">
        <div class="tw-text-xs tw-font-medium tw-text-white tw-flex tw-items-center tw-gap-2 tw-transition-transform tw-duration-200 group-hover:tw-gap-3">
          <span class="tw-drop-shadow-lg">{{ t('components.competitionCard.viewGames') }}</span>
          <v-icon 
            icon="mdi-arrow-right" 
            size="16" 
            class="tw-transition-transform tw-duration-200 group-hover:tw-translate-x-1 tw-drop-shadow-lg">
          </v-icon>
        </div>
      </div>
    </div>
  </div>
</template>
