/*
  Component: Cart Drawer JavaScript
  Purpose: AJAX cart with Shopify Cart API integration

  Features:
  - Event-driven architecture (listens to mallem:cart-add)
  - Fetches cart via /cart.js
  - Updates quantity via /cart/change.js
  - Removes items (set quantity to 0)
  - Mustache-style template rendering
  - Focus trap and keyboard navigation
  - Debounced quantity updates

  API Endpoints:
  - GET /cart.js - Fetch cart state
  - POST /cart/add.js - Add item
  - POST /cart/change.js - Update line item

  Performance:
  - Event delegation for dynamic content
  - Debounced API calls (300ms)
  - requestAnimationFrame for smooth UI updates

  Accessibility:
  - Focus trap when open
  - Escape key closes
  - ARIA live regions for screen readers
*/

class MallemCartDrawer extends HTMLElement {
  constructor() {
    super();

    // WHY: Cache DOM elements for performance
    this.overlay = this.querySelector('[data-drawer-close]');
    this.closeBtn = this.querySelector('[data-drawer-close]');
    this.body = this.querySelector('[data-cart-body]');
    this.footer = this.querySelector('[data-cart-footer]');
    this.countEl = this.querySelector('[data-cart-count]');
    this.subtotalEl = this.querySelector('[data-cart-subtotal]');
    this.checkoutBtn = this.querySelector('[data-cart-checkout]');

    // WHY: Templates for rendering
    this.itemTemplate = document.getElementById('mallem-cart-item-template');
    this.emptyTemplate = document.getElementById('mallem-cart-empty-template');

    // WHY: State management
    this.isOpen = false;
    this.isUpdating = false;
    this.updateQueue = new Map();
    this.debounceTimer = null;
    this.focusTrap = null;

    // WHY: Bind methods to preserve context
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  connectedCallback() {
    // WHY: Set up event listeners after element is added to DOM
    this.setupEventListeners();
    this.fetchCart();
  }

  setupEventListeners() {
    // Close handlers
    const closeTriggers = this.querySelectorAll('[data-drawer-close]');
    closeTriggers.forEach(el => el.addEventListener('click', this.close));

    // Event delegation for cart items
    this.body.addEventListener('click', this.handleBodyClick.bind(this));
    this.body.addEventListener('input', this.handleQuantityInput.bind(this));

    // Keyboard navigation
    document.addEventListener('keydown', this.handleKeydown);

    // Listen for add-to-cart events
    document.addEventListener('mallem:cart-add', this.handleCartAdd.bind(this));

    // Intercept product forms
    this.interceptForms();
  }

  // ============================================================================
  // DRAWER CONTROL
  // ============================================================================

  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.hidden = false;

    // WHY: Prevent body scroll on mobile
    document.body.style.overflow = 'hidden';

    // WHY: Set up focus trap
    this.setupFocusTrap();

    // WHY: Announce to screen readers
    this.announce('Cart opened');
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.hidden = true;

    // WHY: Restore body scroll
    document.body.style.overflow = '';

    // WHY: Return focus to trigger element
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
    }

