<script setup>
defineProps({
  mode: {
    type: String,
    default: 'inplay',
    validator: (value) => ['inplay', 'upcoming'].includes(value),
  },
  title: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="home-events-section-header">
    <div class="home-events-section-header__inner">
      <span v-if="mode === 'inplay'" class="home-events-section-header__icon home-events-section-header__icon--inplay" aria-hidden="true">
        <v-icon size="12" class="home-events-section-header__play-icon">mdi-play</v-icon>
      </span>
      <span v-else class="home-events-section-header__icon home-events-section-header__icon--upcoming" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <path d="M7,9h2V4H7V9z M9,11c0-0.553-0.447-1-1-1s-1,0.447-1,1s0.447,1,1,1S9,11.553,9,11z M16,8c0-4.419-3.581-8-8-8S0,3.581,0,8 s3.581,8,8,8S16,12.419,16,8z M14,8c0,1.603-0.625,3.109-1.756,4.244C11.109,13.375,9.603,14,8,14s-3.109-0.625-4.244-1.756 C2.625,11.109,2,9.603,2,8s0.625-3.109,1.756-4.244C4.891,2.625,6.397,2,8,2s3.109,0.625,4.244,1.756C13.375,4.891,14,6.397,14,8z" />
        </svg>
      </span>
      <h2 class="home-events-section-header__title">{{ title }}</h2>
    </div>
  </div>
</template>

<style scoped>
.home-events-section-header {
  width: 100%;
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  background: var(--color-header-bg-gradient, linear-gradient(90deg, #1e9146 -13.95%, #2c2c2c 83.91%));
}

.home-events-section-header__inner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.home-events-section-header__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ffffff;
}

.home-events-section-header__icon--inplay {
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  background: #ffffff;
}

.home-events-section-header__play-icon {
  color: var(--color-wazir-green, #49915e) !important;
  margin-left: 1px;
}

.home-events-section-header__icon--upcoming {
  width: 24px;
  height: 24px;
}

.home-events-section-header__title {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: normal;
  text-transform: capitalize;
}
</style>
