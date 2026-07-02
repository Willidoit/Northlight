/**
 * Northlight — script.js
 * Vanilla JS for: nav scroll state, mobile menu,
 * before/after slider, scroll-reveal, FAQ accordion,
 * smooth anchor scrolling, footer year.
 *
 * No frameworks, no build step. Pure ES6+.
 */

'use strict';

/* ============================================================
   UTILITIES
   ============================================================ */

/**
 * Throttle a function to fire at most once per animation frame.
 * @param {Function} fn
 * @returns {Function}
 */
function rafThrottle(fn) {
  let scheduled = false;
  return function (...args) {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        fn.apply(this, args);
        scheduled = false;
      });
    }
  };
}

/* ============================================================
   NAV — Scroll state + mobile menu
   ============================================================ */

(function initNav() {
  const nav        = document.querySelector('.nav-wrapper');
  const hamburger  = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('.mobile-nav-link, .mobile-cta') : [];

  if (!nav) return;

  // --- Scroll state ---
  const onScroll = rafThrottle(() => {
    if (window.scrollY > 24) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on init

  // --- Mobile menu toggle ---
  if (!hamburger || !mobileMenu) return;

  function openMenu() {
    mobileMenu.hidden = false;
    hamburger.setAttribute('aria-expanded', 'true');
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    // Focus first focusable element
    const firstLink = mobileMenu.querySelector('a, button');
    if (firstLink) firstLink.focus();
  }

  function closeMenu() {
    mobileMenu.hidden = true;
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close on link click
  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (
      !nav.contains(e.target) &&
      hamburger.getAttribute('aria-expanded') === 'true'
    ) {
      closeMenu();
    }
  });
})();

/* ============================================================
   BEFORE / AFTER SLIDER
   ============================================================ */

(function initBeforeAfterSlider() {
  const region  = document.getElementById('slider-region');
  if (!region) return;

  const handle  = document.getElementById('ba-handle');
  const divider = document.getElementById('ba-divider');
  const after   = region.querySelector('.ba-after');

  if (!handle || !divider || !after) return;

  let isDragging = false;
  let currentPct = 50; // percentage

  /**
   * Set the slider position (0–100).
   * @param {number} pct
   */
  function setPosition(pct) {
    // Clamp
    pct = Math.max(2, Math.min(98, pct));
    currentPct = pct;

    // Move divider line
    divider.style.left = pct + '%';

    // Clip the after layer
    after.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;

    // Update ARIA
    handle.setAttribute('aria-valuenow', Math.round(pct));
  }

  /**
   * Convert a pointer/touch clientX to a percentage within the region.
   * @param {number} clientX
   * @returns {number}
   */
  function clientXToPct(clientX) {
    const rect = region.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  // Mouse events
  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    region.style.cursor = 'col-resize';
  });

  // Also allow dragging when clicking anywhere on the region
  region.addEventListener('mousedown', (e) => {
    isDragging = true;
    region.style.cursor = 'col-resize';
    setPosition(clientXToPct(e.clientX));
  });

  window.addEventListener('mousemove', rafThrottle((e) => {
    if (!isDragging) return;
    setPosition(clientXToPct(e.clientX));
  }));

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      region.style.cursor = '';
    }
  });

  // Touch events
  region.addEventListener('touchstart', (e) => {
    isDragging = true;
    setPosition(clientXToPct(e.touches[0].clientX));
  }, { passive: true });

  window.addEventListener('touchmove', rafThrottle((e) => {
    if (!isDragging) return;
    setPosition(clientXToPct(e.touches[0].clientX));
  }), { passive: true });

  window.addEventListener('touchend', () => { isDragging = false; });

  // Keyboard support
  handle.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setPosition(currentPct - step); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setPosition(currentPct + step); }
    if (e.key === 'Home')       { e.preventDefault(); setPosition(2); }
    if (e.key === 'End')        { e.preventDefault(); setPosition(98); }
  });

  // Init
  setPosition(50);
})();

/* ============================================================
   SCROLL REVEAL — IntersectionObserver
   ============================================================ */

(function initScrollReveal() {
  // Respect reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    // Instantly reveal all — CSS handles no-transition case
    document.querySelectorAll('[data-reveal]').forEach(el => {
      el.classList.add('revealed');
    });
    return;
  }

  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  elements.forEach(el => observer.observe(el));
})();

/* ============================================================
   FAQ ACCORDION
   ============================================================ */

(function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const btn    = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Close all others
      faqItems.forEach(otherItem => {
        const otherBtn    = otherItem.querySelector('.faq-question');
        const otherAnswer = otherItem.querySelector('.faq-answer');
        if (otherBtn && otherBtn !== btn) {
          otherBtn.setAttribute('aria-expanded', 'false');
          otherAnswer.hidden = true;
        }
      });

      // Toggle this one
      if (isOpen) {
        btn.setAttribute('aria-expanded', 'false');
        answer.hidden = true;
      } else {
        btn.setAttribute('aria-expanded', 'true');
        answer.hidden = false;
        // Smooth scroll to keep it visible
        setTimeout(() => {
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
      }
    });
  });
})();

/* ============================================================
   SMOOTH ANCHOR SCROLLING
   Accounts for the fixed nav height offset.
   ============================================================ */

(function initSmoothScroll() {
  const NAV_HEIGHT = 72; // px — match nav height

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#download') return; // let TODO links through

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ============================================================
   FOOTER YEAR — auto-update copyright
   ============================================================ */

(function setFooterYear() {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

/* ============================================================
   HERO GLOW PARALLAX
   Subtle mouse-tracking glow movement on the hero background.
   Disabled for reduced-motion.
   ============================================================ */

(function initHeroParallax() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const hero   = document.querySelector('.hero');
  const glows  = hero ? hero.querySelectorAll('.glow') : [];
  if (!hero || !glows.length) return;

  // Only run when hero is visible
  const heroObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      hero.addEventListener('mousemove', onMouseMove);
    } else {
      hero.removeEventListener('mousemove', onMouseMove);
    }
  }, { threshold: 0.1 });
  heroObserver.observe(hero);

  const onMouseMove = rafThrottle((e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5 to 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5;

    // Shift each glow slightly in opposite directions for depth
    glows.forEach((glow, i) => {
      const factor = (i % 2 === 0 ? 1 : -1) * (i + 1) * 18;
      glow.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
    });
  });
})();

/* ============================================================
   NAV ACTIVE STATE — highlight current section in nav
   ============================================================ */

(function initNavActive() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const NAV_HEIGHT = 90;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href === `#${id}`) {
            link.style.color = 'var(--text-primary)';
          } else {
            link.style.color = '';
          }
        });
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: `-${NAV_HEIGHT}px 0px -50% 0px`,
  });

  sections.forEach(section => observer.observe(section));
})();
