/**
 * ============================================================================
 * MALLEM QUICK VIEW MODAL
 * ============================================================================
 *
 * Handles quick view modal functionality for product cards.
 * Fetches product data via AJAX and displays in modal overlay.
 *
 * FEATURES:
 * - Event delegation for dynamic product cards
 * - AJAX product fetch with error handling
 * - Body scroll lock when modal open
 * - Keyboard navigation (Escape to close)
 * - Focus trap (basic implementation)
 * - Accessible (ARIA attributes)
 * - RTL-compatible
 *
 * DEPENDENCIES:
 * - snippets/mallem-quick-view-modal.liquid (modal markup)
 * - assets/mallem-quick-view.css (modal styles)
 *
 * HOOKS:
 * - [data-mallem-quick-view-trigger] - Triggers on product card
 * - [data-mallem-quick-view-modal] - Modal container
 * - [data-mallem-quick-view-content] - Content injection target
 * - [data-mallem-quick-view-close] - Close triggers
 *
 * Author: mallem dev company
 * Version: 1.0.0
 */

class MallemQuickView {
  constructor() {
    // Cache DOM elements (performance: avoid repeated queries)
    this.modal = document.querySelector('[data-mallem-quick-view-modal]');
    this.modalContent = document.querySelector('[data-mallem-quick-view-content]');
    this.closeTriggers = document.querySelectorAll('[data-mallem-quick-view-close]');

    // State management
    this.isOpen = false;
    this.activeProduct = null;
    this.lastFocusedElement = null; // For focus restoration after close

    // Abort controller for fetch requests (allows cancellation)
    this.abortController = null;

    // Initialize if modal exists in DOM
    if (this.modal && this.modalContent) {
      this.init();
    }
  }

