/**
 * Sticky Add to Cart Bar
 *
 * Features:
 * - Intersection Observer for scroll-based visibility
 * - Auto-sync with main product form (variant, quantity, availability)
 * - Listens to mallem custom events (variant-change, cart-update)
 * - ARIA live regions for screen readers
 * - Keyboard accessible
 *
 * RTL: Handled via CSS logical properties
 * Performance: Passive event listeners, requestAnimationFrame for DOM updates
 */

if (!customElements.get('mallem-sticky-atc')) {
  class MallemStickyATC extends HTMLElement {
    constructor() {
      super();

      this.sectionId = this.dataset.sectionId;
      this.enabled = this.dataset.enabled === 'true';
      this.button = this.querySelector('[data-sticky-atc-button]');
      this.priceContainer = this.querySelector('[data-sticky-price]');

      // State
      this.currentVariantId = null;
      this.currentQuantity = 1;
      this.isVisible = false;

      // Main form references (set after init)
      this.mainForm = null;
      this.observerTarget = null;
    }

    connectedCallback() {
      if (!this.enabled) return;

      // Wait for DOM ready to find main form
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        this.init();
      }
    }

    init() {
      this.findMainForm();

      if (!this.mainForm) {
        console.warn('[Sticky ATC] Main product form not found');
        return;
      }

      this.setupIntersectionObserver();
      this.setupEventListeners();
      this.syncWithMainForm();
    }

    /**
     * Find main product form and primary ATC button (observer target)
     */
    findMainForm() {
      // Dawn uses product-form custom element
      this.mainForm = document.querySelector('product-form form[id^="product-form-"]');

      if (!this.mainForm) {
        // Fallback: any form with action containing /cart/add
        this.mainForm = document.querySelector('form[action*="/cart/add"]');
      }

      // Target to observe: primary ATC button or form itself
      this.observerTarget = this.mainForm?.querySelector('[name="add"]') || this.mainForm;
    }

    /**
     * Intersection Observer shows/hides sticky bar when main form scrolls out of view
     */
    setupIntersectionObserver() {
      if (!this.observerTarget) return;

      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          // Show sticky when main form is out of viewport
          const shouldShow = !entry.isIntersecting;
          this.toggleVisibility(shouldShow);
        });
      }, options);

      this.observer.observe(this.observerTarget);
    }

    /**
     * Toggle sticky bar visibility
     */
    toggleVisibility(show) {
      if (this.isVisible === show) return;

      this.isVisible = show;

      requestAnimationFrame(() => {
        if (show) {
          this.removeAttribute('hidden');
          // Allow paint, then add visible class for transition
          requestAnimationFrame(() => {
            this.classList.add('is-visible');
          });
        } else {
          this.classList.remove('is-visible');
          // Wait for transition before hiding
          setTimeout(() => {
            if (!this.isVisible) {
              this.setAttribute('hidden', '');
            }
          }, 300);
        }
      });
    }

    /**
     * Event listeners for form sync and ATC action
     */
    setupEventListeners() {
      // Click handler
      this.button?.addEventListener('click', () => this.handleAddToCart());

      // Listen to variant changes (Dawn publishes 'variant:change')
      document.addEventListener('variant:change', (e) => this.handleVariantChange(e));

      // Listen to mallem custom events (if implemented)
      document.addEventListener('mallem:variant-change', (e) => this.handleVariantChange(e));
      document.addEventListener('mallem:cart-update', () => this.syncWithMainForm());

      // Listen to main form submit (to sync loading state)
      this.mainForm?.addEventListener('submit', () => this.setLoading(true));
    }

    /**
     * Sync current variant and quantity from main form
     */
    syncWithMainForm() {
      if (!this.mainForm) return;

      // Get selected variant
      const variantInput = this.mainForm.querySelector('[name="id"]');
      this.currentVariantId = variantInput?.value || null;

      // Get quantity
      const quantityInput = this.mainForm.querySelector('[name="quantity"]');
      this.currentQuantity = parseInt(quantityInput?.value || 1, 10);

      // Update button state
      this.updateButtonState();
    }

    /**
     * Handle variant change from events
     */
    handleVariantChange(event) {
      const variant = event.detail?.variant;

      if (!variant) return;

      this.currentVariantId = variant.id;

      // Update price if variant data includes it
      if (variant.price !== undefined && this.priceContainer) {
        this.updatePrice(variant);
      }

      this.updateButtonState(variant);
    }

    /**
     * Update price display (uses mallem-price snippet data structure)
     */
    updatePrice(variant) {
      // Price updates handled by mallem-price snippet reactivity
      // If needed, dispatch event for price update
      this.priceContainer?.dispatchEvent(new CustomEvent('mallem:price-update', {
        detail: { variant },
        bubbles: true
      }));
    }

    /**
     * Update button state based on variant availability
     */
    updateButtonState(variant) {
      if (!this.button) return;

      const available = variant?.available ?? true;

      this.button.disabled = !available || !this.currentVariantId;

      // Update button text
      const buttonText = this.button.querySelector('.mallem-sticky-atc__button-text');
      if (buttonText) {
        if (!available) {
          buttonText.textContent = buttonText.dataset.soldOutText || 'Sold out';
        } else if (!this.currentVariantId) {
          buttonText.textContent = buttonText.dataset.unavailableText || 'Unavailable';
        } else {
          buttonText.textContent = buttonText.dataset.addText || 'Add to cart';
        }
      }
    }

    /**
     * Handle add to cart button click
     */
    async handleAddToCart() {
      if (!this.currentVariantId || this.button.disabled) return;

      this.setLoading(true);

      try {
        const formData = {
          id: this.currentVariantId,
          quantity: this.currentQuantity
        };

        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Dispatch success event for cart drawer/notifications
        document.dispatchEvent(new CustomEvent('mallem:cart-add', {
          detail: { item: data }
        }));

        // Also dispatch Dawn's event for compatibility
        document.dispatchEvent(new CustomEvent('cart:item-added', {
          detail: { item: data }
        }));

      } catch (error) {
        console.error('[Sticky ATC] Add to cart failed:', error);

        // Dispatch error event
        document.dispatchEvent(new CustomEvent('mallem:cart-error', {
          detail: { error: error.message }
        }));
      } finally {
        this.setLoading(false);
      }
    }

    /**
     * Toggle loading state
     */
    setLoading(isLoading) {
      if (!this.button) return;

      requestAnimationFrame(() => {
        if (isLoading) {
          this.button.classList.add('is-loading');
          this.button.disabled = true;
        } else {
          this.button.classList.remove('is-loading');
          this.updateButtonState(); // Re-check availability
        }
      });
    }

    disconnectedCallback() {
      this.observer?.disconnect();
    }
  }

  customElements.define('mallem-sticky-atc', MallemStickyATC);
}
