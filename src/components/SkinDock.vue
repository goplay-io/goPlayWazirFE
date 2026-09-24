<template>
  <aside
    v-if="visible && ready && pos"
    class="skin-dock"
    :class="{
      'is-expanded': expanded,
      'is-dragging': isDragging,
      'is-left': opensToRight,
    }"
    :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
    aria-label="Switch site skin"
  >
    <button
      v-if="expanded"
      type="button"
      class="skin-dock-backdrop"
      aria-label="Close skin switcher"
      @click="collapse"
    />

    <div class="skin-dock-orbit">
      <a
        v-for="(skin, index) in partnerSkins"
        :key="skin.key"
        :href="skin.url"
        class="skin-dock-item"
        :class="{ 'is-active': skin.key === currentSkin }"
        :style="fanStyle(index)"
        :title="skin.label"
        :tabindex="expanded ? 0 : -1"
        :aria-hidden="expanded ? undefined : 'true'"
        :aria-current="skin.key === currentSkin ? 'true' : undefined"
      >
        <img
          :key="`${skin.key}-${skinIconSrc(skin.icon, skin.key)}`"
          :src="skinIconSrc(skin.icon, skin.key)"
          :alt="skin.label"
          class="skin-dock-icon"
          draggable="false"
          @error="(event) => onSkinIconError(event, skin.key)"
        />
      </a>

      <button
        type="button"
        class="skin-dock-fab"
        :aria-expanded="expanded"
        :aria-label="expanded ? 'Hide skin switcher' : 'Show skin switcher'"
        @pointerdown="onPointerDown"
        @click="onFabClick"
      >
        <img
          :key="`fab-${fabIconSrc}`"
          :src="fabIconSrc"
          :alt="fabLabel"
          class="skin-dock-fab-icon"
          draggable="false"
          @error="(event) => onSkinIconError(event, 'fab')"
        />
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  skins,
  getCurrentSkinKey,
  resolveSkinIcon,
  FALLBACK_SKIN_ICON,
} from '@/constants/skins.js'

const route = useRoute()
const failedIconKeys = ref(new Set())

function skinIconSrc(icon, cacheKey) {
  if (cacheKey && failedIconKeys.value.has(cacheKey)) return FALLBACK_SKIN_ICON
  return resolveSkinIcon(icon)
}

function onSkinIconError(event, cacheKey) {
  const img = event.target
  if (!img) return
  if (cacheKey) failedIconKeys.value = new Set([...failedIconKeys.value, cacheKey])
  img.src = FALLBACK_SKIN_ICON
}

const expanded = ref(false)
const currentSkin = computed(() => getCurrentSkinKey())
const currentSkinEntry = computed(() =>
  skins.find((skin) => skin.key === currentSkin.value),
)
const fabIconSrc = computed(() => skinIconSrc(currentSkinEntry.value?.icon, 'fab'))
const fabLabel = computed(() => currentSkinEntry.value?.label || 'Site')

watch(
  () => currentSkinEntry.value?.icon,
  () => {
    if (!failedIconKeys.value.has('fab')) return
    const next = new Set(failedIconKeys.value)
    next.delete('fab')
    failedIconKeys.value = next
  },
)

const DOCK_SIZE_DESKTOP = 96
const DOCK_SIZE_MOBILE = 76
const EDGE_MARGIN = 12
const HEADER_HEIGHT = 60
const DRAG_THRESHOLD = 6
const STORAGE_KEY = 'skin-dock-pos-v4'

const pos = ref(null)
const ready = ref(false)
const isDragging = ref(false)
const hasDragged = ref(false)

let activePointerId = null
let startPointerX = 0
let startPointerY = 0
let startElemX = 0
let startElemY = 0

const clamp = (val, min, max) => {
  if (!(max >= min)) return min
  return Math.min(Math.max(val, min), max)
}

function isDesktop() {
  return typeof window !== 'undefined' && window.innerWidth >= 1024
}

function dockSize() {
  return isDesktop() ? DOCK_SIZE_DESKTOP : DOCK_SIZE_MOBILE
}

function leftEdgeX() {
  return EDGE_MARGIN
}

function rightEdgeX() {
  return window.innerWidth - dockSize() - EDGE_MARGIN
}

function parseMobileBottomNavOffset() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--mobile-bottom-nav-offset')
    .trim()
  if (!raw) return 130
  const match = raw.match(/([\d.]+)px/)
  return match ? parseFloat(match[1]) : 130
}

function bottomInset() {
  // Desktop: sit above lower content (near Trending Games / marked red line)
  if (isDesktop()) return 120
  // Mobile: allow FAB a bit lower than the full bottom-nav offset
  return Math.max(56, parseMobileBottomNavOffset() - 32)
}

/** Keep below header so the FAB is never covered by the app bar. */
function minY() {
  return isDesktop() ? HEADER_HEIGHT + EDGE_MARGIN : EDGE_MARGIN
}

