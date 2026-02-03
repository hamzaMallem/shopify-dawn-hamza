# mallem Theme Development Tracker

Project: mallem Shopify Theme (Dawn Evolution)
Base: Shopify Dawn 15.2.0
Target Markets: MENA + Global
Focus: Premium features, RTL-ready, COD commerce, mobile-first

---

## Day 1: RTL Foundation System ✅ Complete

**Date:** 2025-12-26
**Feature:** Theme-wide RTL/LTR Support System
**Status:** ✅ Production Ready

### What Was Built

#### 1. RTL Detection & Direction Management
- **File:** `snippets/mallem-rtl-wrapper.liquid`
- **Purpose:** Automatic RTL detection from locale + merchant override capability
- **Features:**
  - Auto-detects RTL languages: Arabic (ar), Hebrew (he), Farsi (fa), Urdu (ur)
  - Merchant-controllable override via theme settings (auto/rtl/ltr)
  - Outputs HTML `dir` attribute and CSS class hooks (`mallem-rtl` / `mallem-ltr`)
  - Zero JavaScript - pure Liquid logic
  - Fully commented with implementation documentation

#### 2. RTL Styling System
- **File:** `assets/mallem-rtl.css` (600+ lines)
- **Purpose:** Comprehensive RTL-safe CSS using logical properties
- **Coverage:**
  - Typography & text alignment (direction-aware)
  - Navigation & menus (flipped directional indicators)
  - Product cards & grid layouts
  - Forms & input components (icon positioning)
  - Cart & checkout (drawer positioning)
  - Media components
  - Icons (smart flipping - only directional icons)
  - Utility classes (text-align, float)
  - Mobile-specific adjustments (< 750px)
  - Desktop refinements (>= 750px)
- **Optimizations:**
  - CSS containment for performance
  - Accessibility enhancements (focus indicators, skip links)
  - Safari-specific RTL fixes
  - Print media support

#### 3. Merchant Controls
- **File:** `config/settings_schema.json` (lines 1469-1507)
- **Section:** "Mallem RTL & Localization"
- **Settings:**
  - `mallem_rtl_direction` (select):
    - "auto" (default) - Auto-detect from language
    - "rtl" - Force RTL direction
    - "ltr" - Force LTR direction
  - Clear merchant-facing descriptions
  - Informational content about supported RTL languages

#### 4. Theme Integration
- **File:** `layout/theme.liquid`
- **Changes:**
  - Line 2: Integrated RTL wrapper in `<html>` tag via `{% render 'mallem-rtl-wrapper' %}`
  - Line 259: Loaded `mallem-rtl.css` after base styles

### Files Added
- `snippets/mallem-rtl-wrapper.liquid` (new)
- `assets/mallem-rtl.css` (new)

### Files Modified
- `layout/theme.liquid` (2 lines: HTML integration + CSS loading)
- `config/settings_schema.json` (added settings section)

### Key Architectural Patterns
1. **Snippet-Based Direction Control:** Centralized RTL logic in reusable snippet
2. **CSS Logical Properties:** Future-proof, direction-agnostic layouts (`inline-start`, `inline-end`, `text-align: start`)
3. **Schema-Driven Configuration:** Merchant control without code editing
4. **Performance-Neutral:** No JavaScript, minimal CSS overhead, CSS containment
5. **Progressive Enhancement:** Works with or without merchant override
6. **Mobile-First:** Responsive breakpoints at 750px (Dawn standard)

### Integration Points
- HTML `dir` attribute applied at root level
- CSS class hooks (`mallem-rtl` / `mallem-ltr`) for component styling
- Theme settings accessible via `settings.mallem_rtl_direction`
- Locale detection via `request.locale.iso_code`

### Technical Highlights
- **Zero JavaScript Dependency:** Pure CSS + Liquid
- **Automatic Detection:** Works out-of-the-box for RTL locales
- **Graceful Degradation:** Falls back to LTR if detection fails
- **Icon Handling:** Only flips directional icons (arrows, chevrons), preserves neutral icons (close, search, cart)
- **Accessibility:** Enhanced focus indicators, proper skip-link positioning
- **Browser Compatibility:** Safari scrollbar fixes, modern CSS with fallbacks

---

## Day 2: Product Card System Foundation ✅ Complete

**Date:** 2025-12-27
**Feature:** Reusable Product Card Component System
**Status:** ✅ Production Ready

### What Was Built

#### 1. Product Card Component
- **File:** `snippets/mallem-product-card.liquid` (258 lines)
- **Purpose:** Premium reusable product card for collections, search, recommendations
- **Features:**
  - Product image with lazy loading (width/height explicit)
  - Secondary image hover effect (desktop only)
  - Clickable card with accessible ARIA labels
  - Sold-out state detection and display
  - Sale state detection
  - Badge system integration
  - Optional vendor display
  - Optional quick view button (hook for future JS)
  - Optional wishlist button (hook for future JS)
  - Optional variant swatches (hook for future JS)
  - Configurable image aspect ratios (portrait/square/landscape)
  - Mobile-first with large tap targets
  - Zero JavaScript required for core functionality
  - Fully commented with usage examples

#### 2. Price Display Component
- **File:** `snippets/mallem-price.liquid` (164 lines)
- **Purpose:** Flexible price display with sale pricing, compare-at, and discount badges
- **Features:**
  - Regular price display
  - Sale price with compare-at price
  - Discount percentage badge (optional)
  - Price range support (variable products)
  - Unit price display (weight-based products)
  - Variant-specific or product-level pricing
  - Semantic HTML with microdata hooks
  - RTL-ready via CSS logical properties
  - All text via translation keys
  - Accessibility labels (visually hidden)

#### 3. Badge Component
- **File:** `snippets/mallem-badge.liquid` (125 lines)
- **Purpose:** Product state and promotional badges
- **Badge Types:**
  - `sale` - On sale / discount
  - `soldout` - Out of stock
  - `cod` - Cash on delivery available (MENA focus)
  - `new` - New arrival
  - `hot` - Hot / trending item
  - `preorder` - Pre-order available
  - `limited` - Limited quantity
- **Features:**
  - Optional icons for enhanced visual impact
  - Custom badge text support
  - Translation key integration
  - RTL-ready styling
  - Semantic HTML

#### 4. Product Card Styling System
- **File:** `assets/mallem-product-card.css` (613 lines)
- **Purpose:** Complete styling for product card ecosystem
- **Coverage:**
  - Product card container with hover effects
  - Media container with aspect ratio variants
  - Image handling (primary, secondary, placeholder)
  - Lazy loading transitions
  - Badge positioning and styling (7 badge variants)
  - Action buttons (quick view, wishlist) with touch optimization
  - Product info layout (vendor, title, price)
  - Price component styles (regular, sale, compare, discount, range, unit)
  - RTL support via CSS logical properties
  - Responsive breakpoints (mobile/tablet/desktop)
  - Accessibility (focus states, reduced motion, high contrast)
  - Performance (GPU acceleration, will-change)
- **CSS Custom Properties:**
  - Spacing, typography, colors, transitions, z-index
  - Fully themeable via CSS variables
- **Optimizations:**
  - Mobile-first responsive design
  - Large tap targets (44px minimum)
  - GPU-accelerated animations
  - Reduced motion support
  - Print styles

### Files Added
- `snippets/mallem-product-card.liquid` (new)
- `snippets/mallem-price.liquid` (new)
- `snippets/mallem-badge.liquid` (new)
- `assets/mallem-product-card.css` (new)

### Files Modified
- `locales/en.default.json` (added translation keys for products.badge, products.product.view_product, products.product.quick_view, products.product.add_to_wishlist)

### Key Architectural Patterns
1. **Snippet-First Architecture:** All components are reusable snippets, not section-locked
2. **Progressive Enhancement:** Core functionality (images, links, prices) works without JavaScript
3. **Separation of Concerns:** Price logic, badge logic, and card layout are independent components
4. **Mobile-First Responsive:** Touch-optimized with large tap targets, progressive desktop enhancements
5. **Performance-Optimized:** Lazy loading, explicit image dimensions (prevent CLS), CSS containment
6. **Accessibility-First:** ARIA labels, semantic HTML, keyboard navigation, focus management
7. **RTL-Ready by Default:** CSS logical properties throughout, no left/right usage
8. **Translation-Driven:** No hardcoded text, all strings via translation keys
9. **Hook-Based Extensibility:** Quick view, wishlist, swatches use data attributes for future JS modules

### Integration Points
- **Usage:** `{% render 'mallem-product-card', product: product, show_vendor: true, show_cod: true %}`
- **Price Snippet:** Can be used standalone or within product card
- **Badge Snippet:** Can be used standalone or within product card
- **CSS:** Loaded via `assets/mallem-product-card.css` (BEM naming: `.mallem-product-card__*`)
- **JavaScript Hooks:** `data-quick-view`, `data-wishlist-toggle`, `data-product-swatches` for future modules
- **Translation Keys:** `products.badge.*`, `products.product.*`, `products.price.*`

