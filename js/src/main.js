/* Portfolio: the journey (Discover, Define, Develop, Deliver), the four projects, their STAR, and the in-page viewer.
   Source of js/app.js; rebuild with: npx esbuild js/src/main.js --bundle --minify --format=esm --outfile=js/app.js */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

THREE.ColorManagement.enabled = false;   // colours are written as they were designed, with no conversion

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

/* ---------- Project content ---------- */
const PROJECTS = [
  { id: 'onb', key: '--onb', name: 'Digital Assisted Onboarding', domain: 'Private banking', title: 'From 35–55 days toward a two-week target for complex cases.', num: '35–55 → ≤14', tag: 'MVP released', count: { pre: '<span class="from">35–55</span> → ≤', from: 55, to: 14, post: '' }, lbl: 'days for complex cases (target)', cta: 'Try the prototype',
    star: [['Situation', "Complex client onboarding at JPB took 35 to 55 days across more than 20 systems, and only about 1 in 5 due diligence files passed first time."], ['Action', "I led the research with 38 people over 10 weeks, then designed a flow where advisors enter data once and the system checks it right away."], ['Result', "MVP released, feedback positive. The 14-day goal isn't measured yet."]],
    note: '' },
  { id: 'ran', key: '--ran', name: 'D&M for SingleRAN', domain: 'Telecom operations', title: 'One live view of the whole base station.', num: '3 → 1', tag: 'Shipped, in use', count: { pre: '<span class="from">3</span> → ', from: 3, to: 1, post: '' }, lbl: 'technology views became one live map: GSM, WCDMA and LTE', cta: 'Explore the screens',
    star: [['Situation', "A single base station runs GSM, WCDMA and LTE on shared hardware, but engineers diagnosed it from fault codes and command-line output, so time went into finding the failed module before any repair."], ['Action', "As lead UX designer and researcher, I spent about six months on a console that draws the whole site as one live map, with each alarm on the module that raised it."], ['Result', "Shipped and in use. No timed baseline, so no before and after numbers."]],
    note: '' },
  { id: 'gw', key: '--gw', name: 'GraphWalk Virtual Path', domain: 'Graph analytics', title: 'From hand-written JSON to a guided path builder.', num: '0', tag: 'Clickable prototype', count: { pre: '', from: 9, to: 0, post: '' }, lbl: 'lines of hand-written JSON to create a path (expected)', cta: 'Try the prototype',
    star: [['Situation', "Investigators kept hundreds of saved items in flat tiles, and creating a Virtual Path meant hand-writing JSON, so only engineers did it."], ['Action', "Working from the product and its documentation, I redesigned the Workspace into four areas and designed a path builder with named lists, live checks and review by the data model owner."], ['Result', "Clickable prototype, not tested with users yet."]],
    note: '' },
  { id: 'tr', key: '--tr', name: 'Transparency Register', domain: 'Banking compliance', title: 'No case closes without a reason on record.', num: '30', tag: 'MVP released', count: { pre: '', from: 0, to: 30, post: '' }, lbl: 'days to report once the correction deadline passes, on every case', cta: 'Try the prototype',
    star: [['Situation', "Swiss banks now have to act on any mismatch between their own records and the federal Transparency Register, within fixed deadlines. Officers compared the two by hand and tracked dates in spreadsheets."], ['Action', "After six interviews and three shadowing sessions, I designed the case manager that replaced that."], ['Result', "MVP released, no measured results yet."]],
    note: '' },
  ];
const CARD = [['35–55 → ≤14', 'days, complex cases (target)'], ['3 → 1', 'technology views became one live map'], ['0', 'lines of hand-written JSON (expected)'], ['30', 'days to report, on every case']];
const THUMBS = { onb: 'assets/previews/onboarding.webp', ran: 'assets/singleran/runtime-workspace.webp', gw: 'assets/previews/graphwalk.webp', tr: 'assets/previews/transparency-register.webp' };
const DOCS = {
  onb: { story: 'case-studies/onboarding.html', proto: 'prototypes/onboarding.html' },
  ran: { story: 'case-studies/singleran.html', screens: true },
  gw: { story: 'case-studies/graphwalk.html', proto: 'prototypes/graphwalk.html' },
  tr: { story: 'case-studies/transparency-register.html', proto: 'prototypes/transparency-register.html' },
};
const RAN_SCREENS = [
  { src: 'assets/singleran/runtime-workspace', w: 1919, h: 1101, title: 'Runtime workspace', text: 'Object tree, live site topology and an object-scoped faults panel. Select a module and its alarms follow.' },
  { compare: true, before: 'assets/singleran/cells-view-v1', after: 'assets/singleran/cells-view-v2', title: 'Cells view, iteration', text: 'Drag to compare. v2 gives cells their own hexagon shape and labels the data stream on the link, so logical mapping can’t be mistaken for physical cabling.' },
  { src: 'assets/singleran/cells-view-v2', w: 2000, h: 1600, title: 'Cells view v2', text: 'Physical links and logical cell/carrier mapping drawn with different line treatments, across GSM, WCDMA and LTE.' },
  { src: 'assets/singleran/state-language', w: 2000, h: 1600, title: 'One state language', text: 'Normal, hover, selected, failed, undetected, alarms and uncommissioned, applied identically to every module type.' },
  { src: 'assets/singleran/state-language-small', w: 1120, h: 536, title: 'State language on small objects', text: 'The same grammar scaled down to controllers, cabinets and antennas.' },
  { src: 'assets/singleran/commissioning-wizard', w: 1908, h: 1102, title: 'Commissioning wizard', text: 'Staged site build with definition, relation and hardware errors split into their own tabs.' },
  ];

/* ---------- State ---------- */
const STAGES = 4, DUR = 1800;
let cur = 0, s = 0, from = 0, to = 0, t0 = 0, anim = false;   // stage index, and the animated stage value the scene follows
let caseIdx = -1, caseLock = 0;
const ptr = { tx: 0, ty: 0, nx: 9, ny: 9, energy: 0, type: 'mouse', lx: null, ly: null };

/* ---------- DOM ---------- */
const body = document.body, hero = document.getElementById('hero'), main = document.querySelector('main');
const list = document.querySelector('.projects');
list.innerHTML = PROJECTS.map((p, i) => `<li><button class="pcard" type="button" data-i="${i}" style="--c:var(${p.key});--k:${i}"><span class="pin"><span class="card-domain">${esc(p.domain)}</span><span class="card-title">${esc(p.name)}</span><span class="card-num">${esc(CARD[i][0])}</span><span class="card-lbl">${esc(CARD[i][1])}</span></span></button></li>`).join('');
const pcards = [...list.querySelectorAll('.pcard')];
const caps = [...document.querySelectorAll('.cap')], navB = [...document.querySelectorAll('.dd button')], fill = document.querySelector('.dd .track i');
const caseEl = document.querySelector('.case'), pv = document.querySelector('.pv');
const ddEl = document.querySelector('.dd'), idEl = document.querySelector('.identity'), skipEl = document.querySelector('.skip'), cueEl = document.querySelector('.cue');
const stills = [...document.querySelectorAll('.stills img')];
const loadStill = (i) => { const im = stills[i]; if (im && !im.getAttribute('src')) im.src = im.dataset.src; };

/* ---------- Stages ---------- */
function captionTo(n, dir) {
  caps.forEach((c, i) => { if (i !== n && c.classList.contains('on')) { c.classList.remove('on', 'up', 'down'); c.classList.add(dir > 0 ? 'up' : 'down'); } });
  const c = caps[n]; c.classList.add('now'); c.classList.remove('up', 'down'); c.classList.add(dir > 0 ? 'down' : 'up');
  void c.offsetWidth; c.classList.remove('now', 'up', 'down'); c.classList.add('on');
}
const busy = () => (anim && performance.now() - t0 < DUR) || performance.now() < caseLock;   // by the clock, so a slow frame never blocks the next step
function markStage(n) {
  navB.forEach((b, i) => { b.setAttribute('aria-current', i === n ? 'step' : 'false'); b.classList.toggle('done', i < n); });
  fill.style.transform = `scaleX(${n / (STAGES - 1)})`;
  body.dataset.stage = n;
  if (n === 3) store.set('mdaiux-seen', '1');   // next visit opens on the projects
  syncInert();
}
function go(n) {
  n = clamp(n, 0, STAGES - 1); if (n === cur || busy()) return;
  if (vOpen) closeViewer();
  if (caseIdx >= 0) { closeCase(); history.replaceState(null, '', location.pathname + location.search); }
  const dir = Math.sign(n - cur); from = s; to = n; cur = n; t0 = performance.now();
  if (reduced) s = n; else anim = true;
  captionTo(n, dir); markStage(n);
}
function setStageNow(n) {   // deep links and return visits: arrive without the journey
  if (cur !== n) captionTo(n, Math.sign(n - cur) || 1);
  cur = n; s = n; from = n; to = n; anim = false; markStage(n);
}
// inside an open project, a step moves to the next or previous project; past either end it returns to the four projects
function step(dir) {
  if (caseIdx >= 0) { if (busy()) return; const j = caseIdx + dir; if (j < 0 || j > 3) navBack('#'); else switchCase(j); return; }
  go(cur + dir);
}
// whatever isn't on screen can't take keyboard focus
function syncInert() {
  const inCase = caseIdx >= 0;
  list.inert = cur !== 3 || inCase; pv.inert = !inCase; ddEl.inert = inCase; idEl.inert = inCase; skipEl.inert = cur === 3; cueEl.inert = cur !== 0;
}

