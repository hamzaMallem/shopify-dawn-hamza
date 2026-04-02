/*
  Component: Free Shipping Bar – JavaScript
  Purpose:   Real-time cart progress updates without extra network requests.

  Contract:
    Listens  → document 'mallem:cart:updated'  { detail: { total_price, item_count } }
    Reads    → data-threshold      (cents, set by Liquid)
    Reads    → data-str-progress   (translated template with __AMOUNT__ placeholder)
    Reads    → data-str-almost     (translated template with __AMOUNT__ placeholder)
    Reads    → data-str-achieved   (translated final string)

  Progressive Enhancement:
    Liquid already renders the correct initial state.
    JS only handles subsequent cart mutations — the page is never blank.

  Performance:
    - CSS custom property --shipping-percent avoids layout thrashing.
    - Single document-level listener shared across all bar instances.
    - No extra /cart.js fetch — cart total arrives in event detail.

  RTL:
    No directional JS required; CSS logical properties handle all layout.
*/

class MallemShippingBar {
  /**
   * @param {HTMLElement} el  The [data-shipping-bar] root element
   */
  constructor(el) {
    this.el        = el;
    this.threshold = parseInt(el.dataset.threshold, 10);
    this.fillEl    = el.querySelector('[data-shipping-fill]');
    this.textEl    = el.querySelector('[data-shipping-bar-text]');
    this.trackEl   = el.querySelector('[data-shipping-track]');

    // WHY: Translations baked into data-attrs by Liquid — no runtime i18n lookup
    this.strings = {
      progress: el.dataset.strProgress, // "Add __AMOUNT__ more for free shipping"
      almost:   el.dataset.strAlmost,   // "Only __AMOUNT__ away!"
      achieved: el.dataset.strAchieved  // "You've unlocked free shipping!"
    };

    // Guard: invalid threshold means the feature is misconfigured
    if (!this.threshold || this.threshold <= 0) return;

    this._listen();
  }

  // ============================================================
  // EVENT BINDING
  // ============================================================

  _listen() {
    // WHY: Document-level event keeps cart drawer and shipping bar decoupled
    document.addEventListener('mallem:cart:updated', (e) => {
      this._update(e.detail.total_price);
    });
  }

  // ============================================================
  // UPDATE  (called on every cart mutation)
  // ============================================================

  _update(cartTotalCents) {
    const pct       = Math.min(100, Math.floor((cartTotalCents / this.threshold) * 100));
    const remaining = Math.max(0, this.threshold - cartTotalCents);
    const state     = this._resolveState(cartTotalCents, pct);

    this._setFill(pct);
    this._setState(state);
    this._setText(state, remaining);
  }

  /**
   * Determines bar state from cart total and computed percent.
   * @param {number} total   Cart total in cents
   * @param {number} pct     Progress percentage (0–100)
   * @returns {'progress'|'almost'|'achieved'}
   */
  _resolveState(total, pct) {
    if (total >= this.threshold) return 'achieved';
    if (pct >= 80)               return 'almost';
    return 'progress';
  }

  /** Update CSS custom property and ARIA value — no layout recalc */
  _setFill(pct) {
    if (this.fillEl) {
      this.fillEl.style.setProperty('--shipping-percent', `${pct}%`);
    }
    if (this.trackEl) {
      this.trackEl.setAttribute('aria-valuenow', pct);
    }
  }

  /** Replace only the state modifier class, preserving base class */
  _setState(state) {
    this.el.className = this.el.className
      .replace(/\bmallem-shipping-bar--(progress|almost|achieved)\b/g, '')
      .trim();
    this.el.classList.add(`mallem-shipping-bar--${state}`);
  }

  /** Swap message text using pre-translated templates */
  _setText(state, remainingCents) {
    if (!this.textEl) return;

    if (state === 'achieved') {
      this.textEl.textContent = this.strings.achieved;
      return;
    }

    const amount   = this._formatMoney(remainingCents);
    const template = this.strings[state] || this.strings.progress;

    // WHY: __AMOUNT__ placeholder set by Liquid via `t: amount: '__AMOUNT__'`
    this.textEl.textContent = template.replace('__AMOUNT__', amount);
  }

  // ============================================================
  // UTILITIES
  // ============================================================

  /**
   * Formats cents using Shopify's native formatter when available.
   * Falls back to a generic 2-decimal format.
   * @param {number} cents
   * @returns {string}
   */
  _formatMoney(cents) {
    if (window.Shopify?.formatMoney) {
      // WHY: Respect store's configured currency format (symbol, decimal sep, etc.)
      return window.Shopify.formatMoney(cents, window.Shopify.money_format);
    }
    return `$${(cents / 100).toFixed(2)}`;
  }
}

// ============================================================
// INIT — support multiple bars (cart drawer + any future placement)
// ============================================================

(function initShippingBars() {
  function boot() {
    document.querySelectorAll('[data-shipping-bar]').forEach((el) => {
      new MallemShippingBar(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
