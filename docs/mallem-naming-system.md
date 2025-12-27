# mallem Naming System

## Sections

```
sections/mallem-hero-slider.liquid
sections/mallem-product-grid.liquid
sections/mallem-featured-collection.liquid
sections/mallem-image-banner.liquid
sections/mallem-testimonials.liquid
sections/mallem-newsletter.liquid
sections/mallem-quick-view.liquid
sections/mallem-mega-menu.liquid
sections/mallem-countdown-timer.liquid
sections/mallem-trust-badges.liquid
sections/mallem-size-guide.liquid
sections/mallem-sticky-atc.liquid
sections/mallem-product-tabs.liquid
sections/mallem-instagram-feed.liquid
sections/mallem-cart-drawer.liquid
```

## Snippets

```
snippets/mallem-product-card.liquid
snippets/mallem-price.liquid
snippets/mallem-icon.liquid
snippets/mallem-badge.liquid
snippets/mallem-button.liquid
snippets/mallem-variant-picker.liquid
snippets/mallem-quantity-selector.liquid
snippets/mallem-loading-spinner.liquid
snippets/mallem-modal.liquid
snippets/mallem-rating-stars.liquid
snippets/mallem-wishlist-button.liquid
snippets/mallem-quick-add.liquid
snippets/mallem-swiper-init.liquid
snippets/mallem-lazy-image.liquid
snippets/mallem-rtl-wrapper.liquid
```

## JavaScript Files

```
assets/mallem-product-card.js
assets/mallem-cart-drawer.js
assets/mallem-quick-view.js
assets/mallem-variant-selector.js
assets/mallem-mega-menu.js
assets/mallem-slider.js
assets/mallem-countdown.js
assets/mallem-tabs.js
assets/mallem-modal.js
assets/mallem-wishlist.js
assets/mallem-compare.js
assets/mallem-filters.js
assets/mallem-sticky-header.js
assets/mallem-lazy-load.js
assets/mallem-utils.js
assets/mallem-theme.js
```

## CSS Files

```
assets/mallem-product-card.css
assets/mallem-cart-drawer.css
assets/mallem-quick-view.css
assets/mallem-mega-menu.css
assets/mallem-slider.css
assets/mallem-countdown.css
assets/mallem-tabs.css
assets/mallem-modal.css
assets/mallem-wishlist.css
assets/mallem-filters.css
assets/mallem-sticky-header.css
assets/mallem-rtl.css
assets/mallem-utilities.css
assets/mallem-variables.css
assets/mallem-theme.css
```

## Schema Setting IDs

```json
{
  "id": "mallem_enable_rtl",
  "type": "checkbox"
}

{
  "id": "mallem_primary_color",
  "type": "color"
}

{
  "id": "mallem_heading_font",
  "type": "font_picker"
}

{
  "id": "mallem_enable_quick_view",
  "type": "checkbox"
}

{
  "id": "mallem_cart_type",
  "type": "select"
}

{
  "id": "mallem_product_grid_columns_desktop",
  "type": "range"
}

{
  "id": "mallem_enable_wishlist",
  "type": "checkbox"
}

{
  "id": "mallem_countdown_end_date",
  "type": "text"
}

{
  "id": "mallem_trust_badge_1_icon",
  "type": "select"
}

{
  "id": "mallem_trust_badge_1_text",
  "type": "text"
}

{
  "id": "mallem_enable_sticky_atc",
  "type": "checkbox"
}

{
  "id": "mallem_slider_autoplay_speed",
  "type": "range"
}

{
  "id": "mallem_enable_lazy_load",
  "type": "checkbox"
}

{
  "id": "mallem_mega_menu_layout",
  "type": "select"
}

{
  "id": "mallem_product_image_ratio",
  "type": "select"
}
```

## Block IDs

```json
{
  "type": "mallem_slide",
  "name": "Slide"
}

{
  "type": "mallem_testimonial",
  "name": "Testimonial"
}

{
  "type": "mallem_trust_badge",
  "name": "Trust Badge"
}

{
  "type": "mallem_tab",
  "name": "Tab"
}

{
  "type": "mallem_feature",
  "name": "Feature"
}

{
  "type": "mallem_image",
  "name": "Image"
}

{
  "type": "mallem_text",
  "name": "Text"
}

{
  "type": "mallem_button",
  "name": "Button"
}
```

## CSS Classes

```css
.mallem-product-card
.mallem-product-card__image
.mallem-product-card__title
.mallem-product-card__price
.mallem-product-card__badges

.mallem-cart-drawer
.mallem-cart-drawer__header
.mallem-cart-drawer__items
.mallem-cart-drawer__footer

.mallem-modal
.mallem-modal__overlay
.mallem-modal__content
.mallem-modal__close

.mallem-slider
.mallem-slider__track
.mallem-slider__slide
.mallem-slider__controls

.mallem-button
.mallem-button--primary
.mallem-button--secondary
.mallem-button--outline

.mallem-badge
.mallem-badge--sale
.mallem-badge--new
.mallem-badge--sold-out

.mallem-tabs
.mallem-tabs__nav
.mallem-tabs__tab
.mallem-tabs__panel

.mallem-countdown
.mallem-countdown__digit
.mallem-countdown__label

.mallem-mega-menu
.mallem-mega-menu__panel
.mallem-mega-menu__column
```

## JavaScript Classes/Modules

```javascript
class MallemProductCard
class MallemCartDrawer
class MallemQuickView
class MallemModal
class MallemSlider
class MallemTabs
class MallemCountdown
class MallemMegaMenu
class MallemVariantPicker
class MallemWishlist
class MallemCompare
class MallemLazyLoad
class MallemStickyHeader
```

## Custom Events

```javascript
'mallem:cart:updated'
'mallem:cart:opened'
'mallem:cart:closed'
'mallem:quickview:opened'
'mallem:quickview:closed'
'mallem:modal:opened'
'mallem:modal:closed'
'mallem:variant:changed'
'mallem:wishlist:added'
'mallem:wishlist:removed'
'mallem:product:added'
'mallem:filter:applied'
```

## Data Attributes

```html
data-mallem-product-card
data-mallem-cart-drawer
data-mallem-quick-view
data-mallem-modal
data-mallem-slider
data-mallem-tabs
data-mallem-countdown
data-mallem-variant-picker
data-mallem-wishlist
data-mallem-compare
data-mallem-lazy-load
data-mallem-sticky-header
data-mallem-product-id
data-mallem-variant-id
data-mallem-collection-id
```

## Translation Keys

```json
"mallem.product.add_to_cart"
"mallem.product.sold_out"
"mallem.product.quick_view"
"mallem.cart.title"
"mallem.cart.empty"
"mallem.cart.subtotal"
"mallem.cart.checkout"
"mallem.wishlist.add"
"mallem.wishlist.remove"
"mallem.compare.add"
"mallem.filters.clear_all"
"mallem.countdown.days"
"mallem.countdown.hours"
"mallem.countdown.minutes"
"mallem.countdown.seconds"
"mallem.size_guide.title"
"mallem.trust_badges.free_shipping"
"mallem.trust_badges.cod_available"
```

## Metafield Namespaces

```
mallem.badge_text
mallem.badge_color
mallem.video_url
mallem.size_guide
mallem.shipping_info
mallem.trust_badges
mallem.countdown_enabled
mallem.featured_badge
mallem.custom_tab_title
mallem.custom_tab_content
```
