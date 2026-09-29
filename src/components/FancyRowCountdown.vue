<template>
  <span class="fancy-row-countdown">
    <svg
      class="fancy-row-countdown__icon"
      width="15"
      height="15"
      viewBox="0 0 15 15"
      aria-hidden="true"
    >
      <circle cx="7.5" cy="7.5" r="5.4" fill="none" stroke="currentColor" stroke-width="1.3" />
      <path d="M7.5 4.1v3.6l2.2 1.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span class="fancy-row-countdown__label">3s</span>
  </span>
</template>

<style scoped>
.fancy-row-countdown {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-shrink: 0;
  color: #d3d3d3;
}

.fancy-row-countdown__icon {
  display: block;
  flex-shrink: 0;
}

.fancy-row-countdown__label {
  color: #ffffff;
  font-size: 14px;
  font-weight: 480;
  line-height: 20px;
  letter-spacing: normal;
}
</style>
