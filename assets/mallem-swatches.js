/*!
 * mallem-swatches.js
 * Variant swatch interaction module for mallem theme product cards.
 *
 * Responsibilities:
 *   - Swatch click → set active state, update card image, variant input, ATC button
 *   - Swatch mouseenter (desktop pointer only) → preview image temporarily
 *   - Wrapper mouseleave → revert to active swatch's image
 *   - Dispatch mallem:swatch:changed so cart drawer, analytics, etc. can react
 *
 * Architecture: IIFE, one class instance per swatch wrapper, event delegation
 * RTL: No directional JS needed — CSS logical properties handle layout automatically
 * Dependencies: None (vanilla ES6, no jQuery)
 *
 * Author: mallem dev
 * Version: 1.0.0
 */

(function () {
  'use strict';

  /**
   * MallemSwatches
   * Manages swatch interactions for a single product card.
   *
   * WHY class-per-wrapper: Each card is isolated — state never bleeds between cards.
   * AJAX grids can add cards dynamically; every new wrapper gets its own instance.
   */
  class MallemSwatches {
    /**
     * @param {HTMLElement} wrapper — [data-mallem-swatches-wrapper] element
     */
    constructor(wrapper) {
      this.wrapper    = wrapper;
      this.productId  = wrapper.dataset.mallemProductId;
      this.optionIndex = parseInt(wrapper.dataset.mallemOptionIndex || '0', 10);
      this.swatchType  = wrapper.dataset.mallemSwatchType;

      /**
       * WHY !== 'false' check: data attributes are always strings.
       * Anything other than the literal string "false" is treated as enabled.
       */
      this.enableHover = wrapper.dataset.mallemEnableHover !== 'false';

      /**
       * WHY closest card scope: Queries are scoped to the parent card so we never
       * accidentally target elements in a neighbouring card on the same page.
       */
      this.card = wrapper.closest('[data-mallem-product-card]');
      if (!this.card) return;   // Guard: snippet rendered outside a card context

      /**
       * WHY input[data-mallem-variant-id]: The card wrapper div also carries
       * data-mallem-variant-id for read-only consumption by other modules.
       * We use the input-specific selector to only target the writable form field.
       */
      this.cardImage      = this.card.querySelector('[data-mallem-card-image]');
      this.variantInput   = this.card.querySelector('input[data-mallem-variant-id]');
      this.addToCartBtn   = this.card.querySelector('[data-mallem-add-to-cart]');

      /** Track active swatch for hover-revert: hover is preview, click is commit. */
      this.activeSwatch = wrapper.querySelector('.mallem-swatch--active');

      this._bindEvents();
    }

    // ─── Event binding ────────────────────────────────────────────────────────

    /**
     * WHY event delegation on wrapper: One listener handles all swatch clicks —
     * more efficient than per-button listeners and survives DOM mutation.
     */
    _bindEvents() {
      this.wrapper.addEventListener('click', this._onSwatchClick.bind(this));

      /**
       * WHY pointer:fine media query: Touch devices fire mouseover/mouseenter on tap,
       * causing double-updates. pointer:fine reliably identifies mouse/trackpad users.
       * We evaluate once at bind time — cheaper than per-event checks.
       */
      const hasTrueHover =
        window.matchMedia('(hover: hover) and (pointer: fine)').matches;

      if (hasTrueHover && this.enableHover) {
        this.wrapper.addEventListener('mouseover',   this._onSwatchHover.bind(this));
        this.wrapper.addEventListener('mouseleave',  this._onWrapperLeave.bind(this));
      }
    }

    // ─── Event handlers ───────────────────────────────────────────────────────

    _onSwatchClick(event) {
      const swatch = event.target.closest('[data-mallem-swatch]');
      if (!swatch) return;

      /**
       * WHY do nothing but not prevent: aria-disabled keeps sold-out swatches
       * focusable so keyboard users can learn the option exists. We skip updating
       * state but don't swallow the event — keyboard navigation stays intact.
       */
      if (swatch.dataset.available === 'false') return;

      this._setActive(swatch);
      this._syncImage(swatch);
      this._syncVariantInput(swatch);
      this._syncAddToCart(swatch);
      this._dispatchChanged(swatch);
    }

    _onSwatchHover(event) {
      const swatch = event.target.closest('[data-mallem-swatch]');
      if (!swatch) return;

      /**
       * WHY check imageUrl: Swatches without a variant-specific image should not
       * update the card — the current image (from the active swatch) is already correct.
       */
      if (swatch.dataset.imageUrl) this._syncImage(swatch);
    }

    _onWrapperLeave() {
      /**
       * WHY revert to activeSwatch on leave: Hover is a preview action.
       * The confirmed selection (last clicked) should always be restored on exit.
       */
      if (this.activeSwatch) this._syncImage(this.activeSwatch);
    }

    // ─── State updates ────────────────────────────────────────────────────────

    _setActive(swatch) {
      /** Remove active from all siblings, then set on the clicked one. */
      this.wrapper.querySelectorAll('[data-mallem-swatch]').forEach(s => {
        s.classList.remove('mallem-swatch--active');
        s.setAttribute('aria-pressed', 'false');
      });
      swatch.classList.add('mallem-swatch--active');
      swatch.setAttribute('aria-pressed', 'true');
      this.activeSwatch = swatch;
    }

    /**
     * WHY update both src AND srcset: Updating only src leaves srcset stale.
     * The browser picks from srcset when rendering — the old srcset would cause
     * it to load the previous variant's image on high-DPI or wide viewports.
     */
    _syncImage(swatch) {
      if (!this.cardImage) return;
      const url    = swatch.dataset.imageUrl;
      const srcset = swatch.dataset.imageSrcset;
      if (!url) return;

      this.cardImage.src = url;
      if (srcset) this.cardImage.srcset = srcset;
    }

    _syncVariantInput(swatch) {
      if (!this.variantInput) return;
      const id = swatch.dataset.variantId;
      if (id) this.variantInput.value = id;
    }

    /**
     * WHY sync per-variant: product.available can be true while a specific variant
     * is sold out. The ATC button must reflect the selected variant's stock, not
     * the product's aggregate availability.
     */
    _syncAddToCart(swatch) {
      if (!this.addToCartBtn) return;
      const available = swatch.dataset.available === 'true';
      this.addToCartBtn.disabled = !available;

      /**
       * WHY set aria-disabled as well as disabled: Screen readers announce the
       * disabled state via the native property, but aria-disabled makes the state
       * explicitly queryable by third-party assistive tech and automated tests.
       */
      if (!available) {
        this.addToCartBtn.setAttribute('aria-disabled', 'true');
      } else {
        this.addToCartBtn.removeAttribute('aria-disabled');
      }
    }

    _dispatchChanged(swatch) {
      /**
       * WHY bubbles: true: Document-level listeners (analytics, cart drawer, sticky ATC)
       * receive the event without needing a reference to each individual card element.
       * WHY composed: true: Future-proofs for shadow DOM usage.
       */
      this.wrapper.dispatchEvent(
        new CustomEvent('mallem:swatch:changed', {
          bubbles:  true,
          composed: true,
          detail: {
            variantId: swatch.dataset.variantId,
            productId: this.productId,
            value:     swatch.dataset.value,
            available: swatch.dataset.available === 'true',
          },
        })
      );
    }
  }

  // ─── Init helpers ─────────────────────────────────────────────────────────

  /**
   * Find all uninitialised swatch wrappers within scope and create instances.
   *
   * WHY scope parameter: AJAX product grids pass their container element so we only
   * scan new DOM nodes — no redundant queries on the entire document.
   *
   * @param {Document|HTMLElement} [scope=document]
   */
  function initSwatches(scope) {
    const root = scope || document;
    root.querySelectorAll('[data-mallem-swatches-wrapper]').forEach(wrapper => {
      /** Guard against double-init on wrappers that already have an instance. */
      if (wrapper._mallemSwatchesInst) return;
      wrapper._mallemSwatchesInst = new MallemSwatches(wrapper);
    });
  }

  // ─── Auto-init ────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initSwatches());
  } else {
    /**
     * WHY immediate call: Script may be deferred and execute after DOMContentLoaded
     * has already fired (e.g., loaded via script[defer] or dynamic import).
     */
    initSwatches();
  }

  /**
   * WHY listen for mallem:products:loaded: Collection AJAX filters, infinite scroll,
   * and product recommendation carousels inject new card markup after page load.
   * mallem-product-card.js and section renderers dispatch this event when done.
   * We re-init only within the affected container to avoid redundant work.
   */
  document.addEventListener('mallem:products:loaded', function (e) {
    initSwatches(e.detail?.container || document);
  });

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * window.MallemSwatches.init([scope]) — call after dynamically injecting cards.
   * WHY window namespace: Accessible to inline scripts, section JS, and third-party
   * integrations without needing a module bundler.
   */
  window.MallemSwatches = {
    init:    initSwatches,
    version: '1.0.0',
  };

})();
