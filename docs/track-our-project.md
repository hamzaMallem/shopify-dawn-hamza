# mallem Theme Development Tracker

---

## Day 13: Product Detail Page (PDP) System ✅ Complete

**Date:** 2026-04-02
**Feature:** Full Product Detail Page — gallery, info panel, sticky ATC, stock urgency, accordion
**Status:** ✅ Production Ready

### What Was Built

#### 1. Section — `sections/mallem-product-main.liquid`
- CSS Grid layout: 55fr gallery | 45fr info, collapses to single column below 990px
- Breadcrumb navigation (home → collection → product) via Liquid
- Renders `mallem-product-gallery` + `mallem-product-info` snippets
- Loads `mallem-product-main.css` (link tag) + `mallem-product-main.js` (defer)
- Full schema: image_ratio, gallery_thumbnails_position, enable_zoom, enable_sticky_atc,
  show_vendor, show_rating, show_cod_badge, stock_low_threshold (default 5),
  stock_medium_threshold (default 20), show_free_shipping_threshold, free_shipping_amount
- Schema blocks: description_tab, size_guide_tab (richtext), shipping_tab (richtext), custom_tab
- All labels via `t:` keys — zero hardcoded strings in schema

#### 2. Snippet — `snippets/mallem-product-gallery.liquid`
- Desktop: vertical thumbnail rail (CSS grid-area `thumbs`) + main viewport
- RTL: thumbnails position controlled by `grid-template-areas` — no JS needed
- Thumbnail buttons: `data-mallem-thumb data-mallem-index="N"`, ARIA role=tab
- Custom Element `<mallem-product-gallery>` wraps full gallery
- Track: `data-mallem-gallery-track` — flex row, transform drives slide changes
- Image 0: `loading="eager" fetchpriority="high"` for LCP optimisation
- All others: `loading="lazy"` — mobile 3G friendly
- All images: explicit width + height (CLS prevention)
- Zoom class `mallem-gallery__slide--zoomable` applied per `enable_zoom` setting
- Mobile: thumbs hidden, dot indicators shown (`data-mallem-gallery-dots`)
- ARIA: `role="region"`, `aria-label`, live region `aria-live="assertive"` for slide announcements
- Prev/next arrow buttons with RTL-correct labels

#### 3. Snippet — `snippets/mallem-product-info.liquid`
- Strict conversion-hierarchy render order: vendor → title → rating → price → form → trust → accordion
- Rating placeholder `data-mallem-rating` — review app (Judge.me / Loox) injects here
- Price block: compare-at price + sale badge + current price, all server-rendered
- Variant form: hidden id input + mallem-variant-swatches + qty stepper + stock + ATC + COD + shipping
- Qty stepper: 44×44px min touch target (WCAG 2.5.5), `-/input/+` with data-mallem-qty-* hooks
- ATC button: `data-mallem-atc-button`, full-width, 52px min-height, loading spinner via CSS class
- COD badge conditional on `show_cod_badge` setting
- Free shipping threshold line with `✓` prefix when enabled
- Inline form error region: `role="alert" aria-live="assertive"`

#### 4. Snippet — `snippets/mallem-product-stock.liquid`
- Server-side initial state: Liquid evaluates qty against thresholds
- `data-mallem-stock-display` with `data-mallem-inventory`, `data-mallem-low-threshold`,
  `data-mallem-medium-threshold` for JS re-evaluation on variant change
- Rules: qty ≤ 0 → `mallem-stock--out` | qty ≤ low → `mallem-stock--low` (red) |
  qty ≤ medium → `mallem-stock--medium` (orange) | qty > medium → `hidden` (no noise)
- `inventory_policy = continue` → treated as in-stock, element hidden

#### 5. Snippet — `snippets/mallem-product-accordion.liquid`
- Native `<details><summary>` — zero JS, screen-reader native, keyboard accessible
- First item pre-opened via `open` attribute
- Inline SVG chevron rotates 180° via CSS `[open]` selector — pure CSS animation
- Block types: `description_tab` → `product.description` | `size_guide_tab` → richtext |
  `shipping_tab` → richtext | `custom_tab` → title + richtext
- `mallem-rte` class normalises Shopify rich text output

#### 6. Snippet — `snippets/mallem-sticky-atc.liquid`
- Custom Element `<mallem-sticky-atc>` with `aria-hidden="true"` default
- Contains: 48×48 product thumbnail + title + variant + price + ATC button
- `position: fixed; inset-inline: 0; bottom: 0` — full RTL safety
- `padding-block-end: env(safe-area-inset-bottom)` for iPhone home bar
- Default state: `transform: translateY(100%)` — invisible + off-screen
- JS show/hide: toggles `aria-hidden` attribute → CSS `[aria-hidden="false"]` selector drives transform

#### 7. Asset — `assets/mallem-product-main.css`
- CSS custom properties: `--mallem-product-gap`, `--mallem-gallery-thumb-size`,
  `--mallem-stock-low-color (#dc2626)`, `--mallem-stock-medium-color (#ea580c)`
- Section grid: `55fr 45fr`, single column on mobile
- Gallery track + slides: flex row, overflow hidden, GPU-accelerated transform
- Aspect ratio classes: `mallem-gallery--square/portrait/landscape`
- Zoom: `@media (hover: hover) and (pointer: fine)` — never fires on touch devices
- Thumbnail active: `outline: 2px solid currentColor; outline-offset: 2px` (layout-stable)
- Qty stepper: 44×44px min touch targets
- Stock states: colored dot + text, `[hidden]` attribute respected
- ATC: loading spinner via CSS `.mallem-btn--loading`, disabled state opacity 0.45
- Accordion: CSS-only expand via `[open]`, chevron transition 250ms
- Sticky ATC: fixed bottom bar, `transform` animation 300ms, safe-area padding
- Mobile dots: 8px circle → 24px pill on active
- 100% logical properties throughout — zero `left`/`right`/`padding-left` etc.

#### 8. Asset — `assets/mallem-product-main.js`
- **`MallemProductGallery`** (Custom Element):
  - `goTo(index)`: rAF-batched transform + thumb/dot ARIA sync + live region announce
  - Touch: passive listeners, 50px threshold, RTL-aware delta sign
  - Keyboard: ArrowLeft/Right with RTL flip (`isRTL ? -direction : direction`)
  - Listens `mallem:variant:changed` → jumps to variant image by `data-mallem-variant-id`
  - Dispatches `mallem:gallery:slide-changed`
  - `disconnectedCallback` removes all listeners
- **`MallemStickyATC`** (Custom Element):
  - `IntersectionObserver` on `[data-mallem-atc-button]` — no scroll listener
  - `isIntersecting=false → show()`, `true → hide()` via `aria-hidden` toggle
  - `mallem:variant:changed` → `_syncVariant()` updates price, variant title, availability
  - Sticky button click → `form.requestSubmit()` (single source of truth, no duplicate cart logic)
  - `disconnectedCallback` disconnects observer + event listener
- **`MallemStockCounter`** (plain class):
  - Reads thresholds from data attributes (set by Liquid, not hardcoded in JS)
  - `mallem:variant:changed` → `update(qty, policy)` re-evaluates classes + text
  - Respects `inventory_policy = continue` → hides widget
- **`MallemProductMain`** (orchestrator):
  - Intercepts variant selector changes (native `<select>` + `mallem:swatch:selected`)
  - Reads product JSON from `#mallem-product-json` script tag
  - Dispatches `mallem:variant:changed` with full detail object
  - ATC: fetch POST `/cart/add.js`, loading state, success → `mallem:cart:updated`, error → inline message
  - `MallemProductMain.formatMoney()`: static helper wraps `Shopify.formatMoney` with fallback

#### 9. Locale — `locales/en.default.json` (merged)
- `sections.mallem_product_main.*` — all schema labels + block labels
- `mallem.product.*` — gallery_label, vendor_label, quantity_label, add_to_cart, sold_out,
  unavailable, free_shipping_over, decrease/increase_quantity, gallery_previous/next/go_to
- `mallem.product.stock.low/medium/out`
- `mallem.product.accordion.description_tab/size_guide_tab/shipping_tab`

#### 10. Locale — `locales/ar.json` (merged)
- Full Arabic equivalents of all new keys above
- Stock: "باقي {{ count }} قطعة فقط" / "مخزون محدود" / "نفد المخزون"
- Section name: "مالم - المنتج"

### Files Created
- `sections/mallem-product-main.liquid` (new)
- `snippets/mallem-product-gallery.liquid` (new)
- `snippets/mallem-product-info.liquid` (new)
- `snippets/mallem-product-stock.liquid` (new)
- `snippets/mallem-product-accordion.liquid` (new)
- `snippets/mallem-sticky-atc.liquid` (new)
- `assets/mallem-product-main.css` (new)
- `assets/mallem-product-main.js` (new)

### Files Modified
- `locales/en.default.json` (merged mallem_product_main section + mallem.product keys)
- `locales/ar.json` (merged Arabic equivalents)

### Key Architectural Decisions

1. **Custom Events as the integration bus** — `mallem:variant:changed` decouples gallery,
   sticky ATC, stock counter, and any future component (mini-cart, free-shipping bar).
   No tight coupling, no global state object.

2. **CSS `[aria-hidden]` attribute drives sticky ATC visibility** — JS only toggles the
   attribute. CSS selector `[aria-hidden="false"]` applies the transform. This pattern means
   the bar is screen-reader invisible when hidden (no double-announcement) and the animation
   is purely CSS (GPU composited, no JS animation loop).

3. **Native `<details>` accordion** — zero JS dependency. Renders correctly even with JS
   disabled or blocked. Theme editor blocks work because `{{ block.shopify_attributes }}`
   is placed on `<details>`. No polyfill needed.

4. **IntersectionObserver not scroll listener** — sticky ATC detection has zero main-thread
   cost during scroll. Fires only when the ATC button enters/leaves the viewport.

5. **Server-side initial stock state** — Liquid renders the correct stock class and text
   on page load. JS only updates on variant change. No flash/jump on first paint.

6. **`data-mallem-*` attributes as the JS contract** — Liquid and JS are decoupled.
   Renaming a CSS class never breaks JS. Renaming a JS hook never breaks styles.

7. **`rAF` for all DOM mutations** — prevents layout thrash by batching reads before writes.

### Integration Points with Days 1–12

| Day | System | How Day 13 connects |
|-----|--------|---------------------|
| Day 1 | RTL foundation | Gallery uses `window.Mallem.isRTL` + `sign` pattern; CSS uses logical properties only |
| Day 2 | Product card | `mallem-product-stock.liquid` follows same data-attribute pattern as card stock |
| Day 4 | Swatches | `mallem-product-info.liquid` renders `mallem-variant-swatches` snippet; listens `mallem:swatch:selected` |
| Day 5 | Cart drawer | ATC success dispatches `mallem:cart:updated` — cart drawer listens and refreshes |
| Day 8 | Free shipping bar | `mallem:cart:updated` also triggers free-shipping-bar recalculation |
| Day 10 | Hero slider | Same RTL pattern: `const isRTL = window.Mallem?.isRTL ?? doc.dir === 'rtl'; sign = isRTL ? 1 : -1` |
| Day 11 | COD badge | `{% render 'mallem-badge', type: 'cod' %}` reused directly in info panel |
| Day 12 | Collection filters | Product JSON pattern consistent with collection section |

---

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

## Day 7: RTL Architecture System (Updated) ✅ Complete

**Date:** 2026-02-12
**Feature:** Simplified RTL Control System with JavaScript Global
**Status:** ✅ Production Ready

### What We Built

