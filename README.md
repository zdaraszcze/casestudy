# Portfolio — static, single-page

A fast static site: a short **bio**, a grid of **three project cards**, and a
**detail page** per project (the written case study and the prototype/screens
side by side, with an in-site full-screen viewer). No framework, no build step,
no backend. Ready for GitHub Pages.

## Run locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
A local server is recommended so the `?id=` detail pages and the embedded
case-study/prototype iframes behave exactly like production.

## Edit content — one file
Everything lives in **`assets/js/projects.js`**.

**Intro bio** — top of the file:
```js
const SITE = {
  pageTitle: "Selected work",           // browser tab title
  bio: "Engineer and senior product designer … ", // the only intro copy (HTML ok)
};
```
`<b>…</b>` bolds; `<span class='accent'>…</span>` colours a phrase in the accent blue.

**Projects** — the `PROJECTS` array. Order here = order on the page (all cards
are equal). Each entry:
```js
{
  id: "graphwalk",                       // URL: project.html?id=graphwalk
  title: "GraphWalk",                    // card + detail headline (the name)
  subtitle: "Workspace & Virtual Path",  // descriptor (thumbnail label + detail kicker)
  oneLiner: "Redesign of the workspace and the path-authoring flow…", // one factual line
  client: "…", role: "…", year: "…",     // shown on the detail page meta strip
  statusLabel: "Case study + live prototype",
  discipline: ["UX Design","Prototype"], // tag pills
  thumb: "images/thumbs/graphwalk.jpg",  // 16:10 image (~1280×800)
  caseStudy: "case-studies/graphwalk.html",      // required
  prototype: "prototypes/graphwalk.html",        // → adds a live-prototype panel
  gallery: null,                          // …or an array of {src, cap, half} for a screens panel
}
```
A project can have a `caseStudy` and/or a `prototype`/`gallery`. If it has two,
the detail page shows them side by side; with one, it shows a single panel
(e.g. a prototype-only project sets `caseStudy: null`). Every project needs a
`thumb`. To add one: drop files into `/case-studies`, `/prototypes`, `/images`,
then add an object here (order = order on the page).

## Structure
```
index.html            bio + three project cards
project.html          detail page — reads ?id= from the URL
assets/css/style.css  all styling (colour + type tokens at the top)
assets/js/projects.js ← content: bio + projects
assets/js/main.js     renders the landing page
assets/js/project.js  renders detail pages (side-by-side + full-view overlay)
case-studies/  prototypes/  images/  images/thumbs/
.nojekyll             serve files as-is on GitHub Pages
```

## Deploy to GitHub Pages
1. Push these files to the repo **root** on `main`.
2. Settings → Pages → *Deploy from a branch* → `main` / `/ (root)`.
3. Live at `https://<you>.github.io/<repo>/` (all paths are relative).
Custom domain: add a `CNAME` file with your domain and set it under Settings → Pages.

## Notes
- **Fonts** (Archivo, Inter, IBM Plex Mono) load from Google Fonts via the `<link>`
  in the HTML — the only external request; system-font fallbacks are in the CSS.
- Single **cool light** palette; all colours are CSS variables at the top of `style.css`.
- Responsive to mobile, keyboard focus states, `prefers-reduced-motion` respected,
  images lazy-loaded. The full-view overlay supports Esc / ← → and stays in-site.
