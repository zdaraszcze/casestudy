/* Portfolio scene: the journey, the cases and the viewer. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const canvas = document.querySelector('canvas');
  const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();
  const isLight = () => root.dataset.theme ? root.dataset.theme === 'light' : matchMedia('(prefers-color-scheme: light)').matches;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const easeIO = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* ---------- Project content ---------- */
  const THUMBS = { onb: 'assets/previews/onboarding.webp', ran: 'assets/singleran/runtime-workspace.webp', gw: 'assets/previews/graphwalk.webp', tr: 'assets/previews/transparency-register.webp' };
  const PROJECTS = [
    { id: 'onb', key: '--onb', name: 'Digital Assisted Onboarding', domain: 'Private banking', title: '148 steps across 20+ systems, mapped end to end.', num: '35–55 → ≤14', tag: 'Target', count: { pre: '<span class="from">35–55</span> → ≤', from: 55, to: 14, post: '' }, lbl: 'days for the most complex cases', cta: 'Try the prototype',
      star: [['Situation', 'No current, complete picture of private-bank onboarding: 9 phases, 148 steps, 20+ systems.'], ['Task', 'Map the whole journey and find where the time goes.'], ['Action', 'Ten weeks of shadowing, diary studies, 18 interviews and a 120-person survey.'], ['Result', 'Nine interventions aimed at cutting the most complex cases to under two weeks.']],
      note: 'User journey: 9 phases, 148 steps. The dips are where time is lost.' },
    { id: 'ran', key: '--ran', name: 'D&M for SingleRAN', domain: 'Telecom operations', title: 'One live view of the whole base station.', num: '~20%', tag: 'Target', count: { pre: '~', from: 0, to: 20, post: '%' }, lbl: 'faster site commissioning, fewer truck rolls', cta: 'Explore the screens',
      star: [['Situation', 'Three mobile generations on shared hardware, diagnosed through flat text logs split by technology.'], ['Task', 'Lead UX design and research on a 6-month console redesign.'], ['Action', 'One live topology view, one visual language across 20+ hardware types, a staged commissioning wizard.'], ['Result', 'Targets of about 20% faster commissioning and fewer truck rolls.']],
      note: 'GSM, WCDMA and LTE rings on one shared hub' },
    { id: 'gw', key: '--gw', name: 'GraphWalk Virtual Path', domain: 'Graph analytics', title: 'From hand-written JSON to a guided path builder.', num: '0', tag: 'Design outcome', count: { pre: '', from: 120, to: 0, post: '' }, lbl: 'lines of JSON to create a new relationship', cta: 'Try the prototype',
      star: [['Situation', '80+ link charts per person in flat tiles; new relationships written by hand in JSON.'], ['Task', 'Fix both without per-role screens or backend changes.'], ['Action', 'Every claim tagged fact or assumption; role-based views and a guided builder with live validation.'], ['Result', 'Specification ready; one governance decision still open.']],
      note: 'A path from a source set to a target set' },
    { id: 'tr', key: '--tr', name: 'Transparency Register', domain: 'Banking compliance', title: 'No case closes without a reason on record.', num: '90', tag: 'Design outcome', count: { pre: '', from: 0, to: 90, post: '' }, lbl: 'day deadline, visible on every screen', cta: 'Try the prototype',
      star: [['Situation', 'A third of ownership records don’t match the public registry; each case has 90 days before a mandatory report.'], ['Task', 'Design the tool compliance officers use to work these cases.'], ['Action', 'Interviews and shadowing showed an invisible deadline, fault on either side, and closures with no trail.'], ['Result', 'A visible countdown, records side by side, and a closure flow that requires a reason.']],
      note: '90 ticks, one per day of the deadline' },
  ];

  /* ---------- Scene ---------- */
  let renderer;
  let hasGL = true;
  try {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('no webgl');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    // no WebGL: stages, cards, cases and the viewer still work; only the 3D scene is replaced by a quiet background
    hasGL = false; root.classList.add('no-webgl');
    renderer = { setPixelRatio() {}, getPixelRatio() { return 1; }, setSize() {}, render() {} };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 500);

  const small = innerWidth < 760;
  const COUNT = small ? 3400 : 7000;
  const CH0 = [26, 9, -9, -26]; let CH = CH0.slice();
  let FX = 84;   // case view focus (set in resize: just right of the cards)
  let seed = 3; const rnd = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;

  // Formations: [x, y, size multiplier, flow offset (-1 = fixed)]
  const F = [[], [], [], []];
  // Onboarding: a user-journey experience curve across 9 phases; each dot is a step, big dots are phase nodes, dips are pain points
  const PHASE_Y = [4, 1.5, -3.5, -1, -6.5, .5, -4.5, 2.5, 6.5];
  const PHASE_N = [12, 18, 22, 14, 20, 16, 24, 12, 10];
  const journey = new THREE.CatmullRomCurve3(PHASE_Y.map((y, c) => new THREE.Vector3(-16 + c * 4, y * 1.35, 0)));
  const jPt = (t) => journey.getPoint(clamp(t, 0, 1));
  PHASE_Y.forEach((y, c) => {
    const t = c / 8, p = jPt(t), pain = y < -3;
    F[0].push([p.x, p.y, pain ? 3.2 : 2.4, -1]);
    for (let r = 0; r < PHASE_N[c]; r++) {
      const tt = clamp((c - .5 + (r + .5) / PHASE_N[c]) / 8, 0, 1), q = jPt(tt);
      F[0].push([q.x, q.y - 1.4 - (r % 4) * .75, .75, -1]);   // steps hang below the curve like a journey map's step rows
    }
  });
  for (let i = 0; i < 60; i++) F[0].push([0, 0, 1.1, i / 60]);  // flow along the curve
  // SingleRAN: three rings around one hub
  for (let i = 0; i < 14; i++) F[1].push([(rnd() - .5) * 2.4, (rnd() - .5) * 2.4, 1.4, -1]);
  [[5, 26], [9, 38], [13, 50]].forEach(([r, n]) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; F[1].push([Math.cos(a) * r, Math.sin(a) * r, 1, -1]); } });
  // GraphWalk: source set → path → target set
  for (let i = 0; i < 24; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 3; F[2].push([-13 + Math.cos(a) * r, -7 + Math.sin(a) * r, 1.2, -1]); F[2].push([13 + Math.cos(a + 1) * r, 7 + Math.sin(a + 1) * r, 1.2, -1]); }
  for (let i = 0; i < 90; i++) { const x = -11 + i / 89 * 22; F[2].push([x, 7 * Math.tanh(x / 4.5), 1, -1]); }   // matches the lines' guided path
  // Transparency Register: 90 day ticks
  for (let i = 0; i < 90; i++) { const a = Math.PI / 2 - i / 90 * Math.PI * 2; F[3].push([Math.cos(a) * 12.5, Math.sin(a) * 12.5, 1, -1]); F[3].push([Math.cos(a) * 11, Math.sin(a) * 11, .8, -1]); }

  const P = [];
  const fillCount = [0, 0, 0, 0];
  for (let i = 0; i < COUNT; i++) {
    const ch = Math.floor(rnd() * 4);
    const fi = -1;   // no shapes: the preview is the content, the lines stay calm behind it
    const halo = rnd() < .14;
    P.push({ gr: halo ? .35 + rnd() * .75 : Math.pow(rnd(), 1.5), garm: Math.floor(rnd() * 3), gj: (rnd() - .5) * (halo ? 6.28 : .9), gz: (rnd() - .5) * (halo ? 30 : 4), halo, cx: -95 + Math.pow(rnd(), .8) * 150, cy: (rnd() - .5) * 90, cz: (rnd() - .5) * 60, sy: (rnd() - .5) * 70, u0: rnd(), sp: .03 + rnd() * .05, ch, fi, delay: rnd() * .35, ph: rnd() * 6.28, z: (rnd() - .5) * 4, size: .8 + rnd() * 1.6 });
  }
  const pos = new Float32Array(COUNT * 3), col = new Float32Array(COUNT * 3), siz = new Float32Array(COUNT);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(siz, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uPx: { value: renderer.getPixelRatio() }, uLight: { value: 0 } },
    vertexShader: `attribute float size; attribute vec3 color; varying vec3 vC; uniform float uPx;
      void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=size*uPx*(260./-mv.z); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vC; uniform float uLight;
      void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; float g=smoothstep(.5,0.,d);
        if(uLight>.5) gl_FragColor=vec4(vC, g*.85*step(.02,vC.r+vC.g+vC.b)); else gl_FragColor=vec4(vC*g, g); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  { const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts); }

  // the journey line itself (drawn only for Onboarding)
  const jLineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
  const jLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(journey.getPoints(160)), jLineMat);


  const boxes = [];
  const boxMat = new THREE.LineBasicMaterial({ transparent: true, opacity: .5 });
  for (let i = 0; i < 16; i++) {
    const s = 2 + rnd() * 2.5;
    const g = new THREE.BufferGeometry().setFromPoints([[-s, -s], [s, -s], [s, s], [-s, s], [-s, -s], [s, s]].map(([x, y]) => new THREE.Vector3(x, y, 0)));
    const m = new THREE.Line(g, boxMat);
    m.position.set(-90 + rnd() * 110, (rnd() - .5) * 70, (rnd() - .5) * 30);
    m.userData = { home: m.position.clone(), ph: rnd() * 6 };
    scene.add(m); boxes.push(m);
  }
  const coreMat = [0, 1, 2, 3].map(() => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
  const cores = [], LP = 1000;
  for (let k = 0; k < 12; k++) {
    const lg = new THREE.BufferGeometry().setFromPoints(Array.from({ length: LP }, () => new THREE.Vector3()));
    lg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(LP * 3), 3));
    const line = new THREE.Line(lg, coreMat[k % 4]);
    line.frustumCulled = false;   // geometry changes every frame; a stale bounding sphere would hide the lines inside a case
    line.userData = { sy: (k / 11 - .5) * 44, ch: k % 4 }; scene.add(line); cores.push(line);
  }

  // jourY: the experience curve height at local x (-16..16)
  const jourY = (lx) => { const t = clamp((lx + 16) / 32, 0, 1); return jPt(t).y; };
  // Extra movement for a project's own lines near its shape. lx = x relative to the shape, off = the line's lateral offset.
  function essence() { return 0; }
  function essenceOld(ch, lx, off, time) {
    const win = 1 - ss(15, 24, Math.abs(lx));
    if (win <= 0) return 0;
    if (ch === 0) return win * (jourY(lx) + Math.sin(lx * .9 - time * 3) * .25);                 // the lines ride the journey curve, dipping at pain points
    if (ch === 1) { const hub = Math.exp(-(lx * lx) / 30); return win * (-off * hub + off * Math.cos(time * 1.6 + lx * .35) * (1 - hub) * .6); } // three lines braid and meet in one shared hub
    if (ch === 2) return win * 7 * Math.tanh(lx / 4.5);                                          // a guided path from the source set up to the target set
    const beat = Math.exp(-((time % 1.2) / 1.2) * 7);                                            // a ticking heartbeat: the 90-day clock
    return win * Math.sin(lx * 1.1 - time * 6) * 1.6 * beat;
  }
  // sep: 0 = one tight bundle (Define) · ~.33 = strands just apart (Develop) · 1 = full channels (Deliver)
  // One continuous landscape, read left to right; the camera pans one screen per step.
  //   Define view  (centre 0):   funnel on the left → pinch at x = -20 → loose bundle to the right edge
  //   Develop view (centre C2):  the bundle enters from the left and its strands separate a little
  //   Deliver view (centre C3):  the slightly separated strands enter from the left and open to the full spread + cards
  let H1 = 70, C2 = 140, C3 = 280, CARDX = 336, XEND = 370, PT = 0;
  const xOf = (u) => -95 + (XEND + 95) * u;
  function sepAt(x) { return .33 * ss(C2 - .7 * H1, C2 + .5 * H1, x) + .67 * ss(C3 - .9 * H1, CARDX - 6, x); }
  function path(sy, ch, u, _unused, out, wob) {
    const x = xOf(u); out.x = x;
    const pinch = 1 - ss(-95, -20, x), after = ss(-20, 30, x);
    const s = sepAt(x);
    // Develop: a looser, tentative wave while prototypes are tried; calm again in Deliver
    const env = ss(C2 - .7 * H1, C2, x) * (1 - ss(C3 - .9 * H1, C3 - .2 * H1, x));
    const explore = reduced ? 0 : env * Math.sin(x * .07 - PT * 2.4 + ch * 1.9) * 1.1;
    out.y = sy * Math.pow(pinch, 1.4) + after * (CH[ch] * s + sy * mix(.12, .04, ss(0, .33, s))) + wob + explore;
    return out;
  }

  let colors = {};
  function readPalette() {
    scene.background = new THREE.Color(css('--bg'));   // opaque scene: hidden (black) line parts can never darken the page
    const light = isLight();
    colors = { a: new THREE.Color(light ? '#5C6B82' : '#2E6FD8'), b: new THREE.Color(light ? '#0B7F6E' : '#3FE0C5'), ch: PROJECTS.map((p) => new THREE.Color(css(p.key))) };
    mat.uniforms.uLight.value = light ? 1 : 0;
    mat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending; mat.needsUpdate = true;
    boxMat.color = new THREE.Color(light ? '#6A778C' : '#3B77D8');
    coreMat.forEach((m, i) => { m.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending; m.needsUpdate = true; });
    jLineMat.color = colors.ch[0]; jLineMat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending; jLineMat.needsUpdate = true;
  }
  readPalette();
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', readPalette);

  /* ---------- State ---------- */
  const STAGE_P = [.04, .42, .64, .96];
  const DUR = 1800;   // every step: stages, opening, switching and closing a case
  let stage = 0, prog = STAGE_P[0];
  let caseIdx = -1, caseOpen = 0, focusIdx = 0;
  const formK = [0, 0, 0, 0];
  let locked = false;
  const tweens = {};

  function animate(name, from, to, dur, set, done) {
    tweens[name] && (tweens[name].cancel = true);
    if (reduced) { set(to); done && done(); return; }
    const t0 = performance.now(), tw = { cancel: false };
    tweens[name] = tw;
    const step = (now) => {
      if (tw.cancel) return;
      const t = clamp((now - t0) / dur, 0, 1);
      set(mix(from, to, easeIO(t)));
      if (t < 1) requestAnimationFrame(step); else done && done();
    };
    requestAnimationFrame(step);
  }
  const lock = (ms) => { locked = true; setTimeout(() => (locked = false), reduced ? 250 : ms); };

  function goStage(n) {
    n = clamp(n, 0, 3);
    if (n === stage || locked || caseIdx >= 0) return;
    const d = Math.sign(n - stage);
    captionTo(n, d, stage);
    stage = n; lock(DUR + 300);
    animate('prog', prog, STAGE_P[n], DUR, (v) => (prog = v));
  }

  // captions: the old sentence leaves in the scroll direction in the first half, the new one arrives from the other side in the second half
  let capTimer = 0;
  function captionTo(n, d, from) {
    const caps = [...document.querySelectorAll('.caption p')];
    clearTimeout(capTimer);
    const old = caps[from];
    if (old && from !== n) { old.style.setProperty('--y', d > 0 ? '-26px' : '26px'); old.classList.remove('on'); old.classList.add('out'); }
    if (n < 0) return;
    capTimer = setTimeout(() => {
      caps.forEach((c, i) => { if (i !== n) c.classList.remove('on'); });
      const nw = caps[n];
      nw.classList.remove('out'); nw.style.transition = 'none'; nw.style.setProperty('--y', d > 0 ? '26px' : '-26px');
      void nw.offsetWidth; nw.style.transition = '';
      nw.classList.add('on');
    }, reduced ? 0 : DUR * .45);
  }

  /* ---------- Case view ---------- */
  const caseEl = document.querySelector('.case');
  const note = document.querySelector('.shape-note');
  const thumb = document.querySelector('.pv');
  const thumbInline = document.querySelector('.thumb-inline');
  const lightbox = document.querySelector('.lightbox');
  const stageEl = document.querySelector('.stage');

  function fillCase(i) {
    const p = PROJECTS[i];
    caseEl.style.setProperty('--c', `var(${p.key})`);
    thumb.style.setProperty('--c', `var(${p.key})`);
    caseEl.querySelector('.eyebrow').textContent = p.domain;
    caseEl.querySelector('h2').textContent = p.title;
    caseEl.querySelector('.tag').textContent = p.tag;
    caseEl.querySelector('.num').innerHTML = p.count.pre + '<span class="cnt">' + p.count.to + '</span>' + p.count.post;
    caseEl.querySelector('.lbl').textContent = p.lbl;
    const ol = caseEl.querySelector('ol');
    ol.querySelectorAll('li').forEach((li) => li.remove());
    // each point appears as the drawing line reaches it
    ol.insertAdjacentHTML('beforeend', p.star.map(([k, t], j) => `<li class="anim" style="--d:3; transition-delay:${620 + j * 270}ms"><b>${k}</b>${t}</li>`).join(''));
    caseEl.querySelector('.act-proto-t').textContent = p.cta;
    caseEl.querySelector('.next-count').textContent = `${i + 1} of 4`;
    caseEl.querySelector('.next-text').innerHTML = i < 3 ? `Scroll for <b>${PROJECTS[i + 1].name}</b>` : `Scroll to return to <b>all projects</b>`;
    thumb.querySelector('img').src = THUMBS[p.id];
    thumb.querySelector('.pv-label').textContent = p.cta;
    thumb.querySelector('.pv-bubble').textContent = p.id === 'ran' ? 'View' : 'Play';
    thumbInline.querySelector('img').src = THUMBS[p.id];
    lightbox.querySelector('img').src = THUMBS[p.id];
    note.textContent = p.note;
    caseEl.scrollTop = 0;
  }

  // the result number counts to its value once, as the case arrives
  let countRaf = 0;
  function countUp(i, delay) {
    const c = PROJECTS[i].count, el = caseEl.querySelector('.cnt');
    cancelAnimationFrame(countRaf);
    if (reduced) { el.textContent = c.to; return; }
    el.textContent = c.from;
    const t0 = performance.now() + delay;
    const step = (now) => {
      const t = clamp((now - t0) / 1300, 0, 1), e = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(mix(c.from, c.to, e));
      if (t < 1) countRaf = requestAnimationFrame(step);
    };
    countRaf = requestAnimationFrame(step);
  }

  function openCase(i, cardEl, fromHistory) {
    if (caseIdx >= 0 || locked) return;
    caseIdx = i; focusIdx = i; lock(DUR + 300);
    if (!fromHistory) history.pushState({ pf: 'case' }, '', `#/${PROJECTS[i].id}`);
    captionTo(-1, 1, stage);   // the Deliver sentence leaves upward as we go into the case
    fillCase(i);
    const p = PROJECTS[i];
    if (!cardEl) {   // opened from a link: no card to grow from
      caseEl.style.setProperty('--enterY', '14px'); thumb.style.setProperty('--pvY', '14px');
      setTimeout(() => { caseEl.classList.add('open'); thumb.classList.add('on'); caseEl.querySelector('.back').focus({ preventScroll: true }); countUp(i, 450); }, reduced ? 0 : 300);
      animate('open', caseOpen, 1, DUR, (v) => (caseOpen = v));
      animate('f' + i, formK[i], 1, DUR, (v) => (formK[i] = v));
      return;
    }
    const from = cardEl.getBoundingClientRect(), host = stageEl.getBoundingClientRect();
    const wide = innerWidth > 760;
    if (wide) { thumb.style.transition = 'none'; thumb.classList.add('on'); }
    else caseEl.classList.add('open');
    const to = (wide ? thumb : caseEl.querySelector('.case-head')).getBoundingClientRect();
    thumb.classList.remove('on'); caseEl.classList.remove('open');
    void thumb.offsetWidth; thumb.style.transition = '';
    const m = document.createElement('div');
    m.className = 'morph'; m.style.setProperty('--c', `var(${p.key})`); m.innerHTML = cardEl.innerHTML;
    stageEl.appendChild(m);
    const box = (r) => ({ left: r.left - host.left + 'px', top: r.top - host.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    m.animate([{ ...box(from), opacity: 1 }, { ...box(to), opacity: .9, offset: .85 }, { ...box(to), opacity: 0 }], { duration: reduced ? 1 : 950, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }).onfinish = () => m.remove();
    caseEl.style.setProperty('--enterY', '14px');
    thumb.style.setProperty('--pvY', '0px');
    setTimeout(() => { caseEl.classList.add('open'); thumb.classList.add('on'); caseEl.querySelector('.back').focus({ preventScroll: true }); countUp(i, 450); }, reduced ? 0 : 500);
    animate('open', caseOpen, 1, DUR, (v) => (caseOpen = v));
    animate('f' + i, formK[i], 1, DUR, (v) => (formK[i] = v));
  }

  // scroll inside a case = next / previous project; the camera crabs from one channel to the next
  function switchCase(j) {
    const i = caseIdx, d = Math.sign(j - i);
    caseIdx = j; lock(DUR + 300);
    history.replaceState(history.state, '', `#/${PROJECTS[j].id}`);
    // text leaves the way the camera moves (down → text exits up), the new text arrives from the other side
    caseEl.style.setProperty('--exitY', d > 0 ? '-26px' : '26px');
    caseEl.classList.add('leaving');
    thumb.style.setProperty('--pvExit', d > 0 ? '-26px' : '26px');
    thumb.classList.add('leaving');
    setTimeout(() => {
      thumb.classList.remove('leaving', 'on');
      thumb.style.setProperty('--pvY', d > 0 ? '30px' : '-30px');
      fillCase(j);
      caseEl.style.setProperty('--enterY', d > 0 ? '30px' : '-30px');
      caseEl.classList.remove('open', 'leaving');
      void caseEl.offsetWidth;
      caseEl.classList.add('open');
      void thumb.offsetWidth;
      setTimeout(() => thumb.classList.add('on'), reduced ? 0 : 250);
      countUp(j, 450);
    }, reduced ? 0 : DUR * .25);
    animate('focus', focusIdx, j, DUR, (v) => (focusIdx = v));
    animate('f' + i, formK[i], 0, DUR, (v) => (formK[i] = v));
    animate('f' + j, formK[j], 1, DUR, (v) => (formK[j] = v));
  }

  function closeCase() {
    if (caseIdx < 0) return;
    const i = caseIdx; lock(DUR + 300);
    // closing is a step back: the case text leaves downward, the Deliver sentence returns from above
    caseEl.style.setProperty('--exitY', '26px'); caseEl.classList.add('leaving');
    setTimeout(() => caseEl.classList.remove('open', 'leaving'), reduced ? 0 : 420);
    captionTo(3, -1, -1);
    caseEl.classList.remove('leaving-dummy'); thumb.classList.remove('on', 'leaving'); lightbox.classList.remove('on');
    animate('f' + i, formK[i], 0, DUR, (v) => (formK[i] = v));
    animate('open', caseOpen, 0, DUR, (v) => (caseOpen = v), () => { caseIdx = -1; document.querySelector(`.card[data-i="${i}"]`)?.focus({ preventScroll: true }); });
  }

  function stepCase(d) {
    if (locked) return;
    const j = caseIdx + d;
    if (j < 0 || j > 3) { locked = false; navBack('#'); } else switchCase(j);
  }

  document.querySelectorAll('.card').forEach((c) => c.addEventListener('click', () => openCase(+c.dataset.i, c)));
  document.querySelector('.back').addEventListener('click', () => { locked = false; navBack('#'); });

  /* ---------- Viewer: full story / prototype, in the page (never a new tab) ---------- */
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
  const viewer = document.querySelector('.viewer'), vFrame = viewer.querySelector('iframe'), vTabs = viewer.querySelector('.viewer-tabs');
  let vOpen = false, vReturn = null;
  const galleryEl = viewer.querySelector('.gallery');
  let galleryApi = null;
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
      vFrame.hidden = true; vFrame.removeAttribute('src'); galleryEl.hidden = false;
      galleryApi = galleryApi || buildGallery(galleryEl, RAN_SCREENS);
      galleryApi.show(0);
    } else {
      galleryEl.hidden = true; vFrame.hidden = false;
      vFrame.title = `${p.name}: ${view === 'story' ? 'full story' : 'prototype'}`;
      if (vFrame.getAttribute('src') !== d[view]) vFrame.src = d[view];
    }
    if (!fromHistory && !vOpen) history.pushState({ pf: 'view' }, '', `#/${p.id}/${view}`);
    if (!vOpen) { vReturn = document.activeElement; vOpen = true; viewer.classList.add('on'); viewer.querySelector('.viewer-close').focus(); }
  }
  function closeViewer() { if (!vOpen) return; vOpen = false; viewer.classList.remove('on'); setTimeout(() => { if (!vOpen) vFrame.removeAttribute('src'); }, 450); vReturn?.focus({ preventScroll: true }); }
  // closing goes back in history when we added the entry ourselves, so the browser's back button and the UI agree
  function navBack(fallback) {
    if (history.state && history.state.pf) history.back();
    else { history.replaceState(null, '', fallback); route(); }
  }
  viewer.querySelector('.viewer-close').addEventListener('click', () => navBack(caseIdx >= 0 ? `#/${PROJECTS[caseIdx].id}` : '#'));
  vFrame.addEventListener('load', () => { try { vFrame.contentWindow.addEventListener('keydown', (e) => { if (e.key === 'Escape') navBack(`#/${PROJECTS[caseIdx].id}`); }); } catch (err) {} });
  caseEl.querySelector('.act-story').addEventListener('click', () => openViewer('story'));
  thumb.addEventListener('click', () => openViewer(PROJECTS[caseIdx].id === 'ran' ? 'screens' : 'proto'));
  thumb.addEventListener('pointermove', (e) => {
    const r = thumb.querySelector('.pv-media').getBoundingClientRect();
    thumb.style.setProperty('--bx', (e.clientX - r.left) + 'px'); thumb.style.setProperty('--by', (e.clientY - r.top) + 'px');
  });
  thumbInline.addEventListener('click', () => openViewer(PROJECTS[caseIdx].id === 'ran' ? 'screens' : 'proto'));
  caseEl.querySelector('.act-proto').addEventListener('click', () => openViewer(PROJECTS[caseIdx].id === 'ran' ? 'screens' : 'proto'));
  lightbox.querySelector('button').addEventListener('click', () => { lightbox.classList.remove('on'); thumb.focus({ preventScroll: true }); });
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('on'); });

  /* ---------- Router: #/onb, #/onb/story, #/ran/screens, #/projects ---------- */
  function jumpToProjects() {
    tweens.prog && (tweens.prog.cancel = true);
    const was = stage; stage = 3; prog = STAGE_P[3];
    if (was !== 3) captionTo(3, 1, was);
  }
  function route() {
    const m = location.hash.match(/^#\/(\w+)(?:\/(\w+))?$/);
    const idx = m ? PROJECTS.findIndex((p) => p.id === m[1]) : -1;
    if (m && m[1] === 'projects') { if (vOpen) closeViewer(); if (caseIdx >= 0) { locked = false; closeCase(); } jumpToProjects(); return; }
    if (idx < 0) { if (vOpen) closeViewer(); if (caseIdx >= 0) { locked = false; closeCase(); } return; }
    if (caseIdx < 0) { jumpToProjects(); locked = false; openCase(idx, null, true); }
    else if (caseIdx !== idx) { if (vOpen) closeViewer(); locked = false; switchCase(idx); }
    if (m[2]) setTimeout(() => openViewer(m[2], true), caseOpen > .9 ? 0 : 600);
    else if (vOpen) closeViewer();
  }
  addEventListener('popstate', route);
  if (location.hash.length > 2) setTimeout(route, 60);

  /* ---------- Input: one gesture = one step, in both modes ---------- */
  const panelCanScroll = (dir) => {
    if (caseEl.scrollHeight <= caseEl.clientHeight + 48) return false;   // only real overflow (long text on small screens) scrolls first
    return dir > 0 ? caseEl.scrollTop + caseEl.clientHeight < caseEl.scrollHeight - 2 : caseEl.scrollTop > 2;
  };
  let wheelAcc = 0, wheelTimer = 0;
  addEventListener('wheel', (e) => {
    if (lightbox.classList.contains('on') || vOpen) return;
    const dir = Math.sign(e.deltaY);
    if (caseIdx >= 0 && e.target.closest('.case') && panelCanScroll(dir)) return; // let long case text scroll first
    e.preventDefault();
    wheelAcc += e.deltaY;
    clearTimeout(wheelTimer); wheelTimer = setTimeout(() => (wheelAcc = 0), 180);
    if (Math.abs(wheelAcc) > 30 && !locked) {
      const d = Math.sign(wheelAcc); wheelAcc = 0;
      caseIdx >= 0 ? stepCase(d) : goStage(stage + d);
    }
  }, { passive: false });
  let ty = null, tInPanel = false;
  addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; tInPanel = !!e.target.closest('.case'); }, { passive: true });
  addEventListener('touchend', (e) => {
    if (ty === null || lightbox.classList.contains('on') || vOpen) return;
    const dy = ty - e.changedTouches[0].clientY; ty = null;
    if (Math.abs(dy) < 40) return;
    const d = Math.sign(dy);
    if (caseIdx >= 0) { if (!(tInPanel && panelCanScroll(d))) stepCase(d); }
    else goStage(stage + d);
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && vOpen) return navBack(`#/${PROJECTS[caseIdx].id}`);
    if (vOpen) return;
    if (e.key === 'Escape') { if (lightbox.classList.contains('on')) { lightbox.classList.remove('on'); return; } if (caseIdx >= 0) { locked = false; return navBack('#'); } }
    const next = ['ArrowDown', 'PageDown', ' '].includes(e.key), prev = ['ArrowUp', 'PageUp'].includes(e.key);
    if (!next && !prev) return;
    if (e.target.closest('button') && e.key === ' ') return;
    e.preventDefault();
    const d = next ? 1 : -1;
    caseIdx >= 0 ? stepCase(d) : goStage(stage + d);
  });
  document.querySelectorAll('.dd-labels button').forEach((b) => b.addEventListener('click', () => { locked = false; goStage(+b.dataset.go); }));

  /* ---------- Cursor as the hand ---------- */
  const mouse = { wx: 0, wy: 0, on: false };
  const ray = new THREE.Vector3();
  addEventListener('pointermove', (e) => {
    mouse.on = true;
    ray.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1, .5).unproject(camera).sub(camera.position).normalize();
    const t = -camera.position.z / ray.z;
    mouse.wx = camera.position.x + ray.x * t; mouse.wy = camera.position.y + ray.y * t;
  }, { passive: true });
  document.addEventListener('pointerleave', () => (mouse.on = false));

  /* ---------- Layout ---------- */
  let baseZ = 120, W = 0, H = 0;
  function resize() {
    W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight;   // never 0 (would give infinite channel spacing)
    renderer.setSize(W, H, false); camera.aspect = W / H;
    baseZ = Math.max(120, 80 / Math.tan(THREE.MathUtils.degToRad(20)) / camera.aspect);
    const ppu = H / (2 * baseZ * Math.tan(THREE.MathUtils.degToRad(20)));
    const cardH = (document.querySelector('.card')?.offsetHeight || 90) + 14;
    CH = CH0.map((y) => y * Math.max(1, cardH / (17 * ppu)));
    H1 = baseZ * Math.tan(THREE.MathUtils.degToRad(20)) * camera.aspect;   // half the visible width
    C2 = 2 * H1; C3 = 4 * H1; CARDX = C3 + .8 * H1; XEND = C3 + H1 + 20; FX = CARDX + 22;
  }
  addEventListener('resize', resize); resize();

  /* ---------- prototypes: faint glass panels far in the background of Develop and Deliver ---------- */
  function panelGeo(kind) {
    const v = [], w = 13, h = 8;
    const L = (x1, y1, x2, y2) => v.push(x1, y1, 0, x2, y2, 0);
    const rect = (x, y, rw, rh) => { L(x, y, x + rw, y); L(x + rw, y, x + rw, y + rh); L(x + rw, y + rh, x, y + rh); L(x, y + rh, x, y); };
    const circ = (cx, cy, r) => { for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, b = (i + 1) / 14 * 6.283; L(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(b) * r, cy + Math.sin(b) * r); } };
    rect(-w, -h, w * 2, h * 2); L(-w, h - 3, w, h - 3); L(-w + 1.5, h - 1.5, -w + 7, h - 1.5);        // frame, title bar, title
    if (kind === 0) { for (let i = 0; i < 4; i++) rect(-11 + i * 6, -2, 3.6, 2.6); for (let i = 0; i < 3; i++) L(-7.4 + i * 6, -.7, -5 + i * 6, -.7); rect(-5, -6.5, 3.6, 2.6); L(-3.2, -3.9, -3.2, -2); }   // workflow
    if (kind === 1) { for (let i = 0; i < 4; i++) circ(-9 + i * 6, -1, 1.6); for (let i = 0; i < 3; i++) L(-7.4 + i * 6, -1, -4.6 + i * 6, -1); L(11, -1, 13, -1); }                                     // user journey
    if (kind === 2) { for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) rect(-11 + c * 3.6, -6 + r * 3.4, 2.4, 2); rect(1, -6, 9, 8.5); L(3, -2, 5, 1.5); L(5, 1.5, 7, -2); }                   // design system
    if (kind === 3) { for (let r = 0; r < 4; r++) { circ(-10, 2 - r * 2.6, .7); L(-8.5, 2 - r * 2.6, 2, 2 - r * 2.6); } for (let i = 0; i < 5; i++) L(5 + i * 1.5, -6.5, 5 + i * 1.5, -6.5 + 1.5 + (i % 3) * 1.6); } // activity
    if (kind === 4) { L(-11, 1.5, 3, 1.5); circ(9, 1.5, 1.8); rect(-11, -3, 20, 1.2); L(-11, -2.4, 0, -2.4); }                                                                                                // AI insight
    if (kind === 5) { const pts = [-11, -5, -7, -2, -3, -4, 1, 1, 5, -1]; for (let i = 0; i < 8; i += 2) L(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]); circ(9, -2, 3); circ(9, -2, 1.8); }             // chart + donut
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3)); return g;
  }
  // [where along the journey (in screens from Develop), height, depth, tilt, kind]
  const PANELS = [[.55, 20, -42, -.3, 5], [.75, -18, -55, .25, 0], [.95, 4, -65, -.2, 4],
                  [1.35, 24, -38, .28, 1], [1.5, -22, -46, -.25, 2], [1.7, 2, -60, .2, 3], [1.95, 18, -52, -.3, 0], [2.1, -12, -40, .3, 1]];
  const panels = PANELS.map(([at, y, z, rot, kind]) => {
    const m = new THREE.LineBasicMaterial({ transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const o = new THREE.LineSegments(panelGeo(kind), m);
    o.userData = { at, y, z, rot }; o.rotation.y = rot; o.rotation.x = rot * -.2; o.frustumCulled = false; scene.add(o); return o;
  });
  function placePanels() { panels.forEach((o) => { o.position.set(C2 + o.userData.at * H1, o.userData.y, o.userData.z); o.userData.px = o.position.x; }); }
  placePanels(); addEventListener('resize', placePanels);

  const caps = [...document.querySelectorAll('.caption p')];
  const skipBtn = document.querySelector('.skip'), cue = document.querySelector('.cue');
  skipBtn.addEventListener('click', () => { locked = false; goStage(3); });
  cue.addEventListener('click', () => { locked = false; goStage(stage + 1); });
  const cards = [...document.querySelectorAll('.card')];
  const ddBtns = [...document.querySelectorAll('.dd-labels button')];
  // Double Diamond as a live mini-map: a thin stream mirrors the big scene; the stage you're in is lit
  const mapC = document.querySelector('.dd-map'), mx2 = mapC.getContext('2d');
  const MP = Array.from({ length: small ? 110 : 170 }, (_, i) => ({ u: rnd(), s: rnd() * 2 - 1, ch: i % 4, ph: rnd() * 6.28, v: .045 + rnd() * .03 }));
  let mapHi = 0;
  function drawMap(dt, t) {
    const dpr = Math.min(devicePixelRatio, 2), w = mapC.clientWidth, h = mapC.clientHeight;
    if (!w) return;
    if (mapC.width !== Math.round(w * dpr)) { mapC.width = Math.round(w * dpr); mapC.height = Math.round(h * dpr); }
    mx2.setTransform(dpr, 0, 0, dpr, 0, 0); mx2.clearRect(0, 0, w, h);
    const mid = h / 2, amp = h / 2 - 3, light = isLight();
    const env = (u) => u < .5 ? 1 - Math.abs(u - .25) / .25 : 1 - Math.abs(u - .75) / .25;
    mapHi = mix(mapHi, stage, 1 - Math.exp(-6 * dt));
    // lit quarter
    const q0 = mapHi * w / 4, q1 = q0 + w / 4;
    const grad = mx2.createLinearGradient(q0, 0, q1, 0);
    const sig = css('--signal');
    mx2.save(); mx2.beginPath(); mx2.moveTo(0, mid); mx2.lineTo(w / 4, mid - amp); mx2.lineTo(w / 2, mid); mx2.lineTo(w / 4, mid + amp); mx2.closePath();
    mx2.moveTo(w / 2, mid); mx2.lineTo(w * .75, mid - amp); mx2.lineTo(w, mid); mx2.lineTo(w * .75, mid + amp); mx2.closePath();
    mx2.strokeStyle = css('--rule'); mx2.lineWidth = 1.2; mx2.stroke(); mx2.clip();
    mx2.globalAlpha = .14; mx2.fillStyle = sig; mx2.fillRect(q0, 0, w / 4, h); mx2.restore();
    // the stream: scattered → pinch → four coloured strands → converging to the tip
    for (const p of MP) {
      if (!reduced) p.u = (p.u + dt * p.v) % 1;
      const u = p.u, lane = (p.ch / 1.5 - 1) * .8, k = ss(.5, .62, u);
      const jit = (1 - ss(.15, .45, u)) * Math.sin(t * 2.2 + p.ph) * .25;
      const sE = mix(p.s + jit, lane, k);
      const x = u * w, y = mid + sE * env(u) * amp * .92;
      const q = Math.min(3, Math.floor(u * 4)), on = Math.abs(q - mapHi) < .6;
      const c = k > .5 ? colors.ch[p.ch] : (p.ch % 2 ? colors.a : colors.b);
      mx2.globalAlpha = on ? .95 : .3;
      mx2.fillStyle = `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
      const r = on ? 1.8 : 1.3;
      mx2.fillRect(x - r / 2, y - r / 2, r, r);
    }
    mx2.globalAlpha = 1;
  }
  const dd = document.querySelector('.dd');

  const GX = 10, GY = -1;   // galaxy centre, right of the caption

  const neutral = new THREE.Color(), lineCol = new THREE.Color();

  /* ---------- Loop ---------- */
  const tmp = { x: 0, y: 0 }, v3 = new THREE.Vector3(), look = new THREE.Vector3();
  let last = performance.now(), flowT = 0;
  function frame(now) {
    requestAnimationFrame(frame);

    const dt = clamp((now - last) / 1000, 0, .05); last = now;   // never negative (the first frame can be timestamped earlier)
    const time = now / 1000;
    if (!reduced) flowT += dt;
    // step 1 (.04→.42): converge · step 2 (.42→.64): split · step 3 (.64→.96): cards
    const conv = ss(.06, .40, prog), product = ss(.68, .92, prog);
    const grow = ss(.18, .42, prog);                                   // Define: lines grow out of the pinch to the right
    const sep = 0; PT = time;
    // camera pans one screen per step: Discover/Define at 0 → Develop at C2 → Deliver at C3
    const camX = C2 * clamp((prog - .42) / .22, 0, 1) + (C3 - C2) * clamp((prog - .64) / .32, 0, 1);
    const light = isLight();
    const ct = easeIO(caseOpen);

    // camera: wide shot → tracks to the focused channel; between cases it crabs from one channel to the next
    const fi0 = Math.floor(focusIdx), fi1 = Math.min(3, fi0 + 1), ff = focusIdx - fi0;
    const focus = { x: FX, y: mix(CH[fi0], CH[fi1], ff) };
    const push = 1 - (prog - STAGE_P[0]) / (STAGE_P[3] - STAGE_P[0]) * .05;   // a gentle push on every step
    const hvDef = baseZ * (1 - (STAGE_P[1] - STAGE_P[0]) / (STAGE_P[3] - STAGE_P[0]) * .05) * Math.tan(THREE.MathUtils.degToRad(20)) * camera.aspect;
    camera.position.set(mix(camX, focus.x, ct), mix(0, focus.y, ct), mix(baseZ * push, small ? 122 : 68, ct));
    look.set(mix(camX, focus.x, ct), mix(0, focus.y, ct), 0); camera.lookAt(look);
    if (W < 760) camera.setViewOffset(W, H, 0, mix(-H * .1, H * .24, ct), W, H);   // leave room for the caption on phones
    else camera.setViewOffset(W, H, 0, 0, W, H);
    camera.updateProjectionMatrix();

    for (let i = 0; i < COUNT; i++) {
      const p = P[i];
      const c = clamp((conv - p.delay) / (1 - p.delay), 0, 1), ce = c * c * (3 - 2 * c);
      const u = Math.pow((p.u0 + flowT * p.sp * (.25 + ce)) % 1, 1.6);
      const xp = xOf(u), wob = reduced ? 0 : Math.sin(time * 1.3 + p.ph + xp * .04) * (1 - ss(-50, -5, xp) * .65) * .8;
      const pk = 1 - Math.min(1, Math.abs(xp + 20) / 35);   // closeness to the pinch
      path(p.sy, p.ch, u, sep, tmp, wob);
      const gr = 2.5 + p.gr * 60, gt = reduced ? 0 : time;
      const th = p.gj + p.garm * 2.094 + Math.log(gr / 2.5) * 1.3 + gt * .22 / Math.sqrt(gr / 8) + ce * 3.2;
      const gx = GX + Math.cos(th) * gr, gy = GY + Math.sin(th) * gr * .5 + Math.sin(th * 2 + p.ph) * .6, gz = Math.sin(th) * gr * .3 + p.gz;
      let x = mix(gx, tmp.x, ce), y = mix(gy, tmp.y, ce), z = mix(gz, p.z, ce);
      if (mouse.on && !reduced && caseOpen < .01) {
        const mx = mouse.wx - x, my = mouse.wy - y, f = Math.exp(-(mx * mx + my * my) / 180) * (.5 + ce * .5);
        x += mx * f * .45; y += my * f * .45;
      }
      const fk = formK[p.ch] * ct;
      if (fk > 0 && ce > .5) y += essence(p.ch, x - FX, p.sy * .04, reduced ? 1 : time) * fk;
      let fade = 1 - ct * .9 * (1 - formK[p.ch]), sizeMul = 1;
      if (p.fi >= 0 && fk > 0) {
        const e = F[p.ch][p.fi];
        let fx = e[0], fy = e[1];
        if (e[3] >= 0) { const q = jPt((e[3] + flowT * .045) % 1); fx = q.x; fy = q.y; }
        const k = clamp((fk - p.delay * .5) / .7, 0, 1), ke = k * k * (3 - 2 * k);
        x = mix(x, FX + fx, ke); y = mix(y, CH[p.ch] + fy, ke); z = mix(z, 0, ke);
        fade = mix(fade, 1, ke); sizeMul = mix(1, e[2] * 1.5, ke);
      }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      if (ct > 0 && !small) fade *= 1 - ct * (1 - ss(FX - 12, FX - 3, x));

      const a = colors.a, b = colors.b, k = colors.ch[p.ch], t1 = mix((i % 3) / 2 * .6, 1 - p.gr, (1 - ce) * .7);
      let cr = mix(a.r, b.r, t1), cg = mix(a.g, b.g, t1), cb = mix(a.b, b.b, t1);
      const toCh = 1;   // dust keeps its project colour from the galaxy to the case
      cr = mix(cr, k.r, toCh); cg = mix(cg, k.g, toCh); cb = mix(cb, k.b, toCh);
      const core = (1 - ce) * (p.halo ? -.35 : (1 - p.gr) * 1.4);
      const bright = (light ? 1 : (.75 + .25 * ce) * (1 + core) * (1 + pk * ce * .8 * (1 - fk))) * fade;
      col[i * 3] = cr * bright; col[i * 3 + 1] = cg * bright; col[i * 3 + 2] = cb * bright;
      siz[i] = p.size * (1.35 - ce * .35 + ce * .4 * pk * (1 - fk)) * sizeMul;
    }
    geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = geo.attributes.size.needsUpdate = true;

    // prototypes: barely visible panels; they get a little clearer as the camera travels toward them, and step back for a case
    panels.forEach((o) => {
      const px = o.userData.px;
      const vis = .04 + .1 * ss(px - 1.4 * H1, px - .2 * H1, camX);   // barely visible, a little clearer up close
      o.material.opacity = vis * ss(-.2 * H1, .6 * H1, camX) * (1 - ct) * (light ? 1.4 : 1);
      o.material.color.set(light ? '#3A4E6A' : '#6FD8E8'); o.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    });

    boxes.forEach((b) => {
      const k = 1 - ss(.12, .4, prog);
      b.visible = k > .01; b.scale.setScalar(Math.max(k, .01));
      b.position.set(b.userData.home.x + (reduced ? 0 : Math.sin(time * .4 + b.userData.ph) * 1.5), b.userData.home.y, b.userData.home.z);
      b.rotation.z = reduced ? 0 : Math.sin(time * .2 + b.userData.ph) * .3;
    });
    boxMat.opacity = 0;
    const bgc = light ? new THREE.Color(css('--bg')) : null;
    neutral.set(light ? '#2E3A48' : '#CFEFEA');
    cores.forEach((line, k) => {
      const ch = line.userData.ch, arr = line.geometry.attributes.position.array, carr = line.geometry.attributes.color.array;
      const fk = formK[ch] * ct, cc = colors.ch[ch];
      const off = line.userData.sy * .04;
      path(line.userData.sy, ch, 75 / (XEND + 95), sep, tmp, 0); const px0 = tmp.x, py0 = tmp.y; let lvx = px0, lvy = py0;
      for (let j = 0; j < LP; j++) {
        const u = j / (LP - 1);
        // one continuous travelling wave along the full line, bigger on the left where the lines are loose
        const xl = xOf(u), wob = reduced ? 0 : Math.sin(time * 1.1 + k + xl * .035) * .5 * (1 - ss(-95, 10, xl) * .55) + Math.sin(xl * .13 - time * 2.2 + k) * .18 * ss(-15, 40, xl);
        path(line.userData.sy, ch, u, sep, tmp, wob);
        let x = tmp.x, y = tmp.y;
        if (fk > 0) {
          const et = reduced ? 1 : time, lx = tmp.x - FX;
          const e0 = essence(ch, lx, off, et), e1 = essence(ch, lx + .25, off, et);
          const sl = (e1 - e0) / .25 * fk, len = Math.hypot(1, sl);
          // centre of the ribbon follows the essence curve; each line keeps its distance at a right angle to it
          x = tmp.x + (-sl / len) * off * fk;
          y = (tmp.y - off) + e0 * fk + off * mix(1, 1 / len, fk);
        }
        arr[j * 3] = x; arr[j * 3 + 1] = y; arr[j * 3 + 2] = 0;
        // brightness: the open project's lines stay bright; nothing bright behind the text
        let b = 1 - ct * (1 - formK[ch]) * .85;
        // no lines left of the pinch (only dust there); they grow out of it to the right
        if (ct < 1) {
          const gEnd = mix(-20, XEND + 10, grow), mask = mix(clamp((xl + hvDef) / (2 * hvDef), 0, 1) * (1 - ss(gEnd - 10, gEnd, xl)), 1, ct);   // linear: 0% at the left edge, 50% in the middle, 100% at the right edge
          b *= mask;
          // (the scene background is opaque, so fully faded parts need no special handling)
        }
        if (ct > 0 && !small) b *= 1 - ct * (1 - ss(FX - 12, FX - 3, tmp.x));
        if (light) { carr[j * 3] = mix(bgc.r, cc.r, b); carr[j * 3 + 1] = mix(bgc.g, cc.g, b); carr[j * 3 + 2] = mix(bgc.b, cc.b, b); }
        else { carr[j * 3] = cc.r * b; carr[j * 3 + 1] = cc.g * b; carr[j * 3 + 2] = cc.b * b; }
      }
      line.geometry.attributes.position.needsUpdate = true; line.geometry.attributes.color.needsUpdate = true;
    });
    coreMat.forEach((m) => (m.opacity = ss(.16, .30, prog) * (light ? .6 : .75)));

    renderer.render(scene, camera);

    const inCase = caseOpen > .02;
    skipBtn.classList.toggle('off', stage === 3 || inCase);
    cue.classList.toggle('off', stage !== 0 || inCase);
    dd.style.opacity = 1 - ct; dd.style.pointerEvents = inCase ? 'none' : '';
    ddBtns.forEach((b, i) => { b.classList.toggle('on', i === stage); b.setAttribute('aria-current', i === stage ? 'step' : 'false'); });
    drawMap(dt, time);
    cards.forEach((card, i) => {
      v3.set(CARDX, CH[i], 0).project(camera);
      const x = (v3.x + 1) / 2 * W, y = (1 - v3.y) / 2 * H;
      const o = ss(.68 + i * .05, .80 + i * .04, prog) * (1 - ct * 1.5);
      card.style.opacity = Math.max(0, o);
      card.classList.toggle('on', o > .5 && !inCase);
      card.tabIndex = o > .5 && !inCase ? 0 : -1;
      card.style.transform = `translate(${Math.min(x, W - card.offsetWidth - 12) + (1 - clamp(o, 0, 1)) * 30}px, ${y - card.offsetHeight / 2}px)`;
    });
  }
  requestAnimationFrame(frame);
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

})();