/* ---------- Case panel: STAR, preview, actions, scroll for the next project ---------- */
let countRaf = 0;
function fillCase(i) {
  const p = PROJECTS[i];
  caseEl.style.setProperty('--c', `var(${p.key})`); pv.style.setProperty('--c', `var(${p.key})`);
  caseEl.querySelector('.eyebrow').textContent = p.domain; caseEl.querySelector('h2').textContent = p.title; caseEl.querySelector('.tag').textContent = p.tag;
  caseEl.querySelector('.num').innerHTML = p.count.pre + '<span class="cnt">' + p.count.to + '</span>' + p.count.post; caseEl.querySelector('.lbl').textContent = p.lbl;
  const ol = caseEl.querySelector('ol'); ol.querySelectorAll('li').forEach((li) => li.remove());
  ol.insertAdjacentHTML('beforeend', p.star.map(([k, t], j) => `<li class="anim" style="--d:3;transition-delay:${620 + j * 270}ms"><b>${k}</b>${esc(t)}</li>`).join(''));
  caseEl.querySelector('.act-proto-t').textContent = p.cta; caseEl.querySelector('.next-count').textContent = `${i + 1} of 4`;
  caseEl.querySelector('.next-text').innerHTML = i < 3 ? `Scroll for <b>${esc(PROJECTS[i + 1].name)}</b>` : 'Scroll to return to <b>all projects</b>';
  pv.querySelector('img').src = THUMBS[p.id]; pv.querySelector('.pv-label').textContent = p.cta; caseEl.scrollTop = 0;
}
function countUp(i, delay) {
  const c = PROJECTS[i].count, el = caseEl.querySelector('.cnt'); cancelAnimationFrame(countRaf);
  if (reduced) { el.textContent = c.to; return; }
  el.textContent = c.from; const start = performance.now() + delay;
  const st = (now) => { const t = clamp((now - start) / 1300, 0, 1), e = 1 - Math.pow(1 - t, 3); el.textContent = Math.round(lerp(c.from, c.to, e)); if (t < 1) countRaf = requestAnimationFrame(st); };
  countRaf = requestAnimationFrame(st);
}
function openCase(i, fromHistory) {
  if (cur !== 3) setStageNow(3);
  caseIdx = i; syncInert(); fillCase(i); void caseEl.offsetWidth;
  caseEl.classList.add('open'); pv.classList.add('on'); body.classList.add('in-case');
  countUp(i, 700); caseLock = performance.now() + 900;
  if (!fromHistory) history.pushState({ pf: 'case' }, '', `#/${PROJECTS[i].id}`);
  setTimeout(() => caseEl.querySelector('.back').focus({ preventScroll: true }), 400);
}
function closeCase() {
  if (caseIdx < 0) return;
  const i = caseIdx; caseIdx = -1; syncInert();
  caseEl.classList.add('leaving'); pv.classList.add('leaving'); body.classList.remove('in-case'); caseLock = performance.now() + 600;
  setTimeout(() => { caseEl.classList.remove('open', 'leaving'); pv.classList.remove('on', 'leaving'); if (cur === 3 && !vOpen) pcards[i].focus({ preventScroll: true }); }, 340);
}
function switchCase(j) {
  caseIdx = j; caseLock = performance.now() + 1000; caseEl.classList.add('leaving'); pv.classList.add('leaving');
  history.replaceState(history.state, '', `#/${PROJECTS[j].id}`);
  setTimeout(() => { caseEl.classList.remove('open', 'leaving'); pv.classList.remove('leaving'); fillCase(j); void caseEl.offsetWidth; caseEl.classList.add('open'); countUp(j, 600); }, 340);
}
pcards.forEach((b, i) => b.addEventListener('click', () => { if (cur === 3 && !busy()) openCase(i); }));
caseEl.querySelector('.back').addEventListener('click', () => navBack('#'));

/* ---------- Viewer: full story, prototype or screens, in the page (never a new tab) ---------- */
const viewer = document.querySelector('.viewer'), vTabs = viewer.querySelector('.viewer-tabs'), galleryEl = viewer.querySelector('.gallery');
let vFrame = viewer.querySelector('iframe'), vOpen = false, vOpenedAt = 0, vReturn = null, galleryApi = null;
// a fresh iframe for every document: its first load replaces a blank page instead of adding a history step
function freshFrame() {
  const f = document.createElement('iframe');
  f.title = vFrame.title; f.hidden = vFrame.hidden;
  vFrame.replaceWith(f); vFrame = f;
  f.addEventListener('load', () => {
    if (f.getAttribute('src')) f.classList.add('ready');   // the light document fades in over the dark viewer
    try {
      const w = f.contentWindow, doc = f.contentDocument;
      w.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeViewerNow(); });
      // in-page section links scroll instead of adding history steps
      doc.addEventListener('click', (e) => {
        const a = e.target.closest && e.target.closest('a[href^="#"]');
        if (!a) return;
        const id = decodeURIComponent(a.getAttribute('href').slice(1));
        const t = id && (doc.getElementById(id) || doc.querySelector(`[name="${id}"]`));
        e.preventDefault();
        if (t) t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }, true);
      // documents that change their own URL hash stop adding history steps
      w.history.pushState = (st, t, url) => w.history.replaceState(st, t, url);
    } catch (err) {}
  });
  return f;
}
function openViewer(view, fromHistory) {
  if (caseIdx < 0) return;
  const p = PROJECTS[caseIdx], d = DOCS[p.id];
  if (view === 'proto' && !d.proto) view = 'screens';
  if (!d[view]) return;
  viewer.style.setProperty('--c', `var(${p.key})`);
  viewer.querySelector('.viewer-title').textContent = p.name;
  vTabs.innerHTML = '';
  [['story', 'Full story'], ['proto', 'Prototype'], ['screens', 'Screens']].filter(([k]) => d[k]).forEach(([k, label]) => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = label;
    b.setAttribute('aria-selected', String(k === view));
    b.addEventListener('click', () => { if (k !== view) { history.replaceState(history.state, '', `#/${p.id}/${k}`); openViewer(k, true); } });
    vTabs.appendChild(b);
  });
  if (view === 'screens') {
    if (vFrame.getAttribute('src')) freshFrame();
    vFrame.hidden = true; galleryEl.hidden = false;
    galleryApi = galleryApi || buildGallery(galleryEl, RAN_SCREENS);
    galleryApi.show(0);
  } else {
    galleryEl.hidden = true; vFrame.hidden = false;
    vFrame.title = `${p.name}: ${view === 'story' ? 'full story' : 'prototype'}`;
    if (vFrame.getAttribute('src') !== d[view]) { freshFrame(); vFrame.src = d[view]; }
  }
  if (!fromHistory && !vOpen) history.pushState({ pf: 'view' }, '', `#/${p.id}/${view}`);
  if (!vOpen) { vReturn = document.activeElement; vOpen = true; vOpenedAt = performance.now(); main.inert = true; viewer.inert = false; viewer.classList.add('on'); viewer.querySelector('.viewer-close').focus(); }
}
function closeViewer() {
  if (!vOpen) return; vOpen = false; main.inert = false; viewer.inert = true; viewer.classList.remove('on');
  setTimeout(() => { if (!vOpen) { freshFrame(); vFrame.hidden = true; } }, 450);   // drop the document (and anything it did) completely
  vReturn?.focus({ preventScroll: true });
}
// close on the first click, then tidy the address bar without depending on what happened inside the document
function closeViewerNow() {
  if (!vOpen) return;
  const id = caseIdx >= 0 ? PROJECTS[caseIdx].id : '';
  closeViewer();
  if (history.state && history.state.pf === 'view') history.back();
  else history.replaceState(history.state, '', id ? `#/${id}` : '#');
}
// closing goes back in history when we added the entry ourselves, so the browser's back button and the page agree
function navBack(fallback) {
  if (history.state && history.state.pf) history.back();
  else { history.replaceState(null, '', fallback); route(); }
}
viewer.querySelector('.viewer-close').addEventListener('click', closeViewerNow);
freshFrame();
const openProto = () => openViewer(PROJECTS[caseIdx].id === 'ran' ? 'screens' : 'proto');
caseEl.querySelector('.act-story').addEventListener('click', () => openViewer('story'));
caseEl.querySelector('.act-proto').addEventListener('click', openProto);
pv.addEventListener('click', openProto);

