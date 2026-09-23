/* =========================================================
   Preview images rendered in WebGL:
   a ripple that follows the cursor on hover, and a slight
   colour split that reacts to scroll speed.
   Raw WebGL, one small context per preview. Falls back to
   the plain <img> if anything fails.
   ========================================================= */
const VERT = `
attribute vec2 aPos; varying vec2 vUv;
void main() { vUv = vec2(aPos.x * .5 + .5, .5 - aPos.y * .5); gl_Position = vec4(aPos, 0., 1.); }`;
const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex; uniform vec2 uMouse; uniform vec2 uCover;
uniform float uHover, uTime, uVel, uAspect;
vec3 tx(vec2 uv) { return texture2D(uTex, clamp(uv, 0., 1.) * uCover).rgb; }
void main() {
  vec2 uv = vUv;
  vec2 d = uv - uMouse; d.x *= uAspect;
  float dist = length(d);
  // gentle zoom toward the cursor
  uv = (uv - uMouse) * (1. - .035 * uHover) + uMouse;
  // ripple rings from the cursor
  float ripple = sin(dist * 34. - uTime * 5.) * exp(-dist * 5.) * .010 * uHover;
  uv += normalize(d + 1e-5) * ripple / vec2(uAspect, 1.);
  // scroll-speed wave + colour split
  float v = clamp(uVel, -1., 1.);
  uv.x += sin(uv.y * 8. + uTime) * .006 * abs(v);
  float split = .004 * abs(v) + .0025 * uHover;
  vec3 col = vec3(tx(uv + vec2(split, 0.)).r, tx(uv).g, tx(uv - vec2(split, 0.)).b);
  gl_FragColor = vec4(col, 1.);
}`;

const instances = [];
let velocity = 0;

export function setPreviewVelocity(v) {
  velocity = v;
  instances.forEach((i) => i.kick());
}

export function mountPreviewGL(mediaEl, { reducedMotion } = {}) {
  const img = mediaEl.querySelector('img');
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl || !img) return null;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const u = { mouse: U('uMouse'), cover: U('uCover'), hover: U('uHover'), time: U('uTime'), vel: U('uVel'), aspect: U('uAspect') };

  const tex = gl.createTexture();
  let ready = false, visible = false, raf = 0;
  const state = { hover: 0, hoverT: 0, mx: .5, my: .5, tmx: .5, tmy: .5, vel: 0 };
  const t0 = performance.now();

  function upload() {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    ready = true;
    mediaEl.appendChild(canvas);
    mediaEl.classList.add('is-gl');
    resize(); draw();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = mediaEl.clientWidth, h = mediaEl.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const planeA = w / h, imgA = img.naturalWidth / img.naturalHeight;
    // object-fit: cover, anchored top-left
    gl.uniform2f(u.cover, imgA > planeA ? planeA / imgA : 1, imgA > planeA ? 1 : imgA / planeA);
    gl.uniform1f(u.aspect, planeA);
  }

  function draw() {
    if (!ready) return;
    gl.uniform2f(u.mouse, state.mx, state.my);
    gl.uniform1f(u.hover, state.hover);
    gl.uniform1f(u.time, (performance.now() - t0) / 1000);
    gl.uniform1f(u.vel, state.vel);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function loop() {
    raf = 0;
    const k = .08;
    state.hover += (state.hoverT - state.hover) * k;
    state.mx += (state.tmx - state.mx) * .12; state.my += (state.tmy - state.my) * .12;
    state.vel += (velocity - state.vel) * .15;
    draw();
    const busy = state.hover > .002 || state.hoverT > 0 || Math.abs(state.vel) > .002;
    if (busy && visible) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && visible && ready && !reducedMotion) raf = requestAnimationFrame(loop); }

  const host = mediaEl.closest('.preview') || mediaEl;
  host.addEventListener('pointerenter', () => { state.hoverT = 1; kick(); });
  host.addEventListener('pointerleave', () => { state.hoverT = 0; kick(); });
  host.addEventListener('pointermove', (e) => {
    const r = mediaEl.getBoundingClientRect();
    state.tmx = (e.clientX - r.left) / r.width; state.tmy = (e.clientY - r.top) / r.height; kick();
  });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(mediaEl);
  new ResizeObserver(() => { resize(); draw(); }).observe(mediaEl);

  const go = () => { try { upload(); } catch (e) { /* keep the plain image */ } };
  if (img.complete && img.naturalWidth) go(); else { img.loading = 'eager'; img.addEventListener('load', go, { once: true }); }

  const api = { kick };
  instances.push(api);
  return api;
}
