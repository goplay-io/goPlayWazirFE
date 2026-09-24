<template>
  <!-- Creative Button Group Container -->
  <div ref="buttonGroupRef"
    class="creative-button-group tw-flex tw-justify-center tw-gap-1 tw-p-2 tw-rounded-lg tw-transition-all tw-duration-500 tw-border-2 tw-border-theme-border tw-shadow-sm"
    @mouseenter="handleGroupHover(true)" @mouseleave="handleGroupHover(false)">
    <!-- Search Button -->
    <div class="" @mouseenter="handleButtonHover('search')" @mouseleave="handleButtonLeave('search')">
      <v-btn ref="searchBtnRef" @click="handleSearchClick" variant="text" icon
        class="creative-btn search-btn tw-relative tw-z-10 tw-rounded-lg" size="small">
        <div class="icon-wrapper">
          <v-icon size="18" class="btn-icon search-icon" :class="{ 'active': activeButton === 'search' }">
            mdi-magnify
          </v-icon>
          <div class="ripple-effect" :class="{ 'animate': searchRipple }"></div>
        </div>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

// Props
const props = defineProps({
  onSearch: {
    type: Function,
    required: true
  }
})

// Emits
const emit = defineEmits(['search', 'rules', 'theme'])

// Stores and router
const router = useRouter()

// Refs
const buttonGroupRef = ref(null)
const searchBtnRef = ref(null)

// Button interaction state
const activeButton = ref(null)
const groupHovered = ref(false)

// Ripple effects
const searchRipple = ref(false)

// Creative button interaction handlers
function handleGroupHover(isHovered) {
  groupHovered.value = isHovered
}

function handleButtonHover(buttonType) {
  activeButton.value = buttonType

  // Add magnetic effect - slightly move other buttons
  if (buttonGroupRef.value) {
    const buttons = buttonGroupRef.value.querySelectorAll('.creative-btn')
    buttons.forEach((btn, index) => {
      const btnType = ['search', 'theme'][index]
      if (btnType !== buttonType) {
        btn.style.transform = 'translateX(2px) scale(0.95)'
      } else {
        btn.style.transform = 'scale(1.1)'
      }
    })
  }
}

function handleButtonLeave(buttonType) {
  activeButton.value = null

  // Reset magnetic effect
  if (buttonGroupRef.value) {
    const buttons = buttonGroupRef.value.querySelectorAll('.creative-btn')
    buttons.forEach(btn => {
      btn.style.transform = 'translateX(0) scale(1)'
    })
  }
}

function triggerRipple(rippleRef) {
  rippleRef.value = true
  setTimeout(() => {
    rippleRef.value = false
  }, 600)
}

function handleSearchClick() {
  triggerRipple(searchRipple)
  setTimeout(() => {
    emit('search')
  }, 150)
}

// Keyboard shortcuts
function handleKeydown(event) {
  if (event.ctrlKey && event.key === 'k') {
    event.preventDefault()
    handleSearchClick()
  } else if (event.altKey && event.key === 't') {
    event.preventDefault()
    handleThemeClick()
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* ===== CREATIVE BUTTON GROUP STYLES ===== */

/* Main container matching User Profile Dropdown style */
.creative-button-group {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border: 2px solid var(--color-border) !important;
  border-color: var(--color-border) !important;
}

/* Fallback border colors if CSS variables fail */
.creative-button-group {
  border: 2px solid #e5e7eb !important;
  /* gray-200 as fallback */
}



/* Ensure border is always visible */
.creative-button-group.tw-border-2 {
  border: 2px solid !important;
  border-color: inherit !important;
}

/* Enhanced creative buttons matching User Profile Dropdown style */
.creative-btn {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  border-radius: 8px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative;
  overflow: visible !important;
  z-index: 10;
}

.creative-btn:hover {
  background: var(--color-surface) !important;
}

Icon wrapper for effects .icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
}

/* Button icons with enhanced animations */
.btn-icon {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  color: var(--color-text-secondary) !important;
  z-index: 2;
  position: relative;
}

.btn-icon.active {
  color: var(--color-primary) !important;
  transform: scale(1.1) rotate(5deg);
}

/* Search icon specific */
.search-icon.active {
  color: #3b82f6 !important;
  /* blue-500 */
  transform: scale(1.1) rotate(15deg);
}

/* Rules icon specific */
.rules-icon.active {
  color: #f59e0b !important;
  /* amber-500 */
  transform: scale(1.1) rotate(-5deg);
}

/* Enhanced theme toggle */
.theme-icon-container {
  position: relative;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.theme-icon {
  position: absolute;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1) !important;
  opacity: 0;
  transform: rotate(-180deg) scale(0.3);
}

.theme-icon.active {
  opacity: 1 !important;
  transform: rotate(0deg) scale(1) !important;
}

.sun-icon.active {
  color: #f59e0b !important;
  /* amber-500 */
  transform: rotate(360deg) scale(1) !important;
}

.moon-icon.active {
  color: #3b82f6 !important;
  /* blue-500 */
  transform: rotate(0deg) scale(1) !important;
}

.sun-icon:not(.active) {
  transform: rotate(-180deg) scale(0.3) !important;
}

.moon-icon:not(.active) {
  transform: rotate(180deg) scale(0.3) !important;
}

/* Ripple effects */
.ripple-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 6px;
  background: radial-gradient(ellipse,
      var(--color-primary) 0%,
      transparent 70%);
  opacity: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
}

.ripple-effect.animate {
  animation: rippleAnimation 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes rippleAnimation {
  0% {
    width: 0;
    height: 0;
    opacity: 0.8;
  }

  50% {
    width: 64px;
    height: 64px;
    opacity: 0.4;
  }

  100% {
    width: 96px;
    height: 96px;
    opacity: 0;
  }
}

/* Remove Vuetify button overlays */
.creative-btn .v-btn__overlay {
  opacity: 0 !important;
}
</style>

