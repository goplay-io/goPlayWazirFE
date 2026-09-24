<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  /** Refer-a-friend page: show full copy without See More toggle. */
  alwaysExpanded: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()

/**
 * Homepage SEO / about copy — paragraph structure matches zuplay.com `.content`.
 * Links use local routes (/casino, /contact, /signup).
 */
const HOME_PAGE_BOTTOM_HTML = `
<p>Welcome to Zuplay, India's hottest Sportsbook, Sports Exchange &amp; an <strong><a href="/casino" class="home-bottom-text__link">Online Casino</a></strong> Destination.</p>
<p>If you love the thrill of betting and gaming as much as we do, you're in the right place. Zuplay isn't just another platform, it's where sports, strategy, and excitement come together to create a betting experience like no other.</p>
<p>A Sportsbook for Big Wins &amp; Non-Stop Action</p>
<p>Our Sportsbook lets you bet with fixed odds against the house, covering everything from match winners and player performances to live in-game wagers. From the IPL and Premier League to Grand Slams and NBA playoffs, every major sporting event is at your fingertips. Whether you're into cricket, football, tennis, basketball, MMA, or even betting on political events, Zuplay gives you the power to place bets on the action as it unfolds.</p>
<p>A Sports Exchange That Puts You in Control</p>
<p>Zuplay is a betting exchange, which means you can bet for or against an outcome, just like trading stocks. This gives you better odds, more flexibility, and the ability to cash out at the right moment.</p>
<p>Cricket fans out there, imagine backing a team before the first ball is bowled and then adjusting your bets as the match swings in different directions. The IPL, Ashes, T20 World Cup, and India's tours are some of the hottest events where betting action never stops.</p>
<p>And if you're into football, you know how intense Premier League, La Liga, UEFA Champions League, and the FIFA World Cup matches get. You can trade bets live, predicting everything from match winners to the number of goals.</p>
<p>For tennis lovers, betting on Grand Slams like Wimbledon, the US Open, and the Australian Open makes every serve and rally even more thrilling. The same goes for basketball, where NBA fans can get in on the action with in-game betting that captures every dunk, three-pointer, and buzzer-beater.</p>
<p>If combat sports are your thing, MMA and UFC events bring adrenaline pumping moments, and betting on underdogs or title fights can be as strategic as it is exciting. And for those who love the world of politics, Zuplay even lets you bet on major elections and global events. Yup, we cover Politics!</p>
<p>Casino Action Like Never Before</p>
<p>When you want a break from sports betting, online casino has everything you need. Whether it's spinning the reels on slots and jackpots, testing your skills in Teen Patti and Rummy, or experiencing the thrill of live dealer games like Blackjack, Roulette, Baccarat, and Andar Bahar, there's always something happening. The live casino tables give you a real time, immersive experience where you can interact with professional dealers and other players. You got to experience it once for sure.</p>
<p class="home-bottom-text__spacer" aria-hidden="true"></p>
<p>Guess what's new with Zuplay? Dwayne Bravo Joins the Zuplay Team!!</p>
<p>If you follow cricket, you know the name Dwayne Bravo, he's a true legend of the game, a T20 superstar, and a champion in every sense. Now, he's part of the Zuplay family as our official ambassador, bringing his energy, passion, and winning mentality to the platform. Just like Bravo dominates on the field, Zuplay aims to dominate the world of online betting and gaming.</p>
<p>Some points for you to consider &amp; create your account now</p>
<p>Zuplay is built for players who want control, excitement, and fair play. Here's why it stands out:</p>
<p>Bet against other players, not the bookmaker, and get better odds on our exchange.</p>
<p>Instant cashouts and high-speed betting make sure you never miss a moment.</p>
<p>A massive range of sports, casino games, and unique betting options.</p>
<p>A trusted and secure platform with quick withdrawals and <a href="/contact" class="home-bottom-text__link">24/7 support</a>.</p>
<p>If you love the rush of the game, the strategy of betting, and the thrill of winning, it's time to experience it for yourself. <a href="/signup" class="home-bottom-text__link">Sign up now</a> and be part of India's most exciting online betting community.</p>
`.trim()

/** Collapsed preview — same cut point as reference (mid 4th paragraph). */
const HOME_PAGE_BOTTOM_PREVIEW_HTML = `
<p>Welcome to Zuplay, India's hottest Sportsbook, Sports Exchange &amp; an <strong><a href="/casino" class="home-bottom-text__link">Online Casino</a></strong> Destination.</p>
<p>If you love the thrill of betting and gaming as much as we do, you're in the right place. Zuplay isn't just another platform, it's where sports, strategy, and excitement come together to create a betting experience like no other.</p>
<p>A Sportsbook for Big Wins &amp; Non-Stop Action</p>
<p>Our Sportsbook lets you bet with fixed odds against the house, covering everything from match winners and player performances to live in-game wagers. From the IPL and Premier League to Grand Slams and NBA playoffs, every major sporting event is at your fingertips. Whether you're into cricket, football, tennis, basketball, MMA, or even betting on political events, Zuplay gives you the power to place bets on t</p>
`.trim()

const expanded = ref(false)

const visibleHtml = computed(() =>
  props.alwaysExpanded || expanded.value ? HOME_PAGE_BOTTOM_HTML : HOME_PAGE_BOTTOM_PREVIEW_HTML,
)

function onBodyClick(event) {
  const anchor = event.target?.closest?.('a')
  if (!anchor) return
  const href = anchor.getAttribute('href')
  if (!href || !href.startsWith('/') || href.startsWith('//')) return
  event.preventDefault()
  router.push(href)
}
</script>

<template>
  <!-- Reference: mt-5 mx-4 md:mx-10 + .content paragraphs + See More -->
  <section class="home-bottom-text" aria-label="About Zuplay">
    <div class="home-bottom-text__content" @click="onBodyClick" v-html="visibleHtml" />
    <div class="home-bottom-text__actions">
      <button
        v-if="!alwaysExpanded"
        type="button"
        class="home-bottom-text__toggle"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'See Less' : 'See More' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
/* Reference: mt-5 mx-4 md:mx-10 */
.home-bottom-text {
  margin-top: 20px;
  margin-right: 16px;
  margin-bottom: 0;
  margin-left: 16px;
  padding: 0;
  box-sizing: border-box;
  background: transparent;
}

@media (min-width: 768px) {
  .home-bottom-text {
    margin-top: 0;
    margin-right: 40px;
    margin-bottom: 0;
    margin-left: 40px;
  }
}

.home-bottom-text__content {
  font-size: 16px;
  line-height: 24px;
  color: #000000;
}

.home-bottom-text__content :deep(p) {
  margin: 0;
  padding: 10px 0;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: #000000;
}

.home-bottom-text__content :deep(.home-bottom-text__spacer) {
  padding: 10px 0;
  min-height: 0;
}

/* Reference: #4183ed, bold, underline */
.home-bottom-text__content :deep(.home-bottom-text__link),
.home-bottom-text__content :deep(a) {
  color: #4183ed;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.home-bottom-text__content :deep(strong) {
  font-weight: 700;
}

/* Reference: w-full text-center */
.home-bottom-text__actions {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 0;
}

/*
 * Reference:
 * text-[16px] border border-skin-button-disabled-border (#c2c7c3)
 * px-4 font-medium rounded — no shadow wrap
 */
.home-bottom-text__toggle {
  display: inline-block;
  margin: 0 auto;
  padding: 0 16px;
  border: 1px solid #c2c7c3;
  border-radius: 4px;
  background: transparent;
  color: #000000;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  cursor: pointer;
  font-family: inherit;
  box-shadow: none;
}
</style>
