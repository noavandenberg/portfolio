/* ============================================================
   NOA VAN DEN BERG — PORTFOLIO
   Vanilla JavaScript, geen dependencies.
   ------------------------------------------------------------
   01. Helpers
   02. Loader
   03. Custom cursor
   04. Magnetic buttons
   05. Scroll reveal
   06. Floating parallax shapes
   07. Project hover
   08. Navigation & mobile menu
   09. Misc
============================================================ */

(function () {
  'use strict';

  /* ==========================================================
     01. HELPERS
  ========================================================== */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fineQuery   = window.matchMedia('(hover: hover) and (pointer: fine)');

  const reduced   = () => motionQuery.matches;
  const canHover  = () => fineQuery.matches && !reduced();

  const lerp  = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);


  /* ==========================================================
     02. LOADER
  ========================================================== */
  (function loader() {
    const el = $('#loader');
    if (!el) return;

    if (reduced()) { el.remove(); return; }

    document.body.classList.add('is-locked');

    // Vul de balk zodra de eerste frame getekend is
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('is-filled'));
    });

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.classList.add('is-done');
      document.body.classList.remove('is-locked');
      window.setTimeout(() => el.remove(), 1200);
    };

    // Wacht op fonts/afbeeldingen, maar nooit langer dan 2.2s
    window.addEventListener('load', () => window.setTimeout(finish, 550));
    window.setTimeout(finish, 2200);
  })();


  /* ==========================================================
     03. CUSTOM CURSOR
  ========================================================== */
  (function customCursor() {
    const ring = $('#cursor');
    const dot  = $('#cursorDot');
    const label = ring ? $('.cursor__label', ring) : null;
    if (!ring || !dot || !canHover()) return;

    document.body.classList.add('has-cursor');

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    }, { passive: true });

    (function render() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(render);
    })();

    // Cursor-states op interactieve elementen
    const targets = $$('a, button, [data-cursor]');
    targets.forEach((el) => {
      const mode = el.dataset.cursor === 'view' ? 'view' : 'link';
      el.addEventListener('mouseenter', () => {
        ring.classList.add(mode === 'view' ? 'is-view' : 'is-link');
        if (mode === 'view' && label) label.textContent = 'view';
      });
      el.addEventListener('mouseleave', () => {
        ring.classList.remove('is-view', 'is-link');
        if (label) label.textContent = '';
      });
    });

    // Verberg de cursor als de muis het venster verlaat
    document.addEventListener('mouseleave', () => document.body.classList.remove('has-cursor'));
    document.addEventListener('mouseenter', () => document.body.classList.add('has-cursor'));
  })();


  /* ==========================================================
     04. MAGNETIC BUTTONS
  ========================================================== */
  (function magnetic() {
    const items = $$('[data-magnetic]');
    if (!items.length || !canHover()) return;

    const STRENGTH = 0.3;
    const MAX = 14;

    items.forEach((el) => {
      el.addEventListener('mouseenter', () => el.classList.add('is-magnetic'));

      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = clamp((e.clientX - (r.left + r.width / 2)) * STRENGTH, -MAX, MAX);
        const y = clamp((e.clientY - (r.top + r.height / 2)) * STRENGTH, -MAX, MAX);
        el.style.transform = `translate(${x}px, ${y}px)`;
      });

      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  })();


  /* ==========================================================
     05. SCROLL REVEAL
  ========================================================== */
  (function reveal() {
    const items = $$('[data-reveal]');
    if (!items.length) return;

    if (reduced() || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    items.forEach((el) => {
      const d = parseInt(el.dataset.delay || '0', 10);
      if (d) el.style.setProperty('--d', d + 'ms');
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        io.unobserve(el);
        // Delay opruimen zodat latere interacties (magnetic) niet vertragen
        const d = parseInt(el.dataset.delay || '0', 10);
        window.setTimeout(() => el.style.setProperty('--d', '0ms'), d + 1200);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach((el) => io.observe(el));
  })();


  /* ==========================================================
     06. FLOATING PARALLAX SHAPES
     Gebruikt de losse `translate`-property, zodat CSS-animaties
     op `transform` (morph / spin) blijven werken.
  ========================================================== */
  (function floatingShapes() {
    const shapes = $$('[data-float]');
    if (!shapes.length || !canHover()) return;

    let tx = 0, ty = 0, cx = 0, cy = 0, active = false;

    window.addEventListener('mousemove', (e) => {
      tx = (e.clientX / window.innerWidth  - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!active) { active = true; loop(); }
    }, { passive: true });

    function loop() {
      cx = lerp(cx, tx, 0.045);
      cy = lerp(cy, ty, 0.045);

      shapes.forEach((el) => {
        const f = parseFloat(el.dataset.float) || 0;
        el.style.translate = `${cx * f * 260}px ${cy * f * 200}px`;
      });

      requestAnimationFrame(loop);
    }
  })();


  /* ==========================================================
     07. PROJECT HOVER
     De afbeelding beweegt subtiel mee met de cursor.
  ========================================================== */
  (function projectHover() {
    const links = $$('.project__link');
    if (!links.length || !canHover()) return;

    links.forEach((link) => {
      link.addEventListener('mousemove', (e) => {
        const r = link.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width  - 0.5) * 2;
        const y = ((e.clientY - r.top)  / r.height - 0.5) * 2;
        link.style.setProperty('--mx', (x * 12).toFixed(2) + 'px');
        link.style.setProperty('--my', (y * 12).toFixed(2) + 'px');
      });

      link.addEventListener('mouseleave', () => {
        link.style.setProperty('--mx', '0px');
        link.style.setProperty('--my', '0px');
      });
    });
  })();


  /* ==========================================================
     08. NAVIGATION & MOBILE MENU
  ========================================================== */
  (function navigation() {
    const nav    = $('#nav');
    const toggle = $('#navToggle');
    const menu   = $('#mobileMenu');

    // Sticky nav state
    if (nav) {
      const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (!toggle || !menu) return;

    let open = false;

    const setMenu = (state) => {
      open = state;
      toggle.setAttribute('aria-expanded', String(state));
      toggle.setAttribute('aria-label', state ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('is-locked', state);

      if (state) {
        menu.hidden = false;
        requestAnimationFrame(() => menu.classList.add('is-open'));
      } else {
        menu.classList.remove('is-open');
        window.setTimeout(() => { if (!open) menu.hidden = true; }, 450);
      }
    };

    toggle.addEventListener('click', () => setMenu(!open));

    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && open) { setMenu(false); toggle.focus(); }
    });

    window.addEventListener('resize', () => {
      if (open && window.innerWidth > 860) setMenu(false);
    });
  })();


  /* ==========================================================
     09. MISC
  ========================================================== */
  (function misc() {
    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
  })();

})();