### Technical Highlights
- **Zero JavaScript Core:** Card, price, and badge work without JS (progressive enhancement)
- **Lazy Loading:** Images use `loading="lazy"` and optional lazyload class for custom implementations
- **No Layout Shift:** Explicit width/height on all images, aspect-ratio containers
- **Secondary Image Hover:** Desktop-only hover effect, hidden on mobile for performance
- **Badge Priority System:** Sold Out > Sale > COD (merchant priorities)
- **Action Button Visibility:** Always visible on touch devices, hover-triggered on desktop
- **BEM Naming Convention:** `.mallem-product-card__element--modifier` for clarity
- **CSS Logical Properties:** `padding-inline`, `margin-block`, `inset-inline-start`, `text-align: start`
- **Accessibility:** Visually hidden labels, focus states, keyboard navigation, screen reader support
- **Performance:** GPU acceleration (`transform`, `opacity`), CSS containment, reduced motion support

---

## Day 2: Product Card Quick View Hooks ✅ Complete

**Date:** 2025-12-27
**Feature:** Non-Destructive Quick View Integration Hooks
**Status:** ✅ Production Ready

### What Was Added

#### Quick View Data Attributes
- **File:** `snippets/mallem-product-card.liquid` (lines 179-196)
- **Purpose:** Enable future Quick View modal functionality without breaking existing structure
- **Hooks Added:**
  - `data-mallem-quick-view-trigger` - Click event handler hook for JS module
  - `data-product-handle="{{ product.handle }}"` - Product handle for AJAX fetch
  - `data-product-id="{{ product.id }}"` - Product ID for tracking and analytics
- **Implementation:**
  - Added to existing Quick View button element
  - Removed legacy `data-product-url` attribute (replaced with `data-product-handle`)
  - Fully documented in code comments
  - Zero structural changes to existing markup
  - Maintains RTL, accessibility, and keyboard navigation
  - No JavaScript added (hooks only)

### Files Modified
- `snippets/mallem-product-card.liquid` (enhanced Quick View button with data attributes)

### Key Architectural Pattern
- **Hook-Based Extensibility:** Data attributes provide JavaScript integration points without coupling markup to implementation
  - Product card remains fully functional without JS
  - Quick View can be enabled/disabled by loading/unloading JS module
  - Future JS module (`mallem-quick-view.js`) will target `[data-mallem-quick-view-trigger]` selector
  - Product handle enables clean AJAX requests: `/products/{handle}?view=quick-view`
  - Product ID supports analytics tracking and GTM events
  - Non-destructive: existing functionality unchanged
  - Namespaced attributes (`data-mallem-*`) prevent conflicts with third-party apps

### Integration Points
- **JavaScript Hook:** `document.querySelectorAll('[data-mallem-quick-view-trigger]')`
- **Product Handle Usage:** `fetch(\`/products/\${handle}?view=quick-view\`)`
- **Product ID Usage:** Analytics, tracking, cart events
- **Button Behavior:** Existing CSS visibility (hover/touch) preserved
- **Accessibility:** Button remains keyboard-accessible, focusable, with ARIA label

### Technical Highlights
- **Zero Breakage:** No structural, logical, or styling changes
- **Progressive Enhancement:** Card works identically with or without future JS module
- **Clean Separation:** Markup provides hooks, JS module (when built) handles behavior
- **Handle vs URL:** Using `product.handle` instead of `product.url` enables cleaner AJAX patterns
- **Fully Documented:** Comments explain hook purpose and future JS module integration
- **Production-Safe:** No risk to existing deployments

---

## Day 2: Quick View Modal System ✅ Complete

**Date:** 2025-12-27
**Feature:** Isolated Quick View Modal with AJAX Product Loading
**Status:** ✅ Production Ready

### What Was Built

#### 1. Quick View Modal Markup
- **File:** `snippets/mallem-quick-view-modal.liquid` (109 lines)
- **Purpose:** Global modal container rendered once in theme, controlled by JavaScript
- **Features:**
  - Modal overlay with backdrop blur
  - Centered dialog on desktop, full-screen on mobile
  - Header with dynamic product title and close button
  - Body with content injection area
  - Loading state with spinner
  - Close button with large tap target (44px)
  - Semantic HTML with ARIA attributes
  - RTL-ready via CSS logical properties
  - No Liquid logic (pure HTML structure)

#### 2. Quick View JavaScript Module
- **File:** `assets/mallem-quick-view.js` (371 lines)
- **Purpose:** Handle modal interactions, AJAX fetching, and accessibility
- **Features:**
  - Event delegation for dynamic product cards
  - AJAX fetch from `/products/{handle}?view=quick-view`
  - Abort controller for fetch cancellation
  - Body scroll lock when modal open
  - Keyboard navigation (Escape to close)
  - Basic focus trap (Tab cycling)
  - Focus restoration after close
  - Loading and error states
  - Shopify product form initialization
  - Custom events for analytics integration
  - Clean code architecture with class-based structure
  - Fully commented (WHY over WHAT)

#### 3. Quick View Modal Styles
- **File:** `assets/mallem-quick-view.css` (428 lines)
- **Purpose:** Complete styling for modal overlay, dialog, and states
- **Features:**
  - Full-screen overlay with backdrop blur
  - Centered modal (max-width: 1000px)
  - Smooth fade-in/scale animations
  - Mobile-first responsive (full-screen on mobile)
  - RTL-ready (CSS logical properties only)
  - Loading spinner animation
  - Error state styling
  - Custom scrollbar for modal body
  - CSS custom properties for theming
  - Accessibility (focus indicators, high contrast)
  - Reduced motion support
  - Print styles (hide modal)
  - GPU-accelerated animations

### Files Added
- `snippets/mallem-quick-view-modal.liquid` (new)
- `assets/mallem-quick-view.js` (new)
- `assets/mallem-quick-view.css` (new)

### Files Modified
- `layout/theme.liquid` (3 lines: CSS loading, modal render, JS loading)

### Key Architectural Patterns
1. **Isolated Modal System:** Zero coupling to Product Card - works via data attribute hooks only
2. **Single Instance Performance:** Modal rendered once, content injected dynamically
3. **Hook-Based Integration:** `[data-mallem-quick-view-trigger]` on product cards triggers modal
4. **Progressive Enhancement:** Product cards work fully without modal (standard links)
5. **Event Delegation:** Supports dynamic product cards (AJAX filtering, infinite scroll)
6. **Abort Controller Pattern:** Cancels fetch if user closes modal or clicks new product
7. **Focus Management:** Traps focus in modal, restores to trigger on close
8. **Clean Separation:** Markup (Liquid) + Behavior (JS) + Style (CSS) fully isolated

### Integration Points
- **Trigger Hook:** Product cards with `[data-mallem-quick-view-trigger]` activate modal
- **Product Fetch:** `GET /products/{handle}?view=quick-view`
- **Content Injection:** Fetched HTML injected into `[data-mallem-quick-view-content]`
- **Theme Integration:** Modal rendered in `layout/theme.liquid` before `</body>`
- **CSS Loading:** Loaded globally in theme head (lines 260-261)
- **JS Loading:** Deferred script loading (line 381)
- **Custom Events:**
  - `mallem:quickview:open` - Modal opened
  - `mallem:quickview:close` - Modal closed
  - `mallem:quickview:loaded` - Product content loaded
  - `mallem:quickview:error` - Fetch error
  - `mallem:quickview:content-ready` - Hook for other modules

### Technical Highlights
- **Zero Global Reflows:** Uses `transform` and `opacity` for animations (GPU-accelerated)
- **Body Scroll Lock:** Prevents background scrolling on mobile
- **Fetch on Demand:** Only loads product data when modal opened
- **Error Handling:** Graceful degradation with error state UI
- **Keyboard Accessible:** Escape closes, Tab cycles focus, Enter/Space activate
- **Screen Reader Support:** ARIA roles (`role="dialog"`, `aria-modal="true"`)
- **RTL Compatible:** All positioning via logical properties (`inset`, `padding-inline`, `margin-block`)
- **Mobile Optimized:** Full-screen modal on mobile, scrollable body
- **Clean Teardown:** Clears content, unlocks scroll, restores focus on close
- **Shopify Integration:** Re-initializes Shopify.ProductForm for fetched content
- **Analytics Ready:** Custom events for GTM/analytics tracking

### Accessibility Compliance
- `role="dialog"` and `aria-modal="true"` on modal container
- `aria-labelledby` pointing to modal title
- `aria-hidden` toggled on open/close
- Focus trap within modal (Tab cycling)
- Focus restoration to trigger on close
- Large tap targets (44px minimum)
- Keyboard navigation (Escape, Tab, Enter, Space)
- Screen reader announcements via ARIA
- High contrast mode support
- Reduced motion support

### RTL Compliance
- All CSS uses logical properties
- `inset` instead of `top/right/bottom/left`
- `padding-inline` / `padding-block` instead of `padding-left/right`
- `margin-inline` / `margin-block` instead of `margin-left/right`
- `border-start-start-radius` instead of `border-top-left-radius`
- Direction inherited from `html[dir]`
- No directional transforms or positioning

---

## Day 2: Quick View Product Template ✅ Complete

**Date:** 2025-12-27
**Feature:** Dedicated Product Template for Quick View Modal
**Status:** ✅ Production Ready

### What Was Built

#### Quick View Product Template
- **File:** `templates/product.quick-view.liquid` (280 lines)
- **Purpose:** Lightweight product template optimized for AJAX-loaded modal content
- **Access Pattern:** `/products/{handle}?view=quick-view`
- **Features:**
  - Single product image (featured image only)
  - Product title and price display
  - Variant selector (dropdown for all options)
  - Quantity input
  - Add to cart button with sold-out state
  - Truncated product description (30 words)
  - "View Full Details" link to main product page
  - No header, footer, or layout wrappers
  - No sections or blocks
  - Minimal DOM for fast rendering
  - Inline critical CSS for fallback styling