function maxY() {
  return Math.max(minY(), window.innerHeight - dockSize() - bottomInset())
}

function defaultPosition() {
  return {
    x: rightEdgeX(),
    // Desktop + mobile: bottom-right (drag up/down within the content area)
    y: maxY(),
  }
}

function normalizePosition(next) {
  return {
    x: clamp(next.x, 0, Math.max(0, window.innerWidth - dockSize())),
    y: clamp(next.y, minY(), maxY()),
  }
}

function loadPosition() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y)) {
        return normalizePosition(parsed)
      }
    }
  } catch { /* ignore */ }
  return defaultPosition()
}

function savePosition() {
  if (!pos.value) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos.value))
  } catch { /* ignore */ }
}

/** Desktop always snaps right so it never hides under the sidebar. */
function snapToEdge() {
  if (!pos.value) return
  const mid = window.innerWidth / 2
  const preferLeft = !isDesktop() && pos.value.x + dockSize() / 2 < mid
  pos.value = normalizePosition({
    x: preferLeft ? leftEdgeX() : rightEdgeX(),
    y: pos.value.y,
  })
}

function endDrag() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
  activePointerId = null
  isDragging.value = false
}

function onPointerDown(e) {
  if (!pos.value) return
  if (e.pointerType === 'mouse' && e.button !== 0) return

  e.preventDefault()

  isDragging.value = false
  hasDragged.value = false
  activePointerId = e.pointerId
  startPointerX = e.clientX
  startPointerY = e.clientY
  startElemX = pos.value.x
  startElemY = pos.value.y

  try {
    e.currentTarget?.setPointerCapture(e.pointerId)
  } catch { /* ignore */ }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function onPointerMove(e) {
  if (!pos.value || activePointerId === null || e.pointerId !== activePointerId) return

  const dx = e.clientX - startPointerX
  const dy = e.clientY - startPointerY

  if (!isDragging.value && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
    isDragging.value = true
    if (expanded.value) collapse()
  }

  if (!isDragging.value) return

  e.preventDefault()
  hasDragged.value = true
  pos.value = normalizePosition({
    x: startElemX + dx,
    y: startElemY + dy,
  })
}

function onPointerUp(e) {
  if (activePointerId === null || e.pointerId !== activePointerId) return

  if (hasDragged.value) {
    snapToEdge()
    savePosition()
  }

  endDrag()
}

function onFabClick() {
  if (hasDragged.value) return
  toggle()
}

function onResize() {
  if (!pos.value) return
  const mid = window.innerWidth / 2
  const preferLeft = !isDesktop() && pos.value.x + dockSize() / 2 < mid
  pos.value = normalizePosition({
    x: preferLeft ? leftEdgeX() : rightEdgeX(),
    y: pos.value.y,
  })
}

onMounted(() => {
  pos.value = loadPosition()
  ready.value = true
  window.addEventListener('resize', onResize, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  endDrag()
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
  }
})

/**
 * 210° arc left of the FAB, symmetric (±105°).
 * Radius sized for modest gaps — not stretched out.
 */
function computePartnerFanLayout({ index, total, flipX, desktop, hubY }) {
  const n = Math.max(1, total)
  let itemPx = desktop ? 64 : 58
  if (n > 9) itemPx -= desktop ? 6 : 5
  if (n > 12) itemPx -= desktop ? 4 : 4
  itemPx = Math.max(desktop ? 44 : 40, itemPx)

  const dualRing = n > 13
  const innerCount = dualRing ? Math.ceil(n / 2) : n
  const outer = dualRing && index >= innerCount
  const ringIndex = outer ? index - innerCount : index
  const ringN = outer ? n - innerCount : innerCount

  const fanSweepDeg = 210
  const halfSweep = fanSweepDeg / 2
  const upDeg = halfSweep
  const downDeg = halfSweep

  const sweepRad = (fanSweepDeg * Math.PI) / 180
  // ~0.72× icon size along the arc → tighter packing, less “going out”.
  const step = itemPx * 0.72
  let radius = ringN <= 1
    ? (desktop ? 88 : 80)
    : (step * (ringN - 1)) / sweepRad
  radius = Math.max(desktop ? 82 : 76, Math.min(desktop ? 118 : 104, radius))
  if (outer) radius += desktop ? 36 : 30

  const t = ringN <= 1 ? 0.5 : ringIndex / (ringN - 1)
  const fanAngleDeg = ringN <= 1 ? 0 : -upDeg + t * (upDeg + downDeg)
  const fanRad = (fanAngleDeg * Math.PI) / 180
  return {
    itemPx,
    tx: -Math.cos(fanRad) * radius * flipX,
    ty: Math.sin(fanRad) * radius,
  }
}

/** API order; hide the skin for the site you're already on. */
const partnerSkins = computed(() =>
  skins.filter((skin) => skin.key !== currentSkin.value),
)

const opensToRight = computed(() => {
  if (typeof window === 'undefined' || !pos.value) return false
  const mid = window.innerWidth / 2
  return pos.value.x + dockSize() / 2 < mid
})

const fanStyle = (index) => {
  const flipX = opensToRight.value ? -1 : 1
  const hubY = pos.value ? pos.value.y + dockSize() / 2 : undefined
  const { itemPx, tx, ty } = computePartnerFanLayout({
    index,
    total: partnerSkins.value.length,
    flipX,
    desktop: isDesktop(),
    hubY,
  })
  const half = itemPx / 2
  return {
    '--tx': `${tx.toFixed(1)}px`,
    '--ty': `${ty.toFixed(1)}px`,
    '--fan-i': index,
    '--item-size': `${itemPx}px`,
    '--item-half': `${half}px`,
  }
}

const HIDDEN_ROUTES = [
  /^\/sports\/bet\//,
  /^\/racing\/bet\//,
  /^\/casino\/game\//,
  /^\/sports-book/,
]

const visible = computed(() =>
  partnerSkins.value.length > 0
  && !HIDDEN_ROUTES.some((pattern) => pattern.test(route.path)),
)

const collapse = () => {
  expanded.value = false
}

const toggle = () => {
  expanded.value = !expanded.value
}

const onKeydown = (event) => {
  if (event.key === 'Escape') collapse()
}

watch(expanded, (isOpen) => {
  if (typeof window === 'undefined') return
  if (isOpen) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

watch(visible, (show) => {
  if (!show) collapse()
})

</script>

<style scoped>
.skin-dock {
  position: fixed;
  z-index: 3000;
  pointer-events: none;
}

.skin-dock.is-dragging {
  z-index: 3100;
  opacity: 1;
  visibility: visible;
}

.skin-dock-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: default;
  pointer-events: auto;
}

.skin-dock-orbit {
  position: relative;
  z-index: 1;
  width: 76px;
  height: 76px;
  pointer-events: none;
}

.skin-dock-fab {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 9999px;
  background: transparent;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  pointer-events: auto;
  filter: drop-shadow(0 0 10px rgba(40, 221, 67, 0.55));
  transition: transform 0.2s ease, filter 0.2s ease;
}

.skin-dock.is-dragging .skin-dock-fab {
  cursor: grabbing;
  transform: scale(1.08);
  opacity: 1;
  visibility: visible;
  filter: drop-shadow(0 4px 16px rgba(40, 221, 67, 0.85));
  transition: filter 0.1s ease;
}

.skin-dock:not(.is-dragging) .skin-dock-fab:hover {
  transform: scale(1.06);
  filter: drop-shadow(0 0 14px rgba(40, 221, 67, 0.75));
}

.skin-dock:not(.is-dragging) .skin-dock-fab:active {
  transform: scale(0.96);
}

.skin-dock.is-expanded .skin-dock-fab {
  filter: drop-shadow(0 0 16px rgba(40, 221, 67, 0.85));
}

.skin-dock-fab-icon {
  width: 76px;
  height: 78px;
  object-fit: contain;
  display: block;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  user-drag: none;
}

@media (min-width: 1024px) {
  .skin-dock-orbit,
  .skin-dock-fab {
    width: 96px;
    height: 96px;
  }

  .skin-dock-fab-icon {
    width: 96px;
    height: 100px;
  }
}

.skin-dock-item {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--item-size, 68px);
  height: var(--item-size, 68px);
  margin: calc(var(--item-half, 34px) * -1) 0 0 calc(var(--item-half, 34px) * -1);
  border-radius: 9999px;
  text-decoration: none;
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
  overflow: visible;
  transform: translate(0, 0) scale(0.3);
  transition:
    opacity 0.22s ease,
    transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s linear 0.34s;
}

.skin-dock.is-expanded .skin-dock-item {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
  transform: translate(var(--tx), var(--ty)) scale(1);
  transition-delay: calc(var(--fan-i, 0) * 40ms);
  transition-property: opacity, transform, visibility;
}

.skin-dock-item:hover .skin-dock-icon {
  transform: scale(1.06);
}

.skin-dock-item.is-active .skin-dock-icon {
  outline: 1.5px solid rgba(40, 221, 67, 0.85);
  outline-offset: 1px;
  border-radius: 9999px;
}

.skin-dock-icon {
  width: var(--item-size, 68px);
  height: var(--item-size, 68px);
  object-fit: contain;
  display: block;
  pointer-events: none;
  user-select: none;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

@media (max-width: 639px) {
  .skin-dock-orbit,
  .skin-dock-fab {
    width: 72px;
    height: 72px;
  }

  .skin-dock-fab-icon {
    width: 72px;
    height: 74px;
  }
}
</style>