#### 1. Simplified RTL Settings
- **File:** `config/settings_schema.json` (updated)
- **Change:** Replaced complex select dropdown with simple checkbox
- **Setting:** `mallem_enable_rtl` (boolean, default: false)
- **Purpose:** Merchant-controlled RTL activation without auto-detection complexity
- **Benefits:**
  - Clearer merchant UX (checkbox vs 3-option select)
  - Direct control without "auto-detect" ambiguity
  - Faster theme setup for MENA merchants

#### 2. Body Class System
- **File:** `layout/theme.liquid` (updated)
- **Implementation:** Conditional body class based on setting
- **Output:**
  - RTL enabled: `<body class="... mallem-rtl">`
  - RTL disabled: `<body class="... mallem-ltr">`
- **Purpose:** CSS hooks for body-level RTL styling (previously only on `<html>`)
- **Benefit:** More specific CSS targeting, better component isolation

#### 3. Global JavaScript Variable
- **File:** `layout/theme.liquid` (updated)
- **Implementation:** `window.Mallem.isRTL` boolean
- **Value:** `true` when RTL enabled, `false` when disabled
- **Purpose:** Enable JavaScript modules to detect RTL state
- **Use Cases:**
  - Slider direction control
  - Drawer animation direction
  - Dynamic content positioning
  - Analytics tracking (RTL vs LTR sessions)

#### 4. Updated RTL Wrapper
- **File:** `snippets/mallem-rtl-wrapper.liquid` (updated)
- **Logic:** Reads `settings.mallem_enable_rtl` checkbox
- **Output:**
  - Enabled: `dir="rtl" lang="ar" data-direction="mallem-rtl"`
  - Disabled: `dir="ltr" lang="{{ request.locale.iso_code }}" data-direction="mallem-ltr"`
- **Simplification:** Removed unused auto-detection from previous implementation

### Files Modified

- `config/settings_schema.json` - Replaced select with checkbox setting
- `snippets/mallem-rtl-wrapper.liquid` - Updated to use checkbox, simplified logic
- `layout/theme.liquid` - Added body class and `window.Mallem.isRTL` global

### Files Unchanged

- `assets/mallem-rtl.css` - Comprehensive RTL styles (already complete, 600+ lines)

### Key Architectural Patterns

#### 1. Simple Merchant Control
- Single checkbox instead of 3-option select
- No auto-detection confusion
- Explicit merchant choice
- Clear on/off behavior

#### 2. JavaScript-Ready Architecture
- `window.Mallem` namespace for global state
- `isRTL` boolean accessible from any script
- Enables dynamic RTL-aware behavior
- Future-proof for advanced features

#### 3. CSS + JS Dual Hooks
- CSS: `.mallem-rtl` class on `<body>`
- JS: `window.Mallem.isRTL` boolean
- Both single source of truth (settings.mallem_enable_rtl)
- Consistent state across CSS and JavaScript

#### 4. Body-Level Class (New)
- Previously: class only on `<html>` element
- Now: class on both `<html>` (via data attribute) and `<body>`
- Benefit: More specific CSS selectors, better component scoping

#### 5. Backward Compatible
- Existing `mallem-rtl.css` works unchanged
- No breaking changes to RTL styling
- All previous RTL features preserved

### Integration Points

#### Theme Settings
- Navigate to Theme Customizer > Theme Settings > "Mallem RTL & Localization"
- Toggle "Enable RTL Layout" checkbox
- Save and preview

#### JavaScript Usage
```javascript
if (window.Mallem.isRTL) {
  // RTL-specific logic
  slider.direction = 'rtl';
  drawer.position = 'left';
} else {
  // LTR-specific logic
  slider.direction = 'ltr';
  drawer.position = 'right';
}
```

#### CSS Usage
```css
.mallem-rtl .my-component {
  /* RTL-specific styles */
  padding-inline-start: 2rem;
}

.mallem-ltr .my-component {
  /* LTR-specific styles (if needed) */
}
```

### Technical Highlights

#### HTML Output When RTL Enabled
```html
<html dir="rtl" lang="ar" data-direction="mallem-rtl">
  <body class="gradient mallem-rtl">
    <script>
      window.Mallem = {
        isRTL: true,
      };
    </script>
  </body>
</html>
```

#### HTML Output When RTL Disabled
```html
<html dir="ltr" lang="en" data-direction="mallem-ltr">
  <body class="gradient mallem-ltr">
    <script>
      window.Mallem = {
        isRTL: false,
      };
    </script>
  </body>
</html>
```

#### Performance
- ✅ Zero JavaScript for RTL detection (Liquid only)
- ✅ No additional HTTP requests
- ✅ Global variable set once on page load
- ✅ CSS logical properties throughout (600+ lines)
- ✅ No runtime overhead

#### Merchant Experience
- ✅ Single checkbox control
- ✅ Clear labels and help text
- ✅ No complex configuration
- ✅ Instant preview in theme editor
- ✅ Arabic-focused messaging

#### Developer Experience
- ✅ Simple boolean check in JavaScript
- ✅ Clear body class for CSS targeting
- ✅ Single source of truth (Shopify setting)
- ✅ No complex detection logic
- ✅ Easy to debug and test

### Status: ✅ Complete

### Next Lesson:
- Build mallem-product-card snippet
- Prepare snippet-first architecture

---

## Day 8: Reusable Product Card System ✅ Complete

**Date:** 2026-02-12
**Feature:** Premium Product Card with AJAX Cart & Metafield Badges
**Status:** ✅ Production Ready

### What We Built

#### 1. Product Card Snippet
- **File:** `snippets/mallem-product-card.liquid` (362 lines)
- **Purpose:** Reusable product card for collections, search, recommendations
- **Features:**
  - Add to cart button with AJAX support
  - Responsive images with srcset (300w, 600w, 900w)
  - Secondary image hover effect (desktop-only)
  - Lazy loading with explicit dimensions (prevents CLS)
  - Badge system with priority logic
  - Quick view and wishlist button hooks
  - Vendor display (optional)
  - Three aspect ratios (square, portrait, landscape)
  - Progressive enhancement (works without JS)

#### 2. Badge System
- **Priority Order:** Sold Out > Sale > Featured > Custom
- **Metafield Support:**
  - `product.metafields.mallem.badge_text` - Custom badge text
  - `product.metafields.mallem.featured` - Featured product badge
- **Built-in Badges:**
  - Sale badge with automatic discount percentage
  - Sold out badge
  - Featured badge
  - Custom merchant badges
- **WHY priority:** User needs availability info first, then promotions

#### 3. Product Card CSS
- **File:** `assets/mallem-product-card.css` (530 lines)
- **Architecture:**
  - 100% CSS logical properties (zero left/right)
  - Mobile-first responsive (768px, 1024px breakpoints)
  - CSS custom properties for theming
  - BEM naming convention
- **Add to Cart Button:**
  - Full-width button (easier tap on mobile)
  - 44px minimum height (WCAG accessibility)
  - Loading state with animated spinner
  - Disabled state for sold-out products
  - Hover and active states
- **Performance:**
  - GPU-accelerated animations (transform, opacity)
  - Lightweight transitions (optimized for 3G)
  - Reduced motion support
  - High contrast mode support
  - Print styles (hides action buttons)

#### 4. Product Card JavaScript
- **File:** `assets/mallem-product-card.js` (305 lines)
- **Architecture:**
  - ES6 class-based (`MallemProductCard`)
  - IIFE pattern (no global pollution)
  - Event-driven communication
  - Public API: `window.MallemProductCard.init()`
- **Features:**
  - AJAX add to cart via Shopify Cart API
  - Loading states with visual feedback
  - Error handling with user alerts
  - Auto-initialization on DOM ready
  - Support for dynamic content loading
  - RTL-aware (respects `window.Mallem.isRTL`)
- **Events Dispatched:**
  - `mallem:product:added` - Successful cart addition
  - `mallem:cart:error` - Add to cart failure
- **WHY AJAX:** No page reload, better UX, instant feedback

### Files Created

- `snippets/mallem-product-card.liquid` (new - 362 lines)
- `assets/mallem-product-card.css` (updated - 530 lines)
- `assets/mallem-product-card.js` (new - 305 lines)

### Key Architectural Patterns

#### 1. Data Attribute Hooks
- `data-mallem-product-card` - Card container identifier
- `data-mallem-product-id` - Product ID for tracking
- `data-mallem-variant-id` - Variant ID for cart operations
- `data-mallem-product-form` - Form identifier for AJAX
- `data-mallem-add-to-cart` - Button identifier
- `data-loading` - Loading state (CSS targets this)
- **WHY:** Unobtrusive JavaScript, no coupling to classes

#### 2. Progressive Enhancement
- Form submits to `/cart/add` without JavaScript
- JavaScript intercepts and converts to AJAX
- Graceful degradation if JS disabled
- Core functionality works in all scenarios
- **WHY:** Accessibility, resilience, SEO

#### 3. Event-Driven Architecture
- Product card dispatches events
- Other modules listen and react
- Decoupled components
- Cart drawer can auto-open on `mallem:product:added`
- Analytics can track without modifying card code
- **WHY:** Loose coupling, easy to extend

#### 4. RTL-First Design
- All CSS uses logical properties
- `padding-inline`, `margin-block`, `inset`
- No `left`, `right`, `margin-left`, `padding-right`
- JavaScript respects `window.Mallem.isRTL`
- Direction-aware animations and positioning
- **WHY:** True RTL support, not patched after

#### 5. Mobile-First Responsive
- Base styles for mobile (smallest screens)
- Progressive enhancements at 768px (tablet)
- Desktop refinements at 1024px
- Touch-optimized tap targets (44px minimum)
- Always-visible action buttons on touch devices
- Hover effects only on `@media (hover: hover)`
- **WHY:** MENA markets are 90%+ mobile traffic

#### 6. Metafield-Driven Badges
- No hardcoded badge logic beyond basics
- Merchants control custom badges via metafields
- Namespace `mallem` keeps data organized
- Supports seasonal campaigns, regional promotions
- Featured badge for curated products
- **WHY:** Maximum merchant flexibility without code

### Integration Points

#### Snippet Usage
```liquid
{% render 'mallem-product-card',
   product: product,
   show_vendor: true,
   show_quick_view: true,
   show_wishlist: true,
   image_ratio: 'square',
   lazy_load: true
%}
```

#### Parameters
- `product` (Object, required) - Shopify product object
- `show_vendor` (Boolean) - Display vendor name
- `show_quick_view` (Boolean) - Show quick view button
- `show_wishlist` (Boolean) - Show wishlist button
- `image_ratio` (String) - 'square', 'portrait', or 'landscape'
- `lazy_load` (Boolean) - Enable lazy loading
- `show_badges` (Boolean) - Display badges
- `enable_hover_image` (Boolean) - Show second image on hover

#### Event Listeners
```javascript
// Listen for successful cart additions
document.addEventListener('mallem:product:added', (event) => {
  const { product, productId, variantId, isRTL } = event.detail;
  // Open cart drawer, show notification, etc.
});

// Listen for cart errors
document.addEventListener('mallem:cart:error', (event) => {
  const { error, productId } = event.detail;
  // Show error notification
});
```

#### Dynamic Content
```javascript
// After loading new products via AJAX
window.MallemProductCard.init();

// Or dispatch event
document.dispatchEvent(new CustomEvent('mallem:products:loaded'));
```

#### Metafield Setup
Merchants configure in Shopify admin:
1. Products > Metafields > Add definition
2. Namespace: `mallem`
3. Keys: `badge_text` (text), `featured` (boolean)
4. Set values per product

### Technical Highlights

#### AJAX Cart Flow
1. User clicks "Add to Cart" button
2. JavaScript intercepts form submit
3. Button shows loading spinner
4. POST to `/cart/add.js` with FormData
5. Shopify returns JSON with product details
6. Dispatch `mallem:product:added` event
7. Remove loading state
8. Cart drawer listens and opens (if implemented)

