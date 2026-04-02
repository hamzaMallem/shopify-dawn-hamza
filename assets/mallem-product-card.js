/**
 * ============================================================================
 * MALLEM PRODUCT CARD JAVASCRIPT
 * ============================================================================
 *
 * Handles AJAX add-to-cart functionality for product cards.
 * Provides loading states, error handling, and custom event dispatching.
 *
 * FEATURES:
 * - AJAX add to cart (no page reload)
 * - Loading state with spinner animation
 * - Error handling with user feedback
 * - RTL-aware (respects window.Mallem.isRTL)
 * - Custom events for cart integration
 * - Progressive enhancement (works without JS)
 *
 * EVENTS DISPATCHED:
 * - mallem:product:added - Successful add to cart
 * - mallem:cart:error - Add to cart failed
 *
 * WHY class-based: Encapsulation, easy to extend, clear API
 * WHY AJAX: Better UX - no page reload, instant feedback
 * WHY events: Decoupled architecture, other modules can listen
 *
 * Author: mallem dev company
 * Version: 1.0.0
 */

/**
 * WHY IIFE: Prevents global namespace pollution, creates private scope
 * All code runs immediately but doesn't leak variables to window
 */
(function() {
  'use strict';

  /**
   * MallemProductCard Class
   * Manages product card interactions and cart operations
   *
   * WHY class: Object-oriented approach, easier to maintain and extend
   * WHY private methods: Encapsulation, clear public vs private API
   */
  class MallemProductCard {
    /**
     * Constructor
     * @param {HTMLElement} element - The product card DOM element
     *
     * WHY data attributes: Stores card-specific data without JavaScript globals
     */
    constructor(element) {
      this.card = element;
      this.form = element.querySelector('[data-mallem-product-form]');
      this.button = element.querySelector('[data-mallem-add-to-cart]');

      /**
       * WHY fallback: Even if card lacks attributes, code doesn't break
       * Defensive programming for edge cases
       */
      this.productId = element.dataset.mallemProductId || null;
      this.variantId = element.dataset.mallemVariantId || null;

      /**
       * WHY bind this: Ensures 'this' refers to class instance in event handlers
       * Without bind, 'this' would refer to the form element
       */
      this.handleSubmit = this.handleSubmit.bind(this);

      /**
       * WHY init: Separates construction from initialization
       * Allows constructor to be lightweight, logic in dedicated method
       */
      this.init();
    }

    /**
     * Initialize component
     * WHY: Sets up event listeners and checks for required elements
     */
    init() {
      if (!this.form || !this.button) {
        /**
         * WHY early return: If critical elements missing, don't proceed
         * Prevents errors from trying to operate on null elements
         */
        console.warn('[MallemProductCard] Form or button not found in card', this.card);
        return;
      }

      this.attachEventListeners();
    }

    /**
     * Attach event listeners
     * WHY: Centralized event binding for easy management
     */
    attachEventListeners() {
      /**
       * WHY submit event: Intercepts form submission before it happens
       * Allows us to prevent default action and handle via AJAX
       */
      this.form.addEventListener('submit', this.handleSubmit);
    }

    /**
     * Handle form submission
     * @param {Event} event - Submit event
     *
     * WHY async: Allows use of await for cleaner promise handling
     * WHY preventDefault: Stops form from submitting normally (no page reload)
     */
    async handleSubmit(event) {
      event.preventDefault();

      /**
       * WHY disabled check: Button might be disabled (sold out)
       * Prevents attempting to add unavailable products
       */
      if (this.button.disabled) {
        return;
      }

      /**
       * WHY loading state: Prevents double-submission, provides visual feedback
       * User knows something is happening, reduces anxiety
       */
      this.setLoadingState(true);

      try {
        /**
         * WHY FormData: Automatically collects all form inputs including hidden ones
         * Handles variant ID, quantity, and any custom fields merchant added
         */
        const formData = new FormData(this.form);

        /**
         * WHY fetch API: Modern, promise-based, works in all modern browsers
         * More flexible than XMLHttpRequest, better error handling
         */
        const response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
          method: 'POST',
          headers: {
            /**
             * WHY X-Requested-With: Identifies AJAX requests to Shopify
             * Some Shopify features check for this header
             */
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: formData
        });

        if (!response.ok) {
          /**
           * WHY throw: Converts HTTP error to exception
           * Sends control to catch block for error handling
           */
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        /**
         * WHY parse JSON: Shopify Cart API returns JSON with product details
         * Need to parse to access data about added item
         */
        const data = await response.json();

        /**
         * WHY success handler: Centralizes success logic
         * Easier to extend (e.g., show notification, update cart count)
         */
        this.handleSuccess(data);

      } catch (error) {
        /**
         * WHY error handler: Graceful degradation, user gets feedback
         * Logs error for debugging, shows message to user
         */
        this.handleError(error);
      } finally {
        /**
         * WHY finally: Runs regardless of success/failure
         * Ensures loading state is always removed
         */
        this.setLoadingState(false);
      }
    }

    /**
     * Handle successful add to cart
     * @param {Object} data - Cart API response data
     *
     * WHY separate method: Keeps handleSubmit clean, easier to customize
     */
    handleSuccess(data) {
      /**
       * WHY custom event: Allows other components to react to cart additions
       * Cart drawer can listen and open, analytics can track, etc.
       * Decoupled architecture - product card doesn't need to know about cart
       */
      this.dispatchEvent('mallem:product:added', {
        product: data,
        productId: this.productId,
        variantId: this.variantId,
        card: this.card,

        /**
         * WHY include RTL state: Other modules might need to know direction
         * Example: Cart drawer slides from different side in RTL
         */
        isRTL: window.Mallem?.isRTL || false
      });

      /**
       * WHY log success: Helpful for debugging, merchant can verify in console
       * Production code could remove this or check debug flag
       */
      console.log('[MallemProductCard] Product added to cart:', data);
    }

    /**
     * Handle add to cart error
     * @param {Error} error - Error object
     *
     * WHY separate method: Centralized error handling, easier to customize
     */
    handleError(error) {
      /**
       * WHY error event: Allows error notification system to catch and display
       * UI could show toast notification, cart drawer could show error message
       */
      this.dispatchEvent('mallem:cart:error', {
        error: error,
        productId: this.productId,
        variantId: this.variantId,
        card: this.card
      });

      /**
       * WHY console error: Developer visibility, helps with debugging
       * User might report "button not working" - developer can check console
       */
      console.error('[MallemProductCard] Add to cart failed:', error);

      /**
       * WHY alert: Immediate user feedback without requiring error notification system
       * Progressive enhancement - works even if notification system not implemented
       * TODO: Replace with proper notification UI
       */
      alert('Unable to add item to cart. Please try again.');
    }

    /**
     * Set loading state on button
     * @param {Boolean} isLoading - Whether button should show loading state
     *
     * WHY data attribute: CSS can target [data-loading="true"] for styling
     * Better than class because it's semantic (state, not style)
     */
    setLoadingState(isLoading) {
      if (isLoading) {
        /**
         * WHY data-loading: CSS displays spinner, hides text
         * WHY disabled: Prevents clicking button multiple times
         * WHY aria-busy: Screen readers announce "busy" state
         */
        this.button.setAttribute('data-loading', 'true');
        this.button.disabled = true;
        this.button.setAttribute('aria-busy', 'true');
      } else {
        this.button.removeAttribute('data-loading');
        this.button.disabled = false;
        this.button.setAttribute('aria-busy', 'false');
      }
    }

    /**
     * Dispatch custom event
     * @param {String} eventName - Name of event to dispatch
     * @param {Object} detail - Event detail data
     *
     * WHY custom events: Pub/sub pattern, loose coupling between components
     * WHY bubbles: Event travels up DOM tree, can be caught at document level
     * WHY composed: Event crosses shadow DOM boundaries (future-proof)
     */
    dispatchEvent(eventName, detail = {}) {
      const event = new CustomEvent(eventName, {
        detail: detail,
        bubbles: true,
        composed: true,
        cancelable: true
      });

      /**
       * WHY dispatch on card: Event originates from specific product card
       * Listeners can access event.target to know which card triggered it
       */
      this.card.dispatchEvent(event);

      /**
       * WHY also dispatch on document: Global listeners can catch all events
       * Analytics, cart drawer, notification system don't need to attach to each card
       */
      document.dispatchEvent(event);
    }

    /**
     * Destroy instance (cleanup)
     * WHY: Removes event listeners to prevent memory leaks
     * Called when card is removed from DOM (infinite scroll, filters, etc.)
     */
    destroy() {
      if (this.form) {
        this.form.removeEventListener('submit', this.handleSubmit);
      }
    }
  }

  /**
   * Initialize all product cards
   * WHY querySelectorAll: Finds all cards on page at once
   * WHY forEach: Creates instance for each card
   */
  function initProductCards() {
    /**
     * WHY data attribute selector: More specific than class, clear intent
     * Prevents accidentally targeting non-product-card elements
     */
    const cards = document.querySelectorAll('[data-mallem-product-card]');

    cards.forEach(card => {
      /**
       * WHY check existing instance: Prevents double-initialization
       * Useful if init called multiple times (dynamic content loading)
       */
      if (!card._mallemProductCard) {
        /**
         * WHY store instance: Allows access to card instance from element
         * Useful for destroy(), update(), or external manipulation
         */
        card._mallemProductCard = new MallemProductCard(card);
      }
    });

    /**
     * WHY log: Confirms initialization in console, useful for debugging
     * Merchant can verify cards are working
     */
    console.log(`[MallemProductCard] Initialized ${cards.length} product cards`);
  }

  /**
   * Re-initialize cards (for dynamic content)
   * WHY export: Other scripts can call this after loading new products
   * Example: Infinite scroll loads more products, calls this to activate them
   */
  window.MallemProductCard = {
    /**
     * Public API
     * WHY limited API: Only expose what's needed, keeps internals private
     */
    init: initProductCards,
    version: '1.0.0'
  };

  /**
   * Auto-initialize on DOM ready
   * WHY DOMContentLoaded: Fires when HTML parsed, before images load
   * Earlier than 'load' event, faster interactivity
   */
  if (document.readyState === 'loading') {
    /**
     * WHY check readyState: Script might load after DOM ready
     * Handles both early and late script execution
     */
    document.addEventListener('DOMContentLoaded', initProductCards);
  } else {
    /**
     * WHY immediate init: DOM already ready, no need to wait for event
     */
    initProductCards();
  }

  /**
   * Handle dynamically loaded content
   * WHY custom event: Other scripts can trigger re-initialization
   * Example: Collection filters load new products via AJAX
   */
  document.addEventListener('mallem:products:loaded', () => {
    /**
     * WHY re-init: New product cards added to DOM need JavaScript
     * Existing cards already have instances (checked in init)
     */
    initProductCards();
  });

})();
