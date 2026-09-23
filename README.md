# Portfolio

A single-page portfolio with four case studies. Each case study opens its full story and prototype in an in-page viewer (never a new tab), with shareable links like `#/tr/story` or `#/ran/screens`.

## Structure

```
index.html              the landing page
css/style.css           all styles and design tokens
js/main.js              page behaviour, viewer, router, screens gallery
js/hero.js              the 3D network in the hero (three.js, loaded from a CDN)
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

Search `index.html` for `EDIT:` to find your name, the about text, and contact links. Add your CV as `assets/cv.pdf` or remove that link.

To add or change a project, add an `<article class="case">` block in `index.html` and a matching entry in the `PROJECTS` object at the top of `js/main.js`.

## Changes made to the supplied files

- Removed the "Confidential · Internal Distribution Only" footer from both JPB case studies.
- Replaced "BSU" with "JPB" in the Transparency Register prototype so it matches the case study.

## Motion and accessibility

- The 3D hero renders one still frame for people who have reduced motion turned on, and pauses when it's off-screen or the tab is hidden.
- If WebGL isn't available, the hero falls back to a static background and the rest of the page works normally.
- Scroll-linked effects use native CSS scroll-driven animations, with a small JavaScript fallback for browsers that don't support them yet.
- The viewer is a native `<dialog>`: Esc and the browser back button both close it, and focus returns to the button that opened it.