#### Loading State Implementation
- CSS targets `[data-loading="true"]`
- Button text becomes transparent
- Animated spinner appears via `::after` pseudo-element
- Button disabled during request
- ARIA `aria-busy="true"` for screen readers
- **WHY:** Visual feedback prevents double-clicks

#### Image Optimization
- Srcset: 300w, 600w, 900w
- Sizes: `(min-width: 990px) 25vw, (min-width: 750px) 33vw, 50vw`
- Lazy loading for offscreen images
- Explicit width/height prevents CLS
- Secondary image only on desktop (`@media (hover: hover)`)
- **WHY:** Core Web Vitals, mobile performance on 3G

#### CSS Custom Properties
```css
:root {
  --mallem-card-spacing: 1rem;
  --mallem-card-title-size: 0.875rem;
  --mallem-card-price-size: 1rem;
  --mallem-action-size: 44px;
  --mallem-card-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```
**WHY:** Easy merchant customization, consistent values

#### Badge Priority Logic
```liquid
{%- if is_sold_out -%}
  Sold Out Badge
{%- elsif on_sale -%}
  Sale Badge (-30%)
{%- elsif featured_badge -%}
  Featured Badge
{%- elsif custom_badge -%}
  Custom Badge
{%- endif -%}
```
**WHY:** Only one badge shown, clear hierarchy

### Performance Characteristics

#### Bundle Size
- HTML: ~10KB (with comments, minifies to ~6KB)
- CSS: ~15KB (minifies to ~10KB)
- JS: ~8KB (minifies to ~5KB)
- Total: ~21KB minified
- **WHY:** Lightweight for 3G networks

#### Runtime Performance
- GPU-accelerated animations (transform, opacity)
- No layout thrashing (batch DOM reads/writes)
- Event delegation (single listener per card type)
- Debounced operations where applicable
- CSS containment for paint isolation
- **WHY:** Smooth 60fps on budget Android devices

#### Network Efficiency
- Lazy loading reduces initial page weight
- Responsive images (right size for viewport)
- No external dependencies
- AJAX reduces full page reloads
- **WHY:** Critical for MENA mobile networks

### Accessibility Compliance

#### WCAG 2.1 Level AA
- ✅ 44px minimum tap targets
- ✅ Keyboard navigable (focus states)
- ✅ Screen reader labels (aria-label)
- ✅ Loading states announced (aria-busy)
- ✅ Focus visible outlines
- ✅ Color contrast ratios met
- ✅ Reduced motion support
- ✅ High contrast mode support

#### Semantic HTML
- `<h3>` for product titles
- `<form>` for add to cart
- `<button>` for actions
- `<img>` with alt text
- Proper heading hierarchy
- **WHY:** Screen readers, SEO, browser features

### Browser Compatibility

#### Modern Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

#### Features Used
- CSS logical properties (all modern browsers)
- Fetch API (all modern browsers)
- Custom Events (all modern browsers)
- CSS custom properties (all modern browsers)
- Aspect ratio (all modern browsers, fallback for old)
- **WHY:** No polyfills needed, clean code

#### Graceful Degradation
- Forms work without JavaScript
- Images load without lazy loading
- Badges display without metafields
- Buttons work without AJAX
- **WHY:** Works everywhere, enhances progressively

### Use Cases

#### Collection Pages
- Grid layouts (2-4 columns)
- Quick add to cart without page navigation
- Browse and buy flow

#### Search Results
- Consistent product presentation
- Filter and add to cart

#### Related Products
- Product page upsells
- Cart page cross-sells
- Recommendations

#### Featured Products
- Homepage hero sections
- Landing pages
- Promotional sections

### Future Enhancements

Ready for:
- Variant swatches (color/size selection on card)
- Quantity selector (choose qty before adding)
- Compare checkbox (product comparison tool)
- Stock level indicator (low stock badges)
- Wishlist integration (save for later)
- Product reviews stars
- Video badges (play icon for video products)

**WHY documented:** Clear roadmap for feature additions

---

## Day 9: Free Shipping Progress Bar ✅ Complete

**Date:** 2026-03-24
**Feature:** Free Shipping Progress Bar (Cart Drawer)
**Status:** ✅ Production Ready

### What We Built

#### 1. Free Shipping Bar Snippet
- **File:** `snippets/mallem-free-shipping-bar.liquid`
- **Purpose:** Reusable progress bar showing how close the customer is to unlocking free shipping
- **Features:**
  - Three states computed entirely in Liquid on first render: `progress` (0–79%), `almost` (≥80%), `achieved` (100%)
  - Server-side initial state means zero JavaScript flash on cart drawer open
  - Remaining amount formatted as money via `| money` filter and injected into the translated message
  - Translation string templates baked into `data-str-*` HTML attributes with `__AMOUNT__` placeholder — JS requires no runtime i18n lookup
  - `data-threshold` attribute carries threshold in cents for JS calculations
  - `aria-live="polite"` + `aria-atomic="true"` announces changes to screen readers
  - `role="progressbar"` with `aria-valuenow` / `aria-valuemin` / `aria-valuemax` for full ARIA compliance
  - Two SVG icons declared in markup (truck, check-circle); CSS shows the correct one per state — no icon swapping in JS
  - Guard: renders nothing if `threshold_cents` is 0 or the feature is disabled

#### 2. Free Shipping Bar CSS
- **File:** `assets/mallem-free-shipping-bar.css`
- **Architecture:**
  - 100% CSS logical properties — zero `left`, `right`, `margin-left`, `padding-right`
  - Fill width driven by `--shipping-percent` CSS custom property to prevent layout thrashing on updates
  - `will-change: inline-size` isolates the animated fill layer for GPU compositing
  - `contain: layout style` on wrapper for paint isolation
