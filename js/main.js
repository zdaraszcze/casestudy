/* =========================================================
   Portfolio — motion system and page behaviour
   GSAP + ScrollTrigger + SplitText, Lenis smooth scroll,
   a Three.js network behind the page, WebGL previews,
   custom cursor, magnetic buttons, and an in-page viewer.
   ========================================================= */
import { mountPreviewGL, setPreviewVelocity } from './preview-gl.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;
const { gsap, ScrollTrigger, SplitText, Lenis } = window;
const hasGsap = !!(gsap && ScrollTrigger);

/* ---------- Viewer content ---------- */
const PROJECTS = {
  onb: { title: 'Digital Assisted Onboarding', views: { story: { label: 'Full story', src: 'case-studies/onboarding.html' }, prototype: { label: 'Prototype', src: 'prototypes/onboarding.html' } } },
  ran: { title: 'D&M for SingleRAN', views: { story: { label: 'Full story', src: 'case-studies/singleran.html' }, screens: { label: 'Screens', gallery: true } } },
  gw:  { title: 'GraphWalk Workspace & Virtual Path', views: { story: { label: 'Full story', src: 'case-studies/graphwalk.html' }, prototype: { label: 'Prototype', src: 'prototypes/graphwalk.html' } } },
  tr:  { title: 'Transparency Register Case Manager', views: { story: { label: 'Full story', src: 'case-studies/transparency-register.html' }, prototype: { label: 'Prototype', src: 'prototypes/transparency-register.html' } } },
};
const RAN_SCREENS = [
  { src: 'assets/singleran/runtime-workspace', w: 1919, h: 1101, title: 'Runtime workspace', text: 'Object tree, live site topology and an object-scoped faults panel. Select a module and its alarms follow.' },
  { compare: true, before: 'assets/singleran/cells-view-v1', after: 'assets/singleran/cells-view-v2', title: 'Cells view, iteration', text: 'Drag to compare. v2 gives cells their own hexagon shape and labels the data stream on the link, so logical mapping can’t be mistaken for physical cabling.' },
  { src: 'assets/singleran/cells-view-v2', w: 2000, h: 1600, title: 'Cells view v2', text: 'Physical links and logical cell/carrier mapping drawn with different line treatments, across GSM, WCDMA and LTE.' },
  { src: 'assets/singleran/state-language', w: 2000, h: 1600, title: 'One state language', text: 'Normal, hover, selected, failed, undetected, alarms and uncommissioned, applied identically to every module type.' },
  { src: 'assets/singleran/state-language-small', w: 1120, h: 536, title: 'State language on small objects', text: 'The same grammar scaled down to controllers, cabinets and antennas.' },
  { src: 'assets/singleran/commissioning-wizard', w: 1908, h: 1102, title: 'Commissioning wizard', text: 'Staged site build with definition, relation and hardware errors split into their own tabs.' },
];

/* =========================================================
   Smooth scroll
   ========================================================= */
let lenis = null;
if (hasGsap) gsap.registerPlugin(ScrollTrigger, ...(SplitText ? [SplitText] : []));
if (Lenis && hasGsap && !reducedMotion) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', (e) => {
    ScrollTrigger.update();
    const v = e.velocity || 0;
    network?.setVelocity(v);
    setPreviewVelocity(Math.max(-1, Math.min(1, v / 40)));
    skewTo?.(Math.max(-4, Math.min(4, v * 0.12)));
  });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToEl = (el) => (lenis ? lenis.scrollTo(el, { offset: 0, duration: 1.6 }) : el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }));

/* =========================================================
   Network behind the page
   ========================================================= */
let network = null;
const canvas = document.querySelector('.network');
const netReady = (async () => {
  try {
    const t = document.createElement('canvas');
    if (!(t.getContext('webgl2') || t.getContext('webgl'))) throw 0;
    const { createNetwork } = await import('./network.js');
    network = createNetwork({ canvas, labelEl: document.querySelector('.node-label'), reducedMotion, onReady: () => canvas.classList.add('is-ready') });
  } catch (e) { root.classList.add('no-webgl'); }
})();

/* =========================================================
   Load sequence
   ========================================================= */
function boot() {
  root.classList.add('is-booted');
  if (!hasGsap || reducedMotion) return;
  const title = document.querySelector('.hero-title');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (SplitText) {
    const split = new SplitText(title, { type: 'lines,words', linesClass: 'line-mask', mask: 'lines' });
    tl.from(split.words, { yPercent: 115, duration: 1.4, stagger: 0.045 }, 0.2);
  } else {
    tl.from(title, { y: 60, opacity: 0, duration: 1.2 }, 0.2);
  }
  tl.from('.index li', { y: 30, opacity: 0, duration: 1, stagger: 0.08 }, 0.9);
}
const start = () => { boot(); setupScroll(); };
(document.fonts?.ready ? document.fonts.ready : Promise.resolve()).then(start);

