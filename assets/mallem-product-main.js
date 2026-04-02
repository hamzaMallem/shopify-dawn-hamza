/**
 * Mallem Product Main — JS Module
 *
 * WHY this architecture:
 *   - Custom Elements keep gallery, sticky ATC, and stock state self-contained.
 *     No global soup, no hidden coupling.
 *   - Custom events (mallem:variant:changed, mallem:cart:updated) let any future
 *     component (mini-cart, free-shipping bar) react without tight coupling.
 *   - All DOM queries are scoped to `this` (the custom element root) so multiple
 *     product sections on a page don't collide.
 *   - rAF batches DOM writes to avoid layout thrashing.
 *   - IntersectionObserver replaces scroll listeners (no continuous main-thread work).
 *
 * RTL pattern (shared across all Mallem JS):
 *   const isRTL = window.Mallem?.isRTL ?? (document.documentElement.dir === 'rtl');
 *   const sign  = isRTL ? 1 : -1;
 *   — translateX must be inverted in RTL because the slide track is reversed.
 */

'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Clamp a number between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Batch DOM writes in the next animation frame.
 * Prevents layout thrash when multiple reads and writes happen close together.
 * @param {Function} fn
 */
function raf(fn) {
  requestAnimationFrame(fn);
}

/* ══════════════════════════════════════════════════════════════════════════
   MALLEM PRODUCT GALLERY  —  Custom Element
   Manages slide navigation, thumbnail sync, dot sync, touch, keyboard, ARIA.
   ══════════════════════════════════════════════════════════════════════════ */

class MallemProductGallery extends HTMLElement {
  connectedCallback() {
    // RTL: translateX sign must flip so "next" moves in the correct visual direction
    this._isRTL = window.Mallem?.isRTL ?? (document.documentElement.dir === 'rtl');
    this._sign  = this._isRTL ? 1 : -1;

    this._track   = this.querySelector('[data-mallem-gallery-track]');
    this._slides  = Array.from(this.querySelectorAll('[data-mallem-slide]'));
    this._thumbs  = Array.from(this.querySelectorAll('[data-mallem-thumb]'));
    this._dots    = Array.from(this.querySelectorAll('[data-mallem-dot]'));
    this._announce = this.querySelector('[data-mallem-gallery-announce]');
    this._prevBtn  = this.querySelector('[data-mallem-gallery-prev]');
    this._nextBtn  = this.querySelector('[data-mallem-gallery-next]');

    this._currentIndex = 0;
    this._slideCount   = this._slides.length;

    if (!this._track || this._slideCount === 0) return;

    this._bindEvents();

    // Navigate to a variant's image when variant changes
    this._onVariantChanged = (e) => {
      const { variantId } = e.detail || {};
      if (!variantId) return;
      const targetSlide = this._slides.find(
        (s) => s.dataset.mallemVariantId === String(variantId)
      );
      if (targetSlide) {
        this.goTo(parseInt(targetSlide.dataset.mallemIndex, 10));
      }
    };
    document.addEventListener('mallem:variant:changed', this._onVariantChanged);
  }

  disconnectedCallback() {
    this._removeEvents();
    document.removeEventListener('mallem:variant:changed', this._onVariantChanged);
  }

  /* ── Public API ──────────────────────────────────────────────────────── */

  /**
   * Navigate to slide at `index`.
   * WHY rAF: DOM class + transform writes batched to avoid layout thrash.
   */
  goTo(index) {
    const next = clamp(index, 0, this._slideCount - 1);
    if (next === this._currentIndex && index === next) {
      // Still call if forced (e.g. variant change to same index)
    }
    this._currentIndex = next;

    raf(() => {
      // Move track
      const offset = this._sign * this._currentIndex * 100;
      this._track.style.transform = `translateX(${offset}%)`;

      // Sync thumbnails
      this._thumbs.forEach((thumb, i) => {
        const active = i === this._currentIndex;
        thumb.classList.toggle('mallem-gallery__thumb--active', active);
        thumb.setAttribute('aria-selected', String(active));
      });

      // Sync dots
      this._dots.forEach((dot, i) => {
        const active = i === this._currentIndex;
        dot.classList.toggle('mallem-gallery__dot--active', active);
        dot.setAttribute('aria-selected', String(active));
      });

      // ARIA live region — screen readers announce which image is active
      if (this._announce) {
        const slide = this._slides[this._currentIndex];
        const img   = slide?.querySelector('img');
        const label = img?.alt || `Image ${this._currentIndex + 1}`;
        this._announce.textContent = label;
      }

      // Dispatch for other components (e.g. lightbox, analytics)
      this.dispatchEvent(new CustomEvent('mallem:gallery:slide-changed', {
        bubbles: true,
        detail:  { index: this._currentIndex }
      }));
    });
  }

