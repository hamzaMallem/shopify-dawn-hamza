/**
 * Component: MallemHeroSlider
 * Purpose:   Custom element powering the hero slider section
 * Used in:   sections/mallem-hero-slider.liquid
 *
 * Architecture:
 *   Custom element for natural Shopify editor lifecycle (connect/disconnect).
 *   Animation is pure CSS translateX — zero JS layout reads, zero reflows.
 *
 * RTL mechanics:
 *   CSS Flexbox in RTL mode lays slides right-to-left, and overflow:hidden
 *   starts from flex-start (the right edge). So slide[0] is visible at index=0
 *   with no transform. Moving to slide[1] requires translateX(+100%) to shift
 *   the track rightward, revealing slide[1] which sits to the physical left.
 *   In LTR the opposite: translateX(-100%) shifts track left, revealing slide[1]
 *   which sits to the physical right. Sign is the only difference.
 *
 * Pause system:
 *   A Set of named reasons gates autoplay. Any active reason blocks resume.
 *   This prevents "hover leaves while tab is hidden" from restarting autoplay.
 */

class MallemHeroSlider extends HTMLElement {
  connectedCallback() {
    this._track    = this.querySelector('.mallem-hero-slider__track');
    this._slides   = this.querySelectorAll('.mallem-hero-slider__slide');
    this._dots     = this.querySelectorAll('.mallem-hero-slider__dot');
    this._prevBtn  = this.querySelector('[data-prev]');
    this._nextBtn  = this.querySelector('[data-next]');
    this._pauseBtn = this.querySelector('[data-pause-play]');
    this._announce = this.querySelector('[data-slide-announce]');

    this._total          = this._slides.length;
    this._current        = 0;
    this._autoplaySpeed  = parseInt(this.dataset.autoplaySpeed, 10) || 5000;
    this._autoplayEnabled = this.dataset.autoplay === 'true';
    this._timer          = null;
    this._pauseReasons   = new Set();

    // Prefer window.Mallem.isRTL (set by theme RTL system), fall back to dir attr
    this._isRTL = window.Mallem?.isRTL ?? (document.documentElement.dir === 'rtl');

    // Single slide: nothing to set up
    if (this._total < 2) return;

    this._bindEvents();
    this._setupIntersectionObserver();
    this._setupReducedMotion();

    if (this._autoplayEnabled) {
      this._startAutoplay();
    }
  }

  disconnectedCallback() {
    this._stopAutoplay();
    this._io?.disconnect();
    this._motionQuery?.removeEventListener('change', this._onMotionChange);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Navigate to a specific slide index.
   * @param {number} index    - Target slide index (wrap-around applied)
   * @param {string} direction - 'next' | 'prev' — used in dispatched event
   */
  goTo(index, direction = 'next') {
    // Modulo with offset handles negative indices cleanly (prev from 0 → last)
    this._current = ((index % this._total) + this._total) % this._total;

    this._applyTranslate();
    this._updateDots();
    this._announceSlide();

    this.dispatchEvent(new CustomEvent('mallem:slider:slide-changed', {
      bubbles: true,
      detail: {
        currentIndex: this._current,
        totalSlides:  this._total,
        direction,
      },
    }));
  }

  next() { this.goTo(this._current + 1, 'next'); }
  prev() { this.goTo(this._current - 1, 'prev'); }

  // ─── Transform ─────────────────────────────────────────────────────────────

  /**
   * Move the track via CSS translateX.
   *
   * WHY % not px: avoids reading offsetWidth (layout flush). The browser
   * resolves % relative to the element's own width at paint time.
   *
   * WHY sign flip for RTL: in RTL flex the track's flex-start is on the right,
   * so positive translateX reveals later slides (which are to the physical left).
   * In LTR negative translateX reveals later slides (to the physical right).
   */
  _applyTranslate() {
    const sign = this._isRTL ? 1 : -1;

    this._track.classList.add('mallem-hero-slider__track--animating');
    this._track.style.transform = `translateX(calc(${sign * 100}% * ${this._current}))`;

    // WHY once + transitionend: remove will-change after GPU work is done,
    // freeing compositing layer memory on the next frame
    this._track.addEventListener('transitionend', () => {
      this._track.classList.remove('mallem-hero-slider__track--animating');
    }, { once: true });
  }

  // ─── Dots ──────────────────────────────────────────────────────────────────

  _updateDots() {
    this._dots.forEach((dot, i) => {
      const active = i === this._current;
      dot.classList.toggle('mallem-hero-slider__dot--active', active);
      dot.setAttribute('aria-selected', String(active));
      dot.setAttribute('aria-current', String(active));
    });
  }

  // ─── Autoplay ──────────────────────────────────────────────────────────────

  _startAutoplay() {
    if (!this._autoplayEnabled) return;
    this._stopAutoplay();
    this._timer = setInterval(() => this.next(), this._autoplaySpeed);
  }

  _stopAutoplay() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  /**
   * Record a pause reason. Autoplay halts until ALL reasons are cleared.
   * WHY named reasons: if the user hovers while the tab is hidden, mouseleave
   * alone should not restart autoplay — 'visibility' reason must also clear.
   */
  _pause(reason) {
    this._pauseReasons.add(reason);
    this._stopAutoplay();
    this.classList.add('mallem-hero-slider--paused');

    if (this._pauseBtn) {
      this._pauseBtn.setAttribute('aria-label', this._pauseBtn.dataset.playLabel || '');
      this._pauseBtn.setAttribute('aria-pressed', 'true');
    }
  }

  _resume(reason) {
    this._pauseReasons.delete(reason);
    if (this._pauseReasons.size > 0) return;
    if (!this._autoplayEnabled) return;

    this._startAutoplay();
    this.classList.remove('mallem-hero-slider--paused');

    if (this._pauseBtn) {
      this._pauseBtn.setAttribute('aria-label', this._pauseBtn.dataset.pauseLabel || '');
      this._pauseBtn.setAttribute('aria-pressed', 'false');
    }
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  _bindEvents() {
    // Arrow buttons
    this._prevBtn?.addEventListener('click', () => this.prev());
    this._nextBtn?.addEventListener('click', () => this.next());

    // Dots
    this._dots.forEach((dot, i) => {
      dot.addEventListener('click', () => this.goTo(i));
    });

    // Pause/play toggle — separate reason so it survives hover and visibility changes
    this._pauseBtn?.addEventListener('click', () => {
      if (this._pauseReasons.has('user-toggle')) {
        this._resume('user-toggle');
      } else {
        this._pause('user-toggle');
      }
    });

    // Hover — standard UX: slide stands still while user reads it
    this.addEventListener('mouseenter', () => this._pause('hover'));
    this.addEventListener('mouseleave', () => this._resume('hover'));

    // Focus — keyboard users need time to read without the slide changing
    this.addEventListener('focusin', () => this._pause('focus'));
    this.addEventListener('focusout', () => {
      // WHY setTimeout(0): focusout fires before the next element gets focus.
      // Checking immediately would always find document.body as activeElement.
      setTimeout(() => {
        if (!this.contains(document.activeElement)) this._resume('focus');
      }, 0);
    });

    // Page visibility — skip animation budget when tab is in background
    this._onVisibilityChange = () => {
      document.hidden ? this._pause('visibility') : this._resume('visibility');
    };
    document.addEventListener('visibilitychange', this._onVisibilityChange);

    // Keyboard — ArrowLeft/Right when slider root is focused
    // WHY tabindex="0": makes the element focusable so keydown fires here
    this.setAttribute('tabindex', '0');
    this.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        // WHY flip in RTL: ArrowLeft means "toward reading start" which in RTL
        // is rightward — that's the forward/next direction for RTL content
        this._isRTL ? this.next() : this.prev();
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        this._isRTL ? this.prev() : this.next();
        e.preventDefault();
      }
    });