/* ---------- Router: #/projects, #/onb, #/onb/story, #/ran/screens ---------- */
function route() {
  const m = location.hash.match(/^#\/(\w+)(?:\/(\w+))?$/);
  const idx = m ? PROJECTS.findIndex((p) => p.id === m[1]) : -1;
  if (m && m[1] === 'projects') { if (vOpen) closeViewer(); if (caseIdx >= 0) closeCase(); setStageNow(3); return; }
  if (idx < 0) { if (vOpen) closeViewer(); if (caseIdx >= 0) closeCase(); return; }
  if (caseIdx < 0) openCase(idx, true);
  else if (caseIdx !== idx) { if (vOpen) closeViewer(); switchCase(idx); }
  if (m[2]) openViewer(m[2], true);
  else if (vOpen) closeViewer();
}
addEventListener('popstate', route);

/* ---------- Input: one gesture = one step ---------- */
navB.forEach((b, i) => b.addEventListener('click', () => go(i)));
skipEl.addEventListener('click', () => { go(STAGES - 1); setTimeout(() => { if (cur === 3 && caseIdx < 0) pcards[0].focus({ preventScroll: true }); }, reduced ? 50 : 1150); });
cueEl.addEventListener('click', () => step(1));
// a gesture is a burst of wheel events; it moves one step, and the rest of it (trackpad inertia) is swallowed
let acc = 0, lastWheel = 0, used = false;
addEventListener('wheel', (e) => {
  if (vOpen) return;
  if (caseIdx >= 0 && e.target.closest && e.target.closest('.case') && caseEl.scrollHeight > caseEl.clientHeight + 48) {
    const dn = e.deltaY > 0; if (dn ? caseEl.scrollTop + caseEl.clientHeight < caseEl.scrollHeight - 2 : caseEl.scrollTop > 2) return;
  }
  e.preventDefault(); const now = performance.now();
  if (now - lastWheel > 160) { used = false; acc = 0; } lastWheel = now;
  if (busy()) { used = true; return; }
  if (used) return;
  acc += e.deltaY;
  if (Math.abs(acc) > 30) { used = true; step(Math.sign(acc)); acc = 0; }
}, { passive: false });
let ty0 = null;
addEventListener('touchstart', (e) => { ty0 = vOpen ? null : e.touches[0].clientY; }, { passive: true });
addEventListener('touchmove', (e) => { if (!vOpen && !e.target.closest('button,a,.case')) e.preventDefault(); }, { passive: false });
addEventListener('touchend', (e) => { if (ty0 == null) return; const dy = ty0 - e.changedTouches[0].clientY; ty0 = null; if (Math.abs(dy) > 40) step(Math.sign(dy)); }, { passive: true });
addEventListener('keydown', (e) => {
  const k = e.key;
  if (vOpen) { if (k === 'Escape') closeViewerNow(); return; }
  if (k === 'Escape' && caseIdx >= 0) { navBack('#'); return; }
  if ((k === ' ' || k === 'Enter') && e.target.closest && e.target.closest('button,a')) return;
  if (k === 'ArrowDown' || k === 'PageDown' || k === ' ') { e.preventDefault(); step(1); }
  else if (k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); step(-1); }
  else if (k === 'Home') { e.preventDefault(); go(0); }
  else if (k === 'End') { e.preventDefault(); go(STAGES - 1); }
});
addEventListener('pointermove', (e) => {
  ptr.tx = e.clientX / innerWidth - .5; ptr.ty = e.clientY / innerHeight - .5;
  const nx = e.clientX / innerWidth * 2 - 1, ny = -(e.clientY / innerHeight * 2 - 1);
  if (ptr.lx !== null) ptr.energy = Math.min(1.3, ptr.energy + Math.hypot(nx - ptr.lx, ny - ptr.ly) * 3.2);
  ptr.lx = nx; ptr.ly = ny; ptr.nx = nx; ptr.ny = ny; ptr.type = e.pointerType || 'mouse';
});
document.documentElement.addEventListener('pointerleave', () => { ptr.tx = ptr.ty = 0; });
// documents in the viewer must never scroll the page itself
const pin = (el) => el && el.addEventListener('scroll', () => { if (el.scrollTop || el.scrollLeft) { el.scrollTop = 0; el.scrollLeft = 0; } });
pin(document.scrollingElement || document.documentElement); pin(viewer); pin(main);
addEventListener('scroll', () => { if (scrollX || scrollY) scrollTo(0, 0); });

