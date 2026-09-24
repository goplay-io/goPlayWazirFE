<script setup>
import { computed } from 'vue';

const props = defineProps({
  dateString: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'x-small'
  }
});

const timeDifference = computed(() => {
  if (!props.dateString) return '';
  try {
    const eventDate = new Date(props.dateString);
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < -2) {
      // Event has started
      const startedMinsAgo = Math.abs(diffMins);
      const startedHoursAgo = Math.floor(startedMinsAgo / 60);
      if (startedHoursAgo > 0) {
        return `${startedHoursAgo}h ago`;
      } else {
        return `${startedMinsAgo}m ago`;
      }
    } else if (diffMins <= 2) {
      return 'now';
    } else if (diffHours > 0) {
      return `in ${diffHours}h`;
    } else {
      return `in ${diffMins}m`;
    }
  } catch {
    return '';
  }
});

const chipColor = computed(() => {
  const diff = timeDifference.value;
  if (diff.includes('ago')) {
    return 'success'; // Green for past/live events
  } else if (diff === 'now') {
    return 'warning'; // Yellow for now
  }
  return 'warning'; // Yellow for future events
});
</script>

<template>
  <v-chip :size="size" :color="chipColor" variant="tonal" class="tw-whitespace-nowrap">
    {{ timeDifference }}
  </v-chip>
</template>
