<script setup>
const props = defineProps({
  bigWin: {
    type: Object,
    required: true
  },
  animationDelay: {
    type: Number,
    default: 0
  }
});

// Format profit/loss amount
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00';
  return parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Format user name (mask middle part)
const formatUserName = (name) => {
  if (!name) return 'Anonymous';
  if (name.length <= 6) return name;
  const start = name.substring(0, 3);
  const end = name.substring(name.length - 3);
  return `${start}***${end}`;
};

// Get display name (event name for sports, game name for casino)
const getDisplayName = () => {
  return props.bigWin.event_name || 'Unknown';
};

// Get background image URL
const getBackgroundImage = () => {
  if (props.bigWin.url_thumb) {
    return props.bigWin.url_thumb;
  }
  return null;
};

// Check if it's a casino bet
const isCasinoBet = () => {
  return !props.bigWin.market_id && props.bigWin.game_id;
};

</script>

<template>
  <div
    :style="{ 
      animationDelay: `${animationDelay}s`,
      backgroundImage: getBackgroundImage() ? `url(${getBackgroundImage()})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }"
    class="tw-bg-slate-800 tw-rounded-lg tw-px-3 tw-py-2 tw-w-[180px] tw-h-[65px] tw-relative tw-z-10 tw-overflow-hidden tw-opacity-0 tw-animate-slideInUp tw-flex tw-items-center">
    
    <!-- Dark Overlay for text readability -->
    <div class="tw-absolute tw-inset-0 tw-bg-black tw-bg-opacity-60 tw-z-0"></div>

    <!-- Content Container -->
    <div class="tw-relative tw-z-10 tw-flex tw-items-center tw-gap-2 tw-w-full">
      <!-- Game/Event Icon -->
      <div class="tw-flex-shrink-0">
        <div v-if="isCasinoBet() && bigWin.url_thumb" class="tw-w-10 tw-h-10 tw-rounded-lg tw-overflow-hidden tw-border-2 tw-border-white tw-bg-white tw-flex tw-items-center tw-justify-center">
          <img :src="bigWin.url_thumb" :alt="getDisplayName()" class="tw-w-full tw-h-full tw-object-cover" />
        </div>
        <div
          v-else
          class="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-white tw-bg-opacity-20 tw-backdrop-blur-sm tw-border-2 tw-border-white tw-border-opacity-30 tw-flex tw-items-center tw-justify-center">
          <v-icon icon="mdi-trophy" size="20" class="tw-text-yellow-400"></v-icon>
        </div>
      </div>

      <!-- Text Content -->
      <div class="tw-flex-1 tw-min-w-0">
        <!-- Event/Game Name -->
        <h4 class="tw-font-bold tw-text-white tw-text-xs tw-leading-tight tw-mb-0.5 tw-truncate tw-drop-shadow-md">
          {{ getDisplayName() }}
        </h4>
        
        <!-- Win Amount and User Name -->
        <div class="tw-flex tw-items-center tw-gap-1.5 tw-flex-wrap">
          <div class="tw-text-sm tw-font-bold tw-text-green-400 tw-drop-shadow-md">
            {{ formatAmount(bigWin.profit_loss) }}
          </div>
          <div class="tw-text-[10px] tw-text-gray-200 tw-opacity-90 tw-drop-shadow-sm">
            • {{ formatUserName(bigWin.user_name || bigWin.username) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
