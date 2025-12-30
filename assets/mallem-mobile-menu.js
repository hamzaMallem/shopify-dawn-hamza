/**
 * Mobile Menu Drawer Controller
 *
 * WHY class-based module:
 * - Encapsulation: Private state, no global pollution
 * - Reusability: Multiple instances possible (though typically one)
 * - Memory efficiency: Single event listener via delegation
 *
 * WHY focus trap:
 * - Accessibility: Screen reader users stay in menu
 * - UX: Tab key doesn't escape drawer
 * - WCAG 2.1 compliance for modal dialogs
 *
 * WHY event delegation:
 * - Performance: One listener vs many
 * - Dynamic content: Works with JS-added items
 * - Memory: No listener cleanup needed
 */

class MallemMobileMenu {
  constructor(element) {
    this.menu = element;
    this.drawer = this.menu.querySelector('.mallem-mobile-menu__drawer');
    this.overlay = this.menu.querySelector('.mallem-mobile-menu__overlay');
    this.focusableElements = [];
    this.previouslyFocusedElement = null;

    // WHY bind: Preserve 'this' context in event handlers
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleFocusTrap = this.handleFocusTrap.bind(this);

    this.init();
  }

  init() {
    // WHY event delegation: Single listener handles all clicks
    this.menu.addEventListener('click', (e) => {
      // Close triggers: overlay, close button, or any close element
      if (e.target.closest('[data-mallem-menu-close]')) {
        this.close();
      }

      // Toggle accordion
      const toggle = e.target.closest('[data-mallem-menu-toggle]');
      if (toggle) {
        e.preventDefault(); // Prevent parent link navigation
        this.toggleSubmenu(toggle);
      }
    });

    // WHY separate keydown listener: Keyboard navigation independent of clicks
    document.addEventListener('keydown', this.handleKeydown);
  }

  /**
   * Opens the mobile menu drawer
   * WHY focus trap: Keeps keyboard users within modal
   * CRITICAL: Works on BOTH desktop and mobile (no screen-size checks)
   */
  open() {
    console.log('[Mallem Mobile Menu] Opening drawer...');

    // Store currently focused element to restore on close
    this.previouslyFocusedElement = document.activeElement;

    // Update ARIA and visibility (THIS IS THE CRITICAL STATE CHANGE)
    // WHY aria-hidden: CSS uses [aria-hidden="false"] to show drawer
    this.menu.setAttribute('aria-hidden', 'false');
    console.log('[Mallem Mobile Menu] ✓ aria-hidden set to "false" (drawer visible)');

    // Prevent background scroll
    document.body.style.overflow = 'hidden'; // WHY: Prevent background scroll on iOS
    console.log('[Mallem Mobile Menu] ✓ Body scroll locked');

    // WHY requestAnimationFrame: Ensure DOM update before focus
    requestAnimationFrame(() => {
      this.setupFocusTrap();
      this.focusFirstElement();
      console.log('[Mallem Mobile Menu] ✓ Focus trap activated');
    });
  }

  /**
   * Closes the mobile menu drawer
   * WHY restore focus: Accessibility best practice for modals
   */
  close() {
    console.log('[Mallem Mobile Menu] Closing drawer...');

    // Update ARIA to hide drawer
    this.menu.setAttribute('aria-hidden', 'true');
    console.log('[Mallem Mobile Menu] ✓ aria-hidden set to "true" (drawer hidden)');

    // Restore scrolling
    document.body.style.overflow = ''; // Restore scrolling
    console.log('[Mallem Mobile Menu] ✓ Body scroll restored');

    // Restore focus to trigger element
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }

    // Clean up focus trap
    this.teardownFocusTrap();
    console.log('[Mallem Mobile Menu] ✓ Focus trap deactivated');
  }

  /**
   * Toggles accordion submenu
   * WHY hidden attribute: Semantic, works without JS, accessible
   * WHY aria-expanded: Screen readers announce state
   */
  toggleSubmenu(toggle) {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    const submenu = toggle.closest('.mallem-mobile-menu__item').querySelector('.mallem-mobile-menu__submenu');

    if (!submenu) return;

    // Toggle state
    toggle.setAttribute('aria-expanded', !expanded);

    // WHY removeAttribute vs setAttribute: Cleaner than 'false' string
    if (expanded) {
      submenu.setAttribute('hidden', '');
    } else {
      submenu.removeAttribute('hidden');
    }
  }

  /**
   * Sets up focus trap for accessibility
   * WHY: Prevents tab key from escaping modal
   */
  setupFocusTrap() {
    // Get all focusable elements within drawer
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(this.drawer.querySelectorAll(focusableSelector));

    // Add trap listener
    this.drawer.addEventListener('keydown', this.handleFocusTrap);
  }

  teardownFocusTrap() {
    this.drawer.removeEventListener('keydown', this.handleFocusTrap);
    this.focusableElements = [];
  }

  /**
   * Handles focus trap logic
   * WHY separate from handleKeydown: Specific to drawer, not global
   */
  handleFocusTrap(e) {
    if (e.key !== 'Tab') return;

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];

    // WHY shift check: Handle reverse tab navigation
    if (e.shiftKey) {
      // Shift + Tab on first element: wrap to last
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab on last element: wrap to first
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Focuses first interactive element in drawer
   * WHY: Accessibility - keyboard users know where they are
   */
  focusFirstElement() {
    // Prefer close button as first focus (easy to close)
    const closeBtn = this.drawer.querySelector('[data-mallem-menu-close]');
    if (closeBtn) {
      closeBtn.focus();
    } else if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
  }

  /**
   * Global keyboard event handler
   * WHY Escape key: Universal pattern for closing modals
   */
  handleKeydown(e) {
    // Only handle when menu is open
    if (this.menu.getAttribute('aria-hidden') === 'true') return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    }
  }

  /**
   * Cleanup method for instance destruction
   * WHY: Prevent memory leaks if menu is dynamically removed
   */
  destroy() {
    document.removeEventListener('keydown', this.handleKeydown);
    this.teardownFocusTrap();
  }
}

/**
 * Auto-initialize when DOM is ready
 * WHY DOMContentLoaded: Ensure elements exist before query
 * WHY defer: Script loads after HTML parse, may not need listener
 *
 * CRITICAL: This runs on ALL screen sizes (desktop + mobile)
 * NO media query restrictions
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
  initMobileMenu();
}

function initMobileMenu() {
  // SINGLE SOURCE OF TRUTH: Use ID selector only
  const DRAWER_ID = 'mallem-mobile-menu';
  const menuElement = document.getElementById(DRAWER_ID);

  // CRITICAL: Drawer MUST exist in DOM
  if (!menuElement) {
    console.warn(
      `[Mallem Mobile Menu] INITIALIZATION FAILED: Drawer element #${DRAWER_ID} not found in DOM.`,
      '\nExpected location: layout/theme.liquid should render snippets/mallem-mobile-menu.liquid',
      '\nThis will break desktop language icon and mobile hamburger triggers.'
    );
    return;
  }

  console.log('[Mallem Mobile Menu] ✓ Drawer element found:', menuElement);

  // Create instance
  const mobileMenu = new MallemMobileMenu(menuElement);

  console.log('[Mallem Mobile Menu] ✓ Class initialized successfully');

  // Expose API to global scope for header toggle button
  // WHY global: Header needs to call open() from outside
  // VERIFICATION: Type window.mallemMobileMenu in console
  window.mallemMobileMenu = {
    open: () => {
      console.log('[Mallem Mobile Menu] open() called');
      mobileMenu.open();
    },
    close: () => {
      console.log('[Mallem Mobile Menu] close() called');
      mobileMenu.close();
    },
    toggle: () => {
      const isOpen = menuElement.getAttribute('aria-hidden') === 'false';
      console.log('[Mallem Mobile Menu] toggle() called, currently:', isOpen ? 'OPEN' : 'CLOSED');
      isOpen ? mobileMenu.close() : mobileMenu.open();
    }
  };

  console.log('[Mallem Mobile Menu] ✓ Global API exposed: window.mallemMobileMenu');

  /**
   * Global trigger listener for opening mobile menu
   * WHY: Supports multiple triggers (hamburger, language icon, etc.)
   * USAGE: Add [data-mallem-mobile-menu-open] to any button/link
   * KALLES PATTERN: Icon triggers in header → open drawer with controls
   *
   * CRITICAL: No screen-size restrictions - works on desktop AND mobile
   */
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-mallem-mobile-menu-open]');
    if (trigger) {
      e.preventDefault();
      console.log('[Mallem Mobile Menu] Trigger clicked:', trigger);
      mobileMenu.open();
    }
  });

  console.log('[Mallem Mobile Menu] ✓ Global click listener attached for [data-mallem-mobile-menu-open]');
  console.log('[Mallem Mobile Menu] ✓ Initialization complete - Ready for desktop + mobile triggers');
}

/**
 * Export for module bundlers (if theme uses build system)
 * WHY: Future-proof for Webpack/Vite builds
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MallemMobileMenu;
}