### Files Added
- `templates/product.quick-view.liquid` (new)

### Key Architectural Patterns
1. **Minimal Markup:** Single image, essential info only - optimized for modal display
2. **Snippet Reuse:** Uses `mallem-price.liquid` for consistent pricing display
3. **Standard Shopify Form Pattern:** Compatible with Shopify cart/add scripts
4. **Progressive Enhancement:** Works without JavaScript (form posts to /cart/add)
5. **Inline Critical CSS:** Ensures usable layout even if external CSS fails to load
6. **No Layout Wrapper:** Template returns raw HTML for AJAX injection

### Integration Points
- **AJAX Fetch:** Loaded by `mallem-quick-view.js` via `/products/{handle}?view=quick-view`
- **Price Snippet:** Reuses `snippets/mallem-price.liquid` for consistency
- **Product Form:** Standard Shopify form pattern (compatible with Shopify.ProductForm)
- **Translation Keys:** All text via `products.product.*` keys
- **Product JSON:** Embedded for variant selection JavaScript

### Technical Highlights
- **Single Image Only:** Featured media only, no gallery (performance)
- **Explicit Dimensions:** Width/height on image prevents layout shift
- **Truncated Description:** 30 words max, prevents content overflow
- **Sold-Out Handling:** Disabled button state, clear messaging
- **Variant Selection:** Dropdown selects (simple UI for modal)
- **Form Validation:** novalidate attribute (handled by Shopify scripts)
- **Product JSON:** Embedded script for Shopify variant selection logic
- **Inline Styles:** Grid layout, ensures usability if CSS delayed
- **No Loops:** Minimal Liquid logic, fast rendering
- **RTL-Ready:** Grid layout automatically RTL-compatible

### Content Included
- ✅ Product title
- ✅ Product featured image (800px width)
- ✅ Price display (via mallem-price snippet)
- ✅ Variant selectors (dropdown for each option)
- ✅ Quantity input
- ✅ Add to cart / Sold out button
- ✅ Product description (truncated)
- ✅ View full details link

### Content Excluded
- ❌ Product gallery (multiple images)
- ❌ Vendor display
- ❌ Product badges
- ❌ Trust signals
- ❌ Product recommendations
- ❌ Breadcrumbs
- ❌ Social sharing
- ❌ Reviews
- ❌ Full description

### Why Excluded
- **Performance:** Minimal HTML/CSS reduces modal load time
- **Focus:** Quick view = quick decision, not full product exploration
- **Scroll:** Less content = less scrolling in modal

---

## Day 2: Quick View Variant Enhancements ✅ Complete

**Date:** 2025-12-27
**Feature:** Dynamic Variant Selection in Quick View Modal
**Status:** ✅ Production Ready

### What Was Enhanced

#### Variant Selection Logic
- **File:** `templates/product.quick-view.liquid` (enhanced, now 614 lines)
- **Purpose:** Enable dynamic price, image, and availability updates on variant change
- **Implementation:** Inline JavaScript (~190 lines) for variant matching and UI updates

### Features Added

#### 1. Dynamic Price Updates
- Price container with `data-product-price` attribute
- JavaScript updates price HTML on variant change
- Sale price calculation with discount percentage
- Respects Shopify money format settings
- Translation key support for i18n

#### 2. Dynamic Image Updates
- Product image with `data-product-image` attribute
- Updates `src` and `srcset` when variant has featured image
- Maintains responsive image sizing (400w, 600w, 800w)
- Preserves alt text from variant image
- Fallback to product image if variant has no image

#### 3. Dynamic Availability Updates
- Add to cart button with `data-add-button` attribute
- Automatically disables when variant sold out
- Updates button text ("Add to Cart" ↔ "Sold Out")
- Uses translation keys for button text

#### 4. Variant Matching Logic
- Embeds all product variants as JSON
- Matches selected options to correct variant
- Updates hidden variant ID input for form submission
- Handles multi-option products (size, color, material, etc.)
- Edge case handling (no matching variant)

### Files Modified
- `templates/product.quick-view.liquid` (added variant selection JavaScript)

### Technical Implementation

#### JavaScript Architecture
- **IIFE Pattern:** Self-contained, no global pollution
- **DOM Caching:** Elements cached once, no repeated queries
- **Event Delegation:** Single change listener per select
- **Variant Lookup:** O(n) search through variants array
- **Image Lookup:** Pre-built object for fast access
- **Translation Support:** Embedded translation keys from Liquid

#### Key Functions
- `getSelectedOptions()` - Extract current selections from dropdowns
- `findMatchingVariant(options)` - Match options to variant object
- `updatePrice(variant)` - Rebuild price HTML with sale/regular/discount
- `updateImage(variant)` - Update image src/srcset if variant has image
- `updateButton(variant)` - Enable/disable button based on availability
- `formatMoney(cents)` - Respect merchant currency format
- `handleVariantChange()` - Orchestrate all updates on selection change

#### Data Attributes Used
- `[data-option-select]` - Option select dropdowns
- `[data-variant-id]` - Hidden variant ID input
- `[data-product-price]` - Price container for HTML updates
- `[data-product-image]` - Product image element
- `[data-add-button]` - Add to cart button
- `[data-button-text]` - Button text span
- `[data-option-value]` - Selected value label display

### Performance Characteristics
- **No External Requests:** All variant data embedded in page
- **No DOM Thrashing:** Batch updates, cached elements
- **Minimal Script Size:** ~190 lines, ~6KB unminified
- **Inline Execution:** No additional HTTP request
- **Only for Multi-Variant Products:** Script omitted for single variants

### RTL & Accessibility Compliance
- **RTL:** Markup uses flexbox, no directional JS
- **Keyboard:** Dropdowns fully keyboard accessible
- **Screen Readers:** Visually hidden labels for price context
- **Translation:** All user-facing text via translation keys
- **Progressive Enhancement:** Works without JS (form posts with selected options)