  /**
   * Initialize event listeners
   * Uses event delegation for performance with many product cards
   */
  init() {
    // Event delegation on document for dynamic product cards
    // Why: Product cards may be added via AJAX (infinite scroll, filtering)
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-mallem-quick-view-trigger]');
      if (trigger) {
        e.preventDefault();
        this.handleTriggerClick(trigger);
      }
    });

    // Close button clicks
    this.closeTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => this.close());
    });

    // Escape key to close
    // Why: Standard modal UX pattern for accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Focus trap: keep focus within modal when open
    // Why: Prevents keyboard users from tabbing to background content
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && this.isOpen) {
        this.handleTabKey(e);
      }
    });
  }

  /**
   * Handle quick view trigger click
   * @param {HTMLElement} trigger - The clicked trigger element
   */
  handleTriggerClick(trigger) {
    const handle = trigger.dataset.productHandle;
    const productId = trigger.dataset.productId;

    if (!handle) {
      console.error('Mallem Quick View: Missing product handle');
      return;
    }

    // Store last focused element for restoration on close
    // Why: Accessibility - return focus to trigger after modal closes
    this.lastFocusedElement = trigger;

    this.open();
    this.fetchProduct(handle, productId);
  }

  /**
   * Open modal
   */
  open() {
    if (this.isOpen) return;

    this.isOpen = true;

    // Show modal
    this.modal.hidden = false;
    this.modal.setAttribute('aria-hidden', 'false');

    // Lock body scroll
    // Why: Prevent background scrolling on mobile, improve UX
    document.body.style.overflow = 'hidden';

    // Add active class for CSS animations
    // Why: Allows fade-in animation via CSS transition
    requestAnimationFrame(() => {
      this.modal.classList.add('mallem-quick-view-modal--active');
    });

    // Focus modal for screen readers
    // Why: Announce modal open to assistive technology
    this.modal.focus();

    // Dispatch custom event for analytics/tracking
    document.dispatchEvent(new CustomEvent('mallem:quickview:open'));
  }

  /**
   * Close modal
   */
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;

    // Remove active class (triggers fade-out animation)
    this.modal.classList.remove('mallem-quick-view-modal--active');

    // Wait for animation to complete before hiding
    // Why: Smooth visual transition instead of instant disappear
    setTimeout(() => {
      this.modal.hidden = true;
      this.modal.setAttribute('aria-hidden', 'true');

      // Unlock body scroll
      document.body.style.overflow = '';

      // Clear modal content
      // Why: Prevent stale content from previous product
      this.clearContent();

      // Restore focus to trigger element
      // Why: Accessibility - return keyboard focus to where user was
      if (this.lastFocusedElement) {
        this.lastFocusedElement.focus();
        this.lastFocusedElement = null;
      }
    }, 300); // Match CSS transition duration

    // Abort ongoing fetch if modal closed during loading
    if (this.abortController) {
      this.abortController.abort();
    }

    // Dispatch custom event for analytics/tracking
    document.dispatchEvent(new CustomEvent('mallem:quickview:close'));
  }

  /**
   * Fetch product HTML via AJAX
   * @param {string} handle - Product handle
   * @param {string} productId - Product ID for tracking
   */
  async fetchProduct(handle, productId) {
    // Cancel any ongoing fetch
    if (this.abortController) {
      this.abortController.abort();
    }

    // Create new abort controller
    // Why: Allows cancelling fetch if user closes modal or clicks new product
    this.abortController = new AbortController();

    // Show loading state
    this.showLoading();

    try {
      // Fetch product HTML
      // Using ?view=quick-view to get custom template (if created)
      // Otherwise falls back to default product template
      const response = await fetch(`/products/${handle}?view=quick-view`, {
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Create temporary container to parse HTML
      // Why: Allows extracting specific content from response
      const temp = document.createElement('div');
      temp.innerHTML = html;

      // Extract product content
      // Try to find .product section, otherwise use entire response
      const productContent = temp.querySelector('.product') || temp;

      // Inject into modal
      this.modalContent.innerHTML = productContent.innerHTML;

      // Initialize any Shopify features in injected content
      // Why: Variant selectors, quantity inputs, etc. need JS initialization
      this.initializeProductFeatures();

      // Update modal title with product name
      const productTitle = temp.querySelector('.product__title');
      if (productTitle) {
        const titleElement = this.modal.querySelector('#mallem-quick-view-title');
        if (titleElement) {
          titleElement.textContent = productTitle.textContent;
        }
      }

      // Dispatch custom event with product data for analytics
      document.dispatchEvent(new CustomEvent('mallem:quickview:loaded', {
        detail: { handle, productId }
      }));

    } catch (error) {
      // Don't show error if request was aborted (user action)
      if (error.name === 'AbortError') {
        return;
      }

      console.error('Mallem Quick View: Fetch error', error);
      this.showError();

      // Dispatch error event for monitoring
      document.dispatchEvent(new CustomEvent('mallem:quickview:error', {
        detail: { handle, productId, error: error.message }
      }));
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.modalContent.innerHTML = `
      <div class="mallem-quick-view-modal__loading">
        <div class="mallem-quick-view-modal__spinner"></div>
        <p>Loading...</p>
      </div>
    `;
  }

  /**
   * Show error state
   */
  showError() {
    this.modalContent.innerHTML = `
      <div class="mallem-quick-view-modal__error">
        <p>Unable to load product. Please try again.</p>
        <button type="button" data-mallem-quick-view-close class="button">Close</button>
      </div>
    `;

    // Re-attach close listener to new button
    const closeBtn = this.modalContent.querySelector('[data-mallem-quick-view-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  /**
   * Clear modal content
   */
  clearContent() {
    this.modalContent.innerHTML = '';
  }

  /**
   * Initialize Shopify product features in injected content
   * Variant selectors, quantity inputs, add to cart, etc.
   */
  initializeProductFeatures() {
    // Re-run Shopify's product scripts if they exist
    // Why: Variant selectors need JS to update price/image on change
    if (typeof Shopify !== 'undefined' && Shopify.ProductForm) {
      const form = this.modalContent.querySelector('form[action*="/cart/add"]');
      if (form) {
        // Initialize Shopify product form
        new Shopify.ProductForm(form, {
          onFormSubmit: (event) => {
            // Optional: Custom handling for add to cart
            // Could show success message, update cart drawer, etc.
          }
        });
      }
    }

    // Initialize any custom scripts (variant swatches, etc.)
    // Dispatch event for other modules to hook into
    document.dispatchEvent(new CustomEvent('mallem:quickview:content-ready', {
      detail: { container: this.modalContent }
    }));
  }

  /**
   * Handle Tab key for focus trap
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleTabKey(e) {
    // Get all focusable elements within modal
    // Why: Only these elements should be tabbable when modal is open
    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const focusableArray = Array.from(focusableElements);
    const firstElement = focusableArray[0];
    const lastElement = focusableArray[focusableArray.length - 1];

    // Trap focus within modal
    if (e.shiftKey) {
      // Shift + Tab: going backwards
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: going forwards
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
}

// Initialize on DOM ready
// Why: Ensures modal exists before creating instance
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mallemQuickView = new MallemQuickView();
  });
} else {
  window.mallemQuickView = new MallemQuickView();
}
