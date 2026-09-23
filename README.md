# Portfolio

A single-page portfolio with four case studies. Each case study opens its full story and prototype in an in-page viewer (never a new tab), with shareable links like `#/tr/story` or `#/ran/screens`.

## Structure

```
index.html              the landing page
css/style.css           all styles and design tokens
js/main.js              motion system, cursor, viewer, router, screens gallery
js/network.js           the 3D network behind the page (three.js)
js/preview-gl.js        WebGL ripple and colour split on the preview images
case-studies/           full case study pages
prototypes/             clickable prototypes
assets/previews/        preview images for the landing page
assets/singleran/       SingleRAN screens (full size + thumbnails)
.nojekyll               tells GitHub Pages to serve files as-is
```

## Publish on GitHub Pages

1. Create a repository (for a personal site, name it `your-username.github.io`).
2. Upload everything in this folder to the repository root, including `.nojekyll`.
3. In the repository, go to Settings → Pages, set Source to "Deploy from a branch", choose `main` and `/ (root)`, and save.
4. The site will be live at `https://your-username.github.io/` within a minute or two.

## Test locally

Opening `index.html` directly from disk won't load the 3D hero, because browsers block JavaScript modules on `file://`. Run a local server instead:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## What to edit

The case study order follows the page: Onboarding, SingleRAN, GraphWalk, Transparency Register. To add or change a project, add an `<article class="case">` block in `index.html`, a matching entry in the `PROJECTS` object in `js/main.js`, and a cluster in `CLUSTERS` in `js/network.js` (same order as the page).

## Libraries (loaded from jsDelivr)

three.js 0.169, GSAP 3.13 with ScrollTrigger and SplitText, Lenis 1.3.

## Changes made to the supplied files

- Removed the "Confidential · Internal Distribution Only" footer from both JPB case studies.
- Replaced "BSU" with "JPB" in the Transparency Register prototype so it matches the case study.

## Motion and accessibility

- With reduced motion turned on, smooth scrolling, scroll animations, the cursor and the WebGL previews are switched off and the network renders as a still frame.
- If WebGL isn't available, the hero falls back to a static background and the rest of the page works normally.
- The viewer is a native `<dialog>`: Esc and the browser back button both close it, and focus returns to the button that opened it.
