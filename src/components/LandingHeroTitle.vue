<template>
  <div class="tw-space-y-3 tw-text-center">
    <h1
      ref="heroHeading"
      class="tw-text-5xl md:tw-text-6xl tw-font-bold tw-leading-[1.05]"
    >
      <span ref="yourWord" class="your-word">Your</span>
      <span
        ref="sportsHeroLabel"
        class="sports-word"
        aria-label="Sports"
        role="text"
      >
        <span aria-hidden="true" class="sports-word__text">
          <span
            ref="sportsBat"
            class="sports-word__bat"
            aria-hidden="true"
          />
          <span ref="sportsPrefix" class="sports-word__chunk">
            <span>S</span><span ref="sportsP">p</span>
          </span>
          <span ref="sportsOSlot" class="sports-word__o-slot" aria-hidden="true">
            <img ref="sportsBall" :src="cricketballSvg" class="sports-word__ball" aria-hidden="true" alt="" />
          </span>
          <span ref="sportsSuffix" class="sports-word__chunk">rts</span>
        </span>
      </span>
      &<br />
      <span
        ref="casinoHeroLabel"
        class="casino-word"
        aria-label="Casino"
        role="text"
      >
        <span ref="casinoText" class="casino-word__label" aria-hidden="true">
          <span ref="casinoPrefix" class="casino-word__chunk">Casin</span>
          <span ref="casinoOSlot" class="casino-word__o-slot" aria-hidden="true">
            <span ref="casinoWheel" class="casino-word__wheel" aria-hidden="true">
              <span class="casino-word__wheel-inner" aria-hidden="true" />
              <span class="casino-word__wheel-hub" aria-hidden="true" />
            </span>
          </span>
        </span>
      </span>
      hub.
    </h1>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import cricketballSvg from '@/assets/cricketball.svg'

const heroHeading = ref(null)
const yourWord = ref(null)
const sportsHeroLabel = ref(null)
const casinoHeroLabel = ref(null)
const casinoText = ref(null)

let heroGsapCtx = null

const sportsBat = ref(null)
const sportsPrefix = ref(null)
const sportsP = ref(null)
const sportsOSlot = ref(null)
const sportsBall = ref(null)
const sportsSuffix = ref(null)

const casinoPrefix = ref(null)
const casinoOSlot = ref(null)
const casinoWheel = ref(null)