/* ---------- Start: deep link, return visit, or the journey from the beginning ---------- */
syncInert();
if (/^#\/\w+/.test(location.hash)) route();
else if (store.get('mdaiux-seen')) setStageNow(3);
loadStill(cur);   // the still for the first screen paints at once, before the scene is ready

/* ---------- Loop: the stage value drives the scene (or the still frames without WebGL) ---------- */
let sceneApi = null, lastT = performance.now();
function stillsFollow() { stills.forEach((im, i) => { im.style.opacity = clamp(1 - Math.abs(s - i), 0, 1); }); }
function tick(now) {
  const dt = clamp((now - lastT) / 1000, 0, .05); lastT = now;
  if (anim) { const k = clamp((now - t0) / DUR, 0, 1); s = lerp(from, to, ease(k)); if (k >= 1) { anim = false; s = to; } }
  // while a document is open the scene rests: it is hidden behind the viewer
  if (sceneApi) { if (!(vOpen && now - vOpenedAt > 700)) { sceneApi.update(dt); sceneApi.draw(); } }
  else stillsFollow();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
initScene().then((api) => {
  if (!api) { body.classList.add('no-webgl'); stills.forEach((im, i) => loadStill(i)); return; }
  sceneApi = api; hero.classList.add('gl');
}).catch(() => { body.classList.add('no-webgl'); stills.forEach((im, i) => loadStill(i)); });


/* ---------- The scene: network, streams, prototypes, and the strands to each project ---------- */
async function initScene() {
  const canvas = document.getElementById('gl');
  const W=1400,H=349,DIST=60,FOV=40;
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const P=(X,Y,z=0)=>V(X/10-70,17.45-Y/10,z);           // banner px -> world
  const R=Math.random,lerp=(a,b,t)=>a+(b-a)*t,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const gauss=()=>(R()+R()+R()-1.5)/1.5;
  const smooth=(a,b,x)=>{const k=clamp((x-a)/(b-a),0,1);return k*k*(3-2*k);};
  const mixC=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
  const BLUE=[.16,.48,1],CYAN=[.25,.86,1],TEAL=[.1,.92,.76],GREEN=[.28,1,.6],DEEP=[.1,.28,.8];

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { return null; }   // no WebGL 2: the still frames stay
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x020812,1);
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(FOV,W/H,.1,6000);
  const SH={uTime:{value:0},uPix:{value:1},uFocus:{value:60},uAperture:{value:.05},uGlobal:{value:1},uMouse:{value:new THREE.Vector2(9,9)},uMouseStr:{value:0},uAspect:{value:1}};
  const CHAOS=`uniform vec2 uMouse;uniform float uMouseStr,uAspect;
    vec4 chaos(vec4 cp,vec3 p,float ph){vec2 nd=cp.xy/cp.w-uMouse;nd.x*=uAspect;float r=length(nd),f=uMouseStr*exp(-r*r/.05);
      if(f<.002||cp.w<=0.)return cp;vec2 dir=nd/max(r,1e-4),tg=vec2(-dir.y,dir.x);
      float n1=sin(p.x*3.1+p.y*1.7+uTime*7.+ph*6.283),n2=cos(p.y*2.3-p.x*1.3+uTime*6.+ph*4.);
      vec2 off=(dir*(.04+.036*n1)+tg*.056*n2)*f;off.x/=uAspect;cp.xy+=off*cp.w;return cp;}`;

  /* ---------- materials ---------- */
  function pointsMat(tw=1){
    return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      uniforms:Object.assign({uReveal:{value:1},uTw:{value:tw},uScan:{value:-999}},SH),
      vertexShader:`attribute vec3 color;attribute float size,fade,phase,rev;
        uniform float uTime,uPix,uFocus,uAperture,uGlobal,uReveal,uTw,uScan;${CHAOS}
        varying vec3 vC;varying float vA;
        void main(){
          vec4 mv=modelViewMatrix*vec4(position,1.);float dist=max(.6,-mv.z);
          float coc=min(abs(dist-uFocus)*uAperture,5.);
          float tw=mix(1.,.55+.45*sin(uTime*2.3+phase*6.283),uTw);
          float sc=exp(-pow((position.x-uScan)/1.6,2.));
          float rv=smoothstep(rev,rev+.06,uReveal);
          vA=fade*tw*rv*(1.+sc*1.6)/(1.+coc*coc*.45)*uGlobal;
          vC=color;
          gl_PointSize=clamp(size*uPix*(60./dist)*(1.+coc*.85),1.,96.);
          gl_Position=chaos(projectionMatrix*mv,position,phase);
        }`,
      fragmentShader:`varying vec3 vC;varying float vA;
        void main(){vec2 q=gl_PointCoord-.5;float d=length(q);if(d>.5)discard;
          float a=exp(-d*d*18.)+.7*exp(-d*d*110.);gl_FragColor=vec4(vC*(1.+.6*exp(-d*d*110.)),a*vA);}`});
  }
  function lineMat(op,wave){
    return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      uniforms:Object.assign({uReveal:{value:1},uOp:{value:op},uWave:{value:wave?1:0}},SH),
      vertexShader:`attribute vec3 color;attribute float u,wv;uniform float uTime,uFocus,uAperture,uWave;${CHAOS}
        varying vec3 vC;varying float vU,vD;
        void main(){vec3 p=position;p.y+=sin(uTime*.8+u*9.+wv*6.283)*.22*uWave*sin(3.14159*u);
          vec4 mv=modelViewMatrix*vec4(p,1.);float dist=-mv.z;
          vD=1./(1.+pow(min(abs(dist-uFocus)*uAperture,5.),2.)*.35);vC=color;vU=u;gl_Position=chaos(projectionMatrix*mv,position,wv);}`,
      fragmentShader:`uniform float uReveal,uOp,uGlobal;varying vec3 vC;varying float vU,vD;
        void main(){float a=1.-smoothstep(uReveal-.06,uReveal,vU);gl_FragColor=vec4(vC,a*uOp*vD*uGlobal);}`});
  }
  function makePoints(n){
    const g=new THREE.BufferGeometry(),A={};
    [['position',3],['color',3],['size',1],['fade',1],['phase',1],['rev',1]].forEach(([k,s])=>{A[k]=new Float32Array(n*s);g.setAttribute(k,new THREE.BufferAttribute(A[k],s));});
    A.fade.fill(1);return {g,A};
  }
  function lineGeo(pos,col,u,wv){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
    g.setAttribute('u',new THREE.BufferAttribute(u,1));g.setAttribute('wv',new THREE.BufferAttribute(wv,1));return g;
  }

  /* ---------- backdrop ---------- */
  const bg=new THREE.Mesh(new THREE.SphereGeometry(3000,48,24),new THREE.ShaderMaterial({depthWrite:false,side:THREE.BackSide,uniforms:SH,
    vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 vD;uniform float uTime;
      void main(){vec3 d=normalize(vD);vec3 c=vec3(.006,.022,.05);
        float f=smoothstep(0.,1.,-d.z);
        c+=vec3(.012,.07,.2)*exp(-pow(length(vec2(d.x+.06,d.y-.01)/vec2(.55,.17)),2.))*f*(.9+.1*sin(uTime*.6));
        c+=vec3(.0,.06,.07)*exp(-pow(length(vec2(d.x-.5,d.y)/vec2(.35,.14)),2.))*f;
        c+=vec3(.006,.03,.08)*exp(-pow(d.y/.25,2.))*(1.-f)*.8;
        c*=1.-.4*smoothstep(0.,.5,abs(d.y));gl_FragColor=vec4(c,1.);}`}));
  bg.renderOrder=-1;scene.add(bg);

  /* ---------- deep dust ---------- */
  {const n=4200,{g,A}=makePoints(n);
    for(let i=0;i<n;i++){A.position.set([(R()-.5)*320,(R()-.5)*160,-80+R()*70],i*3);A.color.set(mixC(DEEP,CYAN,R()*.6),i*3);A.size[i]=.8+R()*1.4;A.phase[i]=R();A.fade[i]=.25+R()*.4;}
    scene.add(new THREE.Points(g,pointsMat()));}

  /* ---------- data rain behind the cards ---------- */
  const rain=(()=>{const cols=48,per=22,n=cols*per,{g,A}=makePoints(n),C=[];
    for(let c=0;c<cols;c++){const x=lerp(18,72,c/cols)+R()*.4,sp=.6+R()*1.4,z=-10-R()*14;
      for(let j=0;j<per;j++){const i=c*per+j;C.push({x,z,b:R()*40,sp});A.color.set(mixC(DEEP,CYAN,.3+R()*.7),i*3);A.size[i]=1+R()*1.2;A.phase[i]=R();A.fade[i]=.25+R()*.35;}}
    scene.add(new THREE.Points(g,pointsMat()));return {C,A,g};})();

  /* ---------- node network in depth ---------- */
  const NN=950,nodes=[];
  for(let i=0;i<NN;i++){const x=-72+Math.pow(R(),1.15)*60;nodes.push(V(x,(R()-.5)*38,-28+R()*36));}
  const netG=new THREE.Group();scene.add(netG);
  {const {g,A}=makePoints(NN);
    nodes.forEach((p,i)=>{A.position.set([p.x,p.y,p.z],i*3);A.color.set(mixC(BLUE,CYAN,R()),i*3);A.size[i]=1.8+R()*2.2+(R()<.08?2.6:0);A.phase[i]=R();A.fade[i]=(.65+R()*.35)*(1-smooth(-26,-12,p.x));});
    netG.add(new THREE.Points(g,pointsMat()));
    const segs=[];
    for(let i=0;i<NN;i++){let c=0;for(let j=i+1;j<NN&&c<2;j++){if(nodes[i].distanceToSquared(nodes[j])<5.2*5.2&&R()<.6){segs.push(i,j);c++;}}}
    const n=segs.length,pos=new Float32Array(n*3),col=new Float32Array(n*3);
    segs.forEach((ni,k)=>{const p=nodes[ni],f=1-smooth(-28,-14,p.x);pos.set([p.x,p.y,p.z],k*3);col.set([.16*f,.48*f,.95*f],k*3);});
    netG.add(new THREE.LineSegments(lineGeo(pos,col,new Float32Array(n),new Float32Array(n)),lineMat(.5,false)));}


  /* ---------- envelope packets in the network ---------- */
  function iconTex(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
    x.strokeStyle='rgba(130,220,255,.95)';x.lineWidth=5;x.strokeRect(6,6,116,116);
    x.lineWidth=2.5;x.strokeStyle='rgba(130,220,255,.6)';x.beginPath();x.moveTo(6,6);x.lineTo(56,56);x.moveTo(122,6);x.lineTo(72,56);x.moveTo(6,122);x.lineTo(56,72);x.moveTo(122,122);x.lineTo(72,72);x.stroke();
    x.fillStyle='#c8f4ff';x.beginPath();x.arc(64,64,8,0,7);x.fill();
    x.fillStyle='rgba(30,110,170,.18)';x.fillRect(8,8,112,112);
    const t=new THREE.CanvasTexture(c);return t;}
  const icT=iconTex(),icons=[];
  [[137,11,23,-3],[325,36,27,2],[440,16,28,-6],[484,52,23,0],[114,79,20,-10],[312,117,27,3],[281,157,13,-2],[316,191,27,-4],[388,213,21,1],[270,238,28,-1]].forEach(([x,y,s,z],i)=>{
    const m=new THREE.Mesh(new THREE.PlaneGeometry(s/10,s/10),new THREE.MeshBasicMaterial({map:icT,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.75}));
    m.position.copy(P(x+s/2,y+s/2,z-14));m.userData={ph:R()*6.28,base:m.position.clone()};scene.add(m);icons.push(m);});

  /* ---------- two light streams, twisted in 3D ---------- */
  const RIBS=[
    {c:[[250,80],[330,104],[400,124],[450,136],[500,143],[575,145],[645,142],[700,128],[740,110],[790,80],[835,50],[875,28],[915,8],[965,-14]],
     w:[[250,62],[330,40],[400,24],[470,12],[645,13],[740,28],[835,42],[915,55]],
     dests:[[.25,()=>[905,lerp(84,130,R()),-.6]],[.18,()=>[1085,lerp(122,168,R()),-.8]]],
     col:o=>o<-.55?mixC(GREEN,CYAN,R()*.5):mixC(BLUE,CYAN,.2+R()*.55)},
    {c:[[250,168],[330,174],[400,178],[455,179],[535,178],[605,180],[675,186],[730,198],[785,214],[850,238],[915,264],[965,290]],
     w:[[250,64],[330,42],[400,25],[470,13],[605,15],[675,21],[785,34],[915,50]],
     dests:[[.2,()=>[862,lerp(190,212,R()),-.4]],[.16,()=>[1165,lerp(245,330,R()),-.8]]],
     col:o=>o>.5?mixC(TEAL,GREEN,R()*.6):mixC(CYAN,TEAL,R())}
  ];
  const interpW=(t,x)=>{if(x<=t[0][0])return t[0][1];for(let i=1;i<t.length;i++)if(x<=t[i][0])return lerp(t[i-1][1],t[i][1],(x-t[i-1][0])/(t[i][0]-t[i-1][0]));return t[t.length-1][1];};
  const S=110,strands=[];
  RIBS.forEach((rb,ri)=>{
    const cc=new THREE.CatmullRomCurve3(rb.c.map(([x,y])=>V(x,y,0)));
    for(let s=0;s<115;s++){
      const o1=clamp(gauss()*1.3,-1.4,1.4),o2=clamp(gauss()*1.2,-1.3,1.3),base=R()*.8,wv=R();
      let dest=null;{let r=R();for(const [p,f] of rb.dests){if(r<p){dest=f();break;}r-=p;}}
      const pts=[V(-66+R()*24,(R()-.5)*30,-16+R()*18)];
      const K=26;
      for(let k=0;k<=K;k++){
        const u=k/K,p=cc.getPointAt(u),tn=cc.getTangentAt(u),w=interpW(rb.w,p.x)*1.3;
        const th=u*Math.PI*1.15+base,oy=o1*Math.cos(th)-o2*.6*Math.sin(th)+.22*Math.sin(u*8+base*7),oz=o1*Math.sin(th)+o2*.6*Math.cos(th);
        let X=p.x-tn.y*oy*w,Y=p.y+tn.x*oy*w,Z=oz*w/10*.8-1;
        if(dest&&u>.6){const q=smooth(.6,1,u);X=lerp(X,dest[0],q);Y=lerp(Y,dest[1],q);Z=lerp(Z,dest[2],q);}
        pts.push(P(X,Y,Z));
      }
      strands.push({pts:new THREE.CatmullRomCurve3(pts).getPoints(S),c:rb.col(o1),wv,dest:!!dest,proj:ri*2+(R()<.5?0:1),jo:R()-.5});
    }
  });
  const streamLines=lineMat(.3,true);
  {const n=strands.length*S*2,pos=new Float32Array(n*3),col=new Float32Array(n*3),uu=new Float32Array(n),wv=new Float32Array(n);let k=0;
    strands.forEach(s=>{for(let j=0;j<S;j++)for(let e=0;e<2;e++,k++){const q=s.pts[j+e],u=(j+e)/S;
      const b=lerp(.04,1,smooth(.05,.4,u))*(.55+.45*Math.exp(-Math.pow((u-.5)/.2,2)))*(s.dest?1-smooth(.9,1,u):1);
      pos.set([q.x,q.y,q.z],k*3);col.set([s.c[0]*b,s.c[1]*b,s.c[2]*b],k*3);uu[k]=u;wv[k]=s.wv;}});
    scene.add(new THREE.LineSegments(lineGeo(pos,col,uu,wv),streamLines));}
  const NP=2800,SP=makePoints(NP),parts=[];
  for(let i=0;i<NP;i++){const si=(R()*strands.length)|0;const pc=mixC(strands[si].c,[1,1,1],.2+R()*.4);parts.push({si,u:R(),v:.04+R()*.06,j:V((R()-.5)*.2,(R()-.5)*.2,(R()-.5)*.2),c:pc});
    SP.A.color.set(pc,i*3);SP.A.size[i]=.8+R()*1.5+(R()<.03?2.6:0);SP.A.phase[i]=R();}
  const streamPts=pointsMat(.6);scene.add(new THREE.Points(SP.g,streamPts));


  /* ---------- glass UI cards (canvas-drawn, crisp) ---------- */
  try{await Promise.race([Promise.all([document.fonts.load('500 20px Sora'),document.fonts.load('400 20px Sora')]),new Promise(r=>setTimeout(r,1500))]);}catch(e){}
  const FONT='Sora, ui-sans-serif, system-ui, sans-serif';
  const rr=(c,x,y,w,h,r)=>{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();};
  const GA=.42;   // see-through glass
  function glass(c,w,h){
    const g=c.createLinearGradient(0,0,w*.45,h);g.addColorStop(0,`rgba(22,62,94,${.78*GA})`);g.addColorStop(.5,`rgba(7,24,42,${.8*GA})`);g.addColorStop(1,`rgba(3,12,24,${.9*GA})`);
    rr(c,.75,.75,w-1.5,h-1.5,7);c.fillStyle=g;c.fill();c.lineWidth=1;c.strokeStyle='rgba(110,220,255,.55)';c.stroke();
    c.save();c.clip();const hl=c.createLinearGradient(0,0,w,0);hl.addColorStop(0,'rgba(170,240,255,0)');hl.addColorStop(.3,'rgba(170,240,255,.6)');hl.addColorStop(1,'rgba(170,240,255,.06)');c.fillStyle=hl;c.fillRect(0,0,w,1.3);c.restore();
  }
  const title=(c,t,x,y,s=9.5)=>{c.font=`500 ${s}px ${FONT}`;c.fillStyle='#d3eefc';c.fillText(t,x,y);};
  const xbtn=(c,w)=>{rr(c,w-21,6,13,8,3);c.fillStyle='rgba(127,166,191,.22)';c.fill();};
  const bar=(c,x,y,w,h,col)=>{c.fillStyle=col;rr(c,x,y,w,h,Math.min(h/2,2));c.fill();};
  const path=(c,d,stroke,fill,lw=1.3)=>{const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke(p);}};
  const icon=(c,d,x,y,s,stroke,fill,lw)=>{c.save();c.translate(x,y);c.scale(s,s);path(c,d,stroke,fill,lw);c.restore();};
  const SHIELD='M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z';
  const CARDS=[
    {id:'bank',x:877,y:-4,w:38,h:36,z:1.2,draw(c,w,h){glass(c,w,h);icon(c,'M3 9l9-5 9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18',w/2-11,h/2-11,22/24,'#c4f0ff',null,1.5);}},
    {id:'dash',x:945,y:-10,w:172,h:76,z:.4,anim:1,draw(c,w,h,t){glass(c,w,h);
      const k=.5-.5*Math.cos(t*.7);c.save();c.setLineDash([140,140]);c.lineDashOffset=140*(1-k);c.strokeStyle='#3fe0ff';c.lineWidth=1.4;c.beginPath();
      [[8,36],[22,32],[34,34],[46,24],[58,28],[70,18],[82,22],[94,12],[106,16]].forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore();
      bar(c,118,12,22,22,'rgba(127,166,191,.16)');bar(c,144,12,22,22,'rgba(127,166,191,.16)');
      icon(c,'M6 1c2 3 3 4 3 6a3 3 0 0 1-6 0c0-2 1-3 3-6z',10,46,1,null,'#3fe0ff');
      c.font=`400 7.5px ${FONT}`;c.fillStyle='#cfe9f7';c.fillText('Smart Portfolio',25,55);bar(c,10,61,58,3,'rgba(127,166,191,.28)');
      c.lineWidth=4;c.strokeStyle='rgba(127,166,191,.3)';c.beginPath();c.arc(127,53,9,0,7);c.stroke();
      c.strokeStyle='#2e86ff';c.beginPath();c.arc(127,53,9,-Math.PI/2,-Math.PI/2+Math.PI*2*(.62+.08*Math.sin(t*.9)));c.stroke();}},
    {id:'flow',x:1128,y:-6,w:183,h:98,z:.2,anim:1,draw(c,w,h,t){glass(c,w,h);title(c,'Workflow',10,22);xbtn(c,w);
      c.save();c.translate(0,26);c.setLineDash([3,3]);c.lineDashOffset=-t*8;c.strokeStyle='#5ccfff';c.lineWidth=.9;
      c.stroke(new Path2D('M22 18h14M50 18h12v-8h14M50 18h12v12h14M90 10h14M90 30h14M118 10h10v10h10M118 30h10v-10h10M152 20h12M38 40v10h26M78 50h22M112 50h14v-30'));c.setLineDash([]);
      [[10,12,12,12],[36,12,14,12],[76,4,14,12],[76,24,14,12],[104,4,14,12],[104,24,14,12],[138,14,14,12],[64,44,14,12],[100,44,12,12]].forEach(([x,y,ww,hh],i)=>{
        const on=.5+.5*Math.sin(t*2.2-i*.7);rr(c,x,y,ww,hh,2);c.fillStyle=`rgba(46,134,255,${.3+.25*on})`;c.fill();c.strokeStyle='#7fdcff';c.lineWidth=.9;c.stroke();});
      rr(c,164,13,14,14,2);c.fillStyle='rgba(31,230,196,.55)';c.fill();c.strokeStyle='#1fe6c4';c.stroke();path(c,'M168 20l2 2 4-4','#eafffb',null,1.3);c.restore();}},
    {id:'ai',x:874,y:70,w:148,h:68,z:1.4,anim:1,draw(c,w,h,t){glass(c,w,h);title(c,'AI insight',10,20);xbtn(c,w);
      c.font=`400 8.5px ${FONT}`;c.fillStyle='#e2f4ff';c.fillText('Recommended action',10,36);c.font=`400 6.5px ${FONT}`;c.fillStyle='#7fa6bf';c.fillText('Generate summary',10,46);
      c.beginPath();c.arc(w-21,33,9,0,7);c.fillStyle='rgba(31,230,196,.25)';c.fill();c.strokeStyle='#1fe6c4';c.lineWidth=1;c.stroke();path(c,`M${w-25} 33l3 3 5-5`,'#eafffb',null,1.6);
      bar(c,10,52,w-20,4,'rgba(127,166,191,.22)');const k=.18+.54*(.5-.5*Math.cos(t*1.05));const g=c.createLinearGradient(10,0,10+(w-20)*k,0);g.addColorStop(0,'#2e86ff');g.addColorStop(1,'#3fe0ff');bar(c,10,52,(w-20)*k,4,g);
      bar(c,10,60,52,3,'rgba(127,166,191,.2)');}},
    {id:'journey',x:1058,y:110,w:198,h:66,z:1,anim:1,draw(c,w,h,t){glass(c,w,h);title(c,'User Journey',10,20);xbtn(c,w);
      c.strokeStyle='rgba(96,214,255,.6)';c.lineWidth=1;c.beginPath();c.moveTo(24,41);c.lineTo(w-24,41);c.stroke();
      const IC=['M6 2.2a2 2 0 1 1 0 4a2 2 0 1 1 0-4M2 11c0-2.5 2-4 4-4s4 1.5 4 4','M6 2.2a2 2 0 1 1 0 4a2 2 0 1 1 0-4M2 11c0-2.5 2-4 4-4s4 1.5 4 4','M1.5 2h9v6h-9zM4 10.5h4','M3 6.2l2 2 4-4.2'];
      const ph=(t*.25)%1;
      IC.forEach((d,i)=>{const cx=25+i*48+10,act=Math.exp(-Math.pow(((ph*4-i+4)%4)/.35,2));
        c.beginPath();c.arc(cx,41,10,0,7);c.fillStyle='rgba(6,22,38,.95)';c.fill();c.lineWidth=1;c.strokeStyle=act>.3?'#1fe6c4':'rgba(96,214,255,.6)';c.stroke();
        if(act>.05){c.save();c.globalAlpha=act;c.beginPath();c.arc(cx,41,12.5,0,7);c.strokeStyle='rgba(31,230,196,.7)';c.lineWidth=2;c.stroke();c.restore();}
        icon(c,d,cx-5.5,35.5,.92,'#d4f2ff',null,1.1);});
      const dx=lerp(30,w-30,ph);c.save();c.globalAlpha=Math.sin(Math.PI*ph);c.beginPath();c.arc(dx,41,2.6,0,7);c.fillStyle='#d8fff4';c.shadowColor='#1fe6c4';c.shadowBlur=6;c.fill();c.restore();}},
    {id:'shield',x:841,y:178,w:42,h:42,z:1.8,draw(c,w,h){glass(c,w,h);c.save();c.translate(w/2-12,h/2-12);path(c,SHIELD,'#c4f0ff',null,1.4);path(c,'M9.5 12.5h5v3h-5zM10.5 12.5v-1.5a1.5 1.5 0 0 1 3 0v1.5','#c4f0ff',null,1.2);c.restore();}},
    {id:'design',x:910,y:190,w:202,h:122,z:1.1,draw(c,w,h){glass(c,w,h);title(c,'Design System',12,22);xbtn(c,w);
      rr(c,14,36,30,9,3);c.fillStyle='rgba(46,134,255,.45)';c.fill();c.strokeStyle='#2e86ff';c.stroke();bar(c,49,39,12,3,'rgba(127,166,191,.45)');
      bar(c,14,57,30,9,'rgba(46,134,255,.75)');bar(c,49,60,12,3,'rgba(127,166,191,.45)');
      c.save();c.shadowColor='rgba(31,230,196,.7)';c.shadowBlur=6;bar(c,14,78,30,9,'#1fc8b0');c.restore();
      c.save();c.translate(66,32);c.strokeStyle='#9fe6ff';c.lineWidth=1.1;c.stroke(new Path2D('M8 4h9M8 8h6M28 3l6 4-6 4M50 10l6-6M52 4h4v4'));
      [[10,26,3.5],[53,26,4],[31,46,3.5],[53,46,3.5],[10,64,3.5],[31,64,3.5],[53,64,3.5]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,7);c.stroke();});
      c.fillStyle='#3fe0ff';c.beginPath();c.arc(31,26,3,0,7);c.fill();c.fillStyle='#1fe6c4';c.fillRect(7,43,6,6);c.restore();
      rr(c,138,34,50,46,4);c.fillStyle='rgba(3,12,24,.6)';c.fill();c.strokeStyle='rgba(96,214,255,.3)';c.stroke();
      c.font=`400 17px ${FONT}`;c.fillStyle='#e2f4ff';c.textAlign='center';c.fillText('Aa',163,61);c.font=`400 5.5px ${FONT}`;c.fillStyle='#7fa6bf';c.fillText('Typography',163,72);c.textAlign='left';
      ['#1a6a7a','#2e86ff','#1b3f9a'].forEach((col,i)=>{c.fillStyle=col;c.fillRect(138+i*18,88,15,15);});}},
    {id:'star',x:956,y:303,w:46,h:46,z:2,draw(c,w,h){glass(c,w,h);c.save();c.translate(w/2-12,h/2-12);path(c,SHIELD,'#c4f0ff',null,1.4);path(c,'M12 8.5l1 2.2 2.3.3-1.7 1.6.5 2.3-2.1-1.2-2.1 1.2.5-2.3-1.7-1.6 2.3-.3z',null,'#c4f0ff');c.restore();}},
    {id:'act',x:1131,y:220,w:192,h:140,z:.5,anim:1,draw(c,w,h,t){glass(c,w,h);title(c,'Activity',12,22);xbtn(c,w);
      for(let i=0;i<4;i++){const y=40+i*19;c.beginPath();c.arc(17.5,y,5.5,0,7);c.strokeStyle='rgba(96,214,255,.5)';c.lineWidth=1;c.stroke();bar(c,29,y-3,48-i*4,3,'rgba(127,166,191,.45)');bar(c,29,y+2,70-i*6,2,'rgba(127,166,191,.22)');}
      const k=.5-.5*Math.cos(t*.6);c.save();c.setLineDash([80,80]);c.lineDashOffset=80*(1-k);c.strokeStyle='#3fe0ff';c.lineWidth=1.1;c.stroke(new Path2D('M114 72l10-6 8 3 10-10 8 4 10-12'));c.restore();
      c.strokeStyle='#7fa6bf';c.lineWidth=1;c.stroke(new Path2D('M172 48l6 6M178 48l-6 6'));
      [10,16,12,22,18,28,24,34].forEach((hh,i)=>{const s=.7+.3*Math.sin(t*(1.6+i*.2)+i);const g=c.createLinearGradient(0,120-hh*s,0,120);g.addColorStop(0,'#3fe0ff');g.addColorStop(1,'#2e86ff');c.fillStyle=g;c.fillRect(114+i*8.2,120-hh*s,6,hh*s);});}}
  ];
  const TS=4,cardObjs=[];
  CARDS.forEach((cd,i)=>{
    const cv=document.createElement('canvas');cv.width=Math.ceil(cd.w*TS);cv.height=Math.ceil(cd.h*TS);
    const ctx=cv.getContext('2d');const tex=new THREE.CanvasTexture(cv);tex.anisotropy=renderer.capabilities.getMaxAnisotropy();
    const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:0});
    const m=new THREE.Mesh(new THREE.PlaneGeometry(cd.w/10,cd.h/10),mat);
    const fin=P(cd.x+cd.w/2,cd.y+cd.h/2,cd.z);m.position.copy(fin);m.renderOrder=10+i;scene.add(m);
    const o={cd,cv,ctx,tex,mat,m,fin,delay:i*.32};
    o.paint=t=>{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);ctx.setTransform(TS,0,0,TS,0,0);cd.draw(ctx,cd.w,cd.h,t);tex.needsUpdate=true;};
    o.paint(0);cardObjs.push(o);
  });

  /* ---------- post: bloom + grade (vignette, grain, aberration, fades) ---------- */
  let composer=null;const grade={uniforms:{tDiffuse:{value:null},uTime:{value:0},uFade:{value:1},uRes:{value:new THREE.Vector2(1,1)}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime,uFade;uniform vec2 uRes;varying vec2 vUv;
      float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
      void main(){vec2 d=vUv-.5;vec3 c;
        c.r=texture2D(tDiffuse,vUv+d*.004).r;c.g=texture2D(tDiffuse,vUv).g;c.b=texture2D(tDiffuse,vUv-d*.004).b;
        c*=clamp(1.-.55*pow(length(d)*1.3,2.4),0.,1.);
        c+=(h(floor(vUv*uRes)+fract(uTime*7.)*91.)-.5)*.03;
        c*=mix(vec3(1.),vec3(.94,1.,1.07),.6);
        gl_FragColor=vec4(c*uFade,1.);}`};
  let gradePass=null;
  try{
    composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,cam));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(W,H),.62,.55,.42));
    gradePass=new ShaderPass(grade);composer.addPass(gradePass);}catch(e){composer=null;}

  /* ---------- camera path: one stop per stage ---------- */
  const fovR = FOV * Math.PI / 180;
  let camP = null, camT = null;
  const CL = { x0: 14, x1: 62.3, y0: -18.6, y1: 18.5 };   // the prototype cards, in world units
  function buildPath(dev, del) {
    const K = [[V(-60, 2, 14), V(-40, 0, -8)], [V(-34, 2, 26), V(-10, 1, 0)], dev, del];
    camP = new THREE.CatmullRomCurve3(K.map((k) => k[0])); camT = new THREE.CatmullRomCurve3(K.map((k) => k[1]));
  }
  function resize() {
    const w = hero.clientWidth || innerWidth, h = hero.clientHeight || innerHeight, dpr = Math.min(devicePixelRatio || 1, 2), a = w / h, th = Math.tan(fovR / 2);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); cam.aspect = a; cam.updateProjectionMatrix();
    if (composer) { composer.setPixelRatio(dpr); composer.setSize(w, h); }
    SH.uPix.value = dpr * h / (2 * DIST * th) / 10; SH.uAspect.value = a;
    if (gradePass) gradePass.uniforms.uRes.value.set(w * dpr, h * dpr);
    // Develop: the prototype cards fill the right side (the lower part on a phone)
    const cw = CL.x1 - CL.x0, ch = CL.y1 - CL.y0, [rx0, rx1, ry0, ry1] = a >= 1 ? [.45, .97, .13, .86] : [.05, .95, .32, .84];
    const Wv = Math.max(cw / (rx1 - rx0), ch / (ry1 - ry0) * a), Hv = Wv / a, fz = Hv / (2 * th);
    const cx = (CL.x0 + CL.x1) / 2 - ((rx0 + rx1) / 2 - .5) * Wv, cy = (CL.y0 + CL.y1) / 2 + ((ry0 + ry1) / 2 - .5) * Hv;
    // Deliver: the camera moves on past the prototypes, which stay at the left edge; the projects take the right side
    const dx = a >= 1 ? CL.x1 + (.5 - .17) * Wv : CL.x1 + .25 * Wv;
    buildPath([V(cx, cy, fz), V(cx, cy, 0)], [V(dx, cy, fz), V(dx, cy, 0)]);
    requestAnimationFrame(buildStrands);
  }

  /* ---------- the streams carry on past the prototypes, turn into the four project colours and end at each project ---------- */
  const PCOL = ['#3fe0c5', '#5b96ff', '#a68bff', '#ffb547'].map((c) => { const k = new THREE.Color(c); return [k.r, k.g, k.b]; });
  const contLines = lineMat(.3, false); let contG = null;
  const tint = (u) => smooth(.4, .88, u);
  function cardAnchors() {
    const c = cam.clone(); c.position.copy(camP.getPoint(1)); c.lookAt(camT.getPoint(1)); c.updateMatrixWorld();
    const rc = new THREE.Raycaster(), pl = new THREE.Plane(V(0, 0, 1), 0), lr = list.getBoundingClientRect();
    return pcards.map((el) => {
      const li = el.parentElement, x = lr.left + li.offsetLeft, y = lr.top + li.offsetTop + li.offsetHeight / 2;
      rc.setFromCamera({ x: x / innerWidth * 2 - 1, y: -(y / innerHeight * 2 - 1) }, c); const hit = V(0, 0, 0); rc.ray.intersectPlane(pl, hit); return hit;
    });
  }
  function buildStrands() {
    if (contG) { scene.remove(contG); contG.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    contG = new THREE.Group(); scene.add(contG);
    const ends = cardAnchors(), SB = 80, pos = [], col = [], uu = [];
    strands.forEach((st) => {
      if (st.dest) { st.full = st.pts; st.nA = st.pts.length; return; }
      const n = st.pts.length, a = st.pts[n - 1], t = a.clone().sub(st.pts[n - 5]).normalize(), e = ends[st.proj];
      const B = new THREE.CatmullRomCurve3([a, a.clone().addScaledVector(t, 7), V(lerp(a.x, e.x, .5), lerp(a.y, e.y, .6) + st.jo * 2.4, -3), V(e.x - 9, e.y + st.jo * .9, -1), V(e.x - .5, e.y + st.jo * .25, 0)]).getPoints(SB);
      st.full = st.pts.concat(B.slice(1)); st.nA = n; const pc = PCOL[st.proj];
      for (let j = 0; j < SB; j++) for (let q = 0; q < 2; q++) {
        const p = B[j + q], u = (j + q) / SB, br = .55 + .35 * smooth(.6, 1, u), m = tint(u);
        pos.push(p.x, p.y, p.z); col.push(lerp(st.c[0], pc[0], m) * br, lerp(st.c[1], pc[1], m) * br, lerp(st.c[2], pc[2], m) * br); uu.push(u);
      }
    });
    contG.add(new THREE.LineSegments(lineGeo(new Float32Array(pos), new Float32Array(col), new Float32Array(uu), new Float32Array(uu.length)), contLines));
  }

  /* ---------- frame ---------- */
  // two clocks: the stage value s tells the story (camera, what has appeared); real time keeps it alive
  const ray = new THREE.Raycaster(), cardMeshes = cardObjs.map((o) => o.m), qB = new THREE.Quaternion(), qH = new THREE.Quaternion(), eB = new THREE.Euler(), mouseV = new THREE.Vector2();
  let hovIdx = -1, hovUV = null; cardObjs.forEach((o) => { o.h = 0; o.hu = .5; o.hv = .5; });
  let clock = 0, paintAcc = 0, mx = 0, my = 0; const born = performance.now();
  const pw = (arr, x) => { const i = clamp(Math.floor(x), 0, arr.length - 2); return lerp(arr[i], arr[i + 1], clamp(x - i, 0, 1)); };
  function update(dt) {
    const da = reduced ? 0 : dt; clock += da; const fadeT = (performance.now() - born) / 1000; SH.uTime.value = clock;
    ptr.energy *= Math.exp(-dt * 2.2); SH.uMouse.value.set(ptr.nx, ptr.ny); SH.uMouseStr.value = reduced ? 0 : Math.min(1, ptr.energy);
    mx += (ptr.tx - mx) * .05; my += (ptr.ty - my) * .05;
    const u = s / (STAGES - 1), pos = camP.getPoint(u), tg = camT.getPoint(u), life = .5 + .5 * smooth(1.6, 2.6, s);
    pos.x += Math.sin(clock * .3) * .5 * life + mx * 2.2; pos.y += Math.cos(clock * .23) * .3 * life - my * 1.1;
    cam.position.copy(pos); cam.lookAt(tg); bg.position.copy(pos);
    SH.uFocus.value = pos.distanceTo(tg); SH.uAperture.value = lerp(.075, .012, smooth(1.4, 2.4, s));
    if (gradePass) { gradePass.uniforms.uTime.value = clock; gradePass.uniforms.uFade.value = smooth(0, 1.2, fadeT); }
    // streams in Define; their continuation in Develop; prototypes assemble in Develop and recede in Deliver
    const rv = pw([0, 1.08, 1.08, 1.08], s), rvB = pw([0, 0, 1.06, 1.06], s); streamLines.uniforms.uReveal.value = rv; contLines.uniforms.uReveal.value = rvB;
    const A = SP.A;
    for (let i = 0; i < NP; i++) {
      const p = parts[i], st = strands[p.si], arr = st.full || st.pts, N = arr.length - 1, nA = st.nA || arr.length;
      p.u += p.v * da * (nA - 1) / N; if (p.u >= 1) p.u -= 1;
      const f = p.u * N, j = Math.min(N - 1, f | 0), a = f - j, q0 = arr[j], q1 = arr[j + 1];
      let x = lerp(q0.x, q1.x, a) + p.j.x, y = lerp(q0.y, q1.y, a) + p.j.y, z = lerp(q0.z, q1.z, a) + p.j.z, fd, c = p.c;
      if (f < nA - 1) {
        const ua = f / (nA - 1); y += Math.sin(clock * .8 + ua * 9 + st.wv * 6.283) * .22 * Math.sin(Math.PI * ua);
        fd = .75 * smooth(.1, .3, ua) * (st.dest ? 1 - smooth(.9, 1, ua) : 1) * (ua < rv - .04 ? 1 : 0);
      } else {
        const ub = (f - (nA - 1)) / (N - (nA - 1)), m = tint(ub), pc = PCOL[st.proj];
        c = [lerp(p.c[0], pc[0], m), lerp(p.c[1], pc[1], m), lerp(p.c[2], pc[2], m)];
        fd = .75 * (1 - smooth(.96, 1, ub)) * (ub < rvB - .03 ? 1 : 0);
      }
      A.position[i * 3] = x; A.position[i * 3 + 1] = y; A.position[i * 3 + 2] = z; A.fade[i] = fd; A.color[i * 3] = c[0]; A.color[i * 3 + 1] = c[1]; A.color[i * 3 + 2] = c[2];
    }
    SP.g.attributes.position.needsUpdate = true; SP.g.attributes.fade.needsUpdate = true; SP.g.attributes.color.needsUpdate = true;
    rain.C.forEach((c, i) => { rain.A.position[i * 3] = c.x; rain.A.position[i * 3 + 1] = 20 - ((c.b + clock * c.sp) % 40); rain.A.position[i * 3 + 2] = c.z; });
    rain.g.attributes.position.needsUpdate = true;
    icons.forEach((m) => { const ud = m.userData; m.material.opacity = (.45 + .35 * Math.sin(clock * 1.3 + ud.ph)) * smooth(0, 1.5, fadeT); m.position.y = ud.base.y + Math.sin(clock * .5 + ud.ph) * .15; });
    paintAcc += da; const repaint = paintAcc > 1 / 30; if (repaint) paintAcc = 0;
    const recede = 1 - .62 * smooth(2.15, 2.8, s);
    // hover: only while Develop is on screen, only with a mouse; the card turns toward you on its centre
    hovIdx = -1; const hw = 1 - Math.min(1, Math.abs(s - 2) / .3);
    if (hw > 0 && !reduced && ptr.type !== 'touch' && caseIdx < 0 && Math.abs(ptr.nx) <= 1) {
      mouseV.set(ptr.nx, ptr.ny); ray.setFromCamera(mouseV, cam); const hits = ray.intersectObjects(cardMeshes, false);
      for (const h of hits) { const k = cardMeshes.indexOf(h.object); if (cardObjs[k].mat.opacity > .6) { hovIdx = k; hovUV = h.uv; break; } }
    }
    cardObjs.forEach((o, i) => {
      const a = smooth(1.25 + i * .045, 1.6 + i * .045, s);
      o.mat.opacity = a * recede;
      o.h += ((i === hovIdx ? 1 : 0) * hw - o.h) * .12; if (i === hovIdx) { o.hu += (hovUV.x - o.hu) * .2; o.hv += (hovUV.y - o.hv) * .2; }
      // resting angle: an arc turned toward the streams, 15 to 25 degrees, more on the right
      const fx = clamp((o.fin.x - 14) / 48, 0, 1), yaw = -lerp(.26, .44, fx), pitch = -(o.fin.y / 18.5) * .1;
      qB.setFromEuler(eB.set(pitch * a * (1 - .5 * o.h), lerp(-.55, yaw, a) * (1 - .45 * o.h), 0));
      qH.setFromEuler(eB.set(-(o.hv - .5) * .3 * o.h, (o.hu - .5) * .3 * o.h, 0)); o.m.quaternion.copy(qB).multiply(qH);
      o.m.position.set(o.fin.x + (1 - a) * 3, o.fin.y + Math.sin(clock * .8 + o.delay * 3) * .12 * a, o.fin.z - (1 - a) * 7 + o.h * 1.1);
      o.mat.color.setScalar(1 + .35 * o.h);
      if (repaint && o.cd.anim && a > 0) o.paint(clock);
    });
  }
  function draw() { if (composer) composer.render(); else renderer.render(scene, cam); }
  new ResizeObserver(() => { resize(); draw(); }).observe(hero); resize();
  document.fonts.ready.then(() => requestAnimationFrame(buildStrands));
  update(0); draw();
  return { update, draw };
}

