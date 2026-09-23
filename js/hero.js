/* =========================================================
   Hero network — four clusters, one per case study.
   Links carry travelling pulses; the Transparency Register
   cluster holds the one amber "deadline" node.
   Hovering a project in the index lights its cluster.
   ========================================================= */
import * as THREE from 'three';

const SIGNAL = new THREE.Color('#58D6D0');
const DIM = new THREE.Color('#2C4A5A');
const FAULT = new THREE.Color('#F2A43A');

const CLUSTERS = [
  { id: 'tr',  label: 'transparency-register · 90d', center: [-11, 8, -2],  fault: true },
  { id: 'onb', label: 'onboarding · 148 steps',      center: [11, 9, 3] },
  { id: 'gw',  label: 'graphwalk · virtual path',    center: [-8, -9, 6] },
  { id: 'ran', label: 'single-ran · live topology',  center: [12, -8, -4] },
];

// Deterministic randomness so the network looks the same every visit.
function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }
function gauss(r) { return (r() + r() + r() - 1.5) / 1.5; }

export function createHero({ canvas, labelEl, reducedMotion, onReady }) {
  const small = window.matchMedia('(max-width: 640px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  camera.position.set(0, 0, small ? 92 : 64);

  const world = new THREE.Group();
  scene.add(world);

  /* ---------- Build nodes ---------- */
  const r = rng(7);
  const perCluster = small ? 14 : 22;
  const nodes = []; // {pos, cluster, base, size, phase}
  CLUSTERS.forEach((c, ci) => {
    for (let i = 0; i < perCluster; i++) {
      const spread = i === 0 ? 0 : 5.2;
      nodes.push({
        pos: new THREE.Vector3(c.center[0] + gauss(r) * spread, c.center[1] + gauss(r) * spread * 0.8, c.center[2] + gauss(r) * spread),
        cluster: ci,
        hub: i === 0,
        fault: c.fault && i === 0,
        size: i === 0 ? 11 : 3.5 + r() * 4,
        phase: r() * Math.PI * 2,
      });
    }
  });
  // A few "backbone" nodes between clusters
  for (let i = 0; i < (small ? 5 : 9); i++) {
    nodes.push({ pos: new THREE.Vector3(gauss(r) * 14, gauss(r) * 10, gauss(r) * 12), cluster: -1, hub: false, size: 2.5 + r() * 2.5, phase: r() * 6 });
  }

  /* ---------- Build edges (nearest neighbours + hub backbone) ---------- */
  const edges = [];
  const key = (a, b) => (a < b ? a + '-' + b : b + '-' + a);
  const seen = new Set();
  const addEdge = (a, b) => { const k = key(a, b); if (a !== b && !seen.has(k)) { seen.add(k); edges.push([a, b]); } };
  nodes.forEach((n, i) => {
    const near = nodes
      .map((m, j) => ({ j, d: n.pos.distanceTo(m.pos), same: m.cluster === n.cluster }))
      .filter((x) => x.j !== i && (x.same || n.cluster === -1))
      .sort((a, b) => a.d - b.d)
      .slice(0, n.hub ? 6 : 3);
    near.forEach((x) => addEdge(i, x.j));
  });
  const hubs = nodes.map((n, i) => (n.hub ? i : -1)).filter((i) => i >= 0);
  const backbone = nodes.map((n, i) => (n.cluster === -1 ? i : -1)).filter((i) => i >= 0);
  hubs.forEach((h, k) => { addEdge(h, backbone[k % backbone.length]); addEdge(h, backbone[(k + 3) % backbone.length]); });

  /* ---------- Node points (custom glow shader) ---------- */
  const N = nodes.length;
  const nPos = new Float32Array(N * 3);
  const nCol = new Float32Array(N * 3);
  const nSize = new Float32Array(N);
  nodes.forEach((n, i) => { n.pos.toArray(nPos, i * 3); });
  const nGeo = new THREE.BufferGeometry();
  nGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
  nGeo.setAttribute('color', new THREE.BufferAttribute(nCol, 3));
  nGeo.setAttribute('size', new THREE.BufferAttribute(nSize, 1));

  const pointMat = new THREE.ShaderMaterial({
    uniforms: { uPixel: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute float size; attribute vec3 color; varying vec3 vColor;
      uniform float uPixel;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * uPixel * (150.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float glow = smoothstep(0.5, 0.0, d);
        float core = smoothstep(0.16, 0.08, d);
        gl_FragColor = vec4(vColor * (glow * 0.55 + core), glow * 0.9 + core);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  world.add(new THREE.Points(nGeo, pointMat));

  /* ---------- Edges ---------- */
  const E = edges.length;
  const ePos = new Float32Array(E * 6);
  const eCol = new Float32Array(E * 6);
  edges.forEach(([a, b], i) => { nodes[a].pos.toArray(ePos, i * 6); nodes[b].pos.toArray(ePos, i * 6 + 3); });
  const eGeo = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  eGeo.setAttribute('color', new THREE.BufferAttribute(eCol, 3));
  const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
  world.add(new THREE.LineSegments(eGeo, lineMat));

  /* ---------- Pulses travelling along edges ---------- */
  const P = small ? 22 : 40;
  const pulses = Array.from({ length: P }, () => ({ e: Math.floor(Math.random() * E), t: Math.random(), speed: 0.12 + Math.random() * 0.25 }));
  const pPos = new Float32Array(P * 3);
  const pCol = new Float32Array(P * 3);
  const pSize = new Float32Array(P).fill(small ? 3.2 : 3.6);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute('size', new THREE.BufferAttribute(pSize, 1));
  world.add(new THREE.Points(pGeo, pointMat));

  /* ---------- State ---------- */
  let active = -1;                 // hovered cluster
  const boot = { start: performance.now() };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollP = 0;
  let running = true;
  let visible = true;
  const tmp = new THREE.Vector3();
  const cA = new THREE.Color(), cB = new THREE.Color();

  function nodeColor(n, time, out) {
    // Boot: clusters light up one after another
    const appear = THREE.MathUtils.clamp((time - (n.cluster < 0 ? 0.2 : 0.35 + n.cluster * 0.28)) / 0.6, 0, 1);
    const isOn = active === -1 || n.cluster === active;
    let base = n.fault ? FAULT : n.cluster === -1 ? DIM : SIGNAL;
    out.copy(base).multiplyScalar(isOn ? (n.cluster === -1 ? 0.7 : 1) : 0.28);
    if (n.fault) out.multiplyScalar(0.55 + 0.45 * (0.5 + 0.5 * Math.sin(time * 3.2)));
    return appear;
  }

  function update(time) {
    // nodes
    for (let i = 0; i < N; i++) {
      const n = nodes[i];
      const appear = nodeColor(n, time, cA);
      const breathe = reducedMotion ? 1 : 1 + 0.12 * Math.sin(time * 1.4 + n.phase);
      const boost = active !== -1 && n.cluster === active ? 1.35 : 1;
      nSize[i] = n.size * breathe * boost * appear;
      cA.toArray(nCol, i * 3);
    }
    nGeo.attributes.size.needsUpdate = true;
    nGeo.attributes.color.needsUpdate = true;

    // edges
    for (let i = 0; i < E; i++) {
      const [a, b] = edges[i];
      const na = nodes[a], nb = nodes[b];
      const appear = Math.min(nodeColor(na, time, cA), nodeColor(nb, time, cB));
      const lit = active !== -1 && (na.cluster === active || nb.cluster === active);
      const f = (active === -1 ? 0.5 : lit ? 0.95 : 0.1) * appear;
      const col = na.fault || nb.fault ? FAULT : SIGNAL;
      for (let k = 0; k < 2; k++) { eCol[i * 6 + k * 3] = col.r * f; eCol[i * 6 + k * 3 + 1] = col.g * f; eCol[i * 6 + k * 3 + 2] = col.b * f; }
    }
    eGeo.attributes.color.needsUpdate = true;

    // pulses
    for (let i = 0; i < P; i++) {
      const p = pulses[i];
      if (!reducedMotion) p.t += p.speed * 0.016 * (active === -1 ? 1 : 1.6);
      if (p.t > 1) {
        p.t = 0;
        // prefer edges of the active cluster
        let tries = 0;
        do { p.e = Math.floor(Math.random() * E); tries++; }
        while (active !== -1 && tries < 12 && nodes[edges[p.e][0]].cluster !== active && nodes[edges[p.e][1]].cluster !== active);
      }
      const [a, b] = edges[p.e];
      tmp.lerpVectors(nodes[a].pos, nodes[b].pos, p.t).toArray(pPos, i * 3);
      const lit = active === -1 || nodes[a].cluster === active || nodes[b].cluster === active;
      const col = nodes[a].fault || nodes[b].fault ? FAULT : SIGNAL;
      const f = (time > 1.4 ? 1 : 0) * (lit ? 1 : 0.15) * Math.sin(p.t * Math.PI);
      pCol[i * 3] = col.r * f; pCol[i * 3 + 1] = col.g * f; pCol[i * 3 + 2] = col.b * f;
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;
  }

  function placeLabel() {
    if (!labelEl) return;
    if (active === -1) { labelEl.classList.remove('is-on'); return; }
    const hub = nodes[hubs[active]];
    tmp.copy(hub.pos).applyMatrix4(world.matrixWorld).project(camera);
    const rect = canvas.getBoundingClientRect();
    labelEl.style.left = ((tmp.x + 1) / 2) * rect.width + 'px';
    labelEl.style.top = ((1 - tmp.y) / 2) * rect.height + 'px';
    labelEl.textContent = CLUSTERS[active].label;
    labelEl.classList.toggle('is-fault', !!CLUSTERS[active].fault);
    labelEl.classList.add('is-on');
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // push the network right on wide screens so the headline stays readable
    camera.setViewOffset(w, h, w > 900 ? -w * 0.24 : 0, w > 900 ? h * 0.04 : 0, w, h);
    camera.updateProjectionMatrix();
  }

  let last = performance.now();
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!visible) return;
    const time = (now - boot.start) / 1000;
    const dt = Math.min((now - last) / 1000, 0.05); last = now;

    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    if (!reducedMotion) world.rotation.y += dt * 0.05;
    world.rotation.x = mouse.y * 0.18;
    world.position.x = mouse.x * 1.6;
    camera.position.z = (small ? 92 : 64) + scrollP * 26;
    camera.position.y = -scrollP * 8;
    camera.lookAt(0, -scrollP * 8, 0);

    update(reducedMotion ? 10 : time);
    renderer.render(scene, camera);
    placeLabel();
  }

  /* ---------- Wire up ---------- */
  resize();
  new ResizeObserver(resize).observe(canvas);
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  window.addEventListener('scroll', () => {
    scrollP = Math.min(window.scrollY / window.innerHeight, 1);
  }, { passive: true });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  if (reducedMotion) {
    // One still frame, re-rendered only when something changes.
    update(10); renderer.render(scene, camera);
    running = false;
  } else {
    requestAnimationFrame(frame);
  }
  onReady?.();

  return {
    setActive(i) {
      active = i;
      if (reducedMotion) { update(10); renderer.render(scene, camera); placeLabel(); }
    },
  };
}
