/* =============================================================
   Landing console — single page.
   Intro (name + bio + LinkedIn) → every case study inline under
   one shared template → floating side-nav → in-site full view.
   Case-study & prototype FILES ARE NEVER MODIFIED: they are only
   loaded (untouched) via iframe / the full-view overlay.
   ============================================================= */
(function () {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[m]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const byId = (id) => PROJECTS.find(p => p.id === id);
  const pad  = (i) => String(i + 1).padStart(2, "0");

  document.title = SITE.pageTitle || "Selected work";

  const expandSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"/></svg>`;
  const prettyURL = (u) => String(u || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  /* ---------- fill data-site placeholders (name, linkedin, footnote) ---------- */
  $$("[data-site]").forEach(el => {
    const key = el.dataset.site, val = SITE[key];
    if (val == null) return;
    if (key === "linkedin") { el.href = val; }
    else { el.innerHTML = val; }
  });

  /* ---------- INTRO ---------- */
  const intro = $("#intro");
  if (intro) {
    const facts = (SITE.facts || []).map(f =>
      `<div class="crow"><div class="ck">${esc(f.k)}</div><div class="cv">${f.v}</div></div>`).join("");
    const liRow = SITE.linkedin
      ? `<div class="crow"><div class="ck">LinkedIn</div><div class="cv"><a class="inline-link" href="${esc(SITE.linkedin)}" target="_blank" rel="noopener">${esc(prettyURL(SITE.linkedin))} <span aria-hidden="true">↗</span></a></div></div>`
      : "";
    intro.innerHTML = `
      <div class="wrap">
        <div class="readout reveal">
          <span class="seg"><span class="sdot ok"></span> Selected work</span>
          <span class="sep"></span>
          <span class="seg">${esc(SITE.role || "Product Designer")}</span>
        </div>
        <h1 class="hero-title reveal">${esc(SITE.name || "Your Name")}</h1>
        <p class="hero-lead reveal" data-d="1">${SITE.bio || ""}</p>
        ${(facts || liRow) ? `
        <div class="creds reveal" data-d="2">
          <div class="creds-bar"><span class="l"><span class="sdot ok"></span> Profile</span><span class="r">${esc(SITE.role || "")}</span></div>
          ${facts}${liRow}
        </div>` : ""}
        <div class="scroll-cue reveal" data-d="3"><span class="line"></span> Scroll to the work</div>
      </div>`;
  }

  /* ---------- CASE-STUDY SECTIONS (one shared template) ---------- */
  const sectionHTML = (p, i) => {
    const hasStudy   = !!p.caseStudy;
    const hasProto   = !!p.prototype;
    const hasGallery = Array.isArray(p.gallery) && p.gallery.length;
    const csFile     = hasStudy ? p.caseStudy.split("/").pop() : "";
    const protoFile  = hasProto ? p.prototype.split("/").pop() : "";

    const meta = [
      { k: "Client", v: p.client }, { k: "Role", v: p.role },
      { k: "Scope",  v: p.year },   { k: "Disciplines", v: p.discipline.join(" · ") },
    ].map(m => `<div class="m"><div class="k">${esc(m.k)}</div><div class="v">${esc(m.v)}</div></div>`).join("");

    const studyViewer = hasStudy ? `
      <section class="viewer">
        <div class="viewer-bar">
          <span class="lbl"><span class="sdot ok"></span> Case study</span>
          <span class="file">${esc(csFile)}</span>
          <span class="spacer"></span>
          <button class="expand" data-open="study" data-pid="${p.id}">${expandSVG} Full view</button>
        </div>
        <div class="viewer-body">
          <div class="shield" data-open="study" data-pid="${p.id}" role="button" tabindex="0" aria-label="Open ${esc(p.title)} case study in full view"></div>
          <iframe src="${p.caseStudy}" title="${esc(p.title)} · case study" loading="lazy" scrolling="no"></iframe>
        </div>
      </section>` : "";

    let secondViewer = "";
    if (hasProto) {
      secondViewer = `
      <section class="viewer">
        <div class="viewer-bar">
          <span class="lbl"><span class="sdot ok"></span> Live prototype</span>
          <span class="file">${esc(protoFile)}</span>
          <span class="spacer"></span>
          <button class="expand" data-open="proto" data-pid="${p.id}">${expandSVG} Full view</button>
        </div>
        <div class="viewer-body">
          <div class="shield" data-open="proto" data-pid="${p.id}" role="button" tabindex="0" aria-label="Open ${esc(p.title)} prototype in full view"></div>
          <iframe src="${p.prototype}" title="${esc(p.title)} · prototype" loading="lazy" scrolling="no"></iframe>
        </div>
      </section>`;
    } else if (hasGallery) {
      const shots = p.gallery.map((g, gi) => `
        <figure class="shot${g.half ? " half" : ""}" data-pid="${p.id}" data-shot="${gi}" role="button" tabindex="0" aria-label="Enlarge screen ${gi + 1}">
          <img src="${g.src}" alt="${esc((g.cap || "").replace(/<[^>]+>/g, ""))}" loading="lazy" decoding="async">
          <figcaption class="cap">${g.cap || ""}</figcaption>
        </figure>`).join("");
      secondViewer = `
      <section class="viewer">
        <div class="viewer-bar">
          <span class="lbl"><span class="sdot ok"></span> Screens</span>
          <span class="file">${p.gallery.length} views</span>
          <span class="spacer"></span>
          <button class="expand" data-open="gallery" data-pid="${p.id}">${expandSVG} Full view</button>
        </div>
        <div class="gallery" data-gallery="${p.id}">${shots}</div>
      </section>`;
    }

    const dual = hasStudy && (hasProto || hasGallery);
    return `
    <section class="case" id="p-${p.id}" aria-labelledby="h-${p.id}">
      <div class="wrap">
        <header class="case-head reveal">
          <div class="idx-row">
            <span class="case-idx">${esc(p.index || pad(i))}</span>
            <span class="status"><span class="sdot ok"></span>${esc(p.statusLabel)}</span>
          </div>
          <p class="detail-kicker">${esc(p.subtitle)}</p>
          <h2 class="detail-title" id="h-${p.id}">${esc(p.title)}</h2>
          <p class="detail-sub">${esc(p.summary)}</p>
          <div class="metastrip">${meta}</div>
        </header>
        <div class="viewer-grid${dual ? "" : " single"} reveal" data-d="1">
          ${studyViewer}
          ${secondViewer}
        </div>
      </div>
    </section>`;
  };

  const cases = $("#cases");
  if (cases) cases.innerHTML = PROJECTS.map(sectionHTML).join("");

  /* ---------- FLOATING SIDE-NAV ---------- */
  const sideNav = $("#sideNav");
  if (sideNav) {
    sideNav.innerHTML =
      `<a class="sn-item sn-top" href="#top" data-target="top" aria-label="Back to top">
         <span class="sn-tick"></span><span class="sn-label">Top</span>
       </a>` +
      PROJECTS.map((p, i) => `
      <a class="sn-item" href="#p-${p.id}" data-target="p-${p.id}">
        <span class="sn-tick"></span>
        <span class="sn-idx">${esc(p.index || pad(i))}</span>
        <span class="sn-label">${esc(p.title)}</span>
      </a>`).join("");
  }

  /* ---------- SCROLL-SPY (highlight active side-nav item) ---------- */
  const spyTargets = ["top", ...PROJECTS.map(p => `p-${p.id}`)]
    .map(id => document.getElementById(id)).filter(Boolean);
  const setActive = (id) => $$(".sn-item", sideNav).forEach(a =>
    a.classList.toggle("active", a.dataset.target === id));
  if (spyTargets.length) {
    const spy = new IntersectionObserver((entries) => {
      const vis = entries.filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (vis) setActive(vis.target.id);
    }, { rootMargin: "-45% 0px -45% 0px", threshold: [0, .25, .5, 1] });
    spyTargets.forEach(t => spy.observe(t));
  }

  /* ---------- TOP BAR: reveal on scroll ---------- */
  const topnav = $("#topnav");
  const onScroll = () => { if (topnav) topnav.classList.toggle("show", window.scrollY > 240); };
  onScroll(); addEventListener("scroll", onScroll, { passive: true });

  /* ---------- SCROLL REVEAL ---------- */
  if (reduce) {
    $$(".reveal").forEach(el => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach(el => io.observe(el));
  }

  /* =================== IN-SITE FULL VIEW =================== */
  const fv = $("#fv"), fvBody = $("#fvBody"), fvCrumbs = $("#fvCrumbs"),
        fvCount = $("#fvCount"), fvBack = $("#fvBack"), fvClose = $("#fvClose");
  let mode = null, gi = 0, gArr = null, lastFocus = null;

  const setCrumbs = (title, label) => {
    fvCrumbs.innerHTML =
      `<a href="#work" data-fvhome>Work</a><span>/</span>` +
      `<span class="cur">${esc(title)} · ${esc(label)}</span>`;
    $("[data-fvhome]", fvCrumbs)?.addEventListener("click", (e) => { e.preventDefault(); closeFV(); });
  };
  const openFrame = (url, title, label) => {
    mode = "frame";
    fvBody.innerHTML = `<iframe src="${url}" title="${esc(title)} · ${esc(label)}"></iframe>`;
    fvCount.hidden = true; setCrumbs(title, label); showFV();
  };
  const renderGallery = (title) => {
    const g = gArr[gi];
    fvBody.innerHTML = `
      <button class="fv-nav prev" id="fvPrev" aria-label="Previous screen" ${gi === 0 ? "disabled" : ""}>‹</button>
      <div class="fv-img"><img src="${g.src}" alt="${esc((g.cap || "").replace(/<[^>]+>/g, ""))}"></div>
      <button class="fv-nav next" id="fvNext" aria-label="Next screen" ${gi === gArr.length - 1 ? "disabled" : ""}>›</button>
      <div class="fv-cap">${g.cap || ""}</div>`;
    fvCount.textContent = `${gi + 1} / ${gArr.length}`;
    $("#fvPrev").addEventListener("click", () => step(-1, title));
    $("#fvNext").addEventListener("click", () => step(1, title));
  };
  const step = (d, title) => { gi = Math.min(gArr.length - 1, Math.max(0, gi + d)); renderGallery(title); };
  const openGallery = (p, start) => {
    mode = "gallery"; gArr = p.gallery; gi = start || 0;
    fvCount.hidden = false; setCrumbs(p.title, "Screens"); renderGallery(p.title); showFV();
  };

  const showFV = () => {
    lastFocus = document.activeElement;
    fv.classList.add("open"); document.body.classList.add("fv-lock"); fvBack.focus();
  };
  const closeFV = () => {
    fv.classList.remove("open"); document.body.classList.remove("fv-lock");
    fvBody.innerHTML = ""; mode = null; gArr = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  const dispatchOpen = (which, pid) => {
    const p = byId(pid); if (!p) return;
    if (which === "study" && p.caseStudy) openFrame(p.caseStudy, p.title, "Case study");
    else if (which === "proto" && p.prototype) openFrame(p.prototype, p.title, "Live prototype");
    else if (which === "gallery" && p.gallery) openGallery(p, 0);
  };

  /* delegated: expand buttons + preview shields */
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-open]");
    if (el) { dispatchOpen(el.dataset.open, el.dataset.pid); return; }
    const fig = e.target.closest(".shot");
    if (fig) openGallery(byId(fig.dataset.pid), +fig.dataset.shot);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = e.target.closest(".shield[data-open], .shot");
    if (!el) return;
    e.preventDefault();
    if (el.classList.contains("shot")) openGallery(byId(el.dataset.pid), +el.dataset.shot);
    else dispatchOpen(el.dataset.open, el.dataset.pid);
  });

  fvBack.addEventListener("click", closeFV);
  fvClose.addEventListener("click", closeFV);
  document.addEventListener("keydown", (e) => {
    if (!fv.classList.contains("open")) return;
    if (e.key === "Escape") closeFV();
    else if (mode === "gallery" && e.key === "ArrowLeft") step(-1);
    else if (mode === "gallery" && e.key === "ArrowRight") step(1);
  });
})();