  /* ── Event binding ───────────────────────────────────────────────────── */

  _bindEvents() {
    // Thumbnail clicks
    this._onThumbClick = (e) => {
      const btn = e.target.closest('[data-mallem-thumb]');
      if (!btn) return;
      this.goTo(parseInt(btn.dataset.mallemIndex, 10));
    };
    this.addEventListener('click', this._onThumbClick);

    // Dot clicks
    this._onDotClick = (e) => {
      const dot = e.target.closest('[data-mallem-dot]');
      if (!dot) return;
      this.goTo(parseInt(dot.dataset.mallemIndex, 10));
    };
    this.addEventListener('click', this._onDotClick);

    // Prev / Next buttons
    if (this._prevBtn) {
      this._onPrev = () => this.goTo(this._currentIndex - 1);
      this._prevBtn.addEventListener('click', this._onPrev);
    }
    if (this._nextBtn) {
      this._onNext = () => this.goTo(this._currentIndex + 1);
      this._nextBtn.addEventListener('click', this._onNext);
    }

    // Keyboard — ArrowLeft / ArrowRight with RTL flip
    this._onKeydown = (e) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const direction = e.key === 'ArrowLeft' ? -1 : 1;
      // In RTL, left arrow = next, right arrow = prev (visual ↔ logical)
      const step = this._isRTL ? -direction : direction;
      this.goTo(this._currentIndex + step);
    };
    this.addEventListener('keydown', this._onKeydown);

    // Touch — passive for performance, 50px threshold
    this._touchStartX = 0;
    this._onTouchStart = (e) => {
      this._touchStartX = e.touches[0].clientX;
    };
    this._onTouchEnd = (e) => {
      const delta = e.changedTouches[0].clientX - this._touchStartX;
      if (Math.abs(delta) < 50) return;  // Below threshold — ignore micro-swipes

      // WHY negate delta in RTL: a swipe-left in RTL means "forward" not "back"
      const step = (this._isRTL ? delta : -delta) > 0 ? 1 : -1;
      this.goTo(this._currentIndex + step);
    };
    const viewport = this.querySelector('.mallem-gallery__viewport');
    if (viewport) {
      viewport.addEventListener('touchstart', this._onTouchStart, { passive: true });
      viewport.addEventListener('touchend',   this._onTouchEnd,   { passive: true });
      this._touchViewport = viewport;
    }
  }

  _removeEvents() {
    this.removeEventListener('click',   this._onThumbClick);
    this.removeEventListener('click',   this._onDotClick);
    this.removeEventListener('keydown', this._onKeydown);
    if (this._prevBtn && this._onPrev) this._prevBtn.removeEventListener('click', this._onPrev);
    if (this._nextBtn && this._onNext) this._nextBtn.removeEventListener('click', this._onNext);
    if (this._touchViewport) {
      this._touchViewport.removeEventListener('touchstart', this._onTouchStart);
      this._touchViewport.removeEventListener('touchend',   this._onTouchEnd);
    }
  }
}

if (!customElements.get('mallem-product-gallery')) {
  customElements.define('mallem-product-gallery', MallemProductGallery);
}

/* ══════════════════════════════════════════════════════════════════════════
   MALLEM STICKY ATC  —  Custom Element
   IntersectionObserver watches the main ATC button and shows/hides the bar.
   ══════════════════════════════════════════════════════════════════════════ */

