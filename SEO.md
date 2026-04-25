# SEO setup notes

This file documents what's wired up and what you need to do once to get the site indexed everywhere it matters. Keep it in the repo so future-you (or future-Claude) doesn't have to re-derive it.

## What's already built

### Search-engine SEO
- Per-page `<title>`, `<meta name="description">`, `<meta name="keywords">`, `<link rel="canonical">`, full Open Graph + Twitter cards on every indexable page.
- `sitemap.xml` lists all 9 indexable pages with `<lastmod>` and `<image:image>` annotations.
- `robots.txt` points to the sitemap and explicitly allows the major AI crawlers.
- JSON-LD on every page:
  - `index.html` — `Person`, `WebSite`, `ItemList` of featured projects, `FAQPage` (7 Q&A).
  - `works.html` — `BreadcrumbList`, `CollectionPage`, `ItemList` of all 25 substantive projects with proper schema types (`MobileApplication` / `WebApplication` / `PodcastSeries` / `CreativeWork`).
  - `prints.html`, `gameboy.html` — `BreadcrumbList` + page-specific schema.
  - `chess-kombat.html`, `cert-quest.html`, `glaces-en-seine.html` — per-project landing pages with `MobileApplication` / `WebApplication` + `FAQPage`.
  - `news.html` — `BreadcrumbList` + `CollectionPage` + `ItemList` of 20 curated maker/DIY news sources.
  - `now.html` — `WebPage` with `dateModified` for freshness.

### AI-search SEO
- `llms.txt` — markdown index for LLM crawlers (Claude, ChatGPT, Perplexity, Gemini).
- `robots.txt` explicitly allows `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `ClaudeBot`, `anthropic-ai`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Bytespider`, `Amazonbot`, `Meta-ExternalAgent`, `cohere-ai`, `DuckAssistBot`, `YouBot`, `Diffbot`.

### Freshness signal
- `now.html` — Sivers-style "what I'm working on right now" page. Compact link-box grid pointing each item at its live URL (Cert Quest → certquests.com, Glaces en Seine → live dashboard, Chess Kombat → GitHub, etc.). Carries `dateModified` in JSON-LD; bump it when you refresh the boxes.
- `news.html` — curated discovery hub for Arduino / Raspberry Pi / 3D printing / DIY news sources. Update the box list as your reading list changes.

### Site hygiene
- `404.html` — branded "page not found" with full nav (GitHub Pages serves it automatically).
- `humans.txt`, `.well-known/security.txt`, `CNAME`.
- Every page carries the same nav (Home / All Works / News / Now / About / Contact) and a footer with the full social-media row (Instagram, Cults3D, Hackster, Instructables, GitHub, LinkedIn, Email).

## One-time setup (you, not me)

### 1. DNS for diyfunproject.com → GitHub Pages
At your registrar, add either:
- **Apex (`diyfunproject.com`)** — A records pointing to GitHub's IPs:
  ```
  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153
  ```
- **www subdomain** — CNAME to `daitenkutarojurai-ai.github.io`

Then in repo Settings → Pages → Custom domain, paste `diyfunproject.com` and tick **Enforce HTTPS** once it appears (can take ~24h).

### 2. Submit to search consoles
Each gets one verification code. Paste it into the commented placeholders at the top of `index.html`, uncomment that line, push, then click "Verify" in the console.

| Console | URL | Meta tag |
| --- | --- | --- |
| Google Search Console | https://search.google.com/search-console | `google-site-verification` |
| Bing Webmaster Tools  | https://www.bing.com/webmasters         | `msvalidate.01` |
| Yandex Webmaster      | https://webmaster.yandex.com            | `yandex-verification` |
| DuckDuckGo            | (auto — uses Bing's index)              | n/a |

After verification, **submit the sitemap** in each console: `https://diyfunproject.com/sitemap.xml`.

### 3. Google Knowledge Panel (optional, for the Person entity)
Once Google indexes the site, the `Person` JSON-LD on `index.html` may get picked up for a knowledge panel. To accelerate, you can claim the panel via `g.co/kgs/...` once it appears. Not urgent.

## How to keep the site fresh

- **Refresh `now.html`** monthly: edit the link-box grid (add/remove what you're shipping, what you're printing, what you're recording). Update the `Last updated` stamp + the `dateModified` in the JSON-LD block.
- **Refresh `news.html`** when your reading list shifts: add/remove source boxes, update the `dateModified` in the JSON-LD.
- **Add a project landing page** when a new project ships:
  1. Copy one of `chess-kombat.html`, `cert-quest.html`, or `glaces-en-seine.html` to `<slug>.html`.
  2. Update title, description, keywords, canonical URL, OG tags, JSON-LD `MobileApplication` / `WebApplication` / `CreativeWork` block, FAQ items, body copy.
  3. Add a `<url>` entry to `sitemap.xml`.
  4. Add a "Read the full project page" link to the corresponding card's `data-desc` in `index.html`.
  5. Add the page to `llms.txt` under "Per-project landing pages".
  6. Add a now-box on `now.html` if it's an active project.

## Things deliberately not done

- **No analytics.** No Google Analytics / Plausible / Fathom. Add one if you want behavior data, but the site works fine without.
- **No journal / blog / RSS.** Removed in favor of `now.html` (current focus) and `news.html` (curated discovery). If you want long-form posts later, add a `journal.html` back.
- **No comments.** Out of scope for a static site; if needed, add Giscus (GitHub Discussions backend).
