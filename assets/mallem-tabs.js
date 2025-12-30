/**
 * Product Tabs System
 *
 * Features:
 * - Desktop: Horizontal tabs with content switching
 * - Mobile: Accordion with collapsible panels
 * - Keyboard navigation (Tab, Arrow keys, Enter, Space)
 * - ARIA attributes for accessibility
 * - Smooth animations
 *
 * RTL: Handled via CSS logical properties
 * Performance: Minimal DOM manipulation, CSS-driven animations
 */

if (!customElements.get('mallem-tabs')) {
  class MallemTabs extends HTMLElement {
    constructor() {
      super();

      this.sectionId = this.dataset.sectionId;
      this.mobileBehavior = this.dataset.mobileBehavior || 'accordion';

      // Desktop elements
      this.tabList = this.querySelector('[role="tablist"]');
      this.tabs = this.querySelectorAll('[role="tab"]');
      this.panels = this.querySelectorAll('[role="tabpanel"]');

      // Mobile elements
      this.accordionTriggers = this.querySelectorAll('.mallem-tabs__accordion-trigger');

      // State
      this.activeTabIndex = 0;
      this.isMobile = window.matchMedia('(max-width: 749px)').matches;
    }

    connectedCallback() {
      this.init();
      this.setupResizeObserver();
    }

    init() {
      if (this.isMobile) {
        this.initMobileAccordion();
      } else {
        this.initDesktopTabs();
      }
    }

    /**
     * Initialize desktop tab functionality
     */
    initDesktopTabs() {
      // Click events
      this.tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => this.switchTab(index));
      });

      // Keyboard navigation
      this.tabList?.addEventListener('keydown', (e) => this.handleTabKeydown(e));
    }

    /**
     * Initialize mobile accordion functionality
     */
    initMobileAccordion() {
      this.accordionTriggers.forEach((trigger, index) => {
        trigger.addEventListener('click', () => this.toggleAccordion(index));
      });

      // Open first panel if setting is enabled
      if (this.mobileBehavior === 'accordion-first-open') {
        this.openAccordion(0);
      }
    }

    /**
     * Switch active tab (desktop)
     */
    switchTab(newIndex) {
      if (newIndex === this.activeTabIndex) return;

      // Update tabs
      this.tabs.forEach((tab, index) => {
        const isActive = index === newIndex;
        tab.classList.toggle('mallem-tabs__tab--active', isActive);
        tab.setAttribute('aria-selected', isActive);

        if (isActive) {
          tab.focus();
        }
      });

      // Update panels
      this.panels.forEach((panel, index) => {
        const isActive = index === newIndex;
        panel.classList.toggle('mallem-tabs__panel--active', isActive);

        if (isActive) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
      });

      this.activeTabIndex = newIndex;

      // Dispatch custom event
      this.dispatchEvent(new CustomEvent('mallem:tab-change', {
        detail: { index: newIndex },
        bubbles: true
      }));
    }

    /**
     * Toggle accordion panel (mobile)
     */
    toggleAccordion(index) {
      const trigger = this.accordionTriggers[index];
      const content = trigger.nextElementSibling;
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';

      if (isOpen) {
        this.closeAccordion(index);
      } else {
        this.openAccordion(index);
      }
    }

    /**
     * Open accordion panel
     */
    openAccordion(index) {
      const trigger = this.accordionTriggers[index];
      const content = trigger?.nextElementSibling;

      if (!trigger || !content) return;

      trigger.setAttribute('aria-expanded', 'true');
      content.classList.add('mallem-tabs__content--open');

      // Dispatch event
      this.dispatchEvent(new CustomEvent('mallem:accordion-open', {
        detail: { index },
        bubbles: true
      }));
    }

    /**
     * Close accordion panel
     */
    closeAccordion(index) {
      const trigger = this.accordionTriggers[index];
      const content = trigger?.nextElementSibling;

      if (!trigger || !content) return;

      trigger.setAttribute('aria-expanded', 'false');
      content.classList.remove('mallem-tabs__content--open');

      // Dispatch event
      this.dispatchEvent(new CustomEvent('mallem:accordion-close', {
        detail: { index },
        bubbles: true
      }));
    }

    /**
     * Keyboard navigation for tabs (desktop)
     */
    handleTabKeydown(event) {
      const { key } = event;
      let newIndex = this.activeTabIndex;

      switch (key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          newIndex = this.activeTabIndex > 0 ? this.activeTabIndex - 1 : this.tabs.length - 1;
          break;

        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          newIndex = this.activeTabIndex < this.tabs.length - 1 ? this.activeTabIndex + 1 : 0;
          break;

        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;

        case 'End':
          event.preventDefault();
          newIndex = this.tabs.length - 1;
          break;

        default:
          return;
      }

      this.switchTab(newIndex);
    }

    /**
     * Handle responsive behavior on window resize
     */
    setupResizeObserver() {
      const mediaQuery = window.matchMedia('(max-width: 749px)');

      const handleResize = (e) => {
        const wasMobile = this.isMobile;
        this.isMobile = e.matches;

        // Only reinitialize if state changed
        if (wasMobile !== this.isMobile) {
          this.cleanup();
          this.init();
        }
      };

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleResize);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleResize);
      }

      // Store for cleanup
      this.mediaQuery = mediaQuery;
      this.handleResize = handleResize;
    }

    /**
     * Cleanup event listeners
     */
    cleanup() {
      // Remove desktop tab listeners
      this.tabs.forEach((tab) => {
        const clone = tab.cloneNode(true);
        tab.parentNode?.replaceChild(clone, tab);
      });

      // Remove mobile accordion listeners
      this.accordionTriggers.forEach((trigger) => {
        const clone = trigger.cloneNode(true);
        trigger.parentNode?.replaceChild(clone, trigger);
      });

      // Re-query elements after cloning
      this.tabs = this.querySelectorAll('[role="tab"]');
      this.accordionTriggers = this.querySelectorAll('.mallem-tabs__accordion-trigger');
    }

    disconnectedCallback() {
      // Remove resize listener
      if (this.mediaQuery && this.handleResize) {
        if (this.mediaQuery.removeEventListener) {
          this.mediaQuery.removeEventListener('change', this.handleResize);
        } else {
          this.mediaQuery.removeListener(this.handleResize);
        }
      }
    }
  }

  customElements.define('mallem-tabs', MallemTabs);
}