class MallemStickyATC extends HTMLElement {
  connectedCallback() {
    this._mainAtcBtn = document.querySelector('[data-mallem-atc-button]');
    this._stickyBtn  = this.querySelector('[data-mallem-sticky-btn]');
    this._stickyPrice   = this.querySelector('[data-mallem-sticky-price]');
    this._stickyVariant = this.querySelector('[data-mallem-sticky-variant]');
    this._stickyBtnText = this.querySelector('[data-mallem-sticky-btn-text]');

    if (this._mainAtcBtn) {
      this._observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // When main ATC is off-screen → show sticky bar
            entry.isIntersecting ? this._hide() : this._show();
          });
        },
        { threshold: 0 }
      );
      this._observer.observe(this._mainAtcBtn);
    }

    // Sync on variant change
    this._onVariantChanged = (e) => this._syncVariant(e.detail || {});
    document.addEventListener('mallem:variant:changed', this._onVariantChanged);

    // Sticky button triggers main form submit (single source of truth)
    if (this._stickyBtn) {
      this._onStickyClick = () => {
        const form = document.querySelector('[data-mallem-product-form]');
        if (form) form.requestSubmit ? form.requestSubmit() : form.submit();
      };
      this._stickyBtn.addEventListener('click', this._onStickyClick);
    }
  }

  disconnectedCallback() {
    if (this._observer) this._observer.disconnect();
    document.removeEventListener('mallem:variant:changed', this._onVariantChanged);
    if (this._stickyBtn && this._onStickyClick) {
      this._stickyBtn.removeEventListener('click', this._onStickyClick);
    }
  }

  _show() {
    raf(() => {
      this.setAttribute('aria-hidden', 'false');
    });
  }

  _hide() {
    raf(() => {
      this.setAttribute('aria-hidden', 'true');
    });
  }

  /**
   * Sync sticky bar with selected variant data.
   * WHY: price and availability must reflect the chosen variant immediately.
   */
  _syncVariant({ price, compareAtPrice, available, variantTitle }) {
    raf(() => {
      if (this._stickyPrice && price != null) {
        this._stickyPrice.textContent = MallemProductMain.formatMoney(price);
      }

      if (this._stickyVariant && variantTitle) {
        this._stickyVariant.textContent = variantTitle;
      }

      if (this._stickyBtn) {
        this._stickyBtn.disabled        = !available;
        this._stickyBtn.ariaDisabled    = String(!available);
        if (this._stickyBtnText) {
          this._stickyBtnText.textContent = available
            ? (window.mallemi18n?.add_to_cart   || 'Add to cart')
            : (window.mallemi18n?.sold_out       || 'Sold out');
        }
      }
    });
  }
}

if (!customElements.get('mallem-sticky-atc')) {
  customElements.define('mallem-sticky-atc', MallemStickyATC);
}

/* ══════════════════════════════════════════════════════════════════════════
   MALLEM STOCK COUNTER  —  Plain class (not a Custom Element)
   Evaluates inventory thresholds and updates CSS class + text.
   ══════════════════════════════════════════════════════════════════════════ */

class MallemStockCounter {
  /**
   * @param {HTMLElement} root  The [data-mallem-stock-display] element.
   */
  constructor(root) {
    if (!root) return;
    this._root   = root;
    this._text   = root.querySelector('.mallem-stock__text');
    this._low    = parseInt(root.dataset.mallemLowThreshold,    10) || 5;
    this._medium = parseInt(root.dataset.mallemMediumThreshold, 10) || 20;

    this._onVariantChanged = (e) => {
      const { inventoryQuantity, inventoryPolicy } = e.detail || {};
      this.update(inventoryQuantity ?? 0, inventoryPolicy ?? 'deny');
    };
    document.addEventListener('mallem:variant:changed', this._onVariantChanged);
  }

  /**
   * Evaluate qty against thresholds and update DOM.
   * @param {number} qty
   * @param {string} policy  'continue' | 'deny'
   */
  update(qty, policy) {
    const root = this._root;
    if (!root) return;

    // Remove all state classes first
    root.classList.remove('mallem-stock--low', 'mallem-stock--medium', 'mallem-stock--out');

    let text   = '';
    let hidden = true;

    if (policy === 'continue') {
      // Shopify allows purchase even when OOS — show nothing
      hidden = true;
    } else if (qty <= 0) {
      root.classList.add('mallem-stock--out');
      text   = window.mallemi18n?.stock_out    || 'Out of stock';
      hidden = false;
    } else if (qty <= this._low) {
      root.classList.add('mallem-stock--low');
      text   = (window.mallemi18n?.stock_low   || 'Only {{ count }} left in stock').replace('{{ count }}', qty);
      hidden = false;
    } else if (qty <= this._medium) {
      root.classList.add('mallem-stock--medium');
      text   = window.mallemi18n?.stock_medium || 'Limited stock available';
      hidden = false;
    }
    // qty > medium → healthy stock, hide the widget

    raf(() => {
      root.hidden = hidden;
      if (this._text) this._text.textContent = text;
      root.dataset.mallemInventory = String(qty);
    });
  }

