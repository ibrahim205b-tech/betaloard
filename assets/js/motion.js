// Motion layer. Everything here is progressive: without GSAP, or with
// prefers-reduced-motion, content is simply shown and the store works the same.

const g = () => window.gsap;
const ST = () => window.ScrollTrigger;
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const enabled = () => !!g() && !reduced;

export let lenis = null;
let triggers = [];
let cleanups = [];

export function init() {
  if (!enabled()) { document.documentElement.classList.add('no-motion'); return; }
  g().registerPlugin(ST());
  g().config({ force3D: true });
  if (finePointer && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ST().update);
    g().ticker.add(t => lenis.raf(t * 1000));
    g().ticker.lagSmoothing(0);
  }
  // remove skeleton shimmer once an image has loaded
  document.addEventListener('load', e => { if (e.target.tagName === 'IMG') e.target.classList.add('is-loaded'); }, true);
}

export const stopScroll = () => lenis?.stop();
export const startScroll = () => lenis?.start();
export function scrollTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export function reset() {
  triggers.forEach(t => t.kill());
  triggers = [];
  cleanups.forEach(fn => fn());
  cleanups = [];
}

// ---------- intro (first visit in a session) ----------
export function intro() {
  const el = document.getElementById('intro');
  if (!document.documentElement.classList.contains('has-intro') || !enabled()) { el?.classList.add('is-done'); return Promise.resolve(); }
  try { sessionStorage.setItem('dw_intro', '1'); } catch { /* ignore */ }
  stopScroll();
  return new Promise(resolve => {
    const gs = g();
    let resolved = false;
    const done = () => { if (!resolved) { resolved = true; resolve(); } };
    const tl = gs.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => { el.classList.add('is-done'); startScroll(); } });
    tl.to('.intro__logo', { opacity: 1, scale: 1, duration: 1.1 })
      .to('.intro__word', { opacity: 1, duration: .8 }, '-=.6')
      .to('.intro__line', { width: 140, duration: .9, ease: 'power3.inOut' }, '-=.5')
      .to('.intro__core', { opacity: 0, y: -16, duration: .5, ease: 'power2.in' }, '+=.15')
      .add(done, '-=.05')
      .to('.intro__veil--a', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '<')
      .to('.intro__veil--b', { yPercent: 100, duration: 1.1, ease: 'expo.inOut' }, '<');
    const skip = () => { tl.progress(1); done(); };
    el.style.pointerEvents = 'auto';
    el.addEventListener('click', skip, { once: true });
  });
}

// ---------- page curtain ----------
export function curtain(swap) {
  if (!enabled()) { swap(); return Promise.resolve(); }
  const c = document.getElementById('curtain');
  const s = c.firstElementChild;
  const gs = g();
  return new Promise(resolve => {
    c.classList.add('is-on');
    gs.timeline()
      .fromTo(s, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: .5, ease: 'power3.inOut' })
      .add(() => swap())
      .to(s, { scaleY: 0, transformOrigin: '50% 0%', duration: .7, ease: 'power3.inOut', delay: .05 })
      .add(() => { c.classList.remove('is-on'); resolve(); });
  });
}

// ---------- text splitting (word-level: keeps Arabic letters joined) ----------
export function splitWords(el) {
  if (el.dataset.splitDone) return el.querySelectorAll('.sw > span');
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          const o = document.createElement('span'); o.className = 'sw';
          const i = document.createElement('span'); i.textContent = p;
          o.appendChild(i); frag.appendChild(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
  };
  walk(el);
  el.dataset.splitDone = '1';
  return el.querySelectorAll('.sw > span');
}

function splitChars(el) {
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...n.textContent].forEach(ch => {
          if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
  return el.querySelectorAll('.ch');
}

// ---------- generic reveals for a freshly rendered view ----------
export function bind(root) {
  if (!enabled()) return;
  const gs = g(), st = ST();

  root.querySelectorAll('[data-split]').forEach(el => {
    const words = splitWords(el);
    gs.set(words, { yPercent: 115 });
    triggers.push(st.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gs.to(words, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: .06 })
    }));
  });

  const fades = root.querySelectorAll('[data-fade]');
  if (fades.length) {
    triggers.push(...st.batch(fades, {
      start: 'top 92%', once: true,
      onEnter: batch => gs.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: .08, overwrite: true })
    }));
  }

  root.querySelectorAll('[data-reveal]').forEach(el => {
    const im = el.querySelector('img');
    gs.set(el, { clipPath: 'inset(100% 0% 0% 0%)' });
    if (im) gs.set(im, { scale: 1.3 });
    triggers.push(st.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => {
        gs.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out', clearProps: 'clipPath' });
        if (im) gs.to(im, { scale: 1, duration: 1.8, ease: 'expo.out', clearProps: 'transform' });
      }
    }));
  });

  root.querySelectorAll('[data-speed]').forEach(el => {
    const sp = parseFloat(el.dataset.speed) || 0;
    const tw = gs.to(el, {
      yPercent: sp * 100, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
    });
    triggers.push(tw.scrollTrigger);
  });

  st.refresh();
}

