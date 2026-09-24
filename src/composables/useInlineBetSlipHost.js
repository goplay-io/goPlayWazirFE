import { ref } from 'vue';

export const INLINE_SLIP_HOST_ID = 'inline-bet-slip-host';

const DEFAULT_TOP_INSET = 8;
const SCROLL_PADDING = 8;

function isScrollableElement(el) {
  if (!el) return false;
  if (el === document.body || el === document.documentElement) {
    return (
      document.body.classList.contains('mobile-page-scroll') ||
      document.body.classList.contains('bet-page-scroll')
    );
  }
  const { overflowY } = getComputedStyle(el);
  return (
    overflowY === 'auto' ||
    overflowY === 'scroll' ||
    overflowY === 'overlay'
  ) && el.scrollHeight > el.clientHeight;
}

function usesBodyDocumentScroll() {
  return (
    document.body.classList.contains('mobile-page-scroll') ||
    document.body.classList.contains('bet-page-scroll')
  );
}

function scrollPageBy(delta, behavior) {
  if (Math.abs(delta) < 1) return;
  const opts = { top: delta, left: 0, behavior };
  (document.scrollingElement || document.documentElement).scrollBy(opts);
}

function getVisibleBounds(scrollRoot) {
  const topInset = getViewportTopInset();
  const bottomInset = getViewportBottomInset();

  const isDocumentScroll =
    usesBodyDocumentScroll() ||
    !scrollRoot ||
    scrollRoot === document.body ||
    scrollRoot === document.documentElement ||
    scrollRoot === document.scrollingElement;

  if (isDocumentScroll) {
    return {
      top: topInset,
      bottom: window.innerHeight - bottomInset,
    };
  }

  const rootRect = scrollRoot.getBoundingClientRect();
  return {
    top: rootRect.top + SCROLL_PADDING,
    bottom: Math.min(rootRect.bottom, window.innerHeight) - bottomInset,
  };
}

function applyScrollDelta(delta, scrollRoot, behavior) {
  if (Math.abs(delta) < 1) return;

  const isDocumentScroll =
    usesBodyDocumentScroll() ||
    !scrollRoot ||
    scrollRoot === document.body ||
    scrollRoot === document.documentElement ||
    scrollRoot === document.scrollingElement;

  if (isDocumentScroll) {
    scrollPageBy(delta, behavior);
    return;
  }

  scrollRoot.scrollTo({ top: scrollRoot.scrollTop + delta, left: 0, behavior });
}

function computeSlipScrollDelta(slip, bounds) {
  const slipRect = slip.getBoundingClientRect();
  const anchorRect = getSlipAnchor(slip).getBoundingClientRect();
  return computeScrollDelta(slipRect, anchorRect, bounds);
}

function performScroll(host, behavior = 'auto') {
  if (!host?.isConnected) return false;

  const slip = host.querySelector('.inline-bet-slip-embed');
  if (!slip || slip.getBoundingClientRect().height < 40) return false;

  const scrollRoot = getScrollRoot(host);
  const delta = computeSlipScrollDelta(slip, getVisibleBounds(scrollRoot));
  applyScrollDelta(delta, scrollRoot, behavior);
  return true;
}

/** Cancels in-flight scroll retries when a new slip opens or the host is removed. */
let activeScrollGen = 0;

function cancelPendingSlipScroll() {
  activeScrollGen += 1;
}