  destroy() {
    document.removeEventListener('mallem:variant:changed', this._onVariantChanged);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   MALLEM PRODUCT MAIN  —  Orchestration class
   Wires together: variant selectors → event dispatch → ATC form → cart fetch.
   ══════════════════════════════════════════════════════════════════════════ */

class MallemProductMain {
  constructor(container) {
    if (!container) return;
    this._container = container;
    this._form      = container.querySelector('[data-mallem-product-form]');
    this._atcBtn    = container.querySelector('[data-mallem-atc-button]');
    this._atcText   = container.querySelector('[data-mallem-atc-text]');
    this._priceEl   = container.querySelector('[data-mallem-price]');
    this._compareEl = container.querySelector('.mallem-product-info__price-compare s');
    this._variantInput = container.querySelector('[data-mallem-variant-input]');
    this._errorEl      = container.querySelector('[data-mallem-form-error]');
    this._qtyInput     = container.querySelector('[data-mallem-qty-input]');
    this._qtyHidden    = container.querySelector('[data-mallem-qty-hidden]');

    // Stock counter
    const stockRoot = container.querySelector('[data-mallem-stock-display]');
    this._stockCounter = new MallemStockCounter(stockRoot);

    this._bindVariantSelectors();
    this._bindQtyStepper();
    this._bindFormSubmit();
  }

  /* ── Variant selector integration ─────────────────────────────────────── */

  /**
   * Listen for native <select> changes OR custom mallem-swatches events.
   * When a new variant is selected, dispatch the canonical event and update UI.
   */
  _bindVariantSelectors() {
    // Native select fallback
    const selects = this._container.querySelectorAll('[data-mallem-option-select]');
    selects.forEach((sel) => {
      sel.addEventListener('change', () => this._onSelectorChange());
    });

    // mallem-variant-swatches dispatches this custom event
    this._container.addEventListener('mallem:swatch:selected', () => {
      this._onSelectorChange();
    });
  }

  _onSelectorChange() {
    // Collect current option values → find matching variant via Shopify product JSON
    const productJSON = this._getProductJSON();
    if (!productJSON) return;

    const selectedOptions = this._getSelectedOptions();
    const variant = this._findVariant(productJSON.variants, selectedOptions);
    if (!variant) return;

    this._applyVariant(variant);
  }

  _getSelectedOptions() {
    const selects = this._container.querySelectorAll('[data-mallem-option-select]');
    return Array.from(selects).map((s) => s.value);
  }

  _getProductJSON() {
    if (this._productJSON) return this._productJSON;
    const scriptEl = document.getElementById('mallem-product-json');
    if (scriptEl) {
      try {
        this._productJSON = JSON.parse(scriptEl.textContent);
      } catch (e) {
        console.warn('[Mallem] Could not parse product JSON', e);
        return null;
      }
    }
    return this._productJSON || null;
  }

  _findVariant(variants, options) {
    return variants.find((v) =>
      v.options.every((opt, i) => opt === options[i])
    ) || null;
  }

  /**
   * Apply a variant to the page: update hidden input, price, ATC state, dispatch event.
   * @param {Object} variant  Shopify variant object from product JSON.
   */
  _applyVariant(variant) {
    raf(() => {
      // Update hidden form input
      if (this._variantInput) {
        this._variantInput.value = variant.id;
      }

      // Update price
      if (this._priceEl) {
        this._priceEl.textContent = MallemProductMain.formatMoney(variant.price);
      }
      if (this._compareEl) {
        if (variant.compare_at_price > variant.price) {
          this._compareEl.textContent = MallemProductMain.formatMoney(variant.compare_at_price);
          this._compareEl.closest('.mallem-product-info__price-compare').hidden = false;
        } else {
          const compareWrapper = this._compareEl.closest('.mallem-product-info__price-compare');
          if (compareWrapper) compareWrapper.hidden = true;
        }
      }

      // Update ATC button state
      if (this._atcBtn) {
        const available = variant.available;
        this._atcBtn.disabled     = !available;
        this._atcBtn.ariaDisabled = String(!available);
        if (this._atcText) {
          this._atcText.textContent = available
            ? (window.mallemi18n?.add_to_cart || 'Add to cart')
            : (window.mallemi18n?.sold_out    || 'Sold out');
        }
      }

      // Update qty max
      if (this._qtyInput && variant.inventory_quantity > 0) {
        this._qtyInput.max = variant.inventory_quantity;
      }
    });

    // Dispatch canonical event — gallery, sticky ATC, stock counter all listen
    document.dispatchEvent(new CustomEvent('mallem:variant:changed', {
      bubbles: true,
      detail: {
        variantId:         variant.id,
        price:             variant.price,
        compareAtPrice:    variant.compare_at_price,
        available:         variant.available,
        inventoryQuantity: variant.inventory_quantity,
        inventoryPolicy:   variant.inventory_policy,
        variantTitle:      variant.title,
      }
    }));
  }

  /* ── Quantity stepper ─────────────────────────────────────────────────── */

  _bindQtyStepper() {
    const minusBtn = this._container.querySelector('[data-mallem-qty-minus]');
    const plusBtn  = this._container.querySelector('[data-mallem-qty-plus]');

    if (minusBtn) {
      minusBtn.addEventListener('click', () => this._adjustQty(-1));
    }
    if (plusBtn) {
      plusBtn.addEventListener('click', () => this._adjustQty(1));
    }

    if (this._qtyInput) {
      this._qtyInput.addEventListener('change', () => {
        const val = parseInt(this._qtyInput.value, 10);
        if (isNaN(val) || val < 1) this._qtyInput.value = 1;
        this._syncQtyHidden();
      });
    }
  }

  _adjustQty(delta) {
    if (!this._qtyInput) return;
    const current = parseInt(this._qtyInput.value, 10) || 1;
    const max     = parseInt(this._qtyInput.max, 10)   || 999;
    this._qtyInput.value = clamp(current + delta, 1, max);
    this._syncQtyHidden();
  }

  _syncQtyHidden() {
    if (this._qtyHidden && this._qtyInput) {
      this._qtyHidden.value = this._qtyInput.value;
    }
  }

  /* ── ATC form submit (AJAX) ───────────────────────────────────────────── */

  _bindFormSubmit() {
    if (!this._form) return;
    this._form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._submitCart();
    });
  }

