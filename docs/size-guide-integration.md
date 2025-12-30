# Size Guide System - Integration Guide

## Overview

The Size Guide System allows merchants to add custom size guides to products using Shopify metafields. The system displays size guides in an accessible modal with support for rich text content and optional images.

---

## Product Metafield Setup

Merchants need to create the following metafields for each product:

### Metafield Configuration

**Namespace:** `mallem`

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `size_guide_title` | Single line text | Yes | Title of the size guide (e.g., "Size Chart") |
| `size_guide_content` | Rich text | Yes | Main content with sizing information (supports HTML tables) |
| `size_guide_image` | File reference | No | Optional image (size chart graphic) |

### Example Metafield Values

```
mallem.size_guide_title = "Men's Shirt Size Guide"
mallem.size_guide_content = "<h4>How to Measure</h4><p>Measure around...</p><table>...</table>"
mallem.size_guide_image = [Image file reference]
```

---

## Theme Integration

### 1. Add Modal to Theme Layout

In `layout/theme.liquid`, add before closing `</body>` tag:

```liquid
{% render 'mallem-size-guide-modal' %}
```

### 2. Load CSS and JavaScript

In `layout/theme.liquid` `<head>` section:

```liquid
{{ 'mallem-size-guide.css' | asset_url | stylesheet_tag }}
```

Before closing `</body>` tag:

```liquid
<script src="{{ 'mallem-size-guide.js' | asset_url }}" defer></script>
```

### 3. Add Size Guide Button to Product Page

In product template (e.g., `sections/main-product.liquid`), add where you want the button to appear:

```liquid
{% render 'mallem-size-guide-button', product: product %}
```

**Recommended placements:**
- Below variant selectors
- Near quantity input
- In product tabs (size guide tab)
- Above add to cart button

---

## Usage Examples

### Basic Integration (Product Page)

```liquid
<div class="product__info">
  <!-- Product title -->
  <h1>{{ product.title }}</h1>

  <!-- Variant selectors -->
  {% render 'product-variant-picker' %}

  <!-- Size guide button -->
  {% render 'mallem-size-guide-button', product: product %}

  <!-- Quantity + Add to cart -->
  {% render 'product-form' %}
</div>
```

### Product Card Integration

```liquid
<div class="product-card__actions">
  <button class="quick-view-button">Quick View</button>
  {% render 'mallem-size-guide-button', product: product %}
</div>
```

---

## Creating Size Guide Content

### Recommended HTML Table Structure

```html
<h4>Size Chart</h4>

<table>
  <thead>
    <tr>
      <th>Size</th>
      <th>Chest (cm)</th>
      <th>Waist (cm)</th>
      <th>Hips (cm)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>S</td>
      <td>86-91</td>
      <td>71-76</td>
      <td>91-96</td>
    </tr>
    <tr>
      <td>M</td>
      <td>96-101</td>
      <td>81-86</td>
      <td>101-106</td>
    </tr>
  </tbody>
</table>

<h4>How to Measure</h4>
<ul>
  <li><strong>Chest:</strong> Measure around the fullest part</li>
  <li><strong>Waist:</strong> Measure around natural waistline</li>
  <li><strong>Hips:</strong> Measure around fullest part of hips</li>
</ul>
```

---

## Features

### Conditional Rendering
- Button only appears if metafields exist
- No broken UI if size guide not set

### Accessibility
- ARIA roles and labels
- Keyboard navigation (Escape to close)
- Focus trap when modal open
- Screen reader friendly

### RTL Support
- Full RTL support via CSS logical properties
- Works correctly in Arabic/Hebrew

### Performance
- Single modal instance (reused for all products)
- Content injected dynamically
- No duplicate DOM elements
- Lazy image loading

### Mobile Optimization
- Full-screen on mobile devices
- Touch-friendly close targets
- Scrollable content area
- Responsive table layout

---

## Customization

### Button Styling

Override in your theme CSS:

```css
.mallem-size-guide-button {
  /* Custom styles */
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
}
```

### Modal Styling

```css
.mallem-size-guide-modal__dialog {
  max-inline-size: 900px; /* Wider modal */
}
```

---

## Events

The system dispatches custom events for integration with analytics:

```javascript
// Modal opened
document.addEventListener('mallem:size-guide:open', (e) => {
  console.log('Size guide opened for:', e.detail.productHandle);
});

// Modal closed
document.addEventListener('mallem:size-guide:close', () => {
  console.log('Size guide closed');
});
```

---

## Troubleshooting

### Button Not Appearing

**Check:**
1. Metafields are set correctly (namespace: `mallem`)
2. Both `size_guide_title` AND `size_guide_content` exist
3. Button snippet is rendered with correct product object

### Modal Not Opening

**Check:**
1. Modal snippet is rendered in theme.liquid
2. JavaScript file is loaded
3. No JavaScript errors in console
4. Button has correct data attributes

### Content Not Displaying

**Check:**
1. JSON data script is present in DOM
2. Product handle matches between button and data script
3. Content is valid HTML
4. Browser console for errors

---

## Browser Compatibility

- **Modern Browsers:** Full support (Chrome, Firefox, Safari, Edge)
- **Custom Elements:** Required (supported in all modern browsers)
- **Fallback:** Modal won't open if JavaScript disabled (button still visible)

---

## Performance Notes

- Modal HTML loaded once (not per product)
- Content injected on demand
- No AJAX requests (data in page)
- Minimal JavaScript footprint (~6KB)
- CSS-driven animations

---

## Future Enhancements

Possible additions:
- Unit switcher (cm ↔ inches)
- Size recommendation based on measurements
- Virtual try-on integration
- Size comparison between brands
- User measurement save (localStorage)
