<template>
  <div
    v-if="!authStore.isDemoUser && !shouldHideButton"
    ref="buttonRef"
    class="floating-bonus-btn sm:tw-hidden"
    :class="{ 'floating-bonus-btn--dragging': isDragging }"
    :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @click="onClick"
  >
    <BonusIcon :size="24" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BonusIcon from './BonusIcon.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Routes where the floating bonus button should be hidden
const HIDDEN_ROUTES = [
  /^\/sports\/bet\//,
  /^\/racing\/bet\//,
  /^\/casino\/game\//,
]

const shouldHideButton = computed(() => {
  return HIDDEN_ROUTES.some(pattern => pattern.test(route.path))
})

const BUTTON_SIZE = 44
const EDGE_MARGIN = 16
const DRAG_THRESHOLD = 6
const STORAGE_KEY = 'floating-bonus-btn-pos'
const BOTTOM_NAV_HEIGHT = 60 // matches --mobile-bottom-nav-height in main.css

const buttonRef = ref(null)
const pos = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const hasDragged = ref(false)

let activePointerId = null
let startPointerX = 0
let startPointerY = 0
let startElemX = 0
let startElemY = 0

// ── helpers ──────────────────────────────────────────────────────────────────

const clamp = (val, min, max) => Math.min(Math.max(val, min), max)

function maxY() {
  return window.innerHeight - BOTTOM_NAV_HEIGHT - BUTTON_SIZE - EDGE_MARGIN
}

function defaultPosition() {
  return {
    x: window.innerWidth - BUTTON_SIZE - EDGE_MARGIN,
    y: maxY(),
  }
}

function loadPosition() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return {
          x: clamp(parsed.x, 0, window.innerWidth - BUTTON_SIZE),
          y: clamp(parsed.y, EDGE_MARGIN, maxY()),
        }
      }
    }
  } catch { /* ignore */ }
  return defaultPosition()
}

function savePosition() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos.value))
  } catch { /* ignore */ }
}

function snapToEdge() {
  const midX = window.innerWidth / 2
  pos.value = {
    x: pos.value.x + BUTTON_SIZE / 2 < midX
      ? EDGE_MARGIN
      : window.innerWidth - BUTTON_SIZE - EDGE_MARGIN,
    y: clamp(pos.value.y, EDGE_MARGIN, maxY()),
  }
}

// ── pointer handlers ──────────────────────────────────────────────────────────

function onPointerDown(e) {
  // Only primary button on mouse; all touch/pen pointers
  if (e.pointerType === 'mouse' && e.button !== 0) return

  isDragging.value = false
  hasDragged.value = false
  activePointerId = e.pointerId
  startPointerX = e.clientX
  startPointerY = e.clientY
  startElemX = pos.value.x
  startElemY = pos.value.y

  buttonRef.value?.setPointerCapture(e.pointerId)
}

function onPointerMove(e) {
  if (activePointerId === null || e.pointerId !== activePointerId) return

  const dx = e.clientX - startPointerX
  const dy = e.clientY - startPointerY

  if (!isDragging.value && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
    isDragging.value = true
  }

  if (!isDragging.value) return

  hasDragged.value = true
  pos.value = {
    x: clamp(startElemX + dx, 0, window.innerWidth - BUTTON_SIZE),
    y: clamp(startElemY + dy, EDGE_MARGIN, maxY()),
  }
}

function onPointerUp(e) {
  if (activePointerId === null || e.pointerId !== activePointerId) return
  activePointerId = null

  if (hasDragged.value) {
    snapToEdge()
    savePosition()
  }

  isDragging.value = false
}

function onClick() {
  if (hasDragged.value) return
  router.push('/bonuses')
}

// ── re-clamp on window resize ─────────────────────────────────────────────────

function onResize() {
  pos.value = {
    x: clamp(pos.value.x, 0, window.innerWidth - BUTTON_SIZE),
    y: clamp(pos.value.y, EDGE_MARGIN, maxY()),
  }
}

onMounted(() => {
  pos.value = loadPosition()
  window.addEventListener('resize', onResize, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.floating-bonus-btn {
  position: fixed;
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  background: linear-gradient(
    145deg,
    var(--color-nav) 0%,
    var(--color-nav-deep) 100%
  );
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  z-index: 900;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  transition: background-color 0.16s ease, border-color 0.16s ease,
    box-shadow 0.16s ease, color 0.16s ease;
}

.floating-bonus-btn--dragging {
  cursor: grabbing;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  transition: box-shadow 0.1s ease;
}

.floating-bonus-btn:active:not(.floating-bonus-btn--dragging) {
  background: linear-gradient(
    145deg,
    var(--color-nav-hover) 0%,
    var(--color-nav) 100%
  );
}

@media (min-width: 640px) {
  .floating-bonus-btn {
    display: none;
  }
}
</style>
