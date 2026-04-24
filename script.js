// ============================================================
// Thomas Fendrich — portfolio interactions
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
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ----- Nav scroll state + progress bar --------------------
  const nav = document.getElementById('nav');
  let progressBar = null;
  if (nav) {
    progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    nav.appendChild(progressBar);
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
  if (carousel) {
    const track = document.getElementById('carousel-track');
    const slides = Array.from(track.children);
    const dotsWrap = document.getElementById('carousel-dots');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    let idx = 0;
    let timer = null;

    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Slide ' + (i + 1));
      d.addEventListener('click', () => go(i));
      dotsWrap.appendChild(d);
    });
    const dots = Array.from(dotsWrap.children);

    function go(i) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-idx * 100) + '%)';
      dots.forEach((d, j) => d.classList.toggle('active', j === idx));
      restart();
    }
    function next() { go(idx + 1); }
    function prev() { go(idx - 1); }
    function restart() {
      clearInterval(timer);
      timer = setInterval(next, 5500);
    }

    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);
    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', restart);

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });

    // Touch swipe
    let startX = 0;
    carousel.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) (dx < 0 ? next() : prev());
    });

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
    const period = parseInt(slider.dataset.interval, 10) || 2800;
    setInterval(step, period);
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

    const visibleEl = document.getElementById('visible-count');
    const updateVisible = (n) => {
      if (visibleEl) visibleEl.textContent = n + ' ' + (n === 1 ? 'work' : 'works');
    };

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
      updateVisible(visible);
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
  const modal = document.getElementById('modal');
  const backdrop = document.getElementById('modal-backdrop');
  if (!modal) return;

  const mClose = document.getElementById('modal-close');
  const mDismiss = document.getElementById('modal-dismiss');
  const mImg = document.getElementById('modal-img');
  const mHero = document.getElementById('modal-hero');
  const mTitle = document.getElementById('modal-title');
  const mTagline = document.getElementById('modal-tagline');
  const mDesc = document.getElementById('modal-desc');
  const mYear = document.getElementById('modal-year');
  const mType = document.getElementById('modal-type');
  const mViews = document.getElementById('modal-views');
  const mTech = document.getElementById('modal-tech');
  const mLink = document.getElementById('modal-link');
  const mLinkLbl = document.getElementById('modal-link-label');
  const mLinkWorks = document.getElementById('modal-link-works');

  function inferWorksHash(link) {
    if (!link) return '';
    try {
      const host = new URL(link, location.href).hostname.replace('www.', '');
      if (host.includes('cults3d')) return '#print';
      if (host.includes('hackster') || host.includes('instructables')) return '#hardware';
      if (host.includes('spotify')) return '#podcast';
      if (host.includes('github') || host.includes('vercel') || host.includes('certquests')) return '#software';
    } catch (e) {}
    return '';
  }

  function openModal(card) {
    const video = card.dataset.video;
    const img = card.dataset.img;
    // Collect gallery: explicit data-imgs wins, otherwise pull from inline slider slides
    let imgs = (card.dataset.imgs || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (imgs.length === 0) {
      const slideImgs = Array.from(card.querySelectorAll('.card-slider .slide img'))
        .map((el) => el.getAttribute('src'));
      if (slideImgs.length > 1) imgs = slideImgs;
    }
    mHero.innerHTML = '';
    mHero.classList.toggle('fit-contain', card.dataset.fit === 'contain');
    mHero.classList.remove('has-gallery');
    // Prefer a gallery when we have more than one picture (even over a video hero)
    if (imgs.length > 1) {
      // fall through to gallery branch below
    } else if (video) {
      const v = document.createElement('video');
      v.src = video;
      v.autoplay = true;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.controls = true;
      v.preload = 'metadata';
      mHero.appendChild(v);
      mHero.style.display = '';
    }
    if (imgs.length > 1) {
      mHero.classList.add('has-gallery');
      imgs.forEach((src, i) => {
        const s = document.createElement('div');
        s.className = 'modal-slide' + (i === 0 ? ' active' : '');
        const im = document.createElement('img');
        im.src = src;
        im.alt = card.dataset.title || '';
        im.loading = 'lazy';
        s.appendChild(im);
        mHero.appendChild(s);
      });
      const dots = document.createElement('div');
      dots.className = 'modal-dots';
      imgs.forEach((_, i) => {
        const d = document.createElement('button');
        d.type = 'button';
        d.className = 'modal-dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', 'Image ' + (i + 1));
        dots.appendChild(d);
      });
      const prev = document.createElement('button');
      prev.type = 'button'; prev.className = 'modal-gnav prev'; prev.setAttribute('aria-label', 'Previous'); prev.textContent = '‹';
      const next = document.createElement('button');
      next.type = 'button'; next.className = 'modal-gnav next'; next.setAttribute('aria-label', 'Next'); next.textContent = '›';
      mHero.appendChild(prev); mHero.appendChild(next); mHero.appendChild(dots);
      const slides = mHero.querySelectorAll('.modal-slide');
      const dotEls = dots.querySelectorAll('.modal-dot');
      let idx = 0;
      const go = (n) => {
        idx = (n + slides.length) % slides.length;
        slides.forEach((el, j) => el.classList.toggle('active', j === idx));
        dotEls.forEach((el, j) => el.classList.toggle('active', j === idx));
      };
      prev.addEventListener('click', (e) => { e.stopPropagation(); go(idx - 1); });
      next.addEventListener('click', (e) => { e.stopPropagation(); go(idx + 1); });
      dotEls.forEach((d, j) => d.addEventListener('click', (e) => { e.stopPropagation(); go(j); }));
      mHero.style.display = '';
    } else if (img) {
      const i = document.createElement('img');
      i.id = 'modal-img';
      i.src = img;
      i.alt = card.dataset.title || '';
      mHero.appendChild(i);
      mHero.style.display = '';
    } else {
      mHero.style.display = 'none';
    }
    mTitle.textContent = card.dataset.title || '';
    mTagline.textContent = card.dataset.tagline || '';
    mDesc.innerHTML = card.dataset.desc || '';
    mYear.textContent = card.dataset.year || '';
    mType.textContent = card.dataset.type || '';
    mViews.textContent = card.dataset.views || '';
    mTech.innerHTML = '';
    (card.dataset.tech || '').split(',').forEach((t) => {
      const v = t.trim();
      if (!v) return;
      const s = document.createElement('span');
      s.textContent = v;
      mTech.appendChild(s);
    });
    mLink.href = card.dataset.link || '#';
    mLinkLbl.textContent = card.dataset.linkLabel || 'View project';
    if (mLinkWorks) {
      const link = card.dataset.link || '';
      let isExternal = false;
      try { isExternal = !!new URL(link, location.href).host && new URL(link, location.href).host !== location.host; }
      catch (e) { isExternal = false; }
      const onWorksPage = /works\.html$/i.test(location.pathname);
      if (isExternal && !onWorksPage) {
        mLinkWorks.href = 'works.html' + inferWorksHash(link);
        mLinkWorks.style.display = '';
      } else {
        mLinkWorks.style.display = 'none';
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
    const v = mHero.querySelector('video');
    if (v) { try { v.pause(); } catch (e) {} }
  }

  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (card.tagName === 'A' && card.getAttribute('href') && !card.dataset.title) return;
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
})();