/* =========================================================
   Scroll choreography
   ========================================================= */
let skewTo = null;
function setupScroll() {
  if (!hasGsap || reducedMotion) { root.classList.add('is-booted'); return; }
  // progress bar
  gsap.to('.scroll-progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

  // hero: headline drifts up and blurs out as you leave
  gsap.to('.hero-copy', { yPercent: -30, opacity: 0, filter: 'blur(10px)', ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: true } });

  // veil fades in behind case studies so text stays readable
  gsap.to('.network-veil', { opacity: 1, ease: 'none', scrollTrigger: { trigger: '#onb', start: 'top bottom', end: 'top 40%', scrub: true } });

  // camera focus per section
  document.querySelectorAll('[data-focus]').forEach((sec) => {
    const i = Number(sec.dataset.focus);
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) netReady.then(() => network?.setFocus(i)); },
    });
  });

  // preview skew with scroll speed
  const previews = gsap.utils.toArray('.preview');
  const setters = previews.map((p) => gsap.quickTo(p, 'skewY', { duration: 0.6, ease: 'power3' }));
  skewTo = (v) => setters.forEach((s) => s(v));

  document.querySelectorAll('.case').forEach((c) => {
    // top rule draws across
    gsap.fromTo(c.querySelector('.case-head'), { '--s': 0 }, { '--s': 1, duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: c, start: 'top 85%' } });
    gsap.from(c.querySelectorAll('.case-meta > div'), { y: 20, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 80%' } });

    // title: lines rise from a mask
    const title = c.querySelector('.case-title');
    if (SplitText) {
      const split = new SplitText(title, { type: 'lines', mask: 'lines' });
      gsap.from(split.lines, { yPercent: 110, duration: 1.3, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: title, start: 'top 82%' } });
    }

    // result: tag, number counts, label
    const res = c.querySelector('.result');
    gsap.from(res.children, { y: 24, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: res, start: 'top 85%' } });
    res.querySelectorAll('[data-count]').forEach((el) => {
      const from = Number(el.dataset.from), to = Number(el.dataset.to), obj = { v: from };
      el.textContent = from;
      gsap.to(obj, { v: to, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: res, start: 'top 85%' }, onUpdate: () => (el.textContent = Math.round(obj.v)) });
    });

    // STAR: line fills as you read, items light up
    const star = c.querySelector('.star');
    const track = document.createElement('span'); track.className = 'star-track';
    const fill = document.createElement('span'); fill.className = 'star-fill';
    star.prepend(track, fill);
    gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: star, start: 'top 75%', end: 'bottom 55%', scrub: true } });
    star.querySelectorAll('li').forEach((li) => {
      gsap.fromTo(li, { opacity: 0.25 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: li, start: 'top 85%', end: 'top 60%', scrub: true } });
    });

    gsap.from(c.querySelectorAll('.case-actions .btn'), { y: 20, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: c.querySelector('.case-actions'), start: 'top 92%' } });

    // preview: window wipes open, image settles
    const pv = c.querySelector('.preview');
    gsap.fromTo(pv, { clipPath: 'inset(0% 0% 100% 0% round 10px)' }, { clipPath: 'inset(0% 0% 0% 0% round 10px)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: pv, start: 'top 85%' } });
    gsap.fromTo(pv.querySelector('.preview-media'), { scale: 1.15 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: pv, start: 'top 85%' } });
  });

  ScrollTrigger.refresh();
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

document.querySelectorAll('.index a').forEach((a) => {
  const i = Number(a.dataset.cluster);
  a.addEventListener('pointerenter', () => { network?.setHover(i); a.classList.add('is-active'); });
  a.addEventListener('pointerleave', () => { network?.setHover(-1); a.classList.remove('is-active'); });
  a.addEventListener('focus', () => network?.setHover(i));
  a.addEventListener('blur', () => network?.setHover(-1));
  a.addEventListener('click', (e) => { e.preventDefault(); network?.setHover(-1); scrollToEl(document.querySelector(a.getAttribute('href'))); });
});
document.querySelector('.skip')?.addEventListener('click', (e) => { e.preventDefault(); scrollToEl(document.querySelector('#onb')); });

/* ---------- WebGL previews (fine pointers only) ---------- */
if (finePointer && !reducedMotion) {
  document.querySelectorAll('.preview-media').forEach((m) => { try { mountPreviewGL(m, { reducedMotion }); } catch (e) {} });
}

/* =========================================================
   Cursor + magnetic buttons
   ========================================================= */
