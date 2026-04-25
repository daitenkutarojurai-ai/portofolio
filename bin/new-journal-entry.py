#!/usr/bin/env python3
"""
Add a new journal entry to journal.html, feed.xml, and bump sitemap.xml lastmod.

Usage:
    bin/new-journal-entry.py "Title here" --tags "Hardware,Arduino" --body body.md
    bin/new-journal-entry.py "Title here" --tags "Hardware" --body -      # body from stdin

If --body is omitted, opens $EDITOR for the body.

Run from the repo root.
"""
from __future__ import annotations
import argparse, datetime, html, os, re, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JOURNAL = ROOT / "journal.html"
FEED = ROOT / "feed.xml"
SITEMAP = ROOT / "sitemap.xml"


def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:60]


def get_body(arg: str | None) -> str:
    if arg is None:
        editor = os.environ.get("EDITOR", "vi")
        with tempfile.NamedTemporaryFile("w+", suffix=".md", delete=False) as f:
            f.write("# Write the journal body here. Markdown-ish — paragraphs separated by blank lines.\n# Lines starting with # will be removed.\n\n")
            tmp = f.name
        subprocess.call([editor, tmp])
        body = Path(tmp).read_text()
        os.unlink(tmp)
        body = "\n".join(l for l in body.splitlines() if not l.lstrip().startswith("#"))
    elif arg == "-":
        body = sys.stdin.read()
    else:
        body = Path(arg).read_text()
    return body.strip()


def md_to_html(body: str) -> str:
    """Tiny markdown subset: paragraphs, **bold**, [link](url), `code`, lists."""
    out_blocks = []
    for block in re.split(r"\n\s*\n", body.strip()):
        block = block.rstrip()
        lines = block.splitlines()
        if all(l.lstrip().startswith(("- ", "* ")) for l in lines):
            items = "".join(f"<li>{inline(l.lstrip()[2:])}</li>" for l in lines)
            out_blocks.append(f"<ul>{items}</ul>")
        else:
            out_blocks.append(f"<p>{inline(block)}</p>")
    return "\n            ".join(out_blocks)


def inline(s: str) -> str:
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', s)
    return s


def insert_into(path: Path, marker: str, snippet: str, where: str = "after"):
    text = path.read_text()
    if marker not in text:
        print(f"  ! marker not found in {path.name}: {marker!r}", file=sys.stderr)
        sys.exit(1)
    if where == "after":
        new = text.replace(marker, marker + snippet, 1)
    else:
        new = text.replace(marker, snippet + marker, 1)
    path.write_text(new)


def main():
    ap = argparse.ArgumentParser(description="Add a new journal entry")
    ap.add_argument("title", help="Entry title")
    ap.add_argument("--tags", default="Workshop", help="Comma-separated tags")
    ap.add_argument("--body", default=None, help="Path to a markdown file, or '-' for stdin. Omit for $EDITOR.")
    ap.add_argument("--date", default=None, help="ISO date (default: today)")
    args = ap.parse_args()

    today = args.date or datetime.date.today().isoformat()
    slug = f"{today}-{slugify(args.title)}"
    tags = [t.strip() for t in args.tags.split(",") if t.strip()]
    body_md = get_body(args.body)
    body_html = md_to_html(body_md)
    body_text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", body_html))[:280]

    base = "https://diyfunproject.com"
    entry_url = f"{base}/journal.html#{slug}"
    pretty_date = today.replace("-", " · ")

    # 1) journal.html — insert article block + JSON-LD blogPost entry
    article = f'''
        <article class="journal-entry reveal" id="{slug}">
          <header>
            <time datetime="{today}">{pretty_date}</time>
            <h2>{html.escape(args.title)}</h2>
            <div class="tags">{"".join(f"<span>{html.escape(t)}</span>" for t in tags)}</div>
          </header>
          <div class="body">
            {body_html}
          </div>
        </article>
'''
    insert_into(JOURNAL, '<div class="journal-list">', article, where="after")

    # JSON-LD blogPost — insert as first element in array
    jsonld_post = (
        '\n    {\n'
        '      "@type": "BlogPosting",\n'
        f'      "headline": {repr_json(args.title)},\n'
        f'      "datePublished": "{today}",\n'
        f'      "url": "{entry_url}",\n'
        '      "author": {"@type": "Person", "name": "diyfunproject"},\n'
        f'      "keywords": {repr_json(", ".join(tags))}\n'
        '    },'
    )
    insert_into(JOURNAL, '"blogPost": [', jsonld_post, where="after")

    # 2) feed.xml — insert <item> after <image>...</image>
    rss_date = datetime.datetime.fromisoformat(today).strftime("%a, %d %b %Y 12:00:00 +0000")
    rss_item = f'''
    <item>
      <title>{html.escape(args.title)}</title>
      <link>{entry_url}</link>
      <guid isPermaLink="true">{entry_url}</guid>
      <pubDate>{rss_date}</pubDate>
      <dc:creator>diyfunproject</dc:creator>
{"".join(f"      <category>{html.escape(t)}</category>{chr(10)}" for t in tags)}      <description><![CDATA[{body_text}]]></description>
    </item>
'''
    insert_into(FEED, '</image>', rss_item, where="after")

    # bump <lastBuildDate>
    feed_text = FEED.read_text()
    feed_text = re.sub(
        r"<lastBuildDate>[^<]+</lastBuildDate>",
        f"<lastBuildDate>{rss_date}</lastBuildDate>",
        feed_text, count=1
    )
    FEED.write_text(feed_text)

    # 3) sitemap.xml — bump lastmod for index, works, journal
    sitemap_text = SITEMAP.read_text()
    sitemap_text = re.sub(r"<lastmod>\d{4}-\d{2}-\d{2}</lastmod>", f"<lastmod>{today}</lastmod>", sitemap_text)
    SITEMAP.write_text(sitemap_text)

    print(f"✓ Added entry: {args.title}")
    print(f"  slug:    {slug}")
    print(f"  tags:    {', '.join(tags)}")
    print(f"  url:     {entry_url}")
    print()
    print("Updated:")
    print(f"  - {JOURNAL.relative_to(ROOT)}  (article + JSON-LD)")
    print(f"  - {FEED.relative_to(ROOT)}      (RSS item + lastBuildDate)")
    print(f"  - {SITEMAP.relative_to(ROOT)}   (lastmod bumped)")
    print()
    print("Now: review with 'git diff', then commit & push.")


def repr_json(s: str) -> str:
    """Return a JSON string literal (with quotes), safely escaped."""
    import json
    return json.dumps(s, ensure_ascii=False)


if __name__ == "__main__":
    main()
