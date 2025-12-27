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

## Next: Product Card System

**Priority:** High (Foundation for collections, search, recommendations)
**Depends On:** RTL Foundation ✅

### Planned Components
- `snippets/mallem-product-card.liquid` - Reusable product card with RTL support
- `snippets/mallem-price.liquid` - Price display with sale/compare pricing
- `snippets/mallem-badge.liquid` - Product badges (sale, new, COD available)
- `assets/mallem-product-card.css` - Product card styling (RTL-ready)

### Key Features
- Quick view integration (modal trigger)
- Wishlist button hook
- Variant color swatches
- COD badge support
- Trust signals (free shipping, etc.)
- Lazy loading images
- Mobile-optimized touch targets

---

**Tracker maintained by:** mallem development team
**Last updated:** 2025-12-26
