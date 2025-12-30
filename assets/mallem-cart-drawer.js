/*
================================================================================
MALLEM CART DRAWER
================================================================================

Purpose: Kalles-style slide-in cart with AJAX operations
Architecture: Class-based, event delegation, Shopify Cart API

Features:
- AJAX cart add/update/remove via Shopify Cart API
- Auto-open after add-to-cart
- Debounced quantity updates
- Optimistic UI updates
- Focus trap when open
- Keyboard navigation (Escape to close)

Shopify Cart API:
- GET  /cart.js          - Fetch cart state
- POST /cart/add.js      - Add item to cart
- POST /cart/change.js   - Update line item quantity
- POST /cart/clear.js    - Clear cart

Performance:
- Debounce quantity updates (500ms)
- Event delegation for dynamic content
- requestAnimationFrame for UI updates

Accessibility:
- Focus trap when drawer open
- ARIA attributes updated
- Keyboard navigation
- Screen reader announcements

================================================================================
*/

class MallemCartDrawer {
  constructor(element) {
    // Core elements
    this.drawer = element;
    this.overlay = element.querySelector('.mallem-cart-drawer__overlay');
    this.panel = element.querySelector('.mallem-cart-drawer__panel');
    this.closeButtons = element.querySelectorAll('[data-mallem-cart-drawer-close]');

    // Content elements (updated dynamically)
    this.itemsContainer = element.querySelector('[data-cart-items]');
    this.countElement = element.querySelector('[data-cart-count]');
    this.subtotalElement = element.querySelector('[data-cart-subtotal]');
    this.footerElement = element.querySelector('[data-cart-footer]');

    // State
    this.isOpen = false;
    this.isUpdating = false;
    this.updateQueue = new Map(); // WHY: Debounce multiple quantity changes
    this.debounceTimer = null;

    // Focus trap
    this.focusableElements = [];
    this.previousFocus = null;

    // Bind methods
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleFocusTrap = this.handleFocusTrap.bind(this);

    // Initialize
    this.init();
  }

  init() {
    console.log('[Mallem Cart Drawer] Initializing...');

    // Close button listeners
    this.closeButtons.forEach(button => {
      button.addEventListener('click', this.close);
    });

    // Overlay click to close
    this.overlay.addEventListener('click', this.close);

    // Event delegation for dynamic content
    this.drawer.addEventListener('click', this.handleDrawerClick.bind(this));
    this.drawer.addEventListener('input', this.handleQuantityInput.bind(this));

    // Keyboard navigation
    document.addEventListener('keydown', this.handleKeydown);

    // Intercept add-to-cart forms
    this.interceptAddToCart();

    console.log('[Mallem Cart Drawer] ✓ Initialized');
  }

  /**
   * Open drawer
   */
  open() {
    console.log('[Mallem Cart Drawer] Opening drawer');

    // Update state
    this.isOpen = true;
    this.drawer.setAttribute('aria-hidden', 'false');

    // Store previous focus for restoration
    this.previousFocus = document.activeElement;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Set up focus trap
    this.setupFocusTrap();

    // Focus first focusable element
    requestAnimationFrame(() => {
      const firstFocusable = this.panel.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    });
  }