    // Touch swipe — 50px threshold filters accidental taps
    let touchStartX = 0;

    this.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    this.addEventListener('touchend', (e) => {
      const delta = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) < 50) return;

      // WHY direction flip in RTL: in RTL flex layout the next slide is physically
      // to the left. Swiping right (positive delta) moves content right, which
      // reveals what was to the left — that is the "next" slide.
      // In LTR the opposite: swipe left (negative delta) = next.
      const goForward = this._isRTL ? delta > 0 : delta < 0;
      goForward ? this.next() : this.prev();
    }, { passive: true });
  }

  // ─── Intersection Observer ─────────────────────────────────────────────────

  /**
   * Pause when the slider is < 50% in the viewport.
   * WHY 50% threshold: the slider should be meaningfully visible before
   * spending animation budget. Prevents off-screen repaints on long pages.
   */
  _setupIntersectionObserver() {
    this._io = new IntersectionObserver(
      ([entry]) => {
        entry.isIntersecting
          ? this._resume('intersection')
          : this._pause('intersection');
      },
      { threshold: 0.5 }
    );
    this._io.observe(this);
  }

  // ─── Reduced Motion ────────────────────────────────────────────────────────

  /**
   * Respect OS-level prefers-reduced-motion setting.
   * WHY listen to change event: user can toggle this preference mid-session
   * via system settings without reloading the page.
   */
  _setupReducedMotion() {
    this._motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    this._onMotionChange = (e) => {
      e.matches ? this._pause('reduced-motion') : this._resume('reduced-motion');
    };

    this._motionQuery.addEventListener('change', this._onMotionChange);

    // Apply immediately if preference is already set on page load
    if (this._motionQuery.matches) this._pause('reduced-motion');
  }

  // ─── ARIA ──────────────────────────────────────────────────────────────────

  /**
   * Announce the current slide to screen readers.
   * WHY clear then set via rAF: some screen readers only re-read live region
   * content when it changes — wiping first guarantees a re-announcement
   * even if the label text happens to be identical.
   */
  _announceSlide() {
    if (!this._announce) return;
    const label = this._slides[this._current]?.getAttribute('aria-label') || '';
    this._announce.textContent = '';
    requestAnimationFrame(() => {
      this._announce.textContent = label;
    });
  }
}

customElements.define('mallem-hero-slider', MallemHeroSlider);

// Public API — allows external scripts to initialize dynamically injected sliders
window.MallemHeroSlider = {
  /**
   * Initialize any slider elements not yet connected via custom element lifecycle.
   * In practice connectedCallback handles all cases; this exists for edge cases
   * like server-side rendered partial replacements.
   */
  init() {
    document.querySelectorAll('mallem-hero-slider').forEach((el) => {
      if (!el._total) el.connectedCallback?.();
    });
  },
};
