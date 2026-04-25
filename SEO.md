# SEO setup notes

This file documents what's wired up and what you need to do once to get the site indexed everywhere it matters. Keep it in the repo so future-you (or future-Claude) doesn't have to re-derive it.

## What's already built

### Search-engine SEO
- Per-page `<title>`, `<meta name="description">`, `<meta name="keywords">`, `<link rel="canonical">`, full Open Graph + Twitter cards on every indexable page.
- `sitemap.xml` lists all 8 indexable pages with `<lastmod>` and `<image:image>` annotations.
- `robots.txt` points to the sitemap and explicitly allows the major AI crawlers.
- JSON-LD on every page:
  - `index.html` — `Person`, `WebSite`, `ItemList` of featured projects, `FAQPage` (7 Q&A).
  - `works.html` — `BreadcrumbList`, `CollectionPage`, `ItemList` of all 25 substantive projects with proper schema types (`MobileApplication` / `WebApplication` / `PodcastSeries` / `CreativeWork`).
  - `prints.html`, `gameboy.html` — `BreadcrumbList` + page-specific schema.
  - `chess-kombat.html`, `cert-quest.html`, `glaces-en-seine.html` — per-project landing pages with `MobileApplication` / `WebApplication` + `FAQPage`.
  - `journal.html` — `Blog` with one `BlogPosting` per entry.
  - `now.html` — `WebPage` with `dateModified`.

### AI-search SEO
- `llms.txt` — markdown index for LLM crawlers (Claude, ChatGPT, Perplexity, Gemini).
- `robots.txt` explicitly allows `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `ClaudeBot`, `anthropic-ai`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Bytespider`, `Amazonbot`, `Meta-ExternalAgent`, `cohere-ai`, `DuckAssistBot`, `YouBot`, `Diffbot`.

### Continuous freshness
- `journal.html` — dated workshop notes / build log with `Blog` JSON-LD.
- `feed.xml` — RSS, auto-discovered via `<link rel="alternate">` on every page.
- `now.html` — Sivers-style "what I'm doing right now" with `dateModified`.
- `bin/new-journal-entry.py` — one-command helper that adds an entry to journal HTML, RSS, JSON-LD, and bumps the sitemap.

### Site hygiene
- `404.html` — branded "page not found" with full nav (GitHub Pages serves it automatically).
- `humans.txt`, `.well-known/security.txt`, `CNAME`.

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

### 4. Submit RSS to feed aggregators (optional)
- https://feedly.com/i/discover — submit `https://diyfunproject.com/feed.xml`
- https://www.inoreader.com/

## How to publish a journal entry

```bash
# Interactive (opens $EDITOR for the body):
bin/new-journal-entry.py "Cert Quest hits public Play Store" --tags "Software,Cert Quest,Mobile"

# From a markdown file:
bin/new-journal-entry.py "Title here" --tags "Hardware,Arduino" --body notes.md

# From stdin:
echo "Body **here**." | bin/new-journal-entry.py "Title" --tags "Workshop" --body -
```

The script touches `journal.html` (article + JSON-LD blogPost), `feed.xml` (RSS item + lastBuildDate), and `sitemap.xml` (lastmod). Review with `git diff`, commit, push.

## How to add a new per-project page

1. Copy one of `chess-kombat.html`, `cert-quest.html`, or `glaces-en-seine.html` to `<slug>.html`.
2. Update title, description, keywords, canonical URL, OG tags, JSON-LD `MobileApplication` / `WebApplication` / `CreativeWork` block, FAQ items, body copy.
3. Add a `<url>` entry to `sitemap.xml`.
4. Add a "Read the full project page" link to the corresponding card's `data-desc` in `index.html`.
5. Add the page to `llms.txt` under "Per-project landing pages".

## Things deliberately not done

- **No analytics.** No Google Analytics / Plausible / Fathom. Add one if you want behavior data, but the site works fine without.
- **No newsletter signup.** Add a Buttondown or Substack widget on `journal.html` if you want to grow an audience email list.
- **No comments.** Out of scope for a static site; if needed, add Giscus (GitHub Discussions backend).
