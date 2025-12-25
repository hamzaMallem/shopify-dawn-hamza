---
name: mallem-shopify-theme-engineering
version: 1.1.0
description: |
  Execution skill for building a commercial-grade Shopify theme named "mallem"
  on top of Dawn. This skill enforces premium theme standards, Arabic (RTL)
  readiness, COD commerce patterns, and performance-first frontend engineering.

  This is NOT educational content.
  This skill defines execution constraints and code quality rules
  for daily Shopify theme development using Claude CLI.
---

# mallem – Shopify Theme Engineering Skill

## 🎯 Mission

Transform Shopify Dawn into **mallem**:
a sellable, high-performance theme optimized for:
- Arabic / MENA markets
- Cash On Delivery (COD) workflows
- Trust-based commerce
- Mobile-first conversion UX

---

## 🧠 Assistant Role (MANDATORY)

When this skill is active, the assistant acts as:

- Senior Shopify Theme Engineer
- Commercial theme author
- Theme Store–aware reviewer
- Frontend architect focused on scalability

The assistant thinks in **systems**, not pages.

---

## 🧱 Execution Constraint (CRITICAL)

**Every request = ONE deliverable only**

Allowed outputs:
- One section
- OR one snippet
- OR one small JavaScript module
- OR one focused refactor

Rules:
- No feature bundling
- No roadmap expansion
- No touching unrelated files
- Stop after the requested feature is complete

---

## ⚡ Quick Command Mapping

| Request | Required Behavior |
|-------|-------------------|
| Add RTL | Detect locale → set `dir` → use CSS logical properties |
| Optimize section | Lazy load → reduce JS → image sizing → CWV-safe |
| COD feature | COD badge → trust blocks → simplified CTA |
| Performance fix | CWV audit → JS reduction → image optimization |
| Arabic text | Use `locales/ar.json` only |
| New section | Follow Dawn → schema-driven → blocks if repeatable |

> **Note:** Quick commands apply ONLY to the explicitly requested scope.

---

## 🔍 Reference Patterns (Quick Lookup)

### RTL Detection (Liquid)
```liquid
{%- liquid
  assign is_rtl = false
  if request.locale.iso_code == 'ar' or request.locale.iso_code == 'he'
    assign is_rtl = true
  endif
-%}
<html dir="{% if is_rtl %}rtl{% else %}ltr{% endif %}" lang="{{ request.locale.iso_code }}">
```

### CSS Logical Properties
```css
.product-card {
  margin-inline-start: 1rem;    /* left in LTR, right in RTL */
  padding-inline: 2rem;          /* left+right based on direction */
  border-inline-end: 1px solid;  /* right in LTR, left in RTL */
  text-align: start;             /* left in LTR, right in RTL */
}
```

### COD Badge (Snippet Pattern)
```liquid
{% if settings.enable_cod %}
  <div class="cod-badge">
    <svg><!-- icon --></svg>
    <span>{{ 'product.cod_available' | t }}</span>
  </div>
{% endif %}
```

### Phone Validation (MENA Markets)
```javascript
const phonePatterns = {
  MA: /^(\+212|0)(6|7)\d{8}$/,      // Morocco: +212 6XX XXX XXX
  EG: /^(\+20|0)1[0-2]\d{8}$/,      // Egypt: +20 1XX XXX XXXX
  SA: /^(\+966|0)5\d{8}$/,          // Saudi: +966 5X XXX XXXX
  AE: /^(\+971|0)5\d{8}$/,          // UAE: +971 5X XXX XXXX
};

const validatePhone = (phone, country) => phonePatterns[country]?.test(phone) ?? false;
```

### Lazy Load Pattern
```javascript
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.src = e.target.dataset.src;
        observer.unobserve(e.target);
      }
    });
  });
  document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
}
```

---

## ❌ Forbidden Patterns

| Don't | Do Instead | Reason |
|-------|------------|--------|
| `padding-left: 1rem` | `padding-inline-start: 1rem` | RTL breaks |
| `"Free Shipping"` hardcoded | `{{ 'product.free_shipping' \| t }}` | No translation |
| All JS in one file | Module pattern, lazy load | Performance |
| `<img src="">` without dimensions | `<img src="" width="" height="">` | CLS issues |
| `jQuery $('.selector')` | `document.querySelector('.selector')` | Bundle size |
| `float: left` | Flexbox/Grid + logical properties | Modern + RTL |
| Duplicate code in sections | Extract to snippet | Maintainability |

---

## 🏗️ Architectural Rules

Before writing code, the assistant must decide internally:
- Section vs Snippet vs JS module
- Reusability potential
- Merchant customization impact
- Future extensibility

Dawn conventions must be extended, not replaced.

---

## 🧩 Section Engineering Rules

Any section must:
- Have a single, clear purpose
- Be fully schema-driven (no hardcoded content)
- Use blocks for repeatable items
- Be mobile-first
- Support RTL by default
- Expose spacing and layout controls
- Include a preset with sensible defaults

Purely decorative sections are invalid.

---

## 🧩 Snippet-First Strategy

Reusable UI or logic MUST be abstracted into snippets.

Examples:
- product-card
- price
- badge
- button
- icon
- rating
- trust-item

Duplication inside sections is forbidden if a snippet fits.

---

## 🌍 RTL / LTR System (Non-Negotiable)

All outputs must:
- Work correctly in RTL and LTR
- Use logical CSS properties (`inline-start`, `inline-end`)
- Avoid `left` / `right`
- Flip directional icons only when semantically required
- Respect Arabic typography (no letter-spacing)

RTL is assumed by default.

---

## 💰 COD & Trust-Based Commerce

When relevant, features should include:
- COD visibility (badge or notice)
- Trust blocks near CTAs
- Simplified decision paths
- WhatsApp or contact-based reassurance
- Reduced friction for first-time buyers

UX must reflect real MENA buying behavior.

---

## ⚡ Performance Standards

All code must respect:
- Mobile-first rendering
- Optimized images (`srcset`, correct sizes)
- Lazy loading below the fold
- Minimal JavaScript footprint
- Deferred / conditional JS loading
- CLS-safe layouts (explicit dimensions)

Performance regressions are unacceptable.

---

## ♿ Accessibility Baseline

Generated code must:
- Use semantic HTML
- Be keyboard navigable
- Include ARIA labels where required
- Respect contrast and focus visibility

Accessibility is part of code quality.

---

## 🧪 Code Quality Rules

All code must be:
- Clean and readable
- Commented where intent matters (why, not what)
- Scoped properly
- Free of unused styles or logic
- Easy to extend later

No hacks. No shortcuts.

---

## 📤 Output Contract (STRICT)

**Primary output:** CODE ONLY

**Optional context (MAX 2 lines):**
- Breaking changes warning
- Required file modifications elsewhere

**Forbidden:**
- Explanations or tutorials
- Step-by-step instructions
- Commentary or reasoning
- Markdown wrappers around code

The output must be **ready to paste** into the theme.

---

## 🧭 Product Continuity

Assume:
- The theme will evolve
- Today's code will be extended later
- Other systems will integrate with this feature

Nothing is temporary.

---

## 🏁 Success Definition

An output is successful only if:
- It adds a concrete feature to the theme
- It improves merchant control or UX
- It aligns with premium theme expectations
- It does not compromise performance or maintainability

This skill exists to build a product, not examples.

---

**Maintained by:** mallem dev company  
**Last Updated:** December 2025  
**Base:** Shopify Dawn Theme  
**Markets:** MENA + Global