if (finePointer && !reducedMotion && hasGsap) {
  root.classList.add('has-cursor');
  const cur = document.querySelector('.cursor');
  const label = cur.querySelector('.cursor-label');
  const xTo = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const withLabel = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button');
    cur.classList.toggle('is-label', !!withLabel);
    cur.classList.toggle('is-link', !withLabel && !!link);
    label.textContent = withLabel ? withLabel.dataset.cursor : '';
  });
  document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
  document.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));

  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.3); y((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}

/* =========================================================
   Viewer + router (shareable links like #/ran/screens)
   ========================================================= */
const dialog = document.querySelector('.viewer');
const titleEl = dialog.querySelector('.viewer-title');
const tabsEl = dialog.querySelector('.viewer-tabs');
const bodyEl = dialog.querySelector('.viewer-body');
const frame = dialog.querySelector('.viewer-frame');
const loading = dialog.querySelector('.viewer-loading');
const galleryEl = dialog.querySelector('.gallery');
let openedFromPage = false, lastTrigger = null, galleryApi = null;

function parseHash() {
  const m = location.hash.match(/^#\/(\w+)\/(\w+)$/);
  return m && PROJECTS[m[1]]?.views[m[2]] ? { id: m[1], view: m[2] } : null;
}

function render(route) {
  if (!route) return closeDialog();
  const p = PROJECTS[route.id], v = p.views[route.view];
  titleEl.textContent = p.title;
  tabsEl.innerHTML = '';
  Object.entries(p.views).forEach(([key, val]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = val.label;
    b.setAttribute('aria-selected', String(key === route.view));
    b.addEventListener('click', () => { if (key === route.view) return; history.replaceState(history.state, '', `#/${route.id}/${key}`); render({ id: route.id, view: key }); });
    tabsEl.appendChild(b);
  });

  if (v.gallery) {
    frame.hidden = true; frame.removeAttribute('src'); loading.hidden = true;
    galleryEl.hidden = false; bodyEl.classList.add('is-gallery'); bodyEl.classList.remove('is-frame');
    galleryApi = galleryApi || buildGallery(galleryEl, RAN_SCREENS);
    galleryApi.show(0);
  } else {
    galleryEl.hidden = true; frame.hidden = false;
    bodyEl.classList.remove('is-gallery'); bodyEl.classList.add('is-frame');
    frame.title = `${p.title}: ${v.label}`;
    if (frame.getAttribute('src') !== v.src) {
      frame.classList.remove('is-loaded'); loading.hidden = false;
      frame.onload = () => {
        frame.classList.add('is-loaded'); loading.hidden = true;
        // Esc inside the prototype closes the viewer too
        try { frame.contentWindow.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') requestClose(); }); } catch (err) {}
      };
      frame.src = v.src;
    }
  }
  if (!dialog.open) {
    dialog.classList.remove('is-closing');
    dialog.showModal();
    lenis?.stop(); network?.pause(true);
    dialog.querySelector('.viewer-close').focus();
  }
}

function closeDialog() {
  if (!dialog.open) return;
  const finish = () => {
    dialog.close(); dialog.classList.remove('is-closing');
    frame.removeAttribute('src');
    lenis?.start(); network?.pause(false);
    lastTrigger?.focus({ preventScroll: true });
  };
  if (reducedMotion) return finish();
  dialog.classList.add('is-closing');
  dialog.addEventListener('animationend', finish, { once: true });
}

function requestClose() {
  if (openedFromPage) { openedFromPage = false; history.back(); }
  else { history.replaceState(null, '', location.pathname + location.search); render(null); }
}

// Morph: the preview window grows into the viewer, then the viewer takes over
function morphOpen(trigger, done) {
  const pv = trigger.closest('.case')?.querySelector('.preview-media');
  if (!pv || !hasGsap || reducedMotion) return done();
  const r = pv.getBoundingClientRect();
  const img = pv.querySelector('img');
  const m = document.createElement('div');
  m.className = 'morph';
  m.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
  m.style.backgroundPosition = 'left top';
  Object.assign(m.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  document.body.appendChild(m);
  const pad = window.innerWidth <= 640 ? 0 : 12;
  gsap.to(m, {
    left: pad, top: pad + 64, width: window.innerWidth - pad * 2, height: window.innerHeight - pad * 2 - 64,
    borderRadius: pad ? 0 : 0, duration: 0.8, ease: 'expo.inOut',
    onComplete: () => { done(); gsap.to(m, { opacity: 0, duration: 0.35, delay: 0.15, onComplete: () => m.remove() }); },
  });
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-open]');
  if (!t) return;
  e.preventDefault();
  lastTrigger = t;
  const hash = `#/${t.dataset.open}/${t.dataset.view}`;
  if (dialog.open) { history.replaceState(history.state, '', hash); return render(parseHash()); }
  history.pushState({ viewer: true }, '', hash); openedFromPage = true;
  morphOpen(t, () => render(parseHash()));
});
dialog.querySelector('.viewer-close').addEventListener('click', requestClose);
dialog.addEventListener('cancel', (e) => { e.preventDefault(); requestClose(); });
dialog.addEventListener('click', (e) => { if (e.target === dialog) requestClose(); });
window.addEventListener('popstate', () => { openedFromPage = false; render(parseHash()); });
if (parseHash()) render(parseHash());

/* =========================================================
   Gallery for static screens: zoom, pan, compare, keyboard, swipe
   ========================================================= */
function buildGallery(el, items) {
  el.innerHTML = `
    <div class="stage" aria-live="polite">
      <button class="stage-nav prev" type="button" aria-label="Previous screen"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M11 3 5 9l6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="stage-inner"></div>
      <button class="stage-nav next" type="button" aria-label="Next screen"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="m7 3 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>
    <div class="gallery-foot">
      <p class="gallery-caption"></p>
      <span class="gallery-count"></span>
      <div class="thumbs" role="list"></div>
    </div>`;
  const stage = el.querySelector('.stage');
  const inner = el.querySelector('.stage-inner');
  const caption = el.querySelector('.gallery-caption');
  const count = el.querySelector('.gallery-count');
  const thumbs = el.querySelector('.thumbs');

  let index = 0;
  let zoom = { on: false, x: 0, y: 0 };

  items.forEach((it, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'listitem');
    b.setAttribute('aria-label', it.title);
    b.innerHTML = it.compare
      ? `<span class="thumb-compare">Compare v1 / v2</span>`
      : `<img src="${it.src}-thumb.webp" alt="" loading="lazy">`;
    b.addEventListener('click', () => show(i));
    thumbs.appendChild(b);
  });

  function show(i) {
    index = (i + items.length) % items.length;
    const it = items[index];
    zoom = { on: false, x: 0, y: 0 };
    stage.classList.remove('is-zoomed', 'is-compare');
    if (it.compare) {
      stage.classList.add('is-compare');
      inner.innerHTML = `
        <div class="compare" style="--pos:50%">
          <img src="${it.before}.webp" alt="Cells view, version 1" draggable="false">
          <img class="after" src="${it.after}.webp" alt="Cells view, version 2" draggable="false">
          <span class="compare-tag l">v1</span><span class="compare-tag r">v2</span>
          <span class="compare-handle"></span>
          <input type="range" min="0" max="100" value="50" aria-label="Reveal version 2">
        </div>`;
      const cmp = inner.querySelector('.compare');
      inner.querySelector('input').addEventListener('input', (e) => cmp.style.setProperty('--pos', e.target.value + '%'));
    } else {
      inner.innerHTML = `<img src="${it.src}.webp" width="${it.w}" height="${it.h}" alt="${it.title}. ${it.text}" draggable="false">`;
    }
    caption.innerHTML = `<strong>${it.title}.</strong> ${it.text}${it.compare ? '' : ' <span style="color:var(--muted)">Click to zoom.</span>'}`;
    count.textContent = `${index + 1} / ${items.length}`;
    thumbs.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-current', String(j === index)));
    thumbs.children[index].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  // Zoom & pan
  let drag = null;
  const apply = (img) => { img.style.transform = zoom.on ? `translate(${zoom.x}px, ${zoom.y}px) scale(2.2)` : ''; };
  stage.addEventListener('click', (e) => {
    const img = inner.querySelector(':scope > img');
    if (!img || e.target.closest('.stage-nav') || drag?.moved) return;
    const r = img.getBoundingClientRect();
    if (!zoom.on) {
      // zoom toward the clicked point
      const px = e.clientX - r.left, py = e.clientY - r.top;
      zoom = { on: true, x: -px * 1.2, y: -py * 1.2 };
      stage.classList.add('is-zoomed');
    } else {
      zoom = { on: false, x: 0, y: 0 };
      stage.classList.remove('is-zoomed');
    }
    apply(img);
  });
  stage.addEventListener('pointerdown', (e) => {
    if (!zoom.on) return;
    drag = { sx: e.clientX, sy: e.clientY, ox: zoom.x, oy: zoom.y, moved: false };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    zoom.x = drag.ox + dx; zoom.y = drag.oy + dy;
    apply(inner.querySelector(':scope > img'));
  });
  const endDrag = () => { stage.classList.remove('is-dragging'); setTimeout(() => (drag = null), 0); };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  el.querySelector('.prev').addEventListener('click', (e) => { e.stopPropagation(); show(index - 1); });
  el.querySelector('.next').addEventListener('click', (e) => { e.stopPropagation(); show(index + 1); });
  dialog.addEventListener('keydown', (e) => {
    if (el.hidden || e.target.matches('input')) return;
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });

  // Swipe on touch when not zoomed
  let sx = null;
  stage.addEventListener('touchstart', (e) => { if (!zoom.on) sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  });

  return { show };
}
