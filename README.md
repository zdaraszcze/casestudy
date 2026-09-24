# Portfolio

Product design case studies as one continuous journey: Discover → Define → Develop → Deliver, then four projects, each with its full story and prototype opening in the page.

## Publish on GitHub Pages

1. In your repository, **delete the old files first** (the previous version used `js/main.js`, `js/network.js`, `js/preview-gl.js` and a different `css/style.css`).
2. Upload everything in this folder to the repository root, including the hidden `.nojekyll` file.
3. Settings → Pages → "Deploy from a branch" → `main` / `(root)`.

## Test locally

Double-clicking `index.html` works for the journey, but the case studies and prototypes load best from a local server:

    python3 -m http.server 8000

then open http://localhost:8000.

## Structure

```
index.html                page markup and sharing preview tags
css/style.css             all styles (dark and light)
js/scene.js               the journey, cases, viewer, router
js/vendor/three.min.js    three.js r158, bundled so the page doesn't depend on a CDN
case-studies/             full stories (open in the in-page viewer)
prototypes/               clickable prototypes (open in the in-page viewer)
assets/previews/          preview images for the prototype windows
assets/singleran/         SingleRAN screens gallery (full size + thumbnails)
assets/og-image.png       sharing preview image (LinkedIn, Slack, …)
```

## Links you can share

- `…/casestudy/#/projects` opens directly on the four projects
- `…/casestudy/#/onb`, `#/ran`, `#/gw`, `#/tr` open a case study
- add `/story`, `/prototype` or (SingleRAN) `/screens` to open the viewer, e.g. `#/tr/story`

The browser's back button closes the viewer, then the case.

## If the site moves

`index.html` contains the site address in `canonical`, `og:url` and `og:image`. Update them if the repository name or domain changes, otherwise the LinkedIn preview image won't load.

## Without WebGL

If a browser can't run the 3D scene, the page still works: stages, project cards, case studies and the viewer all function over a quiet background.