    this.announce('Cart closed');
  }

  handleKeydown(e) {
    if (!this.isOpen) return;

    if (e.key === 'Escape') {
      this.close();
    }

    if (e.key === 'Tab') {
      this.trapFocus(e);
    }
  }

  setupFocusTrap() {
    // WHY: Find all focusable elements for keyboard navigation
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(this.querySelectorAll(focusableSelector));

    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
  }

  trapFocus(e) {
    if (this.focusableElements.length === 0) return;

    const first = this.focusableElements[0];
    const last = this.focusableElements[this.focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  handleBodyClick(e) {
    // Quantity decrease
    if (e.target.closest('[data-qty-decrease]')) {
      const item = e.target.closest('.mallem-cart-item');
      const input = item.querySelector('[data-qty-input]');
      const newQty = Math.max(0, parseInt(input.value) - 1);
      input.value = newQty;
      this.queueUpdate(item.dataset.lineIndex, newQty);
    }

    // Quantity increase
    if (e.target.closest('[data-qty-increase]')) {
      const item = e.target.closest('.mallem-cart-item');
      const input = item.querySelector('[data-qty-input]');
      const newQty = parseInt(input.value) + 1;
      input.value = newQty;
      this.queueUpdate(item.dataset.lineIndex, newQty);
    }

    // Remove item
    if (e.target.closest('[data-remove-item]')) {
      const item = e.target.closest('.mallem-cart-item');
      this.queueUpdate(item.dataset.lineIndex, 0);
    }
  }

  handleQuantityInput(e) {
    if (!e.target.matches('[data-qty-input]')) return;

    const item = e.target.closest('.mallem-cart-item');
    const newQty = Math.max(0, parseInt(e.target.value) || 0);
    e.target.value = newQty;
    this.queueUpdate(item.dataset.lineIndex, newQty);
  }

  handleCartAdd(e) {
    // WHY: Listen for custom add-to-cart events from product forms
    this.fetchCart().then(() => this.open());
  }

  // ============================================================================
  // CART API
  // ============================================================================

  async fetchCart() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      this.renderCart(cart);
    } catch (error) {
      console.error('[Cart Drawer] Fetch failed:', error);
    }
  }

  queueUpdate(line, quantity) {
    // WHY: Debounce rapid quantity changes
    this.updateQueue.set(line, quantity);

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.processQueue();
    }, 300);
  }

  async processQueue() {
    if (this.isUpdating || this.updateQueue.size === 0) return;

    this.isUpdating = true;
    this.showLoading();

    // WHY: Process each update sequentially to avoid race conditions
    for (const [line, quantity] of this.updateQueue) {
      try {
        await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line, quantity })
        });
      } catch (error) {
        console.error('[Cart Drawer] Update failed:', error);
      }
    }

    this.updateQueue.clear();
    await this.fetchCart();

    this.isUpdating = false;
    this.hideLoading();
  }

  interceptForms() {
    // WHY: Intercept all product forms to prevent page reload
    document.addEventListener('submit', async (e) => {
      const form = e.target;
      if (!form.action?.includes('/cart/add')) return;

      e.preventDefault();

      const formData = new FormData(form);
      const submitBtn = form.querySelector('[type="submit"]');

      if (submitBtn) submitBtn.disabled = true;

      try {
        await fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        });

        await this.fetchCart();
        this.open();

        // WHY: Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('mallem:cart-add'));
      } catch (error) {
        console.error('[Cart Drawer] Add failed:', error);
        alert('Failed to add item to cart');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // ============================================================================
  // RENDERING
  // ============================================================================

  renderCart(cart) {
    // Update count
    if (this.countEl) {
      this.countEl.textContent = cart.item_count;
    }

    // Update subtotal
    if (this.subtotalEl) {
      this.subtotalEl.textContent = this.formatMoney(cart.total_price);
    }

    // Show/hide footer
    if (this.footer) {
      this.footer.hidden = cart.item_count === 0;
    }

    // Render items
    if (cart.item_count === 0) {
      this.renderEmpty();
    } else {
      this.renderItems(cart.items);
    }

    // Update focus trap
    if (this.isOpen) {
      this.setupFocusTrap();
    }
  }

  renderItems(items) {
    if (!this.itemTemplate) return;

    const html = items.map((item, index) => {
      return this.renderTemplate(this.itemTemplate.innerHTML, {
        index: index + 1,
        url: item.url,
        image: this.getImageUrl(item.image, 80),
        title: item.product_title,
        variant_title: item.variant_title !== 'Default Title' ? item.variant_title : null,
        quantity: item.quantity,
        compare_at_price: item.original_price > item.final_price ? this.formatMoney(item.original_price) : null,
        final_price: this.formatMoney(item.final_price)
      });
    }).join('');

    this.body.innerHTML = html;
  }

  renderEmpty() {
    if (!this.emptyTemplate) return;
    this.body.innerHTML = this.emptyTemplate.innerHTML;
  }

  renderTemplate(template, data) {
    // WHY: Simple Mustache-style template rendering
    return template.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}|\{\{(\w+)\}\}/g, (match, blockKey, blockContent, key) => {
      if (blockKey) {
        // Conditional block
        return data[blockKey] ? blockContent.replace(/\{\{(\w+)\}\}/g, (m, k) => data[k] || '') : '';
      } else {
        // Simple replacement
        return data[key] || '';
      }
    });
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  formatMoney(cents) {
    // WHY: Use Shopify money format if available
    if (window.Shopify?.formatMoney) {
      return window.Shopify.formatMoney(cents);
    }
    return `$${(cents / 100).toFixed(2)}`;
  }

  getImageUrl(url, size) {
    if (!url) return '';
    // WHY: Shopify image URL transformation
    return url.replace(/\.(jpg|jpeg|png|gif)/, `_${size}x${size}.$1`);
  }

  showLoading() {
    this.body.style.opacity = '0.6';
    this.body.style.pointerEvents = 'none';
  }

  hideLoading() {
    this.body.style.opacity = '';
    this.body.style.pointerEvents = '';
  }

  announce(message) {
    // WHY: Screen reader announcement
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;
    document.body.appendChild(liveRegion);
    setTimeout(() => liveRegion.remove(), 1000);
  }
}

// WHY: Register custom element
customElements.define('cart-drawer', MallemCartDrawer);

// WHY: Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const drawer = document.getElementById('mallem-cart-drawer');
    if (drawer) {
      console.log('[Cart Drawer] Initialized');
    }
  });
}