const animateHeroHeading = async () => {
  await nextTick()

  if (!heroHeading.value || !sportsHeroLabel.value || !casinoHeroLabel.value) return

  heroGsapCtx?.revert()
  heroGsapCtx = gsap.context(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const batEl = sportsBat.value
    const yourEl = yourWord.value
    const prefixEl = sportsPrefix.value
    const pEl = sportsP.value
    const suffixEl = sportsSuffix.value
    const slotEl = sportsOSlot.value
    const ballEl = sportsBall.value
    const casinoTextEl = casinoText.value
    const casinoPrefixEl = casinoPrefix.value
    const casinoOSlotEl = casinoOSlot.value
    const casinoWheelEl = casinoWheel.value

    if (
      !batEl ||
      !yourEl ||
      !prefixEl ||
      !pEl ||
      !suffixEl ||
      !slotEl ||
      !ballEl ||
      !casinoTextEl ||
      !casinoPrefixEl ||
      !casinoOSlotEl ||
      !casinoWheelEl
    )
      return

    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768
    const ballEndY = isDesktop ? 9 : 6

    // If reduced motion, just set the final state.
    if (prefersReducedMotion) {
      gsap.set(heroHeading.value, { autoAlpha: 1, y: 0 })
      gsap.set([prefixEl, suffixEl, casinoTextEl], { autoAlpha: 1, y: 0, filter: 'blur(0px)' })
      gsap.set(ballEl, { autoAlpha: 1, x: 0, y: ballEndY, scale: 1 })
      gsap.set(batEl, { autoAlpha: 0, rotate: 0 })
      gsap.set(casinoWheelEl, { rotate: 0, scale: 1, autoAlpha: 1 })
      return
    }

    const sportsWrap = sportsHeroLabel.value
    const wrapRect = sportsWrap.getBoundingClientRect()
    const slotRect = slotEl.getBoundingClientRect()
    const pRect = pEl.getBoundingClientRect()
    const yourRect = yourEl.getBoundingClientRect()
    const ballRect = ballEl.getBoundingClientRect()

    // Move the bat hit-point further left (before "Your") to give the ball more travel room.
    // We only shift X so the bat still lines up with the Sports baseline.
    let batRect = batEl.getBoundingClientRect()
    const currentHitAbsX = batRect.left + batRect.width * 0.78
    // Keep it before "Your", but closer to the word
    const targetHitAbsX = yourRect.left - 40
    const batShiftX = targetHitAbsX - currentHitAbsX
    gsap.set(batEl, { x: batShiftX })
    batRect = batEl.getBoundingClientRect()

    // "Hit point" on bat -> center of the "o" slot.
    const hitX = batRect.left + batRect.width * 0.78 - wrapRect.left
    const hitY = batRect.top + batRect.height * 0.62 - wrapRect.top
    const endX = slotRect.left + slotRect.width / 2 - wrapRect.left
    const endY = slotRect.top + slotRect.height / 2 - wrapRect.top

    const dx = hitX - endX
    const dy = hitY - endY

    const ballR = Math.max(4, ballRect.width / 2)

    // Bounce on TOP of text (ball sits on the letter tops), not inside/under.
    // Push the contact line DOWN so it doesn't look like it's floating.
    const contactOffset = 22
    const yourTopYAbsRelWrap = yourRect.top - wrapRect.top - ballR + contactOffset
    const yourTopRelY = yourTopYAbsRelWrap - endY

    // Two bounces across "Your"
    const b1XAbsRelWrap = yourRect.left + yourRect.width * 0.22 - wrapRect.left
    const b2XAbsRelWrap = yourRect.left + yourRect.width * 0.78 - wrapRect.left
    const b1RelX = b1XAbsRelWrap - endX
    const b2RelX = b2XAbsRelWrap - endX
    const b1RelY = yourTopRelY
    const b2RelY = yourTopRelY

    // Bounce on TOP of the "p" before landing into the "o"
    const pHitX = pRect.left + pRect.width * 0.86 - wrapRect.left
    const pTopYAbsRelWrap = pRect.top - wrapRect.top - ballR + contactOffset
    const pRelX = pHitX - endX
    const pRelY = pTopYAbsRelWrap - endY

    // Lower bounce peaks for a more realistic feel.
    const peak1Y = Math.min(dy, b1RelY) - 95
    const peak2Y = b1RelY - 70
    const peak3Y = Math.min(b2RelY, pRelY) - 80
    const peak4Y = Math.min(pRelY, 0) - 70

    // Init states (avoid flashes)
    gsap.set(heroHeading.value, { autoAlpha: 1, y: 0 })
    gsap.set([prefixEl, suffixEl], { autoAlpha: 0, y: 16, filter: 'blur(6px)' })
    gsap.set(casinoTextEl, { autoAlpha: 0, y: 16, filter: 'blur(6px)' })

    gsap.set(batEl, { autoAlpha: 1, rotate: -22, transformOrigin: '80% 70%' })
    gsap.set(ballEl, { autoAlpha: 0, x: dx, y: dy, scale: 0.7, transformOrigin: '50% 50%' })
    gsap.set(casinoWheelEl, { rotate: -18, scale: 0.88, transformOrigin: '50% 50%' })

    // Slow the sports sequence (smoother swing + ball flight)
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } }).timeScale(0.6)

    // Reveal sports letters first (with the "o" missing)
    tl.to([prefixEl, suffixEl], {
      autoAlpha: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.55,
      stagger: 0.06,
    })
    // Show Casino at the same time as Sports text
    tl.to(casinoTextEl, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.55 }, 0)

    // Casino "o": roulette wheel spin (intro + subtle idle)
    const casinoWheelIdle = gsap.to(casinoWheelEl, {
      rotate: '+=360',
      duration: 7.8,
      ease: 'none',
      repeat: -1,
      paused: true,
    })

    const wheelIntroAt = 0.2
    tl.to(casinoWheelEl, { rotate: 980, scale: 1, duration: 1.55, ease: 'power4.out' }, wheelIntroAt)
    tl.call(() => {
      // Ensure the idle spin picks up from the current intro end rotation (no jump).
      casinoWheelIdle.invalidate().restart()
    }, null, wheelIntroAt + 1.6)

    // Bat swing + ball appear at impact moment
    tl.to(
      batEl,
      { rotate: 34, duration: 0.16, ease: 'power2.in' },
      0.18,
    )
      .to(
        batEl,
        { rotate: -8, duration: 0.26, ease: 'power3.out' },
        0.34,
      )
      .to(ballEl, { autoAlpha: 1, duration: 0.01 }, 0.23)
      .to(ballEl, { scale: 1.02, duration: 0.12, ease: 'back.out(2)' }, 0.23)

    // Ball flight: smooth arcs (x linear, y parabolic-ish), bounce on TOP of letters.
    const ballStart = 0.23

    // Flight to bounce #1 (top of "Your")
    tl.to(ballEl, { x: b1RelX, duration: 0.65, ease: 'none' }, ballStart)
    tl.to(
      ballEl,
      {
        keyframes: [
          { y: peak1Y, duration: 0.3, ease: 'power2.out' },
          { y: b1RelY, duration: 0.35, ease: 'power2.in' },
        ],
      },
      ballStart,
    )
    tl.to(ballEl, { scaleX: 1.16, scaleY: 0.84, duration: 0.08, ease: 'power2.inOut' }, ballStart + 0.62)
    tl.to(ballEl, { scaleX: 1, scaleY: 1, duration: 0.14, ease: 'power2.out' }, ballStart + 0.7)

    // Flight to bounce #2 (top of "Your")
    tl.to(ballEl, { x: b2RelX, duration: 0.58, ease: 'none' }, ballStart + 0.65)
    tl.to(
      ballEl,
      {
        keyframes: [
          { y: peak2Y, duration: 0.26, ease: 'power2.out' },
          { y: b2RelY, duration: 0.32, ease: 'power2.in' },
        ],
      },
      ballStart + 0.65,
    )
    tl.to(ballEl, { scaleX: 1.14, scaleY: 0.86, duration: 0.07, ease: 'power2.inOut' }, ballStart + 1.2)
    tl.to(ballEl, { scaleX: 1, scaleY: 1, duration: 0.12, ease: 'power2.out' }, ballStart + 1.27)

    // Flight to bounce on "p"
    tl.to(ballEl, { x: pRelX, duration: 0.6, ease: 'none' }, ballStart + 1.23)
    tl.to(
      ballEl,
      {
        keyframes: [
          { y: peak3Y, duration: 0.28, ease: 'power2.out' },
          { y: pRelY, duration: 0.32, ease: 'power2.in' },
        ],
      },
      ballStart + 1.23,
    )
    tl.to(ballEl, { scaleX: 1.18, scaleY: 0.82, duration: 0.08, ease: 'power2.inOut' }, ballStart + 1.79)
    tl.to(ballEl, { scaleX: 1, scaleY: 1, duration: 0.14, ease: 'power2.out' }, ballStart + 1.87)

    // Final flight into the "o" slot — end slightly below center in the "o" area
    tl.to(ballEl, { x: 0, duration: 0.7, ease: 'none' }, ballStart + 1.83)
    tl.to(
      ballEl,
      {
        keyframes: [
          { y: peak4Y, duration: 0.34, ease: 'power2.out' },
          { y: ballEndY, duration: 0.36, ease: 'sine.out' },
        ],
      },
      ballStart + 1.83,
    )
    tl.to(ballEl, { scaleX: 1.12, scaleY: 0.88, duration: 0.08, ease: 'power2.inOut' }, ballStart + 2.48)
    tl.to(ballEl, { scaleX: 1, scaleY: 1, duration: 0.16, ease: 'power2.out' }, ballStart + 2.56)
    tl.to(ballEl, { y: ballEndY + 2, duration: 0.12, ease: 'power2.in' }, ballStart + 2.62)
    tl.to(ballEl, { y: ballEndY, duration: 0.16, ease: 'power2.out' }, ballStart + 2.74)

    // Bat fades away subtly so the final title looks clean.
    tl.to(batEl, { autoAlpha: 0.0, duration: 0.35 }, '>-0.25')
  }, heroHeading.value)
}