  async _submitCart() {
    if (!this._form || !this._atcBtn) return;

    // Optimistic loading state
    this._atcBtn.classList.add('mallem-btn--loading');
    this._atcBtn.disabled = true;
    this._hideError();

    const formData = new FormData(this._form);

    try {
      const resp = await fetch(this._form.action || '/cart/add.js', {
        method:      'POST',
        headers:     { Accept: 'application/json' },
        body:        formData,
        credentials: 'same-origin',
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.description || `HTTP ${resp.status}`);
      }

      const data = await resp.json();

      // Notify other components (cart drawer, free shipping bar, etc.)
      document.dispatchEvent(new CustomEvent('mallem:cart:updated', {
        bubbles: true,
        detail:  { item: data }
      }));

    } catch (err) {
      this._showError(err.message || 'Could not add item. Please try again.');
    } finally {
      this._atcBtn.classList.remove('mallem-btn--loading');
      // Re-enable only if variant is available
      const variantInput = this._variantInput;
      if (variantInput) {
        // Button state is re-set on next variant change; restore if currently available
        const productJSON = this._getProductJSON();
        if (productJSON) {
          const variant = productJSON.variants.find(
            (v) => String(v.id) === variantInput.value
          );
          if (variant) this._atcBtn.disabled = !variant.available;
        } else {
          this._atcBtn.disabled = false;
        }
      }
    }
  }

  _showError(message) {
    if (!this._errorEl) return;
    this._errorEl.textContent = message;
    this._errorEl.hidden      = false;
  }

  _hideError() {
    if (!this._errorEl) return;
    this._errorEl.hidden      = true;
    this._errorEl.textContent = '';
  }

  /* ── Static helpers ───────────────────────────────────────────────────── */

  /**
   * Format Shopify money (integer cents) to store currency string.
   * Falls back to a simple divide-by-100 if Shopify.formatMoney unavailable.
   * @param {number} cents
   * @returns {string}
   */
  static formatMoney(cents) {
    if (window.Shopify?.formatMoney) {
      return window.Shopify.formatMoney(cents, window.Shopify.money_format);
    }
    return `${(cents / 100).toFixed(2)}`;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-mallem-product-main]').forEach((container) => {
    new MallemProductMain(container);
  });
});

// Export for potential external use (Shopify theme app extensions)
if (typeof window !== 'undefined') {
  window.MallemProductMain = MallemProductMain;
}
