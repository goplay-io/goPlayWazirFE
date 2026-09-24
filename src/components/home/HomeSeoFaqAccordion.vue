<script setup>
import { ref } from 'vue';

const SEO_ACCORDION_TITLE = 'Best Online Betting Site in India | wazirwin';
const FAQ_ACCORDION_TITLE = 'FAQs-wazirwin';

const FAQ_ITEMS = [
  {
    q: 'What are jackpot slots, and does wazirwin have them?',
    a: 'Yes, wazirwin has many jackpot slots with different mechanics and prize structures—ideal if you enjoy casino-style games alongside sports.',
  },
  {
    q: 'Does wazirwin offer sports live broadcasting?',
    a: 'Yes, selected sports are available with live streaming so you can follow the action while you play or bet, where available.',
  },
  {
    q: 'How long does support take if something goes wrong?',
    a: 'Support aims to respond quickly, with live chat and email available around the clock for registered users.',
  },
];

const seoOpen = ref(false);
const faqOpen = ref(false);
</script>

<template>
  <div class="home-seo-faq">
    <div class="home-seo-faq__card">
      <button
        type="button"
        class="home-seo-faq__trigger"
        :aria-expanded="seoOpen"
        @click="seoOpen = !seoOpen"
      >
        <span class="home-seo-faq__trigger-label">{{ SEO_ACCORDION_TITLE }}</span>
        <span class="home-seo-faq__chevron" :class="{ 'home-seo-faq__chevron--open': seoOpen }" aria-hidden="true">▼</span>
      </button>

      <div class="home-seo-faq__panel" :class="{ 'home-seo-faq__panel--open': seoOpen }">
        <div class="home-seo-faq__article">
          <h1 class="home-seo-faq__h1">Unlock the Thrill: Top Features &amp; Turbo Games on wazirwin</h1>
          <p>
            In this fast world of cricket and sports, one has to update himself constantly with information
            and involvement. This is the beginning of wazirwin's role, as it is not just updating scores
            during <strong>live cricket matches</strong> but enhancing the sports experience of fans several
            notches above the scope of conventional, partially killer apps. In this article, we will consider
            some key aspects of <strong>Turbo Games</strong>, among others, as well as some more abstract
            aspects that differentiate it from other websites to take into consideration for a cricket activist.
          </p>

          <h2 class="home-seo-faq__h2">What is wazirwin?</h2>
          <p>
            It is your one-stop-shop destination for everything cricket and sporting. It has been keeping the
            news in real-time, with <strong>live scores</strong> and <strong>live streaming</strong> of games
            in different sports disciplines and thus has the ability to assist the fans to never miss the action,
            even for a second.
          </p>

          <h2 class="home-seo-faq__h2">Features that standout</h2>
          <h3 class="home-seo-faq__h3">1. Detailed Live Score and Updates</h3>
          <p>
            It is unique in the field of <strong>live cricket scores</strong> and news for various countries
            in cricket. Real-time notifications on the site make sure users are in the know.
          </p>
          <h3 class="home-seo-faq__h3">2. Free Live Streaming</h3>
          <p>
            Perhaps the most attractive feature is that it provides <strong>free live streaming</strong> of
            <strong>live cricket matches</strong>.
          </p>
          <h3 class="home-seo-faq__h3">3. Turbo Games for Engaging Fun</h3>
          <p>
            The exciting new frontier of fun on the site, however, is the <strong>Turbo Games</strong>. Be it
            <strong>outcome predictions</strong> of matches or the play of a <strong>fantasy league</strong>,
            turbo games are sure to provide their spectators with some thrills.
          </p>

          <h2 class="home-seo-faq__h2">Turbo Games: Features and Benefits</h2>
          <p>
            The <strong>wazirwin Turbo Games</strong> have been done in such a way that the users have the
            possibility of having the maximum interaction and so they can enjoy it.
          </p>

          <h2 class="home-seo-faq__h2">Conclusion</h2>
          <p>
            In the end, wazirwin stands out among the <strong>best websites for all cricket lovers</strong>,
            who have been provided with such broad facilities as <strong>live scores</strong>,
            <strong>live streaming</strong>, and newly designed <strong>Turbo Games</strong>.
          </p>
        </div>
      </div>
    </div>

    <div class="home-seo-faq__card home-seo-faq__card--spaced">
      <button
        type="button"
        class="home-seo-faq__trigger"
        :aria-expanded="faqOpen"
        @click="faqOpen = !faqOpen"
      >
        <span class="home-seo-faq__trigger-label">{{ FAQ_ACCORDION_TITLE }}</span>
        <span class="home-seo-faq__chevron" :class="{ 'home-seo-faq__chevron--open': faqOpen }" aria-hidden="true">▼</span>
      </button>

      <ul class="home-seo-faq__faq-list" :class="{ 'home-seo-faq__panel--open': faqOpen }">
        <li v-for="(item, idx) in FAQ_ITEMS" :key="idx" class="home-seo-faq__faq-item">
          <p class="home-seo-faq__faq-q">{{ item.q }}</p>
          <p class="home-seo-faq__faq-a">{{ item.a }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.home-seo-faq {
  width: 100%;
  padding: 0 8px 16px;
  box-sizing: border-box;
}

.home-seo-faq__card {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  background: #333333;
}

.home-seo-faq__card--spaced {
  margin-top: 8px;
}

.home-seo-faq__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 0;
  background: transparent;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
}

.home-seo-faq__trigger:hover {
  background: rgba(255, 255, 255, 0.05);
}

.home-seo-faq__trigger-label {
  min-width: 0;
  padding-right: 8px;
}

.home-seo-faq__chevron {
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.45);
  font-size: 10px;
  transition: transform 0.3s ease;
}

.home-seo-faq__chevron--open {
  transform: rotate(180deg);
}

.home-seo-faq__panel {
  max-height: 0;
  overflow: hidden;
  border-top: 1px solid transparent;
  transition: max-height 0.3s ease, padding 0.3s ease;
}

.home-seo-faq__panel--open {
  max-height: 50vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 12px 12px;
  border-top-color: rgba(255, 255, 255, 0.12);
}

.home-seo-faq__faq-list {
  max-height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0 12px;
  list-style: disc;
  transition: max-height 0.3s ease, padding 0.3s ease;
}

.home-seo-faq__faq-list.home-seo-faq__panel--open {
  max-height: 50vh;
  overflow-y: auto;
  padding: 8px 12px 12px 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.home-seo-faq__article {
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  line-height: 1.6;
}

.home-seo-faq__article p {
  margin: 0 0 12px;
}

.home-seo-faq__h1 {
  margin: 0 0 12px;
  font-size: 26px;
  font-weight: 400;
  line-height: 1.3;
}

.home-seo-faq__h2 {
  margin: 16px 0 8px;
  font-size: 21px;
  font-weight: 400;
  line-height: 1.3;
}

.home-seo-faq__h3 {
  margin: 12px 0 8px;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.3;
}

.home-seo-faq__article strong {
  color: #ffffff;
  font-weight: 700;
}

.home-seo-faq__faq-item {
  padding: 8px 0;
}

.home-seo-faq__faq-q {
  margin: 0;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
}

.home-seo-faq__faq-a {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 1.5;
}
</style>
