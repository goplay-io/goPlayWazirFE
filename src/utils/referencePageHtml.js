export function cleanReferencePageHtml(html) {
  if (!html) return ''

  let cleaned = html
    .replace(/<!--\[-1-->/g, '')
    .replace(/<!--\]-->/g, '')
    .replace(/<!--\[0-->/g, '')
    .replace(/<!---->/g, '')

  // Scraped zuplay.com HTML sometimes includes the site footer inside the content block.
  const footerIdx = cleaned.search(/bg-skin-footer-background/)
  if (footerIdx !== -1) {
    cleaned = cleaned.slice(0, footerIdx)
  }

  // Strip trailing layout wrapper closings left over from the reference page shell.
  while (/<\/div>\s*$/i.test(cleaned)) {
    cleaned = cleaned.replace(/<\/div>\s*$/i, '')
  }

  cleaned = cleaned.replace(/<[^>]*$/g, '')

  return cleaned.trim()
}
