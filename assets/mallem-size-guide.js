/**
 * Size Guide Modal System
 *
 * Features:
 * - Single modal instance for all products
 * - Content injected from product metafields (via JSON data)
 * - Focus trap when modal open
 * - Keyboard navigation (Escape to close)
 * - Body scroll lock
 * - Backdrop click to close
 * - Accessible ARIA attributes
 *
 * RTL: Handled via CSS logical properties
 * Performance: Minimal DOM manipulation, event delegation
 */

if (!customElements.get('mallem-size-guide-modal')) {
  class MallemSizeGuideModal extends HTMLElement {
    constructor() {
      super();

      // Modal elements
      this.modal = this;
      this.backdrop = this.querySelector('[data-modal-backdrop]');
      this.dialog = this.querySelector('.mallem-size-guide-modal__dialog');
      this.closeButton = this.querySelector('[data-modal-close]');
      this.titleElement = this.querySelector('#size-guide-modal-title');
      this.imageContainer = this.querySelector('[data-modal-image-container]');
      this.imageElement = this.querySelector('[data-modal-image]');
      this.contentElement = this.querySelector('[data-modal-content]');

      // State
      this.isOpen = false;
      this.previouslyFocusedElement = null;
      this.focusableElements = [];
    }

    connectedCallback() {
      this.setupEventListeners();
      this.setupTriggers();
    }

    /**
     * Setup event listeners for modal interactions
     */
    setupEventListeners() {
      // Close button
      this.closeButton?.addEventListener('click', () => this.close());

      // Backdrop click
      this.backdrop?.addEventListener('click', () => this.close());

      // Keyboard navigation
      document.addEventListener('keydown', (e) => this.handleKeydown(e));

      // Prevent dialog click from closing modal
      this.dialog?.addEventListener('click', (e) => e.stopPropagation());
    }

    /**
     * Setup trigger buttons (event delegation)
     */
    setupTriggers() {
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-mallem-size-guide-trigger]');
        if (trigger) {
          e.preventDefault();
          this.open(trigger);
        }
      });
    }

    /**
     * Open modal with content from trigger button
     */
    open(triggerButton) {
      // Get product handle
      const productHandle = triggerButton.dataset.productHandle;

      if (!productHandle) {
        console.warn('[Size Guide] No product handle found');
        return;
      }

      // Get size guide data from JSON script
      const dataScript = document.querySelector(`[data-size-guide-data="${productHandle}"]`);

      if (!dataScript) {
        console.warn('[Size Guide] No size guide data found for product:', productHandle);
        return;
      }

      let data;
      try {
        data = JSON.parse(dataScript.textContent);
      } catch (error) {
        console.error('[Size Guide] Failed to parse size guide data:', error);
        return;
      }

      // Inject content
      this.injectContent(data);

      // Store previously focused element
      this.previouslyFocusedElement = document.activeElement;

      // Show modal
      this.modal.removeAttribute('hidden');
      this.modal.setAttribute('aria-hidden', 'false');

      // Lock body scroll
      document.body.classList.add('mallem-modal-open');

      // Update state
      this.isOpen = true;

      // Focus first focusable element
      requestAnimationFrame(() => {
        this.setupFocusTrap();
        this.focusFirstElement();
      });

      // Dispatch event
      this.dispatchEvent(new CustomEvent('mallem:size-guide:open', {
        detail: { productHandle },
        bubbles: true
      }));
    }

    /**
     * Close modal
     */
    close() {
      if (!this.isOpen) return;

      // Hide modal
      this.modal.setAttribute('aria-hidden', 'true');

      // Wait for transition
      setTimeout(() => {
        this.modal.setAttribute('hidden', '');
      }, 300);

      // Unlock body scroll
      document.body.classList.remove('mallem-modal-open');

      // Update state
      this.isOpen = false;

      // Restore focus
      if (this.previouslyFocusedElement) {
        this.previouslyFocusedElement.focus();
        this.previouslyFocusedElement = null;
      }

      // Dispatch event
      this.dispatchEvent(new CustomEvent('mallem:size-guide:close', {
        bubbles: true
      }));
    }

    /**
     * Inject content into modal
     */
    injectContent(data) {
      // Set title
      if (this.titleElement && data.title) {
        this.titleElement.textContent = data.title;
      }

      // Set content
      if (this.contentElement && data.content) {
        this.contentElement.innerHTML = data.content;
      }

      // Set image (if exists)
      if (data.image && data.image.url) {
        this.imageElement.src = data.image.url;
        this.imageElement.alt = data.image.alt || data.title || '';

        if (data.image.width) {
          this.imageElement.setAttribute('width', data.image.width);
        }
        if (data.image.height) {
          this.imageElement.setAttribute('height', data.image.height);
        }

        this.imageContainer.removeAttribute('hidden');
      } else {
        this.imageContainer.setAttribute('hidden', '');
      }
    }

    /**
     * Setup focus trap
     */
    setupFocusTrap() {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ];

      this.focusableElements = Array.from(
        this.dialog.querySelectorAll(focusableSelectors.join(','))
      );
    }

    /**
     * Focus first focusable element (close button)
     */
    focusFirstElement() {
      if (this.focusableElements.length > 0) {
        this.focusableElements[0].focus();
      }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeydown(event) {
      if (!this.isOpen) return;

      // Escape to close
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
        return;
      }

      // Tab key focus trap
      if (event.key === 'Tab') {
        this.handleTabKey(event);
      }
    }

    /**
     * Handle Tab key for focus trap
     */
    handleTabKey(event) {
      if (this.focusableElements.length === 0) return;

      const firstElement = this.focusableElements[0];
      const lastElement = this.focusableElements[this.focusableElements.length - 1];

      // Shift + Tab on first element → focus last
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // Tab on last element → focus first
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    disconnectedCallback() {
      // Cleanup if modal is removed from DOM
      if (this.isOpen) {
        document.body.classList.remove('mallem-modal-open');
      }
    }
  }

  customElements.define('mallem-size-guide-modal', MallemSizeGuideModal);
}
