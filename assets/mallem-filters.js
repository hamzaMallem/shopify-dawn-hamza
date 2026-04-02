/**
 * Component: Collection Filters (AJAX)
 * Purpose: Intercepts filter/sort changes, fetches via Shopify Sections API,
 *          updates product grid without full page reload.
 *
 * Architecture:
 *   - One MallemFilters instance per [data-mallem-collection]
 *   - Sections API: fetches `?sections=sectionId` → JSON with section HTML
 *   - AbortController: cancels in-flight request when new filter applied
 *   - pushState + popstate: shareable filtered URLs, browser back/forward
 *   - Load More: appends next page items (no grid wipe)
 *   - Price inputs: debounced 500ms to prevent rapid fetch while typing
 *   - Re-inits MallemSwatches + MallemProductCard after every grid update
 *
 * Events dispatched (on document):
 *   mallem:products:loaded  — after any grid update (filter, sort, load more)
 *   mallem:filters:loading  — fetch started
 *   mallem:filters:done     — fetch completed (success or abort)
 *
 * Events listened:
 *   popstate — browser back/forward
 */

(function () {
  'use strict';

  /* ============================================================
     CONSTANTS
     ============================================================ */

  var SEL = {
    collection:    '[data-mallem-collection]',
    filterForm:    '[data-mallem-filter-form]',
    filterInput:   '[data-mallem-filter-input]',
    sortSelect:    '[data-mallem-sort]',
    drawerSort:    '[data-mallem-drawer-sort]',
    grid:          '[data-mallem-collection-grid]',
    pagination:    '[data-mallem-pagination]',
    productCount:  '[data-mallem-product-count]',
    loadMore:      '[data-mallem-load-more]',
    loadMoreText:  '[data-mallem-load-more-text]',
    activeFilters: '[data-mallem-active-filters]',
    removeFilter:  '[data-mallem-remove-filter]',
    clearFilters:  '[data-mallem-clear-filters]',
    filterToggle:  '[data-mallem-filter-toggle]',
    filterDrawer:  '[data-mallem-filter-drawer]',
    drawerOverlay: '[data-mallem-drawer-overlay]',
    drawerPanel:   '[data-mallem-drawer-panel]',
    drawerClose:   '[data-mallem-drawer-close]',
    sidebar:       '.mallem-collection__sidebar',
    drawerFilters: '.mallem-filter-drawer__filters',
    filterBadge:   '.mallem-collection__filter-badge',
  };

  var CLS = {
    loading:         'mallem-collection--loading',
    drawerOpen:      'mallem-filter-drawer--open',
    scrollLock:      'mallem-scroll-lock',
    loadMoreLoading: 'mallem-collection__load-more--loading',
    clearHidden:     'mallem-filter-sidebar__clear-all--hidden',
  };

  var DEBOUNCE_MS = 500;

  /* ============================================================
     UTILITY: debounce
     ============================================================ */

  function debounce(fn, delay) {
    var timer;
    return function () {
      var self = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(self, args); }, delay);
    };
  }

  /* ============================================================
     UTILITY: serializeFilters
     Collects all [data-mallem-filter-input] values from every filter form
     inside the collection wrapper (sidebar + drawer share state).
     WHY collect from all forms: both sidebar and drawer must stay in sync.
     ============================================================ */

  function serializeFilters(container) {
    var params = new URLSearchParams();
    container.querySelectorAll(SEL.filterForm).forEach(function (form) {
      form.querySelectorAll(SEL.filterInput).forEach(function (input) {
        if (input.disabled) return;
        if ((input.type === 'checkbox' || input.type === 'radio') && !input.checked) return;
        if (input.value === '') return;
        params.append(input.name, input.value);
      });
    });
    return params;
  }

  /* ============================================================
     UTILITY: buildUrl
     Merges filter params + sort into a clean URL.
     Strips stale filter.* / sort_by / page params before merging.
     ============================================================ */

  function buildUrl(baseUrl, filterParams, sortBy) {
    var url = new URL(baseUrl, window.location.origin);
    var clean = new URLSearchParams();

    /* Keep non-filter, non-sort params (e.g. utm_*) */
    url.searchParams.forEach(function (v, k) {
      if (!k.startsWith('filter.') && k !== 'sort_by' && k !== 'page') {
        clean.set(k, v);
      }
    });

    filterParams.forEach(function (v, k) { clean.append(k, v); });
    if (sortBy) clean.set('sort_by', sortBy);

    url.search = clean.toString();
    return url.toString();
  }

  /* ============================================================
     CLASS: MallemFilters
     ============================================================ */

  function MallemFilters(el) {
    this._el         = el;
    this._sectionId  = el.dataset.sectionId;
    this._baseUrl    = window.location.pathname;
    this._controller = null;
    this._drawer     = el.querySelector(SEL.filterDrawer);
    this._trapBound  = this._trapFocus.bind(this);

    this._bindEvents();
  }

  /* ─── BIND EVENTS ─────────────────────────────────────────── */

  MallemFilters.prototype._bindEvents = function () {
    var self = this;
    var debouncedChange = debounce(function () { self._onFilterChange(); }, DEBOUNCE_MS);

    /* Checkbox / radio / select changes */
    this._el.addEventListener('change', function (e) {
      if (e.target.matches(SEL.filterInput)) {
        self._onFilterChange();
        return;
      }
      if (e.target.matches(SEL.sortSelect)) {
        self._onFilterChange();
        return;
      }
      if (e.target.matches(SEL.drawerSort)) {
        /* Sync desktop sort select */
        var desktopSort = self._el.querySelector(SEL.sortSelect);
        if (desktopSort) desktopSort.value = e.target.value;
        self._onFilterChange();
      }
    });

    /* Price inputs — debounced so we don't fire on every keystroke */
    this._el.addEventListener('input', function (e) {
      if (e.target.matches('[data-mallem-price-min], [data-mallem-price-max]')) {
        debouncedChange();
      }
    });

    /* Click delegation: remove pills, clear all, load more, drawer open/close */
    this._el.addEventListener('click', function (e) {

      var removeBtn = e.target.closest(SEL.removeFilter);
      if (removeBtn) {
        e.preventDefault();
        self._navigateTo(removeBtn.getAttribute('href'));
        return;
      }

      var clearBtn = e.target.closest(SEL.clearFilters);
      if (clearBtn) {
        e.preventDefault();
        self._navigateTo(clearBtn.getAttribute('href'));
        return;
      }

      var loadMoreBtn = e.target.closest(SEL.loadMore);
      if (loadMoreBtn) {
        e.preventDefault();
        self._loadMore(loadMoreBtn);
        return;
      }

      if (e.target.closest(SEL.filterToggle)) {
        self._openDrawer();
        return;
      }

      if (e.target.closest(SEL.drawerClose) || e.target.matches(SEL.drawerOverlay)) {
        self._closeDrawer();
        return;
      }
    });

    /* Escape closes drawer */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') self._closeDrawer();
    });

    /* Browser back / forward */
    window.addEventListener('popstate', function (e) {
      var url = (e.state && e.state.url) ? e.state.url : window.location.href;
      self._fetchAndUpdate(url, false, false);
    });
  };

  /* ─── FILTER CHANGE → build URL → fetch ──────────────────── */

  MallemFilters.prototype._onFilterChange = function () {
    var params    = serializeFilters(this._el);
    var sortEl    = this._el.querySelector(SEL.sortSelect);
    var sortBy    = sortEl ? sortEl.value : null;
    var url       = buildUrl(this._baseUrl, params, sortBy);
    this._navigateTo(url);
  };

  MallemFilters.prototype._navigateTo = function (url) {
    this._fetchAndUpdate(url, true, false);
  };

  /* ─── FETCH + UPDATE ─────────────────────────────────────── */

  MallemFilters.prototype._fetchAndUpdate = function (url, doPush, doReplace) {
    var self = this;

    /* Cancel any in-flight request */
    if (this._controller) this._controller.abort();
    this._controller = new AbortController();

    this._setLoading(true);
    document.dispatchEvent(new CustomEvent('mallem:filters:loading', { bubbles: true }));

    var fetchUrl = url + (url.indexOf('?') !== -1 ? '&' : '?') + 'sections=' + this._sectionId;

    fetch(fetchUrl, {
      signal:  this._controller.signal,
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var parser = new DOMParser();
      var html   = parser.parseFromString(data[self._sectionId], 'text/html');

      self._updateGrid(html);
      self._updateActiveFilters(html);
      self._updateProductCount(html);
      self._updatePagination(html);
      self._updateSidebar(html);
      self._updateDrawerFilters(html);
      self._updateFilterBadge(html);

      if (doPush) {
        window.history.pushState({ url: url }, '', url);
      } else if (doReplace) {
        window.history.replaceState({ url: url }, '', url);
      }

      self._afterUpdate();
    })
    .catch(function (err) {
      if (err.name !== 'AbortError') {
        console.error('[MallemFilters] Fetch error:', err);
      }
    })
    .finally(function () {
      self._setLoading(false);
      document.dispatchEvent(new CustomEvent('mallem:filters:done', { bubbles: true }));
    });
  };

  /* ─── LOAD MORE ───────────────────────────────────────────── */

  MallemFilters.prototype._loadMore = function (btn) {
    var self    = this;
    var nextUrl = btn.dataset.nextUrl;
    if (!nextUrl) return;

    btn.classList.add(CLS.loadMoreLoading);
    btn.setAttribute('aria-busy', 'true');

    var textEl = btn.querySelector(SEL.loadMoreText);
    if (textEl) textEl.setAttribute('data-original-text', textEl.textContent);

    var fetchUrl = nextUrl + (nextUrl.indexOf('?') !== -1 ? '&' : '?') + 'sections=' + this._sectionId;

    fetch(fetchUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var parser   = new DOMParser();
      var html     = parser.parseFromString(data[self._sectionId], 'text/html');
      var newItems = html.querySelectorAll(SEL.grid + ' .mallem-collection__item');
      var grid     = self._el.querySelector(SEL.grid);

      newItems.forEach(function (item) { grid.appendChild(item); });

      self._updatePagination(html);
      self._updateProductCount(html);

      /* Update URL to next page so browser refresh shows correct state */
      window.history.replaceState({ url: nextUrl }, '', nextUrl);

      self._afterUpdate();
    })
    .catch(function (err) {
      console.error('[MallemFilters] Load more error:', err);
      btn.classList.remove(CLS.loadMoreLoading);
      btn.setAttribute('aria-busy', 'false');
      if (textEl && textEl.dataset.originalText) {
        textEl.textContent = textEl.dataset.originalText;
      }
    });
  };

  /* ─── DOM UPDATE HELPERS ─────────────────────────────────── */

  MallemFilters.prototype._updateGrid = function (html) {
    var newGrid = html.querySelector(SEL.grid);
    var curGrid = this._el.querySelector(SEL.grid);
    if (newGrid && curGrid) curGrid.innerHTML = newGrid.innerHTML;
  };

  MallemFilters.prototype._updateActiveFilters = function (html) {
    var newAF  = html.querySelector(SEL.activeFilters);
    var curAF  = this._el.querySelector(SEL.activeFilters);

    if (curAF && newAF) {
      curAF.outerHTML = newAF.outerHTML;
    } else if (curAF && !newAF) {
      curAF.remove();
    } else if (!curAF && newAF) {
      /* Insert active filters above the body */
      var body = this._el.querySelector('.mallem-collection__body');
      if (body) body.insertAdjacentHTML('beforebegin', newAF.outerHTML);
    }
  };

  MallemFilters.prototype._updateProductCount = function (html) {
    var newEl = html.querySelector(SEL.productCount);
    var curEl = this._el.querySelector(SEL.productCount);
    if (newEl && curEl) curEl.innerHTML = newEl.innerHTML;
  };

  MallemFilters.prototype._updatePagination = function (html) {
    var newEl = html.querySelector(SEL.pagination);
    var curEl = this._el.querySelector(SEL.pagination);
    if (newEl && curEl) {
      curEl.outerHTML = newEl.outerHTML;
    } else if (curEl && !newEl) {
      curEl.remove();
    } else if (!curEl && newEl) {
      var main = this._el.querySelector('.mallem-collection__main');
      if (main) main.insertAdjacentHTML('beforeend', newEl.outerHTML);
    }
  };

  MallemFilters.prototype._updateSidebar = function (html) {
    /* Replace sidebar inner content (filter counts, checked states) */
    var newSidebar = html.querySelector(SEL.sidebar);
    var curSidebar = this._el.querySelector(SEL.sidebar);
    if (newSidebar && curSidebar) curSidebar.innerHTML = newSidebar.innerHTML;
  };

  MallemFilters.prototype._updateDrawerFilters = function (html) {
    var newDF = html.querySelector(SEL.drawerFilters);
    var curDF = this._el.querySelector(SEL.drawerFilters);
    if (newDF && curDF) curDF.innerHTML = newDF.innerHTML;
  };

  MallemFilters.prototype._updateFilterBadge = function (html) {
    var newBadge = html.querySelector(SEL.filterBadge);
    var curBadge = this._el.querySelector(SEL.filterBadge);
    var toggle   = this._el.querySelector(SEL.filterToggle);

    if (newBadge) {
      if (curBadge) {
        curBadge.outerHTML = newBadge.outerHTML;
      } else if (toggle) {
        toggle.insertAdjacentHTML('beforeend', newBadge.outerHTML);
      }
    } else if (curBadge) {
      curBadge.remove();
    }
  };

  /* ─── LOADING STATE ──────────────────────────────────────── */

  MallemFilters.prototype._setLoading = function (on) {
    this._el.classList.toggle(CLS.loading, on);
    var grid = this._el.querySelector(SEL.grid);
    if (grid) grid.setAttribute('aria-busy', on ? 'true' : 'false');
  };

  /* ─── AFTER UPDATE: re-init modules ─────────────────────── */

  MallemFilters.prototype._afterUpdate = function () {
    var container = this._el.querySelector(SEL.grid) || this._el;

    if (window.MallemSwatches && typeof window.MallemSwatches.init === 'function') {
      window.MallemSwatches.init(container);
    }
    if (window.MallemProductCard && typeof window.MallemProductCard.init === 'function') {
      window.MallemProductCard.init(container);
    }

    document.dispatchEvent(new CustomEvent('mallem:products:loaded', {
      bubbles: true,
      detail:  { container: container },
    }));
  };

  /* ─── DRAWER ─────────────────────────────────────────────── */

  MallemFilters.prototype._openDrawer = function () {
    var self = this;
    if (!this._drawer) return;

    this._drawer.hidden = false;
    document.body.classList.add(CLS.scrollLock);

    /* rAF ensures hidden removal triggers the CSS transition */
    requestAnimationFrame(function () {
      self._drawer.classList.add(CLS.drawerOpen);
      var first = self._drawer.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled])'
      );
      if (first) first.focus();
    });

    var toggle = this._el.querySelector(SEL.filterToggle);
    if (toggle) toggle.setAttribute('aria-expanded', 'true');

    this._drawer.addEventListener('keydown', this._trapBound);
  };

  MallemFilters.prototype._closeDrawer = function () {
    var self = this;
    if (!this._drawer || !this._drawer.classList.contains(CLS.drawerOpen)) return;

    this._drawer.classList.remove(CLS.drawerOpen);
    document.body.classList.remove(CLS.scrollLock);

    this._drawer.addEventListener('transitionend', function handler() {
      self._drawer.hidden = true;
      self._drawer.removeEventListener('transitionend', handler);
    });

    var toggle = this._el.querySelector(SEL.filterToggle);
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }

    this._drawer.removeEventListener('keydown', this._trapBound);
  };

  MallemFilters.prototype._trapFocus = function (e) {
    if (e.key !== 'Tab') return;

    var focusable = Array.prototype.slice.call(
      this._drawer.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (el) { return !el.hidden && el.offsetParent !== null; });

    if (!focusable.length) { e.preventDefault(); return; }

    var first = focusable[0];
    var last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      last.focus(); e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus(); e.preventDefault();
    }
  };

  /* ============================================================
     INIT
     ============================================================ */

  function initFilters(root) {
    var scope = root || document;
    scope.querySelectorAll(SEL.collection).forEach(function (el) {
      if (el._mallemFilters) return; /* already initialised */
      el._mallemFilters = new MallemFilters(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initFilters(); });
  } else {
    initFilters();
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */

  window.MallemFilters = {
    init:    initFilters,
    version: '1.0.0',
  };

}());