onMounted(() => {
  animateHeroHeading()
})

onUnmounted(() => {
  heroGsapCtx?.revert()
})
</script>

<style scoped>
h1 {
  font-family: 'Baloo 2', 'Nunito', system-ui, sans-serif;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #ffca28;
  fill: #ffca28;
  -webkit-text-fill-color: currentColor;
  -webkit-text-stroke: 0.055em #0b5962;
  paint-order: stroke fill;
  text-shadow:
    0.02em 0.02em 0 rgba(255, 250, 205, 0.72),
    0.06em 0.06em 0 #0b5962,
    0.1em 0.1em 0 #04151d,
    0.14em 0.14em 0 rgba(0, 0, 0, 0.28);
}

.your-word {
  display: inline-block;
  margin-right: 0.14em;
  color: #ffca28;
}

.sports-word {
  position: relative;
  display: inline-block;
  padding: 0;
  margin: 0;
}

.sports-word__text {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  color: #ffca28;
  -webkit-text-fill-color: currentColor;
}

.sports-word__chunk {
  position: relative;
  z-index: 2;
  color: #ffca28;
  fill: #ffca28;
  -webkit-text-fill-color: currentColor;
  -webkit-text-stroke: 0.05em #0b5962;
}

.sports-word__o-slot {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.6em; /* roughly matches an "o" width */
  height: 1em;
  transform: translateY(0.02em);
}