  /**
   * Close drawer
   */
  close() {
    console.log('[Mallem Cart Drawer] Closing drawer');

    // Update state
    this.isOpen = false;
    this.drawer.setAttribute('aria-hidden', 'true');

    // Restore body scroll
    document.body.style.overflow = '';

    // Restore previous focus
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus();
    }
  }

  /**
   * Handle keyboard events
   */
  handleKeydown(e) {
    if (!this.isOpen) return;

    // Escape key closes drawer
    if (e.key === 'Escape') {
      this.close();
      return;
    }

    // Tab key focus trap
    if (e.key === 'Tab') {
      this.handleFocusTrap(e);
    }
  }

  /**
   * Set up focus trap
   */
  setupFocusTrap() {
    // Find all focusable elements
    this.focusableElements = Array.from(
      this.panel.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  /**
   * Handle focus trap on Tab
   */
  handleFocusTrap(e) {
    if (this.focusableElements.length === 0) return;

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];

    // Shift + Tab on first element -> focus last
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
    // Tab on last element -> focus first
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  /**
   * Handle clicks inside drawer (event delegation)
   */
  handleDrawerClick(e) {
    // Quantity decrease
    if (e.target.closest('[data-qty-decrease]')) {
      e.preventDefault();
      const item = e.target.closest('[data-cart-item]');
      const input = item.querySelector('[data-qty-input]');
      const currentQty = parseInt(input.value, 10);
      const newQty = Math.max(0, currentQty - 1);
      input.value = newQty;
      this.queueQuantityUpdate(input.dataset.lineKey, newQty);
    }

    // Quantity increase
    if (e.target.closest('[data-qty-increase]')) {
      e.preventDefault();
      const item = e.target.closest('[data-cart-item]');
      const input = item.querySelector('[data-qty-input]');
      const currentQty = parseInt(input.value, 10);
      const newQty = currentQty + 1;
      input.value = newQty;
      this.queueQuantityUpdate(input.dataset.lineKey, newQty);
    }

    // Remove item
    if (e.target.closest('[data-remove-item]')) {
      e.preventDefault();
      const button = e.target.closest('[data-remove-item]');
      const lineKey = button.dataset.lineKey;
      this.removeItem(lineKey);
    }
  }

  /**
   * Handle quantity input changes
   */
  handleQuantityInput(e) {
    if (e.target.matches('[data-qty-input]')) {
      const input = e.target;
      const lineKey = input.dataset.lineKey;
      const newQty = parseInt(input.value, 10) || 0;
      this.queueQuantityUpdate(lineKey, newQty);
    }
  }

  /**
   * Queue quantity update (debounced)
   * WHY: Avoid spamming Shopify API with rapid clicks
   */
  queueQuantityUpdate(lineKey, quantity) {
    // Add to queue
    this.updateQueue.set(lineKey, quantity);

    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce: Execute after 500ms of no changes
    this.debounceTimer = setTimeout(() => {
      this.processUpdateQueue();
    }, 500);
  }

  /**
   * Process queued quantity updates
   */
  async processUpdateQueue() {
    if (this.updateQueue.size === 0) return;

    console.log('[Mallem Cart Drawer] Processing update queue:', this.updateQueue);

    // Build updates object for Shopify API
    const updates = {};
    this.updateQueue.forEach((quantity, lineKey) => {
      updates[lineKey] = quantity;
    });

    // Clear queue
    this.updateQueue.clear();

    // Update cart
    try {
      await this.updateCart(updates);
    } catch (error) {
      console.error('[Mallem Cart Drawer] Update failed:', error);
      this.showError('Failed to update cart. Please refresh and try again.');
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(lineKey) {
    console.log('[Mallem Cart Drawer] Removing item:', lineKey);

    try {
      await this.updateCart({ [lineKey]: 0 });
    } catch (error) {
      console.error('[Mallem Cart Drawer] Remove failed:', error);
      this.showError('Failed to remove item. Please try again.');
    }
  }

  /**
   * Update cart via Shopify Cart API
   * @param {Object} updates - { line_key: quantity }
   */
  async updateCart(updates) {
    this.isUpdating = true;
    this.drawer.classList.add('mallem-cart-drawer--loading');

    try {
      const response = await fetch('/cart/update.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const cart = await response.json();
      console.log('[Mallem Cart Drawer] Cart updated:', cart);

      // Re-render drawer with new cart state
      await this.renderCart(cart);

    } finally {
      this.isUpdating = false;
      this.drawer.classList.remove('mallem-cart-drawer--loading');
    }
  }

  /**
   * Add item to cart
   * @param {FormData} formData - Add-to-cart form data
   */
  async addToCart(formData) {
    console.log('[Mallem Cart Drawer] Adding to cart');

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || 'Failed to add to cart');
      }

      const item = await response.json();
      console.log('[Mallem Cart Drawer] Item added:', item);

      // Fetch updated cart state
      await this.fetchCart();

      // Open drawer
      this.open();

    } catch (error) {
      console.error('[Mallem Cart Drawer] Add to cart failed:', error);
      this.showError(error.message || 'Failed to add item. Please try again.');
      throw error; // Re-throw for form handler
    }
  }

  /**
   * Fetch current cart state
   */
  async fetchCart() {
    console.log('[Mallem Cart Drawer] Fetching cart state');

    try {
      const response = await fetch('/cart.js');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const cart = await response.json();
      console.log('[Mallem Cart Drawer] Cart fetched:', cart);

      await this.renderCart(cart);

    } catch (error) {
      console.error('[Mallem Cart Drawer] Fetch failed:', error);
      this.showError('Failed to load cart. Please refresh the page.');
    }
  }

  /**
   * Render cart (fetch HTML from cart.js section rendering endpoint)
   * WHY: Use Shopify section rendering for consistency with theme templates
   */
  async renderCart(cart) {
    console.log('[Mallem Cart Drawer] Rendering cart with', cart.item_count, 'items');

    // Update count badge
    if (this.countElement) {
      this.countElement.textContent = cart.item_count;
    }

    // Update subtotal
    if (this.subtotalElement) {
      this.subtotalElement.textContent = this.formatMoney(cart.total_price);
    }

    // Show/hide footer based on item count
    if (this.footerElement) {
      this.footerElement.style.display = cart.item_count > 0 ? '' : 'none';
    }

    // Fetch rendered HTML from section rendering API
    // WHY: Ensures consistent rendering with Liquid templates
    try {
      const response = await fetch(`${window.location.pathname}?sections=mallem-cart-drawer-items`);

      if (response.ok) {
        const data = await response.json();
        const html = data['mallem-cart-drawer-items'];

        if (html && this.itemsContainer) {
          this.itemsContainer.innerHTML = html;
        }
      } else {
        // Fallback: Render items client-side
        this.renderItemsClientSide(cart);
      }
    } catch (error) {
      console.warn('[Mallem Cart Drawer] Section rendering failed, using client-side fallback:', error);
      this.renderItemsClientSide(cart);
    }

    // Update focus trap with new elements
    if (this.isOpen) {
      this.setupFocusTrap();
    }
  }

  /**
   * Render cart items client-side (fallback)
   * WHY: If section rendering fails, render basic HTML
   */
  renderItemsClientSide(cart) {
    if (!this.itemsContainer) return;

    // Empty state
    if (cart.item_count === 0) {
      this.itemsContainer.innerHTML = this.getEmptyStateHTML();
      return;
    }

    // Render line items
    const itemsHTML = cart.items.map(item => this.getLineItemHTML(item)).join('');
    this.itemsContainer.innerHTML = itemsHTML;
  }

  /**
   * Get empty state HTML
   */
  getEmptyStateHTML() {
    return `
      <div class="mallem-cart-drawer-empty">
        <div class="mallem-cart-drawer-empty__icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 20L25 50H55L60 20H20Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="30" cy="60" r="3" stroke="currentColor" stroke-width="2"/>
            <circle cx="50" cy="60" r="3" stroke="currentColor" stroke-width="2"/>
            <path d="M10 10H15L20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3 class="mallem-cart-drawer-empty__title">Your cart is empty</h3>
        <p class="mallem-cart-drawer-empty__description">Add items to your cart to see them here.</p>
        <button type="button" class="mallem-cart-drawer-empty__cta" data-mallem-cart-drawer-close>Continue Shopping</button>
      </div>
    `;
  }

  /**
   * Get line item HTML (simplified client-side rendering)
   */
  getLineItemHTML(item) {
    const imageURL = item.image ? this.getImageURL(item.image, 120) : '';
    const variantOptions = item.options_with_values
      ? item.options_with_values.map(opt => `<span>${opt.name}: ${opt.value}</span>`).join('')
      : '';

    return `
      <div class="mallem-cart-drawer-item" data-cart-item>
        <div class="mallem-cart-drawer-item__image">
          <a href="${item.url}">
            ${imageURL ? `<img src="${imageURL}" alt="${item.title}" width="120" height="120" loading="lazy">` : '<div class="mallem-cart-drawer-item__image-placeholder"></div>'}
          </a>
        </div>
        <div class="mallem-cart-drawer-item__details">
          <a href="${item.url}" class="mallem-cart-drawer-item__title">${item.product_title}</a>
          ${variantOptions ? `<div class="mallem-cart-drawer-item__variant">${variantOptions}</div>` : ''}
          <div class="mallem-cart-drawer-item__price">
            <span class="mallem-cart-drawer-item__price-final">${this.formatMoney(item.final_price)}</span>
          </div>
          <div class="mallem-cart-drawer-item__quantity">
            <button type="button" class="mallem-cart-drawer-item__qty-btn" data-qty-decrease>−</button>
            <input type="number" class="mallem-cart-drawer-item__qty-input" value="${item.quantity}" min="0" data-qty-input data-line-key="${item.key}">
            <button type="button" class="mallem-cart-drawer-item__qty-btn" data-qty-increase>+</button>
          </div>
        </div>
        <div class="mallem-cart-drawer-item__actions">
          <div class="mallem-cart-drawer-item__total">${this.formatMoney(item.final_line_price)}</div>
          <button type="button" class="mallem-cart-drawer-item__remove" data-remove-item data-line-key="${item.key}">×</button>
        </div>
      </div>
    `;
  }

  /**
   * Intercept add-to-cart forms
   * WHY: Prevent page reload, use AJAX instead
   */
  interceptAddToCart() {
    document.addEventListener('submit', async (e) => {
      // Check if this is an add-to-cart form
      const form = e.target;
      if (form.matches('form[action="/cart/add"]') || form.matches('form[action*="/cart/add"]')) {
        e.preventDefault();

        const formData = new FormData(form);

        // Disable submit button to prevent double-submit
        const submitButton = form.querySelector('[type="submit"]');
        if (submitButton) {
          submitButton.disabled = true;
        }

        try {
          await this.addToCart(formData);
        } finally {
          // Re-enable submit button
          if (submitButton) {
            submitButton.disabled = false;
          }
        }
      }
    });
  }

  /**
   * Format money (basic implementation)
   * WHY: Shopify money_format not available in JS
   */
  formatMoney(cents) {
    const dollars = (cents / 100).toFixed(2);
    return `$${dollars}`;
  }

  /**
   * Get image URL with size parameter
   */
  getImageURL(imageUrl, size) {
    if (!imageUrl) return '';
    return imageUrl.replace(/\.jpg|\.png|\.gif|\.jpeg/gi, (match) => `_${size}x${size}${match}`);
  }

  /**
   * Show error message (basic implementation)
   * TODO: Enhance with toast notification
   */
  showError(message) {
    console.error('[Mallem Cart Drawer] Error:', message);
    alert(message); // Temporary: Replace with toast notification
  }
}

/**
 * Initialize cart drawer
 */
function initMallemCartDrawer() {
  const DRAWER_ID = 'mallem-cart-drawer';
  const drawerElement = document.getElementById(DRAWER_ID);

  if (!drawerElement) {
    console.warn('[Mallem Cart Drawer] INITIALIZATION FAILED: Drawer element not found');
    console.warn('[Mallem Cart Drawer] Make sure to render mallem-cart-drawer snippet in layout/theme.liquid');
    return;
  }

  console.log('[Mallem Cart Drawer] ✓ Drawer element found');

  // Initialize drawer
  const cartDrawer = new MallemCartDrawer(drawerElement);

  // Global trigger listeners (for cart icon, "Add to Cart" notifications, etc.)
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-mallem-cart-drawer-open]');
    if (trigger) {
      e.preventDefault();
      cartDrawer.open();
    }
  });

  // Expose globally for debugging
  window.mallemCartDrawer = cartDrawer;

  console.log('[Mallem Cart Drawer] ✓ Initialization complete');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMallemCartDrawer);
} else {
  initMallemCartDrawer();
}