// ---------- home hero ----------
export function hero(root, { delay = 0 } = {}) {
  const h = root.querySelector('.hero');
  if (!h || !enabled()) return;
  const gs = g(), st = ST();
  const word = h.querySelector('[data-hero-word]');
  const chars = splitChars(word);
  const title = h.querySelector('[data-hero-title]');
  const words = splitWords(title);
  const arch = h.querySelector('[data-hero-arch]');
  const archImg = arch.querySelector('img');
  const floats = h.querySelectorAll('.hero__float');
  const ins = h.querySelectorAll('[data-hero-in]');
  const idx = h.querySelectorAll('[data-hero-index] li');
  const sprig = h.querySelector('[data-sprig]');
  const strokes = sprig ? sprig.querySelectorAll('path') : [];
  const buds = sprig ? sprig.querySelectorAll('.bud') : [];

  strokes.forEach(p => { const L = p.getTotalLength(); gs.set(p, { strokeDasharray: L, strokeDashoffset: L }); });

  const tl = gs.timeline({ delay, defaults: { ease: 'expo.out' } });
  tl.from(chars, { yPercent: 70, opacity: 0, rotate: 7, duration: 1.6, stagger: .05 }, 0)
    .fromTo(arch, { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 18px 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 999px 999px 18px 18px)', duration: 1.7, ease: 'expo.inOut' }, .1)
    .from(archImg, { scale: 1.5, duration: 2.4 }, .1)
    .from('.hero__ring', { opacity: 0, scale: .92, duration: 1.4 }, .9)
    .from(floats, { opacity: 0, scale: .6, y: 40, duration: 1.4, stagger: .14 }, .9)
    .from(words, { yPercent: 115, duration: 1.2, stagger: .07 }, .8)
    .from(ins, { opacity: 0, y: 22, duration: 1.1, stagger: .1 }, 1.1)
    .from(idx, { opacity: 0, x: -24, duration: 1, stagger: .07 }, 1.2)
    .to(strokes, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: .15 }, .9)
    .from(buds, { scale: 0, transformOrigin: '50% 50%', duration: .7, stagger: .06, ease: 'back.out(2)' }, 1.6)
    .from('.hero__scroll', { opacity: 0, duration: 1 }, 1.8);

  // scroll-linked depth
  const mk = (target, vars) => { const t = gs.to(target, { ...vars, ease: 'none', scrollTrigger: { trigger: h, start: 'top top', end: 'bottom top', scrub: true } }); triggers.push(t.scrollTrigger); };
  mk(word, { yPercent: 45, opacity: .25 });
  mk(h.querySelector('[data-hero-visual]'), { y: () => -window.innerHeight * .12 });
  mk(h.querySelector('.hero__glow'), { y: () => window.innerHeight * .25 });

  // pointer parallax on desktop
  if (finePointer) {
    const movers = [...floats].map(el => ({ d: parseFloat(el.dataset.depth) || 20, x: gs.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }), y: gs.quickTo(el, 'y', { duration: 1.2, ease: 'power3' }) }));
    const ax = gs.quickTo(arch, 'x', { duration: 1.6, ease: 'power3' });
    const ay = gs.quickTo(arch, 'y', { duration: 1.6, ease: 'power3' });
    const onMove = e => {
      const nx = e.clientX / window.innerWidth - .5, ny = e.clientY / window.innerHeight - .5;
      movers.forEach(m => { m.x(nx * m.d); m.y(ny * m.d); });
      ax(nx * -8); ay(ny * -8);
    };
    h.addEventListener('pointermove', onMove);
    cleanups.push(() => h.removeEventListener('pointermove', onMove));
  }
  st.refresh();
}

export function softSwap(el, html, after) {
  if (!enabled()) { el.innerHTML = html; after?.(); return; }
  const gs = g();
  gs.to(el, {
    opacity: 0, y: 12, duration: .25, ease: 'power2.in', onComplete: () => {
      el.innerHTML = html; after?.();
      gs.to(el, { opacity: 1, y: 0, duration: .6, ease: 'expo.out', clearProps: 'transform' });
    }
  });
}