.sports-word__ball {
  width: 1.0em;
  height: 1.0em;
  object-fit: contain;
  display: block;
  position: relative;
  filter: brightness(0.7) contrast(1.2);
}

.sports-word__bat {
  position: absolute;
  left: -1.1em;
  top: 0.02em;
  width: 1.15em;
  height: 0.14em;
  opacity: 0.98;
  filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.35));
  pointer-events: none;
  transform-origin: 80% 70%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.0));
}

/* Bat blade */
.sports-word__bat::before {
  content: '';
  position: absolute;
  left: 0.1em;
  top: 50%;
  transform: translateY(-50%);
  width: 0.95em;
  height: 0.18em;
  border-radius: 0.16em;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.72) 45%,
    rgba(255, 255, 255, 0.86) 100%
  );
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
}

/* Bat handle */
.sports-word__bat::after {
  content: '';
  position: absolute;
  right: -0.22em;
  top: 50%;
  transform: translateY(-50%);
  width: 0.36em;
  height: 0.1em;
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    rgba(148, 163, 184, 0.95) 0%,
    rgba(100, 116, 139, 0.95) 100%
  );
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18);
}

.casino-word {
  display: inline-block;
  padding: 0;
  margin: 0;
}

.casino-word__label {
  display: inline-flex;
  align-items: baseline;
  color: #ffca28;
  -webkit-text-fill-color: currentColor;
}

.casino-word__chunk {
  position: relative;
  z-index: 2;
  color: #ffca28;
  fill: #ffca28;
  -webkit-text-fill-color: currentColor;
  -webkit-text-stroke: 0.05em #0b5962;
}

.casino-word__o-slot {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.6em; /* roughly matches an "o" width */
  height: 1em;
  transform: translateY(0.21em);
  margin-left: 0;
}

.casino-word__wheel {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0.5em;
  height: 0.5em;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  pointer-events: none;
  will-change: transform;
  filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.32));
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0) 52%),
    radial-gradient(circle at center, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0) 60%),
    conic-gradient(
      from 12deg,
      #0f172a 0deg 18deg,
      #ef4444 18deg 36deg,
      #0f172a 36deg 54deg,
      #22c55e 54deg 72deg,
      #0f172a 72deg 90deg,
      #ef4444 90deg 108deg,
      #0f172a 108deg 126deg,
      #22c55e 126deg 144deg,
      #0f172a 144deg 162deg,
      #ef4444 162deg 180deg,
      #0f172a 180deg 198deg,
      #22c55e 198deg 216deg,
      #0f172a 216deg 234deg,
      #ef4444 234deg 252deg,
      #0f172a 252deg 270deg,
      #22c55e 270deg 288deg,
      #0f172a 288deg 306deg,
      #ef4444 306deg 324deg,
      #0f172a 324deg 342deg,
      #22c55e 342deg 360deg
    );
  box-shadow:
    inset 0 0 0 0.05em rgba(255, 200, 92, 0.95),
    inset 0 0 0 0.08em rgba(0, 0, 0, 0.32);
}

.casino-word__wheel-inner {
  position: absolute;
  inset: 0.095em;
  border-radius: 999px;
  background:
    radial-gradient(circle at 28% 28%, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0) 56%),
    radial-gradient(circle at center, rgba(2, 6, 23, 0.35), rgba(2, 6, 23, 0) 58%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.casino-word__wheel-hub {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0.15em;
  height: 0.15em;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.25));
  box-shadow:
    0 8px 14px rgba(0, 0, 0, 0.28),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2);
}
</style>


