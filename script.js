// ============================================================
// diyfunproject — portfolio interactions
// Carousel · nav · reveal · filter bar (with hash) · modal
// ============================================================

(function () {
  document.body.classList.remove('no-js');

  // ----- Animated background layers (grain + ember specks) --------------
  if (!document.querySelector('.bg-grain')) {
    const grain = document.createElement('div');
    grain.className = 'bg-grain';
    document.body.appendChild(grain);
    const embers = document.createElement('div');
    embers.className = 'bg-embers';
    for (let i = 0; i < 12; i++) embers.appendChild(document.createElement('span'));
    document.body.appendChild(embers);
    const aurora = document.createElement('div');
    aurora.className = 'bg-aurora';
    document.body.appendChild(aurora);
  }
  // ----- Pull-to-refresh — native iOS feel ----------------------------
  // Touch-only. Fires on release once the pull crosses the threshold.
  // Skips engagement when the gesture starts on the nav (so the burger
  // and links remain tappable while the user is at scrollY === 0).
  (function setupPullToRefresh() {
    const ptr = document.createElement('div');
    ptr.className = 'ptr-indicator';
    ptr.innerHTML = '<span class="ptr-spinner"></span><span class="ptr-text">Pull to refresh</span>';
    document.body.appendChild(ptr);

    const FIRE_THRESH = 70;     // visual px past which release fires
    const MAX_PULL = 160;       // visual cap
    const RESISTANCE = 0.5;     // pulled px → visual px
    const PAGE_LOAD_GRACE_MS = 800;

    let startY = 0;
    let pulling = false;
    let pulled = 0;
    let cooldownUntil = performance.now() + PAGE_LOAD_GRACE_MS;
    const inCooldown = () => performance.now() < cooldownUntil;

    const setPull = (px) => {
      const clamped = Math.max(0, Math.min(MAX_PULL, px));
      ptr.style.transform = 'translate(-50%, ' + (clamped - 60) + 'px)';
      ptr.style.opacity = String(Math.min(1, clamped / FIRE_THRESH));
      ptr.classList.toggle('ready', clamped >= FIRE_THRESH);
    };
    const reset = () => {
      ptr.style.transition = 'transform 0.25s var(--ease, ease), opacity 0.25s ease';
      setPull(0);
      setTimeout(() => { ptr.style.transition = ''; }, 260);
      pulling = false;
      pulled = 0;
    };
    const fire = () => {
      cooldownUntil = performance.now() + 4000;
      ptr.classList.add('refreshing');
      ptr.querySelector('.ptr-text').textContent = 'Refreshing…';
      location.reload();
    };

    document.addEventListener('touchstart', (e) => {
      if (inCooldown()) return;
      if (e.touches.length !== 1) return;
      if (window.scrollY > 0) return;
      // Never engage when the gesture starts on the navigation —
      // otherwise a tap on the burger could be swallowed by PTR logic.
      if (e.target.closest && e.target.closest('#nav')) return;
      startY = e.touches[0].clientY;
      pulling = true;
      pulled = 0;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      if (window.scrollY > 0) { reset(); return; }
      pulled = e.touches[0].clientY - startY;
      if (pulled > 0) setPull(pulled * RESISTANCE);
      else if (pulled < 0) reset();
    }, { passive: true });

    document.addEventListener('touchend', () => {
      if (!pulling) return;
      const visual = pulled * RESISTANCE;
      pulling = false;
      if (visual >= FIRE_THRESH) fire();
      else reset();
    }, { passive: true });

    document.addEventListener('touchcancel', () => { if (pulling) reset(); }, { passive: true });
  })();

  // ----- Nav scroll state + progress bar --------------------
  const nav = document.getElementById('nav');
  let progressBar = null;
  if (nav) {
    progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    nav.appendChild(progressBar);
    // Publish the nav's measured height so sticky elements (filter-bar)
    // sit flush even when the nav links wrap onto two rows on narrow widths.
    const setNavH = () => {
      document.documentElement.style.setProperty(
        '--nav-h', nav.offsetHeight + 'px'
      );
    };
    setNavH();
    window.addEventListener('resize', setNavH, { passive: true });
  }
  const onScroll = () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 8);
    if (progressBar) {
      const h = document.documentElement;
      const max = (h.scrollHeight - h.clientHeight) || 1;
      const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      progressBar.style.transform = 'scaleX(' + (pct / 100) + ')';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ----- Mobile drawer (hamburger menu) ----------------------
  // Pairs with .nav-burger + #nav-drawer in every page's <nav>.
  // Closes on link tap, ESC, outside click, and viewport widening.
  const burger = document.getElementById('nav-burger');
  const drawer = document.getElementById('nav-drawer');
  if (burger && drawer) {
    const isOpen = () => burger.getAttribute('aria-expanded') === 'true';
    const setDrawer = (open) => {
      if (open === isOpen()) return;
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      // Order matters: clear [hidden] before adding .open so the !important
      // `[hidden]` rule never wins for a frame.
      if (open) {
        drawer.removeAttribute('hidden');
        drawer.classList.add('open');
      } else {
        drawer.classList.remove('open');
        drawer.setAttribute('hidden', '');
      }
    };
    // pointerup fires before the synthetic click and bypasses iOS's
    // "first tap stops momentum scroll" trap that ate the burger tap.
    // Suppress the trailing click so we don't toggle twice on touch.
    let suppressNextClick = false;
    burger.addEventListener('pointerup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.pointerType !== 'mouse') suppressNextClick = true;
      setDrawer(!isOpen());
    });
    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (suppressNextClick) { suppressNextClick = false; return; }
      setDrawer(!isOpen());
    });
    drawer.addEventListener('click', (e) => {
      // Close when a link inside the drawer is tapped
      if (e.target.closest('a')) setDrawer(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) {
        setDrawer(false);
        burger.focus();
      }
    });
    // Outside-click to close. Use pointerdown for snappier dismissal,
    // and ignore taps inside the nav so the drawer's own links still work.
    document.addEventListener('pointerdown', (e) => {
      if (!isOpen()) return;
      if (e.target.closest('#nav')) return;
      setDrawer(false);
    });
    const wide = window.matchMedia('(min-width: 841px)');
    wide.addEventListener('change', (m) => { if (m.matches) setDrawer(false); });
  }

  // ----- Scroll reveal --------------------------------------
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }),
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => {
    if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay);
    io.observe(el);
  });

  // Toggle each category's ember wash in/out as it enters the viewport
  const catIo = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('in-view', e.isIntersecting)),
    { threshold: 0.15 }
  );
  document.querySelectorAll('.category').forEach((el) => catIo.observe(el));

  // ----- Carousel -------------------------------------------
  const carousel = document.getElementById('carousel');
  const track = carousel && document.getElementById('carousel-track');
  if (carousel && track) {
    const slides = Array.from(track.children);
    const dotsWrap = document.getElementById('carousel-dots');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    let idx = 0;
    let timer = null;

    if (dotsWrap) {
      slides.forEach((_, i) => {
        const d = document.createElement('button');
        d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', 'Slide ' + (i + 1));
        d.addEventListener('click', () => go(i));
        dotsWrap.appendChild(d);
      });
    }
    const dots = dotsWrap ? Array.from(dotsWrap.children) : [];

    function go(i) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-idx * 100) + '%)';
      dots.forEach((d, j) => d.classList.toggle('active', j === idx));
      restart();
    }
    function next() { go(idx + 1); }
    function prev() { go(idx - 1); }
    function restart() {
      clearTimeout(timer);
      // Each slide can override its hold time via data-hold (ms).
      const hold = parseInt(slides[idx].dataset.hold, 10) || 5500;
      timer = setTimeout(next, hold);
    }

    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);
    carousel.addEventListener('mouseenter', () => clearTimeout(timer));
    carousel.addEventListener('mouseleave', restart);

    // Make the entire slide clickable: a tap anywhere goes to the slide's
    // primary link (the .btn inside the caption). Falls back to works.html.
    // We track pointerdown/up positions to distinguish clicks from swipes
    // — only fire navigation if the pointer barely moved.
    let pdX = 0, pdY = 0, pdT = 0;
    carousel.addEventListener('pointerdown', (e) => {
      pdX = e.clientX; pdY = e.clientY; pdT = performance.now();
    });
    carousel.addEventListener('pointerup', (e) => {
      // Skip if click landed on an existing interactive element — let it own.
      if (e.target.closest('a, button, .carousel-nav, .carousel-dot')) return;
      const dx = Math.abs(e.clientX - pdX);
      const dy = Math.abs(e.clientY - pdY);
      const dt = performance.now() - pdT;
      if (dx > 10 || dy > 10 || dt > 600) return; // it was a swipe / hold
      const slide = e.target.closest('.carousel-slide');
      if (!slide) return;
      const primaryLink = slide.querySelector('.carousel-caption a.btn[href]');
      const href = primaryLink ? primaryLink.getAttribute('href') : 'works.html';
      const target = primaryLink && primaryLink.getAttribute('target');
      if (target === '_blank') window.open(href, '_blank', 'noopener');
      else window.location.href = href;
    });
    // Hint that the slide is clickable
    slides.forEach((s) => { s.style.cursor = 'pointer'; });

    // Keyboard — but ignore arrows when typing or when an interactive
    // element has focus (otherwise typing in a future input would step
    // the carousel under the user).
    document.addEventListener('keydown', (e) => {
      const t = e.target;
      if (t && (t.matches('input, textarea, select, [contenteditable="true"]') ||
                t.isContentEditable)) return;
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });

    // Touch swipe — only fire when the gesture is clearly horizontal,
    // so vertical page-scrolling through the carousel never gets hijacked.
    let startX = 0, startY = 0;
    carousel.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        (dx < 0 ? next() : prev());
      }
    }, { passive: true });

    restart();
  }

  // ----- Preview sliders (multi-image cards) ----------------
  document.querySelectorAll('.card-slider').forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll('.slide'));
    if (slides.length < 2) return;
    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'slider-dots';
    slides.forEach((_, i) => {
      const s = document.createElement('span');
      if (i === 0) s.className = 'active';
      dotsWrap.appendChild(s);
    });
    slider.appendChild(dotsWrap);
    const dots = Array.from(dotsWrap.children);
    let i = 0;
    const activateVideo = (slide) => {
      const v = slide.querySelector('video');
      if (v) { try { v.currentTime = parseFloat(v.dataset.start) || 0; v.play().catch(() => {}); } catch (e) {} }
    };
    const pauseVideo = (slide) => {
      const v = slide.querySelector('video');
      if (v) { try { v.pause(); } catch (e) {} }
    };
    activateVideo(slides[0]);
    const step = () => {
      pauseVideo(slides[i]);
      slides[i].classList.remove('active');
      dots[i].classList.remove('active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('active');
      dots[i].classList.add('active');
      activateVideo(slides[i]);
    };
    const defaultPeriod = parseInt(slider.dataset.interval, 10) || 2800;
    const schedule = () => {
      // Per-slide hold (ms) overrides the default interval.
      const hold = parseInt(slides[i].dataset.hold, 10) || defaultPeriod;
      setTimeout(() => { step(); schedule(); }, hold);
    };
    schedule();
  });

  // ----- Videos with a custom start time (loop back to data-start) ---
  document.querySelectorAll('video[data-start]').forEach((v) => {
    const t = parseFloat(v.dataset.start) || 0;
    v.removeAttribute('loop');
    const seek = () => { try { v.currentTime = t; } catch (e) {} };
    v.addEventListener('loadedmetadata', () => { seek(); v.play().catch(() => {}); });
    v.addEventListener('timeupdate', () => {
      if (v.duration && v.currentTime >= v.duration - 0.08) { seek(); v.play().catch(() => {}); }
    });
    v.addEventListener('ended', () => { seek(); v.play().catch(() => {}); });
  });

  // ----- Inject external link chip on cards (non-podcast) ---
  document.querySelectorAll('.card').forEach((card) => {
    const link = card.dataset.link;
    const href = card.getAttribute('href');
    if (!link || href) return;
    const footViews = card.querySelector('.card-foot .views');
    if (!footViews) return;
    let host = '';
    try {
      host = new URL(link).hostname.replace('www.', '');
    } catch (e) { return; }
    let label = 'Link';
    if (host.includes('hackster')) label = 'Hackster';
    else if (host.includes('instructables')) label = 'Instructables';
    else if (host.includes('github')) label = 'GitHub';
    else if (host.includes('cults3d')) label = 'Cults3D';
    else label = host.split('.')[0];

    const a = document.createElement('a');
    a.className = 'card-ext';
    a.href = link;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = label + ' ↗';
    a.addEventListener('click', (e) => e.stopPropagation());
    footViews.replaceWith(a);
  });

  // ----- Category filter (works page) -----------------------
  const grid = document.getElementById('works-grid');
  const filterBar = document.getElementById('filter-bar');
  if (grid && filterBar) {
    const cards = Array.from(grid.querySelectorAll('.card'));
    const sectionHeadings = Array.from(grid.querySelectorAll('.works-section-heading'));

    const isFeatured = (c) =>
      c.dataset.cat === 'hardware' ||
      c.dataset.cat === 'software' ||
      c.dataset.cat === 'book' ||
      c.dataset.featured === 'true';
    const hasVideo = (c) => !!c.querySelector('video');

    const matchFilter = (c, filter) => {
      if (filter === 'all') return true;
      if (filter === 'featured') return isFeatured(c);
      if (filter === 'video') return hasVideo(c);
      return c.dataset.cat === filter;
    };

    const counts = {
      all: cards.length,
      featured: cards.filter(isFeatured).length,
      video: cards.filter(hasVideo).length,
      hardware: 0, software: 0, print: 0, book: 0, podcast: 0,
    };
    cards.forEach((c) => {
      const cat = c.dataset.cat;
      if (counts[cat] !== undefined) counts[cat]++;
    });
    Object.keys(counts).forEach((k) => {
      const el = document.getElementById('count-' + k);
      if (el) el.textContent = counts[k];
    });

    function applyFilter(filter) {
      filterBar.querySelectorAll('.filter-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.filter === filter);
      });
      let visible = 0;
      cards.forEach((c) => {
        if (matchFilter(c, filter)) {
          c.style.display = '';
          c.style.setProperty('--d', (visible % 8));
          c.classList.remove('in');
          requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('in')));
          visible++;
        } else {
          c.style.display = 'none';
        }
      });
      // Show a section heading only if at least one of its cards is visible.
      // "video" always hides headings (cards span multiple sections).
      const gridChildren = Array.from(grid.children);
      sectionHeadings.forEach((h, idx) => {
        if (filter === 'video') { h.classList.add('is-hidden'); return; }
        const nextHeading = sectionHeadings[idx + 1];
        const hIdx = gridChildren.indexOf(h);
        const nIdx = nextHeading ? gridChildren.indexOf(nextHeading) : gridChildren.length;
        const hasVisible = gridChildren.slice(hIdx + 1, nIdx)
          .some(el => el.classList.contains('card') && el.style.display !== 'none');
        h.classList.toggle('is-hidden', !hasVisible);
      });
    }

    const valid = ['featured', 'all', 'hardware', 'software', 'print', 'book', 'podcast', 'video'];

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      const filter = btn.dataset.filter;
      history.replaceState(null, '', filter === 'featured' ? location.pathname : '#' + filter);
      applyFilter(filter);
    });

    // Initial filter from URL hash (default: featured)
    const hash = location.hash.replace('#', '');
    const initial = valid.includes(hash) ? hash : 'featured';
    applyFilter(initial);

    // Respond to hash change (back button)
    window.addEventListener('hashchange', () => {
      const h = location.hash.replace('#', '');
      applyFilter(valid.includes(h) ? h : 'featured');
    });
  }

  // ----- Project modal --------------------------------------
  // Only present on index.html and works.html. The motion-layer code below
  // must still run on every page, so we *gate* the modal block instead of
  // early-returning out of the IIFE.
  const modal = document.getElementById('modal');
  const backdrop = document.getElementById('modal-backdrop');
  if (modal && backdrop) {

  const mClose = document.getElementById('modal-close');
  const mDismiss = document.getElementById('modal-dismiss');
  const mHero = document.getElementById('modal-hero');
  const mTitle = document.getElementById('modal-title');
  const mTagline = document.getElementById('modal-tagline');
  const mDesc = document.getElementById('modal-desc');
  const mLink = document.getElementById('modal-link');
  const mLinkLbl = document.getElementById('modal-link-label');
  const mLinkWorks = document.getElementById('modal-link-works');
  // Hide the "See all my work" CTA when we're already on the works archive.
  if (mLinkWorks && /works\.html$/i.test(location.pathname)) {
    mLinkWorks.style.display = 'none';
  }

  function openModal(card) {
    if (mHero) {
      mHero.innerHTML = '';
      // Always fill the hero box — `data-fit="contain"` is ignored here so
      // we never get empty letterbox bars in the modal preview.
      mHero.classList.remove('fit-contain');
      const video = card.dataset.video;
      const img = card.dataset.img;
      if (video) {
        const v = document.createElement('video');
        v.src = video;
        v.autoplay = true; v.muted = true; v.loop = true;
        v.playsInline = true; v.controls = true;
        v.preload = 'metadata';
        mHero.appendChild(v);
        mHero.style.display = '';
      } else if (img) {
        const i = document.createElement('img');
        i.src = img;
        i.alt = card.dataset.title || '';
        mHero.appendChild(i);
        mHero.style.display = '';
      } else {
        mHero.style.display = 'none';
      }
    }
    if (mTitle)   mTitle.textContent   = card.dataset.title   || '';
    if (mTagline) mTagline.textContent = card.dataset.tagline || '';
    if (mDesc)    mDesc.innerHTML      = card.dataset.desc    || '';
    if (mLink) {
      mLink.href = card.dataset.link || '#';
      if (mLinkLbl) {
        const link = card.dataset.link || '';
        let isExternal = false;
        try { isExternal = !!new URL(link, location.href).host && new URL(link, location.href).host !== location.host; }
        catch (e) { isExternal = false; }
        mLinkLbl.textContent = isExternal ? 'Visit project' : 'Open page';
      }
    }
    modal.classList.add('open');
    backdrop.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    backdrop.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (mHero) {
      const v = mHero.querySelector('video');
      if (v) { try { v.pause(); } catch (e) {} }
    }
  }

  // Auto-fill modal data from the card's own DOM if the card doesn't
  // already have explicit data-* attrs. Lets every card open the popup
  // instead of redirecting away.
  const autoFillCardData = (card) => {
    if (card.dataset.title) return true;
    const h3 = card.querySelector('h3');
    const desc = card.querySelector('.card-desc, p');
    const imgEl = card.querySelector('.card-media img, .card-slider img');
    const vidEl = card.querySelector('.card-media video');
    const metaTag = card.querySelector('.card-meta .tag');
    const href = card.getAttribute('href');
    if (!h3 || !(imgEl || vidEl)) return false;
    const stripOrigin = (u) => u
      ? u.replace(location.origin + '/', '').replace(location.origin, '')
      : '';
    card.dataset.title = h3.textContent.trim();
    if (desc) card.dataset.desc = '<p>' + desc.textContent.trim() + '</p>';
    if (metaTag) card.dataset.type = metaTag.textContent.trim();
    if (vidEl && vidEl.getAttribute('src')) {
      card.dataset.video = vidEl.getAttribute('src').split('#')[0];
    }
    if (imgEl && imgEl.getAttribute('src')) {
      card.dataset.img = imgEl.getAttribute('src');
    }
    const sliderImgs = card.querySelectorAll('.card-slider .slide img');
    if (sliderImgs.length > 1) {
      card.dataset.imgs = Array.from(sliderImgs)
        .map((i) => i.getAttribute('src'))
        .join(',');
    }
    if (href) {
      card.dataset.link = href;
      const label =
        href.includes('cults3d') ? 'View on Cults3D' :
        href.includes('hackster') ? 'View on Hackster' :
        href.includes('github') ? 'View on GitHub' :
        href.includes('instructables') ? 'View on Instructables' :
        href.includes('spotify') ? 'Listen on Spotify' :
        href.includes('canva') ? 'Read the book' :
        href.startsWith('works.html') ? 'See in All Works' :
        'View project';
      card.dataset.linkLabel = label;
    }
    return true;
  };

  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', (e) => {
      // Ignore clicks on internal nav buttons (card-ext link, etc.)
      if (e.target.closest('.card-ext')) return;
      // <a> cards (podcasts, books) that link externally → let browser navigate
      if (card.tagName === 'A' && card.getAttribute('href') &&
          !card.getAttribute('href').startsWith('#')) return;
      if (!card.dataset.title) autoFillCardData(card);
      if (!card.dataset.title) return;
      e.preventDefault();
      openModal(card);
    });
  });
  if (mClose) mClose.addEventListener('click', closeModal);
  if (mDismiss) mDismiss.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  } // end: if (modal && backdrop)

  // ============================================================
  // Premium motion layer
  // ============================================================
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reducedMotion) {

    // ----- Page transition curtain ------------------------------
    let curtain = document.querySelector('.page-curtain');
    if (!curtain) {
      curtain = document.createElement('div');
      curtain.className = 'page-curtain';
      const mark = document.createElement('div');
      mark.className = 'curtain-mark';
      curtain.appendChild(mark);
      document.body.appendChild(curtain);
    }

    // Slide-out on page load (curtain starts covering, slides up and away)
    const introAnim = () => {
      const a = curtain.animate(
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-100%)' }
        ],
        { duration: 650, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'forwards' }
      );
      a.onfinish = () => { curtain.classList.add('done'); };
    };
    requestAnimationFrame(introAnim);

    // NOTE: previously we intercepted every internal-link click to slide the
    // curtain in before navigating. That was bug-prone — a stuck `navigating`
    // flag (after bfcache restore) would silently preventDefault every click
    // on the page. The intro animation alone is plenty of motion; native
    // browser navigation handles the rest reliably.

    // Reset curtain visual state when restored from bfcache
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        curtain.classList.remove('active');
        curtain.classList.remove('done');
        introAnim();
      }
    });

    // ----- Card 3D tilt on hover --------------------------------
    const tiltCards = document.querySelectorAll('.card[data-title]');
    tiltCards.forEach((card) => {
      card.classList.add('tilt-ready');
      let raf = null;
      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rx = (y - 0.5) * -6;
        const ry = (x - 0.5) * 6;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
        });
      };
      const onEnter = () => card.classList.add('tilting');
      const onLeave = () => {
        card.classList.remove('tilting');
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = '';
      };
      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });

    // ----- Magnetic buttons -------------------------------------
    const mags = document.querySelectorAll('.btn, .btn-primary, .category-link');
    mags.forEach((el) => {
      el.classList.add('magnetic');
      const strength = 0.22;
      const range = 60;
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        const d = Math.min(range, Math.hypot(x, y)) / range;
        el.style.transform = `translate(${x * strength * d}px, ${y * strength * d}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    // ----- Animated section dividers ----------------------------
    // Auto-insert dividers between top-level .category sections and before footer-like sections
    const categories = Array.from(document.querySelectorAll('section.category'));
    categories.forEach((sec, i) => {
      if (i === 0) return;
      const div = document.createElement('div');
      div.className = 'section-divider reveal';
      const wrap = document.createElement('div');
      wrap.className = 'wrap';
      wrap.appendChild(div);
      sec.parentNode.insertBefore(wrap, sec);
      io.observe(div);
    });
    document.querySelectorAll('.section-divider').forEach((d) => io.observe(d));

    // ----- Character reveal on primary hero heading -------------
    const heroHeading = document.querySelector('.intro h1');
    if (heroHeading && !heroHeading.dataset.split) {
      heroHeading.dataset.split = '1';
      const walker = document.createTreeWalker(heroHeading, NodeFilter.SHOW_TEXT);
      const texts = [];
      let n;
      while ((n = walker.nextNode())) texts.push(n);
      let idx = 0;
      texts.forEach((t) => {
        const frag = document.createDocumentFragment();
        const wrap = document.createElement('span');
        wrap.className = 'char-reveal';
        t.textContent.split('').forEach((ch) => {
          const s = document.createElement('span');
          s.className = 'char';
          s.style.setProperty('--i', idx++);
          s.textContent = ch === ' ' ? ' ' : ch;
          wrap.appendChild(s);
        });
        frag.appendChild(wrap);
        t.replaceWith(frag);
      });
      // Trigger reveal shortly after mount
      const charWraps = heroHeading.querySelectorAll('.char-reveal');
      const charIo = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); charIo.unobserve(e.target); }
        });
      }, { threshold: 0.2 });
      charWraps.forEach((w) => charIo.observe(w));
    }

    // ----- Page intro fade once the DOM is ready ----------------
    document.body.classList.add('page-intro-fade');
  }

})();

// ============================================================
// FX layer — spotlight, magnetic tilt + sheen, click ripple,
// konami matrix rain. Idempotent + reduced-motion aware.
// ============================================================
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;

  // ----- A. Cursor spotlight follower --------------------------
  if (!reduced && !touch) {
    const sp = document.createElement('div');
    sp.className = 'fx-spotlight';
    document.body.appendChild(sp);
    let mouseRaf = 0;
    let mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!mouseRaf) {
        mouseRaf = requestAnimationFrame(() => {
          sp.style.setProperty('--mx', mx + 'px');
          sp.style.setProperty('--my', my + 'px');
          mouseRaf = 0;
        });
      }
      if (!document.body.classList.contains('fx-mouse-active')) {
        document.body.classList.add('fx-mouse-active');
      }
    }, { passive: true });
    document.addEventListener('mouseleave', () => {
      document.body.classList.remove('fx-mouse-active');
    });
  }

  // ----- B. Holographic sheen on cards (rides on existing 3D tilt) ----
  if (!reduced && !touch) {
    document.querySelectorAll('.card').forEach((card) => {
      if (card.closest('.modal')) return;
      if (card.querySelector(':scope > .fx-sheen')) return; // idempotent
      const sheen = document.createElement('div');
      sheen.className = 'fx-sheen';
      card.appendChild(sheen);
      let sheenRaf = 0;
      let lx = 0, ly = 0;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        lx = (e.clientX - r.left) / (r.width || 1);
        ly = (e.clientY - r.top) / (r.height || 1);
        if (!sheenRaf) {
          sheenRaf = requestAnimationFrame(() => {
            sheen.style.setProperty('--sx', (lx * 100).toFixed(1) + '%');
            sheen.style.setProperty('--sy', (ly * 100).toFixed(1) + '%');
            sheenRaf = 0;
          });
        }
      });
    });
  }

  // ----- C. Click ripple on buttons & cards -------------------
  function spawnRipple(host, x, y) {
    if (reduced) return;
    const cs = getComputedStyle(host);
    if (cs.position === 'static') host.style.position = 'relative';
    host.classList.add('fx-ripple-host');
    const r = host.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'fx-ripple';
    dot.style.left = (x - r.left) + 'px';
    dot.style.top = (y - r.top) + 'px';
    host.appendChild(dot);
    setTimeout(() => dot.remove(), 600);
  }
  document.addEventListener('click', (e) => {
    // Avoid double-rippling: pick the innermost matching host
    const host = e.target.closest('.btn, .card, .carousel-nav, .filter-btn, .sc-icon-wrap, .chip');
    if (!host) return;
    spawnRipple(host, e.clientX, e.clientY);
  }, true);

  // ----- D. Eyebrow text scramble on reveal -------------------
  if (!reduced) {
    const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*^?#__01';
    const scramble = (el, targetText) => {
      const total = targetText.length;
      const FRAMES = Math.min(24, Math.max(12, Math.floor(total * 1.4)));
      let frame = 0;
      const tick = () => {
        frame++;
        const progress = frame / FRAMES;
        let out = '';
        for (let i = 0; i < total; i++) {
          const reveal = (i / total) <= progress;
          out += reveal
            ? targetText[i]
            : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
        el.textContent = out;
        if (frame < FRAMES) requestAnimationFrame(tick);
        else el.textContent = targetText;
      };
      tick();
    };
    let stagger = 0;
    const ebIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting || e.target.dataset.scrambled) return;
        const target = e.target;
        target.dataset.scrambled = '1';
        const text = (target.textContent || '').trim();
        if (!text || text.length > 80 || target.querySelector('*')) {
          ebIo.unobserve(target);
          return;
        }
        const delay = stagger;
        stagger += 80;
        setTimeout(() => scramble(target, text), delay);
        // reset stagger after a quiet beat so later sections don't pile up
        clearTimeout(window.__ebReset);
        window.__ebReset = setTimeout(() => { stagger = 0; }, 900);
        ebIo.unobserve(target);
      });
    }, { threshold: 0.55 });
    document.querySelectorAll('.eyebrow').forEach((el) => ebIo.observe(el));
  }

  // ----- E. Konami → Matrix rain ------------------------------
  const SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let seqIdx = 0;
  let matrixOpen = false;
  window.addEventListener('keydown', (e) => {
    const want = SEQ[seqIdx];
    const got = (e.key && e.key.length === 1) ? e.key.toLowerCase() : e.key;
    const wantNorm = (want.length === 1) ? want.toLowerCase() : want;
    if (got === wantNorm) {
      seqIdx++;
      if (seqIdx === SEQ.length) {
        seqIdx = 0;
        if (!matrixOpen) openMatrix();
      }
    } else {
      // allow restart from a partial match if the new key matches SEQ[0]
      seqIdx = (got === SEQ[0].toLowerCase() || got === SEQ[0]) ? 1 : 0;
    }
  });

  function openMatrix() {
    matrixOpen = true;
    const wrap = document.createElement('div');
    wrap.className = 'fx-matrix';
    const cv = document.createElement('canvas');
    wrap.appendChild(cv);
    document.body.appendChild(wrap);
    const badge = document.createElement('div');
    badge.className = 'fx-matrix-badge';
    badge.textContent = '// signal acquired — click to dismiss';
    document.body.appendChild(badge);
    requestAnimationFrame(() => wrap.classList.add('in'));

    const ctx = cv.getContext('2d');
    let w = cv.width = window.innerWidth;
    let h = cv.height = window.innerHeight;
    const FONT = 16;
    let cols = Math.floor(w / FONT);
    let drops = new Array(cols).fill(0).map(() => Math.random() * -50);
    const chars = '01░▒▓<>/?[]{}#$%&*+-=ABCDEFαβΣΨ⌬⎔';
    let raf, alive = true;

    const onResize = () => {
      w = cv.width = window.innerWidth;
      h = cv.height = window.innerHeight;
      cols = Math.floor(w / FONT);
      drops = new Array(cols).fill(0).map(() => Math.random() * -50);
    };
    window.addEventListener('resize', onResize);

    const tick = () => {
      if (!alive) return;
      ctx.fillStyle = 'rgba(6, 7, 13, 0.12)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = FONT + 'px ui-monospace, "JetBrains Mono", monospace';
      for (let c = 0; c < cols; c++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const y = drops[c] * FONT;
        ctx.fillStyle = (c % 9 === 0) ? '#ff2e88' : '#00e5ff';
        ctx.fillText(ch, c * FONT, y);
        if (y > h && Math.random() > 0.975) drops[c] = 0;
        drops[c] += 1;
      }
      raf = requestAnimationFrame(tick);
    };
    if (!reduced) tick();
    else { ctx.fillStyle = '#06070d'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#00e5ff'; ctx.font = '24px monospace'; ctx.fillText('// reduced motion — animation disabled', 30, 60); }

    const close = () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', escClose);
      wrap.classList.remove('in');
      badge.remove();
      setTimeout(() => { wrap.remove(); matrixOpen = false; }, 400);
    };
    const escClose = (e) => { if (e.key === 'Escape') close(); };
    setTimeout(() => { if (matrixOpen) close(); }, 7500);
    wrap.addEventListener('click', close);
    window.addEventListener('keydown', escClose);
  }
})();