function findScrollParent(el) {
  let node = el?.parentElement;
  while (node && node !== document.body) {
    if (isScrollableElement(node)) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function getScrollRoot(host) {
  if (usesBodyDocumentScroll()) {
    return document.scrollingElement || document.documentElement;
  }

  const appMain = document.getElementById('app-main-scroll');
  if (appMain && host?.isConnected && appMain.contains(host) && isScrollableElement(appMain)) {
    return appMain;
  }

  return findScrollParent(host);
}

function getSlipAnchor(slip) {
  return (
    slip.querySelector('.slip-place-btn') ||
    slip.querySelector('.slip-action-row') ||
    slip
  );
}

/** Reserve space for fixed/sticky chrome at the top of the viewport. */
function getViewportTopInset() {
  let inset = DEFAULT_TOP_INSET;
  const nodes = document.querySelectorAll(
    '.v-app-bar, .layout-mobile-top-chrome, .bet-header-fixed, .layout-mobile-sports-tab-strip, .mobile-sports-chrome-tab-strip',
  );
  nodes.forEach((el) => {
    const { position } = getComputedStyle(el);
    if (position !== 'fixed' && position !== 'sticky') return;
    const rect = el.getBoundingClientRect();
    if (rect.height > 0 && rect.top < window.innerHeight * 0.45) {
      inset = Math.max(inset, rect.bottom + SCROLL_PADDING);
    }
  });
  return inset;
}

/** Reserve space for one-click bar, bottom nav, and safe area. */
function getViewportBottomInset() {
  let inset = SCROLL_PADDING;

  const oneClick = document.querySelector('.one-click-sticky');
  if (oneClick) {
    const rect = oneClick.getBoundingClientRect();
    if (rect.height > 0 && rect.top < window.innerHeight) {
      inset = Math.max(inset, window.innerHeight - rect.top + SCROLL_PADDING);
    }
  }

  const bottomNav = document.querySelector('.mobile-bottom-nav');
  if (bottomNav) {
    const rect = bottomNav.getBoundingClientRect();
    if (rect.height > 0 && rect.top < window.innerHeight) {
      inset = Math.max(inset, window.innerHeight - rect.top + SCROLL_PADDING);
    }
  }

  return inset;
}

function computeScrollDelta(slipRect, anchorRect, bounds) {
  const { top: viewTop, bottom: viewBottom } = bounds;
  const visibleHeight = viewBottom - viewTop;

  if (slipRect.height <= visibleHeight + 1) {
    if (slipRect.top < viewTop) return slipRect.top - viewTop;
    if (slipRect.bottom > viewBottom) return slipRect.bottom - viewBottom + SCROLL_PADDING;
    return 0;
  }

  // Tall slip: align top when possible, then ensure place button is visible.
  let delta = slipRect.top - viewTop;
  const projectedAnchorBottom = anchorRect.bottom - delta;
  if (projectedAnchorBottom > viewBottom) {
    delta += projectedAnchorBottom - viewBottom + SCROLL_PADDING;
  }
  const projectedTop = slipRect.top - delta;
  if (projectedTop < viewTop) {
    delta = slipRect.top - viewTop;
  }
  return delta;
}

/**
 * Scroll the inline bet slip into view after Teleport content has painted.
 * Uses a single instant scroll to avoid jitter from stacked smooth animations.
 */
export function scrollInlineSlipIntoView(hostEl, options = {}) {
  const gen = ++activeScrollGen;
  const behavior = options.behavior ?? 'auto';
  const maxAttempts = options.maxAttempts ?? 45;
  let attempts = 0;

  const tryScroll = () => {
    if (gen !== activeScrollGen) return;
    attempts += 1;
    const host = hostEl;
    if (!host?.isConnected) return;

    const slip = host.querySelector('.inline-bet-slip-embed');
    if (!slip || slip.getBoundingClientRect().height < 40) {
      if (attempts < maxAttempts) requestAnimationFrame(tryScroll);
      return;
    }

    performScroll(host, behavior);

    // One follow-up after quick-stake buttons expand the slip — still instant.
    if (!options.skipFollowUp) {
      setTimeout(() => {
        if (gen !== activeScrollGen) return;
        performScroll(host, 'auto');
      }, 280);
    }
  };

  requestAnimationFrame(() => requestAnimationFrame(tryScroll));
}

/**
 * Mobile inline bet slip: inserts a host node after the clicked odds row and
 * exposes a CSS selector for <Teleport :to="...">.
 * @param {{ hostId?: string }} [options] - Optional custom host element id (e.g. multi-market page).
 */
export function useInlineBetSlipHost(options = {}) {
  const hostId = options.hostId ?? INLINE_SLIP_HOST_ID;

  const lastOddButtonEl = ref(null);
  const inlineSlipHostEl = ref(null);
  const inlineSlipTarget = ref(null);

  const removeInlineSlipHost = () => {
    cancelPendingSlipScroll();
    if (inlineSlipHostEl.value?.parentNode) {
      inlineSlipHostEl.value.parentNode.removeChild(inlineSlipHostEl.value);
    }
    inlineSlipTarget.value = null;
  };

  const mountInlineSlipHostBelowButton = () => {
    cancelPendingSlipScroll();
    const btn = lastOddButtonEl.value;

    if (!btn || !btn.isConnected) {
      inlineSlipTarget.value = null;
      return false;
    }

    // Prefer the full runner row (Match Odds, bookmakers, etc.). Otherwise the host
    // can end up inside the horizontal flex row (wrong parentElement fallback) and
    // crush the runner name / overlap odds on mobile.
    let runnerRow = btn.closest('[data-runner-id]');
    // Rows inside v-card-text may omit data-runner-id; walk up within odds panel to find a marked row.
    if (!runnerRow) {
      const panel = btn.closest('.odds-buttons-container');
      let el = btn.parentElement;
      while (el && panel?.contains(el)) {
        if (el.hasAttribute?.('data-runner-id')) {
          runnerRow = el;
          break;
        }
        el = el.parentElement;
      }
    }
    if (runnerRow?.parentElement) {
      if (!inlineSlipHostEl.value) {
        const host = document.createElement('div');
        host.id = hostId;
        host.className =
          'inline-bet-slip-host tw-w-full tw-max-w-full tw-min-w-0 tw-box-border';
        inlineSlipHostEl.value = host;
      }
      inlineSlipHostEl.value.id = hostId;
      runnerRow.insertAdjacentElement('afterend', inlineSlipHostEl.value);
      inlineSlipTarget.value = `#${CSS.escape(hostId)}`;
      return true;
    }

    const oddsButtonsContainer = btn.closest('.odds-buttons-container');
    const gridContainer = btn.closest('.tw-grid');
    if (oddsButtonsContainer && gridContainer && oddsButtonsContainer.contains(gridContainer)) {
      if (!inlineSlipHostEl.value) {
        const host = document.createElement('div');
        host.id = hostId;
        host.className = 'inline-bet-slip-host tw-w-full tw-max-w-full tw-min-w-0 tw-box-border';
        inlineSlipHostEl.value = host;
      }
      inlineSlipHostEl.value.id = hostId;

      gridContainer.insertAdjacentElement('afterend', inlineSlipHostEl.value);
      inlineSlipTarget.value = `#${CSS.escape(hostId)}`;
      return true;
    }

    let rowContainer = btn.closest('.tw-border-b');
    if (!rowContainer || !rowContainer.parentElement) {
      rowContainer = btn.closest('.tw-px-3') || btn.parentElement;
    }

    if (!rowContainer || !rowContainer.parentElement) {
      inlineSlipTarget.value = null;
      return false;
    }

    if (!inlineSlipHostEl.value) {
      const host = document.createElement('div');
      host.id = hostId;
      host.className = 'inline-bet-slip-host tw-w-full tw-max-w-full tw-min-w-0 tw-box-border';
      inlineSlipHostEl.value = host;
    }
    inlineSlipHostEl.value.id = hostId;

    rowContainer.insertAdjacentElement('afterend', inlineSlipHostEl.value);
    inlineSlipTarget.value = `#${CSS.escape(hostId)}`;
    return true;
  };

  const captureOddClick = (e) => {
    // Clicks inside the teleported slip should not move the anchor (matches multi-market / Bet.vue behavior).
    if (e.target.closest?.(`#${hostId}`)) {
      return;
    }
    // Vuetify v-btn is usually a native <button class="v-btn">; cover .v-btn for non-button tags.
    const btn = e.target.closest?.('.v-btn') || e.target.closest?.('button');
    if (btn) {
      lastOddButtonEl.value = btn;
    }
  };

  const handleCashoutSlipTarget = (e) => {
    const runnerId = e.detail?.runnerId;
    const marketId = e.detail?.marketId;
    if (!runnerId) return;
    let rowEl = null;
    if (marketId != null && String(marketId) !== '') {
      rowEl = document.querySelector(
        `[data-market-id="${CSS.escape(String(marketId))}"][data-runner-id="${CSS.escape(String(runnerId))}"]`,
      );
    }
    if (!rowEl) {
      rowEl = document.querySelector(`[data-runner-id="${CSS.escape(String(runnerId))}"]`);
    }
    if (rowEl) lastOddButtonEl.value = rowEl;
  };

  const scrollIntoView = (scrollOptions) => scrollInlineSlipIntoView(inlineSlipHostEl.value, scrollOptions);

  return {
    lastOddButtonEl,
    inlineSlipHostEl,
    inlineSlipTarget,
    removeInlineSlipHost,
    mountInlineSlipHostBelowButton,
    captureOddClick,
    handleCashoutSlipTarget,
    scrollIntoView,
  };
}
