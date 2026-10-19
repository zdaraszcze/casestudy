# Portfolio

Product design case studies as one journey: Discover → Define → Develop → Deliver, one scroll per stage, then four projects. Each project opens its STAR summary, and its full story and prototype open inside the page.

## Publish on GitHub Pages

1. In the repository, **delete the old files first**:
   - `js/scene.js`
   - `js/vendor/three.min.js` (and the empty `js/vendor/` folder)
2. Upload everything in this folder to the repository root, replacing what is there. Include the hidden `.nojekyll` file.
3. Settings → Pages → "Deploy from a branch" → `main` / `(root)`.

## Test locally

The page loads its script as a JavaScript module, which browsers don't run from a double-clicked file. Start a local server in this folder:

    python3 -m http.server 8000

then open http://localhost:8000.

## Structure

```
index.html                page markup and sharing preview tags
css/style.css             all styles
js/app.js                 the built page script, with three.js 0.186.1 bundled in (no CDN)
js/src/main.js            the source of js/app.js: scene, stages, cases, viewer, router
case-studies/             full stories (open in the in-page viewer)
prototypes/               clickable prototypes (open in the in-page viewer)
assets/stills/            one still frame per stage: shown while the scene loads, and instead of it without WebGL
assets/previews/          preview images for the prototype windows
assets/singleran/         SingleRAN screens gallery (full size and thumbnails)
assets/og-image.png       sharing preview image (LinkedIn, Slack, …)
```

## Changing the page script

Edit `js/src/main.js`, then rebuild `js/app.js` (needs Node.js):

    npm install three@0.186.1 esbuild@0.24.2
    npx esbuild js/src/main.js --bundle --minify --format=esm --target=es2020 --outfile=js/app.js

`node_modules/` is only needed for the build; don't upload it.

## Links you can share

- `…/casestudy/#/projects` opens directly on the four projects
- `…/casestudy/#/onb`, `#/ran`, `#/gw`, `#/tr` open a case study
- add `/story`, `/proto` or (SingleRAN) `/screens` to open the viewer, e.g. `#/tr/story`

The browser's back button closes the viewer, then the case.

## Returning visitors

After someone has reached the projects once, their next visit starts on the projects instead of Discover. The stage buttons at the bottom still go back to the start. To see the journey from the beginning again, clear the site's data in the browser, or open a private window.

## If the site moves

`index.html` contains the site address in `canonical`, `og:url` and `og:image`. Update them if the repository name or domain changes, otherwise the LinkedIn preview image won't load.

## Without WebGL

If a browser can't run the 3D scene, the page shows the still frame for each stage and crossfades between them. Stages, project cards, case studies and the viewer all work as usual.