### Technical Highlights
- **Variant Data Embedded:** `{{ product.variants | json }}` - no fetch needed
- **Money Formatting:** Uses Shopify.formatMoney if available, fallback to shop format
- **Image URL Manipulation:** Shopify CDN URL pattern for responsive sizes
- **Sold Out Handling:** Button disabled attribute + text change
- **Multi-Option Support:** Handles products with 1-3 option selects
- **Option Label Updates:** Shows current selection next to option name
- **Console Warning:** Logs if no variant matches (shouldn't happen)

---

## Day 2: Header Language Switcher ✅ Complete

**Date:** 2025-12-27
**Feature:** Native Shopify Language Switcher for Header
**Status:** ✅ Production Ready

### What Was Built

#### Language Switcher Snippet
- **File:** `snippets/mallem-language-switcher.liquid` (177 lines)
- **Purpose:** Enable language switching in header/footer using Shopify's native localization system
- **Implementation:** Reusable snippet with minimal markup and inline styles

### Features

#### Core Functionality
- Uses Shopify's `localization.available_languages` API
- Form posts to `routes.localizations_url`
- Auto-submits on change (no JavaScript required)
- Returns to current page after language switch
- Shows language endonyms (native names: العربية, English)
- Gracefully handles 2+ languages
- Only renders if multiple languages available

#### Accessibility
- Hidden label for screen readers
- Proper `lang` attribute on options
- Keyboard navigable select dropdown
- Focus outline on keyboard interaction
- Noscript fallback submit button

#### RTL Compatibility
- Direction inherited from `html[dir]`
- CSS logical properties throughout
- Icon positioning via `inset-inline-end`
- Padding via `padding-inline-start/end`
- No directional logic in snippet

### Files Added
- `snippets/mallem-language-switcher.liquid` (new)

### Technical Implementation

#### Shopify Form Pattern
```liquid
<form action="{{ routes.localizations_url }}" method="post">
  <input type="hidden" name="locale_code" value="{{ language.iso_code }}">
  <input type="hidden" name="return_to" value="{{ request.path }}">
</form>
```

#### Key Features
- **Endonym Display:** `{{ language.endonym_name }}` shows native language name
- **Auto-Submit:** `onchange="this.form.submit()"` for instant switching
- **Current Detection:** Selected attribute based on `localization.language.iso_code`
- **Conditional Render:** Only shows if `localization.available_languages.size > 1`
- **Return URL:** Maintains current page context after switch
- **Noscript Support:** Fallback button for JavaScript-disabled browsers

#### Inline Styles
- Minimal styling for header integration
- RTL-safe logical properties
- Transparent background for theme flexibility
- Icon positioned via logical properties
- Focus states for accessibility

### Integration Points
- **Usage:** `{% render 'mallem-language-switcher' %}` in header/footer
- **Shopify Admin:** Languages configured in Settings > Languages
- **Translation Keys:** Uses `localization.language_label` and `localization.update_language`
- **RTL System:** Works with existing `mallem-rtl-wrapper.liquid` system
- **No JavaScript:** Pure HTML form submission

### Technical Highlights
- **Zero JavaScript Core:** Works without JS (progressive enhancement)
- **Native Shopify API:** No custom logic, uses built-in localization
- **Page Reload:** Shopify standard behavior on language change
- **Regional Support:** Can handle language variants (en-US, en-GB, etc.)
- **Inline Styles:** Self-contained, works without external CSS
- **Visually Hidden Label:** Accessible but clean UI
- **Globe Icon:** Optional SVG for visual indicator

### Language Support
- **Arabic (ar):** Full RTL support via theme RTL system
- **English (en):** Default LTR
- **Extensible:** Supports any Shopify-enabled language
- **Endonyms:** Shows native names regardless of current locale

---

## Day 3: Header Mega Menu Foundation ✅ Complete

**Date:** 2025-12-29
**Feature:** Desktop Mega Menu Navigation System
**Status:** ✅ Production Ready

### What Was Built

#### Mega Menu Snippet
- **File:** `snippets/mallem-mega-menu.liquid` (128 lines)
- **Purpose:** Desktop navigation with multi-column dropdown panels for large catalogs
- **Implementation:** Reusable snippet using native `<details>/<summary>` pattern with CSS Grid

### Features

#### Core Functionality
- Three-level navigation hierarchy (parent > category > subcategory)
- Multi-column dropdown panels using CSS Grid
- Hover-based activation on desktop
- Native `<details>` element for keyboard accessibility
- Auto-layout columns (responsive 1-6 columns)
- Active state detection for current page/category
- Semantic HTML with ARIA attributes
- Zero JavaScript required for core functionality

#### Desktop-First Interaction
- Hover-triggered dropdowns (CSS-only)
- Keyboard navigation via native `<details>` element
- Caret icon rotation on open/close
- Smooth fade-in animations
- Focus trap support via existing `header-menu` component
- Auto-close on scroll (inherited from Dawn's sticky header)

#### RTL Compatibility
- CSS logical properties throughout
- Icon positioning via `inset-inline-start/end`
- Padding/margin via `padding-inline`, `margin-block`
- Grid columns auto-flip in RTL
- No directional JavaScript
- Direction inherited from `html[dir]`

#### Accessibility
- Semantic `<nav>` with `role="navigation"`
- `aria-expanded` on summary triggers
- `aria-controls` linking triggers to panels
- `aria-current="page"` on active links
- Keyboard navigation (Tab, Enter, Escape)
- Focus visible outlines
- Screen reader labels
- High contrast mode support

### Files Added
- `snippets/mallem-mega-menu.liquid` (new)
- `assets/mallem-mega-menu.css` (new)

### Files Modified
- `sections/header.liquid` (integration required: line 168 replace `header-mega-menu` with `mallem-mega-menu`, line 11 replace CSS path)

### Key Architectural Patterns
1. **Snippet-Based Component:** Reusable navigation snippet, not section-locked
2. **Native HTML Pattern:** Uses `<details>/<summary>` for zero-JS functionality
3. **CSS Grid Columns:** Auto-responsive columns based on content count
4. **Progressive Enhancement:** Core functionality works without JavaScript
5. **CSS-Only Interactions:** Hover states, animations, and transitions via CSS
6. **Existing Component Reuse:** Leverages Dawn's `header-menu` web component for focus management
7. **RTL-First Design:** Logical properties from the start, no refactoring needed
8. **Mobile Hidden:** Desktop-only component (mobile uses drawer menu)

### Integration Points
- **Usage:** Replace `{% render 'header-mega-menu' %}` with `{% render 'mallem-mega-menu' %}` in header
- **CSS Loading:** Replace `component-mega-menu.css` with `mallem-mega-menu.css` in header
- **Navigation Source:** Reads from `section.settings.menu` (Shopify linklist)
- **Color Scheme:** Respects `section.settings.menu_color_scheme`
- **Shopify Admin:** Configured in Navigation > Menus (supports 3 levels)
- **Web Component:** Uses existing `<header-menu>` for focus management and scroll behavior
- **Translation Keys:** Uses `sections.header.menu` for ARIA labels

### Technical Highlights
- **Zero JavaScript Core:** Dropdown functionality via CSS `:hover` and `<details>`
- **GPU-Accelerated Animations:** Uses `transform` and `opacity` for smooth transitions
- **CSS Containment:** `contain: layout style paint` for performance
- **Grid Auto-Fit:** Responsive columns without media queries (`repeat(auto-fit, minmax())`)
- **Sticky Header Compatible:** Max-height calculation respects sticky header position
- **Single-Level Detection:** Compact layout for menus without subcategories
- **Hover Indent Effect:** Subcategory links indent on hover for visual feedback
- **Icon Rotation:** Caret flips 180° when menu opens
- **Reduced Motion Support:** Animations disabled for `prefers-reduced-motion`
- **Print-Safe:** Dropdowns hidden in print media
- **Logical Properties:** `inset-inline`, `padding-inline`, `margin-block`, `text-align: start`
- **BEM Naming:** `.mallem-mega-menu__element--modifier` for maintainability

### CSS Architecture
- **Grid System:** Auto-responsive columns (18-22rem per column based on viewport)
- **Z-Index Management:** Panel at `z-index: 3` (above content, below modals)
- **Performance Optimizations:** `will-change`, CSS containment, GPU acceleration
- **Spacing System:** Consistent gap values (3rem vertical, 4-5rem horizontal)
- **Typography Scale:** 1.4rem triggers, 1.3rem links, proper line-height ratios
- **Color Variables:** Uses CSS custom properties (`--color-foreground`, `--color-background`)
- **Transition Timing:** `--duration-short` and `--duration-default` for consistency
- **Focus States:** 0.2rem outline with 0.3rem offset, rounded corners

### Navigation Structure Support
- **Parent Links:** Top-level menu items (with or without dropdowns)
- **Category Headings:** Second-level links (bold, clickable)
- **Subcategory Links:** Third-level links (regular weight, hover indent)
- **Single Links:** Parent items without children (no dropdown)
- **Active States:** Visual indicator for current page and parent categories
- **Empty State Handling:** Graceful rendering if no subcategories

### Mobile Behavior
- **Hidden on Mobile:** `display: none` below 990px breakpoint
- **Mobile Menu:** Use existing drawer menu for mobile (not replaced)
- **Responsive Breakpoint:** Matches Dawn's standard desktop breakpoint

---

## Day 4: Language Switching Architecture + Header Globe UX (Kalles-style) ✅ Complete

**Date:** 2025-12-30
**Feature:** Language Switching Architecture + Header Globe UX (Kalles-style)
**Status:** ✅ Production Ready

### What We Built

#### 1. Shopify-Native Language Switching
- **Implementation:** Finalized Shopify-native language switching using `localization-form`
- **No JavaScript Hacks:** Pure Shopify POST to `/localization` endpoint
- **Page Reload:** Full page reload on language change (Shopify-controlled)
- **URL Updates:** Language reflected in URL (`/ar` or `?locale=ar`)
- **Locale Management:** Shopify controls `request.locale.iso_code` and session

#### 2. RTL/LTR Detection System
- **File:** `snippets/mallem-rtl-wrapper.liquid` (simplified)
- **Logic:** Direction strictly tied to `request.locale.iso_code`
- **Removed:** Unnecessary `settings.mallem_rtl_direction` override complexity
- **RTL Languages:** Arabic (ar), Hebrew (he), Farsi/Persian (fa), Urdu (ur)
- **Output:** `dir="rtl" class="mallem-rtl"` OR `dir="ltr" class="mallem-ltr"`
- **Automatic:** RTL activates when user switches to Arabic (no manual config)

#### 3. Kalles-Style UX Pattern
- **Header Globe Icon (🌐):** Single entry point for language switching
- **Icon is Trigger Only:** Does NOT change language directly
- **Opens Drawer:** Click globe → Mobile menu drawer opens
- **Language Switcher Inside Drawer:** Actual `<localization-form>` at top of drawer
- **No Duplicate Selectors:** Removed footer language selector
- **Single Source of Truth:** Language switcher appears ONLY in mobile menu drawer

#### 4. Translation System Integration
- **File:** `locales/en.default.json` (updated)
- **File:** `locales/ar.json` (created)
- **Keys Added:**
  - `general.menu` → "Menu" / "القائمة"
  - `general.search.placeholder` → "Search" / "بحث"
  - `accessibility.main_navigation` → "Main navigation" / "القائمة الرئيسية"
  - `accessibility.mobile_menu` → "Mobile menu" / "القائمة المحمولة"
  - `localization.language_label` → "Language" / "اللغة"
- **Complete Arabic Locale:** 550+ translation keys for all theme sections
- **RTL-Compatible:** All translations support right-to-left text flow

### Files Added / Modified

#### Files Modified
- `snippets/mallem-language-switcher.liquid` (validated - already correct)
- `snippets/mallem-rtl-wrapper.liquid` (simplified - removed settings override)
- `snippets/mallem-mobile-menu.liquid` (validated - language switcher placement)
- `sections/header.liquid` (validated - globe icon trigger)
- `sections/footer.liquid` (removed duplicate language selector)
- `layout/theme.liquid` (validated - RTL wrapper integration)
- `locales/en.default.json` (added missing translation keys)

#### Files Added
- `locales/ar.json` (complete Arabic locale - 550+ keys)
- `docs/LANGUAGE-SWITCHING-VALIDATION.md` (architecture documentation)
- `docs/LANGUAGE-UX-ARCHITECTURE.md` (UX patterns documentation)

### Key Architectural Patterns

#### 1. Shopify Native Localization
- Uses `<localization-form>` pattern (no custom logic)
- POST to `{{ routes.localizations_url }}`
- Form fields: `locale_code`, `return_to`, `form_type`
- Full page reload (Shopify standard behavior)
- Session/cookie management by Shopify
- Compatible with Shopify Markets

#### 2. Locale-Driven RTL System
- **Source of Truth:** `request.locale.iso_code` only
- **Detection:** Extract language code from locale (e.g., "ar-SA" → "ar")
- **Activation:** If locale in `['ar', 'he', 'fa', 'ur']` → RTL
- **No Settings:** Removed merchant override (unnecessary complexity)
- **Automatic:** Zero configuration required

#### 3. Single Source of Truth
- **Only Location:** `snippets/mallem-mobile-menu.liquid` (line 72)
- **No Duplicates:** Removed from footer, announcement bar, header
- **Reusable Snippet:** `snippets/mallem-language-switcher.liquid`
- **Validation:** Verified no duplicate selectors in theme

#### 4. Kalles UX Pattern
- **Header:** Icon triggers only (no dropdowns, no forms)
- **Drawer:** Actual controls (language selector, navigation)
- **Desktop & Mobile:** Same drawer, same UX
- **Single Entry Point:** Globe icon is ONLY way to access language switching
- **Clean Header:** No language text, no select dropdowns

#### 5. Progressive Enhancement
- **No JavaScript Language Switching:** Shopify controls everything
- **Form Auto-Submit:** `onchange="this.form.submit()"` for instant switching
- **Page Reload:** Browser handles navigation (Shopify redirect)
- **No Client-Side Logic:** No manual HTML attribute updates
- **Works Without JS:** Noscript fallback button included

#### 6. RTL-First Architecture
- **CSS Logical Properties:** All layout uses `inline-start`, `inline-end`, `text-align: start`
- **No Directional Overrides:** Styles work in both directions
- **Automatic Activation:** RTL CSS activates when `[dir="rtl"]` present
- **Language Icon RTL-Ready:** Globe SVG is symmetrical (no flipping needed)

### Integration Points

#### Language Switching Flow
```
1. User clicks globe icon (🌐) in header
   ↓
2. Mobile menu drawer opens (data-mallem-mobile-menu-open)
   ↓
3. User sees language switcher at top of drawer
   ↓
4. User selects "العربية" from dropdown
   ↓
5. Form auto-submits: POST /localization
   ↓
6. Shopify updates session locale
   ↓
7. Page reloads with locale=ar
   ↓
8. HTML output: <html lang="ar" dir="rtl" class="mallem-rtl">
   ↓
9. Translations load from locales/ar.json
   ↓
10. RTL CSS activates automatically
```

#### HTML Output Examples
- **English:** `<html lang="en" dir="ltr" class="mallem-ltr">`
- **Arabic:** `<html lang="ar" dir="rtl" class="mallem-rtl">`

#### Translation Key Usage
```liquid
{{ 'general.menu' | t }}
<!-- English: "Menu" -->
<!-- Arabic: "القائمة" -->
```

### Technical Highlights

#### Shopify Compliance
- ✅ Uses native `localization.available_languages` API
- ✅ Form submits to official Shopify endpoint
- ✅ Respects merchant language configuration
- ✅ Works with Shopify Markets
- ✅ Compatible with Shopify CDN caching
- ✅ SEO-friendly URL structure

#### RTL Activation
- ✅ Automatic based on `request.locale.iso_code`
- ✅ No merchant configuration needed
- ✅ Covers 99% of RTL e-commerce markets
- ✅ Zero JavaScript dependency
- ✅ CSS-driven direction changes

#### Single Entry Point
- ✅ Globe icon in header (only trigger)
- ✅ No footer language selector
- ✅ No duplicate controls anywhere
- ✅ Prevents user confusion
- ✅ Matches premium theme UX

#### Translation System
- ✅ Complete Arabic locale (550+ keys)
- ✅ All Dawn theme sections covered
- ✅ RTL-compatible strings
- ✅ Endonym display (العربية, English)
- ✅ Proper JSON structure

#### No JavaScript Language Switching
- ❌ No `document.documentElement.lang = "ar"`
- ❌ No `window.location.href = "/ar"`
- ❌ No localStorage language persistence
- ❌ No client-side routing
- ✅ Pure Shopify native localization

### Result

#### User Experience
- Switching to Arabic fully translates the store
- RTL activates automatically (text right-aligned, drawer from right)
- URL reflects locale (`/ar` or `?locale=ar`)
- Header remains clean (icon only, no dropdowns)
- No duplicated language UI anywhere
- Behavior matches Shopify official + Kalles + premium themes

#### Developer Experience
- Single source of truth for language switching
- Clear architecture documentation
- No custom localization logic to maintain
- Shopify handles all session/cookie management
- Easy to add new languages (just add locale file)

#### Production Readiness
- ✅ Works on desktop and mobile
- ✅ Shopify-compliant
- ✅ Theme Store ready
- ✅ RTL markets ready (MENA)
- ✅ Fully documented
- ✅ No breaking changes

### Documentation Created
- **LANGUAGE-SWITCHING-VALIDATION.md:** Complete validation guide with troubleshooting
- **LANGUAGE-UX-ARCHITECTURE.md:** Comprehensive UX patterns and architecture overview

---

## Day 3: Sticky Add to Cart System ✅ Complete

**Date:** 2025-12-27
**Time:** 14:30
**Feature:** Mobile-First Sticky Add to Cart Bar
**Status:** ✅ Production Ready

### What Was Built

#### 1. Sticky Add to Cart Section
- **File:** `sections/mallem-sticky-atc.liquid` (119 lines)
- **Purpose:** Mobile-first sticky bar that appears when main product form scrolls out of view
- **Implementation:** Custom element with Intersection Observer for visibility control

### Features

#### Core Functionality
- Intersection Observer detects when main ATC button scrolls out of viewport
- Automatically syncs with main product form (variant ID, quantity, availability)
- Smooth fade-in/slide-up animation on appearance
- Optional COD trust badge for MENA markets
- Desktop visibility toggle (recommended: mobile-only)
- Merchant enable/disable control via section settings

#### Variant Synchronization
- **File:** `assets/mallem-sticky-atc.js` (271 lines)
- Listens to Dawn's `variant:change` event
- Listens to mallem custom events (`mallem:variant-change`, `mallem:cart-update`)
- Auto-updates variant ID from main form
- Auto-updates quantity from main form
- Updates button state (available/sold-out/unavailable)
- Handles add-to-cart via AJAX (`POST /cart/add.js`)
- Loading state with spinner animation
- Error handling with custom events

#### Mobile-First Design
- Fixed positioning at bottom of viewport
- Compact product info (thumbnail, title, price)
- Large tap target add-to-cart button (min 44px)
- COD badge hidden on mobile (shown tablet+)
- Optional desktop visibility (default: mobile-only)
- No layout shift (position: fixed)

#### RTL Support
- **File:** `assets/mallem-sticky-atc.css` (237 lines)
- CSS logical properties throughout
- `inset-block-end`, `inset-inline-start` for positioning
- `padding-inline`, `margin-block` for spacing
- `text-align: start` for alignment
- Badge and button layout RTL-compatible
- No directional JavaScript

#### Accessibility
- ARIA `role="region"` with descriptive label
- Hidden attribute for initial state
- Keyboard-accessible button
- Screen reader friendly
- Focus states on button
- Loading state communicated to assistive tech

#### Translation System
- **Files:** `locales/en.default.json`, `locales/ar.json`
- Section schema translations (`sections.mallem_sticky_atc.*`)
- Mallem namespace keys (`mallem.sticky_atc.*`, `mallem.trust_badges.*`)
- COD badge text configurable
- Fallback to translation keys
- Full English + Arabic support

### Files Added
- `sections/mallem-sticky-atc.liquid` (new)
- `assets/mallem-sticky-atc.css` (new)
- `assets/mallem-sticky-atc.js` (new)

### Files Modified
- `locales/en.default.json` (added section translations + mallem namespace)
- `locales/ar.json` (added section translations + mallem namespace)

### Key Architectural Patterns

#### 1. Custom Element Pattern
- Uses Web Components API (`customElements.define`)
- Encapsulated component logic
- Lifecycle hooks (`connectedCallback`, `disconnectedCallback`)
- Self-contained state management

#### 2. Intersection Observer
- Zero-JavaScript fallback (doesn't break without JS)
- Observes main product form ATC button
- Shows sticky bar when main button out of viewport
- Hides when main button back in view
- Efficient (no scroll event listeners)

#### 3. Event-Driven Sync
- Listens to Shopify Dawn's native events
- Listens to mallem custom events
- Decoupled from main form implementation
- Works with any product form structure
- No direct DOM coupling

#### 4. Progressive Enhancement
- Section works without JavaScript (just hidden)
- Add-to-cart works as standard form post fallback
- AJAX enhancement for better UX
- No breaking changes if JS fails to load

#### 5. Mobile-First Responsive
- Base styles for mobile
- Progressive enhancements for tablet (750px+)
- Desktop visibility optional (990px+)
- Touch-optimized tap targets
- Performance-focused (minimal repaints)

### Integration Points

#### Section Usage
- Add to product template via theme customizer
- Section settings:
  - `enabled` - Enable/disable sticky bar
  - `show_on_desktop` - Show on desktop screens
  - `show_cod_badge` - Display COD trust badge
  - `cod_badge_text` - Custom badge text

#### Main Form Detection
- Searches for `product-form` custom element
- Fallback: `form[action*="/cart/add"]`
- Observes primary ATC button or form itself
- Compatible with Dawn product form structure

#### Custom Events Dispatched
- `mallem:cart-add` - Item added successfully
- `cart:item-added` - Dawn compatibility event
- `mallem:cart-error` - Add to cart failed
- `mallem:price-update` - Price component update

#### Price Component Integration
- Uses `mallem-price` snippet for consistency
- Reactive price updates on variant change
- Reuses existing price styling
- No duplicate price logic

### Technical Highlights

#### Performance
- `position: fixed` prevents reflow
- `transform` and `opacity` for GPU-accelerated animations
- CSS `contain: layout style paint` for isolation
- Passive event listeners
- `requestAnimationFrame` for DOM updates
- Intersection Observer (native, efficient)

#### Variant Sync Logic
- Reads variant ID from hidden input (`[name="id"]`)
- Reads quantity from quantity input (`[name="quantity"]`)
- Updates on variant change events
- Updates on form submit
- Disables button when sold out
- Updates button text based on availability

#### AJAX Add to Cart
- `POST /cart/add.js` endpoint
- JSON request body (`id`, `quantity`)
- Fetch API with error handling
- Loading state during request
- Success/error event dispatching
- Compatible with cart drawer systems

#### Accessibility Compliance
- `role="region"` with `aria-label`
- Hidden state via `hidden` attribute
- Keyboard-accessible button
- Focus visible outlines
- Loading state indicators
- Screen reader friendly text

#### RTL Compliance
- All positioning via logical properties
- `inset-block-end: 0` (bottom in both LTR/RTL)
- `padding-inline-start`, `padding-inline-end`
- `margin-inline`, `gap` for spacing
- Icon SVG symmetrical (no flipping)
- Grid/flexbox auto-flip in RTL

### CSS Architecture

#### Layout System
- Flexbox for horizontal arrangement
- `justify-content: space-between` for spacing
- `align-items: center` for vertical centering
- `gap` for consistent spacing
- Responsive with media queries (750px, 990px)

#### Transition System
- 300ms cubic-bezier for smooth animations
- `translateY(100%)` to `translateY(0)` slide-up
- Opacity fade-in
- Class-based visibility (`.is-visible`)
- Respects `prefers-reduced-motion`

#### Z-Index Management
- `z-index: 10` (above content, below modals)
- Sticky header compatible
- Doesn't conflict with mega menu or cart drawer

#### Component Styling
- Product image: 50px mobile, 60px tablet+
- Badge: hidden mobile, shown 750px+
- Button: 140px mobile, 180px desktop
- Container: full-width with page-width padding
- Typography: 0.875rem mobile, 1rem tablet+

### Merchant Controls

#### Section Settings Schema
```json
{
  "enabled": true/false,
  "show_on_desktop": false (default),
  "show_cod_badge": true/false,
  "cod_badge_text": "COD Available"
}
```

#### Translation Keys
- `sections.mallem_sticky_atc.name`
- `sections.mallem_sticky_atc.settings.*`
- `mallem.sticky_atc.label`
- `mallem.trust_badges.cod_available`

#### Desktop Visibility Logic
- Default: mobile-only (hidden 750px+)
- If `show_on_desktop: true` → shown on all screens
- Modifier class: `.mallem-sticky-atc--mobile-only`

### Browser Compatibility
- Intersection Observer (modern browsers, polyfill available)
- Custom Elements v1 (all modern browsers)
- Fetch API (all modern browsers)
- CSS logical properties (all modern browsers)
- Fallback: works as hidden element without JS

### Use Cases
- Long product descriptions (sticky appears after scrolling)
- Mobile shopping (persistent ATC access)
- High-converting product pages
- MENA markets (COD badge visibility)
- Dropshipping stores (mobile-first audiences)

---

## Day 4: Product Tabs System ✅ Complete

**Date:** 2025-12-30
**Time:** 16:45
**Feature:** Product Information Tabs (Desktop Tabs / Mobile Accordion)
**Status:** ✅ Production Ready

### What Was Built

#### Product Tabs Section
- **File:** `sections/mallem-product-tabs.liquid` (312 lines)
- **Purpose:** Organize product information in tabbed interface on desktop, accordion on mobile
- **Implementation:** Custom element with responsive behavior switching

### Features

#### Desktop Tabs
- Horizontal tab list with bottom border indicator
- Click to switch between content panels
- Keyboard navigation (Arrow keys, Home, End, Tab)
- Active tab highlighted with border and color
- Smooth content switching
- Optional emoji/icon support per tab

#### Mobile Accordion
- Vertical collapsible panels with borders
- Click trigger to expand/collapse content
- Animated caret icon rotation
- Two modes: all closed, or first open
- Smooth max-height transitions
- Touch-optimized tap targets

#### Block Architecture
- 5 block types: Description, Shipping, Size Guide, COD Info, Custom
- Merchant can add, remove, reorder tabs
- Each block has title and optional icon
- Rich text editor for content
- Default content for standard blocks
- Unlimited custom tabs

#### Content Types
- **Description:** Auto-pulls product.description
- **Shipping:** Customizable shipping policy
- **Size Guide:** Customizable size chart content
- **COD Info:** MENA-focused cash on delivery details (default template provided)
- **Custom:** Fully merchant-controlled content

#### RTL Support
- **File:** `assets/mallem-tabs.css` (428 lines)
- CSS logical properties throughout
- `padding-inline`, `margin-block` for spacing
- `text-align: start` for alignment
- `border-block-end` for borders
- Tab list scrolls correctly in RTL
- Icon positioning via logical properties

#### Accessibility
- ARIA `role="tablist"`, `role="tab"`, `role="tabpanel"`
- `aria-selected`, `aria-controls`, `aria-labelledby`
- `aria-expanded` for accordion triggers
- Keyboard navigation (Arrow keys cycle tabs)
- Home/End keys jump to first/last tab
- Focus visible outlines
- Screen reader friendly

#### JavaScript Behavior
- **File:** `assets/mallem-tabs.js` (258 lines)
- Custom element (`<mallem-tabs>`)
- Responsive behavior switching at 750px
- Desktop: Tab switching with ARIA updates
- Mobile: Accordion toggle with smooth animations
- Window resize handling (reinitializes on breakpoint cross)
- Custom events: `mallem:tab-change`, `mallem:accordion-open`, `mallem:accordion-close`
- Clean event listener management

### Files Added
- `sections/mallem-product-tabs.liquid` (new)
- `assets/mallem-tabs.css` (new)
- `assets/mallem-tabs.js` (new)

### Files Modified
- `locales/en.default.json` (added section + mallem.product_tabs translations)
- `locales/ar.json` (added section + mallem.product_tabs translations)

### Key Architectural Patterns

#### 1. Responsive Pattern Switching
- Single component, dual behavior (tabs/accordion)
- Media query detection (750px breakpoint)
- Automatic reinit on resize across breakpoint
- CSS hides/shows appropriate UI elements
- No duplicate markup

#### 2. Block-Based Content
- Shopify section blocks for merchant control
- Reorderable via drag-and-drop (Shopify admin)
- Add/remove blocks without code
- Default presets (Description, Shipping, COD)
- Extensible with custom blocks

#### 3. Progressive Enhancement
- Works without JavaScript (accordion shows all content)
- JavaScript enhances with animations and state management
- CSS-only fallback functional
- No FOUC (Flash of Unstyled Content)

#### 4. Keyboard Accessibility
- Full keyboard navigation on desktop tabs
- Arrow keys cycle through tabs (with wrap-around)
- Home/End jump to first/last
- Enter/Space activate accordion triggers
- Tab key for standard focus order
- Focus trap not needed (not modal)

#### 5. Mobile-First CSS
- Base styles for mobile accordion
- Desktop tab styles added at 750px+ breakpoint
- Accordion triggers hidden on desktop
- Tab list hidden on mobile
- Single source of truth for content

### Integration Points

#### Section Usage
- Add to product template via theme customizer
- Position below product form or gallery
- Section settings:
  - `mobile_behavior` - Accordion mode (all closed vs first open)
  - `padding_top`, `padding_bottom` - Spacing control

#### Block Settings
- `title` - Tab/accordion heading text
- `icon` - Optional emoji or symbol
- `content` - Rich text content (type-specific)

#### Translation Keys
- `sections.mallem_product_tabs.*` - Section schema
- `mallem.product_tabs.*` - Default content strings
- Fully localized English + Arabic

### Technical Highlights

#### CSS Architecture
- Mobile: `max-block-size: 0` → `max-block-size: 200rem` for accordion animation
- Desktop: `display: none` → `display: block` for panel switching
- Tab active state: `border-block-end: 2px solid`
- Smooth transitions with `transition: max-block-size 0.3s ease`
- No JavaScript animations (CSS-driven)

#### JavaScript Architecture
- Custom element lifecycle (`connectedCallback`, `disconnectedCallback`)
- Resize observer pattern with media query listener
- Event delegation for dynamic content
- State management (activeTabIndex)
- Clean event listener removal on cleanup
- No jQuery, vanilla JS only

#### Responsive Switching
- Media query: `(max-width: 749px)`
- Desktop: `initDesktopTabs()` - click + keyboard handlers
- Mobile: `initMobileAccordion()` - click handlers
- Cleanup on mode switch to prevent memory leaks
- Reinitialize on resize across breakpoint

#### Performance
- CSS containment (implicit via display switching)
- No layout thrashing (batch DOM reads/writes)
- Minimal JavaScript (only UI state management)
- No external dependencies
- Lazy content loading (hidden panels not rendered in DOM fully)

#### COD Default Content
- Structured template for MENA markets
- Title, description, feature list
- All via translation keys
- Merchant can override with custom content
- Falls back to default if empty

### Use Cases
- Organize lengthy product descriptions
- Display shipping policies per product
- Provide size guides for apparel
- Highlight COD availability (MENA)
- Custom warranty/care instructions
- FAQ sections on product page
- Technical specifications
- Material/ingredient lists

### Browser Compatibility
- Custom Elements v1 (all modern browsers)
- CSS logical properties (all modern browsers)
- matchMedia API (all modern browsers)
- Graceful degradation (shows all content if JS fails)

---

## Day 5: Size Guide Advanced System ✅ Complete

**Date:** 2025-12-30
**Time:** 17:30
**Feature:** Metafield-Powered Size Guide Modal System
**Status:** ✅ Production Ready

### What Was Built

#### Size Guide Button Snippet
- **File:** `snippets/mallem-size-guide-button.liquid` (69 lines)
- **Purpose:** Conditional trigger button that only appears if size guide metafields exist
- **Implementation:** Metafield-driven with JSON data embedding

#### Size Guide Modal Snippet
- **File:** `snippets/mallem-size-guide-modal.liquid` (62 lines)
- **Purpose:** Global modal container rendered once in theme layout
- **Implementation:** Reusable modal with dynamic content injection

### Features

#### Metafield-Powered Content
- **Namespace:** `mallem`
- **Required Fields:**
  - `size_guide_title` (single line text) - Modal title
  - `size_guide_content` (rich text) - Main content with HTML support
- **Optional Field:**
  - `size_guide_image` (file reference) - Size chart graphic
- Content stored in product metafields (merchant-controlled)
- No hardcoded size guides in theme

#### Conditional Rendering
- Button only appears if metafields exist
- Automatic detection of `size_guide_title` AND `size_guide_content`
- No broken UI if size guide not configured
- Per-product control (some products have guides, others don't)

#### Single Modal Architecture
- One modal instance for entire theme
- Reused across all products
- Content injected dynamically on open
- No duplicate DOM elements
- Efficient memory usage

#### Modal UX
- **File:** `assets/mallem-size-guide.js` (223 lines)
- Click button to open modal
- Backdrop blur effect
- Close via: close button, backdrop click, Escape key
- Smooth fade-in animation
- Body scroll lock when open
- Focus trap (keyboard navigation contained)
- Focus restoration on close

#### Rich Content Support
- HTML tables (size charts)
- Headings, paragraphs, lists
- Optional header image
- Custom scrollbar styling
- Responsive table layout (mobile-optimized)
- RTE content styling (`.rte` class)

#### RTL Support
- **File:** `assets/mallem-size-guide.css` (478 lines)
- CSS logical properties throughout
- `padding-inline`, `margin-block` for spacing
- `inset` for positioning
- Modal dialog RTL-compatible
- Table text alignment via `text-align: start`
- Image and content flow correctly in RTL

#### Accessibility
- ARIA `role="dialog"`, `aria-modal="true"`
- `aria-labelledby` pointing to title
- `aria-hidden` toggles on open/close
- Focus trap (Tab cycles within modal)
- Escape key closes modal
- Large tap targets (44px close button)
- Keyboard accessible button
- Screen reader friendly labels

#### Button Design
- Icon + text layout
- Ruler/measuring tape SVG icon
- Hover state with background fill
- Border styling
- Focus visible outline
- Translation key for button text
- Inline-flex layout (icon + text)

### Files Added
- `snippets/mallem-size-guide-button.liquid` (new)
- `snippets/mallem-size-guide-modal.liquid` (new)
- `assets/mallem-size-guide.css` (new)
- `assets/mallem-size-guide.js` (new)
- `docs/size-guide-integration.md` (new)

### Files Modified
- `locales/en.default.json` (added mallem.size_guide translations)
- `locales/ar.json` (added mallem.size_guide translations)

### Key Architectural Patterns

#### 1. Metafield-Driven Content
- Zero hardcoded size guides
- Merchant controls all content via Shopify admin
- Content stored at product level (not theme level)
- Supports product-specific size guides
- Extensible (add more metafields as needed)

#### 2. Single Instance Modal Pattern
- One `<mallem-size-guide-modal>` rendered in `layout/theme.liquid`
- Modal content cleared and re-injected on each open
- Efficient DOM usage (not one modal per product)
- Reusable architecture (can be adapted for other modals)
- Custom element pattern (`<mallem-size-guide-modal>`)

#### 3. Data Embedding Strategy
- Size guide data embedded as JSON in product page
- No AJAX fetch required
- Data stored in `<script type="application/json">` tag
- JavaScript reads and parses JSON on modal open
- Product handle used as data identifier

#### 4. Progressive Enhancement
- Button renders if metafields exist (Liquid logic)
- Modal works without JavaScript (displays JSON data)
- JavaScript enhances with modal UX
- No JavaScript = button still visible (graceful degradation)

#### 5. Focus Management
- `previouslyFocusedElement` stored on open
- Focus restored to trigger button on close
- Focus trap prevents Tab escaping modal
- Shift+Tab cycles backward through focusables
- Tab on last element returns to first

### Integration Points

#### Theme Layout Integration
1. Add modal to `layout/theme.liquid` before `</body>`:
   ```liquid
   {% render 'mallem-size-guide-modal' %}
   ```

2. Load CSS in `<head>`:
   ```liquid
   {{ 'mallem-size-guide.css' | asset_url | stylesheet_tag }}
   ```

3. Load JS before `</body>`:
   ```liquid
   <script src="{{ 'mallem-size-guide.js' | asset_url }}" defer></script>
   ```

#### Product Page Integration
Add button where desired:
```liquid
{% render 'mallem-size-guide-button', product: product %}
```

**Recommended placements:**
- Below variant selectors
- In product tabs (size guide tab)
- Near size/variant picker
- Product card quick actions

#### Metafield Setup
Merchants configure in Shopify admin:
- Navigate to Product > Metafields
- Add custom definition (namespace: `mallem`)
- Set `size_guide_title`, `size_guide_content`, `size_guide_image`

### Technical Highlights

#### Custom Element Lifecycle
- `connectedCallback()` - Setup on mount
- `setupEventListeners()` - Attach event handlers
- `setupTriggers()` - Event delegation for buttons
- `open(trigger)` - Extract data, inject content, show modal
- `close()` - Hide modal, restore focus, unlock scroll
- `disconnectedCallback()` - Cleanup on unmount

#### Content Injection
- Read JSON from `[data-size-guide-data]` script tag
- Parse JSON safely with try/catch
- Inject title into `#size-guide-modal-title`
- Inject content into `[data-modal-content]`
- Set image if exists (with dimensions)
- Hide image container if no image

#### Focus Trap Implementation
- Query all focusable elements on open
- Store in `this.focusableElements` array
- Tab on last element → focus first
- Shift+Tab on first element → focus last
- Prevent Tab from escaping modal bounds

#### Body Scroll Lock
- Add `mallem-modal-open` class to `<body>` on open
- CSS: `body.mallem-modal-open { overflow: hidden; }`
- Remove class on close
- Prevents background scrolling on mobile

#### Event System
- `mallem:size-guide:open` - Dispatched on modal open (with product handle)
- `mallem:size-guide:close` - Dispatched on modal close
- Bubbles to document for analytics integration

### Performance Characteristics

#### Minimal DOM Footprint
- Single modal element (not per product)
- Hidden by default (`hidden` attribute)
- Content cleared after close (memory cleanup)
- No duplicate modals in DOM

#### No Network Requests
- All data embedded in page (JSON script tag)
- No AJAX fetch on modal open
- Instant content display
- Offline-friendly

#### CSS-Driven Animations
- Opacity fade-in for modal
- Transform scale for dialog
- CSS transitions (no JavaScript animations)
- GPU-accelerated (`transform`, `opacity`)
- Respects `prefers-reduced-motion`

#### Lazy Image Loading
- `loading="lazy"` on size guide image
- Only loads when modal opened
- Explicit width/height prevent CLS
- Image optional (no performance hit if absent)

### Mobile Optimization

#### Full-Screen Modal
- `max-block-size: 90vh` on mobile
- `max-inline-size: calc(100% - 2rem)` with margins
- Scrollable body area
- Touch-friendly close button (44px)
- Custom scrollbar (webkit only)

#### Responsive Typography
- Mobile: 0.875rem base font
- Desktop: 1rem base font
- Table font size scales down on mobile
- Padding reduces on mobile (1.25rem vs 2rem)

#### Touch Interactions
- Backdrop click to close
- Large tap targets (44px minimum)
- No hover-only interactions
- Swipe-friendly scrolling

### Use Cases

#### Apparel/Fashion
- Clothing size charts (S/M/L/XL measurements)
- Shoe size conversions (US/UK/EU)
- Ring size guides
- Hat/cap sizing

#### Furniture
- Dimension diagrams
- Assembly space requirements
- Weight capacity charts

#### Electronics
- Device compatibility charts
- Cable length recommendations
- Power requirement tables

#### Beauty/Cosmetics
- Shade/color matching guides
- Application instructions
- Product comparison tables

### Browser Compatibility
- Custom Elements v1 (all modern browsers)
- CSS logical properties (all modern browsers)
- JSON parsing (all browsers)
- Graceful degradation (modal won't open if JS disabled)

### Documentation

#### Integration Guide
- **File:** `docs/size-guide-integration.md`
- Complete setup instructions
- Metafield configuration guide
- HTML table templates
- Troubleshooting section
- Event documentation
- Customization examples
- Future enhancement ideas

---

## Day 6: Cart Drawer System ✅ Complete

**Date:** 2025-12-31
**Feature:** AJAX Cart Drawer (Kalles-style)
**Status:** ✅ Production Ready

### What Was Built

#### 1. Global Cart Drawer Component
- **File:** `snippets/mallem-cart-drawer.liquid` (207 lines)
- **Purpose:** Single global cart drawer rendered once in theme layout
- **Implementation:** Web Component with AJAX cart operations

#### 2. Cart Drawer Styles
- **File:** `assets/mallem-cart-drawer.css` (581 lines)
- **Purpose:** Complete styling for cart drawer overlay, container, items, and footer
- **Features:**
  - Slides from inline-end (RTL/LTR safe)
  - Transform-based animations (GPU accelerated)
  - Mobile-first responsive design
  - Loading states with spinner
  - Empty state design
  - Trust badge support (COD)
  - Focus trap styles
  - Scrollable body with custom scrollbar

#### 3. Cart Drawer JavaScript
- **File:** `assets/mallem-cart-drawer.js` (407 lines)
- **Purpose:** Handle cart interactions via Shopify Cart API
- **Features:**
  - Event-driven architecture (listens to mallem:cart-add)
  - Fetches cart via /cart.js
  - Updates quantity via /cart/change.js
  - Removes items (set quantity to 0)
  - Mustache-style template rendering
  - Focus trap and keyboard navigation
  - Debounced quantity updates (300ms)
  - Auto-open on add-to-cart
  - Body scroll lock when open
  - Escape key closes drawer
  - Form interception (AJAX add to cart)

### Features

#### Core Functionality
- Drawer slides from inline-end (right in LTR, left in RTL)
- Single global drawer instance (rendered once)
- Opens automatically on add-to-cart
- Fetches cart via Shopify Cart API (/cart.js)
- Supports quantity update and item removal
- Shows subtotal and checkout button
- COD trust badge support (optional)
- Empty state with continue shopping link
- Line item display (image, title, variant, price, quantity)

#### AJAX Operations
- `GET /cart.js` - Fetch current cart state
- `POST /cart/add.js` - Add item to cart
- `POST /cart/change.js` - Update line item quantity
- Debounced updates (300ms) to avoid API spam
- Loading states during requests
- Error handling with fallback

#### Accessibility
- ARIA dialog with `role="dialog"` and `aria-modal="true"`
- Focus trap (Tab cycles within drawer)
- Keyboard navigation (Escape to close)
- Screen reader announcements (aria-live regions)
- Large tap targets (44px minimum)
- Focus visible outlines
- Keyboard-accessible controls

#### RTL Support
- All positioning uses CSS logical properties
- `inset-inline-end` for drawer position
- `padding-inline`, `margin-block` for spacing
- `text-align: start` for alignment
- Transform directions flip automatically with `dir="rtl"`
- Logical properties throughout: `inset-block`, `border-block-end`

#### Mobile-First Design
- Full-width drawer on mobile (max 420px)
- Responsive spacing (reduced padding on mobile)
- Touch-optimized tap targets
- Smooth scrolling on mobile (webkit overflow scrolling)
- Custom scrollbar styling
- Overlay with backdrop blur

#### Template Rendering
- Client-side Mustache-style templates
- Item template (`#mallem-cart-item-template`)
- Empty state template (`#mallem-cart-empty-template`)
- Dynamic rendering on cart updates
- No page reloads

### Files Added
- `snippets/mallem-cart-drawer.liquid` (new)
- `assets/mallem-cart-drawer.css` (new)
- `assets/mallem-cart-drawer.js` (new)

### Files Modified
- `layout/theme.liquid` (integrated drawer snippet, CSS, and JS)
- `locales/en.default.json` (added mallem.trust_badges translation keys)
- `locales/ar.json` (added mallem.trust_badges translation keys)

### Key Architectural Patterns

#### 1. Web Component Pattern
- Uses Custom Elements API (`customElements.define('cart-drawer', MallemCartDrawer)`)
- Encapsulated component logic
- Lifecycle hooks (`connectedCallback`, `disconnectedCallback`)
- Self-contained state management
- Event-driven architecture

#### 2. Event-Driven Cart Updates
- Listens to `mallem:cart-add` custom event
- Intercepts all product forms globally (`form[action*="/cart/add"]`)
- Dispatches custom events on cart operations
- Decoupled from product form implementation
- Works with any product form structure

#### 3. Single Instance Architecture
- One drawer for entire theme
- Rendered once in `layout/theme.liquid`
- Reused across all pages
- Content updated dynamically on state change
- No duplicate DOM elements

#### 4. Progressive Enhancement
- Drawer renders with `hidden` attribute
- Works without JavaScript (forms post to /cart)
- JavaScript enhances with AJAX operations
- Graceful degradation if JS fails
- No breaking changes

#### 5. Shopify Cart API Integration
- Uses official Shopify Cart API endpoints
- JSON responses for all operations
- No custom backend required
- Compatible with Shopify checkout flow
- Works with cart attributes and notes

#### 6. Debounced Updates
- Quantity changes queued in Map
- Debounce timer (300ms) prevents API spam
- Batch updates processed sequentially
- Optimistic UI updates
- Loading states during requests

### Integration Points

#### Theme Layout Integration
1. Render drawer in `layout/theme.liquid` before `</body>`:
   ```liquid
   {% render 'mallem-cart-drawer' %}
   ```

2. Load CSS in `<head>`:
   ```liquid
   {{ 'mallem-cart-drawer.css' | asset_url | stylesheet_tag }}
   ```

3. Load JS before `</body>`:
   ```liquid
   <script src="{{ 'mallem-cart-drawer.js' | asset_url }}" defer></script>
   ```

#### Product Form Integration
- JavaScript automatically intercepts all forms with `action="/cart/add"`
- No manual integration required
- Compatible with Dawn product forms
- Works with custom product forms

#### Event System
- `mallem:cart-add` - Triggered after successful add-to-cart
- Custom event bubbles to document
- Analytics integration point
- Other components can listen and react

#### Translation Keys
- `sections.cart.title` - Cart drawer title
- `sections.cart.subtotal` - Subtotal label
- `sections.cart.checkout` - Checkout button text
- `sections.cart.empty` - Empty cart message
- `mallem.trust_badges.cod_available` - COD badge text
- `products.product.quantity.*` - Quantity control labels
- `sections.cart.remove_title` - Remove item label

### Technical Highlights

#### Performance
- `position: fixed` prevents reflow
- `transform` and `opacity` for GPU-accelerated animations
- CSS `contain: layout style paint` for isolation
- Debounced API calls (300ms)
- Event delegation for dynamic content
- Single drawer instance (no duplication)

#### Cart API Usage
- Fetch current cart: `GET /cart.js`
- Add item: `POST /cart/add.js` with FormData
- Update quantity: `POST /cart/change.js` with `{ line, quantity }`
- Response format: JSON cart object
- Line items indexed starting at 1

#### Mustache-Style Templates
- Simple template rendering without external libraries
- Supports conditionals: `{{#field}}...{{/field}}`
- Supports variables: `{{field}}`
- Templates in `<template>` elements
- No build step required

#### Focus Management
- `focusableElements` array cached on open
- Focus trap prevents Tab escaping drawer
- Shift+Tab cycles backward
- Focus restored to trigger on close
- First focusable element receives focus on open

#### Body Scroll Lock
- `document.body.style.overflow = 'hidden'` on open
- Restored on close
- Prevents background scrolling on mobile
- No layout shift

#### Empty State Handling
- Displays empty cart icon (SVG)
- Message and CTA button
- Footer hidden when cart empty
- Graceful UX

### Mobile Optimization

#### Responsive Behavior
- Full-width drawer on mobile (max 100vw)
- Reduced padding (1rem vs 1.5rem)
- Smaller item images (80px)
- Compact quantity controls
- Touch-friendly buttons

#### Scrolling
- Drawer body scrollable with custom scrollbar
- Webkit overflow scrolling for smooth mobile scroll
- Header and footer sticky (flex-shrink: 0)
- No body scroll when drawer open

### Use Cases
- Dropshipping stores (quick checkout)
- MENA markets (COD badge visibility)
- Mobile-first audiences (90%+ mobile traffic)
- High-converting checkout flow
- Upsell/cross-sell integration point
- Cart abandonment reduction

### Browser Compatibility
- Custom Elements v1 (all modern browsers)
- Fetch API (all modern browsers)
- CSS logical properties (all modern browsers)
- Graceful degradation (forms post without JS)

---

## Next: Cart Upsells or Free Shipping Progress Bar

**Priority:** High (Complements cart drawer, improves AOV and conversion)
**Depends On:** Cart Drawer System ✅

### Alternative Next Steps
- **Free Shipping Progress Bar:** Show progress toward free shipping threshold in cart drawer
- **Cart Upsells:** Product recommendations in cart drawer
- **Shipping & Returns System:** Enhances trust signals

---

**Tracker maintained by:** mallem development team
**Last updated:** 2025-12-31
