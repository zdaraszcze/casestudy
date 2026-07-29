/* Project detail: side-by-side viewers + in-site full view (no new tabs) */
(function () {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[m]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const params = new URLSearchParams(location.search);
  const id  = params.get("id");
  const p   = PROJECTS.find(x => x.id === id);
  const idx = PROJECTS.findIndex(x => x.id === id);

  if (!p) {
    $("#crumbs").innerHTML = `<a href="index.html#work">Work</a><span class="sep">/</span><span class="cur">Not found</span>`;
    $("#detail").innerHTML = `<div class="wrap nf">
      <p class="eyebrow"><span class="dot">●</span> Error 404 · node undetected</p>
      <h1>That project isn't here.</h1>
      <p style="color:var(--muted)">The link may be out of date.</p>
      <a class="expand" href="index.html#work" style="margin-top:1rem">← Back to all work</a>
    </div>`;
    return;
  }

  document.title = p.title + " · " + (SITE.pageTitle || "Selected work");
  const hasStudy = !!p.caseStudy;
  const csFile = hasStudy ? p.caseStudy.split("/").pop() : "";
  const hasProto = !!p.prototype;
  const hasGallery = Array.isArray(p.gallery) && p.gallery.length;
  const secondLabel = hasProto ? "Live prototype" : (hasGallery ? "Screens" : null);
  const protoFile = hasProto ? p.prototype.split("/").pop() : "";

  // breadcrumb (top nav)
  $("#crumbs").innerHTML =
    `<a href="index.html#work">Work</a><span class="sep">/</span><span class="cur">${esc(p.title)}</span>`;

  const meta = [
    { k: "Client", v: p.client },
    { k: "Role", v: p.role },
    { k: "Scope", v: p.year },
    { k: "Disciplines", v: p.discipline.join(" · ") },
  ].map(m => `<div class="m"><div class="k">${esc(m.k)}</div><div class="v">${esc(m.v)}</div></div>`).join("");

  const expandSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"/></svg>`;

  // ----- case study viewer (only if there is one) -----
  const studyViewer = hasStudy ? `
    <section class="viewer">
      <div class="viewer-bar">
        <span class="lbl"><span class="sdot ok"></span> Case study</span>
        <span class="file">${esc(csFile)}</span>
        <span class="spacer"></span>
        <button class="expand" data-open="study">${expandSVG} Full view</button>
      </div>
      <div class="viewer-body">
        <div class="shield" data-open="study" role="button" tabindex="0" aria-label="Open case study in full view"></div>
        <iframe src="${p.caseStudy}" title="${esc(p.title)} · case study" loading="lazy" scrolling="no"></iframe>
      </div>
    </section>` : "";

  // ----- second viewer: prototype OR screens -----
  let secondViewer = "";
  if (hasProto) {
    secondViewer = `
    <section class="viewer">
      <div class="viewer-bar">
        <span class="lbl"><span class="sdot ok"></span> Live prototype</span>
        <span class="file">${esc(protoFile)}</span>
        <span class="spacer"></span>
        <button class="expand" data-open="proto">${expandSVG} Full view</button>
      </div>
      <div class="viewer-body">
        <div class="shield" data-open="proto" role="button" tabindex="0" aria-label="Open prototype in full view"></div>
        <iframe src="${p.prototype}" title="${esc(p.title)} · prototype" loading="lazy" scrolling="no"></iframe>
      </div>
    </section>`;
  } else if (hasGallery) {
    const shots = p.gallery.map((g, i) => `
      <figure class="shot${g.half ? " half" : ""}" data-shot="${i}" role="button" tabindex="0" aria-label="Enlarge screen ${i + 1}">
        <img src="${g.src}" alt="${esc((g.cap || "").replace(/<[^>]+>/g, ""))}" loading="lazy" decoding="async">
        <figcaption class="cap">${g.cap || ""}</figcaption>
      </figure>`).join("");
    secondViewer = `
    <section class="viewer">
      <div class="viewer-bar">
        <span class="lbl"><span class="sdot ok"></span> Screens</span>
        <span class="file">${p.gallery.length} views</span>
        <span class="spacer"></span>
        <button class="expand" data-open="gallery">${expandSVG} Full view</button>
      </div>
      <div class="gallery" id="gallery">${shots}</div>
    </section>`;
  }

  const next = PROJECTS[(idx + 1) % PROJECTS.length];
  const nextBlock = PROJECTS.length > 1 ? `
    <div class="nextproj wrap">
      <a href="project.html?id=${encodeURIComponent(next.id)}">
        <div>
          <div class="lbl">Next project · ${next.index}</div>
          <div class="t">${esc(next.title)}</div>
        </div>
        <span class="arw" aria-hidden="true">→</span>
      </a>
    </div>` : "";

  $("#detail").innerHTML = `
    <header class="detail-head wrap">
      <div class="idx-row">
        <span class="status"><span class="sdot ok"></span>${esc(p.statusLabel)}</span>
      </div>
      <p class="detail-kicker">${esc(p.subtitle)}</p>
      <h1 class="detail-title">${esc(p.title)}</h1>
      <p class="detail-sub">${esc(p.summary)}</p>
      <div class="metastrip">${meta}</div>
    </header>
    <div class="wrap">
      <div class="viewer-grid${(hasStudy && (hasProto || hasGallery)) ? "" : " single"}">
        ${studyViewer}
        ${secondViewer}
      </div>
      <p class="viewer-note"><span class="sdot ok"></span> ${(hasStudy && (hasProto || hasGallery)) ? "Case study and prototype sit side by side. Tap" : "Tap"} <b style="color:var(--signal);font-weight:600">Full view</b> to read or interact at full size, without leaving the site.</p>
    </div>
    ${nextBlock}
  `;

  /* =================== IN-SITE FULL VIEW =================== */
  const fv = $("#fv"), fvBody = $("#fvBody"), fvCrumbs = $("#fvCrumbs"),
        fvCount = $("#fvCount"), fvBack = $("#fvBack"), fvClose = $("#fvClose");
  let mode = null, gi = 0, lastFocus = null;

  const setCrumbs = (label) => {
    fvCrumbs.innerHTML =
      `<a href="index.html#work">Work</a><span>/</span>` +
      `<a href="#" data-fvhome>${esc(p.title)}</a><span>/</span>` +
      `<span class="cur">${esc(label)}</span>`;
    $("[data-fvhome]", fvCrumbs)?.addEventListener("click", (e) => { e.preventDefault(); closeFV(); });
  };

  const openFrame = (url, label) => {
    mode = "frame";
    fvBody.innerHTML = `<iframe src="${url}" title="${esc(p.title)} · ${esc(label)}"></iframe>`;
    fvCount.hidden = true;
    setCrumbs(label);
    showFV();
  };

  const renderGallery = () => {
    const g = p.gallery[gi];
    fvBody.innerHTML = `
      <button class="fv-nav prev" id="fvPrev" aria-label="Previous screen" ${gi === 0 ? "disabled" : ""}>‹</button>
      <div class="fv-img"><img src="${g.src}" alt="${esc((g.cap || "").replace(/<[^>]+>/g, ""))}"></div>
      <button class="fv-nav next" id="fvNext" aria-label="Next screen" ${gi === p.gallery.length - 1 ? "disabled" : ""}>›</button>
      <div class="fv-cap">${g.cap || ""}</div>`;
    fvCount.textContent = `${gi + 1} / ${p.gallery.length}`;
    $("#fvPrev").addEventListener("click", () => step(-1));
    $("#fvNext").addEventListener("click", () => step(1));
  };
  const step = (d) => { gi = Math.min(p.gallery.length - 1, Math.max(0, gi + d)); renderGallery(); };

  const openGallery = (start) => {
    mode = "gallery"; gi = start || 0;
    fvCount.hidden = false;
    setCrumbs("Screens");
    renderGallery();
    showFV();
  };

  const showFV = () => {
    lastFocus = document.activeElement;
    fv.classList.add("open");
    document.body.classList.add("fv-lock");
    fvBack.focus();
  };
  const closeFV = () => {
    fv.classList.remove("open");
    document.body.classList.remove("fv-lock");
    fvBody.innerHTML = "";
    mode = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  const dispatchOpen = (which) => {
    if (which === "study") openFrame(p.caseStudy, "Case study");
    else if (which === "proto") openFrame(p.prototype, "Live prototype");
    else if (which === "gallery") openGallery(0);
  };

  // expand buttons + preview shields
  $$("[data-open]").forEach(el => {
    el.addEventListener("click", () => dispatchOpen(el.dataset.open));
    if (el.classList.contains("shield")) el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); dispatchOpen(el.dataset.open); }
    });
  });
  // gallery thumbnails → open at that index
  const gallery = $("#gallery");
  if (gallery) gallery.addEventListener("click", (e) => {
    const fig = e.target.closest(".shot"); if (fig) openGallery(+fig.dataset.shot);
  });
  if (gallery) gallery.addEventListener("keydown", (e) => {
    const fig = e.target.closest(".shot");
    if (fig && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openGallery(+fig.dataset.shot); }
  });

  fvBack.addEventListener("click", closeFV);
  fvClose.addEventListener("click", closeFV);
  document.addEventListener("keydown", (e) => {
    if (!fv.classList.contains("open")) return;
    if (e.key === "Escape") closeFV();
    else if (mode === "gallery" && e.key === "ArrowLeft") step(-1);
    else if (mode === "gallery" && e.key === "ArrowRight") step(1);
  });

  /* deep-link: project.html?id=..&view=proto|study|gallery */
  const dl = params.get("view");
  if (dl === "study") dispatchOpen("study");
  else if (dl === "proto" && hasProto) dispatchOpen("proto");
  else if ((dl === "gallery" || dl === "screens") && hasGallery) dispatchOpen("gallery");
})();
