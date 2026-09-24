<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { SPORT_SEO_CONTENT, resolveSportSeoKey } from '@/data/sportSeoContent.js'

const props = defineProps({
  /** Sport name or slug, e.g. "Cricket", "horse_racing" */
  sport: {
    type: String,
    default: '',
  },
})

const router = useRouter()
const expanded = ref(false)
const COLLAPSED_MAX_PX = 220

const seoKey = computed(() => resolveSportSeoKey(props.sport))
const html = computed(() => {
  const raw = (seoKey.value ? SPORT_SEO_CONTENT[seoKey.value] : '') || ''
  if (!raw) return ''
  // Ensure anchors render as visible hyperlinks (Tailwind preflight sets a { color: inherit })
  return raw.replace(/<a\b([^>]*)>/gi, (full, attrs) => {
    if (/\bclass\s*=/.test(attrs)) {
      return full.replace(
        /class\s*=\s*(["'])(.*?)\1/i,
        (_, q, cls) => `class=${q}${cls} sport-seo-text__link${q}`,
      )
    }
    return `<a class="sport-seo-text__link"${attrs}>`
  })
})
const hasContent = computed(() => html.value.trim().length > 0)

watch(seoKey, () => {
  expanded.value = false
})

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
  <section v-if="hasContent" class="sport-seo-text" :aria-label="`${sport} information`">
    <div
      class="sport-seo-text__body"
      :class="{ 'sport-seo-text__body--collapsed': !expanded }"
      :style="!expanded ? { maxHeight: `${COLLAPSED_MAX_PX}px` } : undefined"
      @click="onBodyClick"
      v-html="html"
    />
    <div class="sport-seo-text__actions">
      <div class="sport-seo-text__toggle-wrap">
        <button
          type="button"
          class="sport-seo-text__toggle"
          :aria-expanded="expanded"
          @click="expanded = !expanded"
        >
          {{ expanded ? 'See Less' : 'See More' }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sport-seo-text {
  margin: 16px 0 8px;
  padding-left: 5px;
  padding-right: 5px;
  box-sizing: border-box;
  background: transparent;
}

.sport-seo-text__body {
  overflow: hidden;
  color: #111111;
  font-size: 16px;
  line-height: 1.625;
}

.sport-seo-text__body--collapsed {
  position: relative;
  -webkit-mask-image: linear-gradient(180deg, #000 55%, transparent);
  mask-image: linear-gradient(180deg, #000 55%, transparent);
}

.sport-seo-text__body :deep(h1),
.sport-seo-text__body :deep(h2),
.sport-seo-text__body :deep(h3),
.sport-seo-text__body :deep(.section-title) {
  margin: 1em 0 0.45em;
  color: #111111;
  font-size: 22.5px;
  font-weight: 700;
  line-height: 1.3;
}

.sport-seo-text__body :deep(h1) {
  margin-top: 0;
}

.sport-seo-text__body :deep(p) {
  margin: 0 0 0.75em;
}

.sport-seo-text__body :deep(ul),
.sport-seo-text__body :deep(ol) {
  margin: 0 0 0.85em;
  padding-left: 1.25rem;
}

.sport-seo-text__body :deep(li) {
  margin-bottom: 0.35em;
}

/* Match HomePageBottomText: text-hyperlinkTextColor (#4183ed) font-bold underline */
.sport-seo-text__body :deep(a),
.sport-seo-text__body :deep(.sport-seo-text__link) {
  color: #4183ed !important;
  font-weight: 700;
  text-decoration: underline !important;
  cursor: pointer;
}

.sport-seo-text__body :deep(.faq-question) {
  font-weight: 700;
  margin-top: 0.65em;
  color: #111111;
}

.sport-seo-text__body :deep(.faq-answer) {
  margin-bottom: 0.35em;
}

.sport-seo-text__actions {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.sport-seo-text__toggle-wrap {
  border: 1px solid #c2c7c3;
  border-radius: 4px;
  padding: 0 16px;
  background: #ffffff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.sport-seo-text__toggle {
  display: block;
  margin: 0 auto;
  padding: 6px 0;
  border: 0;
  background: transparent;
  color: #000000;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
  font-family: inherit;
}

@media (min-width: 768px) {
  .sport-seo-text {
    margin: 20px 0 12px;
    padding-left: 5rem;
    padding-right: 5rem;
  }

  .sport-seo-text__actions {
    margin-top: 24px;
    margin-bottom: 16px;
  }
}
</style>
