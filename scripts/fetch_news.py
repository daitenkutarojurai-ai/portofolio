#!/usr/bin/env python3
"""
Fetch RSS feeds and write data/news.json for the static portfolio news page.
Uses only Python built-in libraries — no pip install required.
"""

import email.utils
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html.parser import HTMLParser

SOURCES = [
    {'id': 'hackaday', 'label': 'Hackaday',      'color': '#ffaa00', 'feed': 'https://hackaday.com/feed/'},
    {'id': 'adafruit', 'label': 'Adafruit',       'color': '#ff5096', 'feed': 'https://blog.adafruit.com/feed/'},
    {'id': 'arduino',  'label': 'Arduino',        'color': '#00b3b8', 'feed': 'https://blog.arduino.cc/feed/'},
    {'id': 'make',     'label': 'Make:',          'color': '#ff6464', 'feed': 'https://makezine.com/feed/'},
    {'id': 'cnx',      'label': 'CNX Software',    'color': '#2cd6a8', 'feed': 'https://www.cnx-software.com/feed/'},
    {'id': 'rpi',      'label': 'Raspberry Pi',   'color': '#ff5677', 'feed': 'https://www.raspberrypi.com/news/feed/'},
]

MAX_ITEMS = 10
EXCERPT_LEN = 220
UA = 'Mozilla/5.0 (compatible; diyfunproject-newsfetch/1.0; +https://diyfunproject.com)'


# ── HTML stripping ────────────────────────────────────────────────────────────

class _Stripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts = []
    def handle_data(self, d):
        self._parts.append(d)
    def result(self):
        return re.sub(r'\s+', ' ', ''.join(self._parts)).strip()

def strip_html(html):
    if not html:
        return ''
    s = _Stripper()
    try:
        s.feed(html)
        return s.result()
    except Exception:
        return re.sub(r'<[^>]+>', ' ', html).strip()

def truncate(text, length=EXCERPT_LEN):
    text = text.strip()
    if len(text) <= length:
        return text
    return text[:length].rsplit(' ', 1)[0] + '…'

def first_img(html):
    m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html or '', re.I)
    return m.group(1) if m else ''


# ── Date parsing ──────────────────────────────────────────────────────────────

def parse_date(raw):
    if not raw:
        return ''
    raw = raw.strip()
    try:
        t = email.utils.parsedate_to_datetime(raw)
        return t.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    except Exception:
        pass
    for fmt in ('%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S'):
        try:
            return datetime.strptime(raw[:19], fmt).strftime('%Y-%m-%dT%H:%M:%SZ')
        except Exception:
            pass
    return raw


# ── XML namespace normalisation ───────────────────────────────────────────────

def normalise_xml(raw_bytes):
    """Strip namespace prefixes so ElementTree can find tags without NS maps."""
    text = raw_bytes.decode('utf-8', errors='replace')
    text = re.sub(r'\s+xmlns(?::\w+)?="[^"]*"', '', text)     # remove declarations
    text = re.sub(r'(</?)([\w-]+):([\w-]+)', r'\1\2_\3', text) # ns:tag → ns_tag
    return text.encode('utf-8')


# ── Feed parser ───────────────────────────────────────────────────────────────

def fetch_feed(source):
    req = urllib.request.Request(source['feed'], headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        raw = r.read()

    root = ET.fromstring(normalise_xml(raw))
    channel = root.find('channel') if root.find('channel') is not None else root

    items = channel.findall('item')
    if not items:
        # Atom feeds use <entry>
        items = root.findall('entry')

    articles = []
    for item in items[:MAX_ITEMS]:
        def text(tag):
            el = item.find(tag)
            return (el.text or '').strip() if el is not None else ''

        title   = text('title')
        link    = text('link')
        pub     = text('pubDate') or text('dc_date') or text('published') or text('updated')
        desc    = text('description') or text('content_encoded') or text('content') or text('summary')

        # Thumbnail: media_content, media_thumbnail, enclosure, first <img> in desc
        thumb = ''
        for tag in ('media_content', 'media_thumbnail'):
            el = item.find(tag)
            if el is not None:
                url = el.get('url', '')
                kind = el.get('medium', '') or el.get('type', '')
                if url and ('image' in kind or not kind or
                            re.search(r'\.(jpe?g|png|webp|gif)(\?|$)', url, re.I)):
                    thumb = url
                    break
        if not thumb:
            enc = item.find('enclosure')
            if enc is not None and 'image' in (enc.get('type') or ''):
                thumb = enc.get('url', '')
        if not thumb:
            thumb = first_img(desc)

        excerpt = truncate(strip_html(desc))

        # Defense-in-depth: a hostile feed could put `javascript:` or `data:`
        # in <link>/<thumbnail>; never let those reach the DOM as href/src.
        if link and not re.match(r'^https?://', link, re.I):
            link = ''
        if thumb and not re.match(r'^https?://', thumb, re.I):
            thumb = ''

        articles.append({
            'sourceId':  source['id'],
            'label':     source['label'],
            'color':     source['color'],
            'title':     title,
            'link':      link,
            'pubDate':   parse_date(pub),
            'thumbnail': thumb,
            'excerpt':   excerpt,
        })

    return articles


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    all_articles = []
    failed = []

    for source in SOURCES:
        try:
            arts = fetch_feed(source)
            all_articles.extend(arts)
            print(f'  {source["id"]:12s} {len(arts):2d} articles')
        except Exception as exc:
            failed.append(source['id'])
            print(f'  {source["id"]:12s} FAILED — {exc}', file=sys.stderr)

    all_articles.sort(key=lambda a: a['pubDate'], reverse=True)

    out_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'news.json')

    payload = {
        'updated': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'count':   len(all_articles),
        'failed':  failed,
        'articles': all_articles,
    }
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, separators=(',', ':'))

    print(f'\nSaved {len(all_articles)} articles → data/news.json')
    if failed:
        print(f'Failed sources: {", ".join(failed)}')


if __name__ == '__main__':
    main()
