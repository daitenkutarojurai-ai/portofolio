# diyfunproject — portfolio

A one-page futuristic portfolio. Dark editorial aesthetic, lime primary + neon cyan/magenta accents, premium glass surfaces, WebGL hero backdrop (distorted icosahedron + particle field via Three.js), Fraunces + Plus Jakarta Sans + JetBrains Mono, custom cursor, grain overlay, click-to-expand project modals.

## Structure
```
/
├── index.html        # semantic structure
├── styles.css        # design tokens, glass, neon, layouts, responsive
├── script.js         # nav, reveals, tilt, cursor, modal, KPI count-up
├── effects.js        # Three.js hero: wireframe globe + particles
├── images/           # hero photos pulled from project PDFs
│   ├── babychair.jpg
│   ├── cocktail-gui.jpg
│   ├── cocktail-phone.jpg
│   ├── coffee.jpg
│   ├── farm.jpg
│   ├── garden.jpg
│   ├── photobooth.jpg
│   └── plant.jpg
├── .nojekyll         # tells GitHub Pages to serve files raw
└── README.md
```

Three.js is loaded from `unpkg.com` (`three@0.160`). No build step.

## Deploy

### GitHub Pages
1. Push to `daitenkutarojurai-ai/portofolio` on `main`.
2. Settings → Pages → Source: *Deploy from a branch* → `main` → `/ (root)` → Save.
3. Live in ~1 min at `https://diyfunproject.com/`.

### Preview locally
```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Customize

**Design tokens** — top of `styles.css`:
- `--lime` primary `#d9ff4c`
- `--cyan` accent `#4ad8ff`
- `--magenta` accent `#ff6bc7`
- `--bg` near-black `#050608`

**Podcast titles** — in `index.html`, search for `#listen` and edit the six `<h3>Show · …</h3>` lines.

**Focus card** — section `#focus` in `index.html` holds the "LinkedIn-pro" layer: four active initiatives + stack snapshot. Update as projects ship.

**Add a project** — copy any `<a class="project reveal …">` block in `#work` or `#apps` and edit its `data-*` attributes. The modal picks up everything from them (title, tagline, desc, year, type, views, tech stack, link).