- **Three State Colors:**
  - `progress` — neutral dark (#1a1a1a), informs without pressure
  - `almost` — warm amber (#f09000 fill, #fffbf2 bg), builds urgency at ≥80%
  - `achieved` — success green (#28a864 fill, #f0faf5 bg), rewards the customer
- **Animations:**
  - Fill: `0.55s cubic-bezier(0.4, 0, 0.2, 1)` on `inline-size` for smooth progress
  - Icon pop on achieved state: scale 1 → 1.25 → 0.92 → 1 (0.45s)
  - `@media (prefers-reduced-motion: reduce)` disables all transitions and animations
- **RTL:**
  - `inset-inline-start: 0` on fill — grows from right in RTL, left in LTR automatically
  - `padding-inline`, `block-size`, `border-block-end` throughout
  - No directional overrides needed anywhere

#### 3. Free Shipping Bar JavaScript
- **File:** `assets/mallem-free-shipping-bar.js`
- **Architecture:**
  - `MallemShippingBar` class per `[data-shipping-bar]` element — supports multiple bars on the same page
  - IIFE wrapper (`initShippingBars`) — no global pollution
  - Single `document` event listener per instance — no direct coupling to cart drawer
- **Features:**
  - Listens for `mallem:cart:updated` event dispatched by `MallemCartDrawer.renderCart()`
  - `_update(cartTotalCents)` recomputes percent and remaining in one pass
  - `_setState()` replaces only the state modifier class with a regex, preserving the base class
  - `_setFill()` updates `--shipping-percent` via `style.setProperty()` and syncs `aria-valuenow`
  - `_setText()` replaces `__AMOUNT__` placeholder in pre-translated template string
  - `_formatMoney()` delegates to `window.Shopify.formatMoney` with store currency format; falls back to `$X.XX`
  - Guards against zero or missing threshold
- **Progressive Enhancement:**
  - Liquid renders the correct initial state — bar is meaningful before JS executes
  - If JS is disabled entirely, bar remains in its server-rendered state (correct data, no updates)

### Files Created

- `snippets/mallem-free-shipping-bar.liquid` (new)
- `assets/mallem-free-shipping-bar.css` (new)
- `assets/mallem-free-shipping-bar.js` (new)

### Files Modified

- `assets/mallem-cart-drawer.js` — Added `mallem:cart:updated` CustomEvent dispatch at end of `renderCart()` with `{ total_price, item_count }` in detail; covers all mutation paths (add, qty change, remove)
- `snippets/mallem-cart-drawer.liquid` — Renders `mallem-free-shipping-bar` between `__header` and `__body`; bar sits outside the scroll container so it stays visible while items scroll
- `config/settings_schema.json` — Added "Mallem Free Shipping Bar" group: enable checkbox (default `true`) + threshold range (10–2000, step 10, default 50)
- `locales/en.default.json` — Added `mallem.free_shipping_bar.{progress, almost, achieved, progress_label}`
- `locales/ar.json` — Added full Arabic translations for all four keys
- `layout/theme.liquid` — Conditional CSS + JS loading guarded by `settings.mallem_free_shipping_enabled`; zero overhead when feature is off

### Key Architectural Patterns

#### 1. Server-Side Initial Render (No Flash)
- Liquid computes `bar_state`, `percent`, and `remaining_money` on every page render
- Cart drawer opens with the bar already in the correct visual state
- No skeleton, no placeholder, no flicker — the first paint is correct
- **WHY:** Flash of wrong state damages trust; Liquid is free (server-rendered)

#### 2. CSS Custom Property for Fill Animation
- JS calls `style.setProperty('--shipping-percent', '72%')` — one DOM write
- CSS transition does the rest: `inline-size: var(--shipping-percent)` animates smoothly
- No `requestAnimationFrame` loops, no `width` style juggling
- **WHY:** Avoids layout thrashing; browser batches the repaint efficiently

#### 3. Pre-Translated Data Attributes
- Liquid writes `data-str-progress="Add __AMOUNT__ more for free shipping"` via `t: amount: '__AMOUNT__'`
- JS replaces `__AMOUNT__` with `_formatMoney(remainingCents)` at runtime
- No `window.mallemi18n` global, no XHR for translations, no JSON parsing
- **WHY:** Zero JS i18n overhead; translations are always in sync with Liquid

#### 4. Decoupled Event Contract
- Cart drawer dispatches `mallem:cart:updated`; shipping bar listens
- Neither component imports or references the other
- Any future component can also listen to the same event (analytics, upsell bar, etc.)
- **WHY:** Loose coupling; adding a second listener costs zero refactoring

#### 5. Progressive Enhancement
- Bar renders with correct data in HTML — no JS required for initial state
- JS layer adds real-time updates as the customer changes cart quantities
- Removing the JS file entirely leaves a functional (static) bar
- **WHY:** Resilience; Shopify CDN issues or slow connections don't break the UX

#### 6. Conditional Asset Loading
- `layout/theme.liquid` wraps CSS/JS includes in `{%- if settings.mallem_free_shipping_enabled -%}`
- Merchants who disable the feature pay zero bytes in payload
- **WHY:** Every KB matters on 3G; unused features should not tax load time

### Integration Points

#### Merchant Settings
- Theme Customizer > Theme Settings > **Mallem Free Shipping Bar**
- Toggle: "Enable free shipping bar" (checkbox, default on)
- Threshold: range slider 10–2000 in store currency (e.g. 50 for $50, 500 for 500 MAD)

#### Event Contract
```javascript
// Dispatched by mallem-cart-drawer.js after every renderCart() call
document.dispatchEvent(new CustomEvent('mallem:cart:updated', {
  detail: { total_price: 4500, item_count: 2 } // cents
}));

// Consumed by mallem-free-shipping-bar.js
document.addEventListener('mallem:cart:updated', (e) => {
  bar._update(e.detail.total_price);
});
```

#### Snippet Placement
```liquid
{%- comment -%} In snippets/mallem-cart-drawer.liquid {%- endcomment -%}
<div class="mallem-cart-drawer__header">...</div>

{%- render 'mallem-free-shipping-bar' -%}

<div class="mallem-cart-drawer__body" data-cart-body>...</div>
```

#### Translation Keys
- `mallem.free_shipping_bar.progress` — "Add {{ amount }} more for free shipping"
- `mallem.free_shipping_bar.almost` — "Only {{ amount }} away from free shipping!"
- `mallem.free_shipping_bar.achieved` — "You've unlocked free shipping!"
- `mallem.free_shipping_bar.progress_label` — ARIA label: "Free shipping progress: {{ percent }}%"

### Technical Highlights

#### Threshold Currency Handling
- Merchant sets threshold in major units (50 = $50, 500 = 500 MAD)
- Liquid computes `threshold_cents = threshold | times: 100`
- Shopify's `cart.total_price` is always in smallest unit (cents/fils)
- Works correctly for all MENA currencies (MAD, EGP, SAR, AED — all 2 decimal places)

#### State Transitions
| Cart Total | Percent | State | Bar Color |
|---|---|---|---|
| 0–79% of threshold | 0–79 | `progress` | Neutral dark |
| 80–99% of threshold | 80–99 | `almost` | Amber |
| ≥ threshold | 100 | `achieved` | Green |

#### ARIA Progressbar
```html
<div
  role="progressbar"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow="72"
  aria-label="Free shipping progress: 72%"
  data-shipping-track
>
```
- Screen readers announce "Free shipping progress: 72%"
- `aria-live="polite"` on wrapper announces state changes without interrupting

#### RTL Fill Direction
- `inset-inline-start: 0` pins the fill to the inline-start edge
- In LTR: fill grows left → right
- In RTL: fill grows right → left
- No directional JS or CSS overrides required — logical properties handle it natively

#### Performance Profile
- HTML addition: ~70 lines Liquid (minifies to ~1.5KB)
- CSS: ~120 lines (minifies to ~2.5KB)
- JS: ~130 lines (minifies to ~2KB)
- Total new payload: ~6KB — negligible on any connection
- Conditional load: 0 bytes when disabled

### Accessibility Compliance

- ✅ `role="progressbar"` with full ARIA value attributes
- ✅ `aria-live="polite"` — state changes announced non-intrusively
- ✅ `aria-atomic="true"` — full message re-read on update
- ✅ Icon SVGs have `focusable="false"` and are `aria-hidden` via parent
- ✅ `prefers-reduced-motion` disables all animations
- ✅ Color is never the sole state indicator (text message changes too)
- ✅ Sufficient contrast in all three states

### Use Cases

- **AOV uplift:** Bar motivates customers to add one more item to unlock free shipping
- **MENA dropshipping:** Pairs with COD badge — two trust signals in the same cart drawer
- **Mobile-first:** Compact 4px bar + 13px message — no vertical space wasted on small screens
- **Multi-currency:** Delegates to `Shopify.formatMoney` — correct symbol for every market

---

## Next: Variant Swatches + Collection Page

**Priority:** High — Direct conversion impact on product browsing and discovery
**Depends On:** Product Card System ✅, Cart Drawer ✅

### Next Steps

- **Variant Swatches (color/size on product card):** Inline color and size swatches on `mallem-product-card` that update the variant ID and card image without a page reload. Supports circular color swatches, text/label swatches, and sold-out cross-out state.
- **Collection Page with AJAX Filters:** Dedicated collection section with URL-synced filter sidebar (by tag, price, availability), AJAX product grid refresh, active filter pills, mobile drawer for filters, and infinite scroll or load-more pagination.

---

## Day 10: Variant Swatches System ✅ Complete

**Date:** 2026-03-25
**Feature:** Variant Swatch System (Color Circles + Label Pills on Product Cards)
**Status:** ✅ Production Ready

### What Was Built

#### 1. Variant Swatches Snippet
- **File:** `snippets/mallem-swatches.liquid` (231 lines — full rewrite of stub)
- **Purpose:** Render clickable color circles or label pills for any product option, directly on product cards
- **Features:**
  - Auto-detects color vs label mode from option name — supports English (`color`, `colour`), Arabic (`لون`), French (`couleur`), German (`farbe`) — zero merchant configuration needed
  - Color resolution hierarchy (all server-side, no JS parsing cost):
    1. Exact key match in `product.metafields.mallem.swatch_colors.value` (e.g., `"Navy"`)
    2. Lowercase fallback match (e.g., `"navy"`) — forgives merchant capitalization
    3. CSS named-color fallback — works for standard English color names (`"black"`, `"red"`, etc.)
  - Variant image resolution: prefers `variant.featured_image` (the shot for that specific color); falls back to `product.featured_media` so there is always a URL to pass to JS
  - All swatches rendered in DOM — overflow ones carry `.mallem-swatch--hidden` (CSS `display:none`) rather than being excluded from markup, keeping all variant data accessible to JS without AJAX
  - Overflow indicator: `+ N more` (translation key `mallem.swatches.more`) appears when `total_values > show_count`
  - Per-swatch srcset pre-built in Liquid at 300w / 600w / 900w and stored in `data-image-srcset`
  - All variant data (image URL, srcset, variant ID, availability) embedded in `data-*` attributes — zero runtime fetches
  - Sold-out swatches: `aria-disabled="true"` (not `disabled`) so keyboard users can discover the option exists
  - ARIA: `role="group"` on wrapper, `aria-label="Select {{ option }}"` on wrapper, `aria-pressed` per swatch, composite `aria-label="Select Black (sold out)"` for sold-out swatches

- **Parameters:**

| Parameter | Type | Default | Purpose |
|---|---|---|---|
| `product` | Object | required | Shopify product object |
| `option_name` | String | first option | Which option to render |
| `swatch_type` | String | `"auto"` | `"color"` / `"label"` / `"auto"` |
| `show_count` | Number | `5` | Swatches visible before overflow |
| `enable_hover_image` | Boolean | `true` | Pass-through flag for JS hover preview |

- **Metafield required for custom colors:**
  - Namespace: `mallem` | Key: `swatch_colors` | Type: JSON
  - Format: `{"Black": "#1a1a1a", "Red": "#c8102e", "Navy": "#001f5b"}`

#### 2. Variant Swatches CSS
- **File:** `assets/mallem-swatches.css` (254 lines — existing file, added hidden rule)
- **Architecture:**
  - 100% CSS logical properties — zero `left`, `right`, `margin-left`, `padding-right`
  - `flex-wrap` on wrapper: RTL wrap direction is automatic via `html[dir]`; no directional overrides needed
  - 44px touch targets via `min-inline-size: 44px` / `min-block-size: 44px` on every swatch button — visual is smaller, rendered via `::before`; layout is not inflated
  - `--swatch-color` CSS custom property: set as inline style from Liquid; browser ignores invalid CSS color names (brand names, Arabic) transparently
- **Color swatch (`mallem-swatch--color`):**
  - 28px visual circle via `::before` pseudo — decoupled from the 44px button bounding box
  - Selected state: `box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px rgba(0 0 0 / 0.85)` ring on `::before` — targets the visual circle, not the button box
  - Hover: `scale(1.1)` on `::before` only, preserving layout
- **Label swatch (`mallem-swatch--label`):**
  - Pill border on the inner `<span>` (`mallem-swatch__label`) — visual pill is separate from 44px tap target
  - Active: `border-width: 2px; font-weight: 700`
- **Sold-out (`mallem-swatch--sold-out`):**
  - `opacity: 0.45` — visible but clearly muted
  - `::after` diagonal slash via CSS gradient: `linear-gradient(135deg, transparent ... rgba(0,0,0,0.55) ...)` — works on any aspect ratio without JS dimension knowledge
  - Color swatches: `border-radius: 50%` clips diagonal to circle; label swatches: `border-radius: 0` + `inline-size/block-size: 100%` spans the pill
- **Hidden overflow rule (new):**
  - `.mallem-swatch--hidden { display: none }` — fully collapses space in flex row; `visibility:hidden` was explicitly rejected because it preserves space
  - WHY `display:none` not DOM removal: JS reads all variant data attributes from hidden swatches — removing from DOM would require AJAX to recover the data
- **Animations:**
  - `transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s` on `::before`
  - `@media (prefers-reduced-motion: reduce)` disables all transitions

#### 3. Variant Swatches JavaScript
- **File:** `assets/mallem-swatches.js` (new, 185 lines)
- **Architecture:**
  - IIFE wrapper — no global pollution beyond the deliberate `window.MallemSwatches` public API
  - `MallemSwatches` ES6 class — one instance per `[data-mallem-swatches-wrapper]` element, stored on the element as `._mallemSwatchesInst` to prevent double-init
  - Event delegation on wrapper: single `click` listener handles all swatch buttons regardless of how many exist
- **On swatch click (available variant):**
  1. `_setActive(swatch)` — removes `mallem-swatch--active` + `aria-pressed="false"` from all siblings, sets both on clicked swatch, updates `this.activeSwatch`
  2. `_syncImage(swatch)` — updates `[data-mallem-card-image]` `.src` AND `.srcset` together; updating only `src` leaves stale srcset causing wrong image on high-DPI
  3. `_syncVariantInput(swatch)` — writes `swatch.dataset.variantId` to `input[data-mallem-variant-id]` (the writable form field); scoped to parent card via `closest('[data-mallem-product-card]')`
  4. `_syncAddToCart(swatch)` — sets `button.disabled` and `aria-disabled` based on `data-available`; product-level availability can be `true` while a specific variant is sold out
  5. `_dispatchChanged(swatch)` — fires `mallem:swatch:changed` (`bubbles: true, composed: true`) with `{ variantId, productId, value, available }` for cart drawer, analytics, sticky ATC
- **Hover preview (desktop only):**
  - Bound only when `window.matchMedia('(hover: hover) and (pointer: fine)').matches` — touch devices fire `mouseover` on tap, causing double-updates; `pointer:fine` reliably identifies mouse/trackpad
  - `mouseover` on swatch: updates card image if `data-image-url` is present
  - `mouseleave` on wrapper: reverts card image to `this.activeSwatch`'s image — hover is preview, click is commit
- **Sold-out click:** silently ignored; swatch stays focusable per `aria-disabled` pattern; event is not swallowed so keyboard navigation is unaffected
- **Initialization:**
  - `DOMContentLoaded` or immediate call if DOM already parsed (handles `defer` scripts executing late)
  - `document.addEventListener('mallem:products:loaded', ...)` — re-inits after AJAX collection grids, infinite scroll, or recommendation carousels inject new cards
  - Accepts optional `scope` argument to query only within a specific container — avoids redundant full-document scans on partial updates
- **Public API:** `window.MallemSwatches.init([scope])` — callable by section JS or third-party apps after dynamic content loads

#### 4. Product Card Integration
- **File:** `snippets/mallem-product-card.liquid` (updated)
- **Changes:**
  - Added `show_swatches` parameter (Boolean, default `true`) — cards in tight layouts (mini-cart, sidebar, upsell drawer) can opt out with `show_swatches: false`
  - Added `swatch_option` parameter (String, default `''`) — allows callers to specify which option to swatch (e.g., `swatch_option: 'Color'`); passes through to the snippet which defaults to first option
  - Added `data-mallem-card-image` attribute to primary `<img>` element — JS swatch hook for image swap
  - Added `data-mallem-variant-id` attribute to the hidden `<input name="id">` — JS writes the selected variant ID here before form submission; explicitly uses `input[data-mallem-variant-id]` selector in JS to avoid collision with the card wrapper div which carries the same attribute for read-only consumption by other modules
  - Renders `{% render 'mallem-swatches' %}` after `<h3>` title, before price — swatch selection can update the displayed price when variant prices differ, so the visual order title → swatches → price follows the decision flow

#### 5. Translation Keys
- **Files:** `locales/en.default.json`, `locales/ar.json`
- **Keys added** under `mallem.swatches`:

| Key | English | Arabic |
|---|---|---|
| `more` | `{{ count }} more` | `{{ count }} أكثر` |
| `sold_out_suffix` | `(sold out)` | `(نفد)` |
| `select_option` | `Select {{ option }}` | `اختر {{ option }}` |

### Files Added

- `assets/mallem-swatches.js` (new — 185 lines)

### Files Modified

- `snippets/mallem-swatches.liquid` (full rewrite — stub replaced with production implementation)
- `assets/mallem-swatches.css` (added `.mallem-swatch--hidden` rule with rationale comments)
- `snippets/mallem-product-card.liquid` (4 targeted changes: 2 new params, `data-mallem-card-image` on `<img>`, `data-mallem-variant-id` on `<input>`, swatch render call)
- `locales/en.default.json` (added `mallem.swatches.*` keys)
- `locales/ar.json` (added `mallem.swatches.*` keys in Arabic)

### Key Architectural Patterns

#### 1. Server-Side Color Resolution (No JS Parsing Cost)
- Color lookup runs entirely in Liquid at render time: metafield JSON bracket notation → lowercase fallback → CSS named-color fallback
- Resolved color written as `style="--swatch-color: #1a1a1a"` inline on the button
- JS has zero color-parsing responsibility — it only reads already-correct CSS variables
- **WHY:** Avoids client-side JSON.parse on every page load; CSS named-color fallback works for standard English names transparently

#### 2. All Swatches Rendered in DOM (Hidden by CSS)
- Overflow swatches beyond `show_count` receive `.mallem-swatch--hidden` (`display: none`) rather than being excluded from the Liquid `for` loop
- JS reads `data-variant-id`, `data-image-url`, `data-image-srcset`, `data-available` from hidden swatches without any AJAX
- Omitting them from DOM would require a `/products/{handle}.js` fetch to recover variant data — harmful to performance and complexity
- **WHY:** DOM is the cheapest data store; variant data is already on the page

#### 3. Class-Per-Wrapper Isolation
- One `MallemSwatches` instance per `[data-mallem-swatches-wrapper]` element
- State (active swatch, card image reference, variant input reference) is instance-local — no cross-card state bleed
- Instance stored on element via `._mallemSwatchesInst` — prevents double-init on repeated `MallemSwatches.init()` calls (AJAX grids, section reload)
- **WHY:** Multiple cards on the same page are independent; shared state would cause one swatch click to update the wrong card's image

#### 4. Event Delegation (One Listener per Card)
- Single `click` listener on wrapper handles all swatch buttons regardless of count
- `event.target.closest('[data-mallem-swatch]')` correctly handles clicks on child elements (the `<span>` inside the button)
- Works for any number of swatches including those added dynamically
- **WHY:** More efficient than per-button listeners; survives DOM mutation

#### 5. Pointer:Fine Guard for Hover Preview
- Hover binding only attaches when `window.matchMedia('(hover: hover) and (pointer: fine)').matches`
- Touch devices fire `mouseover` events on first tap — without the guard, swatch hover would double-fire on mobile: once for hover, once for click
- Evaluated once at bind time (cheaper than per-event checks)
- **WHY:** Critical for MENA markets where 90%+ traffic is mobile; hover-preview is a desktop-only enhancement

#### 6. Dual src + srcset Sync
- `_syncImage()` always updates both `.src` and `.srcset` together
- Updating only `.src` leaves the old `srcset` in place — on high-DPI displays or wide viewports the browser picks from `srcset` and serves the previous variant's image
- **WHY:** Responsive images require both attributes to be consistent; updating one without the other is a subtle bug that only manifests on retina/desktop

#### 7. input[data-mallem-variant-id] Scoped Selector
- The card wrapper `<div>` carries `data-mallem-variant-id="{{ first_variant.id }}"` for read-only use by other modules (analytics, cart drawer, sticky ATC)
- The hidden `<input name="id">` also carries `data-mallem-variant-id` for the writable form field
- JS selects `this.card.querySelector('input[data-mallem-variant-id]')` — the `input` type selector prevents it from finding the wrapper div
- **WHY:** Two elements with the same attribute serves two purposes; the scoped selector eliminates ambiguity without needing a third custom attribute

#### 8. Progressive Enhancement — Card Works Fully Without Swatches JS
- If JS is disabled or fails: swatches render as static visual elements via CSS
- The card's primary `<a>` link, product image, title, price, and ATC form all function normally
- Swatches.js only adds interactivity on top of a complete, working component
- **WHY:** Resilience; Shopify CDN delays, ad-blockers, and slow 3G should not break purchasing

#### 9. mallem:products:loaded Reinitialization
- `document.addEventListener('mallem:products:loaded', ...)` mirrors the existing pattern in `mallem-product-card.js`
- Both modules reinitialize from the same event, scoped to `event.detail.container` when available
- Covers: AJAX collection filters, infinite scroll, product recommendation carousels, quick view content injection
- **WHY:** Consistent event contract across all mallem JS modules; adding a new dynamic content source only requires dispatching one event

### Integration Points

#### Snippet Usage (Default — Auto-Detects First Option)
```liquid
{% render 'mallem-swatches', product: product %}
```

#### Snippet Usage (Explicit Option + Count)
```liquid
{% render 'mallem-swatches',
  product: product,
  option_name: 'Color',
  swatch_type: 'color',
  show_count: 4,
  enable_hover_image: true
%}
```

#### Product Card Usage (New Parameters)
```liquid
{% render 'mallem-product-card',
  product: product,
  show_swatches: true,
  swatch_option: 'Color'
%}
```

#### Opt-Out in Tight Layouts
```liquid
{%- comment -%} Sidebar upsell — no room for swatches {%- endcomment -%}
{% render 'mallem-product-card',
  product: product,
  show_swatches: false
%}
```

#### Metafield Setup (Merchant)
1. Shopify Admin → Settings → Custom data → Products
2. Add definition: Namespace `mallem`, Key `swatch_colors`, Type `JSON`
3. Per product: `{"Black": "#1a1a1a", "Red": "#c8102e", "Camel": "#c19a6b"}`

#### Event Listeners
```javascript
// Cart drawer, analytics, sticky ATC can listen here
document.addEventListener('mallem:swatch:changed', (event) => {
  const { variantId, productId, value, available } = event.detail;
  // Update sticky ATC variant, push to analytics layer, etc.
});
```

#### Manual Reinitialization After AJAX
```javascript
// After injecting new product card HTML
window.MallemSwatches.init(containerElement);

// Or via shared event contract
document.dispatchEvent(new CustomEvent('mallem:products:loaded', {
  detail: { container: containerElement }
}));
```

#### Data Attribute Contract

| Element | Attribute | Value | Set By |
|---|---|---|---|
| Wrapper `<div>` | `data-mallem-swatches-wrapper` | present | Liquid |
| Wrapper `<div>` | `data-mallem-product-id` | product ID | Liquid |
| Wrapper `<div>` | `data-mallem-option-index` | 0 / 1 / 2 | Liquid |
| Wrapper `<div>` | `data-mallem-swatch-type` | `color` / `label` | Liquid |
| Wrapper `<div>` | `data-mallem-enable-hover` | `true` / `false` | Liquid |
| Swatch `<button>` | `data-mallem-swatch` | present | Liquid |
| Swatch `<button>` | `data-variant-id` | variant ID | Liquid |
| Swatch `<button>` | `data-value` | option value | Liquid |
| Swatch `<button>` | `data-available` | `true` / `false` | Liquid |
| Swatch `<button>` | `data-image-url` | 600w image URL | Liquid |
| Swatch `<button>` | `data-image-srcset` | 300w/600w/900w | Liquid |
| Card `<img>` | `data-mallem-card-image` | present | Liquid |
| Hidden `<input>` | `data-mallem-variant-id` | variant ID | Liquid → JS |

### Technical Highlights

#### Color Swatch Visual Technique
- Visual circle rendered via `::before` pseudo-element on the 44px button
- `::before` dimensions: `inline-size: 28px; block-size: 28px; border-radius: 50%`
- Button carries `min-inline-size: 44px; min-block-size: 44px` for touch compliance (WCAG 2.5.5)
- Selected ring uses `box-shadow` on `::before` — `outline` on the button would ring the 44px bounding box, not the 28px circle
- Ring: `box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px rgba(0 0 0 / 0.85)` — 2px white gap + 2px dark ring

#### Sold-Out Diagonal Slash (CSS Only)
```css
.mallem-swatch--sold-out::after {
  background: linear-gradient(
    135deg,
    transparent                 calc(50% - 0.75px),
    rgba(0 0 0 / 0.55)          calc(50% - 0.75px) calc(50% + 0.75px),
    transparent                 calc(50% + 0.75px)
  );
}
```
- Works on any aspect ratio without JS measuring the element dimensions
- `border-radius: 50%` clips to circle on color swatches; `border-radius: 0` spans label pill
- Renders correctly in both LTR and RTL without any logical-property adjustments

#### Auto-Detection Logic
```liquid
assign _opt_lower = option_to_render.name | downcase
if _opt_lower contains 'color' or _opt_lower contains 'colour'
   or _opt_lower contains 'لون' or _opt_lower contains 'couleur'
   or _opt_lower contains 'farbe'
  assign resolved_type = 'color'
else
  assign resolved_type = 'label'
endif
```

#### Overflow Handling
```liquid
assign is_hidden = false
if overflow_count > 0 and forloop.index > show_count
  assign is_hidden = true
endif
```
- Swatch gets `mallem-swatch--hidden` class → `display: none` via CSS
- Still in DOM for JS data access
- `+ {{ 'mallem.swatches.more' | t: count: overflow_count }}` indicator is `aria-hidden="true"` — decorative only; screen readers traverse all swatch buttons directly

#### Variant Lookup
```liquid
for variant in product.variants
  if variant.options[option_index] == value
    assign matched_variant = variant
    break
  endif
endfor
```
- `variant.options[]` is zero-indexed and maps directly to `option_index` (0, 1, or 2)
- `break` at first match: one variant per swatch value is sufficient for image + availability
- Nil guard: `if matched_variant != nil and matched_variant.available` — prevents Liquid exceptions on incomplete product data from recommendation proxies

### Performance Profile

| Asset | Size (unminified) | Size (minified ~est.) |
|---|---|---|
| `mallem-swatches.liquid` | ~9KB | N/A (server-rendered) |
| `mallem-swatches.css` | ~7KB | ~3.5KB |
| `mallem-swatches.js` | ~6KB | ~3KB |
| **Total new payload** | | **~6.5KB** |

- All variant image URLs pre-computed at render time — zero AJAX on swatch interactions
- No JSON.parse on the client path for color resolution
- Hover preview uses already-cached browser images (same CDN URLs, browser cache hit)
- Conditional hover binding: mobile devices skip `mouseover`/`mouseleave` listener attachment entirely

### Accessibility Compliance

- ✅ `role="group"` + `aria-label="Select Color"` on wrapper (ARIA grouped controls pattern)
- ✅ `aria-pressed="true/false"` on each swatch (toggle button pattern)
- ✅ `aria-label="Select Black (sold out)"` — composite label; one focus action gives full information
- ✅ `aria-disabled="true"` on sold-out swatches (not `disabled`) — keyboard-discoverable
- ✅ Sold-out swatches remain focusable — users learn the option exists and restocking is possible
- ✅ 44px minimum touch targets (WCAG 2.5.5)
- ✅ Focus-visible outlines on all swatch buttons (`outline: 2px solid currentColor; outline-offset: -6px`)
- ✅ `aria-hidden="true"` on `+N more` indicator — decorative only
- ✅ `prefers-reduced-motion` disables all CSS transitions

### RTL Compliance

- ✅ `flex-wrap` on wrapper — swatch row wraps from right in RTL without any directional override
- ✅ `padding-inline`, `margin-inline`, `gap` throughout — all spacing is logical
- ✅ `inset-block-start` / `inset-inline-start` for `::after` sold-out overlay positioning
- ✅ No directional JS — `window.Mallem.isRTL` is available but unused (CSS handles all direction logic)
- ✅ `data-mallem-enable-hover` string attribute read via `!== 'false'` — no directional comparison

### Use Cases

- **Apparel/Fashion:** Color dot swatches for clothing collections — one click previews the correct color image on the card, updates ATC to the correct variant
- **Footwear:** Size label swatches — sold-out sizes shown as strikethrough, available sizes book immediately
- **MENA dropshipping:** Auto-detection covers Arabic option name `لون` with zero merchant configuration
- **Multi-option products:** `swatch_option` parameter lets callers choose which option to surface (Color, Size, or Material) per context
- **Tight layouts:** `show_swatches: false` on mini-cart or upsell drawers where card width is constrained
- **Custom color branding:** Metafield `swatch_colors` JSON maps brand names ("Midnight Coral", "كحلي") to hex values that CSS cannot resolve on its own

### Future Enhancements (Ready For)

- **Swatch expand:** JS can toggle `.mallem-swatch--hidden` on click of `+N more` to reveal all without page navigation
- **Cross-option dependency:** Listen to `mallem:swatch:changed` to grey out size swatches that are unavailable for the selected color
- **Product page swatches:** Same snippet is reusable on full product pages — just pass `show_count: 99` to show all
- **Wishlist integration:** `mallem:swatch:changed` event detail includes `variantId` — wishlist module can save the exact variant without additional variant resolution

---

## Day 11: Collection Page with AJAX Filters ✅ Complete

**Date:** 2026-03-25
**Feature:** Full Collection Page — AJAX Filtering, Sorting, Load More, Mobile Drawer
**Status:** ✅ Production Ready

### What Was Built

#### 1. Collection Page Section
- **File:** `sections/mallem-collection.liquid`
- **Purpose:** Schema-driven collection page replacing Dawn's `main-collection-product-grid.liquid`
- **Features:**
  - `paginate` tag — server-side pagination; configurable 8–48 products per page (step 4)
  - Product grid renders `mallem-product-card` snippet with all parameters forwarded from schema settings
  - Sort `<select>` — pre-populated from `collection.sort_options`, current value pre-selected
  - Mobile filter toggle button — shows active filter count badge when filters are applied
  - Load More button — appends next page to grid without wiping existing cards
  - "Showing X of Y" product count indicator
  - Empty state with "Clear filters" link
  - CSS + JS loaded as section-scoped assets (not globally injected into theme)
  - Section schema: 13 merchant-configurable settings across 4 groups (Products, Filters & Sorting, Product Card, Swatches)

#### 2. Desktop Filter Sidebar
- **File:** `snippets/mallem-filter-sidebar.liquid`
- **Purpose:** Sticky 280px sidebar rendering all Shopify native collection filters (visible ≥ 990px)
- **Features:**
  - Collapsible filter groups via native `<details>/<summary>` — zero JS for open/close
  - **List filters:** Checkboxes pre-checked from URL params; zero-count non-active values auto-disabled
  - **Price range filters:** Dual number inputs with currency symbol; `money_without_currency` value formatting; comma-locale safe (`replace: ',', ''`)
  - **Boolean filters:** Single checkbox (e.g. "In stock only")
  - "Clear all" link — `visibility: hidden` when no active filters (preserves layout, prevents header jump)
  - All inputs carry `data-mallem-filter-input` for JS collection
  - Progressive enhancement: pure HTML form POST works without JS

#### 3. Active Filter Pills
- **File:** `snippets/mallem-active-filters.liquid`
- **Purpose:** Dismissible row of pills showing currently applied filters
- **Features:**
  - One pill per active list/boolean filter value
  - Price range renders as a single pill (`From X – To Y`, `From X`, or `To Y` depending on what is set)
  - Each pill links to Shopify's `url_to_remove` — removes exactly that filter without wiping others
  - "Clear all" link visible only when 2+ active filters (single filter: remove pill is sufficient)
  - `aria-live="polite"` on wrapper — screen readers announce changes after AJAX update
  - Entire element omitted from render when no active filters (no empty DOM node)

#### 4. Mobile Filter Drawer
- **File:** `snippets/mallem-filter-drawer.liquid`
- **Purpose:** Full-featured filter and sort panel for mobile/tablet (hidden ≥ 990px)
- **Features:**
  - Slides from **block-end (bottom)** on mobile (< 750px) — native app-like sheet UX
  - Slides from **inline-start** on tablet (750px–989px) — side panel
  - Identical filter groups as sidebar (separate `<form>`, same input names — both collected by JS)
  - Sort radios inside drawer (sort `<select>` hidden on mobile; drawer sort syncs with desktop select via JS)
  - Focus trap managed by `mallem-filters.js` — Tab cycles inside drawer while open
  - `hidden` attribute on root — `requestAnimationFrame` removes it before CSS transition fires (avoids hidden-then-transition conflict)
  - Overlay div behind panel — click closes drawer
  - Footer: "Clear all" link + "Apply" button (both dismiss drawer)
  - `role="dialog"` + `aria-modal="true"` + `aria-label` for full ARIA compliance

#### 5. AJAX Filters JavaScript Module
- **File:** `assets/mallem-filters.js`
- **Purpose:** Intercepts all filter/sort interactions, fetches updated content via Shopify Sections API, updates DOM
- **Architecture:**
  - IIFE pattern — zero global pollution
  - One `MallemFilters` instance per `[data-mallem-collection]` wrapper
  - `window.MallemFilters = { init, version: '1.0.0' }` public API
- **AJAX Strategy (Shopify Sections API):**
  - Fetches `url?sections=sectionId` — response is JSON `{ "sectionId": "<html>" }`
  - Only the section HTML is transferred (not full page parse)
  - `DOMParser` extracts individual sub-regions from the response HTML
- **AbortController:**
  - Every fetch stores its controller: `this._controller = new AbortController()`
  - On new filter change: `this._controller.abort()` cancels the in-flight request before starting a new one
  - Prevents race conditions: rapid checkbox clicks never produce out-of-order grid updates
- **URL Management:**
  - `buildUrl()` strips stale `filter.*`, `sort_by`, `page` params then merges fresh values
  - Filter change → `history.pushState` (shareable URL)
  - Load More → `history.replaceState` (updates URL to correct page without polluting history)
  - `popstate` listener handles browser back/forward by re-fetching the state URL
- **`serializeFilters()`:**
  - Iterates all `[data-mallem-filter-form]` elements (both sidebar and drawer)
  - Skips disabled inputs and unchecked checkboxes/radios
  - WHY collect from all forms: sidebar and drawer must contribute identical state; user may interact with either
- **Load More:**
  - Appends individual `<li>` items to grid (no grid wipe — existing hover/swatch state preserved)
  - Button shows spinner during fetch; restores original text on error
- **Partial DOM Updates (7 targeted regions):**
  - `_updateGrid()` — replaces grid `innerHTML`
  - `_updateActiveFilters()` — replaces/inserts/removes active filter pills wrapper
  - `_updateProductCount()` — replaces count text
  - `_updatePagination()` — replaces pagination block
  - `_updateSidebar()` — replaces sidebar `innerHTML` to reflect new counts + disabled states
  - `_updateDrawerFilters()` — replaces drawer filter form content
  - `_updateFilterBadge()` — updates/inserts/removes badge count on mobile toggle button
- **Price inputs:** Debounced 500ms — no fetch fired while user is still typing
- **Re-init after update:** Calls `window.MallemSwatches.init()` + `window.MallemProductCard.init()` then dispatches `mallem:products:loaded` for all other modules

#### 6. Collection + Filter CSS
- **File:** `assets/mallem-filters.css`
- **Purpose:** Complete RTL-first styles for collection layout, filter UI, drawer, pills, load more
- **Coverage:**
  - `.mallem-collection` — max-width page container with logical padding
  - `.mallem-collection__header` — flex row, title + controls, wraps on small screens
  - `.mallem-collection__filter-toggle` — hidden ≥ 990px; pill button with badge
  - `.mallem-collection__sort-select` — custom arrow via `background-image` SVG; RTL-safe (`background-position` overridden in `[dir="rtl"]`)
  - `.mallem-collection__body` — flex row; sidebar + main
  - `.mallem-collection__sidebar` — `display: none` mobile; sticky at desktop with `max-block-size` + `overflow-y: auto`
  - `.mallem-collection__grid` — CSS Grid; `--mobile-1/2` and `--desktop-2/3/4` modifier classes from section settings; `contain: layout style`
  - Loading state: `.mallem-collection--loading .grid` → `opacity: 0.5; pointer-events: none`
  - `.mallem-active-filters` — pill row with `flex-wrap`
  - `.mallem-active-filter__remove` — circular remove button with hover background
  - `.mallem-filter-sidebar` — form reset styles
  - `.mallem-filter-group` — `<details>` with border separators; chevron rotates 180° when open
  - `.mallem-filter-checkbox` — custom 18×18px checkbox with CSS checkmark; keyboard focus ring on `::before`
  - `.mallem-filter-price` — dual number inputs with currency prefix, spinner hidden via `-webkit-appearance: none`
  - Load More button — border pill with spinner animation (`@keyframes mallem-spin`)
  - Filter drawer — `position: fixed; inset: 0`; panel `translateY(100%)` mobile → `translateX(±100%)` tablet
  - `.mallem-filter-drawer--open` — `transform: translate(0, 0)` — single class triggers transition in both axis
  - Drawer footer — sticky "Clear all" + "Apply" row
  - `prefers-reduced-motion` — all transitions and animations disabled
  - `mallem-scroll-lock` on `<body>` — `overflow: hidden` while drawer open

### Files Added
- `sections/mallem-collection.liquid` (new — 198 lines)
- `snippets/mallem-filter-sidebar.liquid` (new — 145 lines)
- `snippets/mallem-active-filters.liquid` (new — 75 lines)
- `snippets/mallem-filter-drawer.liquid` (new — 198 lines)
- `assets/mallem-filters.js` (new — 310 lines)
- `assets/mallem-filters.css` (new — 530 lines)

### Files Modified
- `locales/en.default.json` — added `sections.mallem_collection.*` (13 schema labels) and `mallem.collection.*` (17 UI keys)
- `locales/ar.json` — added same keys in Arabic

### Key Architectural Patterns

#### 1. Shopify Sections API (Minimal Payload)
The standard AJAX collection pattern fetches the full page HTML and scrapes out the grid. Sections API returns only the section JSON — a fraction of the payload. Especially important for MENA 3G networks.
```javascript
const url = `${filterUrl}&sections=${sectionId}`;
fetch(url).then(r => r.json()).then(data => {
  const html = new DOMParser().parseFromString(data[sectionId], 'text/html');
  // extract sub-regions from html
});
```

#### 2. AbortController — Race Condition Prevention
```javascript
if (this._controller) this._controller.abort();
this._controller = new AbortController();
fetch(url, { signal: this._controller.signal })
```
WHY: User clicks Color filter, network is slow, then clicks Size filter. Without abort, the Color response could arrive after Size and overwrite the correct grid. AbortController guarantees last-user-action wins.

#### 3. Dual-Form, Single Serializer
Both sidebar (`[id="mallem-filter-form"]`) and drawer (`[id="mallem-filter-form-drawer"]`) are `data-mallem-filter-form` forms. `serializeFilters()` collects from all matching forms inside the wrapper — one code path, no sync bugs.

#### 4. Progressive Enhancement Chain
```
No JS → form POST → Shopify renders filtered collection normally (standard URL)
JS loads → forms intercepted → AJAX fetch → partial DOM update + pushState
```
The site works at every level. Users on older devices or JS-blocked browsers get a fully functional filtered collection.

#### 5. `contain: layout style` on Grid
```css
.mallem-collection__grid {
  contain: layout style;
}
```
Filter changes replace grid `innerHTML`. Without containment, browser repaints the entire page layout. With containment, repaint is isolated to the grid box — critical on low-end Android devices common in MENA markets.

#### 6. CSS-Driven Drawer Direction
The same CSS class `mallem-filter-drawer--open` triggers the opening animation in both mobile (Y-axis) and tablet (X-axis) because the panel's base `transform` changes at the breakpoint:
```css
/* Mobile */
.mallem-filter-drawer__panel { transform: translateY(100%); }
/* Tablet */
@media (min-width: 750px) {
  .mallem-filter-drawer__panel { transform: translateX(-100%); }
}
/* Open (both) */
.mallem-filter-drawer--open .mallem-filter-drawer__panel { transform: translate(0, 0); }
```
Zero JS direction logic — breakpoint CSS does everything.

#### 7. `requestAnimationFrame` Before Transition
```javascript
this._drawer.hidden = false;
requestAnimationFrame(() => {
  this._drawer.classList.add('mallem-filter-drawer--open');
});
```
WHY: Setting `hidden = false` and immediately adding the class in the same tick means the browser applies both changes before painting — the transition never fires. rAF defers the class addition to the next paint cycle, ensuring the element is visible before the transition starts.

#### 8. `history.replaceState` on Load More
Load More fetches page 2, 3, etc. Using `pushState` would add these to history — clicking back would step through each page. `replaceState` updates the URL to the correct page (so refresh works) without polluting history. Filter changes still use `pushState` (each filtered state is intentionally navigable).

#### 9. Modular Re-init Contract
After every grid update:
```javascript
window.MallemSwatches.init(container);
window.MallemProductCard.init(container);
document.dispatchEvent(new CustomEvent('mallem:products:loaded', { detail: { container } }));
```
`mallem-filters.js` doesn't know about swatches or cards — it just calls published APIs and dispatches the shared event. Future modules (quick view, wishlist, recently viewed) hook into `mallem:products:loaded` without modifying filter code.

### Integration Points

#### Section Usage
Place `sections/mallem-collection.liquid` in `templates/collection.json`:
```json
{
  "sections": {
    "main": {
      "type": "mallem-collection",
      "settings": {
        "products_per_page": 24,
        "columns_desktop": "4",
        "enable_filters": true
      }
    }
  },
  "order": ["main"]
}
```

#### JS Event Contract

| Event | Direction | Detail | Purpose |
|---|---|---|---|
| `mallem:products:loaded` | dispatched | `{ container }` | Re-init all card modules |
| `mallem:filters:loading` | dispatched | — | Show global spinner if needed |
| `mallem:filters:done` | dispatched | — | Hide global spinner |
| `popstate` | listened | `e.state.url` | Browser back/forward |

#### CSS Class Hooks for External Modules

| Class | Applied To | Meaning |
|---|---|---|
| `mallem-collection--loading` | collection wrapper | AJAX fetch in progress |
| `mallem-filter-drawer--open` | drawer root | Drawer is open/animating |
| `mallem-scroll-lock` | `<body>` | Scroll locked (drawer open) |

#### Filter Form Data Attributes

| Element | Attribute | Set By | Purpose |
|---|---|---|---|
| `<form>` | `data-mallem-filter-form` | Liquid | Collected by `serializeFilters()` |
| `<input>` | `data-mallem-filter-input` | Liquid | Included in serialization |
| `<input type="number">` | `data-mallem-price-min` | Liquid | Triggers debounced change |
| `<input type="number">` | `data-mallem-price-max` | Liquid | Triggers debounced change |
| `<select>` | `data-mallem-sort` | Liquid | Desktop sort; synced with drawer radios |
| `<input type="radio">` | `data-mallem-drawer-sort` | Liquid | Drawer sort; syncs desktop select |

### Technical Highlights

#### `serializeFilters()` — Multi-Form Aware
```javascript
function serializeFilters(container) {
  var params = new URLSearchParams();
  container.querySelectorAll('[data-mallem-filter-form]').forEach(function (form) {
    form.querySelectorAll('[data-mallem-filter-input]').forEach(function (input) {
      if (input.disabled) return;
      if ((input.type === 'checkbox' || input.type === 'radio') && !input.checked) return;
      if (input.value === '') return;
      params.append(input.name, input.value);
    });
  });
  return params;
}
```
Collecting from both forms sounds like it would duplicate params — but it doesn't, because sidebar and drawer are always in sync after each AJAX update (`_updateSidebar` + `_updateDrawerFilters` replace their content from the fresh server render).

#### Price Range — Comma-Locale Safe
Shopify `money_without_currency` may format as `1,200.00` in some locales. The `replace: ',', ''` filter strips the thousands-separator, producing `1200.00` — a safe `type="number"` value. The `min` and `max` attributes use the same strip, ensuring the browser's built-in range validation works correctly.

#### `visibility: hidden` vs `display: none` on Clear-All Link
The "Clear all" link is `visibility: hidden` when no active filters — not `display: none`. This preserves the sidebar header height so it doesn't jump when the first filter is applied and the link suddenly appears.

#### Drawer Transition Close Sequence
```javascript
this._drawer.classList.remove(CLS.drawerOpen);  // 1. Start CSS transition (slide out)
this._drawer.addEventListener('transitionend', function handler() {
  self._drawer.hidden = true;                     // 2. After transition: remove from layout
  self._drawer.removeEventListener('transitionend', handler);
}, { once: true }); // { once: true } equivalent via manual remove
```
WHY not immediate `hidden = true`: Setting `hidden` immediately collapses the element before the CSS transition can run — the drawer disappears instantly with no animation. `transitionend` waits for the exit animation to complete first.

### Performance Profile

| Asset | Lines | Size (unminified) | Size (minified ~est.) |
|---|---|---|---|
| `mallem-collection.liquid` | ~198 | ~8KB | N/A (server-rendered) |
| `mallem-filter-sidebar.liquid` | ~145 | ~6KB | N/A |
| `mallem-active-filters.liquid` | ~75 | ~3KB | N/A |
| `mallem-filter-drawer.liquid` | ~198 | ~8KB | N/A |
| `mallem-filters.js` | ~310 | ~11KB | ~5.5KB |
| `mallem-filters.css` | ~530 | ~17KB | ~8KB |
| **Total new JS+CSS payload** | | | **~13.5KB** |

- Sections API response is section HTML only — not the full page (~95% smaller than full-page AJAX)
- AbortController prevents redundant network traffic on rapid filter interactions
- `contain: layout style` on grid isolates repaint — no ancestor reflow during grid replacement
- Price debounce (500ms) — typically 3–5 keystrokes before a fetch fires (saves 2–4 network requests per price input interaction)
- Drawer CSS uses `transform` only — GPU-composited, zero layout cost on open/close

### Accessibility Compliance

- ✅ `role="dialog"` + `aria-modal="true"` on filter drawer
- ✅ `aria-label` on drawer and sidebar (`<aside aria-label="Product filters">`)
- ✅ Focus trap in drawer — Tab cycles inside; Escape closes
- ✅ Focus returned to filter toggle button on drawer close
- ✅ `aria-expanded="true/false"` on filter toggle button
- ✅ `aria-busy="true/false"` on grid during AJAX fetch
- ✅ `aria-live="polite"` on active filters region — screen readers announce pill changes
- ✅ `aria-live="polite"` + `aria-atomic="true"` on product count
- ✅ Filter checkboxes use visually-hidden native input + custom styled `::before` — keyboard and screen reader accessible
- ✅ Disabled filter values (zero count) have `disabled` attribute — skipped by keyboard
- ✅ 44px touch targets on all interactive filter elements
- ✅ `prefers-reduced-motion` disables all CSS transitions and animations

### RTL Compliance

- ✅ Zero `left`/`right` values in `mallem-filters.css`
- ✅ Sidebar positioned via `flex-direction` on `.mallem-collection__body` — auto-flips in RTL
- ✅ Drawer panel `inset-inline-start: 0` on tablet — slides from right side in RTL
- ✅ Filter toggle badge uses `filter: invert(1)` technique (same as swatch badge) — no directional dependency
- ✅ Sort `<select>` arrow: `background-position: right` overridden to `left` in `[dir="rtl"]` — intentional exception with explicit override
- ✅ All spacing: `padding-inline`, `margin-block`, `gap` — fully logical
- ✅ Drawer exit animation: `translateX(-100%)` becomes `translateX(100%)` in `[dir="rtl"]` via the explicit RTL rule
- ✅ Filter checkmark `::after` uses `rotate(-45deg) translate(1px, -1px)` — symmetric, direction-agnostic

### Use Cases

- **Fashion collections** (Morocco, Saudi, Egypt): Filters by Color (عينات) + Size + Price range; mobile drawer slides up like a native app sheet; Arabic option names auto-detected by swatches
- **Dropshipping catalogs (MENA)**: 1000+ products per collection; Load More keeps initial render fast; AJAX filter avoids full-page reload on slow 3G
- **Multi-language stores**: All filter UI text via `mallem.collection.*` translation keys; "Clear all", "Filter & Sort", price labels all translate to Arabic automatically
- **Merchant with no metafields**: Filters work entirely from Shopify's native `collection.filters` — zero configuration beyond enabling "Storefront filtering" in Shopify admin
- **Desktop power users**: Sticky sidebar stays visible while scrolling through 48 products; multiple filter groups collapse to save space; active pills above grid show current state at a glance

### Future Enhancements (Ready For)

- **Infinite scroll**: Replace Load More button with `IntersectionObserver` on the last grid item — `_loadMore()` already appends correctly, only the trigger changes
- **Filter count pills**: The `filter.active_values.size` data is already in the DOM on each `<summary>` — animating the count badge only requires a CSS transition on the `.mallem-filter-group__count` element
- **Filter search**: A `<input type="search">` inside each `mallem-filter-group__body` can filter the visible `mallem-filter-list__item` elements with a simple `textContent.includes()` loop — no re-fetch needed
- **Product card skeleton**: During AJAX load, replace grid items with `.mallem-skeleton-item` elements matching the column count — preserves layout height and provides progressive loading feedback
- **Wishlist integration**: `mallem:products:loaded` event is already dispatched after every grid update — wishlist module can re-read saved variants without modifying filter code

---

## Day 12: Hero Slider Section ✅ Complete

**Date:** 2026-03-26
**Feature:** Full-Width Hero Slider — Homepage & Landing Pages
**Status:** ✅ Production Ready

### What Was Built

#### 1. Hero Slider Section
- **File:** `sections/mallem-hero-slider.liquid`
- **Purpose:** Premium above-the-fold hero slider with autoplay, RTL support, and MENA-market optimizations
- **Block Type:** `mallem_slide` (max 6 slides)
- **Custom Element:** `<mallem-hero-slider>` — Shopify editor lifecycle via `connectedCallback` / `disconnectedCallback`

**Per-slide block settings:**
  - `image` (image_picker) — desktop background image
  - `mobile_image` (image_picker) — override shown < 750px
  - `overlay_opacity` (range 0–80, step 10) — gradient darkness per slide
  - `text_position` (select) — 9 positions: top/middle/bottom × left/center/right
  - `heading` + `heading_size` (small / medium / large)
  - `subheading` (textarea)
  - `button_label` + `button_link` + `button_style` (primary / outline / white)
  - `secondary_button_label` + `secondary_button_link`
  - `show_cod_badge` (checkbox) — integrates `mallem-badge` snippet
  - `color_scheme` (color_scheme picker)

**Section settings:**
  - `autoplay` (checkbox, default true)
  - `autoplay_speed` (range 3–8s, default 5s)
  - `show_arrows` + `show_dots` (checkboxes)
  - `slide_height` (small 50vh / medium 65vh / large 80vh / full 100vh)
  - `full_width` (checkbox)

**Performance (images):**
  - First slide: `loading="eager" fetchpriority="high"`
  - All other slides: `loading="lazy"`
  - `srcset`: 750w, 1100w, 1500w, 1780w, 2000w on every desktop image
  - `sizes="100vw"` — browser picks optimal source
  - Explicit `width` + `height` on every `<img>` — zero CLS

**Accessibility:**
  - `role="region"` + `aria-label` on slider root
  - `aria-roledescription="slide"` + `aria-label="Slide N of Total"` on each slide
  - `aria-live="polite"` announce region — screen readers get slide changes without interruption
  - Dots use `role="tab"` + `aria-selected` + `aria-controls` → slide `id`
  - Pause/play button with `aria-pressed` + `data-pause-label` / `data-play-label`

#### 2. Hero Slider Styles
- **File:** `assets/mallem-hero-slider.css`
- **Zero** `left` / `right` values — 100% CSS logical properties
- **Transitions** on `transform` and `opacity` only — GPU composited, zero reflow

**Layout:**
  - `.mallem-hero-slider`: `position: relative; overflow: hidden; contain: layout style`
  - `.mallem-hero-slider__track`: `display: flex; transition: transform 0.6s cubic-bezier(0.4,0,0.2,1)`
  - `.mallem-hero-slider__slide`: `flex-shrink: 0; inline-size: 100%; block-size: var(--slide-height)`

**Text position system — CSS Grid 3×3:**
  - `.mallem-hero-slider__content`: `display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; position: absolute; inset: 0`
  - 9 modifier classes (e.g. `--middle_left`) set `grid-column`, `grid-row`, `align-self`, `justify-self` on the inner element
  - RTL grid column order auto-reverses from CSS writing-mode cascade — zero overrides needed

**Overlay:**
  - `::before` pseudo on each slide — bottom-heavy gradient `to bottom` for text readability
  - Opacity driven by `--slide-overlay` CSS custom property set per-slide from Liquid

**Arrows:**
  - `inset-inline-start: 1rem` (prev) / `inset-inline-end: 1rem` (next)
  - Auto-flip in RTL — no overrides needed
  - 44×44px tap targets (WCAG 2.5.5)

**Dots:**
  - `inline-size: 8px` (inactive) → `inline-size: 24px` (active) pill animation
  - Transition on `inline-size` only — GPU composited

**Mobile (≤ 749px):**
  - Desktop image hidden, mobile image shown when provided
  - Content `grid-column: 1 / -1 !important` — collapses 3-column grid to single column

**Performance:**
  - `will-change: transform` added to track class before animation, removed on `transitionend`
  - `contain: layout style` on root
  - `transition-duration: 0ms` on all animated elements under `prefers-reduced-motion`

#### 3. Hero Slider JavaScript
- **File:** `assets/mallem-hero-slider.js`
- **Pattern:** Custom element class `MallemHeroSlider` registered via `customElements.define`

**Slide mechanism:**
  - CSS `translateX(calc(sign × 100% × currentIndex))` — zero JS width reads
  - LTR sign = `-1`, RTL sign = `+1` (RTL flex `overflow:hidden` starts from flex-start on the right)
  - `will-change: transform` class applied before, removed on `transitionend`

**Autoplay pause system — named reasons Set:**
  - Any active reason blocks resume: `hover`, `focus`, `visibility`, `intersection`, `reduced-motion`, `user-toggle`
  - `_pause(reason)` / `_resume(reason)` — clears specific reason, resumes only when Set is empty
  - Prevents "mouse leaves while tab hidden" from triggering premature resume

**Pause triggers:**
  - `mouseenter` / `mouseleave` → `hover`
  - `focusin` / `focusout` (+ `setTimeout(0)` guard) → `focus`
  - `document.visibilitychange` → `visibility`
  - `IntersectionObserver` at 50% threshold → `intersection`
  - `matchMedia('prefers-reduced-motion: reduce')` + change listener → `reduced-motion`

**Navigation:**
  - Arrow buttons: `data-prev` / `data-next`
  - Dots: click → `goTo(i)`
  - Keyboard: `ArrowLeft` in RTL = `next()`, in LTR = `prev()` (reading-direction aware)
  - Touch: 50px threshold; RTL: `delta > 0` = next; LTR: `delta < 0` = next
  - `passive: true` on touch listeners

**Events dispatched:**
  - `mallem:slider:slide-changed` → `{ currentIndex, totalSlides, direction }`

**Public API:** `window.MallemHeroSlider.init()` for dynamically injected sliders

#### 4. Translation Keys
- **Files:** `locales/en.default.json` + `locales/ar.json`

**English keys added:**
  - `sections.mallem_hero_slider.name` + all settings/block/option labels
  - `mallem.hero_slider.previous_slide / next_slide / go_to_slide / slide_count / pause_slideshow / play_slideshow`

**Arabic keys added (same structure):**
  - سلايدر رئيسي, الشريحة السابقة, الشريحة التالية, انتقل إلى الشريحة, إيقاف مؤقت, تشغيل, etc.

### Files Added
- `sections/mallem-hero-slider.liquid` (new)
- `assets/mallem-hero-slider.css` (new)
- `assets/mallem-hero-slider.js` (new)

### Files Modified
- `locales/en.default.json` (added `sections.mallem_hero_slider.*` + `mallem.hero_slider.*`)
- `locales/ar.json` (added Arabic equivalents for all new keys)

### Key Architectural Patterns
1. **Custom Element Lifecycle:** `connectedCallback` / `disconnectedCallback` handle Shopify editor add/remove cleanly
2. **Named Pause Reasons Set:** Multiple simultaneous pause signals handled correctly — no premature resume
3. **CSS translateX Only:** Zero JS layout reads during animation — no `offsetWidth`, no `scrollLeft`
4. **RTL Sign Flip:** Single variable `sign = isRTL ? 1 : -1` — RTL flex overflow-start behavior makes it correct
5. **CSS Grid 3×3 Positioning:** 9 text positions with zero percentage calculations — RTL auto-reverses via writing-mode
6. **Performance-First Images:** eager+fetchpriority on slide[0], lazy on rest, srcset 750→2000w
7. **Translation-Driven Schema:** All labels via `t:` keys — zero hardcoded English in schema

### Integration Points
- **COD badge:** `{% render 'mallem-badge', type: 'cod', show_icon: true %}` per slide
- **RTL detection:** `window.Mallem?.isRTL ?? (document.documentElement.dir === 'rtl')`
- **CSS asset:** Loaded inline in section via `{{ 'mallem-hero-slider.css' | asset_url | stylesheet_tag }}`
- **JS asset:** `<script src="..." defer="defer">` — non-blocking
- **Event hook:** Listen for `mallem:slider:slide-changed` to integrate analytics or other modules

### Technical Highlights
- **RTL Keyboard:** `ArrowLeft` = next in RTL (toward reading end = left direction = forward)
- **RTL Swipe:** `delta > 0` (swipe right) = next in RTL — content follows reading direction
- **Overlay gradient:** `to bottom` (physical) — always bottom-heavy regardless of RTL
- **Dot pill animation:** `inline-size` transition only — GPU composited, no reflow
- **Focus guard:** `setTimeout(0)` on `focusout` prevents false resume before new element receives focus
- **rAF announce:** `requestAnimationFrame` wraps live region update — guarantees screen reader re-reads even with identical text

---

---

## Day 13: Product Detail Page (PDP) ✅ Complete

**Date:** 2026-04-02
**Feature:** Full PDP System — Gallery, Info Panel, Stock Counter, Sticky ATC, Accordion
**Status:** ✅ Production Ready

### What Was Built

#### 1. Section Shell
- **File:** `sections/mallem-product-main.liquid`
- CSS Grid layout: gallery (55fr) | info (45fr), mobile: single column
- Breadcrumb navigation at top
- Schema: image_ratio, gallery_thumbnails_position, enable_zoom, enable_sticky_atc, show_vendor, show_rating, show_cod_badge, stock_low_threshold, stock_medium_threshold, show_free_shipping_threshold, free_shipping_amount
- Schema blocks: description_tab, size_guide_tab, shipping_tab, custom_tab

#### 2. Product Gallery
- **File:** `snippets/mallem-product-gallery.liquid`
- Desktop: vertical thumbnail rail + main image viewport
- RTL: thumbnail rail on right side (logical layout)
- Image 0: eager + fetchpriority="high" (LCP optimized)
- All other images: lazy loaded
- Zoom: CSS only via mallem-gallery__slide--zoomable class
- Mobile: dots indicator, swipeable carousel
- ARIA: role="region", live region for screen reader announcements

#### 3. Product Info Panel
- **File:** `snippets/mallem-product-info.liquid`
- Render order: vendor → H1 title → rating hook → price → form (swatches + qty + stock + ATC + COD badge) → sticky ATC → accordion
- Integrates Day 10 variant swatches, Day 2 COD badge, Day 4 cart drawer

#### 4. Stock Counter — FOMO Engine
- **File:** `snippets/mallem-product-stock.liquid`
- Server-side Liquid initial state (no first-paint flash)
- data-mallem-inventory + threshold data attributes for JS re-evaluation
- States: out (≤0) | low (≤5, red) | medium (≤20, orange) | hidden (>20)

#### 5. Accordion
- **File:** `snippets/mallem-product-accordion.liquid`
- Native <details><summary> — zero JS required
- First item open by default
- CSS chevron rotation via [open] selector

#### 6. Sticky Add to Cart
- **File:** `snippets/mallem-sticky-atc.liquid`
- Custom Element: mallem-sticky-atc
- IntersectionObserver watches original ATC button
- safe-area-inset-bottom for iPhone notch
- aria-hidden drives CSS transform — screen-reader safe

#### 7. CSS
- **File:** `assets/mallem-product-main.css`
- 100% logical properties (no left/right)
- Mobile-first
- Aspect ratio classes: square (1/1), portrait (3/4), landscape (4/3)
- Stock color variables: --mallem-stock-low-color, --mallem-stock-medium-color

#### 8. JavaScript
- **File:** `assets/mallem-product-main.js`
- MallemProductGallery: translateX animation, RTL sign flip, touch + keyboard
- MallemStickyATC: IntersectionObserver, variant sync
- MallemStockCounter: threshold evaluation, variant change listener
- MallemProductMain: orchestrator, variant:changed event bus, fetch cart/add

### Files Added
- `sections/mallem-product-main.liquid`
- `snippets/mallem-product-gallery.liquid`
- `snippets/mallem-product-info.liquid`
- `snippets/mallem-product-stock.liquid`
- `snippets/mallem-product-accordion.liquid`
- `snippets/mallem-sticky-atc.liquid`
- `assets/mallem-product-main.css`
- `assets/mallem-product-main.js`

### Files Modified
- `locales/en.default.json`
- `locales/ar.json`

### Key Architectural Decisions
1. **mallem:variant:changed** — custom event bus decouples gallery, stock, sticky ATC
2. **Server-side stock initial state** — Liquid renders first, JS only updates on variant change
3. **IntersectionObserver for sticky ATC** — replaces scroll listener, more performant
4. **Native <details> accordion** — works in Shopify editor without JS
5. **RTL sign flip** — sign = isRTL ? 1 : -1, same pattern as Day 12 hero slider

### Integration Points
- Day 2: `{% render 'mallem-badge', type: 'cod', show_icon: true %}`
- Day 4: dispatches `mallem:cart:updated` after successful add-to-cart
- Day 10: `{% render 'mallem-variant-swatches', product: product, section: section %}`
- Day 12: same translateX + RTL sign pattern in gallery JS

---

**Tracker maintained by:** mallem development team
**Last updated:** 2026-04-02
