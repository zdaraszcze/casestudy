/* =========================================================
   Portfolio — page behaviour
   - one orchestrated load moment (headline + network boot)
   - index hover lights the matching cluster in the 3D hero
   - in-page viewer with shareable links: #/tr/story, #/ran/screens
   ========================================================= */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

/* ---------- Project data for the viewer ---------- */
const PROJECTS = {
  tr: {
    title: 'Transparency Register Case Manager',
    views: {
      story: { label: 'Full story', src: 'case-studies/transparency-register.html' },
      prototype: { label: 'Prototype', src: 'prototypes/transparency-register.html' },
    },
  },
  onb: {
    title: 'Digital Assisted Onboarding',
    views: {
      story: { label: 'Full story', src: 'case-studies/onboarding.html' },
      prototype: { label: 'Prototype', src: 'prototypes/onboarding.html' },
    },
  },
  gw: {
    title: 'GraphWalk Workspace & Virtual Path',
    views: {
      story: { label: 'Full story', src: 'case-studies/graphwalk.html' },
      prototype: { label: 'Prototype', src: 'prototypes/graphwalk.html' },
    },
  },
  ran: {
    title: 'D&M for SingleRAN',
    views: {
      story: { label: 'Full story', src: 'case-studies/singleran.html' },
      screens: { label: 'Screens', gallery: true },
    },
  },
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
   Boot: split the headline into words, then play once
   ========================================================= */
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
}
document.querySelectorAll('.kinetic').forEach(splitWords);
document.querySelectorAll('.index li').forEach((li, i) => li.style.setProperty('--i', i));
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-booted')));

document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

/* ---------- Top bar turns solid after the hero ---------- */
const topbar = document.querySelector('.topbar');
const onScroll = () => topbar.classList.toggle('is-solid', window.scrollY > window.innerHeight * 0.6);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Star lines: JS fallback where CSS view timelines aren't supported ---------- */
if (!CSS.supports('animation-timeline: view()') && !reducedMotion) {
  const stars = document.querySelectorAll('.star');
  stars.forEach((s) => s.style.setProperty('--fill', 0));
  const style = document.createElement('style');
  style.textContent = '.star::after{transform:scaleY(var(--fill,1));transition:transform .15s linear}';
  document.head.appendChild(style);
  const tick = () => {
    const vh = window.innerHeight;
    stars.forEach((s) => {
      const r = s.getBoundingClientRect();
      const p = (vh * 0.75 - r.top) / (r.height || 1);
      s.style.setProperty('--fill', Math.max(0, Math.min(1, p)).toFixed(3));
    });
  };
  window.addEventListener('scroll', tick, { passive: true });
  tick();
}

/* =========================================================
   3D hero (loaded separately so a WebGL failure never breaks the page)
   ========================================================= */
let hero = null;
const canvas = document.querySelector('.hero-canvas');
(async () => {
  try {
    const test = document.createElement('canvas');
    if (!(test.getContext('webgl2') || test.getContext('webgl'))) throw new Error('no webgl');
    const { createHero } = await import('./hero.js');
    hero = createHero({
      canvas,
      labelEl: document.querySelector('.node-label'),
      reducedMotion,
      onReady: () => canvas.classList.add('is-ready'),
    });
  } catch (e) {
    root.classList.add('no-webgl');
  }
})();

document.querySelectorAll('.index a').forEach((a) => {
  const i = Number(a.dataset.cluster);
  const on = () => { hero?.setActive(i); a.classList.add('is-active'); };
  const off = () => { hero?.setActive(-1); a.classList.remove('is-active'); };
  a.addEventListener('pointerenter', on);
  a.addEventListener('pointerleave', off);
  a.addEventListener('focus', on);
  a.addEventListener('blur', off);
});

/* =========================================================
   Viewer + router
   ========================================================= */
const dialog = document.querySelector('.viewer');
const titleEl = dialog.querySelector('.viewer-title');
const tabsEl = dialog.querySelector('.viewer-tabs');
const bodyEl = dialog.querySelector('.viewer-body');
const frame = dialog.querySelector('.viewer-frame');
const loading = dialog.querySelector('.viewer-loading');
const galleryEl = dialog.querySelector('.gallery');
let openedFromPage = false;
let lastTrigger = null;
let galleryApi = null;

function parseHash() {
  const m = location.hash.match(/^#\/(\w+)\/(\w+)$/);
  if (!m || !PROJECTS[m[1]] || !PROJECTS[m[1]].views[m[2]]) return null;
  return { id: m[1], view: m[2] };
}

function render(route) {
  if (!route) { closeDialog(); return; }
  const p = PROJECTS[route.id];
  const v = p.views[route.view];
  titleEl.textContent = p.title;
  tabsEl.innerHTML = '';
  Object.entries(p.views).forEach(([key, val]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.textContent = val.label;
    b.setAttribute('aria-selected', String(key === route.view));
    b.addEventListener('click', () => { if (key !== route.view) history.replaceState(history.state, '', `#/${route.id}/${key}`), render({ id: route.id, view: key }); });
    tabsEl.appendChild(b);
  });

  if (v.gallery) {
    frame.hidden = true;
    frame.removeAttribute('src');
    loading.hidden = true;
    galleryEl.hidden = false;
    bodyEl.classList.add('is-gallery');
    bodyEl.classList.remove('is-frame');
    galleryApi = galleryApi || buildGallery(galleryEl, RAN_SCREENS);
    galleryApi.show(0);
  } else {
    galleryEl.hidden = true;
    frame.hidden = false;
    bodyEl.classList.remove('is-gallery');
    bodyEl.classList.add('is-frame');
    frame.title = `${p.title}: ${v.label}`;
    if (frame.getAttribute('src') !== v.src) {
      frame.classList.remove('is-loaded');
      loading.hidden = false;
      frame.onload = () => { frame.classList.add('is-loaded'); loading.hidden = true; };
      frame.src = v.src;
    }
  }

  if (!dialog.open) {
    dialog.classList.remove('is-closing');
    dialog.showModal();
    document.body.classList.add('is-locked');
    dialog.querySelector('.viewer-close').focus();
  }
}

function closeDialog() {
  if (!dialog.open) return;
  const finish = () => {
    dialog.close();
    dialog.classList.remove('is-closing');
    document.body.classList.remove('is-locked');
    frame.removeAttribute('src');
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

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-open]');
  if (!t) return;
  e.preventDefault();
  lastTrigger = t;
  const hash = `#/${t.dataset.open}/${t.dataset.view}`;
  if (dialog.open) { history.replaceState(history.state, '', hash); }
  else { history.pushState({ viewer: true }, '', hash); openedFromPage = true; }
  render(parseHash());
});

dialog.querySelector('.viewer-close').addEventListener('click', requestClose);
dialog.addEventListener('cancel', (e) => { e.preventDefault(); requestClose(); }); // Esc
dialog.addEventListener('click', (e) => { if (e.target === dialog) requestClose(); }); // backdrop
window.addEventListener('popstate', () => { openedFromPage = false; render(parseHash()); });

// Deep link on load (e.g. someone shares #/ran/screens)
if (parseHash()) render(parseHash());

/* =========================================================
   Gallery for static screens: zoom, pan, compare, keyboard
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
  inner.className = 'stage-inner';
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
