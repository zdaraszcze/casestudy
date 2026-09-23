/* =========================================================
   The network — one cluster per case study, in page order.
   It sits behind the whole page. As you scroll into a case,
   the camera flies to that project's cluster.
   ========================================================= */
import * as THREE from 'three';

const SIGNAL = new THREE.Color('#58D6D0');
const DIM = new THREE.Color('#2C4A5A');
const FAULT = new THREE.Color('#F2A43A');

export const CLUSTERS = [
  { id: 'onb', label: 'onboarding · 148 steps',      center: [11, 9, 3] },
  { id: 'ran', label: 'single-ran · live topology',  center: [12, -8, -4] },
  { id: 'gw',  label: 'graphwalk · virtual path',    center: [-8, -9, 6] },
  { id: 'tr',  label: 'transparency-register · 90d', center: [-11, 8, -2], fault: true },
];

function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }
function gauss(r) { return (r() + r() + r() - 1.5) / 1.5; }
const damp = (a, b, lambda, dt) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));

export function createNetwork({ canvas, labelEl, reducedMotion, onReady }) {
  const small = window.matchMedia('(max-width: 900px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  const world = new THREE.Group();
  scene.add(world);

  /* ---------- Nodes ---------- */
  const r = rng(7);
  const perCluster = small ? 14 : 22;
  const nodes = [];
  CLUSTERS.forEach((c, ci) => {
    for (let i = 0; i < perCluster; i++) {
      const spread = i === 0 ? 0 : 5.2;
      nodes.push({
        pos: new THREE.Vector3(c.center[0] + gauss(r) * spread, c.center[1] + gauss(r) * spread * 0.8, c.center[2] + gauss(r) * spread),
        cluster: ci, hub: i === 0, fault: !!c.fault && i === 0,
        size: i === 0 ? 11 : 3.5 + r() * 4, phase: r() * Math.PI * 2,
      });
    }
  });
  for (let i = 0; i < (small ? 6 : 10); i++) {
    nodes.push({ pos: new THREE.Vector3(gauss(r) * 14, gauss(r) * 10, gauss(r) * 12), cluster: -1, hub: false, size: 2.5 + r() * 2.5, phase: r() * 6 });
  }
  // Distant dust for depth
  const DUST = small ? 140 : 320;
  const dPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) { dPos[i * 3] = (r() - .5) * 160; dPos[i * 3 + 1] = (r() - .5) * 110; dPos[i * 3 + 2] = (r() - .5) * 120 - 20; }

  /* ---------- Edges ---------- */
  const edges = [];
  const seen = new Set();
  const addEdge = (a, b) => { const k = a < b ? a + '-' + b : b + '-' + a; if (a !== b && !seen.has(k)) { seen.add(k); edges.push([a, b]); } };
  nodes.forEach((n, i) => {
    nodes.map((m, j) => ({ j, d: n.pos.distanceTo(m.pos), same: m.cluster === n.cluster }))
      .filter((x) => x.j !== i && (x.same || n.cluster === -1))
      .sort((a, b) => a.d - b.d).slice(0, n.hub ? 6 : 3)
      .forEach((x) => addEdge(i, x.j));
  });
  const hubs = nodes.map((n, i) => (n.hub ? i : -1)).filter((i) => i >= 0);
  const backbone = nodes.map((n, i) => (n.cluster === -1 ? i : -1)).filter((i) => i >= 0);
  hubs.forEach((h, k) => { addEdge(h, backbone[k % backbone.length]); addEdge(h, backbone[(k + 3) % backbone.length]); });

  /* ---------- Materials ---------- */
  const pointMat = new THREE.ShaderMaterial({
    uniforms: { uPixel: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute float size; attribute vec3 color; varying vec3 vColor; uniform float uPixel;
      void main() { vColor = color; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * uPixel * (150.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        float glow = smoothstep(0.5, 0.0, d); float core = smoothstep(0.16, 0.08, d);
        gl_FragColor = vec4(vColor * (glow * 0.55 + core), glow * 0.9 + core); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });

  const N = nodes.length;
  const nPos = new Float32Array(N * 3), nCol = new Float32Array(N * 3), nSize = new Float32Array(N);
  nodes.forEach((n, i) => n.pos.toArray(nPos, i * 3));
  const nGeo = new THREE.BufferGeometry();
  nGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
  nGeo.setAttribute('color', new THREE.BufferAttribute(nCol, 3));
  nGeo.setAttribute('size', new THREE.BufferAttribute(nSize, 1));
  world.add(new THREE.Points(nGeo, pointMat));

  const E = edges.length;
  const ePos = new Float32Array(E * 6), eCol = new Float32Array(E * 6);
  edges.forEach(([a, b], i) => { nodes[a].pos.toArray(ePos, i * 6); nodes[b].pos.toArray(ePos, i * 6 + 3); });
  const eGeo = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  eGeo.setAttribute('color', new THREE.BufferAttribute(eCol, 3));
  world.add(new THREE.LineSegments(eGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })));

  const P = small ? 26 : 48;
  const pulses = Array.from({ length: P }, () => ({ e: Math.floor(Math.random() * E), t: Math.random(), speed: 0.12 + Math.random() * 0.25 }));
  const pPos = new Float32Array(P * 3), pCol = new Float32Array(P * 3), pSize = new Float32Array(P).fill(3.8);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute('size', new THREE.BufferAttribute(pSize, 1));
  world.add(new THREE.Points(pGeo, pointMat));

  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(DUST * 3).fill(0.16), 3));
  dGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(DUST).map(() => 1 + r() * 1.6), 1));
  scene.add(new THREE.Points(dGeo, pointMat));

  /* ---------- State ---------- */
  let hover = -1, focus = -1, velocity = 0;
  const cam = { x: 0, y: 0, z: 0, dist: small ? 96 : 64, off: small ? 0 : -0.24, offY: small ? 0 : 0.04 };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const start = performance.now();
  let visible = true, running = true, last = performance.now();
  const tmp = new THREE.Vector3(), cA = new THREE.Color(), cB = new THREE.Color();
  const lit = () => (hover >= 0 ? hover : focus);

  function nodeColor(n, time, out) {
    const appear = THREE.MathUtils.clamp((time - (n.cluster < 0 ? 0.2 : 0.35 + n.cluster * 0.28)) / 0.6, 0, 1);
    const L = lit();
    const on = L === -1 || n.cluster === L;
    out.copy(n.fault ? FAULT : n.cluster === -1 ? DIM : SIGNAL).multiplyScalar(on ? (n.cluster === -1 ? 0.7 : 1) : 0.22);
    if (n.fault) out.multiplyScalar(0.55 + 0.45 * (0.5 + 0.5 * Math.sin(time * 3.2)));
    return appear;
  }

  function update(time, dt) {
    const L = lit();
    for (let i = 0; i < N; i++) {
      const n = nodes[i];
      const appear = nodeColor(n, time, cA);
      const breathe = reducedMotion ? 1 : 1 + 0.12 * Math.sin(time * 1.4 + n.phase);
      nSize[i] = n.size * breathe * (L !== -1 && n.cluster === L ? 1.35 : 1) * appear;
      cA.toArray(nCol, i * 3);
    }
    nGeo.attributes.size.needsUpdate = true; nGeo.attributes.color.needsUpdate = true;

    for (let i = 0; i < E; i++) {
      const [a, b] = edges[i]; const na = nodes[a], nb = nodes[b];
      const appear = Math.min(nodeColor(na, time, cA), nodeColor(nb, time, cB));
      const on = L !== -1 && (na.cluster === L || nb.cluster === L);
      const f = (L === -1 ? 0.5 : on ? 0.95 : 0.08) * appear;
      const col = na.fault || nb.fault ? FAULT : SIGNAL;
      for (let k = 0; k < 2; k++) { eCol[i * 6 + k * 3] = col.r * f; eCol[i * 6 + k * 3 + 1] = col.g * f; eCol[i * 6 + k * 3 + 2] = col.b * f; }
    }
    eGeo.attributes.color.needsUpdate = true;

    const boost = 1 + Math.min(Math.abs(velocity) * 0.08, 4);
    for (let i = 0; i < P; i++) {
      const p = pulses[i];
      if (!reducedMotion) p.t += p.speed * dt * (L === -1 ? 1 : 1.6) * boost;
      if (p.t > 1) {
        p.t = 0; let tries = 0;
        do { p.e = Math.floor(Math.random() * E); tries++; }
        while (L !== -1 && tries < 12 && nodes[edges[p.e][0]].cluster !== L && nodes[edges[p.e][1]].cluster !== L);
      }
      const [a, b] = edges[p.e];
      tmp.lerpVectors(nodes[a].pos, nodes[b].pos, p.t).toArray(pPos, i * 3);
      const on = L === -1 || nodes[a].cluster === L || nodes[b].cluster === L;
      const col = nodes[a].fault || nodes[b].fault ? FAULT : SIGNAL;
      const f = (time > 1.4 ? 1 : 0) * (on ? 1 : 0.15) * Math.sin(p.t * Math.PI);
      pCol[i * 3] = col.r * f; pCol[i * 3 + 1] = col.g * f; pCol[i * 3 + 2] = col.b * f;
    }
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
  }

  function moveCamera(dt) {
    // Goal: overview, or the focused cluster's hub in world space
    let gx = 0, gy = 0, gz = 0, gDist = small ? 96 : 64, gOff = small ? 0 : -0.24, gOffY = small ? 0 : 0.04;
    if (focus >= 0) {
      tmp.copy(nodes[hubs[focus]].pos).applyMatrix4(world.matrixWorld);
      gx = tmp.x; gy = tmp.y; gz = tmp.z; gDist = small ? 44 : 30; gOff = small ? 0 : -0.3; gOffY = small ? -0.18 : -0.12;
    }
    const k = reducedMotion ? 100 : 2.2;
    cam.x = damp(cam.x, gx, k, dt); cam.y = damp(cam.y, gy, k, dt); cam.z = damp(cam.z, gz, k, dt);
    cam.dist = damp(cam.dist, gDist, k * 0.8, dt);
    cam.off = damp(cam.off, gOff, k, dt); cam.offY = damp(cam.offY, gOffY, k, dt);

    camera.position.set(cam.x + mouse.x * 3, cam.y - mouse.y * 2, cam.z + cam.dist);
    camera.lookAt(cam.x, cam.y, cam.z);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    camera.setViewOffset(w, h, w * cam.off, h * cam.offY, w, h);
    camera.updateProjectionMatrix();
  }

  function placeLabel() {
    const L = lit();
    if (!labelEl || L === -1) { labelEl?.classList.remove('is-on'); return; }
    tmp.copy(nodes[hubs[L]].pos).applyMatrix4(world.matrixWorld).project(camera);
    if (tmp.z > 1) { labelEl.classList.remove('is-on'); return; }
    const x = ((tmp.x + 1) / 2) * canvas.clientWidth, y = ((1 - tmp.y) / 2) * canvas.clientHeight;
    labelEl.style.transform = `translate(${x + 16}px, ${y - 12}px)`;
    labelEl.textContent = CLUSTERS[L].label;
    labelEl.classList.toggle('is-fault', !!CLUSTERS[L].fault);
    labelEl.classList.add('is-on');
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
  }

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!visible) { last = now; return; }
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    const time = (now - start) / 1000;
    mouse.x = damp(mouse.x, mouse.tx, 3, dt); mouse.y = damp(mouse.y, mouse.ty, 3, dt);
    velocity = damp(velocity, 0, 4, dt);
    if (!reducedMotion) world.rotation.y += dt * (0.05 + Math.min(Math.abs(velocity) * 0.004, 0.4));
    world.updateMatrixWorld();
    moveCamera(dt);
    update(reducedMotion ? 10 : time, dt);
    renderer.render(scene, camera);
    placeLabel();
  }

  function still() { world.updateMatrixWorld(); moveCamera(1); update(10, 0); renderer.render(scene, camera); placeLabel(); }

  resize();
  new ResizeObserver(() => { resize(); if (reducedMotion) still(); }).observe(canvas);
  window.addEventListener('pointermove', (e) => { mouse.tx = (e.clientX / window.innerWidth) * 2 - 1; mouse.ty = (e.clientY / window.innerHeight) * 2 - 1; }, { passive: true });
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  if (reducedMotion) { running = false; still(); } else requestAnimationFrame(frame);
  onReady?.();

  return {
    setHover(i) { hover = i; if (reducedMotion) still(); },
    setFocus(i) { focus = i; if (reducedMotion) still(); },
    setVelocity(v) { velocity = v; },
    pause(p) { visible = !p; },
  };
}
