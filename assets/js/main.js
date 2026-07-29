/* Landing: bio + equal project cards. No nav / about / contact / footer. */
(function () {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.title = SITE.pageTitle || "Selected work";
  const bio = $("[data-site='bio']");
  if (bio) bio.innerHTML = SITE.bio;

  const cardHTML = (p) => {
    const tags = p.discipline.map(t => `<span class="tag">${t}</span>`).join("");
    const url = `project.html?id=${encodeURIComponent(p.id)}`;
    return `
    <a class="card reveal" href="${url}" aria-label="${p.title}, ${p.subtitle}">
      <div class="card-thumb">
        <span class="screenbar"><span class="sdot ok"></span>${p.subtitle}</span>
        <img src="${p.thumb}" alt="${p.title}, ${p.subtitle}" loading="lazy" decoding="async">
        <span class="view">View project <span aria-hidden="true">→</span></span>
      </div>
      <div class="card-body">
        <h3>${p.title}</h3>
        <p class="one">${p.oneLiner}</p>
        <div class="tags">${tags}</div>
      </div>
    </a>`;
  };

  const grid = $("#workGrid");
  if (grid) grid.innerHTML = PROJECTS.map(cardHTML).join("");

  // scroll reveal
  if (reduce) {
    $$(".reveal").forEach(el => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach(el => io.observe(el));
  }
})();
