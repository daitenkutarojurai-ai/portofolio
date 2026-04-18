# thomas fendrich — portfolio

A one-page editorial portfolio. Dark editorial aesthetic, Fraunces + Plus Jakarta Sans + JetBrains Mono, real project photos, custom cursor, grain overlay, click-to-expand project modals.

## Structure
```
/
├── index.html        # single-file site (all CSS + JS inline)
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

## Deploy

### GitHub Pages
1. Push these files to `daitenkutarojurai-ai/portofolio`
2. Settings → Pages → Source: *Deploy from a branch* → Branch: `main` → `/ (root)` → Save
3. Live in ~1 min at `https://daitenkutarojurai-ai.github.io/portofolio/`

### Preview locally
```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Customize

**Podcast titles** — I don't know your show names, so the 6 podcast cards read `Show · <id-snippet>`. In `index.html`, search for `#listen` and edit the six `<h3>Show · …</h3>` lines.

**Colors** — tokens at the very top of the `<style>` block:
- `--accent` electric lime `#d9ff4c`
- `--warm` coral `#ff6b42`
- `--bg` near-black `#0a0a0a`

**Add a project** — copy any `<a class="project reveal …">` block and edit its `data-*` attributes. The modal picks up everything from them (title, tagline, desc, year, type, views, tech stack, link).