/* ---------- SingleRAN screens: zoom, pan, compare, keyboard, swipe ---------- */
function buildGallery(el, items) {
  el.innerHTML = `
    <div class="g-stage">
      <button class="g-nav prev" type="button" aria-label="Previous screen"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M11 3 5 9l6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="g-inner"></div>
      <button class="g-nav next" type="button" aria-label="Next screen"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="m7 3 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>
    <div class="g-foot"><p class="g-caption" aria-live="polite"></p><span class="g-count"></span><div class="g-thumbs" role="list"></div></div>`;
  const st = el.querySelector('.g-stage'), inner = el.querySelector('.g-inner'), caption = el.querySelector('.g-caption'), count = el.querySelector('.g-count'), thumbs = el.querySelector('.g-thumbs');
  let index = 0, zoom = { on: false, x: 0, y: 0 }, drag = null;
  items.forEach((it, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'listitem'); b.setAttribute('aria-label', it.title);
    b.innerHTML = it.compare ? '<span class="g-cmp-thumb">Compare v1 / v2</span>' : `<img src="${it.src}-thumb.webp" alt="" loading="lazy">`;
    b.addEventListener('click', () => show(i)); thumbs.appendChild(b);
  });
  function show(i) {
    index = (i + items.length) % items.length;
    const it = items[index];
    zoom = { on: false, x: 0, y: 0 }; st.classList.remove('zoomed', 'is-compare');
    if (it.compare) {
      st.classList.add('is-compare');
      inner.innerHTML = `<div class="g-compare" style="--pos:50%"><img src="${it.before}.webp" alt="Cells view, version 1" draggable="false"><img class="after" src="${it.after}.webp" alt="Cells view, version 2" draggable="false"><span class="g-tag l">v1</span><span class="g-tag r">v2</span><span class="g-handle"></span><input type="range" min="0" max="100" value="50" aria-label="Reveal version 2"></div>`;
      const cmp = inner.querySelector('.g-compare');
      inner.querySelector('input').addEventListener('input', (e) => cmp.style.setProperty('--pos', e.target.value + '%'));
    } else {
      inner.innerHTML = `<img src="${it.src}.webp" width="${it.w}" height="${it.h}" alt="${it.title}. ${it.text}" draggable="false">`;
    }
    caption.innerHTML = `<strong>${it.title}.</strong> ${it.text}${it.compare ? '' : ' <span class="g-hint">Click to zoom.</span>'}`;
    count.textContent = `${index + 1} / ${items.length}`;
    thumbs.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-current', String(j === index)));
    thumbs.children[index].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  }
  const apply = (img) => { if (img) img.style.transform = zoom.on ? `translate(${zoom.x}px, ${zoom.y}px) scale(2.2)` : ''; };
  st.addEventListener('click', (e) => {
    const img = inner.querySelector(':scope > img');
    if (!img || e.target.closest('.g-nav') || (drag && drag.moved)) return;
    const r = img.getBoundingClientRect();
    zoom = zoom.on ? { on: false, x: 0, y: 0 } : { on: true, x: -(e.clientX - r.left) * 1.2, y: -(e.clientY - r.top) * 1.2 };
    st.classList.toggle('zoomed', zoom.on); apply(img);
  });
  st.addEventListener('pointerdown', (e) => { if (!zoom.on) return; drag = { sx: e.clientX, sy: e.clientY, ox: zoom.x, oy: zoom.y, moved: false }; st.setPointerCapture(e.pointerId); st.classList.add('dragging'); });
  st.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true; zoom.x = drag.ox + dx; zoom.y = drag.oy + dy; apply(inner.querySelector(':scope > img')); });
  const endDrag = () => { st.classList.remove('dragging'); setTimeout(() => (drag = null), 0); };
  st.addEventListener('pointerup', endDrag); st.addEventListener('pointercancel', endDrag);
  el.querySelector('.prev').addEventListener('click', (e) => { e.stopPropagation(); show(index - 1); });
  el.querySelector('.next').addEventListener('click', (e) => { e.stopPropagation(); show(index + 1); });
  viewer.addEventListener('keydown', (e) => { if (el.hidden || e.target.matches('input')) return; if (e.key === 'ArrowRight') show(index + 1); if (e.key === 'ArrowLeft') show(index - 1); });
  let sx = null;
  st.addEventListener('touchstart', (e) => { if (!zoom.on) sx = e.touches[0].clientX; }, { passive: true });
  st.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1)); });
  return { show };
}
