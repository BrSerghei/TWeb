

(function () {
  'use strict';

  
  function initScrollReveal() {
    const sel = '.card, .chrono-table tr, .games-table tbody tr, '
              + '.section-header, .decade-header, .quick-link-item, .toc';
    const targets = document.querySelectorAll(sel);

    targets.forEach((el, i) => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
      el.style.transitionDelay = (i % 5) * 0.07 + 's';
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.style.opacity   = '1';
        e.target.style.transform = 'translateY(0)';
        io.unobserve(e.target);
      });
    }, { threshold: 0.06 });

    targets.forEach(el => io.observe(el));
  }

  
  function initCursorTrail() {
    const COUNT = 14;
    const dots  = [];

    const style = document.createElement('style');
    style.textContent = `
      .re-cursor-dot {
        position: fixed; border-radius: 50%; pointer-events: none;
        z-index: 99998; transform: translate(-50%, -50%);
        mix-blend-mode: screen; transition: opacity 0.4s;
      }
    `;
    document.head.appendChild(style);

    for (let i = 0; i < COUNT; i++) {
      const d = document.createElement('div');
      d.className = 're-cursor-dot';
      const size = (6 - i * 0.32).toFixed(1) + 'px';
      d.style.cssText = `width:${size};height:${size};`
        + `background:hsl(0,80%,${35 - i * 1.5}%);`
        + `opacity:${(1 - i / COUNT).toFixed(2)};`;
      document.body.appendChild(d);
      dots.push({ el: d, x: -200, y: -200 });
    }

    let mx = -200, my = -200, head = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    (function tick() {
      dots[head].x = mx; dots[head].y = my;
      dots[head].el.style.left = mx + 'px'; dots[head].el.style.top = my + 'px';

      for (let i = 1; i < COUNT; i++) {
        const a = dots[(head - i + COUNT) % COUNT];
        const b = dots[(head - i + 1 + COUNT) % COUNT];
        a.x += (b.x - a.x) * 0.42;
        a.y += (b.y - a.y) * 0.42;
        a.el.style.left = a.x + 'px'; a.el.style.top = a.y + 'px';
      }

      head = (head + 1) % COUNT;
      requestAnimationFrame(tick);
    }());
  }

  
  function initTypewriter() {
    const els = document.querySelectorAll('.section-header p, .decade-header p');
    const io  = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting || e.target.dataset.typed) return;
        e.target.dataset.typed = '1';
        const full = e.target.textContent;
        e.target.textContent = '';
        e.target.style.borderRight = '2px solid #8b0000';
        let idx = 0;
        const iv = setInterval(() => {
          e.target.textContent = full.slice(0, ++idx);
          if (idx >= full.length) {
            clearInterval(iv);
            setTimeout(() => (e.target.style.borderRight = 'none'), 600);
          }
        }, 16);
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    els.forEach(el => io.observe(el));
  }

  
  function initScrollGlitch() {
    let lastY = window.scrollY, active = false;

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99997;'
      + 'opacity:0;mix-blend-mode:screen;'
      + 'background:repeating-linear-gradient(0deg,transparent,transparent 2px,'
      + 'rgba(139,0,0,0.05) 2px,rgba(139,0,0,0.05) 4px);transition:opacity 0.05s;';
    document.body.appendChild(ov);

    window.addEventListener('scroll', () => {
      const delta = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      if (delta > 90 && !active && Math.random() < 0.22) {
        active = true;
        ov.style.opacity   = '1';
        ov.style.transform = `translateX(${(Math.random() - 0.5) * 5}px)`;
        setTimeout(() => {
          ov.style.opacity = '0'; ov.style.transform = 'translateX(0)';
          setTimeout(() => { active = false; }, 200);
        }, 70);
      }
    }, { passive: true });
  }

  
  function initBloodLines() {
    const s = document.createElement('style');
    s.textContent = `
      hr.blood-line {
        transform: scaleX(0); transform-origin: left;
        transition: transform 0.9s cubic-bezier(0.16,1,0.3,1);
        overflow: visible;
      }
      hr.blood-line.bl-revealed { transform: scaleX(1); }
      hr.blood-line::after {
        transition: height 1.1s ease 0.85s;
      }
      hr.blood-line.bl-revealed::after { height: 18px; }
    `;
    document.head.appendChild(s);

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('bl-revealed'); io.unobserve(e.target); }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('hr.blood-line').forEach(hr => io.observe(hr));
  }

  
  function initYearCounters() {
    const cells = document.querySelectorAll('.year-cell, .games-table td:nth-child(3)');
    const io    = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting || e.target.dataset.counted) return;
        const target = parseInt(e.target.textContent, 10);
        if (isNaN(target)) return;
        e.target.dataset.counted = '1';
        const start = target - 4, dur = 420, t0 = performance.now();
        (function step(now) {
          const p = Math.min((now - t0) / dur, 1);
          e.target.textContent = Math.round(start + (target - start) * p);
          if (p < 1) requestAnimationFrame(step); else e.target.textContent = target;
        }(performance.now()));
        io.unobserve(e.target);
      });
    }, { threshold: 0.8 });
    cells.forEach(c => io.observe(c));
  }

  
  function initNavPulse() {
    const active = document.querySelector('.nav-list a.active');
    if (!active) return;
    let n = 0;
    const id = setInterval(() => {
      active.style.boxShadow = (n % 2 === 0)
        ? 'inset 0 0 14px rgba(204,17,17,0.35)' : 'none';
      if (++n >= 4) clearInterval(id);
    }, 380);
  }

  
  function init() {
    initScrollReveal();
    initCursorTrail();
    initTypewriter();
    initScrollGlitch();
    initBloodLines();
    initYearCounters();
    initNavPulse();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

}());
